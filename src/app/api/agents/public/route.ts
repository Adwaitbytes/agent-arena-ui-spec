import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { agents } from '@/db/schema';
import { eq, like, and, or, desc, count } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination parameters
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const search = searchParams.get('search');

    // Base query - only public agents
    let query = db.select().from(agents).where(eq(agents.isPublic, true));
    let countQuery = db.select({ count: count() }).from(agents).where(eq(agents.isPublic, true));

    // Add search conditions if search parameter is provided
    if (search) {
      const searchCondition = or(
        like(agents.name, `%${search}%`),
        like(agents.persona, `%${search}%`)
      );
      
      query = query.where(and(eq(agents.isPublic, true), searchCondition));
      countQuery = countQuery.where(and(eq(agents.isPublic, true), searchCondition));
    }

    // Execute count query for pagination
    const totalCountResult = await countQuery;
    const totalCount = totalCountResult[0].count;
    const totalPages = Math.ceil(totalCount / limit);

    // Execute main query with pagination and ordering
    const agentsResult = await query
      .orderBy(desc(agents.createdAt))
      .limit(limit)
      .offset(offset);

    // Return response in required format
    return NextResponse.json({
      ok: true,
      data: {
        agents: agentsResult,
        pagination: {
          limit,
          offset,
          totalCount,
          totalPages,
          hasNext: offset + limit < totalCount,
          hasPrev: offset > 0
        }
      }
    }, { status: 200 });

  } catch (error) {
    console.error('GET agents error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}