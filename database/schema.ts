// @/database/schema.ts
import {
  pgTable, uuid, text, timestamp, boolean, jsonb,
  numeric, integer, uniqueIndex, index, foreignKey,
  primaryKey, pgEnum, real
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================================================
// ENUMS
// ============================================================================

export const accountTypeEnum = pgEnum('account_type', ['SELLER', 'BUYER', 'TRADER', 'TOURNAMENT_ORGANIZER', 'VIP']);
export const userLevelEnum = pgEnum('user_level', ['A', 'B', 'C']);
export const VerificationEnum = pgEnum('verification_status', ['PENDING', 'VERIFIED', 'REJECTED']);
export const teamRoleEnum = pgEnum('team_role', ['PLAYER', 'COACH', 'MANAGER', 'SUBSTITUTE', 'CAPTAIN', 'VICE_CAPTAIN']);
export const tournamentStatusEnum = pgEnum('tournament_status', ['UPCOMING', 'LIVE', 'COMPLETED', 'CANCELLED']);
export const tournamentFormatEnum = pgEnum('tournament_format', ['ELIMINATION', 'GROUP_STAGE', 'ROUND_ROBIN', 'SWISS', 'KNOCKOUT', 'CUSTOM']);
export const matchStatusEnum = pgEnum('match_status', ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
export const transactionStatusEnum = pgEnum('transaction_status', ['PENDING', 'COMPLETED', 'PROCESSING', 'FAILED', 'REFUNDED']);
export const transactionTypeEnum = pgEnum('transaction_type', [
  'PURCHASE', 'VIP_SUBSCRIPTION', 'GAME_ITEM_PURCHASE', 'THEME_PURCHASE',
  'DEPOSIT', 'WITHDRAWAL', 'REFUND', 'TRANSFER', 'ORDER_PURCHASE', 'TOURNAMENT_PARTICIPATION', 'BONUS'
]);
export const orderStatusEnum = pgEnum('order_status', ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED']);
export const participationStatusEnum = pgEnum('participation_status', ['REGISTERED', 'PARTICIPATED', 'DISQUALIFIED', 'WINNER', 'ELIMINATED']);
export const entityTypeEnum = pgEnum('entity_type', [
  'PRODUCT', 'POST', 'SHOP', 'TOURNAMENT', 'USER', 'BLOG', 
  'MESSAGE', 'TEAM', 'THEME', 'NEWS', 'GROUP', 'ANNOUNCEMENT', 
  'SERVICE', 'GUIDE', 'COMMENT', 'MATCH', 'GAME', 'GAME_ITEM', 'GAMECLIP', 
  'PARTNER'
]);
export const productStatusEnum = pgEnum('product_status', ['NON_VENDU', 'RESERVE', 'EN_ECHANGE', 'LIVRE', 'VENDU', 'ANNULER']);
export const interactionTypeEnum = pgEnum('interaction_type', ['LIKE', 'FOLLOW', 'BOOKMARK', 'VIEW', 'SHARE']);
export const platformEnum = pgEnum('platform', ['PC', 'PLAYSTATION', 'XBOX', 'NINTENDO_SWITCH', 'MOBILE', 'VR', 'OTHER']);
export const gameItemTypeEnum = pgEnum('game_item_type', ['COIN', 'ITEM', 'SKIN', 'EQUIPMENT', 'CURRENCY']);
export const gameItemStatusEnum = pgEnum('game_item_status', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']);
export const vipPlanTypeEnum = pgEnum('vip_plan_type', ['MONTHLY', 'YEARLY', 'LIFETIME']);
export const vipStatusEnum = pgEnum('vip_status', ['ACTIVE', 'EXPIRED', 'CANCELLED']);
export const groupRoleEnum = pgEnum('group_role', ['OWNER', 'ADMIN', 'MEMBER']);
export const announcementTypeEnum = pgEnum('announcement_type', ['ANNOUNCEMENT', 'NEWS', 'UPDATE']);
export const traceTypeEnum = pgEnum('trace_type', [
  'SIGNIN', 'SIGNOUT', 'REGISTER', 'NAVIGATION', 'PURCHASE',
  'TRANSFER', 'DEPOSIT', 'VIEW', 'LIKE', 'FOLLOW', 'BOOKMARK',
  'CLAIM', 'ERROR', 'EXPLANATION_SHOWN', 'EXPLANATION_COMPLETED',
  'EXPLANATION_SKIPPED', 'UPDATE_SETTINGS', 'OTHER', 'ACTION',
  'REFRESH_DATA', 'MARK_ANNOUNCEMENT_READ', 'MARK_ALL_ANNOUNCEMENTS_READ',
  'MAINTENANCE_MODE_DISABLED', 'MAINTENANCE_MODE_ENABLED', 'UPDATE_EXCHANGE_RATES'
]);

export const mediaTypeEnum = pgEnum('media_type', ['image', 'video', 'document', 'audio', 'other']);
export const mediaStatusEnum = pgEnum('media_status', ['ACTIVE', 'PROCESSING', 'DELETED']);
export const mediaPrivacyEnum = pgEnum('media_privacy', ['PUBLIC', 'PRIVATE', 'FRIENDS']);


// ============================================================================
// PARTENAIRES ET PARTENARIATS
// ============================================================================

export const partnerTypeEnum = pgEnum('partner_type', [
  'SPONSOR', 'MEDIA', 'TECHNOLOGY', 'FINANCIAL', 'ESPORTS', 'GAMING',
  'STREAMING', 'EQUIPMENT', 'FOOD_BEVERAGE', 'FASHION', 'TELECOM',
  'SOFTWARE', 'HARDWARE', 'PUBLISHER', 'DISTRIBUTOR', 'OTHER'
]);

export const partnershipStatusEnum = pgEnum('partnership_status', [
  'PENDING', 'ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED', 'EXPIRED'
]);

export const partnershipTierEnum = pgEnum('partnership_tier', [
  'BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'EXCLUSIVE'
]);

// ============================================================================
// TABLES PRINCIPALES
// ============================================================================

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  authUid: text('auth_uid').unique(),
  email: text('email').unique().notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  username: text('username').unique(),
  fullName: text('full_name'),
  profileImage: text('profile_image'),
  coverImage: text('cover_image'),
  bio: text('bio'),
  website: text('website'),
  country: text('country'),
  countryCode: text('country_code'),
  socialMedia: jsonb('social_media').default(["games-trafics"]),

  // Données privées
  phoneNumber: text('phone_number'),
  address: jsonb('address'),
  isPublicProfile: boolean('is_public_profile').default(true),
  isVip: boolean('is_vip').default(false),
  isAdmin: boolean('is_admin').default(false),
  isActive: boolean('is_active').default(true),
  isDeleted: boolean('is_deleted').default(false),
  isAnonymous: boolean("is_anonymous").default(false),

  // // role
  role: text('role').default('user'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  // Settings
  settings: jsonb('settings').default({}),
  accountTypes: text('account_types').array().default(['BUYER']),
  level: userLevelEnum('level').default('C'),

  shopsCreatedCount: integer('shops_created_count').default(0),
  tournamentsCreatedCount: integer('tournaments_created_count').default(0),
  postsCreatedCount: integer('posts_created_count').default(0),

  metadata: jsonb('metadata').default({}),
  lastLoginMethod: text('last_login_method'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  lastLogin: timestamp('last_login'),
}, (table) => [
  index('users_email_idx').on(table.email),
  index('users_username_idx').on(table.username),
  index('users_auth_uid_idx').on(table.authUid)
]);

export const session = pgTable("session", {
	id: text("id").primaryKey(),
	expiresAt: timestamp("expires_at").notNull(),
	token: text("token").notNull().unique(),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
	ipAddress: text("ip_address"),
  impersonatedBy: text("impersonated_by"),
	userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
});

export const account = pgTable("account", {
	id: text("id").primaryKey(),
	accountId: text("account_id").notNull(),
	providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
	accessToken: text("access_token"),
	refreshToken: text("refresh_token"),
	idToken: text("id_token"),
	accessTokenExpiresAt: timestamp("access_token_expires_at"),
	refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
	scope: text("scope"),
	password: text("password"),
	createdAt: timestamp("created_at").notNull(),
	updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
	id: text("id").primaryKey(),
	identifier: text("identifier").notNull(),
	value: text("value").notNull(),
	expiresAt: timestamp("expires_at").notNull(),
	createdAt: timestamp("created_at"),
	updatedAt: timestamp("updated_at"),
});

export const passkey = pgTable("passkey", {
  id: text("id").primaryKey(),
  name: text("name"),
  publicKey: text("public_key").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  credentialID: text("credential_id").notNull(),
  counter: integer("counter").notNull(),
  deviceType: text("device_type").notNull(),
  backedUp: boolean("backed_up").notNull(),
  transports: text("transports"),
  createdAt: timestamp("created_at"),
  aaguid: text("aaguid"),
});


// export const twoFactors = pgTable("two_factors", {
// 	id: text("id").primaryKey(),
// 	secret: text("secret").notNull(),
// 	backupCodes: text("backup_codes").notNull(),
// 	userId: text("user_id")
// 		.notNull()
// 		.references(() => users.id),
// });

export const userWallets = pgTable('user_wallets', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  cardNumberHash: text('card_number_hash').unique(),
  pinHash: text('pin_hash').notNull(),
  balance: numeric('balance', { precision: 15, scale: 2 }).default('0'),
  isActive: boolean('is_active').default(false),
  isLocked: boolean('is_locked').default(false),
  isDeleted: boolean('is_deleted').default(false),
  failedAttempts: integer('failed_attempts').default(0),
  lastFailedAttempt: timestamp('last_failed_attempt'),

  // Vérification identité
  identityDocumentType: text('identity_document_type'),
  identityDocumentUrl: text('identity_document_url'),
  verificationStatus: VerificationEnum('verification_status').default('PENDING'),
  verifiedAt: timestamp('verified_at'),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  uniqueIndex('wallet_user_unique').on(table.userId),
  index('wallet_user_id_idx').on(table.userId)
]);

export const walletTransactions = pgTable('wallet_transactions', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  walletId: text('wallet_id').notNull().references(() => userWallets.id),
  fromUserId: text('from_user_id').references(() => users.id),
  toUserId: text('to_user_id').references(() => users.id),

  // Montants
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  fees: numeric('fees', { precision: 15, scale: 2 }).default('0'),
  netAmount: numeric('net_amount', { precision: 15, scale: 2 }).notNull(),
  balanceAfter: numeric('balance_after', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').default('GTC'),

  // Type de transaction
  type: transactionTypeEnum('type').notNull(),

  // Métadonnées selon le type
  metadata: jsonb('metadata').default({}),

  // Statut
  status: transactionStatusEnum('status').default('PENDING'),
  isDeleted: boolean('is_deleted').default(false),

  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('transactions_wallet_id_idx').on(table.walletId),
  index('transactions_type_status_idx').on(table.type, table.status),
  index('transactions_created_at_idx').on(table.createdAt),
  index('transactions_from_user_idx').on(table.fromUserId),
  index('transactions_to_user_idx').on(table.toUserId)
]);

export const receipts = pgTable('receipts', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  transactionId: text('transaction_id').notNull().references(() => walletTransactions.id, { onDelete: 'cascade' }),

  // Receipt details
  receiptNumber: text('receipt_number').unique().notNull(),
  title: text('title').notNull(),
  description: text('description'),
  type: transactionTypeEnum('type').notNull(),

  // Amounts
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').default('GTC'),
  fees: numeric('fees', { precision: 15, scale: 2 }).default('0'),
  netAmount: numeric('net_amount', { precision: 15, scale: 2 }).notNull(),

  // Status and visibility
  status: transactionStatusEnum('status').default('COMPLETED'),
  isDeleted: boolean('is_deleted').default(false),

  // Metadata and files
  metadata: jsonb('metadata').default({}),
  fileUrl: text('file_url'),
  fileName: text('file_name'),
  fileSize: integer('file_size'),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('receipts_user_idx').on(table.userId),
  index('receipts_transaction_idx').on(table.transactionId),
  index('receipts_receipt_number_idx').on(table.receiptNumber),
  index('receipts_created_at_idx').on(table.createdAt)
]);



export const vipSubscriptions = pgTable('vip_subscriptions', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  planType: vipPlanTypeEnum('plan_type').default('MONTHLY'),
  status: vipStatusEnum('status').default('ACTIVE'),

  // Période
  startDate: timestamp('start_date').defaultNow(),
  endDate: timestamp('end_date').notNull(),
  autoRenew: boolean('auto_renew').default(true),

  // Prix
  pricePaid: numeric('price_paid', { precision: 10, scale: 2 }),
  currency: text('currency').default('GTC'),
  transactionId: text('transaction_id').references(() => walletTransactions.id),

  // Bénéfices actifs
  activeBenefits: jsonb('active_benefits').default([]),
  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  uniqueIndex('vip_user_unique').on(table.userId),
  index('vip_user_status_idx').on(table.userId, table.status)
]);



export const partners = pgTable('partners', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  
  // Informations de base
  name: text('name').notNull(),
  legalName: text('legal_name'),
  slug: text('slug').unique(),
  description: text('description'),
  shortDescription: text('short_description'),
  
  // Type et catégorie
  type: partnerTypeEnum('type').notNull(),
  categories: text('categories').array().default([]),
  tags: text('tags').array().default([]),
  
  // Branding
  logo: text('logo'),
  coverImage: text('cover_image'),
  brandColors: text('brand_colors').array().default([]),
  website: text('website'),
  
  // Contact
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  contactPerson: text('contact_person'),
  contactTitle: text('contact_title'),
  
  // Adresse
  country: text('country'),
  city: text('city'),
  address: jsonb('address'),
  
  // Social media
  socialMedia: jsonb('social_media').default([]),
  
  // Statut et visibilité
  status: partnershipStatusEnum('status').default('PENDING'),
  isActive: boolean('is_active').default(true),
  isVisible: boolean('is_visible').default(true),
  isDeleted: boolean('is_deleted').default(false),
  verified: boolean('verified').default(false),
  
  // Statistiques
  totalPartnerships: integer('total_partnerships').default(0),
  totalInvestment: numeric('total_investment', { precision: 15, scale: 2 }).default('0'),
  viewCount: integer('view_count').default(0),
  
  // Métadonnées
  metadata: jsonb('metadata').default({}),
  internalNotes: text('internal_notes'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('partners_type_idx').on(table.type),
  index('partners_status_idx').on(table.status),
  index('partners_verified_idx').on(table.verified),
  index('partners_slug_idx').on(table.slug),
  index('partners_name_idx').on(table.name)
]);

export const partnerships = pgTable('partnerships', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  partnerId: text('partner_id').notNull().references(() => partners.id, { onDelete: 'cascade' }),
  
  // Informations du partenariat
  title: text('title').notNull(),
  description: text('description'),
  type: text('type').notNull(), // "SPONSORSHIP", "MEDIA_PARTNERSHIP", "TECH_PARTNERSHIP", etc.
  
  // Tier et niveau
  tier: partnershipTierEnum('tier').default('BRONZE'),
  priority: integer('priority').default(0),
  
  // Dates
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  renewalDate: timestamp('renewal_date'),
  
  // Valeur et investissement
  totalValue: numeric('total_value', { precision: 15, scale: 2 }).default('0'),
  currency: text('currency').default('GTC'),
  paymentTerms: text('payment_terms'),
  paymentSchedule: jsonb('payment_schedule').default([]),
  
  // Deliverables et obligations
  partnerDeliverables: jsonb('partner_deliverables').default([]),
  ourDeliverables: jsonb('our_deliverables').default([]),
  kpis: jsonb('kpis').default({}),
  milestones: jsonb('milestones').default([]),
  
  // Assets et ressources
  assetsProvided: jsonb('assets_provided').default([]),
  resourceAllocation: jsonb('resource_allocation').default({}),
  
  // Exclusivité
  isExclusive: boolean('is_exclusive').default(false),
  exclusivityScope: text('exclusivity_scope'),
  exclusivityDuration: text('exclusivity_duration'),
  
  // Statut et gestion
  status: partnershipStatusEnum('status').default('PENDING'),
  progress: integer('progress').default(0),
  
  // Performance et métriques
  performanceScore: numeric('performance_score', { precision: 5, scale: 2 }).default('0'),
  roi: numeric('roi', { precision: 5, scale: 2 }).default('0'),
  metrics: jsonb('metrics').default({}),
  
  // Relations avec d'autres entités
  relatedEntityType: entityTypeEnum('related_entity_type'),
  relatedEntityId: text('related_entity_id'),
  
  // Documents et contrats
  contractUrl: text('contract_url'),
  contractStatus: text('contract_status').default('DRAFT'),
  signedAt: timestamp('signed_at'),
  
  // Contact pour ce partenariat
  partnerContact: text('partner_contact'),
  partnerContactEmail: text('partner_contact_email'),
  
  // Notes et communication
  notes: text('notes'),
  communicationLog: jsonb('communication_log').default([]),
  
  // Flags
  isActive: boolean('is_active').default(true),
  isDeleted: boolean('is_deleted').default(false),
  autoRenew: boolean('auto_renew').default(false),
  
  // Métadonnées
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('partnerships_partner_idx').on(table.partnerId),
  index('partnerships_status_idx').on(table.status),
  index('partnerships_tier_idx').on(table.tier),
  index('partnerships_dates_idx').on(table.startDate, table.endDate),
  index('partnerships_related_entity_idx').on(table.relatedEntityType, table.relatedEntityId),
  index('partnerships_type_idx').on(table.type)
]);


