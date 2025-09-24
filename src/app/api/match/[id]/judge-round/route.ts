import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, rounds } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { judgeRound } from '@/lib/gemini-client';
import { pinJSON } from '@/lib/pinata';

const schema = z.object({
  idx: z.number().int().min(0).max(2)
});

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const matchId = parseInt(params.id);
    if (isNaN(matchId)) {
      return NextResponse.json({ ok: false, error: 'Invalid match ID' }, { status: 400 });
    }
    const body = await request.json();
    const validation = schema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ ok: false, error: 'Invalid input' }, { status: 400 });
    }
    const { idx } = validation.data;

    const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!match) {
      return NextResponse.json({ ok: false, error: 'Match not found' }, { status: 404 });
    }

    const [round] = await db.select().from(rounds).where(and(eq(rounds.matchId, matchId), eq(rounds.idx, idx)));
    if (!round || !round.answerA || !round.answerB) {
      return NextResponse.json({ ok: false, error: 'Round responses not ready' }, { status: 400 });
    }

    const mode = match.mode as 'roast' | 'writing' | 'duel';
    const { scores, rationale } = await judgeRound(round.answerA, round.answerB, mode, idx);

    // Pin scores to IPFS
    let scoresIpfsCid: string | null = null;
    try {
      const pinRes = await pinJSON({
        matchId,
        round: idx,
        mode,
        scores,
        rationale,
        timestamp: Date.now()
      }, { name: `match-${matchId}-round-${idx}-scores` });
      scoresIpfsCid = pinRes.IpfsHash;
    } catch (e) {
      console.error('IPFS pin failed for scores:', e);
    }

    await db.update(rounds).set({
      judgeScores: JSON.stringify(scores),
      resultSummary: rationale,
      ipfsCid: scoresIpfsCid || round.ipfsCid // Keep responses CID if new fails
    }).where(eq(rounds.id, round.id));

    return NextResponse.json({ ok: true, data: { scores, rationale } });
  } catch (error) {
    console.error('Judge round error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to judge round' }, { status: 500 });
  }
}