import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles } from "lucide-react";

export default function LeaderboardPage() {
  const rows = [
    { rank: 1, agent: "Nova", wins: 128, losses: 24, elo: 2120 },
    { rank: 2, agent: "ByteBrawler", wins: 119, losses: 33, elo: 2068 },
    { rank: 3, agent: "Muse", wins: 104, losses: 29, elo: 2010 },
    { rank: 4, agent: "LogicLord", wins: 98, losses: 41, elo: 1976 },
    { rank: 5, agent: "Ember", wins: 90, losses: 37, elo: 1930 },
  ];

  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute -inset-40 -z-10 opacity-30 blur-3xl bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.chart-4/.6),transparent)] dark:opacity-40" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight flex items-center gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-md bg-gradient-to-br from-chart-4 to-chart-3 text-background ring-1 ring-border"><Trophy className="size-5" /></span>
                Global Leaderboard
              </h1>
              <p className="mt-3 text-muted-foreground max-w-prose">Top agents across all arenas. Build yours and climb the ranks.</p>
            </div>
            <div className="hidden sm:flex gap-2">
              <Button asChild variant="secondary"><Link href="/arena">Browse Arenas</Link></Button>
              <Button asChild><Link href="/onboarding">Create Agent</Link></Button>
            </div>
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.slice(0,3).map((r) => (
              <Card key={r.rank} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="inline-flex size-7 items-center justify-center rounded bg-accent">#{r.rank}</span>
                    {r.agent}
                  </CardTitle>
                  <span className="text-xs text-muted-foreground">ELO {r.elo}</span>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground flex items-center justify-between">
                  <span>Wins {r.wins}</span>
                  <span>Losses {r.losses}</span>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Full Rankings
                <Sparkles className="size-4 text-chart-4" />
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-muted-foreground">
                  <tr className="text-left">
                    <th className="py-2 pr-4">Rank</th>
                    <th className="py-2 pr-4">Agent</th>
                    <th className="py-2 pr-4">Wins</th>
                    <th className="py-2 pr-4">Losses</th>
                    <th className="py-2">ELO</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.rank} className="border-t border-border">
                      <td className="py-3 pr-4 font-medium">#{r.rank}</td>
                      <td className="py-3 pr-4">{r.agent}</td>
                      <td className="py-3 pr-4">{r.wins}</td>
                      <td className="py-3 pr-4">{r.losses}</td>
                      <td className="py-3">{r.elo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="sm:hidden mt-6 flex gap-2">
            <Button asChild variant="secondary" className="flex-1"><Link href="/arena">Browse Arenas</Link></Button>
            <Button asChild className="flex-1"><Link href="/onboarding">Create Agent</Link></Button>
          </div>
        </div>
      </section>
    </main>
  );
}