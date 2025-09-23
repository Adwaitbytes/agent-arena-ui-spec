import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, agents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
// @ts-ignore
import { PinataSDK } from '@pinata/sdk';

// Initialize Pinata client
const pinata = new PinataSDK({
  pinataApiKey: process.env.PINATA_API_KEY!,
  pinataSecretApiKey: process.env.PINATA_SECRET_KEY!,
  pinataGateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'
});

interface RoundData {
  round: number;
  scores: {
    user: {
      style: number;
      creativity: number;
      technicality: number;
      humor?: number;
      relevance?: number;
    };
    opp: {
      style: number;
      creativity: number;
      technicality: number;
      humor?: number;
      relevance?: number;
    };
  };
}

interface TotalScores {
  user: number;
  opp: number;
}

interface IpfsPayload {
  match_id: number;
  mode: string;
  agents: {
    user: any;
    opp: any;
  };
  rounds_data: RoundData[];
  total_scores: TotalScores;
  winner: string;
  timestamp: number;
}

function calculateTotalScores(roundsData: RoundData[]): TotalScores {
  const totals = { user: 0, opp: 0 };
  
  for (const round of roundsData) {
    const userScores = round.scores.user;
    const oppScores = round.scores.opp;
    
    // Sum all criteria scores for user
    totals.user += userScores.style + userScores.creativity + userScores.technicality;
    if (userScores.humor) totals.user += userScores.humor;
    if (userScores.relevance) totals.user += userScores.relevance;
    
    // Sum all criteria scores for opp
    totals.opp += oppScores.style + oppScores.creativity + oppScores.technicality;
    if (oppScores.humor) totals.opp += oppScores.humor;
    if (oppScores.relevance) totals.opp += oppScores.relevance;
  }
  
  return totals;
}

function determineWinner(totalScores: TotalScores): string {
  if (totalScores.user > totalScores.opp) {
    return 'user';
  } else if (totalScores.opp > totalScores.user) {
    return 'opp';
  } else {
    return 'tie';
  }
}

async function pinToIPFS(payload: IpfsPayload): Promise<string | null> {
  try {
    const result = await pinata.upload.json(payload);
    return result.IpfsHash;
  } catch (error) {
    console.error('IPFS pinning failed:', error);
    return null;
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { matchId: string } }
) {
  try {
    const matchId = parseInt(params.matchId);
    
    // Validate matchId
    if (!matchId || isNaN(matchId)) {
      return NextResponse.json({
        error: 'Valid match ID is required',
        code: 'INVALID_MATCH_ID'
      }, { status: 400 });
    }
    
    // Parse request body
    const requestBody = await request.json();
    const { nearTxHash } = requestBody;
    
    // Get match from database
    const matchResult = await db.select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);
    
    if (matchResult.length === 0) {
      return NextResponse.json({
        error: 'Match not found',
        code: 'MATCH_NOT_FOUND'
      }, { status: 404 });
    }
    
    const match = matchResult[0];
    
    // Validate match has roundsData
    if (!match.roundsData || !Array.isArray(match.roundsData)) {
      return NextResponse.json({
        error: 'Match does not have valid rounds data',
        code: 'INVALID_ROUNDS_DATA'
      }, { status: 400 });
    }
    
    // Validate match can be finished
    if (match.status === 'completed') {
      return NextResponse.json({
        error: 'Match is already completed',
        code: 'MATCH_ALREADY_COMPLETED'
      }, { status: 400 });
    }
    
    // Get agent data for IPFS payload
    const agentAResult = await db.select()
      .from(agents)
      .where(eq(agents.id, match.agentAId!))
      .limit(1);
    
    const agentBResult = await db.select()
      .from(agents)
      .where(eq(agents.id, match.agentBId!))
      .limit(1);
    
    if (agentAResult.length === 0 || agentBResult.length === 0) {
      return NextResponse.json({
        error: 'Match agents not found',
        code: 'AGENTS_NOT_FOUND'
      }, { status: 404 });
    }
    
    const agentA = agentAResult[0];
    const agentB = agentBResult[0];
    
    // Calculate total scores
    const totalScores = calculateTotalScores(match.roundsData as RoundData[]);
    
    // Determine winner
    const winner = determineWinner(totalScores);
    
    // Create IPFS payload
    const ipfsPayload: IpfsPayload = {
      match_id: match.id,
      mode: match.mode,
      agents: {
        user: agentA,
        opp: agentB
      },
      rounds_data: match.roundsData as RoundData[],
      total_scores: totalScores,
      winner: winner,
      timestamp: Date.now()
    };
    
    // Pin to IPFS (non-fatal if it fails)
    let ipfsCid: string | null = null;
    if (process.env.PINATA_API_KEY && process.env.PINATA_SECRET_KEY) {
      ipfsCid = await pinToIPFS(ipfsPayload);
      if (!ipfsCid) {
        console.warn('IPFS pinning failed for match', matchId, 'but continuing...');
      }
    } else {
      console.warn('PINATA credentials not configured, skipping IPFS upload');
    }
    
    // Update match in database
    const updateData: any = {
      totalScores: totalScores,
      winner: winner,
      status: 'completed',
      endedAt: Math.floor(Date.now() / 1000)
    };
    
    if (ipfsCid) {
      updateData.ipfsCid = ipfsCid;
    }
    
    if (nearTxHash) {
      updateData.nearTxHash = nearTxHash;
    }
    
    const updatedMatch = await db.update(matches)
      .set(updateData)
      .where(eq(matches.id, matchId))
      .returning();
    
    if (updatedMatch.length === 0) {
      return NextResponse.json({
        error: 'Failed to update match',
        code: 'UPDATE_FAILED'
      }, { status: 500 });
    }
    
    // Return success response
    return NextResponse.json({
      ok: true,
      data: {
        match: updatedMatch[0],
        totalScores: totalScores,
        winner: winner,
        ipfsCid: ipfsCid || null
      }
    }, { status: 200 });
    
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}