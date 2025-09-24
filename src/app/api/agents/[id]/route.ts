import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

const updateAgentSchema = z.object({
  name: z.string().min(1).max(100).transform(s => s.trim()).optional(),
  persona: z.string().max(500).optional(),
  prompts: z.object({
    core: z.string().min(10),
    refinements: z.array(z.string()).optional()
  }).optional(),
  isPublic: z.boolean().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid agent ID' },
        { status: 400 }
      );
    }

    const [agent] = await db.select().from(agents).where(eq(agents.id, id));

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
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
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
    const [existingAgent] = await db.select().from(agents).where(eq(agents.id, id));
    if (!existingAgent) {
      return NextResponse.json(
        { ok: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    const updates: any = validation.data;
    
    // Update legacy prompt field if prompts.core is updated
    if (updates.prompts?.core) {
      updates.prompt = updates.prompts.core;
    }

    const [updatedAgent] = await db
      .update(agents)
      .set(updates)
      .where(eq(agents.id, id))
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { ok: false, error: 'Invalid agent ID' },
        { status: 400 }
      );
    }

    // Check if agent exists
    const [existingAgent] = await db.select().from(agents).where(eq(agents.id, id));
    if (!existingAgent) {
      return NextResponse.json(
        { ok: false, error: 'Agent not found' },
        { status: 404 }
      );
    }

    // TODO: Add ownership check - verify request userId matches agent.userId
    // This would require authentication middleware or header parsing

    await db.delete(agents).where(eq(agents.id, id));

    return NextResponse.json({
      ok: true,
      data: { message: 'Agent deleted successfully', id }
    });
  } catch (error) {
    console.error('DELETE /api/agents/[id] error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}