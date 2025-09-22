import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { agents, matches, matchPlayers, rounds } from "@/db/schema";
import { eq, inArray } from "drizzle-orm";
import { GoogleGenerativeAI } from "@google/generative-ai";

const orchestrateSchema = z.object({
  mode: z.enum(["boxing", "cricket", "carrom"]).default("boxing"),
  agentAId: z.number().int().positive(),
  agentBId: z.number().int().positive().refine((v, ctx) => {
    const { agentAId } = (ctx as any).parent || {};
    return typeof agentAId !== "number" || v !== agentAId;
  }, { message: "agentBId must be different from agentAId" }),
  prompt: z.string().min(1).max(2000),
});

async function maybeUploadToIPFS(filename: string, data: any): Promise<string | null> {
  try {
    const token = process.env.WEB3_STORAGE_TOKEN;
    if (!token) return null;
    const { Web3Storage, File } = await import("web3.storage");
    const client = new Web3Storage({ token });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const file = new File([blob], filename, { type: "application/json" });
    const cid = await client.put([file], { name: filename, wrapWithDirectory: false });
    return cid;
  } catch (e) {
    console.error("IPFS upload failed:", e);
    return null;
  }
}

async function callGeminiAnswers(prompt: string, aProfile: string, bProfile: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-1.5-flash" });

    const buildPrompt = (role: "A" | "B", profile: string) => `You are Agent ${role} in a head-to-head creative duel.\n` +
      `Your persona/profile:\n${profile}\n\n` +
      `Challenge: ${prompt}\n` +
      `Respond with a short, punchy answer (3-6 sentences). Avoid meta talk. No preamble. Just your answer.`;

    const [aRes, bRes] = await Promise.all([
      model.generateContent(buildPrompt("A", aProfile)),
      model.generateContent(buildPrompt("B", bProfile)),
    ]);

    const aText = aRes.response.text().trim();
    const bText = bRes.response.text().trim();
    return { engine: "gemini", answers: { a: aText, b: bText } } as const;
  } catch (err) {
    console.error("Gemini generation failed:", err);
    return null;
  }
}

async function callOpenServe(prompt: string, aProfile: string, bProfile: string) {
  // Minimal stub: if OPENSERV_API_KEY exists and OPENSERV_API_BASE provided, you could call real API here.
  // To avoid external failures, return a deterministic mock transcript for now.
  const seed = (s: string) => Array.from(s).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const sa = seed(aProfile + prompt) % 100;
  const sb = seed(bProfile + prompt) % 100;
  const aAnswer = `Agent A riff (${sa}): ${prompt}\nResponse showcasing creativity, structure, and flair.`;
  const bAnswer = `Agent B riff (${sb}): ${prompt}\nResponse emphasizing logic, humor, and style.`;
  return {
    engine: process.env.OPENSERV_API_KEY ? "mock-openserve" : "mock-local",
    answers: {
      a: aAnswer,
      b: bAnswer,
    },
  } as const;
}

function judge(aText: string, bText: string) {
  // Simple judge: score by length variety and characters diversity
  const diversity = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9]/g, "").split("")).size;
  const creativityA = Math.min(10, Math.round(diversity(aText) / 5));
  const creativityB = Math.min(10, Math.round(diversity(bText) / 5));
  const styleA = Math.min(10, Math.round((aText.match(/[,.!?]/g)?.length || 0) / 3));
  const styleB = Math.min(10, Math.round((bText.match(/[,.!?]/g)?.length || 0) / 3));
  const totalA = creativityA + styleA;
  const totalB = creativityB + styleB;
  const winner = totalA === totalB ? (aText.length >= bText.length ? "A" : "B") : (totalA > totalB ? "A" : "B");
  return {
    scores: {
      creativity: { A: creativityA, B: creativityB },
      style: { A: styleA, B: styleB },
      total: { A: totalA, B: totalB },
    },
    winner,
    summary: winner === "A" ? "Agent A edged out with more expressive variety." : "Agent B prevailed with tighter phrasing and punctuation cadence.",
  } as const;
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
      { matchId: match.id, agentId: agentAId, userId: agentA.ownerUserId || null, seat: 0, createdAt: Date.now() },
      { matchId: match.id, agentId: agentBId, userId: agentB.ownerUserId || null, seat: 1, createdAt: Date.now() },
    ]);

    // Generate answers: try Gemini first; if unavailable, fall back to OpenServe mock
    const gem = await callGeminiAnswers(prompt, agentA.promptProfile, agentB.promptProfile);
    const os = gem ?? await callOpenServe(prompt, agentA.promptProfile, agentB.promptProfile);

    // Judge
    const verdict = judge(os.answers.a, os.answers.b);

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

    // Upload to IPFS when available
    const cid = await maybeUploadToIPFS(`match-${match.id}-round-0.json`, transcript);

    // Persist round
    const [round] = await db.insert(rounds).values({
      matchId: match.id,
      idx: 0,
      question: prompt,
      ipfsCid: cid,
      judgeScores: verdict.scores as any,
      resultSummary: `${verdict.winner === "A" ? agentA.name : agentB.name} wins — ${verdict.summary}`,
      createdAt: Date.now(),
    }).returning();

    // Complete match
    await db.update(matches).set({ status: "completed", endedAt: Date.now() }).where(eq(matches.id, match.id));

    // Include answers in the returned round payload for immediate UI display
    const roundWithAnswers = { ...round, answers: { A: os.answers.a, B: os.answers.b } } as any;

    return NextResponse.json({ ok: true, data: { matchId: match.id, round: roundWithAnswers, cid, winner: verdict.winner } }, { status: 201 });
  } catch (e) {
    console.error("POST /api/match/orchestrate error:", e);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}