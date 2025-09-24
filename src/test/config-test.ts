#!/usr/bin/env tsx

/**
 * Quick Filecoin Configuration Test
 * 
 * This test checks if our Filecoin configuration is set up properly
 * without importing server-only modules.
 */

import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

async function testFilecoinConfiguration() {
    console.log('🧪 Filecoin Configuration Test')
    console.log('='.repeat(40))

    // Check environment variables
    const filecoinPrivateKey = process.env.FILECOIN_PRIVATE_KEY
    const filecoinNetwork = process.env.FILECOIN_NETWORK || 'calibration'
    const filecoinRpcUrl = process.env.FILECOIN_RPC_URL

    console.log(`Network: ${filecoinNetwork}`)
    console.log(`Private Key: ${filecoinPrivateKey ? '✅ Set' : '❌ Not Set'}`)
    console.log(`RPC URL: ${filecoinRpcUrl ? '✅ Set' : '🔄 Will use default'}`)

    if (!filecoinPrivateKey) {
        console.log('\n❌ FILECOIN_PRIVATE_KEY is required')
        console.log('Please set it in your .env file:')
        console.log('FILECOIN_PRIVATE_KEY=0x...')
        return false
    }

    console.log('\n✅ Configuration appears valid!')
    console.log('🔗 Ready to connect to Filecoin via Synapse SDK')
    return true
}

async function testSynapseSDKImport() {
    console.log('\n📦 Testing Synapse SDK Import...')

    try {
        const { Synapse } = await import('@filoz/synapse-sdk')
        console.log('✅ Synapse SDK imported successfully')
        return true
    } catch (error) {
        console.log('❌ Failed to import Synapse SDK:', error)
        return false
    }
}

async function runTests() {
    const configTest = await testFilecoinConfiguration()
    const importTest = await testSynapseSDKImport()

    if (configTest && importTest) {
        console.log('\n🎉 All tests passed!')
        console.log('Your Filecoin integration is ready!')
    } else {
        console.log('\n⚠️  Some tests failed. Please fix the issues above.')
    }
}

// Run tests
runTests().catch(console.error)