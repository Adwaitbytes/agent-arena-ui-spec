import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WinBurst } from "./WinBurst";
import { ShareBar } from "./ShareBar";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { generateResponse } from '@/lib/gemini';

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

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const data = await getMatch(params.id);
  if (!data) {
    return {
      title: 'Match Not Found | Agent Battle Arena',
    };
  }
  const { match, players, rounds } = data;

  const a = players.find(p => p.seat === 1)?.agent;
  const b = players.find(p => p.seat === 2)?.agent;

  // Compute overall winner label from round winners (fallbacks handled)
  const overallWinnerRaw = (() => {
    const names = rounds.map(r => (r.winner || '').trim()).filter(Boolean);
    if (names.length === 0) return '';
    const counts = new Map<string, number>();
    for (const n of names) counts.set(n, (counts.get(n) || 0) + 1);
    return Array.from(counts.entries()).sort((x, y) => y[1] - x[1])[0][0];
  })();
  const overallWinner = (() => {
    const w = overallWinnerRaw.toLowerCase();
    if (!w) return '';
    const aName = (a?.name || '').toLowerCase();
    const bName = (b?.name || '').toLowerCase();
    if (w === aName) return a?.name || '';
    if (w === bName) return b?.name || '';
    if (w === 'a' || w === '1' || w === 'seat 1') return a?.name || 'Seat 1';
    if (w === 'b' || w === '2' || w === 'seat 2') return b?.name || 'Seat 2';
    return overallWinnerRaw; // already a human-readable label
  })();

  const mode = match.mode || 'Duel';
  const title = overallWinner 
    ? `Agent Battle Replay: ${overallWinner} Wins Match #${match.id} in ${mode}`
    : `Agent Battle Replay: Match #${match.id} in ${mode}`;
  
  const description = overallWinner 
    ? `Relive the epic ${mode} battle where ${overallWinner} defeated ${b?.name || a?.name || 'AI Agent'}! See all rounds, outputs, and judge notes.`
    : `Relive Match #${match.id} in ${mode} mode between ${a?.name || 'AI Agent'} and ${b?.name || 'AI Agent'}. Full replay with rounds and outputs.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${process.env.NEXT_PUBLIC_BASE_URL || ''}/match/${match.id}`,
      images: [
        {
          url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop', // Vibrant writing arena image as OG fallback (matches design system)
          width: 1200,
          height: 630,
          alt: `${overallWinner || 'Epic'} AI Agent Battle Replay`,
        },
      ],
    },
  };
}

export default async function MatchReplayPage({ params }: { params: { id: string } }) {
  const data = await getMatch(params.id);
  if (!data) notFound();
  const { match, players, rounds } = data;

  const a = players.find(p => p.seat === 1)?.agent;
  const b = players.find(p => p.seat === 2)?.agent;

  // Compute overall winner label from round winners (fallbacks handled)
  const overallWinnerRaw = (() => {
    const names = rounds.map(r => (r.winner || '').trim()).filter(Boolean);
    if (names.length === 0) return '';
    const counts = new Map<string, number>();
    for (const n of names) counts.set(n, (counts.get(n) || 0) + 1);
    return Array.from(counts.entries()).sort((x, y) => y[1] - x[1])[0][0];
  })();
  const overallWinner = (() => {
    const w = overallWinnerRaw.toLowerCase();
    if (!w) return '';
    const aName = (a?.name || '').toLowerCase();
    const bName = (b?.name || '').toLowerCase();
    if (w === aName) return a?.name || '';
    if (w === bName) return b?.name || '';
    if (w === 'a' || w === '1' || w === 'seat 1') return a?.name || 'Seat 1';
    if (w === 'b' || w === '2' || w === 'seat 2') return b?.name || 'Seat 2';
    return overallWinnerRaw; // already a human-readable label
  })();

  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [loading, setLoading] = useState(false);

  const startRound = async (idx: number) => {
    setLoading(true);
    const res = await fetch(`/api/match/${params.id}/round`, {
      method: 'POST',
      body: JSON.stringify({ idx, mode: match.mode, agentAId: a?.id, agentBId: b?.id }),
    });
    const data = await res.json();
    setRounds(prev => [...prev, data.data]);
    setCurrentRound(idx + 1);
    setLoading(false);
    if (data.data.judgeScores) {
      toast.success(`Round ${idx+1} scored!`);
    }
  };

  const finishMatch = async () => {
    const res = await fetch(`/api/match/${params.id}/finish`, { method: 'POST', body: JSON.stringify({ summary: 'Battle complete' }) });
    const { data } = await res.json();
    setMatchResult(data);
    toast.success(`Winner: ${data.winner}! View on IPFS: ${data.ipfsCid}`);
  };

  if (currentRound < 3) {
    return (
      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1">
          <h2>Round {currentRound + 1}/3</h2>
          <p className="mb-4">{rounds[currentRound]?.question || 'Click to start'}</p>
          <Button onClick={() => startRound(currentRound)} disabled={loading}>Generate Responses</Button>
          {loading && <div>Generating... (Gemini AI)</div>}
        </div>
        {rounds[currentRound]?.answerA && (
          <div className="flex-1 border-l pl-4">
            <h3>Agent A Response</h3>
            <p>{rounds[currentRound].answerA}</p>
          </div>
        )}
        {rounds[currentRound]?.answerB && (
          <div className="flex-1">
            <h3>Agent B Response</h3>
            <p>{rounds[currentRound].answerB}</p>
          </div>
        )}
        {rounds[currentRound]?.judgeScores && (
          <div className="w-full mt-4">
            <h3>Scores</h3>
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent>A: {JSON.parse(rounds[currentRound].judgeScores).scoreA.style + ...} total</CardContent>
              </Card>
              <Card>
                <CardContent>B: {JSON.parse(rounds[currentRound].judgeScores).scoreB.style + ...} total</CardContent>
              </Card>
            </div>
            <p>Winner: {JSON.parse(rounds[currentRound].judgeScores).winner}</p>
          </div>
        )}
        {currentRound === 3 && <Button onClick={finishMatch}>Finish Battle</Button>}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
          Match #{match.id} Replay
          {overallWinner && (
            <span className="hidden sm:inline">
              <WinBurst winner={overallWinner} />
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="secondary"><Link href={`/arena`}>Back to Arenas</Link></Button>
          <Button asChild variant="outline">
            <Link href={`/arena?mode=${encodeURIComponent(match.mode || 'duel')}&rematch=true`}>Play Again in ${match.mode || 'Duel'}</Link>
          </Button>
        </div>
      </div>

      {/* Share bar (mobile-friendly) */}
      <div className="mt-4 flex items-center justify-between gap-3">
        {overallWinner && (
          <span className="sm:hidden"><WinBurst winner={overallWinner} /></span>
        )}
        <ShareBar path={`/match/${match.id}`} text={`My AI just battled in Agent Battle Arena — Match #${match.id} ${overallWinner ? `| Winner: ${overallWinner}` : ''} ⚔️`}/>
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