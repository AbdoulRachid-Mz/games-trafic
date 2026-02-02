"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { debounce } from "lodash"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type SearchType = "products" | "shops" | "tournaments" | "all"

interface SearchResult {
  id: string
  title: string
  type: "product" | "shop" | "tournament"
  image?: string
  subtitle?: string
  url: string
}

interface SearchBarProps {
  type?: SearchType
  placeholder?: string
  className?: string
}

export function SearchBar({ type = "all", placeholder = "Rechercher...", className = "" }: SearchBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const searchRef = useRef<HTMLDivElement>(null)

  // Récupérer la requête des paramètres d'URL
  useEffect(() => {
    const searchQuery = searchParams.get("q") || ""
    if (searchQuery) {
      setQuery(searchQuery)
      performSearch(searchQuery)
    }
  }, [searchParams])

  // Gestion de l'historique de session
  const SESSION_KEY = "sessionSearchQueries"
  const pushSessionQuery = (q: string) => {
    const term = q.trim()
    if (term.length < 2) return
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      const arr: string[] = raw ? JSON.parse(raw) : []
      if (!arr.includes(term)) {
        arr.push(term)
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(arr))
      }
    } catch {}
  }
  const flushSessionQueries = async () => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY)
      if (!raw) return
      const arr: string[] = JSON.parse(raw)
      const unique = Array.from(new Set(arr.filter((v) => v && v.trim().length >= 2)))
      if (unique.length === 0) return
      for (const q of unique) {
        const payload = JSON.stringify({ query: q })
        if (typeof navigator !== "undefined" && "sendBeacon" in navigator) {
          const blob = new Blob([payload], { type: "application/json" })
          navigator.sendBeacon("/api/search/history", blob)
        } else {
          fetch("/api/search/history", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, keepalive: true })
        }
      }
      sessionStorage.removeItem(SESSION_KEY)
    } catch {}
  }
  useEffect(() => {
    const handler = () => { void flushSessionQueries() }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [])

  // Fonction de recherche avec debounce (envoi uniquement après pause de saisie)
  const performSearch = useCallback(
    debounce(async (searchQuery: string) => {
      const trimmed = searchQuery.trim()
      if (!trimmed) {
        setResults([])
        return
      }
      // Stocker la requête (pause de saisie considérée)
      pushSessionQuery(trimmed)

      setIsLoading(true)
      try {
        const searchType = type === "all" ? "" : `&type=${type}`
        const filters = selectedFilters.length > 0 ? `&filters=${selectedFilters.join(",")}` : ""
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}${searchType}${filters}`)
        const data = await response.json()
        if (data.success) {
          setResults(data.results)
        } else {
          setResults([])
        }
      } catch (error) {
        console.error("Erreur lors de la recherche:", error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 500),
    [type, selectedFilters],
  )

  // Mettre à jour la recherche uniquement après une pause de saisie
  useEffect(() => {
    if (query.trim()) {
      performSearch(query)
    } else {
      setResults([])
    }
  }, [query, performSearch])


  // Gérer la soumission du formulaire
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed) {
      const searchType = type === "all" ? "" : `&type=${type}`
      const filters = selectedFilters.length > 0 ? `&filters=${selectedFilters.join(",")}` : ""
      pushSessionQuery(trimmed)
      router.push(`/search?q=${encodeURIComponent(trimmed)}${searchType}${filters}`)
      setOpen(false)
    }
  }

  // Gérer le clic sur un résultat
  const handleResultClick = (result: SearchResult) => {
    router.push(result.url)
    setOpen(false)
  }

  // Gérer l'ajout/suppression de filtres
  const toggleFilter = (filter: string) => {
    setSelectedFilters((prev) => (prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]))
  }

  // Filtres disponibles selon le type de recherche
  const getAvailableFilters = () => {
    switch (type) {
      case "products":
        return ["Fortnite", "League of Legends", "Valorant", "Counter-Strike", "PC", "PlayStation", "Xbox"]
      case "shops":
        return ["Vérifié", "Populaire", "Nouveau"]
      case "tournaments":
        return ["À venir", "En cours", "Terminé", "Gratuit", "Payant"]
      default:
        return ["Produits", "Boutiques", "Tournois"]
    }
  }

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={placeholder}
              className="w-full pl-8 bg-muted/40"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
            />
            {query && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-9 w-9"
                onClick={() => setQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder={placeholder} value={query} onValueChange={setQuery} className="h-9" />

            {/* Filtres */}
            <div className="border-t p-2 flex flex-wrap gap-1">
              {getAvailableFilters().map((filter) => (
                <Badge
                  key={filter}
                  variant={selectedFilters.includes(filter) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleFilter(filter)}
                >
                  {filter}
                </Badge>
              ))}
            </div>

            <CommandList>
              {isLoading ? (
                <div className="py-6 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mt-2">Recherche en cours...</p>
                </div>
              ) : (
                <>
                  <CommandEmpty>Aucun résultat trouvé</CommandEmpty>
                  {results.length > 0 && (
                    <>
                      {type === "all" && (
                        <>
                          <CommandGroup heading="Produits">
                            {results
                              .filter((result) => result.type === "product")
                              .map((result) => (
                                <CommandItem
                                  key={result.id}
                                  onSelect={() => handleResultClick(result)}
                                  className="flex items-center gap-2"
                                >
                                  {result.image ? (
                                    <div className="h-8 w-8 rounded overflow-hidden bg-muted">
                                      <img
                                        src={result.image || "/placeholder.svg"}
                                        alt={result.title}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center">
                                      <span className="text-xs text-primary">P</span>
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span>{result.title}</span>
                                    {result.subtitle && (
                                      <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>

                          <CommandGroup heading="Boutiques">
                            {results
                              .filter((result) => result.type === "shop")
                              .map((result) => (
                                <CommandItem
                                  key={result.id}
                                  onSelect={() => handleResultClick(result)}
                                  className="flex items-center gap-2"
                                >
                                  <Avatar className="h-8 w-8">
                                    <AvatarImage src={result.image || "/placeholder.svg"} alt={result.title} />
                                    <AvatarFallback>{result.title.substring(0, 2).toUpperCase()}</AvatarFallback>
                                  </Avatar>
                                  <div className="flex flex-col">
                                    <span>{result.title}</span>
                                    {result.subtitle && (
                                      <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>

                          <CommandGroup heading="Tournois">
                            {results
                              .filter((result) => result.type === "tournament")
                              .map((result) => (
                                <CommandItem
                                  key={result.id}
                                  onSelect={() => handleResultClick(result)}
                                  className="flex items-center gap-2"
                                >
                                  {result.image ? (
                                    <div className="h-8 w-8 rounded overflow-hidden bg-muted">
                                      <img
                                        src={result.image || "/placeholder.svg"}
                                        alt={result.title}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-8 w-8 rounded bg-secondary/20 flex items-center justify-center">
                                      <span className="text-xs text-secondary">T</span>
                                    </div>
                                  )}
                                  <div className="flex flex-col">
                                    <span>{result.title}</span>
                                    {result.subtitle && (
                                      <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </>
                      )}

                      {type !== "all" && (
                        <CommandGroup>
                          {results.map((result) => (
                            <CommandItem
                              key={result.id}
                              onSelect={() => handleResultClick(result)}
                              className="flex items-center gap-2"
                            >
                              {result.image ? (
                                <div className="h-8 w-8 rounded overflow-hidden bg-muted">
                                  <img
                                    src={result.image || "/placeholder.svg"}
                                    alt={result.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="h-8 w-8 rounded bg-primary/20 flex items-center justify-center">
                                  <span className="text-xs text-primary">
                                    {result.type === "product" ? "P" : result.type === "shop" ? "S" : "T"}
                                  </span>
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span>{result.title}</span>
                                {result.subtitle && (
                                  <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                                )}
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      )}
                    </>
                  )}
                </>
              )}
            </CommandList>

            <div className="border-t p-2">
              <Button variant="default" className="w-full" onClick={handleSubmit} disabled={!query.trim()}>
                <Search className="mr-2 h-4 w-4" />
                Rechercher
              </Button>
            </div>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
