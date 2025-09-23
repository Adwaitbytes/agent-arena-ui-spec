import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents } from '@/db/schema';
import { count, desc, eq, and } from 'drizzle-orm';
import { z } from 'zod';

const createAgentSchema = z.object({
  name: z.string().min(1).max(80).transform(s => s.trim()),
  promptProfile: z.string().min(1).transform(s => s.trim()),
  memorySnippets: z.array(z.string()).optional(),
  ownerUserId: z.number().optional().nullable(),
  ownerAccountId: z.string().optional().nullable(),
  isPublic: z.boolean().optional().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20')));
    const offset = (page - 1) * pageSize;
    const publicOnly = searchParams.get('public') === 'true';
    const ownerId = searchParams.get('ownerId'); // For filtering by owner

    // Build the query conditions
    let whereConditions = [];
    if (publicOnly) {
      whereConditions.push(eq(agents.isPublic, true));
    }
    if (ownerId) {
      whereConditions.push(eq(agents.ownerAccountId, ownerId));
    }

    // Get total count with conditions
    const countQuery = whereConditions.length > 0
      ? db.select({ count: count() }).from(agents).where(
        whereConditions.length === 1 ? whereConditions[0] :
          and(...whereConditions)
      )
      : db.select({ count: count() }).from(agents);

    const [totalResult] = await countQuery;
    const total = totalResult.count;

    // Get paginated agents with conditions
    const agentsQuery = whereConditions.length > 0
      ? db.select().from(agents).where(
        whereConditions.length === 1 ? whereConditions[0] :
          and(...whereConditions)
      ).orderBy(desc(agents.createdAt)).limit(pageSize).offset(offset)
      : db.select().from(agents).orderBy(desc(agents.createdAt)).limit(pageSize).offset(offset);

    const agentsList = await agentsQuery;

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

    const { name, promptProfile, memorySnippets, ownerUserId, ownerAccountId, isPublic } = validation.data;

    const [newAgent] = await db.insert(agents).values({
      name,
      promptProfile,
      memorySnippets: memorySnippets || null,
      stats: { wins: 0, losses: 0, mmr: 1000 },
      ownerUserId: ownerUserId || null,
      ownerAccountId: ownerAccountId || null,
      isPublic: isPublic || false,
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