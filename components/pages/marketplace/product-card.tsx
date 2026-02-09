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
  Swords,
  Crown,
  Target,
  MapPin,
  Coins,
  MessageCircle,
  Store,
} from "lucide-react";
import type { Product } from "@/database/schema";
import { useRouter } from "next/navigation";
import { QrCode, ShoppingCart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TransactionQRCode } from "@/components/shared/qr-code";
import { encodeTransactionQR } from "@/utils/qr-utils";

interface ProductCardProps {
  product: Product & {
    category?: {
      name: string;
      slug: string;
    };
    shop?: {
      name: string;
      country?: string;
      verified?: boolean;
      profileImage?: string;
      ownerId?: string;
    };
    stats?: {
      views: number;
      likes: number;
    };
  };
  viewMode?: "grid" | "list";
  showDetails?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  showLikeButton?: boolean;
  showBookmarkButton?: boolean;
  showBuyButton?: boolean;
  onView?: (productId: string) => void;
  onBuy?: (productId: string) => void;
  className?: string;
}

export function ProductCard({
  product,
  viewMode = "grid",
  showDetails = true,
  showStats = true,
  showActions = true,
  showLikeButton = true,
  showBookmarkButton = true,
  showBuyButton = true,
  onView,
  onBuy,
  className,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const router = useRouter();
  const isGrid = viewMode === "grid";

  const images =
    product.images || (product.featuredImage ? [product.featuredImage] : []);
  const price =
    typeof product.price === "number"
      ? (product.price as number).toFixed(2)
      : parseFloat(product.price as string).toFixed(2);

  const statusConfig = {
    NON_VENDU: { label: "Disponible", color: "bg-green-600 text-white" },
    RESERVE: { label: "Réservé", color: "bg-amber-500 text-amber-950" },
    VENDU: {
      label: "Vendu",
      color: "bg-destructive text-destructive-foreground",
    },
    ANNULER: { label: "Annulé", color: "bg-gray-600 text-gray-300" },
  };

  const platformIcons = {
    PC: "💻",
    PLAYSTATION: "🎮",
    XBOX: "🎮",
    NINTENDO_SWITCH: "🎮",
    MOBILE: "📱",
    VR: "👓",
  };

  const handleView = () => {
    if (onView) {
      onView(product.id);
    } else {
      router.push(`/marketplace/${product.id}`);
    }
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onBuy) {
      onBuy(product.id);
    } else {
      // Redirection vers la page de transaction
      const params = new URLSearchParams({
        type: "PURCHASE",
        amount: product.price.toString(),
        entityData: JSON.stringify({
          productId: product.id,
          productName: product.name,
          shopId: product.shopId,
          productType: "ACCOUNT",
        }),
        recipientId: product.userId || product.shop?.ownerId || "",
      });
      router.push(`/wallet/transactions/create?${params.toString()}`);
    }
  };

  const handleShopClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.shopId) {
      router.push(`/shops/${product.shopId}`);
    }
  };

  // Rendu de l'image avec effet gaming
  const renderImage = () => (
    <div
      className={cn(
        "relative overflow-hidden bg-muted group/image",
        isGrid
          ? "aspect-[4/3] rounded-xl"
          : "w-48 h-48 rounded-xl flex-shrink-0",
      )}
    >
      {images.length > 0 ? (
        <>
          <Image
            src={images[0]}
            alt={product.name}
            fill
            className={cn(
              "object-cover transition-transform duration-500",
              isHovered && "scale-110",
            )}
            sizes={
              isGrid
                ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                : "200px"
            }
          />
          {/* Overlay gaming */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-60 group-hover/image:opacity-80 transition-opacity duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity duration-500" />
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
              <Gamepad2 className="w-8 h-8 text-primary" />
            </div>
          </div>
        </div>
      )}

      {/* Badges gaming */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        {product.isFeatured && (
          <Badge className="bg-amber-500 text-amber-950 border-none text-xs font-bold">
            <Zap className="w-3 h-3 mr-1" />
            Vedette
          </Badge>
        )}
        {product.shop?.verified && (
          <Badge className="bg-green-600 text-white border-none text-xs">
            <Shield className="w-3 h-3 mr-1" />
            Vérifié
          </Badge>
        )}
      </div>

      {/* Status Badge */}
      <div className="absolute top-3 right-3 z-10">
        <Badge
          className={cn(
            "border-none text-xs font-bold",
            statusConfig[product.status as keyof typeof statusConfig]?.color ||
            "bg-gray-600",
          )}
        >
          {statusConfig[product.status as keyof typeof statusConfig]?.label ||
            product.status}
        </Badge>
      </div>

      {/* Platform icon */}
      {product.platform && (
        <div className="absolute bottom-3 left-3 z-10">
          <Badge className="bg-background/80 backdrop-blur-sm border">
            <span className="mr-1">
              {platformIcons[product.platform as keyof typeof platformIcons] ||
                "🎮"}
            </span>
            {product.platform}
          </Badge>
        </div>
      )}

      {/* Quick actions */}
      {isGrid && isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
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
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            />
          )}
        </motion.div>
      )}
    </div>
  );

  // Rendu du contenu
  const renderContent = () => (
    <div className={cn("space-y-3", !isGrid && "flex-1")}>
      {/* Informations du jeu */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {product.game && (
            <Badge variant="outline" className="text-xs">
              <Gamepad2 className="w-3 h-3 mr-1" />
              {product.game.length > 15
                ? `${product.game.substring(0, 15)}...`
                : product.game}
            </Badge>
          )}
          {product.accountRank && (
            <Badge
              variant="outline"
              className="text-xs border-primary/50 text-primary"
            >
              <Swords className="w-3 h-3 mr-1" />
              {product.accountRank}
            </Badge>
          )}
        </div>
        {product.accountLevel && (
          <Badge
            variant="outline"
            className="text-xs border-amber-500/50 text-amber-500"
          >
            <Target className="w-3 h-3 mr-1" />
            Lvl {product.accountLevel}
          </Badge>
        )}
      </div>

      {/* Nom */}
      <Typography
        variant="body-base"
        weight="bold"
        className={cn(
          "group-hover:text-primary transition-colors",
          isGrid ? "line-clamp-1" : "line-clamp-2",
        )}
      >
        {product.name}
      </Typography>

      {/* Description pour le mode liste */}
      {!isGrid && product.description && (
        <Typography
          variant="body-sm"
          className="text-muted-foreground line-clamp-2"
        >
          {product.description}
        </Typography>
      )}

      {/* Shop info */}
      {product.shop && (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 gap-1"
            onClick={handleShopClick}
          >
            <Store className="w-3 h-3" />
            <Typography variant="caption2" className="truncate">
              {product.shop.name}
              {product.shop.country && (
                <span className="ml-1">• {product.shop.country}</span>
              )}
            </Typography>
          </Button>
        </div>
      )}

      {/* Statistiques */}
      {showStats && (
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            {product.viewCount || 0}
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-amber-500" />
            4.8
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-primary" />
            Instant
          </div>
        </div>
      )}

      {/* Prix et actions */}
      <div
        className={cn(
          "flex items-center justify-between",
          isGrid ? "pt-3 border-t" : "mt-4",
        )}
      >
        <div>
          <div className="flex items-baseline gap-1">
            <Coins className="w-4 h-4 text-amber-500" />
            <Typography variant="h5" weight="bold" className="text-primary">
              {price} GTC
            </Typography>
          </div>
          {product.isNegotiable && (
            <Typography variant="caption2" className="text-primary">
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
                className="text-muted-foreground hover:text-primary"
              />
            )}
            {showBuyButton && product.status === "NON_VENDU" && (
              <div className="flex items-center gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-xl"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-xl border-border/50 rounded-[2.5rem] p-0 overflow-hidden">
                    <div className="p-8">
                      <DialogHeader className="mb-6">
                        <DialogTitle className="font-black italic uppercase tracking-tighter text-2xl">Achat Rapide</DialogTitle>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Scannez pour acheter ce produit</p>
                      </DialogHeader>
                      <div className="flex justify-center">
                        <TransactionQRCode
                          data={encodeTransactionQR({
                            t: "PRODUCT_PURCHASE",
                            id: product.id,
                            a: typeof product.price === "number" ? product.price : parseFloat(product.price as string),
                            m: { name: product.name }
                          })}
                          label={product.name}
                          className="shadow-none border-none p-0 bg-transparent"
                        />
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Button size="sm" onClick={handleBuy} className="gap-2 px-4 rounded-xl font-bold">
                  <ShoppingBag className="w-4 h-4" />
                  Acheter
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Rendu selon le mode
  if (viewMode === "list") {
    return (
      <Card
        className={cn(
          "group cursor-pointer transition-all hover:shadow-md bg-card border",
          className,
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleView}
      >
        <div className="flex gap-4 p-4">
          {renderImage()}
          <CardContent className="p-0 flex-1">{renderContent()}</CardContent>
        </div>
      </Card>
    );
  }

  // Mode grid (par défaut)
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          "group cursor-pointer h-full overflow-hidden transition-all hover:shadow-lg border bg-card",
          className,
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
