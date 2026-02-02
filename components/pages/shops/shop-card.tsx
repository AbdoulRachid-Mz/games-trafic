// // components/pages/shops/shop-card.tsx
// "use client";

// import { motion } from "framer-motion";
// import { Store, MapPin, Users, TrendingUp, Shield, Award, ChevronRight } from "lucide-react";
// import Image from "next/image";
// import { Card, CardContent } from "@/components/ui/card";
// import { Typography } from "@/components/ui/typography";
// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import { Separator } from "@/components/ui/separator";
// import { Shop } from "@/database/schema";

// interface ShopCardProps {
//   shop: Shop;
//   onClick: () => void;
// }

// export function ShopCard({ shop, onClick }: ShopCardProps) {
//   return (
//     <motion.div
//       whileHover={{ y: -4, transition: { duration: 0.2 } }}
//       className="group cursor-pointer"
//       onClick={onClick}
//     >
//       <Card className="overflow-hidden border-2 border-transparent p-3 hover:border-primary/30 transition-all duration-300 h-full flex flex-col">
//         {/* Bannière */}
//         <div className="relative h-40 bg-gradient-to-r from-primary/20 to-primary/10 overflow-hidden rounded-lg mb-2">
//           {shop.coverImage ? (
//             <Image
//               src={shop.coverImage}
//               alt={shop.name}
//               fill
//               className="object-cover group-hover:scale-105 transition-transform duration-500"
//               sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
//             />
//           ) : (
//             <div className="absolute inset-0 flex items-center justify-center">
//               <Store className="h-16 w-16 text-primary/30" />
//             </div>
//           )}
//           <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          
//           {/* Badges */}
//           <div className="absolute top-3 right-3 flex flex-col gap-2 items-end">
//             {shop.verified && (
//               <Badge className="bg-green-500/90 backdrop-blur-sm gap-1">
//                 <Shield className="h-3 w-3" />
//                 Vérifié
//               </Badge>
//             )}
//             {shop.featured && (
//               <Badge className="bg-amber-500/90 backdrop-blur-sm gap-1">
//                 <Award className="h-3 w-3" />
//                 Vedette
//               </Badge>
//             )}
//           </div>

//           {/* Photo de profil */}
//           <div className="absolute -bottom-6 left-6">
//             <div className="relative">
//               {shop.profileImage ? (
//                 <Image
//                   src={shop.profileImage}
//                   alt={shop.name}
//                   width={80}
//                   height={80}
//                   className="rounded-full border-4 border-background object-cover bg-background"
//                 />
//               ) : (
//                 <div className="w-20 h-20 rounded-full border-4 border-background bg-primary/10 flex items-center justify-center">
//                   <Store className="h-10 w-10 text-primary" />
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>

//         {/* Contenu */}
//         <CardContent className="pt-8 pb-4 flex-1 flex flex-col">
//           <div className="space-y-3 flex-1">
//             {/* Nom et localisation */}
//             <div>
//               <Typography variant="h4" weight="bold" className="mb-1 line-clamp-1">
//                 {shop.name}
//               </Typography>
//               {shop.country && (
//                 <div className="flex items-center gap-1 text-sm text-muted-foreground">
//                   <MapPin className="h-3 w-3" />
//                   {shop.country}
//                 </div>
//               )}
//             </div>

//             {/* Description */}
//             {shop.description && (
//               <Typography variant="body-sm" theme="muted" className="line-clamp-2">
//                 {shop.description}
//               </Typography>
//             )}

//             <Separator />

