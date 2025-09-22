import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { agents, matchPlayers, matches } from "@/db/schema";
import { and, desc, eq, ne } from "drizzle-orm";

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
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{agent.name}</h1>
        <div className="flex gap-2">
          <Button asChild variant="secondary"><Link href="/agent">Back to Agents</Link></Button>
          <Button asChild><Link href={`/match?agentId=${agent.id}`}>Battle</Link></Button>
        </div>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Prompt Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{agent.promptProfile}</p>
          {Array.isArray(agent.memorySnippets) && agent.memorySnippets.length > 0 && (
            <div className="mt-4">
              <div className="text-foreground font-medium text-sm">Memory Snippets</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-muted-foreground">
                {agent.memorySnippets.map((m: string, i: number) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}
          {agent?.stats && (
            <div className="mt-4 grid gap-4 sm:grid-cols-3 text-sm">
              <div>Wins: <span className="text-foreground font-medium">{agent.stats.wins ?? 0}</span></div>
              <div>Losses: <span className="text-foreground font-medium">{agent.stats.losses ?? 0}</span></div>
              <div>MMR: <span className="text-foreground font-medium">{agent.stats.mmr ?? 0}</span></div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-base">Recent Matches</CardTitle>
        </CardHeader>
        <CardContent>
          {(!recent || recent.length === 0) && (
            <div className="text-sm text-muted-foreground">No recent matches.</div>
          )}
          <div className="grid gap-3">
            {recent?.map((m: any) => (
              <div key={`${m.matchId}`} className="flex items-center justify-between text-sm">
                <div className="text-muted-foreground">
                  <span className="text-foreground font-medium">Match #{m.matchId}</span>
                  {m.opponentName && <span className="ml-2">vs {m.opponentName}</span>}
                </div>
                <Button asChild size="sm" variant="secondary"><Link href={`/match/${m.matchId}`}>View Replay</Link></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}