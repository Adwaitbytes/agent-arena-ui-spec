import 'server-only'
import { Synapse, RPC_URLS } from '@filoz/synapse-sdk'
import { ethers } from 'ethers'

/**
 * Filecoin Integration using Synapse SDK
 * 
 * This integration uses the official Synapse SDK to store data directly on Filecoin
 * through the decentralized storage marketplace. Data is stored with cryptographic
 * proof of possession (PDP) and payment rails.
 */

// Environment variables
const FILECOIN_PRIVATE_KEY = process.env.FILECOIN_PRIVATE_KEY
const FILECOIN_NETWORK = (process.env.FILECOIN_NETWORK || 'calibration') as 'mainnet' | 'calibration'
const FILECOIN_RPC_URL = process.env.FILECOIN_RPC_URL

// Synapse SDK instance (cached)
let synapseInstance: Synapse | null = null

export interface FilecoinUploadResult {
    pieceCid: string
    size: number
    url: string
    storageType: 'filecoin'
    dataSetId?: number
    pieceId?: number
    explorerUrls?: {
        filfox: string
        filscan: string
        beryx: string
    }
    cdnEnabled?: boolean
}

export interface FilecoinStorageInfo {
    network: string
    chainId: number
    provider: string
    configured: boolean
    balance?: string
    allowances?: any
}

/**
 * Check if Filecoin is properly configured
 */
export function isFilecoinConfigured(): boolean {
    return !!(FILECOIN_PRIVATE_KEY && FILECOIN_RPC_URL)
}

/**
 * Get or create Synapse SDK instance
 */
