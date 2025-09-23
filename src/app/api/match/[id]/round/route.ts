import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, rounds } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { isPinataConfigured, pinJSON } from '@/lib/pinata';
import { generateResponse, scoreResponses } from '@/lib/gemini';

const ROUND_PROMPTS = {
  roast: ['Roast this silly idea: pineapple on pizza.', 'Deep roast a celebrity chef\'s failed recipe.', 'Ultimate legacy burn on outdated tech trends.'],
  writing: ['Write a 100-word micro-story about lost keys.', 'Add a plot twist to a mystery tale.', 'Craft a full 200-word narrative finale.'],
  duel: ['Solve: If A > B and B = C, is A = C?', 'Debate: Crypto vs. traditional finance.', 'Strategize winning a zero-sum game.'],
};

const createRoundSchema = z.object({
  idx: z.number().int().min(0),
  question: z.string().min(1).transform(s => s.trim()),
  answers: z.any().optional(),
  ipfsCid: z.string().max(128).optional(),
  judgeScores: z.any().optional(),
  resultSummary: z.string().optional(),
  answerA: z.string().optional(),
  answerB: z.string().optional(),
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
    const validation = createRoundSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      );
    }

    // Verify match exists
    const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!match) {
      return NextResponse.json(
        { ok: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    const { idx, agentAId, agentBId, mode } = body;
    const prompt = ROUND_PROMPTS[mode][idx];

    // Fetch agents
    const [agentA, agentB] = await Promise.all([
      db.select().from(agents).where(eq(agents.id, agentAId)).first(),
      db.select().from(agents).where(eq(agents.id, agentBId)).first(),
    ]);

    if (!agentA || !agentB) return NextResponse.json({ ok: false, error: 'Agents not found' }, { status: 404 });

    // Generate responses parallel
    const [responseA, responseB] = await Promise.all([
      generateResponse(agentA.promptProfile, prompt, mode),
      generateResponse(agentB.promptProfile, prompt, mode),
    ]);

    // Score
    const scores = await scoreResponses(responseA, responseB, prompt, mode);

    // Optionally pin round payload to IPFS via Pinata when configured and no CID provided
    let ipfsCidToUse: string | null = ipfsCid || null;
    if (!ipfsCidToUse && isPinataConfigured()) {
      try {
        const payload = {
          matchId,
          round: idx,
          mode: match.mode,
          question,
          answers: answers ?? null,
          answerA: answerA ?? null,
          answerB: answerB ?? null,
          judge: judgeScores ? { scores: judgeScores, rationale: null, flags: null } : null,
          timestamps: { createdAt: Date.now() },
        };
        const res = await pinJSON(payload, { name: `match-${matchId}-round-${idx}` });
        ipfsCidToUse = res.IpfsHash;
      } catch (e) {
        console.error('Pinata pin failed, continuing without CID:', e);
      }
    }

    const [newRound] = await db.insert(rounds).values({
      matchId,
      idx,
      question: prompt,
      answerA: responseA,
      answerB: responseB,
      judgeScores: JSON.stringify(scores),
      ipfsCid: ipfsCidToUse,
      resultSummary: resultSummary || null,
      createdAt: Date.now(),
    }).returning();

    return NextResponse.json(
      { ok: true, data: newRound },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/match/[id]/round error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}