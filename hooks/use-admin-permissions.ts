// hooks/use-admin-permissions.ts
import { checkRouteAccess, getAdminRoutesForLevel } from "@/config/admin-items";
import { useAuthContext } from "@/contexts/auth-context";
// import { checkRouteAccess, getAdminRoutesForLevel } from "@/config/admin-routes";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export interface AdminPermissions {
  // Permissions de base
  canViewDashboard: boolean;
  canManageUsers: boolean;
  canManageShops: boolean;
  canManageProducts: boolean;
  canManageTransactions: boolean;
  canManageTournaments: boolean;
  canManageContent: boolean;
  canManageSystem: boolean;
  
  // Permissions financières
  canViewFinancial: boolean;
  canManageWallets: boolean;
  canManageVIP: boolean;
  canAccessCurrentRoute?: boolean;
  
  // Permissions système
  canManageDatabase: boolean;
  canManageSettings: boolean;
  canViewLogs: boolean;
  
  // Vérifications spécifiques
  hasRouteAccess: (path: string) => boolean;
  getAccessibleRoutes: () => any[];
}

export function useAdminPermissions(): AdminPermissions {
  const { user } = useAuthContext();
  const pathname = usePathname();
  
  const isAdmin = user?.isAdmin || false;
  const adminLevel = user?.level || 'C';

  // Permissions selon le niveau
  const permissions = {
    // Niveau C (admin basique)
    canViewDashboard: isAdmin,
    canManageUsers: isAdmin && ['A', 'B', 'C'].includes(adminLevel),
    canManageShops: isAdmin && ['A', 'B', 'C'].includes(adminLevel),
    canManageProducts: isAdmin && ['A', 'B', 'C'].includes(adminLevel),
    canManageTournaments: isAdmin && ['A', 'B', 'C'].includes(adminLevel),
    canManageContent: isAdmin && ['A', 'B', 'C'].includes(adminLevel),
    
    // Niveau B (admin intermédiaire)
    canManageTransactions: isAdmin && ['A', 'B'].includes(adminLevel),
    canManageWallets: isAdmin && ['A', 'B'].includes(adminLevel),
    canManageVIP: isAdmin && ['A', 'B'].includes(adminLevel),
    canViewFinancial: isAdmin && ['A', 'B'].includes(adminLevel),
    
    // Niveau A (super admin)
    canManageSystem: isAdmin && adminLevel === 'A',
    canManageDatabase: isAdmin && adminLevel === 'A',
    canManageSettings: isAdmin && adminLevel === 'A',
    canViewLogs: isAdmin && adminLevel === 'A',
  };

  // Vérifier l'accès à une route spécifique
  const hasRouteAccess = (path: string): boolean => {
    if (!isAdmin) return false;
    const accessCheck = checkRouteAccess(path, adminLevel);
    return accessCheck.accessible;
  };

  // Obtenir les routes accessibles
  const getAccessibleRoutes = () => {
    if (!isAdmin) return [];
    return getAdminRoutesForLevel(adminLevel);
  };

  // Vérifier l'accès à la route actuelle
  const canAccessCurrentRoute = hasRouteAccess(pathname);

  return {
    ...permissions,
    hasRouteAccess,
    getAccessibleRoutes,
    // // Ajouter la vérification de la route actuelle
    canAccessCurrentRoute,
  };
}

// Hook pour protéger les composants
export function useProtectedRoute(requiredLevel: 'A' | 'B' | 'C' = 'C') {
  const { user } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user?.isAdmin) {
      router.push('/login');
      return;
    }

    const userLevel = user.level || 'C';
    const levelWeights = { 'A': 3, 'B': 2, 'C': 1 };
    const requiredWeight = levelWeights[requiredLevel];
    const userWeight = levelWeights[userLevel];

    if (userWeight < requiredWeight) {
      router.push('/admin');
    }
  }, [user, requiredLevel, router, pathname]);

  return {
    hasAccess: user?.isAdmin && 
      (user.level === 'A' || 
       (user.level === 'B' && requiredLevel !== 'A') || 
       (user.level === 'C' && requiredLevel === 'C')),
    userLevel: user?.level,
  };
}