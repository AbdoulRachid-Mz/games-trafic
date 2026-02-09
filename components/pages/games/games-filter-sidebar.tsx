// @/components/pages/games/games-filter-sidebar.tsx
"use client";

import React from "react";
import {
  Filter,
  Gamepad2,
  Coins,
  Package,
  Shield,
  Check,
  Sparkles,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useGames } from "@/hooks/use-games";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";

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
      <Card className="border-border bg-card/40 backdrop-blur-xl shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4 pt-6 px-6 flex flex-row items-center justify-between bg-muted/30">
          <CardTitle className="text-xs font-black uppercase tracking-[0.15em] flex items-center gap-2.5">
            <Filter className="h-4 w-4 text-primary" />
            Filtres
          </CardTitle>
          {hasActiveFilters && (
            <button
              className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
              onClick={resetFilters}
            >
              Reset
            </button>
          )}
        </CardHeader>
        <CardContent className="space-y-8 p-6">
          {/* Par Type */}
          <div className="space-y-4">
            <Typography variant="caption1" className="font-black text-muted-foreground/60 uppercase tracking-[0.15em] ml-1">
              Catégories
            </Typography>
            <div className="space-y-1.5">
              {types.map((type) => {
                const isActive = filters.type === type.value || (!filters.type && type.value === "all");
                return (
                  <button
                    key={type.value}
                    onClick={() => updateFilter("type", type.value)}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all duration-200 border",
                      isActive
                        ? "bg-primary/10 text-primary font-bold border-primary/20 shadow-sm shadow-primary/5"
                        : "hover:bg-muted border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <type.icon className={cn("h-4 w-4", isActive ? "text-primary" : "text-muted-foreground/50")} />
                      <span className="tracking-tight">{type.label}</span>
                    </div>
                    {isActive && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* Par Jeu */}
          <div className="space-y-4">
            <Typography variant="caption1" className="font-black text-muted-foreground/60 uppercase tracking-[0.15em] ml-1">
              Par Licences
            </Typography>
            {isLoadingGames ? (
              <div className="space-y-3 animate-pulse">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-10 bg-muted/60 rounded-xl" />
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[340px] -mr-2 pr-4">
                <div className="space-y-1.5">
                  <button
                    onClick={() => updateFilter("gameId", "all")}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all border",
                      !filters.gameId || filters.gameId === "all"
                        ? "bg-primary/10 text-primary font-bold border-primary/20"
                        : "hover:bg-muted border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="tracking-tight">Tous les univers</span>
                    {(!filters.gameId || filters.gameId === "all") && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                  </button>
                  {games.map((game) => {
                    const isActive = filters.gameId === game.id;
                    return (
                      <button
                        key={game.id}
                        onClick={() => updateFilter("gameId", game.id)}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all border",
                          isActive
                            ? "bg-primary/10 text-primary font-bold border-primary/20 shadow-sm shadow-primary/5"
                            : "hover:bg-muted border-transparent text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <Gamepad2 className={cn("h-4 w-4 shrink-0", isActive ? "text-primary" : "text-muted-foreground/50")} />
                          <span className="truncate tracking-tight">{game.name}</span>
                        </div>
                        {isActive && <Check className="h-3.5 w-3.5 shrink-0 stroke-[3]" />}
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Promo Card in Sidebar */}
      <Card className="bg-[#0a0a0b] border-2 border-primary/20 text-white overflow-hidden relative group rounded-2xl">
        <div className="absolute top-0 right-0 p-1 opacity-10 group-hover:scale-150 transition-transform duration-1000">
          <Sparkles className="h-32 w-32 text-primary" />
        </div>
        <CardContent className="p-6 relative z-10 space-y-4">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary mb-2">
            <Coins className="h-5 w-5" />
          </div>
          <h4 className="font-black text-lg leading-tight text-start tracking-tighter uppercase italic">
            GTC Bonus <span className="text-primary">+5%</span>
          </h4>
          <p className="text-[11px] text-white/50 text-start leading-relaxed font-medium">
            Rechargez +50€ et recevez un bonus immédiat pour vos prochains achats.
          </p>
          <Button
            size="sm"
            className="w-full font-black uppercase tracking-widest text-[10px] h-10 shadow-lg shadow-primary/20 ring-1 ring-primary/30"
            asChild
          >
            <a href="/wallet/deposit">Recharger</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
