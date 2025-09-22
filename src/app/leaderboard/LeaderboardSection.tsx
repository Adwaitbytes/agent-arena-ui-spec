"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { LeaderboardClient } from "./LeaderboardClient";

export const LeaderboardSection: React.FC = () => {
  const [season, setSeason] = React.useState<number>(1);
  const seasons = [1, 2, 3];

  return (
    <div>
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Season</span>
        <div className="inline-flex rounded-md border border-border p-1 bg-background">
          {seasons.map((s) => (
            <Button
              key={s}
              type="button"
              size="sm"
              variant={season === s ? "default" : "ghost"}
              className={
                season === s
                  ? "h-8 px-3"
                  : "h-8 px-3 text-muted-foreground hover:text-foreground"
              }
              onClick={() => setSeason(s)}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>

      <LeaderboardClient season={season} />
    </div>
  );
};