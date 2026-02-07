// config/routes-config.ts

// import { NavItem } from "@/components/layout/floating-dock";
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
  requireAdmin?: boolean;
  excludeLayout?: boolean;
  fabActions?: FABAction[];
  activeFabActionId?: string;
  styleGroup?: string;
  description?: string;
  menu?: boolean;
  menuOrder?: number;
  hideTopMiddleOnScroll?: boolean; // Nouveau: cacher top-middle au scroll
  hideFloatingActions?: boolean; // Nouveau: cacher FAB
dockLinks?: DockLinkConfig[]
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
  {
    href: "/",
    label: "Accueil",
    icon: "home",
    requireAuth: false,
  },
  {
    href: "/games",
    label: "Jeux",
    icon: "games",
    requireAuth: false,
  },
  {
    href: "/game-clips",
    label: "Clips",
    icon: "gameClips",
    requireAuth: false,
  },
  {
    href: "/marketplace",
    label: "Boutique",
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
    href: "/wallet",
    label: "Wallet",
    icon: "wallet",
    requireAuth: true,
  },
];

// =============================================
// CONFIGURATION HIÉRARCHIQUE SANS CONFLITS
// =============================================

export const ROUTE_CONFIG: RouteConfig[] = [
  // =============================================
  // ROUTES SANS LAYOUT (PRIORITÉ MAX)
  // =============================================
  {
    path: ["/sign-in", "/sign-up", "/auth/**"],
    name: "Authentification",
    excludeLayout: true,
    requireAuth: false,
    styleGroup: "auth",
  },
  {
    path: ["/welcome", "/onboarding", "/test"],
    name: "Onboarding",
    excludeLayout: true,
    styleGroup: "onboarding",
  },
  {
    path: "/maintenance",
    name: "Maintenance",
    excludeLayout: true,
  },
  {
    path: ["/docs", "/docs/**"],
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
  },

  // =============================================
  // ADMIN (sans layout spécial)
  // =============================================
  // {
  //   path: "/admin/**",
  //   name: "Administration",
  //   excludeLayout: true, // Layout exclus pour utiliser le layout admin spécifique
  //   requireAuth: true,
  //   requireAdmin: true,
  //   styleGroup: "admin",
  //   leftBar: false,
  //   rightBar: false,
  //   topMiddle: true,
  //   breadcrumbs: false,
  //   footer: false,
  // },

  // =============================================
  // DASHBOARDS (sans layout normal)
  // =============================================
  {
    path: ["/dashboard", "/dashboard/**"],
    name: "Dashboard Personnel",
    excludeLayout: true,
    requireAuth: true,
    styleGroup: "dashboard",
  },
  {
    path: "/tournaments/[tournamentId]/editions/[editionId]/dashboard/**",
    name: "Dashboard Édition",
    excludeLayout: true,
    requireAuth: true,
    styleGroup: "dashboard",
  },
  {
    path: "/tournaments/[tournamentId]/dashboard/**",
    name: "Dashboard Tournoi",
    excludeLayout: true,
    requireAuth: true,
    styleGroup: "dashboard",
  },
  {
    path: "/shops/[shopId]/dashboard/**",
    name: "Dashboard Boutique",
    excludeLayout: true,
    requireAuth: true,
    styleGroup: "dashboard",
  },
  {
    path: ["/marketplace/[productId]/dashboard/**"],
    name: "Dashboard Produit",
    excludeLayout: true,
    requireAuth: true,
    styleGroup: "dashboard",
  },

  // =============================================
  // PROFIL/WALLET/CHAT (sans layout)
  // =============================================
  {
    path: "/profile/**",
    name: "Profil",
    excludeLayout: true,
    requireAuth: true,
    styleGroup: "profile",
  },
  {
    path: ["/wallet", "/wallet/**"],
    name: "Wallet",
    excludeLayout: true,
    hideFloatingActions: false,
    dockLinks: [
      {
        href: "/wallet",
        label: "Wallet",
        icon: "wallet",
        requireAuth: true,
      },
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
    requireAuth: true,
    styleGroup: "wallet",
  },
  {
    path: ["/chat", "/messages", "/chat/**", "/messages/**"],
    name: "Messagerie",
    excludeLayout: true,
    requireAuth: true,
    styleGroup: "chat",
  },

  // =============================================
  // ROUTES PUBLIQUES AVEC LAYOUT COMPLET
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
    fabActions: [
      {
        id: "goto-market",
        label: "Découvrir",
        type: "link",
        url: "/marketplace",
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
    ],
    dockLinks: [
      {
        href: "/marketplace",
        label: "Marketplace",
        icon: "marketplace",
        requireAuth: false,
      },
      { href: "/shops", label: "Boutiques", icon: "shops", requireAuth: false },
      {
        href: "/tournaments",
        label: "Tournois",
        icon: "tournaments",
        requireAuth: false,
      },
      { href: "/themes", label: "Thèmes", icon: "themes", requireAuth: false },
    ],
    activeFabActionId: "goto-market",
    menu: true,
    menuOrder: 1,
    showAIAssistant: true,
    hideTopMiddleOnScroll: true,
  },

  // =============================================
  // MARKETPLACE
  // =============================================
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
    fabActions: [
      {
        id: "goto-market",
        label: "Découvrir",
        type: "link",
        url: "/marketplace",
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
    ],
    dockLinks: [
      { href: "/", label: "Accueil", icon: "home", requireAuth: false },
      { href: "/shops", label: "Boutiques", icon: "shops", requireAuth: false },
      {
        href: "/tournaments",
        label: "Tournois",
        icon: "tournaments",
        requireAuth: false,
      },
      { href: "/themes", label: "Thèmes", icon: "themes", requireAuth: false },
    ],
    menu: true,
    menuOrder: 2,
    hideTopMiddleOnScroll: false,
  },

  // =============================================
  // BOUTIQUES
  // =============================================
  {
    path: "/shops",
    name: "Boutiques",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    floatingActions: true,
    fabActions: [
      {
        id: "goto-market",
        label: "Découvrir",
        type: "link",
        url: "/marketplace",
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
    ],
    dockLinks: [
      { href: "/", label: "Accueil", icon: "home", requireAuth: false },
      { href: "/shops", label: "Boutiques", icon: "shops", requireAuth: false },
      {
        href: "/tournaments",
        label: "Tournois",
        icon: "tournaments",
        requireAuth: false,
      },
      { href: "/themes", label: "Thèmes", icon: "themes", requireAuth: false },
      { href: "/games", label: "Jeux", icon: "games", requireAuth: false },
      { href: "/game-clips", label: "Clips", icon: "gameClips", requireAuth: false },
    ],
    leftBar: true,
    rightBar: false,
    navigationLinks: true,
    menu: true,
    menuOrder: 3,
  },
  {
    path: "/shops/[shopId]",
    name: "Détail Boutique",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: false,
    navigationLinks: true,
    hideFloatingActions: true,
    dockLinks: [
      { href: "/", label: "Accueil", icon: "home", requireAuth: false },
      { href: "/shops", label: "Boutiques", icon: "shops", requireAuth: false },
      {
        href: "/tournaments",
        label: "Tournois",
        icon: "tournaments",
        requireAuth: false,
      },
      { href: "/themes", label: "Thèmes", icon: "themes", requireAuth: false },
      { href: "/games", label: "Jeux", icon: "games", requireAuth: false },
      { href: "/game-clips", label: "Clips", icon: "gameClips", requireAuth: false },
    ],
  },

  // =============================================
  // TOURNOIS
  // =============================================
  {
    path: "/tournaments",
    name: "Tournois",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: true, // Right bar activé pour les tournois
    navigationLinks: true,
    menu: true,
    menuOrder: 4,
    dockLinks: [
      { href: "/", label: "Accueil", icon: "home", requireAuth: false },
      { href: "/shops", label: "Boutiques", icon: "shops", requireAuth: false },
      { href: "/themes", label: "Thèmes", icon: "themes", requireAuth: false },
      { href: "/games", label: "Jeux", icon: "games", requireAuth: false },
      { href: "/game-clips", label: "Clips", icon: "gameClips", requireAuth: false },
    ],
  },
  {
    path: "/tournaments/[tournamentId]",
    name: "Détail Tournoi",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: true,
    navigationLinks: true,
    hideFloatingActions: true,
    dockLinks: [
      { href: "/", label: "Accueil", icon: "home", requireAuth: false },
      { href: "/shops", label: "Boutiques", icon: "shops", requireAuth: false },
      { href: "/themes", label: "Thèmes", icon: "themes", requireAuth: false },
      { href: "/games", label: "Jeux", icon: "games", requireAuth: false },
      { href: "/game-clips", label: "Clips", icon: "gameClips", requireAuth: false },
    ],
  },

  // =============================================
  // PRODUITS
  // =============================================
  {
    path: "/marketplace/productId",
    name: "Detail Produit",
    breadcrumbs: false,
    footer: false,
    topMiddle: true,
    leftBar: true,
    rightBar: false,
    navigationLinks: true,
    menu: true,
    menuOrder: 5,
    dockLinks: [
      { href: "/", label: "Accueil", icon: "home", requireAuth: false },
      { href: "/shops", label: "Boutiques", icon: "shops", requireAuth: false },
      { href: "/tournaments", label: "Tournois", icon: "tournaments", requireAuth: false },
      { href: "/games", label: "Jeux", icon: "games", requireAuth: false },
      { href: "/game-clips", label: "Clips", icon: "gameClips", requireAuth: false },
    ],
  },

  // =============================================
  // THÈMES
  // =============================================
  {
    path: "/themes/**",
    name: "Thèmes",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: true,
    navigationLinks: true,
    menu: true,
    menuOrder: 6,
    dockLinks: [
      { href: "/", label: "Accueil", icon: "home", requireAuth: false },
      { href: "/shops", label: "Boutiques", icon: "shops", requireAuth: false },
      { href: "/tournaments", label: "Tournois", icon: "tournaments", requireAuth: false },
      { href: "/games", label: "Jeux", icon: "games", requireAuth: false },
      { href: "/game-clips", label: "Clips", icon: "gameClips", requireAuth: false },
    ],
  },

  // =============================================
  // CRÉATION (avec auth, sans footer)
  // =============================================
  {
    path: "/shops/create",
    name: "Créer Boutique",
    breadcrumbs: true,
    footer: false,
    topMiddle: true,
    leftBar: false,
    rightBar: false,
    navigationLinks: false,
    requireAuth: true,
    hideFloatingActions: true,
  },
  {
    path: "/tournaments/create",
    name: "Créer Tournoi",
    breadcrumbs: true,
    footer: false,
    topMiddle: true,
    leftBar: false,
    rightBar: false,
    navigationLinks: false,
    requireAuth: true,
    hideFloatingActions: true,
  },

  // =============================================
  // AUTRES ROUTES (blogs, services, guides, etc.)
  // =============================================
  {
    path: ["/blogs", "/blogs/**"],
    name: "Blogs",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: false,
    navigationLinks: true,
    menu: false,
    dockLinks: [
      { href: "/", label: "Accueil", icon: "home", requireAuth: false },
      { href: "/shops", label: "Boutiques", icon: "shops", requireAuth: false },
      { href: "/tournaments", label: "Tournois", icon: "tournaments", requireAuth: false },
      { href: "/games", label: "Jeux", icon: "games", requireAuth: false },
      { href: "/game-clips", label: "Clips", icon: "gameClips", requireAuth: false },
    ],
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
    menu: false,
    dockLinks: defaultDockLinks,
  },
  {
    path: ["/guides", "/guides/**"],
    name: "Guides",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: false,
    navigationLinks: true,
    menu: false,
  },

  // =============================================
  // ROUTES UTILISATEUR (avec layout normal)
  // =============================================
  {
    path: ["/profile/settings", "/profile/settings/**"],
    name: "Paramètres",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: false,
    navigationLinks: true,
    requireAuth: true,
  },
  {
    path: ["/dashboard/notifications", "/dashboard/notifications/**"],
    name: "Notifications",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: false,
    navigationLinks: true,
    requireAuth: true,
  },

  // =============================================
  // GAME CLIPS (Full screen like TikTok/Reels)
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
    floatingActions: true,
    dockLinks: [
      { href: "/", label: "Accueil", icon: "home", requireAuth: false },
      {
        href: "/marketplace",
        label: "Marketplace",
        icon: "marketplace",
        requireAuth: false,
      },
      { href: "/shops", label: "Boutiques", icon: "shops", requireAuth: false },
      {
        href: "/tournaments",
        label: "Tournois",
        icon: "tournaments",
        requireAuth: false,
      },
    ],
    hideTopMiddleOnScroll: true,
  },

  // partners
  {
    path: "/partners",
    name: "Partners",
    breadcrumbs: false,
    footer: false,
    topMiddle: false,
    leftBar: false,
    rightBar: false,
    navigationLinks: false,
    floatingActions: true,
    dockLinks: defaultDockLinks,
    hideTopMiddleOnScroll: true,
  },

  // =============================================
  // CONFIGURATION PAR DÉFAUT
  // =============================================
  {
    path: "/**",
    name: "Default",
    breadcrumbs: true,
    footer: true,
    topMiddle: true,
    leftBar: true,
    rightBar: true,
    navigationLinks: true,
    floatingActions: true,
    showAIAssistant: true,
    hideTopMiddleOnScroll: false,
    dockLinks: [
      { href: "/", label: "Accueil", icon: "home", requireAuth: false },
      {
        href: "/marketplace",
        label: "Marketplace",
        icon: "marketplace",
        requireAuth: false,
      },
      { href: "/shops", label: "Boutiques", icon: "shops", requireAuth: false },
      {
        href: "/tournaments",
        label: "Tournois",
        icon: "tournaments",
        requireAuth: false,
      },
      { href: "/game-clips", label: "Clips", icon: "clips", requireAuth: false },
      { href: "/blogs", label: "Blogs", icon: "blogs", requireAuth: false },
      { href: "/guides", label: "Guides", icon: "guides", requireAuth: false },
    ],
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
): { hasAccess: boolean; redirectTo?: string } => {
  const config = findRouteConfig(pathname);

  // Admin check
  if (config.requireAdmin && (!user.isAuthenticated || !user.isAdmin)) {
    return { hasAccess: false, redirectTo: "/" };
  }

  // Auth check
  if (config.requireAuth && !user.isAuthenticated) {
    return {
      hasAccess: false,
      redirectTo: `/sign-in?redirect=${encodeURIComponent(pathname)}`,
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
