import {
  ROUTE_CONFIG,
  findRouteConfig,
  canAccessRoute as canAccessRouteOriginal,
  type RouteConfig,
  type UserRoles as OriginalUserRoles,
} from "@/config/routes-config";
import { ResolvedRoute, NavItem, FabAction } from "@/types/routes";
import {
  Home,
  Store,
  Trophy,
  ShoppingBag,
  Package,
  Palette,
  Wallet,
  User,
  Settings,
  MessageSquare,
  Bell,
  Users,
  Shield,
} from "lucide-react";

// Mapper les icônes
const ICON_MAP: Record<string, any> = {
  home: Home,
  marketplace: Store,
  shops: ShoppingBag,
  products: Package,
  tournaments: Trophy,
  themes: Palette,
  wallet: Wallet,
  profile: User,
  settings: Settings,
  messages: MessageSquare,
  notifications: Bell,
  communities: Users,
  admin: Shield,
};

// Vérifie si une route correspond exactement
function isExactMatch(
  currentPath: string,
  configPath: string | string[],
): boolean {
  const paths = Array.isArray(configPath) ? configPath : [configPath];

  return paths.some((path) => {
    // Match exact
    if (path === currentPath) return true;

    // Gérer les paramètres [id]
    if (path.includes("[") && path.includes("]")) {
      const pattern = path
        .replace(/\[[^\]]+\]/g, "([^/]+)")
        .replace(/\*\*/g, ".*")
        .replace(/\*/g, "[^/]*");

      const regex = new RegExp(`^${pattern}$`);
      return regex.test(currentPath);
    }

    // Gérer les wildcards
    if (path.includes("*")) {
      const pattern = path.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*");
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(currentPath);
    }

    return false;
  });
}

// Trouve la config la plus spécifique
function findBestRouteConfig(pathname: string): RouteConfig {
  const normalizedPath =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;

  // Chercher une correspondance exacte d'abord
  for (const config of ROUTE_CONFIG) {
    if (isExactMatch(normalizedPath, config.path)) {
      return config;
    }
  }

  // Retourner la config par défaut
  return ROUTE_CONFIG[ROUTE_CONFIG.length - 1];
}

// Génère les liens du dock flottant
function generateFloatingDockLinks(
  currentPath: string,
  routeConfig: RouteConfig,
  userRoles: OriginalUserRoles,
): NavItem[] {
  if (
    routeConfig.hideFloatingActions ||
    routeConfig.floatingActions === false
  ) {
    return [];
  }

  if (routeConfig.dockLinks?.length) {
    return routeConfig.dockLinks
      .filter((link) => {
        if (link.requireAuth && !userRoles.isAuthenticated) return false;
        return true;
      })
      .map<NavItem>((link) => ({
        href: link.href,
        label: link.label,
        icon: ICON_MAP[link.icon],
        requireAuth: link.requireAuth ?? false,
      }));
  }

  return [];
}

// Génère les actions FAB
function generateFabActions(
  routeConfig: RouteConfig,
  userRoles: OriginalUserRoles,
): FabAction[] {
  if (routeConfig.hideFloatingActions || !routeConfig.fabActions) {
    return [];
  }

  return (routeConfig.fabActions || []).filter((action) => {
    if (action.requiresAuth && !userRoles.isAuthenticated) return false;
    if (action.requiresAdmin && !userRoles.isAdmin) return false;
    if (action.requireWallet && !userRoles.hasWallet) return false;
    return true;
  }) as FabAction[];
}

// Détermine le layout
function determineLayout(
  routeConfig: RouteConfig,
  pathname: string,
): ResolvedRoute["layout"] {
  if (routeConfig.excludeLayout) {
    // Pages d'authentification
    if (pathname.includes("/sign-") || pathname.includes("/auth/")) {
      return "none";
    }
    // Maintenance
    if (pathname === "/maintenance") {
      return "none";
    }
    // Admin
    if (pathname.startsWith("/admin")) {
      return "admin";
    }
    // Dashboard
    if (pathname.includes("/dashboard")) {
      return "dashboard";
    }
    // Profil, wallet, chat
    if (
      pathname.startsWith("/profile") ||
      pathname.startsWith("/wallet") ||
      pathname.startsWith("/chat") ||
      pathname.startsWith("/messages")
    ) {
      return "none";
    }
  }

  return "public";
}

// Fonction principale de résolution
export function resolveRoute(
  pathname: string,
  userRoles: OriginalUserRoles,
): ResolvedRoute {
  const normalizedPath =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;

  // 1. Trouver la config
  const routeConfig = findBestRouteConfig(normalizedPath);

  // 2. Vérifier l'accès
  const accessCheck = canAccessRouteOriginal(normalizedPath, userRoles);

  // 3. Déterminer le layout
  const layout = determineLayout(routeConfig, normalizedPath);

  // 4. Générer les liens du dock
  const floatingDockLinks = generateFloatingDockLinks(
    normalizedPath,
    routeConfig,
    userRoles,
  );

  // 5. Générer les actions FAB
  const fabActions = generateFabActions(routeConfig, userRoles);

  // 6. Générer les breadcrumbs
  const breadcrumbs = generateBreadcrumbs(normalizedPath);

  return {
    pathname: normalizedPath,
    name: routeConfig.name,
    layout,
    requireAuth: routeConfig.requireAuth || false,
    requireAdmin: routeConfig.requireAdmin || false,
    hasAccess: accessCheck.hasAccess,
    redirectTo: accessCheck.redirectTo,
    navigationLinks: routeConfig.navigationLinks !== false,
    topMiddle: {
      enabled: routeConfig.topMiddle !== false,
      hideOnScroll: routeConfig.hideTopMiddleOnScroll || false,
      breadcrumbs,
    },
    leftBar: {
      enabled: routeConfig.leftBar !== false && layout === "public",
      requireAuth: routeConfig.requireAuth || false,
    },
    rightBar: {
      enabled: routeConfig.rightBar === true && layout === "public",
      requireAuth: routeConfig.requireAuth || false,
    },
    footer: {
      enabled: routeConfig.footer !== false && layout === "public",
    },
    floatingDock: {
      enabled:
        floatingDockLinks.length > 0 &&
        layout === "public" &&
        !routeConfig.hideFloatingActions,
      links: floatingDockLinks,
    },
    fabActions: {
      enabled:
        fabActions.length > 0 &&
        layout === "public" &&
        !routeConfig.hideFloatingActions,
      actions: fabActions,
    },
    activeFabActionId: routeConfig.activeFabActionId,
    aiAssistant: {
      enabled: routeConfig.showAIAssistant !== false && layout === "public",
    },
    styleGroup: routeConfig.styleGroup,
  };
}

function generateBreadcrumbs(
  pathname: string,
): Array<{ name: string; path: string }> {
  const normalizedPath =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;

  const parts = normalizedPath.split("/").filter((p) => p);
  const breadcrumbs = [{ name: "Accueil", path: "/" }];

  let currentPath = "";
  for (const part of parts) {
    currentPath += `/${part}`;
    const config = findBestRouteConfig(currentPath);
    if (config.name && config.name !== "Default") {
      breadcrumbs.push({
        name: config.name,
        path: currentPath,
      });
    }
  }

  return breadcrumbs;
}
