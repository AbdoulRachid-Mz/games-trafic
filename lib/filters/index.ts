import { sql, SQL } from 'drizzle-orm';
import { PgTable, PgColumn } from 'drizzle-orm/pg-core';
import {
  users,
  userWallets,
  walletTransactions,
  vipSubscriptions,
  shops,
  products,
  orders,
  tournaments,
  tournamentMembers,
  tournamentPhases,
  phaseGroups,
  phaseSubGroups,
  matches,
  games,
  gameItems,
  gameItemRequests,
  posts,
  messages,
  groups,
  groupMembers,
  interactions,
  notifications,
  pushSubscriptions,
  themes,
  categories,
  entityCategories,
  teams,
  teamMembers,
  themePurchases,
  announcements,
  announcementReads,
  searchHistory,
  claims,
  userTraces,
  blogs,
  services,
  guides,
  guideSteps,
  appSettings,
  viewers,
  session,
  account
} from '@/database/schema';
import {
  // Types de base
  BaseFilters,
  PaginationParams,
  SortOptions,
  
  // Types de filtres spécifiques
  UserFilters,
  UserWalletFilters,
  WalletTransactionFilters,
  VipSubscriptionFilters,
  ShopFilters,
  CategoryFilters,
  ProductFilters,
  OrderFilters,
  TeamFilters,
  TeamMemberFilters,
  TournamentFilters,
  TournamentMemberFilters,
  TournamentPhaseFilters,
  PhaseGroupFilters,
  PhaseSubGroupFilters,
  MatchFilters,
  GameFilters,
  GameItemFilters,
  GameItemRequestFilters,
  PostFilters,
  MessageFilters,
  GroupFilters,
  GroupMemberFilters,
  InteractionFilters,
  NotificationFilters,
  ThemeFilters,
  ThemePurchaseFilters,
  AnnouncementFilters,
  AnnouncementReadFilters,
  SearchHistoryFilters,
  ClaimFilters,
  UserTraceFilters,
  BlogFilters,
  ServiceFilters,
  GuideFilters,
  GuideStepFilters,
  ViewerFilters,
  SessionFilters,
  AccountFilters,
  PushSubscriptionFilters,
  EntityCategoryFilters,
  
  // Types de requêtes
  QueryOptions,
  ListQuery
} from '@/types/api';

// ============================================================================
// TYPES ET INTERFACES INTERNES
// ============================================================================

interface FilterBuilderOptions {
  includeDeleted?: boolean;
  includeInactive?: boolean;
  searchFields?: string[];
}

export interface BuildWhereResult {
  conditions: SQL[];
  params: Record<string, any>;
}

// ============================================================================
// UTILITAIRES DE BASE
// ============================================================================

export function buildWhereConditions(
  filters: BaseFilters,
  table: PgTable,
  options: FilterBuilderOptions = {}
): SQL[] {
  const conditions: SQL[] = [];
  const { includeDeleted = false, includeInactive = false } = options;

  // Filtres de statut par défaut
  if (!includeDeleted && 'isDeleted' in table) {
    conditions.push(sql`${table.isDeleted} = false`);
  }
  
  if (!includeInactive && 'isActive' in table) {
    conditions.push(sql`${table.isActive} = true`);
  }

  // Filtres de date
  if (filters.startDate && 'createdAt' in table) {
    conditions.push(sql`${table.createdAt} >= ${filters.startDate}`);
  }
  
  if (filters.endDate && 'createdAt' in table) {
    conditions.push(sql`${table.createdAt} <= ${filters.endDate}`);
  }

  // Filtre de recherche générique
  if (filters.search && options.searchFields && options.searchFields.length > 0) {
    const searchConditions = options.searchFields
      .filter(field => field in table)
      .map(field => sql`${table[field as keyof typeof table]} ILIKE ${`%${filters.search}%`}`);
    
    if (searchConditions.length > 0) {
      conditions.push(sql`(${sql.join(searchConditions, sql` OR `)})`);
    }
  }

  return conditions;
}

