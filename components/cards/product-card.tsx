// @/components/cards/product-card.tsx
"use client";

import { useRouter } from "next/navigation";
import { encodeTransactionQR } from "@/utils/qr-utils";
import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { InteractionButton } from "@/components/shared/interaction-button";
import { BaseCardProps, CardActionMenu, extraActionsProps } from "./card-action-menu";
import { productStatusLabel } from "@/utils/types-label";
import {
  ShoppingBag,
  Gamepad2,
  Star,
  Shield,
  Zap,
  Eye,
  Heart,
  Clock,
  Trophy,
  TrendingUp,
  CheckCircle,
  ExternalLink,
} from "lucide-react";
import { type ProductCard as ProductCardType } from "@/types/view-models";

type GameCategory = "action" | "rpg" | "sports" | "strategy" | "mobile" | "other";

export interface ProductCardProps extends BaseCardProps<
  ProductCardType & {
    description?: string | null;
    stats?: {
      likes?: number;
      purchases?: number;
    };
  }
> {
  showDetails?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  showLikeButton?: boolean;
  showBookmarkButton?: boolean;
  showBuyButton?: boolean;
  onBuy?: (item: ProductCardType & {
    description?: string | null;
    stats?: {
      likes?: number;
      purchases?: number;
    };
  }) => void;
}

