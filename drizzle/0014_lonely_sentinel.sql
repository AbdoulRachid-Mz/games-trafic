ALTER TABLE "signals" ALTER COLUMN "reporter_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tournament_editions" ALTER COLUMN "edition_config" SET DEFAULT '{"checkinRequired":false,"autoStart":true,"seedMethod":"RANDOM","competitionType":"LDC","competitionMode":"AUTO","tiebreakerRules":{}}'::jsonb;--> statement-breakpoint
ALTER TABLE "tournament_editions" ADD COLUMN "winner_id" text;--> statement-breakpoint
ALTER TABLE "tournament_editions" ADD COLUMN "winner_metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "tournament_editions" ADD CONSTRAINT "tournament_editions_winner_id_tournament_members_id_fk" FOREIGN KEY ("winner_id") REFERENCES "public"."tournament_members"("id") ON DELETE no action ON UPDATE no action;