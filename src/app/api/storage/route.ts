import { NextRequest, NextResponse } from 'next/server'
import { getStorageStatus } from '@/lib/storage'
import { getFilecoinInfo } from '@/lib/filecoin'

/**
 * GET /api/storage
 * Returns comprehensive storage system status and recommendations
 */
export async function GET(request: NextRequest) {
    try {
        const storageStatus = getStorageStatus()

        // Get detailed Filecoin info if configured
        let filecoinDetails = null
        if (storageStatus.filecoin.configured) {
            try {
                filecoinDetails = await getFilecoinInfo()
            } catch (error) {
                console.warn('Failed to get Filecoin details:', error)
                filecoinDetails = {
                    configured: true,
                    error: 'Failed to connect to NFT.Storage API',
                    apiStatus: 'error'
                }
            }
        }

        const responseData = {
            success: true,
            data: {
                storage: {
                    ...storageStatus,
                    filecoin: {
                        ...storageStatus.filecoin,
                        details: filecoinDetails
                    }
                },
                message: getStorageMessage(storageStatus),
                timestamp: new Date().toISOString()
            }
        }

        return NextResponse.json(responseData)

    } catch (error) {
        console.error('Storage status API error:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to get storage status',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

/**
 * Generate appropriate status message based on configuration
 */
function getStorageMessage(status: ReturnType<typeof getStorageStatus>): string {
    if (!status.configured) {
        return '❌ No storage configured. Please set NFT_STORAGE_API_KEY (recommended) or PINATA_JWT.'
    }

    if (status.filecoin.configured && status.pinata.configured) {
        return '🎉 Optimal setup! Both Filecoin (primary) and Pinata (fallback) are configured.'
    }

    if (status.filecoin.configured) {
        return '🚀 Filecoin storage is configured. Data will be stored permanently on the decentralized network.'
    }

    if (status.pinata.configured) {
        return '📌 Pinata storage is configured. Consider adding NFT_STORAGE_API_KEY for decentralized Filecoin storage.'
    }

    return '⚠️ Storage status unclear. Please check your configuration.'
}
