// config/admin-routes.ts
import {
  BarChart3,
  Trophy,
  Calendar,
  Users,
  MapPin,
  Swords,
  Shield,
  MessageSquare,
  Newspaper,
  Video,
  FileImage,
  Repeat,
  Award,
  Globe,
  Settings,
  UserCog,
  Database,
  Layers,
  Activity,
  Bell,
  ShoppingBag,
  CreditCard,
  Gamepad2,
  Palette,
  Tag,
  Home,
  Users2,
  Package,
  Wallet,
  Filter,
  BookOpen,
  LifeBuoy,
  AlertCircle,
} from "lucide-react";

// ============================================================================
// TYPES ET INTERFACES
// ============================================================================

export interface AdminRoute {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  requiredLevel?: 'A' | 'B' | 'C'; // Niveau d'admin requis (A = super admin, B = admin intermédiaire, C = admin basique)
  requiredPermission?: string[]; // Permissions spécifiques requises
  isSystem?: boolean; // Pour les routes système (DB, paramètres)
  isFinancial?: boolean; // Pour les routes financières
  children?: AdminRoute[];
}

// ============================================================================
// ROUTES ADMIN PAR NIVEAU
// ============================================================================

// Routes pour tous les niveaux d'admin (A, B, C)
export const commonAdminRoutes: AdminRoute[] = [
  // Vue d'ensemble
  {
    id: "overview",
    label: "Vue d'ensemble",
    path: "/admin",
    icon: BarChart3,
    description: "Tableau de bord général",
    requiredLevel: 'C',
  },

  // Utilisateurs (accessible à tous les admins)
  {
    id: "users",
    label: "Utilisateurs",
    path: "/admin/users",
    icon: Users,
    description: "Gestion des comptes utilisateurs",
    requiredLevel: 'C',
  },

  // Boutiques
  {
    id: "shops",
    label: "Boutiques",
    path: "/admin/shops",
    icon: ShoppingBag,
    description: "Gérer les boutiques et vendeurs",
    requiredLevel: 'C',
  },

  // Produits
  {
    id: "products",
    label: "Produits",
    path: "/admin/products",
    icon: Package,
    description: "Gérer les produits en vente",
    requiredLevel: 'C',
  },

  // Commandes
  {
    id: "orders",
    label: "Commandes",
    path: "/admin/orders",
    icon: ShoppingBag,
    description: "Suivi des commandes et transactions",
    requiredLevel: 'C',
  },

  // Tournois
  {
    id: "tournaments",
    label: "Tournois",
    path: "/admin/tournaments",
    icon: Trophy,
    description: "Gestion des tournois",
    requiredLevel: 'C',
    children: [
      {
        id: "tournament-editions",
        label: "Éditions",
        path: "/admin/tournaments/editions",
        icon: Calendar,
        description: "Éditions et saisons",
        requiredLevel: 'C',
      },
      {
        id: "tournament-phases",
        label: "Phases",
        path: "/admin/tournaments/phases",
        icon: Layers,
        description: "Phases et groupes",
        requiredLevel: 'C',
      },
      {
        id: "tournament-matches",
        label: "Matchs",
        path: "/admin/tournaments/matches",
        icon: Swords,
        description: "Gérer les matchs",
        requiredLevel: 'C',
      },
    ],
  },

  // Équipes
  {
    id: "teams",
    label: "Équipes",
    path: "/admin/teams",
    icon: Users2,
    description: "Gérer les équipes",
    requiredLevel: 'C',
  },

  // Contenu & Social
  {
    id: "content",
    label: "Contenu",
    path: "/admin/content",
    icon: Newspaper,
    description: "Gérer les contenus",
    requiredLevel: 'C',
    children: [
      {
        id: "posts",
        label: "Publications",
        path: "/admin/posts",
        icon: Newspaper,
        description: "Actualités et articles",
        requiredLevel: 'C',
      },
      {
        id: "blogs",
        label: "Blogs",
        path: "/admin/blogs",
        icon: BookOpen,
        description: "Articles de blog",
        requiredLevel: 'C',
      },
      {
        id: "guides",
        label: "Guides",
        path: "/admin/guides",
        icon: LifeBuoy,
        description: "Tutoriels et guides",
        requiredLevel: 'C',
      },
    ],
  },

  // Communication
  {
    id: "communication",
    label: "Communication",
    path: "/admin/communication",
    icon: MessageSquare,
    description: "Gérer la communication",
    requiredLevel: 'C',
    children: [
      {
        id: "messages",
        label: "Messages",
        path: "/admin/messages",
        icon: MessageSquare,
        description: "Messagerie et commentaires",
        requiredLevel: 'C',
      },
      {
        id: "announcements",
        label: "Annonces",
        path: "/admin/announcements",
        icon: Bell,
        description: "Annonces système",
        requiredLevel: 'C',
      },
    ],
  },

  // Interactions
  {
    id: "interactions",
    label: "Interactions",
    path: "/admin/interactions",
    icon: Activity,
    description: "Likes, vues et partages",
    requiredLevel: 'C',
  },

  // Groupes
  {
    id: "groups",
    label: "Groupes",
    path: "/admin/groups",
    icon: Users2,
    description: "Groupes communautaires",
    requiredLevel: 'C',
  },
];

