import { NextResponse } from 'next/server'

export async function GET() {
    try {
        // Get all agents with owner info for debugging
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/agents?pageSize=50`)
        const data = await response.json()

        if (!data.ok) {
            return NextResponse.json({
                success: false,
                error: 'Failed to fetch agents'
            }, { status: 500 })
        }

        // Group agents by owner
        const agentsByOwner = data.data.agents.reduce((acc: any, agent: any) => {
            const owner = agent.ownerAccountId || 'No Owner'
            if (!acc[owner]) acc[owner] = []
            acc[owner].push({
                id: agent.id,
                name: agent.name,
                isPublic: agent.isPublic
            })
            return acc
        }, {})

        // Get unique owners
        const owners = Object.keys(agentsByOwner).sort()

        return NextResponse.json({
            success: true,
            message: 'Debug info for NEAR wallet agents',
            summary: {
                totalAgents: data.data.agents.length,
                totalOwners: owners.length,
                agentsWithOwners: data.data.agents.filter((a: any) => a.ownerAccountId).length,
                agentsWithoutOwners: data.data.agents.filter((a: any) => !a.ownerAccountId).length
            },
            agentsByOwner,
            owners,
            instructions: {
                checkYourConnection: 'Make sure you are connected to NEAR wallet in the frontend',
                checkYourAccount: 'Verify your NEAR account ID matches exactly',
                testQuery: 'Try: GET /api/agents?ownerId=YOUR_ACCOUNT_ID',
                createAgent: 'Create a new agent to test if ownerAccountId is being set correctly'
            }
        })

    } catch (error) {
        console.error('❌ Debug endpoint failed:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}