// ============================================================================
// BOUTIQUES ET PRODUITS
// ============================================================================

export const themes = pgTable('themes', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  creatorId: text('creator_id').references(() => users.id),

  name: text('name').unique().notNull(),
  description: text('description'),

  isPremium: boolean('is_premium').default(false),
  price: numeric('price', { precision: 8, scale: 2 }).default('0'),

  // Médias
  thumbnail: text('thumbnail'),
  previewImages: text('preview_images').array().default([]),

  // Configuration
  config: jsonb('config').notNull(),
  category: text('category'),
  tags: text('tags').array().default([]),

  // Stats
  downloads: integer('downloads').default(0),
  viewCount: integer('view_count').default(0),

  isActive: boolean('is_active').default(true),
  isPublic: boolean('is_public').default(true),
  isCopy: boolean('is_copy').default(false),
  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('themes_creator_idx').on(table.creatorId),
  index('themes_category_idx').on(table.category)
]);

export const shops = pgTable('shops', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').unique().notNull(),
  description: text('description'),
  profileImage: text('profile_image'),
  coverImage: text('cover_image'),

  // Contact
  phoneNumber: text('phone_number'),
  country: text('country'),
  address: jsonb('address'),
  website: text('website'),
  socialMedia: jsonb('social_media').default([]),

  // Stats
  productCount: integer('product_count').default(0),
  viewCount: integer('view_count').default(0),
  balance: numeric('balance', { precision: 15, scale: 2 }).default('0'),

  // Status
  verified: boolean('verified').default(false),
  featured: boolean('featured').default(false),
  isActive: boolean('is_active').default(true),
  isVisible: boolean('is_visible').default(true),
  isDeleted: boolean('is_deleted').default(false),

  // Thème
  themeId: text('theme_id').references(() => themes.id),
  customTheme: jsonb('custom_theme'),

  // Notifications
  notificationSettings: jsonb('notification_settings').default({
    notifyOnNewOrder: true,
    notifyOnNeworder: true,
    channels: ['IN_APP']
  }),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('shops_owner_idx').on(table.ownerId),
  index('shops_verified_idx').on(table.verified)
]);

// ============================================================================
// CATÉGORIES UNIFIÉES
// ============================================================================

export const categories = pgTable('categories', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  description: text('description'),
  slug: text('slug').unique().notNull(),
  icon: text('icon'),
  color: text('color'),
  image: text('image'),

  // Hiérarchie avancée
  parentId: text('parent_id').references((): any => categories.id),
  level: integer('level').default(0),
  path: text('path'),
  fullPath: text('full_path'), // Chemin complet "sports/football/fifa-24"

  // Filtrage et organisation
  applicableEntities: entityTypeEnum('applicable_entities').array().notNull().default(['PRODUCT']),
  filters: jsonb('filters').default({}), // Filtres spécifiques
  sortOrder: integer('sort_order').default(0),

  // Métadonnées riches
  metadata: jsonb('metadata').default({}),

  // Stats
  itemCount: integer('item_count').default(0),
  isFeatured: boolean('is_featured').default(false),
  isActive: boolean('is_active').default(true),
  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('categories_slug_idx').on(table.slug),
  index('categories_parent_idx').on(table.parentId),
  index('categories_path_idx').on(table.path),
  index('categories_entities_idx').on(table.applicableEntities),
  index('categories_sort_idx').on(table.sortOrder)
]);

// Table de jointure entre les catégories et les entités (si non liées directement, ex: Shop)
export const entityCategories = pgTable('entity_categories', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  entityId: text('entity_id').notNull(),
  entityType: entityTypeEnum('entity_type').notNull(),
  categoryId: text('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  
  createdAt: timestamp('created_at').defaultNow(),
  
}, (table) => [
  uniqueIndex('entity_category_unique').on(table.entityId, table.entityType, table.categoryId),
  index('entity_categories_entity_idx').on(table.entityId, table.entityType),
  index('entity_categories_category_idx').on(table.categoryId)
]);

export const products = pgTable('products', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  shopId: text('shop_id').notNull().references(() => shops.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id),
  categoryId: text('category_id').references(() => categories.id), // Catégorie principale

  name: text('name').notNull(),
  description: text('description'),
  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('GTC'),

  // Médias
  images: text('images').array().default([]),
  video: text('video'),
  featuredImage: text('featured_image'),

  // Jeu/Plateforme
  game: text('game'),
  platform: platformEnum('platform').default('MOBILE'),

  // Catégories (tags ou catégories secondaires, le champ categoryId est pour la principale)
  categories: text('categories').array().default([]),

  // Status du produit
  status: productStatusEnum('status').default('NON_VENDU'),

  // Compte (crypté)
  accountLogin: text('account_login'),
  encryptedPassword: text('encrypted_password'),
  accountLevel: text('account_level'),
  accountRank: text('account_rank'),

  // Stats
  viewCount: integer('view_count').default(0),

  // Livraison
  deliveredToUserId: text('delivered_to_user_id').references(() => users.id),
  deliveredAt: timestamp('delivered_at'),

  // Flags
  isActive: boolean('is_active').default(true),
  isVisible: boolean('is_visible').default(true),
  isFeatured: boolean('is_featured').default(false),
  isNegotiable: boolean('is_negotiable').default(false),
  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('products_shop_idx').on(table.shopId),
  index('products_user_idx').on(table.userId),
  index('products_status_idx').on(table.status),
  index('products_game_idx').on(table.game)
]);

export const orders = pgTable('orders', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  productId: text('product_id').notNull().references(() => products.id),
  buyerId: text('buyer_id').notNull().references(() => users.id),
  shopId: text('shop_id').notNull().references(() => shops.id),

  price: numeric('price', { precision: 10, scale: 2 }).notNull(),
  message: text('message'),
  status: orderStatusEnum('status').default('PENDING'),

  // Échange produit contre produit
  orderType: text('order_type').default('PURCHASE'),
  orderedProductId: text('ordered_product_id').references(() => products.id),

  expiresAt: timestamp('expires_at'),
  rejectionReason: text('rejection_reason'),
  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('orders_product_idx').on(table.productId),
  index('orders_buyer_idx').on(table.buyerId)
]);

// ============================================================================
// TOURNOIS ET ÉQUIPES
// ============================================================================

export const teams = pgTable('teams', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').notNull(),
  logo: text('logo'),
  colors: text('colors').array().default([]),
  country: text('country'),
  city: text('city'),
  foundedYear: integer('founded_year'),
  website: text('website'),
  achievements: text('achievements').array().default([]),
  ranking: integer('ranking'),
  division: text('division'),
  registrationId: text('registration_id').unique(),
  maxSquadSize: integer('max_squad_size').default(25),
  currentSquadSize: integer('current_squad_size').default(0),
  homeStadium: text('home_stadium'),
  preferredFormation: text('preferred_formation'),
  strategy: text('strategy'),
  isActive: boolean('is_active').default(true),

  // Relations
  captainId: text('captain_id').references(() => users.id),
  viceCaptainId: text('vice_captain_id').references(() => users.id),

  socialMedia: jsonb('social_media').default([]),
  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const teamMembers = pgTable('team_members', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: teamRoleEnum('role').default('PLAYER'),
  position: text('position'),
  joinedAt: timestamp('joined_at').defaultNow(),
  isActive: boolean('is_active').default(true),
}, (table) => [
  uniqueIndex('team_member_unique').on(table.teamId, table.userId)
]);

