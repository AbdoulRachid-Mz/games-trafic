
-- ============================================================================
-- ENUMS
-- ============================================================================

CREATE TYPE account_type_enum AS ENUM ('SELLER', 'BUYER', 'TRADER', 'TOURNAMENT_ORGANIZER', 'VIP');
CREATE TYPE user_level_enum AS ENUM ('A', 'B', 'C');
CREATE TYPE team_role_enum AS ENUM ('PLAYER', 'COACH', 'MANAGER', 'SUBSTITUTE', 'CAPTAIN', 'VICE_CAPTAIN');
CREATE TYPE tournament_status_enum AS ENUM ('UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED');
CREATE TYPE tournament_format_enum AS ENUM ('ELIMINATION', 'GROUP_STAGE', 'ROUND_ROBIN', 'SWISS', 'KNOCKOUT', 'CUSTOM');
CREATE TYPE match_status_enum AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE transaction_status_enum AS ENUM ('PENDING', 'COMPLETED', 'PROCESSING', 'FAILED', 'REFUNDED');
CREATE TYPE transaction_type_enum AS ENUM (
  'PURCHASE', 'VIP_SUBSCRIPTION', 'GAME_ITEM_PURCHASE', 'THEME_PURCHASE',
  'DEPOSIT', 'WITHDRAWAL', 'REFUND', 'TRANSFER', 'ORDER_PURCHASE', 'TOURNAMENT_PARTICIPATION'
);
CREATE TYPE order_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');
CREATE TYPE participation_status_enum AS ENUM ('REGISTERED', 'PARTICIPATED', 'DISQUALIFIED', 'WINNER', 'ELIMINATED');
CREATE TYPE entity_type_enum AS ENUM (
  'PRODUCT', 'POST', 'SHOP', 'TOURNAMENT', 'USER', 'BLOG', 
  'MESSAGE', 'TEAM', 'THEME', 'NEWS', 'GROUP', 'ANNOUNCEMENT', 
  'SERVICE', 'GUIDE', 'COMMENT', 'MATCH'
);
CREATE TYPE product_status_enum AS ENUM ('NON_VENDU', 'RESERVE', 'EN_ECHANGE', 'LIVRE', 'VENDU', 'ANNULER');
CREATE TYPE interaction_type_enum AS ENUM ('LIKE', 'FOLLOW', 'BOOKMARK', 'VIEW');
CREATE TYPE platform_enum AS ENUM ('PC', 'PLAYSTATION', 'XBOX', 'NINTENDO_SWITCH', 'MOBILE', 'VR', 'OTHER');
CREATE TYPE game_item_type_enum AS ENUM ('COIN', 'ITEM', 'SKIN', 'EQUIPMENT', 'CURRENCY');
CREATE TYPE game_item_status_enum AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE vip_plan_type_enum AS ENUM ('MONTHLY', 'YEARLY', 'LIFETIME');
CREATE TYPE vip_status_enum AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE group_role_enum AS ENUM ('OWNER', 'ADMIN', 'MEMBER');
CREATE TYPE announcement_type_enum AS ENUM ('ANNOUNCEMENT', 'NEWS', 'UPDATE');
CREATE TYPE trace_type_enum AS ENUM (
  'SIGNIN', 'SIGNOUT', 'REGISTER', 'NAVIGATION', 'PURCHASE',
  'TRANSFER', 'DEPOSIT', 'VIEW', 'LIKE', 'FOLLOW', 'BOOKMARK',
  'CLAIM', 'ERROR', 'EXPLANATION_SHOWN', 'OTHER'
);

-- ============================================================================
-- TABLES PRINCIPALES
-- ============================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_uid TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  full_name TEXT,
  profile_image TEXT,
  cover_image TEXT,
  bio TEXT,
  website TEXT,
  country TEXT,
  country_code TEXT,
  social_media JSONB DEFAULT '["games-trafics"]'::jsonb,
  phone_number TEXT,
  address JSONB,
  is_public_profile BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  is_vip BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  auth_providers JSONB DEFAULT '[]'::jsonb,
  shops_count INTEGER DEFAULT 0,
  tournaments_count INTEGER DEFAULT 0,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}'::jsonb,
  account_types TEXT[] DEFAULT ARRAY['BUYER']::TEXT[],
  level user_level_enum DEFAULT 'C',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_auth_uid ON users(auth_uid);

