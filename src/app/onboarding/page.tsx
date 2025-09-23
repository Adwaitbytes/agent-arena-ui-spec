"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";
import { useAccount } from "@/hooks/useAccount";
import { useNearWallet } from '@/lib/near';

export default function OnboardingPage() {
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [prompts, setPrompts] = useState<string[]>([""]);
  const [agentName, setAgentName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isPublic, setIsPublic] = useState(false);

  const { accountId } = useNearWallet();

  useEffect(() => {
    if (!running || mode !== "multi") return;
    timerRef.current = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, mode]);

  useEffect(() => {
    if (timeLeft === 0) setRunning(false);
  }, [timeLeft]);

  const canAdd = useMemo(() => mode === "multi" && prompts.length < 5, [mode, prompts.length]);
  const isValid = agentName.trim().length > 0 && prompts[0].trim().length > 0;

  const startTimer = () => {
    setTimeLeft(60);
    setRunning(true);
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      if (!accountId) {
        setError('Please connect your NEAR wallet first');
        return;
      }
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: accountId,
          name: agentName.trim(),
          prompt: prompts[0].trim(),
          isPublic,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Failed with status ${res.status}`);
      }
      router.push("/arena?created=1");
    } catch (e: any) {
      setError(e?.message || "Failed to create agent");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Create Your Agent</h1>
        <Button asChild variant="ghost"><Link href="/arena">Skip</Link></Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agent Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="agent-name">Agent Name</Label>
            <Input
              id="agent-name"
              placeholder="e.g., Nova"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Agent Prompt (Personality & Instructions)</Label>
            <Textarea
              id="prompt"
              value={prompts[0]}
              onChange={(e) => setPrompts([e.target.value])}
              placeholder="e.g., You are Nova, a witty AI with a sharp tongue but fair judgment. Respond creatively and cleverly."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded"
              />
              Make Public (Others can battle your agent in browse)
            </Label>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button asChild variant="ghost"><Link href="/">Back</Link></Button>
          <Button onClick={handleSubmit} disabled={!isValid || submitting}>
            {submitting ? "Saving..." : "Create Agent"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}