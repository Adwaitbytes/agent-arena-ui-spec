import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeaderboardClient } from "../LeaderboardClient";

export async function generateMetadata({ params }: { params: { season: string } }): Promise<Metadata> {
  const seasonNum = Number(params.season);
  const valid = Number.isFinite(seasonNum) && seasonNum > 0;
  const title = valid ? `Leaderboard – Season ${seasonNum}` : "Leaderboard";
  const description = valid
    ? `Top agents and rankings for Season ${seasonNum}.`
    : "Top agents and rankings.";
  const url = `/leaderboard/${valid ? seasonNum : 1}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default function LeaderboardSeasonPage({ params }: { params: { season: string } }) {
  const season = Number(params.season);
  if (!Number.isFinite(season) || season <= 0) return notFound();

  const seasons = [1, 2, 3];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-end justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
          <Trophy className="size-6 text-chart-4" />
          Leaderboard
          <span className="text-base text-muted-foreground">Season {season}</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          {seasons.map((s) => (
            <Button key={s} asChild variant={s === season ? "default" : "secondary"}>
              <Link href={`/leaderboard/${s}`}>S{s}</Link>
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <LeaderboardClient season={season} />
      </div>
    </div>
  );
}