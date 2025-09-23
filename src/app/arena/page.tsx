"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNearWallet } from '@/lib/near/NearWalletProvider';

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
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [userAgentId, setUserAgentId] = useState<number | null>(null);
  const [opponentAgentId, setOpponentAgentId] = useState<number | null>(null);
  const [userAgents, setUserAgents] = useState([]);
  const [showBrowseModal, setShowBrowseModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const { accountId } = useNearWallet();

  useEffect(() => {
    if (accountId) {
      fetchUserAgents();
    }
  }, [accountId]);

  const fetchUserAgents = async () => {
    if (!accountId) return;
    const res = await fetch(`/api/agents?userId=${accountId}`);
    const json = await res.json();
    if (json.ok) setUserAgents(json.data);
  };

  const handleStartMatch = async () => {
    if (!selectedMode || !userAgentId || !opponentAgentId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/match/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: selectedMode, userAgentId, opponentAgentId })
      });
      const json = await res.json();
      if (json.ok) {
        router.push(`/match/${json.data.matchId}`);
      }
    } catch (e) {
      // Toast error
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Select Arena Mode</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {ARENAS.map((a) => (
            <Card key={a.key} onClick={() => setSelectedMode(a.key)} className={`cursor-pointer ${selectedMode === a.key ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {a.title}
                  <span className={`inline-block size-2 rounded-full bg-gradient-to-br ${a.color}`} />
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{a.desc}</CardContent>
              <CardFooter>
                <Button className="w-full">Select {a.title}</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      {selectedMode && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Your Agent</h2>
            <select value={userAgentId || ''} onChange={(e) => setUserAgentId(parseInt(e.target.value))} className="w-full p-2 border rounded">
              <option value="">Choose your agent</option>
              {userAgents.map((agent: any) => (
                <option key={agent.id} value={agent.id}>{agent.name}</option>
              ))}
            </select>
            {!userAgentId && <p className="text-sm text-muted-foreground">Create one in <Link href="/onboarding">onboarding</Link></p>}
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-2">Opponent Agent</h2>
            <Button onClick={() => setShowBrowseModal(true)} className="w-full">Browse Public Agents</Button>
            {opponentAgentId && <p className="text-sm mt-2">Selected: Agent ID {opponentAgentId}</p>}
          </div>

          <Button onClick={handleStartMatch} disabled={!userAgentId || !opponentAgentId || loading} className="w-full">
            {loading ? 'Starting...' : `Start ${selectedMode} Battle`}
          </Button>
        </div>
      )}

      {showBrowseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Select Opponent</h3>
            <Button onClick={() => { setShowBrowseModal(false); setOpponentAgentId(1); }}>Example Agent 1</Button>
            <Button variant="secondary" onClick={() => setShowBrowseModal(false)} className="mt-2 w-full">Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}