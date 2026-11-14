// @/components/pages/games/game-item-visual.tsx
/**
 * GameItemVisual — Composant central d'affichage visuel des items gaming.
 *
 * - Affiche l'image primaire de l'item (icon) avec `object-contain` sur fond typé
 * - En l'absence d'image custom : fallback 3dicon avec fond thématique
 * - Logo GT en watermark discret (bottom-right, opacity basse)
 * - Effet de glow/halo selon la couleur d'accent de l'univers
 * - Responsive, Next.js <Image>, lazy loading
 */
"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";
import { GameItemWithRelations } from "@/database/schema";
import { getGameItemVisual } from "@/lib/games/art-assets";

interface GameItemVisualProps {
  item: GameItemWithRelations;
  /** Afficher le logo GT en watermark discret */
  withGTBranding?: boolean;
  /** Classe CSS supplémentaire pour le conteneur */
  className?: string;
  /** Mode d'affichage : card (compact) | detail (grand) */
  mode?: "card" | "detail";
  /** Priorité de chargement Next.js */
  priority?: boolean;
}

export function GameItemVisual({
  item,
  withGTBranding = true,
  className,
  mode = "card",
  priority = false,
}: GameItemVisualProps) {
  const visual = getGameItemVisual(item, item.game);
  const hasImage = !!(item.icon || visual.image);
  const imageSrc = item.icon || visual.image;
  const fallbackSrc = visual.fallbackImage;

  const containerSizeClass = mode === "detail"
    ? "aspect-square sm:aspect-[4/3]"
    : "aspect-[4/3]";

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        containerSizeClass,
        className
      )}
      style={{
        background: `radial-gradient(ellipse at 60% 30%, ${visual.glowColor}, transparent 70%)`,
      }}
    >
      {/* Gradient overlay typed by universe */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-30 pointer-events-none z-[1]",
          visual.gradientClass
        )}
      />

      {/* Primary image or fallback */}
      {hasImage ? (
        <Image
          src={imageSrc}
          fill
          alt={item.name}
          className={cn(
            "z-[2] transition-transform duration-700",
            mode === "card"
              ? "object-contain p-4 group-hover:scale-110"
              : "object-contain p-6 group-hover:scale-105"
          )}
          priority={priority}
          sizes={mode === "detail" ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 50vw, 33vw"}
        />
      ) : (
        <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-3">
          {fallbackSrc ? (
            <Image
              src={fallbackSrc}
              width={mode === "detail" ? 120 : 72}
              height={mode === "detail" ? 120 : 72}
              alt={item.name}
              className="object-contain opacity-80"
            />
          ) : (
            <Package
              className={cn(
                "text-muted-foreground/20",
                mode === "detail" ? "h-24 w-24" : "h-14 w-14"
              )}
            />
          )}
        </div>
      )}

      {/* GT Branding watermark */}
      {withGTBranding && (
        <div className="absolute bottom-2 right-2 z-[5] pointer-events-none">
          <Image
            src="/icons/gt-primary.png"
            width={mode === "detail" ? 28 : 20}
            height={mode === "detail" ? 28 : 20}
            alt="Games Trafics"
            className="object-contain opacity-15"
          />
        </div>
      )}

      {/* Subtle inner border glow */}
      <div
        className={cn(
          "absolute inset-0 rounded-inherit pointer-events-none z-[6] ring-1",
          visual.borderClass
        )}
      />
    </div>
  );
}
