"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Agent = { id: number; name: string };

type OrchestrateResult = {
  ok: boolean;
  data?: {
    matchId: number;
    round: any;
    winner: "A" | "B";
    scores: { scoreA: number; scoreB: number };
    answers: { A: string; B: string };
  };
  error?: string;
};

export default function MultiplayerPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentA, setAgentA] = useState<number | "">("");
  const [agentB, setAgentB] = useState<number | "">("");
  const [prompt, setPrompt] = useState("Give a witty one-liner about space travel.");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OrchestrateResult["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Canvas animation state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const [liveScores, setLiveScores] = useState({ A: 0, B: 0 });
  const targetScores = useMemo(() => ({
    A: result?.scores.scoreA ?? 0,
    B: result?.scores.scoreB ?? 0,
  }), [result]);

  // Fetch agents list
  useEffect(() => {
    let mounted = true;
    const fetchAgents = async () => {
      try {
        const res = await fetch("/api/agents");
        const json = await res.json();
        if (!mounted) return;
        const list: Agent[] = (json?.data || json) as any;
        setAgents(list.map((a: any) => ({ id: a.id, name: a.name })));
      } catch (e) {
        // ignore
      }
    };
    fetchAgents();
    return () => { mounted = false; };
  }, []);

  // Orchestrate match
  const runMatch = async () => {
    setError(null);
    setResult(null);
    if (!agentA || !agentB || agentA === agentB) {
      setError("Pick two different agents.");
      return;
    }
    setLoading(true);
    setLiveScores({ A: 0, B: 0 });

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch("/api/match/orchestrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ agentAId: Number(agentA), agentBId: Number(agentB), prompt, mode: "duel" }),
      });
      const json: OrchestrateResult = await res.json();
      if (!json.ok) throw new Error(json.error || "Failed to run match");
      setResult(json.data!);
    } catch (e: any) {
      setError(e.message || "Internal error");
    } finally {
      setLoading(false);
    }
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

      // Ease live scores toward targets after result is available
      const targetA = targetScores.A;
      const targetB = targetScores.B;
      setLiveScores(prev => {
        const lerp = (from: number, to: number, rate: number) => from + (to - from) * rate;
        const nextA = lerp(prev.A, targetA, result ? 0.08 : 0.02);
        const nextB = lerp(prev.B, targetB, result ? 0.08 : 0.02);
        return { A: nextA, B: nextB };
      });

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background grid
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

      // Center line
      ctx.strokeStyle = "rgba(127,127,127,0.3)";
      ctx.setLineDash([8, 8]);
      ctx.beginPath(); ctx.moveTo(width/2, 0); ctx.lineTo(width/2, height); ctx.stroke();
      ctx.setLineDash([]);

      // Animated orbs for each agent
      const tSec = t / 1000;
      const orbY = (p: number) => height*0.5 + Math.sin(tSec * 2 + p) * height*0.15;
      const orbX_A = width*0.25 + Math.sin(tSec * 1.5) * width*0.05;
      const orbX_B = width*0.75 + Math.cos(tSec * 1.5) * width*0.05;

      // Glows
      const drawGlow = (x: number, y: number, color: string) => {
        const r = 28 * window.devicePixelRatio;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r*2);
        grad.addColorStop(0, color);
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, y, r*2, 0, Math.PI*2); ctx.fill();
      };
      drawGlow(orbX_A, orbY(0), "rgba(72,199,142,0.35)"); // chart-4-ish
      drawGlow(orbX_B, orbY(1), "rgba(103,132,255,0.35)"); // chart-3-ish

      // Orbs
      ctx.fillStyle = "#22c55e"; // A
      ctx.beginPath(); ctx.arc(orbX_A, orbY(0), 10*window.devicePixelRatio, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = "#6366f1"; // B
      ctx.beginPath(); ctx.arc(orbX_B, orbY(1), 10*window.devicePixelRatio, 0, Math.PI*2); ctx.fill();

      // Score meters at top
      const maxScore = Math.max(10, targetA, targetB);
      const meterW = width * 0.4;
      const meterH = 12 * window.devicePixelRatio;
      const pad = 12 * window.devicePixelRatio;

      // A meter (left)
      ctx.fillStyle = "rgba(34,197,94,0.15)"; ctx.fillRect(pad, pad, meterW, meterH);
      ctx.fillStyle = "#22c55e"; ctx.fillRect(pad, pad, meterW * (liveScores.A / maxScore), meterH);
      // B meter (right)
      ctx.fillStyle = "rgba(99,102,241,0.15)"; ctx.fillRect(width - pad - meterW, pad, meterW, meterH);
      ctx.fillStyle = "#6366f1"; ctx.fillRect(width - pad - meterW, pad, meterW * (liveScores.B / maxScore), meterH);

      // Winner banner
      if (result?.winner) {
        const text = result.winner === "A" ? "A Scores!" : "B Scores!";
        ctx.font = `${16 * window.devicePixelRatio}px system-ui, -apple-system, Segoe UI`;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.textAlign = "center";
        ctx.fillText(text, width/2, pad + meterH + 20 * window.devicePixelRatio);
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
  }, [result, targetScores]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid gap-6">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Multiplayer Arena</h1>

      <Card>
        <CardHeader>
          <CardTitle>Setup</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Agent A</span>
              <select
                className="h-10 rounded-md border border-border bg-background px-3"
                value={agentA}
                onChange={(e) => setAgentA(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Select agent…</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm">
              <span className="text-muted-foreground">Agent B</span>
              <select
                className="h-10 rounded-md border border-border bg-background px-3"
                value={agentB}
                onChange={(e) => setAgentB(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Select agent…</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Prompt</span>
            <textarea
              className="min-h-24 rounded-md border border-border bg-background px-3 py-2"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </label>

          <div className="flex items-center gap-3">
            <Button onClick={runMatch} disabled={loading || !agentA || !agentB}>Run Match</Button>
            {error && <span className="text-destructive text-sm">{error}</span>}
          </div>
        </CardContent>
      </Card>

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
          {result && (
            <div className="mt-4 grid gap-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="px-2 py-1 rounded bg-accent">Winner: <b>{result.winner === "A" ? "Agent A" : "Agent B"}</b></span>
                <span className="text-muted-foreground">Match #{result.matchId}</span>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div className="p-3 rounded-md border border-border">
                  <div className="text-xs mb-1 text-muted-foreground">Answer A</div>
                  <div className="whitespace-pre-wrap">{result.answers.A}</div>
                </div>
                <div className="p-3 rounded-md border border-border">
                  <div className="text-xs mb-1 text-muted-foreground">Answer B</div>
                  <div className="whitespace-pre-wrap">{result.answers.B}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}