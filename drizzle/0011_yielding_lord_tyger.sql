CREATE TABLE "api_keys" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"hash" text NOT NULL,
	"key_prefix" text NOT NULL,
	"name" text,
	"type" text NOT NULL,
	"application_name" text,
	"permissions" text[] DEFAULT '{}',
	"allowed_ips" text[] DEFAULT '{}',
	"allowed_origins" text[] DEFAULT '{}',
	"last_used_at" timestamp,
	"last_used_ip" text,
	"request_count" integer DEFAULT 0,
	"expires_at" timestamp,
	"status" text DEFAULT 'ACTIVE',
	"revoked_at" timestamp,
	"revoked_reason" text,
	"revoked_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "api_keys_hash_unique" UNIQUE("hash")
);
--> statement-breakpoint
CREATE TABLE "api_logs" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text,
	"api_key_id" text,
	"method" text NOT NULL,
	"path" text NOT NULL,
	"query" jsonb,
	"status_code" integer NOT NULL,
	"ip" text,
	"user_agent" text,
	"duration" integer,
	"error_code" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "api_rate_limits" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"window_key" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_revoked_by_users_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "api_logs" ADD CONSTRAINT "api_logs_api_key_id_api_keys_id_fk" FOREIGN KEY ("api_key_id") REFERENCES "public"."api_keys"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "api_keys_user_idx" ON "api_keys" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_keys_hash_idx" ON "api_keys" USING btree ("hash");--> statement-breakpoint
CREATE INDEX "api_keys_status_idx" ON "api_keys" USING btree ("status");--> statement-breakpoint
CREATE INDEX "api_logs_user_idx" ON "api_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "api_logs_api_key_idx" ON "api_logs" USING btree ("api_key_id");--> statement-breakpoint
CREATE INDEX "api_logs_path_idx" ON "api_logs" USING btree ("path");--> statement-breakpoint
CREATE INDEX "api_logs_created_at_idx" ON "api_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "rate_limits_identifier_idx" ON "api_rate_limits" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "rate_limits_expires_idx" ON "api_rate_limits" USING btree ("expires_at");