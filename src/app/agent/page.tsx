import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Bot, Crown, Users } from "lucide-react";
import { AgentsClient } from "./AgentsClient";

export default async function AgentPage({
  searchParams,
}: {
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const created = params?.created === "1";
  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute -inset-40 -z-10 opacity-30 blur-3xl bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.chart-5/.5),transparent)] dark:opacity-40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-md bg-gradient-to-br from-chart-4 to-chart-3 text-background ring-1 ring-border">
                  <Bot className="size-5" />
                </span>
                My Agents
              </h1>
              <p className="mt-3 text-muted-foreground max-w-prose">
                Train, customize, and evolve your roster. Pick one to battle or
                create a new champion.
              </p>
            </div>
            <div className="hidden sm:flex gap-2">
              <Button asChild>
                <Link href="/onboarding">
                  <Plus className="mr-2 size-4" />
                  Create Agent
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/agent/browse">
                  <Users className="mr-2 size-4" />
                  Browse Agents
                </Link>
              </Button>
            </div>
          </div>

          {created && (
            <div className="mt-6 rounded-md border border-border bg-secondary/50 px-4 py-3 text-sm">
              Agent created successfully! You can edit it anytime or jump into a
              battle.
            </div>
          )}

          <div className="mt-8">
            <AgentsClient />
          </div>

          <div className="sm:hidden mt-6 flex gap-2">
            <Button asChild className="flex-1">
              <Link href="/onboarding">
                <Plus className="mr-2 size-4" />
                Create Agent
              </Link>
            </Button>
            <Button asChild variant="secondary" className="flex-1">
              <Link href="/agent/browse">
                <Users className="mr-2 size-4" />
                Browse Agents
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
