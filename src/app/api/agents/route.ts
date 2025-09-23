import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents } from '@/db/schema';
import { count, desc, eq, like, or, and } from 'drizzle-orm';
import { z } from 'zod';

const createAgentSchema = z.object({
  userId: z.string().min(1).transform(s => s.trim()),
  name: z.string().min(1).max(100).transform(s => s.trim()),
  persona: z.string().max(500).optional(),
  prompts: z.object({
    core: z.string().min(10),
    refinements: z.array(z.string()).optional().default([])
  }),
  isPublic: z.boolean().optional().default(false)
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const publicOnly = searchParams.get('public') === 'true';
    const search = searchParams.get('search');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const offset = (page - 1) * pageSize;

    // Build query conditions
    let whereConditions: any[] = [];

    if (publicOnly) {
      whereConditions.push(eq(agents.isPublic, true));
    } else if (userId) {
      // Show user's agents + public ones
      whereConditions.push(
        or(
          eq(agents.userId, userId),
          eq(agents.isPublic, true)
        )
      );
    } else {
      // Default: only public agents
      whereConditions.push(eq(agents.isPublic, true));
    }

    if (search) {
      whereConditions.push(
        or(
          like(agents.name, `%${search}%`),
          like(agents.persona, `%${search}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0];

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(agents)
      .where(whereClause);
    const total = totalResult.count;

    // Get paginated agents
    const agentsList = await db
      .select()
      .from(agents)
      .where(whereClause)
      .orderBy(desc(agents.createdAt))
      .limit(pageSize)
      .offset(offset);

    return NextResponse.json({
      ok: true,
      data: {
        agents: agentsList,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.ceil(total / pageSize),
        },
      },
    });
  } catch (error) {
    console.error('GET /api/agents error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = createAgentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { ok: false, error: validation.error.issues.map(i => i.message).join(', ') },
        { status: 400 }
      );
    }

    const { userId, name, persona, prompts, isPublic } = validation.data;

    const [newAgent] = await db.insert(agents).values({
      userId,
      name,
      persona: persona || null,
      prompt: prompts.core, // Legacy compatibility
      prompts: prompts as any,
      isPublic,
      wins: 0,
      losses: 0,
      createdAt: Date.now(),
    }).returning();

    return NextResponse.json(
      { ok: true, data: newAgent },
      { status: 201 }
    );
  } catch (error) {
    console.error('POST /api/agents error:', error);
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}