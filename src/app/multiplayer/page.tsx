"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
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

  // Realtime state
  const [matchId, setMatchId] = useState<number | null>(null);
  const [answersLive, setAnswersLive] = useState<{ A?: string; B?: string }>({});
  const [scoresLive, setScoresLive] = useState<{ scoreA?: number; scoreB?: number }>({});
  const [winnerLive, setWinnerLive] = useState<"A" | "B" | null>(null);
  const subsRef = useRef<Array<() => void>>([]);

  // Canvas animation state with enhanced effects
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
      }
    };
    fetchAgents();
    return () => { mounted = false; };
  }, []);

  // Clean up any prior subscriptions
  const clearSubs = () => {
    subsRef.current.forEach((fn) => fn());
    subsRef.current = [];
  };

  // Orchestrate match with realtime subscriptions
  const runMatch = async () => {
    setError(null);
    setResult(null);
    setAnswersLive({});
    setScoresLive({});
    setWinnerLive(null);
    setMatchId(null);
    clearSubs();

    if (!agentA || !agentB || agentA === agentB) {
      setError("Pick two different agents.");
      return;
    }
    setLoading(true);
    setLiveScores({ A: 0, B: 0 });

    // Subscribe to ticker to capture the matchId as soon as it starts
    const aId = Number(agentA);
    const bId = Number(agentB);
    const unsubTicker = ws.sub("ticker", (msg: any) => {
      if (msg?.type === "match_started" && msg?.a?.id === aId && msg?.b?.id === bId) {
        const id = Number(msg.matchId);
        setMatchId(id);
        // stop listening to ticker for this run
        unsubTicker();
        subsRef.current = subsRef.current.filter((fn) => fn !== unsubTicker);
        // subscribe to match channel
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
      // keep subs until user starts another match; they'll auto-close on server end
    }
  };

  // Enhanced Arena Canvas drawing with particle effects and glows
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let last = 0;
    const w = () => (canvas.width = canvas.clientWidth * window.devicePixelRatio);
    const h = () => (canvas.height = canvas.clientHeight * window.devicePixelRatio);
    w(); h();

    // Particle system for enhanced effects
    const particles = [];
    const addParticle = (x: number, y: number, color: string) => {
      particles.push({ x, y, vx: (Math.random() - 0.5) * 4, vy: (Math.random() - 0.5) * 4, life: 30, maxLife: 30, color });
    };

    const draw = (t: number) => {
      if (!ctx) return;
      if (!startTimeRef.current) startTimeRef.current = t;
      const dt = Math.min(32, t - (last || t));
      last = t;

      // Ease live scores toward targets after result or live scores are available
      const targetA = targetScores.A;
      const targetB = targetScores.B;
      setLiveScores(prev => {
        const lerp = (from: number, to: number, rate: number) => from + (to - from) * rate;
        const nextA = lerp(prev.A, targetA, (result || scoresLive.scoreA != null) ? 0.08 : 0.02);
        const nextB = lerp(prev.B, targetB, (result || scoresLive.scoreB != null) ? 0.08 : 0.02);
        return { A: nextA, B: nextB };
      });

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Enhanced Background grid with glow
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

      // Glowing center line
      ctx.strokeStyle = "rgba(99,102,241,0.4)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(99,102,241,0.5)";
      ctx.beginPath(); ctx.moveTo(width/2, 0); ctx.lineTo(width/2, height); ctx.stroke();
      ctx.setLineDash([]);
      ctx.shadowBlur = 0;

      // Animated orbs for each agent with particle trails
      const tSec = t / 1000;
      const orbY = (p: number) => height*0.5 + Math.sin(tSec * 2 + p) * height*0.15;
      const orbX_A = width*0.25 + Math.sin(tSec * 1.5) * width*0.05;
      const orbX_B = width*0.75 + Math.cos(tSec * 1.5) * width*0.05;

      // Add particles on movement
      if (Math.random() < 0.3) addParticle(orbX_A, orbY(0), "#22c55e");
      if (Math.random() < 0.3) addParticle(orbX_B, orbY(1), "#6366f1");

      // Enhanced Glows with multiple layers
      const drawGlow = (x: number, y: number, color: string, intensity = 1) => {
        const r = 28 * window.devicePixelRatio * intensity;
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r*2);
        grad.addColorStop(0, color);
        grad.addColorStop(0.5, color + "50");
        grad.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(x, y, r*2, 0, Math.PI*2); ctx.fill();
      };
      drawGlow(orbX_A, orbY(0), "rgba(34,197,94,0.4)", 1.2);
      drawGlow(orbX_B, orbY(1), "rgba(99,102,241,0.4)", 1.2);

      // Orbs with inner glow
      const drawOrb = (x: number, y: number, color: string, size: number) => {
        // Outer glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = color;
        ctx.fillStyle = color + "40";
        ctx.beginPath(); ctx.arc(x, y, size + 5, 0, Math.PI*2); ctx.fill();

        // Orb
        ctx.shadowBlur = 0;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, size, 0, Math.PI*2); ctx.fill();

        // Inner highlight
        const innerGrad = ctx.createRadialGradient(x - 3, y - 3, 0, x, y, size / 2);
        innerGrad.addColorStop(0, "rgba(255,255,255,0.3)");
        innerGrad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = innerGrad;
        ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI*2); ctx.fill();
      };
      drawOrb(orbX_A, orbY(0), "#22c55e", 10 * window.devicePixelRatio);
      drawOrb(orbX_B, orbY(1), "#6366f1", 10 * window.devicePixelRatio);

      // Update and draw particles
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;
        p.vy += 0.1; // gravity
      });
      particles.filter(p => p.life > 0).forEach(p => {
        ctx.globalAlpha = p.life / p.maxLife;
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI*2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      particles.splice(0, particles.length, ...particles.filter(p => p.life > 0));

      // Enhanced Score meters with gradients and glow
      const maxScore = Math.max(10, targetA, targetB);
      const meterW = width * 0.4;
      const meterH = 12 * window.devicePixelRatio;
      const pad = 12 * window.devicePixelRatio;

      // A meter (left) with gradient
      const aGrad = ctx.createLinearGradient(pad, pad, pad + meterW, pad);
      aGrad.addColorStop(0, "rgba(34,197,94,0.2)");
      aGrad.addColorStop(1, "rgba(34,197,94,0.05)");
      ctx.fillStyle = aGrad;
      ctx.fillRect(pad, pad, meterW, meterH);
      ctx.shadowBlur = 5;
      ctx.shadowColor = "#22c55e";
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(pad, pad, meterW * (liveScores.A / maxScore), meterH);
      ctx.shadowBlur = 0;

      // B meter (right) with gradient
      const bGrad = ctx.createLinearGradient(width - pad - meterW, pad, width - pad, pad);
      bGrad.addColorStop(0, "rgba(99,102,241,0.2)");
      bGrad.addColorStop(1, "rgba(99,102,241,0.05)");
      ctx.fillStyle = bGrad;
      ctx.fillRect(width - pad - meterW, pad, meterW, meterH);
      ctx.shadowBlur = 5;
      ctx.shadowColor = "#6366f1";
      ctx.fillStyle = "#6366f1";
      ctx.fillRect(width - pad - meterW, pad, meterW * (liveScores.B / maxScore), meterH);
      ctx.shadowBlur = 0;

      // Enhanced Winner banner with pulse animation
      const winnerShow = result?.winner || winnerLive;
      if (winnerShow) {
        const text = winnerShow === "A" ? "A Scores!" : "B Scores!";
        ctx.font = `${16 * window.devicePixelRatio}px system-ui, -apple-system, Segoe UI`;
        ctx.fillStyle = "rgba(255,255,255,0.95)";
        ctx.shadowBlur = 5;
        ctx.shadowColor = winnerShow === "A" ? "#22c55e" : "#6366f1";
        ctx.textAlign = "center";
        ctx.fillText(text, width/2, pad + meterH + 20 * window.devicePixelRatio);
        ctx.shadowBlur = 0;
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
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 lg:py-16 grid gap-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight flex items-center gap-3"
      >
        <Bot className="size-6 text-chart-4" />
        Multiplayer Arena
      </motion.div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-background/50 to-muted/50">
          <CardTitle className="flex items-center gap-2">Setup Battle</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-6">
          <div className="grid sm:grid-cols-2 gap-3">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="grid gap-1 text-sm"
            >
              <span className="text-muted-foreground">Agent A</span>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 focus:ring-2 focus:ring-chart-4/30 transition-all"
                value={agentA}
                onChange={(e) => setAgentA(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Select agent…</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="grid gap-1 text-sm"
            >
              <span className="text-muted-foreground">Agent B</span>
              <select
                className="h-10 rounded-md border border-border bg-background px-3 focus:ring-2 focus:ring-chart-4/30 transition-all"
                value={agentB}
                onChange={(e) => setAgentB(e.target.value ? Number(e.target.value) : "")}
              >
                <option value="">Select agent…</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </motion.div>
          </div>

          {/* Empty state hint when no agents */}
          {agents.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-muted-foreground py-4"
            >
              No agents found. Create one first in Onboarding.
            </motion.div>
          )}

          <motion.div whileHover={{ scale: 1.02 }} className="grid gap-1 text-sm">
            <span className="text-muted-foreground">Custom Prompt</span>
            <textarea
              className="min-h-24 rounded-md border border-border bg-background px-3 py-2 resize-none focus:ring-2 focus:ring-chart-4/30 transition-all"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your battle prompt..."
            />
          </motion.div>

          <motion.div whileHover={{ scale: 1.02 }} className="flex items-center gap-3">
            <Button 
              onClick={runMatch} 
              disabled={loading || !agentA || !agentB}
              className="bg-gradient-to-r from-chart-4 to-chart-3 hover:from-chart-4/90 shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Bot className="mr-2 h-4 w-4" />}
              {loading ? "Orchestrating..." : "Run Match"}
            </Button>
            {error && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-destructive text-sm flex items-center gap-1"
              >
                <AlertCircle className="h-4 w-4" />
                {error}
              </motion.span>
            )}
          </motion.div>
        </CardContent>
      </Card>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="grid lg:grid-cols-2 gap-6"
      >
        <Card className="overflow-hidden relative">
          <CardHeader className="bg-gradient-to-br from-background/50 to-muted/50 relative z-10">
            <CardTitle className="flex items-center gap-2">Live Arena</CardTitle>
          </CardHeader>
          <CardContent className="relative p-0">
            <div className={`w-full aspect-[16/9] rounded-lg border border-border overflow-hidden bg-secondary/50 relative ${loading ? 'animate-pulse' : ''}`}>
              <canvas ref={canvasRef} className="w-full h-full" />
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 grid place-items-center text-sm text-muted-foreground bg-black/20 backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2 animate-pulse">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Agents battling...
                  </div>
                </motion.div>
              )}
              {/* Overlay stats */}
              {(result || answersLive.A || answersLive.B) && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-4 left-4 right-4 z-10"
                >
                  <div className="flex items-center justify-between bg-background/90 backdrop-blur-sm rounded-lg p-3">
                    <span className="px-2 py-1 rounded bg-accent/80 text-background font-medium text-sm">
                      Winner: <b>{(result?.winner || winnerLive) === "A" ? "Agent A" : (result?.winner || winnerLive) === "B" ? "Agent B" : "TBD"}</b>
                    </span>
                    <span className="text-muted-foreground text-sm">{matchId ? `Match #${matchId}` : result ? `Match #${result.matchId}` : "Live"}</span>
                  </div>
                </motion.div>
              )}
            </div>
            {(result || answersLive.A || answersLive.B) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 grid gap-2 text-sm"
              >
                <div className="grid md:grid-cols-2 gap-3">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-3 rounded-md border border-border bg-gradient-to-b from-background to-muted/50"
                  >
                    <div className="text-xs mb-1 text-muted-foreground flex items-center gap-2">
                      <Bot className="size-3 text-chart-4" />
                      Answer A
                    </div>
                    <div className="whitespace-pre-wrap text-foreground font-medium">{result?.answers.A ?? answersLive.A ?? "—"}</div>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className="p-3 rounded-md border border-border bg-gradient-to-b from-background to-muted/50"
                  >
                    <div className="text-xs mb-1 text-muted-foreground flex items-center gap-2">
                      <Bot className="size-3 text-chart-3" />
                      Answer B
                    </div>
                    <div className="whitespace-pre-wrap text-foreground font-medium">{result?.answers.B ?? answersLive.B ?? "—"}</div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Agent Stats Sidebar */}
        <Card>
          <CardHeader className="bg-gradient-to-br from-background/50 to-muted/50">
            <CardTitle>Agent Stats</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {agentA && agents.find(a => a.id === Number(agentA)) && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-accent/10 border border-accent/20"
              >
                <h4 className="font-medium text-sm mb-1">Agent A: {agents.find(a => a.id === Number(agentA))?.name}</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <span>Ready for battle</span>
                  <span className="flex justify-between">
                    <span>Score:</span>
                    <span className="font-medium">{liveScores.A}</span>
                  </span>
                </div>
              </motion.div>
            )}
            {agentB && agents.find(a => a.id === Number(agentB)) && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <h4 className="font-medium text-sm mb-1">Agent B: {agents.find(a => a.id === Number(agentB))?.name}</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <span>Ready for battle</span>
                  <span className="flex justify-between">
                    <span>Score:</span>
                    <span className="font-medium">{liveScores.B}</span>
                  </span>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}