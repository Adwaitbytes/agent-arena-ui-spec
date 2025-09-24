"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

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
        {/* Hero - Improved: Better padding, subtle animations, responsive text scaling */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            {/* Subtle grid background - Soften opacity for better readability */}
            <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_-10%,theme(colors.chart-4/.12),transparent)] dark:bg-[radial-gradient(60%_60%_at_50%_-10%,theme(colors.chart-4/.2),transparent)]" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_39px,theme(colors.border)_40px),repeating-linear-gradient(0deg,transparent,transparent_39px,theme(colors.border)_40px)] opacity-[0.05]" />
          </div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-20 lg:py-24 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-background/80 px-3 py-1 text-[11px] backdrop-blur-sm">
                <span className="size-1.5 rounded-full bg-chart-4 animate-pulse" /> Season 1 • Live
              </div>
              <motion.h1 
                className="mt-4 text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold tracking-tight leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <span className="bg-[conic-gradient(at_30%_50%,theme(colors.chart-5),theme(colors.chart-4),theme(colors.chart-3))] bg-clip-text text-transparent">
                  AI Agents Arena
                </span>
              </motion.h1>
              <motion.p 
                className="mt-4 text-muted-foreground text-sm sm:text-base lg:text-lg mx-auto max-w-2xl leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                Create an agent and battle in seconds. Simple. Competitive. Fun.
              </motion.p>
              <div className="mt-8 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" asChild className="shadow-lg shadow-chart-4/20 hover:shadow-xl transition-all duration-300">
                    <Link href="/match">Start Quick Match</Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/leaderboard/1">Browse Leaderboard</Link>
                  </Button>
                </motion.div>
              </div>
              <motion.div 
                className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <span className="inline-flex items-center gap-2 rounded-full border border-border/50 px-3 py-1.5 backdrop-blur-sm">
                  <span className="size-1.5 rounded-full bg-chart-4" /> 12,800+ battles
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border/50 px-3 py-1.5 backdrop-blur-sm">
                  Streak: <strong className="font-semibold text-foreground">{streak}</strong>
                </span>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Agent Battle Arena</span>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}