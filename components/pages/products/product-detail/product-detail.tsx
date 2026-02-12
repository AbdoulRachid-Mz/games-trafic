"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  Heart,
  Share2,
  Shield,
  Store,
  Gamepad2,
  Calendar,
  Star,
  MessageCircle,
  ChevronRight,
  Check,
  Lock,
  Zap,
  BadgeCheck,
  User,
  Trophy,
  Swords,
  Crown,
  Target,
  Scroll,
  QrCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";
import { useAuthContext } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InteractionButton } from "@/components/shared/interaction-button";
import { CommentsSection } from "@/components/comments/comments-section";
import { useProduct } from "@/hooks/use-products";
import type { ProductWithRelations } from "@/database/schema";
import { ProductCard } from "@/components/cards/product-card";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { TransactionQRCode } from "@/components/shared/qr-code";
import { encodeTransactionQR } from "@/utils/qr-utils";

interface ProductDetailProps {
  productId: string;
  initialProduct: ProductWithRelations;
  initialRelated: ProductWithRelations[];
}

export function ProductDetail({ productId, initialProduct, initialRelated }: ProductDetailProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();

  const { data: product, isLoading } = useProduct(productId, {
    populate: ["shop", "category", "user"]
  });

  const currentProduct = product || initialProduct;
  const [activeTab, setActiveTab] = useState("description");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const mainImage = currentProduct.images && currentProduct.images.length > 0
    ? currentProduct.images[selectedImageIndex]
    : "/placeholder-product.jpg";

  const isOwner = user && currentProduct && (user.id === currentProduct.userId || user.id === currentProduct.shop?.ownerId);
  const isAvailable = currentProduct.status === "NON_VENDU" || currentProduct.status === "RESERVE";
  const images = currentProduct.images && currentProduct.images.length > 0 ? currentProduct.images : [mainImage];

  const handleBuy = () => {
    if (!isAuthenticated) {
      toast.error("Vous devez être connecté pour acheter.");
      router.push(`/auth/sign-in?callbackUrl=/products/${currentProduct.id}`);
      return;
    }

    if (isOwner) {
      toast.error("Vous ne pouvez pas acheter votre propre compte.");
      return;
    }

    if (!isAvailable) {
      toast.error("Ce compte n'est plus disponible.");
      return;
    }

    const params = new URLSearchParams({
      type: "PURCHASE",
      amount: currentProduct.price.toString(),
      entityData: JSON.stringify({
        productId: currentProduct.id,
        productName: currentProduct.name,
        shopId: currentProduct.shopId,
        productType: "ACCOUNT"
      }),
      recipientId: currentProduct.userId || currentProduct.shop?.ownerId || "",
    });

    router.push(`/wallet/transactions/create?${params.toString()}`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Lien copié dans le presse-papier");
  };

  const statusConfig = {
    NON_VENDU: { label: "Disponible", color: "bg-green-600 text-white" },
    RESERVE: { label: "Réservé", color: "bg-amber-500 text-amber-950" },
    VENDU: { label: "Vendu", color: "bg-destructive text-destructive-foreground" },
  };

  if (isLoading) {
    return <ProductDetailSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4">
        <div className="flex items-center text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            className="hover:text-foreground"
            onClick={() => router.push("/marketplace")}
          >
            Marketplace
          </Button>
          <ChevronRight className="h-4 w-4 mx-2" />
          {currentProduct.category && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="hover:text-foreground"
                onClick={() => router.push(`/categories/${currentProduct.categoryId}`)}
              >
                {currentProduct.category.name}
              </Button>
              <ChevronRight className="h-4 w-4 mx-2" />
            </>
          )}
          <Typography variant="body-sm" weight="medium" className="text-foreground truncate">
            {currentProduct.name}
          </Typography>
        </div>
      </div>

      {/* Product Main Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative aspect-square rounded-xl overflow-hidden border bg-card">
              <Image
                src={mainImage}
                alt={currentProduct.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />

              {/* Status Badge */}
              <div className="absolute top-4 left-4">
                <Badge className={cn(
                  "border-none shadow-lg font-bold",
                  statusConfig[currentProduct.status as keyof typeof statusConfig]?.color
                )}>
                  {statusConfig[currentProduct.status as keyof typeof statusConfig]?.label}
                </Badge>
              </div>

              {/* Game Info */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                <div className="flex items-center gap-2 bg-background/80 backdrop-blur-sm px-3 py-2 rounded-lg">
                  <Gamepad2 className="h-5 w-5" />
                  <Typography variant="body-sm" weight="medium">
                    {currentProduct.game || "Jeu non spécifié"}
                  </Typography>
                </div>

                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  <InteractionButton
                    type="like"
                    entityType="PRODUCT"
                    entityId={currentProduct.id}
                    iconOnly
                    size="sm"
                    variant="secondary"
                    className="bg-background/80 backdrop-blur-sm"
                  />

                  <Button
                    variant="secondary"
                    size="sm"
                    className="bg-background/80 backdrop-blur-sm h-9 w-9"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={cn(
                      "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                      selectedImageIndex === index
                        ? "border-primary"
                        : "border-transparent hover:border-primary/50"
                    )}
                  >
                    <Image
                      src={img}
                      alt={`${currentProduct.name} - Vue ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 25vw, 12.5vw"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Title and Category */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {currentProduct.category && (
                  <Badge variant="outline">
                    {currentProduct.category.name}
                  </Badge>
                )}
                {currentProduct.platform && (
                  <Badge variant="outline">
                    <Gamepad2 className="h-3 w-3 mr-1" />
                    {currentProduct.platform}
                  </Badge>
                )}
              </div>

              <Typography variant="h1" weight="bold" className="text-3xl md:text-4xl">
                {currentProduct.name}
              </Typography>

              {/* Account Stats */}
              <div className="flex items-center gap-4">
                {currentProduct.accountLevel && (
                  <div className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-500" />
                    <div>
                      <Typography variant="caption2" theme="muted">Niveau</Typography>
                      <Typography variant="body-sm" weight="medium">
                        {currentProduct.accountLevel}
                      </Typography>
                    </div>
                  </div>
                )}

                {currentProduct.accountRank && (
                  <div className="flex items-center gap-2">
                    <Swords className="h-5 w-5 text-purple-500" />
                    <div>
                      <Typography variant="caption2" theme="muted">Rang</Typography>
                      <Typography variant="body-sm" weight="medium">
                        {currentProduct.accountRank}
                      </Typography>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Price */}
            <Card>
              <CardContent className="p-6">
                <Typography variant="h2" weight="bold" className="text-4xl md:text-5xl text-primary mb-2">
                  {currentProduct.price} GTC
                </Typography>
                <Typography variant="caption1" theme="muted">
                  Paiement sécurisé en cryptomonnaie GTC
                </Typography>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button
                    size="lg"
                    className="flex-1 text-lg h-12"
                    onClick={handleBuy}
                    disabled={!isAvailable}
                  >
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    {isAvailable ? "Acheter maintenant" : "Indisponible"}
                  </Button>

                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-12"
                      >
                        <QrCode className="mr-2 h-5 w-5" />
                        QR Code
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>Achat Rapide</DrawerTitle>
                      </DrawerHeader>
                      <div className="p-6 flex flex-col items-center">
                        <Typography variant="body-sm" theme="muted" className="mb-4 text-center">
                          Scannez ce QR Code pour acheter rapidement
                        </Typography>
                        <TransactionQRCode
                          data={encodeTransactionQR({
                            t: "PRODUCT_PURCHASE",
                            id: currentProduct.id,
                            a: typeof currentProduct.price === "number" ? currentProduct.price : parseFloat(currentProduct.price as string),
                            m: { name: currentProduct.name }
                          })}
                          label={currentProduct.name}
                          className="w-64 h-64"
                        />
                        <Typography variant="body-sm" weight="medium" className="mt-4">
                          {currentProduct.name}
                        </Typography>
                        <Typography variant="h4" weight="bold" className="mt-2">
                          {currentProduct.price} GTC
                        </Typography>
                      </div>
                    </DrawerContent>
                  </Drawer>
                </div>
              </CardContent>
            </Card>

            {/* Shop Info */}
            {currentProduct.shop && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14">
                      <AvatarImage src={currentProduct.shop.profileImage ?? undefined} />
                      <AvatarFallback>
                        <Store className="h-6 w-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Typography variant="body-base" weight="semibold" className="truncate">
                          {currentProduct.shop.name}
                        </Typography>
                        {currentProduct.shop.verified && (
                          <BadgeCheck className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <Typography variant="caption2" theme="muted" className="truncate">
                        {currentProduct.shop.description || "Boutique gaming"}
                      </Typography>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-amber-500" />
                          <span className="text-sm font-medium">4.8</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Store className="h-4 w-4 text-blue-500" />
                          <span className="text-sm text-muted-foreground">
                            {currentProduct.shop.productCount || 0} produits
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/shops/${currentProduct.shopId}`)}
                    >
                      Visiter
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Features */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <Shield className="h-5 w-5 text-green-500" />
                <div>
                  <Typography variant="caption2" weight="medium">
                    Garantie 7 jours
                  </Typography>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Lock className="h-5 w-5 text-blue-500" />
                <div>
                  <Typography variant="caption2" weight="medium">
                    Paiement sécurisé
                  </Typography>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Zap className="h-5 w-5 text-purple-500" />
                <div>
                  <Typography variant="caption2" weight="medium">
                    Livraison instantanée
                  </Typography>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <BadgeCheck className="h-5 w-5 text-amber-500" />
                <div>
                  <Typography variant="caption2" weight="medium">
                    Support 24/7
                  </Typography>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="mb-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="description" className="gap-2">
                <Scroll className="h-4 w-4" />
                Description
              </TabsTrigger>
              <TabsTrigger value="similar" className="gap-2">
                <Gamepad2 className="h-4 w-4" />
                Similaires
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Commentaires
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Description Tab */}
          <TabsContent value="description" className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <Typography variant="h4" weight="semibold" className="mb-4">
                  Description du compte
                </Typography>
                <div className="prose prose-invert max-w-none">
                  <Typography variant="body-base" className="whitespace-pre-wrap leading-relaxed">
                    {currentProduct.description || "Aucune description détaillée fournie pour ce compte de jeu."}
                  </Typography>
                </div>



                {/* Account Details */}
                <Separator className="my-4" />
                <Typography variant="h5" weight="semibold" className="mb-4">
                  Détails du compte
                </Typography>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Typography variant="caption2" theme="muted">Type de compte</Typography>
                    <Typography variant="body-sm">Premium Gaming</Typography>
                  </div>
                  <div>
                    <Typography variant="caption2" theme="muted">Plateforme</Typography>
                    <Typography variant="body-sm">{currentProduct.platform || "Non spécifié"}</Typography>
                  </div>
                  <div>
                    <Typography variant="caption2" theme="muted">Niveau</Typography>
                    <Typography variant="body-sm">{currentProduct.accountLevel || "N/A"}</Typography>
                  </div>
                  <div>
                    <Typography variant="caption2" theme="muted">Rang</Typography>
                    <Typography variant="body-sm">{currentProduct.accountRank || "N/A"}</Typography>
                  </div>
                  <div>
                    <Typography variant="caption2" theme="muted">Date d'ajout</Typography>
                    <Typography variant="body-sm">
                      {currentProduct.createdAt && format(new Date(currentProduct.createdAt), "dd/MM/yyyy", { locale: fr })}
                    </Typography>
                  </div>
                  <div>
                    <Typography variant="caption2" theme="muted">Vues</Typography>
                    <Typography variant="body-sm">{currentProduct.viewCount || 0}</Typography>
                  </div>
                </div>

                <Separator className="my-4" />
                {/* Included Content */}
                <Typography variant="h5" weight="semibold" className="mb-4 flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  Contenu inclus
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    "Compte complet avec accès illimité",
                    "Tous les personnages débloqués",
                    "Skins légendaires exclusifs",
                    "Argent en jeu inclus",
                    "Historique des matchs préservé",
                    "Amis et contacts conservés"
                  ].map((item, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <Typography variant="body-sm">{item}</Typography>
                    </div>
                  ))}
                </div>


              </CardContent>
            </Card>
          </TabsContent>

          {/* Similar Products Tab */}
          <TabsContent value="similar" className="space-y-6">
            <Typography variant="h3" weight="bold" className="mb-4">
              Comptes similaires
            </Typography>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {initialRelated.length > 0 ? (
                initialRelated.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    showActions
                  />
                ))
              ) : (
                <div className="col-span-3 text-center py-8">
                  <Typography variant="body-lg" className="text-muted-foreground">
                    Aucun compte similaire trouvé dans cette catégorie.
                  </Typography>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
            <CommentsSection
              entityId={currentProduct.id}
              entityType="PRODUCT"
              title="Commentaires"
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Skeleton
export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <div className="aspect-square rounded-xl bg-muted animate-pulse" />
          <div className="space-y-6">
            <div className="h-8 bg-muted rounded-lg animate-pulse w-3/4" />
            <div className="h-6 bg-muted rounded-lg animate-pulse w-1/2" />
            <div className="h-32 bg-muted rounded-lg animate-pulse" />
            <div className="h-12 bg-muted rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}