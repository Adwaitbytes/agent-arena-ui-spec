import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/db'
import { matches } from '@/db/schema'
import { eq } from 'drizzle-orm'

// Server env (do not expose to client)
const NEAR_NETWORK = process.env.NEAR_NETWORK || process.env.NEXT_PUBLIC_NEAR_NETWORK
const NEAR_INTENTS_BASE_URL = process.env.NEAR_INTENTS_BASE_URL

const confirmSchema = z.object({
  matchId: z.number().int(),
  intentsTx: z.string().min(1), // solver execution receipt/tx id
  vrfProof: z.string().optional(),
  // Optional attached evidence pointers (e.g., IPFS CIDs)
  evidence: z
    .object({
      roundsCid: z.string().optional(),
      summaryCid: z.string().optional(),
    })
    .optional(),
})

export async function POST(request: NextRequest) {
  // If required env is missing, return 501 Not Implemented
  if (!NEAR_NETWORK || !NEAR_INTENTS_BASE_URL) {
    return NextResponse.json(
      {
        ok: false,
        error: 'NEAR intents not configured',
        missing: {
          NEAR_NETWORK: !NEAR_NETWORK,
          NEAR_INTENTS_BASE_URL: !NEAR_INTENTS_BASE_URL,
        },
      },
      { status: 501 }
    )
  }

  try {
    const body = await request.json()
    const parsed = confirmSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      )
    }

    const { matchId, intentsTx, vrfProof } = parsed.data

    // Update match with intentsTx (and optional vrfProof)
    const [updated] = await db
      .update(matches)
      .set({ intentsTx, vrfProof: vrfProof ?? null })
      .where(eq(matches.id, matchId))
      .returning()

    if (!updated) {
      return NextResponse.json(
        { ok: false, error: 'Match not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true, data: updated })
  } catch (e) {
    console.error('POST /api/near/intent/confirm error:', e)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}