// config/routes-config.ts

import { IconKey } from "@/types/icons";
import { NavItem } from "@/types/routes";

export interface RouteConfig {
  path: string | string[];
  name: string;
  breadcrumbs?: boolean;
  footer?: boolean;
  topMiddle?: boolean;
  leftBar?: boolean;
  rightBar?: boolean;
  navigationLinks?: boolean;
  floatingActions?: boolean;
  showAIAssistant?: boolean;
  requireAuth?: boolean;
  guestOnly?: boolean;
  requireAdmin?: boolean;
  excludeLayout?: boolean;
  fabActions?: FABAction[];
  activeFabActionId?: string;
  styleGroup?: string;
  description?: string;
  menu?: boolean;
  menuOrder?: number;
  hideTopMiddleOnScroll?: boolean;
  hideFloatingActions?: boolean;
  dockLinks?: DockLinkConfig[];
  showOnTap?: boolean;
  priority?: number;
}

export interface FABAction {
  id: string;
  label: string;
  type: "link" | "button";
  url?: string;
  action?: () => void;
  requiresAuth?: boolean;
  requiresAdmin?: boolean;
  requireWallet?: boolean;
  icon?: React.ReactNode;
  color?: string;
}

export interface UserRoles {
  isAuthenticated: boolean;
  hasWallet?: boolean;
  isAdmin: boolean;
  isVip: boolean;
  userId?: string;
}

export interface DockLinkConfig {
  href: string;
  label: string;
  icon: IconKey;
  requireAuth?: boolean;
}

export const defaultDockLinks: DockLinkConfig[] = [
  { href: "/", label: "Accueil", icon: "home", requireAuth: false },
  { href: "/games", label: "Jeux", icon: "swords", requireAuth: false },
  // {
  //   href: "/game-clips",
  //   label: "Clips",
  //   icon: "gameClips",
  //   requireAuth: false,
  // },
  {
    href: "/marketplace",
    label: "Marché",
    icon: "marketplace",
    requireAuth: false,
  },
  {
    href: "/tournaments",
    label: "Tournois",
    icon: "tournaments",
    requireAuth: false,
  },
  {
    href: "/shops",
    label: "Boutiques",
    icon: "shops",
    requireAuth: false,
  },
  { href: "/chats", label: "Chats", icon: "messages", requireAuth: true },
  { href: "/wallet", label: "Wallet", icon: "wallet", requireAuth: true },
];

export const defaultFABActions: FABAction[] = [
  {
    id: "goto-market",
    label: "Découvrir",
    type: "link",
    url: "/marketplace",
  },
  {
    id: "qr-scanner",
    label: "Scanner QR",
    type: "link",
    url: "/wallet/transactions/qr",
    requireWallet: true,
  },
  {
    id: "create-shop",
    label: "Créer une boutique",
    type: "link",
    url: "/shops/create",
    requiresAuth: true,
  },
  {
    id: "create-tournament",
    label: "Créer un tournoi",
    type: "link",
    url: "/tournaments/create",
    requiresAuth: true,
  },
  {
    id: "send-signal",
    label: "Signaler un problème",
    type: "link",
    url: "/signals?create=true",
    requiresAuth: false,
  },
];

// =============================================
// CONFIGURATION HIÉRARCHIQUE SANS CONFLITS
// =============================================

