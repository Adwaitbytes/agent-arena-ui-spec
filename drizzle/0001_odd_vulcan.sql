ALTER TABLE `agents` ADD `owner_account_id` text;--> statement-breakpoint
ALTER TABLE `agents` ADD `is_public` integer DEFAULT false NOT NULL;