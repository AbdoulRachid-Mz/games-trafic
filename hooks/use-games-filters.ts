'use client';

import { useState, useEffect, useCallback } from 'react';
import { useDebounce } from './use-debounce';
import { GameItemFilters } from '@/types/api';

export function useGamesFilters() {
  const [filters, setFilters] = useState<GameItemFilters>({
    gameId: undefined,
    type: undefined,
    availability: undefined,
    isActive: true,
  });

  const [searchQuery, setSearchQuery] = useState("");

  // Debounce pour la recherche
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Mettre à jour un filtre
  const updateFilter = useCallback((key: keyof GameItemFilters, value: any) => {
    setFilters(prev => ({ 
      ...prev, 
      [key]: value === "all" || value === "" ? undefined : value 
    }));
  }, []);

  // Réinitialiser tous les filtres
  const resetFilters = useCallback(() => {
    setFilters({
      gameId: undefined,
      type: undefined,
      availability: undefined,
      isActive: true,
    });
    setSearchQuery("");
  }, []);

  // Vérifie s'il y a des filtres actifs (hors isActive)
  const hasActiveFilters = 
    (filters.gameId !== undefined) || 
    (filters.type !== undefined) || 
    (filters.availability !== undefined) ||
    (searchQuery !== "");

  return {
    filters: {
        ...filters,
        search: debouncedSearch || undefined
    },
    searchQuery,
    setSearchQuery,
    updateFilter,
    resetFilters,
    hasActiveFilters,
  };
}
