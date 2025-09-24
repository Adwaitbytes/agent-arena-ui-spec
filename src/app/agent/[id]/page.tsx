import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { agents, matchPlayers, matches } from "@/db/schema";
import { and, desc, eq, ne } from "drizzle-orm";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Edit, Delete, Crown, Bot, Trophy, Zap, Sparkles, AlertCircle } from "lucide-react";

async function getAgent(id: number) {
  const [agent] = await db.select().from(agents).where(eq(agents.id, id));
  if (!agent) return null;

  // Recent matches for this agent (limit 5)
  const recent = await db
    .select({
      matchId: matches.id,
      createdAt: matches.createdAt,
      seat: matchPlayers.seat,
    })
    .from(matchPlayers)
    .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
    .where(eq(matchPlayers.agentId, id))
    .orderBy(desc(matches.createdAt))
    .limit(5);

  // For each match, try to find opponent agent name (if any)
  const withOpponents = await Promise.all(
    recent.map(async (row) => {
      const [opp] = await db
        .select({
          agentId: matchPlayers.agentId,
        })
        .from(matchPlayers)
        .where(and(eq(matchPlayers.matchId, row.matchId), ne(matchPlayers.agentId, id)))
        .limit(1);

      let opponentName: string | null = null;
      if (opp?.agentId) {
        const [oppAgent] = await db
          .select({ id: agents.id, name: agents.name })
          .from(agents)
          .where(eq(agents.id, opp.agentId));
        opponentName = oppAgent?.name ?? null;
      }

      return { ...row, opponentName };
    })
  );

  return { agent, recent: withOpponents };
}

export default async function AgentDetailPage({ params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!Number.isFinite(id)) notFound();

  const data = await getAgent(id);
  if (!data) notFound();

  const { agent, recent } = data as any;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12 lg:py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center gap-4">
          <div className="inline-flex size-12 items-center justify-center rounded-lg bg-gradient-to-br from-chart-4 to-chart-3 text-background ring-1 ring-border">
            <Bot className="size-6" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">{agent.name}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="px-3 py-1">
                MMR {agent.stats?.mmr ?? 0}
              </Badge>
              <span className="flex items-center gap-1">
                <Trophy className="size-4 text-chart-4" /> {agent.stats?.wins ?? 0} Wins
              </span>
              <span className="flex items-center gap-1">
                <Zap className="size-4 text-destructive" /> {agent.stats?.losses ?? 0} Losses
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/agent">Back to Agents</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/match?agentId=${agent.id}`}>Battle</Link>
          </Button>
          <Button variant="ghost" size="sm" className="p-2">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="p-2 text-destructive">
            <Delete className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid lg:grid-cols-3 gap-8"
      >
        <Card className="lg:col-span-2 overflow-hidden group hover:shadow-lg transition-all">
          <CardHeader className="p-6 bg-gradient-to-br from-background/50 to-muted/50">
            <CardTitle className="flex items-center gap-2">Prompt Profile</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="prose prose-sm max-w-none text-foreground bg-accent/5 p-4 rounded-lg">
              <p className="whitespace-pre-wrap">{agent.promptProfile}</p>
            </div>
            {Array.isArray(agent.memorySnippets) && agent.memorySnippets.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <h3 className="font-medium flex items-center gap-2 text-sm">
                  <Sparkles className="size-4" /> Memory Snippets
                </h3>
                <div className="grid gap-2">
                  {agent.memorySnippets.map((m: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs px-3 py-1">
                      {m}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>

        <Card className="overflow-hidden group hover:shadow-lg transition-all">
          <CardHeader className="p-6 bg-gradient-to-br from-background/50 to-muted/50">
            <CardTitle className="flex items-center gap-2">Stats</CardTitle>
          </CardHeader>
          <CardContent className="p-6 grid gap-4 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Wins</span>
              <Badge variant="default" className="px-3 py-1">{agent.stats?.wins ?? 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Losses</span>
              <Badge variant="destructive" className="px-3 py-1">{agent.stats?.losses ?? 0}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Win Rate</span>
              <Badge variant="secondary" className="px-3 py-1">
                {((agent.stats?.wins / (agent.stats?.wins + agent.stats?.losses)) * 100 || 0).toFixed(0)}%
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">MMR</span>
              <Badge variant="default" className="px-3 py-1 font-mono">{agent.stats?.mmr ?? 0}</Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <Card className="overflow-hidden">
          <CardHeader className="p-6 bg-gradient-to-br from-background/50 to-muted/50">
            <CardTitle className="flex items-center gap-2">Recent Matches</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {(!recent || recent.length === 0) ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="mx-auto h-8 w-8 mb-2" />
                No recent matches yet. Battle to build your history!
              </div>
            ) : (
              <div className="space-y-3">
                {recent.map((m: any) => (
                  <motion.div
                    key={m.matchId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 group hover:bg-accent/10 transition-colors"
                  >
                    <div className="text-sm">
                      <span className="font-medium text-foreground">Match #{m.matchId}</span>
                      {m.opponentName && <span className="ml-2 text-muted-foreground">vs {m.opponentName}</span>}
                      <div className="text-xs text-muted-foreground mt-1">{new Date(m.createdAt).toLocaleDateString()}</div>
                    </div>
                    <Button asChild size="sm" variant="outline" className="group-hover:bg-foreground/10">
                      <Link href={`/match/${m.matchId}`}>View Replay</Link>
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}