export const ROUTE_CONFIG: RouteConfig[] = [
  {
    path: '/offline',
    name: 'Hors-ligne',
    requireAuth: false,
    navigationLinks: false,
    footer: false,
    leftBar: false,
    rightBar: false,
    topMiddle: false,
    floatingActions: false,
  },
  // =============================================
  // ROUTES SANS LAYOUT (PRIORITÉ MAX)
  // =============================================
  {
    path: [
      "/sign-in",
      "/sign-up",
      "/forgot-password",
      "/reset-password",
      "/auth/**",
    ],
    name: "Authentification",
    excludeLayout: true,
    requireAuth: false,
    styleGroup: "auth",
    guestOnly: true,
    showOnTap: false,
  },
  {
    path: ["/welcome", "/onboarding", "/test", "/callback"],
    name: "Onboarding",
    excludeLayout: true,
    styleGroup: "onboarding",
    footer: false,
    topMiddle: false,
    leftBar: false,
    rightBar: false,
    breadcrumbs: false,
    guestOnly: true,
    showOnTap: false,
  },
  {
    path: "/maintenance",
    name: "Maintenance",
    excludeLayout: true,
    showOnTap: false,
  },
  {
    path: ["/docs", "/docs/**", "/guides", "/guides/**"],
    name: "Documentation",
    excludeLayout: true,
    styleGroup: "docs",
  },
  {
    path: ["/admin", "/admin/**"],
    name: "Admin",
    excludeLayout: true,
    requireAuth: true,
    requireAdmin: true,
    styleGroup: "admin",
    showOnTap: false,
    priority: 100,
  },

  // =============================================
  // DASHBOARDS
  // =============================================
  {
    path: [
      "/dashboard",
      "/dashboard/**",
      "/tournaments/[tournamentId]/dashboard",
      "/tournaments/[tournamentId]/dashboard/**",
      "/tournaments/[tournamentId]/editions/[editionId]/dashboard",
      "/tournaments/[tournamentId]/editions/[editionId]/dashboard/**",
      "/shops/[shopId]/dashboard",
      "/shops/[shopId]/dashboard/**",
      "/marketplace/[productId]/dashboard",
      "/marketplace/[productId]/dashboard/**",
    ],
    name: "Dashboard",
    excludeLayout: false,
    leftBar: true,
    rightBar: false,
    topMiddle: true,
    breadcrumbs: false,
    footer: false,
    requireAuth: true,
    navigationLinks: false,
    floatingActions: true,
    showAIAssistant: false,
    styleGroup: "dashboard",
    showOnTap: false,
    priority: 100,
  },

  // =============================================
  // PROFIL/WALLET/CHAT
  // =============================================
  {
    path: ["/profile", "/profile/settings", "/profile/[id]"],
    name: "Profil",
    excludeLayout: false,
    leftBar: true,
    rightBar: false,
    topMiddle: true,
    breadcrumbs: false,
    footer: false,
    requireAuth: true,
    navigationLinks: false,
    floatingActions: true,
    showAIAssistant: false,
    styleGroup: "profile",
    showOnTap: false,
    hideTopMiddleOnScroll: true,
  },
  {
    path: ["/wallet", "/wallet/**"],
    name: "Wallet",
    excludeLayout: false,
    hideFloatingActions: false,
    footer: false,
    leftBar: false,
    rightBar: false,
    hideTopMiddleOnScroll: true,
    dockLinks: [
      { href: "/", label: "Accueil", icon: "home", requireAuth: true },
      { href: "/wallet", label: "Wallet", icon: "wallet", requireAuth: true },
      {
        href: "/wallet/transactions",
        label: "Transactions",
        icon: "transactions",
        requireAuth: true,
      },
      {
        href: "/wallet/transactions/history",
        label: "Historique",
        icon: "history",
        requireAuth: true,
      },
      {
        href: "/wallet/claims",
        label: "Réclamations",
        icon: "claims",
        requireAuth: true,
      },
      {
        href: "/wallet/settings",
        label: "Paramètres",
        icon: "settings",
        requireAuth: true,
      },
    ],
    floatingActions: true,
    fabActions: defaultFABActions,
    requireAuth: true,
    styleGroup: "wallet",
  },
  // claims
  {
    path: ["/wallet/claims", "/wallet/claims/**"],
    name: "reclamations",
    styleGroup: "wallet",
    requireAuth: true,
  },
  {
    path: ["/wallet/transactions", "/wallet/transactions/**"],
    name: "transactions",
    styleGroup: "wallet",
    requireAuth: true,
  },
  {
    path: ["/wallet/transactions", "/wallet/transactions/create"],
    name: "create-transaction",
    styleGroup: "wallet",
    requireAuth: true,
  },
  {
    path: ["/chats", "/chats/**"],
    name: "Messagerie",
    excludeLayout: true,
    topMiddle: false,
    footer: false,
    leftBar: false,
    rightBar: false,
    breadcrumbs: false,
    navigationLinks: true,
    requireAuth: true,
    styleGroup: "chat",
    showOnTap: false,
    hideTopMiddleOnScroll: true,
    dockLinks: [
      { href: "/", label: "Accueil", icon: "home", requireAuth: true },
      { href: "/wallet", label: "Wallet", icon: "wallet", requireAuth: true },
      {
        href: "/chats",
        label: "Messagerie",
        icon: "communities",
        requireAuth: true,
      },
      { href: "/shops", label: "Boutiques", icon: "shops", requireAuth: true },
      {
        href: "/tournaments",
        label: "Tournois",
        icon: "tournaments",
        requireAuth: true,
      },
    ],
    floatingActions: false,
    fabActions: [],
  },

  // =============================================
  // ROUTES PUBLIQUES
  // =============================================
  {
    path: "/",
    name: "Accueil",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: false,
    navigationLinks: true,
    floatingActions: true,
    fabActions: defaultFABActions,
    dockLinks: defaultDockLinks,
    activeFabActionId: "goto-market",
    menu: true,
    menuOrder: 1,
    showAIAssistant: true,
    hideTopMiddleOnScroll: true,
    showOnTap: true,
  },
  {
    path: "/marketplace",
    name: "Marketplace",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: false,
    navigationLinks: true,
    floatingActions: true,
    dockLinks: defaultDockLinks,
    menu: true,
    menuOrder: 2,
    showOnTap: true,
    activeFabActionId: "qr-scanner",
    hideTopMiddleOnScroll: true,
    fabActions: defaultFABActions,
  },
  {
    path: "/marketplace/[productId]",
    name: "Detail Produit",
    breadcrumbs: false,
    footer: false,
    topMiddle: true,
    leftBar: true,
    rightBar: false,
    navigationLinks: false,
    showOnTap: true,
    hideTopMiddleOnScroll: true,
    activeFabActionId: "qr-scanner",
    dockLinks: defaultDockLinks,
    fabActions: defaultFABActions,
  },
  {
    path: "/shops",
    name: "Boutiques",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: false,
    floatingActions: true,
    showOnTap: true,
    hideTopMiddleOnScroll: true,
    dockLinks: defaultDockLinks,
    activeFabActionId: "create-shop",
    menu: true,
    menuOrder: 3,
    fabActions: defaultFABActions,
  },
  {
    path: "/shops/[shopId]",
    name: "Détail Boutique",
    footer: true,
    topMiddle: true,
    breadcrumbs: false,
    leftBar: true,
    rightBar: false,
    navigationLinks: true,
    hideFloatingActions: true,
    hideTopMiddleOnScroll: true,
    activeFabActionId: "goto-market",
    dockLinks: defaultDockLinks,
    fabActions: defaultFABActions,
  },
  {
    path: "/tournaments",
    name: "Tournois",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: true,
    navigationLinks: true,
    menu: true,
    menuOrder: 4,
    hideTopMiddleOnScroll: true,
    dockLinks: defaultDockLinks,
    activeFabActionId: "create-tournament",
    fabActions: defaultFABActions,
  },
  {
    path: "/tournaments/[tournamentId]",
    name: "Détail Tournoi",
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: true,
    navigationLinks: true,
    hideFloatingActions: true,
    breadcrumbs: false,
    activeFabActionId: "create-tournament",
    dockLinks: [
      { href: "/", label: "Accueil", icon: "home", requireAuth: true },
      {
        href: "/tournaments",
        label: "Tournois",
        icon: "tournaments",
        requireAuth: true,
      },
      {
        href: "/tournaments/[tournamentId]/members",
        label: "Membres",
        icon: "tournaments",
        requireAuth: true,
      },
      {
        href: "/tournaments/[tournamentId]/editions",
        label: "Éditions",
        icon: "tournaments",
        requireAuth: true,
      },
    ],
    hideTopMiddleOnScroll: true,
    fabActions: defaultFABActions,
  },
  //detail edition
  {
    path: [
      "/tournaments/[tournamentId]/editions/[editionId]",
      "/tournaments/[tournamentId]/editions/[editionId]/**",
    ],
    name: "Détail Édition",
    breadcrumbs: false,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: true,
    navigationLinks: true,
    hideFloatingActions: true,
    hideTopMiddleOnScroll: true,
    activeFabActionId: "create-tournament",
    dockLinks: [
      { href: "/", label: "Accueil", icon: "home", requireAuth: false },
      {
        href: "/marketplace",
        label: "Marché",
        icon: "marketplace",
        requireAuth: false,
      },
      { href: "/wallet", label: "Wallet", icon: "wallet", requireAuth: true },
      {
        href: "/games",
        label: "Jeux",
        icon: "tournaments",
        requireAuth: false,
      },
      // {
      //   href: "/game-clips",
      //   label: "Clips",
      //   icon: "clips",
      //   requireAuth: false,
      // },
    ],
    fabActions: defaultFABActions,
  },
  {
    path: ["/themes", "/themes/**"],
    name: "Thèmes",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: false,
    navigationLinks: true,
    menu: true,
    menuOrder: 6,
    hideTopMiddleOnScroll: true,
    showOnTap: true,
    activeFabActionId: "qr-scanner",
    dockLinks: defaultDockLinks,
    fabActions: defaultFABActions,
  },
  {
    path: ["/blogs", "/blogs/**"],
    name: "Blogs",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: false,
    navigationLinks: true,
    showOnTap: true,
    hideTopMiddleOnScroll: true,
    activeFabActionId: "create-shop",
    dockLinks: defaultDockLinks,
    fabActions: defaultFABActions,
  },
  {
    path: ["/services", "/services/**"],
    name: "Services",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: false,
    navigationLinks: true,
    showOnTap: true,
    hideTopMiddleOnScroll: true,
    activeFabActionId: "create-shop",
    dockLinks: defaultDockLinks,
    fabActions: defaultFABActions,
  },

  // =============================================
  // CRÉATION
  // =============================================
  {
    path: ["/shops/create", "/tournaments/create"],
    name: "Création",
    breadcrumbs: false,
    footer: false,
    topMiddle: true,
    leftBar: false,
    rightBar: false,
    navigationLinks: false,
    requireAuth: true,
    hideFloatingActions: true,
    showOnTap: false,
  },

  // =============================================
  // AUTRES
  // =============================================
  {
    path: "/game-clips",
    name: "Game Clips",
    breadcrumbs: false,
    footer: false,
    topMiddle: false,
    leftBar: false,
    rightBar: false,
    navigationLinks: false,
    floatingActions: false,
    showOnTap: true,
    hideTopMiddleOnScroll: true,
  },
  {
    path: "/games",
    name: "Jeux et Skins",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: true,
    navigationLinks: true,
    floatingActions: true,
    showOnTap: true,
    hideTopMiddleOnScroll: true,
    dockLinks: defaultDockLinks,
    fabActions: defaultFABActions,
  },
  {
    path: "/partners",
    name: "Partners",
    excludeLayout: false,
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: false,
    navigationLinks: true,
    floatingActions: true,
    showOnTap: true,
    hideTopMiddleOnScroll: true,
    activeFabActionId: "create-shop",
    dockLinks: defaultDockLinks,
    fabActions: defaultFABActions,
  },
  {
    path: "/signals",
    name: "Signals",
    excludeLayout: false,
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: false,
    navigationLinks: true,
    floatingActions: true,
    showOnTap: true,
    hideTopMiddleOnScroll: true,
    activeFabActionId: "send-signal",
    dockLinks: defaultDockLinks,
    fabActions: defaultFABActions,
  },
];

