"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShoppingCart,
  Heart,
  Share2,
  Shield,
  Store,
  Package,
  Gamepad2,
  MapPin,
  Calendar,
  Star,
  TrendingUp,
  MessageCircle,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Zap,
  Award,
  Users,
  Clock,
  Eye,
  Settings,
  MoreVertical,
  Check,
  Lock,
  ArrowRight,
  ThumbsUp,
  MessageSquare,
  Key,
  User,
  Trophy,
  Crown,
  Swords,
  Target,
  Shield as ShieldIcon,
  GamepadIcon,
  Globe,
  Flag,
  Coins,
  CreditCard,
  BadgeCheck,
  Sparkles,
  Sword,
  Castle,
  Scroll,
  ArrowLeft,
  Bookmark,
  Flag as FlagIcon,
  Edit,
  Trash2,
  UserCog,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthContext } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InteractionButton } from "@/components/shared/interaction-button";
import { CommentsSection } from "@/components/comments/comments-section";
import { useQueryClient } from "@tanstack/react-query";
import { incrementProductViewCount, getProductsByShopId } from "@/actions/products";
import type { ProductWithRelations } from "@/database/schema";
import { ProductCard } from "@/components/cards/product-card";
import { countries, getCountryByCode } from "@/lib/countries";
import { useScreenSize } from "@/hooks/use-screen";
import { ImageViewer } from "@/components/shared/image-viewer";

interface ProductDetailProps {
  product: ProductWithRelations;
  relatedProducts: ProductWithRelations[];
}

