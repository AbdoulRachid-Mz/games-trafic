-- Finance V2 - socle ledger, idempotence, audit et demandes de crédit
-- Migration additive. Aucune donnée financière n'est supprimée.

-- 1. Enums comptables
ALTER TYPE "financial_account_type" ADD VALUE IF NOT EXISTS 'SYSTEM_GTC_ISSUANCE';--> statement-breakpoint
ALTER TYPE "financial_account_type" ADD VALUE IF NOT EXISTS 'SYSTEM_EXTERNAL_CLEARING';--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'credit_request_status') THEN
    CREATE TYPE "credit_request_status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');
  END IF;
END $$;--> statement-breakpoint

-- 2. Comptes financiers : clé système stable + solde négatif contrôlé
ALTER TABLE "financial_accounts" ADD COLUMN IF NOT EXISTS "system_key" text;--> statement-breakpoint
ALTER TABLE "financial_accounts" ADD COLUMN IF NOT EXISTS "allow_negative_balance" boolean DEFAULT false;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "financial_accounts_system_key_unique" ON "financial_accounts" ("system_key");--> statement-breakpoint

-- 3. Transactions : traçabilité, idempotence et liens de remboursement
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "reference" text;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "created_by_user_id" text;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "actor_level" "user_level";--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "reason" text;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "reversal_of" text;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "reversed_by" text;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "completed_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_transactions_reference_unique'
  ) THEN
    ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_reference_unique" UNIQUE ("reference");
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_transactions_created_by_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_created_by_user_id_users_id_fk"
      FOREIGN KEY ("created_by_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_transactions_reversal_of_wallet_transactions_id_fk'
  ) THEN
    ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_reversal_of_wallet_transactions_id_fk"
      FOREIGN KEY ("reversal_of") REFERENCES "wallet_transactions"("id") ON DELETE no action ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_transactions_reversed_by_wallet_transactions_id_fk'
  ) THEN
    ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_reversed_by_wallet_transactions_id_fk"
      FOREIGN KEY ("reversed_by") REFERENCES "wallet_transactions"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_wallet_idempotency_unique"
  ON "wallet_transactions" ("wallet_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "transactions_created_by_user_idx"
  ON "wallet_transactions" ("created_by_user_id");--> statement-breakpoint

-- 4. Demandes : approbateur et date d'approbation
ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "approved_by" text;--> statement-breakpoint
ALTER TABLE "requests" ADD COLUMN IF NOT EXISTS "approved_at" timestamp;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'requests_approved_by_users_id_fk'
  ) THEN
    ALTER TABLE "requests" ADD CONSTRAINT "requests_approved_by_users_id_fk"
      FOREIGN KEY ("approved_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

-- 5. Politique financière configurable
ALTER TABLE "app_settings" ADD COLUMN IF NOT EXISTS "finance_policy" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint

-- 6. Idempotence
CREATE TABLE IF NOT EXISTS "idempotency_keys" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "scope" text NOT NULL,
  "key" text NOT NULL,
  "request_hash" text NOT NULL,
  "status" text DEFAULT 'IN_PROGRESS' NOT NULL,
  "response" jsonb,
  "transaction_id" text,
  "expires_at" timestamp,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "idempotency_scope_key_unique"
  ON "idempotency_keys" ("scope", "key");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idempotency_created_at_idx"
  ON "idempotency_keys" ("created_at");--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'idempotency_keys_transaction_id_wallet_transactions_id_fk'
  ) THEN
    ALTER TABLE "idempotency_keys" ADD CONSTRAINT "idempotency_keys_transaction_id_wallet_transactions_id_fk"
      FOREIGN KEY ("transaction_id") REFERENCES "wallet_transactions"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

