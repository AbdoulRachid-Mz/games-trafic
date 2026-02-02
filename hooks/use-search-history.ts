"use client"

import { useAuthContext } from "@/contexts/auth-context"
import { useQuery, useQueryClient } from "@tanstack/react-query"

interface SearchHistoryItem {
  id: string
  query: string
  createdAt: string
}

export function useSearchHistory() {
  // const { isSignedIn } = useUser()
   const { user: isSignedIn } = useAuthContext()
  const queryClient = useQueryClient()

  // Fetch search history
  const { data: history = [] } = useQuery<SearchHistoryItem[]>({
    queryKey: ["search-history"],
    queryFn: async () => {
      if (!isSignedIn) return []
      try {
        const res = await fetch("/api/search/history")
        if (!res.ok) return []
        return await res.json()
      } catch (error) {
        console.error("Failed to fetch search history:", error)
        return []
      }
    },
    enabled: !!isSignedIn,
  })

  // Add to search history
  const addToHistory = async (query: string) => {
    if (!isSignedIn || !query || query.trim().length < 2) return

    try {
      await fetch("/api/search/history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
      queryClient.invalidateQueries({ queryKey: ["search-history"] })
    } catch (error) {
      console.error("Failed to add to search history:", error)
    }
  }

  // Clear search history
  const clearHistory = async () => {
    if (!isSignedIn) return

    try {
      await fetch("/api/search/history", {
        method: "DELETE",
      })
      queryClient.invalidateQueries({ queryKey: ["search-history"] })
    } catch (error) {
      console.error("Failed to clear search history:", error)
    }
  }

  // Delete specific search history item
  const deleteHistoryItem = async (query: string) => {
    if (!isSignedIn || !query) return

    try {
      await fetch("/api/search/history/item", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      })
      queryClient.invalidateQueries({ queryKey: ["search-history"] })
    } catch (error) {
      console.error("Failed to delete search history item:", error)
    }
  }

  return {
    history,
    addToHistory,
    clearHistory,
    deleteHistoryItem,
  }
}
