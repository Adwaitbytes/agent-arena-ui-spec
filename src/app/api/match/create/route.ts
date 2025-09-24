import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, matchPlayers, agents } from '@/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

const createMatchSchema = z.object({
  mode: z.enum(['roast', 'writing', 'duel']),
  agentIds: z.array(z.number()).min(1).max(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createMatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { mode, agentIds } = validation.data;

    // Verify all agents exist
    const existingAgents = await db
      .select()
      .from(agents)
      .where(inArray(agents.id, agentIds));

    if (existingAgents.length !== agentIds.length) {
      const foundIds = existingAgents.map(a => a.id);
      const missingIds = agentIds.filter(id => !foundIds.includes(id));
      return NextResponse.json(
        { ok: false, error: `Agent IDs not found: ${missingIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Create match
    const [newMatch] = await db.insert(matches).values({
      mode,
      status: 'lobby',
      startedAt: null,
      endedAt: null,
      vrfProof: null,
      intentsTx: null,
      shadeAgentId: null,
      createdAt: Date.now(),
    }).returning();

    // Create match players
    const matchPlayerData = agentIds.map((agentId, index) => {
      const agent = existingAgents.find(a => a.id === agentId);
      return {
        matchId: newMatch.id,
        agentId,
        userId: agent?.ownerUserId || null,
        seat: index,
        createdAt: Date.now(),
      };
    });

    await db.insert(matchPlayers).values(matchPlayerData);

    return NextResponse.json(
      { ok: true, data: { matchId: newMatch.id } },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/match/create error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}