export function buildSortConditions(
  sortOptions: SortOptions | SortOptions[] | undefined,
  table: PgTable,
  defaultSort: SortOptions = { sortBy: 'createdAt', sortOrder: 'desc' }
): SQL[] {
  if (!sortOptions) {
    sortOptions = defaultSort;
  }

  const sortArray = Array.isArray(sortOptions) ? sortOptions : [sortOptions];

  return sortArray.map(sort => {
    const field = sort.sortBy || defaultSort.sortBy;
    const direction = sort.sortOrder || defaultSort.sortOrder;
    
    if (field && field in table) {
      return direction === 'asc' 
        ? sql`${table[field as keyof typeof table]} ASC`
        : sql`${table[field as keyof typeof table]} DESC`;
    }
    return null;
  }).filter(Boolean) as SQL[];
}

export function validatePagination(
  pagination?: PaginationParams
): { page: number; limit: number; offset: number } {
  const page = Math.max(1, pagination?.page || 1);
  const limit = Math.min(Math.max(1, pagination?.limit || 20), 100); // Max 100 items par page
  const offset = (page - 1) * limit;
  
  return { page, limit, offset };
}

// ============================================================================
// BUILDER DE FILTRES GÉNÉRIQUE
// ============================================================================

export function buildFilters<TFilters extends BaseFilters>(
  filters: TFilters,
  table: PgTable,
  fieldMappings: Record<string, keyof typeof table>,
  options: FilterBuilderOptions = {}
): SQL[] {
  const conditions: SQL[] = buildWhereConditions(filters, table, options);

  // Appliquer les mappings de champs spécifiques
  Object.entries(fieldMappings).forEach(([filterKey, tableField]) => {
    const filterValue = filters[filterKey as keyof TFilters];
    
    if (filterValue !== undefined && filterValue !== null) {
      if (Array.isArray(filterValue)) {
        if (filterValue.length > 0) {
          conditions.push(sql`${table[tableField]} IN (${sql.join(filterValue)})`);
        }
      } else {
        conditions.push(sql`${table[tableField]} = ${filterValue}`);
      }
    }
  });

  return conditions;
}

// ============================================================================
// FILTRES UTILISATEURS
// ============================================================================

export function buildUserFilters(filters: UserFilters, options: FilterBuilderOptions = {}): SQL[] {
  const fieldMappings = {
    username: 'username',
    email: 'email',
    fullName: 'fullName',
    country: 'country',
    countryCode: 'countryCode',
    isPublicProfile: 'isPublicProfile',
    isVip: 'isVip',
    isAdmin: 'isAdmin',
    isAnonymous: 'isAnonymous',
    role: 'role',
    banned: 'banned',
    level: 'level'
  };

  const conditions = buildFilters(filters, users, fieldMappings, {
    ...options,
    searchFields: ['username', 'email', 'fullName', 'country']
  });

  // Filtres spécifiques aux tableaux
  if (filters.accountTypes && filters.accountTypes.length > 0) {
    conditions.push(sql`${users.accountTypes} && ${filters.accountTypes}`);
  }

  // Filtres de compteurs
  if (filters.shopsCreatedCountMin !== undefined) {
    conditions.push(sql`${users.shopsCreatedCount} >= ${filters.shopsCreatedCountMin}`);
  }
  if (filters.shopsCreatedCountMax !== undefined) {
    conditions.push(sql`${users.shopsCreatedCount} <= ${filters.shopsCreatedCountMax}`);
  }

  if (filters.tournamentsCreatedCountMin !== undefined) {
    conditions.push(sql`${users.tournamentsCreatedCount} >= ${filters.tournamentsCreatedCountMin}`);
  }
  if (filters.tournamentsCreatedCountMax !== undefined) {
    conditions.push(sql`${users.tournamentsCreatedCount} <= ${filters.tournamentsCreatedCountMax}`);
  }

  if (filters.postsCreatedCountMin !== undefined) {
    conditions.push(sql`${users.postsCreatedCount} >= ${filters.postsCreatedCountMin}`);
  }
  if (filters.postsCreatedCountMax !== undefined) {
    conditions.push(sql`${users.postsCreatedCount} <= ${filters.postsCreatedCountMax}`);
  }

  // Filtres de date spécifiques
  if (filters.lastLoginFrom) {
    conditions.push(sql`${users.lastLogin} >= ${filters.lastLoginFrom}`);
  }
  if (filters.lastLoginTo) {
    conditions.push(sql`${users.lastLogin} <= ${filters.lastLoginTo}`);
  }

  return conditions;
}

// ============================================================================
// FILTRES PORTEFEUILLES UTILISATEURS
// ============================================================================

