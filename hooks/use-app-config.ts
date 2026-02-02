"use client";

import { useApp } from "@/contexts/app-context";
import { useCallback, useMemo } from "react";

/**
 * Hook pour gérer la configuration dynamique des éléments de l'application (tables, composants, etc.)
 */
export function useAppConfig() {
  const { settings, updateSettings, isSettingsLoading } = useApp();

  const getTableConfig = useCallback(
    (tableName: string) => {
      // Logique pour récupérer la config spécifique d'une table
      // Peut être stockée dans settings.metadata ou un champ dédié
      return (
        settings.tableConfig?.[tableName] || {
          pageSize: 20,
          sortBy: "createdAt",
          sortOrder: "desc",
        }
      );
    },
    [settings],
  );

  const getFeatureEnabled = useCallback(
    (featureKey: string) => {
      // Vérifie si une fonctionnalité est activée globalement
      return settings.features?.[featureKey] ?? true;
    },
    [settings],
  );

  const componentsConfig = useMemo(() => {
    return settings.components || {};
  }, [settings]);

  return {
    settings,
    isSettingsLoading,
    getTableConfig,
    getFeatureEnabled,
    componentsConfig,
    updateAppConfig: updateSettings,
  };
}
