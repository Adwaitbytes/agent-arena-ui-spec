"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { useRouter, useSearchParams } from "next/navigation";
import { useNearWallet } from "@/lib/near/NearWalletProvider";

export default function OnboardingPage() {
  const { accountId } = useNearWallet();
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditing = !!editId;

  const [mode, setMode] = useState<"single" | "multi">("single");
  const [prompts, setPrompts] = useState<string[]>([""]);
  const [agentName, setAgentName] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [running, setRunning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!running || mode !== "multi") return;
    timerRef.current = setInterval(
      () => setTimeLeft((t) => Math.max(0, t - 1)),
      1000
    );
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [running, mode]);

  useEffect(() => {
    if (timeLeft === 0) setRunning(false);
  }, [timeLeft]);

  // Load agent data when editing
  useEffect(() => {
    if (isEditing && editId) {
      const fetchAgent = async () => {
        setLoading(true);
        try {
          const res = await fetch(`/api/agents/${editId}`);
          const json = await res.json();
          if (res.ok && json.ok && json.data) {
            const agent = json.data;
            setAgentName(agent.name);
            setPrompts([agent.promptProfile, ...(agent.memorySnippets || [])]);
            setIsPublic(agent.isPublic || false);
          } else {
            setError("Failed to load agent data");
          }
        } catch (e) {
          setError("Failed to load agent data");
        } finally {
          setLoading(false);
        }
      };
      fetchAgent();
    }
  }, [isEditing, editId]);

  const canAdd = useMemo(
    () => mode === "multi" && prompts.length < 5,
    [mode, prompts.length]
  );
  const isValid = useMemo(
    () => agentName.trim().length > 0 && prompts[0]?.trim().length > 0,
    [agentName, prompts]
  );

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
        setError("Please connect your NEAR wallet first");
        return;
      }
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("bearer_token")
          : null;

      const url = isEditing ? `/api/agents/${editId}` : "/api/agents";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          userId: accountId,
          name: agentName.trim(),
          promptProfile: prompts[0].trim(),
          memorySnippets: prompts
            .slice(1)
            .map((p) => p)
            .filter((p) => p.trim().length > 0),
          ownerAccountId: accountId,
          isPublic,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Failed with status ${res.status}`);
      }
      // Navigate to agents list
      router.push(isEditing ? "/agent?updated=1" : "/arena?created=1");
    } catch (e: any) {
      setError(
        e?.message || `Failed to ${isEditing ? "update" : "create"} agent`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading agent data...</p>
          </div>
        </div>
      )}

      {!loading && (
        <>
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {isEditing ? "Edit Your Agent" : "Create Your Agent"}
            </h1>
            <Button asChild variant="ghost">
              <Link href={isEditing ? "/agent" : "/arena"}>
                {isEditing ? "Back to My Agents" : "Skip"}
              </Link>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Prompt Type</CardTitle>
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

              <RadioGroup
                value={mode}
                onValueChange={(v) => setMode(v as any)}
                className="grid sm:grid-cols-2 gap-3"
              >
                <Label
                  htmlFor="single"
                  className="border rounded-md p-4 cursor-pointer hover:bg-secondary"
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem id="single" value="single" />
                    <div>
                      <div className="font-semibold">Single Prompt</div>
                      <div className="text-sm text-muted-foreground">
                        One core prompt defines your agent.
                      </div>
                    </div>
                  </div>
                </Label>
                <Label
                  htmlFor="multi"
                  className="border rounded-md p-4 cursor-pointer hover:bg-secondary"
                >
                  <div className="flex items-start gap-3">
                    <RadioGroupItem id="multi" value="multi" />
                    <div>
                      <div className="font-semibold">
                        Multi-Refine (up to 5)
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Refine your agent in timed steps.
                      </div>
                    </div>
                  </div>
                </Label>
              </RadioGroup>

              {mode === "multi" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Time left
                    </div>
                    <div
                      className={`text-sm font-medium ${timeLeft <= 10 ? "text-destructive" : ""}`}
                    >
                      {timeLeft}s
                    </div>
                  </div>
                  <Progress value={((60 - timeLeft) / 60) * 100} />
                  <div className="flex gap-2">
                    <Button onClick={startTimer} disabled={running}>
                      Start
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setRunning(false)}
                      disabled={!running}
                    >
                      Pause
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setRunning(false);
                        setTimeLeft(60);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {prompts.map((p, idx) => (
                  <div key={idx} className="space-y-2">
                    <Label htmlFor={`prompt-${idx}`}>Prompt {idx + 1}</Label>
                    <Textarea
                      id={`prompt-${idx}`}
                      value={p}
                      onChange={(e) =>
                        setPrompts((arr) =>
                          arr.map((v, i) => (i === idx ? e.target.value : v))
                        )
                      }
                      placeholder={
                        idx === 0
                          ? "e.g., You are Nova, a witty, sharp-tongued but fair AI with a love for clever wordplay."
                          : "Refinement detail..."
                      }
                      rows={idx === 0 ? 3 : 2}
                    />
                    {idx > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setPrompts((arr) => arr.filter((_, i) => i !== idx))
                        }
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPrompts((arr) => [...arr, ""])}
                    disabled={!canAdd}
                  >
                    Add refinement
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="is-public" className="text-base font-medium">
                    Make Agent Public
                  </Label>
                  <div className="text-sm text-muted-foreground">
                    Allow other users to discover and challenge your agent in
                    the public arena.
                  </div>
                </div>
                <Switch
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-3 pt-2">
                {["Witty Roaster", "Poetic Muse", "Logic Duelist"].map((p) => (
                  <div key={p} className="p-3 rounded-md border">
                    <div className="font-medium">{p}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Tap to use as a starting point.
                    </div>
                    <Button
                      className="mt-2"
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setPrompts([
                          `Preset: ${p} — describe style, strengths, weaknesses.`,
                        ])
                      }
                    >
                      Use preset
                    </Button>
                  </div>
                ))}
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button asChild variant="ghost">
                <Link href={isEditing ? "/agent" : "/"}>Back</Link>
              </Button>
              <Button onClick={handleSubmit} disabled={!isValid || submitting}>
                {submitting
                  ? isEditing
                    ? "Updating..."
                    : "Saving..."
                  : isEditing
                    ? "Update Agent"
                    : "Save Agent"}
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}