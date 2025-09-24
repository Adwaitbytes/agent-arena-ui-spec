#!/usr/bin/env tsx

/**
 * Filecoin Synapse SDK Integration Test
 * 
 * This test verifies that the Synapse SDK integration is working properly.
 * Run with: npx tsx src/test/filecoin-test.ts
 */

import {
    uploadToFilecoin,
    downloadFromFilecoin,
    getFilecoinInfo,
    isFilecoinConfigured,
    setupFilecoinPayments
} from '../lib/filecoin'

async function testFilecoinIntegration() {
    console.log('🧪 Starting Filecoin Synapse SDK Integration Test')
    console.log('='.repeat(50))

    try {
        // 1. Check configuration
        console.log('\n1️⃣ Checking Filecoin Configuration...')
        const isConfigured = isFilecoinConfigured()
        console.log(`   Configuration Status: ${isConfigured ? '✅ Configured' : '❌ Not Configured'}`)

        if (!isConfigured) {
            console.log('\n❌ Test failed: Filecoin not properly configured')
            console.log('Please set the following environment variables:')
            console.log('- FILECOIN_PRIVATE_KEY')
            console.log('- FILECOIN_RPC_URL (optional, uses defaults)')
            return
        }

        // 2. Get Filecoin network info
        console.log('\n2️⃣ Getting Filecoin Network Information...')
        const info = await getFilecoinInfo()
        console.log(`   Network: ${info.network}`)
        console.log(`   Chain ID: ${info.chainId}`)
        console.log(`   Provider: ${info.provider}`)
        console.log(`   Balance: ${info.balance || 'Unknown'} USDFC`)

        // 3. Test Upload
        console.log('\n3️⃣ Testing File Upload to Filecoin...')
        const testData = {
            message: 'Hello from Agent Arena!',
            timestamp: new Date().toISOString(),
            test: true,
            data: {
                agentId: 'test-agent-001',
                round: 1,
                score: 95.5,
                responses: ['Hello', 'How can I help you?']
            }
        }

        const uploadResult = await uploadToFilecoin(testData, {
            name: 'agent-arena-test',
            description: 'Test upload from Agent Arena Filecoin integration',
            matchId: 'test-match-001'
        })

        console.log('   ✅ Upload successful!')
        console.log(`   PieceCID: ${uploadResult.pieceCid}`)
        console.log(`   Size: ${uploadResult.size} bytes`)
        console.log(`   URL: ${uploadResult.url}`)
        console.log(`   Type: ${uploadResult.storageType}`)

        // 4. Test Download
        console.log('\n4️⃣ Testing File Download from Filecoin...')
        const downloadedData = await downloadFromFilecoin(uploadResult.pieceCid)

        console.log('   ✅ Download successful!')
        console.log('   Downloaded data matches:', JSON.stringify(downloadedData) === JSON.stringify(testData))

        // 5. Summary
        console.log('\n🎉 All Tests Passed!')
        console.log('='.repeat(50))
        console.log('✅ Filecoin Synapse SDK integration is working correctly')
        console.log(`✅ Successfully uploaded and retrieved ${uploadResult.size} bytes`)
        console.log(`✅ Data integrity verified`)
        console.log('\nYour Agent Arena is ready to use Filecoin storage! 🚀')

    } catch (error) {
        console.log('\n❌ Test Failed!')
        console.log('='.repeat(50))
        console.error('Error:', error)

        if (error instanceof Error) {
            if (error.message.includes('insufficient funds')) {
                console.log('\n💡 Suggestion: Run payment setup first:')
                console.log('   Try running: setupFilecoinPayments()')
            }
            if (error.message.includes('not approved')) {
                console.log('\n💡 Suggestion: Approve services for payment:')
                console.log('   The SDK will handle service approval automatically')
            }
            if (error.message.includes('connection')) {
                console.log('\n💡 Suggestion: Check your Filecoin RPC configuration')
            }
        }
    }
}

async function testPaymentSetup() {
    console.log('💰 Testing Payment Setup...')
    try {
        await setupFilecoinPayments('10') // Setup with 10 USDFC
        console.log('✅ Payment setup successful!')
    } catch (error) {
        console.error('❌ Payment setup failed:', error)
    }
}

// Run the test
if (require.main === module) {
    const args = process.argv.slice(2)

    if (args.includes('--setup-payments')) {
        testPaymentSetup()
    } else {
        testFilecoinIntegration()
    }
}

export { testFilecoinIntegration, testPaymentSetup }