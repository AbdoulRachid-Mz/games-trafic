CREATE TYPE "public"."partner_type" AS ENUM('SPONSOR', 'MEDIA', 'TECHNOLOGY', 'FINANCIAL', 'ESPORTS', 'GAMING', 'STREAMING', 'EQUIPMENT', 'FOOD_BEVERAGE', 'FASHION', 'TELECOM', 'SOFTWARE', 'HARDWARE', 'PUBLISHER', 'DISTRIBUTOR', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."partnership_status" AS ENUM('PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."partnership_tier" AS ENUM('BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'EXCLUSIVE');--> statement-breakpoint
ALTER TYPE "public"."entity_type" ADD VALUE 'PARTNER';--> statement-breakpoint
CREATE TABLE "partners" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"legal_name" text,
	"slug" text,
	"description" text,
	"short_description" text,
	"type" "partner_type" NOT NULL,
	"categories" text[] DEFAULT '{}',
	"tags" text[] DEFAULT '{}',
	"logo" text,
	"cover_image" text,
	"brand_colors" text[] DEFAULT '{}',
	"website" text,
	"contact_email" text,
	"contact_phone" text,
	"contact_person" text,
	"contact_title" text,
	"country" text,
	"city" text,
	"address" jsonb,
	"social_media" jsonb DEFAULT '[]'::jsonb,
	"status" "partnership_status" DEFAULT 'PENDING',
	"is_active" boolean DEFAULT true,
	"is_visible" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"verified" boolean DEFAULT false,
	"total_partnerships" integer DEFAULT 0,
	"total_investment" numeric(15, 2) DEFAULT '0',
	"view_count" integer DEFAULT 0,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"internal_notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "partners_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "partnerships" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"partner_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" text NOT NULL,
	"tier" "partnership_tier" DEFAULT 'BRONZE',
	"priority" integer DEFAULT 0,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"renewal_date" timestamp,
	"total_value" numeric(15, 2) DEFAULT '0',
	"currency" text DEFAULT 'GTC',
	"payment_terms" text,
	"payment_schedule" jsonb DEFAULT '[]'::jsonb,
	"partner_deliverables" jsonb DEFAULT '[]'::jsonb,
	"our_deliverables" jsonb DEFAULT '[]'::jsonb,
	"kpis" jsonb DEFAULT '{}'::jsonb,
	"milestones" jsonb DEFAULT '[]'::jsonb,
	"assets_provided" jsonb DEFAULT '[]'::jsonb,
	"resource_allocation" jsonb DEFAULT '{}'::jsonb,
	"is_exclusive" boolean DEFAULT false,
	"exclusivity_scope" text,
	"exclusivity_duration" text,
	"status" "partnership_status" DEFAULT 'PENDING',
	"progress" integer DEFAULT 0,
	"performance_score" numeric(5, 2) DEFAULT '0',
	"roi" numeric(5, 2) DEFAULT '0',
	"metrics" jsonb DEFAULT '{}'::jsonb,
	"related_entity_type" "entity_type",
	"related_entity_id" text,
	"contract_url" text,
	"contract_status" text DEFAULT 'DRAFT',
	"signed_at" timestamp,
	"partner_contact" text,
	"partner_contact_email" text,
	"notes" text,
	"communication_log" jsonb DEFAULT '[]'::jsonb,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"auto_renew" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "game_clips" ADD COLUMN "images" text[] DEFAULT '{}';--> statement-breakpoint
ALTER TABLE "game_clips" ADD COLUMN "is_public" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "partnerships" ADD CONSTRAINT "partnerships_partner_id_partners_id_fk" FOREIGN KEY ("partner_id") REFERENCES "public"."partners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "partners_type_idx" ON "partners" USING btree ("type");--> statement-breakpoint
CREATE INDEX "partners_status_idx" ON "partners" USING btree ("status");--> statement-breakpoint
CREATE INDEX "partners_verified_idx" ON "partners" USING btree ("verified");--> statement-breakpoint
CREATE INDEX "partners_slug_idx" ON "partners" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "partners_name_idx" ON "partners" USING btree ("name");--> statement-breakpoint
CREATE INDEX "partnerships_partner_idx" ON "partnerships" USING btree ("partner_id");--> statement-breakpoint
CREATE INDEX "partnerships_status_idx" ON "partnerships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "partnerships_tier_idx" ON "partnerships" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "partnerships_dates_idx" ON "partnerships" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "partnerships_related_entity_idx" ON "partnerships" USING btree ("related_entity_type","related_entity_id");--> statement-breakpoint
CREATE INDEX "partnerships_type_idx" ON "partnerships" USING btree ("type");