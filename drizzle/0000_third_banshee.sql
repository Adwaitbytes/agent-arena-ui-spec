CREATE TABLE `agents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`owner_user_id` integer,
	`name` text(80) NOT NULL,
	`prompt_profile` text NOT NULL,
	`memory_snippets` text,
	`stats` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `leaderboard` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`agent_id` integer NOT NULL,
	`season_id` integer NOT NULL,
	`mmr` integer DEFAULT 1000 NOT NULL,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `match_players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_id` integer NOT NULL,
	`agent_id` integer NOT NULL,
	`user_id` integer,
	`seat` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`agent_id`) REFERENCES `agents`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`mode` text(32) NOT NULL,
	`status` text(24) NOT NULL,
	`started_at` integer,
	`ended_at` integer,
	`vrf_proof` text,
	`intents_tx` text,
	`shade_agent_id` text(128),
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rounds` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_id` integer NOT NULL,
	`idx` integer NOT NULL,
	`question` text NOT NULL,
	`ipfs_cid` text(128),
	`judge_scores` text,
	`result_summary` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action
);
