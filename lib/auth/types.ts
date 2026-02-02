// lib/auth/types.ts
export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  fullName?: string;
  profileImage?: string;
  coverImage?: string;
  bio?: string;
  website?: string;
  country?: string;
  countryCode?: string;
  phoneNumber?: string;
  isPublicProfile: boolean;
  // isVerified: boolean;
  isVip: boolean;
  isAdmin: boolean;
  level: 'A' | 'B' | 'C';
  accountTypes: ('SELLER' | 'BUYER' | 'TRADER' | 'TOURNAMENT_ORGANIZER' | 'VIP')[];
  lastLogin?: Date;
  
  // Relations étendues
  wallet?: UserWallet;
  shops?: Shop[];
  tournaments?: Tournament[];
  card?: UserCard;
  vipSubscription?: VipSubscription;
}

export interface UserWallet {
  id: string;
  balance: number;
  isActive: boolean;
  isLocked: boolean;
  verificationStatus: string;
}

export interface Shop {
  id: string;
  name: string;
  description?: string;
  profileImage?: string;
  coverImage?: string;
  verified: boolean;
  productCount: number;
  followerCount: number;
}

export interface Tournament {
  id: string;
  name: string;
  game: string;
  status: string;
  startDate: Date;
  prizePool?: number;
}

export interface UserCard {
  id: string;
  cardNumberHash: string;
  isActive: boolean;
  isLocked: boolean;
  balance: number;
  verificationStatus: string;
}

export interface VipSubscription {
  id: string;
  planType: string;
  status: string;
  startDate: Date;
  endDate: Date;
  activeBenefits: string[];
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  session?: any;
  error?: string;
}

export interface CompleteUserData {
  user: AuthUser;
  wallet?: UserWallet;
  shops: Shop[];
  tournaments: Tournament[];
  card?: UserCard;
  vipSubscription?: VipSubscription;
  stats: {
    shopsCount: number;
    tournamentsCount: number;
    productsCount: number;
    followersCount: number;
    followingCount: number;
  };
}