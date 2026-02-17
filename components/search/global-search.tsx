// components/search/global-search.tsx
"use client";

import type React from "react";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  X,
  Clock,
  Store,
  ShoppingBag,
  Trophy,
  Loader2,
  BookOpen,
  Newspaper,
  Palette,
  HelpCircle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";
import { SearchHistoryItem } from "./search-history-item";
import { useAuthContext } from "@/contexts/auth-context";
import { useLocalSearch } from "@/hooks/use-local-search";

interface GlobalSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

type SearchResultType = 
  | 'all' 
  | 'shop' 
  | 'product' 
  | 'tournament' 
  | 'theme'
  | 'service' 
  | 'guide' 
  | 'blog'
  | 'item';

interface SearchResultItem {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  image?: string;
  price?: number;
  currency?: string;
  metadata?: any;
}

export function GlobalSearch({ isOpen, onClose }: GlobalSearchProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<SearchResultType>('all');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user, isAuthenticated } = useAuthContext();
 
  const selectedTypes = useMemo<('shop'|'product'|'tournament'|'theme'|'service'|'guide'|'blog'|'item')[]>(() => {
    if (activeTab === 'all') {
      return ['shop','product','tournament','theme','service','guide','blog','item'];
    }
    return [activeTab] as any;
  }, [activeTab]);
 
  const {
    results: searchResults,
    isLoading,
    addToHistory,
    clearHistory,
    deleteHistoryItem,
    history: sessionHistory,
    suggestions: localSuggestions,
    debouncedTerm,
  } = useLocalSearch(selectedTypes as any, searchTerm, { limitPerType: 8, debounceMs: 400 });

  // Filtrer les résultats par type
  const filteredResults = useMemo(() => {
    return searchResults as any[];
  }, [searchResults]);

  // Suggestions depuis l'historique
  const historySuggestions = useMemo(() => {
    return sessionHistory
      .filter(h => 
        searchTerm && 
        h.query.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .slice(0, 5);
  }, [sessionHistory, searchTerm]);

  // Gestion de la recherche avec suggestions
  const handleSearch = useCallback(async (term: string) => {
    if (term.trim().length < 2) return;
    addToHistory(term);
    setSuggestions(localSuggestions);
  }, [addToHistory, localSuggestions]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim().length > 0) {
      handleSearch(searchTerm);
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleResultClick = useCallback((item: SearchResultItem) => {
    // Enregistrer l'action
    addToHistory(item.title);
    
    // Naviguer vers l'élément
    const path = getResultPath(item);
    router.push(path);
    onClose();
  }, [addToHistory, router, onClose]);

  const getResultPath = useCallback((item: SearchResultItem): string => {
    switch (item.type) {
      case 'shop': return `/boutiques/${item.id}`;
      case 'product': return `/produits/${item.id}`;
      case 'tournament': return `/tournois/${item.id}`;
      case 'theme': return `/themes/${item.id}`;
      case 'service': return `/services/${item.id}`;
      case 'guide': return `/guides/${item.id}`;
      case 'blog': return `/blog/${item.id}`;
      case 'item': return `/items/${item.id}`;
      default: return '#';
    }
  }, []);

  // Synchroniser avec le serveur lors de la fermeture
  useEffect(() => {
    if (!isOpen) {
      setSuggestions([]);
    }
  }, [isOpen]);

  // Focus sur l'input à l'ouverture
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchTerm("");
      setActiveTab('all');
      setSuggestions([]);
    }
  }, [isOpen]);

  // Suggestions automatiques lors de la frappe
  useEffect(() => {
    if (debouncedTerm.length >= 2) {
      handleSearch(debouncedTerm);
    }
  }, [debouncedTerm, handleSearch]);

  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Recherche en cours...</span>
        </div>
      );
    }

    if (filteredResults.length === 0 && debouncedTerm.length >= 2) {
      return (
        <div className="p-8 text-center">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-2">
            Aucun résultat trouvé pour "{debouncedTerm}"
          </p>
          {suggestions.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Suggestions :</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm(suggestion);
                      handleSearch(suggestion);
                    }}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    if (filteredResults.length > 0) {
      return (
        <ScrollArea className="h-[calc(100vh-250px)]">
          <div className="space-y-2 p-2">
            {filteredResults.map((item: SearchResultItem) => (
              <ResultItem
                key={`${item.type}-${item.id}`}
                item={item}
                onClick={() => handleResultClick(item)}
                onClose={onClose}
              />
            ))}
            {filteredResults.length > 10 && (
              <ViewMoreButton
                count={filteredResults.length}
                type={activeTab}
                searchTerm={debouncedTerm}
                onClose={onClose}
              />
            )}
          </div>
        </ScrollArea>
      );
    }

    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogTitle className="hidden">Titre de la recherche</DialogTitle>
      <DialogContent 
        className="p-0 sm:max-w-[600px] lg:max-w-[700px] max-h-[90vh] flex flex-col"
      >
        {/* Header de recherche */}
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="relative p-4">
            <Search className="absolute left-6 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              placeholder="Rechercher boutiques, produits, tournois, thèmes..."
              className="pl-10 pr-12 py-3 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Suggestions d'historique */}
          {historySuggestions.length > 0 && searchTerm && !isLoading && (
            <div className="absolute left-4 right-4 top-full mt-1 z-20 bg-popover border rounded-md shadow-lg">
              {historySuggestions.map((h) => (
                <button
                  key={h.id}
                  className="w-full text-left px-4 py-2 hover:bg-accent text-sm flex items-center gap-2"
                  onClick={() => {
                    setSearchTerm(h.query);
                    handleSearch(h.query);
                  }}
                >
                  <Clock className="h-3 w-3" />
                  <span>{h.query}</span>
                </button>
              ))}
            </div>
          )}

          {/* Tabs */}
          {debouncedTerm.length >= 2 && (
            <Tabs 
              value={activeTab} 
              onValueChange={(v) => setActiveTab(v as SearchResultType)}
              className="px-4 pb-2"
            >
              <TabsList className="w-full grid grid-cols-4 lg:grid-cols-6 h-auto p-1 gap-1 overflow-x-auto">
                <TabsTrigger value="all" className="text-xs">
                  Tous
                </TabsTrigger>
                <TabsTrigger value="shop" className="text-xs">
                  <Store className="h-3 w-3 mr-1" /> Boutiques
                </TabsTrigger>
                <TabsTrigger value="product" className="text-xs">
                  <ShoppingBag className="h-3 w-3 mr-1" /> Produits
                </TabsTrigger>
                <TabsTrigger value="tournament" className="text-xs">
                  <Trophy className="h-3 w-3 mr-1" /> Tournois
                </TabsTrigger>
                <TabsTrigger value="theme" className="text-xs">
                  <Palette className="h-3 w-3 mr-1" /> Thèmes
                </TabsTrigger>
                <TabsTrigger value="service" className="text-xs">
                  <HelpCircle className="h-3 w-3 mr-1" /> Services
                </TabsTrigger>
                <TabsTrigger value="guide" className="text-xs">
                  <BookOpen className="h-3 w-3 mr-1" /> Guides
                </TabsTrigger>
                <TabsTrigger value="blog" className="text-xs">
                  <Newspaper className="h-3 w-3 mr-1" /> Blog
                </TabsTrigger>
                <TabsTrigger value="item" className="text-xs">
                  <ShoppingBag className="h-3 w-3 mr-1" /> Items
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-hidden">
          {debouncedTerm.length < 2 ? (
            // Historique
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Recherches récentes
                </h3>
                {sessionHistory.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearHistory}
                    className="text-xs"
                  >
                    Effacer
                  </Button>
                )}
              </div>
              
              {sessionHistory.length > 0 ? (
                <ScrollArea className="h-64">
                  <div className="space-y-1">
                    {sessionHistory.map((item) => (
                      <SearchHistoryItem
                        key={item.id}
                        term={item.query}
                        onClick={(term) => {
                          setSearchTerm(term);
                          handleSearch(term);
                        }}
                        onDelete={() => deleteHistoryItem(item.id)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucune recherche récente</p>
                  <p className="text-xs mt-2">Commencez à taper pour rechercher</p>
                </div>
              )}
            </div>
          ) : (
            // Résultats
            renderResults()
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t p-3 text-xs text-muted-foreground flex justify-between items-center">
          <span>Appuyez sur Entrée pour rechercher</span>
          <span>ESC pour fermer</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Sous-composants (inchangés)
interface ResultItemProps {
  item: SearchResultItem;
  onClick: () => void;
  onClose: () => void;
}

function ResultItem({ item, onClick, onClose }: ResultItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-start p-3 hover:bg-accent rounded-lg transition-colors w-full text-left group"
    >
      <div className="relative h-12 w-12 rounded-md overflow-hidden flex-shrink-0 bg-muted">
        {item.image ? (
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
            sizes="48px"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {getIconForType(item.type)}
          </div>
        )}
      </div>
      <div className="ml-3 flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-primary">
          {item.title}
        </p>
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {item.description}
          </p>
        )}
        {item.price && (
          <p className="text-xs font-medium mt-1">
            {item.price.toFixed(2)} {item.currency || "GTC"}
          </p>
        )}
        <span className="inline-block text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full mt-1">
          {getTypeLabel(item.type)}
        </span>
      </div>
    </button>
  );
}

interface ViewMoreButtonProps {
  count: number;
  type: string;
  searchTerm: string;
  onClose: () => void;
}

function ViewMoreButton({ count, type, searchTerm, onClose }: ViewMoreButtonProps) {
  const router = useRouter();
  
  const handleClick = () => {
    router.push(`/search?q=${encodeURIComponent(searchTerm)}&type=${type}`);
    onClose();
  };
  
  return (
    <div className="text-center p-4 border-t">
      <Button 
        variant="outline" 
        onClick={handleClick}
        className="w-full"
      >
        Voir les {count} résultats pour "{searchTerm}"
      </Button>
    </div>
  );
}

// Utilitaires
function getIconForType(type: string) {
  switch (type) {
    case 'shop': return <Store className="h-5 w-5 text-muted-foreground" />;
    case 'product': return <ShoppingBag className="h-5 w-5 text-muted-foreground" />;
    case 'tournament': return <Trophy className="h-5 w-5 text-muted-foreground" />;
    case 'theme': return <Palette className="h-5 w-5 text-muted-foreground" />;
    case 'service': return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
    case 'guide': return <BookOpen className="h-5 w-5 text-muted-foreground" />;
    case 'blog': return <Newspaper className="h-5 w-5 text-muted-foreground" />;
    default: return <Search className="h-5 w-5 text-muted-foreground" />;
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'shop': return 'Boutique';
    case 'product': return 'Produit';
    case 'tournament': return 'Tournoi';
    case 'theme': return 'Thème';
    case 'service': return 'Service';
    case 'guide': return 'Guide';
    case 'blog': return 'Blog';
    case 'news': return 'Actualité';
    default: return type;
  }
}