CREATE TABLE user_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_number_hash TEXT UNIQUE,
  pin_hash TEXT NOT NULL,
  balance NUMERIC(15,2) DEFAULT '0',
  is_active BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  failed_attempts INTEGER DEFAULT 0,
  last_failed_attempt TIMESTAMP,
  identity_document_type TEXT,
  identity_document_url TEXT,
  verification_status TEXT DEFAULT 'PENDING',
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT wallet_user_unique UNIQUE (user_id)
);

CREATE INDEX idx_wallet_user_id ON user_wallets(user_id);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES user_wallets(id),
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  amount NUMERIC(15,2) NOT NULL,
  fees NUMERIC(15,2) DEFAULT '0',
  net_amount NUMERIC(15,2) NOT NULL,
  balance_after NUMERIC(15,2) NOT NULL,
  currency TEXT DEFAULT 'GTC',
  type transaction_type_enum NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status transaction_status_enum DEFAULT 'PENDING',
  is_deleted BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_wallet_id ON wallet_transactions(wallet_id);
CREATE INDEX idx_transactions_type_status ON wallet_transactions(type, status);
CREATE INDEX idx_transactions_created_at ON wallet_transactions(created_at);
CREATE INDEX idx_transactions_from_user ON wallet_transactions(from_user_id);
CREATE INDEX idx_transactions_to_user ON wallet_transactions(to_user_id);

CREATE TABLE vip_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_type vip_plan_type_enum DEFAULT 'MONTHLY',
  status vip_status_enum DEFAULT 'ACTIVE',
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP NOT NULL,
  auto_renew BOOLEAN DEFAULT true,
  price_paid NUMERIC(10,2),
  currency TEXT DEFAULT 'GTC',
  transaction_id UUID REFERENCES wallet_transactions(id),
  active_benefits JSONB DEFAULT '[]'::jsonb,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT vip_user_unique UNIQUE (user_id)
);

CREATE INDEX idx_vip_user_status ON vip_subscriptions(user_id, status);

-- ============================================================================
-- BOUTIQUES ET PRODUITS
-- ============================================================================

CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES users(id),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  is_premium BOOLEAN DEFAULT false,
  price NUMERIC(8,2) DEFAULT '0',
  thumbnail TEXT,
  preview_images TEXT[] DEFAULT '{}',
  config JSONB NOT NULL,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  downloads INTEGER DEFAULT 0,
    viewers TEXT[] DEFAULT '{}',
  likes INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  is_copy BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_themes_creator ON themes(creator_id);
CREATE INDEX idx_themes_category ON themes(category);

CREATE TABLE shops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  profile_image TEXT,
  cover_image TEXT,
  phone_number TEXT,
  country TEXT,
  address JSONB,
  website TEXT,
  social_media JSONB DEFAULT '{}',
  product_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
    viewers TEXT[] DEFAULT '{}',
  follower_count INTEGER DEFAULT 0,
  balance NUMERIC(15,2) DEFAULT '0',
  verified BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  theme_id UUID REFERENCES themes(id),
  custom_theme JSONB,
  notification_settings JSONB DEFAULT '{"notifyOnNewOrder":true,"notifyOnNewMessage":true,"channels":["IN_APP"]}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shops_owner ON shops(owner_id);
CREATE INDEX idx_shops_verified ON shops(verified);

-- ============================================================================
-- CATÉGORIES UNIFIÉES (single table)
-- ============================================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  icon TEXT,
  color TEXT,
  image TEXT,
  parent_id UUID REFERENCES categories(id),
  level INTEGER DEFAULT 0,
  path TEXT,
  full_path TEXT,
  applicable_entities entity_type_enum[] NOT NULL DEFAULT '{PRODUCT}',
  filters JSONB DEFAULT '{}',
  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  item_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_path ON categories(path);
