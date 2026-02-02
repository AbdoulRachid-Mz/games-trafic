"use client";

import React from "react";
import {
  Filter,
  Gamepad2,
  Coins,
  Package,
  Shield,
  X,
  ChevronRight,
  RefreshCcw,
  Check,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGames } from "@/hooks/use-games";
import { Game } from "@/database/schema";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface GamesFilterSidebarProps {
  filters: any;
  updateFilter: (key: any, value: any) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

export function GamesFilterSidebar({
  filters,
  updateFilter,
  resetFilters,
  hasActiveFilters,
}: GamesFilterSidebarProps) {
  // On récupère les jeux pour le filtre. Note: useGames est infini ici, on prend la 1ère page
  const { data: gamesData, isLoading: isLoadingGames } = useGames({
    filters: { isActive: true },
    pagination: { page: 1, limit: 100 },
  });

  const games = gamesData?.pages?.flatMap((p) => p.data) || [];

  const types = [
    { value: "all", label: "Tous les types", icon: Package },
    { value: "COIN", label: "Monnaies / Cash", icon: Coins },
    { value: "ITEM", label: "Items de jeu", icon: Package },
    { value: "SKIN", label: "Skins / Apparences", icon: Shield },
  ];

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 bg-card/50 backdrop-blur-sm sticky top-24">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtres
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[10px] text-muted-foreground hover:text-primary"
              onClick={resetFilters}
            >
              Réinitialiser
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Par Type */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Type d'item
            </h4>
            <div className="space-y-1">
              {types.map((type) => (
                <button
                  key={type.value}
                  onClick={() => updateFilter("type", type.value)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                    filters.type === type.value ||
                    (!filters.type && type.value === "all")
                      ? "bg-primary/10 text-primary font-medium border border-primary/20"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <type.icon className="h-4 w-4" />
                    <span>{type.label}</span>
                  </div>
                  {(filters.type === type.value ||
                    (!filters.type && type.value === "all")) && (
                    <Check className="h-3 w-3" />
                  )}
                </button>
              ))}
            </div>
          </div>

          <Separator className="bg-primary/5" />

          {/* Par Jeu */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase">
              Filtrer par Jeu
            </h4>
            {isLoadingGames ? (
              <div className="space-y-2 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-9 bg-muted rounded-lg" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[300px] pr-2">
                <div className="space-y-1">
                  <button
                    onClick={() => updateFilter("gameId", "all")}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                      !filters.gameId
                        ? "bg-primary/10 text-primary font-medium border border-primary/20"
                        : "hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>Tous les jeux</span>
                    {!filters.gameId && <Check className="h-3 w-3" />}
                  </button>
                  {games.map((game) => (
                    <button
                      key={game.id}
                      onClick={() => updateFilter("gameId", game.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                        filters.gameId === game.id
                          ? "bg-primary/10 text-primary font-medium border border-primary/20"
                          : "hover:bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Gamepad2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{game.name}</span>
                      </div>
                      {filters.gameId === game.id && (
                        <Check className="h-3 w-3 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Promo Card in Sidebar */}
      <Card className="bg-gradient-to-br from-primary to-purple-600 border-none text-white overflow-hidden relative group">
        <div className="absolute top-0 right-0 p-1 opacity-20 group-hover:scale-150 transition-transform duration-700">
          <Sparkles className="h-24 w-24" />
        </div>
        <CardContent className="p-6 relative z-10 space-y-4">
          <h4 className="font-bold text-lg leading-tight text-start">
            Gagnez des GTC bonus !
          </h4>
          <p className="text-xs text-white/80 text-start">
            Rechargez votre portefeuille de plus de 50€ et recevez 5% de bonus
            immédiat.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="w-full font-bold shadow-xl"
            asChild
          >
            <a href="/wallet/deposit">En profiter</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