//             {/* Stats */}
//             <div className="grid grid-cols-3 gap-2 text-sm">
//               <div className="text-center">
//                 <div className="flex items-center justify-center gap-1 font-semibold">
//                   <TrendingUp className="h-4 w-4" />
//                   {shop.productCount || 0}
//                 </div>
//                 <Typography variant="caption2" theme="muted">Produits</Typography>
//               </div>
//               <div className="text-center">
//                 <div className="flex items-center justify-center gap-1 font-semibold">
//                   <Users className="h-4 w-4" />
//                   {shop.viewCount || 0}
//                 </div>
//                 <Typography variant="caption2" theme="muted">Vues</Typography>
//               </div>
//               <div className="text-center">
//                 <div className="font-semibold">4.5</div>
//                 <Typography variant="caption2" theme="muted">Note</Typography>
//               </div>
//             </div>
//           </div>

//           {/* CTA */}
//           <Button 
//             className="w-full mt-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
//             onClick={(e) => {
//               e.stopPropagation();
//               onClick();
//             }}
//           >
//             Visiter la boutique
//             <ChevronRight className="ml-2 h-4 w-4" />
//           </Button>
//         </CardContent>
//       </Card>
//     </motion.div>
//   );
// }

import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, Globe, ShoppingBag, Eye, CheckCircle, Star, Package, Clock, DollarSign, TrendingUp, Users, Calendar, Settings, Edit, Trash, Eye as EyeIcon, Bookmark, Share2, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Shop, User, ShopWithRelations, Product } from '@/database/schema';

// Types des props
type ViewMode = 'vertical' | 'horizontal';
type AdminView = 'default' | 'admin';

interface ShopCardProps {
  shop: Shop & {
    owner?: User;
    stats?: {
      productCount: number;
      orderCount: number;
      revenue: number;
      rating: number;
      followersCount: number;
    };
    products?: Product[];
  };
  viewMode?: ViewMode;
  onView?: () => void;
  adminView?: AdminView;
  showHeader?: boolean;
  showFooter?: boolean;
  showDetails?: boolean;
  showStats?: boolean;
  showActions?: boolean;
  showBadges?: boolean;
  showContact?: boolean;
  showSocial?: boolean;
  showVerification?: boolean;
  showFeatured?: boolean;
  showTheme?: boolean;
  showCreatedDate?: boolean;
  showUpdatedDate?: boolean;
  showOwner?: boolean;
  showRating?: boolean;
  showFollowers?: boolean;
  showProductsPreview?: boolean;
  showOrdersPreview?: boolean;
  showRevenue?: boolean;
  showQuickActions?: boolean;
  showEditButton?: boolean;
  showDeleteButton?: boolean;
  showViewButton?: boolean;
  showManageButton?: boolean;
  showReportButton?: boolean;
  showShareButton?: boolean;
  showBookmarkButton?: boolean;
  showFollowButton?: boolean;
  showMessageButton?: boolean;
  className?: string;
  onEdit?: () => void;
  onDelete?: () => void;
  onManage?: () => void;
  onReport?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onFollow?: () => void;
  onMessage?: () => void;
  onProductClick?: (productId: string) => void;
  onOrderClick?: (orderId: string) => void;
  customActions?: React.ReactNode;
  theme?: {
    primaryColor?: string;
    secondaryColor?: string;
    backgroundColor?: string;
    textColor?: string;
  };
}


