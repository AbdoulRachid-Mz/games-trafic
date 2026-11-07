-- Phase 8 — Demandes de réinitialisation de PIN (OTP)
CREATE TABLE IF NOT EXISTS "pin_reset_requests" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE cascade,
  "wallet_id" text NOT NULL REFERENCES "user_wallets"("id") ON DELETE cascade,
  "code_hash" text NOT NULL,
  "token_hash" text,
  "attempts" integer NOT NULL DEFAULT 0,
  "expires_at" timestamp NOT NULL,
  "consumed_at" timestamp,
  "token_expires_at" timestamp,
  "created_at" timestamp DEFAULT now()
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pin_reset_requests_user_idx"
  ON "pin_reset_requests" ("user_id", "created_at" DESC);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "pin_reset_requests_wallet_idx"
  ON "pin_reset_requests" ("wallet_id");
