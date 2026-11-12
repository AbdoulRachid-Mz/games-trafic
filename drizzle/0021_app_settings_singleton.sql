-- Ensure the app_settings singleton row exists.
-- Without it, fee calculation failed with FEE_POLICY_UNAVAILABLE and every
-- transaction creation returned HTTP 500.
INSERT INTO "app_settings" ("id")
SELECT 'global'
WHERE NOT EXISTS (SELECT 1 FROM "app_settings");--> statement-breakpoint
