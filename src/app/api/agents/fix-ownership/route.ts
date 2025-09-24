import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { agents } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(request: NextRequest) {
    try {
        console.log('🔧 Fixing ToXiK agent ownership...')

        const body = await request.json()
        const { agentName = 'ToXiK', ownerAccount = 'utkarsharjariya.testnet' } = body

        // Find the ToXiK agent
        const existingAgent = await db
            .select()
            .from(agents)
            .where(eq(agents.name, agentName))
            .limit(1)

        if (existingAgent.length === 0) {
            console.error(`❌ Agent '${agentName}' not found`)
            return NextResponse.json({
                success: false,
                error: `Agent '${agentName}' not found`
            }, { status: 404 })
        }

        const agent = existingAgent[0]
        console.log(`📍 Found agent: ${agent.name} (ID: ${agent.id})`)
        console.log(`👤 Current owner: ${agent.ownerAccountId || 'none'}`)

        // Update the owner
        const updateResult = await db
            .update(agents)
            .set({
                ownerAccountId: ownerAccount
            })
            .where(eq(agents.id, agent.id))
            .returning()

        if (updateResult.length === 0) {
            throw new Error('Failed to update agent ownership')
        }

        const updatedAgent = updateResult[0]

        console.log(`✅ Agent ownership updated successfully!`)
        console.log(`👤 New owner: ${updatedAgent.ownerAccountId}`)

        return NextResponse.json({
            success: true,
            message: `Agent '${agentName}' ownership updated successfully`,
            agent: {
                id: updatedAgent.id,
                name: updatedAgent.name,
                ownerAccountId: updatedAgent.ownerAccountId,
                createdAt: updatedAgent.createdAt
            }
        })

    } catch (error) {
        console.error('❌ Failed to fix agent ownership:', error)

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            details: 'Failed to update agent ownership'
        }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Checking agent ownership status...')

        const { searchParams } = new URL(request.url)
        const agentName = searchParams.get('agent') || 'ToXiK'
        const ownerAccount = searchParams.get('owner') || 'utkarsharjariya.testnet'

        // Find all agents for the owner
        const ownerAgents = await db
            .select()
            .from(agents)
            .where(eq(agents.ownerAccountId, ownerAccount))

        // Find the specific agent
        const specificAgent = await db
            .select()
            .from(agents)
            .where(eq(agents.name, agentName))
            .limit(1)

        const isOwnershipCorrect = specificAgent.length > 0 &&
            specificAgent[0].ownerAccountId === ownerAccount

        return NextResponse.json({
            success: true,
            ownerAccount,
            agentName,
            isOwnershipCorrect,
            specificAgent: specificAgent[0] || null,
            ownerAgents: ownerAgents.map(agent => ({
                id: agent.id,
                name: agent.name,
                ownerAccountId: agent.ownerAccountId
            }))
        })

    } catch (error) {
        console.error('❌ Failed to check agent ownership:', error)

        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}