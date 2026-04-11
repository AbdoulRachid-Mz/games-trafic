// app/tournaments/[tournamentId]/members/[memberId]/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AnimatePresence, motion } from "framer-motion";
import {
  Trophy,
  Medal,
  Target,
  Calendar,
  Users,
  Sword,
  Crown,
  MessageCircle,
  Edit,
  Shield,
  Award,
  TrendingUp,
  BarChart,
  User,
} from "lucide-react";
import {
  getTournamentMemberById,
  updateTournamentMember,
  getMemberStatsByEdition,
  getTeamMembers,
} from "@/actions/members";
import { getMatchesWithParticipants } from "@/actions/phases";
import { updateTeam } from "@/actions/participants";
import { useAuthContext } from "@/contexts/auth-context";
import type { TournamentMember } from "@/database/schema";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  ResponsiveTabs,
  type ResponsiveTab,
} from "@/components/ui/responsive-tabs";
import { MatchCard } from "@/components/cards/match-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const memberTabs: ResponsiveTab[] = [
  { value: "profile", label: "Profil", icon: <User className="h-4 w-4" /> },
  {
    value: "history",
    label: "Éditions",
    icon: <Calendar className="h-4 w-4" />,
  },
  { value: "matches", label: "Matchs", icon: <Sword className="h-4 w-4" /> },
  {
    value: "teammates",
    label: "Coéquipiers",
    icon: <Users className="h-4 w-4" />,
  },
  {
    value: "achievements",
    label: "Réussites",
    icon: <Medal className="h-4 w-4" />,
  },
];

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const [member, setMember] = useState<any>(null);
  const [editionStats, setEditionStats] = useState<any[]>([]);
  const [teammates, setTeammates] = useState<any[]>([]);
  const [matchesList, setMatchesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("profile");

  // States for Editing
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showEditTeam, setShowEditTeam] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editData, setEditData] = useState<any>({});
  const [teamEditData, setTeamEditData] = useState<any>({});

  const tournamentId = params.tournamentId as string;
  const memberId = params.memberId as string;

  useEffect(() => {
    loadMember();
  }, [memberId]);

  const loadMember = async () => {
    setLoading(true);
    try {
      const data = await getTournamentMemberById(memberId);
      if (data) {
        setMember(data);
        setEditData({
          displayName: data.displayName || "",
          gameTag: data.gameTag || "",
          biography: data.biography || "",
          clubName: data.clubName || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
        });

        if (data.team) {
          setTeamEditData({
            name: data.team.name || "",
          });
        }

        // Load additional info in parallel
        const [stats, teamRes] = await Promise.all([
          getMemberStatsByEdition(memberId),
          data.teamId ? getTeamMembers(data.teamId) : Promise.resolve([]),
        ]);

        setEditionStats(stats);
        setTeammates(teamRes.filter((m) => m.id !== memberId));

        // Load matches if any registrations exist
        if (stats.length > 0) {
          // Get matches for all registrations
          const matchesPromises = stats.map((s) =>
            getMatchesWithParticipants({
              filters: { memberRegistrationId: s.id },
              pagination: { page: 1, limit: 10 },
            }),
          );
          const matchesResults = await Promise.all(matchesPromises);
          const allMatches = matchesResults.flatMap((res) => res.data);
          // Sort by date desc
          setMatchesList(
            allMatches.sort(
              (a, b) =>
                new Date(b.scheduledTime || b.createdAt).getTime() -
                new Date(a.scheduledTime || a.createdAt).getTime(),
            ),
          );
        }
      }
    } catch (error) {
      console.error("Erreur chargement membre:", error);
      toast.error("Impossible de charger les données du membre");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsSubmitting(true);
    try {
      await updateTournamentMember(memberId, editData);
      toast.success("Profil mis à jour");
      setShowEditProfile(false);
      loadMember();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTeam = async () => {
    if (!member?.teamId) return;
    setIsSubmitting(true);
    try {
      await updateTeam(member.teamId, teamEditData);
      toast.success("Équipe mise à jour");
      setShowEditTeam(false);
      loadMember();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOwner = user?.id === member?.userId;
  const isOrganizer = member?.role === "ORGANIZER";

  if (loading) {
    return (
      <div className="mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-48 w-full rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-64 rounded-xl" />
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <Typography variant="h4">Membre non trouvé</Typography>
        <Button onClick={() => router.back()}>Retour</Button>
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 py-4">
      {/* Banner */}
      <div className="relative h-48 rounded-xl overflow-hidden mb-8">
        {member.banner ? (
          <div className="relative h-full w-full">
            <Image
              src={member.banner}
              fill={true}
              alt="Bannière"
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-purple-500/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="absolute bottom-0 left-0 w-full p-6">
          <div className="flex items-end gap-6">
            <Avatar className="h-24 w-24 border-4 border-background">
              <AvatarImage src={member.avatar || undefined} />
              <AvatarFallback className="text-2xl">
                {member.displayName?.[0] || "M"}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Typography variant="h3" weight="bold">
                  {member.displayName}
                </Typography>
                {member.isVerified && (
                  <Badge className="bg-green-500 gap-1">
                    <Shield className="h-3 w-3" />
                    Vérifié
                  </Badge>
                )}
                {member.role === "ORGANIZER" && (
                  <Badge className="bg-amber-500 gap-1">
                    <Crown className="h-3 w-3" />
                    Organisateur
                  </Badge>
                )}
              </div>

              <Typography variant="body-base" theme="muted">
                {member.gameTag} • {member.clubName || "Sans club"}
              </Typography>
            </div>

            <div className="ml-auto flex items-center gap-3">
              {member.userId && (
                <Button asChild variant="secondary" className="rounded-full">
                  <Link href={`/profile/${member.userId}`}>
                    <User className="h-4 w-4 mr-2" />
                    Profil Réel
                  </Link>
                </Button>
              )}
              
              {(isOwner || isOrganizer) && (
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setShowEditProfile(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">Modifier Profil</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Stats Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    <Typography variant="h4" weight="bold">
                      {member.totalWins}
                    </Typography>
                  </div>
                  <Typography variant="caption2" theme="muted">
                    Victoires
                  </Typography>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Sword className="h-5 w-5 text-blue-500" />
                    <Typography variant="h4" weight="bold">
                      {member.totalMatches}
                    </Typography>
                  </div>
                  <Typography variant="caption2" theme="muted">
                    Matchs
                  </Typography>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    <Typography variant="h4" weight="bold">
                      {member.winRate}%
                    </Typography>
                  </div>
                  <Typography variant="caption2" theme="muted">
                    Win Rate
                  </Typography>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Award className="h-5 w-5 text-purple-500" />
                    <Typography variant="h4" weight="bold">
                      {member.rankingPoints}
                    </Typography>
                  </div>
                  <Typography variant="caption2" theme="muted">
                    Points
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informations de contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {member.contactEmail && (
                <div>
                  <Typography variant="caption2" theme="muted">
                    Email
                  </Typography>
                  <Typography variant="body-sm">
                    {member.contactEmail}
                  </Typography>
                </div>
              )}

              {member.contactPhone && (
                <div>
                  <Typography variant="caption2" theme="muted">
                    Téléphone
                  </Typography>
                  <Typography variant="body-sm">
                    {member.contactPhone}
                  </Typography>
                </div>
              )}

              {member.discordId && (
                <div>
                  <Typography variant="caption2" theme="muted">
                    Discord
                  </Typography>
                  <Typography variant="body-sm">{member.discordId}</Typography>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <ResponsiveTabs
            tabs={memberTabs}
            defaultValue={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          />
          {activeTab === "profile" && (
            <div className="space-y-6 py-4">
              {/* Biography */}
              <Card className="border-none shadow-sm bg-muted/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Biographie
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Typography variant="body-base" className="leading-relaxed">
                    {member.biography || "Aucune biographie fournie."}
                  </Typography>
                </CardContent>
              </Card>

              {/* Team Info */}
              <Card className="border shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      Équipe
                    </CardTitle>
                    {isOwner && member.team && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowEditTeam(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Gérer
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  {member.team ? (
                    <div className="flex flex-col md:flex-row items-center justify-between p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
                      <div className="flex items-center gap-6">
                        <div className="h-20 w-20 rounded-2xl bg-white shadow-lg flex items-center justify-center border-2 border-primary/20 overflow-hidden">
                          {member.team.logo ? (
                            <Image
                              src={member.team.logo}
                              alt={member.team.name}
                              width={80}
                              height={80}
                              className="object-cover"
                            />
                          ) : (
                            <Trophy className="h-10 w-10 text-primary" />
                          )}
                        </div>
                        <div>
                          <Typography variant="h4" weight="bold">
                            {member.team.name}
                          </Typography>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase tracking-widest px-2"
                            >
                              {teammates.length + 1} Membres
                            </Badge>
                            <Typography variant="caption2" theme="muted">
                              {member.team.gameTag || "TEAM"}
                            </Typography>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="default"
                        className="mt-4 md:mt-0 rounded-full"
                        asChild
                      >
                        <Link
                          href={`/tournaments/${tournamentId}/teams/${member.teamId}`}
                        >
                          Page d'équipe
                        </Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                      <Typography variant="body-base" theme="muted">
                        Ce joueur ne fait actuellement partie d'aucune équipe.
                      </Typography>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          {activeTab === "history" && (
            <div className="space-y-4 py-4">
              {editionStats.length > 0 ? (
                editionStats.map((stat: any) => (
                  <Card
                    key={stat.id}
                    className="group hover:border-primary/50 transition-all shadow-sm rounded-2xl overflow-hidden"
                  >
                    <CardContent className="p-0">
                      <div className="flex flex-col sm:flex-row sm:items-center p-4 gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex flex-col items-center justify-center border-2 border-primary/5 group-hover:bg-primary group-hover:text-white transition-colors">
                          <Typography
                            variant="h4"
                            weight="bold"
                            className="leading-none"
                          >
                            {stat.edition?.number || "#"}
                          </Typography>
                          <span className="text-[8px] uppercase font-bold">
                            Ed.
                          </span>
                        </div>
                        <div className="flex-1">
                          <Typography variant="body-base" weight="bold">
                            Edition {stat.edition?.number || stat.edition?.id}
                          </Typography>
                          <div className="flex items-center gap-2 text-muted-foreground mt-1 text-xs">
                            <Calendar className="h-3 w-3" />
                            Inscrit le{" "}
                            {format(new Date(stat.registeredAt), "PP", {
                              locale: fr,
                            })}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 bg-muted/30 px-6 py-2 rounded-xl border">
                          <div className="text-center">
                            <Typography
                              variant="caption2"
                              theme="muted"
                              className="text-[10px] uppercase font-bold"
                            >
                              Rang
                            </Typography>
                            <Typography variant="body-base" weight="bold">
                              #{stat.position || "-"}
                            </Typography>
                          </div>
                          <Separator orientation="vertical" className="h-8" />
                          <div className="text-center">
                            <Typography
                              variant="caption2"
                              theme="muted"
                              className="text-[10px] uppercase font-bold"
                            >
                              Points
                            </Typography>
                            <Typography variant="body-base" weight="bold">
                              {stat.points || 0}
                            </Typography>
                          </div>
                        </div>
                        <Badge
                          variant={
                            stat.status === "REGISTERED"
                              ? "secondary"
                              : "default"
                          }
                          className="rounded-full px-4"
                        >
                          {stat.status}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed">
                  <Calendar className="h-16 w-16 mx-auto text-muted-foreground opacity-10 mb-4" />
                  <Typography variant="h4" weight="bold">
                    Aucune participation
                  </Typography>
                  <Typography
                    variant="body-base"
                    theme="muted"
                    className="mt-1"
                  >
                    Ce membre n'a pas encore participé à des éditions.
                  </Typography>
                </div>
              )}
            </div>
          )}
          {activeTab === "matches" && (
            <div className="space-y-4 py-4">
              {matchesList.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {matchesList.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      currentUserId={user?.id}
                      viewMode="list"
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed">
                  <Sword className="h-16 w-16 mx-auto text-muted-foreground opacity-10 mb-4" />
                  <Typography variant="h4" weight="bold">
                    Aucun match trouvé
                  </Typography>
                  <Typography
                    variant="body-base"
                    theme="muted"
                    className="mt-1"
                  >
                    Les matchs apparaîtront ici une fois les tournois lancés.
                  </Typography>
                </div>
              )}
            </div>
          )}
          {activeTab === "teammates" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
              {teammates.length > 0 ? (
                teammates.map((t: any) => (
                  <Card
                    key={t.id}
                    className="hover:border-primary/50 transition-all cursor-pointer group rounded-2xl overflow-hidden"
                    onClick={() =>
                      router.push(
                        `/tournaments/${tournamentId}/members/${t.id}`,
                      )
                    }
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <Avatar className="h-14 w-14 ring-2 ring-muted group-hover:ring-primary/20 transition-all">
                        <AvatarImage src={t.avatar} />
                        <AvatarFallback>{t.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <Typography
                          variant="body-base"
                          weight="bold"
                          className="group-hover:text-primary transition-colors"
                        >
                          {t.displayName}
                        </Typography>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge
                            variant="secondary"
                            className="text-[9px] uppercase font-bold"
                          >
                            {t.role}
                          </Badge>
                          <Typography variant="caption2" theme="muted">
                            {t.gameTag}
                          </Typography>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-2 text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed">
                  <Users className="h-16 w-16 mx-auto text-muted-foreground opacity-10" />
                  <Typography variant="body-base" theme="muted">
                    Ce membre n'a pas de coéquipiers enregistrés dans cette
                    équipe.
                  </Typography>
                </div>
              )}
            </div>
          )}
          {activeTab === "achievements" && (
            <div className="space-y-6 py-4">
              <Card className="border-none shadow-sm bg-muted/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Medal className="h-5 w-5 text-amber-500" />
                    Réussites & Badges
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {member.achievements && member.achievements.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(member.achievements as string[]).map(
                        (achievement: string, index: number) => (
                          <div
                            key={index}
                            className="flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-card shadow-sm border border-transparent hover:border-amber-500/20 transition-all"
                          >
                            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                              <Medal className="h-6 w-6 text-amber-500" />
                            </div>
                            <div>
                              <Typography variant="body-base" weight="semibold">
                                {achievement}
                              </Typography>
                              <Typography variant="caption2" theme="muted">
                                Débloqué via une participation active
                              </Typography>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Medal className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-3" />
                      <Typography variant="body-base" theme="muted">
                        Aucune réussite enregistrée pour le moment.
                      </Typography>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
          <AnimatePresence /> {/* Just for safety if it was used elsewhere */}
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Modifier mon profil</DialogTitle>
            <DialogDescription>
              Mettez à jour vos informations de tournoi ici.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Nom d'affichage</Label>
              <Input
                id="displayName"
                value={editData.displayName}
                onChange={(e) =>
                  setEditData({ ...editData, displayName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gameTag">Tag de jeu</Label>
              <Input
                id="gameTag"
                value={editData.gameTag}
                onChange={(e) =>
                  setEditData({ ...editData, gameTag: e.target.value })
                }
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="biography">Biographie</Label>
              <Textarea
                id="biography"
                value={editData.biography}
                onChange={(e) =>
                  setEditData({ ...editData, biography: e.target.value })
                }
                placeholder="Racontez votre parcours..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="clubName">Nom du Club</Label>
              <Input
                id="clubName"
                value={editData.clubName}
                onChange={(e) =>
                  setEditData({ ...editData, clubName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email de contact</Label>
              <Input
                id="email"
                type="email"
                value={editData.contactEmail}
                onChange={(e) =>
                  setEditData({ ...editData, contactEmail: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditProfile(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isSubmitting}>
              {isSubmitting
                ? "Mise à jour..."
                : "Enregistrer les modifications"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={showEditTeam} onOpenChange={setShowEditTeam}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gérer mon équipe</DialogTitle>
            <DialogDescription>
              Modifiez le nom ou d'autres attributs de votre équipe.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="teamName">Nom de l'équipe</Label>
              <Input
                id="teamName"
                value={teamEditData.name}
                onChange={(e) =>
                  setTeamEditData({ ...teamEditData, name: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditTeam(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdateTeam} disabled={isSubmitting}>
              {isSubmitting ? "Mise à jour..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
