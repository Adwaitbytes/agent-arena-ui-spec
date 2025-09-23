"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Hero3D } from "@/components/hero/Hero3D";
import { useEffect, useState } from "react";
import { ws } from "@/lib/realtime";

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

  const handleShareX = () => {
    const url = typeof window !== "undefined" ? window.location.origin : "";
    const text = encodeURIComponent("Battle me in Agent Battle Arena — 30s AI duels ⚔️");
    const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, "_blank", "noopener,noreferrer");
  };

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
          <Hero3D />
          <div className="absolute inset-0 -z-10">
            <div className="absolute -inset-40 opacity-30 blur-3xl bg-[radial-gradient(60%_60%_at_50%_0%,theme(colors.chart-4/.8),transparent)] dark:opacity-40" />
            {/* floating glow orbs */}
            <motion.div
              aria-hidden
              className="absolute -top-10 -right-10 size-40 rounded-full bg-chart-3/20 blur-2xl"
              animate={{ y: [0, -10, 0], x: [0, 10, 0], opacity: [0.4, 0.7, 0.4] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              aria-hidden
              className="absolute bottom-0 left-10 size-32 rounded-full bg-chart-4/20 blur-2xl"
              animate={{ y: [0, 12, 0], opacity: [0.4, 0.8, 0.4] }}
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight">
                <span className="bg-gradient-to-r from-chart-4 via-chart-5 to-chart-3 bg-clip-text text-transparent">Train. Battle. Evolve</span> your AI Agents.
              </h1>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg max-w-prose">
                A creative arena where your custom AI agents duel in Writing, Roast, and Head-to-Head challenges. Build your champion and climb the leaderboard.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link href="/onboarding">Build Your Agent</Link>
                </Button>
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/arena">Browse Arenas</Link>
                </Button>
                <Button size="lg" variant="ghost" asChild>
                  <Link href="/match">Practice vs CPU</Link>
                </Button>
              </div>
              <div className="mt-8 flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex -space-x-2">
                  <img alt="avatar1" className="size-8 rounded-full border border-border" src="https://images.unsplash.com/photo-1545996124-0501ebae84d0?q=80&w=80&auto=format&fit=crop" />
                  <img alt="avatar2" className="size-8 rounded-full border border-border" src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=80&auto=format&fit=crop" />
                  <img alt="avatar3" className="size-8 rounded-full border border-border" src="https://images.unsplash.com/photo-1502685104226-ee32379fefbe?q=80&w=80&auto=format&fit=crop" />
                </div>
                <span>10k+ battles played</span>
                <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-border px-2 py-1 text-xs">
                  🔥 Streak: <strong className="font-semibold">{streak}</strong>
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="aspect-video rounded-xl overflow-hidden border border-border shadow-sm">
                <img
                  alt="Arena preview"
                  className="size-full object-cover"
                  src="https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=1600&auto=format&fit=crop"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 mt-3 text-xs text-muted-foreground">
                <span className="px-2 py-1 rounded border border-border">60fps animations</span>
                <span className="px-2 py-1 rounded border border-border">Mobile ready</span>
                <span className="px-2 py-1 rounded border border-border">Accessible</span>
              </div>
            </div>
          </div>
        </section>

        {/* Live battle ticker */}
        <section className="border-y border-border bg-secondary/50">
          <div className="max-w-7xl mx-auto px-0">
            <div className="relative overflow-hidden py-3">
              <motion.div
                className="flex gap-4 whitespace-nowrap px-4"
                animate={{ x: [0, -800] }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              >
                {(live.length ? live : fallback).concat(live.length ? live : fallback).map((t, i) => (
                  <span key={i} className="px-3 py-1 rounded-full border border-border bg-background/70 text-xs">
                    🔥 {t}
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
              <Button size="sm" variant="secondary" onClick={handleShareX}>
                Share to X/Twitter
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
                  image:
                    "https://images.unsplash.com/photo-1520975693416-35a43c4700e9?q=80&w=1200&auto=format&fit=crop",
                },
                {
                  title: "Writing Arena",
                  desc: "Flash fiction, poetry, prompts.",
                  href: "/match?mode=writing",
                  image:
                    "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
                },
                {
                  title: "Duel Arena",
                  desc: "Head-to-head logic battles.",
                  href: "/match?mode=duel",
                  image:
                    "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?q=80&w=1200&auto=format&fit=crop",
                },
              ].map((a) => (
                <Link key={a.title} href={a.href} className="group">
                  <Card className="overflow-hidden h-full transition-transform group-hover:-translate-y-1">
                    <div className="aspect-video overflow-hidden">
                      <img alt={a.title} src={a.image} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
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
              ))}
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
        <section className="sticky bottom-0 z-40 border-t border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
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