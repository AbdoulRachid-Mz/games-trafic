"use client";

import React from "react";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Users, 
  Trophy, 
  Gamepad2, 
  MapPin, 
  Share2, 
  Clock,
  Swords
} from "lucide-react";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { InteractionButton } from "@/components/shared/interaction-button";
import { CommentsSection } from "@/components/comments/comments-section";
import { EditionsInfiniteList } from "./editions-infinite-list";
import { MembersInfiniteList } from "./members-infinite-list";
import Link from "next/link";
import { TournamentCard } from "@/components/pages/tournaments/tournament-card";
import type { TournamentWithRelations, Tournament } from "@/database/schema";
import { TournamentAssistant } from "./tournament-assistant";

interface TournamentDetailProps {
  tournament: TournamentWithRelations;
  similar?: Tournament[];
}

export function TournamentDetail({ tournament, similar = [] }: TournamentDetailProps) {
  if (!tournament) return <div>Tournoi non trouvé</div>;

  const upcomingEditionStart =
    Array.isArray(tournament.editions)
      ? tournament.editions
          .filter((e) => e.status === "UPCOMING" && e.startDate)
          .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())[0]?.startDate
      : undefined;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Hero Banner */}
      <div className="relative h-[40vh] w-full">
        {tournament.coverImage ? (
          <Image
            src={tournament.coverImage}
            alt={tournament.name}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 via-purple-500/20 to-blue-500/20 flex items-center justify-center">
            <Gamepad2 className="h-32 w-32 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        
        <div className="absolute bottom-0 left-0 w-full p-6 md:p-12">
          <div className="container mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge className="bg-primary/20 text-primary hover:bg-primary/30 border-primary/20">
                  {tournament.game || "Jeu"}
                </Badge>
                <Badge variant="outline" className="backdrop-blur-md">
                  {tournament.platform || "Plateforme"}
                </Badge>
              </div>
              
              <Typography variant="h1" className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-lg">
                {tournament.name}
              </Typography>
              
              <div className="flex flex-wrap items-center gap-4 text-white/80">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  <span>
                    {upcomingEditionStart
                      ? format(new Date(upcomingEditionStart), "d MMMM yyyy", { locale: fr })
                      : "Date à définir"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <span>{tournament.totalParticipants || 0} inscrits</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-400" />
                  <span className="font-bold text-yellow-400">{tournament.totalPrizePool || 0} GTC</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <Link href={`/tournaments/${tournament.id}/membership/request`}>
                <Button size="lg" className="w-full md:w-auto shadow-lg shadow-primary/25 text-lg font-bold">
                  Demander adhésion
                </Button>
              </Link>
              <Button size="icon" variant="secondary" className="backdrop-blur-md bg-background/30">
                <Share2 className="h-5 w-5" />
              </Button>
              <InteractionButton
                type="follow"
                entityType="TOURNAMENT"
                entityId={tournament.id}
                variant="outline"
                size="md"
              >
                Suivre
              </InteractionButton>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start h-12 bg-secondary/30 p-1 rounded-xl">
                <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Aperçu</TabsTrigger>
                <TabsTrigger value="editions" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Éditions</TabsTrigger>
                <TabsTrigger value="members" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Membres</TabsTrigger>
                <TabsTrigger value="rules" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Règles</TabsTrigger>
                <TabsTrigger value="comments" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Commentaires</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>À propos du tournoi</CardTitle>
                  </CardHeader>
                  <CardContent className="prose dark:prose-invert max-w-none">
                    <p>{tournament.description || "Aucune description fournie pour ce tournoi."}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Conditions d’entrée</p>
                          <p className="mt-2">{tournament.requirements || "Conditions d’entrée non spécifiées."}</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Code de conduite</p>
                          <p className="mt-2">{tournament.codeOfConduct || "Code de conduite non précisé."}</p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Devenir membre</p>
                          <p className="mt-2">Pour devenir membre, demandez l’adhésion via le bouton “Demander adhésion” en haut. Les organisateurs approuvent ou rejettent selon les règles.</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">Organisateur</p>
                          <p className="mt-2">{tournament.organizer?.username || "Organisateur inconnu"}</p>
                        </CardContent>
                      </Card>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="bg-yellow-500/10 p-3 rounded-full">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Cashprize Total</p>
                        <p className="text-2xl font-bold">{tournament.totalPrizePool || 0} GTC</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="editions" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Éditions du tournoi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <EditionsInfiniteList tournamentId={tournament.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="members" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Membres du tournoi</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MembersInfiniteList tournamentId={tournament.id} />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="rules" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Règles du tournoi</CardTitle>
                  </CardHeader>
                  <CardContent className="prose dark:prose-invert max-w-none">
                    <p>{tournament.rules || "Aucune règle détaillée fournie."}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments" className="mt-6">
                <CommentsSection entityId={tournament.id} entityType={"TOURNAMENT"} />
              </TabsContent>
            </Tabs>
            {/* Tournois similaires */}
            <div className="mt-10 space-y-4">
              <Typography variant="h2" className="text-xl font-bold">Tournois similaires</Typography>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {similar.map((t) => (
                  <TournamentCard key={t.id} tournament={t} />
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organisateur</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={tournament.organizer?.image || undefined} />
                    <AvatarFallback>{tournament.organizer?.username?.[0] || "O"}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-lg">{tournament.organizer?.username || "Admin"}</p>
                    <p className="text-sm text-muted-foreground">Organisateur vérifié</p>
                  </div>
                </div>
                <Button className="w-full mt-4" variant="outline">Contacter</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Infos Clés</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" /> Check-in
                  </span>
                  <span className="font-medium">30 min avant</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" /> Équipes
                  </span>
                  <span className="font-medium">1vs1</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Serveur
                  </span>
                  <span className="font-medium">Europe (EU)</span>
                </div>
              </CardContent>
            </Card>
          </div>
          
        </div>
      </div>
      {/* Assistant flottant d’aide */}
      <TournamentAssistant />
    </div>
  );
}
