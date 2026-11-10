-- Lot C - Permissions configurables des groupes de chat
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "is_read_only" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "groups" ADD COLUMN IF NOT EXISTS "permissions" jsonb DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "group_members" ADD COLUMN IF NOT EXISTS "permissions" jsonb DEFAULT '{}';--> statement-breakpoint

-- Backfill des lignes existantes (les defaults ne s'appliquent qu'aux nouvelles lignes)
UPDATE "groups" SET "permissions" = '{}' WHERE "permissions" IS NULL;--> statement-breakpoint
UPDATE "group_members" SET "permissions" = '{}' WHERE "permissions" IS NULL;--> statement-breakpoint
UPDATE "groups" SET "is_read_only" = false WHERE "is_read_only" IS NULL;--> statement-breakpoint

-- Lot A2 - Index pour la pagination cursor et les conversations
CREATE INDEX IF NOT EXISTS "messages_group_created_idx"
  ON "messages" ("group_id", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "messages_dm_created_idx"
  ON "messages" ("sender_id", "recipient_id", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "conversations_participants_gin_idx"
  ON "conversations" USING gin ("participant_ids");--> statement-breakpoint