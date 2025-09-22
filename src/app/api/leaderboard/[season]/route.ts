import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { leaderboard, agents } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { season: string } }
) {
  try {
    const seasonId = parseInt(params.season);
    if (isNaN(seasonId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid season ID' },
        { status: 400 }
      );
    }

    // Get top 100 leaderboard entries with agent details
    const leaderboardData = await db
      .select({
        id: leaderboard.id,
        agentId: leaderboard.agentId,
        seasonId: leaderboard.seasonId,
        mmr: leaderboard.mmr,
        wins: leaderboard.wins,
        losses: leaderboard.losses,
        updatedAt: leaderboard.updatedAt,
        agent: {
          id: agents.id,
          name: agents.name,
          promptProfile: agents.promptProfile,
        },
      })
      .from(leaderboard)
      .leftJoin(agents, eq(leaderboard.agentId, agents.id))
      .where(eq(leaderboard.seasonId, seasonId))
      .orderBy(desc(leaderboard.mmr), desc(leaderboard.wins))
      .limit(100);

    // Add rank to each entry
    const leaderboardWithRanks = leaderboardData.map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

    return NextResponse.json({
      ok: true,
      data: {
        season: seasonId,
        leaderboard: leaderboardWithRanks,
      },
    });
  } catch (error) {
    console.error('GET /api/leaderboard/[season] error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}