ALTER TABLE `agents` ALTER COLUMN "is_public" TO "is_public" integer;--> statement-breakpoint
ALTER TABLE `rounds` ADD `storage_type` text(16);