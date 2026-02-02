CREATE TYPE "public"."account_type" AS ENUM('SELLER', 'BUYER', 'TRADER', 'TOURNAMENT_ORGANIZER', 'VIP');--> statement-breakpoint
CREATE TYPE "public"."announcement_type" AS ENUM('ANNOUNCEMENT', 'NEWS', 'UPDATE');--> statement-breakpoint
CREATE TYPE "public"."entity_type" AS ENUM('PRODUCT', 'POST', 'SHOP', 'TOURNAMENT', 'USER', 'BLOG', 'MESSAGE', 'TEAM', 'THEME', 'NEWS', 'GROUP', 'ANNOUNCEMENT', 'SERVICE', 'GUIDE', 'COMMENT', 'MATCH');--> statement-breakpoint
CREATE TYPE "public"."game_item_status" AS ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."game_item_type" AS ENUM('COIN', 'ITEM', 'SKIN', 'EQUIPMENT', 'CURRENCY');--> statement-breakpoint
CREATE TYPE "public"."group_role" AS ENUM('OWNER', 'ADMIN', 'MEMBER');--> statement-breakpoint
CREATE TYPE "public"."interaction_type" AS ENUM('LIKE', 'FOLLOW', 'BOOKMARK', 'VIEW');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."participation_status" AS ENUM('REGISTERED', 'PARTICIPATED', 'DISQUALIFIED', 'WINNER', 'ELIMINATED');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('PC', 'PLAYSTATION', 'XBOX', 'NINTENDO_SWITCH', 'MOBILE', 'VR', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('NON_VENDU', 'RESERVE', 'EN_ECHANGE', 'LIVRE', 'VENDU', 'ANNULER');--> statement-breakpoint
CREATE TYPE "public"."team_role" AS ENUM('PLAYER', 'COACH', 'MANAGER', 'SUBSTITUTE', 'CAPTAIN', 'VICE_CAPTAIN');--> statement-breakpoint
CREATE TYPE "public"."tournament_format" AS ENUM('ELIMINATION', 'GROUP_STAGE', 'ROUND_ROBIN', 'SWISS', 'KNOCKOUT', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."tournament_status" AS ENUM('UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."trace_type" AS ENUM('SIGNIN', 'SIGNOUT', 'REGISTER', 'NAVIGATION', 'PURCHASE', 'TRANSFER', 'DEPOSIT', 'VIEW', 'LIKE', 'FOLLOW', 'BOOKMARK', 'CLAIM', 'ERROR', 'EXPLANATION_SHOWN', 'OTHER');--> statement-breakpoint
CREATE TYPE "public"."transaction_status" AS ENUM('PENDING', 'COMPLETED', 'PROCESSING', 'FAILED', 'REFUNDED');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('PURCHASE', 'VIP_SUBSCRIPTION', 'GAME_ITEM_PURCHASE', 'THEME_PURCHASE', 'DEPOSIT', 'WITHDRAWAL', 'REFUND', 'TRANSFER', 'ORDER_PURCHASE', 'TOURNAMENT_PARTICIPATION');--> statement-breakpoint
CREATE TYPE "public"."user_level" AS ENUM('A', 'B', 'C');--> statement-breakpoint
CREATE TYPE "public"."vip_plan_type" AS ENUM('MONTHLY', 'YEARLY', 'LIFETIME');--> statement-breakpoint
CREATE TYPE "public"."vip_status" AS ENUM('ACTIVE', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_reads" (
	"id" text PRIMARY KEY DEFAULT 'fc39f0c1-d5be-4322-bb1c-4e547f5b0b0e' NOT NULL,
	"announcement_id" text NOT NULL,
	"user_id" text NOT NULL,
	"read_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" text PRIMARY KEY DEFAULT '8208b486-0f09-4437-857c-1d615623af66' NOT NULL,
	"author_id" text NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"type" "announcement_type" DEFAULT 'ANNOUNCEMENT',
	"images" text[] DEFAULT '{}',
	"video" text,
	"is_active" boolean DEFAULT true,
	"is_pinned" boolean DEFAULT false,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" text PRIMARY KEY DEFAULT 'd018f82b-b4fe-4e9d-bff8-41b7a84f28f0' NOT NULL,
	"max_products_regular" integer DEFAULT 5,
	"max_products_vip" integer DEFAULT 20,
	"max_shops_regular" integer DEFAULT 1,
	"max_shops_vip" integer DEFAULT 5,
	"max_tournaments_regular" integer DEFAULT 1,
	"max_tournaments_vip" integer DEFAULT 5,
	"story_duration_hours" integer DEFAULT 48,
	"max_stories_per_day_regular" integer DEFAULT 3,
	"max_stories_per_day_vip" integer DEFAULT 10,
	"transaction_fee_percentage" numeric(5, 4) DEFAULT '0.001',
	"purchase_fee_percentage" numeric(5, 4) DEFAULT '0.01',
	"deposit_fee_percentage" numeric(5, 4) DEFAULT '0.00',
	"withdrawal_fee_percentage" numeric(5, 4) DEFAULT '0.02',
	"transfer_fee_percentage" numeric(5, 4) DEFAULT '0.005',
	"tournament_participation_fee_percentage" numeric(5, 4) DEFAULT '0.01',
	"gtc_to_fcfa_rate" numeric(10, 2) DEFAULT '500.0',
	"gtc_to_eur_rate" numeric(10, 4),
	"gtc_to_usd_rate" numeric(10, 4),
	"last_exchange_rate_update" timestamp DEFAULT now(),
	"vip_monthly_price" numeric(8, 2) DEFAULT '250',
	"vip_yearly_price" numeric(8, 2) DEFAULT '2500',
	"free_themes_limit_regular" integer DEFAULT 2,
	"free_themes_limit_vip" integer DEFAULT 10,
	"max_theme_creations_regular" integer DEFAULT 0,
	"max_theme_creations_vip" integer DEFAULT 5,
	"can_vip_create_themes" boolean DEFAULT true,
	"can_vip_sell_themes" boolean DEFAULT true,
	"theme_creation_fee" numeric(8, 2) DEFAULT '0.0',
	"theme_sale_commission_percentage" numeric(5, 4) DEFAULT '0.15',
	"max_participants_per_tournament" integer DEFAULT 32,
	"max_co_organizers_ratio" real DEFAULT 0.33,
	"game_items_enabled" boolean DEFAULT true,
	"game_item_commission_percentage" numeric(5, 4) DEFAULT '0.05',
	"min_game_item_request" numeric(10, 2) DEFAULT '1.0',
	"max_game_item_request" numeric(10, 2) DEFAULT '1000.0',
	"user_permissions" jsonb DEFAULT '{}'::jsonb,
	"admin_permissions" jsonb DEFAULT '{}'::jsonb,
	"regular_user_permissions" jsonb DEFAULT '[]'::jsonb,
	"vip_user_permissions" jsonb DEFAULT '[]'::jsonb,
	"public_routes" jsonb DEFAULT '[]'::jsonb,
	"protected_routes" jsonb DEFAULT '[]'::jsonb,
	"admin_routes" jsonb DEFAULT '{}'::jsonb,
	"admin_tasks" jsonb DEFAULT '{}'::jsonb,
	"maintenance_mode" boolean DEFAULT false,
	"default_user_balance" integer DEFAULT 250,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "blogs" (
	"id" text PRIMARY KEY DEFAULT '88289034-f31b-4ca9-b831-42461cd8cda2' NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"images" text[] DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"author_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "bracket_nodes" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase_id" text NOT NULL,
	"group_id" text,
	"node_type" text DEFAULT 'MATCH',
	"node_code" text,
	"parent_node_id" text,
	"child_position" text,
	"depth" integer DEFAULT 0,
	"order" integer,
	"bracket_type" text,
	"round" integer,
	"match_number" integer,
	"metadata" jsonb DEFAULT '{"isBye":false,"requiresMatch":true}'::jsonb,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY DEFAULT 'df705ec5-3f72-4880-9605-8186829ec693' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"icon" text,
	"color" text,
	"image" text,
	"parent_id" text,
	"level" integer DEFAULT 0,
	"path" text,
	"full_path" text,
	"applicable_entities" "entity_type"[] DEFAULT '{"PRODUCT"}' NOT NULL,
	"filters" jsonb DEFAULT '{}'::jsonb,
	"sort_order" integer DEFAULT 0,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"item_count" integer DEFAULT 0,
	"is_featured" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "claims" (
	"id" text PRIMARY KEY DEFAULT '0bd51b70-2410-4c2e-9812-e8664c4bcd3c' NOT NULL,
	"user_id" text NOT NULL,
	"transaction_id" text,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"evidence" text,
	"image" text,
	"status" text DEFAULT 'PENDING',
	"resolution" text,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "edition_registrations" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"edition_id" text NOT NULL,
	"member_id" text NOT NULL,
	"registration_type" text DEFAULT 'REGULAR',
	"status" "participation_status" DEFAULT 'REGISTERED',
	"game_level" text,
	"game_rank" text,
	"game_region" text,
	"preferred_character" text,
	"character_pool" text[] DEFAULT '{}',
	"registration_fee" numeric(10, 2) DEFAULT '0',
	"fee_paid" boolean DEFAULT false,
	"fee_waived" boolean DEFAULT false,
	"payment_transaction_id" text,
	"qualified_from_previous" boolean DEFAULT false,
	"previous_edition_id" text,
	"qualification_method" text,
	"checked_in" boolean DEFAULT false,
	"checked_in_at" timestamp,
	"auto_checked_in" boolean DEFAULT false,
	"metadata" jsonb DEFAULT '{"registrationSource":"WEB","device":"DESKTOP"}'::jsonb,
	"registered_at" timestamp DEFAULT now(),
	"confirmed_at" timestamp,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "edition_results" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"edition_id" text NOT NULL,
	"registration_id" text NOT NULL,
	"position" integer NOT NULL,
	"tier" text,
	"prize_amount" numeric(15, 2),
	"prize_currency" text DEFAULT 'GTC',
	"prize_description" text,
	"matches_played" integer DEFAULT 0,
	"matches_won" integer DEFAULT 0,
	"matches_lost" integer DEFAULT 0,
	"matches_drawn" integer DEFAULT 0,
	"total_score" integer DEFAULT 0,
	"average_score" numeric(5, 2),
	"awards" text[] DEFAULT '{}',
	"special_mentions" text[] DEFAULT '{}',
	"prize_paid" boolean DEFAULT false,
	"payment_transaction_id" text,
	"paid_at" timestamp,
	"statistics" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "entity_categories" (
	"id" text PRIMARY KEY DEFAULT 'c3db37f3-10fc-4e0b-a723-33a0042dc8ce' NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"category_id" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_item_requests" (
	"id" text PRIMARY KEY DEFAULT 'ed2a0cd0-09e5-47d9-8f94-2ff1113405b2' NOT NULL,
	"user_id" text NOT NULL,
	"game_item_id" text NOT NULL,
	"quantity" numeric(10, 2),
	"total_gtc" numeric(10, 2),
	"commission" numeric(10, 2) DEFAULT '0',
	"game_account" text NOT NULL,
	"encrypted_password" text,
	"game_id" text,
	"additional_info" jsonb,
	"status" "game_item_status" DEFAULT 'PENDING',
	"admin_notes" text,
	"user_notes" text,
	"processed_by_user_id" text,
	"estimated_time" integer,
	"tracking_number" text,
	"transaction_id" text,
	"processed_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "game_items" (
	"id" text PRIMARY KEY DEFAULT 'ca621a14-d154-433a-8ed5-4b32049e60b6' NOT NULL,
	"game_id" text NOT NULL,
	"name" text NOT NULL,
	"type" "game_item_type" NOT NULL,
	"description" text,
	"icon" text,
	"price_gtc" numeric(10, 2) NOT NULL,
	"exchange_rate" numeric(10, 4),
	"min_order" numeric(10, 2) DEFAULT '1.0',
	"max_order" numeric(10, 2) DEFAULT '1000.0',
	"availability" text DEFAULT 'AVAILABLE',
	"processing_time" text DEFAULT '24h',
	"is_active" boolean DEFAULT true,
	"featured" boolean DEFAULT false,
	"popularity" integer DEFAULT 0,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" text PRIMARY KEY DEFAULT '1b0ea893-29b6-4f4f-a89c-670eafda6967' NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"profile_image" text,
	"cover_image" text,
	"publisher" text,
	"release_date" timestamp,
	"genre" text,
	"platforms" "platform"[] DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"featured" boolean DEFAULT false,
	"popularity" integer DEFAULT 0,
	"website" text,
	"min_age" integer,
	"tags" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "games_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "group_members" (
	"id" text PRIMARY KEY DEFAULT 'd9020a9b-d841-4441-911d-4ce3176d901c' NOT NULL,
	"group_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "group_role" DEFAULT 'MEMBER',
	"joined_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" text PRIMARY KEY DEFAULT '25aa4ca9-f07e-4e2a-8b46-206d608a90ac' NOT NULL,
	"creator_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image" text,
	"is_private" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "guide_steps" (
	"id" text PRIMARY KEY DEFAULT '5db580c6-ff9e-4658-b521-f64c54d767b9' NOT NULL,
	"order" integer NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"images" text[] DEFAULT '{}',
	"guide_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "guides" (
	"id" text PRIMARY KEY DEFAULT '24cf1ecd-1a4c-404e-9928-87207dac136c' NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"images" text[] DEFAULT '{}',
	"view_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"admin_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "interactions" (
	"id" text PRIMARY KEY DEFAULT 'ac55dee7-fb06-4d41-b21d-eca21a126453' NOT NULL,
	"user_id" text NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"type" "interaction_type" NOT NULL,
	"post_id" text,
	"product_id" text,
	"message_id" text,
	"tournament_id" text,
	"shop_id" text,
	"theme_id" text,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "matches" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"edition_id" text NOT NULL,
	"phase_id" text NOT NULL,
	"group_id" text,
	"bracket_node_id" text,
	"match_code" text,
	"match_type" text DEFAULT 'REGULAR',
	"round" integer DEFAULT 1 NOT NULL,
	"match_number" integer DEFAULT 1 NOT NULL,
	"scheduled_time" timestamp,
	"estimated_duration" integer,
	"actual_start_time" timestamp,
	"actual_end_time" timestamp,
	"duration" integer,
	"participant1_registration_id" text,
	"participant2_registration_id" text,
	"score1" integer,
	"score2" integer,
	"winner_registration_id" text,
	"loser_registration_id" text,
	"game_data" jsonb DEFAULT '{}'::jsonb,
	"replay_id" text,
	"stream_link" text,
	"screenshot" text,
	"proof_links" text[] DEFAULT '{}',
	"notes" text,
	"submitted_by_user_id" text,
	"confirmed_by_participant1" boolean DEFAULT false,
	"confirmed_by_participant2" boolean DEFAULT false,
	"confirmed_by_admin" boolean DEFAULT false,
	"confirmed_at" timestamp,
	"disputed" boolean DEFAULT false,
	"dispute_reason" text,
	"resolved_by" text,
	"resolution" text,
	"status" "match_status" DEFAULT 'PENDING',
	"metadata" jsonb DEFAULT '{"format":"BEST_OF_1","rules":"STANDARD"}'::jsonb,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY DEFAULT 'e9a70a64-5f2c-433d-af71-7f9cef7c4b37' NOT NULL,
	"sender_id" text NOT NULL,
	"recipient_id" text,
	"group_id" text,
	"shop_id" text,
	"post_id" text,
	"product_id" text,
	"user_id" text,
	"content" text,
	"images" text[] DEFAULT '{}',
	"audio_url" text,
	"parent_message_id" text,
	"entity_type" "entity_type",
	"entity_id" text,
	"read" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"is_open_to_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" text PRIMARY KEY DEFAULT 'e9756df8-8896-40e7-a377-0c41600b0666' NOT NULL,
	"user_id" text,
	"shop_id" text,
	"tournament_id" text,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"type" text NOT NULL,
	"link_url" text,
	"read" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY DEFAULT '5bc64104-0d25-4eb8-9f79-daed5982f532' NOT NULL,
	"product_id" text NOT NULL,
	"buyer_id" text NOT NULL,
	"shop_id" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"message" text,
	"status" "order_status" DEFAULT 'PENDING',
	"order_type" text DEFAULT 'PURCHASE',
	"ordered_product_id" text,
	"expires_at" timestamp,
	"rejection_reason" text,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "passkey" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"public_key" text NOT NULL,
	"user_id" text NOT NULL,
	"credential_id" text NOT NULL,
	"counter" integer NOT NULL,
	"device_type" text NOT NULL,
	"backed_up" boolean NOT NULL,
	"transports" text,
	"created_at" timestamp,
	"aaguid" text
);
--> statement-breakpoint
CREATE TABLE "phase_group_participants" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" text NOT NULL,
	"registration_id" text NOT NULL,
	"matches_played" integer DEFAULT 0,
	"matches_won" integer DEFAULT 0,
	"matches_drawn" integer DEFAULT 0,
	"matches_lost" integer DEFAULT 0,
	"points" integer DEFAULT 0,
	"score_for" integer DEFAULT 0,
	"score_against" integer DEFAULT 0,
	"score_difference" integer GENERATED ALWAYS AS (score_for - score_against) STORED,
	"position" integer,
	"is_seeded" boolean DEFAULT false,
	"seed_order" integer,
	"qualified" boolean DEFAULT false,
	"qualification_position" integer,
	"stats" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "phase_groups" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phase_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"order" integer NOT NULL,
	"group_type" text DEFAULT 'ROUND_ROBIN',
	"config" jsonb DEFAULT '{"matchesPerParticipant":1,"advanceCount":2,"seeding":"RANDOM","pointsPerWin":3,"pointsPerDraw":1,"pointsPerLoss":0}'::jsonb,
	"is_completed" boolean DEFAULT false,
	"is_locked" boolean DEFAULT false,
	"participant_count" integer DEFAULT 0,
	"match_count" integer DEFAULT 0,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" text PRIMARY KEY DEFAULT '7dec98cd-96f6-4a21-aead-119110b44c5c' NOT NULL,
	"author_id" text NOT NULL,
	"content" text,
	"images" text[] DEFAULT '{}',
	"video" text,
	"is_story" boolean DEFAULT false,
	"expires_at" timestamp,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY DEFAULT '701cf1e3-1cd2-4bb5-a66a-7287b522d4bb' NOT NULL,
	"shop_id" text NOT NULL,
	"user_id" text,
	"category_id" text,
	"name" text NOT NULL,
	"description" text,
	"price" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'GTC',
	"images" text[] DEFAULT '{}',
	"video" text,
	"featured_image" text,
	"game" text,
	"platform" "platform" DEFAULT 'MOBILE',
	"categories" text[] DEFAULT '{}',
	"status" "product_status" DEFAULT 'NON_VENDU',
	"account_login" text,
	"encrypted_password" text,
	"account_level" text,
	"account_rank" text,
	"view_count" integer DEFAULT 0,
	"delivered_to_user_id" text,
	"delivered_at" timestamp,
	"is_active" boolean DEFAULT true,
	"is_visible" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"is_negotiable" boolean DEFAULT false,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"id" text PRIMARY KEY DEFAULT 'c7aed10c-3a3e-49d2-8eb5-22b33fd8fae8' NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "push_subscriptions_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
CREATE TABLE "registration_payments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"registration_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"currency" text DEFAULT 'GTC',
	"paid_at" timestamp DEFAULT now(),
	"payment_method" text,
	"payment_provider" text,
	"status" text DEFAULT 'COMPLETED',
	"reference" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "search_history" (
	"id" text PRIMARY KEY DEFAULT '5f199b3c-88a0-4e51-b1cb-133abdc21359' NOT NULL,
	"user_id" text NOT NULL,
	"query" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" text PRIMARY KEY DEFAULT 'c5b555fe-572e-4149-9f3c-a79876b89107' NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"icon" text,
	"images" text[] DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"admin_id" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"impersonated_by" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "shops" (
	"id" text PRIMARY KEY DEFAULT 'd99a6403-203c-4579-bfc1-8e950d883f63' NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"profile_image" text,
	"cover_image" text,
	"phone_number" text,
	"country" text,
	"address" jsonb,
	"website" text,
	"social_media" jsonb DEFAULT '[]'::jsonb,
	"product_count" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"balance" numeric(15, 2) DEFAULT '0',
	"verified" boolean DEFAULT false,
	"featured" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_visible" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"theme_id" text,
	"custom_theme" jsonb,
	"notification_settings" jsonb DEFAULT '{"notifyOnNewOrder":true,"notifyOnNeworder":true,"channels":["IN_APP"]}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "shops_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" text PRIMARY KEY DEFAULT 'db6a5a7e-2130-421a-8de9-687846b1a5e5' NOT NULL,
	"team_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" "team_role" DEFAULT 'PLAYER',
	"position" text,
	"joined_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" text PRIMARY KEY DEFAULT 'c6fc30ff-3857-4476-8e1e-aa50616979e7' NOT NULL,
	"name" text NOT NULL,
	"logo" text,
	"colors" text[] DEFAULT '{}',
	"country" text,
	"city" text,
	"founded_year" integer,
	"website" text,
	"achievements" text[] DEFAULT '{}',
	"ranking" integer,
	"division" text,
	"registration_id" text,
	"max_squad_size" integer DEFAULT 25,
	"current_squad_size" integer DEFAULT 0,
	"home_stadium" text,
	"preferred_formation" text,
	"strategy" text,
	"is_active" boolean DEFAULT true,
	"captain_id" text,
	"vice_captain_id" text,
	"social_media" jsonb DEFAULT '[]'::jsonb,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "teams_registration_id_unique" UNIQUE("registration_id")
);
--> statement-breakpoint
CREATE TABLE "theme_purchases" (
	"id" text PRIMARY KEY DEFAULT '207b2cf2-5a09-4837-a806-2ce10d3faa17' NOT NULL,
	"user_id" text NOT NULL,
	"theme_id" text NOT NULL,
	"price" numeric(8, 2),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "themes" (
	"id" text PRIMARY KEY DEFAULT 'd94fff7b-7f08-4aaa-a281-e5a2067025a2' NOT NULL,
	"creator_id" text,
	"name" text NOT NULL,
	"description" text,
	"is_premium" boolean DEFAULT false,
	"price" numeric(8, 2) DEFAULT '0',
	"thumbnail" text,
	"preview_images" text[] DEFAULT '{}',
	"config" jsonb NOT NULL,
	"category" text,
	"tags" text[] DEFAULT '{}',
	"downloads" integer DEFAULT 0,
	"view_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"is_public" boolean DEFAULT true,
	"is_copy" boolean DEFAULT false,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "themes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "tournament_editions" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" text NOT NULL,
	"edition_number" integer NOT NULL,
	"name" text,
	"tagline" text,
	"edition_slug" text,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"registration_opens" timestamp,
	"registration_deadline" timestamp,
	"checkin_starts" timestamp,
	"checkin_ends" timestamp,
	"max_participants" integer,
	"current_participants" integer DEFAULT 0,
	"checked_in_participants" integer DEFAULT 0,
	"prize_pool" numeric(15, 2) DEFAULT '0',
	"prize_currency" text DEFAULT 'GTC',
	"prize_distribution" jsonb DEFAULT '[]'::jsonb,
	"edition_rules" text,
	"edition_requirements" text,
	"edition_config" jsonb DEFAULT '{"checkinRequired":false,"autoStart":true,"seedMethod":"RANDOM","tiebreakerRules":{}}'::jsonb,
	"status" "tournament_status" DEFAULT 'UPCOMING',
	"progress" integer DEFAULT 0,
	"location" text,
	"location_type" text DEFAULT 'ONLINE',
	"virtual_link" text,
	"stream_link" text,
	"view_count" integer DEFAULT 0,
	"match_count" integer DEFAULT 0,
	"completed_match_count" integer DEFAULT 0,
	"notifications_enabled" boolean DEFAULT true,
	"auto_advance" boolean DEFAULT true,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_members" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tournament_id" text NOT NULL,
	"user_id" text,
	"team_id" text,
	"role" text DEFAULT 'PARTICIPANT' NOT NULL,
	"permissions" text[] DEFAULT '{}',
	"is_co_organizer" boolean DEFAULT false,
	"display_name" text,
	"game_tag" text,
	"avatar" text,
	"banner" text,
	"contact_phone" text,
	"contact_email" text,
	"discord_id" text,
	"club_name" text,
	"biography" text,
	"achievements" text[] DEFAULT '{}',
	"total_editions" integer DEFAULT 0,
	"total_wins" integer DEFAULT 0,
	"total_losses" integer DEFAULT 0,
	"total_matches" integer DEFAULT 0,
	"ranking_points" integer DEFAULT 0,
	"win_rate" numeric(5, 2) DEFAULT '0',
	"best_position" integer,
	"is_verified" boolean DEFAULT false,
	"verification_level" text DEFAULT 'BASIC',
	"is_active" boolean DEFAULT true,
	"is_banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"preferences" jsonb DEFAULT '{"notifications":true,"emailUpdates":true,"publicProfile":true}'::jsonb,
	"joined_at" timestamp DEFAULT now(),
	"last_active" timestamp,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournament_phases" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"edition_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "tournament_format" DEFAULT 'ELIMINATION',
	"order" integer NOT NULL,
	"config" jsonb DEFAULT '{"qualifiedCount":null,"groupsCount":1,"matchesPerParticipant":1,"advanceFromGroup":1,"seedingMethod":"RANDOM","tiebreaker":"HEAD_TO_HEAD"}'::jsonb,
	"is_active" boolean DEFAULT false,
	"is_completed" boolean DEFAULT false,
	"is_double_elimination" boolean DEFAULT false,
	"is_hidden" boolean DEFAULT false,
	"scheduled_start" timestamp,
	"scheduled_end" timestamp,
	"actual_start" timestamp,
	"actual_end" timestamp,
	"match_duration" integer,
	"break_duration" integer,
	"total_matches" integer DEFAULT 0,
	"completed_matches" integer DEFAULT 0,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "tournaments" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organizer_id" text NOT NULL,
	"name" text NOT NULL,
	"slug" text,
	"description" text,
	"short_description" text,
	"profile_image" text,
	"cover_image" text,
	"game" text NOT NULL,
	"platform" "platform" DEFAULT 'MOBILE',
	"game_mode" text,
	"allowed_teams" boolean DEFAULT false,
	"rules" text,
	"requirements" text,
	"code_of_conduct" text,
	"max_participants_per_edition" integer DEFAULT 32,
	"min_participants" integer DEFAULT 2,
	"visibility" text DEFAULT 'PUBLIC',
	"requires_access_code" boolean DEFAULT false,
	"access_code" text,
	"invite_only" boolean DEFAULT false,
	"contact_email" text,
	"contact_phone" text,
	"discord_server" text,
	"whatsapp_group" text,
	"social_media" jsonb DEFAULT '[]'::jsonb,
	"theme_id" text,
	"custom_theme" jsonb,
	"custom_config" jsonb,
	"total_editions" integer DEFAULT 0,
	"total_participants" integer DEFAULT 0,
	"total_prize_pool" numeric(15, 2) DEFAULT '0',
	"view_count" integer DEFAULT 0,
	"follower_count" integer DEFAULT 0,
	"status" "tournament_status" DEFAULT 'UPCOMING',
	"featured" boolean DEFAULT false,
	"verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"tags" text[] DEFAULT '{}',
	"categories" text[] DEFAULT '{}',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "tournaments_name_unique" UNIQUE("name"),
	CONSTRAINT "tournaments_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_traces" (
	"id" text PRIMARY KEY DEFAULT '95b0c9bb-8bd2-46a0-86e8-5c510bbf2cea' NOT NULL,
	"user_id" text,
	"session_id" text,
	"type" "trace_type" NOT NULL,
	"entity_id" text,
	"payload" jsonb,
	"created_at" timestamp DEFAULT now(),
	"synced" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "user_wallets" (
	"id" text PRIMARY KEY DEFAULT '2291c25e-b8a1-4a3c-9eaf-d8ee87143fa2' NOT NULL,
	"user_id" text NOT NULL,
	"card_number_hash" text,
	"pin_hash" text NOT NULL,
	"balance" numeric(15, 2) DEFAULT '0',
	"is_active" boolean DEFAULT false,
	"is_locked" boolean DEFAULT false,
	"is_deleted" boolean DEFAULT false,
	"failed_attempts" integer DEFAULT 0,
	"last_failed_attempt" timestamp,
	"identity_document_type" text,
	"identity_document_url" text,
	"verification_status" text DEFAULT 'PENDING',
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_wallets_card_number_hash_unique" UNIQUE("card_number_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"auth_uid" text,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"username" text,
	"full_name" text,
	"profile_image" text,
	"cover_image" text,
	"bio" text,
	"website" text,
	"country" text,
	"country_code" text,
	"social_media" jsonb DEFAULT '["games-trafics"]'::jsonb,
	"phone_number" text,
	"address" jsonb,
	"is_public_profile" boolean DEFAULT true,
	"is_vip" boolean DEFAULT false,
	"is_admin" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"is_deleted" boolean DEFAULT false,
	"is_anonymous" boolean DEFAULT false,
	"role" text DEFAULT 'user',
	"banned" boolean DEFAULT false,
	"ban_reason" text,
	"ban_expires" timestamp,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"account_types" text[] DEFAULT '{"BUYER"}',
	"level" "user_level" DEFAULT 'C',
	"shops_created_count" integer DEFAULT 0,
	"tournaments_created_count" integer DEFAULT 0,
	"posts_created_count" integer DEFAULT 0,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"last_login_method" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_login" timestamp,
	CONSTRAINT "users_auth_uid_unique" UNIQUE("auth_uid"),
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "viewers" (
	"id" text PRIMARY KEY DEFAULT 'dbfaf9bb-fc2d-4352-a8db-a56fd2388a09' NOT NULL,
	"entity_id" text NOT NULL,
	"entity_type" "entity_type" NOT NULL,
	"user_id" text,
	"session_id" text,
	"ip_address" text,
	"user_agent" text,
	"viewed_at" timestamp DEFAULT now() NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "vip_subscriptions" (
	"id" text PRIMARY KEY DEFAULT 'dd26c56d-99e6-4f71-ad92-aca7f2b4f324' NOT NULL,
	"user_id" text NOT NULL,
	"plan_type" "vip_plan_type" DEFAULT 'MONTHLY',
	"status" "vip_status" DEFAULT 'ACTIVE',
	"start_date" timestamp DEFAULT now(),
	"end_date" timestamp NOT NULL,
	"auto_renew" boolean DEFAULT true,
	"price_paid" numeric(10, 2),
	"currency" text DEFAULT 'GTC',
	"transaction_id" text,
	"active_benefits" jsonb DEFAULT '[]'::jsonb,
	"is_deleted" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" text PRIMARY KEY DEFAULT 'add7f398-82b1-4587-9c91-3a722df5d683' NOT NULL,
	"wallet_id" text NOT NULL,
	"from_user_id" text,
	"to_user_id" text,
	"amount" numeric(15, 2) NOT NULL,
	"fees" numeric(15, 2) DEFAULT '0',
	"net_amount" numeric(15, 2) NOT NULL,
	"balance_after" numeric(15, 2) NOT NULL,
	"currency" text DEFAULT 'GTC',
	"type" "transaction_type" NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"status" "transaction_status" DEFAULT 'PENDING',
	"is_deleted" boolean DEFAULT false,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_nodes" ADD CONSTRAINT "bracket_nodes_phase_id_tournament_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."tournament_phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_nodes" ADD CONSTRAINT "bracket_nodes_group_id_phase_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."phase_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_nodes" ADD CONSTRAINT "bracket_nodes_parent_node_id_bracket_nodes_id_fk" FOREIGN KEY ("parent_node_id") REFERENCES "public"."bracket_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "claims" ADD CONSTRAINT "claims_transaction_id_wallet_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."wallet_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition_registrations" ADD CONSTRAINT "edition_registrations_edition_id_tournament_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."tournament_editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition_registrations" ADD CONSTRAINT "edition_registrations_member_id_tournament_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."tournament_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition_registrations" ADD CONSTRAINT "edition_registrations_payment_transaction_id_wallet_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."wallet_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition_registrations" ADD CONSTRAINT "edition_registrations_previous_edition_id_tournament_editions_id_fk" FOREIGN KEY ("previous_edition_id") REFERENCES "public"."tournament_editions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition_results" ADD CONSTRAINT "edition_results_edition_id_tournament_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."tournament_editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition_results" ADD CONSTRAINT "edition_results_registration_id_edition_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."edition_registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edition_results" ADD CONSTRAINT "edition_results_payment_transaction_id_wallet_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."wallet_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entity_categories" ADD CONSTRAINT "entity_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_item_requests" ADD CONSTRAINT "game_item_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_item_requests" ADD CONSTRAINT "game_item_requests_game_item_id_game_items_id_fk" FOREIGN KEY ("game_item_id") REFERENCES "public"."game_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_item_requests" ADD CONSTRAINT "game_item_requests_processed_by_user_id_users_id_fk" FOREIGN KEY ("processed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_item_requests" ADD CONSTRAINT "game_item_requests_transaction_id_wallet_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."wallet_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_items" ADD CONSTRAINT "game_items_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_members" ADD CONSTRAINT "group_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "groups" ADD CONSTRAINT "groups_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guide_steps" ADD CONSTRAINT "guide_steps_guide_id_guides_id_fk" FOREIGN KEY ("guide_id") REFERENCES "public"."guides"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "guides" ADD CONSTRAINT "guides_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interactions" ADD CONSTRAINT "interactions_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_edition_id_tournament_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."tournament_editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_phase_id_tournament_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."tournament_phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_group_id_phase_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."phase_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_bracket_node_id_bracket_nodes_id_fk" FOREIGN KEY ("bracket_node_id") REFERENCES "public"."bracket_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_participant1_registration_id_edition_registrations_id_fk" FOREIGN KEY ("participant1_registration_id") REFERENCES "public"."edition_registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_participant2_registration_id_edition_registrations_id_fk" FOREIGN KEY ("participant2_registration_id") REFERENCES "public"."edition_registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_winner_registration_id_edition_registrations_id_fk" FOREIGN KEY ("winner_registration_id") REFERENCES "public"."edition_registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_loser_registration_id_edition_registrations_id_fk" FOREIGN KEY ("loser_registration_id") REFERENCES "public"."edition_registrations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_submitted_by_user_id_users_id_fk" FOREIGN KEY ("submitted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matches" ADD CONSTRAINT "matches_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_users_id_fk" FOREIGN KEY ("sender_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_parent_message_id_messages_id_fk" FOREIGN KEY ("parent_message_id") REFERENCES "public"."messages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_ordered_product_id_products_id_fk" FOREIGN KEY ("ordered_product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "passkey" ADD CONSTRAINT "passkey_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_group_participants" ADD CONSTRAINT "phase_group_participants_group_id_phase_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."phase_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_group_participants" ADD CONSTRAINT "phase_group_participants_registration_id_edition_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."edition_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "phase_groups" ADD CONSTRAINT "phase_groups_phase_id_tournament_phases_id_fk" FOREIGN KEY ("phase_id") REFERENCES "public"."tournament_phases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_delivered_to_user_id_users_id_fk" FOREIGN KEY ("delivered_to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_payments" ADD CONSTRAINT "registration_payments_registration_id_edition_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."edition_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_payments" ADD CONSTRAINT "registration_payments_transaction_id_wallet_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."wallet_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "search_history" ADD CONSTRAINT "search_history_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "services" ADD CONSTRAINT "services_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shops" ADD CONSTRAINT "shops_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_captain_id_users_id_fk" FOREIGN KEY ("captain_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teams" ADD CONSTRAINT "teams_vice_captain_id_users_id_fk" FOREIGN KEY ("vice_captain_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_purchases" ADD CONSTRAINT "theme_purchases_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "theme_purchases" ADD CONSTRAINT "theme_purchases_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "themes" ADD CONSTRAINT "themes_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_editions" ADD CONSTRAINT "tournament_editions_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_members" ADD CONSTRAINT "tournament_members_tournament_id_tournaments_id_fk" FOREIGN KEY ("tournament_id") REFERENCES "public"."tournaments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_members" ADD CONSTRAINT "tournament_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_members" ADD CONSTRAINT "tournament_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_phases" ADD CONSTRAINT "tournament_phases_edition_id_tournament_editions_id_fk" FOREIGN KEY ("edition_id") REFERENCES "public"."tournament_editions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_organizer_id_users_id_fk" FOREIGN KEY ("organizer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournaments" ADD CONSTRAINT "tournaments_theme_id_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_traces" ADD CONSTRAINT "user_traces_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_wallets" ADD CONSTRAINT "user_wallets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "viewers" ADD CONSTRAINT "viewers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vip_subscriptions" ADD CONSTRAINT "vip_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vip_subscriptions" ADD CONSTRAINT "vip_subscriptions_transaction_id_wallet_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."wallet_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_wallet_id_user_wallets_id_fk" FOREIGN KEY ("wallet_id") REFERENCES "public"."user_wallets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_from_user_id_users_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_to_user_id_users_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "announcement_read_unique" ON "announcement_reads" USING btree ("announcement_id","user_id");--> statement-breakpoint
CREATE INDEX "announcements_type_idx" ON "announcements" USING btree ("type");--> statement-breakpoint
CREATE INDEX "announcements_author_idx" ON "announcements" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "blogs_author_idx" ON "blogs" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "blogs_active_idx" ON "blogs" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "bracket_nodes_phase_idx" ON "bracket_nodes" USING btree ("phase_id");--> statement-breakpoint
CREATE INDEX "bracket_nodes_group_idx" ON "bracket_nodes" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "bracket_nodes_parent_idx" ON "bracket_nodes" USING btree ("parent_node_id");--> statement-breakpoint
CREATE INDEX "bracket_nodes_type_idx" ON "bracket_nodes" USING btree ("node_type");--> statement-breakpoint
CREATE INDEX "bracket_nodes_bracket_idx" ON "bracket_nodes" USING btree ("bracket_type","round","match_number");--> statement-breakpoint
CREATE INDEX "bracket_nodes_depth_idx" ON "bracket_nodes" USING btree ("depth");--> statement-breakpoint
CREATE INDEX "bracket_nodes_code_idx" ON "bracket_nodes" USING btree ("node_code");--> statement-breakpoint
CREATE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "categories_path_idx" ON "categories" USING btree ("path");--> statement-breakpoint
CREATE INDEX "categories_entities_idx" ON "categories" USING btree ("applicable_entities");--> statement-breakpoint
CREATE INDEX "categories_sort_idx" ON "categories" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "edition_registration_unique" ON "edition_registrations" USING btree ("edition_id","member_id");--> statement-breakpoint
CREATE INDEX "edition_registrations_edition_idx" ON "edition_registrations" USING btree ("edition_id");--> statement-breakpoint
CREATE INDEX "edition_registrations_member_idx" ON "edition_registrations" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "edition_registrations_status_idx" ON "edition_registrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "edition_registrations_type_idx" ON "edition_registrations" USING btree ("registration_type");--> statement-breakpoint
CREATE INDEX "edition_registrations_fee_paid_idx" ON "edition_registrations" USING btree ("fee_paid");--> statement-breakpoint
CREATE INDEX "edition_registrations_checked_in_idx" ON "edition_registrations" USING btree ("checked_in");--> statement-breakpoint
CREATE INDEX "edition_registrations_registered_at_idx" ON "edition_registrations" USING btree ("registered_at");--> statement-breakpoint
CREATE UNIQUE INDEX "edition_result_unique" ON "edition_results" USING btree ("edition_id","registration_id");--> statement-breakpoint
CREATE INDEX "edition_results_edition_idx" ON "edition_results" USING btree ("edition_id");--> statement-breakpoint
CREATE INDEX "edition_results_position_idx" ON "edition_results" USING btree ("edition_id","position");--> statement-breakpoint
CREATE INDEX "edition_results_registration_idx" ON "edition_results" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "edition_results_tier_idx" ON "edition_results" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "edition_results_prize_paid_idx" ON "edition_results" USING btree ("prize_paid");--> statement-breakpoint
CREATE UNIQUE INDEX "entity_category_unique" ON "entity_categories" USING btree ("entity_id","entity_type","category_id");--> statement-breakpoint
CREATE INDEX "entity_categories_entity_idx" ON "entity_categories" USING btree ("entity_id","entity_type");--> statement-breakpoint
CREATE INDEX "entity_categories_category_idx" ON "entity_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "game_requests_user_idx" ON "game_item_requests" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "game_requests_status_idx" ON "game_item_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "game_items_game_idx" ON "game_items" USING btree ("game_id");--> statement-breakpoint
CREATE INDEX "game_items_type_idx" ON "game_items" USING btree ("type");--> statement-breakpoint
CREATE INDEX "games_active_featured_idx" ON "games" USING btree ("is_active","featured");--> statement-breakpoint
CREATE UNIQUE INDEX "group_member_unique" ON "group_members" USING btree ("group_id","user_id");--> statement-breakpoint
CREATE INDEX "guide_steps_guide_idx" ON "guide_steps" USING btree ("guide_id");--> statement-breakpoint
CREATE INDEX "guide_steps_order_idx" ON "guide_steps" USING btree ("guide_id","order");--> statement-breakpoint
CREATE INDEX "guides_admin_idx" ON "guides" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "guides_category_idx" ON "guides" USING btree ("category");--> statement-breakpoint
CREATE INDEX "guides_active_idx" ON "guides" USING btree ("is_active");--> statement-breakpoint
CREATE UNIQUE INDEX "interaction_unique" ON "interactions" USING btree ("user_id","entity_id","entity_type","type") WHERE "interactions"."is_deleted" = false;--> statement-breakpoint
CREATE INDEX "interactions_entity_idx" ON "interactions" USING btree ("entity_id","entity_type");--> statement-breakpoint
CREATE INDEX "interactions_user_idx" ON "interactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "matches_edition_idx" ON "matches" USING btree ("edition_id");--> statement-breakpoint
CREATE INDEX "matches_phase_idx" ON "matches" USING btree ("phase_id");--> statement-breakpoint
CREATE INDEX "matches_group_idx" ON "matches" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "matches_bracket_node_idx" ON "matches" USING btree ("bracket_node_id");--> statement-breakpoint
CREATE INDEX "matches_scheduled_idx" ON "matches" USING btree ("scheduled_time");--> statement-breakpoint
CREATE INDEX "matches_created_at_idx" ON "matches" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "matches_code_idx" ON "matches" USING btree ("match_code");--> statement-breakpoint
CREATE INDEX "matches_status_idx" ON "matches" USING btree ("status");--> statement-breakpoint
CREATE INDEX "matches_round_idx" ON "matches" USING btree ("round","match_number");--> statement-breakpoint
CREATE INDEX "matches_type_idx" ON "matches" USING btree ("match_type");--> statement-breakpoint
CREATE INDEX "matches_participant1_idx" ON "matches" USING btree ("participant1_registration_id");--> statement-breakpoint
CREATE INDEX "matches_participant2_idx" ON "matches" USING btree ("participant2_registration_id");--> statement-breakpoint
CREATE INDEX "matches_winner_idx" ON "matches" USING btree ("winner_registration_id");--> statement-breakpoint
CREATE INDEX "matches_composite_idx" ON "matches" USING btree ("edition_id","status","scheduled_time");--> statement-breakpoint
CREATE INDEX "matches_group_status_idx" ON "matches" USING btree ("group_id","status");--> statement-breakpoint
CREATE INDEX "messages_sender_idx" ON "messages" USING btree ("sender_id");--> statement-breakpoint
CREATE INDEX "messages_recipient_idx" ON "messages" USING btree ("recipient_id");--> statement-breakpoint
CREATE INDEX "messages_entity_idx" ON "messages" USING btree ("entity_id","entity_type");--> statement-breakpoint
CREATE INDEX "orders_product_idx" ON "orders" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "orders_buyer_idx" ON "orders" USING btree ("buyer_id");--> statement-breakpoint
CREATE UNIQUE INDEX "phase_group_participant_unique" ON "phase_group_participants" USING btree ("group_id","registration_id");--> statement-breakpoint
CREATE INDEX "phase_group_participants_group_idx" ON "phase_group_participants" USING btree ("group_id");--> statement-breakpoint
CREATE INDEX "phase_group_participants_registration_idx" ON "phase_group_participants" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "phase_group_participants_position_idx" ON "phase_group_participants" USING btree ("group_id","position");--> statement-breakpoint
CREATE INDEX "phase_group_participants_points_idx" ON "phase_group_participants" USING btree ("group_id","points");--> statement-breakpoint
CREATE INDEX "phase_group_participants_qualified_idx" ON "phase_group_participants" USING btree ("qualified");--> statement-breakpoint
CREATE INDEX "groups_phase_idx" ON "phase_groups" USING btree ("phase_id");--> statement-breakpoint
CREATE INDEX "groups_order_idx" ON "phase_groups" USING btree ("phase_id","order");--> statement-breakpoint
CREATE INDEX "groups_type_idx" ON "phase_groups" USING btree ("group_type");--> statement-breakpoint
CREATE INDEX "groups_completed_idx" ON "phase_groups" USING btree ("is_completed");--> statement-breakpoint
CREATE INDEX "posts_author_story_idx" ON "posts" USING btree ("author_id","is_story","is_active");--> statement-breakpoint
CREATE INDEX "posts_expires_at_idx" ON "posts" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "products_shop_idx" ON "products" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "products_user_idx" ON "products" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "products_status_idx" ON "products" USING btree ("status");--> statement-breakpoint
CREATE INDEX "products_game_idx" ON "products" USING btree ("game");--> statement-breakpoint
CREATE INDEX "registration_payments_registration_idx" ON "registration_payments" USING btree ("registration_id");--> statement-breakpoint
CREATE INDEX "registration_payments_transaction_idx" ON "registration_payments" USING btree ("transaction_id");--> statement-breakpoint
CREATE INDEX "registration_payments_paid_at_idx" ON "registration_payments" USING btree ("paid_at");--> statement-breakpoint
CREATE INDEX "registration_payments_status_idx" ON "registration_payments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "registration_payments_method_idx" ON "registration_payments" USING btree ("payment_method");--> statement-breakpoint
CREATE INDEX "search_history_user_idx" ON "search_history" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "services_admin_idx" ON "services" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "services_active_idx" ON "services" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "shops_owner_idx" ON "shops" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "shops_verified_idx" ON "shops" USING btree ("verified");--> statement-breakpoint
CREATE UNIQUE INDEX "team_member_unique" ON "team_members" USING btree ("team_id","user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "theme_purchase_unique" ON "theme_purchases" USING btree ("user_id","theme_id");--> statement-breakpoint
CREATE INDEX "themes_creator_idx" ON "themes" USING btree ("creator_id");--> statement-breakpoint
CREATE INDEX "themes_category_idx" ON "themes" USING btree ("category");--> statement-breakpoint
CREATE INDEX "editions_tournament_idx" ON "tournament_editions" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "editions_status_idx" ON "tournament_editions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "editions_dates_idx" ON "tournament_editions" USING btree ("start_date","end_date");--> statement-breakpoint
CREATE INDEX "editions_edition_number_idx" ON "tournament_editions" USING btree ("tournament_id","edition_number");--> statement-breakpoint
CREATE INDEX "editions_location_type_idx" ON "tournament_editions" USING btree ("location_type");--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_edition_unique" ON "tournament_editions" USING btree ("tournament_id","edition_number");--> statement-breakpoint
CREATE UNIQUE INDEX "edition_slug_unique" ON "tournament_editions" USING btree ("edition_slug") WHERE "tournament_editions"."edition_slug" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_member_user_unique" ON "tournament_members" USING btree ("tournament_id","user_id") WHERE "tournament_members"."user_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_member_team_unique" ON "tournament_members" USING btree ("tournament_id","team_id") WHERE "tournament_members"."team_id" IS NOT NULL;--> statement-breakpoint
CREATE INDEX "tournament_members_tournament_idx" ON "tournament_members" USING btree ("tournament_id");--> statement-breakpoint
CREATE INDEX "tournament_members_user_idx" ON "tournament_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tournament_members_team_idx" ON "tournament_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "tournament_members_role_idx" ON "tournament_members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "tournament_members_active_idx" ON "tournament_members" USING btree ("is_active","is_banned");--> statement-breakpoint
CREATE INDEX "tournament_members_ranking_idx" ON "tournament_members" USING btree ("ranking_points");--> statement-breakpoint
CREATE INDEX "tournament_members_joined_at_idx" ON "tournament_members" USING btree ("joined_at");--> statement-breakpoint
CREATE INDEX "phases_edition_idx" ON "tournament_phases" USING btree ("edition_id");--> statement-breakpoint
CREATE INDEX "phases_order_idx" ON "tournament_phases" USING btree ("edition_id","order");--> statement-breakpoint
CREATE INDEX "phases_active_idx" ON "tournament_phases" USING btree ("is_active","is_completed");--> statement-breakpoint
CREATE INDEX "phases_type_idx" ON "tournament_phases" USING btree ("type");--> statement-breakpoint
CREATE INDEX "phases_scheduled_start_idx" ON "tournament_phases" USING btree ("scheduled_start");--> statement-breakpoint
CREATE INDEX "tournaments_organizer_idx" ON "tournaments" USING btree ("organizer_id");--> statement-breakpoint
CREATE INDEX "tournaments_game_idx" ON "tournaments" USING btree ("game");--> statement-breakpoint
CREATE INDEX "tournaments_status_idx" ON "tournaments" USING btree ("status");--> statement-breakpoint
CREATE INDEX "tournaments_visibility_idx" ON "tournaments" USING btree ("visibility");--> statement-breakpoint
CREATE INDEX "tournaments_featured_idx" ON "tournaments" USING btree ("featured");--> statement-breakpoint
CREATE INDEX "tournaments_slug_idx" ON "tournaments" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tournaments_created_at_idx" ON "tournaments" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "tournaments_platform_idx" ON "tournaments" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "user_traces_user_idx" ON "user_traces" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_traces_session_idx" ON "user_traces" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "user_traces_type_idx" ON "user_traces" USING btree ("type");--> statement-breakpoint
CREATE UNIQUE INDEX "wallet_user_unique" ON "user_wallets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "wallet_user_id_idx" ON "user_wallets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_username_idx" ON "users" USING btree ("username");--> statement-breakpoint
CREATE INDEX "users_auth_uid_idx" ON "users" USING btree ("auth_uid");--> statement-breakpoint
CREATE INDEX "viewers_entity_idx" ON "viewers" USING btree ("entity_id","entity_type");--> statement-breakpoint
CREATE INDEX "viewers_user_idx" ON "viewers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "viewers_viewed_at_idx" ON "viewers" USING btree ("viewed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "vip_user_unique" ON "vip_subscriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "vip_user_status_idx" ON "vip_subscriptions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "transactions_wallet_id_idx" ON "wallet_transactions" USING btree ("wallet_id");--> statement-breakpoint
CREATE INDEX "transactions_type_status_idx" ON "wallet_transactions" USING btree ("type","status");--> statement-breakpoint
CREATE INDEX "transactions_created_at_idx" ON "wallet_transactions" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "transactions_from_user_idx" ON "wallet_transactions" USING btree ("from_user_id");--> statement-breakpoint
CREATE INDEX "transactions_to_user_idx" ON "wallet_transactions" USING btree ("to_user_id");