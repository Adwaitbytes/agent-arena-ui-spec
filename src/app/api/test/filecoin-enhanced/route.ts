import { NextRequest, NextResponse } from 'next/server'
import { uploadToFilecoin, isFilecoinConfigured } from '@/lib/filecoin'

export async function POST(request: NextRequest) {
    try {
        console.log('🚀 Testing enhanced Filecoin upload with CDN and explorer links...')

        if (!isFilecoinConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Filecoin not configured'
            }, { status: 500 })
        }

        // Get test data from request body or use comprehensive default
        let testData: any
        try {
            const body = await request.json()
            testData = {
                ...body,
                uploadMetadata: {
                    timestamp: new Date().toISOString(),
                    testType: 'enhanced-filecoin-with-cdn',
                    network: process.env.FILECOIN_NETWORK || 'calibration',
                    cdnEnabled: true
                }
            }
            console.log(`📝 Using custom test data`)
        } catch {
            // Default comprehensive test data
            testData = {
                message: 'Enhanced Agent Arena Filecoin Test with CDN',
                timestamp: new Date().toISOString(),
                testType: 'comprehensive-filecoin-integration',
                network: process.env.FILECOIN_NETWORK || 'calibration',
                features: [
                    'CDN-enabled uploads and downloads',
                    'Automatic explorer link generation',
                    'Multi-gateway IPFS access',
                    'Cryptographic storage proofs',
                    'USDFC payment automation'
                ],
                agentArenaInfo: {
                    purpose: 'Decentralized AI agent storage',
                    storageType: 'Filecoin with Synapse SDK',
                    paymentMethod: 'USDFC escrow contracts',
                    retrievalMethods: ['Direct Filecoin', 'IPFS gateways', 'CDN']
                },
                // Large data to ensure minimum size requirements
                paddingData: Array(200).fill('🚀 Agent Arena on Filecoin! ').join(''),
                verification: {
                    uploadTime: new Date().toISOString(),
                    expectedSize: 'calculated-after-json-stringify'
                }
            }

            // Calculate actual size
            testData.verification.expectedSize = `${JSON.stringify(testData).length} characters`
            console.log(`📝 Using comprehensive default test data (${testData.verification.expectedSize})`)
        }

        // Upload to Filecoin with CDN
        const uploadResult = await uploadToFilecoin(testData, {
            name: 'enhanced-filecoin-test',
            description: 'Testing Filecoin with CDN and explorer integration'
        })

        // Create comprehensive response with all verification methods
        const response = {
            success: true,
            message: '🎉 Filecoin upload with CDN successful!',
            upload: {
                ...uploadResult,
                cdnEnabled: true,
                network: process.env.FILECOIN_NETWORK || 'calibration'
            },
            verification: {
                immediate: {
                    pieceCid: uploadResult.pieceCid,
                    size: uploadResult.size,
                    cdnEnabled: uploadResult.cdnEnabled
                },
                explorers: uploadResult.explorerUrls,
                apiVerification: `${request.nextUrl.origin}/api/filecoin/verify?pieceCid=${uploadResult.pieceCid}`,
                downloadTest: `${request.nextUrl.origin}/api/filecoin/verify (POST with pieceCid in body)`
            },
            instructions: {
                quickVerify: `curl -X GET "${request.nextUrl.origin}/api/filecoin/verify?pieceCid=${uploadResult.pieceCid}"`,
                downloadTest: `curl -X POST ${request.nextUrl.origin}/api/filecoin/verify -H "Content-Type: application/json" -d '{"pieceCid": "${uploadResult.pieceCid}"}'`,
                explorer: 'Visit any of the explorer URLs to see your storage deal on Filecoin blockchain',
                ipfsGateways: 'Try the IPFS gateway URLs for web-based access to your data'
            }
        }

        // Log success with verification info
        console.log('\n🎉 Upload completed successfully!')
        console.log(`🔗 PieceCID: ${uploadResult.pieceCid}`)
        console.log('🔍 Explorer links:')
        if (uploadResult.explorerUrls) {
            console.log(`   📊 Filfox: ${uploadResult.explorerUrls.filfox}`)
            console.log(`   📊 Filscan: ${uploadResult.explorerUrls.filscan}`)
            console.log(`   📊 Beryx: ${uploadResult.explorerUrls.beryx}`)
        }
        console.log(`✅ CDN: ${uploadResult.cdnEnabled ? 'Enabled' : 'Disabled'}`)

        return NextResponse.json(response)

    } catch (error) {
        console.error('❌ Enhanced Filecoin test failed:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: 'Enhanced Filecoin upload test failed'
        }, { status: 500 })
    }
}

export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'Enhanced Filecoin Test Endpoint',
        usage: {
            POST: 'Upload test data to Filecoin with CDN and get explorer links',
            body: 'Optional JSON data to upload (will use comprehensive test data if not provided)',
            features: [
                'CDN-enabled uploads',
                'Automatic explorer link generation',
                'Comprehensive verification methods',
                'IPFS gateway access',
                'Direct API verification endpoints'
            ]
        },
        example: {
            curl: 'curl -X POST /api/test/filecoin-enhanced -H "Content-Type: application/json" -d \'{"myData": "test"}\''
        }
    })
}