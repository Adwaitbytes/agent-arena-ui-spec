import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { agents, matches, matchPlayers, rounds } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { smartUpload } from '@/lib/storage';

const orchestrateSchema = z.object({
  mode: z.enum(["boxing", "cricket", "carrom"]).default("boxing"),
  agentAId: z.number().int().positive(),
  agentBId: z.number().int().positive(),
  prompt: z.string().min(1).max(2000),
});

async function uploadToStorage(filename: string, data: any, matchId?: string): Promise<{ hash: string; type: string } | null> {
  try {
    const result = await smartUpload(data, {
      name: filename,
      description: `Agent match response: ${filename}`,
      matchId: matchId
    });

    console.log(`Uploaded to ${result.storageType}: ${result.cid}`);
    return { hash: result.cid, type: result.storageType };
  } catch (error) {
    console.error('Storage upload failed:', error);
    return null;
  }
}

async function callGeminiAPI(prompt: string, aProfile: string, bProfile: string, aName: string, bName: string) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Generate response for Agent A
    const promptA = `You are an AI agent named "${aName}" with the following personality and instructions:

${aProfile}

Now respond to this challenge: "${prompt}"

Important guidelines:
- Stay true to your character/prompt personality
- Be creative and engaging
- Keep responses under 200 words
- If your prompt involves roasting/comedy, be witty but not offensive
- If your prompt involves other styles (poetic, logical, etc.), embody that style
- Generate a response that showcases your unique personality

Respond as your character would:`;

    const promptB = `You are an AI agent named "${bName}" with the following personality and instructions:

${bProfile}

Now respond to this challenge: "${prompt}"

Important guidelines:
- Stay true to your character/prompt personality
- Be creative and engaging
- Keep responses under 200 words
- If your prompt involves roasting/comedy, be witty but not offensive
- If your prompt involves other styles (poetic, logical, etc.), embody that style
- Generate a response that showcases your unique personality

Respond as your character would:`;

    // Generate both responses
    const [resultA, resultB] = await Promise.all([
      model.generateContent(promptA),
      model.generateContent(promptB)
    ]);

    const responseA = await resultA.response;
    const responseB = await resultB.response;

    return {
      engine: "gemini-1.5-flash", // Normal agents use 1.5 Flash
      answers: {
        a: responseA.text().trim(),
        b: responseB.text().trim(),
      },
    };
  } catch (error: any) {
    console.error('Gemini API error:', error);

    // Enhanced error handling for quota limits
    if (error?.status === 429) {
      console.log('⚠️ Gemini API quota exceeded, using enhanced mock responses');
      return generateEnhancedMockResponses(prompt, aProfile, bProfile, aName, bName);
    }

    // Fallback to mock responses for other errors
    return generateEnhancedMockResponses(prompt, aProfile, bProfile, aName, bName);
  }
}

// Enhanced mock response generator for quota exceeded scenarios
function generateEnhancedMockResponses(prompt: string, aProfile: string, bProfile: string, aName: string, bName: string) {
  const seed = (s: string) => Array.from(s).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const sa = seed(aProfile + prompt) % 100;
  const sb = seed(bProfile + prompt) % 100;

  // Generate more realistic responses based on agent personalities
  const aResponse = generatePersonalityResponse(aName, aProfile, prompt, sa);
  const bResponse = generatePersonalityResponse(bName, bProfile, prompt, sb);

  return {
    engine: "mock-quota-exceeded",
    answers: {
      a: aResponse,
      b: bResponse,
    },
  };
}

