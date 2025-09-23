import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateAgentSchema = z.object({
  name: z.string().min(1).max(80).transform(s => s.trim()).optional(),
  promptProfile: z.string().min(1).transform(s => s.trim()).optional(),
  memorySnippets: z.array(z.string()).optional(),
  ownerAccountId: z.string().optional().nullable(),
  isPublic: z.boolean().optional(),
  stats: z.object({}).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agentId = parseInt(id);
    if (isNaN(agentId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid agent ID' },
        { status: 400 }
      );
    }

    const [agent] = await db.select().from(agents).where(eq(agents.id, agentId));

    if (!agent) {
      return NextResponse.json(
        { ok: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      data: agent,
    });
  } catch (error) {
    console.error('GET /api/agents/[id] error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agentId = parseInt(id);
    if (isNaN(agentId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid agent ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = updateAgentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      );
    }

    // Check if agent exists
    const [existingAgent] = await db.select().from(agents).where(eq(agents.id, agentId));
    if (!existingAgent) {
      return NextResponse.json(
        { ok: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    const [updatedAgent] = await db
      .update(agents)
      .set(validation.data)
      .where(eq(agents.id, agentId))
      .returning();

    return NextResponse.json({
      ok: true,
      data: updatedAgent,
    });
  } catch (error) {
    console.error('PUT /api/agents/[id] error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/agents/[id] - Delete an agent
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agentId = parseInt(id);

    if (isNaN(agentId)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid agent ID' },
        { status: 400 }
      );
    }

    // Check if agent exists
    const [existingAgent] = await db
      .select()
      .from(agents)
      .where(eq(agents.id, agentId))
      .limit(1);

    if (!existingAgent) {
      return NextResponse.json(
        { ok: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Delete the agent
    await db
      .delete(agents)
      .where(eq(agents.id, agentId));

    return NextResponse.json({
      ok: true,
      message: 'Agent deleted successfully',
    });
  } catch (error) {
    console.error('DELETE /api/agents/[id] error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}