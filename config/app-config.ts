// config/app-config.ts

interface TableConfig {
  pageSize: number;
  sortBy: string;
  sortOrder: string;
}

// Type basé sur le schéma mais avec des valeurs par défaut pour éviter les null
export type AppSettings = {
  // Limites (non nullables)
  maxProductsRegular: number;
  maxProductsVip: number;
  maxShopsRegular: number;
  maxShopsVip: number;
  maxTournamentsRegular: number;
  maxTournamentsVip: number;
  
  // Stories/Posts
  storyDurationHours: number;
  maxStoriesPerDayRegular: number;
  maxStoriesPerDayVip: number;

  //game clips
  maxGameClipsPerDayRegular: number;
  maxGameClipsPerDayVip: number;
  ClipDuration: number;
  maxGameClipsPerShopRegular: number;
  maxGameClipsPerShopVip: number;
  
  // Frais (strings)
  transactionFeePercentage: string;
  purchaseFeePercentage: string;
  depositFeePercentage: string;
  withdrawalFeePercentage: string;
  transferFeePercentage: string;
  tournamentParticipationFeePercentage: string;
  
  // Taux de change
  gtcToFcfaRate: string;
  gtcToEurRate: string | null;
  gtcToUsdRate: string | null;
  
  // VIP
  vipMonthlyPrice: string;
  vipYearlyPrice: string;
  
  // Thèmes
  freeThemesLimitRegular: number;
  freeThemesLimitVip: number;
  maxThemeCreationsRegular: number;
  maxThemeCreationsVip: number;
  canVipCreateThemes: boolean;
  canVipSellThemes: boolean;
  themeCreationFee: string;
  themeSaleCommissionPercentage: string;
  
  // Tournois
  maxParticipantsPerTournament: number;
  maxCoOrganizersRatio: number;
  
  // Items de jeu
  gameItemsEnabled: boolean;
  gameItemCommissionPercentage: string;
  minGameItemRequest: string;
  maxGameItemRequest: string;
  
  // Permissions
  userPermissions: Record<string, any>;
  adminPermissions: Record<string, any>;
  regularUserPermissions: string[];
  vipUserPermissions: string[];
  
  // Routes
  publicRoutes: string[];
  protectedRoutes: string[];
  adminRoutes: Record<string, any>;
  
  // Tâches admin
  adminTasks: Record<string, any>;
  
  // Mode
  maintenanceMode: boolean;
  defaultUserBalance: number;
  
  // Configuration UI
  showAnnouncementsOnStartup: boolean;
  maxAnnouncementsToShow: number;
  enableRealTimeNotifications: boolean;
  autoRefreshInterval: number;

  tableConfig: Record<string, TableConfig>;
  components: Record<string, any>;
  features: Record<string, any>;
  
  // Champs additionnels de la DB (optionnels)
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  lastExchangeRateUpdate?: Date | null;
};

// Helper pour convertir les champs null en valeurs par défaut
export type SanitizedAppSettings = AppSettings & {
  // On s'assure que tous les champs numériques sont présents
  maxProductsRegular: number;
  maxProductsVip: number;
  maxShopsRegular: number;
  maxShopsVip: number;
  maxTournamentsRegular: number;
  maxTournamentsVip: number;
  storyDurationHours: number;
  maxStoriesPerDayRegular: number;
  maxStoriesPerDayVip: number;
  freeThemesLimitRegular: number;
  freeThemesLimitVip: number;
  maxThemeCreationsRegular: number;
  maxThemeCreationsVip: number;
  maxParticipantsPerTournament: number;
  defaultUserBalance: number;
  maxAnnouncementsToShow: number;
  autoRefreshInterval: number;
};

