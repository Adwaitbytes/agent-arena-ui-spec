import { NextResponse } from 'next/server'
import { Synapse, RPC_URLS } from '@filoz/synapse-sdk'
import { ethers } from 'ethers'

export async function POST() {
    try {
        const privateKey = process.env.FILECOIN_PRIVATE_KEY
        if (!privateKey) {
            return NextResponse.json({
                success: false,
                error: 'FILECOIN_PRIVATE_KEY not configured'
            }, { status: 500 })
        }

        console.log('💰 Setting up USDFC deposit to Synapse payments...')

        // Create Synapse instance
        const privateKeyWithPrefix = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
        const synapse = await Synapse.create({
            privateKey: privateKeyWithPrefix,
            rpcURL: RPC_URLS.calibration.http
        })

        console.log(`✅ Connected to Filecoin Calibration network`)

        // Step 1: Check current payment contract balance
        let currentBalance = '0'
        try {
            const accountInfo = await synapse.payments.accountInfo()
            currentBalance = ethers.formatUnits(accountInfo.availableFunds, 18)
            console.log(`💰 Current Synapse balance: ${currentBalance} USDFC`)
        } catch (e) {
            console.log('⚠️ Could not get current balance, proceeding with deposit...')
        }

        // Step 2: Get wallet and provider
        const provider = synapse.getProvider()
        const wallet = new ethers.Wallet(privateKeyWithPrefix, provider)

        // Step 3: Use known USDFC contract address for Calibration network
        // This is the standard USDFC token contract on Filecoin Calibration
        const usdcAddress = '0x7e80cb688e72a756c6ee6cd7f3bd96d02bd2d1b5' // Known USDFC address on Calibration
        const decimals = 18 // Standard USDFC decimals
        console.log(`📍 USDFC Contract: ${usdcAddress}`)

        // Create USDFC contract instance to check wallet balance
        const usdcContract = new ethers.Contract(
            usdcAddress,
            [
                'function balanceOf(address) view returns (uint256)',
                'function approve(address spender, uint256 amount) returns (bool)',
                'function allowance(address owner, address spender) view returns (uint256)'
            ],
            wallet
        )

        const walletUsdcBalance = await usdcContract.balanceOf(wallet.address)
        const walletUsdcFormatted = ethers.formatUnits(walletUsdcBalance, decimals)

        console.log(`💳 Your wallet USDFC balance: ${walletUsdcFormatted} USDFC`)

        if (walletUsdcBalance === BigInt(0)) {
            return NextResponse.json({
                success: false,
                error: 'No USDFC tokens found in wallet',
                message: 'Please get USDFC tokens from faucet first',
                walletAddress: wallet.address,
                usdcContractAddress: usdcAddress
            })
        }

        // Step 4: Deposit USDFC to Synapse payments contract
        const depositAmount = ethers.parseUnits('10', decimals) // Deposit 10 USDFC
        console.log(`📥 Depositing ${ethers.formatUnits(depositAmount, decimals)} USDFC...`)

        const depositTx = await synapse.payments.deposit(depositAmount)
        console.log(`💳 Deposit transaction: ${depositTx.hash}`)

        // Wait for confirmation
        console.log('⏳ Waiting for transaction confirmation...')
        await depositTx.wait()
        console.log('✅ Deposit confirmed!')

        // Step 5: Verify new balance
        const newAccountInfo = await synapse.payments.accountInfo()
        const newBalance = ethers.formatUnits(newAccountInfo.availableFunds, 18)
        console.log(`💰 New Synapse balance: ${newBalance} USDFC`)

        // Step 6: Approve Warm Storage service
        console.log('🔐 Setting up service approval...')
        const warmStorageAddress = await synapse.getWarmStorageAddress()

        const approveTx = await synapse.payments.approveService(
            warmStorageAddress,
            ethers.parseUnits('50', 18),    // Rate allowance: 50 USDFC per epoch
            ethers.parseUnits('100', 18),   // Lockup allowance: 100 USDFC total
            BigInt(86400)                   // Max lockup period: 1 day
        )

        console.log(`🔐 Approval transaction: ${approveTx.hash}`)
        await approveTx.wait()
        console.log('✅ Service approved!')

        return NextResponse.json({
            success: true,
            message: 'USDFC successfully deposited and service approved!',
            details: {
                walletUsdcBalance: walletUsdcFormatted,
                depositedAmount: ethers.formatUnits(depositAmount, decimals),
                synapseBalance: newBalance,
                depositTransaction: depositTx.hash,
                approvalTransaction: approveTx.hash
            },
            nextStep: 'Test Filecoin upload with POST /api/test/filecoin'
        })

    } catch (error) {
        console.error('❌ USDFC deposit failed:', error)

        let errorMessage = error instanceof Error ? error.message : 'Unknown error'
        let suggestion = 'Check your USDFC balance and try again'

        if (errorMessage.includes('insufficient allowance')) {
            suggestion = 'USDFC contract needs approval for Synapse payments contract'
        } else if (errorMessage.includes('insufficient balance')) {
            suggestion = 'Not enough USDFC in wallet. Get more from faucet.'
        }

        return NextResponse.json({
            success: false,
            error: errorMessage,
            suggestion: suggestion
        }, { status: 500 })
    }
}