// =============================================
// FONCTIONS UTILITAIRES SIMPLIFIÉES
// =============================================

export const findRouteConfig = (pathname: string): RouteConfig => {
  const normalizedPath =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;

  // Chercher la config la plus spécifique
  for (const config of ROUTE_CONFIG) {
    const paths = Array.isArray(config.path) ? config.path : [config.path];

    for (const path of paths) {
      if (path === normalizedPath) {
        return config; // Match exact
      }

      // Vérifier les patterns avec paramètres
      if (path.includes("[") && path.includes("]")) {
        const pattern = path
          .replace(/\[[^\]]+\]/g, "[^/]+")
          .replace(/\*\*/g, ".*")
          .replace(/\*/g, "[^/]*");

        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(normalizedPath)) {
          return config;
        }
      }

      // Vérifier les wildcards
      if (path.includes("*")) {
        const pattern = path.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*");

        const regex = new RegExp(`^${pattern}$`);
        if (regex.test(normalizedPath)) {
          return config;
        }
      }
    }
  }

  // Retourner la config par défaut
  return ROUTE_CONFIG[ROUTE_CONFIG.length - 1];
};

export const canAccessRoute = (
  pathname: string,
  user: UserRoles,
): { hasAccess: boolean; redirectTo?: string; reason?: string } => {
  const config = findRouteConfig(pathname);

  // Admin check
  if (config.requireAdmin && (!user.isAuthenticated || !user.isAdmin)) {
    return { hasAccess: false, redirectTo: "/" };
  }

  // 1️⃣ Page protégée
  if (config.requireAuth && !user.isAuthenticated) {
    return {
      hasAccess: false,
      redirectTo: "/sign-in",
      reason: "AUTH_REQUIRED",
    };
  }

  // 2️⃣ Page guest-only
  if (config.guestOnly && user.isAuthenticated) {
    return {
      hasAccess: false,
      redirectTo: "/profile",
      reason: "ALREADY_AUTHENTICATED",
    };
  }

  return { hasAccess: true };
};