// Generate personality-aware mock responses
function generatePersonalityResponse(name: string, profile: string, prompt: string, seed: number): string {
  // Extract key personality traits
  const isCreative = profile.toLowerCase().includes('creative') || profile.toLowerCase().includes('artistic');
  const isLogical = profile.toLowerCase().includes('logical') || profile.toLowerCase().includes('analytical');
  const isHumorous = profile.toLowerCase().includes('funny') || profile.toLowerCase().includes('wit');

  const responses = [
    `${name} approaches this thoughtfully: "${prompt}" requires careful consideration. Based on my personality, I would ${isCreative ? 'explore creative angles' : isLogical ? 'analyze systematically' : 'engage authentically'}.`,
    `${name} responds: This is an interesting challenge! ${isHumorous ? 'Let me add some wit to this...' : isCreative ? 'My creative perspective suggests...' : 'Logically speaking...'} [Note: API quota exceeded, showing demonstration response]`,
    `${name}: "${prompt}" - ${isCreative ? '🎨 Creative response incoming!' : isLogical ? '🧠 Analytical breakdown follows:' : '💭 Thoughtful perspective:'} This showcases my unique personality traits.`,
  ];

  return responses[seed % responses.length];
}

async function superagentJudge(aText: string, bText: string, aName: string, bName: string, prompt: string, aProfile: string, bProfile: string) {
  try {
    const superagentKey = process.env.SUPERAGENT_GEMINI_KEY;
    if (!superagentKey) {
      console.log('Superagent key not configured, falling back to regular judge');
      return judgeFallback(aText, bText);
    }

    const genAI = new GoogleGenerativeAI(superagentKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' }); // Use latest model for superagent judging

    const superJudgePrompt = `You are a SUPERAGENT - an elite AI judge evaluating agent responses.

CHALLENGE: "${prompt}"

AGENT A (${aName}): "${aText}"
AGENT B (${bName}): "${bText}"

Rate each response 0-10 on:
- Creativity: How original and imaginative
- Style: Language quality and personality match  
- Relevance: How well it addresses the prompt
- Engagement: How compelling and memorable

Respond with ONLY this JSON format:
{
  "scores": {
    "creativity": {"A": 8, "B": 7},
    "style": {"A": 9, "B": 8}, 
    "relevance": {"A": 10, "B": 9},
    "engagement": {"A": 8, "B": 7}
  },
  "winner": "A",
  "summary": "Agent A wins with superior creativity and style"
}`;

    const result = await model.generateContent(superJudgePrompt);
    const response = await result.response;
    const text = response.text().trim();

    // Try to extract JSON from response
    let jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('No JSON found in superagent response:', text);
      return judgeFallback(aText, bText);
    }

    try {
      const judgment = JSON.parse(jsonMatch[0]);

      // Calculate totals
      const totalA = Object.values(judgment.scores).reduce((sum: number, category: any) => sum + category.A, 0);
      const totalB = Object.values(judgment.scores).reduce((sum: number, category: any) => sum + category.B, 0);

      // Add total scores
      judgment.scores.total = { A: totalA, B: totalB };

      // Mark as superagent judged
      judgment.superagent = true;

      return judgment;
    } catch (parseError) {
      console.error('Failed to parse superagent judge response:', text);
      return judgeFallback(aText, bText);
    }
  } catch (error: any) {
    console.error('Superagent judge error:', error);

    // Handle quota errors for superagent
    if (error?.status === 429) {
      console.log('⚠️ Superagent quota exceeded, using fallback judge');
    }

    return judgeFallback(aText, bText);
  }
} function judgeFallback(aText: string, bText: string) {
  // Simple judge: score by length variety and characters diversity
  const diversity = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9]/g, "").split("")).size;
  const creativityA = Math.min(10, Math.round(diversity(aText) / 5));
  const creativityB = Math.min(10, Math.round(diversity(bText) / 5));
  const styleA = Math.min(10, Math.round((aText.match(/[,.!?]/g)?.length || 0) / 3));
  const styleB = Math.min(10, Math.round((bText.match(/[,.!?]/g)?.length || 0) / 3));
  const relevanceA = Math.min(10, Math.round(aText.length / 20));
  const relevanceB = Math.min(10, Math.round(bText.length / 20));
  const totalA = creativityA + styleA + relevanceA;
  const totalB = creativityB + styleB + relevanceB;
  const winner = totalA === totalB ? (aText.length >= bText.length ? "A" : "B") : (totalA > totalB ? "A" : "B");
  return {
    scores: {
      creativity: { A: creativityA, B: creativityB },
      style: { A: styleA, B: styleB },
      relevance: { A: relevanceA, B: relevanceB },
      total: { A: totalA, B: totalB },
    },
    winner,
    summary: winner === "A" ? "Agent A edged out with more expressive variety." : "Agent B prevailed with tighter phrasing and punctuation cadence.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = orchestrateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
    }
    const { mode, agentAId, agentBId, prompt } = parsed.data;

    // Ensure agents exist
    const existingAgents = await db.select().from(agents).where(inArray(agents.id, [agentAId, agentBId]));
    if (existingAgents.length !== 2) {
      return NextResponse.json({ ok: false, error: "One or more agents not found" }, { status: 404 });
    }
    const agentA = existingAgents.find(a => a.id === agentAId)!;
    const agentB = existingAgents.find(a => a.id === agentBId)!;

    // Create match (start immediately)
    const [match] = await db.insert(matches).values({
      mode,
      status: "in_progress",
      startedAt: Date.now(),
      endedAt: null,
      vrfProof: null,
      intentsTx: null,
      shadeAgentId: null,
      createdAt: Date.now(),
    }).returning();

    // Seat players
    await db.insert(matchPlayers).values([
      { matchId: match.id, agentId: agentAId, userId: agentA.ownerUserId, seat: 0, createdAt: Date.now() },
      { matchId: match.id, agentId: agentBId, userId: agentB.ownerUserId, seat: 1, createdAt: Date.now() },
    ]);

    // Ask Gemini API for answers
    const os = await callGeminiAPI(prompt, agentA.promptProfile, agentB.promptProfile, agentA.name, agentB.name);

    // Judge the responses using superagent
    const verdict = await superagentJudge(os.answers.a, os.answers.b, agentA.name, agentB.name, prompt, agentA.promptProfile, agentB.promptProfile);

    // Build transcript
    const transcript = {
      matchId: match.id,
      mode,
      prompt,
      agents: {
        A: { id: agentAId, name: agentA.name },
        B: { id: agentBId, name: agentB.name },
      },
      engine: os.engine,
      round: 0,
      answers: { A: os.answers.a, B: os.answers.b },
      judge: verdict,
      timestamps: { createdAt: Date.now() },
    };

    // Upload to storage
    const storageResult = await uploadToStorage(
      `match-${match.id}-round-0.json`,
      transcript,
      match.id.toString()
    );

    // Persist round
    const [round] = await db.insert(rounds).values({
      matchId: match.id,
      idx: 0,
      question: prompt,
      ipfsCid: storageResult?.hash || null,
      judgeScores: verdict.scores as any,
      resultSummary: `${verdict.winner === "A" ? agentA.name : agentB.name} wins — ${verdict.summary}`,
      createdAt: Date.now(),
    }).returning();

    // Complete match
    await db.update(matches).set({ status: "completed", endedAt: Date.now() }).where(eq(matches.id, match.id));

    return NextResponse.json({
      ok: true,
      data: {
        matchId: match.id,
        round,
        storageHash: storageResult?.hash,
        storageType: storageResult?.type,
        // Legacy compatibility
        cid: storageResult?.hash,
        winner: verdict.winner,
        transcript: {
          answers: { A: os.answers.a, B: os.answers.b },
          agents: {
            A: { id: agentAId, name: agentA.name },
            B: { id: agentBId, name: agentB.name },
          },
          prompt,
          scores: verdict.scores
        }
      }
    }, { status: 201 });
  } catch (e) {
    console.error("POST /api/match/orchestrate error:", e);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}