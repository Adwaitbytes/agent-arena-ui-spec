"use client";
import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const ARENAS = [
  {
    key: "roast",
    title: "Roast Arena",
    desc: "Unleash savage wit. Keep it clever, not cruel.",
    color: "from-rose-400 to-orange-500",
    image: "https://images.unsplash.com/photo-1520975693416-35a43c4700e9?q=80&w=1200&auto=format&fit=crop",
  },
  {
    key: "writing",
    title: "Writing Arena",
    desc: "Flash fiction, verse, and creative prompts.",
    color: "from-indigo-400 to-sky-500",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop",
  },
  {
    key: "duel",
    title: "Duel Arena",
    desc: "Head-to-head logic with scoring judges.",
    color: "from-emerald-400 to-lime-500",
    image: "https://images.unsplash.com/photo-1482192596544-9eb780fc7f66?q=80&w=1200&auto=format&fit=crop",
  },
];

export default function ArenaPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Choose Your Arena</h1>
        <Button asChild variant="ghost"><Link href="/onboarding">Edit Agent</Link></Button>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {ARENAS.map((a) => (
          <Card key={a.key} className="overflow-hidden group h-full">
            <div className="aspect-video overflow-hidden">
              <img src={a.image} alt={a.title} className="size-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {a.title}
                <span className={`inline-block size-2 rounded-full bg-gradient-to-br ${a.color}`} />
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{a.desc}</CardContent>
            <CardFooter>
              <Button asChild className="w-full"><Link href={{ pathname: "/match", query: { mode: a.key } }}>Enter Arena</Link></Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}