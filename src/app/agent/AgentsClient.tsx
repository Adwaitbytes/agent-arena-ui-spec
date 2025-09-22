"use client";
import React from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Crown, Plus } from "lucide-react";

type Agent = {
  id: number;
  name: string;
  promptProfile: string;
  memorySnippets: string[] | null;
  stats: { wins?: number; losses?: number; mmr?: number } | null;
  createdAt: number;
};

type ApiResponse = {
  ok: boolean;
  data?: {
    agents: Agent[];
    pagination: { page: number; pageSize: number; total: number; totalPages: number };
  };
  error?: string;
};

export const AgentsClient: React.FC = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [page, setPage] = React.useState<number>(parseInt(searchParams.get("page") || "1"));
  const [query, setQuery] = React.useState<string>(searchParams.get("q") || "");
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [agents, setAgents] = React.useState<Agent[]>([]);
  const [pagination, setPagination] = React.useState<{ page: number; pageSize: number; total: number; totalPages: number } | null>(null);

  const fetchAgents = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("bearer_token") : null;
      const params = new URLSearchParams({ page: String(page), pageSize: "12" });
      // Basic client-side filter for now; backend can add search later
      const res = await fetch(`/api/agents?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const json: ApiResponse = await res.json();
      if (!res.ok || !json.ok || !json.data) throw new Error(json.error || `Request failed ${res.status}`);
      const list = json.data.agents;
      const filtered = query.trim()
        ? list.filter((a) => a.name.toLowerCase().includes(query.trim().toLowerCase()))
        : list;
      setAgents(filtered);
      setPagination(json.data.pagination);
    } catch (e: any) {
      setError(e?.message || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  }, [page, query]);

  React.useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  React.useEffect(() => {
    const sp = new URLSearchParams();
    if (page > 1) sp.set("page", String(page));
    if (query) sp.set("q", query);
    const qs = sp.toString();
    router.replace(qs ? `/agent?${qs}` : "/agent");
  }, [page, query, router]);

  const SkeletonCard = () => (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="h-5 w-40 bg-muted animate-pulse rounded" />
        <div className="h-4 w-6 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="h-4 w-56 bg-muted animate-pulse rounded" />
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="h-4 w-14 bg-muted animate-pulse rounded" />
          <div className="h-4 w-14 bg-muted animate-pulse rounded" />
        </div>
        <div className="mt-4 flex gap-2">
          <div className="h-8 w-full bg-muted animate-pulse rounded" />
          <div className="h-8 w-full bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div>
      <div className="mt-6 flex items-center gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search agents..."
          className="max-w-xs"
        />
        <Button asChild><Link href="/onboarding"><Plus className="mr-2 size-4" />Create Agent</Link></Button>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {loading && (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        )}
        {!loading && !error && agents.map((a) => (
          <Card key={a.id} className="group overflow-hidden transition-transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <span className="inline-flex size-7 items-center justify-center rounded bg-accent"><Bot className="size-4" /></span>
                {a.name}
              </CardTitle>
              {((a.stats?.wins || 0) > 40) && <Crown className="size-4 text-chart-4" />}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{a.promptProfile}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Wins {a.stats?.wins ?? 0}</span>
                <span>Losses {a.stats?.losses ?? 0}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <Button asChild size="sm" className="flex-1"><Link href={`/match?agentId=${a.id}`}>Battle</Link></Button>
                <Button asChild size="sm" variant="secondary" className="flex-1"><Link href={`/onboarding?edit=${a.id}`}>Edit</Link></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <div className="mt-4 text-sm text-destructive flex items-center justify-between gap-4">
          <p>{error}</p>
          <Button size="sm" variant="secondary" onClick={fetchAgents}>Retry</Button>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {pagination?.page ?? page}{pagination?.totalPages ? ` / ${pagination.totalPages}` : ""}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>Prev</Button>
          <Button size="sm" onClick={() => setPage((p) => p + 1)} disabled={!!pagination && page >= (pagination.totalPages || 1) || loading}>Next</Button>
        </div>
      </div>
    </div>
  );
};