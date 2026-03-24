// @/types/view-models.ts
// ============================================================================
// UI-DRIVEN VIEW MODELS — Replace generic *WithRelations types
// Each type is designed for a specific UI use-case
// ============================================================================

// ============================================================================
// MINI TYPES — Minimal references (embeddable in other objects)
// ============================================================================

export type UserMini = {
  id: string;
  username: string | null;
  fullName: string | null;
  profileImage: string | null;
  isVip: boolean | null;
};

export type ShopMini = {
  id: string;
  name: string;
  profileImage: string | null;
  verified: boolean;
  ownerId?: string;
  productCount?: number;
};

export type TournamentMini = {
  id: string;
  name: string;
  profileImage: string | null;
  game: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
};

export type GameMini = {
  id: string;
  name: string;
  profileImage: string | null;
};

export type CategoryMini = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export type TeamMini = {
  id: string;
  name: string;
  logo: string | null;
};

export type PartnerMini = {
  id: string;
  name: string;
  logo: string | null;
};

export type EditionMini = {
  id: string;
  editionNumber: number;
  name: string | null;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
  startDate: Date;
};

export type PhaseMini = {
  id: string;
  name: string;
  phaseType: string | null;
  order: number;
};

export type GroupMini = {
  id: string;
  name: string;
  order: number;
};

export type MatchMini = {
  id: string;
  matchCode: string | null;
  round: number;
  matchNumber: number;
  status: string | null;
};

// ============================================================================
// CARD TYPES — Listing / feed UI
// ============================================================================

export type ProductCard = {
  id: string;
  name: string;
  price: string;
  currency: string | null;
  featuredImage: string | null;
  images: string[] | null;
  game: string | null;
  platform: string | null;
  status: string | null;
  viewCount: number | null;
  isNegotiable: boolean | null;
  isFeatured: boolean | null;
  createdAt: Date | null;
  // Mini relations
  shop?: ShopMini;
  category?: CategoryMini;
};

export type ShopCard = {
  id: string;
  name: string;
  description: string | null;
  profileImage: string | null;
  coverImage: string | null;
  country: string | null;
  productCount: number | null;
  viewCount: number | null;
  verified: boolean | null;
  featured: boolean | null;
  isActive: boolean | null;
  isDeleted: boolean | null;
  website: string | null;
  socialMedia: any;
  createdAt: Date | null;
  // Mini relations
  owner?: UserMini;
};

export type TournamentCard = {
  id: string;
  name: string;
  slug: string | null;
  shortDescription: string | null;
  profileImage: string | null;
  coverImage: string | null;
  game: string;
  platform: string | null;
  status: string | null;
  totalEditions: number | null;
  totalParticipants: number | null;
  totalPrizePool: string | null;
  viewCount: number | null;
  featured: boolean | null;
  verified: boolean | null;
  createdAt: Date | null;
  // Mini relations
  organizer?: UserMini;
};

export type BlogCard = {
  id: string;
  title: string;
  slug?: string | null;
  content: string;
  images: string[] | null;
  isActive: boolean | null;
  createdAt: Date | null;
  // Mini relations
  author?: UserMini;
};

export type ServiceCard = {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  images: string[] | null;
  isActive: boolean | null;
  createdAt: Date | null;
  // Mini relations
  admin?: UserMini;
};

export type GameCard = {
  id: string;
  name: string;
  description: string | null;
  profileImage: string | null;
  coverImage: string | null;
  publisher: string | null;
  genre: string | null;
  platforms: string[] | null;
  featured: boolean | null;
  popularity: number | null;
  website: string | null;
  minAge: number | null;
  isActive: boolean | null;
};

export type OrderCard = {
  id: string;
  price: string;
  status: string | null;
  orderType: string | null;
  message: string | null;
  createdAt: Date | null;
  // Mini relations
  buyer?: UserMini;
  product?: { id: string; name: string; featuredImage: string | null; price: string };
  shop?: ShopMini;
};

export type PostCard = {
  id: string;
  content: string | null;
  images: string[] | null;
  video: string | null;
  isStory: boolean | null;
  expiresAt: Date | null;
  createdAt: Date | null;
  // Mini relations
  author?: UserMini;
};

export type PartnerCard = {
  id: string;
  name: string;
  slug: string | null;
  shortDescription: string | null;
  type: Partner['type'];
  logo: string | null;
  coverImage: string | null;
  website: string | null;
  status: string | null;
  verified: boolean | null;
  totalPartnerships: number | null;
  viewCount: number | null;
  country: string | null;
  createdAt: Date | null;
};

