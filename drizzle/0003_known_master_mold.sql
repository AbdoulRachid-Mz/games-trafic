CREATE TYPE "public"."verification_status" AS ENUM('PENDING', 'VERIFIED', 'REJECTED');--> statement-breakpoint
ALTER TABLE "user_wallets" ALTER COLUMN "verification_status" SET DEFAULT 'PENDING'::"public"."verification_status";--> statement-breakpoint
ALTER TABLE "user_wallets" ALTER COLUMN "verification_status" SET DATA TYPE "public"."verification_status" USING "verification_status"::"public"."verification_status";--> statement-breakpoint
ALTER TABLE "tournament_editions" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "tournament_editions" ADD COLUMN "entry_fee" numeric(10, 2) DEFAULT '0';