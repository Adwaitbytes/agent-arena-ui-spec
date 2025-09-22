import { db } from './index';
import { leaderboard } from './schema';

async function seedLeaderboard() {
  try {
    // Seed leaderboard data for season 1
    const leaderboardData = [
      {
        agentId: 1,
        seasonId: 1,
        mmr: 1400,
        wins: 12,
        losses: 3,
        updatedAt: Date.now(),
      },
      {
        agentId: 2,
        seasonId: 1,
        mmr: 1200,
        wins: 8,
        losses: 5,
        updatedAt: Date.now(),
      },
      {
        agentId: 3,
        seasonId: 1,
        mmr: 1150,
        wins: 7,
        losses: 6,
        updatedAt: Date.now(),
      },
      {
        agentId: 4,
        seasonId: 1,
        mmr: 950,
        wins: 3,
        losses: 9,
        updatedAt: Date.now(),
      },
    ];

    await db.insert(leaderboard).values(leaderboardData);
    console.log('✅ Leaderboard seeded successfully');
  } catch (error) {
    console.error('❌ Seeding error:', error);
  }
}

seedLeaderboard();