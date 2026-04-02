// @/lib/routes/resolver.ts
import {
  ROUTE_CONFIG,
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
  Video,
  Gamepad2,
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
  games: Gamepad2,
  gameClips: Video,
  clips: Video,
  swords: Gamepad2,
  transactions: Wallet,
  history: Package,
  claims: Bell,
};

// Type pour les routes compilées
type CompiledRoute = RouteConfig & {
  _patterns: RegExp[];
  _score: number;
  _specificity: number; // Nombre de segments non-wildcard
  _index: number;
};

/**
 * Calcule la spécificité d'une route (plus de segments = plus spécifique)
 */
function calculateSpecificity(path: string): number {
  const cleanPath = path.replace(/\/+$/, "").replace(/^\//, "");
  if (cleanPath === "") return 0;

  const segments = cleanPath.split("/");
  let score = 0;

  for (const segment of segments) {
    if (segment === "**") {
      score += 0; // wildcard universel
    } else if (segment === "*") {
      score += 0.5; // wildcard simple
    } else if (segment.startsWith("[") && segment.endsWith("]")) {
      score += 1; // paramètre dynamique
    } else {
      score += 2; // segment statique
    }
  }

  return score;
}

/**
 * Compile les routes une fois au chargement du module
 */
function compileRoutes(configs: RouteConfig[]): CompiledRoute[] {
  return configs.map((config, index) => {
    const paths = Array.isArray(config.path) ? config.path : [config.path];
    const patterns: RegExp[] = [];
    let maxSpecificity = 0;

    for (const path of paths) {
      // Special handling for root path
      if (path === "/") {
        patterns.push(/^\/$/);
        maxSpecificity = Math.max(maxSpecificity, 0);
        continue;
      }

      const specificity = calculateSpecificity(path);
      maxSpecificity = Math.max(maxSpecificity, specificity);

      // Build regex pattern step by step
      let regexPattern = "^";

      // Split the path into segments
      const segments = path.split("/");

      for (let i = 0; i < segments.length; i++) {
        const segment = segments[i];

        if (i === 0 && segment === "") {
          // Leading slash
          regexPattern += "\\/";
          continue;
        }

        if (segment === "") continue;

        // Add slash before segment (except first)
        if (i > 0 && segments[i - 1] !== "") {
          regexPattern += "\\/";
        }

        // Handle different segment types
        if (segment === "**") {
          regexPattern += ".*";
        } else if (segment === "*") {
          regexPattern += "[^/]*";
        } else if (segment.startsWith("[") && segment.endsWith("]")) {
          // Dynamic parameter
          regexPattern += "([^/]+)";
        } else {
          // Static segment - escape special regex characters
          const escapedSegment = segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          regexPattern += escapedSegment;
        }
      }

      regexPattern += "$";

      try {
        patterns.push(new RegExp(regexPattern));
      } catch (error) {
        console.error(
          `[RouteResolver] Invalid regex pattern for path: ${path}`,
          error,
        );
      }
    }

    const score = (config.priority || 0) * 1000 + maxSpecificity;

    return {
      ...config,
      _patterns: patterns,
      _score: score,
      _specificity: maxSpecificity,
      _index: index,
    };
  });
}

/**
 * Trouve la route qui correspond le mieux au pathname
 */
function matchRoute(
  pathname: string,
  routes: CompiledRoute[],
): CompiledRoute | null {
  // Better path normalization
  let cleanPath = pathname;

  // Handle empty or undefined
  if (!cleanPath || cleanPath === "") {
    cleanPath = "/";
  }

  // Remove trailing slash except for root
  if (cleanPath !== "/") {
    cleanPath = cleanPath.replace(/\/+$/, "");
  }

  // Add leading slash if missing
  if (!cleanPath.startsWith("/")) {
    cleanPath = "/" + cleanPath;
  }

  let best: CompiledRoute | null = null;
  let bestScore = -1;

  for (const route of routes) {
    let matched = false;
    for (const regex of route._patterns) {
      if (regex.test(cleanPath)) {
        matched = true;
        break;
      }
    }

    if (!matched) continue;

    if (route._score > bestScore) {
      bestScore = route._score;
      best = route;
    } else if (route._score === bestScore && best) {
      if (route._specificity > best._specificity) {
        best = route;
      }
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log("[RouteResolver] Match:", {
      pathname: cleanPath,
      matched: best?.name,
      score: bestScore,
      patterns: best?._patterns.map((p) => p.toString()),
    });
  }

  return best;
}

/**
 * Résout le layout en fonction de la configuration
 * ✅ FIX: excludeLayout = true retourne TOUJOURS "none"
 */
function resolveLayout(
  config: RouteConfig,
): "none" | "public" | "dashboard" | "admin" {
  // Si excludeLayout est true, on retourne "none" quel que soit styleGroup
  if (config.excludeLayout === true) {
    return "none";
  }

  // Sinon, on utilise styleGroup pour déterminer le layout
  if (
    config.styleGroup === "dashboard" ||
    config.styleGroup === "chat" ||
    config.styleGroup === "wallet" ||
    config.styleGroup === "profile"
  ) {
    return "dashboard";
  }

  if (config.styleGroup === "admin") {
    return "admin";
  }

  return "public";
}

/**
 * Vérifie les droits d'accès
 */
function checkAccess(
  config: RouteConfig,
  user: OriginalUserRoles,
): { ok: boolean; redirectTo?: string; reason?: string } {
  // Admin check (priorité max)
  if (config.requireAdmin === true) {
    if (!user.isAuthenticated || !user.isAdmin) {
      return { ok: false, redirectTo: "/", reason: "ADMIN_REQUIRED" };
    }
  }

  // Auth check
  if (config.requireAuth === true && !user.isAuthenticated) {
    return { ok: false, redirectTo: "/sign-in", reason: "AUTH_REQUIRED" };
  }

  // Guest only (redirige les utilisateurs connectés)
  if (config.guestOnly === true && user.isAuthenticated) {
    return {
      ok: false,
      redirectTo: "/profile",
      reason: "ALREADY_AUTHENTICATED",
    };
  }

  return { ok: true };
}

/**
 * Génère les liens du dock flottant
 */
function generateFloatingDockLinks(
  routeConfig: RouteConfig,
  userRoles: OriginalUserRoles,
): NavItem[] {
  // Si floatingActions est explicitement false, on ne montre pas le dock
  if (routeConfig.floatingActions === false) {
    return [];
  }

  // Si dockLinks est défini, on l'utilise
  if (routeConfig.dockLinks && routeConfig.dockLinks.length > 0) {
    return routeConfig.dockLinks
      .filter((link) => {
        if (link.requireAuth && !userRoles.isAuthenticated) return false;
        return true;
      })
      .map<NavItem>((link) => ({
        href: link.href,
        label: link.label,
        icon: ICON_MAP[link.icon] || Home,
        requireAuth: link.requireAuth ?? false,
      }));
  }

  return [];
}

/**
 * Génère les actions du FAB
 */
function generateFabActions(
  routeConfig: RouteConfig,
  userRoles: OriginalUserRoles,
): FabAction[] {
  // Si floatingActions est false, pas de FAB
  if (routeConfig.floatingActions === false) {
    return [];
  }

  // Si hideFloatingActions est true, pas de FAB
  if (routeConfig.hideFloatingActions === true) {
    return [];
  }

  if (!routeConfig.fabActions || routeConfig.fabActions.length === 0) {
    return [];
  }

  return routeConfig.fabActions
    .filter((action) => {
      if (action.requiresAuth && !userRoles.isAuthenticated) return false;
      if (action.requiresAdmin && !userRoles.isAdmin) return false;
      if (action.requireWallet && !userRoles.hasWallet) return false;
      return true;
    })
    .map((action) => ({
      ...action,
      type: action.type || "button",
    })) as FabAction[];
}

/**
 * Génère le breadcrumb
 */
function generateBreadcrumbs(
  pathname: string,
  routeConfig: RouteConfig,
): Array<{ name: string; path: string }> {
  // Si breadcrumbs est false, on retourne un tableau vide
  if (routeConfig.breadcrumbs === false) {
    return [];
  }

  const normalizedPath =
    pathname.endsWith("/") && pathname !== "/"
      ? pathname.slice(0, -1)
      : pathname;
  const parts = normalizedPath.split("/").filter((p) => p);
  const breadcrumbs: Array<{ name: string; path: string }> = [
    { name: "Accueil", path: "/" },
  ];

  let currentPath = "";
  for (const part of parts) {
    currentPath += `/${part}`;
    const config = matchRoute(currentPath, COMPILED_ROUTES);
    if (config && config.name && config.name !== "Default") {
      breadcrumbs.push({
        name: config.name,
        path: currentPath,
      });
    }
  }

  return breadcrumbs;
}

// Précompilation des routes
const COMPILED_ROUTES = compileRoutes(ROUTE_CONFIG);

// Add this after COMPILED_ROUTES definition
const ROOT_ROUTE = COMPILED_ROUTES.find((r) =>
  r._patterns.some((p) => p.toString() === "/^\\/$/"),
);
if (!ROOT_ROUTE && process.env.NODE_ENV === "development") {
  console.warn("[RouteResolver] WARNING: No route found for root path '/'");
}

function isInternalPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/.well-known") ||
    pathname.startsWith("/screenshots") || // Add this
    pathname.startsWith("/uploads") || // Add this
    pathname.endsWith(".png") || // Add this
    pathname.endsWith(".jpg") || // Add this
    pathname.endsWith(".jpeg") || // Add this
    pathname.endsWith(".svg") || // Add this
    pathname.endsWith(".webp") || // Add this
    pathname === "/favicon.ico" ||
    pathname === "/sw.js" ||
    pathname === "/manifest.webmanifest"
  );
}

