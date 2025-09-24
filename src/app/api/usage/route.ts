import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { matchPlayers, matches } from '@/db/schema';
import { eq, and, gte } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    // Extract Authorization header
    const authHeader = request.headers.get('authorization');
    let userId: number | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const parsedUserId = parseInt(token);
      
      if (!isNaN(parsedUserId)) {
        userId = parsedUserId;
      }
    }

    // Anonymous mode - return zeros
    if (!userId) {
      return NextResponse.json({
        ok: true,
        data: {
          plan: "Free",
          dailyUsed: 0,
          dailyLimit: 10,
          monthlyUsed: 0,
          monthlyLimit: 200
        }
      });
    }

    // Calculate time windows
    const now = Date.now();
    const dailyStart = now - (24 * 60 * 60 * 1000); // 24 hours ago
    
    // Current month start
    const currentDate = new Date();
    const monthlyStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getTime();

    // Query for daily usage (last 24 hours)
    const dailyMatches = await db
      .select()
      .from(matchPlayers)
      .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
      .where(
        and(
          eq(matchPlayers.userId, userId),
          gte(matches.startedAt, dailyStart)
        )
      );

    // Query for monthly usage (current calendar month)
    const monthlyMatches = await db
      .select()
      .from(matchPlayers)
      .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
      .where(
        and(
          eq(matchPlayers.userId, userId),
          gte(matches.startedAt, monthlyStart)
        )
      );

    // Handle cases where startedAt is null - fallback to createdAt
    const dailyMatchesWithFallback = await db
      .select()
      .from(matchPlayers)
      .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
      .where(
        and(
          eq(matchPlayers.userId, userId),
          gte(matches.createdAt, dailyStart)
        )
      );

    const monthlyMatchesWithFallback = await db
      .select()
      .from(matchPlayers)
      .innerJoin(matches, eq(matchPlayers.matchId, matches.id))
      .where(
        and(
          eq(matchPlayers.userId, userId),
          gte(matches.createdAt, monthlyStart)
        )
      );

    // Count unique matches (in case user has multiple players in same match)
    const dailyUniqueMatches = new Set();
    const monthlyUniqueMatches = new Set();

    // Process matches with startedAt
    dailyMatches.forEach(result => {
      if (result.matches.startedAt) {
        dailyUniqueMatches.add(result.matches.id);
      }
    });

    monthlyMatches.forEach(result => {
      if (result.matches.startedAt) {
        monthlyUniqueMatches.add(result.matches.id);
      }
    });

    // Process matches with fallback to createdAt (only if startedAt is null)
    dailyMatchesWithFallback.forEach(result => {
      if (!result.matches.startedAt) {
        dailyUniqueMatches.add(result.matches.id);
      }
    });

    monthlyMatchesWithFallback.forEach(result => {
      if (!result.matches.startedAt) {
        monthlyUniqueMatches.add(result.matches.id);
      }
    });

    const dailyUsed = dailyUniqueMatches.size;
    const monthlyUsed = monthlyUniqueMatches.size;

    return NextResponse.json({
      ok: true,
      data: {
        plan: "Free",
        dailyUsed,
        dailyLimit: 10,
        monthlyUsed,
        monthlyLimit: 200
      }
    });

  } catch (error) {
    console.error('GET /api/usage error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Internal server error: ' + error
    }, { status: 500 });
  }
}