export function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const queryClient = useQueryClient();
  const { isSmallScreen } = useScreenSize();

  const [activeTab, setActiveTab] = useState("description");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [similarProducts, setSimilarProducts] = useState<ProductWithRelations[]>([]);
  const [isLoadingSimilar, setIsLoadingSimilar] = useState(false);

  const mainImage = product.images && product.images.length > 0 
    ? product.images[selectedImageIndex]
    : "/placeholder-product.jpg";

  const isOwner = user && product && (user.id === product.userId || user.id === product.shop?.ownerId);
  const isAvailable = product.status === "NON_VENDU" || product.status === "RESERVE";

  // Récupérer les infos du pays
  const countryInfo = product.shop?.country ? getCountryByCode(product.shop.country) : null;

  // Incrémenter les vues
  useEffect(() => {
    if (product.id) {
      incrementProductViewCount(product.id);
    }
  }, [product.id]);

  // Charger les produits similaires de la boutique
  useEffect(() => {
    if (product.shopId) {
      loadSimilarProducts();
    }
  }, [product.shopId]);

  const loadSimilarProducts = async () => {
    if (!product.shopId) return;
    
    setIsLoadingSimilar(true);
    try {
      const res = await getProductsByShopId(product.shopId, {
        filters: {
          status: ["NON_VENDU", "RESERVE"],
          isDeleted: false,
          isActive: true
        },
        pagination: { page: 1, limit: 12 },
        options: {
          sortBy: "createdAt",
          sortOrder: "desc"
        }
      });
      const similar = (res.data as ProductWithRelations[])
        .filter(p => p.id !== product.id && p.categoryId === product.categoryId)
        .slice(0, 6);
      setSimilarProducts(similar);
    } catch (error) {
      console.error("Erreur chargement produits similaires:", error);
    } finally {
      setIsLoadingSimilar(false);
    }
  };

  const handleBuy = () => {
    if (!isAuthenticated) {
      toast.error("Vous devez être connecté pour acheter.");
      router.push(`/auth/sign-in?callbackUrl=/products/${product.id}`);
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

    // Redirection vers la page de transaction
    const params = new URLSearchParams({
      type: "PURCHASE",
      amount: product.price.toString(),
      entityData: JSON.stringify({ 
        productId: product.id, 
        productName: product.name,
        shopId: product.shopId,
        productType: "ACCOUNT"
      }),
      recipientId: product.userId || product.shop?.ownerId || "",
    });

    router.push(`/wallet/transactions/create?${params.toString()}`);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Lien copié dans le presse-papier");
  };

  const productImages = (product.images && product.images.length > 0) ? product.images : [mainImage];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background pb-12">
      {/* Header Gaming */}
      <div className="relative overflow-hidden">
        {/* Breadcrumb */}
        <div className="container mx-auto px-4 pt-6">
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
            {product.category && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hover:text-foreground"
                  onClick={() => router.push(`/categories/${product.categoryId}`)}
                >
                  {product.category.name}
                </Button>
                <ChevronRight className="h-4 w-4 mx-2" />
              </>
            )}
            <Typography variant="body-sm" weight="medium" className="text-foreground">
              {product.name}
            </Typography>
          </div>
        </div>

        {/* Product Gallery & Info */}
        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Gallery */}
            <div className="space-y-4">
              {/* Main Image avec effet gaming */}
              <div className="relative aspect-square rounded-2xl overflow-hidden border bg-card group">
                {/* Action buttons overlay */}
                <div className="absolute top-4 left-4 z-20 flex gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-10 w-10 bg-background/80 backdrop-blur-sm border"
                    onClick={() => router.back()}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </div>
                
                <div className="absolute top-4 right-4 z-20 flex gap-2">
                  <InteractionButton
                    type="like"
                    entityType="PRODUCT"
                    entityId={product.id}
                    iconOnly
                    size="sm"
                    variant="secondary"
                    className="h-10 w-10 bg-background/80 backdrop-blur-sm border"
                  >
                    <Heart className="h-5 w-5" />
                  </InteractionButton>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-10 w-10 bg-background/80 backdrop-blur-sm border"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isOwner ? (
                        <>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/products/${product.id}`)}>
                            <Settings className="h-4 w-4 mr-2" />
                            Dashboard
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/products/${product.id}/edit`)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={() => router.push(`/profile/${product.userId}`)}>
                            <UserCog className="h-4 w-4 mr-2" />
                            Voir le profil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/shops/${product.shopId}`)}>
                            <Store className="h-4 w-4 mr-2" />
                            Visiter la boutique
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <FlagIcon className="h-4 w-4 mr-2" />
                            Signaler
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuItem onClick={handleShare}>
                        <Share2 className="h-4 w-4 mr-2" />
                        Partager
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Image Viewer Trigger */}
                <ImageViewer
                  images={productImages}
                  initialIndex={selectedImageIndex}
                  trigger={
                    <div className="absolute inset-0 cursor-zoom-in">
                      <Image
                        src={mainImage}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        priority
                      />
                    </div>
                  }
                />
                
                {/* Status Badges */}
                <div className="absolute top-16 left-4 z-10 flex flex-col gap-2">
                  {product.isFeatured && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black border-none shadow-lg">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Populaire
                    </Badge>
                  )}
                  <Badge className={cn(
                    "border-none shadow-lg font-bold",
                    product.status === "VENDU" ? "bg-destructive text-destructive-foreground" :
                    product.status === "RESERVE" ? "bg-amber-500 text-amber-950" :
                    "bg-green-600 text-white"
                  )}>
                    {product.status === "VENDU" ? "Vendu" :
                     product.status === "RESERVE" ? "Réservé" :
                     "Disponible"}
                  </Badge>
                </div>

                {/* Game Icon */}
                <div className="absolute bottom-4 left-4 z-10">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-background/70 backdrop-blur-sm rounded-lg border">
                      <GamepadIcon className="h-6 w-6" />
                    </div>
                    <div className="bg-background/70 backdrop-blur-sm px-3 py-1 rounded-lg border">
                      <Typography variant="body-sm" className="font-bold">
                        {product.game || "Jeu non spécifié"}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thumbnails */}
              {productImages?.length && productImages.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {productImages.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden border-2 transition-all group",
                        selectedImageIndex === index
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <div className="absolute inset-0">
                        <Image
                          src={img}
                          alt={`${product.name} - Vue ${index + 1}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="(max-width: 768px) 25vw, 12.5vw"
                        />
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              {/* Title & Category avec style gaming */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  {product.category && (
                    <Badge className="bg-gradient-to-r from-blue-600 to-cyan-500 border-none text-white px-3 py-1">
                      <Scroll className="h-3 w-3 mr-1" />
                      {product.category.name}
                    </Badge>
                  )}
                  {product.platform && (
                    <Badge variant="outline">
                      <Gamepad2 className="h-3 w-3 mr-1" />
                      {product.platform}
                    </Badge>
                  )}
                  {product.isNegotiable && (
                    <Badge variant="outline" className="border-amber-500 text-amber-500">
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Prix négociable
                    </Badge>
                  )}
                </div>
                
                <Typography variant="h1" weight="bold" className="text-3xl md:text-4xl">
                  {product.name}
                </Typography>
                
                {/* Rank et Level */}
                <div className="flex items-center gap-4">
                  {product.accountLevel && (
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-muted rounded-lg border">
                        <Crown className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <Typography variant="caption2" theme="muted">Niveau</Typography>
                        <Typography variant="body-base" weight="bold">
                          {product.accountLevel}
                        </Typography>
                      </div>
                    </div>
                  )}
                  
                  {product.accountRank && (
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-muted rounded-lg border">
                        <Sword className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <Typography variant="caption2" theme="muted">Rang</Typography>
                        <Typography variant="body-base" weight="bold">
                          {product.accountRank}
                        </Typography>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Prix */}
                <div className="bg-card border rounded-2xl p-6">
                  <div className="flex items-baseline gap-3">
                    <Typography variant="h2" weight="bold" className="text-4xl md:text-5xl bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                      {product.price} GTC
                    </Typography>
                  </div>
                  <Typography variant="caption1" theme="muted" className="mt-2">
                    Paiement sécurisé en cryptomonnaie GTC
                  </Typography>
                </div>
              </div>

              {/* Shop Info avec pays */}
              {product.shop && (
                <Card className="bg-card border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-14 w-14 border-2 ring-2 ring-primary/20">
                          <AvatarImage src={product.shop.profileImage ?? undefined} />
                          <AvatarFallback>
                            <Store className="h-6 w-6" />
                          </AvatarFallback>
                        </Avatar>
                        {product.shop.verified && (
                          <div className="absolute -top-1 -right-1 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full p-1">
                            <BadgeCheck className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Typography variant="body-base" weight="semibold" className="truncate">
                            {product.shop.name}
                          </Typography>
                          {countryInfo && (
                            <Badge variant="outline" className="border">
                              <span className="mr-1">{countryInfo.flag}</span>
                              {countryInfo.name}
                            </Badge>
                          )}
                        </div>
                        <Typography variant="caption2" theme="muted" className="truncate">
                          {product.shop.description || "Boutique gaming premium"}
                        </Typography>
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-500" />
                            <span className="text-sm font-medium">4.8</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Package className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-muted-foreground">{product.shop.productCount || 0} comptes</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Shield className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-muted-foreground">Vérifié</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        className="border-primary text-primary hover:bg-primary/10"
                        onClick={() => router.push(`/shops/${product.shopId}`)}
                      >
                        Visiter
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Account Details */}
              <div className="bg-card border rounded-2xl p-6">
                <Typography variant="h4" weight="semibold" className="mb-4 flex items-center gap-2">
                  <Key className="h-5 w-5 text-primary" />
                  Détails du compte
                </Typography>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Typography variant="caption2" theme="muted">Type de compte</Typography>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-blue-400" />
                      <Typography variant="body-sm">Premium Gaming</Typography>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Typography variant="caption2" theme="muted">État</Typography>
                    <Badge className={cn(
                      "font-bold",
                      product.status === "NON_VENDU" ? "bg-green-600" :
                      product.status === "RESERVE" ? "bg-amber-500" :
                      "bg-destructive"
                    )}>
                      {product.status === "NON_VENDU" ? "Actif" :
                       product.status === "RESERVE" ? "Réservé" :
                       "Vendu"}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <Typography variant="caption2" theme="muted">Plateforme</Typography>
                    <div className="flex items-center gap-2">
                      <Gamepad2 className="h-4 w-4 text-purple-400" />
                      <Typography variant="body-sm">{product.platform || "Non spécifié"}</Typography>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Typography variant="caption2" theme="muted">Date d'ajout</Typography>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <Typography variant="body-sm">
                        {product.createdAt && format(new Date(product.createdAt), "dd/MM/yyyy", { locale: fr })}
                      </Typography>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full text-lg h-14 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                  onClick={handleBuy}
                  disabled={!isAvailable}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isAvailable ? "Acheter ce compte" : "Compte indisponible"}
                </Button>
                
                <div className="grid grid-cols-3 gap-3">
                  <InteractionButton
                    type="bookmark"
                    entityType="PRODUCT"
                    entityId={product.id}
                    variant="outline"
                    size="lg"
                    className="gap-2"
                  >
                    <Heart className="h-4 w-4" />
                    Favoris
                  </InteractionButton>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={() => router.push(`/chats?product=${product.id}`)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contacter
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2"
                    onClick={handleShare}
                  >
                    <Share2 className="h-4 w-4" />
                    Partager
                  </Button>
                </div>
              </div>

              {/* Security Badges */}
              <div className="grid grid-cols-2 gap-3 pt-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Shield className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <Typography variant="caption2" weight="medium" className="text-green-400">
                      Garantie 7 jours
                    </Typography>
                    <Typography variant="caption2" theme="muted">
                      Remboursement intégral
                    </Typography>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Lock className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <Typography variant="caption2" weight="medium" className="text-blue-400">
                      Paiement sécurisé
                    </Typography>
                    <Typography variant="caption2" theme="muted">
                      Cryptage SSL
                    </Typography>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Zap className="h-5 w-5 text-purple-400" />
                  </div>
                  <div>
                    <Typography variant="caption2" weight="medium" className="text-purple-400">
                      Livraison instantanée
                    </Typography>
                    <Typography variant="caption2" theme="muted">
                      Accès immédiat
                    </Typography>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <BadgeCheck className="h-5 w-5 text-amber-400" />
                  </div>
                  <div>
                    <Typography variant="caption2" weight="medium" className="text-amber-400">
                      Support 24/7
                    </Typography>
                    <Typography variant="caption2" theme="muted">
                      Assistance incluse
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Navigation Tabs */}
            <Card className="mb-6 bg-card border">
              <CardContent className="p-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid grid-cols-4 bg-muted p-1 rounded-lg">
                    <TabsTrigger value="description" className="gap-2">
                      <Scroll className="h-4 w-4" />
                      Description
                    </TabsTrigger>
                    <TabsTrigger value="details" className="gap-2">
                      <Swords className="h-4 w-4" />
                      Détails
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
                </Tabs>
              </CardContent>
            </Card>

            <AnimatePresence mode="wait">
              {/* Description Tab */}
              {activeTab === "description" && (
                <motion.div
                  key="description"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <Card className="bg-card border">
                    <CardHeader>
                      <CardTitle>Description du compte</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-invert max-w-none">
                        <Typography variant="body-base" className="whitespace-pre-wrap leading-relaxed">
                          {product.description || "Aucune description détaillée fournie pour ce compte de jeu."}
                        </Typography>
                      </div>

                      <Separator className="my-6" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <Typography variant="h4" weight="semibold" className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-amber-500" />
                            Contenu inclus
                          </Typography>
                          <ul className="space-y-3">
                            {[
                              "Compte complet avec accès illimité",
                              "Tous les personnages débloqués",
                              "Skins légendaires exclusifs",
                              "Argent en jeu inclus",
                              "Historique des matchs préservé",
                              "Amis et contacts conservés"
                            ].map((item, index) => (
                              <li key={index} className="flex items-start gap-3">
                                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <Typography variant="body-sm">
                                  {item}
                                </Typography>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-4">
                          <Typography variant="h4" weight="semibold" className="flex items-center gap-2">
                            <ShieldIcon className="h-5 w-5 text-blue-500" />
                            Sécurité garantie
                          </Typography>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-xl border">
                              <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <Lock className="h-5 w-5 text-blue-400" />
                              </div>
                              <div>
                                <Typography variant="body-sm" weight="medium">
                                  Transfert sécurisé
                                </Typography>
                                <Typography variant="caption2" className="text-muted-foreground">
                                  Procédure de changement sécurisé
                                </Typography>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-muted rounded-xl border">
                              <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                                <Shield className="h-5 w-5 text-green-400" />
                              </div>
                              <div>
                                <Typography variant="body-sm" weight="medium">
                                  Garantie acheteur
                                </Typography>
                                <Typography variant="caption2" className="text-muted-foreground">
                                  Assistance sous 24h en cas de problème
                                </Typography>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Details Tab */}
              {activeTab === "details" && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <Card className="bg-card border">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Swords className="h-5 w-5 text-purple-500" />
                        Détails du compte
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <Typography variant="h4" weight="semibold" className="text-lg">
                            Informations générales
                          </Typography>
                          <div className="space-y-3">
                            {product.game && (
                              <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-muted-foreground flex items-center gap-2">
                                  <GamepadIcon className="h-4 w-4" />
                                  Jeu
                                </span>
                                <span className="font-medium">{product.game}</span>
                              </div>
                            )}
                            {product.platform && (
                              <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-muted-foreground flex items-center gap-2">
                                  <Gamepad2 className="h-4 w-4" />
                                  Plateforme
                                </span>
                                <span className="font-medium">{product.platform}</span>
                              </div>
                            )}
                            {product.accountLevel && (
                              <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-muted-foreground flex items-center gap-2">
                                  <Target className="h-4 w-4" />
                                  Niveau
                                </span>
                                <span className="font-medium">{product.accountLevel}</span>
                              </div>
                            )}
                            {product.accountRank && (
                              <div className="flex justify-between items-center py-3 border-b">
                                <span className="text-muted-foreground flex items-center gap-2">
                                  <Sword className="h-4 w-4" />
                                  Rang
                                </span>
                                <span className="font-medium">{product.accountRank}</span>
                              </div>
                            )}
                            <div className="flex justify-between items-center py-3">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Date d'ajout
                              </span>
                              <span className="font-medium">
                                {product.createdAt && format(new Date(product.createdAt), "d MMMM yyyy", { locale: fr })}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <Typography variant="h4" weight="semibold" className="text-lg">
                            Livraison & Support
                          </Typography>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center py-3 border-b">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <Zap className="h-4 w-4" />
                                Mode de livraison
                              </span>
                              <span className="font-medium">Instantané</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Délai
                              </span>
                              <span className="font-medium">Sous 1 heure</span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-b">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <Package className="h-4 w-4" />
                                Format
                              </span>
                              <span className="font-medium">Compte numérique</span>
                            </div>
                            <div className="flex justify-between items-center py-3">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <MessageCircle className="h-4 w-4" />
                                Support
                              </span>
                              <span className="font-medium">24/7 inclus</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Similar Products Tab */}
              {activeTab === "similar" && (
                <motion.div
                  key="similar"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-6">
                    {/* Similar from same category */}
                    <div>
                      <Typography variant="h3" weight="bold" className="mb-4">
                        Comptes similaires
                      </Typography>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {relatedProducts.length > 0 ? (
                          relatedProducts.map((p) => (
                            <ProductCard
                              key={p.id}
                              product={p}
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
                    </div>

                    {/* Similar from same shop */}
                    {similarProducts.length > 0 && (
                      <div>
                        <Typography variant="h3" weight="bold" className="mb-4">
                          Autres comptes de cette boutique
                        </Typography>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                          {similarProducts.map((p) => (
                            <ProductCard
                              key={p.id}
                              product={p}
                              showActions
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Comments Tab */}
              {activeTab === "comments" && (
                <motion.div
                  key="comments"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <CommentsSection
                    entityId={product.id}
                    entityType="PRODUCT"
                    title="Commentaires"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Seller Info */}
            {product.user && (
              <Card className="bg-card border">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Vendeur
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3 mb-4">
                    <Avatar className="h-12 w-12 border-2">
                      <AvatarImage src={product.user.image ?? product.user.profileImage ?? undefined} />
                      <AvatarFallback>
                        {product.user.username?.[0]?.toUpperCase() || "V"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <Typography variant="body-base" weight="semibold" className="truncate">
                        {product.user.fullName || product.user.username}
                      </Typography>
                      <Typography variant="caption2" theme="muted">
                        Membre depuis {product.user.createdAt && format(new Date(product.user.createdAt), "yyyy", { locale: fr })}
                      </Typography>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="text-center p-3 bg-muted rounded-xl border">
                      <Typography variant="body-sm" weight="bold">
                        98%
                      </Typography>
                      <Typography variant="caption2" theme="muted">
                        Satisfaction
                      </Typography>
                    </div>
                    <div className="text-center p-3 bg-muted rounded-xl border">
                      <Typography variant="body-sm" weight="bold">
                        24h
                      </Typography>
                      <Typography variant="caption2" theme="muted">
                        Réponse
                      </Typography>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => router.push(`/chats?user=${product.userId}`)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contacter
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Account Features */}
            <Card className="bg-card border">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg">Caractéristiques</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-4">
                {[
                  { icon: Check, text: "Email vérifié", color: "text-green-500" },
                  { icon: Check, text: "2FA activé", color: "text-green-500" },
                  { icon: Check, text: "Historique complet", color: "text-green-500" },
                  { icon: Check, text: "Skins rares inclus", color: "text-green-500" },
                  { icon: Check, text: "Rank compétitif", color: "text-green-500" },
                  { icon: Check, text: "Support 24/7", color: "text-green-500" },
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="p-1.5 bg-green-500/20 rounded-lg">
                      <feature.icon className={`h-4 w-4 ${feature.color}`} />
                    </div>
                    <Typography variant="body-sm">
                      {feature.text}
                    </Typography>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton
export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background/95 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          <Skeleton className="aspect-square rounded-2xl bg-muted" />
          <div className="space-y-6">
            <Skeleton className="h-12 w-3/4 rounded-lg bg-muted" />
            <Skeleton className="h-8 w-1/2 rounded-lg bg-muted" />
            <Skeleton className="h-32 rounded-lg bg-muted" />
            <Skeleton className="h-12 w-full rounded-lg bg-muted" />
            <Skeleton className="h-12 w-full rounded-lg bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