export type AnnouncementCard = {
  id: string;
  title: string;
  content: string;
  type: string | null;
  images: string[] | null;
  video: string | null;
  isActive: boolean | null;
  isPinned: boolean | null;
  createdAt: Date | null;
  authorId: string; // Add this for consistency with columns
  // Mini relations
  author?: UserMini;
};

export type GameClipCard = {
  id: string;
  caption: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  images: string[] | null;
  duration: number | null;
  viewCount: number | null;
  game?: GameMini | null;
  createdAt: Date | null;
  authorId: string;
  // Mini relations
  author?: UserMini;
  // Stats
  stats?: GameClipStats;
};

export type GameClipStats = {
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  liked?: boolean;
  bookmarked?: boolean;
};

export type UserCard = {
  id: string;
  username: string | null;
  fullName: string | null;
  profileImage: string | null;
  coverImage: string | null;
  bio: string | null;
  country: string | null;
  isVip: boolean;
  level: string | null;
  createdAt: Date;
};

// ============================================================================
// DETAIL TYPES — Full page / detail view
// ============================================================================

import type {
  Product, Shop, Tournament, User, Game, Blog, Service,
  Order, Post, Partner, TournamentEdition, Category,
} from '@/database/schema';

export type ProductDetail = Product & {
  shop?: ShopMini;
  user?: UserMini;
  category?: CategoryMini;
  stats?: ProductDetailStats;
};

export type ShopDetail = Shop & {
  owner?: UserMini;
  stats?: ShopDetailStats;
};

export type TournamentDetail = Tournament & {
  organizer?: UserMini;
  editions?: Pick<TournamentEdition,
    'id' | 'editionNumber' | 'name' | 'status' | 'startDate' | 'endDate' |
    'currentParticipants' | 'maxParticipants' | 'prizePool'
  >[];
};

export type GameDetail = Game & {
  items?: { id: string; name: string; type: string; priceGtc: string; icon: string | null }[];
};

export type PartnerDetail = Partner & {
  stats?: PartnerDetailStats;
};

// ============================================================================
// STATS TYPES — Aggregated data for dashboards
// ============================================================================

export type ProductStats = {
  total: number;
  active: number;
  featured: number;
  sold: number;
  reserved: number;
  averagePrice: number;
};

export type ShopStats = {
  total: number;
  active: number;
  visible: number;
  verified: number;
  featured: number;
  totalProducts: number | string;
  totalViews: number | string;
  totalFollowers: number;
  totalBalance: string;
  averageProducts: number;
  averageViews: number;
  averageFollowers: number;
  averageBalance: number | string;
};

export type ProductDetailStats = {
  viewCount: number;
  orderCount: number;
  likeCount: number;
};

export type ShopDetailStats = {
  productCount: number;
  viewCount: number;
  followerCount: number;
  balance: string;
  totalSales: number;
};

export type PartnerDetailStats = {
  totalPartnerships: number;
  totalInvestment: string | number;
  viewCount: number;
  followerCount: number;
};

export type TournamentStats = {
  total: number;
  upcoming: number;
  live: number;
  completed: number;
  cancelled: number;
  private: number;
};

// ============================================================================
// CONTEXT TYPES — Composite queries for pages
// ============================================================================

export type ProductContext = {
  product: ProductDetail;
  stats: ProductStats;
  related: ProductCard[];
};

export type ShopContext = {
  shop: ShopDetail;
  stats: ShopDetailStats;
  topProducts: ProductCard[];
};

export type TournamentContext = {
  tournament: TournamentDetail;
  stats: TournamentStats;
};

// ============================================================================
// COLUMN SELECTION HELPERS
// ============================================================================

/** Columns to select for UserMini */
export const USER_MINI_COLUMNS = {
  id: true,
  username: true,
  fullName: true,
  profileImage: true,
  isVip: true,
} as const;

/** Columns to select for ShopMini */
export const SHOP_MINI_COLUMNS = {
  id: true,
  name: true,
  profileImage: true,
  verified: true,
  ownerId: true
} as const;

/** Columns to select for CategoryMini */
export const CATEGORY_MINI_COLUMNS = {
  id: true,
  name: true,
  slug: true,
  icon: true,
} as const;

/** Columns to select for ProductCard in relational queries */
export const PRODUCT_CARD_COLUMNS = {
  id: true,
  name: true,
  price: true,
  currency: true,
  featuredImage: true,
  images: true,
  game: true,
  platform: true,
  status: true,
  viewCount: true,
  isNegotiable: true,
  isFeatured: true,
  createdAt: true,
  shopId: true,
  categoryId: true,
} as const;

