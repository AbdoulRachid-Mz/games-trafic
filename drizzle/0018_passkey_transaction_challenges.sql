-- Phase 4 — Challenges Passkey pour autorisation de transaction
CREATE TABLE IF NOT EXISTS "passkey_transaction_challenges" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "wallet_id" text NOT NULL REFERENCES "user_wallets"("id") ON DELETE cascade,
  "challenge" text NOT NULL,
  "transaction_hash" text NOT NULL,
  "expires_at" timestamp NOT NULL,
  "consumed_at" timestamp,
  "created_at" timestamp DEFAULT now()
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "passkey_tx_challenges_user_idx"
  ON "passkey_transaction_challenges" ("user_id", "created_at");