export const tournaments = pgTable('tournaments', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  organizerId: text('organizer_id').notNull().references(() => users.id),

  // Identité et présentation
  name: text('name').unique().notNull(),
  slug: text('slug').unique(), // Pour URLs SEO-friendly
  description: text('description'),
  shortDescription: text('short_description'),
  profileImage: text('profile_image'),
  coverImage: text('cover_image'),

  // Jeu et configuration
  game: text('game').notNull(),
  platform: platformEnum('platform').default('MOBILE'),
  gameMode: text('game_mode'), // "1v1", "2v2", "5v5"
  allowedTeams: boolean('allowed_teams').default(false),

  // Règles permanentes
  rules: text('rules'),
  requirements: text('requirements'),
  codeOfConduct: text('code_of_conduct'),

  // Configuration des participants
  maxParticipantsPerEdition: integer('max_participants_per_edition').default(32),
  minParticipants: integer('min_participants').default(2),

  // Visibilité et accès
  visibility: text('visibility').default('PUBLIC'), // PUBLIC, PRIVATE, UNLISTED
  requiresAccessCode: boolean('requires_access_code').default(false),
  accessCode: text('access_code'),
  inviteOnly: boolean('invite_only').default(false),

  // Contact et communication
  contactEmail: text('contact_email'),
  contactPhone: text('contact_phone'),
  discordServer: text('discord_server'),
  whatsappGroup: text('whatsapp_group'),
  socialMedia: jsonb('social_media').default([]),

  // Thème et apparence
  themeId: text('theme_id').references(() => themes.id),
  customTheme: jsonb('custom_theme'),
  customConfig: jsonb('custom_config'),

  // Statistiques globales
  totalEditions: integer('total_editions').default(0),
  totalParticipants: integer('total_participants').default(0),
  totalPrizePool: numeric('total_prize_pool', { precision: 15, scale: 2 }).default('0'),
  viewCount: integer('view_count').default(0),
  followerCount: integer('follower_count').default(0),

  // État et métadonnées
  status: tournamentStatusEnum('status').default('UPCOMING'),
  featured: boolean('featured').default(false),
  verified: boolean('verified').default(false),
  
  isActive: boolean('is_active').default(true),
  isDeleted: boolean('is_deleted').default(false),

  // Métadonnées additionnelles
  tags: text('tags').array().default([]),
  categories: text('categories').array().default([]),
  metadata: jsonb('metadata').default({}),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('tournaments_organizer_idx').on(t.organizerId),
  index('tournaments_game_idx').on(t.game),
  index('tournaments_status_idx').on(t.status),
  index('tournaments_visibility_idx').on(t.visibility),
  index('tournaments_featured_idx').on(t.featured),
  index('tournaments_slug_idx').on(t.slug),
  index('tournaments_created_at_idx').on(t.createdAt),
  index('tournaments_platform_idx').on(t.platform),
]);

// ============================================================================
// ÉDITIONS DE TOURNOI
// ============================================================================
export const tournamentEditions = pgTable('tournament_editions', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: text('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),

  // Identification de l'édition
  editionNumber: integer('edition_number').notNull(),
  name: text('name'), // "Édition 2024", "Tournoi d'Hiver"
  tagline: text('tagline'),
  editionSlug: text('edition_slug'), // "edition-2024"
  description: text('description'), // Description détaillée de l'édition du tournoi

  // Dates clés
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  registrationOpens: timestamp('registration_opens'),
  registrationDeadline: timestamp('registration_deadline'),
  checkinStarts: timestamp('checkin_starts'), // Pour les check-ins
  checkinEnds: timestamp('checkin_ends'),

  // Participants
  maxParticipants: integer('max_participants'),
  currentParticipants: integer('current_participants').default(0),
  checkedInParticipants: integer('checked_in_participants').default(0),

  // Prix et récompenses
  prizePool: numeric('prize_pool', { precision: 15, scale: 2 }).default('0'),
  prizeCurrency: text('prize_currency').default('GTC'),
  prizeDistribution: jsonb('prize_distribution').default([]), // [{position: 1, percentage: 50}, ...]

  entryFee: numeric('entry_fee', { precision: 10, scale: 2 }).default('0'),
  // Configuration spécifique
  editionRules: text('edition_rules'),
  editionRequirements: text('edition_requirements'),
  editionConfig: jsonb('edition_config').default({
    checkinRequired: false,
    autoStart: true,
    seedMethod: 'RANDOM',
    tiebreakerRules: {}
  }),

  // Statut et progression
  status: tournamentStatusEnum('status').default('UPCOMING'),
  progress: integer('progress').default(0), // Pourcentage de complétion

  // Lieu et format
  location: text('location'),
  locationType: text('location_type').default('ONLINE'), // ONLINE, VENUE, HYBRID
  virtualLink: text('virtual_link'),
  streamLink: text('stream_link'),

  // Statistiques
  viewCount: integer('view_count').default(0),
  matchCount: integer('match_count').default(0),
  completedMatchCount: integer('completed_match_count').default(0),

  // Gestion
  notificationsEnabled: boolean('notifications_enabled').default(true),
  autoAdvance: boolean('auto_advance').default(true),

  isActive: boolean('is_active').default(true),
  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('editions_tournament_idx').on(t.tournamentId),
  index('editions_status_idx').on(t.status),
  index('editions_dates_idx').on(t.startDate, t.endDate),
  index('editions_edition_number_idx').on(t.tournamentId, t.editionNumber),
  index('editions_location_type_idx').on(t.locationType),
  uniqueIndex('tournament_edition_unique').on(t.tournamentId, t.editionNumber),
  uniqueIndex('edition_slug_unique').on(t.editionSlug).where(sql`${t.editionSlug} IS NOT NULL`),
]);

// ============================================================================
// MEMBRES DE TOURNOI (permanents)
// ============================================================================
export const tournamentMembers = pgTable('tournament_members', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  tournamentId: text('tournament_id').notNull().references(() => tournaments.id, { onDelete: 'cascade' }),

  // Référence utilisateur ou équipe
  userId: text('user_id').references(() => users.id),
  teamId: text('team_id').references(() => teams.id),

  // Rôle principal
  role: text('role').notNull().default('PARTICIPANT'), 
  // Roles disponibles: ORGANIZER, CO_ORGANIZER, REFEREE, PARTICIPANT, SPECTATOR, COMMENTATOR

  // Permissions spécifiques
  permissions: text('permissions').array().default([]),
  isCoOrganizer: boolean('is_co_organizer').default(false),

  // Informations d'affichage
  displayName: text('display_name'),
  gameTag: text('game_tag'),
  avatar: text('avatar'),
  banner: text('banner'),

  // Informations de contact
  contactPhone: text('contact_phone'),
  contactEmail: text('contact_email'),
  discordId: text('discord_id'),
  
  clubName: text('club_name'),
  biography: text('biography'),
  achievements: text('achievements').array().default([]),

  // Statistiques globales
  totalEditions: integer('total_editions').default(0),
  totalWins: integer('total_wins').default(0),
  totalLosses: integer('total_losses').default(0),
  totalMatches: integer('total_matches').default(0),
  rankingPoints: integer('ranking_points').default(0),
  winRate: numeric('win_rate', { precision: 5, scale: 2 }).default('0'),
  bestPosition: integer('best_position'),

  // État et vérification
  isVerified: boolean('is_verified').default(false),
  verificationLevel: text('verification_level').default('BASIC'), // BASIC, INTERMEDIATE, ADVANCED
  isActive: boolean('is_active').default(true),
  isBanned: boolean('is_banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),

  // Métadonnées
  metadata: jsonb('metadata').default({}),
  preferences: jsonb('preferences').default({
    notifications: true,
    emailUpdates: true,
    publicProfile: true
  }),

  joinedAt: timestamp('joined_at').defaultNow(),
  lastActive: timestamp('last_active'),
  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  // Contraintes d'unicité
  uniqueIndex('tournament_member_user_unique').on(t.tournamentId, t.userId)
    .where(sql`${t.userId} IS NOT NULL`),
  uniqueIndex('tournament_member_team_unique').on(t.tournamentId, t.teamId)
    .where(sql`${t.teamId} IS NOT NULL`),
  
  // Index de recherche
  index('tournament_members_tournament_idx').on(t.tournamentId),
  index('tournament_members_user_idx').on(t.userId),
  index('tournament_members_team_idx').on(t.teamId),
  index('tournament_members_role_idx').on(t.role),
  index('tournament_members_active_idx').on(t.isActive, t.isBanned),
  index('tournament_members_ranking_idx').on(t.rankingPoints),
  index('tournament_members_joined_at_idx').on(t.joinedAt),
]);

// ============================================================================
// INSCRIPTIONS AUX ÉDITIONS
// ============================================================================
export const editionRegistrations = pgTable('edition_registrations', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  editionId: text('edition_id').notNull().references(() => tournamentEditions.id, { onDelete: 'cascade' }),
  memberId: text('member_id').notNull().references(() => tournamentMembers.id, { onDelete: 'cascade' }),

  // Type d'inscription
  registrationType: text('registration_type').default('REGULAR'), 
  // Types: REGULAR, INVITED, QUALIFIED, WILDCARD, STAFF, BYE

  // Statut de participation
  status: participationStatusEnum('status').default('REGISTERED'),
  
  // Informations de jeu spécifiques
  gameLevel: text('game_level'),
  gameRank: text('game_rank'),
  gameRegion: text('game_region'),
  preferredCharacter: text('preferred_character'),
  characterPool: text('character_pool').array().default([]),

  // Frais et paiement
  registrationFee: numeric('registration_fee', { precision: 10, scale: 2 }).default('0'),
  feePaid: boolean('fee_paid').default(false),
  feeWaived: boolean('fee_waived').default(false),
  paymentTransactionId: text('payment_transaction_id').references(() => walletTransactions.id),

  // Qualification
  qualifiedFromPrevious: boolean('qualified_from_previous').default(false),
  previousEditionId: text('previous_edition_id').references(() => tournamentEditions.id),
  qualificationMethod: text('qualification_method'), // "WIN", "RANKING", "INVITE"

  // Check-in
  checkedIn: boolean('checked_in').default(false),
  checkedInAt: timestamp('checked_in_at'),
  autoCheckedIn: boolean('auto_checked_in').default(false),

  // Métadonnées
  metadata: jsonb('metadata').default({
    registrationSource: 'WEB',
    device: 'DESKTOP'
  }),

  // Timestamps
  registeredAt: timestamp('registered_at').defaultNow(),
  confirmedAt: timestamp('confirmed_at'),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),

  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  // Unicité
  uniqueIndex('edition_registration_unique').on(t.editionId, t.memberId),
  
  // Index de recherche
  index('edition_registrations_edition_idx').on(t.editionId),
  index('edition_registrations_member_idx').on(t.memberId),
  index('edition_registrations_status_idx').on(t.status),
  index('edition_registrations_type_idx').on(t.registrationType),
  index('edition_registrations_fee_paid_idx').on(t.feePaid),
  index('edition_registrations_checked_in_idx').on(t.checkedIn),
  index('edition_registrations_registered_at_idx').on(t.registeredAt),
]);

// ============================================================================
// PAIEMENTS D'INSCRIPTION (ledger séparé)
// ============================================================================
export const registrationPayments = pgTable('registration_payments', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  registrationId: text('registration_id').notNull().references(() => editionRegistrations.id, { onDelete: 'cascade' }),
  transactionId: text('transaction_id').notNull().references(() => walletTransactions.id),

  amount: numeric('amount', { precision: 10, scale: 2 }).notNull(),
  currency: text('currency').default('GTC'),
  paidAt: timestamp('paid_at').defaultNow(),
  paymentMethod: text('payment_method'), // 'WALLET', 'CREDIT_CARD', 'CRYPTO'
  paymentProvider: text('payment_provider'), // 'STRIPE', 'PAYPAL'

  // Statut et suivi
  status: text('status').default('COMPLETED'), // PENDING, COMPLETED, FAILED, REFUNDED
  reference: text('reference'), // Référence externe
  notes: text('notes'),

  // Métadonnées
  metadata: jsonb('metadata').default({}),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('registration_payments_registration_idx').on(t.registrationId),
  index('registration_payments_transaction_idx').on(t.transactionId),
  index('registration_payments_paid_at_idx').on(t.paidAt),
  index('registration_payments_status_idx').on(t.status),
  index('registration_payments_method_idx').on(t.paymentMethod),
]);

// ============================================================================
// PHASES
// ============================================================================
export const tournamentPhases = pgTable('tournament_phases', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  editionId: text('edition_id').notNull().references(() => tournamentEditions.id, { onDelete: 'cascade' }),
  
  name: text('name').notNull(),
  description: text('description'),
  phaseType: tournamentFormatEnum('type').default('ELIMINATION'), // Renommé pour clarté
  order: integer('order').notNull(),
  
  // Configuration
  config: jsonb('config').default({
    qualifiedCount: null,
    groupsCount: 1,
    matchesPerParticipant: 1,
    advanceFromGroup: 1,
    seedingMethod: 'RANDOM',
    tiebreaker: 'HEAD_TO_HEAD'
  }),
  
  // État
  isActive: boolean('is_active').default(false),
  isCompleted: boolean('is_completed').default(false),
  isDoubleElimination: boolean('is_double_elimination').default(false),
  isHidden: boolean('is_hidden').default(false), // Phase préparatoire cachée
  
  // Planning
  scheduledStart: timestamp('scheduled_start'),
  scheduledEnd: timestamp('scheduled_end'),
  actualStart: timestamp('actual_start'),
  actualEnd: timestamp('actual_end'),
  matchDuration: integer('match_duration'), // minutes
  breakDuration: integer('break_duration'), // minutes
  
  // Statistiques
  totalMatches: integer('total_matches').default(0),
  completedMatches: integer('completed_matches').default(0),
  
  isDeleted: boolean('is_deleted').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('phases_edition_idx').on(t.editionId),
  index('phases_order_idx').on(t.editionId, t.order),
  index('phases_active_idx').on(t.isActive, t.isCompleted),
  index('phases_type_idx').on(t.phaseType),
  index('phases_scheduled_start_idx').on(t.scheduledStart),
]);

