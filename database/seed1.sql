
-- ============================================================================
-- SEED DATA – COVERS ALL ENUM VALUES & REPRESENTATIVE ROWS
-- ============================================================================

-- ---------------------------------------------
-- 1. USERS (all account_types, all levels)
-- ---------------------------------------------
INSERT INTO users (id, auth_uid, email, username, full_name, country, account_types, level, is_verified, is_vip, is_admin, shops_count, tournaments_count, followers_count, following_count, posts_count, last_login) VALUES
(gen_random_uuid(), 'auth0|seller_a',  'seller_a@gt.com',  'seller_a',  'Seller A',  'FR', '{SELLER}',                'A', true,  true,  false, 2, 1, 120, 80, 25, NOW()),
(gen_random_uuid(), 'auth0|buyer_b',   'buyer_b@gt.com',   'buyer_b',   'Buyer B',   'CM', '{BUYER}',                 'B', false, false, false, 0, 0,  50, 30,  5, NOW()),
(gen_random_uuid(), 'auth0|trader_c',  'trader_c@gt.com',  'trader_c',  'Trader C',  'SN', '{TRADER}',                'C', false, false, false, 1, 0,  70, 40, 10, NOW()),
(gen_random_uuid(), 'auth0|org_d',     'org_d@gt.com',     'org_d',     'Org D',     'CI', '{TOURNAMENT_ORGANIZER}',  'A', true,  true,  false, 0, 5, 200, 90, 15, NOW()),
(gen_random_uuid(), 'auth0|vip_e',    'vip_e@gt.com',     'vip_e',     'VIP E',     'TG', '{VIP}',                   'A', true,  true,  false, 0, 2, 300, 150, 30, NOW()),
(gen_random_uuid(), 'auth0|admin_f',  'admin_f@gt.com',   'admin_f',   'Admin F',   'FR', '{BUYER}',                 'A', true,  true,  true,  0, 0,  10, 5,   2, NOW());

-- ---------------------------------------------
-- 2. USER_WALLETS (active / inactive / locked)
-- ---------------------------------------------
INSERT INTO user_wallets (user_id, card_number_hash, pin_hash, balance, is_active, is_locked, verification_status, verified_at)
SELECT u.id, md5(u.id::text), md5('1234'), 
       CASE WHEN u.level='A' THEN 1000 WHEN u.level='B' THEN 500 ELSE 250 END,
       u.is_active, false, 'VERIFIED', NOW()
FROM users u;

-- add one locked & one unverified wallet
UPDATE user_wallets SET is_locked=true, failed_attempts=3 WHERE user_id=(SELECT id FROM users WHERE username='buyer_b');
UPDATE user_wallets SET verification_status='PENDING', verified_at=NULL WHERE user_id=(SELECT id FROM users WHERE username='trader_c');

-- ---------------------------------------------
-- 3. WALLET_TRANSACTIONS (all statuses & types)
-- ---------------------------------------------
INSERT INTO wallet_transactions (wallet_id, from_user_id, to_user_id, amount, fees, net_amount, balance_after, type, status, description)
SELECT w.id, 
       CASE WHEN t.type IN ('DEPOSIT','REFUND') THEN NULL ELSE u.id END,
       CASE WHEN t.type IN ('WITHDRAWAL','TRANSFER') THEN NULL ELSE u.id END,
       t.amount, t.fees, t.net, w.balance + t.net, t.type, t.status, t.desc
FROM user_wallets w
JOIN users u ON u.id=w.user_id
JOIN LATERAL (
  VALUES 
  (100, 1.0, 99.0, 'DEPOSIT', 'COMPLETED', 'Seed deposit'),
  (50,  0.5, 49.5, 'PURCHASE', 'PENDING', 'Order #1'),
  (25,  0.25,24.75,'TRANSFER', 'COMPLETED', 'Tip to friend'),
  (10,  0.2, 9.8, 'WITHDRAWAL','PROCESSING','Bank withdraw'),
  (5,   0.05,4.95, 'REFUND', 'FAILED', 'Refund fail')
) t(amount,fees,net,type,status,desc) ON true;

-- ---------------------------------------------
-- 4. VIP_SUBSCRIPTIONS (all plan_type & status)
-- ---------------------------------------------
INSERT INTO vip_subscriptions (user_id, plan_type, status, start_date, end_date, auto_renew, price_paid)
SELECT u.id, 
       unnest('{MONTHLY,YEARLY,LIFETIME}'::vip_plan_type_enum[]),
       CASE WHEN random()<0.5 THEN 'ACTIVE' WHEN random()<0.8 THEN 'EXPIRED' ELSE 'CANCELLED' END,
       NOW() - (random()*interval'400 days'),
       NOW() + (random()*interval'400 days'),
       true,
       CASE WHEN plan_type='MONTHLY' THEN 250 WHEN plan_type='YEARLY' THEN 2500 ELSE 10000 END
