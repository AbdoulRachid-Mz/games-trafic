// hooks/use-active-route.ts
'use client'

import { usePathname } from 'next/navigation'

export function useActiveRoute() {
  const pathname = usePathname()
  
  /**
   * Vérifie si une route est active
   * @param url URL à vérifier
   * @param exact Si true, vérifie l'égalité exacte. Si false, vérifie si la route commence par l'URL.
   */
  const isActive = (url: string | undefined, exact: boolean = false): boolean => {
    if (!url || !pathname) return false
    
    // Nettoyer les URLs
    const cleanUrl = url.endsWith('/') ? url.slice(0, -1) : url
    const cleanPathname = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname
    
    // Si c'est la page d'accueil admin
    if (cleanUrl === '/ad' && cleanPathname === '/ad') return true
    
    if (exact) {
      return cleanPathname === cleanUrl
    }
    
    // Pour les sous-routes
    if (cleanUrl === '/ad') {
      // La page d'accueil admin ne devrait pas activer tous les items
      return cleanPathname === '/ad'
    }
    
    // Pour les routes qui commencent par l'URL (ex: /ad/regions devrait activer /ad/regions/123)
    return cleanPathname.startsWith(cleanUrl + '/') || cleanPathname === cleanUrl
  }
  
  /**
   * Obtient le titre de la page active basé sur les items de menu
   */
  const getActiveTitle = (items: Array<{title: string, url?: string}>): string | null => {
    for (const item of items) {
      if (item.url && isActive(item.url, false)) {
        return item.title
      }
    }
    return null
  }
  
  return {
    pathname,
    isActive,
    getActiveTitle
  }
}