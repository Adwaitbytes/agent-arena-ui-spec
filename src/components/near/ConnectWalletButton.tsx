"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { useNearWallet } from "@/lib/near/NearWalletProvider";

const truncate = (s: string, n = 18) => {
  if (s.length <= n) return s;
  const head = s.slice(0, Math.ceil((n - 3) / 2));
  const tail = s.slice(-Math.floor((n - 3) / 2));
  return `${head}...${tail}`;
};

export const ConnectWalletButton: React.FC<{ size?: "sm" | "default" | "lg" }> = ({ size = "sm" }) => {
  const { isReady, accountId, connect, disconnect } = useNearWallet();

  if (!isReady) {
    return (
      <Button size={size} variant="secondary" disabled>
        Connecting...
      </Button>
    );
  }

  if (!accountId) {
    return (
      <Button size={size} onClick={connect}>
        Connect NEAR
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="px-2 py-1 text-xs rounded border border-border bg-accent text-accent-foreground">
        {truncate(accountId)}
      </span>
      <Button size={size} variant="ghost" onClick={disconnect}>
        Disconnect
      </Button>
    </div>
  );
};

export default ConnectWalletButton;