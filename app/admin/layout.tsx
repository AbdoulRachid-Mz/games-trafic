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
import { useRouter } from "next/navigation";
import { useEffect, useMemo } from "react";
import { Typography } from "@/components/ui/typography";
import { AlertCircle } from "lucide-react";

import { useUserProfile } from "@/hooks/use-profile";
import { useAdminPermissions } from "@/hooks/use-admin-permissions";
import {
  flatRoutes,
  getAdminRouteGroups,
  getAdminRoutesForLevel,
} from "@/config/admin-items";

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

  const router = useRouter();
  const { isActive } = useActiveRoute();

  const adminLevel = user?.level || "C";

  // ✅ HOOK CENTRAL
  const {
    canAccessCurrentRoute,
    hasRouteAccess,
    getAccessibleRoutes,
  } = useAdminPermissions();

  // 🔒 PROTECTION ROUTE
  useEffect(() => {
    if (!loading && user) {
      if (!user.isAdmin) {
        router.push("/");
        return;
      }

      if (!canAccessCurrentRoute) {
        router.push("/admin");
      }
    }
  }, [loading, user, canAccessCurrentRoute, router]);

  // ⏳ LOADING
  if (loading) {
    return <PageSkeleton type="dashboard" />;
  }

  // ❌ PAS ADMIN
  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <Typography variant="h3" className="mb-2">
            Accès refusé
          </Typography>
          <Typography variant="body-base" theme="muted">
            Vous n'avez pas les permissions nécessaires.
          </Typography>
        </div>
      </div>
    );
  }

  // 📦 ROUTES (via config)
  const routeGroups = getAdminRouteGroups(adminLevel);

  // 🔥 routes accessibles pour active state
  const allRoutes = useMemo(() => {
    return flatRoutes(getAccessibleRoutes());
  }, [getAccessibleRoutes]);

  const activeRoute = allRoutes.find((route) =>
    isActive(route.path, route.path === "/admin"),
  );

  const pageTitle = activeRoute?.label || "Administration";
  const pageDescription =
    activeRoute?.description || `Administration - Niveau ${adminLevel}`;

  // 🧱 SIDEBAR
  const AdminSidebar = (
    <SidebarContainer sidebarBgType="default">
      <SidebarHeader
        title="Administration"
        subtitle={`Niveau ${adminLevel}`}
        user={{
          username: user?.username || "Admin",
          level: adminLevel,
        }}
        sidebarBgType="default"
      />

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {routeGroups.map((group, index) => (
          <SidebarGroup
            key={`${group.label}-${index}`}
            label={group.label}
            sidebarBgType="gradient"
          >
            {group.routes.map((route) => (
              <div key={route.id} className="space-y-1">
                {/* Parent */}
                <SidebarItem
                  title={route.label}
                  url={route.path}
                  icon={route.icon}
                  description={route.description}
                  isActive={isActive(route.path, route.path === "/admin")}
                  sidebarBgType="gradient"
                />

                {/* Enfants */}
                {route.children?.map((child) => (
                  <SidebarItem
                    key={child.id}
                    title={`- ${child.label}`}
                    url={child.path}
                    icon={child.icon}
                    description={child.description}
                    isActive={isActive(child.path)}
                    sidebarBgType="gradient"
                  />
                ))}
              </div>
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

  // 🧭 HEADER
  const AdminHeader = (
    <DashboardHeader
      title={pageTitle}
      description={pageDescription}
      showSidebarTrigger={true}
      togglerComponent={true}
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