/**
 * Route par défaut en cas d'échec
 */
const DEFAULT_ROUTE: ResolvedRoute = {
  pathname: "",
  name: "Default",
  layout: "public",
  requireAuth: false,
  requireAdmin: false,
  hasAccess: true,
  navigationLinks: true,
  topMiddle: {
    enabled: true,
    hideOnScroll: false,
    breadcrumbs: [],
  },
  breadcrumbs: true,
  leftBar: {
    enabled: true,
    requireAuth: false,
  },
  rightBar: {
    enabled: false,
    requireAuth: false,
  },
  footer: {
    enabled: true,
  },
  floatingDock: {
    enabled: false,
    links: [],
  },
  fabActions: {
    enabled: false,
    actions: [],
  },
  aiAssistant: {
    enabled: true,
  },
  showOnTap: false,
};

/**
 * Résout une route à partir du pathname et des rôles utilisateur
 */
export function resolveRoute(
  pathname: string,
  userRoles: OriginalUserRoles,
): ResolvedRoute {
  // ✅ IGNORE NEXT INTERNALS
  if (isInternalPath(pathname)) {
    return {
      ...DEFAULT_ROUTE,
      pathname,
      layout: "none",
    };
  }

  // Normalize pathname
  let normalizedPathname = pathname;
  if (normalizedPathname !== "/") {
    normalizedPathname = normalizedPathname.replace(/\/+$/, "");
  }

  const route = matchRoute(normalizedPathname, COMPILED_ROUTES);

  // Fallback for root path if no route found
  if (!route) {
    console.warn(`[RouteResolver] No route found for: ${normalizedPathname}`);

    // Special handling for root path
    if (normalizedPathname === "/") {
      const rootRoute = COMPILED_ROUTES.find((r) =>
        r._patterns.some((p) => p.toString() === "/^\\/$/"),
      );
      if (rootRoute) {
        console.log("[RouteResolver] Using explicit root route as fallback");
        return buildResolvedRoute(rootRoute, normalizedPathname, userRoles);
      }
    }

    return {
      ...DEFAULT_ROUTE,
      pathname: normalizedPathname,
    };
  }

  return buildResolvedRoute(route, normalizedPathname, userRoles);
}