// ============================================================================
// GROUPES DE PHASE
// ============================================================================
export const phaseGroups = pgTable('phase_groups', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  phaseId: text('phase_id').notNull().references(() => tournamentPhases.id, { onDelete: 'cascade' }),
  
  name: text('name').notNull(),
  description: text('description'),
  order: integer('order').notNull(),
  groupType: text('group_type').default('ROUND_ROBIN'),
  
  // Configuration spécifique
  config: jsonb('config').default({
    matchesPerParticipant: 1,
    advanceCount: 2,
    seeding: 'RANDOM',
    pointsPerWin: 3,
    pointsPerDraw: 1,
    pointsPerLoss: 0
  }),
  
  // État
  isCompleted: boolean('is_completed').default(false),
  isLocked: boolean('is_locked').default(false), // Empêche les modifications
  
  // Statistiques
  participantCount: integer('participant_count').default(0),
  matchCount: integer('match_count').default(0),
  
  isDeleted: boolean('is_deleted').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('groups_phase_idx').on(t.phaseId),
  index('groups_order_idx').on(t.phaseId, t.order),
  index('groups_type_idx').on(t.groupType),
  index('groups_completed_idx').on(t.isCompleted),
]);

// ============================================================================
// PARTICIPANTS AUX GROUPES (pivot avec stats)
// ============================================================================
export const phaseGroupParticipants = pgTable('phase_group_participants', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  groupId: text('group_id').notNull().references(() => phaseGroups.id, { onDelete: 'cascade' }),
  registrationId: text('registration_id').notNull().references(() => editionRegistrations.id, { onDelete: 'cascade' }),
  
  // Statistiques dans le groupe
  matchesPlayed: integer('matches_played').default(0),
  matchesWon: integer('matches_won').default(0),
  matchesDrawn: integer('matches_drawn').default(0),
  matchesLost: integer('matches_lost').default(0),
  
  points: integer('points').default(0),
  scoreFor: integer('score_for').default(0), // Buts/points marqués
  scoreAgainst: integer('score_against').default(0), // Buts/points encaissés
  scoreDifference: integer('score_difference').generatedAlwaysAs(sql`score_for - score_against`),
  
  // Position et classement
  position: integer('position'),
  isSeeded: boolean('is_seeded').default(false),
  seedOrder: integer('seed_order'),
  
  // Qualification
  qualified: boolean('qualified').default(false),
  qualificationPosition: integer('qualification_position'),
  
  // Métadonnées
  stats: jsonb('stats').default({}), // Stats supplémentaires
  metadata: jsonb('metadata').default({}),
  
  isDeleted: boolean('is_deleted').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  uniqueIndex('phase_group_participant_unique').on(t.groupId, t.registrationId),
  index('phase_group_participants_group_idx').on(t.groupId),
  index('phase_group_participants_registration_idx').on(t.registrationId),
  index('phase_group_participants_position_idx').on(t.groupId, t.position),
  index('phase_group_participants_points_idx').on(t.groupId, t.points),
  index('phase_group_participants_qualified_idx').on(t.qualified),
]);

// ============================================================================
// NŒUDS DE BRACKET (sub-groups)
// ============================================================================
export const bracketNodes = pgTable('bracket_nodes', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  phaseId: text('phase_id').notNull().references(() => tournamentPhases.id, { onDelete: 'cascade' }),
  groupId: text('group_id').references(() => phaseGroups.id, { onDelete: 'cascade' }),
  
  // Identification
  nodeType: text('node_type').default('MATCH'), // MATCH, BYE, TBD (à déterminer)
  nodeCode: text('node_code'), // Ex: "U1-1", "L2-3"
  
  // Structure d'arbre
  parentNodeId: text('parent_node_id').references((): any => bracketNodes.id, { onDelete: 'cascade' }),
  childPosition: text('child_position'), // 'WINNER', 'LOSER', 'UPPER', 'LOWER'
  depth: integer('depth').default(0), // Profondeur dans l'arbre
  order: integer('order'), // Ordre d'affichage
  
  // Position dans le bracket
  bracketType: text('bracket_type'), // 'UPPER', 'LOWER', 'FINAL', 'CONSOLATION'
  round: integer('round'), // Numéro du round (1, 2, 3...)
  matchNumber: integer('match_number'), // Numéro du match dans le round
  
  // Métadonnées
  metadata: jsonb('metadata').default({
    isBye: false,
    requiresMatch: true
  }),
  
  isDeleted: boolean('is_deleted').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  index('bracket_nodes_phase_idx').on(t.phaseId),
  index('bracket_nodes_group_idx').on(t.groupId),
  index('bracket_nodes_parent_idx').on(t.parentNodeId),
  index('bracket_nodes_type_idx').on(t.nodeType),
  index('bracket_nodes_bracket_idx').on(t.bracketType, t.round, t.matchNumber),
  index('bracket_nodes_depth_idx').on(t.depth),
  index('bracket_nodes_code_idx').on(t.nodeCode),
]);

// ============================================================================
// MATCHES (source unique de vérité)
// ============================================================================
export const matches = pgTable('matches', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  
  // Références
  editionId: text('edition_id').notNull().references(() => tournamentEditions.id, { onDelete: 'cascade' }),
  phaseId: text('phase_id').notNull().references(() => tournamentPhases.id, { onDelete: 'cascade' }),
  groupId: text('group_id').references(() => phaseGroups.id, { onDelete: 'cascade' }),
  bracketNodeId: text('bracket_node_id').references(() => bracketNodes.id, { onDelete: 'cascade' }),
  
  // Identification
  matchCode: text('match_code'),
  matchType: text('match_type').default('REGULAR'), // REGULAR, QUALIFIER, FINAL, THIRD_PLACE
  round: integer('round').notNull().default(1),
  matchNumber: integer('match_number').notNull().default(1),
  
  // Horaires
  scheduledTime: timestamp('scheduled_time'),
  estimatedDuration: integer('estimated_duration'), // minutes
  actualStartTime: timestamp('actual_start_time'),
  actualEndTime: timestamp('actual_end_time'),
  duration: integer('duration'), // minutes réelles
  
  // Participants
  participant1RegistrationId: text('participant1_registration_id').references(() => editionRegistrations.id),
  participant2RegistrationId: text('participant2_registration_id').references(() => editionRegistrations.id),
  
  // Résultats
  score1: integer('score1'),
  score2: integer('score2'),
  winnerRegistrationId: text('winner_registration_id').references(() => editionRegistrations.id),
  loserRegistrationId: text('loser_registration_id').references(() => editionRegistrations.id),
  
  // Détails du match
  gameData: jsonb('game_data').default({}), // Données spécifiques au jeu
  replayId: text('replay_id'),
  streamLink: text('stream_link'),
  
  // Preuves et validation
  screenshot: text('screenshot'),
  proofLinks: text('proof_links').array().default([]),
  notes: text('notes'),
  submittedByUserId: text('submitted_by_user_id').references(() => users.id),
  
  // Confirmation
  confirmedByParticipant1: boolean('confirmed_by_participant1').default(false),
  confirmedByParticipant2: boolean('confirmed_by_participant2').default(false),
  confirmedByAdmin: boolean('confirmed_by_admin').default(false),
  confirmedAt: timestamp('confirmed_at'),
  
  // Disputes
  disputed: boolean('disputed').default(false),
  disputeReason: text('dispute_reason'),
  resolvedBy: text('resolved_by').references(() => users.id),
  resolution: text('resolution'),
  
  // Statut
  status: matchStatusEnum('status').default('PENDING'),
  
  // Métadonnées
  metadata: jsonb('metadata').default({
    format: 'BEST_OF_1',
    rules: 'STANDARD'
  }),
  
  isDeleted: boolean('is_deleted').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  // Index principaux
  index('matches_edition_idx').on(t.editionId),
  index('matches_phase_idx').on(t.phaseId),
  index('matches_group_idx').on(t.groupId),
  index('matches_bracket_node_idx').on(t.bracketNodeId),
  
  // Index temporels
  index('matches_scheduled_idx').on(t.scheduledTime),
  index('matches_created_at_idx').on(t.createdAt),
  
  // Index de recherche
  index('matches_code_idx').on(t.matchCode),
  index('matches_status_idx').on(t.status),
  index('matches_round_idx').on(t.round, t.matchNumber),
  index('matches_type_idx').on(t.matchType),
  
  // Index participants
  index('matches_participant1_idx').on(t.participant1RegistrationId),
  index('matches_participant2_idx').on(t.participant2RegistrationId),
  index('matches_winner_idx').on(t.winnerRegistrationId),
  
  // Index performance
  index('matches_composite_idx').on(t.editionId, t.status, t.scheduledTime),
  index('matches_group_status_idx').on(t.groupId, t.status),
]);

// ============================================================================
// RÉSULTATS FINAUX D'ÉDITION
// ============================================================================
export const editionResults = pgTable('edition_results', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  editionId: text('edition_id').notNull().references(() => tournamentEditions.id, { onDelete: 'cascade' }),
  registrationId: text('registration_id').notNull().references(() => editionRegistrations.id),
  
  // Position finale
  position: integer('position').notNull(),
  tier: text('tier'), // "GOLD", "SILVER", "BRONZE"
  
  // Récompenses
  prizeAmount: numeric('prize_amount', { precision: 15, scale: 2 }),
  prizeCurrency: text('prize_currency').default('GTC'),
  prizeDescription: text('prize_description'),
  
  // Statistiques finales
  matchesPlayed: integer('matches_played').default(0),
  matchesWon: integer('matches_won').default(0),
  matchesLost: integer('matches_lost').default(0),
  matchesDrawn: integer('matches_drawn').default(0),
  totalScore: integer('total_score').default(0),
  averageScore: numeric('average_score', { precision: 5, scale: 2 }),
  
  // Récompenses supplémentaires
  awards: text('awards').array().default([]),
  specialMentions: text('special_mentions').array().default([]),
  
  // Paiement
  prizePaid: boolean('prize_paid').default(false),
  paymentTransactionId: text('payment_transaction_id').references(() => walletTransactions.id),
  paidAt: timestamp('paid_at'),
  
  // Métadonnées
  statistics: jsonb('statistics').default({}),
  metadata: jsonb('metadata').default({}),
  
  isDeleted: boolean('is_deleted').default(false),
  
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (t) => [
  uniqueIndex('edition_result_unique').on(t.editionId, t.registrationId),
  index('edition_results_edition_idx').on(t.editionId),
  index('edition_results_position_idx').on(t.editionId, t.position),
  index('edition_results_registration_idx').on(t.registrationId),
  index('edition_results_tier_idx').on(t.tier),
  index('edition_results_prize_paid_idx').on(t.prizePaid),
]);

// ============================================================================
// JEUX ET ITEMS
// ============================================================================

export const games = pgTable('games', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  name: text('name').unique().notNull(),
  description: text('description'),
  profileImage: text('profile_image'),
  coverImage: text('cover_image'),
  publisher: text('publisher'),
  releaseDate: timestamp('release_date'),
  genre: text('genre'),
  platforms: platformEnum('platforms').array().default([]),
  isActive: boolean('is_active').default(true),
  featured: boolean('featured').default(false),
  popularity: integer('popularity').default(0),
  website: text('website'),
  minAge: integer('min_age'),
  tags: text('tags').array().default([]),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('games_active_featured_idx').on(table.isActive, table.featured)
]);

export const gameItems = pgTable('game_items', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  gameId: text('game_id').notNull().references(() => games.id),

  name: text('name').notNull(),
  type: gameItemTypeEnum('type').notNull(),
  description: text('description'),
  icon: text('icon'),

  // Prix et disponibilité
  priceGtc: numeric('price_gtc', { precision: 10, scale: 2 }).notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 10, scale: 4 }),
  minOrder: numeric('min_order', { precision: 10, scale: 2 }).default('1.0'),
  maxOrder: numeric('max_order', { precision: 10, scale: 2 }).default('1000.0'),

  availability: text('availability').default('AVAILABLE'),
  processingTime: text('processing_time').default('24h'),

  isActive: boolean('is_active').default(true),
  featured: boolean('featured').default(false),
  popularity: integer('popularity').default(0),
  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('game_items_game_idx').on(table.gameId),
  index('game_items_type_idx').on(table.type)
]);

