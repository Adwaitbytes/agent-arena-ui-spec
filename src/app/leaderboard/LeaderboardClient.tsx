"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles } from "lucide-react";

type LeaderboardEntry = {
  id: number;
  agentId: number;
  seasonId: number;
  mmr: number;
  wins: number;
  losses: number;
  updatedAt: string | number | null;
  agent: { id: number; name: string | null; promptProfile: string | null } | null;
  rank: number;
};

export const LeaderboardClient: React.FC<{ season?: number }> = ({ season = 1 }) => {
  const [data, setData] = React.useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const res = await fetch(`/api/leaderboard/${season}`, {
        signal: controller.signal,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const json = await res.json();
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || `Request failed with ${res.status}`);
      }
      setData(json.data.leaderboard as LeaderboardEntry[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [season]);

  React.useEffect(() => {
    load();
  }, [load]);

  const SkeletonCard = () => (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="h-5 w-40 bg-muted animate-pulse rounded" />
        <div className="h-4 w-16 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
        <div className="h-4 w-20 bg-muted animate-pulse rounded" />
      </CardContent>
    </Card>
  );

  const top3 = (data || []).slice(0, 3);

  return (
    <>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}
        {!loading && !error && top3.map((r) => (
          <Card key={r.id} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="inline-flex size-7 items-center justify-center rounded bg-accent">#{r.rank}</span>
                {r.agent?.name ?? `Agent #${r.agentId}`}
              </CardTitle>
              <span className="text-xs text-muted-foreground">ELO {r.mmr}</span>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground flex items-center justify-between">
              <span>Wins {r.wins}</span>
              <span>Losses {r.losses}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Full Rankings
            <Sparkles className="size-4 text-chart-4" />
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {error ? (
            <div className="flex items-center justify-between gap-4 py-4">
              <p className="text-sm text-destructive">{error}</p>
              <Button onClick={load} size="sm" variant="secondary">Retry</Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-muted-foreground">
                <tr className="text-left">
                  <th className="py-2 pr-4">Rank</th>
                  <th className="py-2 pr-4">Agent</th>
                  <th className="py-2 pr-4">Wins</th>
                  <th className="py-2 pr-4">Losses</th>
                  <th className="py-2">ELO</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="py-3 pr-4"><div className="h-4 w-10 bg-muted animate-pulse rounded" /></td>
                      <td className="py-3 pr-4"><div className="h-4 w-40 bg-muted animate-pulse rounded" /></td>
                      <td className="py-3 pr-4"><div className="h-4 w-16 bg-muted animate-pulse rounded" /></td>
                      <td className="py-3 pr-4"><div className="h-4 w-16 bg-muted animate-pulse rounded" /></td>
                      <td className="py-3"><div className="h-4 w-12 bg-muted animate-pulse rounded" /></td>
                    </tr>
                  ))
                ) : (
                  (data || []).map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="py-3 pr-4 font-medium">#{r.rank}</td>
                      <td className="py-3 pr-4">{r.agent?.name ?? `Agent #${r.agentId}`}</td>
                      <td className="py-3 pr-4">{r.wins}</td>
                      <td className="py-3 pr-4">{r.losses}</td>
                      <td className="py-3">{r.mmr}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </>
  );
};