CREATE INDEX idx_categories_entities ON categories(applicable_entities);
CREATE INDEX idx_categories_sort ON categories(sort_order);

-- ============================================================================
-- TOURNOIS ET ÉQUIPES
-- ============================================================================

CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  logo TEXT,
  colors TEXT[] DEFAULT '{}',
  country TEXT,
  city TEXT,
  founded_year INTEGER,
  website TEXT,
  achievements TEXT[] DEFAULT '{}',
  ranking INTEGER,
  division TEXT,
  registration_id TEXT UNIQUE,
  max_squad_size INTEGER DEFAULT 25,
  current_squad_size INTEGER DEFAULT 0,
  home_stadium TEXT,
  preferred_formation TEXT,
  strategy TEXT,
  is_active BOOLEAN DEFAULT true,
  captain_id UUID REFERENCES users(id),
  vice_captain_id UUID REFERENCES users(id),
  social_media JSONB DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role team_role_enum DEFAULT 'PLAYER',
  position TEXT,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  CONSTRAINT team_member_unique UNIQUE (team_id, user_id)
);

CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id UUID NOT NULL REFERENCES users(id),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  profile_image TEXT,
  cover_image TEXT,
  game TEXT NOT NULL,
  platform platform_enum DEFAULT 'MOBILE',
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP,
  registration_deadline TIMESTAMP,
  max_participants INTEGER NOT NULL,
  current_participants INTEGER DEFAULT 0,
  prize_pool NUMERIC(15,2),
  prize_currency TEXT DEFAULT 'GTC',
  rules TEXT,
  requirements TEXT,
  status tournament_status_enum DEFAULT 'UPCOMING',
  is_private BOOLEAN DEFAULT false,
  requires_access_code BOOLEAN DEFAULT false,
  access_code TEXT,
  view_count INTEGER DEFAULT 0,
viewers TEXT[] DEFAULT '{}',
  follower_count INTEGER DEFAULT 0,
  location TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  whatsapp_group TEXT,
  social_media TEXT[] DEFAULT '{}',
  theme_id UUID REFERENCES themes(id),
  custom_theme JSONB,
  custom_config JSONB,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tournaments_organizer ON tournaments(organizer_id);
CREATE INDEX idx_tournaments_game ON tournaments(game);
CREATE INDEX idx_tournaments_status ON tournaments(status);

CREATE TABLE tournament_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  team_id UUID REFERENCES teams(id),
  is_co_organizer BOOLEAN DEFAULT false,
  role TEXT DEFAULT 'PARTICIPANT',
  permissions TEXT[] DEFAULT '{}',
  status participation_status_enum DEFAULT 'REGISTERED',
  score INTEGER DEFAULT 0,
  game_level TEXT,
  phone_number TEXT,
  club_name TEXT,
  is_guest BOOLEAN DEFAULT false,
  guest_data JSONB,
  is_verified BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT tournament_user_unique UNIQUE (tournament_id, user_id)
);

CREATE INDEX idx_tournament_members_tournament ON tournament_members(tournament_id);
CREATE INDEX idx_tournament_members_user ON tournament_members(user_id);

-- ============================================================================
-- STRUCTURE TOURNOIS AMÉLIORÉE
-- ============================================================================

CREATE TABLE tournament_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type tournament_format_enum DEFAULT 'ELIMINATION',
  "order" INTEGER NOT NULL,
  config JSONB DEFAULT '{"qualifiedCount":null,"groupsCount":1,"matchesPerGroup":null,"advanceFromGroup":1}',
  is_active BOOLEAN DEFAULT false,
  is_completed BOOLEAN DEFAULT false,
  is_double_elimination BOOLEAN DEFAULT false,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  match_duration INTEGER,
  break_duration INTEGER,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_phases_tournament ON tournament_phases(tournament_id);
