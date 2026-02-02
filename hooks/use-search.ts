// hooks/use-unified-search.ts
import { useQuery } from "@tanstack/react-query"
import { useAuthContext } from "@/contexts/auth-context"

// Types
export interface SearchOptions {
  enabled?: boolean
  debounceMs?: number
}

export interface SearchResult<T = any> {
  data: T[]
  isLoading: boolean
  error: Error | null
}

// Fonction pour gérer la recherche unifiée avec cache local
export function useSearch<T>(
  entityType: string,
  term: string,
  options: SearchOptions = {}
) {
  const { user } = useAuthContext()
  
  // Clé de cache spécifique à l'utilisateur
  const cacheKey = user?.id 
    ? `search_cache_${user.id}_${entityType}`
    : `search_cache_anonymous_${entityType}`

  // Récupérer depuis le cache local d'abord
  const getCachedResults = (): T[] => {
    if (typeof window === 'undefined') return []
    try {
      const cached = localStorage.getItem(cacheKey)
      if (!cached) return []
      const { term: cachedTerm, timestamp, data } = JSON.parse(cached)
      
      // Vérifier si le cache est valide (5 minutes)
      if (Date.now() - timestamp < 5 * 60 * 1000 && 
          term.toLowerCase().includes(cachedTerm.toLowerCase())) {
        return data
      }
    } catch (error) {
      console.error('Error reading search cache:', error)
    }
    return []
  }

  // Sauvegarder dans le cache local
  const setCachedResults = (data: T[]) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        term,
        timestamp: Date.now(),
        data
      }))
    } catch (error) {
      console.error('Error setting search cache:', error)
    }
  }

  return useQuery({
    queryKey: ["search", entityType, term],
    queryFn: async () => {
      if (!term || term.length < 2) return []

      // Vérifier le cache local d'abord
      const cached = getCachedResults()
      if (cached.length > 0) {
        return cached
      }

      // Faire la requête API
      const res = await fetch(`/api/search?entity=${entityType}&term=${encodeURIComponent(term)}`)
      if (!res.ok) throw new Error(`Failed to fetch ${entityType}`)
      const data = await res.json()
      
      // Mettre en cache
      setCachedResults(data)
      
      return data
    },
    enabled: options.enabled !== false && !!term && term.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1
  })
}