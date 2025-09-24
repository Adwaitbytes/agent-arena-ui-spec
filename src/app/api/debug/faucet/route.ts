import { NextResponse } from 'next/server'
import { Synapse, RPC_URLS } from '@filoz/synapse-sdk'

export async function POST() {
    try {
        const privateKey = process.env.FILECOIN_PRIVATE_KEY
        if (!privateKey) {
            return NextResponse.json({
                success: false,
                error: 'FILECOIN_PRIVATE_KEY not configured'
            }, { status: 500 })
        }

        console.log('💧 Attempting to request USDFC from Synapse SDK faucet...')

        // Create Synapse instance
        const privateKeyWithPrefix = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
        const synapse = await Synapse.create({
            privateKey: privateKeyWithPrefix,
            rpcURL: RPC_URLS.calibration.http
        })

        // Try to get balance before
        let balanceBefore = '0'
        try {
            const accountInfo = await synapse.payments.accountInfo()
            balanceBefore = accountInfo.availableFunds.toString()
        } catch (e) {
            console.log('Could not get balance before faucet request')
        }

        // Try different faucet methods that might exist
        console.log('🚰 Trying to request testnet USDFC tokens...')

        // Check if there's a faucet method or similar
        try {
            // Method 1: Check if payments has any faucet-like method
            const paymentsMethods = Object.getOwnPropertyNames(Object.getPrototypeOf(synapse.payments))
            console.log('Available payments methods:', paymentsMethods)

            // Method 2: Try to deposit small amount to trigger setup
            const depositTx = await synapse.payments.deposit(BigInt("1000000000000000000")) // 1 USDFC
            console.log(`💳 Deposit transaction: ${depositTx.hash}`)
            await depositTx.wait()

            return NextResponse.json({
                success: true,
                message: 'Successfully made a deposit transaction',
                transaction: depositTx.hash,
                balanceBefore
            })

        } catch (depositError) {
            console.log('Deposit failed (expected):', depositError)

            return NextResponse.json({
                success: false,
                error: 'Cannot deposit without existing USDFC balance',
                message: 'You need to use external faucet to get initial USDFC tokens',
                suggestions: [
                    'Visit https://faucet.calibration.fildev.network/',
                    'Select USDFC token (not FIL)',
                    'Enter your wallet address',
                    'Wait 2-5 minutes for tokens to arrive'
                ]
            })
        }

    } catch (error) {
        console.error('❌ Faucet attempt failed:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}