CREATE INDEX idx_phases_order ON tournament_phases(tournament_id, "order");

CREATE TABLE phase_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id UUID NOT NULL REFERENCES tournament_phases(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  group_type TEXT DEFAULT 'ROUND_ROBIN',
  config JSONB DEFAULT '{"matchesPerParticipant":1,"advanceCount":2,"seeding":"RANDOM"}',
  is_completed BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  is_double BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_groups_phase ON phase_groups(phase_id);
CREATE INDEX idx_groups_order ON phase_groups(phase_id, "order");

CREATE TABLE phase_sub_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES phase_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  parent_sub_group_id UUID REFERENCES phase_sub_groups(id),
  participant1_id UUID REFERENCES tournament_members(id),
  participant2_id UUID REFERENCES tournament_members(id),
  bracket_position TEXT,
  bracket_round INTEGER,
  bracket_match INTEGER,
  status TEXT DEFAULT 'PENDING',
  winner_id UUID REFERENCES tournament_members(id),
  loser_id UUID REFERENCES tournament_members(id),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sub_groups_group ON phase_sub_groups(group_id);
CREATE INDEX idx_sub_groups_parent ON phase_sub_groups(parent_sub_group_id);
CREATE INDEX idx_sub_groups_bracket ON phase_sub_groups(bracket_round, bracket_match);
CREATE INDEX idx_sub_groups_participants ON phase_sub_groups(participant1_id, participant2_id);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_group_id UUID NOT NULL REFERENCES phase_sub_groups(id) ON DELETE CASCADE,
  match_code TEXT,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  scheduled_time TIMESTAMP,
  actual_start_time TIMESTAMP,
  actual_end_time TIMESTAMP,
  participant1_id UUID REFERENCES tournament_members(id),
  participant2_id UUID REFERENCES tournament_members(id),
  score1 INTEGER,
  score2 INTEGER,
  winner_id UUID REFERENCES tournament_members(id),
  loser_id UUID REFERENCES tournament_members(id),
  screenshot TEXT,
  notes TEXT,
  submitted_by_user_id UUID REFERENCES users(id),
  status match_status_enum DEFAULT 'PENDING',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_matches_sub_group ON matches(sub_group_id);
CREATE INDEX idx_matches_scheduled ON matches(scheduled_time);
CREATE INDEX idx_matches_code ON matches(match_code);
CREATE INDEX idx_matches_participants ON matches(participant1_id, participant2_id);

-- ============================================================================
-- JEUX ET ITEMS
-- ============================================================================

CREATE TABLE games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  profile_image TEXT,
  cover_image TEXT,
  publisher TEXT,
  release_date TIMESTAMP,
  genre TEXT,
  platforms platform_enum[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  popularity INTEGER DEFAULT 0,
  website TEXT,
  min_age INTEGER,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_games_active_featured ON games(is_active, featured);

CREATE TABLE game_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id),
  name TEXT NOT NULL,
  type game_item_type_enum NOT NULL,
  description TEXT,
  icon TEXT,
  price_gtc NUMERIC(10,2) NOT NULL,
  exchange_rate NUMERIC(10,4),
  min_order NUMERIC(10,2) DEFAULT '1.0',
  max_order NUMERIC(10,2) DEFAULT '1000.0',
  availability TEXT DEFAULT 'AVAILABLE',
  processing_time TEXT DEFAULT '24h',
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  popularity INTEGER DEFAULT 0,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_game_items_game ON game_items(game_id);
CREATE INDEX idx_game_items_type ON game_items(type);

CREATE TABLE game_item_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  game_item_id UUID NOT NULL REFERENCES game_items(id),
  quantity NUMERIC(10,2),
  total_gtc NUMERIC(10,2),
  commission NUMERIC(10,2) DEFAULT '0',
  game_account TEXT NOT NULL,
  encrypted_password TEXT,
  game_id TEXT,
  additional_info JSONB,
  status game_item_status_enum DEFAULT 'PENDING',
  admin_notes TEXT,
  user_notes TEXT,
  processed_by_user_id UUID REFERENCES users(id),
  estimated_time INTEGER,
  tracking_number TEXT,
  transaction_id UUID REFERENCES wallet_transactions(id) ON DELETE CASCADE,
  processed_at TIMESTAMP,
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancellation_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_game_requests_user ON game_item_requests(user_id);
CREATE INDEX idx_game_requests_status ON game_item_requests(status);

-- ============================================================================
-- CONTENU ET SOCIAL
-- ============================================================================

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id),
  content TEXT,
  images TEXT[] DEFAULT '{}',
  video TEXT,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  viewers TEXT[] DEFAULT '{}',
  is_story BOOLEAN DEFAULT false,
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_author_story ON posts(author_id, is_story, is_active);
CREATE INDEX idx_posts_expires_at ON posts(expires_at);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES users(id),
  recipient_id UUID REFERENCES users(id),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  shop_id UUID REFERENCES shops(id),
  post_id UUID REFERENCES posts(id),
  product_id UUID REFERENCES products(id),
  content TEXT,
  images TEXT[] DEFAULT '{}',
  audio_url TEXT,
  parent_message_id UUID REFERENCES messages(id),
  entity_type entity_type_enum,
  entity_id UUID,
  read BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  is_open_to_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_recipient ON messages(recipient_id);