// Extract the route building logic
function buildResolvedRoute(
  route: CompiledRoute,
  pathname: string,
  userRoles: OriginalUserRoles,
): ResolvedRoute {
  const access = checkAccess(route, userRoles);
  const layout = resolveLayout(route);
  const normalizedPath =
    pathname !== "/" ? pathname.replace(/\/+$/, "") : pathname;

  const floatingDockLinks = generateFloatingDockLinks(route, userRoles);
  const fabActions = generateFabActions(route, userRoles);
  const breadcrumbs = generateBreadcrumbs(normalizedPath, route);

  const dockEnabled =
    floatingDockLinks.length > 0 && route.floatingActions !== false;
  const fabEnabled =
    fabActions.length > 0 &&
    route.floatingActions !== false &&
    !route.hideFloatingActions;

  return {
    pathname: normalizedPath,
    name: route.name,
    layout,
    requireAuth: route.requireAuth === true,
    requireAdmin: route.requireAdmin === true,
    hasAccess: access.ok,
    redirectTo: access.redirectTo,
    navigationLinks: route.navigationLinks !== false,
    topMiddle: {
      enabled: route.topMiddle !== false,
      hideOnScroll: route.hideTopMiddleOnScroll === true,
      breadcrumbs,
    },
    breadcrumbs: route.breadcrumbs !== false,
    leftBar: {
      enabled: route.leftBar !== false,
      requireAuth: route.requireAuth === true,
    },
    rightBar: {
      enabled: route.rightBar === true,
      requireAuth: route.requireAuth === true,
    },
    footer: {
      enabled: route.footer !== false,
    },
    floatingDock: {
      enabled: dockEnabled,
      links: floatingDockLinks,
    },
    fabActions: {
      enabled: fabEnabled,
      actions: fabActions,
    },
    activeFabActionId: route.activeFabActionId,
    showOnTap: route.showOnTap ?? false,
    aiAssistant: {
      enabled: route.showAIAssistant !== false,
    },
    styleGroup: route.styleGroup,
  };
}