export const requestTypeEnum = pgEnum('request_type', ['DEPOSIT', 'WITHDRAWAL', 'GAME_ITEMS', 'OTHER']);

export const requests = pgTable('requests', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: requestTypeEnum('type').notNull(), // DEPOSIT, WITHDRAWAL, GAME_ITEMS, OTHER
  amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
  currency: text('currency').default('GTC'),
  status: text('status').default('PENDING'), // PENDING, APPROVED, REJECTED, COMPLETED

  // Rejection fields
  rejectionReason: text('rejection_reason'),
  rejectedAt: timestamp('rejected_at'),
  rejectedBy: text('rejected_by').references(() => users.id),

  // Moyen de paiement pour dépôt/retrait
  paymentMethod: text('payment_method'), // ex: 'BANK_TRANSFER', 'PAYPAL', 'STRIPE', 'CRYPTO', 'MOBILE_MONEY'
  paymentProvider: text('payment_provider'), // ex: 'MTN', 'ORANGE', 'WAVE', 'PAYPAL', 'STRIPE', 'BTC', 'ETH'
  paymentAccountId: text('payment_account_id'), // ID externe ou référence du compte chez le fournisseur
  paymentReference: text('payment_reference'), // Référence de transaction externe
  paymentConfirmationCode: text('payment_confirmation_code'), // Code de confirmation ou hash de preuve
  paymentMetadata: jsonb('payment_metadata').default({}), // Détails supplémentaires (ex: adresse wallet, IBAN, etc.)
  paymentImage: text('payment_image'),

  // --- Champs spécifiques GAME_ITEMS (fusionnés depuis gameItemRequests) ---
  gameItemId: text('game_item_id').references(() => gameItems.id),
  quantity: numeric('quantity', { precision: 10, scale: 2 }),
  totalGtc: numeric('total_gtc', { precision: 10, scale: 2 }),
  commission: numeric('commission', { precision: 10, scale: 2 }).default('0'),

  // Compte jeu
  gameAccount: text('game_account'),
  encryptedPassword: text('encrypted_password'),
  gameId: text('game_id'),
  additionalInfo: jsonb('additional_info'),

  adminNotes: text('admin_notes'),
  userNotes: text('user_notes'),

  // Traitement
  processedByUserId: text('processed_by_user_id').references(() => users.id),
  estimatedTime: integer('estimated_time'),
  trackingNumber: text('tracking_number'),

  transactionId: text('transaction_id').references(() => walletTransactions.id, { onDelete: 'cascade' }),

  processedAt: timestamp('processed_at'),
  completedAt: timestamp('completed_at'),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),
  isDeleted: boolean('is_deleted').default(false),

  // Timestamps
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('requests_user_idx').on(table.userId),
  index('requests_type_idx').on(table.type),
  index('requests_status_idx').on(table.status),
  index('requests_game_item_idx').on(table.gameItemId),
]);
// ============================================================================
// CONTENU ET SOCIAL
// ============================================================================

export const gameClips = pgTable('game_clips', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  authorId: text('author_id').notNull().references(() => users.id),
  shopId: text('shop_id').references(() => shops.id),
  gameId: text('game_id').references(() => games.id),

  caption: text('caption'),
  videoUrl: text('video_url'),
  images: text('images').array().default([]),
  isPublic: boolean('is_public').default(true),
  thumbnailUrl: text('thumbnail_url'),

  duration: integer('duration'),
  viewCount: integer('view_count').default(0),

  // Story/Status behavior
  expiresAt: timestamp('expires_at'),
  
  isActive: boolean('is_active').default(true),
  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('game_clips_author_idx').on(table.authorId),
  index('game_clips_shop_idx').on(table.shopId),
  index('game_clips_game_idx').on(table.gameId),
  index('game_clips_expires_idx').on(table.expiresAt),
]);

export const posts = pgTable('posts', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  authorId: text('author_id').notNull().references(() => users.id),

  content: text('content'),
  images: text('images').array().default([]),
  video: text('video'),

  // viewCount: integer('view_count').default(0),
  // viewers: text('viewers').array().default([]), // Array of user IDs who viewed the blog

  // Story vs Post
  isStory: boolean('is_story').default(false),
  expiresAt: timestamp('expires_at'),

  isActive: boolean('is_active').default(true),
  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('posts_author_story_idx').on(table.authorId, table.isStory, table.isActive),
  index('posts_expires_at_idx').on(table.expiresAt)
]);

export const messages = pgTable('messages', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  senderId: text('sender_id').notNull().references(() => users.id),
  recipientId: text('recipient_id').references(() => users.id),
  groupId: text('group_id').references(() => groups.id, { onDelete: 'cascade' }),
  shopId: text('shop_id').references(() => shops.id), // Ajouté pour la cohérence des relations
  postId: text('post_id').references(() => posts.id), // Ajouté pour la cohérence des relations
  gameClipId: text('game_clip_id').references(() => gameClips.id), // Ajouté pour la cohérence des relations
  productId: text('product_id').references(() => products.id), // Ajouté pour la cohérence des relations
  userId: text('user_id').references(() => users.id), // Ajouté pour la cohérence des relations

  content: text('content'),
  images: text('images').array().default([]),
  audioUrl: text('audio_url'),

  // Réponse à un message
  parentMessageId: text('parent_message_id').references((): any => messages.id),

  // Entité liée
  entityType: entityTypeEnum('entity_type'),
  entityId: text('entity_id'),

  read: boolean('read').default(false),
  isActive: boolean('is_active').default(true),
  isDeleted: boolean('is_deleted').default(false),
  isOpenToPublic: boolean('is_open_to_public').default(false),

  createdAt: timestamp('created_at').defaultNow(),

}, (table) => [
  index('messages_sender_idx').on(table.senderId),
  index('messages_recipient_idx').on(table.recipientId),
  index('messages_entity_idx').on(table.entityId, table.entityType)
]);

export const groups = pgTable('groups', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  creatorId: text('creator_id').notNull().references(() => users.id),

  name: text('name').notNull(),
  description: text('description'),
  image: text('image'),
  isPrivate: boolean('is_private').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const groupMembers = pgTable('group_members', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  groupId: text('group_id').notNull().references(() => groups.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: groupRoleEnum('role').default('MEMBER'),

  joinedAt: timestamp('joined_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  uniqueIndex('group_member_unique').on(table.groupId, table.userId)
]);

export const interactions = pgTable('interactions', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  entityId: text('entity_id').notNull(),
  entityType: entityTypeEnum('entity_type').notNull(),
  type: interactionTypeEnum('type').notNull(),

  // Ajout de colonnes pour les relations directes
  postId: text('post_id').references(() => posts.id),
  productId: text('product_id').references(() => products.id),
  messageId: text('message_id').references(() => messages.id),
  tournamentId: text('tournament_id').references(() => tournaments.id),
  shopId: text('shop_id').references(() => shops.id),
  themeId: text('theme_id').references(() => themes.id),
  gameId: text('game_id').references(() => games.id),
  gameItemId: text('game_item_id').references(() => gameItems.id),
  gameClipId: text('game_clip_id').references(() => gameClips.id),

  

  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  uniqueIndex('interaction_unique').on(table.userId, table.entityId, table.entityType, table.type).where(sql`${table.isDeleted} = false`),
  index('interactions_entity_idx').on(table.entityId, table.entityType),
  index('interactions_user_idx').on(table.userId),
  index('interactions_game_clip_idx').on(table.gameClipId)
]);

// ============================================================================
// MÉDIAS (images, vidéos, documents)
// ============================================================================

export const medias = pgTable('medias', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  ownerId: text('owner_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  fileName: text('file_name').notNull(),
  originalName: text('original_name').notNull(),
  originalSize: text('original_size'),
  mimeType: text('mime_type').notNull(),
  size: integer('size').notNull(), // bytes
  url: text('url').notNull(),
  thumbnailUrl: text('thumbnail_url'),

  type: mediaTypeEnum('type').notNull(), // 'image', 'video', 'document', 'audio', 'other'
  status: mediaStatusEnum('status').default('ACTIVE'), // 'ACTIVE', 'PROCESSING', 'DELETED'
  privacy: mediaPrivacyEnum('privacy').default('PUBLIC'), // 'PUBLIC', 'PRIVATE', 'FRIENDS'

  // Entité à laquelle le média appartient
  entityType: entityTypeEnum('entity_type'),
  entityId: text('entity_id'), // ID de l'entité concernée

  metadata: jsonb('metadata').default({}), // dimensions, duration, etc.
  
  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('medias_owner_idx').on(table.ownerId),
  index('medias_type_idx').on(table.type),
  index('medias_status_idx').on(table.status),
  index('medias_privacy_idx').on(table.privacy),
  index('medias_entity_idx').on(table.entityType, table.entityId),
]);

// Relations médias
export const mediasRelations = relations(medias, ({ one, many }) => ({
  owner: one(users, { fields: [medias.ownerId], references: [users.id] }),
}));


export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').references(() => users.id),
  shopId: text('shop_id').references(() => shops.id),
  tournamentId: text('tournament_id').references(() => tournaments.id),

  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull(),
  linkUrl: text('link_url'),

  read: boolean('read').default(false),
  isActive: boolean('is_active').default(true),
  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull().references(() => users.id),
  endpoint: text('endpoint').unique().notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),

  createdAt: timestamp('created_at').defaultNow(),
});

// ============================================================================
// THÈMES ET CONTENU ADMIN
// ============================================================================

export const themePurchases = pgTable('theme_purchases', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull().references(() => users.id),
  themeId: text('theme_id').notNull().references(() => themes.id),
  price: numeric('price', { precision: 8, scale: 2 }),

  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  uniqueIndex('theme_purchase_unique').on(table.userId, table.themeId)
]);

export const announcements = pgTable('announcements', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  authorId: text('author_id').notNull().references(() => users.id),

  title: text('title').notNull(),
  content: text('content').notNull(),
  type: announcementTypeEnum('type').default('ANNOUNCEMENT'),

  images: text('images').array().default([]),
  video: text('video'),

  isActive: boolean('is_active').default(true),
  isPinned: boolean('is_pinned').default(false),
  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('announcements_type_idx').on(table.type),
  index('announcements_author_idx').on(table.authorId)
]);

export const announcementReads = pgTable('announcement_reads', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  announcementId: text('announcement_id').notNull().references(() => announcements.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  readAt: timestamp('read_at').defaultNow(),
}, (table) => [
  uniqueIndex('announcement_read_unique').on(table.announcementId, table.userId)
]);

// ============================================================================
// AUTRES TABLES
// ============================================================================

export const searchHistory = pgTable('search_history', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull().references(() => users.id),
  query: text('query').notNull(),

  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('search_history_user_idx').on(table.userId, table.createdAt) // Corrigé 'createdat' en 'createdAt'
]);

export const claims = pgTable('claims', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').notNull().references(() => users.id),
  transactionId: text('transaction_id').references(() => walletTransactions.id),

  type: text('type').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  evidence: text('evidence'),
  image: text('image'),

  status: text('status').default('PENDING'),
  resolution: text('resolution'),

  isDeleted: boolean('is_deleted').default(false),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const userTraces = pgTable('user_traces', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: text('user_id').references(() => users.id),
  sessionId: text('session_id'),
  type: traceTypeEnum('type').notNull(),
  entityId: text('entity_id'),
  payload: jsonb('payload'),

  createdAt: timestamp('created_at').defaultNow(),
  synced: boolean('synced').default(false),
}, (table) => [
  index('user_traces_user_idx').on(table.userId),
  index('user_traces_session_idx').on(table.sessionId),
  index('user_traces_type_idx').on(table.type)
]);


// ============================================================================
// BLOGS, SERVICES, GUIDES ET ÉTAPES
// ============================================================================

export const blogs = pgTable('blogs', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  content: text('content').notNull(),
  images: text('images').array().default([]),
  isActive: boolean('is_active').default(true),
  // viewCount: integer('view_count').default(0),
  // viewers: text('viewers').array().default([]), // Array of user IDs who viewed the blog
  isDeleted: boolean('is_deleted').default(false),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('blogs_author_idx').on(table.authorId),
  index('blogs_active_idx').on(table.isActive),
]);

export const services = pgTable('services', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  description: text('description').notNull(),
  icon: text('icon'),
  images: text('images').array().default([]),
  isActive: boolean('is_active').default(true),
  isDeleted: boolean('is_deleted').default(false),
  adminId: text('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('services_admin_idx').on(table.adminId),
  index('services_active_idx').on(table.isActive),
]);

