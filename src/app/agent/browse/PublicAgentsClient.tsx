"use client";
import React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Crown, Swords, User, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type PublicAgent = {
  id: number;
  name: string;
  promptProfile: string;
  memorySnippets: string[] | null;
  stats: { wins?: number; losses?: number; mmr?: number } | null;
  createdAt: number;
  ownerAccountId?: string;
  isPublic: boolean;
};

type ApiResponse = {
  ok: boolean;
  data?: {
    agents: PublicAgent[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
  error?: string;
};

export const PublicAgentsClient: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [page, setPage] = React.useState<number>(
    parseInt(searchParams.get("page") || "1")
  );
  const [query, setQuery] = React.useState<string>(searchParams.get("q") || "");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [agents, setAgents] = React.useState<PublicAgent[]>([]);
  const [pagination, setPagination] = React.useState<{
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  } | null>(null);

  const fetchPublicAgents = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "12",
        public: "true", // Only fetch public agents
      });

      const res = await fetch(`/api/agents?${params.toString()}`);
      const json: ApiResponse = await res.json();

      if (!res.ok || !json.ok || !json.data) {
        throw new Error(json.error || `Request failed ${res.status}`);
      }

      const list = json.data.agents; // Remove client-side isPublic filter since API already filters
      const filtered = query.trim()
        ? list.filter(
            (a) =>
              a.name.toLowerCase().includes(query.trim().toLowerCase()) ||
              a.promptProfile
                .toLowerCase()
                .includes(query.trim().toLowerCase()) ||
              a.ownerAccountId
                ?.toLowerCase()
                .includes(query.trim().toLowerCase())
          )
        : list;

      setAgents(filtered);
      setPagination(json.data.pagination);
    } catch (e: any) {
      setError(e?.message || "Failed to load public agents");
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  React.useEffect(() => {
    fetchPublicAgents();
  }, [fetchPublicAgents]);

  React.useEffect(() => {
    const sp = new URLSearchParams();
    if (page > 1) sp.set("page", String(page));
    if (query) sp.set("q", query);
    const qs = sp.toString();
    router.replace(qs ? `/agent/browse?${qs}` : "/agent/browse");
  }, [page, query, router]);

  const SkeletonCard = () => (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="h-5 w-40 bg-muted animate-pulse rounded" />
        <div className="h-4 w-6 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-4 w-56 bg-muted animate-pulse rounded" />
        <div className="mt-2 h-3 w-20 bg-muted animate-pulse rounded" />
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="h-4 w-14 bg-muted animate-pulse rounded" />
          <div className="h-4 w-14 bg-muted animate-pulse rounded" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-8 w-full bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );

  const getRankBadge = (wins: number, losses: number) => {
    const winRate = wins + losses > 0 ? wins / (wins + losses) : 0;
    const totalBattles = wins + losses;

    if (totalBattles < 5) return { label: "Rookie", color: "bg-gray-500" };
    if (winRate >= 0.8 && totalBattles >= 20)
      return { label: "Champion", color: "bg-yellow-500" };
    if (winRate >= 0.7 && totalBattles >= 15)
      return { label: "Expert", color: "bg-purple-500" };
    if (winRate >= 0.6 && totalBattles >= 10)
      return { label: "Veteran", color: "bg-blue-500" };
    if (winRate >= 0.5) return { label: "Fighter", color: "bg-green-500" };
    return { label: "Trainee", color: "bg-orange-500" };
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 max-w-md">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search agents, creators, or descriptions..."
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="size-4" />
          <span>Public Agents</span>
        </div>
      </div>

      {!loading && !error && agents.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex size-16 items-center justify-center rounded-full bg-muted mb-4">
            <Bot className="size-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Public Agents Found</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {query
              ? "No agents match your search criteria."
              : "No public agents available yet. Be the first to create one!"}
          </p>
          <Button asChild>
            <Link href="/onboarding">Create the First Public Agent</Link>
          </Button>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}

        {!loading &&
          !error &&
          agents.map((agent) => {
            const wins = agent.stats?.wins || 0;
            const losses = agent.stats?.losses || 0;
            const rank = getRankBadge(wins, losses);

            return (
              <Card
                key={agent.id}
                className="group overflow-hidden transition-transform hover:-translate-y-1"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="inline-flex size-7 items-center justify-center rounded bg-accent">
                      <Bot className="size-4" />
                    </span>
                    <Link
                      href={`/agent/${agent.id}`}
                      className="hover:underline line-clamp-1"
                    >
                      {agent.name}
                    </Link>
                  </CardTitle>
                  <div className="flex items-center gap-1">
                    {wins > 50 && <Crown className="size-4 text-chart-4" />}
                    <Badge
                      variant="secondary"
                      className={`${rank.color} text-white text-xs px-2 py-0.5`}
                    >
                      {rank.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {agent.promptProfile}
                  </p>

                  {agent.ownerAccountId && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                      <User className="size-3" />
                      <span className="truncate">
                        by {agent.ownerAccountId}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <span className="text-green-600">W: {wins}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="text-red-600">L: {losses}</span>
                    </span>
                    {agent.stats?.mmr && (
                      <span className="text-blue-600">
                        MMR: {agent.stats.mmr}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/match?opponentId=${agent.id}`}>
                        <Swords className="mr-1 size-3" />
                        Challenge
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Link href={`/agent/${agent.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {error && (
        <div className="mt-4 text-sm text-destructive flex items-center justify-between gap-4">
          <p>{error}</p>
          <Button size="sm" variant="secondary" onClick={fetchPublicAgents}>
            Retry
          </Button>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.totalPages} (
            {pagination.total} agents)
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              Previous
            </Button>
            <Button
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= pagination.totalPages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
