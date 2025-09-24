"use client";
import { motion } from "framer-motion";

export const WinBurst = ({ winner }: { winner: string }) => {
  if (!winner) return null;
  const particles = Array.from({ length: 10 });
  return (
    <div className="relative overflow-visible">
      <div className="inline-flex items-center gap-2 rounded-full border border-border bg-accent/60 px-3 py-1 text-xs font-medium text-accent-foreground">
        🏆 Winner: <span className="font-semibold">{winner}</span>
      </div>
      <div className="pointer-events-none absolute -inset-6">
        {particles.map((_, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, scale: 0.6, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0.6, 1, 0.8],
              x: Math.cos((i / particles.length) * Math.PI * 2) * 30,
              y: Math.sin((i / particles.length) * Math.PI * 2) * 30,
              rotate: i * (360 / particles.length),
            }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none"
            aria-hidden
          >
            🎉
          </motion.span>
        ))}
      </div>
    </div>
  );
};