export const guides = pgTable('guides', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  category: text('category').notNull(),
  images: text('images').array().default([]),
  viewCount: integer('view_count').default(0),
  description: text('description'),
  // viewers: text('viewers').array().default([]), // Array of user IDs who viewed the guide
  isActive: boolean('is_active').default(true),
  isDeleted: boolean('is_deleted').default(false),
  adminId: text('admin_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('guides_admin_idx').on(table.adminId),
  index('guides_category_idx').on(table.category),
  index('guides_active_idx').on(table.isActive),
]);

export const guideSteps = pgTable('guide_steps', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  order: integer('order').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  images: text('images').array().default([]),
  guideId: text('guide_id').notNull().references(() => guides.id, { onDelete: 'cascade' }),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('guide_steps_guide_idx').on(table.guideId),
  index('guide_steps_order_idx').on(table.guideId, table.order),
]);



export const appSettings = pgTable('app_settings', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),

  // Limites
  maxProductsRegular: integer('max_products_regular').default(5),
  maxProductsVip: integer('max_products_vip').default(20),
  maxShopsRegular: integer('max_shops_regular').default(1),
  maxShopsVip: integer('max_shops_vip').default(5),
  maxTournamentsRegular: integer('max_tournaments_regular').default(1),
  maxTournamentsVip: integer('max_tournaments_vip').default(5),

  // Stories/Posts/clips
  storyDurationHours: integer('story_duration_hours').default(48),
  maxStoriesPerDayRegular: integer('max_stories_per_day_regular').default(3),
  maxStoriesPerDayVip: integer('max_stories_per_day_vip').default(10),

  // Frais
  transactionFeePercentage: numeric('transaction_fee_percentage', { precision: 5, scale: 4 }).default('0.001'),
  purchaseFeePercentage: numeric('purchase_fee_percentage', { precision: 5, scale: 4 }).default('0.01'),
  depositFeePercentage: numeric('deposit_fee_percentage', { precision: 5, scale: 4 }).default('0.00'),
  withdrawalFeePercentage: numeric('withdrawal_fee_percentage', { precision: 5, scale: 4 }).default('0.02'),
  transferFeePercentage: numeric('transfer_fee_percentage', { precision: 5, scale: 4 }).default('0.005'),
  tournamentParticipationFeePercentage: numeric('tournament_participation_fee_percentage', { precision: 5, scale: 4 }).default('0.01'),

  // Taux de change
  gtcToFcfaRate: numeric('gtc_to_fcfa_rate', { precision: 10, scale: 2 }).default('500.0'),
  gtcToEurRate: numeric('gtc_to_eur_rate', { precision: 10, scale: 4 }),
  gtcToUsdRate: numeric('gtc_to_usd_rate', { precision: 10, scale: 4 }),
  lastExchangeRateUpdate: timestamp('last_exchange_rate_update').defaultNow(),

  // Configuration VIP
  vipMonthlyPrice: numeric('vip_monthly_price', { precision: 8, scale: 2 }).default('250'),
  vipYearlyPrice: numeric('vip_yearly_price', { precision: 8, scale: 2 }).default('2500'),

  // Thèmes
  freeThemesLimitRegular: integer('free_themes_limit_regular').default(2),
  freeThemesLimitVip: integer('free_themes_limit_vip').default(10),
  maxThemeCreationsRegular: integer('max_theme_creations_regular').default(0),
  maxThemeCreationsVip: integer('max_theme_creations_vip').default(5),
  canVipCreateThemes: boolean('can_vip_create_themes').default(true),
  canVipSellThemes: boolean('can_vip_sell_themes').default(true),
  themeCreationFee: numeric('theme_creation_fee', { precision: 8, scale: 2 }).default('0.0'),
  themeSaleCommissionPercentage: numeric('theme_sale_commission_percentage', { precision: 5, scale: 4 }).default('0.15'),

  // Tournois
  maxParticipantsPerTournament: integer('max_participants_per_tournament').default(32),
  maxCoOrganizersRatio: real('max_co_organizers_ratio').default(0.33),

  // Items de jeu
  gameItemsEnabled: boolean('game_items_enabled').default(true),
  gameItemCommissionPercentage: numeric('game_item_commission_percentage', { precision: 5, scale: 4 }).default('0.05'),
  minGameItemRequest: numeric('min_game_item_request', { precision: 10, scale: 2 }).default('1.0'),
  maxGameItemRequest: numeric('max_game_item_request', { precision: 10, scale: 2 }).default('1000.0'),

  // Permissions (stockées en JSON)
  userPermissions: jsonb('user_permissions').default({}),
  adminPermissions: jsonb('admin_permissions').default({}),
  regularUserPermissions: jsonb('regular_user_permissions').default([]),
  vipUserPermissions: jsonb('vip_user_permissions').default([]),

  // Routes
  publicRoutes: jsonb('public_routes').default([]),
  protectedRoutes: jsonb('protected_routes').default([]),
  adminRoutes: jsonb('admin_routes').default({}),

  // Tâches admin
  adminTasks: jsonb('admin_tasks').default({}),

  maintenanceMode: boolean('maintenance_mode').default(false),
  defaultUserBalance: integer('default_user_balance').default(250),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================================================
// RELATIONS DRIZZLE COMPLÈTES
// ============================================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  wallet: one(userWallets),
  vipSubscription: one(vipSubscriptions),
  shops: many(shops),
  products: many(products),
  orders: many(orders),
  tournaments: many(tournaments, { relationName: 'organized_tournaments' }),
  teamMemberships: many(teamMembers),
  captainedTeams: many(teams, { relationName: 'team_captain' }),
  viceCaptainedTeams: many(teams, { relationName: 'team_vice_captain' }),
  gameClips: many(gameClips),
  posts: many(posts),
  sentMessages: many(messages, { relationName: 'sent_messages' }),
  receivedMessages: many(messages, { relationName: 'received_messages' }),
  interactions: many(interactions),
  notifications: many(notifications),
  pushSubscriptions: many(pushSubscriptions),
  gameItemRequests: many(requests),
  claims: many(claims),
  userTraces: many(userTraces),
  themePurchases: many(themePurchases),
  createdThemes: many(themes, { relationName: 'created_themes' }),
  createdGroups: many(groups, { relationName: 'group_creator' }),
  groupMemberships: many(groupMembers),
  sentTransactions: many(walletTransactions, { relationName: 'sent_transactions' }),
  receivedTransactions: many(walletTransactions, { relationName: 'received_transactions' }),
  tournamentMemberships: many(tournamentMembers),
  matchesAsParticipant1: many(matches, { relationName: 'participant1_matches' }),
  matchesAsParticipant2: many(matches, { relationName: 'participant2_matches' }),
  matchesAsWinner: many(matches, { relationName: 'winner_matches' }),
  matchesAsLoser: many(matches, { relationName: 'loser_matches' }),
  submittedMatchResults: many(matches, { relationName: 'submitted_results' }),
  deliveredProducts: many(products, { relationName: 'delivered_products' }),
  readAnnouncements: many(announcementReads),
  blogs: many(blogs),
  services: many(services),
  guides: many(guides),
  requests: many(requests),
  // Relations des nouvelles tables d'authentification
  sessions: many(session),
  accounts: many(account),
  verifications: many(verification),
  passkeys: many(passkey),
  // twoFactors: many(twoFactors),
}));


export const sessionRelations = relations(session, ({ one }) => ({
  users: one(users, {
    fields: [session.userId],
    references: [users.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  users: one(users, {
    fields: [account.userId],
    references: [users.id],
  }),
}));


export const userWalletsRelations = relations(userWallets, ({ one, many }) => ({
  user: one(users, { fields: [userWallets.userId], references: [users.id] }),
  transactions: many(walletTransactions),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one, many }) => ({
  wallet: one(userWallets, { fields: [walletTransactions.walletId], references: [userWallets.id] }),
  fromUser: one(users, {
    fields: [walletTransactions.fromUserId],
    references: [users.id],
    relationName: 'sent_transactions'
  }),
  toUser: one(users, {
    fields: [walletTransactions.toUserId],
    references: [users.id],
    relationName: 'received_transactions'
  }),
  vipSubscription: one(vipSubscriptions),
  gameItemRequests: many(requests),
}));

// Relations for receipts
export const receiptsRelations = relations(receipts, ({ one }) => ({
  user: one(users, {
    fields: [receipts.userId],
    references: [users.id],
  }),
  transaction: one(walletTransactions, {
    fields: [receipts.transactionId],
    references: [walletTransactions.id],
  }),
}));

export const vipSubscriptionsRelations = relations(vipSubscriptions, ({ one }) => ({
  user: one(users, { fields: [vipSubscriptions.userId], references: [users.id] }),
  transaction: one(walletTransactions, { fields: [vipSubscriptions.transactionId], references: [walletTransactions.id] }),
}));

export const shopsRelations = relations(shops, ({ one, many }) => ({
  owner: one(users, { fields: [shops.ownerId], references: [users.id] }),
  theme: one(themes, { fields: [shops.themeId], references: [themes.id] }),
  products: many(products),
  orders: many(orders),
  categories: many(entityCategories, { relationName: 'shop_categories' }), // Corrigé pour utiliser entityCategories
  notifications: many(notifications),
  interactions: many(interactions),
  messages: many(messages),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'category_parent'
  }),
  children: many(categories, { relationName: 'category_parent' }),
  products: many(products),
  entityLinks: many(entityCategories), // Lien vers la table de jointure
}));

export const entityCategoriesRelations = relations(entityCategories, ({ one }) => ({
  category: one(categories, { fields: [entityCategories.categoryId], references: [categories.id] }),
  // Les relations vers les autres entités sont gérées par leur entityId/entityType
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  shop: one(shops, { fields: [products.shopId], references: [shops.id] }),
  user: one(users, { fields: [products.userId], references: [users.id] }),
  category: one(categories, { fields: [products.categoryId], references: [categories.id] }),
  deliveredTo: one(users, {
    fields: [products.deliveredToUserId],
    references: [users.id],
    relationName: 'delivered_products'
  }),
  orders: many(orders, { relationName: 'product_orders' }),
  orderedInorders: many(orders, { relationName: 'ordered_product' }),
  interactions: many(interactions),
  messages: many(messages),
}));

export const ordersRelations = relations(orders, ({ one }) => ({
  product: one(products, {
    fields: [orders.productId],
    references: [products.id],
    relationName: 'product_orders'
  }),
  orderedProduct: one(products, {
    fields: [orders.orderedProductId],
    references: [products.id],
    relationName: 'ordered_product'
  }),
  buyer: one(users, { fields: [orders.buyerId], references: [users.id] }),
  shop: one(shops, { fields: [orders.shopId], references: [shops.id] }),
}));
export const teamsRelations = relations(teams, ({ one, many }) => ({
  captain: one(users, {
    fields: [teams.captainId],
    references: [users.id],
    relationName: 'team_captain'
  }),
  viceCaptain: one(users, {
    fields: [teams.viceCaptainId],
    references: [users.id],
    relationName: 'team_vice_captain'
  }),
  members: many(teamMembers),
  tournamentMemberships: many(tournamentMembers),
}));

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  user: one(users, { fields: [teamMembers.userId], references: [users.id] }),
}));

export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  organizer: one(users, {
    fields: [tournaments.organizerId],
    references: [users.id],
    relationName: 'organized_tournaments'
  }),
  theme: one(themes, { fields: [tournaments.themeId], references: [themes.id] }),
  members: many(tournamentMembers),
  editions: many(tournamentEditions),
  notifications: many(notifications),
  interactions: many(interactions),
}));

export const tournamentEditionsRelations = relations(tournamentEditions, ({ one, many }) => ({
  tournament: one(tournaments, { fields: [tournamentEditions.tournamentId], references: [tournaments.id] }),
  registrations: many(editionRegistrations),
  phases: many(tournamentPhases),
  results: many(editionResults),
  matches: many(matches),
}));

export const tournamentMembersRelations = relations(tournamentMembers, ({ one, many }) => ({
  tournament: one(tournaments, { fields: [tournamentMembers.tournamentId], references: [tournaments.id] }),
  user: one(users, { fields: [tournamentMembers.userId], references: [users.id] }),
  team: one(teams, { fields: [tournamentMembers.teamId], references: [teams.id] }),
  registrations: many(editionRegistrations),
}));

export const editionRegistrationsRelations = relations(editionRegistrations, ({ one, many }) => ({
  edition: one(tournamentEditions, { fields: [editionRegistrations.editionId], references: [tournamentEditions.id] }),
  member: one(tournamentMembers, { fields: [editionRegistrations.memberId], references: [tournamentMembers.id] }),
  payment: one(registrationPayments),
  groupParticipations: many(phaseGroupParticipants),
  matchesAsParticipant1: many(matches, { relationName: 'participant1_matches' }),
  matchesAsParticipant2: many(matches, { relationName: 'participant2_matches' }),
  matchesAsWinner: many(matches, { relationName: 'winner_matches' }),
  matchesAsLoser: many(matches, { relationName: 'loser_matches' }),
  results: many(editionResults),
}));

