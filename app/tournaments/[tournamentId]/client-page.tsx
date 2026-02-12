// app/tournaments/[tournamentId]/page.tsx
"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy,
  Users,
  Calendar,
  MapPin,
  Share2,
  Gamepad2,
  Clock,
  Shield,
  Award,
  Star,
  TrendingUp,
  MessageCircle,
  ChevronRight,
  Settings,
  Eye,
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
  DollarSign,
  BarChart,
  CheckCircleIcon,
  Swords,
  Target,
  Crown,
  Sword,
  UserPlus,
  Users2,
  Medal,
  Flag,
  PlayCircle,
  AlertCircle,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { InteractionButton } from "@/components/shared/interaction-button";
import { CommentsSection } from "@/components/comments/comments-section";
// import { getTournamentById, getTournaments } from "@/actions/tournanents";
import { useAuthContext } from "@/contexts/auth-context";
import { useScreenSize } from "@/hooks/use-screen";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { TournamentCard } from "@/components/pages/tournaments/tournament-card";
// import { MemberCard } from "@/components/pages/tournaments/member-card";
// import { EditionCard } from "@/components/pages/tournaments/edition-card";
// import { MembershipRequestDialog } from "@/components/pages/tournaments/membership-request-dialog";
// import {
//   getTournamentMembers,
//   addTournamentMember,
// } from "@/actions/tournanents";
import type {
  TournamentWithRelations,
  Tournament,
  TournamentMember,
} from "@/database/schema";
import { toast } from "sonner";
import { EditionCard } from "@/components/pages/tournaments/editions/edition-card";
import { MemberCard } from "@/components/pages/tournaments/members/member-card";
import { MembershipRequestDialog } from "@/components/pages/tournaments/tournament-detail/membership-request-dialog";
import {
  addTournamentMember,
  getTournamentById,
  getTournamentMembers,
  getTournaments,
} from "@/actions/tournaments";

