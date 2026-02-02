ALTER TYPE "public"."entity_type" ADD VALUE 'GAME';--> statement-breakpoint
ALTER TYPE "public"."entity_type" ADD VALUE 'GAME_ITEM';--> statement-breakpoint
ALTER TYPE "public"."entity_type" ADD VALUE 'GAMECLIP';--> statement-breakpoint
CREATE TABLE "game_clips" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_id" text NOT NULL,
	"shop_id" text,
	"game_id" text,
	"caption" text,
	"video_url" text NOT NULL,
	"thumbnail_url" text,
	"duration" integer,
	"view_count" integer DEFAULT 0,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "receipts" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"receipt_number" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'GTC',
	"fees" numeric(15, 2) DEFAULT '0',
	"net_amount" numeric(15, 2) NOT NULL,
	"status" "transaction_status" DEFAULT 'COMPLETED',
	"is_deleted" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"file_url" text,
	"file_name" text,
	"file_size" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "receipts_receipt_number_unique" UNIQUE("receipt_number")
);
--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "game_id" text;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "game_item_id" text;--> statement-breakpoint
ALTER TABLE "interactions" ADD COLUMN "game_clip_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "game_clip_id" text;--> statement-breakpoint
ALTER TABLE "game_clips" ADD CONSTRAINT "game_clips_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_clips" ADD CONSTRAINT "game_clips_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_clips" ADD CONSTRAINT "game_clips_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_transaction_id_wallet_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."wallet_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "game_clips_author_idx" ON "game_clips" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "game_clips_shop_idx" ON "game_clips" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "game_clips_game_idx" ON "game_clips" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "game_clips_expires_idx" ON "game_clips" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "receipts_user_idx" ON "receipts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "receipts_transaction_idx" ON "receipts" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "receipts_receipt_number_idx" ON "receipts" USING btree ("receipt_number");--> statement-breakpoint
CREATE INDEX "receipts_created_at_idx" ON "receipts" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_game_item_id_game_items_id_fk" FOREIGN KEY ("game_item_id") REFERENCES "public"."game_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_game_clip_id_game_clips_id_fk" FOREIGN KEY ("game_clip_id") REFERENCES "public"."game_clips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_game_clip_id_game_clips_id_fk" FOREIGN KEY ("game_clip_id") REFERENCES "public"."game_clips"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "interactions_game_clip_idx" ON "interactions" USING btree ("game_clip_id");