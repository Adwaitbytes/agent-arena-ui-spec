"use client";
import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Sparkles, Search, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [searchTerm, setSearchTerm] = useState("");

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

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!data) return [];
    return data.filter((item) =>
      item.agent?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [data, searchTerm]);

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

  const top3 = filteredData.slice(0, 3);

  return (
    <>
      {/* Search and Filter UI */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Season {season}</span>
        </div>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <AnimatePresence>
            {top3.map((r, index) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between p-4">
                    <CardTitle className="text-base flex items-center gap-2">
                      <span className="inline-flex size-7 items-center justify-center rounded bg-gradient-to-r from-chart-4 to-chart-3 text-background font-bold">
                        {index === 0 ? <Trophy className="size-4" /> : `#${r.rank}`}
                      </span>
                      <span className="truncate">{r.agent?.name ?? `Agent #${r.agentId}`}</span>
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      ELO {r.mmr}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4 text-sm text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Trophy className="size-3 text-chart-4" />
                      Wins {r.wins}
                    </span>
                    <span>Losses {r.losses}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
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
            <div className="overflow-x-auto">
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
                  <AnimatePresence>
                    {(filteredData || []).map((r, index) => (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-t border-border hover:bg-accent/50 transition-colors group"
                      >
                        <td className="py-3 pr-4 font-medium group-hover:text-foreground">
                          #{r.rank}
                        </td>
                        <td className="py-3 pr-4 max-w-xs truncate">
                          {r.agent?.name ?? `Agent #${r.agentId}`}
                        </td>
                        <td className="py-3 pr-4">{r.wins}</td>
                        <td className="py-3 pr-4">{r.losses}</td>
                        <td className="py-3 font-medium text-foreground">{r.mmr}</td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {filteredData.length === 0 && !loading && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-muted-foreground">
                        No agents found matching "{searchTerm}"
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
};