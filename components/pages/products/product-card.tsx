// components/pages/products/product-card.tsx
"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingBag,
  Star,
  Eye,
  Heart,
  Shield,
  Trophy,
  Clock,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { QrCode } from "lucide-react";
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
  product: {
    id: string;
    name: string;
    description?: string;
    price: string | number;
    currency?: string;
    images?: string[];
    featuredImage?: string;
    status?: string;
    game?: string;
    platform?: string;
    category?: string;
    tags?: string[];
    rating?: number;
    totalSales?: number;
    views?: number;
    stock?: number;
    isFeatured?: boolean;
    isHot?: boolean;
    discount?: number;
    // Gaming-specific fields
    level?: number;
    rank?: string;
    hoursPlayed?: number;
    achievements?: number;
    itemsOwned?: number;
    isVerified?: boolean;
    isBoosted?: boolean;
  };
  shopId?: string;
  viewMode?: "grid" | "list" | "compact";
  showActions?: boolean;
  className?: string;
  onView?: () => void;
  onBuy?: () => void;
}

export function ProductCard({
  product,
  shopId,
  viewMode = "grid",
  showActions = true,
  className,
  onView,
  onBuy,
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isGrid = viewMode === "grid";
  const isList = viewMode === "list";
  const isCompact = viewMode === "compact";

  const images =
    product.images || (product.featuredImage ? [product.featuredImage] : []);
  const price =
    typeof product.price === "number"
      ? product.price.toFixed(2)
      : parseFloat(product.price as string).toFixed(2);

  const originalPrice = product.discount
    ? (parseFloat(price) / (1 - product.discount / 100)).toFixed(2)
    : null;

  const statusColors: Record<string, string> = {
    NON_VENDU: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    RESERVE: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    EN_ECHANGE: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    LIVRE: "bg-green-500/10 text-green-600 border-green-500/20",
    VENDU: "bg-gray-500/10 text-gray-600 border-gray-500/20",
    ANNULER: "bg-red-500/10 text-red-600 border-red-500/20",
  };

  const statusLabels: Record<string, string> = {
    NON_VENDU: "Disponible",
    RESERVE: "Réservé",
    EN_ECHANGE: "En échange",
    LIVRE: "Livré",
    VENDU: "Vendu",
    ANNULER: "Annulé",
  };

  const platformIcons: Record<string, string> = {
    PC: "🖥️",
    PLAYSTATION: "🎮",
    XBOX: "🎮",
    NINTENDO_SWITCH: "🎮",
    MOBILE: "📱",
    VR: "👓",
    OTHER: "🎯",
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const renderImageGallery = () => (
    <div className="relative overflow-hidden aspect-[4/3] rounded-xl bg-linear-to-br from-primary/5 to-primary/10 group">
      <AnimatePresence mode="wait">
        {images.length > 0 ? (
          <motion.div
            key={currentImageIndex}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: isHovered ? 1.05 : 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="relative w-full h-full"
          >
            <Image
              src={images[currentImageIndex]}
              alt={`${product.name} - Screenshot ${currentImageIndex + 1}`}
              fill
              className="object-cover"
            />
          </motion.div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Gamepad2 className="h-16 w-16 text-primary/20" />
          </div>
        )}
      </AnimatePresence>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Top badges */}
      <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 z-10">
        {product.isFeatured && (
          <Badge className="bg-linear-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg text-xs px-2 py-0.5">
            <Star className="h-3 w-3 mr-1" />
            Vedette
          </Badge>
        )}
        {product.isHot && (
          <Badge className="bg-linear-to-r from-red-500 to-pink-500 text-white border-0 shadow-lg text-xs px-2 py-0.5">
            <TrendingUp className="h-3 w-3 mr-1" />
            Populaire
          </Badge>
        )}
        {product.isVerified && (
          <Badge className="bg-linear-to-r from-blue-500 to-cyan-500 text-white border-0 shadow-lg text-xs px-2 py-0.5">
            <Shield className="h-3 w-3 mr-1" />
            Vérifié
          </Badge>
        )}
        {product.isBoosted && (
          <Badge className="bg-linear-to-r from-purple-500 to-indigo-500 text-white border-0 shadow-lg text-xs px-2 py-0.5">
            <Zap className="h-3 w-3 mr-1" />
            Boosté
          </Badge>
        )}
        {product.discount && (
          <Badge className="bg-linear-to-r from-green-500 to-emerald-500 text-white border-0 shadow-lg text-xs px-2 py-0.5">
            -{product.discount}%
          </Badge>
        )}
      </div>

      {/* Status badge */}
      {product.status && (
        <div className="absolute top-3 right-3 z-10">
          <Badge
            className={cn(
              "text-xs px-2.5 py-1 backdrop-blur-md border font-medium",
              statusColors[product.status] ||
              "bg-gray-500/10 text-gray-600 border-gray-500/20"
            )}
          >
            {statusLabels[product.status] || product.status}
          </Badge>
        </div>
      )}

      {/* Image navigation */}
      {images.length > 1 && isHovered && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 z-10"
        >
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
            onClick={prevImage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm shadow-lg"
            onClick={nextImage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}

      {/* Image indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(index);
              }}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                index === currentImageIndex
                  ? "w-6 bg-white"
                  : "w-1.5 bg-white/50 hover:bg-white/75"
              )}
            />
          ))}
        </div>
      )}

      {/* Quick actions */}
      {isGrid && isHovered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-3 right-3 flex gap-2 z-10"
        >
          <Button
            size="icon"
            variant="secondary"
            className="h-9 w-9 rounded-full bg-background/90 backdrop-blur-sm shadow-lg hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              setIsLiked(!isLiked);
            }}
          >
            <Heart
              className={cn("h-4 w-4", isLiked && "fill-red-500 text-red-500")}
            />
          </Button>
          <Button
            size="icon"
            className="h-9 w-9 rounded-full shadow-lg hover:scale-110 transition-transform"
            onClick={(e) => {
              e.stopPropagation();
              onView?.();
            }}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );

  const renderContent = () => (
    <div className="flex-1 space-y-3">
      {/* Game and Platform */}
      <div className="flex items-center gap-2 flex-wrap">
        {product.game && (
          <Badge
            variant="outline"
            className="text-xs font-medium bg-background/50 backdrop-blur-sm"
          >
            <Gamepad2 className="h-3 w-3 mr-1" />
            {product.game}
          </Badge>
        )}
        {product.platform && (
          <Badge
            variant="outline"
            className="text-xs font-medium bg-background/50 backdrop-blur-sm"
          >
            <span className="mr-1">
              {platformIcons[product.platform] || "🎯"}
            </span>
            {product.platform}
          </Badge>
        )}
        {product.level && (
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
            <Trophy className="h-3 w-3 mr-1" />
            Niv. {product.level}
          </Badge>
        )}
      </div>

      {/* Product name */}
      <div>
        <Typography
          variant={isCompact ? "body-sm" : "body-base"}
          weight="bold"
          className="line-clamp-2 leading-tight"
        >
          {product.name}
        </Typography>
        {product.rank && (
          <Typography
            variant="caption1"
            className="text-primary font-semibold mt-0.5"
          >
            {product.rank}
          </Typography>
        )}
      </div>

      {/* Description */}
      {product.description && !isCompact && (
        <Typography
          variant="caption1"
          theme="muted"
          className="line-clamp-2 leading-relaxed"
        >
          {product.description}
        </Typography>
      )}

      {/* Gaming Stats */}
      {!isCompact && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
          {product.hoursPlayed !== undefined && (
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span className="font-medium">{product.hoursPlayed}h</span>
            </div>
          )}
          {product.achievements !== undefined && (
            <div className="flex items-center gap-1">
              <Trophy className="h-3.5 w-3.5" />
              <span className="font-medium">{product.achievements}</span>
            </div>
          )}
          {product.itemsOwned !== undefined && (
            <div className="flex items-center gap-1">
              <ShoppingBag className="h-3.5 w-3.5" />
              <span className="font-medium">{product.itemsOwned}</span>
            </div>
          )}
          {product.views && (
            <div className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              <span className="font-medium">
                {product.views.toLocaleString()}
              </span>
            </div>
          )}
          {product.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              <span className="font-medium">{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}

      {/* Price and Action */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-2">
            <Typography
              variant="h4"
              weight="extrabold"
              className="text-primary"
            >
              {price}
            </Typography>
            <Typography
              variant="caption1"
              weight="bold"
              className="text-muted-foreground"
            >
              {product.currency || "GTC"}
            </Typography>
          </div>
          {originalPrice && (
            <Typography
              variant="caption2"
              theme="muted"
              className="line-through"
            >
              {originalPrice} {product.currency || "GTC"}
            </Typography>
          )}
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size={isCompact ? "sm" : "default"}
                  className="rounded-xl h-10 w-10 p-0"
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

            <Button
              size={isCompact ? "sm" : "default"}
              onClick={(e) => {
                e.stopPropagation();
                onBuy?.();
              }}
              className="rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
            >
              <ShoppingBag className="h-4 w-4 mr-2" />
              Acheter
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  // Grid view (default)
  if (isGrid) {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="h-full cursor-pointer"
        onClick={onView}
      >
        <Card
          className={cn(
            "h-full overflow-hidden bg-card/40 backdrop-blur-xl border-border/50 shadow-lg hover:shadow-2xl transition-all duration-300",
            "hover:border-primary/30",
            className
          )}
        >
          <CardContent className="p-4 space-y-4">
            {renderImageGallery()}
            {renderContent()}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // List view
  if (isList) {
    return (
      <Card
        className={cn(
          "hover:shadow-lg transition-all bg-card/40 backdrop-blur-xl border-border/50 cursor-pointer",
          className
        )}
        onClick={onView}
      >
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="w-48 flex-shrink-0">{renderImageGallery()}</div>
            {renderContent()}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact view
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="cursor-pointer"
      onClick={onView}
    >
      <Card
        className={cn(
          "hover:shadow-md transition-all bg-card/40 backdrop-blur-xl border-border/50",
          className
        )}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            <div className="w-20 h-20 flex-shrink-0">
              {renderImageGallery()}
            </div>
            {renderContent()}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
