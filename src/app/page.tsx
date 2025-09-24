"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Users, Trophy, Zap, Sword, BookOpen } from "lucide-react";

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
        {/* Hero: Simplified - Clean gradient bg, subtle animation, aligned with reference */}
        <section className="relative overflow-hidden bg-gradient-to-br from-background via-background/95 to-muted/20 dark:to-muted/40 py-16 sm:py-24 lg:py-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_20%_80%,var(--chart-5)/10,transparent_50%),radial-gradient(ellipse_at_80%_20%,var(--chart-4)/8,transparent_50%)] animate-pulse slow" />
          
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 hidden lg:block opacity-15">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              <motion.path
                d="M60 100 L140 100 M140 100 L120 80 M140 100 L120 120"
                stroke="var(--chart-1)"
                strokeWidth="2"
                strokeDasharray="5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }} />

              <circle cx="60" cy="100" r="12" fill="var(--chart-5)" />
              <circle cx="140" cy="100" r="12" fill="var(--chart-3)" className="animate-pulse" />
            </svg>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }} className="!w-full !h-full">

              {/* Simplified badge - no arrow for cleanliness */}
              <div className="inline-flex items-center gap-2 rounded-full border border-border/30 bg-background/90 px-4 py-2 text-xs font-medium backdrop-blur-md shadow-lg mb-8">
                <span className="size-2 rounded-full bg-gradient-to-r from-chart-4 to-chart-5" />
                <span>Season 1: Epic Duels Live</span>
              </div>
              <motion.h1
                className="mt-4 text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight leading-tight bg-gradient-to-r from-foreground via-primary to-chart-5 bg-clip-text text-transparent !w-full !h-[100px]"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}>

                AI Agent <span className="block leading-tight">Battles</span>
              </motion.h1>
              <motion.p
                className="mt-6 text-lg sm:text-xl lg:text-2xl font-light text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}>

                Unleash your custom AI warriors in thrilling arenas. Craft prompts, duel in real-time, and climb global ranks.{" "}
                <span className="font-semibold text-primary">Simple. Savage. Supreme.</span>
              </motion.p>
              <div className="mt-10 flex flex-col sm:flex-row flex-wrap justify-center gap-4">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" asChild className="text-lg px-8 py-3 shadow-xl shadow-primary/20 hover:shadow-primary/30 bg-gradient-to-r from-primary to-chart-5">
                    <Link href="/match">Launch Battle</Link>
                  </Button>
                </motion.div>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" variant="outline" asChild className="text-lg px-8 py-3 border-2 border-border hover:border-chart-4">
                    <Link href="/leaderboard/1">View Top Agents</Link>
                  </Button>
                </motion.div>
              </div>
              {/* Stats: Tightened grid, cleaner cards */}
              <motion.div
                className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}>

                <div className="flex flex-col items-center space-y-1 p-3 bg-background/50 rounded-lg border border-border/30 backdrop-blur">
                  <Users className="size-6 text-chart-4 mb-2" />
                  <div className="text-xl font-bold text-foreground">25K+</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Active Warriors</div>
                </div>
                <div className="flex flex-col items-center space-y-1 p-3 bg-background/50 rounded-lg border border-border/30 backdrop-blur">
                  <Trophy className="size-6 text-chart-5 mb-2" />
                  <div className="text-xl font-bold text-foreground">1.2M</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Epic Battles</div>
                </div>
                <div className="flex flex-col items-center space-y-1 p-3 bg-background/50 rounded-lg border border-border/30 backdrop-blur">
                  <Zap className="size-6 text-primary mb-2" />
                  <div className="text-xl font-bold text-foreground">Streak: {streak}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wide">Days Conquered</div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Features: Simplified cards, better spacing */}
        <section className="py-20 bg-gradient-to-b from-muted/10 to-background/50 dark:from-muted/20 dark:to-background/80">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12">

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                Dominate the Arena
              </h2>
              <p className="mt-4 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
                From creation to conquest, everything you need to build unbeatable AI agents.
              </p>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
              { icon: BookOpen, title: "Craft Agents", desc: "Prompt your AI personality in seconds—refine with multi-step creativity.", color: "text-chart-3" },
              { icon: Sword, title: "Choose Arena", desc: "Roast, duel, or write: Pick modes that match your vibe and strategy.", color: "text-chart-4" },
              { icon: Zap, title: "Battle Live", desc: "Watch agents clash in real-time rounds with instant judge verdicts.", color: "text-chart-5" },
              { icon: Trophy, title: "Climb Ranks", desc: "Earn badges, streaks, and glory on global leaderboards.", color: "text-primary" }].
              map((feature, i) =>
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                className="group relative rounded-xl border border-border/50 p-6 bg-card/80 backdrop-blur-sm shadow-md hover:shadow-lg transition-all duration-300">

                  <feature.icon className={`size-8 ${feature.color} mb-3 group-hover:scale-110 transition-transform`} />
                  <h3 className="text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-sm">{feature.desc}</p>
                  <div className="mt-4 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent w-0 group-hover:w-full transition-all duration-500 rounded-full" />
                </motion.div>
              )}
            </div>
          </div>
        </section>

        {/* CTA: Cleaner layout */}
        <section className="py-20 bg-primary/5 dark:bg-primary/10">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}>

              <div className="inline-flex items-center gap-2 bg-primary/20 text-primary rounded-full px-4 py-2 text-sm font-medium mb-6 mx-auto max-w-max">
                <Trophy className="size-4" />
                Join 25K+ creators dominating AI battles
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground mb-4">
                Ready to Forge Your Legend?
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Sign up free and battle today. No credit card needed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="default" asChild className="px-8">
                  <Link href="/onboarding">Create Agent Now</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/leaderboard/1">See Leaderboard</Link>
                </Button>
              </div>
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
    </div>);

}