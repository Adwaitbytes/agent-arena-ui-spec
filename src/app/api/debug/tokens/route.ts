import { NextResponse } from 'next/server'
import { Synapse, RPC_URLS } from '@filoz/synapse-sdk'
import { ethers } from 'ethers'

export async function GET() {
    try {
        const privateKey = process.env.FILECOIN_PRIVATE_KEY
        if (!privateKey) {
            return NextResponse.json({
                success: false,
                error: 'FILECOIN_PRIVATE_KEY not configured'
            }, { status: 500 })
        }

        console.log('🔍 Discovering USDFC token info from Synapse...')

        // Create Synapse instance
        const privateKeyWithPrefix = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
        const synapse = await Synapse.create({
            privateKey: privateKeyWithPrefix,
            rpcURL: RPC_URLS.calibration.http
        })

        const provider = synapse.getProvider()
        const wallet = new ethers.Wallet(privateKeyWithPrefix, provider)

        console.log(`📍 Wallet Address: ${wallet.address}`)

        // Try to get account info to find the token address
        const accountInfo = await synapse.payments.accountInfo()
        console.log('📊 Account info:', accountInfo)

        // Check various potential USDFC addresses on Calibration
        const potentialUSDCAddresses = [
            '0x7e80cb688e72a756c6ee6cd7f3bd96d02bd2d1b5', // Common USDFC
            '0x2A04F3F2fE2F00FfE5C1C89a01dd6a1329F4C10a', // Another potential
            '0x1234567890123456789012345678901234567890'   // Placeholder
        ]

        const results = []

        for (const address of potentialUSDCAddresses) {
            try {
                const contract = new ethers.Contract(
                    address,
                    [
                        'function balanceOf(address) view returns (uint256)',
                        'function decimals() view returns (uint8)',
                        'function symbol() view returns (string)',
                        'function name() view returns (string)'
                    ],
                    provider
                )

                const balance = await contract.balanceOf(wallet.address)
                const decimals = await contract.decimals()
                const symbol = await contract.symbol()
                const name = await contract.name()

                results.push({
                    address,
                    name,
                    symbol,
                    decimals,
                    balance: ethers.formatUnits(balance, decimals),
                    rawBalance: balance.toString(),
                    status: 'found'
                })

                console.log(`✅ ${address}: ${name} (${symbol}) - Balance: ${ethers.formatUnits(balance, decimals)}`)

            } catch (error) {
                results.push({
                    address,
                    status: 'not_found',
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
                console.log(`❌ ${address}: Not a valid token contract`)
            }
        }

        // Also try to access Synapse's internal token info
        let synapseTokenInfo = null
        try {
            // Try different ways to get token info from Synapse
            const warmStorageAddress = await synapse.getWarmStorageAddress()
            synapseTokenInfo = {
                warmStorageAddress,
                message: 'Found warm storage address'
            }
        } catch (e) {
            synapseTokenInfo = {
                error: e instanceof Error ? e.message : 'Could not get Synapse token info'
            }
        }

        return NextResponse.json({
            success: true,
            walletAddress: wallet.address,
            network: 'calibration',
            chainId: await synapse.getChainId(),
            tokenContracts: results,
            synapseInfo: synapseTokenInfo,
            accountInfo: {
                availableFunds: ethers.formatUnits(accountInfo.availableFunds, 18),
                totalFunds: ethers.formatUnits(accountInfo.funds, 18),
                lockupCurrent: ethers.formatUnits(accountInfo.lockupCurrent, 18)
            }
        })

    } catch (error) {
        console.error('❌ Token discovery failed:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}