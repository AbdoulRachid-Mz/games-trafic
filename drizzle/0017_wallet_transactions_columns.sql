-- Phase 1 — Colonnes manquantes sur wallet_transactions
-- Migration additive. Aucune donnée existante n'est supprimée.

ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "reference" text;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "created_by_user_id" text REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "actor_level" "user_level";--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "reason" text;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "reversal_of" text REFERENCES "wallet_transactions"("id");--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "reversed_by" text REFERENCES "wallet_transactions"("id");--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "completed_at" timestamp;--> statement-breakpoint

-- Unicité de la référence lorsqu'elle est renseignée.
CREATE UNIQUE INDEX IF NOT EXISTS "wallet_transactions_reference_unique"
  ON "wallet_transactions" ("reference")
  WHERE "reference" IS NOT NULL;--> statement-breakpoint

-- Index pour les recherches par idempotence.
CREATE INDEX IF NOT EXISTS "wallet_transactions_idempotency_idx"
  ON "wallet_transactions" ("wallet_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;--> statement-breakpoint

-- Index pour les recherches par créateur / statut / date.
CREATE INDEX IF NOT EXISTS "wallet_transactions_created_by_idx"
  ON "wallet_transactions" ("created_by_user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "wallet_transactions_completed_at_idx"
  ON "wallet_transactions" ("completed_at");