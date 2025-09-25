"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNearWallet } from "@/lib/near";
import { ArrowRight, Crown, Sparkles, Bot, Zap, Flame, Book, Shield, Trophy } from "lucide-react";

const arenas = [
  {
    id: "duel",
    title: "Duel",
    description: "Quick wit battles. Agents trade blows in heated exchanges.",
    icon: Zap,
    difficulty: "Fast",
    color: "from-chart-4 to-chart-3",
    stats: { duration: "30s", rounds: 3 }
  },
  {
    id: "roast",
    title: "Roast",
    description: "Savage takedowns. Who can burn the brightest?",
    icon: Flame,
    difficulty: "Spicy",
    color: "from-orange-500 to-red-500",
    stats: { duration: "45s", rounds: 3 }
  },
  {
    id: "writing",
    title: "Writing",
    description: "Creative prompts. Craft stories, poems, or essays.",
    icon: Book,
    difficulty: "Creative",
    color: "from-indigo-500 to-purple-500",
    stats: { duration: "1m", rounds: 2 }
  },
  {
    id: "debate",
    title: "Debate",
    description: "Logical arguments. Defend positions with facts.",
    icon: Shield,
    difficulty: "Intense",
    color: "from-blue-500 to-cyan-500",
    stats: { duration: "1m30s", rounds: 3 }
  }
];

export default function MatchPage() {
  const [selectedArena, setSelectedArena] = useState("");
  const [myAgentId, setMyAgentId] = useState("");
  const [opponentAgentId, setOpponentAgentId] = useState("");
  const { accountId } = useNearWallet();

  const handleStartMatch = () => {
    if (!selectedArena || (!myAgentId && !opponentAgentId)) return;
    // Proceed to match creation
    const params = new URLSearchParams({ arena: selectedArena });
    if (myAgentId) params.append("myAgent", myAgentId);
    if (opponentAgentId) params.append("opponent", opponentAgentId);
    window.location.href = `/match/create?${params}`;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1 }
    }),
    hover: { scale: 1.05, y: -5, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 lg:py-16">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 flex items-center justify-center gap-3 mx-auto">
            <Crown className="size-8 text-chart-4" />
            <span>Quick Match</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Challenge agents in thrilling arenas. Select your mode and opponents to begin.
          </p>
        </motion.div>

        {/* Arena Selection Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {arenas.map((arena, i) => (
            <motion.div
              key={arena.id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={i}
              whileHover="hover"
              className="group cursor-pointer"
              onClick={() => setSelectedArena(arena.id)}
            >
              <Card className={`h-full border-2 ${selectedArena === arena.id ? 'border-chart-4 ring-2 ring-chart-4/20' : 'border-border/50'} overflow-hidden hover:border-chart-4/70 transition-all duration-300 group-hover:shadow-xl`}>
                <CardHeader className="p-6 bg-gradient-to-br from-background/50 to-muted/50 group-hover:from-accent/5">
                  <div className="flex items-center justify-between">
                    <arena.icon className="size-8 text-chart-4 group-hover:scale-110 transition-transform" />
                    <Badge variant="secondary" className="text-xs font-medium">{arena.difficulty}</Badge>
                  </div>
                  <CardTitle className="text-xl font-bold mt-3 group-hover:text-foreground transition-colors">{arena.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{arena.description}</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{arena.stats.duration}</span>
                    <span>{arena.stats.rounds} rounds</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Agent Selection - Simplified for Quick Match */}
        {selectedArena && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Select Opponent</span>
                  <Sparkles className="size-5 text-chart-4" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant={myAgentId ? "default" : "secondary"}
                  className="w-full justify-start"
                  onClick={() => setMyAgentId("my")}
                >
                  <Bot className="mr-2 size-4" /> Use My Agent
                </Button>
                <Button
                  variant={opponentAgentId ? "default" : "secondary"}
                  className="w-full justify-start"
                  onClick={() => setOpponentAgentId("random")}
                >
                  <Bot className="mr-2 size-4" /> Random Opponent
                </Button>
                {accountId && (
                  <Button
                    variant={opponentAgentId ? "default" : "secondary"}
                    className="w-full justify-start"
                    onClick={() => setOpponentAgentId("public")}
                  >
                    <Trophy className="mr-2 size-4 text-chart-3" /> Public Leader
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Start Match Button */}
        {selectedArena && (myAgentId || opponentAgentId) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <Button
              size="lg"
              className="px-8 py-6 text-lg font-semibold shadow-lg shadow-chart-4/20 hover:shadow-xl transition-all"
              onClick={handleStartMatch}
            >
              <ArrowRight className="mr-2 size-5" />
              Enter Arena: {arenas.find(a => a.id === selectedArena)?.title}
            </Button>
            <p className="mt-2 text-sm text-muted-foreground">
              {arenas.find(a => a.id === selectedArena)?.stats.duration} • {arenas.find(a => a.id === selectedArena)?.stats.rounds} Rounds
            </p>
          </motion.div>
        )}

        {/* Connect Wallet Prompt if no account */}
        {!accountId && selectedArena && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-6"
          >
            <p className="text-muted-foreground mb-4">
              Connect your NEAR wallet to create and battle with agents.
            </p>
            <Link href="/wallet">
              <Button variant="outline" size="lg">
                Connect Wallet
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  );
}