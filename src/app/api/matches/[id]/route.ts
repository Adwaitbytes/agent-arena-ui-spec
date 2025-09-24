import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, matchPlayers, rounds, agents } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';
// @ts-ignore
import { PinataSDK } from '@pinata/sdk';

// Initialize Pinata client for IPFS data retrieval
const pinata = new PinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY!,
  pinataSecretApiKey: process.env.PINATA_SECRET_KEY!,
  pinataGateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'
});

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

    // Get match with enhanced schema
    const [match] = await db.select().from(matches).where(eq(matches.id, id));
    
    if (!match) {
      return NextResponse.json(
        { ok: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    // Get agent A and B details
    let agentA = null;
    let agentB = null;
    
    if (match.agentAId) {
      const [agentAResult] = await db.select().from(agents).where(eq(agents.id, match.agentAId));
      agentA = agentAResult;
    }
    
    if (match.agentBId) {
      const [agentBResult] = await db.select().from(agents).where(eq(agents.id, match.agentBId));
      agentB = agentBResult;
    }

    // Get players with agent details (for backward compatibility)
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
          persona: agents.persona,
          prompts: agents.prompts,
        },
      })
      .from(matchPlayers)
      .leftJoin(agents, eq(matchPlayers.agentId, agents.id))
      .where(eq(matchPlayers.matchId, id));

    // Get rounds (for backward compatibility)
    const matchRounds = await db
      .select()
      .from(rounds)
      .where(eq(rounds.matchId, id))
      .orderBy(asc(rounds.idx));

    // Try to fetch IPFS data if CID exists
    let ipfsData = null;
    if (match.ipfsCid && process.env.PINATA_API_KEY) {
      try {
        // Note: This is a placeholder for IPFS data retrieval
        // In practice, you'd fetch from IPFS gateway using the CID
        const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${match.ipfsCid}`;
        const ipfsResponse = await fetch(ipfsUrl);
        if (ipfsResponse.ok) {
          ipfsData = await ipfsResponse.json();
        }
      } catch (error) {
        console.warn('Failed to fetch IPFS data for match', id, error);
      }
    }

    return NextResponse.json({
      ok: true,
      data: {
        match,
        agentA,
        agentB,
        players, // For backward compatibility
        rounds: matchRounds, // For backward compatibility
        ipfsData, // Enhanced IPFS data if available
      },
    });
  } catch (error) {
    console.error('GET /api/matches/[id] error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}