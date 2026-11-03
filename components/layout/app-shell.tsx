"use client";

import type React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useEffect, useState } from "react";
import { MainLayout } from "./main-layout";
import { useApp } from "@/contexts/app-context";
import { useAuthContext } from "@/contexts/auth-context";
import { AnnouncementDialog } from "@/components/announcements/announcement-dialog";
import { MaintenanceBanner } from "@/components/maintenance/maintenance-banner";
import { resolveRoute } from "@/lib/routes/resolver";
import { canSkipWelcome } from "@/lib/routes/safe-redirect";
import type { UserRoles, ResolvedRoute } from "@/types/routes";
import { motion, AnimatePresence } from "framer-motion";
import { useUserProfile } from "@/hooks/use-profile";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { PulseLoading } from "../loading-ui/pulse-loader";

// Loading Screen Premium pour les transitions nécessitant un blocage
function LoadingScreen({ message = "Chargement..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="text-center space-y-8">
        <div className="relative">
          <motion.div
            animate={{
              rotate: 360,
              scale: [1, 1.1, 1],
            }}
            transition={{
              rotate: { duration: 2, repeat: Infinity, ease: "linear" },
              scale: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
            }}
            className="w-24 h-24 mx-auto mb-6 relative"
          >
            <div className="absolute inset-0 rounded-full border-4 border-primary/10"></div>
            <div className="absolute inset-4 rounded-full border-4 border-primary border-t-transparent"></div>
            <div className="absolute inset-8 rounded-full border-4 border-primary/30 border-b-transparent"></div>

            {/* Logo in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center">
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
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
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
  const searchParams = useSearchParams();

  const {
    user,
    loading: authLoading,
    isAuthenticated,
    isAdmin,
    isVip,
  } = useAuthContext();

  // Mode partiel pour le profil uniquement si authentifié (évite requête 401 si non connecté)
  const { data: profile } = useUserProfile({
    enabled: isAuthenticated,
    mode: "partial",
    relations: ["wallet"],
  });

  const {
    settings,
    unreadAnnouncements,
    showAnnouncements,
    toggleAnnouncements,
    maintenanceMode,
    maintenanceMessage,
  } = useApp();

  // Optimisation démarrage : welcomeChecked initialisé immédiatement si déjà visité
  const [welcomeChecked, setWelcomeChecked] = useState(() => {
    if (typeof window === "undefined") return true;
    return !!localStorage.getItem("gt_welcome_visited") || pathname === "/welcome";
  });

  // Gestion de la première visite (non-bloquante pour le premier rendu des composants)
  useEffect(() => {
    const isWelcomePath = pathname === "/welcome";
    const ignore = canSkipWelcome(searchParams);

    if (ignore) {
      setWelcomeChecked(true);
      return;
    }

    const hasVisited =
      typeof window !== "undefined"
        ? localStorage.getItem("gt_welcome_visited")
        : null;

    if (!hasVisited && !isWelcomePath) {
      router.replace("/welcome");
    } else {
      setWelcomeChecked(true);
    }
  }, [pathname, router, searchParams]);

  // Calcul réactif des rôles
  const userRoles: UserRoles = useMemo(
    () => ({
      isAuthenticated,
      isAdmin,
      isVip,
      userId: user?.id,
      hasWallet: !!profile?.wallet?.id || !!(profile as any)?.hasWallet || (user as any)?.hasWallet || false,
    }),
    [isAuthenticated, isAdmin, isVip, user?.id, profile?.wallet?.id, (profile as any)?.hasWallet],
  );

  // Résolution synchrone de la route
  const resolved = useMemo<ResolvedRoute>(() => {
    return resolveRoute(pathname, userRoles);
  }, [pathname, userRoles]);

  // Gestion des annonces (différée et non-bloquante)
  useEffect(() => {
    if (
      !authLoading &&
      settings?.showAnnouncementsOnStartup &&
      unreadAnnouncements?.length > 0 &&
      !showAnnouncements &&
      isAuthenticated
    ) {
      const timer = setTimeout(() => {
        toggleAnnouncements();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [
    authLoading,
    settings?.showAnnouncementsOnStartup,
    unreadAnnouncements?.length,
    showAnnouncements,
    toggleAnnouncements,
    isAuthenticated,
  ]);

  // Mode maintenance pour les routes nécessitant une restriction
  useEffect(() => {
    if (maintenanceMode && !isAdmin) {
      const isPublicRoute = resolved
        ? !resolved.requireAuth && !resolved.requireAdmin
        : false;

      if (!isPublicRoute && pathname !== "/maintenance") {
        router.push("/maintenance");
      }
    }
  }, [maintenanceMode, isAdmin, resolved, pathname, router]);

  // 1. Pour les routes protégées nécessitant l'authentification : afficher le loader si auth en cours
  if (resolved?.requireAuth && authLoading) {
    return <LoadingScreen message="Vérification de la session..." />;
  }

  // 2. Si l'accès est refusé sur une route protégée (géré par middleware, fallback client)
  if (resolved && !resolved.hasAccess) {
    return <LoadingScreen message="Redirection en cours..." />;
  }

  // 3. Routes avec layout "none" (ex: auth, on-tap, splash)
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

  // 4. Rendu de l'interface principale (MainLayout) — immédiat sans blocage sur les routes publiques
  return (
    <>
      <AnimatePresence mode="wait">
        {maintenanceMode && (
          <MaintenanceBanner
            key="maintenance"
            message={maintenanceMessage}
            isAdmin={isAdmin}
          />
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
        breadcrumbs={resolved?.topMiddle.enabled}
        footer={resolved?.footer.enabled}
        topMiddle={resolved?.topMiddle.enabled}
        leftBar={resolved?.leftBar.enabled}
        rightBar={resolved?.rightBar.enabled}
        navigationLinks={resolved?.navigationLinks}
        floatingActions={resolved?.fabActions?.actions || []}
        floatingActiveActionId={resolved?.activeFabActionId as string}
        maintenanceMode={maintenanceMode}
        showAIAssistant={resolved?.aiAssistant?.enabled}
        hideTopMiddleOnScroll={resolved?.topMiddle?.hideOnScroll}
        breadcrumbItems={resolved?.topMiddle?.breadcrumbs || []}
        floatingDockLinks={resolved?.floatingDock?.links || []}
        shouldExcludeContainer={false}
        showOnTap={resolved?.showOnTap}
      >
        {children}
      </MainLayout>
    </>
  );
}
