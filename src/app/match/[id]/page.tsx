import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

async function getMatch(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/match/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json?.ok) return null;
  return json.data as {
    match: { id: number; mode?: string; createdAt: number };
    players: Array<{ id: number; seat: number; agentId: number | null; agent: { id: number | null; name: string | null; promptProfile: string | null } | null }>;
    rounds: Array<{ id: number; idx: number; prompt?: string | null; aOutput?: string | null; bOutput?: string | null; winner?: string | null; judgeNotes?: string | null; ipfsCid?: string | null; createdAt: number }>;
  };
}

export default async function MatchReplayPage({ params }: { params: { id: string } }) {
  const data = await getMatch(params.id);
  if (!data) notFound();
  const { match, players, rounds } = data;

  const a = players.find(p => p.seat === 1)?.agent;
  const b = players.find(p => p.seat === 2)?.agent;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Match #{match.id} Replay</h1>
        <Button asChild variant="secondary"><Link href={`/arena`}>Back to Arenas</Link></Button>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Players</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground grid gap-2 sm:grid-cols-2">
          <div>
            <div className="text-foreground font-medium">Seat 1</div>
            {a?.id ? <Link className="underline hover:no-underline" href={`/agent/${a.id}`}>{a.name}</Link> : <span>CPU</span>}
            {a?.promptProfile && <p className="mt-1 line-clamp-2">{a.promptProfile}</p>}
          </div>
          <div>
            <div className="text-foreground font-medium">Seat 2</div>
            {b?.id ? <Link className="underline hover:no-underline" href={`/agent/${b.id}`}>{b.name}</Link> : <span>CPU</span>}
            {b?.promptProfile && <p className="mt-1 line-clamp-2">{b.promptProfile}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-6">
        {rounds.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">No rounds recorded for this match.</CardContent>
          </Card>
        )}
        {rounds.map((r) => (
          <Card key={r.id} className="overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Round {r.idx}</span>
                {r.winner && <span className="px-2 py-0.5 rounded bg-accent text-accent-foreground text-xs">Winner: {r.winner}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {r.prompt && (
                <div className="mb-4">
                  <div className="text-foreground font-medium">Prompt</div>
                  <p className="text-muted-foreground whitespace-pre-wrap">{r.prompt}</p>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                {r.aOutput && (
                  <div>
                    <div className="text-foreground font-medium">Seat 1 Output</div>
                    <p className="text-muted-foreground whitespace-pre-wrap">{r.aOutput}</p>
                  </div>
                )}
                {r.bOutput && (
                  <div>
                    <div className="text-foreground font-medium">Seat 2 Output</div>
                    <p className="text-muted-foreground whitespace-pre-wrap">{r.bOutput}</p>
                  </div>
                )}
              </div>
              {r.judgeNotes && (
                <div className="mt-4">
                  <div className="text-foreground font-medium">Judge Notes</div>
                  <p className="text-muted-foreground whitespace-pre-wrap">{r.judgeNotes}</p>
                </div>
              )}
              {r.ipfsCid && (
                <div className="mt-4 text-xs text-muted-foreground">
                  IPFS CID: <span className="font-mono">{r.ipfsCid}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}