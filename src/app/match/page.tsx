"use client";
import { useMemo, useState } from "react";
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

  const nextRound = () => {
    if (round < ROUNDS) setRound((r) => r + 1);
  };

  const judgeNow = () => {
    // Mock evaluation 60-100
    const score = Math.floor(60 + Math.random() * 40);
    setEvaluations((arr) => [...arr, score]);
  };

  const progress = (evaluations.length / ROUNDS) * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight capitalize">{mode} match</h1>
        <div className="text-sm text-muted-foreground">Round {Math.min(round, ROUNDS)} / {ROUNDS}</div>
      </div>

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
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} />
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            {evaluations.map((s, i) => (
              <div key={i} className="p-3 rounded-md border flex items-center justify-between">
                <span>Round {i + 1}</span>
                <span className="font-semibold">{s}/100</span>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={judgeNow} disabled={evaluations.length >= round}>Judge Round</Button>
          <Button variant="secondary" onClick={nextRound} disabled={round >= ROUNDS}>Next Round</Button>
          <Button variant="ghost" disabled={evaluations.length < ROUNDS}>Finish & View Result</Button>
        </CardFooter>
      </Card>
    </div>
  );
}