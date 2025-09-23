"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import Link from 'next/link';

export default function BrowseAgents() {
  const [agents, setAgents] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch(`/api/agents/public?page=1&pageSize=20&search=${search}`)
      .then(res => res.json())
      .then(data => setAgents(data.data.agents));
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">Browse Public Agents</h1>
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
          <input
            type="search"
            placeholder="Search agents..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg"
          />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {agents.map(agent => (
          <Card key={agent.id}>
            <CardHeader>
              <CardTitle>{agent.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">Profile: {agent.promptProfile.slice(0,100)}...</p>
              <p className="text-xs text-muted-foreground">Owner: {agent.ownerNearAccount?.slice(0,6)}...</p>
              <p className="text-xs">Wins: {agent.stats?.wins || 0}</p>
            </CardContent>
            <Button asChild className="w-full mt-4"><Link href={`/arena?selectAgent=${agent.id}`}>Select for Battle</Link></Button>
          </Card>
        ))}
      </div>
    </div>
  );
}