FROM users u WHERE u.is_vip;

-- ---------------------------------------------
-- 5. THEMES (free & premium)
-- ---------------------------------------------
INSERT INTO themes (creator_id, name, description, is_premium, price, config, category, is_active, is_public)
SELECT u.id, 
       'Theme '||row_number() over(),
       'Description for theme '||row_number() over(),
       (row_number() over()%3=0),
       CASE WHEN (row_number() over()%3=0) THEN 500 ELSE 0 END,
       '{"colors":{"primary":"#111","secondary":"#bbb"}}',
       (ARRAY('GAME','SHOP','TOURNAMENT','BLOG'))[1+ (row_number() over()%4)],
       true, true
FROM users u WHERE u.is_admin OR u.is_vip LIMIT 10;

-- ---------------------------------------------
-- 6. SHOPS (verified & featured)
-- ---------------------------------------------
INSERT INTO shops (owner_id, name, description, country, verified, featured, is_active, theme_id)
SELECT u.id, 
       'Shop '||u.username,
       'Shop owned by '||u.username,
       u.country,
       (random()<0.4),
       (random()<0.2),
       true,
       (SELECT id FROM themes WHERE is_premium=false LIMIT 1)
FROM users u WHERE 'SELLER'=ANY(u.account_types);

-- ---------------------------------------------
-- 7. CATEGORIES (hierarchical)
-- ---------------------------------------------
INSERT INTO categories (name, slug, parent_id, level, path, full_path, applicable_entities, is_featured, is_active)
VALUES
('Products', 'products', null, 0, 'products', 'products', '{PRODUCT}', true, true),
('Tournaments', 'tournaments', null, 0, 'tournaments', 'tournaments', '{TOURNAMENT}', true, true),
('Consoles', 'consoles', (SELECT id FROM categories WHERE slug='products'), 1, 'products.consoles', 'products.consoles', '{PRODUCT}', false, true),
('FIFA', 'fifa', (SELECT id FROM categories WHERE slug='tournaments'), 1, 'tournaments.fifa', 'tournaments.fifa', '{TOURNAMENT}', false, true);

-- ---------------------------------------------
-- 8. TEAMS & TEAM_MEMBERS (all roles)
-- ---------------------------------------------
INSERT INTO teams (name, logo, country, current_squad_size, is_active)
VALUES 
('Team Alpha', 'alpha.png', 'FR', 5, true),
('Team Beta',  'beta.png',  'CM', 3, true);

INSERT INTO team_members (team_id, user_id, role, position, is_active)
SELECT t.id, u.id, unnest('{PLAYER,COACH,MANAGER,SUBSTITUTE,CAPTAIN,VICE_CAPTAIN}'::team_role_enum[]), 'Midfielder', true
FROM teams t, users u
WHERE u.level='A' LIMIT 10;

-- ---------------------------------------------
-- 9. TOURNAMENTS (all statuses & formats)
-- ---------------------------------------------
INSERT INTO tournaments (organizer_id, name, game, platform, start_date, end_date, max_participants, prize_pool, status, is_private, location)
SELECT u.id,
       'Tournament '||row_number() over(),
       (ARRAY('FIFA 24','COD','PES','NBA 2K','Fortnite'))[1+ (row_number() over()%5)],
       unnest('{PC,PLAYSTATION,XBOX,NINTENDO_SWITCH,MOBILE,VR,OTHER}'::platform_enum[]),
       NOW() + (row_number() over()||' days')::interval,
       NOW() + ((row_number() over()+7)||' days')::interval,
       32,
       10000,
       unnest('{UPCOMING,LIVE,COMPLETED,CANCELLED}'::tournament_status_enum[]),
       false,
       'Paris'
FROM users u WHERE 'TOURNAMENT_ORGANIZER'=ANY(u.account_types) LIMIT 8;

-- ---------------------------------------------
-- 10. TOURNAMENT_MEMBERS (all participation_status)
-- ---------------------------------------------
INSERT INTO tournament_members (tournament_id, user_id, role, status, score, is_verified)
SELECT t.id, u.id, 'PARTICIPANT', unnest('{REGISTERED,PARTICIPATED,DISQUALIFIED,WINNER,ELIMINATED}'::participation_status_enum[]), floor(random()*100), true
FROM tournaments t, users u
WHERE u.level IN ('A','B') LIMIT 40;

-- ---------------------------------------------
-- 11. TOURNAMENT_PHASES (all formats)
-- ---------------------------------------------
INSERT INTO tournament_phases (tournament_id, name, type, order, is_active, is_completed)
SELECT t.id, 'Phase '||row_number() over(), unnest('{ELIMINATION,GROUP_STAGE,ROUND_ROBIN,SWISS,KNOCKOUT,CUSTOM}'::tournament_format_enum[]), 1, false, false
FROM tournaments t LIMIT 6;

