ALTER TYPE "public"."entity_type" ADD VALUE 'EDITION';--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "edition_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "tournament_id" text;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_edition_id_tournament_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."tournament_editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;