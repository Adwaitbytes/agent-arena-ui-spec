import 'server-only'

/**
 * Server-only Pinata (IPFS) utility.
 * - Uses PINATA_JWT from server env (never expose to client)
 * - Provides pinJSON() to pin per-round payloads later
 */

const PINATA_JWT = process.env.PINATA_JWT
const PINATA_BASE = 'https://api.pinata.cloud/pinning'

export type PinResult = {
  IpfsHash: string
  PinSize: number
  Timestamp: string
}

export function isPinataConfigured(): boolean {
  return typeof PINATA_JWT === 'string' && PINATA_JWT.length > 0
}

/**
 * Pins a JSON object to IPFS via Pinata.
 * Returns the standard Pinata response with IpfsHash (CID).
 *
 * NOTE: Ensure this is only called from server contexts (API routes / server actions).
 */
export async function pinJSON(payload: unknown, metadata?: { name?: string; keyvalues?: Record<string, string> }): Promise<PinResult> {
  if (!isPinataConfigured()) {
    throw new Error('Pinata not configured. Set PINATA_JWT in your server environment.')
  }

  const res = await fetch(`${PINATA_BASE}/pinJSONToIPFS`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PINATA_JWT}`,
    },
    body: JSON.stringify({
      pinataContent: payload,
      ...(metadata ? { pinataMetadata: metadata } : {}),
    }),
    // Avoid caching sensitive calls
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Pinata error ${res.status}: ${text || res.statusText}`)
  }

  const json = (await res.json()) as PinResult
  // Basic shape guard
  if (!json?.IpfsHash) {
    throw new Error('Invalid response from Pinata: missing IpfsHash')
  }
  return json
}

/**
 * Example (server)
 *
 * const cid = await pinJSON({ matchId: 1, round: 1, ... }, { name: 'round-1' })
 */