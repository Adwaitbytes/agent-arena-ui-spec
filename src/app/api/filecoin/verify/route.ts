import { NextRequest, NextResponse } from 'next/server'
import {
    downloadFromFilecoin,
    checkFilecoinDataExists,
    getFilecoinInfo
} from '@/lib/filecoin'

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const pieceCid = searchParams.get('pieceCid')

        if (!pieceCid) {
            return NextResponse.json({
                success: false,
                error: 'Missing pieceCid parameter. Usage: ?pieceCid=bafk...'
            }, { status: 400 })
        }

        if (pieceCid === 'YOUR_PIECE_CID' || pieceCid.includes('YOUR_')) {
            return NextResponse.json({
                success: false,
                error: 'Please replace YOUR_PIECE_CID with an actual PieceCID from your upload'
            }, { status: 400 })
        }

        console.log(`🔍 Verifying Filecoin storage for: ${pieceCid}`)

        // Method 1: Check if data exists using Synapse SDK
        const exists = await checkFilecoinDataExists(pieceCid)

        // Method 2: Try to download the data to verify it's actually there
        let downloadSuccess = false
        let downloadedData: any = null
        let downloadError: string | null = null

        try {
            downloadedData = await downloadFromFilecoin(pieceCid)
            downloadSuccess = true
            console.log('✅ Data successfully downloaded from Filecoin')
        } catch (error) {
            downloadError = error instanceof Error ? error.message : 'Unknown download error'
            console.error('❌ Download failed:', downloadError)
        }

        // Method 3: Get storage details using Filecoin network info
        let storageDetails: any = null
        try {
            const filecoinInfo = await getFilecoinInfo()
            storageDetails = {
                network: filecoinInfo.network,
                chainId: filecoinInfo.chainId,
                configured: filecoinInfo.configured
            }
        } catch (error) {
            console.warn('Could not get storage details:', error)
        }

        // Method 4: Provide external verification URLs
        const network = process.env.FILECOIN_NETWORK || 'calibration'
        const isMainnet = network === 'mainnet'

        const verificationUrls = {
            // Filecoin block explorers
            filfox: `https://${isMainnet ? 'filfox.info' : 'calibration.filfox.info'}/en/deal/${pieceCid}`,
            filscan: `https://${isMainnet ? 'filscan.io' : 'calibration.filscan.io'}/deal/${pieceCid}`,
            beryx: `https://${isMainnet ? 'beryx.zondax.ch' : 'calibration.beryx.zondax.ch'}/v1/search/fil/${pieceCid}`,

            // IPFS gateways that might serve Filecoin data
            ipfsGateways: [
                `https://nftstorage.link/ipfs/${pieceCid}`,
                `https://gateway.pinata.cloud/ipfs/${pieceCid}`,
                `https://ipfs.io/ipfs/${pieceCid}`,
                `https://${pieceCid}.ipfs.dweb.link/`
            ],

            // Direct Filecoin retrieval endpoints
            retrievalEndpoints: [
                `https://api.filecoin.io/retrieval/check/${pieceCid}`,
                `https://${isMainnet ? 'api' : 'calibration-api'}.filecoin.io/deal/${pieceCid}`
            ]
        }

        return NextResponse.json({
            success: true,
            pieceCid,
            verification: {
                exists,
                downloadSuccess,
                downloadError,
                dataPreview: downloadSuccess ?
                    (typeof downloadedData === 'string' ? downloadedData.slice(0, 200) + '...' :
                        JSON.stringify(downloadedData).slice(0, 200) + '...') : null,
                storageDetails
            },
            verificationUrls,
            instructions: {
                manual: [
                    "1. Visit one of the block explorer URLs above",
                    "2. Search for your PieceCID to see storage deals",
                    "3. Try the IPFS gateway URLs to access your data directly",
                    "4. Check if data downloads successfully"
                ],
                automatic: "This endpoint already verified the data for you above"
            }
        })

    } catch (error) {
        console.error('❌ Verification failed:', error)

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: 'Failed to verify Filecoin storage'
        }, { status: 500 })
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { pieceCid } = body

        if (!pieceCid) {
            return NextResponse.json({
                success: false,
                error: 'Missing pieceCid in request body'
            }, { status: 400 })
        }

        console.log(`📥 Testing download from Filecoin: ${pieceCid}`)

        // Attempt to download and return the actual data
        const downloadedData = await downloadFromFilecoin(pieceCid)

        return NextResponse.json({
            success: true,
            message: 'Data successfully retrieved from Filecoin',
            pieceCid,
            data: downloadedData,
            verification: {
                confirmed: true,
                method: 'Direct download via Synapse SDK',
                timestamp: new Date().toISOString()
            }
        })

    } catch (error) {
        console.error('❌ Download verification failed:', error)

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            pieceCid: (await request.json().catch(() => ({})))?.pieceCid,
            verification: {
                confirmed: false,
                method: 'Direct download via Synapse SDK',
                timestamp: new Date().toISOString()
            }
        }, { status: 500 })
    }
}