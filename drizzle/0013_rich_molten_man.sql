CREATE TABLE "signals" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" text NOT NULL,
	"target_type" text NOT NULL,
	"target_id" text,
	"category_id" text,
	"is_deleted" boolean DEFAULT false,
	"title" text,
	"description" text NOT NULL,
	"attachments" text[] DEFAULT '{}',
	"severity" text DEFAULT 'MEDIUM',
	"status" text DEFAULT 'OPEN',
	"assigned_to" text,
	"resolved_by" text,
	"resolution" text,
	"resolved_at" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "bracket_nodes" ALTER COLUMN "metadata" SET DEFAULT '{"isBye":false,"requiresMatch":true,"participants":[],"generateMatches":true,"matchesCount":1,"format":"BEST_OF_1"}'::jsonb;--> statement-breakpoint
ALTER TABLE "bracket_nodes" ADD COLUMN "is_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "signals" ADD CONSTRAINT "signals_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;