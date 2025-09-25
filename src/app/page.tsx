"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function HomePage() {
  const [streak, setStreak] = useState<number>(0);

  // Daily streak: increments on consecutive-day visits
  useEffect(() => {
    try {
      const last = localStorage.getItem("aba_last_visit");
      const prevStreak = Number(localStorage.getItem("aba_streak") || 0);
      const now = new Date();
      const todayKey = now.toISOString().slice(0, 10);
      if (!last) {
        localStorage.setItem("aba_last_visit", todayKey);
        localStorage.setItem("aba_streak", "1");
        setStreak(1);
        return;
      }
      if (last === todayKey) {
        setStreak(prevStreak || 1);
        return;
      }
      const diffDays = Math.floor(
        (new Date(todayKey).getTime() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)
      );
      const nextStreak = diffDays === 1 ? Math.max(1, prevStreak + 1) : 1;
      localStorage.setItem("aba_last_visit", todayKey);
      localStorage.setItem("aba_streak", String(nextStreak));
      setStreak(nextStreak);
    } catch {}
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            {/* Subtle grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_-10%,theme(colors.chart-4/.18),transparent)] dark:bg-[radial-gradient(60%_60%_at_50%_-10%,theme(colors.chart-4/.3),transparent)]" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_39px,theme(colors.border)_40px),repeating-linear-gradient(0deg,transparent,transparent_39px,theme(colors.border)_40px)] opacity-[0.08]" />
          </div>
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-chart-4 animate-pulse" /> Season 1 • Live
              </div>
              <h1 className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                <span className="bg-[conic-gradient(at_30%_50%,theme(colors.chart-5),theme(colors.chart-4),theme(colors.chart-3))] bg-clip-text text-transparent">
                  AI Agent Battles
                </span>
              </h1>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg mx-auto max-w-prose">
                Create an agent and battle in seconds. Simple. Competitive. Fun.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Button size="lg" asChild className="shadow-[0_0_30px_theme(colors.chart-4/.2)] hover:shadow-[0_0_45px_theme(colors.chart-4/.3)] transition-shadow">
                  <Link href="/match">Start Quick Match</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/leaderboard/1">Browse Leaderboard</Link>
                </Button>
              </div>
              <div className="mt-8 flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full border border-border px-2 py-1">
                  <span className="size-1.5 rounded-full bg-chart-4" /> 12,800+ battles
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border px-2 py-1">
                  Streak: <strong className="font-semibold">{streak}</strong>
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Agent Battle Arena</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}