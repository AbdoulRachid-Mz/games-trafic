"use client";

import type React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useEffect, useState, useCallback } from "react";
import { MainLayout } from "./main-layout";
import { useApp } from "@/contexts/app-context";
import { useAuthContext } from "@/contexts/auth-context";
import { AnnouncementDialog } from "@/components/announcements/announcement-dialog";
import { MaintenanceBanner } from "@/components/maintenance/maintenance-banner";
import { resolveRoute } from "@/lib/routes/resolver";
import type { UserRoles, ResolvedRoute } from "@/types/routes";
import { motion, AnimatePresence } from "framer-motion";
import { useUserProfile } from "@/hooks/use-profile";
import { useSearchParams } from "next/navigation";
import OnTapPopup from "../auth/on-tap-popup";
import Image from "next/image";

// Loading Screen Premium
function LoadingScreen({ message = "Chargement..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="text-center space-y-8">
        <div className="relative">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1]
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" }
            }}
            className="w-24 h-24 mx-auto mb-6 relative"
          >
            <div className="absolute inset-0 rounded-full border-4 border-primary/10"></div>
            <div className="absolute inset-4 rounded-full border-4 border-primary border-t-transparent"></div>
            <div className="absolute inset-8 rounded-full border-4 border-primary/30 border-b-transparent"></div>

            {/* Logo in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center">
                {/* <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg> */}
                <Image
                  src="/icons/icon-72.png"
                  alt="Logo"
                  width={50}
                  height={50}
                />
              </div>
            </div>
          </motion.div>
        </div>
        <div className="space-y-3">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
          >
            {message}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground max-w-sm mx-auto"
          >
            Préparation de votre expérience gaming
          </motion.p>
        </div>

        {/* Progress dots */}
        <motion.div
          className="flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary/30"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 1, 0.3]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const {
    user,
    loading: authLoading,
    isAuthenticated,
    isAdmin,
    isVip,
    refreshUser,
  } = useAuthContext();
  const { data: profile } = useUserProfile({ mode: "partial", relations: ["wallet"] });

  const {
    settings,
    unreadAnnouncements,
    showAnnouncements,
    toggleAnnouncements,
    maintenanceMode,
    maintenanceMessage,
  } = useApp();

  const [isInitialized, setIsInitialized] = useState(false);
  const [welcomeChecked, setWelcomeChecked] = useState(false);
  const [initialPath] = useState(pathname);
  const searchParams = useSearchParams();

  // Handle welcome redirect
  useEffect(() => {
    const isWelcomePath = pathname === "/welcome";
    const ignore = searchParams?.get("ignore_visite") === "true";

    if (ignore) {
      setWelcomeChecked(true);
      return;
    }

    const hasVisited = typeof window !== "undefined" ? localStorage.getItem("gt_welcome_visited") : null;

    if (!hasVisited && !isWelcomePath) {
      router.replace("/welcome");
    } else {
      setWelcomeChecked(true);
    }
  }, [pathname, router, searchParams]);

  // Calculate user roles
  const userRoles: UserRoles = useMemo(
    () => ({
      isAuthenticated,
      isAdmin,
      isVip,
      userId: user?.id,
      hasWallet: !!profile?.wallet?.id || (user as any)?.hasWallet || false,
    }),
    [isAuthenticated, isAdmin, isVip, user?.id, profile?.wallet?.id]
  );

  // Resolve route
  const resolved = useMemo<ResolvedRoute | null>(() => {
    if (!isInitialized) return null;
    return resolveRoute(pathname, userRoles);
  }, [pathname, userRoles, isInitialized]);

  // Initialize app
  useEffect(() => {
    const init = async () => {
      try {
        // Refresh user data on load
        await refreshUser();
      } catch (error) {
        console.error("Error initializing app:", error);
      } finally {
        setIsInitialized(true);
      }
    };

    init();
  }, [refreshUser]);

  // Handle announcements
  useEffect(() => {
    if (
      isInitialized &&
      !authLoading &&
      settings.showAnnouncementsOnStartup &&
      unreadAnnouncements.length > 0 &&
      !showAnnouncements &&
      isAuthenticated
    ) {
      const timer = setTimeout(() => {
        toggleAnnouncements();
      }, 1500); // Small delay for better UX

      return () => clearTimeout(timer);
    }
  }, [
    isInitialized,
    authLoading,
    settings.showAnnouncementsOnStartup,
    unreadAnnouncements.length,
    showAnnouncements,
    toggleAnnouncements,
    isAuthenticated,
  ]);

  // Handle maintenance mode
  useEffect(() => {
    if (maintenanceMode && !isAdmin && isInitialized) {
      const isPublicRoute =
        resolved && !resolved.requireAuth && !resolved.requireAdmin;

      if (!isPublicRoute && pathname !== "/maintenance") {
        router.push("/maintenance");
      }
    }
  }, [maintenanceMode, isAdmin, isInitialized, resolved, pathname, router]);


  // Show loading during initialization
  if (!isInitialized || !welcomeChecked) {
    return <LoadingScreen message="Initialisation..." />;
  }

  // Show loading during auth check for protected routes
  if (authLoading && resolved?.requireAuth) {
    return <LoadingScreen message="Vérification..." />;
  }

  // Sécurité (si le proxy n'a pas redirigé pour une raison X ou Y)
  if (resolved && !resolved.hasAccess) {
    return null;
  }

  // Special layout routes
  if (resolved?.layout === "none") {
    return (
      <>
        {maintenanceMode && (
          <MaintenanceBanner message={maintenanceMessage} isAdmin={isAdmin} />
        )}

        {showAnnouncements && unreadAnnouncements.length > 0 && (
          <AnnouncementDialog
            announcements={unreadAnnouncements.slice(
              0,
              settings.maxAnnouncementsToShow,
            )}
            onClose={() => {
              toggleAnnouncements();
            }}
          />
        )}

        {children}
      </>
    );
  }


  // Normal layout
  return (
    <>
      <AnimatePresence mode="wait">
        {maintenanceMode && (
          <MaintenanceBanner key="maintenance" message={maintenanceMessage} isAdmin={isAdmin} />
        )}

        {showAnnouncements && unreadAnnouncements.length > 0 && (
          <AnnouncementDialog
            key="announcements"
            announcements={unreadAnnouncements.slice(
              0,
              settings.maxAnnouncementsToShow,
            )}
            onClose={() => {
              toggleAnnouncements();
            }}
          />
        )}
      </AnimatePresence>

      <MainLayout
        breadcrumbs={resolved?.topMiddle?.enabled ?? true}
        footer={resolved?.footer?.enabled ?? true}
        topMiddle={resolved?.topMiddle?.enabled ?? true}
        leftBar={resolved?.leftBar?.enabled ?? true}
        rightBar={resolved?.rightBar?.enabled ?? false}
        navigationLinks={resolved?.navigationLinks}
        floatingActions={resolved?.fabActions?.actions || []}
        floatingActiveActionId={resolved?.activeFabActionId as string}
        maintenanceMode={maintenanceMode}
        showAIAssistant={resolved?.aiAssistant?.enabled}
        hideTopMiddleOnScroll={resolved?.topMiddle?.hideOnScroll}
        breadcrumbItems={resolved?.topMiddle?.breadcrumbs || []}
        floatingDockLinks={resolved?.floatingDock?.links || []}
        shouldExcludeContainer={(resolved as ResolvedRoute | null)?.layout === "none"}
        showOnTap={resolved?.showOnTap}
      >
        {children}
      </MainLayout>
    </>
  );
}