export function buildUserWalletFilters(filters: UserWalletFilters, options: FilterBuilderOptions = {}): SQL[] {
  const fieldMappings = {
    userId: 'userId',
    isLocked: 'isLocked',
    verificationStatus: 'verificationStatus'
  };

  const conditions = buildFilters(filters, userWallets, fieldMappings, options);

  // Filtres numériques
  if (filters.balanceMin !== undefined) {
    conditions.push(sql`${userWallets.balance} >= ${filters.balanceMin}`);
  }
  if (filters.balanceMax !== undefined) {
    conditions.push(sql`${userWallets.balance} <= ${filters.balanceMax}`);
  }

  if (filters.failedAttemptsMin !== undefined) {
    conditions.push(sql`${userWallets.failedAttempts} >= ${filters.failedAttemptsMin}`);
  }
  if (filters.failedAttemptsMax !== undefined) {
    conditions.push(sql`${userWallets.failedAttempts} <= ${filters.failedAttemptsMax}`);
  }

  // Filtres de date de vérification
  if (filters.verifiedFrom) {
    conditions.push(sql`${userWallets.verifiedAt} >= ${filters.verifiedFrom}`);
  }
  if (filters.verifiedTo) {
    conditions.push(sql`${userWallets.verifiedAt} <= ${filters.verifiedTo}`);
  }

  return conditions;
}

// ============================================================================
// FILTRES TRANSACTIONS
// ============================================================================

export function buildWalletTransactionFilters(filters: WalletTransactionFilters, options: FilterBuilderOptions = {}): SQL[] {
  const fieldMappings = {
    walletId: 'walletId',
    fromUserId: 'fromUserId',
    toUserId: 'toUserId',
    currency: 'currency',
    description: 'description'
  };

  const conditions = buildFilters(filters, walletTransactions, fieldMappings, {
    ...options,
    searchFields: ['description']
  });

  // Filtres de type et statut (tableaux)
  if (filters.types && filters.types.length > 0) {
    conditions.push(sql`${walletTransactions.type} IN (${sql.join(filters.types)})`);
  }

  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(sql`${walletTransactions.status} IN (${sql.join(filters.statuses)})`);
  }

  // Filtres numériques
  if (filters.amountMin !== undefined) {
    conditions.push(sql`${walletTransactions.amount} >= ${filters.amountMin}`);
  }
  if (filters.amountMax !== undefined) {
    conditions.push(sql`${walletTransactions.amount} <= ${filters.amountMax}`);
  }

  if (filters.feesMin !== undefined) {
    conditions.push(sql`${walletTransactions.fees} >= ${filters.feesMin}`);
  }
  if (filters.feesMax !== undefined) {
    conditions.push(sql`${walletTransactions.fees} <= ${filters.feesMax}`);
  }

  if (filters.netAmountMin !== undefined) {
    conditions.push(sql`${walletTransactions.netAmount} >= ${filters.netAmountMin}`);
  }
  if (filters.netAmountMax !== undefined) {
    conditions.push(sql`${walletTransactions.netAmount} <= ${filters.netAmountMax}`);
  }

  return conditions;
}

// ============================================================================
// FILTRES ABONNEMENTS VIP
// ============================================================================

export function buildVipSubscriptionFilters(filters: VipSubscriptionFilters, options: FilterBuilderOptions = {}): SQL[] {
  const fieldMappings = {
    userId: 'userId',
    planType: 'planType',
    status: 'status',
    autoRenew: 'autoRenew',
    currency: 'currency'
  };

  const conditions = buildFilters(filters, vipSubscriptions, fieldMappings, options);

  // Filtres de date
  if (filters.startDateFrom) {
    conditions.push(sql`${vipSubscriptions.startDate} >= ${filters.startDateFrom}`);
  }
  if (filters.startDateTo) {
    conditions.push(sql`${vipSubscriptions.startDate} <= ${filters.startDateTo}`);
  }

  if (filters.endDateFrom) {
    conditions.push(sql`${vipSubscriptions.endDate} >= ${filters.endDateFrom}`);
  }
  if (filters.endDateTo) {
    conditions.push(sql`${vipSubscriptions.endDate} <= ${filters.endDateTo}`);
  }

  // Filtres numériques
  if (filters.pricePaidMin !== undefined) {
    conditions.push(sql`${vipSubscriptions.pricePaid} >= ${filters.pricePaidMin}`);
  }
  if (filters.pricePaidMax !== undefined) {
    conditions.push(sql`${vipSubscriptions.pricePaid} <= ${filters.pricePaidMax}`);
  }

  return conditions;
}