// Routes pour les niveaux B et A (admins intermédiaires et supérieurs)
export const intermediateAdminRoutes: AdminRoute[] = [
  // Transactions financières
  {
    id: "transactions",
    label: "Transactions",
    path: "/admin/transactions",
    icon: CreditCard,
    description: "Transactions financières",
    requiredLevel: 'B',
    isFinancial: true,
  },

  // Portefeuilles
  {
    id: "wallets",
    label: "Portefeuilles",
    path: "/admin/wallets",
    icon: Wallet,
    description: "Gestion des portefeuilles",
    requiredLevel: 'B',
    isFinancial: true,
  },

  // VIP
  {
    id: "vip",
    label: "Abonnements VIP",
    path: "/admin/vip",
    icon: Award,
    description: "Gestion des abonnements VIP",
    requiredLevel: 'B',
  },

  // Jeux et Items
  {
    id: "games",
    label: "Jeux",
    path: "/admin/games",
    icon: Gamepad2,
    description: "Gestion des jeux",
    requiredLevel: 'B',
    children: [
      {
        id: "game-items",
        label: "Items de jeu",
        path: "/admin/games/items",
        icon: Package,
        description: "Items et coins de jeu",
        requiredLevel: 'B',
      },
      {
        id: "game-requests",
        label: "Demandes",
        path: "/admin/games/requests",
        icon: AlertCircle,
        description: "Demandes d'items",
        requiredLevel: 'B',
      },
    ],
  },

  // Thèmes
  {
    id: "themes",
    label: "Thèmes",
    path: "/admin/themes",
    icon: Palette,
    description: "Thèmes personnalisés",
    requiredLevel: 'B',
  },

  // Catégories
  {
    id: "categories",
    label: "Catégories",
    path: "/admin/categories",
    icon: Tag,
    description: "Catégories et tags",
    requiredLevel: 'B',
  },

  // Services
  {
    id: "services",
    label: "Services",
    path: "/admin/services",
    icon: LifeBuoy,
    description: "Services support",
    requiredLevel: 'B',
  },

  // Réclamations
  {
    id: "claims",
    label: "Réclamations",
    path: "/admin/claims",
    icon: AlertCircle,
    description: "Gestion des réclamations",
    requiredLevel: 'B',
  },
];

// Routes pour le niveau A uniquement (super admin)
export const superAdminRoutes: AdminRoute[] = [
  // Système
  {
    id: "system",
    label: "Système",
    path: "/admin/system",
    icon: Settings,
    description: "Administration système",
    requiredLevel: 'A',
    isSystem: true,
    children: [
      {
        id: "database",
        label: "Base de données",
        path: "/admin/system/database",
        icon: Database,
        description: "Surveillance de la DB",
        requiredLevel: 'A',
        isSystem: true,
      },
      {
        id: "settings",
        label: "Paramètres",
        path: "/admin/system/settings",
        icon: Settings,
        description: "Configuration système",
        requiredLevel: 'A',
        isSystem: true,
      },
      {
        id: "analytics",
        label: "Analytiques",
        path: "/admin/system/analytics",
        icon: BarChart3,
        description: "Analyses avancées",
        requiredLevel: 'A',
        isSystem: true,
      },
    ],
  },

  // Logs et traces
  {
    id: "logs",
    label: "Logs système",
    path: "/admin/logs",
    icon: Activity,
    description: "Journaux et traces",
    requiredLevel: 'A',
    isSystem: true,
    children: [
      {
        id: "user-traces",
        label: "Traces utilisateurs",
        path: "/admin/logs/traces",
        icon: Activity,
        description: "Traces d'activité",
        requiredLevel: 'A',
        isSystem: true,
      },
      {
        id: "search-history",
        label: "Historique recherche",
        path: "/admin/logs/search",
        icon: Filter,
        description: "Historique des recherches",
        requiredLevel: 'A',
        isSystem: true,
      },
    ],
  },

  // Administration avancée
  {
    id: "advanced",
    label: "Avancé",
    path: "/admin/advanced",
    icon: Settings,
    description: "Outils avancés",
    requiredLevel: 'A',
    isSystem: true,
  },
];

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Retourne les routes accessibles pour un niveau d'admin donné
 */