export function TournamentPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthContext();
  const { isSmallScreen, isLargeScreen } = useScreenSize();

  const [tournament, setTournament] = useState<TournamentWithRelations | null>(
    null
  );
  const [similarTournaments, setSimilarTournaments] = useState<Tournament[]>(
    []
  );
  const [members, setMembers] = useState<TournamentMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [showAllEditions, setShowAllEditions] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [pendingRequest, setPendingRequest] = useState(false);
  const [showMembershipDialog, setShowMembershipDialog] = useState(false);
  const [memberViewMode, setMemberViewMode] = useState<"grid" | "list">("grid");

  const tournamentId = params.tournamentId as string;

  useEffect(() => {
    loadTournament();
    loadSimilarTournaments();
    checkMembership();
  }, [tournamentId, user]);

  const loadTournament = async () => {
    setIsLoading(true);
    try {
      const data = await getTournamentById(tournamentId, {
        populate: ["organizer", "editions", "theme", "members"],
      });
      setTournament(data as TournamentWithRelations);
      if (data?.members) {
        setMembers(data.members as TournamentMember[]);
      }
    } catch (error) {
      console.error("Erreur chargement tournoi:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSimilarTournaments = async () => {
    try {
      const res = await getTournaments({
        pagination: { page: 1, limit: 12 },
        filters: {
          game: tournament?.game,
          visibility: "PUBLIC",
          isDeleted: false,
        },
        options: { sortBy: "viewCount", sortOrder: "desc" },
      });
      const similar = res.data.filter((t) => t.id !== tournamentId).slice(0, 8);
      setSimilarTournaments(similar);
    } catch (error) {
      console.error("Erreur chargement tournois similaires:", error);
    }
  };

  const checkMembership = async () => {
    if (!user || !tournamentId) return;

    try {
      const res = await getTournamentMembers({
        filters: { tournamentId, userId: user.id },
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
      value: tournament?.totalParticipants || 0,
      color: "text-blue-500",
    },
    {
      icon: Calendar,
      label: "Éditions",
      value: tournament?.totalEditions || 0,
      color: "text-green-500",
    },
    {
      icon: Star,
      label: "Note",
      value: "4.9/5",
      color: "text-amber-500",
    },
    {
      icon: Clock,
      label: "Durée moyenne",
      value: "3h",
      color: "text-purple-500",
    },
    {
      icon: Crown,
      label: "Classement",
      value: "#8",
      color: "text-orange-500",
    },
  ];

  const editions = tournament?.editions || [];

  const displayedEditions = showAllEditions ? editions : editions.slice(0, 6);
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

  if (isLoading) {
    return <TournamentSkeleton />;
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <Typography variant="h4" weight="bold" className="mb-2">
              Tournoi non trouvé
            </Typography>
            <Button onClick={() => router.push("/tournaments")}>
              Explorer les tournois
            </Button>
          </CardContent>
        </Card>
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
                  {tournament.description}
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
                        { locale: fr }
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
              {isOrganizer ? (
                <>
                  <Button
                    variant="default"
                    className="gap-2 max-md:flex-1"
                    onClick={() =>
                      router.push(`/tournaments/${tournamentId}/dashboard`)
                    }
                  >
                    <BarChart className="h-4 w-4" />
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    className="gap-2 max-md:flex-1"
                    onClick={() =>
                      router.push(
                        `/tournaments/${tournamentId}/dashboard/editions`
                      )
                    }
                  >
                    <Plus className="h-4 w-4" />
                    Nouvelle édition
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/tournaments/${tournamentId}/dashboard/settings`)
                        }
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Paramètres
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/tournaments/${tournamentId}/dashboard/members`)
                        }
                      >
                        <Users2 className="h-4 w-4 mr-2" />
                        Gérer membres
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <>
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
                  <InteractionButton
                    type="follow"
                    entityType="TOURNAMENT"
                    entityId={tournamentId}
                    iconOnly={isSmallScreen}
                    variant="outline"
                    size={isSmallScreen ? "sm" : undefined}
                    withConfetti
                  />
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() =>
                      router.push(`/chats?tournament=${tournamentId}`)
                    }
                  >
                    <MessageCircle className="h-4 w-4" />
                    {!isSmallScreen && "Message"}
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => console.log("Share tournament")}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Partager
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => console.log("Report tournament")}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
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

      {/* Stats Grid */}
      <div className="container mx-auto p-3">
        <div className="overflow-x-auto w-full">
          <div className="flex gap-3 justify-center items-center min-w-max">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex-1 max-md:min-w-[150px]"
              >
                <Card className="h-full hover:shadow-md p-2 transition-all">
                  <CardContent className="p-2 text-center">
                    <div
                      className={`p-2 rounded-full ${stat.color}/10 inline-flex mb-2`}
                    >
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <Typography variant="h5" weight="bold" className="mb-1">
                      {stat.value}
                    </Typography>
                    <Typography variant="caption1" theme="muted">
                      {stat.label}
                    </Typography>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
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
                  <Button variant="outline" className="w-full mt-4 gap-2">
                    <MessageCircle className="h-4 w-4" />
                    Contacter
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
            <Card className="mb-4 p-3">
              <CardContent className="p-2">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid grid-cols-4 w-full">
                    <TabsTrigger value="overview" className="gap-2">
                      <Eye className="h-4 w-4" />
                      Aperçu
                    </TabsTrigger>
                    <TabsTrigger value="editions" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      Éditions
                    </TabsTrigger>
                    <TabsTrigger value="members" className="gap-2">
                      <Users2 className="h-4 w-4" />
                      Membres
                    </TabsTrigger>
                    {/* <TabsTrigger value="rules" className="gap-2">
                      <Shield className="h-4 w-4" />
                      Règles
                    </TabsTrigger> */}
                    <TabsTrigger value="comments" className="gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Commentaires
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
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
                        <Trophy className="h-5 w-5" />
                        À propos du tournoi
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
                                    { locale: fr }
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
                            `/tournaments/${tournamentId}/dashboard/editions`
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
                        tournamentId={tournamentId}
                        onView={() => router.push(`/tournaments/${tournamentId}/editions/${edition.id}`)}
                      />
                    ))}
                  </div>

                  {/* Load More */}
                  {editions.length > 6 && (
                    <div className="text-center pt-6">
                      <Button
                        variant="outline"
                        onClick={() => setShowAllEditions(!showAllEditions)}
                        className="gap-2"
                      >
                        {showAllEditions
                          ? "Voir moins"
                          : "Voir toutes les éditions"}
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            showAllEditions && "rotate-90"
                          )}
                        />
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
                              `/tournaments/${tournamentId}/members/manage`
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
                        : "flex flex-col gap-4"
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
                            showAllMembers && "rotate-90"
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {similarTournaments.map((t) => (
                    <TournamentCard key={t.id} tournament={t} />
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