export function ProductCard({
  item: product,
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
  showLikeButton = true,
  showBookmarkButton = true,
  showBuyButton = true,
  className,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const isGrid = viewMode === "grid";
  const isList = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  const images = product.images || (product.featuredImage ? [product.featuredImage] : []);
  const price = typeof product.price === "number"
    ? (product.price as number).toFixed(2)
    : parseFloat(product.price as string).toFixed(2);

  const statusConfig = {
    NON_VENDU: { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
    RESERVE: { color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
    VENDU: { color: "bg-gray-500/10 text-gray-600 border-gray-500/20" },
    ANNULER: { color: "bg-red-500/10 text-red-600 border-red-500/20" },
  };

  const platformIcons = {
    PC: "🖥️",
    PLAYSTATION: "🎮",
    XBOX: "🎮",
    NINTENDO_SWITCH: "🎮",
    MOBILE: "📱",
    VR: "👓",
  };

  const gameCategoryStyles: Record<GameCategory, string> = {
    action: "bg-red-500/10 text-red-600 border-red-500/20",
    rpg: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    sports: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    strategy: "bg-green-500/10 text-green-600 border-green-500/20",
    mobile: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
    other: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  };

  const handleView = () => {
    if (onView) {
      onView(product);
    }
  };

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view" && onView) onView(product);
    else if (activeAction === "edit" && onEdit) onEdit(product);
    else if (activeAction === "delete" && onDelete) onDelete(product);
    else handleView();
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuy) {
      onBuy(product);
    } else {
      const entryFee = typeof product.price === "number" ? product.price : parseFloat(product.price as string);
      const encodedData = encodeTransactionQR({
        t: "PRODUCT_PURCHASE",
        id: product.id,
        a: entryFee,
        i: images[0] || "/placeholder-game.jpg",
        m: { shopId: product.shop?.id || product?.shop?.id }
      });
      router.push(`/wallet/transactions/create?data=${encodedData}`);
    }
  };

  const extraActions: extraActionsProps[] = [];
  if (showBuyButton && product.status === "NON_VENDU") {
    extraActions.push({
      id: "buy",
      label: "Acheter",
      icon: ShoppingBag,
      onClick: () => {
        const entryFee = typeof product.price === "number" ? product.price : parseFloat(product.price as string);
        const encodedData = encodeTransactionQR({
          t: "PRODUCT_PURCHASE",
          id: product.id,
          a: entryFee,
          i: images[0] || "/placeholder-game.jpg",
          m: { shopId: product.shop?.id }
        });
        router.push(`/wallet/transactions/create?data=${encodedData}`);
      }
    });
  }

  const hasActions = onEdit || onView || onDelete || extraActions.length > 0;

  // Rendu de l'image
  const renderImage = () => (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 aspect-[4/3] group/image">
      {images.length > 0 ? (
        <>
          <Image
            src={images[0]}
            alt={product.name}
            fill
            className={cn(
              "object-cover transition-transform duration-500",
              isHovered && "scale-105"
            )}
            sizes={isList ? "200px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-300" />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Gamepad2 className="w-12 h-12 text-primary/30" />
        </div>
      )}

      {/* Badges */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10 items-center">
        {product.isFeatured && (
          <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 text-xs">
            <Star className="w-3 h-3 mr-1" />
            Vedette
          </Badge>
        )}
        {product.status && (
          <Badge className={cn(
            "text-xs backdrop-blur-md border",
            statusConfig[product.status as keyof typeof statusConfig]?.color || 
            "bg-gray-500/10 text-gray-600 border-gray-500/20"
          )}>
            {productStatusLabel(product.status)}
          </Badge>
        )}
      </div>

      {/* Action Menu (overlay absolute in top-right) */}
      {isGrid && hasActions && (
        <div className="absolute top-3 right-3 z-20" onClick={(e) => e.stopPropagation()}>
          <CardActionMenu
            onEdit={onEdit ? () => onEdit(product) : undefined}
            onView={onView ? () => onView(product) : undefined}
            onDelete={onDelete ? () => onDelete(product) : undefined}
            entityName={`le produit ${product.name}`}
            extraActions={extraActions}
          />
        </div>
      )}

      {/* Quick actions for grid */}
      {isGrid && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={isHovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          className="absolute bottom-3 right-3 flex gap-2 z-10"
        >
          {showLikeButton && (
            <InteractionButton
              type="like"
              entityType="PRODUCT"
              entityId={product.id}
              iconOnly
              size="sm"
              variant="default"
            />
          )}
          {showBookmarkButton && (
            <InteractionButton
              type="bookmark"
              entityType="PRODUCT"
              entityId={product.id}
              iconOnly
              size="sm"
              variant="default"
            />
          )}
        </motion.div>
      )}
    </div>
  );

  // Rendu du contenu
  const renderContent = () => {
    if (isCompact) {
      return (
        <div className="flex items-center gap-3">
          <div className="w-16 h-16 shrink-0">
            {renderImage()}
          </div>
          <div className="flex-1 min-w-0">
            <Typography variant="body-sm" weight="semibold" className="truncate">
              {product.name}
            </Typography>
            <div className="flex items-center justify-between mt-1">
              <Typography variant="body-sm" weight="bold" className="text-primary">
                {price} {product.currency || "GTC"}
              </Typography>
              {isCompact && hasActions && (
                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                  <CardActionMenu
                    onEdit={onEdit ? () => onEdit(product) : undefined}
                    onView={onView ? () => onView(product) : undefined}
                    onDelete={onDelete ? () => onDelete(product) : undefined}
                    entityName={`le produit ${product.name}`}
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
      <div className="space-y-3">
        {/* Informations du jeu */}
        <div className="flex items-center gap-2 flex-wrap">
          {product.game && (
            <Badge variant="outline" className="text-xs">
              <Gamepad2 className="w-3 h-3 mr-1" />
              {product.game}
            </Badge>
          )}
          {product.platform && (
            <Badge variant="outline" className="text-xs">
              <span className="mr-1">
                {platformIcons[product.platform as keyof typeof platformIcons] || "🎯"}
              </span>
              {product.platform}
            </Badge>
          )}
          {product.category && (
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                gameCategoryStyles[product.category.slug as GameCategory] || 
                gameCategoryStyles.other
              )}
            >
              {product.category.name}
            </Badge>
          )}
        </div>

        {/* Nom et description */}
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <Typography
              variant={isList ? "h5" : "body-base"}
              weight="bold"
              className="line-clamp-1 group-hover:text-primary transition-colors"
            >
              {product.name}
            </Typography>
            {showDetails && product.description && (
              <Typography
                variant="body-sm"
                theme="muted"
                className="line-clamp-2 mt-1 leading-relaxed"
              >
                {product.description}
              </Typography>
            )}
          </div>

          {isList && hasActions && (
            <div onClick={(e) => e.stopPropagation()} className="shrink-0">
              <CardActionMenu
                onEdit={onEdit ? () => onEdit(product) : undefined}
                onView={onView ? () => onView(product) : undefined}
                onDelete={onDelete ? () => onDelete(product) : undefined}
                entityName={`le produit ${product.name}`}
                extraActions={extraActions}
              />
            </div>
          )}
        </div>

        {/* Statistiques */}
        {showStats && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            {(product?.viewCount ?? 0) > 0 && (
              <div className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {product.viewCount}
              </div>
            )}
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-amber-500" />
              4.8
            </div>
          </div>
        )}

        {/* Prix et actions */}
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          <div>
            <Typography variant="h5" weight="bold" className="text-primary">
              {price} {product.currency || "GTC"}
            </Typography>
            {product.isNegotiable && (
              <Typography variant="caption2" theme="muted">
                Prix négociable
              </Typography>
            )}
          </div>

          {showActions && (
            <div className="flex items-center gap-2">
              {showLikeButton && !isGrid && (
                <InteractionButton
                  type="like"
                  entityType="PRODUCT"
                  entityId={product.id}
                  iconOnly
                  size="sm"
                  variant="ghost"
                />
              )}
              {showBuyButton && (
                <Button
                  size={isList ? "default" : "sm"}
                  onClick={handleBuy}
                  className="gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30"
                >
                  <ShoppingBag className="w-4 h-4" />
                  Acheter
                </Button>
              )}
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
          "group cursor-pointer transition-all hover:shadow-lg relative overflow-hidden",
          isCliquable && "active:scale-[0.99]",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleMainAction}
      >
        <div className="flex gap-4 p-4">
          <div className="w-48 flex-shrink-0">
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
            "group cursor-pointer h-full overflow-hidden transition-all hover:shadow-xl border-border/50 relative",
            isCliquable && "active:scale-[0.99]",
            className
          )}
          onClick={handleMainAction}
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
      className={cn("cursor-pointer hover:shadow-md relative overflow-hidden", className)}
      onClick={handleMainAction}
    >
      <CardContent className="p-3">
        {renderContent()}
      </CardContent>
    </Card>
  );
}