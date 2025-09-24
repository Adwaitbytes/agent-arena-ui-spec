import 'server-only'

import { uploadToFilecoin, downloadFromFilecoin, isFilecoinConfigured } from './filecoin'
import { pinJSON as uploadToPinata, isPinataConfigured } from './pinata'

/**
 * Smart storage system with Filecoin-first approach
 * 
 * Priority:
 * 1. Filecoin (decentralized, permanent storage)
 * 2. Pinata/IPFS (fallback for reliability)
 */

export interface StorageUploadResult {
    cid: string
    size: number
    url: string
    storageType: 'filecoin' | 'pinata'
    pieceCid?: string   // Filecoin specific
    pieceId?: number    // Filecoin specific
}

export type StorageProvider = 'filecoin' | 'pinata' | 'auto'

/**
 * Smart upload with automatic provider selection
 * Prefers Filecoin, falls back to Pinata if needed
 */
export async function smartUpload(
    data: unknown,
    metadata?: {
        name?: string
        description?: string
        matchId?: string
        round?: string
    },
    preferredProvider: StorageProvider = 'auto'
): Promise<StorageUploadResult> {

    console.log(`🎯 Smart upload starting (preferred: ${preferredProvider})`)

    // Determine provider strategy
    let tryFilecoin = false
    let tryPinata = false

    switch (preferredProvider) {
        case 'filecoin':
            if (!isFilecoinConfigured()) {
                throw new Error('Filecoin requested but FILECOIN_PRIVATE_KEY not configured')
            }
            tryFilecoin = true
            break

        case 'pinata':
            if (!isPinataConfigured()) {
                throw new Error('Pinata requested but PINATA_JWT not configured')
            }
            tryPinata = true
            break

        case 'auto':
            // Auto mode: prefer Filecoin, fallback to Pinata
            if (isFilecoinConfigured()) {
                tryFilecoin = true
                tryPinata = true // Enable fallback
            } else if (isPinataConfigured()) {
                tryPinata = true
            } else {
                throw new Error('No storage provider configured. Set FILECOIN_PRIVATE_KEY or PINATA_JWT')
            }
            break
    }

    // Try Filecoin first if enabled
    if (tryFilecoin) {
        try {
            console.log('🚀 Attempting Filecoin upload...')
            const result = await uploadToFilecoin(data, metadata)
            console.log('✅ Filecoin upload successful!')

            return {
                cid: result.pieceCid,
                size: result.size,
                url: result.url,
                storageType: 'filecoin',
                pieceCid: result.pieceCid,
                pieceId: result.pieceId
            }

        } catch (error) {
            console.warn('⚠️  Filecoin upload failed:', error)

            // Log specific error details for troubleshooting
            if (error instanceof Error) {
                if (error.message.includes('RetCode=33') || error.message.includes('insufficient funds')) {
                    console.warn('💡 Filecoin payment issue detected. Run: npx tsx scripts/setup-filecoin.ts')
                }
                if (error.message.includes('Failed to create data set')) {
                    console.warn('💡 Filecoin storage context creation failed. Check network and balance.')
                }
            }

            // If we're in auto mode, try Pinata fallback
            if (preferredProvider !== 'auto' || !tryPinata) {
                throw error
            }
            console.log('🔄 Falling back to Pinata...')
        }
    }

    // Try Pinata (either as primary choice or fallback)
    if (tryPinata) {
        try {
            console.log('📌 Attempting Pinata upload...')
            const result = await uploadToPinata(data, metadata)
            console.log('✅ Pinata upload successful!')

            return {
                cid: result.IpfsHash,
                size: result.PinSize,
                url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
                storageType: 'pinata'
            }

        } catch (error) {
            console.error('❌ Pinata upload failed:', error)
            throw error
        }
    }

    throw new Error('No storage provider available or configured')
}

/**
 * Smart download with automatic provider detection and fallback
 */
export async function smartDownload(cidOrPieceCid: string): Promise<unknown> {
    console.log(`📥 Smart download starting for CID/PieceCID: ${cidOrPieceCid}`)

    // Try Filecoin download first if configured
    if (isFilecoinConfigured()) {
        try {
            console.log('🔍 Trying Filecoin download...')
            const data = await downloadFromFilecoin(cidOrPieceCid)
            console.log('✅ Filecoin download successful!')
            return data
        } catch (error) {
            console.warn('⚠️  Filecoin download failed:', error)
        }
    }

    // Fallback to IPFS gateways
    const ipfsGateways = [
        `https://gateway.pinata.cloud/ipfs/${cidOrPieceCid}`,
        `https://ipfs.io/ipfs/${cidOrPieceCid}`,
        `https://cloudflare-ipfs.com/ipfs/${cidOrPieceCid}`
    ]

    for (const gateway of ipfsGateways) {
        try {
            console.log(`🔍 Trying IPFS gateway: ${gateway}`)

            const response = await fetch(gateway, {
                headers: { 'Accept': 'application/json' },
                signal: AbortSignal.timeout(10000)
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`)
            }

            const data = await response.json()
            console.log(`✅ Downloaded from: ${gateway}`)
            return data

        } catch (error) {
            console.warn(`❌ Failed ${gateway}:`, error)
            continue
        }
    }

    throw new Error(`Failed to download CID ${cidOrPieceCid} from all available sources`)
}

/**
 * Get storage system status and recommendations
 */
export function getStorageStatus() {
    const filecoinConfigured = isFilecoinConfigured()
    const pinataConfigured = isPinataConfigured()

    const hasAnyStorage = filecoinConfigured || pinataConfigured
    const preferredProvider = filecoinConfigured ? 'filecoin' :
        pinataConfigured ? 'pinata' :
            null

    return {
        configured: hasAnyStorage,
        available: hasAnyStorage,
        preferredProvider,
        filecoin: {
            configured: filecoinConfigured,
            available: filecoinConfigured,
            priority: 1
        },
        pinata: {
            configured: pinataConfigured,
            available: pinataConfigured,
            priority: 2
        },
        recommendations: {
            primary: 'Set FILECOIN_PRIVATE_KEY for decentralized Filecoin storage via Synapse SDK',
            fallback: 'Keep PINATA_JWT for reliability and faster access',
            optimal: 'Configure both for maximum reliability and performance'
        }
    }
}

/**
 * Check if data exists in storage (tries multiple sources)
 */
export async function checkDataExists(cid: string): Promise<boolean> {
    // Quick check via HEAD request to fastest gateway
    const gateways = [
        `https://gateway.pinata.cloud/ipfs/${cid}`,
        `https://nftstorage.link/ipfs/${cid}`,
        `https://ipfs.io/ipfs/${cid}`
    ]

    for (const gateway of gateways) {
        try {
            const response = await fetch(gateway, {
                method: 'HEAD',
                signal: AbortSignal.timeout(5000)
            })
            if (response.ok) return true
        } catch {
            continue
        }
    }

    return false
}
