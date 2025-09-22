import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents } from '@/db/schema';
import { count, desc } from 'drizzle-orm';
import { z } from 'zod';

const createAgentSchema = z.object({
  name: z.string().min(1).max(80).transform(s => s.trim()),
  promptProfile: z.string().min(1).transform(s => s.trim()),
  memorySnippets: z.array(z.string()).optional(),
  ownerUserId: z.number().optional().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const offset = (page - 1) * pageSize;

    // Get total count
    const [totalResult] = await db.select({ count: count() }).from(agents);
    const total = totalResult.count;

    // Get paginated agents
    const agentsList = await db
      .select()
      .from(agents)
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

    const { name, promptProfile, memorySnippets, ownerUserId } = validation.data;

    const [newAgent] = await db.insert(agents).values({
      name,
      promptProfile,
      memorySnippets: memorySnippets || null,
      stats: { wins: 0, losses: 0, mmr: 1000 },
      ownerUserId: ownerUserId || null,
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