"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  MapPin,
  Star,
  Users,
  Package,
  TrendingUp,
  Share2,
  Heart,
  ShoppingCart,
  MessageCircle,
  Globe,
  Phone,
  Mail,
  ChevronRight,
  Shield,
  Award,
  Clock,
  Tag,
  Settings,
  Eye,
  Home,
  ShoppingBag,
  Filter,
  Grid,
  List,
  Plus,
  MoreVertical,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  Check,
  Zap,
  Trophy,
  Calendar,
  DollarSign,
  BarChart,
  CheckCircleIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import { InteractionButton } from "@/components/shared/interaction-button";
import { getShopById, getPopularShops } from "@/actions/shops";
import { recordEntityView } from "@/actions/interactions";
import { useShopById, usePopularShops } from "@/hooks/use-shops";
import { useProducts } from "@/hooks/use-products";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { useAuthContext } from "@/contexts/auth-context";
import { useScreenSize } from "@/hooks/use-screen";
import { cn } from "@/lib/utils";
// import { ShopCard } from "@/components/pages/shops/shop-card";
import { CommentsSection } from "@/components/comments/comments-section";
import { ShopCard } from "@/components/cards/shop-card";
import { ProductCard } from "@/components/cards/product-card";
import { ProductWithRelations } from "@/database/schema";

