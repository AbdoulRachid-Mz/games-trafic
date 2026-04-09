import {
  checkRouteAccess,
  flatRoutes,
  getAdminRouteGroups,
  getAdminRoutesForLevel,
} from "@/config/admin-items";

import { useAuthContext } from "@/contexts/auth-context";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";

export interface AdminPermissions {
  isAdmin: boolean;
  adminLevel: "A" | "B" | "C";

  // Accès global
  canAccessCurrentRoute: boolean;

  // Helpers
  hasRouteAccess: (path: string) => boolean;
  routes: any[];
  flatRoutes: any[];
  getAccessibleRoutes: () => any[];
}

export function useAdminPermissions(): AdminPermissions {
  const { user } = useAuthContext();
  const pathname = usePathname();

  const isAdmin = user?.isAdmin || false;
  const adminLevel = (user?.level || "C") as "A" | "B" | "C";

  // 📦 Routes accessibles (source unique)
  const routes = useMemo(() => {
    if (!isAdmin) return [];
    return getAdminRoutesForLevel(adminLevel);
  }, [isAdmin, adminLevel]);

  // 🔥 Flat routes (important pour active / access)
  const allFlatRoutes = useMemo(() => {
    return flatRoutes(routes);
  }, [routes]);

  // 🔒 Vérifier accès route spécifique
  const hasRouteAccess = (path: string): boolean => {
    if (!isAdmin) return false;
    return checkRouteAccess(path, adminLevel).accessible;
  };

  // 🔒 Route actuelle
  const canAccessCurrentRoute = useMemo(() => {
    if (!isAdmin) return false;
    return hasRouteAccess(pathname);
  }, [pathname, isAdmin, adminLevel]);

  const accessibleRoutes = useMemo(() => {
    if (!isAdmin) return [];
    return getAdminRoutesForLevel(adminLevel);
  }, [isAdmin, adminLevel]);
  const getAccessibleRoutes = () => accessibleRoutes;

  return {
    isAdmin,
    adminLevel,
    canAccessCurrentRoute,
    getAccessibleRoutes,
    hasRouteAccess,
    routes,
    flatRoutes: allFlatRoutes,
  };
}

export function useProtectedRoute() {
  const { user } = useAuthContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!user?.isAdmin) {
      router.push("/");
      return;
    }

    const level = user.level || "C";
    const access = checkRouteAccess(pathname, level);

    if (!access.accessible) {
      router.push("/admin");
    }
  }, [user, pathname, router]);

  return {
    isAdmin: user?.isAdmin,
    level: user?.level,
  };
}
