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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { getTournamentMemberById, updateTournamentMember, getMemberStatsByEdition, getTeamMembers } from "@/actions/members";
import { useAuthContext } from "@/contexts/auth-context";
import type { TournamentMember } from "@/database/schema";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const [member, setMember] = useState<any>(null);
  const [editionStats, setEditionStats] = useState<any[]>([]);
  const [teammates, setTeammates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

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
        
        // Load additional info in parallel
        const [stats, teamRes] = await Promise.all([
          getMemberStatsByEdition(memberId),
          data.teamId ? getTeamMembers(data.teamId) : Promise.resolve([])
        ]);
        
        setEditionStats(stats);
        setTeammates(teamRes.filter(m => m.id !== memberId));
      }
    } catch (error) {
      console.error("Erreur chargement membre:", error);
      toast.error("Impossible de charger les données du membre");
    } finally {
      setLoading(false);
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
                <Typography variant="h3" weight="bold" >
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
              <Button asChild variant="secondary">
                <Link href={`/profile/${member.userId}`}>
                  <User className="h-4 w-4 mr-2" />
                  Profil Réel
                </Link>
              </Button>
              {(isOwner || isOrganizer) && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  <span className="hidden md:inline">
                    Modifier
                  </span>
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
                  <Typography variant="body-sm">
                    {member.discordId}
                  </Typography>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="profile">
            <TabsList className="bg-muted/50 border-none">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="history">Historique des Éditions</TabsTrigger>
              <TabsTrigger value="teammates">Coéquipiers</TabsTrigger>
              <TabsTrigger value="achievements">Réussites</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              {/* Biography */}
              <Card>
                <CardHeader>
                  <CardTitle>Biographie</CardTitle>
                </CardHeader>
                <CardContent>
                  <Typography variant="body-base">
                    {member.biography || "Aucune biographie fournie."}
                  </Typography>
                </CardContent>
              </Card>

              {/* Team Info */}
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Équipe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {member.team ? (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-primary/5">
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center border-2 border-primary/20 shadow-inner">
                          <Trophy className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <Typography variant="body-base" weight="bold">
                            {member.team.name}
                          </Typography>
                          <Typography variant="caption2" theme="muted" className="uppercase tracking-widest font-black">
                            {teammates.length + 1} Membres
                          </Typography>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/teams/${member.teamId}`}>Gérer</Link>
                      </Button>
                    </div>
                  ) : (
                    <Typography variant="body-base" theme="muted">
                      Ce joueur ne fait actuellement partie d'aucune équipe.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              {editionStats.length > 0 ? (
                editionStats.map((stat: any) => (
                  <Card key={stat.id} className="group hover:border-primary/50 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center font-bold text-primary">
                          {stat.edition?.number || "#"}
                        </div>
                        <div>
                          <Typography variant="body-base" weight="bold">
                            Edition {stat.edition?.number || stat.edition?.id}
                          </Typography>
                          <Typography variant="caption2" theme="muted">
                            Inscrit le {format(new Date(stat.registeredAt), "PP", { locale: fr })}
                          </Typography>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                         <div className="text-right">
                           <Typography variant="caption2" theme="muted">Position</Typography>
                           <Typography variant="body-sm" weight="bold">#{stat.position || "?"}</Typography>
                         </div>
                         <div className="text-right">
                           <Typography variant="caption2" theme="muted">Points</Typography>
                           <Typography variant="body-sm" weight="bold">{stat.points || 0}</Typography>
                         </div>
                         <Badge variant={stat.status === "REGISTERED" ? "secondary" : "default"}>
                           {stat.status}
                         </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-12 bg-muted/20 rounded-xl border-2 border-dashed">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
                  <Typography variant="body-base" theme="muted" className="mt-4">
                    Aucune participation enregistrée pour le moment.
                  </Typography>
                </div>
              )}
            </TabsContent>

            <TabsContent value="teammates" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teammates.length > 0 ? (
                  teammates.map((t: any) => (
                    <Card key={t.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => router.push(`/tournaments/${tournamentId}/members/${t.id}`)}>
                      <CardContent className="p-4 flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={t.avatar} />
                          <AvatarFallback>{t.displayName?.[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Typography variant="body-sm" weight="bold">{t.displayName}</Typography>
                          <Typography variant="caption2" theme="muted">{t.role}</Typography>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12">
                     <Users className="h-12 w-12 mx-auto opacity-10" />
                     <Typography variant="body-base" theme="muted">Seul dans l'équipe.</Typography>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="achievements" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Medal className="h-5 w-5" />
                    Réussites
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {member.achievements && member.achievements.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {(member.achievements as string[]).map((achievement: string, index: number) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                            <Medal className="h-5 w-5 text-amber-500" />
                          </div>
                          <Typography variant="body-sm">
                            {achievement}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Typography variant="body-base" theme="muted">
                      Aucune réussite enregistrée.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}