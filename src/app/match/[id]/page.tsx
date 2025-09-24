"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Play, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

export default function MatchPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id;
  const [match, setMatch] = useState(null);
  const [rounds, setRounds] = useState([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [judging, setJudging] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const fetchMatch = async () => {
    const res = await fetch(`/api/match/${matchId}`);
    const json = await res.json();
    if (json.ok) {
      setMatch(json.data.match);
      setRounds(json.data.rounds || []);
      if (json.data.rounds?.length === 3) setFinished(true);
    } else {
      toast.error('Match not found');
      router.push('/arena');
    }
    setLoading(false);
  };

  const startRound = async (idx) => {
    if (generating || finished) return;
    setGenerating(true);
    try {
      const res = await fetch(`/api/match/${matchId}/generate-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idx })
      });
      const json = await res.json();
      if (json.ok) {
        setRounds(prev => [...prev, json.data]);
        if (idx < 2) {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Brief pause
          await judgeRound(idx);
        } else {
          await finishMatch();
        }
      } else {
        toast.error(json.error);
      }
    } catch (e) {
      toast.error('Failed to generate round');
    } finally {
      setGenerating(false);
    }
  };

  const judgeRound = async (idx) => {
    setJudging(true);
    try {
      const res = await fetch(`/api/match/${matchId}/judge-round`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idx })
      });
      const json = await res.json();
      if (json.ok) {
        setRounds(prev => prev.map(r => r.idx === idx ? { ...r, judgeScores: json.data.scores, rationale: json.data.rationale } : r));
      } else {
        toast.error(json.error);
      }
    } catch (e) {
      toast.error('Failed to judge round');
    } finally {
      setJudging(false);
    }
  };

  const finishMatch = async () => {
    try {
      const res = await fetch(`/api/match/${matchId}/finish`, { method: 'POST' });
      const json = await res.json();
      if (json.ok) {
        setMatch(json.data.match);
        setFinished(true);
        toast.success(`Match finished! Winner: ${json.data.winner}. View on IPFS: ${json.data.match.ipfsCid}`);
      } else {
        toast.error(json.error);
      }
    } catch (e) {
      toast.error('Failed to finish match');
    }
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Match #{matchId}</h1>

      <Progress value={(currentRound / 3) * 100} className="mb-6" />

      {!finished ? (
        <div className="space-y-6">
          {rounds.map((round, i) => (
            <Card key={round.id}>
              <CardHeader>
                <CardTitle>Round {round.idx + 1}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {round.question && <p><strong>Prompt:</strong> {round.question}</p>}
                <div className="grid sm:grid-cols-2 gap-4">
                  {round.answerA && <div><strong>Agent A:</strong> <p>{round.answerA}</p></div>}
                  {round.answerB && <div><strong>Agent B:</strong> <p>{round.answerB}</p></div>}
                </div>
                {round.judgeScores && (
                  <div>
                    <strong>Scores:</strong> A: {JSON.stringify(round.judgeScores)}, Rationale: {round.rationale}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <Button onClick={() => startRound(currentRound)} disabled={generating || judging || rounds.length > currentRound}>
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
            {generating ? 'Generating...' : judging ? 'Judging...' : `Start Round ${currentRound + 1}`}
          </Button>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Match Complete!</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Final Scores: A {match.scoreA} - B {match.scoreB}</p>
            <p>Winner: {match.winner}</p>
            {match.ipfsCid && <p>IPFS CID: <a href={`https://ipfs.io/ipfs/${match.ipfsCid}`} target="_blank">{match.ipfsCid}</a></p>}
          </CardContent>
        </Card>
      )}
    </div>
  );
}