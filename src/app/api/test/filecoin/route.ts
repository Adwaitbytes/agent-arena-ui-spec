import { NextResponse } from 'next/server'
import {
    uploadToFilecoin,
    downloadFromFilecoin,
    getFilecoinInfo,
    isFilecoinConfigured
} from '@/lib/filecoin'

export async function GET() {
    try {
        console.log('🧪 Testing Filecoin integration...')

        // Check configuration
        if (!isFilecoinConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Filecoin not configured. Set FILECOIN_PRIVATE_KEY environment variable.'
            }, { status: 500 })
        }

        // Get network info
        const info = await getFilecoinInfo()

        return NextResponse.json({
            success: true,
            message: 'Filecoin integration is working!',
            info: info
        })

    } catch (error) {
        console.error('❌ Filecoin test failed:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

export async function POST(request: Request) {
    try {
        console.log('🧪 Testing Filecoin upload/download...')

        if (!isFilecoinConfigured()) {
            return NextResponse.json({
                success: false,
                error: 'Filecoin not configured'
            }, { status: 500 })
        }

        // Get test data from request body or use default
        let testData: any
        try {
            const body = await request.json()
            testData = body
            console.log(`📝 Using custom test data (${JSON.stringify(body).length} chars)`)
        } catch {
            // Default test data with sufficient size for Filecoin
            testData = {
                message: 'Hello from Agent Arena! This is a comprehensive test of the Filecoin integration using the Synapse SDK.',
                timestamp: new Date().toISOString(),
                test: true,
                details: {
                    purpose: 'Integration test for Filecoin storage',
                    network: 'Calibration testnet',
                    sdk: 'Synapse SDK v0.28.0',
                    features: ['Decentralized storage', 'Payment escrow', 'Cryptographic proofs']
                },
                largeData: Array(100).fill('Agent Arena rocks! ').join('') // Add padding data
            }
            console.log(`📝 Using default test data (${JSON.stringify(testData).length} chars)`)
        }

        // Upload test
        const uploadResult = await uploadToFilecoin(testData, {
            name: 'api-test',
            description: 'API integration test'
        })

        console.log('✅ Upload successful:', uploadResult.pieceCid)

        // Download test
        const downloadedData = await downloadFromFilecoin(uploadResult.pieceCid)

        const dataMatches = JSON.stringify(downloadedData) === JSON.stringify(testData)
        console.log('✅ Download successful, data matches:', dataMatches)

        return NextResponse.json({
            success: true,
            message: 'Full upload/download test successful!',
            upload: uploadResult,
            dataIntegrityCheck: dataMatches
        })

    } catch (error) {
        console.error('❌ Filecoin upload/download test failed:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            suggestion: error instanceof Error && error.message.includes('insufficient funds')
                ? 'You may need to deposit USDFC tokens for Filecoin storage payments'
                : undefined
        }, { status: 500 })
    }
}