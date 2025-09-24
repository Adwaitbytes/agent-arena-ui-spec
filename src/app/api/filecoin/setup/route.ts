import { NextRequest, NextResponse } from 'next/server'
import { setupFilecoinPayments, getBalanceInfo, getServiceApprovalInfo } from '@/lib/filecoin'

export async function POST(request: NextRequest) {
    try {
        console.log('🚀 Setting up Filecoin escrow payments...')

        const body = await request.json()
        const { amountUSDFC = '15' } = body

        // Setup escrow payments with USDFC deposit and service approvals
        await setupFilecoinPayments(amountUSDFC)

        // Get updated balance and approval info
        const balanceInfo = await getBalanceInfo()
        const approvalInfo = await getServiceApprovalInfo()

        console.log('✅ Filecoin setup complete!')

        return NextResponse.json({
            success: true,
            message: 'Filecoin escrow payments successfully configured',
            setup: {
                depositAmount: amountUSDFC,
                balances: balanceInfo,
                serviceApproval: approvalInfo
            }
        })

    } catch (error) {
        console.error('❌ Filecoin setup failed:', error)

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: 'Failed to setup Filecoin escrow payments'
        }, { status: 500 })
    }
}

export async function GET() {
    try {
        console.log('📊 Getting Filecoin setup status...')

        // Get current balance and approval info
        const balanceInfo = await getBalanceInfo()
        const approvalInfo = await getServiceApprovalInfo()

        const isSetupComplete = balanceInfo.canPayForStorage && approvalInfo.isApproved

        return NextResponse.json({
            success: true,
            setupComplete: isSetupComplete,
            balances: balanceInfo,
            serviceApproval: approvalInfo,
            recommendations: {
                needsDeposit: !balanceInfo.hasEscrowBalance,
                needsServiceApproval: !approvalInfo.isApproved,
                readyForUploads: isSetupComplete
            }
        })

    } catch (error) {
        console.error('❌ Failed to get setup status:', error)

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}