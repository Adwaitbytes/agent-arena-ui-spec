import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
// import { LeaderboardClient } from "./LeaderboardClient";
import { LeaderboardSection } from "./LeaderboardSection";

export default function LeaderboardPage() {
  // ... removed static rows, now using API-driven LeaderboardClient

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

          <LeaderboardSection />

          <div className="sm:hidden mt-6 flex gap-2">
            <Button asChild variant="secondary" className="flex-1"><Link href="/arena">Browse Arenas</Link></Button>
            <Button asChild className="flex-1"><Link href="/onboarding">Create Agent</Link></Button>
          </div>
        </div>
      </section>
    </main>
  );
}