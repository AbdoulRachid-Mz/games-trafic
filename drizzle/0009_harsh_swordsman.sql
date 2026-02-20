CREATE TYPE "public"."financial_account_type" AS ENUM('USER_WALLET', 'SHOP_WALLET', 'PLATFORM_ESCROW', 'PLATFORM_FEES', 'TOURNAMENT_POOL', 'SYSTEM_ADJUSTMENT');--> statement-breakpoint
ALTER TYPE "public"."match_status" ADD VALUE 'PENDING_REVIEW';--> statement-breakpoint
ALTER TYPE "public"."match_status" ADD VALUE 'AWAITING_ADMIN_CONFIRMATION';--> statement-breakpoint
ALTER TYPE "public"."match_status" ADD VALUE 'DISPUTED';--> statement-breakpoint
ALTER TYPE "public"."trace_type" ADD VALUE 'EXPLANATION_OPENED';--> statement-breakpoint
CREATE TABLE "financial_accounts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_user_id" text,
	"owner_shop_id" text,
	"owner_edition_id" text,
	"type" "financial_account_type" DEFAULT 'USER_WALLET' NOT NULL,
	"currency" text DEFAULT 'GTC',
	"is_active" boolean DEFAULT true,
	"is_locked" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ledger_entries" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" text NOT NULL,
	"account_id" text NOT NULL,
	"debit" numeric(15, 2) DEFAULT '0',
	"credit" numeric(15, 2) DEFAULT '0',
	"currency" text DEFAULT 'GTC',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "user_wallets" RENAME COLUMN "balance" TO "financial_account_id";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING'::text;--> statement-breakpoint
DROP TYPE "public"."order_status";--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'ACCEPTED_BY_SHOP', 'PROCESSING_BY_ADMIN', 'COMPLETED', 'REJECTED_BY_SHOP', 'REJECTED_BY_ADMIN', 'CANCELLED');--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "status" SET DATA TYPE "public"."order_status" USING "status"::"public"."order_status";--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "wallet_transaction_id" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "seller_credentials" jsonb;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "buyer_instructions" text;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "admin_notes" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "financial_account_id" text;--> statement-breakpoint
ALTER TABLE "tournament_editions" ADD COLUMN "financial_account_id" text;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD COLUMN "financial_account_id" text;--> statement-breakpoint
ALTER TABLE "financial_accounts" ADD CONSTRAINT "financial_accounts_owner_user_id_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_account_id_financial_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."financial_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "financial_accounts_owner_user_idx" ON "financial_accounts" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "financial_accounts_owner_shop_idx" ON "financial_accounts" USING btree ("owner_shop_id");--> statement-breakpoint
CREATE INDEX "financial_accounts_owner_edition_idx" ON "financial_accounts" USING btree ("owner_edition_id");--> statement-breakpoint
CREATE INDEX "financial_accounts_type_idx" ON "financial_accounts" USING btree ("type");--> statement-breakpoint
CREATE INDEX "ledger_account_idx" ON "ledger_entries" USING btree ("account_id");--> statement-breakpoint
CREATE INDEX "ledger_transaction_idx" ON "ledger_entries" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "ledger_created_at_idx" ON "ledger_entries" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_wallet_transaction_id_wallet_transactions_id_fk" FOREIGN KEY ("wallet_transaction_id") REFERENCES "public"."wallet_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_financial_account_id_financial_accounts_id_fk" FOREIGN KEY ("financial_account_id") REFERENCES "public"."financial_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_editions" ADD CONSTRAINT "tournament_editions_financial_account_id_financial_accounts_id_fk" FOREIGN KEY ("financial_account_id") REFERENCES "public"."financial_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_financial_account_id_financial_accounts_id_fk" FOREIGN KEY ("financial_account_id") REFERENCES "public"."financial_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_financial_account_id_financial_accounts_id_fk" FOREIGN KEY ("financial_account_id") REFERENCES "public"."financial_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "wallet_financial_account_idx" ON "user_wallets" USING btree ("financial_account_id");--> statement-breakpoint
CREATE INDEX "transactions_financial_account_idx" ON "wallet_transactions" USING btree ("financial_account_id");