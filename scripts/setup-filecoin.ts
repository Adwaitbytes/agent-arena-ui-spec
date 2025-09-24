#!/usr/bin/env tsx

/**
 * Filecoin Payment Setup Script
 * 
 * This script helps set up payments for Filecoin storage on the calibration testnet.
 * It will help you get testnet tokens and approve services.
 */

import { ethers } from 'ethers'

const FILECOIN_PRIVATE_KEY = process.env.FILECOIN_PRIVATE_KEY
const FILECOIN_NETWORK = (process.env.FILECOIN_NETWORK || 'calibration') as 'mainnet' | 'calibration'

async function setupFilecoinPayments() {
    console.log('💰 Filecoin Payment Setup')
    console.log('='.repeat(40))

    if (!FILECOIN_PRIVATE_KEY) {
        console.error('❌ FILECOIN_PRIVATE_KEY not set in environment')
        console.log('\nPlease add your private key to .env:')
        console.log('FILECOIN_PRIVATE_KEY=0x...')
        return
    }

    try {
        console.log('📦 Importing Synapse SDK...')
        const { Synapse, RPC_URLS } = await import('@filoz/synapse-sdk')

        console.log(`🔗 Connecting to Filecoin ${FILECOIN_NETWORK} network...`)

        const rpcURL = FILECOIN_NETWORK === 'calibration'
            ? RPC_URLS.mainnet.http
            : RPC_URLS.calibration.http

        // Ensure private key has 0x prefix for Synapse SDK
        const privateKeyForSynapse = FILECOIN_PRIVATE_KEY.startsWith('0x')
            ? FILECOIN_PRIVATE_KEY
            : `0x${FILECOIN_PRIVATE_KEY}`

        const synapse = await Synapse.create({
            privateKey: privateKeyForSynapse,
            rpcURL
        })

        console.log(`✅ Connected! Chain ID: ${await synapse.getChainId()}`)

        // Get wallet address using ethers wallet (handle private key format)
        const privateKeyWithPrefix = FILECOIN_PRIVATE_KEY.startsWith('0x')
            ? FILECOIN_PRIVATE_KEY
            : `0x${FILECOIN_PRIVATE_KEY}`
        const wallet = new ethers.Wallet(privateKeyWithPrefix)
        console.log(`📍 Wallet Address: ${wallet.address}`)

        // Step 1: Check current balance
        console.log('\n1️⃣ Checking Current Balance...')
        try {
            const accountInfo = await synapse.payments.accountInfo()
            const balance = ethers.formatUnits(accountInfo.availableFunds, 18)
            console.log(`💰 Available USDFC: ${balance}`)

            if (accountInfo.availableFunds < ethers.parseUnits('1', 18)) {
                console.log('⚠️ Low balance detected!')

                if (FILECOIN_NETWORK === 'calibration') {
                    console.log('\n📋 To get testnet USDFC tokens:')
                    console.log('1. Visit: https://faucet.calibration.fildev.network/')
                    console.log(`2. Enter your address: ${wallet.address}`)
                    console.log('3. Request USDFC tokens')
                    console.log('4. Wait for the transaction to confirm')
                    console.log('5. Run this script again')
                    return
                } else {
                    console.log('\n📋 To get mainnet USDFC tokens:')
                    console.log('1. Purchase FIL tokens from an exchange')
                    console.log('2. Convert FIL to USDFC using a DEX')
                    console.log('3. Deposit USDFC to your wallet')
                    return
                }
            }
        } catch (balanceError) {
            console.log('⚠️ Could not check balance, proceeding with setup...')
        }

        // Step 2: Approve Warm Storage service
        console.log('\n2️⃣ Setting Up Service Approvals...')
        try {
            const warmStorageAddress = await synapse.getWarmStorageAddress()
            console.log(`📍 Warm Storage Address: ${warmStorageAddress}`)

            const approval = await synapse.payments.serviceApproval(warmStorageAddress)
            console.log('Current approval:', approval)

            if (!approval.isApproved || approval.rateAllowance === BigInt(0)) {
                console.log('🔐 Approving Warm Storage service...')

                const approveTx = await synapse.payments.approveService(
                    warmStorageAddress,
                    ethers.parseUnits('100', 18),    // Rate allowance: 100 USDFC per epoch
                    ethers.parseUnits('1000', 18),   // Lockup allowance: 1000 USDFC total  
                    BigInt(86400 * 30)               // Max lockup period: 30 days
                )

                console.log(`💳 Approval transaction: ${approveTx.hash}`)
                console.log('⏳ Waiting for confirmation...')

                await approveTx.wait()
                console.log('✅ Service approved successfully!')

            } else {
                console.log('✅ Service already approved')
                console.log(`   Rate Allowance: ${ethers.formatUnits(approval.rateAllowance, 18)} USDFC`)
                console.log(`   Lockup Allowance: ${ethers.formatUnits(approval.lockupAllowance, 18)} USDFC`)
            }

        } catch (approvalError) {
            console.error('❌ Service approval failed:', approvalError)
            throw approvalError
        }

        // Step 3: Test upload
        console.log('\n3️⃣ Testing Upload...')
        try {
            const testData = new TextEncoder().encode(JSON.stringify({
                message: 'Test upload from Filecoin setup script',
                timestamp: new Date().toISOString(),
                network: FILECOIN_NETWORK
            }))

            console.log(`📤 Uploading ${testData.length} bytes...`)
            const uploadResult = await synapse.storage.upload(testData)

            console.log('✅ Test upload successful!')
            console.log(`🔗 PieceCID: ${uploadResult.pieceCid}`)
            console.log(`📏 Size: ${uploadResult.size} bytes`)

        } catch (uploadError) {
            console.error('❌ Test upload failed:', uploadError)
            console.log('\n💡 This could be due to:')
            console.log('- Insufficient balance')
            console.log('- Network congestion')
            console.log('- Service provider issues')
            console.log('\nTry the manual faucet steps above and run this script again.')
        }

        console.log('\n🎉 Filecoin payment setup complete!')
        console.log('Your Agent Arena can now store data on Filecoin!')

    } catch (error) {
        console.error('❌ Setup failed:', error)

        if (error instanceof Error && error.message.includes('insufficient funds')) {
            console.log('\n💡 Solution: Get testnet USDFC tokens')
            console.log('Visit: https://faucet.calibration.fildev.network/')
        }
    }
}

// Run the setup
setupFilecoinPayments().catch(console.error)