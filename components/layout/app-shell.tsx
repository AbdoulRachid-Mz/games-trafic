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
import { AnimatePresence } from "framer-motion";
import { useUserProfile } from "@/hooks/use-profile";
import { useAppShellStore } from "@/stores/app-shell-store";
import Loader from "@/components/loading/loader";

// Écran de blocage partagé pour les transitions d'authentification.
function LoadingScreen({ message = "Chargement..." }: { message?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Loader title={message} subtitle="Préparation de votre espace gaming" size="lg" />
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
    // Lecture client de l'URL : useSearchParams() ferait suspendre tout le
    // layout racine et viderait le static shell en Cache Components.
    const ignore = canSkipWelcome(
      typeof window !== "undefined"
        ? new URLSearchParams(window.location.search)
        : null,
    );

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
  }, [pathname, router]);

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

  // Synchronise l'état de la route dans le store global AppShell
  useEffect(() => {
    if (!resolved) return;
    const store = useAppShellStore.getState();
    if (resolved.layout === "none") {
      store.resetForNoneLayout();
    }
    store.syncRoute(resolved, userRoles);
  }, [resolved, userRoles]);

  // Synchronise le scroll global
  useEffect(() => {
    if (typeof window === "undefined") return;
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const store = useAppShellStore.getState();
      store.setScroll({
        scrollY: y,
        isScrolled: y > 10,
        scrollDirection: y > lastY ? "down" : y < lastY ? "up" : "none",
      });
      lastY = y;
    };
    const onResize = () => {
      useAppShellStore.getState().setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    onResize();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);
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