async function getSynapseInstance(): Promise<Synapse> {
    if (synapseInstance) {
        return synapseInstance
    }

    if (!isFilecoinConfigured()) {
        throw new Error('Filecoin not configured. Set FILECOIN_PRIVATE_KEY and FILECOIN_RPC_URL')
    }

    try {
        console.log(`🔗 Connecting to Filecoin ${FILECOIN_NETWORK} network...`)

        // Use predefined RPC URLs or custom one
        const rpcURL = FILECOIN_RPC_URL ||
            (FILECOIN_NETWORK === 'mainnet'
                ? RPC_URLS.mainnet.http
                : RPC_URLS.calibration.http)

        // Ensure private key is in correct format for Synapse SDK
        const privateKeyForSynapse = FILECOIN_PRIVATE_KEY!.startsWith('0x')
            ? FILECOIN_PRIVATE_KEY!
            : `0x${FILECOIN_PRIVATE_KEY!}`

        synapseInstance = await Synapse.create({
            privateKey: privateKeyForSynapse,
            rpcURL,
            withCDN: true  // Enable CDN for faster uploads and downloads
        })

        console.log(`✅ Connected to Filecoin ${FILECOIN_NETWORK} network with CDN enabled`)
        console.log(`📍 Chain ID: ${await synapseInstance.getChainId()}`)


        return synapseInstance

    } catch (error) {
        console.error('❌ Failed to initialize Synapse SDK:', error)
        throw new Error(`Failed to connect to Filecoin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

/**
 * Ensure payment setup is configured for storage operations
 */
async function ensurePaymentSetup(synapse: Synapse): Promise<void> {
    try {
        console.log('🔧 Checking payment setup...')

        // Check if we're on calibration network - try to get testnet funds
        if (FILECOIN_NETWORK === 'calibration') {
            console.log('💧 Note: On calibration testnet - ensure you have testnet USDFC')
            console.log('💡 Get testnet tokens from: https://faucet.calibration.fildev.network/')
        }

        // Check if Warm Storage service is approved
        try {
            const warmStorageAddress = await synapse.getWarmStorageAddress()
            const approval = await synapse.payments.serviceApproval(warmStorageAddress)

            if (!approval || approval.rateAllowance === BigInt(0)) {
                console.log('🔐 Approving Warm Storage service...')
                const approveTx = await synapse.payments.approveService(
                    warmStorageAddress,
                    ethers.parseUnits('50', 18),    // Rate allowance: 50 USDFC per epoch
                    ethers.parseUnits('500', 18),   // Lockup allowance: 500 USDFC total  
                    BigInt(86400)                   // Max lockup period: 1 day (in epochs)
                )
                await approveTx.wait()
                console.log('✅ Service approved')
            } else {
                console.log('✅ Service already approved')
            }
        } catch (approvalError) {
            console.warn('⚠️ Could not check/set service approval:', approvalError)
        }

        console.log('✅ Payment setup check complete')

    } catch (error) {
        console.warn('⚠️ Payment setup failed:', error)
        throw new Error('Could not ensure payment setup. Please check your balance and try again.')
    }
}

/**
 * Upload data to Filecoin using Synapse SDK
 */
export async function uploadToFilecoin(
    data: unknown,
    metadata?: {
        name?: string
        description?: string
        matchId?: string
        round?: string
    }
): Promise<FilecoinUploadResult> {

    try {
        const synapse = await getSynapseInstance()

        // Convert data to bytes
        const jsonString = JSON.stringify(data, null, 2)
        const dataBytes = new TextEncoder().encode(jsonString)

        console.log(`📤 Uploading ${dataBytes.length} bytes to Filecoin...`)
        console.log(`📝 Metadata:`, metadata)

        // Check account balance and service approvals before upload
        try {
            const accountInfo = await synapse.payments.accountInfo()
            const balance = ethers.formatUnits(accountInfo.availableFunds, 18)
            console.log(`💰 Account balance: ${balance} USDFC`)

            if (accountInfo.availableFunds < ethers.parseUnits('1', 18)) {
                console.warn('⚠️ Low USDFC balance, attempting automatic setup...')
                await ensurePaymentSetup(synapse)
            }
        } catch (balanceError) {
            console.warn('⚠️ Could not check balance, proceeding with upload...')
        }

        // Upload to Filecoin with CDN
        const uploadResult = await synapse.storage.upload(dataBytes)

        console.log('✅ Filecoin upload successful with CDN!')
        console.log(`🔗 PieceCID: ${uploadResult.pieceCid}`)
        console.log(`📏 Size: ${uploadResult.size} bytes`)
        console.log(`🆔 Piece ID: ${uploadResult.pieceId}`)

        // Generate multiple access URLs
        const pieceCidString = uploadResult.pieceCid.toString()
        const retrievalUrl = `https://nftstorage.link/ipfs/${pieceCidString}`

        // Explorer URLs for verification
        const explorerUrls = {
            filfox: `https://${FILECOIN_NETWORK === 'mainnet' ? 'filfox.info' : 'calibration.filfox.info'}/en/deal/${pieceCidString}`,
            filscan: `https://${FILECOIN_NETWORK === 'mainnet' ? 'filscan.io' : 'calibration.filscan.io'}/deal/${pieceCidString}`,
            beryx: `https://${FILECOIN_NETWORK === 'mainnet' ? 'beryx.zondax.ch' : 'calibration.beryx.zondax.ch'}/v1/search/fil/${pieceCidString}`
        }

        // Log explorer URLs for verification
        console.log('🔍 Verify your upload on Filecoin explorers:')
        console.log(`📊 Filfox: ${explorerUrls.filfox}`)
        console.log(`📊 Filscan: ${explorerUrls.filscan}`)
        console.log(`📊 Beryx: ${explorerUrls.beryx}`)

        return {
            pieceCid: pieceCidString,
            size: uploadResult.size,
            url: retrievalUrl,
            storageType: 'filecoin',
            pieceId: uploadResult.pieceId,
            explorerUrls,
            cdnEnabled: true
        }

    } catch (error) {
        console.error('❌ Filecoin upload failed:', error)
        console.error('❌ Full error details:', JSON.stringify(error, null, 2))

        // Enhanced error handling for common issues
        if (error instanceof Error) {
            console.error(`❌ Error message: "${error.message}"`)

            // Check if this is actually an insufficient funds error vs other issues
            if (error.message.includes('insufficient funds') || error.message.includes('RetCode=33')) {
                // Check our actual escrow balance before showing wallet message
                try {
                    const synapseForCheck = await getSynapseInstance()
                    const accountInfo = await synapseForCheck.payments.accountInfo()
                    const escrowBalance = ethers.formatUnits(accountInfo.availableFunds, 18)
                    console.error(`❌ Current escrow balance: ${escrowBalance} USDFC`)

                    if (parseFloat(escrowBalance) > 0) {
                        throw new Error(`Upload failed despite having ${escrowBalance} USDFC in escrow. This might be a Synapse SDK issue or the storage cost is higher than expected.`)
                    }
                } catch (balanceCheckError) {
                    console.error('❌ Could not check escrow balance:', balanceCheckError)
                }

                // Extract wallet address for user convenience (add 0x prefix if needed for ethers)
                const privateKeyWithPrefix = FILECOIN_PRIVATE_KEY!.startsWith('0x')
                    ? FILECOIN_PRIVATE_KEY!
                    : `0x${FILECOIN_PRIVATE_KEY!}`
                const wallet = new ethers.Wallet(privateKeyWithPrefix)
                const message = [
                    'Insufficient USDFC balance for Filecoin storage.',
                    `Wallet: ${wallet.address}`,
                    `Network: ${FILECOIN_NETWORK}`,
                    '',
                    '🚀 Quick Fix:',
                    '1. Visit: https://faucet.calibration.fildev.network/',
                    `2. Enter wallet: ${wallet.address}`,
                    '3. Select token: USDFC',
                    '4. Click "Send me tokens"',
                    '',
                    '📋 See docs/FILECOIN_PAYMENT_SETUP.md for details'
                ].join('\n')
                throw new Error(message)
            }
            if (error.message.includes('not approved')) {
                throw new Error('Service not approved. Please approve the Warm Storage service for payments.')
            }
            if (error.message.includes('connection')) {
                throw new Error('Failed to connect to Filecoin network. Please check your configuration.')
            }
            if (error.message.includes('Failed to create data set')) {
                throw new Error('Failed to create Filecoin storage context. This may be due to insufficient funds or network issues.')
            }
        }

        throw new Error(`Filecoin upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

/**
 * Download data from Filecoin using PieceCID
 */
export async function downloadFromFilecoin(pieceCid: string): Promise<unknown> {
    try {
        const synapse = await getSynapseInstance()

        console.log(`📥 Downloading from Filecoin: ${pieceCid}`)

        // Download from Filecoin (SP-agnostic download)
        const dataBytes = await synapse.storage.download(pieceCid, {
            // Use CDN if available for faster downloads
            withCDN: true
        })

        // Convert bytes back to JSON
        const jsonString = new TextDecoder().decode(dataBytes)
        const data = JSON.parse(jsonString)

        console.log(`✅ Successfully downloaded from Filecoin`)
        return data

    } catch (error) {
        console.error('❌ Filecoin download failed:', error)
        throw new Error(`Failed to download from Filecoin: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

/**
 * Check if data exists on Filecoin
 */
export async function checkFilecoinDataExists(pieceCid: string): Promise<boolean> {
    try {
        const synapse = await getSynapseInstance()

        // Try to download just to check if it exists
        await synapse.storage.download(pieceCid)
        return true

    } catch (error) {
        console.warn(`Data with PieceCID ${pieceCid} not found or not accessible`)
        return false
    }
}

/**
 * Get Filecoin storage information and status
 */
export async function getFilecoinInfo(): Promise<FilecoinStorageInfo> {
    try {
        if (!isFilecoinConfigured()) {
            return {
                network: FILECOIN_NETWORK,
                chainId: 0,
                provider: 'Synapse SDK',
                configured: false
            }
        }

        const synapse = await getSynapseInstance()
        const chainId = await synapse.getChainId()
        const network = await synapse.getNetwork()

        // Get payment information
        let balance: string | undefined
        let allowances: any = undefined

        try {
            const accountInfo = await synapse.payments.accountInfo()
            balance = ethers.formatUnits(accountInfo.availableFunds, 18)

            // Get service approvals
            const warmStorageAddress = await synapse.getWarmStorageAddress()
            allowances = await synapse.payments.serviceApproval(warmStorageAddress)

        } catch (error) {
            console.warn('Could not retrieve payment info:', error)
        }

        return {
            network,
            chainId,
            provider: 'Synapse SDK',
            configured: true,
            balance,
            allowances
        }

    } catch (error) {
        console.error('Failed to get Filecoin info:', error)
        return {
            network: FILECOIN_NETWORK,
            chainId: 0,
            provider: 'Synapse SDK',
            configured: true
        }
    }
}

/**
 * Setup payments for Filecoin storage using escrow contract
 * Based on FIL-Builders fs-upload-dapp tutorial
 */
export async function setupFilecoinPayments(amountUSDFC: string = '15'): Promise<void> {
    try {
        const synapse = await getSynapseInstance()

        console.log('💰 Setting up Filecoin storage escrow payments...')
        console.log('📚 Following FIL-Builders tutorial pattern')

        // Get current payment status
        const accountInfo = await synapse.payments.accountInfo()
        const currentBalance = ethers.formatUnits(accountInfo.availableFunds, 18)
        console.log(`💰 Current escrow balance: ${currentBalance} USDFC`)

        const warmStorageAddress = await synapse.getWarmStorageAddress()
        console.log(`🏪 Warm Storage Service: ${warmStorageAddress}`)

        // Calculate storage metrics based on app needs
        const storageConfig = {
            storageCapacityGB: 1,      // 1 GB storage capacity
            persistencePeriodDays: 30,  // 30 days persistence
            minDaysThreshold: 10        // Warning threshold
        }

        // Calculate required allowances (simplified version of calculateStorageMetrics)
        const epochsPerDay = 2880 // Approximately 2880 epochs per day on Filecoin
        const totalEpochs = storageConfig.persistencePeriodDays * epochsPerDay

        // Rate allowance: USDFC per epoch (simplified calculation)
        const rateAllowancePerEpoch = ethers.parseUnits('0.001', 18) // 0.001 USDFC per epoch

        // Lockup allowance: Total USDFC for persistence period
        const lockupAllowance = rateAllowancePerEpoch * BigInt(totalEpochs)

        // Deposit amount: Ensure we have enough in escrow
        const depositAmount = ethers.parseUnits(amountUSDFC, 18)

        console.log(`� Storage Configuration:`)
        console.log(`   Capacity: ${storageConfig.storageCapacityGB} GB`)
        console.log(`   Persistence: ${storageConfig.persistencePeriodDays} days`)
        console.log(`   Rate allowance: ${ethers.formatUnits(rateAllowancePerEpoch, 18)} USDFC/epoch`)
        console.log(`   Lockup allowance: ${ethers.formatUnits(lockupAllowance, 18)} USDFC`)
        console.log(`   Deposit amount: ${amountUSDFC} USDFC`)

        // Step 1: Deposit USDFC to Synapse escrow contract
        if (accountInfo.availableFunds < depositAmount) {
            console.log(`�📥 Depositing ${amountUSDFC} USDFC to escrow contract...`)
            const depositTx = await synapse.payments.deposit(depositAmount)
            console.log(`💳 Deposit transaction: ${depositTx.hash}`)
            await depositTx.wait()
            console.log('✅ Deposit confirmed')
        } else {
            console.log('✅ Sufficient balance already in escrow')
        }

        // Step 2: Approve FilecoinWarmStorageService for automated payments
        console.log('🔐 Approving FilecoinWarmStorageService for automated payments...')
        const approveTx = await synapse.payments.approveService(
            warmStorageAddress,
            rateAllowancePerEpoch,     // Rate allowance: USDFC per epoch
            lockupAllowance,           // Lockup allowance: Total USDFC for persistence
            BigInt(totalEpochs)        // Max lockup period in epochs
        )

        console.log(`🔐 Service approval transaction: ${approveTx.hash}`)
        await approveTx.wait()
        console.log('✅ FilecoinWarmStorageService approved for automated payments')

        // Verify the setup
        const updatedAccountInfo = await synapse.payments.accountInfo()
        const updatedBalance = ethers.formatUnits(updatedAccountInfo.availableFunds, 18)
        const approval = await synapse.payments.serviceApproval(warmStorageAddress)

        console.log('\n🎉 Filecoin storage escrow setup complete!')
        console.log(`💰 Escrow balance: ${updatedBalance} USDFC`)
        console.log(`📈 Rate allowance: ${ethers.formatUnits(approval.rateAllowance, 18)} USDFC/epoch`)
        console.log(`🔒 Lockup allowance: ${ethers.formatUnits(approval.lockupAllowance, 18)} USDFC`)
        console.log(`⏰ Max lockup period: ${approval.maxLockupPeriod} epochs`)
        console.log(`✅ Service approved: ${approval.isApproved}`)

        console.log('\n🚀 Your Agent Arena can now store data directly on Filecoin!')

    } catch (error) {
        console.error('❌ Escrow payment setup failed:', error)

        if (error instanceof Error) {
            if (error.message.includes('insufficient funds')) {
                throw new Error('Insufficient USDFC tokens in wallet. Please get more tokens from faucet first.')
            }
            if (error.message.includes('allowance')) {
                throw new Error('Failed to set service allowances. Please check your USDFC balance.')
            }
        }

        throw new Error(`Failed to setup escrow payments: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

/**
 * Clean up Synapse connection
 */
export async function disconnectFilecoin(): Promise<void> {
    if (synapseInstance) {
        try {
            const provider = synapseInstance.getProvider()
            if (provider && typeof provider.destroy === 'function') {
                await provider.destroy()
            }
            synapseInstance = null
            console.log('🔌 Disconnected from Filecoin')
        } catch (error) {
            console.warn('Warning during Filecoin disconnect:', error)
        }
    }
}

/**
 * Monitor wallet and escrow balances (equivalent to FIL-Builders useBalances hook)
 */
export interface BalanceInfo {
    walletBalance: string
    escrowBalance: string
    totalBalance: string
    hasEscrowBalance: boolean
    canPayForStorage: boolean
    walletAddress: string
}

export async function getBalanceInfo(): Promise<BalanceInfo> {
    try {
        const synapse = await getSynapseInstance()

        // Extract wallet address from private key
        const privateKeyWithPrefix = FILECOIN_PRIVATE_KEY!.startsWith('0x')
            ? FILECOIN_PRIVATE_KEY!
            : `0x${FILECOIN_PRIVATE_KEY!}`
        const wallet = new ethers.Wallet(privateKeyWithPrefix)
        const walletAddress = wallet.address

        // Get escrow balance from Synapse payments (this is what matters most)
        const accountInfo = await synapse.payments.accountInfo()
        const escrowBalance = ethers.formatUnits(accountInfo.availableFunds, 18)

        // For wallet balance, we'll skip the token contract call for now
        // since the escrow balance is what's actually used for storage payments
        let walletBalance = '0'

        // Note: Wallet balance check disabled due to USDFC contract address issues
        // The escrow balance is what matters for Filecoin storage payments
        console.log('ℹ️ Wallet balance check skipped - using escrow balance for storage payments')

        // Note: Wallet balance check disabled due to USDFC contract address issues
        // The escrow balance is what matters for Filecoin storage payments
        console.log('ℹ️ Wallet balance check skipped - using escrow balance for storage payments')

        // Calculate totals (escrow is what matters for storage)
        const totalBalance = (parseFloat(walletBalance) + parseFloat(escrowBalance)).toString()
        const hasEscrowBalance = parseFloat(escrowBalance) > 0
        const canPayForStorage = parseFloat(escrowBalance) >= 1 // At least 1 USDFC in escrow

        console.log(`💰 Escrow balance: ${escrowBalance} USDFC (ready for storage)`)

        return {
            walletBalance,
            escrowBalance,
            totalBalance: escrowBalance, // Use escrow as total since that's what's used
            hasEscrowBalance,
            canPayForStorage,
            walletAddress
        }

    } catch (error) {
        console.error('❌ Failed to get balance info:', error)

        // Extract wallet address even if balance check fails
        let walletAddress = 'unknown'
        try {
            const privateKeyWithPrefix = FILECOIN_PRIVATE_KEY!.startsWith('0x')
                ? FILECOIN_PRIVATE_KEY!
                : `0x${FILECOIN_PRIVATE_KEY!}`
            const wallet = new ethers.Wallet(privateKeyWithPrefix)
            walletAddress = wallet.address
        } catch { }

        return {
            walletBalance: '0',
            escrowBalance: '0',
            totalBalance: '0',
            hasEscrowBalance: false,
            canPayForStorage: false,
            walletAddress
        }
    }
}

/**
 * Get service approval status (equivalent to FIL-Builders service approval check)
 */
export interface ServiceApprovalInfo {
    isApproved: boolean
    rateAllowance: string
    lockupAllowance: string
    maxLockupPeriod: string
    serviceName: string
}

export async function getServiceApprovalInfo(): Promise<ServiceApprovalInfo> {
    try {
        const synapse = await getSynapseInstance()
        const warmStorageAddress = await synapse.getWarmStorageAddress()

        const approval = await synapse.payments.serviceApproval(warmStorageAddress)

        return {
            isApproved: approval.isApproved,
            rateAllowance: ethers.formatUnits(approval.rateAllowance, 18),
            lockupAllowance: ethers.formatUnits(approval.lockupAllowance, 18),
            maxLockupPeriod: approval.maxLockupPeriod.toString(),
            serviceName: 'FilecoinWarmStorageService'
        }

    } catch (error) {
        console.error('❌ Failed to get service approval info:', error)
        return {
            isApproved: false,
            rateAllowance: '0',
            lockupAllowance: '0',
            maxLockupPeriod: '0',
            serviceName: 'FilecoinWarmStorageService'
        }
    }
}