export const registrationPaymentsRelations = relations(registrationPayments, ({ one }) => ({
  registration: one(editionRegistrations, { fields: [registrationPayments.registrationId], references: [editionRegistrations.id] }),
  transaction: one(walletTransactions, { fields: [registrationPayments.transactionId], references: [walletTransactions.id] }),
}));

export const tournamentPhasesRelations = relations(tournamentPhases, ({ one, many }) => ({
  edition: one(tournamentEditions, { fields: [tournamentPhases.editionId], references: [tournamentEditions.id] }),
  groups: many(phaseGroups),
  bracketNodes: many(bracketNodes),
  matches: many(matches),
}));

export const phaseGroupsRelations = relations(phaseGroups, ({ one, many }) => ({
  phase: one(tournamentPhases, { fields: [phaseGroups.phaseId], references: [tournamentPhases.id] }),
  participants: many(phaseGroupParticipants),
  bracketNodes: many(bracketNodes),
}));

export const phaseGroupParticipantsRelations = relations(phaseGroupParticipants, ({ one, many }) => ({
  group: one(phaseGroups, { fields: [phaseGroupParticipants.groupId], references: [phaseGroups.id] }),
  registration: one(editionRegistrations, { fields: [phaseGroupParticipants.registrationId], references: [editionRegistrations.id] }),
}));

export const bracketNodesRelations = relations(bracketNodes, ({ one, many }) => ({
  phase: one(tournamentPhases, { fields: [bracketNodes.phaseId], references: [tournamentPhases.id] }),
  group: one(phaseGroups, { fields: [bracketNodes.groupId], references: [phaseGroups.id] }),
  parentNode: one(bracketNodes, {
    fields: [bracketNodes.parentNodeId],
    references: [bracketNodes.id],
    relationName: 'bracket_parent'
  }),
  childNodes: many(bracketNodes, { relationName: 'bracket_parent' }),
  match: one(matches),
}));

export const matchesRelations = relations(matches, ({ one }) => ({
  edition: one(tournamentEditions, { fields: [matches.editionId], references: [tournamentEditions.id] }),
  phase: one(tournamentPhases, { fields: [matches.phaseId], references: [tournamentPhases.id] }),
  group: one(phaseGroups, { fields: [matches.groupId], references: [phaseGroups.id] }),
  bracketNode: one(bracketNodes, { fields: [matches.bracketNodeId], references: [bracketNodes.id] }),
  participant1: one(editionRegistrations, {
    fields: [matches.participant1RegistrationId],
    references: [editionRegistrations.id],
    relationName: 'participant1_matches'
  }),
  participant2: one(editionRegistrations, {
    fields: [matches.participant2RegistrationId],
    references: [editionRegistrations.id],
    relationName: 'participant2_matches'
  }),
  winner: one(editionRegistrations, {
    fields: [matches.winnerRegistrationId],
    references: [editionRegistrations.id],
    relationName: 'winner_matches'
  }),
  loser: one(editionRegistrations, {
    fields: [matches.loserRegistrationId],
    references: [editionRegistrations.id],
    relationName: 'loser_matches'
  }),
  submittedBy: one(users, {
    fields: [matches.submittedByUserId],
    references: [users.id],
    relationName: 'submitted_results'
  }),
  resolvedBy: one(users, {
    fields: [matches.resolvedBy],
    references: [users.id],
    relationName: 'resolved_disputes'
  }),
}));

export const editionResultsRelations = relations(editionResults, ({ one }) => ({
  edition: one(tournamentEditions, { fields: [editionResults.editionId], references: [tournamentEditions.id] }),
  registration: one(editionRegistrations, { fields: [editionResults.registrationId], references: [editionRegistrations.id] }),
  payment: one(walletTransactions, { fields: [editionResults.paymentTransactionId], references: [walletTransactions.id] }),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  gameItems: many(gameItems),
}));

export const gameItemsRelations = relations(gameItems, ({ one, many }) => ({
  game: one(games, { fields: [gameItems.gameId], references: [games.id] }),
  requests: many(requests),
}));

export const requestsRelations = relations(requests, ({ one }) => ({
  user: one(users, { fields: [requests.userId], references: [users.id] }),
  gameItem: one(gameItems, { fields: [requests.gameItemId], references: [gameItems.id] }),
  transaction: one(walletTransactions, { fields: [requests.transactionId], references: [walletTransactions.id] }),
  processedBy: one(users, {
    fields: [requests.processedByUserId],
    references: [users.id],
    relationName: 'processed_requests'
  }),
}));

export const postsRelations = relations(posts, ({ one, many }) => ({
  author: one(users, { fields: [posts.authorId], references: [users.id] }),
  interactions: many(interactions),
  messages: many(messages),
}));

export const gameClipsRelations = relations(gameClips, ({ one, many }) => ({
  author: one(users, { fields: [gameClips.authorId], references: [users.id] }),
  interactions: many(interactions),
  game: one(games, { fields: [gameClips.gameId], references: [games.id] }),
  viewers: many(viewers),
  shop: one(shops, { fields: [gameClips.shopId], references: [shops.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: 'sent_messages'
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: 'received_messages'
  }),
  group: one(groups, { fields: [messages.groupId], references: [groups.id] }),
  parentMessage: one(messages, {
    fields: [messages.parentMessageId],
    references: [messages.id],
    relationName: 'message_replies'
  }),
  replies: many(messages, { relationName: 'message_replies' }),
  shop: one(shops, { fields: [messages.shopId], references: [shops.id] }), // Relation ajoutée
  post: one(posts, { fields: [messages.postId], references: [posts.id] }), // Relation ajoutée
  product: one(products, { fields: [messages.productId], references: [products.id] }), // Relation ajoutée
  // Note: interactions relation retirée car elle est gérée dans interactionsRelations
}));

export const interactionsRelations = relations(interactions, ({ one }) => ({
  user: one(users, { fields: [interactions.userId], references: [users.id] }),
  post: one(posts, { fields: [interactions.postId], references: [posts.id] }),
  product: one(products, { fields: [interactions.productId], references: [products.id] }),
  message: one(messages, { fields: [interactions.messageId], references: [messages.id] }),
  tournament: one(tournaments, { fields: [interactions.tournamentId], references: [tournaments.id] }),
  shop: one(shops, { fields: [interactions.shopId], references: [shops.id] }),
  theme: one(themes, { fields: [interactions.themeId], references: [themes.id] }),
  game: one(games, { fields: [interactions.gameId], references: [games.id] }),
  gameItem: one(gameItems, { fields: [interactions.gameItemId], references: [gameItems.id] }),
  gameClip: one(gameClips, { fields: [interactions.gameClipId], references: [gameClips.id] }),
}));

export const groupsRelations = relations(groups, ({ one, many }) => ({
  creator: one(users, {
    fields: [groups.creatorId],
    references: [users.id],
    relationName: 'group_creator'
  }),
  members: many(groupMembers),
  messages: many(messages),
}));

export const groupMembersRelations = relations(groupMembers, ({ one }) => ({
  group: one(groups, { fields: [groupMembers.groupId], references: [groups.id] }),
  user: one(users, { fields: [groupMembers.userId], references: [users.id] }),
}));


export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
  shop: one(shops, { fields: [notifications.shopId], references: [shops.id] }),
  tournament: one(tournaments, { fields: [notifications.tournamentId], references: [tournaments.id] }),
}));

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, { fields: [pushSubscriptions.userId], references: [users.id] }),
}));

export const themesRelations = relations(themes, ({ one, many }) => ({
  creator: one(users, {
    fields: [themes.creatorId],
    references: [users.id],
    relationName: 'created_themes'
  }),
  tournaments: many(tournaments),
  shops: many(shops),
  purchases: many(themePurchases),
  interactions: many(interactions),
}));

export const themePurchasesRelations = relations(themePurchases, ({ one }) => ({
  user: one(users, { fields: [themePurchases.userId], references: [users.id] }),
  theme: one(themes, { fields: [themePurchases.themeId], references: [themes.id] }),
}));

export const announcementsRelations = relations(announcements, ({ one, many }) => ({
  author: one(users, { fields: [announcements.authorId], references: [users.id] }),
  reads: many(announcementReads),
}));

export const announcementReadsRelations = relations(announcementReads, ({ one }) => ({
  announcement: one(announcements, { fields: [announcementReads.announcementId], references: [announcements.id] }),
  user: one(users, { fields: [announcementReads.userId], references: [users.id] }),
}));

export const searchHistoryRelations = relations(searchHistory, ({ one }) => ({
  user: one(users, { fields: [searchHistory.userId], references: [users.id] }),
}));

export const claimsRelations = relations(claims, ({ one }) => ({
  user: one(users, { fields: [claims.userId], references: [users.id] }),
  transaction: one(walletTransactions, { fields: [claims.transactionId], references: [walletTransactions.id] }),
}));

export const userTracesRelations = relations(userTraces, ({ one }) => ({
  user: one(users, { fields: [userTraces.userId], references: [users.id] }),
}));

// ============================================================================
// RELATIONS SUPPLÉMENTAIRES
// ============================================================================

export const blogsRelations = relations(blogs, ({ one }) => ({
  author: one(users, { fields: [blogs.authorId], references: [users.id] }),
}));

export const servicesRelations = relations(services, ({ one }) => ({
  admin: one(users, { fields: [services.adminId], references: [users.id] }),
}));

export const guidesRelations = relations(guides, ({ one, many }) => ({
  admin: one(users, { fields: [guides.adminId], references: [users.id] }),
  steps: many(guideSteps),
}));

export const guideStepsRelations = relations(guideSteps, ({ one }) => ({
  guide: one(guides, { fields: [guideSteps.guideId], references: [guides.id] }),
}));

// ============================================================================
// PARTENAIRES - RELATIONS
// ============================================================================

export const partnersRelations = relations(partners, ({ many }) => ({
  partnerships: many(partnerships),
}));

export const partnershipsRelations = relations(partnerships, ({ one, many }) => ({
  partner: one(partners, {
    fields: [partnerships.partnerId],
    references: [partners.id],
  }),
  // Optional: if you link partnerships to other entities (tournaments, shops, etc.)
  relatedTournament: one(tournaments, {
    fields: [partnerships.relatedEntityId],
    references: [tournaments.id],
  }),
  relatedShop: one(shops, {
    fields: [partnerships.relatedEntityId],
    references: [shops.id],
  }),
}));


export const viewers = pgTable('viewers', {
  id: text('id').primaryKey().default(sql`gen_random_uuid()`),
  entityId: text('entity_id').notNull(),
  entityType: entityTypeEnum('entity_type').notNull(),
  userId: text('user_id').references(() => users.id, { onDelete: 'cascade' }),
  sessionId: text('session_id'), // For anonymous views
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  viewedAt: timestamp('viewed_at').defaultNow().notNull(),
  metadata: jsonb('metadata').default({}),
}, (table) => [
  index('viewers_entity_idx').on(table.entityId, table.entityType),
  index('viewers_user_idx').on(table.userId),
  index('viewers_viewed_at_idx').on(table.viewedAt)
]);

// Relations
export const viewersRelations = relations(viewers, ({ one }) => ({
  user: one(users, {
    fields: [viewers.userId],
    references: [users.id],
  }),
}));

// Relations loaded types
export type ViewerWithRelations = Viewer & {
  user?: User;
};


// ============================================================================
// TYPES COMPLETS POUR TOUTES LES TABLES
// ============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
// export type TwoFactor = typeof two_factors.$inferSelect;
export type Verification = typeof verification.$inferSelect;
export type Passkey = typeof passkey.$inferSelect;
// Types
export type Viewer = typeof viewers.$inferSelect;
export type NewViewer = typeof viewers.$inferInsert;


export type UserWallet = typeof userWallets.$inferSelect;
export type NewUserWallet = typeof userWallets.$inferInsert;

export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type NewWalletTransaction = typeof walletTransactions.$inferInsert;

export type Receipt = typeof receipts.$inferSelect;
export type NewReceipt = typeof receipts.$inferInsert;

export type ReceiptWithRelations = Receipt & {
  user?: User;
  transaction?: WalletTransaction;
};


export type Request = typeof requests.$inferSelect;
export type NewRequest = typeof requests.$inferInsert;

export type VipSubscription = typeof vipSubscriptions.$inferSelect;
export type NewVipSubscription = typeof vipSubscriptions.$inferInsert;

export type Shop = typeof shops.$inferSelect;
export type NewShop = typeof shops.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type CategoryWithChildren = Category & {
  children?: CategoryWithChildren[];
};

export type EntityCategory = typeof entityCategories.$inferSelect;
export type NewEntityCategory = typeof entityCategories.$inferInsert;

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type Neworder = typeof orders.$inferInsert;

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;

