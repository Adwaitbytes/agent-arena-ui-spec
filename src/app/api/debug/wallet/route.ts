import { NextResponse } from 'next/server'
import { ethers } from 'ethers'

export async function GET() {
    try {
        const privateKey = process.env.FILECOIN_PRIVATE_KEY
        const rpcUrl = process.env.FILECOIN_RPC_URL || 'https://api.calibration.node.glif.io/rpc/v1'

        if (!privateKey) {
            return NextResponse.json({
                success: false,
                error: 'FILECOIN_PRIVATE_KEY not configured'
            }, { status: 500 })
        }

        // Create wallet
        const privateKeyWithPrefix = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`
        const wallet = new ethers.Wallet(privateKeyWithPrefix)

        // Connect to Filecoin RPC
        const provider = new ethers.JsonRpcProvider(rpcUrl)
        const connectedWallet = wallet.connect(provider)

        console.log('🔍 Debugging Filecoin wallet and balance...')
        console.log(`📍 Wallet Address: ${wallet.address}`)
        console.log(`🔗 RPC URL: ${rpcUrl}`)

        // Check native FIL balance
        const filBalance = await provider.getBalance(wallet.address)
        const filBalanceFormatted = ethers.formatEther(filBalance)

        console.log(`💰 FIL Balance: ${filBalanceFormatted}`)

        // Check network info
        const network = await provider.getNetwork()
        console.log(`🌐 Network:`, network)

        // Check latest block to ensure RPC is working
        const blockNumber = await provider.getBlockNumber()
        console.log(`📦 Latest Block: ${blockNumber}`)

        // Try to get transaction count (nonce)
        const nonce = await provider.getTransactionCount(wallet.address)
        console.log(`🔢 Transaction Count: ${nonce}`)

        return NextResponse.json({
            success: true,
            debug: {
                walletAddress: wallet.address,
                rpcUrl: rpcUrl,
                network: {
                    name: network.name,
                    chainId: Number(network.chainId)
                },
                balances: {
                    fil: filBalanceFormatted,
                    filWei: filBalance.toString()
                },
                blockchain: {
                    latestBlock: blockNumber,
                    nonce: nonce
                },
                troubleshooting: {
                    faucetDelay: 'Testnet faucets can take 2-10 minutes to process',
                    checkExplorer: `https://calibration.filscan.io/address/${wallet.address}`,
                    alternativeFaucet: 'https://faucet.calibration.fildev.network/',
                    directFaucet: 'https://faucet.glif.io/'
                }
            }
        })

    } catch (error) {
        console.error('❌ Wallet debug failed:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            suggestion: 'Check your RPC URL and private key configuration'
        }, { status: 500 })
    }
}