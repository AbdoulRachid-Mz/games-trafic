// @/components/cards/game-card.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { InteractionButton } from "@/components/shared/interaction-button";
import { BaseCardProps, CardActionMenu, extraActionsProps } from "./card-action-menu";
import { gameItemTypeLabel } from "@/utils/types-label";
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
  Layers,
  ArrowRight
} from "lucide-react";
import type { Game, GameItem } from "@/database/schema";

type ItemType = "COIN" | "ITEM" | "SKIN" | "EQUIPMENT" | "CURRENCY";

export interface GameCardProps extends BaseCardProps<any> {
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
  showDetails?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  showBuyButton?: boolean;
  showLikeButton?: boolean;
  onBuy?: (itemId: string) => void;
}

export function GameCard({
  item,
  game: propGame,
  gameItem: propGameItem,
  viewMode = "grid",
  status,
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  onBuy,
  showDetails = true,
  showStats = true,
  showActions = true,
  showBuyButton = true,
  showLikeButton = true,
  className,
}: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isGrid = viewMode === "grid";
  const isList = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  // Détection automatique pour la compatibilité avec BaseCardProps et l'usage direct
  const isItemGameItem = item && ("priceGtc" in item || "gameId" in item);
  const gameItem = propGameItem || (isItemGameItem ? item : undefined);
  const game = propGame || (!isItemGameItem ? item : undefined);

  const isGameItem = !!gameItem;
  const activeItem = gameItem || game;

  const itemTypeConfig: Record<ItemType | "DEFAULT", {
    wrapperClass: string;
    imageOverlayClass: string;
    badgeClass: string;
    icon: React.ReactNode;
    textColor: string;
    glowClass: string;
  }> = {
    COIN: {
      wrapperClass: "border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] bg-gradient-to-br from-amber-500/5 via-background to-background",
      imageOverlayClass: "from-amber-500/20 via-amber-500/5 to-transparent",
      badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
      icon: <Coins className="w-3 h-3" />,
      textColor: "text-amber-500",
      glowClass: "bg-amber-500/20",
    },
    CURRENCY: {
      wrapperClass: "border-amber-500/30 hover:border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.05)] hover:shadow-[0_0_25px_rgba(245,158,11,0.2)] bg-gradient-to-br from-amber-500/5 via-background to-background",
      imageOverlayClass: "from-amber-500/20 via-amber-500/5 to-transparent",
      badgeClass: "bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]",
      icon: <Coins className="w-3 h-3" />,
      textColor: "text-amber-500",
      glowClass: "bg-amber-500/20",
    },
    SKIN: {
      wrapperClass: "border-fuchsia-500/30 hover:border-fuchsia-500/60 shadow-[0_0_15px_rgba(217,70,239,0.05)] hover:shadow-[0_0_25px_rgba(217,70,239,0.2)] bg-gradient-to-br from-fuchsia-500/5 via-background to-background",
      imageOverlayClass: "from-fuchsia-500/20 via-fuchsia-500/5 to-transparent",
      badgeClass: "bg-fuchsia-500/10 text-fuchsia-500 border-fuchsia-500/30 shadow-[0_0_10px_rgba(217,70,239,0.2)]",
      icon: <Shield className="w-3 h-3" />,
      textColor: "text-fuchsia-500",
      glowClass: "bg-fuchsia-500/20",
    },
    EQUIPMENT: {
      wrapperClass: "border-emerald-500/30 hover:border-emerald-500/60 shadow-[0_0_15px_rgba(16,185,129,0.05)] hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] bg-gradient-to-br from-emerald-500/5 via-background to-background",
      imageOverlayClass: "from-emerald-500/20 via-emerald-500/5 to-transparent",
      badgeClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]",
      icon: <Zap className="w-3 h-3" />,
      textColor: "text-emerald-500",
      glowClass: "bg-emerald-500/20",
    },
    ITEM: {
      wrapperClass: "border-blue-500/30 hover:border-blue-500/60 shadow-[0_0_15px_rgba(59,130,246,0.05)] hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] bg-gradient-to-br from-blue-500/5 via-background to-background",
      imageOverlayClass: "from-blue-500/20 via-blue-500/5 to-transparent",
      badgeClass: "bg-blue-500/10 text-blue-500 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]",
      icon: <Sparkles className="w-3 h-3" />,
      textColor: "text-blue-500",
      glowClass: "bg-blue-500/20",
    },
    DEFAULT: {
      wrapperClass: "border-border/50 hover:border-primary/50 hover:shadow-[0_0_25px_rgba(var(--primary),0.15)] bg-gradient-to-br from-primary/5 via-background to-background",
      imageOverlayClass: "from-primary/10 via-background/5 to-transparent",
      badgeClass: "bg-primary/10 text-primary border-primary/20",
      icon: <Layers className="w-3 h-3" />,
      textColor: "text-primary",
      glowClass: "bg-primary/20",
    }
  };

  const currentConfig = isGameItem && gameItem.type 
    ? itemTypeConfig[gameItem.type as ItemType] || itemTypeConfig.DEFAULT 
    : itemTypeConfig.DEFAULT;

  const handleView = () => {
    if (onView) {
      onView(activeItem);
    }
  };

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(activeItem);
    else if (activeAction === "edit" && onEdit) onEdit(activeItem);
    else if (activeAction === "delete" && onDelete) onDelete(activeItem);
    else handleView();
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuy && gameItem) {
      onBuy(gameItem.id);
    }
  };

  const extraActions: extraActionsProps[] = [];
  if (isGameItem && showBuyButton) {
    extraActions.push({
      id: "buy",
      label: "Acheter",
      icon: ShoppingBag,
      onClick: () => {
        if (onBuy && gameItem) onBuy(gameItem.id);
      }
    });
  }

  const hasActions = onEdit || onView || onDelete || extraActions.length > 0;

  // Rendu de l'image premium
  const renderImage = () => {
    const imageSrc = gameItem?.icon || game?.profileImage || game?.coverImage;
    
    return (
      <div className={cn(
        "relative overflow-hidden rounded-xl bg-muted aspect-square",
        isCompact ? "" : "border border-white/5"
      )}>
        {/* Background Blur si pas d'image parfaite */}
        {imageSrc && (
          <Image
            src={imageSrc}
            alt="blur bg"
            fill
            className="object-cover opacity-30 blur-xl scale-150"
          />
        )}
        
        {/* Gradient Overlay */}
        <div className={cn("absolute inset-0 bg-gradient-to-b opacity-80", currentConfig.imageOverlayClass)} />
        
        {/* Image Principale */}
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={activeItem?.name ?? `image ${activeItem?.id}`}
            fill
            className={cn(
              "object-contain transition-all duration-700 ease-out z-10 p-2",
              isHovered && "scale-110 drop-shadow-2xl"
            )}
            sizes={isList ? "120px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            {isGameItem ? (
              <Coins className={cn("w-12 h-12 md:w-16 md:h-16 opacity-30", currentConfig.textColor)} />
            ) : (
              <Gamepad2 className="w-12 h-12 md:w-16 md:h-16 text-primary/30" />
            )}
          </div>
        )}

        {/* Shine effect au hover */}
        <div className={cn(
          "absolute inset-0 -translate-x-[150%] skew-x-[-30deg] bg-gradient-to-r from-transparent via-white/10 to-transparent z-20 transition-transform duration-1000",
          isHovered && "translate-x-[150%]"
        )} />
        
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-30">
          {isGameItem && gameItem.type && (
            <Badge className={cn(
              "gap-1 px-2 py-0.5 text-[10px] md:text-xs backdrop-blur-md uppercase tracking-wider font-bold",
              currentConfig.badgeClass
            )}>
              {currentConfig.icon}
              {gameItemTypeLabel(gameItem.type)}
            </Badge>
          )}
          {game?.featured && (
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 gap-1 text-[10px] md:text-xs shadow-lg shadow-amber-500/20 uppercase tracking-widest font-black">
              <Crown className="w-3 h-3" />
              Vedette
            </Badge>
          )}
        </div>

        {/* Menu d'actions (overlay absolu en haut à droite) */}
        {!isList && hasActions && (
          <div className="absolute top-2 right-2 z-30" onClick={(e) => e.stopPropagation()}>
            <CardActionMenu
              onEdit={onEdit ? () => onEdit(activeItem) : undefined}
              onView={onView ? () => onView(activeItem) : undefined}
              onDelete={onDelete ? () => onDelete(activeItem) : undefined}
              entityName={isGameItem ? `l'item ${activeItem.name}` : `le jeu ${activeItem.name}`}
              extraActions={extraActions}
            />
          </div>
        )}
      </div>
    );
  };

  // Rendu du contenu premium
  const renderContent = () => {
    if (isCompact) {
      return (
        <div className="flex items-center gap-3 w-full">
          <div className="w-12 h-12 shrink-0">
            {renderImage()}
          </div>
          <div className="flex-1 min-w-0">
            <Typography variant="body-sm" weight="bold" className="truncate text-foreground group-hover:text-primary transition-colors">
              {activeItem?.name}
            </Typography>
            <div className="flex items-center justify-between mt-0.5">
              {isGameItem ? (
                <div className="flex items-center gap-1">
                  <span className={cn("text-xs font-black", currentConfig.textColor)}>
                    {gameItem.priceGtc}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-bold">GTC</span>
                </div>
              ) : (
                <Typography variant="caption2" theme="muted" className="flex items-center gap-1">
                  <Gamepad2 className="w-3 h-3" />
                  {game?.gameItems?.length || 0} items
                </Typography>
              )}
              {hasActions && (
                <div onClick={(e) => e.stopPropagation()} className="shrink-0 relative z-10">
                  <CardActionMenu
                    onEdit={onEdit ? () => onEdit(activeItem) : undefined}
                    onView={onView ? () => onView(activeItem) : undefined}
                    onDelete={onDelete ? () => onDelete(activeItem) : undefined}
                    entityName={isGameItem ? `l'item ${activeItem.name}` : `le jeu ${activeItem.name}`}
                    extraActions={extraActions}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-3 flex flex-col h-full">
        {/* En-tête */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Typography
              variant={isList ? "h5" : "body-base"}
              weight="bold"
              className={cn(
                "line-clamp-1 transition-colors group-hover:text-transparent group-hover:bg-clip-text",
                isGameItem ? `group-hover:bg-gradient-to-r group-hover:from-${currentConfig.textColor.split('-')[1]}-500 group-hover:to-primary` : "group-hover:text-primary"
              )}
            >
              {activeItem?.name}
            </Typography>
            
            {showDetails && (
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {isGameItem && gameItem.game && (
                  <Badge variant="secondary" className="text-[10px] bg-secondary/50 backdrop-blur-sm border-white/5 hover:bg-secondary/80 transition-colors">
                    <Gamepad2 className="w-3 h-3 mr-1 text-muted-foreground" />
                    <span className="text-muted-foreground font-medium">{gameItem.game.name}</span>
                  </Badge>
                )}
                {!isGameItem && game?.publisher && (
                  <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground">
                    {game.publisher}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {isList && hasActions && (
            <div onClick={(e) => e.stopPropagation()} className="shrink-0 relative z-10">
              <CardActionMenu
                onEdit={onEdit ? () => onEdit(activeItem) : undefined}
                onView={onView ? () => onView(activeItem) : undefined}
                onDelete={onDelete ? () => onDelete(activeItem) : undefined}
                entityName={isGameItem ? `l'item ${activeItem.name}` : `le jeu ${activeItem.name}`}
                extraActions={extraActions}
              />
            </div>
          )}
        </div>

        {/* Description */}
        {showDetails && activeItem?.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed flex-1">
            {activeItem?.description}
          </p>
        )}

        {/* Statistiques e-sport */}
        {showStats && (
          <div className="grid grid-cols-2 gap-2 py-3 mt-auto">
            {isGameItem ? (
              <>
                <div className="bg-background/50 rounded-lg p-2 border border-white/5 text-center transition-colors group-hover:border-white/10">
                  <div className="text-xs font-black text-foreground">
                    {gameItem.minOrder || 1}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    Min. Cmd
                  </div>
                </div>
                <div className="bg-background/50 rounded-lg p-2 border border-white/5 text-center transition-colors group-hover:border-white/10">
                  <div className="text-xs font-black text-foreground">
                    {gameItem.processingTime || "24h"}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    Délai
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="bg-background/50 rounded-lg p-2 border border-white/5 text-center transition-colors group-hover:border-white/10">
                  <div className="flex items-center justify-center gap-1 text-xs font-black text-foreground">
                    <TrendingUp className="w-3 h-3 text-primary" />
                    {game?.popularity || 0}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    Popularité
                  </div>
                </div>
                <div className="bg-background/50 rounded-lg p-2 border border-white/5 text-center transition-colors group-hover:border-white/10">
                  <div className="flex items-center justify-center gap-1 text-xs font-black text-foreground">
                    <Users className="w-3 h-3 text-primary" />
                    {game?.gameItems?.length || 0}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-muted-foreground mt-0.5">
                    Items
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Prix et actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-auto">
          <div>
            {isGameItem ? (
              <div className="flex items-end gap-1">
                <span className={cn("text-lg font-black italic tracking-tighter leading-none", currentConfig.textColor)}>
                  {gameItem.priceGtc}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground mb-0.5">GTC</span>
              </div>
            ) : (
              <Badge variant="secondary" className="text-[10px] font-medium text-muted-foreground">
                {game?.genre}
              </Badge>
            )}
          </div>

          {showActions && (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              {showLikeButton && (
                <div className="hidden sm:block">
                  <InteractionButton
                    type="like"
                    entityType={isGameItem ? "PRODUCT" : "GAME"}
                    entityId={activeItem?.id ?? ""}
                    iconOnly
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 rounded-full hover:bg-white/5"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => { e.stopPropagation(); handleView(); }}
                  className="h-8 px-2 text-xs hover:bg-white/5 hover:text-foreground text-muted-foreground transition-colors"
                >
                  Détails
                </Button>
                {isGameItem && showBuyButton && (
                  <Button
                    size="sm"
                    onClick={handleBuy}
                    className={cn(
                      "h-8 gap-1.5 font-bold shadow-lg transition-all",
                      `bg-${currentConfig.textColor.split('-')[1]}-500 hover:bg-${currentConfig.textColor.split('-')[1]}-600 text-white`,
                      isHovered && `shadow-${currentConfig.textColor.split('-')[1]}-500/25`
                    )}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
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
          "group cursor-pointer transition-all duration-300 relative overflow-hidden backdrop-blur-md bg-card/80",
          currentConfig.wrapperClass,
          isCliquable && "active:scale-[0.99]",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleMainAction}
      >
        <div className="flex flex-col sm:flex-row gap-4 p-4 relative z-10">
          <div className="w-full sm:w-40 shrink-0">
            {renderImage()}
          </div>
          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>
        </div>
      </Card>
    );
  }

  if (isGrid) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="h-full"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <Card
          className={cn(
            "group cursor-pointer h-full overflow-hidden transition-all duration-300 relative backdrop-blur-md bg-card/80",
            currentConfig.wrapperClass,
            isCliquable && "active:scale-[0.99]",
            className
          )}
          onClick={handleMainAction}
        >
          {/* Lueur de fond premium */}
          <div className={cn(
            "absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-0 transition-opacity duration-500",
            currentConfig.glowClass,
            isHovered && "opacity-50"
          )} />
          
          <div className="p-3 md:p-4 space-y-3 md:space-4 h-full flex flex-col relative z-10">
            {renderImage()}
            <div className="flex-1 flex flex-col">
              {renderContent()}
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Mode compact
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 relative overflow-hidden bg-card/80 backdrop-blur-sm",
        currentConfig.wrapperClass,
        isCliquable && "hover:bg-accent/50 active:scale-[0.99]",
        className
      )}
      onClick={handleMainAction}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-2 relative z-10">
        {renderContent()}
      </div>
    </Card>
  );
}