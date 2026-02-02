// types/routes.ts
import { LucideIcon } from "lucide-react";

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
