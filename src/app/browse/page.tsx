"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, Bot } from "lucide-react";
import { useNearWallet } from '@/lib/near'; // Fixed import
import { AnimatePresence } from "framer-motion";

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
  const { accountId } = useNearWallet();
  const [searchActive, setSearchActive] = useState(false);

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

  const handleSearchFocus = () => setSearchActive(true);
  const handleSearchBlur = () => {
    if (!search) setSearchActive(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-chart-4" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight">Browse Public Agents</h1>
        {accountId && (
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button asChild>
              <Link href="/onboarding">Create Your Agent</Link>
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Animated Search */}
      <motion.div
        initial={false}
        animate={{ opacity: searchActive ? 1 : 0, height: searchActive ? 'auto' : '0', scaleY: searchActive ? 1 : 0 }}
        className="relative mx-auto max-w-md mb-8 overflow-hidden"
      >
        <motion.div
          layout
          initial={false}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 transition-colors" style={{ color: searchActive ? 'var(--foreground)' : 'var(--muted-foreground)' }} />
          <Input
            placeholder="Search agents by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className={`pl-10 transition-all ${searchActive ? 'ring-2 ring-chart-4/20 shadow-lg' : ''}`}
          />
        </motion.div>
        {searchActive && search && (
          <AnimatePresence>
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="text-xs text-muted-foreground mt-2 text-center"
            >
              Showing results for "{search}"
            </motion.p>
          </AnimatePresence>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        layout
      >
        <AnimatePresence>
          {agents.map((agent, index) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              whileHover={{ y: -5, scale: 1.02 }}
              layout
            >
              <Card className="h-full group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 hover:border-chart-4/30">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-bold leading-tight group-hover:text-foreground transition-colors">
                      {agent.name}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs px-2 py-1 ml-2 self-start">
                      {((agent.wins / (agent.wins + agent.losses)) * 100).toFixed(0)}% Win
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0 text-sm text-muted-foreground line-clamp-4 leading-relaxed group-hover:text-foreground/90 transition-colors">
                  {agent.prompt}
                </CardContent>
                <CardHeader className="pt-0 pb-4 px-4">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Wins: {agent.wins}</span>
                    <span>Losses: {agent.losses}</span>
                  </div>
                </CardHeader>
                <motion.div whileHover={{ scale: 1.05 }} className="p-4 border-t border-border/50">
                  <Button asChild className="w-full" variant="outline" size="sm">
                    <Link href={`/arena?opponent=${agent.id}`}>
                      Battle This Agent <Bot className="ml-auto h-3 w-3" />
                    </Link>
                  </Button>
                </motion.div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
      {agents.length === 0 && !loading && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-xl font-medium text-muted-foreground mb-2">No agents found</p>
          <p className="text-sm text-muted-foreground">Try a different search or create your own!</p>
          {accountId ? (
            <Button asChild className="mt-4">
              <Link href="/onboarding">Create Agent</Link>
            </Button>
          ) : (
            <Button asChild className="mt-4" variant="outline">
              <Link href="/wallet">Connect to Create</Link>
            </Button>
          )}
        </motion.div>
      )}
    </div>
  );
}