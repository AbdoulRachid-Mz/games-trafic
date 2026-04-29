// app/tournaments/[tournamentId]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Users,
  Calendar,
  MapPin,
  Share2,
  Gamepad2, Shield,
  Award,
  Star, MessageCircle,
  ChevronRight,
  Settings,
  Eye, Grid,
  List,
  Plus, Check, BarChart, Swords,
  Target,
  Crown, UserPlus,
  Users2,
  Medal,
  Flag,
  PlayCircle,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { InteractionButton } from "@/components/shared/interaction-button";
import { CommentsSection } from "@/components/comments/comments-section";
import { useAuthContext } from "@/contexts/auth-context";
import { useScreenSize } from "@/hooks/use-screen";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
// import { TournamentCard } from "@/components/pages/tournaments/tournament-card";
import type {
  Tournament,
  TournamentMember
} from "@/database/schema";
import { toast } from "sonner";
import { EditionCard } from "@/components/pages/tournaments/editions/edition-card";
import { MemberCard } from "@/components/pages/tournaments/members/member-card";
import { MembershipRequestDialog } from "@/components/pages/tournaments/tournament-detail/membership-request-dialog";
import {
  addTournamentMember, getTournamentMembers,
  getTournaments
} from "@/actions/tournaments";
import {
  useTournamentById
} from "@/hooks/use-tournaments";
import { TournamentCard } from "@/components/cards/tournament-card";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import Link from "next/link";
import {
  ResponsiveTabs,
  type ResponsiveTab,
} from "@/components/ui/responsive-tabs";
import { shareTournament } from "@/utils/share";