// Fonction utilitaire pour nettoyer les settings
export function sanitizeAppSettings(dbSettings: any): AppSettings {
  return {
    // Limites
    maxProductsRegular: dbSettings.maxProductsRegular ?? DEFAULT_APP_SETTINGS.maxProductsRegular,
    maxProductsVip: dbSettings.maxProductsVip ?? DEFAULT_APP_SETTINGS.maxProductsVip,
    maxShopsRegular: dbSettings.maxShopsRegular ?? DEFAULT_APP_SETTINGS.maxShopsRegular,
    maxShopsVip: dbSettings.maxShopsVip ?? DEFAULT_APP_SETTINGS.maxShopsVip,
    maxTournamentsRegular: dbSettings.maxTournamentsRegular ?? DEFAULT_APP_SETTINGS.maxTournamentsRegular,
    maxTournamentsVip: dbSettings.maxTournamentsVip ?? DEFAULT_APP_SETTINGS.maxTournamentsVip,
    
    // Stories/Posts
    storyDurationHours: dbSettings.storyDurationHours ?? DEFAULT_APP_SETTINGS.storyDurationHours,
    maxStoriesPerDayRegular: dbSettings.maxStoriesPerDayRegular ?? DEFAULT_APP_SETTINGS.maxStoriesPerDayRegular,
    maxStoriesPerDayVip: dbSettings.maxStoriesPerDayVip ?? DEFAULT_APP_SETTINGS.maxStoriesPerDayVip,
    
    // Frais
    transactionFeePercentage: dbSettings.transactionFeePercentage ?? DEFAULT_APP_SETTINGS.transactionFeePercentage,
    purchaseFeePercentage: dbSettings.purchaseFeePercentage ?? DEFAULT_APP_SETTINGS.purchaseFeePercentage,
    depositFeePercentage: dbSettings.depositFeePercentage ?? DEFAULT_APP_SETTINGS.depositFeePercentage,
    withdrawalFeePercentage: dbSettings.withdrawalFeePercentage ?? DEFAULT_APP_SETTINGS.withdrawalFeePercentage,
    transferFeePercentage: dbSettings.transferFeePercentage ?? DEFAULT_APP_SETTINGS.transferFeePercentage,
    tournamentParticipationFeePercentage: dbSettings.tournamentParticipationFeePercentage ?? DEFAULT_APP_SETTINGS.tournamentParticipationFeePercentage,
    
    // Taux de change
    gtcToFcfaRate: dbSettings.gtcToFcfaRate ?? DEFAULT_APP_SETTINGS.gtcToFcfaRate,
    gtcToEurRate: dbSettings.gtcToEurRate ?? DEFAULT_APP_SETTINGS.gtcToEurRate,
    gtcToUsdRate: dbSettings.gtcToUsdRate ?? DEFAULT_APP_SETTINGS.gtcToUsdRate,
    
    // VIP
    vipMonthlyPrice: dbSettings.vipMonthlyPrice ?? DEFAULT_APP_SETTINGS.vipMonthlyPrice,
    vipYearlyPrice: dbSettings.vipYearlyPrice ?? DEFAULT_APP_SETTINGS.vipYearlyPrice,
    
    // Thèmes
    freeThemesLimitRegular: dbSettings.freeThemesLimitRegular ?? DEFAULT_APP_SETTINGS.freeThemesLimitRegular,
    freeThemesLimitVip: dbSettings.freeThemesLimitVip ?? DEFAULT_APP_SETTINGS.freeThemesLimitVip,
    maxThemeCreationsRegular: dbSettings.maxThemeCreationsRegular ?? DEFAULT_APP_SETTINGS.maxThemeCreationsRegular,
    maxThemeCreationsVip: dbSettings.maxThemeCreationsVip ?? DEFAULT_APP_SETTINGS.maxThemeCreationsVip,
    canVipCreateThemes: dbSettings.canVipCreateThemes ?? DEFAULT_APP_SETTINGS.canVipCreateThemes,
    canVipSellThemes: dbSettings.canVipSellThemes ?? DEFAULT_APP_SETTINGS.canVipSellThemes,
    themeCreationFee: dbSettings.themeCreationFee ?? DEFAULT_APP_SETTINGS.themeCreationFee,
    themeSaleCommissionPercentage: dbSettings.themeSaleCommissionPercentage ?? DEFAULT_APP_SETTINGS.themeSaleCommissionPercentage,
    
    // Tournois
    maxParticipantsPerTournament: dbSettings.maxParticipantsPerTournament ?? DEFAULT_APP_SETTINGS.maxParticipantsPerTournament,
    maxCoOrganizersRatio: dbSettings.maxCoOrganizersRatio ?? DEFAULT_APP_SETTINGS.maxCoOrganizersRatio,
    
    // Items de jeu
    gameItemsEnabled: dbSettings.gameItemsEnabled ?? DEFAULT_APP_SETTINGS.gameItemsEnabled,
    gameItemCommissionPercentage: dbSettings.gameItemCommissionPercentage ?? DEFAULT_APP_SETTINGS.gameItemCommissionPercentage,
    minGameItemRequest: dbSettings.minGameItemRequest ?? DEFAULT_APP_SETTINGS.minGameItemRequest,
    maxGameItemRequest: dbSettings.maxGameItemRequest ?? DEFAULT_APP_SETTINGS.maxGameItemRequest,
    
    // Permissions
    userPermissions: dbSettings.userPermissions && typeof dbSettings.userPermissions === 'object' 
      ? dbSettings.userPermissions 
      : DEFAULT_APP_SETTINGS.userPermissions,
    adminPermissions: dbSettings.adminPermissions && typeof dbSettings.adminPermissions === 'object'
      ? dbSettings.adminPermissions
      : DEFAULT_APP_SETTINGS.adminPermissions,
    regularUserPermissions: Array.isArray(dbSettings.regularUserPermissions)
      ? dbSettings.regularUserPermissions
      : DEFAULT_APP_SETTINGS.regularUserPermissions,
    vipUserPermissions: Array.isArray(dbSettings.vipUserPermissions)
      ? dbSettings.vipUserPermissions
      : DEFAULT_APP_SETTINGS.vipUserPermissions,
    
    // Routes
    publicRoutes: Array.isArray(dbSettings.publicRoutes)
      ? dbSettings.publicRoutes
      : DEFAULT_APP_SETTINGS.publicRoutes,
    protectedRoutes: Array.isArray(dbSettings.protectedRoutes)
      ? dbSettings.protectedRoutes
      : DEFAULT_APP_SETTINGS.protectedRoutes,
    adminRoutes: dbSettings.adminRoutes && typeof dbSettings.adminRoutes === 'object'
      ? dbSettings.adminRoutes
      : DEFAULT_APP_SETTINGS.adminRoutes,
    
    // Tâches admin
    adminTasks: dbSettings.adminTasks && typeof dbSettings.adminTasks === 'object'
      ? dbSettings.adminTasks
      : DEFAULT_APP_SETTINGS.adminTasks,
    
    // Mode
    maintenanceMode: dbSettings.maintenanceMode ?? DEFAULT_APP_SETTINGS.maintenanceMode,
    defaultUserBalance: dbSettings.defaultUserBalance ?? DEFAULT_APP_SETTINGS.defaultUserBalance,
    
    // Configuration UI
    showAnnouncementsOnStartup: dbSettings.showAnnouncementsOnStartup ?? DEFAULT_APP_SETTINGS.showAnnouncementsOnStartup,
    maxAnnouncementsToShow: dbSettings.maxAnnouncementsToShow ?? DEFAULT_APP_SETTINGS.maxAnnouncementsToShow,
    enableRealTimeNotifications: dbSettings.enableRealTimeNotifications ?? DEFAULT_APP_SETTINGS.enableRealTimeNotifications,
    autoRefreshInterval: dbSettings.autoRefreshInterval ?? DEFAULT_APP_SETTINGS.autoRefreshInterval,
    
    // Champs additionnels
    id: dbSettings.id,
    createdAt: dbSettings.createdAt,
    updatedAt: dbSettings.updatedAt,
    lastExchangeRateUpdate: dbSettings.lastExchangeRateUpdate,
    //game clips
    maxGameClipsPerDayRegular: dbSettings.maxGameClipsPerDayRegular,
    maxGameClipsPerDayVip: dbSettings.maxGameClipsPerDayVip,
    maxGameClipsPerShopRegular: dbSettings.maxGameClipsPerShopRegular,
    maxGameClipsPerShopVip: dbSettings.maxGameClipsPerShopVip,
    ClipDuration: dbSettings.ClipDuration,
    tableConfig: dbSettings.tableConfig,
    components: dbSettings.components,
    features: dbSettings.features,
  };
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  // Limites
  maxProductsRegular: 5,
  maxProductsVip: 20,
  maxShopsRegular: 1,
  maxShopsVip: 5,
  maxTournamentsRegular: 1,
  maxTournamentsVip: 5,
  
  // Stories/Posts
  storyDurationHours: 48,
  maxStoriesPerDayRegular: 3,
  maxStoriesPerDayVip: 10,

  //game clips
  maxGameClipsPerDayRegular: 3,
  maxGameClipsPerDayVip: 10,
  maxGameClipsPerShopRegular: 3,
  maxGameClipsPerShopVip: 10,
  ClipDuration: 60,

  //table config
  tableConfig: {
    users: {
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    products: {
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    shops: {
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    tournaments: {
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    gameClips: {
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    transactions: {
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    deposits: {
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    withdrawals: {
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    transfers: {
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    gameItems: {
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
    gameItemRequests: {
      pageSize: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },
  },
  //components
  components: {
    showAnnouncementsOnStartup: true,
    maxAnnouncementsToShow: 5,
    enableRealTimeNotifications: true,
    autoRefreshInterval: 60000,
  },
  //features
  features: {
    showAnnouncementsOnStartup: true,
    maxAnnouncementsToShow: 5,
    enableRealTimeNotifications: true,
    autoRefreshInterval: 60000,
  },
  
  // Frais
  transactionFeePercentage: '0.001',
  purchaseFeePercentage: '0.01',
  depositFeePercentage: '0.00',
  withdrawalFeePercentage: '0.02',
  transferFeePercentage: '0.005',
  tournamentParticipationFeePercentage: '0.01',
  
  // Taux de change
  gtcToFcfaRate: '500.0',
  gtcToEurRate: null,
  gtcToUsdRate: null,
  
  // VIP
  vipMonthlyPrice: '250',
  vipYearlyPrice: '2500',
  
  // Thèmes
  freeThemesLimitRegular: 2,
  freeThemesLimitVip: 10,
  maxThemeCreationsRegular: 0,
  maxThemeCreationsVip: 5,
  canVipCreateThemes: true,
  canVipSellThemes: true,
  themeCreationFee: '0.0',
  themeSaleCommissionPercentage: '0.15',
  
  // Tournois
  maxParticipantsPerTournament: 32,
  maxCoOrganizersRatio: 0.33,
  
  // Items de jeu
  gameItemsEnabled: true,
  gameItemCommissionPercentage: '0.05',
  minGameItemRequest: '1.0',
  maxGameItemRequest: '1000.0',
  
  // Permissions
  userPermissions: {},
  adminPermissions: {},
  regularUserPermissions: [
    'create_post',
    'create_comment',
    'like',
    'follow',
    'create_shop',
    'create_product',
    'participate_tournament'
  ],
  vipUserPermissions: [
    'create_post',
    'create_comment',
    'like',
    'follow',
    'create_shop',
    'create_product',
    'participate_tournament',
    'create_tournament',
    'create_theme',
    'unlimited_posts',
    'priority_support'
  ],
  
  // Routes
  publicRoutes: ["/", "/marketplace", "/tournaments", "/sign-in", "/sign-up", "/products", "/shops"],
  protectedRoutes: ["/profile", "/wallet", "/transactions", "/dashboard"],
  adminRoutes: {},
  
  // Tâches admin
  adminTasks: {},
  
  // Mode
  maintenanceMode: false,
  defaultUserBalance: 250,
  
  // Configuration UI
  showAnnouncementsOnStartup: true,
  maxAnnouncementsToShow: 3,
  enableRealTimeNotifications: true,
  autoRefreshInterval: 30000,
};

// Type pour les mises à jour (accepte null/undefined)
export type AppSettingsUpdate = Partial<{
  [K in keyof AppSettings]: AppSettings[K] | null | undefined;
}>;

export interface RouteAccessConfig {
  public: string[];
  protected: string[];
  admin: string[];
}

export const DEFAULT_ROUTE_ACCESS: RouteAccessConfig = {
  public: [
    "/",
    "/marketplace",
    "/tournaments",
    "/shops",
    "/products",
    "/sign-in",
    "/sign-up",
    "/welcome",
    "/test",
    "/onboarding",
    "/maintenance"
  ],
  protected: [
    "/profile",
    "/chat",
    "/transactions",
    "/wallet",
    "/dashboard",
    "/mon-espace",
    "/offers",
    "/shops/create",
    "/tournaments/create",
    "/products/create"
  ],
  admin: [
    "/admin",
    "/admin/users",
    "/admin/settings",
    "/admin/announcements",
    "/admin/reports",
    "/admin/themes"
  ],
};

export interface PermissionsConfig {
  regular: string[];
  vip: string[];
  admin: string[];
}

export const DEFAULT_PERMISSIONS: PermissionsConfig = {
  regular: [
    'create_post',
    'create_comment',
    'like',
    'follow',
    'create_shop',
    'create_product',
    'participate_tournament'
  ],
  vip: [
    'create_post',
    'create_comment',
    'like',
    'follow',
    'create_shop',
    'create_product',
    'participate_tournament',
    'create_tournament',
    'create_theme',
    'unlimited_posts',
    'priority_support'
  ],
  admin: [
    'all_permissions',
    'manage_users',
    'manage_settings',
    'manage_announcements',
    'view_analytics',
    'moderate_content',
    'toggle_maintenance'
  ]
};