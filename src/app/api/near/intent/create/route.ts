import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Server env (do not expose to client)
const NEAR_NETWORK = process.env.NEAR_NETWORK || process.env.NEXT_PUBLIC_NEAR_NETWORK
const NEAR_INTENTS_BASE_URL = process.env.NEAR_INTENTS_BASE_URL

const createIntentSchema = z.object({
  action: z.enum(['join', 'stake', 'claim']),
  amount: z.string().optional(), // for stake/claim (yocto format or decimal per provider)
  matchId: z.number().int().optional(),
  metadata: z.record(z.any()).optional(),
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
    const parsed = createIntentSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: parsed.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      )
    }

    const { action, amount, matchId, metadata } = parsed.data

    // For now, just scaffold a payload the client can use to open an intents URL.
    // Later: sign payload server-side and call solver endpoint.
    const intentPayload = {
      network: NEAR_NETWORK,
      action,
      amount: amount ?? null,
      matchId: matchId ?? null,
      metadata: metadata ?? null,
      // Example deep link target for providers that accept GET payloads
      url: `${NEAR_INTENTS_BASE_URL}/intent/create?action=${encodeURIComponent(action)}${amount ? `&amount=${encodeURIComponent(amount)}` : ''}${matchId ? `&matchId=${matchId}` : ''}`,
    }

    return NextResponse.json({ ok: true, data: intentPayload }, { status: 201 })
  } catch (e) {
    console.error('POST /api/near/intent/create error:', e)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}