export function TournamentPageContent({
  tournamentId,
}: {
  tournamentId: string;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const { isSmallScreen, isLargeScreen } = useScreenSize();

  // Optimized React Query Fetch
  const { data: tournament, isLoading: isTournamentLoading } =
    useTournamentById(tournamentId, ["organizer", "editions", "members"]);

  const [similarTournaments, setSimilarTournaments] = useState<Tournament[]>(
    [],
  );
  const [activeTab, setActiveTab] = useState("overview");
  const [showAllEditions, setShowAllEditions] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [showMembershipDialog, setShowMembershipDialog] = useState(false);
  const [memberViewMode, setMemberViewMode] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (tournament) {
      loadSimilarTournaments();
      checkMembership();
    }
  }, [tournament?.id, user?.id]);

  const loadSimilarTournaments = async () => {
    if (!tournament) return;
    try {
      const res = await getTournaments({
        pagination: { page: 1, limit: 12 },
        filters: {
          game: tournament.game,
          visibility: "PUBLIC",
          isDeleted: false,
        },
        options: { sortBy: "viewCount", sortOrder: "desc" },
      });
      const similar = res.data
        .filter((t) => t.id !== tournament.id)
        .slice(0, 8);
      setSimilarTournaments(similar);
    } catch (error) {
      console.error("Erreur chargement tournois similaires:", error);
    }
  };

  const checkMembership = async () => {
    if (!user || !tournament?.id) return;

    try {
      const res = await getTournamentMembers({
        filters: { tournamentId: tournament.id, userId: user.id },
        pagination: { page: 1, limit: 1 },
      });

      if (res.data.length > 0) {
        const member = res.data[0];
        setIsMember(true);
        setPendingRequest(Boolean(!member.isActive || member.isBanned));
      } else {
        setIsMember(false);
        setPendingRequest(false);
      }
    } catch (error) {
      console.error("Erreur vérification adhésion:", error);
    }
  };

  const isOrganizer = user && tournament && user.id === tournament.organizerId;

  const stats = [
    {
      icon: Trophy,
      label: "Cashprize Total",
      value: `${tournament?.totalPrizePool || 0} GTC`,
      color: "text-yellow-500",
    },
    {
      icon: Users,
      label: "Participants",
      value: tournament?.members?.length || 0,
      color: "text-blue-500",
    },
    {
      icon: Calendar,
      label: "Éditions",
      value: tournament?.editions?.length || 0,
      color: "text-green-500",
    },
    // {
    //   icon: Star,
    //   label: "Note",
    //   value: "4.9/5",
    //   color: "text-amber-500",
    // },
    // {
    //   icon: Clock,
    //   label: "Durée moyenne",
    //   value: "3h",
    //   color: "text-purple-500",
    // },
    // {
    //   icon: Crown,
    //   label: "Classement",
    //   value: "#8",
    //   color: "text-orange-500",
    // },
  ];

  const editions = tournament?.editions || [];
  const members = (tournament?.members as TournamentMember[]) || [];

  const tournamentTabs: ResponsiveTab[] = [
    { value: "overview", label: "Aperçu", icon: <Eye className="h-4 w-4" /> },
    {
      value: "editions",
      label: "Éditions",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      value: "members",
      label: "Membres",
      icon: <Users2 className="h-4 w-4" />,
    },
    {
      value: "comments",
      label: "Commentaires",
      icon: <MessageCircle className="h-4 w-4" />,
    },
  ];

  const displayedEditions = editions.slice(0, 5);
  const displayedMembers = showAllMembers ? members : members.slice(0, 12);

  const handleJoinTournament = () => {
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }

    if (isMember) {
      toast.info("Vous êtes déjà membre de ce tournoi");
      return;
    }

    setShowMembershipDialog(true);
  };

  const handleMembershipSubmit = async (data: any) => {
    try {
      await addTournamentMember({
        tournamentId,
        userId: user!.id,
        role: "PARTICIPANT",
        displayName:
          data.displayName || user!.username || user!.fullName || "Participant",
        gameTag: data.gameTag,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        gameLevel: data.gameLevel,
        gameRank: data.gameRank,
      } as any);

      toast.success("Demande d'adhésion envoyée avec succès");
      setShowMembershipDialog(false);
      checkMembership();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'envoi de la demande");
    }
  };

  const handleViewMember = (memberId: string) => {
    router.push(`/tournaments/${tournamentId}/members/${memberId}`);
  };

  if (isTournamentLoading) {
    return <TournamentSkeleton />;
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          <Card className="border-border/30 shadow-2xl shadow-primary/5 rounded-2xl overflow-hidden">
            <div className="relative h-40 bg-gradient-to-br from-primary/10 via-purple-500/10 to-pink-500/10">
              <div className="absolute inset-0 bg-grid-pattern opacity-5" />
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Trophy className="h-16 w-16 text-primary/40 drop-shadow-lg" />
                </motion.div>
              </div>
            </div>
            <CardContent className="p-8 text-center relative">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-background to-muted border-4 border-border/30 shadow-lg flex items-center justify-center">
                  <span className="text-3xl">🎮</span>
                </div>
              </div>

              <div className="mt-10 space-y-3">
                <Typography
                  variant="h3"
                  weight="bold"
                  className="bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent"
                >
                  Tournoi introuvable
                </Typography>
                <Typography
                  variant="body-base"
                  className="text-muted-foreground max-w-sm mx-auto"
                >
                  Il semble que ce tournoi n’existe pas ou ait été supprimé.
                </Typography>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={() => router.push("/tournaments")}
                  className="gap-2 shadow-md hover:shadow-primary/20 transition-shadow"
                >
                  <Gamepad2 className="h-4 w-4" />
                  Explorer les tournois
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    await router.refresh();
                    window.location.reload();
                  }}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Actualiser
                </Button>
              </div>

              <div className="mt-6 text-xs text-muted-foreground/70">
                Si le problème persiste, contactez le support.
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const upcomingEdition = editions.find((e) => e.status === "UPCOMING");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/10">
      {/* Header Premium */}
      <div className="relative">
        {/* Banner */}
        <div className="relative h-48 md:h-64 lg:h-80 overflow-hidden">
          {tournament.coverImage ? (
            <Image
              src={tournament.coverImage}
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
                {tournament.profileImage ? (
                  <Image
                    src={tournament.profileImage}
                    alt={tournament.name}
                    width={isSmallScreen ? 96 : 120}
                    height={isSmallScreen ? 96 : 120}
                    className="rounded-full border-4 border-background object-cover bg-background shadow-2xl"
                  />
                ) : (
                  <div className="w-24 h-24 md:w-30 md:h-30 rounded-full border-4 border-background bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shadow-2xl">
                    <Trophy className="h-12 w-12 md:h-16 md:w-16 text-primary" />
                  </div>
                )}

                {/* Verified Badge */}
                {tournament.verified && (
                  <div className="absolute bottom-2 right-2 w-6 h-6 md:w-8 md:h-8 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                    <Check className="h-3 w-3 md:h-4 md:w-4 text-white" />
                  </div>
                )}
              </div>
            </motion.div>

            {/* Tournament Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Typography
                  variant="h1"
                  weight="bold"
                  className="text-2xl md:text-4xl"
                >
                  {tournament.name}
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {tournament.verified && (
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 gap-1">
                      <Shield className="h-3 w-3" />
                      Vérifié
                    </Badge>
                  )}
                  {tournament.featured && (
                    <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 gap-1">
                      <Award className="h-3 w-3" />
                      En vedette
                    </Badge>
                  )}
                  {tournament.status === "LIVE" && (
                    <Badge className="bg-gradient-to-r from-red-500 to-pink-500 gap-1 animate-pulse">
                      <PlayCircle className="h-3 w-3" />
                      EN DIRECT
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    <Gamepad2 className="h-3 w-3" />
                    {tournament.game}
                  </Badge>
                </div>
              </div>

              {tournament.description && (
                <Typography
                  variant="body-lg"
                  className="max-w-3xl mb-4 text-muted-foreground"
                >
                  {tournament.description.length > 60
                    ? tournament.description.substring(0, 60) + "..."
                    : tournament.description}
                </Typography>
              )}

              {/* Tournament Meta */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                {upcomingEdition && (
                  <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Prochaine édition:{" "}
                      {format(
                        new Date(upcomingEdition.startDate),
                        "d MMMM yyyy",
                        { locale: fr },
                      )}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                  <MapPin className="h-4 w-4" />
                  <span>{tournament.platform || "Multiplateforme"}</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                  <Swords className="h-4 w-4" />
                  <span>{tournament.gameMode || "1v1"}</span>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                  <Target className="h-4 w-4" />
                  <span>
                    {tournament.visibility === "PRIVATE" ? "Privé" : "Public"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center max-md:w-full gap-3">
              <ResponsiveTabs
                tabs={
                  isOrganizer
                    ? [
                        {
                          value: "dashboard",
                          label: "Dashboard",
                          icon: <BarChart className="h-4 w-4" />,
                        },
                        {
                          value: "new-edition",
                          label: "Nouvelle édition",
                          icon: <Plus className="h-4 w-4" />,
                        },
                        {
                          value: "settings",
                          label: "Paramètres",
                          icon: <Settings className="h-4 w-4" />,
                        },
                        {
                          value: "manage-members",
                          label: "Gérer membres",
                          icon: <Users2 className="h-4 w-4" />,
                        },
                      ]
                    : [
                        {
                          value: "join",
                          label: isMember
                            ? "Déjà membre"
                            : pendingRequest
                            ? "En attente"
                            : "Rejoindre",
                          icon: <UserPlus className="h-4 w-4" />,
                        },
                        {
                          value: "follow",
                          label: "Suivre",
                          icon: <Star className="h-4 w-4" />,
                        },
                        {
                          value: "message",
                          label: "Message",
                          icon: <MessageCircle className="h-4 w-4" />,
                        },
                        {
                          value: "share",
                          label: "Partager",
                          icon: <Share2 className="h-4 w-4" />,
                        },
                        {
                          value: "report",
                          label: "Signaler",
                          icon: <AlertCircle className="h-4 w-4" />,
                        },
                      ]
                }
                defaultValue={
                  isOrganizer ? "dashboard" : isMember ? "follow" : "join"
                }
                onValueChange={(value) => {
                  if (isOrganizer) {
                    switch (value) {
                      case "dashboard":
                        router.push(`/tournaments/${tournamentId}/dashboard`);
                        break;
                      case "new-edition":
                        router.push(
                          `/tournaments/${tournamentId}/dashboard/editions`
                        );
                        break;
                      case "settings":
                        router.push(
                          `/tournaments/${tournamentId}/dashboard/settings`
                        );
                        break;
                      case "manage-members":
                        router.push(
                          `/tournaments/${tournamentId}/dashboard/members`
                        );
                        break;
                    }
                  } else {
                    switch (value) {
                      case "join":
                        handleJoinTournament();
                        break;
                      case "follow":
                        // InteractionButton logic is handled via custom render below
                        break;
                      case "message":
                        router.push(`/chats/tournament/${tournamentId}`);
                        break;
                      case "share":
                        shareTournament(tournamentId, tournament.name, {
                          successMessage: "Tournoi partagé avec succès",
                          fallbackMessage: "Lien du tournoi copié dans le presse-papier",
                          errorMessage: "Impossible de partager le tournoi"
                        });
                        break;
                    }
                  }
                }}
                desktopCount={isOrganizer ? 4 : 5}
                tabletCount={isOrganizer ? 3 : 3}
                mobileCount={isOrganizer ? 2 : 2}
                className="w-full"
              >
                {(tab) => {
                  if (!isOrganizer && tab.value === "follow") {
                    return (
                      <InteractionButton
                        type="follow"
                        entityType="TOURNAMENT"
                        entityId={tournamentId}
                        iconOnly={isSmallScreen}
                        variant="outline"
                        size={isSmallScreen ? "sm" : undefined}
                        withConfetti
                      />
                    );
                  }
                  if (!isOrganizer && tab.value === "join") {
                    return (
                      <Button
                        variant="default"
                        className="gap-2"
                        onClick={handleJoinTournament}
                        disabled={isMember || pendingRequest}
                      >
                        <UserPlus className="h-4 w-4" />
                        {isMember
                          ? "Déjà membre"
                          : pendingRequest
                          ? "En attente"
                          : "Rejoindre"}
                      </Button>
                    );
                  }
                  return null;
                }}
              </ResponsiveTabs>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="container mx-auto p-2">
        <div className="overflow-x-auto w-full">
          <StatsCarousel
            data={stats.map((s) => ({
              ...s,
              icon: <s.icon className="h-5 w-5" />,
            }))}
            itemsPerView={{
              mobile: 1,
              lg: 3,
              xl: 4,
            }}
            className="min-w-max"
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Organizer Info */}
            {tournament.organizer && (
              <Card className="p-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Crown className="h-5 w-5" />
                    Organisateur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    {tournament.organizer.profileImage ? (
                      <Image
                        src={tournament.organizer.profileImage}
                        alt={
                          tournament.organizer.fullName ||
                          tournament.organizer.username ||
                          "Organisateur"
                        }
                        width={48}
                        height={48}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Crown className="h-6 w-6 text-primary" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <Typography
                        variant="body-base"
                        weight="semibold"
                        className="truncate"
                      >
                        {tournament.organizer.fullName ||
                          tournament.organizer.username}
                      </Typography>
                      <Typography variant="caption2" theme="muted">
                        Organisateur vérifié
                      </Typography>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full mt-4 gap-2"
                    onClick={() => router.push(`/chats/tournament/${tournamentId}`)}
                  >
                    <MessageCircle className="h-4 w-4" />
                    Discuter
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Links */}
            <Card className="p-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Liens rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab("editions")}
                >
                  <Calendar className="h-4 w-4" />
                  Éditions
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab("members")}
                >
                  <Users2 className="h-4 w-4" />
                  Membres
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab("rules")}
                >
                  <Shield className="h-4 w-4" />
                  Règles
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3"
                  onClick={() => setActiveTab("comments")}
                >
                  <MessageCircle className="h-4 w-4" />
                  Commentaires
                </Button>
              </CardContent>
            </Card>

            {/* Tournament Info */}
            <Card className="p-3">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Infos tournoi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Swords className="h-4 w-4" /> Format
                  </span>
                  <span className="font-medium">
                    {tournament.gameMode || "1v1"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Target className="h-4 w-4" /> Visibilité
                  </span>
                  <span className="font-medium">
                    {tournament.visibility === "PRIVATE" ? "Privé" : "Public"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Flag className="h-4 w-4" /> Équipes
                  </span>
                  <span className="font-medium">
                    {tournament.allowedTeams ? "Oui" : "Non"}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Medal className="h-4 w-4" /> Inscription
                  </span>
                  <span className="font-medium">
                    {tournament.requiresAccessCode ? "Code requis" : "Libre"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Navigation Tabs */}
            <Card className="mb-4 p-3 overflow-visible">
              <CardContent className="p-0">
                <ResponsiveTabs
                  tabs={tournamentTabs}
                  defaultValue={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                />
              </CardContent>
            </Card>

            <AnimatePresence mode="wait">
              {/* Overview Tab */}
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Rules Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Règles du tournoi
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="prose max-w-none">
                        <Typography variant="body-base" className="mb-4">
                          {tournament.rules ||
                            "Les règles détaillées du tournoi seront bientôt disponibles."}
                        </Typography>
                      </div>

                      <Separator />

                      {/* Requirements */}
                      <div className="space-y-4">
                        <Typography
                          variant="h4"
                          weight="semibold"
                          className="flex items-center gap-2"
                        >
                          <Target className="h-5 w-5 text-blue-500" />
                          Conditions d'entrée
                        </Typography>
                        <ul className="space-y-3">
                          {tournament.requirements ? (
                            <li className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <Typography variant="body-sm">
                                {tournament.requirements}
                              </Typography>
                            </li>
                          ) : (
                            <>
                              {[
                                "Niveau minimum dans le jeu requis",
                                "Connexion stable obligatoire",
                                "Microphone fonctionnel pour la communication",
                                "Respect strict du code de conduite",
                                "Paiement des frais d'inscription si applicable",
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
                            </>
                          )}
                        </ul>
                      </div>

                      {/* Code of Conduct */}
                      <div className="space-y-4">
                        <Typography
                          variant="h4"
                          weight="semibold"
                          className="flex items-center gap-2"
                        >
                          <Shield className="h-5 w-5 text-amber-500" />
                          Code de conduite
                        </Typography>
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                          <Typography
                            variant="body-sm"
                            className="text-amber-800 dark:text-amber-300"
                          >
                            {tournament.codeOfConduct ||
                              "Tout comportement abusif, triche ou manque de respect envers les autres participants entraînera une disqualification immédiate et possiblement un bannissement permanent."}
                          </Typography>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* About Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5" />À propos du tournoi
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="prose max-w-none">
                        <Typography variant="body-base" className="mb-4">
                          {tournament.description ||
                            "Ce tournoi propose des compétitions de haut niveau avec des cashprizes attractifs."}
                        </Typography>
                      </div>

                      <Separator />

                      {/* Features */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                              "Arbitrage professionnel et impartial",
                              "Streaming HD des matchs importants",
                              "Support technique 24h/24",
                              "Paiements garantis et sécurisés",
                              "Système anti-triche avancé",
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
                              "Tournois à élimination directe",
                              "Compétitions par équipes",
                              "Événements spéciaux saisonniers",
                              "Qualifications régionales",
                              "Finales en LAN",
                              "Sponsors prestigieux",
                            ].map((specialty, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="gap-1"
                              >
                                <Target className="h-3 w-3" />
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

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
                          {tournament.contactEmail && (
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-primary/10">
                                <MessageCircle className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <Typography variant="body-sm" weight="medium">
                                  Email
                                </Typography>
                                <a
                                  href={`mailto:${tournament.contactEmail}`}
                                  className="text-primary hover:underline"
                                >
                                  {tournament.contactEmail}
                                </a>
                              </div>
                            </div>
                          )}
                          {tournament.discordServer && (
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-primary/10">
                                <MessageCircle className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <Typography variant="body-sm" weight="medium">
                                  Discord
                                </Typography>
                                <a
                                  href={tournament.discordServer}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  Rejoindre le serveur
                                </a>
                              </div>
                            </div>
                          )}
                          {tournament.whatsappGroup && (
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-primary/10">
                                <MessageCircle className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <Typography variant="body-sm" weight="medium">
                                  WhatsApp
                                </Typography>
                                <a
                                  href={tournament.whatsappGroup}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary hover:underline"
                                >
                                  Rejoindre le groupe
                                </a>
                              </div>
                            </div>
                          )}
                          {tournament.createdAt && (
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-primary/10">
                                <Calendar className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <Typography variant="body-sm" weight="medium">
                                  Créé le
                                </Typography>
                                <Typography variant="body-sm" theme="muted">
                                  {format(
                                    new Date(tournament.createdAt),
                                    "d MMMM yyyy",
                                    { locale: fr },
                                  )}
                                </Typography>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Latest Editions */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <Typography variant="h3" weight="bold">
                        Éditions récentes
                      </Typography>
                      <Button
                        variant="ghost"
                        onClick={() => setActiveTab("editions")}
                        className="gap-2"
                      >
                        Voir toutes
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {editions.slice(0, 3).map((edition) => (
                        <EditionCard
                          key={edition.id}
                          edition={edition}
                          showDetails={false}
                          tournamentId={tournamentId}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Editions Tab */}
              {activeTab === "editions" && (
                <motion.div
                  key="editions"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Editions Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <Typography variant="h3" weight="bold" className="mb-1">
                        Éditions du tournoi
                      </Typography>
                      <Typography variant="body-sm" theme="muted">
                        {editions.length} éditions organisées
                      </Typography>
                    </div>
                    {isOrganizer && (
                      <Button
                        className="gap-2"
                        onClick={() =>
                          router.push(
                            `/tournaments/${tournamentId}/dashboard/editions`,
                          )
                        }
                      >
                        <Plus className="h-4 w-4" />
                        Nouvelle édition
                      </Button>
                    )}
                  </div>

                  {/* Editions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedEditions.map((edition) => (
                      <EditionCard
                        key={edition.id}
                        edition={edition}
                        showDetails={false}
                        tournamentId={tournamentId}
                        onView={() =>
                          router.push(
                            `/tournaments/${tournamentId}/editions/${edition.id}`,
                          )
                        }
                      />
                    ))}
                  </div>

                  {/* Load More */}
                  {editions.length > 5 && (
                    <div className="text-center pt-6">
                      <Button variant="outline" asChild className="gap-2">
                        <Link href={`/tournaments/${tournamentId}/editions`}>
                          Voir toutes les éditions
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Members Tab */}
              {activeTab === "members" && (
                <motion.div
                  key="members"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  {/* Members Header */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <Typography variant="h3" weight="bold" className="mb-1">
                        Membres du tournoi
                      </Typography>
                      <Typography variant="body-sm" theme="muted">
                        {members.length} membres actifs
                      </Typography>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Button
                          variant={
                            memberViewMode === "grid" ? "default" : "outline"
                          }
                          size="icon"
                          onClick={() => setMemberViewMode("grid")}
                        >
                          <Grid className="h-4 w-4" />
                        </Button>
                        <Button
                          variant={
                            memberViewMode === "list" ? "default" : "outline"
                          }
                          size="icon"
                          onClick={() => setMemberViewMode("list")}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </div>
                      {isOrganizer && (
                        <Button
                          variant="outline"
                          onClick={() =>
                            router.push(
                              `/tournaments/${tournamentId}/dashboard/members`,
                            )
                          }
                        >
                          Gérer les membres
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Members Grid */}
                  <div
                    className={cn(
                      "gap-4",
                      memberViewMode === "grid"
                        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
                        : "flex flex-col gap-4",
                    )}
                  >
                    {displayedMembers.map((member) => (
                      <MemberCard
                        key={member.id}
                        member={member}
                        viewMode={memberViewMode}
                        onView={() => handleViewMember(member.id)}
                        isOrganizer={isOrganizer ?? undefined}
                      />
                    ))}
                  </div>

                  {/* Load More */}
                  {members.length > 12 && (
                    <div className="text-center pt-6">
                      <Button
                        variant="outline"
                        onClick={() => setShowAllMembers(!showAllMembers)}
                        className="gap-2"
                      >
                        {showAllMembers
                          ? "Voir moins"
                          : "Voir tous les membres"}
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            showAllMembers && "rotate-90",
                          )}
                        />
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Rules Tab */}
              {activeTab === "rules" && (
                <motion.div
                  key="rules"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        Règles du tournoi
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="prose max-w-none">
                        <Typography variant="body-base" className="mb-4">
                          {tournament.rules ||
                            "Les règles détaillées du tournoi seront bientôt disponibles."}
                        </Typography>
                      </div>

                      <Separator />

                      {/* Requirements */}
                      <div className="space-y-4">
                        <Typography
                          variant="h4"
                          weight="semibold"
                          className="flex items-center gap-2"
                        >
                          <Target className="h-5 w-5 text-blue-500" />
                          Conditions d'entrée
                        </Typography>
                        <ul className="space-y-3">
                          {tournament.requirements ? (
                            <li className="flex items-start gap-3">
                              <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                              <Typography variant="body-sm">
                                {tournament.requirements}
                              </Typography>
                            </li>
                          ) : (
                            <>
                              {[
                                "Niveau minimum dans le jeu requis",
                                "Connexion stable obligatoire",
                                "Microphone fonctionnel pour la communication",
                                "Respect strict du code de conduite",
                                "Paiement des frais d'inscription si applicable",
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
                            </>
                          )}
                        </ul>
                      </div>

                      {/* Code of Conduct */}
                      <div className="space-y-4">
                        <Typography
                          variant="h4"
                          weight="semibold"
                          className="flex items-center gap-2"
                        >
                          <Shield className="h-5 w-5 text-amber-500" />
                          Code de conduite
                        </Typography>
                        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                          <Typography
                            variant="body-sm"
                            className="text-amber-800 dark:text-amber-300"
                          >
                            {tournament.codeOfConduct ||
                              "Tout comportement abusif, triche ou manque de respect envers les autres participants entraînera une disqualification immédiate et possiblement un bannissement permanent."}
                          </Typography>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Comments Tab */}
              {activeTab === "comments" && (
                <motion.div
                  key="comments"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <CommentsSection
                    entityId={tournamentId}
                    entityType={"TOURNAMENT"}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Similar Tournaments */}
            {similarTournaments.length > 0 && (
              <div className="mt-10 space-y-4">
                <Typography variant="h3" weight="bold">
                  Tournois similaires
                </Typography>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {similarTournaments.map((t) => (
                    <TournamentCard
                      showDetails={false}
                      key={t.id}
                      tournament={t}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Membership Request Dialog */}
      <MembershipRequestDialog
        open={showMembershipDialog}
        onOpenChange={setShowMembershipDialog}
        tournament={tournament}
        user={user}
        onSubmit={handleMembershipSubmit}
      />
    </div>
  );
}

// Skeleton
export function TournamentSkeleton() {
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