export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;

export type Tournament = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;

export type TournamentMember = typeof tournamentMembers.$inferSelect;
export type NewTournamentMember = typeof tournamentMembers.$inferInsert;

export type TournamentEdition = typeof tournamentEditions.$inferSelect;
export type NewTournamentEdition = typeof tournamentEditions.$inferInsert;

export type EditionRegistration = typeof editionRegistrations.$inferSelect;
export type NewEditionRegistration = typeof editionRegistrations.$inferInsert;

export type RegistrationPayment = typeof registrationPayments.$inferSelect;
export type NewRegistrationPayment = typeof registrationPayments.$inferInsert;

export type TournamentPhase = typeof tournamentPhases.$inferSelect;
export type NewTournamentPhase = typeof tournamentPhases.$inferInsert;

export type PhaseGroup = typeof phaseGroups.$inferSelect;
export type NewPhaseGroup = typeof phaseGroups.$inferInsert;

export type PhaseGroupParticipant = typeof phaseGroupParticipants.$inferSelect;
export type NewPhaseGroupParticipant = typeof phaseGroupParticipants.$inferInsert;

export type BracketNode = typeof bracketNodes.$inferSelect;
export type NewBracketNode = typeof bracketNodes.$inferInsert;

export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;

export type EditionResult = typeof editionResults.$inferSelect;
export type NewEditionResult = typeof editionResults.$inferInsert;

export type Game = typeof games.$inferSelect;
export type NewGame = typeof games.$inferInsert;

export type GameItem = typeof gameItems.$inferSelect;
export type NewGameItem = typeof gameItems.$inferInsert;

// export type GameItemRequest = typeof gameItemRequests.$inferSelect;
// export type NewGameItemRequest = typeof gameItemRequests.$inferInsert;

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;

export type GameClip = typeof gameClips.$inferSelect;
export type NewGameClip = typeof gameClips.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;

export type Group = typeof groups.$inferSelect;
export type NewGroup = typeof groups.$inferInsert;

export type GroupMember = typeof groupMembers.$inferSelect;
export type NewGroupMember = typeof groupMembers.$inferInsert;

export type Interaction = typeof interactions.$inferSelect;
export type NewInteraction = typeof interactions.$inferInsert;

export type Media = typeof medias.$inferSelect;
export type NewMedia = typeof medias.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;

export type Theme = typeof themes.$inferSelect;
export type NewTheme = typeof themes.$inferInsert;

export type ThemePurchase = typeof themePurchases.$inferSelect;
export type NewThemePurchase = typeof themePurchases.$inferInsert;

export type Announcement = typeof announcements.$inferSelect;
export type NewAnnouncement = typeof announcements.$inferInsert;

export type AnnouncementRead = typeof announcementReads.$inferSelect;
export type NewAnnouncementRead = typeof announcementReads.$inferInsert;

export type SearchHistory = typeof searchHistory.$inferSelect;
export type NewSearchHistory = typeof searchHistory.$inferInsert;

export type Claim = typeof claims.$inferSelect;
export type NewClaim = typeof claims.$inferInsert;

export type UserTrace = typeof userTraces.$inferSelect;
export type NewUserTrace = typeof userTraces.$inferInsert;

export type AppSettings = typeof appSettings.$inferSelect;
export type NewAppSettings = typeof appSettings.$inferInsert;

// export type TraceType = typeof traceTypeEnum;
export type UserTracesType = typeof userTraces.$inferInsert;

// ============================================================================
// PARTENAIRES - TYPES
// ============================================================================

export type Partner = typeof partners.$inferSelect;
export type NewPartner = typeof partners.$inferInsert;

export type Partnership = typeof partnerships.$inferSelect;
export type NewPartnership = typeof partnerships.$inferInsert;


// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

// Types pour les relations chargées
export type UserWithRelations = User & {
  wallet?: UserWallet;
  vipSubscription?: VipSubscription;
  shops?: Shop[];
  products?: Product[];
  tournaments?: Tournament[];
  gameClips?: GameClip[];
  posts?: Post[];
  announcements?: Announcement[];
  transactions?: WalletTransaction[];
  notifications?: Notification[];
  interactions?: Interaction[];
  searches?: SearchHistory[];
  sessions?: Session[];
  accounts?: Account[];
  viewers?: Viewer[];
  traces?: UserTrace[];
  requests?: Request[];

  stats?: {
      shopsCount: number;
      tournamentsCount: number;
      productsCount: number;
      followersCount: number;
      followingCount: number;
  };
  // twoFactors?: TwoFactor[];
};

export type ShopWithRelations = Shop & {
  owner?: User;
  products?: Product[];
  orders?: Order[];
  categories?: EntityCategory[]; // Utilise EntityCategory pour la jointure
};

export type TournamentWithRelations = Tournament & {
  organizer?: User;
  editions?: TournamentEdition[];
  members?: TournamentMember[];
  theme?: Theme;
};

export type TournamentEditionWithRelations = TournamentEdition & {
  tournament?: Tournament;
  registrations?: EditionRegistration[];
  phases?: TournamentPhase[];
  results?: EditionResult[];
};

export type TournamentMemberWithRelations = TournamentMember & {
  tournament?: Tournament;
  user?: User;
  team?: Team;
};

export type EditionRegistrationWithRelations = EditionRegistration & {
  edition?: TournamentEdition;
  member?: TournamentMember;
  payment?: RegistrationPayment;
};

export type TournamentPhaseWithRelations = TournamentPhase & {
  edition?: TournamentEdition;
  groups?: PhaseGroup[];
  bracketNodes?: BracketNode[];
  matches?: Match[];
};

export type PhaseGroupWithRelations = PhaseGroup & {
  phase?: TournamentPhase;
  participants?: PhaseGroupParticipant[];
};

export type PhaseGroupParticipantWithRelations = PhaseGroupParticipant & {
  group?: PhaseGroup;
  registration?: EditionRegistration;
};

export type BracketNodeWithRelations = BracketNode & {
  phase?: TournamentPhase;
  group?: PhaseGroup;
  parent?: BracketNode;
  children?: BracketNode[];
  match?: Match;
};

export type MatchWithRelations = Match & {
  edition?: TournamentEdition;
  phase?: TournamentPhase;
  group?: PhaseGroup;
  bracketNode?: BracketNode;
  participant1?: EditionRegistration;
  participant2?: EditionRegistration;
  winner?: EditionRegistration;
  loser?: EditionRegistration;
};

export type EditionResultWithRelations = EditionResult & {
  edition?: TournamentEdition;
  registration?: EditionRegistration;
  paymentTransaction?: WalletTransaction;
};

export type RegistrationPaymentWithRelations = RegistrationPayment & {
  registration?: EditionRegistration;
  transaction?: WalletTransaction;
};

export type TeamWithRelations = Team & {
  captain?: User;
  viceCaptain?: User;
  members?: TeamMember[];
};

export type TeamMemberWithRelations = TeamMember & {
  team?: Team;
  user?: User;
};

export type ProductWithRelations = Product & {
  shop?: Shop;
  user?: User;
  category?: Category; // Utilise Category (catégorie principale)
  orders?: Order[];
  medias?: Media;
};

export type OrderWithRelations = Order & {
  shop?: Shop;
  buyer?: User;
  product?: Product;
  transaction?: WalletTransaction;
  medias?: Media[];
};



export type RequestWithRelations = Request & {
  user?: User;
  gameItem?: GameItem;
  transaction?: WalletTransaction;
  processedBy?: User;
};

export type GameItemWithRelations = GameItem & {
  game?: Game;
};

export type GameWithRelations = Game & {
  gameItems?: GameItem[];
};

export type GameClipWithRelations = GameClip & {
  author?: User;
  shop?: Shop;
  game?: Game;
  
};

export type MessageWithRelations = Message & {
  sender?: User;
  recipient?: User;
  group?: Group;
  parentMessage?: Message;
  replies?: Message[];
  shop?: Shop;
  post?: Post;
  product?: Product;
  interactions?: Interaction[];
};

export type InteractionWithRelations = Interaction & {
  user?: User;
  post?: Post;
  product?: Product;
  message?: Message;
  tournament?: Tournament;
  shop?: Shop;
  theme?: Theme;
  game?: Game;
  gameItem?: GameItem;
  gameClip?: GameClip;
};


// Types pour les filtres et requêtes courantes
export interface PaginationParams {
  page: number;
  limit: number;
  total: string;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Types de base pour les filtres
export interface BaseFilters {
  search?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  isActive?: boolean;
  isDeleted?: boolean;
}

export interface SearchParams {
  query: string;
  filters?: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Types pour les données JSONB
export interface UserSettings {
  language?: string;
  currency?: string;
  theme?: string;
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy?: {
    showEmail: boolean;
    showPhone: boolean;
    showBalance: boolean;
  };
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
}

export interface SocialMedia {
  platform: string;
  url: string;
  username?: string;
}

export interface NotificationSettings {
  notifyOnNewOrder: boolean;
  notifyOnNewMessage: boolean;
  channels: string[];
  webhookUrl?: string;
}

export interface ThemeConfig {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    text: string;
  };
  fonts: {
    primary: string;
    secondary: string;
  };
  layout: {
    header: string;
    sidebar: string;
    footer: string;
  };
  customCss?: string;
}

export interface VipBenefits {
  productLimit?: number;
  shopLimit?: number;
  tournamentLimit?: number;
  themeLimit?: number;
  storyLimit?: number;
  customThemeCreation?: boolean;
  themeSales?: boolean;
  lowerFees?: boolean;
  prioritySupport?: boolean;
  badgeDisplay?: boolean;
  analyticsAccess?: boolean;
}

// Types pour les configurations de tournoi
export interface PhaseConfig {
  qualifiedCount?: number;
  groupsCount: number;
  matchesPerGroup?: number;
  advanceFromGroup: number;
  seeding?: 'RANDOM' | 'RANKING' | 'MANUAL';
}

export interface GroupConfig {
  matchesPerParticipant: number;
  advanceCount: number;
  seeding: 'RANDOM' | 'RANKING' | 'MANUAL';
  pointsPerWin?: number;
  pointsPerDraw?: number;
  pointsPerLoss?: number;
}

export interface CategoryMetadata {
  gameSpecific?: {
    minLevel?: number;
    maxLevel?: number;
    platforms?: string[];
  };
  tournamentSpecific?: {
    teamSize?: number;
    format?: string;
  };
  productSpecific?: {
    accountTypes?: string[];
  };
}

// Types pour les métadonnées de transaction
export interface PurchaseMetadata {
  productId?: string;
  shopId?: string;
  orderId?: string;
  productTitle?: string;
}

export interface GameItemMetadata {
  gameItemId: string;
  gameName: string;
  itemName: string;
  quantity: number;
}

export interface ThemePurchaseMetadata {
  themeId: string;
  themeName: string;
  isPremium: boolean;
}

export interface TournamentParticipationMetadata {
  tournamentId: string;
  tournamentTitle: string;
  participantType: 'individual' | 'team';
}

export interface TransferMetadata {
  transferType: 'user_to_user' | 'wallet_to_wallet';
  notes?: string;
}

export type EntityType = typeof interactions.$inferSelect.entityType

export interface DepositMetadata {
  paymentMethod: string;
  externalRef?: string;
  depositRequestId?: string;
}

// ============================================================================
// TYPES SUPPLÉMENTAIRES
// ============================================================================

export type Blog = typeof blogs.$inferSelect;
export type NewBlog = typeof blogs.$inferInsert;

export type Service = typeof services.$inferSelect;
export type NewService = typeof services.$inferInsert;

export type Guide = typeof guides.$inferSelect;
export type NewGuide = typeof guides.$inferInsert;

export type GuideStep = typeof guideSteps.$inferSelect;
export type NewGuideStep = typeof guideSteps.$inferInsert;


// Types pour les relations chargées
export type BlogWithRelations = Blog & {
  author?: User;
  medias?: Media;
  interactions?: Interaction;
};
// Types pour les relations chargées
export type PostWithRelations = Post & {
  author?: User;
  interactions?: Interaction;
  messages?: Message;
  medias?: Media;
};

export type ServiceWithRelations = Service & {
  admin?: User;
  medias?: Media;
};

export type GuideWithRelations = Guide & {
  admin?: User;
  steps?: GuideStep[];
};

export type GuideStepWithRelations = GuideStep & {
  guide?: Guide;
  medias?: Media;
};

export type PartnerWithRelations = Partner & {
  partnerships?: Partnership[];
}

export type PartnershipWithRelations = Partnership & {
  partner?: Partner;
}


// Union type pour tous les métadonnées de transaction
export type TransactionMetadata =
  | PurchaseMetadata
  | GameItemMetadata
  | ThemePurchaseMetadata
  | TournamentParticipationMetadata
  | TransferMetadata
  | DepositMetadata
  | Record<string, any>;