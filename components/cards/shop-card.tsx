// @/components/cards/shop-card.tsx
"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { InteractionButton } from "@/components/shared/interaction-button";
import {
  Store,
  MapPin,
  Package,
  Eye,
  Star,
  Shield,
  Award,
  ChevronRight,
  Users,
  Globe,
  Phone,
  MoreVertical,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type ShopCard as ShopCardType } from "@/types/view-models";

// Types simplifiés
type ViewMode = "grid" | "list" | "compact";
type CardVariant = "default" | "premium" | "admin";

interface ShopCardProps {
  shop: ShopCardType & {
    stats?: {
      productCount?: number;
      rating?: number;
      followersCount?: number;
    };
  };
  viewMode?: ViewMode;
  variant?: CardVariant;
  showDetails?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  showFollowButton?: boolean;
  showLikeButton?: boolean;
  showQuickActions?: boolean;
  onView?: (shopId: string) => void;
  onFollow?: (shopId: string) => void;
  onLike?: (shopId: string) => void;
  className?: string;
}

export function ShopCard({
  shop,
  viewMode = "grid",
  variant = "default",
  showDetails = true,
  showStats = true,
  showActions = true,
  showFollowButton = true,
  showLikeButton = false,
  showQuickActions = true,
  onView,
  onFollow,
  onLike,
  className,
}: ShopCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isGrid = viewMode === "grid";
  const isList = viewMode === "list";
  const isCompact = viewMode === "compact";
  const isAdmin = variant === "admin";
  const isPremium = variant === "premium";

  const stats = {
    products: shop.productCount || shop.stats?.productCount || 0,
    rating: shop.stats?.rating || 4.5,
    followers: shop.stats?.followersCount || shop.viewCount || 0,
  };

  const handleView = () => {
    if (onView) {
      onView(shop.id);
    }
  };

  // Rendu du contenu selon le mode
  const renderContent = () => {
    if (isCompact) {
      return (
        <div className="flex items-center gap-3">
          <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-primary/10 to-primary/20">
            {shop.profileImage ? (
              <Image
                src={shop.profileImage}
                alt={shop.name}
                fill
                className="object-cover"
              />
            ) : (
              <Store className="w-6 h-6 text-primary absolute inset-0 m-auto" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <Typography
              variant="body-sm"
              weight="semibold"
              className="truncate"
            >
              {shop.name}
            </Typography>
            <Typography variant="caption2" theme="muted" className="truncate">
              {stats.products} produits
            </Typography>
          </div>
          {showFollowButton && (
            <InteractionButton
              type="follow"
              entityType="SHOP"
              entityId={shop.id}
              iconOnly
              size="sm"
              variant="ghost"
            />
          )}
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {/* En-tête avec nom et badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Typography
              variant={isList ? "h4" : "h5"}
              weight="bold"
              className="line-clamp-1 group-hover:text-primary transition-colors"
            >
              {shop.name}
            </Typography>
            
            {showDetails && (
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {shop.country && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3" />
                    {shop.country}
                  </div>
                )}
                {shop.owner && (
                  <Typography variant="caption2" theme="muted" className="truncate">
                    Par {shop.owner.username}
                  </Typography>
                )}
              </div>
            )}
          </div>

          {/* Badges */}
          {showDetails && (
            <div className="flex flex-col gap-1 items-end">
              {shop.verified && (
                <Badge
                  variant="outline"
                  className="gap-1 px-2 py-0.5 text-xs bg-green-500/10 border-green-500/20 text-green-600"
                >
                  <Shield className="w-3 h-3" />
                  Vérifié
                </Badge>
              )}
              {shop.featured && (
                <Badge
                  variant="outline"
                  className="gap-1 px-2 py-0.5 text-xs bg-amber-500/10 border-amber-500/20 text-amber-600"
                >
                  <Award className="w-3 h-3" />
                  Vedette
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Description */}
        {showDetails && shop.description && (
          <Typography
            variant="body-sm"
            theme="muted"
            className="line-clamp-2 leading-relaxed"
          >
            {shop.description}
          </Typography>
        )}

        {/* Statistiques */}
        {showStats && (
          <div className="grid grid-cols-3 gap-2 py-2 border-y border-border/50">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                <Package className="w-4 h-4" />
                {stats.products}
              </div>
              <Typography variant="caption2" theme="muted">
                Produits
              </Typography>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                <Eye className="w-4 h-4" />
                {shop.viewCount || 0}
              </div>
              <Typography variant="caption2" theme="muted">
                Vues
              </Typography>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                {stats.rating.toFixed(1)}
              </div>
              <Typography variant="caption2" theme="muted">
                Note
              </Typography>
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              {showFollowButton && (
                <InteractionButton
                  type="follow"
                  entityType="SHOP"
                  entityId={shop.id}
                  size="sm"
                  variant="outline"
                  withCount={false}
                />
              )}
              {showLikeButton && (
                <InteractionButton
                  type="like"
                  entityType="SHOP"
                  entityId={shop.id}
                  size="sm"
                  variant="ghost"
                  iconOnly
                />
              )}
            </div>
            
            <Button
              size="sm"
              variant={isPremium ? "default" : "outline"}
              className="gap-2 group/btn"
              onClick={handleView}
            >
              Visiter
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </Button>
          </div>
        )}

        {/* Quick actions menu */}
        {showQuickActions && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {shop.website && (
                <DropdownMenuItem onClick={() => window.open((shop?.website ?? ''), '_blank')}>
                  <Globe className="w-4 h-4 mr-2" />
                  Site web
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <DropdownMenuItem>
                  <Users className="w-4 h-4 mr-2" />
                  Gérer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  // Rendu de l'image
  const renderImage = () => (
    <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 to-primary/20 aspect-[4/3]">
      {shop.coverImage ? (
        <Image
          src={shop.coverImage}
          alt={shop.name}
          fill
          className={cn(
            "object-cover transition-transform duration-500",
            isHovered && "scale-105"
          )}
          sizes={isList ? "200px" : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Store className={cn(
            "text-primary/30",
            isPremium ? "w-16 h-16" : "w-12 h-12"
          )} />
        </div>
      )}
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Photo de profil */}
      <div className="absolute bottom-3 left-3">
        <div className="relative w-12 h-12 rounded-full border-4 border-background overflow-hidden bg-background">
          {shop.profileImage ? (
            <Image
              src={shop.profileImage}
              alt={shop.name}
              fill
              className="object-cover"
            />
          ) : (
            <Store className="w-6 h-6 text-primary absolute inset-0 m-auto" />
          )}
        </div>
      </div>
    </div>
  );

  // Rendu selon le mode de vue
  if (isList) {
    return (
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-300 hover:shadow-lg",
          isPremium && "border-primary/20 bg-gradient-to-br from-primary/5 to-transparent",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleView}
      >
        <div className="flex gap-4 p-4">
          <div className="w-48 flex-shrink-0">{renderImage()}</div>
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
            "group cursor-pointer h-full overflow-hidden transition-all duration-300 hover:shadow-xl border-border/50",
            isPremium && "border-primary/30 bg-gradient-to-br from-primary/5 to-transparent",
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
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        className
      )}
      onClick={handleView}
    >
      <CardContent className="p-3">
        {renderContent()}
      </CardContent>
    </Card>
  );
}