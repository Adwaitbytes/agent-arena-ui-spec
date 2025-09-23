ALTER TABLE `matches` ADD `winner` text;--> statement-breakpoint
ALTER TABLE `matches` ADD `score_a` integer;--> statement-breakpoint
ALTER TABLE `matches` ADD `score_b` integer;--> statement-breakpoint
ALTER TABLE `matches` ADD `agent_a_id` integer REFERENCES agents(id);--> statement-breakpoint
ALTER TABLE `matches` ADD `agent_b_id` integer REFERENCES agents(id);--> statement-breakpoint
ALTER TABLE `matches` ADD `summary` text;