// ============================================================================
// FILTRES BOUTIQUES
// ============================================================================

export function buildShopFilters(filters: ShopFilters, options: FilterBuilderOptions = {}): SQL[] {
  const fieldMappings = {
    ownerId: 'ownerId',
    name: 'name',
    country: 'country',
    verified: 'verified',
    featured: 'featured',
    isVisible: 'isVisible',
    themeId: 'themeId'
  };

  const conditions = buildFilters(filters, shops, fieldMappings, {
    ...options,
    searchFields: ['name', 'description', 'country']
  });

  // Filtres numériques
  if (filters.productCountMin !== undefined) {
    conditions.push(sql`${shops.productCount} >= ${filters.productCountMin}`);
  }
  if (filters.productCountMax !== undefined) {
    conditions.push(sql`${shops.productCount} <= ${filters.productCountMax}`);
  }

  if (filters.viewCountMin !== undefined) {
    conditions.push(sql`${shops.viewCount} >= ${filters.viewCountMin}`);
  }
  if (filters.viewCountMax !== undefined) {
    conditions.push(sql`${shops.viewCount} <= ${filters.viewCountMax}`);
  }

  if (filters.balanceMin !== undefined) {
    conditions.push(sql`${shops.balance} >= ${filters.balanceMin}`);
  }
  if (filters.balanceMax !== undefined) {
    conditions.push(sql`${shops.balance} <= ${filters.balanceMax}`);
  }

  return conditions;
}

// ============================================================================
// FILTRES PRODUITS
// ============================================================================

export function buildProductFilters(filters: ProductFilters, options: FilterBuilderOptions = {}): SQL[] {
  const fieldMappings = {
    shopId: 'shopId',
    userId: 'userId',
    categoryId: 'categoryId',
    name: 'name',
    game: 'game',
    platform: 'platform',
    status: 'status',
    currency: 'currency',
    accountLevel: 'accountLevel',
    accountRank: 'accountRank',
    isFeatured: 'isFeatured',
    isNegotiable: 'isNegotiable',
    isVisible: 'isVisible',
    deliveredToUserId: 'deliveredToUserId'
  };

  const conditions = buildFilters(filters, products, fieldMappings, {
    ...options,
    searchFields: ['name', 'description', 'game', 'accountLevel', 'accountRank']
  });

  // Filtres de plateforme (tableau)
  if (filters.platform && filters.platform.length > 0) {
    conditions.push(sql`${products.platform} IN (${sql.join(filters.platform)})`);
  }

  // Filtres de statut (tableau)
  if (filters.status && filters.status.length > 0) {
    conditions.push(sql`${products.status} IN (${sql.join(filters.status)})`);
  }

  // Filtres numériques
  if (filters.priceMin !== undefined) {
    conditions.push(sql`${products.price} >= ${filters.priceMin}`);
  }
  if (filters.priceMax !== undefined) {
    conditions.push(sql`${products.price} <= ${filters.priceMax}`);
  }

  if (filters.viewCountMin !== undefined) {
    conditions.push(sql`${products.viewCount} >= ${filters.viewCountMin}`);
  }
  if (filters.viewCountMax !== undefined) {
    conditions.push(sql`${products.viewCount} <= ${filters.viewCountMax}`);
  }

  // Filtres de date de livraison
  if (filters.deliveredFrom) {
    conditions.push(sql`${products.deliveredAt} >= ${filters.deliveredFrom}`);
  }
  if (filters.deliveredTo) {
    conditions.push(sql`${products.deliveredAt} <= ${filters.deliveredTo}`);
  }

  return conditions;
}

// ============================================================================
// FILTRES COMMANDES
// ============================================================================

export function buildOrderFilters(filters: OrderFilters, options: FilterBuilderOptions = {}): SQL[] {
  const fieldMappings = {
    productId: 'productId',
    buyerId: 'buyerId',
    shopId: 'shopId',
    status: 'status',
    orderType: 'orderType',
    orderedProductId: 'orderedProductId'
  };

  const conditions = buildFilters(filters, orders, fieldMappings, options);

  // Filtres de statut (tableau)
  if (filters.statuses && filters.statuses.length > 0) {
    conditions.push(sql`${orders.status} IN (${sql.join(filters.statuses)})`);
  }

  // Filtres numériques
  if (filters.priceMin !== undefined) {
    conditions.push(sql`${orders.price} >= ${filters.priceMin}`);
  }
  if (filters.priceMax !== undefined) {
    conditions.push(sql`${orders.price} <= ${filters.priceMax}`);
  }

  // Filtres de date d'expiration
  if (filters.expiresFrom) {
    conditions.push(sql`${orders.expiresAt} >= ${filters.expiresFrom}`);
  }
  if (filters.expiresTo) {
    conditions.push(sql`${orders.expiresAt} <= ${filters.expiresTo}`);
  }

  return conditions;
}

