import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matches } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const finishMatchSchema = z.object({
  summary: z.string().optional(),
  vrfProof: z.string().optional(),
  intentsTx: z.string().optional(),
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
    const validation = finishMatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      );
    }

    // Check if match exists and current status
    const [match] = await db.select().from(matches).where(eq(matches.id, matchId));
    if (!match) {
      return NextResponse.json(
        { ok: false, error: 'Match not found' },
        { status: 404 }
      );
    }

    if (match.status === 'finished') {
      return NextResponse.json(
        { ok: false, error: 'Match already finished' },
        { status: 400 }
      );
    }

    const { vrfProof, intentsTx } = validation.data;

    const [updatedMatch] = await db
      .update(matches)
      .set({
        status: 'finished',
        endedAt: Date.now(),
        vrfProof: vrfProof || match.vrfProof,
        intentsTx: intentsTx || match.intentsTx,
      })
      .where(eq(matches.id, matchId))
      .returning();

    return NextResponse.json({
      ok: true,
      data: updatedMatch,
    });
  } catch (error) {
    console.error('POST /api/match/[id]/finish error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}