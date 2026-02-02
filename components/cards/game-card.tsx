// @/components/cards/game-card.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { InteractionButton } from "@/components/shared/interaction-button";
import {
  Gamepad2,
  Coins,
  Sparkles,
  Zap,
  Star,
  ShoppingBag,
  Users,
  TrendingUp,
  ChevronRight,
  Crown,
  Shield,
} from "lucide-react";
import type { Game, GameItem, GameWithRelations, GameItemWithRelations } from "@/database/schema";

// Types
type ViewMode = "grid" | "list" | "compact";
type ItemType = "COIN" | "ITEM" | "SKIN" | "EQUIPMENT" | "CURRENCY";

interface GameCardProps {
  game?: Game & {
    gameItems?: GameItem[];
    stats?: {
      popularity: number;
      totalSales: number;
    };
  };
  gameItem?: GameItem & {
    game?: Game;
  };
  viewMode?: ViewMode;
  showDetails?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  showBuyButton?: boolean;
  showLikeButton?: boolean;
  onView?: (id: string) => void;
  onBuy?: (itemId: string) => void;
  className?: string;
}

export function GameCard({
  game,
  gameItem,
  viewMode = "grid",
  showDetails = true,
  showStats = true,
  showActions = true,
  showBuyButton = true,
  showLikeButton = true,
  onView,
  onBuy,
  className,
}: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isGrid = viewMode === "grid";
  const isList = viewMode === "list";
  const isCompact = viewMode === "compact";
  const isGameItem = !!gameItem;
  const item = gameItem || game;

  const itemTypeConfig: Record<ItemType, {
    label: string;
    color: string;
    icon: React.ReactNode;
  }> = {
    COIN: {
      label: "Monnaie",
      color: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      icon: <Coins className="w-3 h-3" />,
    },
    ITEM: {
      label: "Objet",
      color: "bg-blue-500/10 text-blue-600 border-blue-500/20",
      icon: <Sparkles className="w-3 h-3" />,
    },
    SKIN: {
      label: "Skin",
      color: "bg-purple-500/10 text-purple-600 border-purple-500/20",
      icon: <Shield className="w-3 h-3" />,
    },
    EQUIPMENT: {
      label: "Équipement",
      color: "bg-green-500/10 text-green-600 border-green-500/20",
      icon: <Zap className="w-3 h-3" />,
    },
    CURRENCY: {
      label: "Devise",
      color: "bg-amber-500/10 text-amber-600 border-amber-500/20",
      icon: <Coins className="w-3 h-3" />,
    },
  };

  const handleView = () => {
    if (onView) {
      onView(item?.id ?? "");
    }
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuy && gameItem) {
      onBuy(gameItem.id);
    }
  };

  // Rendu de l'image
  const renderImage = () => {
    const imageSrc = gameItem?.icon || game?.profileImage || game?.coverImage;
    
    return (
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 aspect-square">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={item?.name ?? `image ${item?.id}`}
            fill
            className={cn(
              "object-cover transition-transform duration-500",
              isHovered && "scale-105"
            )}
            sizes={isList ? "120px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            {isGameItem ? (
              <Coins className="w-16 h-16 text-primary/30" />
            ) : (
              <Gamepad2 className="w-16 h-16 text-primary/30" />
            )}
          </div>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {isGameItem && gameItem.type && (
            <Badge className={cn(
              "gap-1 px-2 py-0.5 text-xs backdrop-blur-md border",
              itemTypeConfig[gameItem.type as ItemType]?.color || itemTypeConfig.ITEM.color
            )}>
              {itemTypeConfig[gameItem.type as ItemType]?.icon}
              {itemTypeConfig[gameItem.type as ItemType]?.label}
            </Badge>
          )}
          {game?.featured && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1 text-xs">
              <Crown className="w-3 h-3" />
              Vedette
            </Badge>
          )}
        </div>
      </div>
    );
  };

  // Rendu du contenu
  const renderContent = () => {
    if (isCompact) {
      return (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 flex-shrink-0">
            {renderImage()}
          </div>
          <div className="flex-1 min-w-0">
            <Typography variant="body-sm" weight="semibold" className="truncate">
              {item?.name}
            </Typography>
            <div className="flex items-center justify-between mt-1">
              {isGameItem ? (
                <Typography variant="body-sm" weight="bold" className="text-primary">
                  {gameItem.priceGtc} GTC
                </Typography>
              ) : (
                <Typography variant="caption2" theme="muted">
                  {game?.gameItems?.length || 0} items
                </Typography>
              )}
              {showActions && isGameItem && showBuyButton && (
                <Button size="sm" variant="ghost" className="h-7 px-2">
                  <ShoppingBag className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Typography
              variant={isList ? "h5" : "body-base"}
              weight="bold"
              className="line-clamp-1 group-hover:text-primary transition-colors"
            >
              {item?.name}
            </Typography>
            
            {showDetails && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {isGameItem && gameItem.game && (
                  <Badge variant="outline" className="text-xs">
                    <Gamepad2 className="w-3 h-3 mr-1" />
                    {gameItem.game.name}
                  </Badge>
                )}
                {!isGameItem && game?.publisher && (
                  <Typography variant="caption2" theme="muted">
                    {game.publisher}
                  </Typography>
                )}
              </div>
            )}
          </div>
          
          {!isGameItem && game?.featured && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1">
              <Star className="w-3 h-3" />
            </Badge>
          )}
        </div>

        {/* Description */}
        {showDetails && item?.description && (
          <Typography
            variant="body-sm"
            theme="muted"
            className="line-clamp-2 leading-relaxed"
          >
            {item?.description ?? ""}
          </Typography>
        )}

        {/* Statistiques */}
        {showStats && (
          <div className="grid grid-cols-2 gap-2 py-2 border-y border-border/50">
            {isGameItem ? (
              <>
                <div className="text-center">
                  <div className="text-sm font-semibold">
                    {gameItem.minOrder || 1}
                  </div>
                  <Typography variant="caption2" theme="muted">
                    Min. commande
                  </Typography>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold">
                    {gameItem.processingTime || "24h"}
                  </div>
                  <Typography variant="caption2" theme="muted">
                    Traitement
                  </Typography>
                </div>
              </>
            ) : (
              <>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                    <TrendingUp className="w-4 h-4" />
                    {game?.popularity || 0}
                  </div>
                  <Typography variant="caption2" theme="muted">
                    Popularité
                  </Typography>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                    <Users className="w-4 h-4" />
                    {game?.gameItems?.length || 0}
                  </div>
                  <Typography variant="caption2" theme="muted">
                    Items
                  </Typography>
                </div>
              </>
            )}
          </div>
        )}

        {/* Prix et actions */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {isGameItem ? (
              <>
                <Typography variant="h5" weight="bold" className="text-primary">
                  {gameItem.priceGtc} GTC
                </Typography>
                <Typography variant="caption2" theme="muted">
                  Disponible
                </Typography>
              </>
            ) : (
              <Typography variant="body-sm" theme="muted">
                {game?.genre}
              </Typography>
            )}
          </div>

          {showActions && (
            <div className="flex items-center gap-2">
              {showLikeButton && (
                <InteractionButton
                  type="like"
                  entityType={isGameItem ? "PRODUCT" : "GAME"}
                  entityId={item?.id ?? ""}
                  iconOnly
                  size="sm"
                  variant="ghost"
                />
              )}
              
              <div className="flex items-center gap-2">
                <Button
                  size={isList ? "default" : "sm"}
                  variant="outline"
                  onClick={handleView}
                  className="gap-2"
                >
                  Voir
                  <ChevronRight className="w-4 h-4" />
                </Button>
                {isGameItem && showBuyButton && (
                  <Button
                    size={isList ? "default" : "sm"}
                    onClick={handleBuy}
                    className="gap-2 shadow-lg shadow-primary/20"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Acheter
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Rendu selon le mode
  if (isList) {
    return (
      <Card
        className={cn(
          "group cursor-pointer transition-all hover:shadow-lg",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleView}
      >
        <div className="flex gap-4 p-4">
          <div className="w-32 flex-shrink-0">
            {renderImage()}
          </div>
          <CardContent className="p-0 flex-1">
            {renderContent()}
          </CardContent>
        </div>
      </Card>
    );
  }

  if (isGrid) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className="h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card
          className={cn(
            "group cursor-pointer h-full overflow-hidden transition-all hover:shadow-xl border-border/50",
            className
          )}
          onClick={handleView}
        >
          <CardContent className="p-4 space-y-4">
            {renderImage()}
            {renderContent()}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Mode compact
  return (
    <Card
      className={cn("cursor-pointer hover:shadow-md", className)}
      onClick={handleView}
    >
      <CardContent className="p-3">
        {renderContent()}
      </CardContent>
    </Card>
  );
}