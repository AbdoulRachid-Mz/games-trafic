ALTER TABLE "api_keys" ADD COLUMN "rate_limit_per_hour" integer DEFAULT 1000;--> statement-breakpoint
ALTER TABLE "api_keys" ADD COLUMN "rate_limit_per_day" integer DEFAULT 10000;