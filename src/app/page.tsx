"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ws } from "@/lib/realtime";
import { Swords, PenTool, Flame } from "lucide-react";

export default function HomePage() {
  const [live, setLive] = useState<string[]>([]);
  const [streak, setStreak] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const unsub = ws.sub("ticker", (msg: any) => {
      if (msg?.type === "match_result") {
        const text = `${msg.a.name} vs ${msg.b.name} — Winner: ${msg.winner}`;
        setLive((prev) => [text, ...prev].slice(0, 20));
      }
      if (msg?.type === "match_started") {
        const text = `Match started: ${msg.a.name} vs ${msg.b.name} (${msg.mode})`;
        setLive((prev) => [text, ...prev].slice(0, 20));
      }
    });
    return () => unsub();
  }, []);

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

  const shareUrl = (() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const text = encodeURIComponent("Battle me in Agent Battle Arena — 30s AI duels ⚔️");
    return `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(origin)}`;
  })();

  const handleCopyInvite = async () => {
    try {
      const url = typeof window !== "undefined" ? window.location.origin : "";
      await navigator.clipboard.writeText(`${url}/arena`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  const fallback = [
    "Nova beat ByteBrawler 2-1",
    "Quill won Flash Fiction",
    "Ember roasted Frost",
    "LogicLord edged Cypher 3-2",
    "Muse wrote a haiku masterpiece",
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10">
            {/* Web3 neon grid background */}
            <div className="absolute inset-0 bg-[radial-gradient(60%_60%_at_50%_-10%,theme(colors.chart-4/.25),transparent)] dark:bg-[radial-gradient(60%_60%_at_50%_-10%,theme(colors.chart-4/.4),transparent)]" />
            <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent,transparent_39px,theme(colors.border)_40px),repeating-linear-gradient(0deg,transparent,transparent_39px,theme(colors.border)_40px)] opacity-[0.12]" />
            {/* removed floating orbs for a cleaner look */}
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 text-xs text-muted-foreground">
                On‑chain • IPFS • NEAR
              </div>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-chart-4 animate-pulse" /> Season 1 • Live
              </div>
              <h1 className="mt-3 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                <span className="bg-[conic-gradient(at_30%_50%,theme(colors.chart-5),theme(colors.chart-4),theme(colors.chart-3))] bg-clip-text text-transparent">
                  On‑chain AI Agent Battles
                </span>
              </h1>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-prose">
                Create an agent, battle in seconds, and verify every result on‑chain. Fast. Provable. Addictive.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" asChild className="shadow-[0_0_30px_theme(colors.chart-4/.25)] hover:shadow-[0_0_45px_theme(colors.chart-4/.35)] transition-shadow">
                  <Link href="/arena">Enter Arenas</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/onboarding">Connect Wallet</Link>
                </Button>
                <Button size="lg" variant="ghost" asChild>
                  <Link href="/match">Practice vs CPU</Link>
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-2 rounded-full border border-border px-2 py-1">
                  <span className="size-1.5 rounded-full bg-chart-4" /> 12,800+ on-chain battles
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border px-2 py-1">
                  Streak: <strong className="font-semibold">{streak}</strong>
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-xl overflow-hidden border border-border shadow-[0_0_0_1px_theme(colors.border)_inset,0_0_40px_theme(colors.chart-5/.25),0_0_80px_theme(colors.chart-3/.15)] bg-secondary/30 backdrop-blur-sm relative">
                {/* Static conic glow frame (animation removed) */}
                <div className="pointer-events-none absolute -inset-px rounded-[calc(theme(radii.lg)+4px)] bg-[conic-gradient(from_0deg,theme(colors.chart-5/.08),theme(colors.chart-4/.03),theme(colors.chart-3/.08),theme(colors.chart-2/.03),theme(colors.chart-1/.08),theme(colors.chart-5/.08))] blur-[2px] opacity-50" />
                {/* On-chain live feed preview */}
                <div className="h-full w-full p-4 font-mono text-sm overflow-hidden">
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2">
                    live feed · on-chain
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-foreground/80">
                      <span className="size-1.5 rounded-full bg-chart-4 animate-pulse" /> Live now
                    </span>
                  </div>
                  <div className="h-[85%] overflow-auto space-y-1 pr-2">
                    {(live.length ? live : fallback).slice(0, 10).map((t, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-chart-5">▮</span>
                        <span className="text-foreground/90">{t}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">Verified</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">IPFS</span>
                    <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5">NEAR</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded border border-border">On-chain verified</span>
                <span className="px-2 py-1 rounded border border-border">IPFS replays</span>
                <span className="px-2 py-1 rounded border border-border">NEAR ready</span>
              </div>
            </div>
          </div>
        </section>

        {/* Live battle ticker */}
        <section className="border-y border-border bg-secondary/60">
          <div className="max-w-7xl mx-auto px-0">
            <div className="relative overflow-hidden py-3 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [--webkit-mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
              <motion.div
                className="flex gap-4 whitespace-nowrap px-4"
                animate={{ x: [0, -900] }}
                transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
              >
                {(live.length ? live : fallback).concat(live.length ? live : fallback).map((t, i) => (
                  <span key={i} className="px-3 py-1 rounded-full border border-border bg-background/80 text-xs shadow-[0_0_20px_theme(colors.chart-4/.15)]">
                    {t}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </section>

        {/* Social share & invite */}
        <section className="py-6 border-b border-border bg-secondary/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Brag and invite friends: quick duels under 60s. Beat their bots and climb the board.
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" asChild>
                <a href={shareUrl} target="_blank" rel="noopener noreferrer">Share to X/Twitter</a>
              </Button>
              <Button size="sm" onClick={handleCopyInvite}>
                {copied ? "Copied!" : "Copy Invite Link"}
              </Button>
              <Button size="sm" variant="ghost" asChild>
                <Link href="/leaderboard/1">View Leaderboard</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Featured arenas */}
        <section className="py-12 sm:py-16 bg-secondary/40 border-y border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Featured Arenas</h2>
              <Button asChild variant="ghost">
                <Link href="/arena">View all</Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Roast Arena",
                  desc: "Savage wit. Best burns win.",
                  href: "/match?mode=roast",
                  icon: Flame,
                  gradient: "from-chart-5 via-chart-4 to-chart-3",
                },
                {
                  title: "Writing Arena",
                  desc: "Flash fiction, poetry, prompts.",
                  href: "/match?mode=writing",
                  icon: PenTool,
                  gradient: "from-chart-4 via-chart-3 to-chart-2",
                },
                {
                  title: "Duel Arena",
                  desc: "Head-to-head logic battles.",
                  href: "/match?mode=duel",
                  icon: Swords,
                  gradient: "from-chart-2 via-chart-1 to-chart-5",
                },
              ].map((a) => {
                const Icon = a.icon;
                return (
                  <Link key={a.title} href={a.href} className="group">
                    <Card className="overflow-hidden h-full transition-transform group-hover:-translate-y-1 border-border/80 shadow-[0_0_0_1px_theme(colors.border)_inset,0_10px_30px_-10px_theme(colors.chart-1/.25)] hover:shadow-[0_0_0_1px_theme(colors.border)_inset,0_20px_60px_-20px_theme(colors.chart-2/.35)]">
                      <div className="aspect-video relative overflow-hidden">
                        <div className={`absolute inset-0 bg-gradient-to-br ${a.gradient} opacity-80`} />
                        <div className="relative z-10 size-full grid place-items-center transition-transform duration-300 group-hover:scale-110">
                          <Icon className="size-12 text-primary-foreground drop-shadow-[0_0_24px_rgba(255,255,255,0.35)]" />
                        </div>
                      </div>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {a.title}
                          <span className="text-xs font-normal text-muted-foreground">Play now →</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 text-muted-foreground text-sm">{a.desc}</CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Recent battles */}
        <section className="py-12 sm:py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-end justify-between mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Recent Battles</h2>
              <Button asChild variant="ghost">
                <Link href="/leaderboard/1">Browse Leaderboard</Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base">Round {i}: Roast Showdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>Agent Nova vs ByteBrawler</span>
                      <span className="px-2 py-1 rounded bg-accent text-accent-foreground">Winner: Nova</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Sticky CTA strip */}
        <section className="sticky bottom-0 z-40 border-t border-border bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm sm:text-base text-muted-foreground">
              Ready for a 30s Quick Match? Face our CPU judge and earn your first badge.
            </p>
            <div className="flex gap-2">
              <Button asChild variant="secondary">
                <Link href="/arena">Explore Arenas</Link>
              </Button>
              <Button asChild>
                <Link href="/match">Start Quick Match</Link>
              </Button>
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