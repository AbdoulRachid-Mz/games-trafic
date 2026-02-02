"use client"

import type React from "react"

import { History, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface SearchHistoryItemProps {
  term: string
  onClick: (term: string) => void
}

export function SearchHistoryItem({ term, onClick }: SearchHistoryItemProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsDeleting(true)

    try {
      // Implement delete single history item
      await fetch(`/api/search/history/item`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: term }),
      })
    } catch (error) {
      console.error("Error deleting search history item:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="flex items-center justify-between group">
      <button
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1 px-2 rounded-md hover:bg-accent/50 w-full text-left"
        onClick={() => onClick(term)}
      >
        <History className="h-4 w-4" />
        <span>{term}</span>
      </button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleDelete}
        disabled={isDeleting}
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Supprimer</span>
      </Button>
    </div>
  )
}
