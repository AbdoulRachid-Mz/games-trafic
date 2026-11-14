// @/components/admin/game-asset-picker.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AssetPreset {
  name: string;
  url: string;
  category: "coins" | "crates" | "weapons" | "gt-brand" | "badges";
  universe?: string;
}

export const GAMING_ASSET_PRESETS: AssetPreset[] = [
  // Brand GT
  { name: "GT Primaire", url: "/icons/gt-primary.png", category: "gt-brand" },
  { name: "GT Gold", url: "/icons/gt-gold.png", category: "gt-brand" },
  { name: "GT Controller 3D", url: "/icons/gt-controller-600.png", category: "gt-brand" },
  { name: "Jeton GTC Officiel", url: "/icons/gtc-icon.png", category: "gt-brand" },
  { name: "GT Icone 72", url: "/icons/icon-72.png", category: "gt-brand" },

  // Coins & Devises
  { name: "eFootball Coins 3D", url: "/images/games/football/items/efootball-coins.png", category: "coins", universe: "Football" },
  { name: "FC Points EA Sports 3D", url: "/images/games/football/items/fc-points.png", category: "coins", universe: "Football" },
  { name: "Pièce 3D ISO Gold", url: "/images/icons/3d-icons/3dicons-3d-coin-iso-color.png", category: "coins" },
  { name: "Dollar 3D Dynamique", url: "/images/icons/3d-icons/3dicons-dollar-dynamic-color.png", category: "coins" },
  { name: "Portefeuille Money 3D", url: "/images/icons/3d-icons/3dicons-money-dynamic-color.png", category: "coins" },

  // Caisses & Packs
  { name: "Caisse COD Points 3D", url: "/images/games/fps/items/cod-points-crate.png", category: "crates", universe: "FPS" },
  { name: "Airdrop PUBG 3D", url: "/images/games/battle-royale/items/pubg-airdrop.png", category: "crates", universe: "Battle Royale" },
  { name: "Cadeau Mystère 3D", url: "/images/icons/3d-icons/3dicons-gift-box-dynamic-color.png", category: "crates" },
  { name: "Coffre Locker 3D", url: "/images/icons/3d-icons/3dicons-locker-dynamic-color.png", category: "crates" },

  // Équipements, Armes & Véhicules
  { name: "Hypercar Racing 3D", url: "/images/games/racing/vehicles/racing-hypercar.png", category: "weapons", universe: "Racing" },
  { name: "Bouclier Shield 3D", url: "/images/icons/3d-icons/3dicons-shield-dynamic-color.png", category: "weapons" },
  { name: "Cible Target 3D", url: "/images/icons/3d-icons/3dicons-target-dynamic-color.png", category: "weapons" },
  { name: "Flamme Nitro 3D", url: "/images/icons/3d-icons/3dicons-fire-dynamic-color.png", category: "weapons" },
  { name: "Éclair Flash 3D", url: "/images/icons/3d-icons/3dicons-flash-dynamic-color.png", category: "weapons" },

  // Trophées & Rangs
  { name: "Trophée Coupe 3D", url: "/images/icons/3d-icons/3dicons-trophy-dynamic-color.png", category: "badges" },
  { name: "Couronne Royale 3D", url: "/images/icons/3d-icons/3dicons-crown-dynamic-color.png", category: "badges" },
  { name: "Étoile Star 3D", url: "/images/icons/3d-icons/3dicons-star-dynamic-color.png", category: "badges" },
  { name: "Médaille 3D", url: "/images/icons/3d-icons/3dicons-medal-dynamic-color.png", category: "badges" },
];

interface GameAssetPickerProps {
  value?: string;
  onChange: (url: string) => void;
  title?: string;
}

export function GameAssetPicker({
  value,
  onChange,
  title = "Choisir un asset 3D ou icône GT",
}: GameAssetPickerProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("all");

  const filteredAssets = activeTab === "all"
    ? GAMING_ASSET_PRESETS
    : GAMING_ASSET_PRESETS.filter((p) => p.category === activeTab);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2 border-primary/30 hover:bg-primary/10 text-xs font-semibold"
        >
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Bibliothèque 3D & GT
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-4 sm:p-6 bg-background/95 backdrop-blur-xl border-border/60">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {title}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Sélectionnez un asset 3D haute qualité ou un visuel aux couleurs de Games-Trafics.
          </p>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-1 flex flex-col min-h-0">
          <TabsList className="w-full grid grid-cols-5 h-auto p-1 bg-muted/60 text-xs">
            <TabsTrigger value="all" className="text-[11px] py-1.5 px-1">Tous</TabsTrigger>
            <TabsTrigger value="gt-brand" className="text-[11px] py-1.5 px-1">Marque GT</TabsTrigger>
            <TabsTrigger value="coins" className="text-[11px] py-1.5 px-1">Coins</TabsTrigger>
            <TabsTrigger value="crates" className="text-[11px] py-1.5 px-1">Caisses</TabsTrigger>
            <TabsTrigger value="weapons" className="text-[11px] py-1.5 px-1">Items/Armes</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 pr-1">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredAssets.map((asset) => {
                const isSelected = value === asset.url;
                return (
                  <button
                    key={asset.url}
                    type="button"
                    onClick={() => {
                      onChange(asset.url);
                      setOpen(false);
                    }}
                    className={cn(
                      "group relative flex flex-col items-center justify-between p-3 rounded-2xl border transition-all duration-200 text-center hover:scale-[1.02]",
                      isSelected
                        ? "bg-primary/15 border-primary shadow-lg shadow-primary/20 ring-2 ring-primary/40"
                        : "bg-card/60 hover:bg-card border-border/60 hover:border-primary/40"
                    )}
                  >
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-xl overflow-hidden flex items-center justify-center p-2 mb-2 bg-gradient-to-br from-background to-muted/40">
                      <Image
                        src={asset.url}
                        alt={asset.name}
                        fill
                        className="object-contain p-1.5 transition-transform duration-300 group-hover:scale-110"
                      />
                      {isSelected && (
                        <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center shadow">
                          <Check className="h-3 w-3 text-white stroke-[3]" />
                        </div>
                      )}
                    </div>
                    <span className="text-[11px] font-bold line-clamp-1 text-foreground/90">
                      {asset.name}
                    </span>
                    {asset.universe && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 mt-1 border-primary/30 text-primary">
                        {asset.universe}
                      </Badge>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
