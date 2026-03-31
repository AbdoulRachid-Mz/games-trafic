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
      // Nettoyer le path
      const cleanPath = path.replace(/\/+$/, "").replace(/^\//, "");

      // Calculer la spécificité
      const specificity = calculateSpecificity(path);
      maxSpecificity = Math.max(maxSpecificity, specificity);

      // Créer le pattern regex
      let pattern = path
        .replace(/\/+$/, "")
        .replace(/\[([^\]]+)\]/g, "([^/]+)") // [param] -> capture group
        .replace(/\*\*/g, ".*") // ** -> n'importe quoi (y compris /)
        .replace(/\*/g, "[^/]*"); // * -> n'importe quoi sauf /

      // Échapper les caractères spéciaux
      pattern = pattern.replace(/[-\/\\^$+?.()|[\]{}]/g, (char) => {
        if (char === "/") return "\\/";
        if (char === "-") return "\\-";
        return `\\${char}`;
      });

      patterns.push(new RegExp(`^${pattern}$`));
    }

    // Calculer le score final
    // Priorité * 1000 + spécificité
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
  const cleanPath = pathname !== "/" ? pathname.replace(/\/+$/, "") : pathname;
  let best: CompiledRoute | null = null;
  let bestScore = -1;

  for (const route of routes) {
    // Vérifier si le pathname correspond à un des patterns
    let matched = false;
    for (const regex of route._patterns) {
      if (regex.test(cleanPath)) {
        matched = true;
        break;
      }
    }

    if (!matched) continue;

    // Comparer les scores
    if (route._score > bestScore) {
      bestScore = route._score;
      best = route;
    } else if (route._score === bestScore && best) {
      // En cas d'égalité, prendre le plus spécifique
      if (route._specificity > best._specificity) {
        best = route;
      }
    }
  }

  // Debug log (optionnel, à activer en développement)
  if (process.env.NODE_ENV === "development") {
    console.log("[RouteResolver] Match:", {
      pathname: cleanPath,
      matched: best?.name,
      score: bestScore,
    });
  }

  return best;
}

/**
 * Résout le layout en fonction de la configuration
 * ✅ FIX: excludeLayout = true retourne TOUJOURS "none"
 */