/** Columns to select for ShopCard */
export const SHOP_CARD_COLUMNS = {
  id: true,
  name: true,
  description: true,
  profileImage: true,
  coverImage: true,
  country: true,
  productCount: true,
  viewCount: true,
  verified: true,
  featured: true,
  isActive: true,
  isDeleted: true,
  website: true,
  socialMedia: true,
  createdAt: true,
  ownerId: true,
} as const;

/** Columns to select for TournamentCard */
export const TOURNAMENT_CARD_COLUMNS = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  profileImage: true,
  coverImage: true,
  game: true,
  platform: true,
  status: true,
  totalEditions: true,
  totalParticipants: true,
  totalPrizePool: true,
  viewCount: true,
  featured: true,
  verified: true,
  createdAt: true,
  organizerId: true,
} as const;

/** Columns to select for TournamentMini */
export const TOURNAMENT_MINI_COLUMNS = {
  id: true,
  name: true,
  profileImage: true,
  game: true,
  status: true,
} as const;

/** Columns to select for TeamMini */
export const TEAM_MINI_COLUMNS = {
  id: true,
  name: true,
  logo: true,
} as const;

/** Columns for edition listing (inside tournament detail) */
export const EDITION_SUMMARY_COLUMNS = {
  id: true,
  editionNumber: true,
  name: true,
  status: true,
  startDate: true,
  endDate: true,
  currentParticipants: true,
  maxParticipants: true,
  prizePool: true,
} as const;

/** Columns to select for BlogCard */
export const BLOG_CARD_COLUMNS = {
  id: true,
  title: true,
  content: true,
  images: true,
  isActive: true,
  createdAt: true,
  authorId: true,
} as const;

/** Columns to select for ServiceCard */
export const SERVICE_CARD_COLUMNS = {
  id: true,
  title: true,
  description: true,
  icon: true,
  images: true,
  isActive: true,
  createdAt: true,
  adminId: true,
} as const;

/** Columns to select for GameCard */
export const GAME_CARD_COLUMNS = {
  id: true,
  name: true,
  description: true,
  profileImage: true,
  coverImage: true,
  publisher: true,
  genre: true,
  platforms: true,
  featured: true,
  popularity: true,
  website: true,
  minAge: true,
  isActive: true,
} as const;

/** Columns to select for GameClipCard */
export const GAME_CLIP_CARD_COLUMNS = {
  id: true,
  caption: true,
  videoUrl: true,
  images: true,
  duration: true,
  thumbnailUrl: true,
  viewCount: true,
  gameId: true,
  createdAt: true,
  authorId: true,
} as const;

/** Columns to select for PartnerCard */
/** Columns to select for PartnerCard */
export const PARTNER_CARD_COLUMNS = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  type: true,
  logo: true,
  coverImage: true,
  website: true,
  status: true,
  verified: true,
  totalPartnerships: true,
  viewCount: true,
  country: true,
  createdAt: true,
} as const;

/** Columns to select for AnnouncementCard */
export const ANNOUNCEMENT_CARD_COLUMNS = {
  id: true,
  title: true,
  content: true,
  type: true,
  images: true,
  video: true,
  isActive: true,
  isPinned: true,
  createdAt: true,
  authorId: true,
} as const;

/** Columns to select for PostCard */
export const POST_CARD_COLUMNS = {
  id: true,
  content: true,
  images: true,
  video: true,
  isStory: true,
  expiresAt: true,
  createdAt: true,
  authorId: true,
} as const;

/** Columns to select for OrderCard */
export const ORDER_CARD_COLUMNS = {
  id: true,
  price: true,
  status: true,
  orderType: true,
  message: true,
  createdAt: true,
  buyerId: true,
  productId: true,
  shopId: true,
} as const;

/** Columns to select for GameClipCard */
// export const GAME_CLIP_CARD_COLUMNS = {
//   id: true,
//   title: true,
//   description: true,
//   videoUrl: true,
//   thumbnailUrl: true,
//   viewCount: true,
//   game: true,
//   createdAt: true,
//   authorId: true,
// } as const;

// ============================================================================
// PAGINATION DEFAULTS
// ============================================================================

export const PAGINATION_DEFAULTS = {
  FEED: 20,
  DASHBOARD: 30,
  ADMIN: 50,
  RELATED: 6,
  MINI_LIST: 10,
} as const;
