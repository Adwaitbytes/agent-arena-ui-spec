import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, rounds, agents } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { generateResponse } from '@/lib/gemini-client';
import { pinJSON } from '@/lib/pinata';

const schema = z.object({
  idx: z.number().int().min(0).max(2) // 0-2 for 3 rounds
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
    if (!match || match.status !== 'active') {
      return NextResponse.json({ ok: false, error: 'Match not ready' }, { status: 400 });
    }

    const [agentA] = await db.select().from(agents).where(eq(agents.id, match.agentAId!));
    const [agentB] = await db.select().from(agents).where(eq(agents.id, match.agentBId!));
    if (!agentA || !agentB) {
      return NextResponse.json({ ok: false, error: 'Agents not found' }, { status: 404 });
    }

    const mode = match.mode as 'roast' | 'writing' | 'duel';
    const roundPrompt = generateResponse.ROUND_PROMPTS[mode][idx]; // From gemini-client

    const [responseA, responseB] = await Promise.all([
      generateResponse(agentA.prompt, roundPrompt, mode, idx),
      generateResponse(agentB.prompt, roundPrompt, mode, idx)
    ]);

    // Pin round responses to IPFS
    let ipfsCid: string | null = null;
    try {
      const pinRes = await pinJSON({
        matchId,
        round: idx,
        mode,
        prompt: roundPrompt,
        responseA,
        responseB,
        timestamp: Date.now()
      }, { name: `match-${matchId}-round-${idx}-responses` });
      ipfsCid = pinRes.IpfsHash;
    } catch (e) {
      console.error('IPFS pin failed for responses:', e);
      // Continue without CID
    }

    const [newRound] = await db.insert(rounds).values({
      matchId,
      idx,
      question: roundPrompt,
      answerA: responseA, // Using answerA/B as responseA/B
      answerB: responseB,
      ipfsCid,
      createdAt: Date.now()
    }).returning();

    return NextResponse.json({ ok: true, data: newRound });
  } catch (error) {
    console.error('Generate round error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to generate round' }, { status: 500 });
  }
}