CREATE INDEX idx_messages_entity ON messages(entity_id, entity_type);

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role group_role_enum DEFAULT 'MEMBER',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT group_member_unique UNIQUE (group_id, user_id)
);

CREATE TABLE interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entity_id UUID NOT NULL,
  entity_type entity_type_enum NOT NULL,
  type interaction_type_enum NOT NULL,
  post_id UUID REFERENCES posts(id),
  product_id UUID REFERENCES products(id),
  message_id UUID REFERENCES messages(id),
  tournament_id UUID REFERENCES tournaments(id),
  shop_id UUID REFERENCES shops(id),
  theme_id UUID REFERENCES themes(id),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT interaction_unique UNIQUE (user_id, entity_id, entity_type, type)
);

CREATE INDEX idx_interactions_entity ON interactions(entity_id, entity_type);
CREATE INDEX idx_interactions_user ON interactions(user_id);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  shop_id UUID REFERENCES shops(id),
  tournament_id UUID REFERENCES tournaments(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  link_url TEXT,
  read BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  endpoint TEXT UNIQUE NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- THÈMES ET CONTENU ADMIN
-- ============================================================================

CREATE TABLE theme_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  theme_id UUID NOT NULL REFERENCES themes(id),
  price NUMERIC(8,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT theme_purchase_unique UNIQUE (user_id, theme_id)
);

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type announcement_type_enum DEFAULT 'ANNOUNCEMENT',
  images TEXT[] DEFAULT '{}',
  video TEXT,
  is_active BOOLEAN DEFAULT true,
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_announcements_type ON announcements(type);
CREATE INDEX idx_announcements_author ON announcements(author_id);

CREATE TABLE announcement_reads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT announcement_read_unique UNIQUE (announcement_id, user_id)
);

-- ============================================================================
-- AUTRES TABLES
-- ============================================================================

CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  query TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_search_history_user ON search_history(user_id, created_at);

CREATE TABLE claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  transaction_id UUID REFERENCES wallet_transactions(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence TEXT,
  image TEXT,
  status TEXT DEFAULT 'PENDING',
  resolution TEXT,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_traces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id TEXT,
  type trace_type_enum NOT NULL,
  entity_id UUID,
  payload JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  synced BOOLEAN DEFAULT false
);

CREATE INDEX idx_user_traces_user ON user_traces(user_id);
CREATE INDEX idx_user_traces_session ON user_traces(session_id);
CREATE INDEX idx_user_traces_type ON user_traces(type);

-- ============================================================================
-- BLOGS, SERVICES, GUIDES ET ÉTAPES
-- ============================================================================

