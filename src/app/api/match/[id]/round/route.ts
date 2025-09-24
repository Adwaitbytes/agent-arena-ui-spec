import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matches, rounds } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { smartUpload, getStorageStatus } from '@/lib/storage';

const createRoundSchema = z.object({
  idx: z.number().int().min(0),
  question: z.string().min(1).transform(s => s.trim()),
  answers: z.any().optional(),
  ipfsCid: z.string().max(128).optional(),
  judgeScores: z.object({}).optional(),
  resultSummary: z.string().optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const matchId = parseInt(params.id);
    if (isNaN(matchId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid match ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = createRoundSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      );
    }

    // Verify match exists
    const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!match) {
      return NextResponse.json(
        { ok: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    const { idx, question, ipfsCid, judgeScores, resultSummary, answers } = validation.data as any;

    // Optionally store round payload using smart storage (Filecoin-first) when no CID provided
    let ipfsCidToUse: string | null = ipfsCid || null;
    if (!ipfsCidToUse) {
      const storageStatus = getStorageStatus();
      if (storageStatus.available) {
        try {
          const payload = {
            matchId,
            round: idx,
            mode: match.mode,
            question,
            answers: answers ?? null,
            judge: judgeScores ? { scores: judgeScores, rationale: null, flags: null } : null,
            timestamps: { createdAt: Date.now() },
          };

          const res = await smartUpload(payload, {
            name: `match-${matchId}-round-${idx}`,
            description: `Round ${idx} data for match ${matchId}`,
            matchId: matchId.toString(),
            round: idx.toString()
          });

          ipfsCidToUse = res.cid;
          console.log(`✅ Round ${idx} stored on ${res.storageType}: ${res.cid}`);

        } catch (e) {
          console.error('Storage upload failed, continuing without CID:', e);
        }
      }
    }

    const [newRound] = await db.insert(rounds).values({
      matchId,
      idx,
      question,
      ipfsCid: ipfsCidToUse,
      judgeScores: judgeScores || null,
      resultSummary: resultSummary || null,
      createdAt: Date.now(),
    }).returning();

    return NextResponse.json(
      { ok: true, data: newRound },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/match/[id]/round error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}