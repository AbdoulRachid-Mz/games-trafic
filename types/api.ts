// ============================================================================
// API TYPES - Types pour toutes les requêtes API avec pagination, filtres et options
// Basé sur le schéma Drizzle actuel
// ============================================================================

import { getGameClips, getGameItems, getOrders, getProducts, getShops, getThemes, getTournaments, getUsers } from "@/actions/entities";
import {
  BracketNodeWithRelations,
  EditionRegistrationWithRelations,
  EditionResultWithRelations,
  EntityType,
  MatchWithRelations,
  NewEditionRegistration,
  NewMatch,
  NewTournament,
  NewTournamentEdition,
  PhaseGroupParticipant,
  PhaseGroupParticipantWithRelations,
  PhaseGroupWithRelations,
  TournamentEditionWithRelations,
  TournamentPhaseWithRelations,
  TournamentWithRelations,
  User,
} from "@/database/schema";
import { schema } from "better-auth/client/plugins";

// Types de base pour la pagination
export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// export type ApiListResponse<T> = PaginationResponse<T>;

// Types de base pour le tri
export interface SortOptions {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Types de base pour les filtres
export interface BaseFilters {
  search?: string;
  startDate?: Date | string;
  endDate?: Date | string;
  isActive?: boolean;
  isDeleted?: boolean;
  withRelations?: boolean;
}

// Type pour les paramètres de requête
export interface EntityQueryParams extends BaseFilters, SortOptions {
  page?: number;
  limit?: number;
  offset?: number;
  [key: string]: any;
}

// Type pour les noms de tables
export type TableName = keyof typeof schema;

// Export d'une map pour faciliter l'accès aux fonctions spécifiques
export const entityFetchers = {
  users: getUsers,
  shops: getShops,
  products: getProducts,
  tournaments: getTournaments,
  gameClips: getGameClips,
  orders: getOrders,
  themes: getThemes,
  gameItems: getGameItems,
  // Ajouter d'autres fonctions spécifiques ici au besoin
} as const;



// ============================================================================
// FILTRES SPÉCIFIQUES PAR TABLE - Basés sur le schéma Drizzle
// ============================================================================

// Users - Basé sur la table `users`
export interface UserFilters extends BaseFilters {
  id?: string;
  authUid?: string;
  email?: string;
  emailVerified?: boolean;
  username?: string;
  fullName?: string;
  phoneNumber?: string;
  country?: string;
  countryCode?: string;
  isPublicProfile?: boolean;
  isVip?: boolean;
  isAdmin?: boolean;
  isAnonymous?: boolean;
  role?: string;
  banned?: boolean;
  accountTypes?: string[];
  level?: ("A" | "B" | "C")[];
  shopsCreatedCountMin?: number;
  shopsCreatedCountMax?: number;
  tournamentsCreatedCountMin?: number;
  tournamentsCreatedCountMax?: number;
  postsCreatedCountMin?: number;
  postsCreatedCountMax?: number;
  lastLoginFrom?: Date | string;
  lastLoginTo?: Date | string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// User Wallets - Basé sur la table `userWallets`
export interface UserWalletFilters extends BaseFilters {
  id?: string;
  userId?: string;
  financialAccountId?: string;
  isActive?: boolean;
  isLocked?: boolean;
  verificationStatus?: string[];
  failedAttemptsMin?: number;
  failedAttemptsMax?: number;
  verifiedFrom?: Date | string;
  verifiedTo?: Date | string;
}

// Wallet Transactions - Basé sur la table `walletTransactions`
export interface WalletTransactionFilters extends BaseFilters {
  id?: string;
  walletId?: string;
  financialAccountId?: string;
  shopId?: string; // Ajouté pour filtrer par boutique
  fromUserId?: string;
  toUserId?: string;
  types?: (
    | "PURCHASE"
    | "VIP_SUBSCRIPTION"
    | "GAME_ITEM_PURCHASE"
    | "THEME_PURCHASE"
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "REFUND"
    | "TRANSFER"
    | "ORDER_PURCHASE"
    | "TOURNAMENT_PARTICIPATION"
  )[];
  statuses?: ("PENDING" | "COMPLETED" | "PROCESSING" | "FAILED" | "REFUNDED")[];
  amountMin?: number;
  amountMax?: number;
  feesMin?: number;
  feesMax?: number;
  netAmountMin?: number;
  netAmountMax?: number;
  currency?: string;
  description?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Receipts - Basé sur la table `receipts`
export interface ReceiptFilters extends BaseFilters {
  id?: string;
  userId?: string;
  transactionId?: string;
  types?: (
    | "PURCHASE"
    | "VIP_SUBSCRIPTION"
    | "GAME_ITEM_PURCHASE"
    | "THEME_PURCHASE"
    | "DEPOSIT"
    | "WITHDRAWAL"
    | "REFUND"
    | "TRANSFER"
    | "ORDER_PURCHASE"
    | "TOURNAMENT_PARTICIPATION"
  )[];
  statuses?: ("PENDING" | "COMPLETED" | "PROCESSING" | "FAILED" | "REFUNDED")[];
  amountMin?: number;
  amountMax?: number;
  currency?: string;
  description?: string;
}

// Partners - Based on `partners`
export interface PartnerFilters extends BaseFilters {
  id?: string;
  userId?: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  website?: string;
  country?: string;
  city?: string;
  postalCode?: string;
  address?: string;
  partnerType?: (
    | "INDIVIDUAL"
    | "COMPANY"
    | "ORGANIZATION"
    | "AFFILIATE"
    | "SPONSOR"
    | "VENDOR"
    | "SERVICE_PROVIDER"
    | "PLATFORM"
    | "OTHER"
  )[];
  status?: ("PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED" | "TERMINATED")[];
  commissionRateMin?: number;
  commissionRateMax?: number;
  commissionFixedMin?: number;
  commissionFixedMax?: number;
  totalReferralsMin?: number;
  totalReferralsMax?: number;
  successfulReferralsMin?: number;
  successfulReferralsMax?: number;
  totalCommissionEarnedMin?: number;
  totalCommissionEarnedMax?: number;
  totalPaidOutMin?: number;
  totalPaidOutMax?: number;
  balanceDueMin?: number;
  balanceDueMax?: number;
  taxId?: string;
  taxStatus?: ("PENDING" | "VERIFIED" | "REJECTED")[];
  notes?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
  lastActivityFrom?: Date | string;
  lastActivityTo?: Date | string;
  isDeleted?: boolean;
}

// Requests - Basé sur la table `requests`
export interface RequestFilters extends BaseFilters {
  id?: string;
  userId?: string;
  types?: ("DEPOSIT" | "WITHDRAWAL" | "OTHER")[];
  statuses?: ("PENDING" | "APPROVED" | "REJECTED" | "COMPLETED")[];
  amountMin?: number;
  amountMax?: number;
  currency?: string;
  paymentMethod?: string[];
  paymentProvider?: string[];
  rejectionReason?: string;
  rejectedBy?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
  rejectedFrom?: Date | string;
  rejectedTo?: Date | string;
  isDeleted?: boolean; // Ajouté pour cohérence avec le schéma
}

// ============================================================================
// LEDGER-BASED FILTERS
// ============================================================================

// Financial Accounts - Basé sur la table `financial_accounts`
export interface FinancialAccountFilters extends BaseFilters {
  id?: string;
  ownerUserId?: string;
  ownerShopId?: string;
  types?: (
    | "USER_WALLET"
    | "SHOP_WALLET"
    | "PLATFORM_ESCROW"
    | "PLATFORM_FEES"
    | "TOURNAMENT_POOL"
    | "SYSTEM_ADJUSTMENT"
  )[];
  currency?: string;
  isActive?: boolean;
  isLocked?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Ledger Entries - Basé sur la table `ledger_entries`
export interface LedgerEntryFilters extends BaseFilters {
  id?: string;
  transactionId?: string;
  accountId?: string;
  debitMin?: number;
  debitMax?: number;
  creditMin?: number;
  creditMax?: number;
  currency?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// VIP Subscriptions - Basé sur la table `vipSubscriptions`
export interface VipSubscriptionFilters extends BaseFilters {
  id?: string;
  userId?: string;
  planTypes?: ("MONTHLY" | "YEARLY" | "LIFETIME")[];
  statuses?: ("ACTIVE" | "EXPIRED" | "CANCELLED")[];
  startDateFrom?: Date | string;
  startDateTo?: Date | string;
  endDateFrom?: Date | string;
  endDateTo?: Date | string;
  autoRenew?: boolean;
  pricePaidMin?: number;
  pricePaidMax?: number;
  currency?: string;
}

// Shops - Basé sur la table `shops`
export interface ShopFilters extends BaseFilters {
  id?: string;
  ownerId?: string;
  name?: string;
  country?: string;
  verified?: boolean;
  featured?: boolean;
  isVisible?: boolean;
  productCountMin?: number;
  productCountMax?: number;
  followerCountMin?: number;
  followerCountMax?: number;
  followerCount?: number;
  viewCountMin?: number;
  viewCountMax?: number;
  balanceMin?: number;
  balanceMax?: number;
  themeId?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Categories - Basé sur la table `categories`
export interface CategoryFilters extends BaseFilters {
  id?: string;
  name?: string;
  slug?: string;
  parentId?: string;
  level?: number;
  path?: string;
  fullPath?: string;
  applicableEntities?: (
    | "PRODUCT"
    | "POST"
    | "SHOP"
    | "TOURNAMENT"
    | "USER"
    | "BLOG"
    | "MESSAGE"
    | "TEAM"
    | "THEME"
    | "NEWS"
    | "GROUP"
    | "ANNOUNCEMENT"
    | "SERVICE"
    | "GUIDE"
    | "COMMENT"
    | "MATCH"
  )[];
  isFeatured?: boolean;
  itemCountMin?: number;
  itemCountMax?: number;
  sortOrderMin?: number;
  sortOrderMax?: number;
}

// Products - Basé sur la table `products`
export interface ProductFilters extends BaseFilters {
  id?: string;
  shopId?: string;
  userId?: string;
  categoryId?: string;
  name?: string;
  game?: string;
  platform?: (
    | "PC"
    | "PLAYSTATION"
    | "XBOX"
    | "NINTENDO_SWITCH"
    | "MOBILE"
    | "VR"
    | "OTHER"
  )[];
  status?: (
    | "NON_VENDU"
    | "RESERVE"
    | "EN_ECHANGE"
    | "LIVRE"
    | "VENDU"
    | "ANNULER"
  )[];
  priceMin?: number;
  priceMax?: number;
  currency?: string;
  accountLevel?: string;
  accountRank?: string;
  viewCountMin?: number;
  viewCountMax?: number;
  isNegotiable?: boolean;
  isFeatured?: boolean;
  isVisible?: boolean;
  deliveredToUserId?: string;
  deliveredFrom?: Date | string;
  deliveredTo?: Date | string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Orders - Basé sur la table `orders`
export type OrderStatus =
  | 'PENDING'
  | 'ACCEPTED_BY_SHOP'
  | 'PROCESSING_BY_ADMIN'
  | 'COMPLETED'
  | 'REJECTED_BY_SHOP'
  | 'REJECTED_BY_ADMIN'
  | 'CANCELLED';

export interface OrderFilters extends BaseFilters {
  id?: string;
  productId?: string;
  buyerId?: string;
  shopId?: string;
  statuses?: OrderStatus[];
  status?: OrderStatus | OrderStatus[];
  limit?: number;
  page?: number;
  priceMin?: number;
  priceMax?: number;
  orderType?: string;
  orderedProductId?: string;
  expiresFrom?: Date | string;
  expiresTo?: Date | string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

export interface OrderStats {
  total: number;
  completed: number;
  cancelled: number;
  rejectedByShop: number;
  rejectedByAdmin: number;
}

// Teams - Basé sur la table `teams`
export interface TeamFilters extends BaseFilters {
  id?: string;
  name?: string;
  country?: string;
  city?: string;
  foundedYearMin?: number;
  foundedYearMax?: number;
  division?: string;
  rankingMin?: number;
  rankingMax?: number;
  maxSquadSizeMin?: number;
  maxSquadSizeMax?: number;
  currentSquadSizeMin?: number;
  currentSquadSizeMax?: number;
  captainId?: string;
  viceCaptainId?: string;
  isActive?: boolean;
}

// Team Members - Basé sur la table `teamMembers`
export interface TeamMemberFilters extends BaseFilters {
  id?: string;
  teamId?: string;
  userId?: string;
  roles?: (
    | "PLAYER"
    | "COACH"
    | "MANAGER"
    | "SUBSTITUTE"
    | "CAPTAIN"
    | "VICE_CAPTAIN"
  )[];
  position?: string;
  isActive?: boolean;
  joinedFrom?: Date | string;
  joinedTo?: Date | string;
}

// Tournaments - Basé sur la table `tournaments`
export interface TournamentFilters extends BaseFilters {
  id?: string;
  organizerId?: string;
  name?: string;
  game?: string;
  platform?: (
    | "PC"
    | "PLAYSTATION"
    | "XBOX"
    | "NINTENDO_SWITCH"
    | "MOBILE"
    | "VR"
    | "OTHER"
  )[];
  statuses?: ("UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED")[];
  startDateFrom?: Date | string;
  startDateTo?: Date | string;
  endDateFrom?: Date | string;
  endDateTo?: Date | string;
  registrationDeadlineFrom?: Date | string;
  registrationDeadlineTo?: Date | string;
  maxParticipantsMin?: number;
  maxParticipantsMax?: number;
  maxParticipantsPerEditionMin?: number;
  maxParticipantsPerEditionMax?: number;
  currentParticipantsMin?: number;
  currentParticipantsMax?: number;
  totalParticipantsMin?: number;
  totalParticipantsMax?: number;
  prizePoolMin?: number;
  prizePoolMax?: number;
  totalPrizePoolMin?: number;
  totalPrizePoolMax?: number;
  isPrivate?: boolean;
  requiresAccessCode?: boolean;
  viewCountMin?: number;
  viewCountMax?: number;
  themeId?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
  visibility?: "PUBLIC" | "PRIVATE" | "FRIENDS";
}

export interface TournamentEditionFilters extends BaseFilters {
  id?: string;
  tournamentId?: string;
  editionNumber?: number;
  editionNumberMin?: number;
  editionNumberMax?: number;
  onlyAvailable?: boolean;
  name?: string;
  tagline?: string;
  editionSlug?: string;
  statuses?: ("UPCOMING" | "LIVE" | "COMPLETED" | "CANCELLED")[];
  locationType?: ("ONLINE" | "VENUE" | "HYBRID")[];
  entryFeeMin?: number;
  entryFeeMax?: number;
  startDateFrom?: Date | string;
  startDateTo?: Date | string;
  endDateFrom?: Date | string;
  endDateTo?: Date | string;
  registrationOpensFrom?: Date | string;
  registrationOpensTo?: Date | string;
  registrationDeadlineFrom?: Date | string;
  registrationDeadlineTo?: Date | string;
  maxParticipantsMin?: number;
  maxParticipantsMax?: number;
  currentParticipantsMin?: number;
  currentParticipantsMax?: number;
  checkedInParticipantsMin?: number;
  checkedInParticipantsMax?: number;
  prizePoolMin?: number;
  prizePoolMax?: number;
  viewCountMin?: number;
  viewCountMax?: number;
  matchCountMin?: number;
  matchCountMax?: number;
  completedMatchCountMin?: number;
  completedMatchCountMax?: number;
  progressMin?: number;
  progressMax?: number;
  notificationsEnabled?: boolean;
  autoAdvance?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Tournament Members - Based on `tournamentMembers`
export interface TournamentMemberFilters extends BaseFilters {
  id?: string;
  tournamentId?: string;
  userId?: string;
  teamId?: string;
  role?: string | string[];
  isCoOrganizer?: boolean;
  isGuest?: boolean;
  gameLevel?: string;
  displayName?: string;
  gameTag?: string;
  clubName?: string;
  search?: string;
  isVerified?: boolean;
  verificationLevel?: string | string[];
  isActive?: boolean;
  isBanned?: boolean;
  totalEditionsMin?: number;
  totalEditionsMax?: number;
  totalWinsMin?: number;
  totalWinsMax?: number;
  totalLossesMin?: number;
  totalLossesMax?: number;
  totalMatchesMin?: number;
  totalMatchesMax?: number;
  rankingPointsMin?: number;
  rankingPointsMax?: number;
  winRateMin?: number;
  winRateMax?: number;
  bestPositionMin?: number;
  bestPositionMax?: number;
  joinedFrom?: Date | string;
  joinedTo?: Date | string;
  lastActiveFrom?: Date | string;
  lastActiveTo?: Date | string;
  statuses?: ("active" | "inactive" | "banned" | "suspended")[];
}

// Edition Registrations - Basé sur `editionRegistrations`
export interface EditionRegistrationFilters extends BaseFilters {
  id?: string;
  editionId?: string;
  memberId?: string;
  registrationType?: string[];
  statuses?: (
    | "REGISTERED"
    | "PARTICIPATED"
    | "DISQUALIFIED"
    | "WINNER"
    | "ELIMINATED"
  )[];
  gameLevel?: string;
  gameRank?: string;
  gameRegion?: string;
  feePaid?: boolean;
  feeWaived?: boolean;
  qualifiedFromPrevious?: boolean;
  previousEditionId?: string;
  qualificationMethod?: string;
  checkedIn?: boolean;
  autoCheckedIn?: boolean;
  registrationFeeMin?: number;
  registrationFeeMax?: number;
  registeredFrom?: Date | string;
  registeredTo?: Date | string;
  confirmedFrom?: Date | string;
  confirmedTo?: Date | string;
  cancelledFrom?: Date | string;
  cancelledTo?: Date | string;
  checkedInFrom?: Date | string;
  checkedInTo?: Date | string;
}

// Registration Payments - Basé sur `registrationPayments`
export interface RegistrationPaymentFilters extends BaseFilters {
  id?: string;
  registrationId?: string;
  transactionId?: string;
  amountMin?: number;
  amountMax?: number;
  currency?: string;
  paymentMethod?: string[];
  paymentProvider?: string[];
  status?: string[];
  paidFrom?: Date | string;
  paidTo?: Date | string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Tournament Phases - Basé sur `tournamentPhases`
export interface TournamentPhaseFilters extends BaseFilters {
  id?: string;
  editionId?: string;
  name?: string;
  phaseType?: (
    | "ELIMINATION"
    | "GROUP_STAGE"
    | "ROUND_ROBIN"
    | "SWISS"
    | "KNOCKOUT"
    | "CUSTOM"
  )[];
  orderMin?: number;
  orderMax?: number;
  isActive?: boolean;
  isCompleted?: boolean;
  isDoubleElimination?: boolean;
  isHidden?: boolean;
  scheduledStartFrom?: Date | string;
  scheduledStartTo?: Date | string;
  scheduledEndFrom?: Date | string;
  scheduledEndTo?: Date | string;
  actualStartFrom?: Date | string;
  actualStartTo?: Date | string;
  actualEndFrom?: Date | string;
  actualEndTo?: Date | string;
  totalMatchesMin?: number;
  totalMatchesMax?: number;
  completedMatchesMin?: number;
  completedMatchesMax?: number;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Phase Groups - Basé sur `phaseGroups`
export interface PhaseGroupFilters extends BaseFilters {
  id?: string;
  phaseId?: string;
  name?: string;
  orderMin?: number;
  orderMax?: number;
  groupType?: string[];
  isCompleted?: boolean;
  isLocked?: boolean;
  participantCountMin?: number;
  participantCountMax?: number;
  matchCountMin?: number;
  matchCountMax?: number;
}

// Phase Group Participants - Basé sur `phaseGroupParticipants`
export interface PhaseGroupParticipantFilters extends BaseFilters {
  id?: string;
  groupId?: string;
  registrationId?: string;
  matchesPlayedMin?: number;
  matchesPlayedMax?: number;
  matchesWonMin?: number;
  matchesWonMax?: number;
  matchesDrawnMin?: number;
  matchesDrawnMax?: number;
  matchesLostMin?: number;
  matchesLostMax?: number;
  pointsMin?: number;
  pointsMax?: number;
  scoreForMin?: number;
  scoreForMax?: number;
  scoreAgainstMin?: number;
  scoreAgainstMax?: number;
  scoreDifferenceMin?: number;
  scoreDifferenceMax?: number;
  positionMin?: number;
  positionMax?: number;
  isSeeded?: boolean;
  seedOrderMin?: number;
  seedOrderMax?: number;
  qualified?: boolean;
  qualificationPositionMin?: number;
  qualificationPositionMax?: number;
}

// Bracket Nodes - Basé sur `bracketNodes`
export interface BracketNodeFilters extends BaseFilters {
  id?: string;
  phaseId?: string;
  groupId?: string;
  parentNodeId?: string;
  nodeType?: string[];
  nodeCode?: string;
  childPosition?: string[];
  depthMin?: number;
  depthMax?: number;
  orderMin?: number;
  orderMax?: number;
  bracketType?: string[];
  roundMin?: number;
  roundMax?: number;
  matchNumberMin?: number;
  matchNumberMax?: number;
}

// Matches - Basé sur `matches` (version améliorée)
export interface MatchFilters extends BaseFilters {
  id?: string;
  editionId?: string;
  phaseId?: string;
  groupId?: string;
  bracketNodeId?: string;
  matchCode?: string;
  matchType?: string[];
  roundMin?: number;
  roundMax?: number;
  matchNumberMin?: number;
  matchNumberMax?: number;
  scheduledTimeFrom?: Date | string;
  scheduledTimeTo?: Date | string;
  actualStartTimeFrom?: Date | string;
  actualStartTimeTo?: Date | string;
  actualEndTimeFrom?: Date | string;
  actualEndTimeTo?: Date | string;
  durationMin?: number;
  durationMax?: number;
  participant1RegistrationId?: string;
  participant2RegistrationId?: string;
  score1Min?: number;
  score1Max?: number;
  score2Min?: number;
  score2Max?: number;
  winnerRegistrationId?: string;
  loserRegistrationId?: string;
  submittedByUserId?: string;
  confirmedByParticipant1?: boolean;
  confirmedByParticipant2?: boolean;
  confirmedByAdmin?: boolean;
  confirmedFrom?: Date | string;
  confirmedTo?: Date | string;
  disputed?: boolean;
  resolvedBy?: string;
  statuses?: ("PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED")[];
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Edition Results - Basé sur `editionResults`
export interface EditionResultFilters extends BaseFilters {
  id?: string;
  editionId?: string;
  registrationId?: string;
  positionMin?: number;
  positionMax?: number;
  tier?: string[];
  prizeAmountMin?: number;
  prizeAmountMax?: number;
  matchesPlayedMin?: number;
  matchesPlayedMax?: number;
  matchesWonMin?: number;
  matchesWonMax?: number;
  matchesLostMin?: number;
  matchesLostMax?: number;
  matchesDrawnMin?: number;
  matchesDrawnMax?: number;
  totalScoreMin?: number;
  totalScoreMax?: number;
  averageScoreMin?: number;
  averageScoreMax?: number;
  prizePaid?: boolean;
  paidFrom?: Date | string;
  paidTo?: Date | string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// ============================================================================
// TYPES POUR LES ACTIONS MÉTIER SPÉCIFIQUES
// ============================================================================

export interface TournamentCreationData {
  tournament: Omit<NewTournament, "id" | "createdAt" | "updatedAt">;
  initialEdition?: Omit<
    NewTournamentEdition,
    "id" | "tournamentId" | "createdAt" | "updatedAt"
  >;
  organizerMembers?: Array<{
    userId: string;
    role?: string;
    permissions?: string[];
  }>;
}

export interface EditionCreationData {
  edition: Omit<NewTournamentEdition, "id" | "createdAt" | "updatedAt">;
  options?: {
    copyPreviousPhaseStructure?: boolean;
    autoInvitePreviousParticipants?: boolean;
    inviteAllMembers?: boolean;
    copyPreviousSettings?: boolean;
  };
}

export interface RegistrationData {
  memberId: string;
  registrationData?: Omit<
    NewEditionRegistration,
    "id" | "editionId" | "memberId" | "createdAt" | "updatedAt"
  >;
  paymentData?: {
    amount: number;
    currency?: string;
    paymentMethod?: string;
  };
}

export interface MatchCreationData {
  phaseId: string;
  groupId?: string;
  bracketNodeId?: string;
  matchData: Omit<
    NewMatch,
    "id" | "editionId" | "phaseId" | "createdAt" | "updatedAt"
  >;
  options?: {
    autoSchedule?: boolean;
    notifyParticipants?: boolean;
    requireCheckin?: boolean;
  };
}

export interface MatchResultSubmission {
  scores: {
    score1?: number;
    score2?: number;
  };
  winnerRegistrationId?: string;
  proof?: {
    screenshot?: string;
    replayLink?: string;
    proofLinks?: string[];
  };
  notes?: string;
  confirm?: boolean; // Si le participant soumetteur confirme
}

export interface BracketGenerationParams {
  phaseId: string;
  bracketType:
  | "SINGLE_ELIMINATION"
  | "DOUBLE_ELIMINATION"
  | "ROUND_ROBIN"
  | "SWISS";
  participants: string[]; // registrationIds
  options?: {
    seedMethod?: "RANDOM" | "RANKING" | "MANUAL";
    includeByes?: boolean;
    thirdPlaceMatch?: boolean;
    groupSize?: number;
  };
}

export interface GroupStageGenerationParams {
  phaseId: string;
  groupCount: number;
  participants: string[]; // registrationIds
  options?: {
    seedMethod?: "RANDOM" | "RANKING" | "MANUAL";
    matchesPerPair?: number; // 1 ou 2 pour aller-retour
    balancedGroups?: boolean;
  };
}

// ============================================================================
// TYPES POUR LES RÉPONSES SPÉCIFIQUES
// ============================================================================

export interface TournamentWithDetails extends TournamentWithRelations {
  editions?: TournamentEditionWithRelations[];
  memberCount?: number;
  upcomingEdition?: TournamentEditionWithRelations;
  currentEdition?: TournamentEditionWithRelations;
  stats?: {
    totalMembers: number;
    totalEditions: number;
    totalMatches: number;
    averageParticipants: number;
    averagePrizePool: number;
  };
}

export interface EditionWithDetails extends Omit<TournamentEditionWithRelations, "tournament" | "phases" | "registrations" | "matches" | "results"> {
  tournament?: TournamentWithRelations;
  phases?: TournamentPhaseWithRelations[];
  registrations?: EditionRegistrationWithRelations[];
  matches?: MatchWithRelations[];
  results?: EditionResultWithRelations[];
  stats?: {
    registrationCount: number;
    checkedInCount: number;
    matchCount: number;
    completedMatchCount: number;
    averageMatchDuration: number;
    prizeDistribution?: Array<{
      position: number;
      amount: number;
      winnerName?: string;
    }>;
  };
}

export interface PhaseWithDetails extends Omit<TournamentPhaseWithRelations, "edition" | "groups" | "bracketNodes"> {
  edition?: TournamentEditionWithRelations;
  groups?: PhaseGroupWithRelations[];
  bracketNodes?: BracketNodeWithRelations[];
  stats?: {
    groupCount: number;
    participantCount: number;
    matchCount: number;
    completedMatchCount: number;
    advancementCount: number;
  };
}

export interface GroupWithDetails extends Omit<PhaseGroupWithRelations, "phase" | "participants" | "matches"> {
  phase?: TournamentPhaseWithRelations;
  participants?: PhaseGroupParticipantWithRelations[];
  matches?: MatchWithRelations[];
  standings?: Array<{
    position: number;
    registration: EditionRegistrationWithRelations;
    stats: PhaseGroupParticipant;
    qualified: boolean;
  }>;
}

export interface BracketNodeWithDetails extends Omit<BracketNodeWithRelations, "phase" | "group" | "parent" | "children" | "match"> {
  phase?: TournamentPhaseWithRelations;
  group?: PhaseGroupWithRelations;
  parent?: BracketNodeWithRelations;
  children?: BracketNodeWithRelations[];
  match?: MatchWithRelations;
}

export interface MatchWithDetails extends Omit<MatchWithRelations, "edition" | "phase" | "group"> {
  edition?: TournamentEditionWithRelations;
  phase?: TournamentPhaseWithRelations;
  group?: PhaseGroupWithRelations;
  bracketNode?: BracketNodeWithRelations;
  participant1?: EditionRegistrationWithRelations;
  participant2?: EditionRegistrationWithRelations;
  winner?: EditionRegistrationWithRelations;
  loser?: EditionRegistrationWithRelations;
  submittedBy?: User;
  nextMatch?: MatchWithRelations;
  previousMatches?: MatchWithRelations[];
}

// ============================================================================
// TYPES POUR LES STATISTIQUES AVANCÉES
// ============================================================================

export interface TournamentAnalytics {
  overview: {
    totalTournaments: number;
    activeTournaments: number;
    completedEditions: number;
    totalParticipants: number;
    totalPrizePool: number;
    averageParticipantsPerEdition: number;
  };
  trends: {
    monthlyRegistrations: Array<{ month: string; count: number }>;
    editionFrequency: Array<{ year: number; count: number }>;
    prizePoolEvolution: Array<{ edition: string; amount: number }>;
  };
  popularGames: Array<{
    game: string;
    tournamentCount: number;
    participantCount: number;
    averagePrizePool: number;
  }>;
  topOrganizers: Array<{
    organizerId: string;
    organizerName: string;
    tournamentCount: number;
    averageRating?: number;
  }>;
}

export interface EditionAnalytics {
  participation: {
    totalRegistrations: number;
    checkedInCount: number;
    noShowCount: number;
    dropoutRate: number;
    completionRate: number;
  };
  matches: {
    totalMatches: number;
    completedMatches: number;
    averageDuration: number;
    disputedMatches: number;
    resolutionRate: number;
  };
  performance: {
    averageMatchesPerParticipant: number;
    closestMatches: Array<{
      matchId: string;
      scoreDifference: number;
      participants: string[];
    }>;
    upsets: Array<{
      matchId: string;
      underdog: string;
      favorite: string;
      odds?: number;
    }>;
  };
  financials: {
    totalPrizePool: number;
    paidOut: number;
    pendingPayouts: number;
    averagePrizePerPosition: Record<number, number>;
  };
}

export interface ParticipantAnalytics {
  overview: {
    totalTournaments: number;
    totalEditions: number;
    totalMatches: number;
    winRate: number;
    averagePosition: number;
    totalPrizeMoney: number;
  };
  performanceByGame: Array<{
    game: string;
    tournamentCount: number;
    winRate: number;
    bestPosition: number;
    averagePosition: number;
  }>;
  progression: Array<{
    editionNumber: number;
    tournamentName: string;
    position: number;
    matchesPlayed: number;
    matchesWon: number;
    prizeMoney?: number;
  }>;
  strengths: {
    bestFormat: string; // Format où il performe le mieux
    clutchPerformance: number; // Performance en matchs serrés
    comebackRate: number; // Taux de remontées
  };
}

// Games - Basé sur la table `games`
export interface GameFilters extends BaseFilters {
  id?: string;
  name?: string;
  description?: string;
  profileImage?: string;
  coverImage?: string;
  publisher?: string;
  genre?: string;
  platforms?: (
    | "PC"
    | "PLAYSTATION"
    | "XBOX"
    | "NINTENDO_SWITCH"
    | "MOBILE"
    | "VR"
    | "OTHER"
  )[];
  isActive?: boolean;
  featured?: boolean;
  popularityMin?: number;
  popularityMax?: number;
  website?: string;
  minAgeMin?: number;
  minAgeMax?: number;
  tags?: string[];
  releaseDateFrom?: Date | string;
  releaseDateTo?: Date | string;
}

// Game Items - Basé sur la table `gameItems`
export interface GameItemFilters extends BaseFilters {
  id?: string;
  gameId?: string;
  name?: string;
  type?: "COIN" | "ITEM" | "SKIN" | "EQUIPMENT" | "CURRENCY";
  types?: ("COIN" | "ITEM" | "SKIN" | "EQUIPMENT" | "CURRENCY")[];
  priceGtcMin?: number;
  priceGtcMax?: number;
  availability?: string;
  featured?: boolean;
  popularityMin?: number;
  popularityMax?: number;
  minOrderMin?: number;
  minOrderMax?: number;
  maxOrderMin?: number;
  maxOrderMax?: number;
}

// Game Item Requests - Basé sur la table `gameItemRequests`
export interface GameItemRequestFilters extends BaseFilters {
  id?: string;
  userId?: string;
  gameItemId?: string;
  statuses?: (
    | "PENDING"
    | "PROCESSING"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED"
  )[];
  quantityMin?: number;
  quantityMax?: number;
  totalGtcMin?: number;
  totalGtcMax?: number;
  gameAccount?: string;
  gameId?: string;
  processedByUserId?: string;
  processedFrom?: Date | string;
  processedTo?: Date | string;
  completedFrom?: Date | string;
  completedTo?: Date | string;
  transactionId?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Game Clips - Basé sur la table `gameClips`
export interface GameClipFilters extends Omit<EntityQueryParams, "sortBy" | "sortOrder"> {
  id?: string;
  authorId?: string;
  shopId?: string;
  gameId?: string;
  caption?: string;
  isDeleted?: boolean;
  videoUrl?: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  limit?: number;
  page?: number;
  sortBy?: "createdAt" | "likes" | "views" | "comments";
  sortOrder?: "asc" | "desc";
}

// Posts - Basé sur la table `posts`
export interface PostFilters extends BaseFilters {
  id?: string;
  authorId?: string;
  content?: string;
  isStory?: boolean;
  hasImages?: boolean;
  hasVideo?: boolean;
  expiresFrom?: Date | string;
  expiresTo?: Date | string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Messages - Basé sur la table `messages`
export interface MessageFilters extends BaseFilters {
  id?: string;
  senderId?: string;
  recipientId?: string;
  groupId?: string;
  shopId?: string;
  postId?: string;
  productId?: string;
  userId?: string;
  entityType?: EntityType;
  entityId?: string;
  content?: string;
  isRead?: boolean;
  hasImages?: boolean;
  hasAudio?: boolean;
  parentMessageId?: string;
  isOpenToPublic?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Groups - Basé sur la table `groups`
export interface GroupFilters extends BaseFilters {
  id?: string;
  creatorId?: string;
  name?: string;
  isPrivate?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Group Members - Basé sur la table `groupMembers`
export interface GroupMemberFilters extends BaseFilters {
  id?: string;
  groupId?: string;
  userId?: string;
  roles?: ("OWNER" | "ADMIN" | "MEMBER")[];
  joinedFrom?: Date | string;
  joinedTo?: Date | string;
}

// Interactions - Basé sur la table `interactions`
export interface InteractionFilters extends BaseFilters {
  id?: string;
  userId?: string;
  entityId?: string;
  entityType?: (
    | "PRODUCT"
    | "POST"
    | "SHOP"
    | "TOURNAMENT"
    | "USER"
    | "BLOG"
    | "MESSAGE"
    | "TEAM"
    | "THEME"
    | "NEWS"
    | "GROUP"
    | "ANNOUNCEMENT"
    | "SERVICE"
    | "GUIDE"
    | "COMMENT"
    | "MATCH"
    | "GAME"
    | "GAME_ITEM"
  )[];
  types?: ("LIKE" | "FOLLOW" | "BOOKMARK" | "VIEW")[];
  postId?: string;
  productId?: string;
  messageId?: string;
  tournamentId?: string;
  shopId?: string;
  gameId?: string;
  gameItemId?: string;
  themeId?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Media - Basé sur la table `medias`
export interface MediaFilters extends BaseFilters {
  id?: string;
  ownerId?: string;
  fileName?: string;
  originalName?: string;
  mimeType?: string;
  type?: ("image" | "video" | "document" | "audio" | "other")[];
  status?: ("ACTIVE" | "PROCESSING" | "DELETED")[];
  privacy?: ("PUBLIC" | "PRIVATE" | "FRIENDS")[];
  entityType?: (
    | "PRODUCT"
    | "POST"
    | "SHOP"
    | "TOURNAMENT"
    | "USER"
    | "BLOG"
    | "MESSAGE"
    | "TEAM"
    | "THEME"
    | "NEWS"
    | "GROUP"
    | "ANNOUNCEMENT"
    | "SERVICE"
    | "GUIDE"
    | "COMMENT"
    | "MATCH"
  )[];
  entityId?: string;
  sizeMin?: number;
  sizeMax?: number;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Notifications - Basé sur la table `notifications`
export interface NotificationFilters extends BaseFilters {
  id?: string;
  userId?: string;
  shopId?: string;
  tournamentId?: string;
  type?: string;
  title?: string;
  message?: string;
  isRead?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Themes - Basé sur la table `themes`
export interface ThemeFilters extends BaseFilters {
  id?: string;
  creatorId?: string;
  name?: string;
  isPremium?: boolean;
  category?: string;
  tags?: string[];
  downloadsMin?: number;
  downloadsMax?: number;
  viewCountMin?: number;
  viewCountMax?: number;
  isPublic?: boolean;
  isCopy?: boolean;
  priceMin?: number;
  priceMax?: number;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Theme Purchases - Basé sur la table `themePurchases`
export interface ThemePurchaseFilters extends BaseFilters {
  id?: string;
  userId?: string;
  themeId?: string;
  priceMin?: number;
  priceMax?: number;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Announcements - Basé sur la table `announcements`
export interface AnnouncementFilters extends BaseFilters {
  id?: string;
  authorId?: string;
  title?: string;
  content?: string;
  type?: ("ANNOUNCEMENT" | "NEWS" | "UPDATE")[];
  isPinned?: boolean;
  hasImages?: boolean;
  hasVideo?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Announcement Reads - Basé sur la table `announcementReads`
export interface AnnouncementReadFilters extends BaseFilters {
  id?: string;
  announcementId?: string;
  userId?: string;
  readFrom?: Date | string;
  readTo?: Date | string;
}

// Search History - Basé sur la table `searchHistory`
export interface SearchHistoryFilters extends BaseFilters {
  id?: string;
  userId?: string;
  query?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Claims - Basé sur la table `claims`
export interface ClaimFilters extends BaseFilters {
  id?: string;
  userId?: string;
  transactionId?: string;
  type?: string;
  title?: string;
  status?: string[];
  hasEvidence?: boolean;
  hasImage?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// User Traces - Basé sur la table `userTraces`
export interface UserTraceFilters extends BaseFilters {
  id?: string;
  userId?: string;
  sessionId?: string;
  types?: (
    | "SIGNIN"
    | "SIGNOUT"
    | "REGISTER"
    | "NAVIGATION"
    | "PURCHASE"
    | "TRANSFER"
    | "DEPOSIT"
    | "VIEW"
    | "LIKE"
    | "FOLLOW"
    | "BOOKMARK"
    | "CLAIM"
    | "ERROR"
    | "EXPLANATION_SHOWN"
    | "OTHER"
  )[];
  entityId?: string;
  synced?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Blogs - Basé sur la table `blogs`
export interface BlogFilters extends BaseFilters {
  id?: string;
  authorId?: string;
  title?: string;
  content?: string;
  hasImages?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Services - Basé sur la table `services`
export interface ServiceFilters extends BaseFilters {
  id?: string;
  adminId?: string;
  title?: string;
  description?: string;
  hasImages?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Guides - Basé sur la table `guides`
export interface GuideFilters extends BaseFilters {
  id?: string;
  adminId?: string;
  title?: string;
  category?: string;
  viewCountMin?: number;
  viewCountMax?: number;
  hasImages?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Guide Steps - Basé sur la table `guideSteps`
export interface GuideStepFilters extends BaseFilters {
  id?: string;
  guideId?: string;
  title?: string;
  content?: string;
  orderMin?: number;
  orderMax?: number;
  hasImages?: boolean;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Viewers - Basé sur la table `viewers`
export interface ViewerFilters extends BaseFilters {
  id?: string;
  entityId?: string;
  entityType?: (
    | "PRODUCT"
    | "POST"
    | "SHOP"
    | "TOURNAMENT"
    | "USER"
    | "BLOG"
    | "MESSAGE"
    | "TEAM"
    | "THEME"
    | "NEWS"
    | "GROUP"
    | "ANNOUNCEMENT"
    | "SERVICE"
    | "GUIDE"
    | "COMMENT"
    | "MATCH"
  )[];
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  viewedFrom?: Date | string;
  viewedTo?: Date | string;
}

// Sessions - Basé sur la table `session`
export interface SessionFilters extends BaseFilters {
  id?: string;
  userId?: string;
  token?: string;
  expiresFrom?: Date | string;
  expiresTo?: Date | string;
  ipAddress?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Accounts - Basé sur la table `account`
export interface AccountFilters extends BaseFilters {
  id?: string;
  userId?: string;
  accountId?: string;
  providerId?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Push Subscriptions - Basé sur la table `pushSubscriptions`
export interface PushSubscriptionFilters extends BaseFilters {
  id?: string;
  userId?: string;
  endpoint?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// Entity Categories - Basé sur la table `entityCategories`
export interface EntityCategoryFilters extends BaseFilters {
  id?: string;
  entityId?: string;
  entityType?: (
    | "PRODUCT"
    | "POST"
    | "SHOP"
    | "TOURNAMENT"
    | "USER"
    | "BLOG"
    | "MESSAGE"
    | "TEAM"
    | "THEME"
    | "NEWS"
    | "GROUP"
    | "ANNOUNCEMENT"
    | "SERVICE"
    | "GUIDE"
    | "COMMENT"
    | "MATCH"
  )[];
  categoryId?: string;
  createdFrom?: Date | string;
  createdTo?: Date | string;
}

// ============================================================================
// OPTIONS DE REQUÊTE COMBINÉES
// ============================================================================

export interface QueryOptions extends SortOptions {
  includeDeleted?: boolean;
  withRelations?: boolean;
  includeInactive?: boolean;
  populate?: string[]; // Relations à peupler
  select?: string[]; // Champs à sélectionner
  distinct?: string[]; // Champs pour DISTINCT
}

// Type générique pour toutes les requêtes de liste
export interface ListQuery<TFilters = BaseFilters> {
  pagination?: PaginationParams;
  filters?: TFilters;
  options?: QueryOptions;
}

// Type pour les requêtes de statistiques
export interface StatsQuery<TFilters = BaseFilters> {
  filters?: TFilters;
  groupBy?: string[];
  metrics?: string[];
  dateRange?: {
    start: Date | string;
    end: Date | string;
  };
}

// ============================================================================
// RÉPONSES API
// ============================================================================

// Réponse générique pour les listes avec pagination
export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  message?: string;
}

// Réponse pour une seule entité
export interface ApiSingleResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Réponse pour les statistiques
export interface ApiStatsResponse {
  success: boolean;
  data: {
    total: number;
    metrics: Record<string, number>;
    groups?: Record<string, number>;
    trends?: Array<{
      date: string;
      value: number;
    }>;
  };
  message?: string;
}

// Réponse d'erreur
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    validationErrors?: Record<string, string[]>;
  };
}

// Type union pour toutes les réponses API
export type ApiResponse<T = any> =
  | ApiListResponse<T>
  | ApiSingleResponse<T>
  | ApiStatsResponse
  | ApiErrorResponse;

// ============================================================================
// PARAMS POUR LES ACTIONS CRUD
// ============================================================================

export interface CreateParams<T> {
  data: T;
  userId?: string;
  options?: {
    returnCreated?: boolean;
    validate?: boolean;
  };
}

export interface UpdateParams<T> {
  id: string;
  data: Partial<T>;
  userId?: string;
  options?: {
    returnUpdated?: boolean;
    validate?: boolean;
    upsert?: boolean;
  };
}

export interface DeleteParams {
  id: string;
  userId?: string;
  options?: {
    softDelete?: boolean;
    cascade?: boolean;
  };
}

export interface BulkDeleteParams {
  ids: string[];
  userId?: string;
  options?: {
    softDelete?: boolean;
    cascade?: boolean;
  };
}

export interface GetByIdParams {
  id: string;
  userId?: string;
  options?: {
    populate?: string[];
    includeDeleted?: boolean;
  };
}

// ============================================================================
// TYPES POUR LES ACTIONS MÉTIER
// ============================================================================

export interface ExportParams<TFilters = BaseFilters> {
  format: "csv" | "json" | "xlsx";
  filters?: TFilters;
  fields?: string[];
  options?: {
    includeHeaders?: boolean;
    dateFormat?: string;
  };
}

export interface ImportParams {
  file: File | Buffer;
  format: "csv" | "json" | "xlsx";
  options?: {
    validate?: boolean;
    skipErrors?: boolean;
    updateExisting?: boolean;
  };
}

export interface BulkUpdateParams<T> {
  updates: Array<{
    id: string;
    data: Partial<T>;
  }>;
  userId?: string;
  options?: {
    validate?: boolean;
    returnUpdated?: boolean;
  };
}

// ============================================================================
// TYPES POUR LES REQUÊTES COMPLEXES
// ============================================================================

export interface SearchQuery extends ListQuery<BaseFilters> {
  query: string;
  entityTypes?: string[];
  fuzzy?: boolean;
  highlight?: boolean;
}

export interface AggregationQuery<TFilters = BaseFilters> {
  filters?: TFilters;
  aggregations: Array<{
    field: string;
    operation: "count" | "sum" | "avg" | "min" | "max";
    alias?: string;
  }>;
  groupBy?: string[];
  having?: Record<string, any>;
}

// ============================================================================
// TYPES POUR LA VALIDATION ET LES ERREURS
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: any;
}

export interface ValidationResult<T = any> {
  success: boolean;
  data?: T;
  errors: ValidationError[];
}

// ============================================================================
// TYPES POUR LES WEBHOOKS ET LES ÉVÉNEMENTS
// ============================================================================

export interface WebhookPayload<T = any> {
  event: string;
  entity: string;
  entityId: string;
  data: T;
  timestamp: string;
  userId?: string;
}

export interface EventData<T = any> {
  type: string;
  entity: string;
  entityId: string;
  action: "create" | "update" | "delete";
  data: T;
  previousData?: T;
  userId?: string;
  timestamp: string;
}

// ============================================================================
// TYPES UTILITAIRES
// ============================================================================

export type FilterType<T> = {
  [K in keyof T]?: T[K] extends Array<any> ? T[K] : T[K] | T[K][];
};

export type SortField<T> = keyof T & string;

export interface DateRange {
  start: Date | string;
  end: Date | string;
}

export interface NumberRange {
  min: number;
  max: number;
}

// Helper type pour extraire les types de filtres
export type ExtractFilters<T> = T extends ListQuery<infer F> ? F : never;

// Helper type pour les relations chargées
export type WithRelations<T, R extends string> = T & {
  [K in R]?: any;
};

// ============================================================================
// CONSTANTES ET CONFIGURATIONS
// ============================================================================

export const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  maxLimit: 100,
} as const;

export const DEFAULT_SORT_OPTIONS = {
  sortBy: "createdAt",
  sortOrder: "desc" as const,
} as const;

export const ALLOWED_EXPORT_FIELDS = {
  users: [
    "id",
    "username",
    "email",
    "fullName",
    "country",
    "accountTypes",
    "level",
    "isVerified",
    "isVip",
    "isActive",
    "createdAt",
    "lastLogin",
  ],
  shops: [
    "id",
    "name",
    "ownerId",
    "country",
    "verified",
    "featured",
    "productCount",
    "viewCount",
    "balance",
    "createdAt",
  ],
  products: [
    "id",
    "name",
    "shopId",
    "categoryId",
    "price",
    "game",
    "platform",
    "status",
    "viewCount",
    "createdAt",
  ],
  tournaments: [
    "id",
    "name",
    "organizerId",
    "game",
    "platform",
    "status",
    "maxParticipants",
    "currentParticipants",
    "prizePool",
    "startDate",
    "endDate",
  ],
  orders: [
    "id",
    "productId",
    "buyerId",
    "shopId",
    "price",
    "status",
    "orderType",
    "createdAt",
  ],
  transactions: [
    "id",
    "walletId",
    "fromUserId",
    "toUserId",
    "amount",
    "type",
    "status",
    "createdAt",
  ],
} as const;

// Types pour les permissions et les rôles
export interface PermissionCheck {
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
}

export interface AccessControlResult {
  allowed: boolean;
  reason?: string;
  permissions?: string[];
}

// ============================================================================
// TYPES POUR LES RÉSULTATS DE RECHERCHE
// ============================================================================

export interface SearchResult<T = any> {
  entity: string;
  entityType: string;
  data: T;
  score: number;
  highlights?: Record<string, string[]>;
}

export interface MultiEntitySearchResponse {
  results: SearchResult[];
  total: number;
  facets?: Record<string, any>;
}

// ============================================================================
// TYPES POUR LES ANALYTIQUES ET RAPPORTS
// ============================================================================

export interface AnalyticsQuery {
  metrics: string[];
  dimensions?: string[];
  filters?: BaseFilters;
  dateRange: {
    start: Date | string;
    end: Date | string;
  };
  interval?: "hour" | "day" | "week" | "month" | "year";
}

export interface AnalyticsResponse {
  data: Array<{
    date: string;
    metrics: Record<string, number>;
  }>;
  summary: Record<string, number>;
  metadata: {
    total: number;
    generatedAt: string;
  };
}

// ============================================================================
// TYPES POUR LES IMPORT/EXPORT
// ============================================================================

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    errors: string[];
  }>;
  warnings: string[];
}

export interface ExportResult {
  success: boolean;
  url?: string;
  fileSize?: number;
  recordCount: number;
  generatedAt: string;
}
