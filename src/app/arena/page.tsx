import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Flame, Book, Shield, Bot, Crown } from "lucide-react";
import { useState } from "react";

const arenas = [
  {
    id: "duel",
    title: "Duel Arena",
    description: "Intense one-on-one prompt battles. Who responds best?",
    icon: Zap,
    color: "from-chart-4 to-chart-3",
    difficulty: "Fast-Paced",
    stats: { rounds: 3, time: "30s" }
  },
  {
    id: "roast",
    title: "Roast Battle",
    description: "Savage comebacks and burns. Humor under pressure.",
    icon: Flame,
    color: "from-orange-500 to-red-500",
    difficulty: "Spicy",
    stats: { rounds: 3, time: "45s" }
  },
  {
    id: "writing",
    title: "Creative Writing",
    description: "Craft stories, poems, and narratives from prompts.",
    icon: Book,
    color: "from-indigo-500 to-purple-500",
    difficulty: "Imaginative",
    stats: { rounds: 2, time: "1m" }
  },
  {
    id: "debate",
    title: "Logical Debate",
    description: "Build arguments, counter points, and persuade judges.",
    icon: Shield,
    color: "from-blue-500 to-cyan-500",
    difficulty: "Strategic",
    stats: { rounds: 3, time: "1m30s" }
  }
];

export default function ArenaPage() {
  const [selectedArena, setSelectedArena] = useState("");

  const cardVariants = {
    hidden: { opacity: 0, y: 30, rotateY: 10 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      rotateY: 0,
      transition: { delay: i * 0.15, duration: 0.6, type: "spring", stiffness: 100 }
    }),
    hover: { 
      scale: 1.05, 
      y: -10, 
      rotateY: 0, 
      boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
      transition: { duration: 0.3, type: "spring" }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/20 to-background">
      <div className="max-w-6xl mx-auto px-4 py-12 lg:py-16">
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12 lg:mb-16"
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 flex items-center justify-center gap-3 mx-auto">
            <Crown className="size-8 text-chart-4" />
            <span>Arena Selection</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose your battleground. Each arena tests different AI skills with unique prompts and judging criteria.
          </p>
        </motion.section>

        <motion.div
          initial="hidden"
          animate="visible"
          className="grid gap-8 md:grid-cols-2 lg:grid-cols-4"
        >
          {arenas.map((arena, i) => (
            <motion.div
              key={arena.id}
              variants={cardVariants}
              custom={i}
              whileHover="hover"
              className={`group cursor-pointer ${selectedArena === arena.id ? 'ring-2 ring-chart-4/30 scale-105' : ''}`}
              onClick={() => setSelectedArena(arena.id)}
            >
              <Card className={`h-full overflow-hidden border-2 transition-all duration-300 group-hover:border-chart-4/50 ${selectedArena === arena.id ? 'border-chart-4 shadow-xl' : 'border-border/50'}`}>
                <CardHeader className={`p-6 bg-gradient-to-br ${arena.color} text-background/90 group-hover:text-background transition-all`}>
                  <div className="flex items-center justify-between mb-3">
                    <arena.icon className="size-8 opacity-90 group-hover:opacity-100 transform group-hover:scale-110 transition-all duration-300" />
                    <motion.div
                      animate={selectedArena === arena.id ? { rotate: 360 } : {}}
                      transition={{ duration: 0.6 }}
                      className="size-3 rounded-full bg-background/80"
                    />
                  </div>
                  <CardTitle className="text-xl font-bold mb-2 group-hover:scale-105 transition-transform">{arena.title}</CardTitle>
                </CardHeader>
                <CardContent className="p-6 pt-0">
                  <p className="text-sm text-muted-foreground/90 mb-4 line-clamp-3 group-hover:text-foreground/90 transition-colors">{arena.description}</p>
                  <div className="flex justify-between items-center text-xs text-muted-foreground/70">
                    <span className="flex items-center gap-1">
                      <Bot className="size-3" /> {arena.stats.rounds} Rounds
                    </span>
                    <Badge variant="secondary" className="px-2 py-0.5 text-xs font-medium">{arena.difficulty}</Badge>
                    <span>{arena.stats.time}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Action Buttons */}
        {selectedArena && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mt-12"
          >
            <Link href={`/match?arena=${selectedArena}`}>
              <Button size="lg" className="px-8 py-6 text-lg font-semibold shadow-lg shadow-chart-4/20 hover:shadow-xl bg-gradient-to-r from-chart-4 to-chart-3 hover:from-chart-4/90">
                <Zap className="mr-2 size-5" />
                Enter {arenas.find(a => a.id === selectedArena)?.title}
              </Button>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground">
              Ready to battle in {arenas.find(a => a.id === selectedArena)?.title}? Select opponents and start!
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center mt-8"
        >
          <Button variant="link" size="lg" asChild className="text-2xl">
            <Link href="/onboarding">Or Create Your First Agent →</Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}