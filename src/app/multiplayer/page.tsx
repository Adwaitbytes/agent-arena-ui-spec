"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface Agent {
  id: number;
  name: string;
  promptProfile: string;
}

interface OrchestrateResponse {
  ok: boolean;
  data?: {
    matchId: number;
    round: any;
    cid: string | null;
    winner: "A" | "B";
  };
  error?: string | { fieldErrors?: Record<string, string[]> } | any;
}

export default function MultiplayerPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  const [mode, setMode] = useState<"boxing" | "cricket" | "carrom">("boxing");
  const [agentAId, setAgentAId] = useState<number | "">("");
  const [agentBId, setAgentBId] = useState<number | "">("");
  const [prompt, setPrompt] = useState("Write a 2-line roast about pineapple pizza.");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<OrchestrateResponse["data"] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        setLoadingAgents(true);
        const res = await fetch(`/api/agents?page=1&pageSize=100`, {
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        const json = await res.json();
        if (json?.ok) {
          setAgents(json.data.agents || []);
        } else {
          setError(json?.error || "Failed to load agents");
        }
      } catch (e: any) {
        setError(e?.message || "Failed to load agents");
      } finally {
        setLoadingAgents(false);
      }
    };
    fetchAgents();
  }, []);

  const agentA = useMemo(() => agents.find(a => a.id === agentAId), [agents, agentAId]);
  const agentB = useMemo(() => agents.find(a => a.id === agentBId), [agents, agentBId]);

  const handleRunMatch = async () => {
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch("/api/match/orchestrate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mode,
          agentAId: Number(agentAId),
          agentBId: Number(agentBId),
          prompt: prompt.trim(),
        }),
      });
      const json: OrchestrateResponse = await res.json();
      if (!json.ok) {
        const err = typeof json.error === "string" ? json.error : "Failed to orchestrate match";
        setError(err);
      } else {
        setResult(json.data!);
      }
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !!agentAId && !!agentBId && agentAId !== agentBId && prompt.trim().length > 0 && !submitting;

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      <section className="py-10 sm:py-14 border-b border-border bg-secondary/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Multiplayer Test Match</h1>
          <p className="mt-2 text-muted-foreground">Pick two agents, provide a prompt, and run an orchestrated round. The transcript is stored to IPFS when configured.</p>
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
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
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
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-1.5">
                <label className="text-sm text-muted-foreground">Prompt</label>
                <textarea
                  className="min-h-24 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>

              {error && (
                <div className="text-sm text-destructive">{error}</div>
              )}

              <div className="flex items-center gap-3">
                <Button onClick={handleRunMatch} disabled={!canSubmit}>
                  {submitting ? "Running..." : "Run Match"}
                </Button>
                <Button asChild variant="secondary">
                  <Link href="/onboarding">Create Agent</Link>
                </Button>
              </div>

              {submitting && (
                <div className="mt-2">
                  <div className="text-xs text-muted-foreground mb-1">Live</div>
                  <div className="relative h-2 overflow-hidden rounded bg-secondary">
                    <motion.div
                      className="absolute inset-y-0 left-0 w-1/3 bg-primary"
                      initial={{ x: "-100%" }}
                      animate={{ x: ["-100%", "120%"] }}
                      transition={{ duration: 1.2, ease: "easeInOut", repeat: Infinity }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outcome</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {!result && !submitting && <p className="text-muted-foreground">No result yet.</p>}
              {!result && submitting && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <motion.div className="size-2 rounded-full bg-primary" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, repeat: Infinity }} />
                  <span>Agents are answering...</span>
                </div>
              )}
              {result && (
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Match ID</span>
                    <Link className="underline" href={`/match/${result.matchId}`}>#{result.matchId}</Link>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Winner</span>
                    <motion.span
                      className="font-semibold px-2 py-0.5 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                    >
                      {result.winner === "A" ? agentA?.name || "A" : agentB?.name || "B"}
                    </motion.span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">IPFS CID</span>
                    <span className="font-mono text-xs">{result.cid || "—"}</span>
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
                  <div className="text-xs uppercase text-muted-foreground mb-1">Prompt</div>
                  <div className="text-sm whitespace-pre-wrap border border-border rounded-md p-3 bg-secondary/40">{prompt}</div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <div className="text-xs uppercase text-muted-foreground">{agentA?.name || "Agent A"}</div>
                    <pre className="text-sm whitespace-pre-wrap border border-border rounded-md p-3 bg-background/60 overflow-x-auto">{(result as any).round?.answers?.A || "(Answer captured in replay)"}</pre>
                  </div>
                  <div className="grid gap-2">
                    <div className="text-xs uppercase text-muted-foreground">{agentB?.name || "Agent B"}</div>
                    <pre className="text-sm whitespace-pre-wrap border border-border rounded-md p-3 bg-background/60 overflow-x-auto">{(result as any).round?.answers?.B || "(Answer captured in replay)"}</pre>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button asChild>
                    <Link href={`/match/${result.matchId}`}>View Full Replay</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href={`/agent/${agentA?.id ?? 0}`}>{agentA?.name || "Agent A"}</Link>
                  </Button>
                  <Button asChild variant="secondary">
                    <Link href={`/agent/${agentB?.id ?? 0}`}>{agentB?.name || "Agent B"}</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}
    </div>
  );
}