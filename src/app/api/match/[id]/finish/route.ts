import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, matchPlayers, rounds, agents } from '@/db/schema';
import { and, eq, sum, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { getGolemClient, createMatchEntity } from '@/lib/golem-client';
import { pinMatchData, getMatchViaCID } from '@/lib/ipfs';
import { signIntent } from '@/lib/near-wallet'; // Assume wallet context passed or global

const finishMatchSchema = z.object({
  summary: z.string().optional(),
  vrfProof: z.string().optional(),
  intentsTx: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = parseInt(params.id);
    if (isNaN(matchId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid match ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = finishMatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      );
    }

    // Check if match exists and current status
    const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!match) {
      return NextResponse.json(
        { ok: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    if (match.status === 'finished' || match.status === 'completed') {
      return NextResponse.json(
        { ok: false, error: 'Match already finished' },
        { status: 400 }
      );
    }

    const { vrfProof, intentsTx, summary } = validation.data;

    // Get all rounds for this match to compute total scores
    const matchRounds = await db
      .select()
      .from(rounds)
      .where(eq(rounds.matchId, matchId));

    // Compute total scores from rounds judgeScores JSON
    let totalScoreA = 0;
    let totalScoreB = 0;

    matchRounds.forEach(round => {
      if (round.judgeScores) {
        const scores = round.judgeScores as any;
        if (scores.scoreA !== undefined) totalScoreA += scores.scoreA;
        if (scores.scoreB !== undefined) totalScoreB += scores.scoreB;
        if (scores.aScore !== undefined) totalScoreA += scores.aScore;
        if (scores.bScore !== undefined) totalScoreB += scores.bScore;
      }
    });

    // Determine winner based on scores
    let winner: string;
    if (totalScoreA > totalScoreB) {
      winner = 'a';
    } else if (totalScoreB > totalScoreA) {
      winner = 'b';
    } else {
      winner = 'tie';
    }

    // Get match players to determine agentAId and agentBId
    const players = await db
      .select()
      .from(matchPlayers)
      .where(eq(matchPlayers.matchId, matchId));

    let agentAId = null;
    let agentBId = null;

    if (players.length >= 2) {
      // Sort by seat to ensure consistent A/B assignment
      players.sort((a, b) => a.seat - b.seat);
      agentAId = players[0].agentId;
      agentBId = players[1].agentId;
    }

    // Update match with computed results
    const [updatedMatch] = await db
      .update(matches)
      .set({
        status: 'completed',
        endedAt: Date.now(),
        winner,
        scoreA: totalScoreA,
        scoreB: totalScoreB,
        agentAId,
        agentBId,
        summary: summary || null,
        vrfProof: vrfProof || null,
        intentsTx: intentsTx || null,
      })
      .where(eq(matches.id, matchId))
      .returning();

    // Create player links if missing (for backwards compatibility)
    if (players.length === 0 && agentAId && agentBId) {
      await db.insert(matchPlayers).values([
        {
          matchId,
          agentId: agentAId,
          userId: null,
          seat: 0,
          createdAt: Date.now(),
        },
        {
          matchId,
          agentId: agentBId,
          userId: null,
          seat: 1,
          createdAt: Date.now(),
        },
      ]);
    }

    // Get agent details for Golem integration
    const agentDetails = await db
      .select()
      .from(agents)
      .where(inArray(agents.id, [agentAId, agentBId].filter(Boolean) as number[]));

    const agentA = agentDetails.find(a => a.id === agentAId);
    const agentB = agentDetails.find(a => a.id === agentBId);

    // Integrate with existing Golem storage
    try {
      const golemData = {
        id: updatedMatch.id,
        mode: updatedMatch.mode,
        agents: [
          { id: agentAId, name: agentA?.name || 'Agent A' },
          { id: agentBId, name: agentB?.name || 'Agent B' }
        ],
        winner: winner === 'tie' ? -1 : (winner === 'a' ? 0 : 1),
        scores: { a: totalScoreA, b: totalScoreB },
        summary: summary || 'Match completed',
        createdAt: updatedMatch.createdAt,
        endedAt: updatedMatch.endedAt,
      };
      
      const golemResult = await createMatchEntity(golemData);
      console.log('Golem entity created:', golemResult);
      
      // Update local with Golem tx if successful (optional field extension)
      if (golemResult?.txHash) {
        await db
          .update(matches)
          .set({ intentsTx: golemResult.txHash })
          .where(eq(matches.id, matchId));
      }
    } catch (golemError) {
      console.error('Golem integration failed (non-fatal):', golemError);
      // Continue; local save succeeds even if Golem fails
    }

    // Pin to IPFS
    const matchData = {
      id: matchId,
      mode: updatedMatch.mode,
      agents: { a: agentA, b: agentB },
      rounds: matchRounds,
      scores: { totalA: totalScoreA, totalB: totalScoreB },
      winner,
      summary,
      timestamp: Date.now(),
    };

    const ipfsCid = await pinMatchData(matchData);

    // Sign NEAR intent (simplified; in prod, use signed tx from user)
    const nearTxHash = await signIntent({ type: 'battle', matchId, ipfsCid });

    // Update match
    await db.update(matches).set({
      status: 'completed',
      winner,
      scoreA: totalScoreA,
      scoreB: totalScoreB,
      agentAId,
      agentBId,
      summary,
      ipfsCid,
      nearTxHash,
    }).where(eq(matches.id, matchId));

    return NextResponse.json({
      ok: true,
      data: { 
        match: updatedMatch,
        scores: { scoreA: totalScoreA, scoreB: totalScoreB },
        winner,
        ipfsCid,
        nearTxHash,
        viewLink: getMatchViaCID(ipfsCid)
      },
    });
  } catch (error) {
    console.error('POST /api/match/[id]/finish error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}