export function getAdminRoutesForLevel(level: 'A' | 'B' | 'C'): AdminRoute[] {
  let routes = [...commonAdminRoutes];
  
  if (level === 'A' || level === 'B') {
    routes = [...routes, ...intermediateAdminRoutes];
  }
  
  if (level === 'A') {
    routes = [...routes, ...superAdminRoutes];
  }
  
  return routes;
}

/**
 * Retourne une route admin par son ID.
 */
export function getAdminRouteById(id: string, level: 'A' | 'B' | 'C' = 'C'): AdminRoute | undefined {
  const routes = getAdminRoutesForLevel(level);
  
  function search(routes: AdminRoute[]): AdminRoute | undefined {
    for (const route of routes) {
      if (route.id === id) return route;
      if (route.children) {
        const found = search(route.children);
        if (found) return found;
      }
    }
  }
  return search(routes);
}

/**
 * Vérifie si une route est accessible pour un niveau donné
 */
export function isRouteAccessible(route: AdminRoute, userLevel: 'A' | 'B' | 'C'): boolean {
  if (!route.requiredLevel) return true;
  
  // Convertir les niveaux en poids
  const levelWeights = { 'A': 3, 'B': 2, 'C': 1 };
  const routeWeight = levelWeights[route.requiredLevel];
  const userWeight = levelWeights[userLevel];
  
  return userWeight >= routeWeight;
}

/**
 * Aplatit l'arbre des routes en un tableau linéaire (utile pour les menus).
 */
export function flattenAdminRoutes(routes: AdminRoute[]): AdminRoute[] {
  const flat: AdminRoute[] = [];
  function traverse(list: AdminRoute[]) {
    list.forEach((r) => {
      flat.push(r);
      if (r.children) traverse(r.children);
    });
  }
  traverse(routes);
  return flat;
}

/**
 * Groupes les routes par catégorie pour l'affichage sidebar
 */
export function getAdminRouteGroups(level: 'A' | 'B' | 'C'): Array<{
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  routes: AdminRoute[];
}> {
  const routes = getAdminRoutesForLevel(level);
  
  return [
    {
      label: "Général",
      icon: Home,
      routes: routes.filter(r => 
        ['overview', 'users', 'shops', 'products', 'orders'].includes(r.id)
      ),
    },
    {
      label: "Compétitions",
      icon: Trophy,
      routes: routes.filter(r => 
        ['tournaments', 'teams', 'tournament-editions', 'tournament-phases', 'tournament-matches'].includes(r.id)
      ),
    },
    {
      label: "Finances",
      icon: CreditCard,
      routes: routes.filter(r => r.isFinancial || 
        ['transactions', 'wallets', 'vip'].includes(r.id)
      ),
    },
    {
      label: "Contenu",
      icon: Newspaper,
      routes: routes.filter(r => 
        ['content', 'posts', 'blogs', 'guides', 'announcements', 'communication'].includes(r.id)
      ),
    },
    {
      label: "Jeux",
      icon: Gamepad2,
      routes: routes.filter(r => 
        ['games', 'game-items', 'game-requests', 'themes'].includes(r.id)
      ),
    },
    {
      label: "Communauté",
      icon: Users2,
      routes: routes.filter(r => 
        ['groups', 'interactions', 'messages', 'claims'].includes(r.id)
      ),
    },
    {
      label: "Configuration",
      icon: Settings,
      routes: routes.filter(r => 
        ['categories', 'services', 'system', 'settings', 'database', 'logs', 'advanced'].includes(r.id)
      ),
    },
  ];
}

/**
 * Vérifie l'accès à une route spécifique
 */
export function checkRouteAccess(path: string, userLevel: 'A' | 'B' | 'C'): {
  accessible: boolean;
  route?: AdminRoute;
  requiredLevel?: 'A' | 'B' | 'C';
} {
  const allRoutes = flattenAdminRoutes(getAdminRoutesForLevel('A'));
  const route = allRoutes.find(r => r.path === path);
  
  if (!route) {
    return { accessible: false };
  }
  
  const accessible = isRouteAccessible(route, userLevel);
  
  return {
    accessible,
    route,
    requiredLevel: route.requiredLevel
  };
}