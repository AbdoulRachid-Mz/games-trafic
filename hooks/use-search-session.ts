// hooks/use-search-session.ts
import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { createSearchHistory } from '@/actions/histories';

interface SessionHistoryItem {
  id: string;
  query: string;
  timestamp: number;
}

export function useSearchSession() {
  const { user, isAuthenticated } = useAuthContext();
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryItem[]>([]);
  
  // Clé de stockage basée sur l'utilisateur
  const storageKey = user?.id 
    ? `search_session_${user.id}`
    : 'search_session_anonymous';

  // Charger l'historique de session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Trier par timestamp décroissant
        parsed.sort((a: SessionHistoryItem, b: SessionHistoryItem) => 
          b.timestamp - a.timestamp
        );
        setSessionHistory(parsed.slice(0, 50)); // Limiter à 50 entrées
      }
    } catch (error) {
      console.error('Error loading search session:', error);
    }
  }, [storageKey]);

  // Ajouter à la session
  const addToSession = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const cleanQuery = query.trim().toLowerCase();
    const newItem: SessionHistoryItem = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query: cleanQuery,
      timestamp: Date.now()
    };

    setSessionHistory(prev => {
      // Filtrer les doublons récents
      const filtered = prev.filter(item => 
        item.query !== cleanQuery && 
        Date.now() - item.timestamp < 5 * 60 * 1000 // 5 minutes
      );
      
      // Limiter à 50 entrées
      const updated = [newItem, ...filtered].slice(0, 50);
      
      // Sauvegarder
      localStorage.setItem(storageKey, JSON.stringify(updated));
      
      return updated;
    });
  }, [storageKey]);

  // Synchroniser avec le serveur
  const syncToServer = useCallback(async () => {
    if (!isAuthenticated || !user || sessionHistory.length === 0) return;
    
    try {
      // Prendre les 5 recherches les plus récentes non synchronisées
      const batch = sessionHistory.slice(0, 5);
      
      for (const item of batch) {
        try {
          await createSearchHistory({
            id: crypto.randomUUID(), // Générer un UUID côté client pour éviter les conflits
            userId: user.id,
            query: item.query
          });
        } catch (error) {
          // Si erreur de duplicate key, ignorer et continuer
          if (error instanceof Error && 'code' in error && (error as any).code === '23505') {
            console.log('Duplicate search, skipping...');
            continue;
          }
          throw error;
        }
      }
      
      // Supprimer les éléments synchronisés
      const remaining = sessionHistory.slice(batch.length);
      setSessionHistory(remaining);
      localStorage.setItem(storageKey, JSON.stringify(remaining));
      
    } catch (error) {
      console.error('Error syncing search history:', error);
      // Ne pas propager l'erreur
    }
  }, [isAuthenticated, user, sessionHistory, storageKey]);

  // Effacer la session
  const clearSession = useCallback(() => {
    setSessionHistory([]);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  return {
    sessionHistory,
    addToSession,
    clearSession,
    syncToServer
  };
}