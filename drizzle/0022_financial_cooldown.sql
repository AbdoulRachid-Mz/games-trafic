-- Enforce 120s cooldown between user-initiated financial operations (server/DB-clock safe)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_financial_action_at" timestamp with time zone;
CREATE INDEX IF NOT EXISTS "users_last_financial_action_at_idx" ON "users" ("last_financial_action_at");
