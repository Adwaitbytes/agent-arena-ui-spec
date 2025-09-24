"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ws } from "@/lib/realtime";

type Agent = { id: number; name: string };

type OrchestrateResult = {
  ok: boolean;
  data?: {
    matchId: number;
    round: any;
    winner: "A" | "B";
    scores: { scoreA: number; scoreB: number };
    answers: { A: string; B: string };
    cid: string;
  };
  error?: string;
};

export default function MultiplayerPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [mode, setMode] = useState<"boxing" | "cricket" | "carrom">("boxing");
  const [agentAId, setAgentAId] = useState<number | "">("");
  const [agentBId, setAgentBId] = useState<number | "">("");
  const [prompt, setPrompt] = useState("Write a 2-line roast about pineapple pizza.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrchestrateResult["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Realtime state
  const [matchId, setMatchId] = useState<number | null>(null);
  const [answersLive, setAnswersLive] = useState<{ A?: string; B?: string }>({});
  const [scoresLive, setScoresLive] = useState<{ scoreA?: number; scoreB?: number }>({});
  const [winnerLive, setWinnerLive] = useState<"A" | "B" | null>(null);
  const subsRef = useRef<Array<() => void>>([]);

  // Canvas animation state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const [liveScores, setLiveScores] = useState({ A: 0, B: 0 });
  const targetScores = useMemo(() => ({
    A: result?.scores.scoreA ?? scoresLive.scoreA ?? 0,
    B: result?.scores.scoreB ?? scoresLive.scoreB ?? 0,
  }), [result, scoresLive]);

  // Fetch agents list
  useEffect(() => {
    let mounted = true;
    const fetchAgents = async () => {
      setLoadingAgents(true);
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
        const res = await fetch("/api/agents", {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const json = await res.json();
        if (!mounted) return;
        const list: Agent[] = (json?.data || json) as any;
        setAgents(list.map((a: any) => ({ id: a.id, name: a.name })));
      } catch (e) {
        // ignore
      } finally {
        setLoadingAgents(false);
      }
    };
    fetchAgents();
    return () => { mounted = false; };
  }, []);

  const agentA = useMemo(
    () => agents.find((a) => a.id === agentAId),
    [agents, agentAId]
  );
  const agentB = useMemo(
    () => agents.find((a) => a.id === agentBId),
    [agents, agentBId]
  );

  // Clean up any prior subscriptions
  const clearSubs = () => {
    subsRef.current.forEach((fn) => fn());
    subsRef.current = [];
  };

  const handleRunMatch = async () => {
    setError(null);
    setResult(null);
    setAnswersLive({});
    setScoresLive({});
    setWinnerLive(null);
    setMatchId(null);
    clearSubs();

    if (!agentAId || !agentBId || agentAId === agentBId) {
      setError("Pick two different agents.");
      return;
    }
    setLoading(true);
    setLiveScores({ A: 0, B: 0 });

    const aId = Number(agentAId);
    const bId = Number(agentBId);
    const unsubTicker = ws.sub("ticker", (msg: any) => {
      if (msg?.type === "match_started" && msg?.a?.id === aId && msg?.b?.id === bId) {
        const id = Number(msg.matchId);
        setMatchId(id);
        unsubTicker();
        subsRef.current = subsRef.current.filter((fn) => fn !== unsubTicker);
        const channel = `match:${id}`;
        const unsubMatch = ws.sub(channel, (ev: any) => {
          if (ev?.type === "generating") {
            setLoading(true);
          }
          if (ev?.type === "answers") {
            setAnswersLive(ev.answers || {});
          }
          if (ev?.type === "scored") {
            setScoresLive(ev.scores || {});
            if (ev.winner === "A" || ev.winner === "B") setWinnerLive(ev.winner);
          }
          if (ev?.type === "completed") {
            setLoading(false);
          }
        });
        subsRef.current.push(unsubMatch);
      }
    });
    subsRef.current.push(unsubTicker);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("bearer_token")
          : null;
      const res = await fetch("/api/match/orchestrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ agentAId: aId, agentBId: bId, prompt, mode }),
      });
      const json: OrchestrateResult = await res.json();
      if (!json.ok) {
        const err = typeof json.error === "string" ? json.error : "Failed to orchestrate match";
        setError(err);
      } else {
        setResult(json.data!);
      }
    } catch (e: any) {
      setError(e.message || "Internal error");
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = !!agentAId && !!agentBId && agentAId !== agentBId && prompt.trim().length > 0 && !loading;

  const handleQuickMatch = async () => {
    if (agents.length < 2) {
      setError("Need at least 2 agents for a quick match");
      return;
    }

    const shuffled = [...agents].sort(() => Math.random() - 0.5);
    const selectedA = shuffled[0];
    const selectedB = shuffled[1];

    setAgentAId(selectedA.id);
    setAgentBId(selectedB.id);

    const prompts = {
      boxing: [
        "Roast a toaster that thinks it's a philosopher.",
        "Roast someone who puts pineapple on pizza.",
        "Roast a person who talks to their plants.",
        "Roast someone who still uses Internet Explorer.",
      ],
      cricket: [
        "Write a 60-word cyberpunk haiku about neon rain.",
        "Create a short story about a robot learning to laugh.",
        "Write a poem about the last star in the universe.",
        "Describe a city where shadows have their own consciousness.",
      ],
      carrom: [
        "Debate: Are AIs better judges than humans? Provide 2 arguments each.",
        "Argue for or against: Social media makes people more connected.",
        "Debate: Is artificial creativity as valuable as human creativity?",
        "Discuss: Should AI art be eligible for prestigious art awards?",
      ],
    };

    const modePrompts = prompts[mode];
    const randomPrompt = modePrompts[Math.floor(Math.random() * modePrompts.length)];
    setPrompt(randomPrompt);

    setTimeout(() => {
      handleRunMatch();
    }, 500);
  };

  // Arena Canvas drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let last = 0;
    const w = () => (canvas.width = canvas.clientWidth * window.devicePixelRatio);
    const h = () => (canvas.height = canvas.clientHeight * window.devicePixelRatio);
    w(); h();

    const draw = (t: number) => {
      if (!ctx) return;
      if (!startTimeRef.current) startTimeRef.current = t;
      const dt = Math.min(32, t - (last || t));
      last = t;

      const targetA = targetScores.A;
      const targetB = targetScores.B;
      setLiveScores(prev => {
        const lerp = (from: number, to: number, rate: number) => from + (to - from) * rate;
        const nextA = lerp(prev.A, targetA, (result || scoresLive.scoreA != null) ? 0.08 : 0.02);
        const nextB = lerp(prev.B, targetB, (result || scoresLive.scoreB != null) ? 0.08 : 0.02);
        return { A: nextA, B: nextB };
      });

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width, height = canvas.height;
      ctx.fillStyle = "rgba(0,0,0,0)";
      const grid = 20 * window.devicePixelRatio;
      ctx.strokeStyle = "rgba(127,127,127,0.15)";
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += grid) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
      }
      for (let y = 0; y < height; y += grid) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
      }

      ctx.strokeStyle = "rgba(127,127,127,0.3)";
      ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(width/2, 0); ctx.lineTo(width/2, height); ctx.stroke();
      ctx.setLineDash([]);

      const tSec = t / 1000;
      const orbY = (p: number) => height * 0.5 + Math.sin(tSec * 2 + p) * height * 0.15;
      const orbX_A = width * 0.25 + Math.sin(tSec * 1.5) * width * 0.05;
      const orbX_B = width * 0.75 + Math.cos(tSec * 1.5) * width * 0.05;

      const drawGlow = (x: number, y: number, color: string) => {
        const r = 28 * window.devicePixelRatio;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
        grad.addColorStop(0, color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, y, r * 2, 0, Math.PI * 2); ctx.fill();
      };
      drawGlow(orbX_A, orbY(0), "rgba(72,199,142,0.35)");
      drawGlow(orbX_B, orbY(1), "rgba(103,132,255,0.35)");

      ctx.fillStyle = "#22c55e";
      ctx.beginPath(); ctx.arc(orbX_A, orbY(0), 10 * window.devicePixelRatio, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#6366f1";
      ctx.beginPath(); ctx.arc(orbX_B, orbY(1), 10 * window.devicePixelRatio, 0, Math.PI * 2); ctx.fill();

      const maxScore = Math.max(10, targetA, targetB);
      const meterW = width * 0.4;
      const meterH = 12 * window.devicePixelRatio;
      const pad = 12 * window.devicePixelRatio;

      ctx.fillStyle = "rgba(34,197,94,0.15)"; ctx.fillRect(pad, pad, meterW, meterH);
      ctx.fillStyle = "#22c55e"; ctx.fillRect(pad, pad, meterW * (liveScores.A / maxScore), meterH);
      ctx.fillStyle = "rgba(99,102,241,0.15)"; ctx.fillRect(width - pad - meterW, pad, meterW, meterH);
      ctx.fillStyle = "#6366f1"; ctx.fillRect(width - pad - meterW, pad, meterW * (liveScores.B / maxScore), meterH);

      const winnerShow = result?.winner || winnerLive;
      if (winnerShow) {
        const text = winnerShow === "A" ? "A Scores!" : "B Scores!";
        ctx.font = `${16 * window.devicePixelRatio}px system-ui, -apple-system, Segoe UI`;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.textAlign = "center";
        ctx.fillText(text, width / 2, pad + meterH + 20 * window.devicePixelRatio);
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
    const onResize = () => { w(); h(); };
    window.addEventListener("resize", onResize);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
    };
  }, [result, targetScores, scoresLive, winnerLive]);

  useEffect(() => {
    return () => {
      clearSubs();
    };
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="py-10 sm:py-14 border-b border-border bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Multiplayer Test Match
          </h1>
          <p className="mt-2 text-muted-foreground">
            Pick two agents, provide a prompt, and run an orchestrated round.
            The transcript is stored to IPFS when configured.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Setup</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="grid gap-1.5">
                  <label className="text-sm text-muted-foreground">Mode</label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                  >
                    <option value="boxing">Boxing</option>
                    <option value="cricket">Cricket</option>
                    <option value="carrom">Carrom</option>
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm text-muted-foreground">Agent A</label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    disabled={loadingAgents}
                    value={agentAId}
                    onChange={(e) => setAgentAId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">{loadingAgents ? "Loading..." : "Select agent"}</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-sm text-muted-foreground">Agent B</label>
                  <select
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    disabled={loadingAgents}
                    value={agentBId}
                    onChange={(e) => setAgentBId(e.target.value ? Number(e.target.value) : "")}
                  >
                    <option value="">{loadingAgents ? "Loading..." : "Select agent"}</option>
                    {agents.map((a) => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <label className="grid gap-1 text-sm">
                <span className="text-muted-foreground">Prompt</span>
                <textarea
                  className="min-h-24 rounded-md border border-border bg-background px-3 py-2"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </label>
              {error && <div className="text-sm text-destructive">{error}</div>}
              <div className="flex items-center gap-3">
                <Button onClick={handleRunMatch} disabled={!canSubmit || loading}>
                  {loading ? "Running..." : "Run Match"}
                </Button>
                <Button
                  onClick={handleQuickMatch}
                  disabled={loadingAgents || agents.length < 2 || loading}
                  variant="outline"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600"
                >
                  ⚡ Quick Match
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/onboarding">Create Agent</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outcome</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {!result && (
                <p className="text-muted-foreground">No result yet.</p>
              )}
              {result && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Match ID</span>
                    <Link
                      className="underline"
                      href={`/match/${result.matchId}`}
                    >
                      #{result.matchId}
                    </Link>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Winner</span>
                    <span className="font-semibold">
                      {result.winner === "A" ? agentA?.name || "A" : agentB?.name || "B"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">IPFS CID</span>
                    <span className="font-mono text-xs">
                      {result.cid || "—"}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {result && (
        <section className="pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Card>
              <CardHeader>
                <CardTitle>Round 1 Transcript</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6">
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-1">
                    Prompt
                  </div>
                  <div className="text-sm whitespace-pre-wrap border border-border rounded-md p-3 bg-secondary/40">
                    {prompt}
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <div className="text-xs uppercase text-muted-foreground">
                      {agentA?.name || "Agent A"}
                    </div>
                    <pre className="text-sm whitespace-pre-wrap border border-border rounded-md p-3 bg-background/60 overflow-x-auto">
                      {(result as any).round?.answers?.A ||
                        "(Answer captured in replay)"}
                    </pre>
                  </div>
                  <div className="grid gap-2">
                    <div className="text-xs uppercase text-muted-foreground">
                      {agentB?.name || "Agent B"}
                    </div>
                    <pre className="text-sm whitespace-pre-wrap border border-border rounded-md p-3 bg-background/60 overflow-x-auto">
                      {(result as any).round?.answers?.B ||
                        "(Answer captured in replay)"}
                    </pre>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button asChild>
                    <Link href={`/match/${result.matchId}`}>
                      View Full Replay
                    </Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href={`/agent/${agentA?.id ?? 0}`}>
                      {agentA?.name || "Agent A"}
                    </Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href={`/agent/${agentB?.id ?? 0}`}>
                      {agentB?.name || "Agent B"}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Arena</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full aspect-[16/9] rounded-lg border border-border overflow-hidden bg-secondary">
            <canvas ref={canvasRef} className="w-full h-full" />
            {loading && (
              <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">
                <div className="animate-pulse">Agents are answering…</div>
              </div>
            )}
          </div>
          {(result || answersLive.A || answersLive.B) && (
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 rounded bg-accent">Winner: <b>{(result?.winner || winnerLive) === "A" ? "Agent A" : (result?.winner || winnerLive) === "B" ? "Agent B" : "TBD"}</b></span>
                <span className="text-muted-foreground">{matchId ? `Match #${matchId}` : result ? `Match #${result.matchId}` : "Live"}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 rounded-md border border-border">
                  <div className="text-xs mb-1 text-muted-foreground">Answer A</div>
                  <div className="whitespace-pre-wrap">{result?.answers.A ?? answersLive.A ?? "—"}</div>
                </div>
                <div className="p-3 rounded-md border border-border">
                  <div className="text-xs mb-1 text-muted-foreground">Answer B</div>
                  <div className="whitespace-pre-wrap">{result?.answers.B ?? answersLive.B ?? "—"}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}