-- ---------------------------------------------
-- 12. GAMES & GAME_ITEMS (all platforms & types)
-- ---------------------------------------------
INSERT INTO games (name, description, platforms, genre, is_active, featured)
VALUES 
('FIFA 24', 'Football simulation', '{PC,PLAYSTATION,XBOX}', 'Sport', true, true),
('COD MW',  'Shooter game',         '{PC,XBOX,MOBILE}',      'FPS',   true, false);

INSERT INTO game_items (game_id, name, type, price_gtc, availability, is_active)
SELECT g.id, 
       'Item '||row_number() over(),
       unnest('{COIN,ITEM,SKIN,EQUIPMENT,CURRENCY}'::game_item_type_enum[]),
       100 + (row_number() over()*10),
       'AVAILABLE',
       true
FROM games g LIMIT 15;

-- ---------------------------------------------
-- 13. POSTS & MESSAGES
-- ---------------------------------------------
INSERT INTO posts (author_id, content, is_story, is_active)
SELECT u.id, 'Post by '||u.username, false, true FROM users u LIMIT 20;

INSERT INTO messages (sender_id, recipient_id, content, read, is_active)
SELECT u1.id, u2.id, 'Hello from '||u1.username, false, true
FROM users u1, users u2 WHERE u1.id<>u2.id LIMIT 30;

-- ---------------------------------------------
-- 14. GROUPS & GROUP_MEMBERS (all roles)
-- ---------------------------------------------
INSERT INTO groups (creator_id, name, is_private)
SELECT u.id, 'Group '||u.username, false FROM users u WHERE u.level='A' LIMIT 5;

INSERT INTO group_members (group_id, user_id, role)
SELECT g.id, u.id, unnest('{OWNER,ADMIN,MEMBER}'::group_role_enum[])
FROM groups g, users u LIMIT 20;

-- ---------------------------------------------
-- 15. INTERACTIONS (all types)
-- ---------------------------------------------
INSERT INTO interactions (user_id, entity_id, entity_type, type)
SELECT u.id, p.id, 'POST', unnest('{LIKE,FOLLOW,BOOKMARK,VIEW}'::interaction_type_enum[])
FROM users u, posts p LIMIT 50;

-- ---------------------------------------------
-- 16. NOTIFICATIONS & PUSH_SUBSCRIPTIONS
-- ---------------------------------------------
INSERT INTO notifications (user_id, title, message, type, read)
SELECT u.id, 'Welcome', 'Welcome to GT v2', 'SYSTEM', false FROM users u LIMIT 10;

INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth)
SELECT u.id, 'https://push.gt/'||u.id, 'p256dh_'||u.id, 'auth_'||u.id FROM users u WHERE is_active LIMIT 10;

-- ---------------------------------------------
-- 17. BLOGS, SERVICES, GUIDES, STEPS
-- ---------------------------------------------
INSERT INTO blogs (author_id, title, content, is_active)
SELECT u.id, 'Blog by '||u.username, 'Content here', true FROM users u WHERE u.is_admin LIMIT 3;

INSERT INTO services (admin_id, title, description, is_active)
SELECT u.id, 'Service '||u.username, 'Description here', true FROM users u WHERE u.is_admin LIMIT 3;

INSERT INTO guides (admin_id, title, category, is_active)
SELECT u.id, 'Guide '||u.username, 'General', true FROM users u WHERE u.is_admin LIMIT 3;

INSERT INTO guide_steps (guide_id, order, title, content)
SELECT g.id, 1, 'Step 1', 'Do this' FROM guides g;

-- ---------------------------------------------
-- 18. APP_SETTINGS (single row with all limits)
-- ---------------------------------------------
INSERT INTO app_settings (
  max_products_regular, max_products_vip, max_shops_regular, max_shops_vip,
  max_tournaments_regular, max_tournaments_vip, story_duration_hours,
  max_stories_per_day_regular, max_stories_per_day_vip, transaction_fee_percentage,
  purchase_fee_percentage, deposit_fee_percentage, withdrawal_fee_percentage,
  transfer_fee_percentage, tournament_participation_fee_percentage,
  gtc_to_fcfa_rate, vip_monthly_price, vip_yearly_price,
  free_themes_limit_regular, free_themes_limit_vip, max_theme_creations_regular,
  max_theme_creations_vip, can_vip_create_themes, can_vip_sell_themes,
  theme_creation_fee, theme_sale_commission_percentage, max_participants_per_tournament,
  max_co_organizers_ratio, game_items_enabled, game_item_commission_percentage,
  min_game_item_request, max_game_item_request, default_user_balance
) VALUES (
  5, 20, 1, 5, 1, 5, 48, 3, 10, 0.001,
  0.01, 0.00, 0.02, 0.005, 0.01,
  500.0, 250, 2500, 2, 10, 0, 5, true, true,
  0.0, 0.15, 32, 0.33, true, 0.05,
  1.0, 1000.0, 250
);
