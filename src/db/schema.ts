import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const agents = sqliteTable('agents', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('user_id').notNull(), // NEAR address
  name: text('name', { length: 100 }).notNull(),
  persona: text('persona'),
  prompt: text('prompt', { length: 1000 }).notNull(),
  prompts: text('prompts', { mode: 'json' }),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  wins: integer('wins').default(0),
  losses: integer('losses').default(0),
  createdAt: integer('created_at').notNull(),
});

export const matches = sqliteTable('matches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  mode: text('mode', { length: 32 }).notNull(),
  status: text('status', { length: 24 }).notNull(),
  startedAt: integer('started_at'),
  endedAt: integer('ended_at'),
  vrfProof: text('vrf_proof'),
  intentsTx: text('intents_tx'),
  shadeAgentId: text('shade_agent_id', { length: 128 }),
  winner: text('winner'),
  scoreA: integer('score_a'),
  scoreB: integer('score_b'),
  agentAId: integer('agent_a_id').references(() => agents.id),
  agentBId: integer('agent_b_id').references(() => agents.id),
  summary: text('summary'),
  roundsData: text('rounds_data', { mode: 'json' }),
  totalScores: text('total_scores', { mode: 'json' }),
  ipfsCid: text('ipfs_cid'),
  nearTxHash: text('near_tx_hash'),
  createdAt: integer('created_at').notNull(),
});

export const matchPlayers = sqliteTable('match_players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  matchId: integer('match_id').notNull().references(() => matches.id),
  agentId: integer('agent_id').notNull().references(() => agents.id),
  userId: integer('user_id'),
  seat: integer('seat').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const rounds = sqliteTable('rounds', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  matchId: integer('match_id').notNull().references(() => matches.id),
  idx: integer('idx').notNull(),
  question: text('question').notNull(),
  ipfsCid: text('ipfs_cid', { length: 128 }),
  judgeScores: text('judge_scores', { mode: 'json' }),
  resultSummary: text('result_summary'),
  answerA: text('answer_a'),
  answerB: text('answer_b'),
  responseA: text('response_a'),
  responseB: text('response_b'),
  createdAt: integer('created_at').notNull(),
});

export const leaderboard = sqliteTable('leaderboard', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  agentId: integer('agent_id').notNull().references(() => agents.id),
  seasonId: integer('season_id').notNull(),
  mmr: integer('mmr').notNull().default(1000),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  updatedAt: integer('updated_at').notNull(),
});