function resolveLayout(config: RouteConfig): "none" | "public" | "dashboard" | "admin" {
  // Si excludeLayout est true, on retourne "none" quel que soit styleGroup
  if (config.excludeLayout === true) {
    return "none";
  }

  // Sinon, on utilise styleGroup pour déterminer le layout
  if (config.styleGroup === "dashboard") {
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
function checkAccess(config: RouteConfig, user: OriginalUserRoles): { ok: boolean; redirectTo?: string; reason?: string } {
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
    return { ok: false, redirectTo: "/profile", reason: "ALREADY_AUTHENTICATED" };
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
    pathname.endsWith("/") && pathname !== "/" ? pathname.slice(0, -1) : pathname;
  const parts = normalizedPath.split("/").filter((p) => p);
  const breadcrumbs: Array<{ name: string; path: string }> = [{ name: "Accueil", path: "/" }];

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

function isInternalPath(pathname: string): boolean {
  return (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/.well-known") ||
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
      layout: "none", // ⚠️ très important
    };
  }

  const route = matchRoute(pathname, COMPILED_ROUTES);

  if (!route) {
    console.warn(`[RouteResolver] No route found for: ${pathname}`);
    return {
      ...DEFAULT_ROUTE,
      pathname,
    };
  }

  const access = checkAccess(route, userRoles);
  const layout = resolveLayout(route);
  const normalizedPath = pathname !== "/" ? pathname.replace(/\/+$/, "") : pathname;

  const floatingDockLinks = generateFloatingDockLinks(route, userRoles);
  const fabActions = generateFabActions(route, userRoles);
  const breadcrumbs = generateBreadcrumbs(normalizedPath, route);

  // Déterminer si le dock est enabled
  const dockEnabled = floatingDockLinks.length > 0 && route.floatingActions !== false;

  // Déterminer si le FAB est enabled
  const fabEnabled = fabActions.length > 0 && route.floatingActions !== false && !route.hideFloatingActions;

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

/**
 * Fonction utilitaire pour trouver la configuration d'une route
 */
export function findRouteConfig(pathname: string): RouteConfig | null {
  const route = matchRoute(pathname, COMPILED_ROUTES);
  if (!route) return null;

  // Retourner la config sans les propriétés internes
  const { _patterns, _score, _specificity, _index, ...config } = route;
  return config as RouteConfig;
}

/**
 * Vérifie si une route doit exclure le layout
 */
export function shouldExcludeLayout(pathname: string): boolean {
  const route = matchRoute(pathname, COMPILED_ROUTES);
  if (!route) return false;
  return route.excludeLayout === true;
}

/**
 * Récupère les options de layout pour une route
 */
export function getLayoutOptions(pathname: string): Omit<RouteConfig, "path" | "name" | "requireAuth" | "requireAdmin" | "description" | "styleGroup"> | null {
  const route = matchRoute(pathname, COMPILED_ROUTES);
  if (!route) return null;

  const { path, name, requireAuth, requireAdmin, description, styleGroup, ...layoutOptions } = route;
  return layoutOptions;
}

/**
 * Vérifie si l'utilisateur peut accéder à la route
 */
export function canAccessRoute(
  pathname: string,
  user: OriginalUserRoles,
): { hasAccess: boolean; redirectTo?: string; reason?: string } {
  const route = matchRoute(pathname, COMPILED_ROUTES);
  if (!route) {
    return { hasAccess: true };
  }
  const access = checkAccess(route, user);
  return { hasAccess: access.ok, redirectTo: access.redirectTo, reason: access.reason };
}

/**
 * Récupère les routes du menu
 */
export function getMenuRoutes(): RouteConfig[] {
  return ROUTE_CONFIG.filter((config) => config.menu === true).sort(
    (a, b) => (a.menuOrder || 99) - (b.menuOrder || 99)
  );
}


// import {
//   ROUTE_CONFIG,
//   findRouteConfig,
//   canAccessRoute as canAccessRouteOriginal,
//   type RouteConfig,
//   type UserRoles as OriginalUserRoles,
// } from "@/config/routes-config";
// import { ResolvedRoute, NavItem, FabAction } from "@/types/routes";
// import {
//   Home,
//   Store,
//   Trophy,
//   ShoppingBag,
//   Package,
//   Palette,
//   Wallet,
//   User,
//   Settings,
//   MessageSquare,
//   Bell,
//   Users,
//   Shield,
//   Video,
//   Gamepad2,
// } from "lucide-react";

// // Mapper les icônes
// const ICON_MAP: Record<string, any> = {
//   home: Home,
//   marketplace: Store,
//   shops: ShoppingBag,
//   products: Package,
//   tournaments: Trophy,
//   themes: Palette,
//   wallet: Wallet,
//   profile: User,
//   settings: Settings,
//   messages: MessageSquare,
//   notifications: Bell,
//   communities: Users,
//   admin: Shield,
//   games: Gamepad2,
//   gameClips: Video,
// };

// // Calcule la profondeur d'une route (nombre de segments)
// function getRouteDepth(path: string): number {
//   // Nettoyer le path
//   const cleanPath = path.replace(/\/+$/, "").replace(/^\/+/, "");
//   if (!cleanPath) return 0;

//   // Compter les segments
//   const segments = cleanPath.split("/").filter(Boolean);

//   // Les wildcards ont moins de priorité
//   let depth = segments.length;
//   if (path.includes("**")) depth -= 0.5;
//   if (path.includes("*") && !path.includes("**")) depth -= 0.3;

//   return depth;
// }

// // Vérifie si currentPath est une sous-route de configPath
// function matchesSubRoute(currentPath: string, configPath: string): boolean {
//   // Nettoyer les paths
//   const cleanCurrent = currentPath.replace(/\/+$/, "");
//   const cleanConfig = configPath.replace(/\/+$/, "");

//   // Si le config path se termine par /**, c'est une route parente
//   if (cleanConfig.endsWith("/**")) {
//     const parentPath = cleanConfig.slice(0, -3);
//     return cleanCurrent === parentPath || cleanCurrent.startsWith(parentPath + "/");
//   }

//   return false;
// }

// // Vérifie si une route correspond exactement
// function isExactMatch(
//   currentPath: string,
//   configPath: string | string[],
// ): boolean {
//   const paths = Array.isArray(configPath) ? configPath : [configPath];

//   return paths.some((path) => {
//     // Match exact
//     if (path === currentPath) return true;

//     // Gérer les paramètres [id]
//     if (path.includes("[") && path.includes("]")) {
//       const pattern = path
//         .replace(/\[[^\]]+\]/g, "([^/]+)")
//         .replace(/\*\*/g, ".*")
//         .replace(/\*/g, "[^/]*");

//       const regex = new RegExp(`^${pattern}$`);
//       return regex.test(currentPath);
//     }

//     // Gérer les wildcards et sous-routes
//     if (path.includes("*")) {
//       const pattern = path.replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*");
//       const regex = new RegExp(`^${pattern}$`);
//       return regex.test(currentPath);
//     }

//     // Vérifier si c'est une sous-route
//     if (matchesSubRoute(currentPath, path)) {
//       return true;
//     }

//     return false;
//   });
// }

// // Trouve la config la plus spécifique
// function findBestRouteConfig(pathname: string): RouteConfig {
//   const normalizedPath =
//     pathname.endsWith("/") && pathname !== "/"
//       ? pathname.slice(0, -1)
//       : pathname;

//   // Collecter toutes les routes qui correspondent
//   const matches: Array<{ config: RouteConfig; depth: number; priority: number }> = [];

//   for (const config of ROUTE_CONFIG) {
//     if (isExactMatch(normalizedPath, config.path)) {
//       const paths = Array.isArray(config.path) ? config.path : [config.path];

//       // Trouver le path le plus spécifique parmi les paths de cette config
//       let maxDepth = 0;
//       let bestPath = paths[0];

//       for (const path of paths) {
//         if (isExactMatch(normalizedPath, path)) {
//           const depth = getRouteDepth(path);
//           if (depth > maxDepth) {
//             maxDepth = depth;
//             bestPath = path;
//           }
//         }
//       }

//       // Calculer la priorité (exact match > paramètres > wildcards)
//       let priority = 0;
//       if (bestPath === normalizedPath) priority = 3; // Exact match
//       else if (bestPath.includes("[")) priority = 2; // Paramètres dynamiques
//       else if (bestPath.includes("*")) priority = 1; // Wildcards

//       matches.push({ config, depth: maxDepth, priority });
//     }
//   }

//   // Si aucune correspondance, retourner la config par défaut
//   if (matches.length === 0) {
//     return ROUTE_CONFIG[ROUTE_CONFIG.length - 1];
//   }

//   // Trier par priorité puis par profondeur (plus spécifique en premier)
//   matches.sort((a, b) => {
//     if (a.priority !== b.priority) return b.priority - a.priority;
//     return b.depth - a.depth;
//   });

//   return matches[0].config;
// }

// // Génère les liens du dock flottant
// function generateFloatingDockLinks(
//   currentPath: string,
//   routeConfig: RouteConfig,
//   userRoles: OriginalUserRoles,
// ): NavItem[] {
//   if (
//     routeConfig.hideFloatingActions ||
//     routeConfig.floatingActions === false
//   ) {
//     return [];
//   }

//   if (routeConfig.dockLinks?.length) {
//     return routeConfig.dockLinks
//       .filter((link) => {
//         if (link.requireAuth && !userRoles.isAuthenticated) return false;
//         return true;
//       })
//       .map<NavItem>((link) => ({
//         href: link.href,
//         label: link.label,
//         icon: ICON_MAP[link.icon] || Home,
//         requireAuth: link.requireAuth ?? false,
//       }));
//   }

//   return [];
// }

// // Génère les actions FAB
// function generateFabActions(
//   routeConfig: RouteConfig,
//   userRoles: OriginalUserRoles,
// ): FabAction[] {
//   if (routeConfig.hideFloatingActions || !routeConfig.fabActions) {
//     return [];
//   }

//   return (routeConfig.fabActions || []).filter((action) => {
//     if (action.requiresAuth && !userRoles.isAuthenticated) return false;
//     if (action.requiresAdmin && !userRoles.isAdmin) return false;
//     if (action.requireWallet && !userRoles.hasWallet) return false;
//     return true;
//   }) as FabAction[];
// }

// // Détermine le layout
// function determineLayout(
//   routeConfig: RouteConfig,
//   pathname: string,
// ): ResolvedRoute["layout"] {
//   if (routeConfig.excludeLayout) {
//     // Pages d'authentification
//     if (
//       pathname.includes("/sign-") ||
//       pathname.includes("/auth/") ||
//       pathname.includes("/password") ||
//       pathname.includes("/verify-email")
//     ) {
//       return "none";
//     }
//     // Maintenance
//     if (pathname === "/maintenance") {
//       return "none";
//     }
//     // Admin
//     if (pathname.startsWith("/admin")) {
//       return "admin";
//     }
//     // Dashboard
//     if (pathname.includes("/dashboard")) {
//       return "dashboard";
//     }
//     // Profil, wallet, chat
//     if (
//       pathname.startsWith("/profile") ||
//       pathname.startsWith("/wallet") ||
//       pathname.startsWith("/chats") ||
//       pathname.startsWith("/messages")
//     ) {
//       return "none";
//     }
//   }

//   return "public";
// }

// // Fonction principale de résolution
// export function resolveRoute(
//   pathname: string,
//   userRoles: OriginalUserRoles,
// ): ResolvedRoute {
//   const normalizedPath =
//     pathname.endsWith("/") && pathname !== "/"
//       ? pathname.slice(0, -1)
//       : pathname;

//   // 1. Trouver la config
//   const routeConfig = findBestRouteConfig(normalizedPath);

//   // 2. Vérifier l'accès
//   const accessCheck = canAccessRouteOriginal(normalizedPath, userRoles);

//   //3. showOnTap
//   const showOnTap =  true;

//   // 3. Déterminer le layout
//   const layout = determineLayout(routeConfig, normalizedPath);

//   // 4. Générer les liens du dock
//   const floatingDockLinks = generateFloatingDockLinks(
//     normalizedPath,
//     routeConfig,
//     userRoles,
//   );

//   // 5. Générer les actions FAB
//   const fabActions = generateFabActions(routeConfig, userRoles);

//   // 6. Générer les breadcrumbs
//   const breadcrumbs = generateBreadcrumbs(normalizedPath);

//   return {
//     pathname: normalizedPath,
//     name: routeConfig.name,
//     layout,
//     requireAuth: routeConfig.requireAuth || false,
//     requireAdmin: routeConfig.requireAdmin || false,
//     hasAccess: accessCheck.hasAccess,
//     redirectTo: accessCheck.redirectTo,
//     navigationLinks: routeConfig.navigationLinks !== false,
//     topMiddle: {
//       enabled: routeConfig.topMiddle !== false,
//       hideOnScroll: routeConfig.hideTopMiddleOnScroll || false,
//       breadcrumbs: routeConfig.breadcrumbs !== false ? breadcrumbs : [],
//     },
//     breadcrumbs: routeConfig.breadcrumbs !== false,
//     leftBar: {
//       enabled: routeConfig.leftBar !== false && layout === "public",
//       requireAuth: routeConfig.requireAuth || false,
//     },
//     rightBar: {
//       enabled: routeConfig.rightBar === true,
//       requireAuth: routeConfig.requireAuth || false,
//     },
//     footer: {
//       enabled: routeConfig.footer !== false && layout === "public",
//     },
//     floatingDock: {
//       enabled:
//         floatingDockLinks.length > 0 &&
//         layout === "public" &&
//         !routeConfig.hideFloatingActions,
//       links: floatingDockLinks,
//     },
//     fabActions: {
//       enabled:
//         fabActions.length > 0 &&
//         layout === "public" &&
//         !routeConfig.hideFloatingActions,
//       actions: fabActions,
//     },
//     activeFabActionId: routeConfig.activeFabActionId,
//     showOnTap,
//     aiAssistant: {
//       enabled: routeConfig.showAIAssistant !== false && layout === "public",
//     },
//     styleGroup: routeConfig.styleGroup,
//   };
// }

// function generateBreadcrumbs(
//   pathname: string,
// ): Array<{ name: string; path: string }> {
//   const normalizedPath =
//     pathname.endsWith("/") && pathname !== "/"
//       ? pathname.slice(0, -1)
//       : pathname;

//   const parts = normalizedPath.split("/").filter((p) => p);
//   const breadcrumbs = [{ name: "Accueil", path: "/" }];

//   let currentPath = "";
//   for (const part of parts) {
//     currentPath += `/${part}`;
//     const config = findBestRouteConfig(currentPath);
//     if (config.name && config.name !== "Default") {
//       breadcrumbs.push({
//         name: config.name,
//         path: currentPath,
//       });
//     }
//   }

//   return breadcrumbs;
// }
