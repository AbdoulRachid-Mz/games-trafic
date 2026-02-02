// app/admin/layout.tsx
"use client";

import type React from "react";
import {
  EnhancedDashboard,
  SidebarHeader,
  SidebarGroup,
  SidebarItem,
  SidebarFooter,
  DashboardHeader,
  SidebarContainer,
} from "@/components/dashboard/enhanced-dashboard";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { useAuthContext } from "@/contexts/auth-context";
import { useActiveRoute } from "@/hooks/use-active-route";
// import { getAdminRouteGroups, checkRouteAccess } from "@/config/admin-routes";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Typography } from "@/components/ui/typography";
import { AlertCircle } from "lucide-react";
import { checkRouteAccess, getAdminRouteGroups } from "@/config/admin-items";

import { useUserProfile } from "@/hooks/use-profile";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    user: sessionUser,
    isAuthenticated,
    loading: authLoading,
  } = useAuthContext();
  const { data: userProfile, loading: profileLoading } =
    useUserProfile(isAuthenticated);

  const user = userProfile || sessionUser;

  const loading =
    authLoading || (isAuthenticated && profileLoading && !userProfile);

  const { isActive } = useActiveRoute();
  const router = useRouter();
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    if (!loading && user) {
      if (!user.isAdmin) {
        router.push("/");
        return;
      }

      // Vérifier l'accès à la route actuelle
      const accessCheck = checkRouteAccess(pathname, user.level || "C");
      if (!accessCheck.accessible) {
        router.push("/admin");
      }
    }
  }, [loading, user, pathname, router]);

  if (loading) {
    return <PageSkeleton type="dashboard" />;
  }

  // Si l'utilisateur n'est pas admin
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <Typography variant="h3" className="mb-2">
            Accès refusé
          </Typography>
          <Typography variant="body-base" theme="muted">
            Vous n'avez pas les permissions nécessaires pour accéder à cette
            page.
          </Typography>
        </div>
      </div>
    );
  }

  // Obtenir les groupes de routes selon le niveau d'admin
  const adminLevel = user.level || "C";
  const routeGroups = getAdminRouteGroups(adminLevel);

  // Récupérer toutes les routes pour trouver l'active
  const allRoutes = routeGroups.flatMap((group) => group.routes);
  const activeRoute = allRoutes.find(
    (route) => route.path && isActive(route.path, route.path === "/admin"),
  );

  const pageTitle = activeRoute?.label || "Administration";
  const pageDescription =
    activeRoute?.description || `Administration - Niveau ${adminLevel}`;

  // Construire la sidebar
  const AdminSidebar = (
    <SidebarContainer sidebarBgType="gradient">
      <SidebarHeader
        title="Administration"
        subtitle={`Niveau ${adminLevel}`}
        user={{
          username: user?.username || "Admin",
          level: adminLevel,
        }}
        sidebarBgType="gradient"
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {routeGroups.map((group, index) => (
          <SidebarGroup
            key={`${group.label}-${index}`}
            label={group.label}
            sidebarBgType="gradient"
          >
            {group.routes.map((route) => (
              <SidebarItem
                key={route.id}
                title={route.label}
                url={route.path}
                icon={route.icon}
                description={route.description}
                isActive={isActive(route.path, route.path === "/admin")}
                sidebarBgType="gradient"
              />
            ))}
          </SidebarGroup>
        ))}
      </div>

      <SidebarFooter
        user={{
          username: user?.username || "Admin",
          profileImage: user?.profileImage || undefined,
          status: "online",
        }}
        sidebarBgType="gradient"
      />
    </SidebarContainer>
  );

  const AdminHeader = (
    <DashboardHeader
      title={pageTitle}
      description={pageDescription}
      showSidebarTrigger={true}
    />
  );

  return (
    <EnhancedDashboard
      sidebar={AdminSidebar}
      header={AdminHeader}
      sidebarBgType="gradient"
      className="min-h-screen"
    >
      {children}
    </EnhancedDashboard>
  );
}
