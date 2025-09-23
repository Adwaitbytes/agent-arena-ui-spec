import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, agents } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const { userAgentId, mode, opponentId } = await request.json();

    // Validate required fields
    if (!userAgentId || typeof userAgentId !== 'number') {
      return NextResponse.json({ 
        ok: false,
        error: "userAgentId is required and must be a number",
        code: "MISSING_USER_AGENT_ID" 
      }, { status: 400 });
    }

    if (!mode) {
      return NextResponse.json({ 
        ok: false,
        error: "mode is required",
        code: "MISSING_MODE" 
      }, { status: 400 });
    }

    // Validate mode enum
    const validModes = ['roast', 'writing', 'duel'];
    if (!validModes.includes(mode)) {
      return NextResponse.json({ 
        ok: false,
        error: "mode must be one of: roast, writing, duel",
        code: "INVALID_MODE" 
      }, { status: 400 });
    }

    // Validate userAgentId exists
    const userAgent = await db.select()
      .from(agents)
      .where(eq(agents.id, userAgentId))
      .limit(1);

    if (userAgent.length === 0) {
      return NextResponse.json({ 
        ok: false,
        error: "User agent not found",
        code: "USER_AGENT_NOT_FOUND" 
      }, { status: 404 });
    }

    let finalOpponentId = opponentId;

    // If opponentId provided, validate it exists
    if (opponentId) {
      if (typeof opponentId !== 'number') {
        return NextResponse.json({ 
          ok: false,
          error: "opponentId must be a number",
          code: "INVALID_OPPONENT_ID" 
        }, { status: 400 });
      }

      const opponentAgent = await db.select()
        .from(agents)
        .where(eq(agents.id, opponentId))
        .limit(1);

      if (opponentAgent.length === 0) {
        return NextResponse.json({ 
          ok: false,
          error: "Opponent agent not found",
          code: "OPPONENT_AGENT_NOT_FOUND" 
        }, { status: 404 });
      }
    } else {
      // CPU opponent logic: select a random public agent
      const publicAgents = await db.select()
        .from(agents)
        .where(eq(agents.isPublic, true))
        .limit(10);

      if (publicAgents.length > 0) {
        // Select random public agent
        const randomIndex = Math.floor(Math.random() * publicAgents.length);
        finalOpponentId = publicAgents[randomIndex].id;
      } else {
        // Create a basic CPU agent if no public agents available
        const cpuAgent = await db.insert(agents)
          .values({
            userId: 'system',
            name: 'CPU Agent',
            persona: 'A competitive AI opponent',
            prompt: 'You are a skilled AI opponent ready to compete in various challenges.',
            isPublic: true,
            wins: 0,
            losses: 0,
            createdAt: Date.now()
          })
          .returning();

        finalOpponentId = cpuAgent[0].id;
      }
    }

    // Create the match
    const now = Date.now();
    const newMatch = await db.insert(matches)
      .values({
        mode,
        status: 'lobby',
        agentAId: userAgentId,
        agentBId: finalOpponentId,
        roundsData: JSON.stringify([]),
        totalScores: JSON.stringify({}),
        createdAt: now
      })
      .returning();

    const createdMatch = newMatch[0];

    return NextResponse.json({
      ok: true,
      data: {
        matchId: createdMatch.id,
        match: createdMatch
      }
    }, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      ok: false,
      error: 'Internal server error: ' + error 
    }, { status: 500 });
  }
}