export function ShopPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const { isSmallScreen, isLargeScreen } = useScreenSize();
  const shopId = params.shopId as string;

  const [activeTab, setActiveTab] = useState("products");
  const [productViewMode, setProductViewMode] = useState<"grid" | "list">(
    "grid"
  );
  const [isFollowing, setIsFollowing] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const { data: similarShopsData } = usePopularShops(6);
  const similarShops = similarShopsData?.slice(0, 4) || [];

  const { data: shop, isLoading, error } = useShopById(shopId, { populate: ["owner", "stats"] });

  useEffect(() => {
    if (shop) {
      recordEntityView(shopId, "SHOP", user?.id);
    }
  }, [shop, shopId, user?.id]);

  const {
    data: productsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isLoadingProducts
  } = useProducts({ 
    filters: { 
      shopId, 
      status: ['NON_VENDU', 'RESERVE', 'EN_ECHANGE'] // Only show available/active products
    }, 
    pagination: { limit: 20, page: 1 } 
  });

  const products = productsData?.pages.flatMap((page) => page.products) || [];

  const isOwner = user && shop && user.id === shop.ownerId;

  const stats = [
    {
      icon: Package,
      label: "Produits",
      value: shop?.stats?.productCount || shop?.productCount || 0,
      color: "text-blue-500",
    },
    {
      icon: Users,
      label: "Suiveurs",
      value: shop?.stats?.followerCount || "0",
      color: "text-green-500"
    },
    {
      icon: Eye,
      label: "Vues",
      value: shop?.stats?.viewCount || shop?.viewCount || 0,
      color: "text-amber-500"
    },
    {
      icon: Clock,
      label: "Expédition",
      value: "24h",
      color: "text-purple-500",
    },
    {
      icon: Shield,
      label: "Satisfaction",
      value: "98%",
      color: "text-emerald-500",
    },
    {
      icon: Trophy,
      label: "Ventes",
      value: shop?.stats?.totalSales || 0,
      color: "text-orange-500",
    },
  ];

  const handleProductClick = (productId: string) => {
    router.push(`/marketplace/${productId}`);
  };

  const handleBuyClick = (productId: string) => {
    router.push(`/wallet/transactions/create?productId=${productId}&type=PRODUCT`);
  };

  if (isLoading) {
    return <ShopSkeleton />;
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <Store className="h-6 w-6" />
            </EmptyMedia>
            <EmptyTitle>Boutique introuvable</EmptyTitle>
            <EmptyDescription>La boutique que vous recherchez n'existe pas ou a été supprimée.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button onClick={() => router.push("/shops")}>
              Explorer les boutiques
            </Button>

            {/* relaod */}
            <Button onClick={() => window.location.reload()}>
              Recharger
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header Premium */}
      <div className="relative">
        {/* Banner */}
        <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden">
          {shop.coverImage ? (
            <Image
              src={shop.coverImage}
              alt="Bannière"
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-purple-500/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/90 to-transparent" />

          {/* Overlay Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
          </div>
        </div>

        {/* Profile Info */}
        <div className="container mx-auto px-4 relative -mt-16">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Profile Image */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="relative"
            >
              <div className="relative">
                {shop.profileImage ? (
                  <Image
                    src={shop.profileImage}
                    alt={shop.name}
                    width={isSmallScreen ? 96 : 120}
                    height={isSmallScreen ? 96 : 120}
                    className="rounded-full border-4 border-background object-cover bg-background shadow-2xl"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-30 md:h-30 rounded-full border-4 border-background bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-2xl">
                    <Store className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                  </div>
                )}

                {/* Online Status */}
                <div className="absolute bottom-2 right-2 w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full border-2 border-background" />
              </div>
            </motion.div>

            {/* Shop Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Typography
                  variant="h1"
                  weight="bold"
                  className="text-2xl md:text-4xl"
                >
                  {shop.name}
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {shop.verified && (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 gap-1">
                      <Shield className="h-3 w-3" />
                      Vérifié
                    </Badge>
                  )}
                  {shop.featured && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 gap-1">
                      <Award className="h-3 w-3" />
                      En vedette
                    </Badge>
                  )}
                  {shop.isActive && (
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 gap-1">
                      <CheckCircleIcon className="h-3 w-3" />
                    </Badge>
                  )}
                </div>
              </div>

              {shop.description && (
                <Typography
                  variant="body-lg"
                  className="max-w-3xl mb-4 text-muted-foreground"
                >
                  {shop.description}
                </Typography>
              )}

              {/* Shop Meta */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {shop.country && (
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                    <MapPin className="h-4 w-4" />
                    <span>{shop.country}</span>
                  </div>
                )}
                {shop.phoneNumber && (
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                    <Phone className="h-4 w-4" />
                    <span>{shop.phoneNumber}</span>
                  </div>
                )}
                {shop.createdAt && (
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                    <Calendar className="h-4 w-4" />
                    <span>Depuis {new Date(shop.createdAt).getFullYear()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 max-md:w-full">
              {isOwner ? (
                <>
                  <Button
                    variant="default"
                    className="gap-2 max-md:flex-1"
                    onClick={() => router.push(`/shops/${shopId}/dashboard`)}
                  >
                    <BarChart className="h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 max-md:flex-1"
                    onClick={() =>
                      router.push(`/shops/${shopId}/products/create`)
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Ajouter produit
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild className="w-10">
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/chats?entityType=shop&entityId=${shopId}`)
                        }
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Discuter en chat
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/shops/${shopId}/dashabord/settings`)
                        }
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Paramètres
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
                  <InteractionButton
                    type="follow"
                    entityType="SHOP"
                    entityId={shopId}
                    iconOnly={isSmallScreen}
                    variant="default"
                    size={isSmallScreen ? "sm" : undefined}
                    withConfetti
                  />
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => router.push(`/chats?entityType=shop&entityId=${shopId}`)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    {!isSmallScreen && "Discuter"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => console.log("Share shop")}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Partager
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/signals?type=shop&entityId=${shopId}`)}
                      >
                        <Shield className="h-4 w-4 mr-2" />
                        Signaler
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section with Carousel */}
      <div className="container mx-auto p-3">
        <StatsCarousel mode="auto" itemsPerView={{mobile: 2, md: 3, lg: 4, xl: 5}}>
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="h-full"
            >
              <Card className="h-full hover:shadow-md transition-all border-border/50 bg-card/40 backdrop-blur-xl">
                <CardContent className="p-4 text-center flex flex-col items-center justify-center h-full">
                  <div
                    className={cn(
                      "p-3 rounded-2xl inline-flex mb-3 transition-transform duration-300 group-hover:scale-110",
                      `${stat.color.replace('text-', 'bg-')}/10`
                    )}
                  >
                    <stat.icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                  <Typography variant="h3" weight="bold" className="mb-1">
                    {stat.value}
                  </Typography>
                  <Typography variant="caption1" theme="muted" className="uppercase tracking-wider font-medium">
                    {stat.label}
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </StatsCarousel>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Owner Info */}
            {shop.owner && (
              <Card className="p-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Propriétaire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {shop.owner.profileImage ? (
                      <Image
                        src={shop.owner.profileImage}
                        alt={shop.owner.fullName || shop.owner.username || 'utilisateur'}
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <Typography
                        variant="body-base"
                        weight="semibold"
                        className="truncate cursor-pointer"
                        onClick={() =>
                          router.push(`/profile/${shop.owner?.id}`)
                        }
                      >
                        {shop.owner.fullName || shop.owner.username}
                      </Typography>
                    </div>
                  </div>
                  {/* <Button variant="outline" className="w-full mt-4 gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Voir le profil
                  </Button> */}
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card className="p-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Liens rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <ShoppingBag className="h-4 w-4" />
                  Tous les produits
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <Star className="h-4 w-4" />
                  Avis et évaluations
                </Button>
                <Button variant="ghost" className="w-full justify-start gap-3">
                  <DollarSign className="h-4 w-4" />
                  Politique de vente
                </Button>
              </CardContent>
            </Card>

            {/* Social Media */}
            <Card className="p-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Réseaux sociaux</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      icon: Instagram,
                      color: "text-pink-500",
                      label: "Instagram",
                    },
                    {
                      icon: Facebook,
                      color: "text-blue-600",
                      label: "Facebook",
                    },
                    { icon: Twitter, color: "text-sky-500", label: "Twitter" },
                    { icon: Youtube, color: "text-red-500", label: "YouTube" },
                    // { icon: Discord, color: "text-indigo-500", label: "Discord" },
                    {
                      icon: Linkedin,
                      color: "text-blue-700",
                      label: "LinkedIn",
                    },
                  ].map((social) => (
                    <Button
                      key={social.label}
                      variant="outline"
                      size="icon"
                      className="h-12 w-12"
                    >
                      <social.icon className={`h-5 w-5 ${social.color}`} />
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Navigation Tabs */}
            <Card className="mb-4 p-3">
              <CardContent className="p-2">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-4">
                    <TabsTrigger value="products" className="gap-2">
                      <Package className="h-4 w-4" />
                      Produits
                    </TabsTrigger>
                    <TabsTrigger value="about" className="gap-2">
                      <Store className="h-4 w-4" />À propos
                    </TabsTrigger>
                    <TabsTrigger value="reviews" className="gap-2">
                      <Star className="h-4 w-4" />
                      Avis (128)
                    </TabsTrigger>
                    <TabsTrigger value="similar" className="gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Similaires
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>

            <AnimatePresence mode="wait">
              {/* Products Tab */}
              {activeTab === "products" && (
                <motion.div
                  key="products"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Products Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <Typography variant="h3" weight="bold" className="mb-1">
                        comptes en vente
                      </Typography>
                      <Typography variant="body-sm" theme="muted">
                        {products?.length} produits disponibles
                      </Typography>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant={
                            productViewMode === "grid" ? "default" : "outline"
                          }
                          size="icon"
                          onClick={() => setProductViewMode("grid")}
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={
                            productViewMode === "list" ? "default" : "outline"
                          }
                          size="icon"
                          onClick={() => setProductViewMode("list")}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Filtres
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Tous les produits</DropdownMenuItem>
                          <DropdownMenuItem>En stock</DropdownMenuItem>
                          <DropdownMenuItem>En promotion</DropdownMenuItem>
                          <DropdownMenuItem>Meilleures ventes</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {isOwner && (
                        <Button
                          className="gap-2"
                          onClick={() =>
                            router.push(`/shops/${shopId}/products/create`)
                          }
                        >
                          <Plus className="h-4 w-4" />
                          Ajouter
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Products Grid */}
                  <div
                    className={cn(
                      "gap-4",
                      productViewMode === "grid"
                        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                        : "flex flex-col gap-4"
                    )}
                  >
                    {products?.map((product: any, index: number) => (
                      <ProductCard
                        key={product.id}
                        item={product}
                        viewMode={productViewMode}
                        onView={() => handleProductClick(product.id)}
                        onBuy={() => handleBuyClick(product.id)}
                        showDetails
                        showStats={false}
                        showActions
                        showLikeButton
                        showBookmarkButton
                        showBuyButton
                      />
                    ))}
                  </div>

                  {isLoadingProducts && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-80 w-full rounded-xl" />
                      ))}
                    </div>
                  )}

                  {!isLoadingProducts && products.length === 0 && (
                    <Empty>
                      <EmptyHeader>
                        <EmptyMedia variant="icon">
                          <Package />
                        </EmptyMedia>
                        <EmptyTitle>Aucun produit</EmptyTitle>
                        <EmptyDescription>Cette boutique n'a pas encore de produits.</EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  )}

                  {/* Load More */}
                  {hasNextPage && (
                    <div className="text-center pt-6">
                      <Button
                        variant="outline"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                        className="gap-2"
                      >
                        {isFetchingNextPage
                          ? "Chargement..."
                          : "Voir plus de produits"}
                        {!isFetchingNextPage && (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* avis */}
              {activeTab === "reviews" && (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        Avis des clients
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <CommentsSection
                        entityId={shopId}
                        entityType="SHOP"
                        title={`Avis de la boutique ${shop.name}`}
                      />
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* About Tab */}
              {activeTab === "about" && (
                <motion.div
                  key="about"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />À propos de {shop.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="prose max-w-none">
                        <Typography variant="body-base" className="mb-4">
                          {shop.description ||
                            "Cette boutique propose une sélection de produits gaming de qualité."}
                        </Typography>
                      </div>

                      <Separator />

                      {/* Contact Info */}
                      <div className="bg-muted/30 rounded-lg p-6">
                        <Typography
                          variant="h4"
                          weight="semibold"
                          className="mb-4"
                        >
                          Informations de contact
                        </Typography>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {shop.phoneNumber && (
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-primary/10">
                                <Phone className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <Typography variant="body-sm" weight="medium">
                                  Téléphone
                                </Typography>
                                <Typography variant="body-sm" theme="muted">
                                  {shop.phoneNumber}
                                </Typography>
                              </div>
                            </div>
                          )}
                          {shop.website && (
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-primary/10">
                                <Globe className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <Typography variant="body-sm" weight="medium">
                                  Site web
                                </Typography>
                                <a
                                  href={shop.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  {shop.website}
                                </a>
                              </div>
                            </div>
                          )}
                          {shop.country && (
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-primary/10">
                                <MapPin className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <Typography variant="body-sm" weight="medium">
                                  Localisation
                                </Typography>
                                <Typography variant="body-sm" theme="muted">
                                  {shop.country}
                                </Typography>
                              </div>
                            </div>
                          )}
                          {shop.createdAt && (
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-primary/10">
                                <Calendar className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <Typography variant="body-sm" weight="medium">
                                  Membre depuis
                                </Typography>
                                <Typography variant="body-sm" theme="muted">
                                  {new Date(shop.createdAt).toLocaleDateString(
                                    "fr-FR"
                                  )}
                                </Typography>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Features */}
                      {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <Typography
                            variant="h4"
                            weight="semibold"
                            className="flex items-center gap-2"
                          >
                            <Shield className="h-5 w-5 text-green-500" />
                            Nos engagements
                          </Typography>
                          <ul className="space-y-3">
                            {[
                              "Produits 100% authentiques et vérifiés",
                              "Support client disponible 24h/24 et 7j/7",
                              "Livraison rapide sous 24 heures",
                              "Garantie de remboursement sous 7 jours",
                              "Transactions sécurisées et cryptées",
                            ].map((item, index) => (
                              <li
                                key={index}
                                className="flex items-start gap-3"
                              >
                                <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <Typography variant="body-sm">
                                  {item}
                                </Typography>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="space-y-4">
                          <Typography
                            variant="h4"
                            weight="semibold"
                            className="flex items-center gap-2"
                          >
                            <Award className="h-5 w-5 text-amber-500" />
                            Spécialités
                          </Typography>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "Comptes gaming premium",
                              "Skins et items rares",
                              "Services de boosting",
                              "Cartes cadeaux",
                              "Guides et formations",
                              "Équipements gaming",
                            ].map((specialty, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="gap-1"
                              >
                                <Tag className="h-3 w-3" />
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div> */}


                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Similar Shops Tab */}
              {activeTab === "similar" && (
                <motion.div
                  key="similar"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <Typography variant="h3" weight="bold" className="mb-2">
                      Boutiques similaires
                    </Typography>
                    <Typography
                      variant="body-base"
                      theme="muted"
                      className="mb-6"
                    >
                      Découvrez d'autres boutiques qui pourraient vous
                      intéresser
                    </Typography>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {similarShops.map((similarShop) => (
                        <ShopCard
                          key={similarShop.id}
                          item={similarShop}
                          //   viewMode="grid"
                          showStats={false}
                          showActions={true}
                          onView={() => router.push(`/shops/${similarShop.id}`)}
                          showQuickActions={true}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Recommended Products */}
                  <div>
                    <Typography variant="h3" weight="bold" className="mb-6">
                      Produits recommandés
                    </Typography>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {products?.slice(0, 4).map((product: any) => (
                        <ProductCard
                          key={product.id}
                          item={product}
                          viewMode="compact"
                          showActions={false}
                          onView={() => handleProductClick(product.id)}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

// Skeleton
export function ShopSkeleton() {
  return (
    <div className="min-h-screen">
      <div className="h-64 bg-gradient-to-r from-primary/10 via-primary/5 to-purple-500/10" />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Skeleton className="h-[200px] rounded-xl" />
            <Skeleton className="h-[150px] rounded-xl" />
            <Skeleton className="h-[150px] rounded-xl" />
          </div>
          <div className="lg:col-span-3 space-y-8">
            <Skeleton className="h-12 rounded-xl" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-[300px] rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}