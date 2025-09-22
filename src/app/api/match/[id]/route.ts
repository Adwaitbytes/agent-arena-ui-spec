import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, matchPlayers, rounds, agents } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid match ID' },
        { status: 400 }
      );
    }

    // Get match
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    
    if (!match) {
      return NextResponse.json(
        { ok: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    // Get players with agent details
    const players = await db
      .select({
        id: matchPlayers.id,
        matchId: matchPlayers.matchId,
        agentId: matchPlayers.agentId,
        userId: matchPlayers.userId,
        seat: matchPlayers.seat,
        createdAt: matchPlayers.createdAt,
        agent: {
          id: agents.id,
          name: agents.name,
          promptProfile: agents.promptProfile,
        },
      })
      .from(matchPlayers)
      .leftJoin(agents, eq(matchPlayers.agentId, agents.id))
      .where(eq(matchPlayers.matchId, id));

    // Get rounds
    const matchRounds = await db
      .select()
      .from(rounds)
      .where(eq(rounds.matchId, id))
      .orderBy(asc(rounds.idx));

    return NextResponse.json({
      ok: true,
      data: {
        match,
        players,
        rounds: matchRounds,
      },
    });
  } catch (error) {
    console.error('GET /api/match/[id] error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}