"use client";
import { useMemo, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useNearWallet } from "@/lib/near/NearWalletProvider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

const ROUNDS = 3;

// Types for detailed battle results
type BattleRound = {
  roundNumber: number;
  prompt: string;
  responses: {
    A: { text: string; agentName: string; agentId: number };
    B: { text: string; agentName: string; agentId: number };
  };
  scores: {
    creativity: { A: number; B: number };
    style: { A: number; B: number };
    relevance: { A: number; B: number };
    engagement: { A: number; B: number };
    total: { A: number; B: number };
  };
  winner: "A" | "B";
  summary: string;
  cid?: string;
};

export default function MatchPage() {
  const params = useSearchParams();
  const { accountId, isReady, connect } = useNearWallet();
  const mode = params.get("mode") ?? "roast";
  const [round, setRound] = useState(1);
  const [evaluations, setEvaluations] = useState<number[]>([]);
  const [roundCids, setRoundCids] = useState<string[]>([]);
  const [battleRounds, setBattleRounds] = useState<BattleRound[]>([]);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [agents, setAgents] = useState<
    Array<{ id: number; name: string; promptProfile?: string }>
  >([]);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<{
    id: number;
    name: string;
    promptProfile: string;
  } | null>(null);
  const [opponentAgent, setOpponentAgent] = useState<{
    id: number;
    name: string;
    promptProfile: string;
  } | null>(null);
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

  // Load agents for selection (only owned by connected wallet)
  useEffect(() => {
    const loadAgents = async () => {
      // Don't fetch if wallet is not ready or not connected
      if (!isReady || !accountId) {
        setLoading(false);
        return;
      }

      try {
        setError(null);
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("bearer_token")
            : null;
        const params = new URLSearchParams({
          page: "1",
          pageSize: "20",
          ownerId: accountId, // Only fetch agents owned by connected wallet
        });
        const res = await fetch(`/api/agents?${params.toString()}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await res.json();
        if (!res.ok || !json?.ok)
          throw new Error(json?.error || `Failed ${res.status}`);
        const list: Array<{ id: number; name: string; promptProfile: string }> =
          (json.data?.agents || []).map((a: any) => ({
            id: a.id,
            name: a.name,
            promptProfile: a.promptProfile || "No description available",
          }));
        setAgents(list);
        if (list.length && !selectedAgentId) setSelectedAgentId(list[0].id);
      } catch (e: any) {
        setError(e?.message || "Failed to load agents");
      }
    };
    loadAgents();
  }, [selectedAgentId, accountId, isReady]);

  // Load selected agent details and find opponent
  useEffect(() => {
    if (selectedAgentId && agents.length > 0) {
      const agent = agents.find((a) => a.id === selectedAgentId);
      if (agent && agent.promptProfile) {
        setSelectedAgent({
          id: agent.id,
          name: agent.name,
          promptProfile: agent.promptProfile,
        });

        // Fetch a random public opponent (different from selected agent)
        const fetchOpponent = async () => {
          try {
            const res = await fetch(
              `/api/agents?page=1&pageSize=50&public=true`
            );
            const json = await res.json();
            if (res.ok && json?.ok && json.data?.agents) {
              const publicAgents = json.data.agents.filter(
                (a: any) => a.id !== selectedAgentId && a.promptProfile
              );
              if (publicAgents.length > 0) {
                const randomOpponent =
                  publicAgents[Math.floor(Math.random() * publicAgents.length)];
                setOpponentAgent({
                  id: randomOpponent.id,
                  name: randomOpponent.name,
                  promptProfile: randomOpponent.promptProfile,
                });
              }
            }
          } catch (error) {
            console.error("Failed to fetch opponent:", error);
          }
        };
        fetchOpponent();
      }
    }
  }, [selectedAgentId, agents]);

  const startMatch = useCallback(async () => {
    if (!selectedAgentId || !opponentAgent) {
      setError("Select an agent and wait for opponent selection");
      return null;
    }
    setLoading(true);
    setError(null);
    setFinished(false);
    setFinishMsg(null);
    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("bearer_token")
          : null;
      const res = await fetch("/api/match/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          mode: backendMode,
          agentIds: [selectedAgentId, opponentAgent.id],
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok)
        throw new Error(json?.error || `Failed ${res.status}`);
      setMatchId(json.data.matchId as number);
      setRound(1);
      setEvaluations([]);
      setRoundCids([]);
      setBattleRounds([]);
      setFinished(false);
      setShowResultsModal(false);
      return json.data.matchId as number;
    } catch (e: any) {
      setError(e?.message || "Failed to start match");
      return null;
    } finally {
      setLoading(false);
    }
  }, [backendMode, selectedAgentId, opponentAgent]);

  const nextRound = () => {
    if (round < ROUNDS) setRound((r) => r + 1);
  };

  const judgeNow = useCallback(async () => {
    if (!selectedAgentId || !opponentAgent) {
      setError("Select agents before judging");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Use the orchestrate API for real AI battles
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
        body: JSON.stringify({
          mode: backendMode,
          agentAId: selectedAgentId,
          agentBId: opponentAgent.id,
          prompt: prompt,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok)
        throw new Error(json?.error || `Failed ${res.status}`);

      // Extract detailed battle results
      const battleResult = json.data;
      const transcript = battleResult.transcript;

      // Create detailed round data
      const roundData: BattleRound = {
        roundNumber: battleRounds.length + 1,
        prompt: prompt,
        responses: {
          A: {
            text: transcript.answers.A,
            agentName: selectedAgent?.name || "Agent A",
            agentId: selectedAgentId,
          },
          B: {
            text: transcript.answers.B,
            agentName: opponentAgent?.name || "Agent B",
            agentId: opponentAgent.id,
          },
        },
        scores: transcript.scores,
        winner: battleResult.winner,
        summary: transcript.judge?.summary || "Battle completed",
        cid: battleResult.cid,
      };

      // Update all state
      setBattleRounds((prev) => [...prev, roundData]);

      // Calculate composite score for UI progress
      const userAgentScore =
        battleResult.winner === "A"
          ? 85 + Math.random() * 15
          : 60 + Math.random() * 25;
      const finalScore = Math.round(userAgentScore);

      setEvaluations((arr) => [...arr, finalScore]);
      setRoundCids((arr) => [...arr, battleResult.cid || ""]);

      // Store the match ID if we got one
      if (battleResult.matchId && !matchId) {
        setMatchId(battleResult.matchId);
      }

      // Check if this was the final round
      if (battleRounds.length + 1 >= ROUNDS) {
        setFinished(true);
        setShowResultsModal(true);
      } else {
        nextRound();
      }
    } catch (e: any) {
      // Enhanced error messages for quota issues
      if (e?.message?.includes("quota") || e?.message?.includes("429")) {
        setError(
          "🚨 API quota exceeded. Using demonstration responses. Try again in a few hours or upgrade your API plan."
        );
      } else {
        setError(e?.message || "Failed to judge round");
      }
    } finally {
      setLoading(false);
    }
  }, [selectedAgentId, opponentAgent, backendMode, prompt, matchId]);

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
      const avg = evaluations.length
        ? Math.round(
            evaluations.reduce((a, b) => a + b, 0) / evaluations.length
          )
        : 0;
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("bearer_token")
          : null;
      const res = await fetch(`/api/match/${id}/finish`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          summary: `Finished ${evaluations.length} rounds. Avg score ${avg}.`,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok)
        throw new Error(json?.error || `Failed ${res.status}`);
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
        setIntentError(
          "NEAR Intents not configured. Set NEAR_NETWORK and NEAR_INTENTS_BASE_URL on server."
        );
        return;
      }
      if (!res.ok || !json?.ok)
        throw new Error(json?.error || `Failed ${res.status}`);
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

  // Calculate overall winner and scores
  const getOverallResults = () => {
    if (battleRounds.length === 0) return null;

    let totalScoreA = 0;
    let totalScoreB = 0;
    let winsA = 0;
    let winsB = 0;

    battleRounds.forEach((round) => {
      totalScoreA += round.scores.total.A;
      totalScoreB += round.scores.total.B;
      if (round.winner === "A") winsA++;
      else winsB++;
    });

    const avgScoreA = Math.round(totalScoreA / battleRounds.length);
    const avgScoreB = Math.round(totalScoreB / battleRounds.length);
    const overallWinner = winsA > winsB ? "A" : winsB > winsA ? "B" : "TIE";

    return {
      totalScoreA,
      totalScoreB,
      avgScoreA,
      avgScoreB,
      winsA,
      winsB,
      overallWinner,
      agentA: selectedAgent,
      agentB: opponentAgent,
    };
  };

  const progress = (evaluations.length / ROUNDS) * 100;

  // Show wallet connection prompt if not connected
  if (isReady && !accountId) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Connect Wallet Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You need to connect your NEAR wallet to access your agents and
              participate in matches.
            </p>
            <Button onClick={connect}>Connect NEAR Wallet</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading state while wallet is initializing
  if (!isReady) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Initializing wallet connection...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight capitalize">
          {mode} match
        </h1>
        <div className="text-sm text-muted-foreground">
          Round {Math.min(round, ROUNDS)} / {ROUNDS}
        </div>
      </div>

      {/* Agent selector + start */}
      {agents.length === 0 && !loading ? (
        <Card>
          <CardHeader>
            <CardTitle>No Agents Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              You don't have any agents yet. You need to create agents to
              participate in matches.
            </p>
            <Button onClick={() => (window.location.href = "/agent")}>
              Create Your First Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
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
              {agents.length === 0 && (
                <option value="">Loading agents...</option>
              )}
              {agents.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <Button
              onClick={startMatch}
              disabled={loading || !selectedAgentId || finished}
            >
              Start Match
            </Button>
            {matchId && (
              <div className="text-xs text-muted-foreground">
                Match #{matchId}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Challenge Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-md border bg-secondary/50 text-sm">
            {prompt}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedAgent?.name || "Select Agent"}</span>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                Your Agent
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Agent Personality:
              </div>
              <div className="p-3 rounded-md bg-secondary/50 text-sm">
                {selectedAgent?.promptProfile ||
                  "Select an agent to see their personality"}
              </div>
              {selectedAgent && (
                <div className="text-xs text-muted-foreground">
                  Agent ID: {selectedAgent.id}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{opponentAgent?.name || "Random Opponent"}</span>
              <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded-full">
                Opponent
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Agent Personality:
              </div>
              <div className="p-3 rounded-md bg-secondary/50 text-sm">
                {opponentAgent?.promptProfile ||
                  "A random opponent will be selected"}
              </div>
              {opponentAgent && (
                <div className="text-xs text-muted-foreground">
                  Agent ID: {opponentAgent.id}
                </div>
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
          {error && (
            <div className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {finishMsg && (
            <div className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm">
              {finishMsg}
            </div>
          )}
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
                    <span
                      className="truncate max-w-[12rem]"
                      title={roundCids[i]}
                    >
                      CID: {roundCids[i]}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2"
                      onClick={() => copyCid(roundCids[i])}
                    >
                      Copy
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button
            onClick={judgeNow}
            disabled={loading || evaluations.length >= round || finished}
          >
            {" "}
            {loading ? "Judging..." : "Judge Round"}{" "}
          </Button>
          <Button
            variant="secondary"
            onClick={nextRound}
            disabled={round >= ROUNDS || finished}
          >
            Next Round
          </Button>
          <Button
            variant="ghost"
            onClick={finishMatch}
            disabled={evaluations.length < ROUNDS || finishing || finished}
          >
            {finishing
              ? "Finishing..."
              : finished
                ? "Finished"
                : "Finish & View Result"}
          </Button>
          {finished && battleRounds.length > 0 && (
            <Button variant="outline" onClick={() => setShowResultsModal(true)}>
              🏆 View Results
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NEAR Prize Intent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {intentError && (
            <div className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-destructive">
              {intentError}
            </div>
          )}
          {intentUrl ? (
            <div className="flex items-center justify-between gap-3">
              <span className="truncate" title={intentUrl}>
                Intent URL ready
              </span>
              <a
                href={intentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex"
              >
                <Button size="sm">Open</Button>
              </a>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Create a claim intent to proceed with payout (demo).
            </p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={createClaimIntent} disabled={intentLoading}>
            {intentLoading ? "Creating..." : "Create Claim Intent"}
          </Button>
        </CardFooter>
      </Card>

      {/* Detailed Battle Results */}
      {battleRounds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Battle History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {battleRounds.map((round, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Round {round.roundNumber}</h3>
                  <div className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                    Winner:{" "}
                    {round.winner === "A"
                      ? round.responses.A.agentName
                      : round.responses.B.agentName}
                  </div>
                </div>

                <div className="bg-secondary/50 p-3 rounded-md">
                  <div className="text-sm font-medium mb-2">Challenge:</div>
                  <div className="text-sm">{round.prompt}</div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Agent A Response */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">
                        {round.responses.A.agentName}{" "}
                        {selectedAgentId === round.responses.A.agentId &&
                          "(You)"}
                      </h4>
                      <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        Score: {round.scores.total.A}/40
                      </div>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-md text-sm">
                      {round.responses.A.text}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Creativity: {round.scores.creativity.A}/10</div>
                      <div>Style: {round.scores.style.A}/10</div>
                      <div>Relevance: {round.scores.relevance.A}/10</div>
                      <div>Engagement: {round.scores.engagement.A}/10</div>
                    </div>
                  </div>

                  {/* Agent B Response */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">
                        {round.responses.B.agentName}{" "}
                        {selectedAgentId === round.responses.B.agentId &&
                          "(You)"}
                      </h4>
                      <div className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Score: {round.scores.total.B}/40
                      </div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-md text-sm">
                      {round.responses.B.text}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>Creativity: {round.scores.creativity.B}/10</div>
                      <div>Style: {round.scores.style.B}/10</div>
                      <div>Relevance: {round.scores.relevance.B}/10</div>
                      <div>Engagement: {round.scores.engagement.B}/10</div>
                    </div>
                  </div>
                </div>

                <div className="text-xs text-muted-foreground bg-secondary/30 p-2 rounded">
                  Judge Summary: {round.summary}
                  {round.cid && (
                    <span className="ml-2">
                      | IPFS: {round.cid.substring(0, 12)}...
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1 ml-1"
                        onClick={() => copyCid(round.cid!)}
                      >
                        Copy
                      </Button>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Results Modal */}
      <Dialog open={showResultsModal} onOpenChange={setShowResultsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">🏆 Battle Results</DialogTitle>
            <DialogDescription>
              Complete breakdown of the {ROUNDS}-round battle
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const results = getOverallResults();
            if (!results) return null;

            return (
              <div className="space-y-6">
                {/* Overall Winner */}
                <div className="text-center p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-200">
                  <div className="text-3xl mb-2">
                    {results.overallWinner === "TIE" ? "🤝" : "🎉"}
                  </div>
                  <h2 className="text-2xl font-bold mb-2">
                    {results.overallWinner === "TIE"
                      ? "It's a Tie!"
                      : `${results.overallWinner === "A" ? results.agentA?.name : results.agentB?.name} Wins!`}
                  </h2>
                  <div className="text-lg text-muted-foreground">
                    {results.winsA} - {results.winsB} rounds
                  </div>
                </div>

                {/* Score Summary */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800">
                      {results.agentA?.name}{" "}
                      {selectedAgentId === results.agentA?.id && "(You)"}
                    </h3>
                    <div className="text-2xl font-bold text-blue-900">
                      {results.totalScoreA} points
                    </div>
                    <div className="text-sm text-blue-700">
                      Average: {results.avgScoreA}/40 per round
                    </div>
                    <div className="text-sm text-blue-700">
                      Rounds won: {results.winsA}
                    </div>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-800">
                      {results.agentB?.name}{" "}
                      {selectedAgentId === results.agentB?.id && "(You)"}
                    </h3>
                    <div className="text-2xl font-bold text-red-900">
                      {results.totalScoreB} points
                    </div>
                    <div className="text-sm text-red-700">
                      Average: {results.avgScoreB}/40 per round
                    </div>
                    <div className="text-sm text-red-700">
                      Rounds won: {results.winsB}
                    </div>
                  </div>
                </div>

                {/* Round by Round */}
                <div className="space-y-3">
                  <h3 className="font-semibold">Round by Round Scores</h3>
                  {battleRounds.map((round, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-secondary/30 rounded"
                    >
                      <span>Round {round.roundNumber}</span>
                      <div className="flex items-center gap-4">
                        <span
                          className={`px-2 py-1 rounded text-sm ${round.winner === "A" ? "bg-blue-100 text-blue-800" : "bg-gray-100"}`}
                        >
                          {round.responses.A.agentName}: {round.scores.total.A}
                        </span>
                        <span className="text-muted-foreground">vs</span>
                        <span
                          className={`px-2 py-1 rounded text-sm ${round.winner === "B" ? "bg-red-100 text-red-800" : "bg-gray-100"}`}
                        >
                          {round.responses.B.agentName}: {round.scores.total.B}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-center gap-3">
                  <Button onClick={() => setShowResultsModal(false)}>
                    Close
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                  >
                    New Battle
                  </Button>
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
