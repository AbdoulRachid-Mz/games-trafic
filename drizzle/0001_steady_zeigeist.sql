CREATE TYPE "public"."media_privacy" AS ENUM('PUBLIC', 'PRIVATE', 'FRIENDS');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('ACTIVE', 'PROCESSING', 'DELETED');--> statement-breakpoint
CREATE TYPE "public"."media_type" AS ENUM('image', 'video', 'document', 'audio', 'other');--> statement-breakpoint
ALTER TYPE "public"."trace_type" ADD VALUE 'EXPLANATION_COMPLETED' BEFORE 'OTHER';--> statement-breakpoint
ALTER TYPE "public"."trace_type" ADD VALUE 'EXPLANATION_SKIPPED' BEFORE 'OTHER';--> statement-breakpoint
ALTER TYPE "public"."trace_type" ADD VALUE 'UPDATE_SETTINGS' BEFORE 'OTHER';--> statement-breakpoint
ALTER TYPE "public"."trace_type" ADD VALUE 'ACTION';--> statement-breakpoint
ALTER TYPE "public"."trace_type" ADD VALUE 'REFRESH_DATA';--> statement-breakpoint
ALTER TYPE "public"."trace_type" ADD VALUE 'MARK_ANNOUNCEMENT_READ';--> statement-breakpoint
ALTER TYPE "public"."trace_type" ADD VALUE 'MARK_ALL_ANNOUNCEMENTS_READ';--> statement-breakpoint
ALTER TYPE "public"."trace_type" ADD VALUE 'MAINTENANCE_MODE_DISABLED';--> statement-breakpoint
ALTER TYPE "public"."trace_type" ADD VALUE 'MAINTENANCE_MODE_ENABLED';--> statement-breakpoint
ALTER TYPE "public"."trace_type" ADD VALUE 'UPDATE_EXCHANGE_RATES';--> statement-breakpoint
CREATE TABLE "medias" (
	"id" text PRIMARY KEY DEFAULT '28263a8f-7b79-4bc5-a584-78243172794c' NOT NULL,
	"owner_id" text NOT NULL,
	"file_name" text NOT NULL,
	"original_name" text NOT NULL,
	"original_size" text,
	"mime_type" text NOT NULL,
	"size" integer NOT NULL,
	"url" text NOT NULL,
	"thumbnail_url" text,
	"type" "media_type" NOT NULL,
	"status" "media_status" DEFAULT 'ACTIVE',
	"privacy" "media_privacy" DEFAULT 'PUBLIC',
	"entity_type" "entity_type",
	"entity_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "announcement_reads" ALTER COLUMN "id" SET DEFAULT 'df87b2b7-2788-489f-a980-f0c0842f423f';--> statement-breakpoint
ALTER TABLE "announcements" ALTER COLUMN "id" SET DEFAULT 'f6011539-4084-47c9-8510-83796fb78fec';--> statement-breakpoint
ALTER TABLE "app_settings" ALTER COLUMN "id" SET DEFAULT 'aec81a12-2124-4a22-87eb-4e1304887dda';--> statement-breakpoint
ALTER TABLE "blogs" ALTER COLUMN "id" SET DEFAULT 'f7e0330d-bb03-4843-ad57-8688b1295eaf';--> statement-breakpoint
ALTER TABLE "categories" ALTER COLUMN "id" SET DEFAULT '4ad4ed5c-df37-4f0f-b99b-0c9e023be7cb';--> statement-breakpoint
ALTER TABLE "claims" ALTER COLUMN "id" SET DEFAULT '028e0f8e-15d2-4b22-8ddb-43113217d9be';--> statement-breakpoint
ALTER TABLE "entity_categories" ALTER COLUMN "id" SET DEFAULT '43e09339-8deb-4c34-9499-cc47e53adb2f';--> statement-breakpoint
ALTER TABLE "game_item_requests" ALTER COLUMN "id" SET DEFAULT 'a2c46a85-06fd-46ee-b564-6beda436fb61';--> statement-breakpoint
ALTER TABLE "game_items" ALTER COLUMN "id" SET DEFAULT 'a5f52e34-6b4b-448e-b68d-b16bf675e2d3';--> statement-breakpoint
ALTER TABLE "games" ALTER COLUMN "id" SET DEFAULT '73f8bd6c-9835-4d46-b8ae-f6cc774b33c1';--> statement-breakpoint
ALTER TABLE "group_members" ALTER COLUMN "id" SET DEFAULT 'ab55c2b7-47b4-482f-ac02-6f87fca9de7c';--> statement-breakpoint
ALTER TABLE "groups" ALTER COLUMN "id" SET DEFAULT '2fd3b264-4809-49ad-a7ac-70dc114fda64';--> statement-breakpoint
ALTER TABLE "guide_steps" ALTER COLUMN "id" SET DEFAULT '31240440-93f7-4723-ae93-7b8bc28399a6';--> statement-breakpoint
ALTER TABLE "guides" ALTER COLUMN "id" SET DEFAULT '202f1d2c-28aa-4460-8b5f-f2580597f5ed';--> statement-breakpoint
ALTER TABLE "interactions" ALTER COLUMN "id" SET DEFAULT 'f2755ac6-034d-41a7-abb0-9832679fdcef';--> statement-breakpoint
ALTER TABLE "messages" ALTER COLUMN "id" SET DEFAULT '29796624-566e-4893-afec-4da239b8e1b0';--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "id" SET DEFAULT '1187788d-3bf5-4f3d-b8b1-1526a1542c91';--> statement-breakpoint
ALTER TABLE "orders" ALTER COLUMN "id" SET DEFAULT 'd5f5ca48-c50f-4ad6-aa04-3fcba095f70a';--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "id" SET DEFAULT 'fab7905c-f576-4f1f-bf68-e17366982155';--> statement-breakpoint
ALTER TABLE "products" ALTER COLUMN "id" SET DEFAULT 'e695563c-b087-4fcc-8ae0-ee0074e4e0a4';--> statement-breakpoint
ALTER TABLE "push_subscriptions" ALTER COLUMN "id" SET DEFAULT '1164b137-5eeb-4dce-8053-7250e55539a6';--> statement-breakpoint
ALTER TABLE "search_history" ALTER COLUMN "id" SET DEFAULT '9294783d-2f71-4542-9ea2-949d7118b030';--> statement-breakpoint
ALTER TABLE "services" ALTER COLUMN "id" SET DEFAULT '613f36f9-825b-4a38-bf87-5d7daaa7142f';--> statement-breakpoint
ALTER TABLE "shops" ALTER COLUMN "id" SET DEFAULT 'a0f6bad6-0229-4a6d-b18a-099d1f3e48f6';--> statement-breakpoint
ALTER TABLE "team_members" ALTER COLUMN "id" SET DEFAULT 'aefd5c7e-7e79-448b-8d26-7e246ac23d08';--> statement-breakpoint
ALTER TABLE "teams" ALTER COLUMN "id" SET DEFAULT 'fdcd399c-31a5-49ca-bd5f-ea830fcb7d58';--> statement-breakpoint
ALTER TABLE "theme_purchases" ALTER COLUMN "id" SET DEFAULT '657137d3-896b-4e63-a428-882a48696e20';--> statement-breakpoint
ALTER TABLE "themes" ALTER COLUMN "id" SET DEFAULT '3fcafb78-094c-4ec3-83d7-87b76b9fb0db';--> statement-breakpoint
ALTER TABLE "user_traces" ALTER COLUMN "id" SET DEFAULT 'd2784993-97e0-45f2-a723-75bb48d1d82d';--> statement-breakpoint
ALTER TABLE "user_wallets" ALTER COLUMN "id" SET DEFAULT 'e0bb496c-0994-46b7-bab1-d07241ecc52a';--> statement-breakpoint
ALTER TABLE "viewers" ALTER COLUMN "id" SET DEFAULT 'ca97c8a9-1eac-4ed6-9b27-fe5a84dacf1c';--> statement-breakpoint
ALTER TABLE "vip_subscriptions" ALTER COLUMN "id" SET DEFAULT '3f389455-a712-4b05-9570-5847cbd96c6c';--> statement-breakpoint
ALTER TABLE "wallet_transactions" ALTER COLUMN "id" SET DEFAULT '1c258f9c-070e-4443-b24c-621abefa5e93';--> statement-breakpoint
ALTER TABLE "medias" ADD CONSTRAINT "medias_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "medias_owner_idx" ON "medias" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "medias_type_idx" ON "medias" USING btree ("type");--> statement-breakpoint
CREATE INDEX "medias_status_idx" ON "medias" USING btree ("status");--> statement-breakpoint
CREATE INDEX "medias_privacy_idx" ON "medias" USING btree ("privacy");--> statement-breakpoint
CREATE INDEX "medias_entity_idx" ON "medias" USING btree ("entity_type","entity_id");