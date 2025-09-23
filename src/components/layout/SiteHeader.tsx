"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Menu, X, Swords, Sparkles, Trophy, Bot } from "lucide-react";
import ConnectWalletButton from "@/components/near/ConnectWalletButton";

export const SiteHeader = () => {
  const [open, setOpen] = useState(false);
  // usage meter state
  const [usage, setUsage] = useState<{ dailyUsed: number; dailyLimit: number } | null>(null);

  const nav = [
    { href: "/arena", label: "Arenas" },
    { href: "/onboarding", label: "Create Agent" },
    { href: "/match", label: "Quick Match" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/agent", label: "My Agents" },
    { href: "/multiplayer", label: "Multiplayer" },
  ];

  useEffect(() => {
    let alive = true;
    const fetchUsage = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
        const res = await fetch("/api/usage", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        const json = await res.json();
        if (!alive) return;
        const d = json?.data;
        if (d && typeof d.dailyUsed === "number" && typeof d.dailyLimit === "number") {
          setUsage({ dailyUsed: d.dailyUsed, dailyLimit: d.dailyLimit });
        }
      } catch (_) {
        // no-op
      }
    };
    fetchUsage();
    const id = setInterval(fetchUsage, 20_000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  return (
    <header className="sticky top-0 z-50">
      {/* Animated gradient glow bar */}
      <motion.div
        aria-hidden
        className="h-0.5 w-full bg-gradient-to-r from-chart-4 via-chart-5 to-chart-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      />
      <div className="backdrop-blur supports-[backdrop-filter]:bg-background/70 border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="inline-flex items-center justify-center size-9 rounded-md bg-gradient-to-br from-chart-4 to-chart-3 text-background shadow-sm ring-1 ring-border">
              <Swords className="size-5" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold tracking-tight text-base sm:text-lg">Agent Battle Arena</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground -mt-0.5">Train • Battle • Evolve</span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-primary transition-colors">
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-3">
            {/* Usage meter */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-32 h-2 rounded bg-accent/60 overflow-hidden">
                <div
                  className="h-full bg-chart-4 transition-[width] duration-500"
                  style={{ width: `${Math.min(100, Math.round(((usage?.dailyUsed ?? 0) / Math.max(1, usage?.dailyLimit ?? 10)) * 100))}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {(usage?.dailyUsed ?? 0)} / {(usage?.dailyLimit ?? 10)}
              </span>
            </div>
            <Button size="sm" variant="secondary" asChild>
              <Link href="/pricing">Upgrade</Link>
            </Button>
            <ConnectWalletButton size="sm" />
          </div>

          {/* Mobile menu button */}
          <button
            aria-label="Toggle menu"
            className="md:hidden inline-flex items-center justify-center size-9 rounded-md border border-border"
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {open && (
        <div className="md:hidden border-b border-border bg-background/95 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid gap-2">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 px-2 py-2 rounded hover:bg-accent"
              >
                {n.label === "Arenas" && <Sparkles className="size-4 text-chart-4" />}
                {n.label === "Create Agent" && <Bot className="size-4 text-chart-5" />}
                {n.label === "Quick Match" && <Swords className="size-4 text-chart-3" />}
                {n.label === "Leaderboard" && <Trophy className="size-4 text-chart-4" />}
                <span>{n.label}</span>
              </Link>
            ))}
            <div className="flex pt-2 gap-2 items-center">
              {/* Compact usage meter on mobile */}
              <div className="flex-1 h-2 rounded bg-accent/60 overflow-hidden">
                <div
                  className="h-full bg-chart-4"
                  style={{ width: `${Math.min(100, Math.round(((usage?.dailyUsed ?? 0) / Math.max(1, usage?.dailyLimit ?? 10)) * 100))}%` }}
                />
              </div>
              <Button size="sm" variant="secondary" asChild>
                <Link href="/pricing">Upgrade</Link>
              </Button>
              <ConnectWalletButton size="default" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};