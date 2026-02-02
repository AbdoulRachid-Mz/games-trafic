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
} from "lucide-react";
import {  updateTournamentMember } from "@/actions/tournaments";
import { useAuthContext } from "@/contexts/auth-context";
import type { TournamentMember } from "@/database/schema";

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthContext();
  const [member, setMember] = useState<TournamentMember | null>(null);
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
      // Note: Vous devrez créer cette fonction dans vos actions
      // const data = await getTournamentMemberById(memberId);
      // setMember(data);
      
      // Pour l'instant, simulation
      const mockMember = {
        id: memberId,
        tournamentId,
        userId: "user-123",
        role: "PARTICIPANT",
        displayName: "ProPlayer",
        gameTag: "Pro#1234",
        avatar: null,
        banner: null,
        contactEmail: "pro@example.com",
        contactPhone: "+33 1 23 45 67 89",
        discordId: "proplayer#1234",
        clubName: "Elite Gaming",
        biography: "Joueur professionnel avec 5 ans d'expérience",
        achievements: ["Champion 2023", "Top 10 Mondial", "MVP Saison 2024"],
        totalEditions: 12,
        totalWins: 45,
        totalLosses: 15,
        totalMatches: 60,
        rankingPoints: 1250,
        winRate: 75.0,
        bestPosition: 1,
        isVerified: true,
        verificationLevel: "ADVANCED",
        isActive: true,
        isBanned: false,
        metadata: {},
        preferences: {
          notifications: true,
          emailUpdates: true,
          publicProfile: true,
        },
        joinedAt: new Date("2023-01-15"),
        lastActive: new Date(),
      };
      setMember(mockMember as any);
    } catch (error) {
      console.error("Erreur chargement membre:", error);
    } finally {
      setLoading(false);
    }
  };

  const isOwner = user?.id === member?.userId;
  const isOrganizer = false; // À vérifier dans votre logique

  if (loading) {
    return <div>Chargement...</div>;
  }

  if (!member) {
    return <div>Membre non trouvé</div>;
  }

  return (
    <div className="mx-auto px-4 py-4">
      {/* Banner */}
      <div className="relative h-48 rounded-xl overflow-hidden mb-8">
        {member.banner ? (
          <img
            src={member.banner}
            alt="Bannière"
            className="w-full h-full object-cover"
          />
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
                <Typography variant="h1" weight="bold" className="text-3xl">
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
              
              <Typography variant="body-lg" theme="muted">
                {member.gameTag} • {member.clubName || "Sans club"}
              </Typography>
            </div>
            
            <div className="ml-auto flex items-center gap-3">
              {(isOwner || isOrganizer) && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
              <Button>
                <MessageCircle className="h-4 w-4 mr-2" />
                Message
              </Button>
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
            <TabsList>
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <TabsTrigger value="achievements">Réussites</TabsTrigger>
              <TabsTrigger value="history">Historique</TabsTrigger>
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Équipe
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {member.clubName ? (
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                      <div>
                        <Typography variant="body-base" weight="semibold">
                          {member.clubName}
                        </Typography>
                        <Button variant="link" className="p-0 h-auto">
                          Voir l'équipe
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Typography variant="body-base" theme="muted">
                      Ce joueur ne fait actuellement partie d'aucune équipe.
                    </Typography>
                  )}
                </CardContent>
              </Card>
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
                      {member.achievements.map((achievement, index) => (
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