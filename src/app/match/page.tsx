"use client";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const ROUNDS = 3;

export default function MatchPage() {
  const params = useSearchParams();
  const mode = params.get("mode") ?? "roast";
  const [round, setRound] = useState(1);
  const [evaluations, setEvaluations] = useState<number[]>([]);
  const [roundCids, setRoundCids] = useState<string[]>([]);
  const [agents, setAgents] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [matchId, setMatchId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(false);
  const [finishMsg, setFinishMsg] = useState<string | null>(null);
  const [intentLoading, setIntentLoading] = useState(false);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [intentUrl, setIntentUrl] = useState<string | null>(null);

  const prompt = useMemo(() => {
    switch (mode) {
      case "writing":
        return "Write a 60-word cyberpunk haiku trilogy about neon rain.";
      case "duel":
        return "Debate: Are AIs better judges than humans? Provide 2 arguments each.";
      default:
        return "Roast: A toaster that thinks it's a philosopher.";
    }
  }, [mode]);

  // Map UI mode to backend mode
  const backendMode: "boxing" | "cricket" | "carrom" = useMemo(() => {
    if (mode === "writing") return "cricket";
    if (mode === "duel") return "carrom";
    return "boxing"; // roast -> boxing
  }, [mode]);

  // Load agents for selection
  useEffect(() => {
    const loadAgents = async () => {
      try {
        setError(null);
        const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
        const res = await fetch(`/api/agents?page=1&pageSize=20`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await res.json();
        if (!res.ok || !json?.ok) throw new Error(json?.error || `Failed ${res.status}`);
        const list: Array<{ id: number; name: string }> = (json.data?.agents || []).map((a: any) => ({ id: a.id, name: a.name }));
        setAgents(list);
        if (list.length && !selectedAgentId) setSelectedAgentId(list[0].id);
      } catch (e: any) {
        setError(e?.message || "Failed to load agents");
      }
    };
    loadAgents();
  }, [selectedAgentId]);

  const startMatch = useCallback(async () => {
    if (!selectedAgentId) {
      setError("Select an agent to start");
      return null;
    }
    setLoading(true);
    setError(null);
    setFinished(false);
    setFinishMsg(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch("/api/match/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ mode: backendMode, agentIds: [selectedAgentId] }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Failed ${res.status}`);
      setMatchId(json.data.matchId as number);
      setRound(1);
      setEvaluations([]);
      setRoundCids([]);
      return json.data.matchId as number;
    } catch (e: any) {
      setError(e?.message || "Failed to start match");
      return null;
    } finally {
      setLoading(false);
    }
  }, [backendMode, selectedAgentId]);

  const nextRound = () => {
    if (round < ROUNDS) setRound((r) => r + 1);
  };

  const judgeNow = useCallback(async () => {
    // If match not started yet, start it first
    let id = matchId;
    if (!id) {
      id = await startMatch();
      if (!id) return;
      setMatchId(id);
    }
    setLoading(true);
    setError(null);
    try {
      // Mock evaluation 60-100 for UI, but also persist a round on backend
      const score = Math.floor(60 + Math.random() * 40);
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch(`/api/match/${id}/round`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          idx: evaluations.length,
          question: prompt,
          resultSummary: `Alpha scored ${score}/100 vs CPU`,
          // judgeScores/ipfsCid can be added later when judge/pin is ready
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Failed ${res.status}`);
      setEvaluations((arr) => [...arr, score]);
      setRoundCids((arr) => [...arr, json?.data?.ipfsCid || ""]);
    } catch (e: any) {
      setError(e?.message || "Failed to judge round");
    } finally {
      setLoading(false);
    }
  }, [matchId, startMatch, evaluations.length, prompt]);

  const finishMatch = useCallback(async () => {
    if (finished) return;
    // Ensure there is a match
    let id = matchId;
    if (!id) {
      id = await startMatch();
      if (!id) return;
      setMatchId(id);
    }
    setFinishing(true);
    setError(null);
    setFinishMsg(null);
    try {
      const avg = evaluations.length ? Math.round(evaluations.reduce((a, b) => a + b, 0) / evaluations.length) : 0;
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch(`/api/match/${id}/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ summary: `Finished ${evaluations.length} rounds. Avg score ${avg}.` }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Failed ${res.status}`);
      setFinished(true);
      setFinishMsg(`Match #${id} finished. Avg score ${avg}.`);
    } catch (e: any) {
      setError(e?.message || "Failed to finish match");
    } finally {
      setFinishing(false);
    }
  }, [evaluations, finished, matchId, startMatch]);

  const createClaimIntent = useCallback(async () => {
    setIntentLoading(true);
    setIntentError(null);
    setIntentUrl(null);
    try {
      // Ensure there is a match id
      let id = matchId;
      if (!id) {
        id = await startMatch();
        if (!id) return;
        setMatchId(id);
      }
      const res = await fetch("/api/near/intent/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "claim", matchId: id }),
      });
      const json = await res.json();
      if (res.status === 501) {
        setIntentError("NEAR Intents not configured. Set NEAR_NETWORK and NEAR_INTENTS_BASE_URL on server.");
        return;
      }
      if (!res.ok || !json?.ok) throw new Error(json?.error || `Failed ${res.status}`);
      setIntentUrl(json.data?.url || null);
    } catch (e: any) {
      setIntentError(e?.message || "Failed to create intent");
    } finally {
      setIntentLoading(false);
    }
  }, [matchId, startMatch]);

  const copyCid = (cid: string) => {
    if (!cid) return;
    navigator?.clipboard?.writeText(cid).catch(() => {});
  };

  const progress = (evaluations.length / ROUNDS) * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight capitalize">{mode} match</h1>
        <div className="text-sm text-muted-foreground">Round {Math.min(round, ROUNDS)} / {ROUNDS}</div>
      </div>

      {/* Agent selector + start */}
      <Card>
        <CardHeader>
          <CardTitle>Select Agent</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <select
            className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            value={selectedAgentId ?? ""}
            onChange={(e) => setSelectedAgentId(Number(e.target.value))}
            disabled={finished}
          >
            {agents.length === 0 && <option value="">No agents found</option>}
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
          <Button onClick={startMatch} disabled={loading || !selectedAgentId || finished}>Start Match</Button>
          {matchId && <div className="text-xs text-muted-foreground">Match #{matchId}</div>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Challenge Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-md border bg-secondary/50 text-sm">{prompt}</div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Agent Alpha</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              {mode === "writing" ? (
                <p>Neon veins hum. Rain stitches light. Alley cats wear halos.</p>
              ) : mode === "duel" ? (
                <ul className="list-disc pl-5"><li>AI judges are consistent and tireless.</li><li>But lack human empathy and context.</li></ul>
              ) : (
                <p>You're so deep, even the bread's confused. Crumbs are filing a complaint.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Beta (CPU)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
              {mode === "writing" ? (
                <p>Billboards cry chrome. Umbrellas bloom like circuits. Midnight drinks the glow.</p>
              ) : mode === "duel" ? (
                <ul className="list-disc pl-5"><li>Humans weigh nuance and culture.</li><li>But can be biased and inconsistent.</li></ul>
              ) : (
                <p>If sizzling thoughts were toast, you'd still be half-baked enlightenment.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Judge Evaluation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {error && <div className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-destructive">{error}</div>}
          {finishMsg && <div className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm">{finishMsg}</div>}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            {evaluations.map((s, i) => (
              <div key={i} className="p-3 rounded-md border space-y-1">
                <div className="flex items-center justify-between">
                  <span>Round {i + 1}</span>
                  <span className="font-semibold">{s}/100</span>
                </div>
                {roundCids[i] && (
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="truncate max-w-[12rem]" title={roundCids[i]}>CID: {roundCids[i]}</span>
                    <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => copyCid(roundCids[i])}>Copy</Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button onClick={judgeNow} disabled={loading || evaluations.length >= round || finished}> {loading ? "Judging..." : "Judge Round"} </Button>
          <Button variant="secondary" onClick={nextRound} disabled={round >= ROUNDS || finished}>Next Round</Button>
          <Button variant="ghost" onClick={finishMatch} disabled={evaluations.length < ROUNDS || finishing || finished}>{finishing ? "Finishing..." : finished ? "Finished" : "Finish & View Result"}</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NEAR Prize Intent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {intentError && <div className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-destructive">{intentError}</div>}
          {intentUrl ? (
            <div className="flex items-center justify-between gap-3">
              <span className="truncate" title={intentUrl}>Intent URL ready</span>
              <a href={intentUrl} target="_blank" rel="noopener noreferrer" className="inline-flex">
                <Button size="sm">Open</Button>
              </a>
            </div>
          ) : (
            <p className="text-muted-foreground">Create a claim intent to proceed with payout (demo).</p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={createClaimIntent} disabled={intentLoading}>{intentLoading ? "Creating..." : "Create Claim Intent"}</Button>
        </CardFooter>
      </Card>
    </div>
  );
}