ALTER TYPE "public"."interaction_type" ADD VALUE 'SHARE';--> statement-breakpoint
ALTER TABLE "game_clips" ALTER COLUMN "video_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ADD COLUMN "updated_at" timestamp DEFAULT now();