// ============================================================================
// FACTORY POUR LES BUILDERS DE FILTRES
// ============================================================================

export const filterBuilders = {
  users: buildUserFilters,
  userWallets: buildUserWalletFilters,
  walletTransactions: buildWalletTransactionFilters,
  vipSubscriptions: buildVipSubscriptionFilters,
  shops: buildShopFilters,
  products: buildProductFilters,
  orders: buildOrderFilters,
  // Ajouter d'autres builders au fur et à mesure...
};

export type FilterBuilderType = keyof typeof filterBuilders;

export function getFilterBuilder<T extends BaseFilters>(
  entity: FilterBuilderType
): (filters: T, options?: FilterBuilderOptions) => SQL[] {
  return filterBuilders[entity] as (filters: T, options?: FilterBuilderOptions) => SQL[];
}

// ============================================================================
// COMPOSITE QUERY BUILDER
// ============================================================================

interface QueryBuilderResult {
  where: SQL[];
  orderBy: SQL[];
  limit: number;
  offset: number;
}

export function buildQuery<TFilters extends BaseFilters>(
  entity: FilterBuilderType,
  listQuery: ListQuery<TFilters> = {},
  options: FilterBuilderOptions & { defaultSort?: SortOptions } = {}
): QueryBuilderResult {
  const { pagination, filters = {} as TFilters, options: queryOptions = {} } = listQuery;
  
  const { page, limit, offset } = validatePagination(pagination);
  const builder = getFilterBuilder(entity);
  
  const whereConditions = builder(filters, {
    includeDeleted: queryOptions.includeDeleted,
    includeInactive: queryOptions.includeInactive,
    ...options
  });

  const orderByConditions = buildSortConditions(
    queryOptions.sortBy ? { 
      sortBy: queryOptions.sortBy, 
      sortOrder: queryOptions.sortOrder 
    } : undefined,
    getTableFromEntity(entity),
    options.defaultSort
  );

  return {
    where: whereConditions,
    orderBy: orderByConditions,
    limit,
    offset
  };
}

// ============================================================================
// UTILITAIRES AVANCÉS
// ============================================================================

function getTableFromEntity(entity: FilterBuilderType): PgTable {
  const tableMap: Record<FilterBuilderType, PgTable> = {
    users,
    userWallets,
    walletTransactions,
    vipSubscriptions,
    shops,
    products,
    orders,
    // Ajouter d'autres tables...
  };

  return tableMap[entity];
}

export function combineConditions(conditions: SQL[], operator: 'AND' | 'OR' = 'AND'): SQL {
  if (conditions.length === 0) {
    return sql`1 = 1`; // Condition toujours vraie
  }
  
  if (conditions.length === 1) {
    return conditions[0];
  }
  
  return sql`(${sql.join(conditions, operator === 'AND' ? sql` AND ` : sql` OR `)})`;
}

export function buildSearchCondition(search: string, searchableFields: (keyof PgTable)[]): SQL {
  const conditions = searchableFields.map(field => 
    sql`${field} ILIKE ${`%${search}%`}`
  );
  
  return combineConditions(conditions, 'OR');
}

// ============================================================================
// EXPORT DES TYPES POUR L'UTILISATION EXTERNE
// ============================================================================

export type {
  UserFilters,
  ShopFilters,
  ProductFilters,
  TournamentFilters,
  WalletTransactionFilters as TransactionFilters,
  OrderFilters,
  MessageFilters,
  InteractionFilters,
  TeamFilters,
  GameItemFilters,
  GameItemRequestFilters,
  ThemeFilters,
  CategoryFilters,
  PostFilters,
  NotificationFilters,
  GroupFilters,
  AnnouncementFilters,
  BlogFilters,
  ServiceFilters,
  GuideFilters
} from '@/types/api';

export type { FilterBuilderOptions, QueryBuilderResult };