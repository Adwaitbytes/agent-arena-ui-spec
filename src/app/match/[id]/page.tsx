"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, Progress } from "@/components/ui/progress";
import { Loader2, Play, Pause, SkipBack, SkipForward, Replay, AlertCircle, Crown } from "lucide-react";
import { toast } from "sonner";

interface Round {
  id: number;
  idx: number;
  question: string;
  answerA: string;
  answerB: string;
  judgeScores?: { A: number; B: number };
  rationale?: string;
}

interface Match {
  id: number;
  scoreA: number;
  scoreB: number;
  winner: string;
  ipfsCid?: string;
  agents: { A: { name: string }; B: { name: string } };
}

export default function MatchReplayPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.id as string;
  const [match, setMatch] = useState<Match | null>(null);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);

  useEffect(() => {
    fetchMatch();
  }, [matchId]);

  const fetchMatch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/match/${matchId}`);
      const json = await res.json();
      if (json.ok) {
        setMatch(json.data.match);
        setRounds(json.data.rounds || []);
        setCurrentRound(0);
      } else {
        toast.error('Match not found');
        router.push('/match');
      }
    } catch (e) {
      toast.error('Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  const goToRound = (idx: number) => {
    setCurrentRound(idx);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying && currentRound < rounds.length - 1) {
      // Start auto-advance if enabled
      const advance = () => {
        if (isPlaying && currentRound < rounds.length - 1) {
          setCurrentRound(prev => prev + 1);
          if (autoAdvance) {
            setTimeout(advance, 3000); // 3s per round
          }
        }
      };
      advance();
    }
  };

  const resetReplay = () => {
    setCurrentRound(0);
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading match...</span>
      </div>
    );
  }

  if (!match || rounds.length === 0) {
    return <div>Match not found</div>;
  }

  const current = rounds[currentRound];
  const progress = ((currentRound + 1) / rounds.length) * 100;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Match #{matchId}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>{match.agents.A.name} vs {match.agents.B.name}</span>
            <Badge variant="secondary" className="px-3 py-1">
              Final: {match.scoreA} - {match.scoreB}
            </Badge>
            {match.winner && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 text-sm"
              >
                <Crown className="size-4 text-chart-4" />
                Winner: {match.winner}
              </motion.div>
            )}
          </div>
        </div>
        {match.ipfsCid && (
          <a
            href={`https://ipfs.io/ipfs/${match.ipfsCid}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            View on IPFS
          </a>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground mt-2">
          <span>Round {currentRound + 1} of {rounds.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
      </div>

      {/* Replay Controls */}
      <div className="flex items-center justify-center gap-2 mb-8 p-4 bg-muted/50 rounded-lg">
        <Button
          size="sm"
          variant="ghost"
          onClick={resetReplay}
          disabled={currentRound === 0}
        >
          <Replay className="h-4 w-4 mr-2" />
          Reset
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => goToRound(currentRound - 1)}
          disabled={currentRound === 0 || loading}
        >
          <SkipBack className="h-4 w-4 mr-2" />
          Previous
        </Button>
        <Button
          size="sm"
          variant={isPlaying ? "default" : "outline"}
          onClick={togglePlay}
          className="px-6"
        >
          {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
          {isPlaying ? "Pause" : "Play"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => goToRound(currentRound + 1)}
          disabled={currentRound === rounds.length - 1 || loading}
        >
          <SkipForward className="h-4 w-4 mr-2" />
          Next
        </Button>
        {!isPlaying && (
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={autoAdvance}
              onChange={(e) => setAutoAdvance(e.target.checked)}
              className="rounded"
            />
            Auto-advance
          </label>
        )}
      </div>

      {/* Current Round Display */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentRound}
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
              <CardTitle className="flex items-center justify-between">
                <span>Round {currentRound + 1}</span>
                {current.judgeScores && (
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">A: {current.judgeScores.A}</span>
                    <span className="flex items-center gap-1">B: {current.judgeScores.B}</span>
                  </div>
                )}
              </CardTitle>
              {current.question && (
                <p className="text-muted-foreground mt-2 italic">{current.question}</p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Agent A Output */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-6 border-r lg:border-r border-border/50 bg-gradient-to-b from-background to-muted/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Bot className="size-4" />
                      {match.agents.A.name}
                    </h3>
                    {current.judgeScores && (
                      <Badge variant="secondary" className="px-2 py-1">
                        Score: {current.judgeScores.A}
                      </Badge>
                    )}
                  </div>
                  <div className="prose prose-sm max-w-none text-foreground bg-accent/5 p-4 rounded-lg min-h-[200px]">
                    <p className="whitespace-pre-wrap">{current.answerA || "Generating..."}</p>
                  </div>
                </motion.div>

                {/* Agent B Output */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 }}
                  className="p-6 bg-gradient-to-b from-background to-muted/20"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold flex items-center gap-2">
                      <Bot className="size-4" />
                      {match.agents.B.name}
                    </h3>
                    {current.judgeScores && (
                      <Badge variant="secondary" className="px-2 py-1">
                        Score: {current.judgeScores.B}
                      </Badge>
                    )}
                  </div>
                  <div className="prose prose-sm max-w-none text-foreground bg-accent/5 p-4 rounded-lg min-h-[200px]">
                    <p className="whitespace-pre-wrap">{current.answerB || "Generating..."}</p>
                  </div>
                </motion.div>
              </div>

              {/* Judge Rationale */}
              {current.rationale && (
                <div className="p-6 bg-destructive/5 border-t border-destructive/10">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <AlertCircle className="size-4 text-destructive" />
                    Judge's Rationale
                  </h4>
                  <p className="text-sm text-muted-foreground italic">{current.rationale}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Round Navigation Pills */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {rounds.map((_, idx) => (
          <Button
            key={idx}
            size="sm"
            variant={currentRound === idx ? "default" : "ghost"}
            className={`${
              currentRound === idx ? 'bg-chart-4 hover:bg-chart-4/90' : ''
            }`}
            onClick={() => goToRound(idx)}
          >
            Round {idx + 1}
          </Button>
        ))}
      </div>
    </div>
  );
}