export const ShopCard: React.FC<ShopCardProps> = ({
  shop,
  viewMode = 'vertical',
  onView,
  adminView = 'default',
  showHeader = true,
  showFooter = true,
  showDetails = true,
  showStats = true,
  showActions = true,
  showBadges = true,
  showContact = true,
  showSocial = true,
  showVerification = true,
  showFeatured = true,
  showTheme = false,
  showCreatedDate = false,
  showUpdatedDate = false,
  showOwner = true,
  showRating = true,
  showFollowers = true,
  showProductsPreview = true,
  showOrdersPreview = false,
  showRevenue = false,
  showQuickActions = false,
  showEditButton = false,
  showDeleteButton = false,
  showViewButton = true,
  showManageButton = false,
  showReportButton = false,
  showShareButton = false,
  showBookmarkButton = false,
  showFollowButton = false,
  showMessageButton = false,
  className,
  onEdit,
  onDelete,
  onManage,
  onReport,
  onShare,
  onBookmark,
  onFollow,
  onMessage,
  onProductClick,
  onOrderClick,
  customActions,
  theme
}) => {
  const isHorizontal = viewMode === 'horizontal';
  const isAdmin = adminView === 'admin';

  // Calcul des statistiques
  const stats = {
    products: shop.stats?.productCount || shop.productCount || 0,
    orders: shop.stats?.orderCount || 0,
    revenue: shop.stats?.revenue || 0,
    rating: shop.stats?.rating || 0,
    followers: shop.stats?.followersCount || 0,
    views: shop.viewCount || 0
  };

  // Formatage du revenue
  const formatRevenue = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'GTC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Formatage de la date
  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date(date));
  };

  // Rendu des badges
  const renderBadges = () => {
    if (!showBadges) return null;

    return (
      <div className="flex flex-wrap gap-1 mb-3">
        {shop.verified && showVerification && (
          <Badge variant="default" className="text-xs">
            <CheckCircle className="w-3 h-3 mr-1" />
            Vérifié
          </Badge>
        )}
        {shop.featured && showFeatured && (
          <Badge variant="secondary" className="text-xs">
            <Star className="w-3 h-3 mr-1" />
            Mis en avant
          </Badge>
        )}
        {shop.isActive && (
          <Badge variant="outline" className="text-xs">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
            Actif
          </Badge>
        )}
      </div>
    );
  };

  // Rendu des informations de contact
  const renderContact = () => {
    if (!showContact) return null;

    return (
      <div className="space-y-2 text-sm text-muted-foreground">
        {shop.phoneNumber && (
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>{shop.phoneNumber}</span>
          </div>
        )}
        {shop.country && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span>{shop.country}</span>
          </div>
        )}
        {shop.website && (
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <a href={shop.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
              {shop.website}
            </a>
          </div>
        )}
      </div>
    );
  };

  // Rendu des réseaux sociaux
  const renderSocial = () => {
    if (!showSocial || !shop.socialMedia || !Array.isArray(shop.socialMedia) || shop.socialMedia.length === 0) return null;

    return (
      <div className="flex gap-2 mt-3">
        {shop.socialMedia.map((social: any, index: number) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => window.open(social.url, '_blank')}
          >
            <span className="text-xs">{social.platform?.charAt(0)}</span>
          </Button>
        ))}
      </div>
    );
  };

  // Rendu des statistiques
  const renderStats = () => {
    if (!showStats) return null;

    return (
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-sm font-semibold">
            <Package className="w-4 h-4" />
            {stats.products}
          </div>
          <div className="text-xs text-muted-foreground">Produits</div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-sm font-semibold">
            <Eye className="w-4 h-4" />
            {stats.views}
          </div>
          <div className="text-xs text-muted-foreground">Vues</div>
        </div>
        {showFollowers && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-semibold">
              <Users className="w-4 h-4" />
              {stats.followers}
            </div>
            <div className="text-xs text-muted-foreground">Abonnés</div>
          </div>
        )}
        {showRating && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-sm font-semibold">
              <Star className="w-4 h-4" />
              {stats.rating.toFixed(1)}
            </div>
            <div className="text-xs text-muted-foreground">Note</div>
          </div>
        )}
      </div>
    );
  };

  // Rendu des détails avancés
  const renderDetails = () => {
    if (!showDetails) return null;

    return (
      <div className="space-y-3">
        {renderBadges()}
        {shop.description && (
          <p className="text-sm text-muted-foreground line-clamp-3">
            {shop.description}
          </p>
        )}
        {renderContact()}
        {renderSocial()}
        {renderStats()}
        
        {/* Aperçu des produits */}
        {showProductsPreview && shop.products && shop.products.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Package className="w-4 h-4" />
              Produits populaires
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {shop.products.slice(0, 4).map((product: any) => (
                <Button
                  key={product.id}
                  variant="outline"
                  size="sm"
                  className="h-20 p-2 text-left"
                  onClick={() => onProductClick?.(product.id)}
                >
                  <div className="text-xs">
                    <div className="font-medium truncate">{product.name}</div>
                    <div className="text-primary">{formatRevenue(product.price)}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Dates importantes */}
        {(showCreatedDate || showUpdatedDate) && (
          <div className="flex gap-4 text-xs text-muted-foreground mt-4">
            {showCreatedDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Créée le {shop.createdAt ? formatDate(shop.createdAt) : 'N/A'}
              </div>
            )}
            {showUpdatedDate && shop.updatedAt !== shop.createdAt && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Modifiée le {shop.updatedAt ? formatDate(shop.updatedAt) : 'N/A'}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Rendu des actions
  const renderActions = () => {
    if (!showActions) return null;

    return (
      <div className="flex flex-wrap gap-2">
        {showViewButton && onView && (
          <Button onClick={onView} variant="default" size="sm" className="flex-1">
            <EyeIcon className="w-4 h-4 mr-2" />
            Voir
          </Button>
        )}
        
        {showQuickActions && (
          <>
            {showFollowButton && onFollow && (
              <Button onClick={onFollow} variant="outline" size="sm">
                <Users className="w-4 h-4" />
              </Button>
            )}
            {showMessageButton && onMessage && (
              <Button onClick={onMessage} variant="outline" size="sm">
                <MessageCircle className="w-4 h-4" />
              </Button>
            )}
            {showBookmarkButton && onBookmark && (
              <Button onClick={onBookmark} variant="outline" size="sm">
                <Bookmark className="w-4 h-4" />
              </Button>
            )}
            {showShareButton && onShare && (
              <Button onClick={onShare} variant="outline" size="sm">
                <Share2 className="w-4 h-4" />
              </Button>
            )}
          </>
        )}

        {isAdmin && (
          <>
            {showEditButton && onEdit && (
              <Button onClick={onEdit} variant="outline" size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            )}
            {showDeleteButton && onDelete && (
              <Button onClick={onDelete} variant="destructive" size="sm">
                <Trash className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            )}
            {showManageButton && onManage && (
              <Button onClick={onManage} variant="outline" size="sm">
                <Settings className="w-4 h-4 mr-2" />
                Gérer
              </Button>
            )}
          </>
        )}

        {customActions}
      </div>
    );
  };

  // Style personnalisé du thème
  const cardStyle = theme ? {
    backgroundColor: theme.backgroundColor,
    color: theme.textColor,
    borderColor: theme.primaryColor
  } : {};

  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-200 hover:shadow-lg",
        isHorizontal && "flex",
        className
      )}
      style={cardStyle}
    >
      {/* Header */}
      {showHeader && (
        <CardHeader className={cn(
          "pb-3",
          isHorizontal && "flex-shrink-0 w-48"
        )}>
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={shop.profileImage || undefined} />
              <AvatarFallback>
                <ShoppingBag className="h-6 w-6" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg truncate">{shop.name}</CardTitle>
              {showOwner && shop.owner && (
                <CardDescription className="truncate">
                  Par {shop.owner.fullName || shop.owner.username}
                </CardDescription>
              )}
            </div>
          </div>
          {isAdmin && shop.balance !== undefined && (
            <Badge variant="outline" className="mt-2">
              <DollarSign className="w-3 h-3 mr-1" />
              Solde: {formatRevenue(Number(shop.balance))}
            </Badge>
          )}
        </CardHeader>
      )}

      {/* Content */}
      <CardContent className={cn(
        "flex-1",
        !showHeader && "pt-6",
        !showFooter && "pb-6"
      )}>
        {renderDetails()}
      </CardContent>

      {/* Footer */}
      {showFooter && (
        <CardFooter className={cn(
          "pt-3 flex-col gap-3",
          isHorizontal && "border-l"
        )}>
          {renderActions()}
        </CardFooter>
      )}
    </Card>
  );
};

export default ShopCard;
