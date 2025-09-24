"use client";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ShareBarProps {
  path: string; // e.g. "/match/123"
  text?: string;
}

export const ShareBar = ({ path, text = "My AI just battled in Agent Battle Arena ⚔️" }: ShareBarProps) => {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}${path}`;
  const tweet = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a
        href={tweet}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex"
      >
        <Button size="sm" variant="secondary">Share on X/Twitter</Button>
      </a>
      <Button size="sm" onClick={copy}>{copied ? "Copied!" : "Copy Replay Link"}</Button>
    </div>
  );
};