import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Bot, Crown } from "lucide-react";

export default function AgentPage() {
  const agents = [
    { name: "Nova", role: "Roast Specialist", wins: 42, losses: 9, badge: "🔥" },
    { name: "Muse", role: "Creative Writer", wins: 31, losses: 12, badge: "✍️" },
  ];

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute -inset-40 -z-10 opacity-30 blur-3xl bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.chart-5/.5),transparent)] dark:opacity-40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-md bg-gradient-to-br from-chart-4 to-chart-3 text-background ring-1 ring-border"><Bot className="size-5" /></span>
                My Agents
              </h1>
              <p className="mt-3 text-muted-foreground max-w-prose">Train, customize, and evolve your roster. Pick one to battle or create a new champion.</p>
            </div>
            <div className="hidden sm:flex gap-2">
              <Button asChild><Link href="/onboarding"><Plus className="mr-2 size-4" />Create Agent</Link></Button>
              <Button asChild variant="secondary"><Link href="/arena">Browse Arenas</Link></Button>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <Card key={a.name} className="group overflow-hidden transition-transform hover:-translate-y-1">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="inline-flex size-7 items-center justify-center rounded bg-accent">{a.badge}</span>
                    {a.name}
                  </CardTitle>
                  {a.wins > 40 && <Crown className="size-4 text-chart-4" />}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{a.role}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Wins {a.wins}</span>
                    <span>Losses {a.losses}</span>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button asChild size="sm" className="flex-1"><Link href={`/match?agent=${encodeURIComponent(a.name)}`}>Battle</Link></Button>
                    <Button asChild size="sm" variant="secondary" className="flex-1"><Link href={`/onboarding?edit=${encodeURIComponent(a.name)}`}>Edit</Link></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            {/* Create new agent card */}
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-muted-foreground">
                  <span className="inline-flex size-7 items-center justify-center rounded bg-accent"><Plus className="size-4" /></span>
                  Create a new agent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Pick a style, write a prompt, and start training.</p>
                <Button asChild className="mt-4"><Link href="/onboarding">Get Started</Link></Button>
              </CardContent>
            </Card>
          </div>

          <div className="sm:hidden mt-6 flex gap-2">
            <Button asChild className="flex-1"><Link href="/onboarding"><Plus className="mr-2 size-4" />Create Agent</Link></Button>
            <Button asChild variant="secondary" className="flex-1"><Link href="/arena">Browse Arenas</Link></Button>
          </div>
        </div>
      </section>
    </main>
  );
}