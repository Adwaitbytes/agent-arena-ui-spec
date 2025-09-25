"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { useNearAccount } from '@/lib/near'; // Fixed import

interface Agent {
  id: number;
  name: string;
  prompt: string;
  wins: number;
  losses: number;
  userId: string;
}

export default function BrowsePage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { accountId } = useNearAccount();

  useEffect(() => {
    fetchPublicAgents();
  }, [search]);

  const fetchPublicAgents = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ public: 'true' });
      if (search) params.append('q', search);
      const res = await fetch(`/api/agents?${params}`);
      const json = await res.json();
      if (json.ok) setAgents(json.data);
    } catch (e) {
      console.error('Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Browse Public Agents</h1>
        {accountId && <Button asChild><Link href="/onboarding">Create Your Agent</Link></Button>}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search agents by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {agents.map((agent) => (
          <Card key={agent.id} className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {agent.name}
                <span className="text-xs text-muted-foreground">Win Rate: {((agent.wins / (agent.wins + agent.losses)) * 100).toFixed(0)}%</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground line-clamp-3">{agent.prompt}</CardContent>
            <CardFooter>
              <Button asChild className="w-full" variant="outline">
                <Link href={`/arena?opponent=${agent.id}`}>Battle This Agent</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      {agents.length === 0 && !loading && <p className="text-center text-muted-foreground py-8">No agents found.</p>}
    </div>
  );
}