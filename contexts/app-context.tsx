// contexts/app-context.tsx
"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { toast } from "sonner";
import { useUserProfile } from "@/hooks/use-profile";
import {
  AppSettings,
  AppSettingsUpdate,
  DEFAULT_APP_SETTINGS,
  DEFAULT_PERMISSIONS,
  DEFAULT_ROUTE_ACCESS,
  sanitizeAppSettings,
} from "@/config/app-config";
import {
  getAppSettings,
  updateAppSettings as updateAppSettingsAction,
  setMaintenanceMode as setMaintenanceModeAction,
  updateExchangeRates as updateExchangeRatesAction,
} from "@/actions/app-settings";
import { markAnnouncementAsRead as markAnnouncementAsReadAction } from "@/actions/announcements";
import { useTracingContext } from "./tracing-context";
import { useAuthContext } from "./auth-context";
import { User } from "@/database/schema";

interface AppProviderProps {
  children: ReactNode;
}

// Interface pour les annonces simplifiée
export interface SimpleAnnouncement {
  id: string;
  title: string;
  content: string;
  type: string;
  images: string[];
  video?: string;
  isPinned: boolean;
  isActive: boolean;
  createdAt: string;
}

interface AppContextType {
  settings: AppSettings;
  isSettingsLoading: boolean;
  announcements: SimpleAnnouncement[];
  unreadAnnouncements: SimpleAnnouncement[];
  maintenanceMode: boolean;
  maintenanceMessage: string;
  showAnnouncements: boolean;
  isLoading: boolean;
  refreshData: () => Promise<void>;
  updateSettings: (updates: AppSettingsUpdate) => Promise<AppSettings>;
  setMaintenanceMode: (enabled: boolean, message?: string) => Promise<void>;
  toggleAnnouncements: () => void;
  markAllAnnouncementsRead: () => Promise<void>;
  markAnnouncementRead: (id: string) => Promise<void>;
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVip: boolean;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: AppProviderProps) {
  const { user, isAuthenticated, isAdmin, isVip } = useAuthContext();

  // Utiliser le mode minimal pour l'initialisation de l'application
  const { data: userProfile } = useUserProfile({
    enabled: isAuthenticated,
    mode: "minimal",
    relations: ["announcements"], // On n'a besoin que des annonces ici
  });
  const authAnnouncements = userProfile?.announcements;

  const { trackAction } = useTracingContext();

  // Configuration de base
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_APP_SETTINGS);
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  // Données
  const [announcements, setAnnouncements] = useState<SimpleAnnouncement[]>([]);
  const [unreadAnnouncements, setUnreadAnnouncements] = useState<
    SimpleAnnouncement[]
  >([]);

  // Maintenance
  const [maintenanceMode, setMaintenanceModeState] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");

  // UI State
  const [showAnnouncements, setShowAnnouncements] = useState(false);

  const isLoading = isSettingsLoading;

  // Chargement initial des settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setIsSettingsLoading(true);
        const dbSettings = await getAppSettings();

        if (dbSettings) {
          const sanitizedSettings = sanitizeAppSettings(dbSettings);
          setSettings(sanitizedSettings);
          setMaintenanceModeState(sanitizedSettings.maintenanceMode);

          if (sanitizedSettings.maintenanceMode) {
            setMaintenanceMessage(
              "Le système est actuellement en maintenance. Veuillez réessayer plus tard.",
            );
          }
        }
      } catch (error) {
        console.error("Error loading app settings:", error);
        toast.error("Erreur lors du chargement de la configuration");
      } finally {
        setIsSettingsLoading(false);
      }
    };

    loadSettings();
  }, []);

  // Synchronisation des annonces depuis le profile context
  useEffect(() => {
    if (authAnnouncements?.all) {
      const activeAnnouncements = authAnnouncements.all
        .filter((ann: any) => ann.isActive && !ann.isDeleted)
        .map((ann: any) => ({
          id: ann.id,
          title: ann.title,
          content: ann.content,
          type: ann.type,
          images: ann.images || [],
          video: ann.video,
          isPinned: ann.isPinned,
          isActive: ann.isActive,
          createdAt: ann.createdAt,
        }))
        .sort(
          (a: any, b: any) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );

      setAnnouncements(activeAnnouncements);

      const userReadAnnouncements = authAnnouncements.read || [];
      const unread = activeAnnouncements.filter(
        (ann: any) =>
          !userReadAnnouncements.some((read: any) => read.id === ann.id),
      );
      setUnreadAnnouncements(unread);

      if (
        settings.showAnnouncementsOnStartup &&
        unread.length > 0 &&
        !showAnnouncements &&
        isAuthenticated
      ) {
        setShowAnnouncements(true);
      }
    }
  }, [
    authAnnouncements,
    settings.showAnnouncementsOnStartup,
    showAnnouncements,
    isAuthenticated,
  ]);

  // Actions
  const refreshData = useCallback(async () => {
    try {
      const dbSettings = await getAppSettings();
      if (dbSettings) {
        const sanitizedSettings = sanitizeAppSettings(dbSettings);
        setSettings(sanitizedSettings);
        setMaintenanceModeState(sanitizedSettings.maintenanceMode);
      }
    } catch (error) {
      console.error("Error refreshing app data:", error);
    }
  }, []);

  const updateSettings = useCallback(
    async (updates: AppSettingsUpdate): Promise<AppSettings> => {
      try {
        const cleanUpdates: Record<string, any> = {};
        Object.entries(updates).forEach(([key, value]) => {
          if (value !== undefined) {
            cleanUpdates[key] = value;
          }
        });

        const updated = await updateAppSettingsAction(cleanUpdates);
        const sanitizedSettings = sanitizeAppSettings(updated);

        setSettings(sanitizedSettings);
        setMaintenanceModeState(sanitizedSettings.maintenanceMode);

        toast.success("Paramètres mis à jour avec succès");
        trackAction("UPDATE_SETTINGS", Object.keys(updates).join(","));

        return sanitizedSettings;
      } catch (error) {
        console.error("Error updating settings:", error);
        toast.error("Erreur lors de la mise à jour des paramètres");
        throw error;
      }
    },
    [trackAction],
  );

  const setMaintenanceMode = useCallback(
    async (enabled: boolean, message?: string) => {
      try {
        const updated = await setMaintenanceModeAction(enabled);
        const sanitizedSettings = sanitizeAppSettings(updated);

        setSettings(sanitizedSettings);
        setMaintenanceModeState(enabled);
        setMaintenanceMessage(
          message ||
            "Le système est actuellement en maintenance. Veuillez réessayer plus tard.",
        );

        if (enabled) {
          toast.warning("Mode maintenance activé");
        } else {
          toast.success("Mode maintenance désactivé");
        }
      } catch (error) {
        console.error("Error setting maintenance mode:", error);
        toast.error("Erreur lors de la modification du mode maintenance");
        throw error;
      }
    },
    [trackAction],
  );

  const toggleAnnouncements = useCallback(() => {
    setShowAnnouncements((prev) => !prev);
  }, []);

  const markAnnouncementRead = useCallback(
    async (announcementId: string) => {
      if (!user) return;

      try {
        await markAnnouncementAsReadAction(user.id, announcementId);

        setUnreadAnnouncements((prev) =>
          prev.filter((ann) => ann.id !== announcementId),
        );

        trackAction("MARK_ANNOUNCEMENT_READ", announcementId);
      } catch (error) {
        console.error("Error marking announcement as read:", error);
        toast.error("Erreur lors du marquage de l'annonce");
      }
    },
    [user, trackAction],
  );

  const markAllAnnouncementsRead = useCallback(async () => {
    if (!user) return;

    try {
      for (const announcement of unreadAnnouncements) {
        await markAnnouncementAsReadAction(user.id, announcement.id);
      }

      setUnreadAnnouncements([]);
      toast.success("Toutes les annonces marquées comme lues");
      trackAction("MARK_ALL_ANNOUNCEMENTS_READ");
    } catch (error) {
      console.error("Error marking all announcements as read:", error);
      toast.error("Erreur lors du marquage des annonces");
    }
  }, [user, unreadAnnouncements, trackAction]);

  const contextValue = useMemo(
    () => ({
      settings,
      isSettingsLoading,
      announcements,
      unreadAnnouncements,
      maintenanceMode,
      maintenanceMessage,
      showAnnouncements,
      isLoading,
      refreshData,
      updateSettings,
      setMaintenanceMode,
      toggleAnnouncements,
      markAllAnnouncementsRead,
      markAnnouncementRead,
      user,
      isAuthenticated,
      isAdmin,
      isVip,
    }),
    [
      settings,
      isSettingsLoading,
      announcements,
      unreadAnnouncements,
      maintenanceMode,
      maintenanceMessage,
      showAnnouncements,
      isLoading,
      refreshData,
      updateSettings,
      setMaintenanceMode,
      toggleAnnouncements,
      markAllAnnouncementsRead,
      markAnnouncementRead,
      user,
      isAuthenticated,
      isAdmin,
      isVip,
    ],
  );

  return (
    <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

// Hooks spécialisés
export function useAppSettings() {
  const { settings, updateSettings, setMaintenanceMode, isLoading } = useApp();
  return {
    settings,
    updateSettings,
    setMaintenanceMode,
    isLoading,
  };
}

export function useAppAnnouncements() {
  const {
    announcements,
    unreadAnnouncements,
    markAnnouncementRead,
    markAllAnnouncementsRead,
    showAnnouncements,
    toggleAnnouncements,
  } = useApp();

  return {
    announcements,
    unreadAnnouncements,
    markAnnouncementRead,
    markAllAnnouncementsRead,
    showAnnouncements,
    toggleAnnouncements,
  };
}

export function useAppMaintenance() {
  const { maintenanceMode, maintenanceMessage, setMaintenanceMode } = useApp();
  return { maintenanceMode, maintenanceMessage, setMaintenanceMode };
}
