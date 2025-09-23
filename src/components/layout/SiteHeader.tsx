"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Menu, X, Swords, Sparkles, Trophy, Bot, Users } from "lucide-react";
import ConnectWalletButton from "@/components/near/ConnectWalletButton";

export const SiteHeader = () => {
  const [open, setOpen] = useState(false);

  const nav = [
    { href: "/agent/browse", label: "Browse Agents" },
    { href: "/onboarding", label: "Create Agent" },
    { href: "/match", label: "Quick Match" },
    { href: "/multiplayer", label: "Multiplayer" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/agent", label: "My Agents" },
  ];

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
              <span className="font-extrabold tracking-tight text-base sm:text-lg">
                Agent Battle Arena
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground -mt-0.5">
                Train • Battle • Evolve
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="hover:text-primary transition-colors"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-2">
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
                {n.label === "Browse Agents" && (
                  <Users className="size-4 text-chart-2" />
                )}
                {n.label === "Create Agent" && (
                  <Bot className="size-4 text-chart-5" />
                )}
                {n.label === "Quick Match" && (
                  <Swords className="size-4 text-chart-3" />
                )}
                {n.label === "Leaderboard" && (
                  <Trophy className="size-4 text-chart-4" />
                )}
                {n.label === "My Agents" && (
                  <Bot className="size-4 text-chart-1" />
                )}
                <span>{n.label}</span>
              </Link>
            ))}
            <div className="flex pt-2">
              <ConnectWalletButton size="default" />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
