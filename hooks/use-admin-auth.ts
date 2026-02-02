// hooks/use-admin-auth.ts
import { useAuthContext } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function useAdminAuth(requiredRole?: string) {
  const { user, loading, hasRole, isAdmin, isAuthenticated } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      // Vérifier si l'utilisateur est connecté
      if (!isAuthenticated) {
        router.push("/sign-in");
        return;
      }

      // Vérifier si c'est un admin
      if (!isAdmin) {
        router.push("/unauthorized");
        return;
      }

      // Vérifier les rôles spécifiques si nécessaire
      if (requiredRole && !hasRole(requiredRole)) {
        router.push("/unauthorized");
        return;
      }
    }
  }, [loading, isAuthenticated, isAdmin, hasRole, requiredRole, router]);

  return {
    user,
    loading,
    hasRole,
    isAdmin,
    canManageCompetitions: isAdmin || hasRole("editor"),
    canManageFighters: isAdmin || hasRole("fighter_manager"),
    canManageUsers: isAdmin,
  };
}
