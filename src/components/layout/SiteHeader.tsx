"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
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
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/agent", label: "My Agents" },
    { href: "/multiplayer", label: "Multiplayer" },
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
            <div className="flex flex-col leading-tight min-w-0">
              <span className="font-extrabold tracking-tight text-base sm:text-lg whitespace-nowrap">
                Agent Battle Arena
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap -mt-0.5">
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
                className="group flex items-center gap-1.5 rounded-md px-3 py-2 text-muted-foreground transition-all hover:text-foreground hover:scale-105"
              >
                {n.label}
                <motion.span
                  className="size-2 rounded-full bg-current opacity-0 group-hover:opacity-100"
                  initial={{ scale: 0 }}
                  whileHover={{ scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                />
              </Link>
            ))}
          </nav>

          {/* Right side: Connect wallet */}
          <div className="flex items-center gap-3">
            <ConnectWalletButton />
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="md:hidden"
        >
          <div className="flex flex-col space-y-4 bg-background border-t border-border px-4 py-6">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-muted-foreground hover:text-foreground -mx-2 px-2 py-2 transition-colors"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <ConnectWalletButton className="mt-4" onConnect={() => setOpen(false)} />
          </div>
        </motion.div>
      )}
    </header>
  );
};