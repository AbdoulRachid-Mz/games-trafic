// types/routes.ts
import { Bell, Home, LucideIcon, MessageSquare, Package, Palette, Settings, Shield, ShoppingBag, Store, Trophy, User, Users, Wallet } from "lucide-react";

import { IconKey } from "@/types/icons";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  requireAuth?: boolean;
  adminOnly?: boolean;
  badgeCount?: number;
}

export interface FabAction {
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

export interface ResolvedRoute {
  // Identité
  pathname: string;
  name: string;
  
  // Accès
  requireAuth: boolean;
  requireAdmin: boolean;
  hasAccess: boolean;
  redirectTo?: string;
  
  // Layout
  layout: "none" | "public" | "dashboard" | "admin";
  navigationLinks?: boolean;
  
  // Structure UI
  topMiddle: {
    enabled: boolean;
    hideOnScroll: boolean;
    breadcrumbs: Array<{ name: string; path: string }>;
  };
  breadcrumbs: boolean;
  leftBar: {
    enabled: boolean;
    requireAuth: boolean;
  };
  
  rightBar: {
    enabled: boolean;
    requireAuth: boolean;
  };
  
  footer: {
    enabled: boolean;
  };
  
  // Navigation contextuelle
  floatingDock: {
    enabled: boolean;
    links: NavItem[];
  };
  
  // Actions rapides
  fabActions: {
    enabled: boolean;
    actions: FabAction[];
  };
  activeFabActionId?: string;
  
  // Assistant IA
  aiAssistant: {
    enabled: boolean;
  };

  // Affichage
  showOnTap: boolean;
  
  // Style
  styleGroup?: string;
}

// Type pour compatibilité
export interface UserRoles {
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVip: boolean;
  userId?: string;
  hasWallet?: boolean;
}


// const ICON_MAP: Record<IconKey, LucideIcon> = {
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
//   admin: Shield,  games: Package,
//   gameClips: Trophy,
//   blogs: MessageSquare,
//   guides: MessageSquare,
//   clips: Trophy,
//   transactions: Wallet,
//   history: Trophy,
//   claims: Shield,
// };