export const shouldExcludeLayout = (pathname: string): boolean => {
  const config = findRouteConfig(pathname);
  return config.excludeLayout || false;
};

export const getLayoutOptions = (
  pathname: string,
): Omit<
  RouteConfig,
  | "path"
  | "name"
  | "requireAuth"
  | "requireAdmin"
  | "description"
  | "styleGroup"
> => {
  const config = findRouteConfig(pathname);

  const {
    path,
    name,
    requireAuth,
    requireAdmin,
    description,
    styleGroup,
    ...layoutOptions
  } = config;

  return layoutOptions;
};

export const getBreadcrumbForRoute = (
  pathname: string,
): Array<{ name: string; path: string }> => {
  const normalizedPath =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;

  const parts = normalizedPath.split("/").filter((p) => p);
  const breadcrumb = [{ name: "Accueil", path: "/" }];

  let currentPath = "";
  for (const part of parts) {
    currentPath += "/" + part;
    const config = findRouteConfig(currentPath);
    if (config.name && config.name !== "Default") {
      breadcrumb.push({ name: config.name, path: currentPath });
    }
  }

  return breadcrumb;
};

export const getMenuRoutes = (): RouteConfig[] => {
  return ROUTE_CONFIG.filter((config) => config.menu === true).sort(
    (a, b) => (a.menuOrder || 99) - (b.menuOrder || 99),
  );
};
