// components/profile/user-profile.tsx
"use client";

import React, { useState } from "react";
import { useAuthContext } from "@/contexts/auth-context";
import { useUserProfile } from "@/hooks/use-profile";
import { useScreenSize } from "@/hooks/use-screen";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MessageCircle,
  UserPlus,
  UserCheck,
  MoreHorizontal,
  Edit3,
  LogOut,
  CreditCard,
  MapPin,
  Globe,
  Calendar,
  Shield,
  Star,
  ChartPie,
  Users,
  ShoppingBag,
  Trophy,
  FileText,
  Camera,
  QrCode,
  Share2,
  Bell,
  Mail,
  Phone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileTabs } from "./profile-tabs";
import { QRCodeDisplay } from "@/components/shared/qr-code-2";
import { Skeleton } from "@/components/ui/skeleton";

interface UserProfileProps {
  userId?: string;
  username?: string;
  email?: string;
}

interface UserStats {
  posts: number;
  followers: number;
  following: number;
  tournaments: number;
  shops: number;
  products: number;
}

export function UserProfile({ userId, username, email }: UserProfileProps) {
  const {
    user: currentUser,
    isAuthenticated,
    refreshUser,
    loading: authLoading,
  } = useAuthContext();

  const { data: completeData, loading: profileLoading } =
    useUserProfile(isAuthenticated);

  const { isSmallScreen, isMediumScreen } = useScreenSize(); // Keep this

  const [isFollowing, setIsFollowing] = useState(false);
  const [showQrDrawer, setShowQrDrawer] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);

  // Utiliser les données réelles du contexte
  // Note: If userId is provided (viewing another user), we should ideally fetch that user.
  // But legacy code used 'completeData' (current user).
  // We keep legacy behavior for now for "My Profile" view.
  const profileUser = completeData || currentUser;
  const loading = authLoading || (isAuthenticated && profileLoading);

  if (!profileUser && !loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Typography variant="h4">Utilisateur non trouvé</Typography>
        <Button variant="default" onClick={async () => await refreshUser()}>
          Actualiser
        </Button>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ProfileSkeleton />
      </div>
    );
  }

  const isOwnProfile = !userId && !username && !email;

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <ProfileSkeleton />
      </div>
    );
  }

  // Calculer les statistiques à partir des données réelles
  const userStats: UserStats = {
    posts: profileUser.postsCreatedCount || 0,
    followers: 0, // À récupérer depuis les interactions
    following: 0, // À récupérer depuis les interactions
    tournaments: profileUser.tournamentsCreatedCount || 0,
    shops: profileUser.shopsCreatedCount || 0,
    products: completeData?.products?.length || 0,
  };

  // Fonction pour calculer le pourcentage de complétion du profil
  function calculateProfileCompletion(user: any): number {
    const fields = [
      "username",
      "email",
      "fullName",
      "profileImage",
      "bio",
      "website",
      "country",
      "phoneNumber",
    ];

    const completedFields = fields.filter((field) => {
      const value = (user as any)[field];
      return value && value.toString().trim().length > 0;
    }).length;

    return Math.round((completedFields / fields.length) * 100);
  }

  const profileCompletion = calculateProfileCompletion(profileUser);

  // Actions des boutons
  const handleFollow = () => {
    setIsFollowing(!isFollowing);
    // Ici, vous ajouterez la logique pour suivre/désuivre l'utilisateur
  };

  const handleMessage = () => {
    // Ici, vous ajouterez la logique pour ouvrir la messagerie
    console.log("Ouvrir messagerie avec", profileUser.username);
  };

  const handleEditProfile = () => {
    // Ici, vous ajouterez la logique pour éditer le profil
    console.log("Éditer le profil");
  };

  const handleCreateCard = () => {
    // Ici, vous ajouterez la logique pour créer une carte virtuelle
    console.log("Créer une carte virtuelle");
  };

  const handleSignOut = () => {
    // Ici, vous ajouterez la logique pour se déconnecter
    console.log("Se déconnecter");
  };

  const handleShareProfile = () => {
    // Ici, vous ajouterez la logique pour partager le profil
    console.log("Partager le profil");
  };

  // Composant pour le cercle de progression du profil
  const ProfileCompletionCircle = ({ completion }: { completion: number }) => {
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (completion / 100) * circumference;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <svg width="100" height="100" className="transform -rotate-90">
                {/* Cercle de fond */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-gray-200 dark:text-gray-700"
                />
                {/* Cercle de progression */}
                <circle
                  cx="50"
                  cy="50"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="text-primary transition-all duration-500"
                  strokeLinecap="round"
                />
              </svg>
              {/* Badge avec pourcentage au centre */}
              <div className="absolute inset-0 flex items-center justify-center">
                <Badge
                  variant="secondary"
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-background border-2 shadow-sm"
                >
                  <Typography variant="body-sm" weight="bold">
                    {completion}%
                  </Typography>
                </Badge>
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>Profil complété à {completion}%</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header avec image de couverture */}
      <div className="relative">
        <div
          className="h-48 md:h-64 bg-cover bg-center"
          style={{
            backgroundImage: profileUser.coverImage
              ? `url(${
                  profileUser.coverImage != ""
                    ? profileUser.coverImage
                    : "/images/icons/background/bg-controller.jpg"
                })`
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-background to-transparent" />

        {/* Contenu du header */}
        <div className="container mx-auto px-4 relative -mt-20">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4">
            {/* Avatar avec badge de progression */}
            <div className="relative">
              <div className="relative">
                <Avatar className="w-32 h-32 md:w-40 md:h-40 border-4 border-background">
                  <AvatarImage
                    src={
                      profileUser.profileImage ||
                      "/images/icons/3d-icons/users/3dicons-boy-dynamic-color.png"
                    }
                    alt={
                      profileUser.fullName ||
                      profileUser.username ||
                      "image profile"
                    }
                  />
                  <AvatarFallback>
                    {profileUser.fullName
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") ||
                      profileUser.username?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Cercle de progression */}
                <div className="absolute -bottom-2 -right-2">
                  <ProfileCompletionCircle completion={profileCompletion} />
                </div>
              </div>
            </div>

            {/* Informations utilisateur */}
            <div className="flex-1 space-y-4 pb-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Typography variant="h3" weight="bold">
                      {profileUser.fullName || profileUser.username}
                    </Typography>
                    {profileUser.emailVerified && (
                      <Badge
                        variant="secondary"
                        className="bg-primary text-white"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Vérifié
                      </Badge>
                    )}
                    {profileUser.isVip && (
                      <Badge
                        variant="secondary"
                        className="bg-linear-to-r from-yellow-500 to-orange-500 text-white"
                      >
                        <Star className="w-3 h-3 mr-1" />
                        VIP
                      </Badge>
                    )}
                    {profileUser.isAdmin && (
                      <Badge
                        variant="secondary"
                        className="bg-secondary text-white"
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>

                  <Typography variant="body-lg" theme="muted">
                    @{profileUser.username}
                  </Typography>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {profileUser.country && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{profileUser.country}</span>
                      </div>
                    )}
                    {profileUser.website && (
                      <div className="flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        <a
                          href={profileUser.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-primary transition-colors"
                        >
                          Site web
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Rejoint en{" "}
                        {new Date(profileUser.createdAt).getFullYear()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center gap-2">
                  {!isOwnProfile ? (
                    <>
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        onClick={handleFollow}
                        className="flex items-center gap-2"
                      >
                        {isFollowing ? (
                          <>
                            <UserCheck className="w-4 h-4" />
                            Suivi
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            Suivre
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        onClick={handleMessage}
                        className="flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Message
                      </Button>
                      {/* <Button
                        variant="outline"
                        onClick={setShowStatsDrawer(true)}
                        className="flex items-center gap-2"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Stats
                      </Button> */}
                    </>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={handleEditProfile}
                        className="flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        Modifier
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => setShowQrDrawer(true)}
                        className="flex items-center gap-2"
                      >
                        <QrCode className="w-4 h-4" />
                        QR Code
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => setShowStatsDrawer(true)}
                    className="flex items-center gap-2"
                  >
                    <ChartPie className="w-4 h-4" />
                    Stats
                  </Button>

                  {/* Menu déroulant des options */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="default" size="icon">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isOwnProfile ? (
                        <>
                          <DropdownMenuItem onClick={handleEditProfile}>
                            <Edit3 className="w-4 h-4 mr-2" />
                            Modifier le profil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleCreateCard}>
                            <CreditCard className="w-4 h-4 mr-2" />
                            {completeData?.wallet
                              ? "Voir ma carte"
                              : "Créer une carte"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setShowQrDrawer(true)}
                          >
                            <QrCode className="w-4 h-4 mr-2" />
                            QR Code du profil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleShareProfile}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Partager le profil
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={handleSignOut}
                            className="text-destructive"
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Se déconnecter
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem onClick={handleShareProfile}>
                            <Share2 className="w-4 h-4 mr-2" />
                            Partager le profil
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Bell className="w-4 h-4 mr-2" />
                            Notifier
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            <Shield className="w-4 h-4 mr-2" />
                            Signaler
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Bio */}
              {profileUser.bio && (
                <Typography variant="body-base" className="max-w-2xl">
                  {profileUser.bio}
                </Typography>
              )}

              {/* Badges des types de compte */}
              <div className="flex flex-wrap gap-2">
                {profileUser.accountTypes?.map((type) => (
                  <Badge key={type} variant="outline" className="capitalize">
                    {type.toLowerCase().replace("_", " ")}
                  </Badge>
                ))}
                {profileUser.level && (
                  <Badge variant="outline">Niveau {profileUser.level}</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 max-md:px-2 max-md:py-2 py-8">
        {/* Statistiques */}
        {/* <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
              <div className="space-y-1">
                <Typography variant="h4" weight="bold">
                  {userStats.posts}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Publications
                </Typography>
              </div>
              <div className="space-y-1">
                <Typography variant="h4" weight="bold">
                  {userStats.followers}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Abonnés
                </Typography>
              </div>
              <div className="space-y-1">
                <Typography variant="h4" weight="bold">
                  {userStats.following}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Abonnements
                </Typography>
              </div>
              <div className="space-y-1">
                <Typography variant="h4" weight="bold">
                  {userStats.tournaments}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Tournois
                </Typography>
              </div>
              <div className="space-y-1">
                <Typography variant="h4" weight="bold">
                  {userStats.shops}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Boutiques
                </Typography>
              </div>
              <div className="space-y-1">
                <Typography variant="h4" weight="bold">
                  {userStats.products}
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Produits
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card> */}

        {/* Onglets personnalisés */}
        <ProfileTabs profileUser={profileUser} isOwnProfile={isOwnProfile} />
      </div>

      {/* Drawer QR Code */}
      <Drawer open={showQrDrawer} onOpenChange={setShowQrDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>QR Code du profil</DrawerTitle>
          </DrawerHeader>
          <div className="p-6 flex flex-col items-center space-y-4">
            <QRCodeDisplay
              data={`${
                typeof window !== "undefined" ? window.location.origin : ""
              }/profile/${profileUser.username}`}
              size={200}
              title={`Profil de ${
                profileUser.fullName || profileUser.username
              }`}
              description="Scannez ce QR code pour accéder au profil"
              showActions={true}
            />
          </div>
        </DrawerContent>
      </Drawer>

      {/* Drawer QR Code */}
      <Drawer open={showStatsDrawer} onOpenChange={setShowStatsDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Statistiques Globales</DrawerTitle>
          </DrawerHeader>
          {/* Statistiques */}
          <Card className="mb-6 max-md:mb-4">
            <CardContent className="p-6 max-md:p-2">
              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 max-md:gadp-2 text-center">
                <div className="space-y-1">
                  <Typography variant="h4" weight="bold">
                    {userStats.posts}
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    Publications
                  </Typography>
                </div>
                <div className="space-y-1">
                  <Typography variant="h4" weight="bold">
                    {userStats.followers}
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    Abonnés
                  </Typography>
                </div>
                <div className="space-y-1">
                  <Typography variant="h4" weight="bold">
                    {userStats.following}
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    Abonnements
                  </Typography>
                </div>
                <div className="space-y-1">
                  <Typography variant="h4" weight="bold">
                    {userStats.tournaments}
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    Tournois
                  </Typography>
                </div>
                <div className="space-y-1">
                  <Typography variant="h4" weight="bold">
                    {userStats.shops}
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    Boutiques
                  </Typography>
                </div>
                <div className="space-y-1">
                  <Typography variant="h4" weight="bold">
                    {userStats.products}
                  </Typography>
                  <Typography variant="body-sm" theme="muted">
                    Produits
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

const ProfileSkeleton = () => (
  <div className="container mx-auto px-4 py-8 space-y-6">
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1 space-y-3">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
      </CardContent>
    </Card>
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-64 w-full" />
  </div>
);
