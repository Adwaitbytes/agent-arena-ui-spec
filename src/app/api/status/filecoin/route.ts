import { NextResponse } from 'next/server'
import { getFilecoinInfo } from '@/lib/filecoin'
import { ethers } from 'ethers'

export async function GET() {
    try {
        // Get Filecoin info
        const info = await getFilecoinInfo()

        // Get wallet address (handle private key format)
        const privateKey = process.env.FILECOIN_PRIVATE_KEY
        let wallet = null
        if (privateKey) {
            const privateKeyWithPrefix = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
            wallet = new ethers.Wallet(privateKeyWithPrefix)
        }

        return NextResponse.json({
            success: true,
            filecoin: {
                configured: info.configured,
                network: info.network,
                chainId: info.chainId,
                provider: info.provider,
                balance: info.balance,
                walletAddress: wallet?.address || 'Not configured'
            },
            instructions: {
                needTokens: !info.balance || parseFloat(info.balance) < 1,
                faucetUrl: 'https://faucet.calibration.fildev.network/',
                steps: [
                    'Visit the faucet URL above',
                    `Enter wallet address: ${wallet?.address}`,
                    'Select token: USDFC',
                    'Click "Send me tokens"',
                    'Wait 30-60 seconds for confirmation',
                    'Test again with POST /api/test/filecoin'
                ]
            }
        })

    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}