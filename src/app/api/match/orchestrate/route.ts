import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { agents, matches, matchPlayers, rounds } from "@/db/schema";
import { eq } from "drizzle-orm";
import { golemClient, createMatchOnGolem } from "@/lib/golem-client";

// Helper: safe dynamic Gemini
async function generateWithGemini(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) return null;
  try {
    // @ts-ignore - dynamic import for optional dep
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const modelName = process.env.GEMINI_MODEL || "gemini-1.5-flash";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const res = await model.generateContent(prompt);
    const out = res.response?.text?.() ?? (typeof res.response === "object" ? (res.response as any).text?.() : "");
    return (await out) || "";
  } catch (e) {
    console.error("Gemini generation failed, falling back to mock:", e);
    return null;
  }
}

function mockAnswer(name: string, mode: string, q: string) {
  const templates = [
    `${name}: Here's my take on "${q}" — sharp, concise, and to the point in ${mode} mode!`,
    `${name}: I'll counter with a witty angle: "${q}" deserves this punchy reply.`,
    `${name}: Deploying creative strike → ${q} :: Verdict: style over force.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function judgeScores(a: string, b: string) {
  // lightweight heuristic judging
  const lenA = a.trim().length;
  const lenB = b.trim().length;
  const styleA = (a.match(/[!?.]/g) || []).length;
  const styleB = (b.match(/[!?.]/g) || []).length;
  const scoreA = Math.round(lenA * 0.02 + styleA * 2 + (a.toLowerCase().includes("therefore") ? 3 : 0));
  const scoreB = Math.round(lenB * 0.02 + styleB * 2 + (b.toLowerCase().includes("thus") ? 3 : 0));
  const winner = scoreA === scoreB ? (Math.random() > 0.5 ? "A" : "B") : scoreA > scoreB ? "A" : "B";
  return { scoreA, scoreB, winner } as const;
}

// Broadcast helper via internal HTTP POST to /api/realtime
async function publish(origin: string, channel: string, data: any) {
  try {
    await fetch(`${origin}/api/realtime`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, data }),
      cache: "no-store",
    });
  } catch (e) {
    console.error("realtime publish failed", e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentAId, agentBId, prompt, mode = "duel" } = body || {};

    if (!agentAId || !agentBId || !prompt) {
      return NextResponse.json({ ok: false, error: "agentAId, agentBId, prompt are required" }, { status: 400 });
    }
    if (agentAId === agentBId) {
      return NextResponse.json({ ok: false, error: "Pick two different agents" }, { status: 400 });
    }

    // Load agents
    const [a] = await db.select().from(agents).where(eq(agents.id, agentAId));
    const [b] = await db.select().from(agents).where(eq(agents.id, agentBId));
    if (!a || !b) return NextResponse.json({ ok: false, error: "Agents not found" }, { status: 404 });

    // Create match
    const now = Date.now();
    const [m] = await db.insert(matches).values({
      mode,
      status: "in_progress",
      startedAt: now,
      createdAt: now,
    }).returning();

    await db.insert(matchPlayers).values([
      { matchId: m.id, agentId: a.id, userId: a.ownerUserId ?? null, seat: 0, createdAt: now },
      { matchId: m.id, agentId: b.id, userId: b.ownerUserId ?? null, seat: 1, createdAt: now },
    ]);

    const origin = req.nextUrl.origin;

    // Broadcast match start (ticker + match channel)
    await publish(origin, "ticker", { type: "match_started", matchId: m.id, a: { id: a.id, name: a.name }, b: { id: b.id, name: b.name }, mode });
    await publish(origin, `match:${m.id}`, { type: "started", matchId: m.id, mode, prompt });

    // Generate answers (Gemini → fallback mock)
    const sysA = `Agent A (${a.name}) profile: ${a.promptProfile}\nMode: ${mode}\nQuestion: ${prompt}\nAnswer as A:`;
    const sysB = `Agent B (${b.name}) profile: ${b.promptProfile}\nMode: ${mode}\nQuestion: ${prompt}\nAnswer as B:`;

    // Notify thinking
    await publish(origin, `match:${m.id}`, { type: "generating", matchId: m.id });

    const [ansA0, ansB0] = await Promise.all([
      generateWithGemini(sysA),
      generateWithGemini(sysB),
    ]);

    const answerA = ansA0?.trim() || mockAnswer(a.name, mode, prompt);
    const answerB = ansB0?.trim() || mockAnswer(b.name, mode, prompt);

    // Partial: answers ready
    await publish(origin, `match:${m.id}`, { type: "answers", matchId: m.id, answers: { A: answerA, B: answerB } });

    const { scoreA, scoreB, winner } = judgeScores(answerA, answerB);

    // Persist round with answers directly
    const [r] = await db.insert(rounds).values({
      matchId: m.id,
      idx: 0,
      question: prompt,
      ipfsCid: null,
      judgeScores: { scoreA, scoreB, winner } as any,
      resultSummary: `Winner: ${winner}`,
      answerA,
      answerB,
      createdAt: now,
    }).returning();

    // Scores update
    await publish(origin, `match:${m.id}`, { type: "scored", matchId: m.id, scores: { scoreA, scoreB }, winner });

    // Complete match (local Drizzle)
    await db.update(matches).set({ status: "completed", endedAt: Date.now() }).where(eq(matches.id, m.id));

    // Final broadcast
    await publish(origin, `match:${m.id}`, { type: "completed", matchId: m.id, roundId: r.id });
    await publish(origin, "ticker", { type: "match_result", matchId: m.id, a: { id: a.id, name: a.name }, b: { id: b.id, name: b.name }, winner, scores: { scoreA, scoreB } });

    // New: Sync to Golem Base (decentralized)
    await createMatchOnGolem({
      id: m.id.toString(),
      mode,
      winner,
      scores: { scoreA, scoreB },
      createdAt: now,
    });

    return NextResponse.json({ ok: true, data: { matchId: m.id, round: r, winner, scores: { scoreA, scoreB }, answers: { A: answerA, B: answerB } } });
  } catch (e) {
    console.error("/api/match/orchestrate POST error:", e);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}