CREATE TABLE blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  viewers TEXT[] DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT false,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_blogs_author ON blogs(author_id);
CREATE INDEX idx_blogs_active ON blogs(is_active);

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_services_admin ON services(admin_id);
CREATE INDEX idx_services_active ON services(is_active);

CREATE TABLE guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  view_count INTEGER DEFAULT 0,
  viewers TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  is_deleted BOOLEAN DEFAULT false,
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guides_admin ON guides(admin_id);
CREATE INDEX idx_guides_category ON guides(category);
CREATE INDEX idx_guides_active ON guides(is_active);

CREATE TABLE guide_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "order" INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  guide_id UUID NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_guide_steps_guide ON guide_steps(guide_id);
CREATE INDEX idx_guide_steps_order ON guide_steps(guide_id, "order");

-- ============================================================================
-- PARAMÈTRES APPLICATION
-- ============================================================================

CREATE TABLE app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_products_regular INTEGER DEFAULT 5,
  max_products_vip INTEGER DEFAULT 20,
  max_shops_regular INTEGER DEFAULT 1,
  max_shops_vip INTEGER DEFAULT 5,
  max_tournaments_regular INTEGER DEFAULT 1,
  max_tournaments_vip INTEGER DEFAULT 5,
  story_duration_hours INTEGER DEFAULT 48,
  max_stories_per_day_regular INTEGER DEFAULT 3,
  max_stories_per_day_vip INTEGER DEFAULT 10,
  transaction_fee_percentage NUMERIC(5,4) DEFAULT '0.001',
  purchase_fee_percentage NUMERIC(5,4) DEFAULT '0.01',
  deposit_fee_percentage NUMERIC(5,4) DEFAULT '0.00',
  withdrawal_fee_percentage NUMERIC(5,4) DEFAULT '0.02',
  transfer_fee_percentage NUMERIC(5,4) DEFAULT '0.005',
  tournament_participation_fee_percentage NUMERIC(5,4) DEFAULT '0.01',
  gtc_to_fcfa_rate NUMERIC(10,2) DEFAULT '500.0',
  gtc_to_eur_rate NUMERIC(10,4),
  gtc_to_usd_rate NUMERIC(10,4),
  last_exchange_rate_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  vip_monthly_price NUMERIC(8,2) DEFAULT '250',
  vip_yearly_price NUMERIC(8,2) DEFAULT '2500',
  free_themes_limit_regular INTEGER DEFAULT 2,
  free_themes_limit_vip INTEGER DEFAULT 10,
  max_theme_creations_regular INTEGER DEFAULT 0,
  max_theme_creations_vip INTEGER DEFAULT 5,
  can_vip_create_themes BOOLEAN DEFAULT true,
  can_vip_sell_themes BOOLEAN DEFAULT true,
  theme_creation_fee NUMERIC(8,2) DEFAULT '0.0',
  theme_sale_commission_percentage NUMERIC(5,4) DEFAULT '0.15',
  max_participants_per_tournament INTEGER DEFAULT 32,
  max_co_organizers_ratio REAL DEFAULT 0.33,
  game_items_enabled BOOLEAN DEFAULT true,
  game_item_commission_percentage NUMERIC(5,4) DEFAULT '0.05',
  min_game_item_request NUMERIC(10,2) DEFAULT '1.0',
  max_game_item_request NUMERIC(10,2) DEFAULT '1000.0',
  user_permissions JSONB DEFAULT '{}',
  admin_permissions JSONB DEFAULT '{}',
  regular_user_permissions JSONB DEFAULT '[]',
  vip_user_permissions JSONB DEFAULT '[]',
  public_routes JSONB DEFAULT '[]',
  protected_routes JSONB DEFAULT '[]',
  admin_routes JSONB DEFAULT '{}',
  admin_tasks JSONB DEFAULT '{}',
  maintenance_mode BOOLEAN DEFAULT false,
  default_user_balance INTEGER DEFAULT 250,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