-- 7. Journal d'audit financier (append-only)
CREATE TABLE IF NOT EXISTS "financial_audit_logs" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "actor_id" text,
  "actor_level" "user_level",
  "action" text NOT NULL,
  "transaction_id" text,
  "request_id" text,
  "account_id" text,
  "amount" numeric(15, 2),
  "currency" text DEFAULT 'GTC',
  "reason" text,
  "ip" text,
  "user_agent" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now()
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_audit_actor_idx" ON "financial_audit_logs" ("actor_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_audit_action_idx" ON "financial_audit_logs" ("action");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_audit_transaction_idx" ON "financial_audit_logs" ("transaction_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "financial_audit_created_at_idx" ON "financial_audit_logs" ("created_at");--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_audit_logs_actor_id_users_id_fk'
  ) THEN
    ALTER TABLE "financial_audit_logs" ADD CONSTRAINT "financial_audit_logs_actor_id_users_id_fk"
      FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'financial_audit_logs_account_id_financial_accounts_id_fk'
  ) THEN
    ALTER TABLE "financial_audit_logs" ADD CONSTRAINT "financial_audit_logs_account_id_financial_accounts_id_fk"
      FOREIGN KEY ("account_id") REFERENCES "financial_accounts"("id") ON DELETE no action ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

-- 8. Demandes d'émission GTC (table dédiée, distincte de `requests`)
CREATE TABLE IF NOT EXISTS "transaction_credit_requests" (
  "id" text PRIMARY KEY DEFAULT gen_random_uuid(),
  "requester_id" text NOT NULL,
  "requester_level" "user_level" NOT NULL,
  "recipient_user_id" text NOT NULL,
  "recipient_wallet_id" text NOT NULL,
  "amount" numeric(15, 2) NOT NULL,
  "currency" text DEFAULT 'GTC',
  "reason" text NOT NULL,
  "status" "credit_request_status" DEFAULT 'PENDING' NOT NULL,
  "decided_by" text,
  "decided_at" timestamp,
  "rejection_reason" text,
  "transaction_id" text,
  "idempotency_key" text,
  "second_approver_id" text,
  "metadata" jsonb DEFAULT '{}'::jsonb,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_requests_status_created_idx"
  ON "transaction_credit_requests" ("status", "created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "credit_requests_requester_status_idx"
  ON "transaction_credit_requests" ("requester_id", "status");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "credit_requests_requester_idempotency_unique"
  ON "transaction_credit_requests" ("requester_id", "idempotency_key")
  WHERE "idempotency_key" IS NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transaction_credit_requests_requester_id_users_id_fk'
  ) THEN
    ALTER TABLE "transaction_credit_requests" ADD CONSTRAINT "transaction_credit_requests_requester_id_users_id_fk"
      FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transaction_credit_requests_recipient_user_id_users_id_fk'
  ) THEN
    ALTER TABLE "transaction_credit_requests" ADD CONSTRAINT "transaction_credit_requests_recipient_user_id_users_id_fk"
      FOREIGN KEY ("recipient_user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transaction_credit_requests_recipient_wallet_id_user_wallets_id_fk'
  ) THEN
    ALTER TABLE "transaction_credit_requests" ADD CONSTRAINT "transaction_credit_requests_recipient_wallet_id_user_wallets_id_fk"
      FOREIGN KEY ("recipient_wallet_id") REFERENCES "user_wallets"("id") ON DELETE no action ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transaction_credit_requests_decided_by_users_id_fk'
  ) THEN
    ALTER TABLE "transaction_credit_requests" ADD CONSTRAINT "transaction_credit_requests_decided_by_users_id_fk"
      FOREIGN KEY ("decided_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transaction_credit_requests_second_approver_id_users_id_fk'
  ) THEN
    ALTER TABLE "transaction_credit_requests" ADD CONSTRAINT "transaction_credit_requests_second_approver_id_users_id_fk"
      FOREIGN KEY ("second_approver_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transaction_credit_requests_transaction_id_wallet_transactions_id_fk'
  ) THEN
    ALTER TABLE "transaction_credit_requests" ADD CONSTRAINT "transaction_credit_requests_transaction_id_wallet_transactions_id_fk"
      FOREIGN KEY ("transaction_id") REFERENCES "wallet_transactions"("id") ON DELETE set null ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint

-- 9. VIP : autoriser l'historique, un seul abonnement ACTIVE par utilisateur
DROP INDEX IF EXISTS "vip_user_unique";--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "vip_user_active_unique"
  ON "vip_subscriptions" ("user_id")
  WHERE "status" = 'ACTIVE';
