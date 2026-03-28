"use client";

import React, { useState } from "react";
import {
  Tournament,
  TournamentPhase,
  TournamentMember,
  TeamMember,
  EditionRegistration,
  EditionRegistrationWithRelations,
  TournamentEditionWithRelations,
  Team,
} from "@/database/schema";
import { EditionDetailHeader } from "./edition-detail-header";
import { EditionParticipantsList } from "./edition-participants-list";
import { EditionPhasesView } from "./edition-phases-view";
import { EditionJoinDialog } from "./edition-join-dialog";
import { EditionPaymentDialog } from "./edition-payment-dialog";
import { EditionStandingsTab } from "./edition-standings-tab";
import { EditionMatchesTab } from "./edition-matches-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/auth-context";
import { useJoinEdition } from "@/hooks/use-editions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CommentsSection } from "@/components/comments/comments-section";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import { Users, Target, Trophy, Calendar, Wallet } from "lucide-react";
import { useScreenSize } from "@/hooks/use-screen";

interface EditionPageContentProps {
  tournament: Tournament;
  edition: TournamentEditionWithRelations;
  phases: TournamentPhase[];
  activePhaseId?: string;
  currentUserMember?: TournamentMember & { team?: Team };
  currentUserRegistration?: EditionRegistrationWithRelations;
  isOrganizer?: boolean;
}

export function EditionPageContent({
  tournament,
  edition,
  phases,
  activePhaseId,
  currentUserMember,
  currentUserRegistration,
  isOrganizer = false,
}: EditionPageContentProps) {
  const { user } = useAuthContext();
  const { isMobile } = useScreenSize();
  const router = useRouter();
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [standingsMode, setStandingsMode] = useState<"group" | "edition">("group");
  const joinMutation = useJoinEdition();

  const isRegistered = !!currentUserRegistration;
  const registrations = edition.registrations || [];
  const checkedInCount = registrations.filter((r) => r.checkedIn).length;
  const totalMatchCount =
    (edition.matchCount || 0);

  const editionStats = [
    {
      icon: <Users className="h-5 w-5" />,
      label: "Participants",
      value: `${edition.currentParticipants || registrations.length}/${edition.maxParticipants || "∞"}`,
      color: "text-blue-500",
    },
    {
      icon: <Target className="h-5 w-5" />,
      label: "Check-in",
      value: checkedInCount,
      color: "text-indigo-500",
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      label: "Matchs joués",
      value: edition.completedMatchCount || 0,
      color: "text-green-500",
    },
    {
      icon: <Calendar className="h-5 w-5" />,
      label: "Phases",
      value: phases.length,
      color: "text-purple-500",
    },
    ...(Number(edition.entryFee) > 0
      ? [
          {
            icon: <Wallet className="h-5 w-5" />,
            label: "Frais",
            value: `${edition.entryFee} ${edition.prizeCurrency || "GTC"}`,
            color: "text-amber-500",
          },
        ]
      : []),
  ];

  const handleJoinClick = () => {
    if (!user) {
      toast.error("Vous devez être connecté pour participer");
      router.push("/sign-in");
      return;
    }
    setShowJoinDialog(true);
  };

  const handleConfirmJoin = async () => {
    if (!user) return;

    joinMutation.mutate(
      {
        editionId: edition.id,
        userId: user.id,
        userInfo: {
          username: user.username || user.fullName || "User",
          image: user.profileImage,
        },
      },
      {
        onSuccess: (data) => {
          if (data.paymentRequired) {
            setShowJoinDialog(false);
            setShowPaymentDialog(true);
          } else if (data.success) {
            setShowJoinDialog(false);
            // Toast handled in hook for success
            router.refresh();
          }
        },
        onError: (err) => {
          // Toast handled in hook
          console.error(err);
        },
      }
    );
  };

  return (
    <div className="min-h-screen pb-16">
      <EditionDetailHeader
        tournament={tournament}
        edition={edition}
        isOrganizer={isOrganizer}
        onJoinClick={handleJoinClick}
        onPaymentClick={() => setShowPaymentDialog(true)}
        onCancelJoin={() => setShowJoinDialog(false)}
        onCancelPayment={() => setShowPaymentDialog(false)}
        onConfirmPayment={handleConfirmJoin}
        isRegistered={isRegistered}
      />

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Stats Carousel */}
        <StatsCarousel
          data={editionStats}
          itemsPerView={{ mobile: 2, lg: 4, xl: 5 }}
        />

        <div className="flex flex-col md:flex-row gap-4 items-start">
          <div className="flex-1 w-full space-y-4">

            {/* Organizer dashboard link */}
            {isOrganizer && (
              <div className="bg-card border border-primary/30 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div>
                  <h3 className="text-sm font-bold">Vous organisez cette édition</h3>
                  <p className="text-muted-foreground text-xs">Accédez au dashboard pour gérer les phases, participants et matchs.</p>
                </div>
                <Button variant="default" size="sm" asChild>
                  <a href={`/tournaments/${tournament.id}/editions/${edition.id}/dashboard`}>
                    Dashboard organisateur
                  </a>
                </Button>
              </div>
            )}

            {!isRegistered && (
              <div className="bg-card border rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                <div>
                  <h3 className="text-lg font-bold mb-1">
                    Inscriptions ouvertes !
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Il reste{" "}
                    {(edition.maxParticipants || 100) -
                      (edition.currentParticipants || 0)}{" "}
                    places pour cette édition.
                  </p>
                </div>
                <Button
                  size="lg"
                  onClick={handleJoinClick}
                  className="w-full sm:w-auto"
                  disabled={joinMutation.isPending}
                >
                  {joinMutation.isPending
                    ? "Inscription..."
                    : "Rejoindre la compétition"}
                </Button>
              </div>
            )}

            <Tabs defaultValue="standings" className="w-full">
              <TabsList className="flex w-full overflow-auto mb-3 gap-2 px-1 md:justify-center">
                <TabsTrigger value="overview" className="flex-shrink-0">
                  Infos
                </TabsTrigger>
                <TabsTrigger value="standings" className="flex-shrink-0">
                  Classement
                </TabsTrigger>
                <TabsTrigger value="groups" className="flex-shrink-0">
                  Groupes
                </TabsTrigger>
                <TabsTrigger value="calendar" className="flex-shrink-0">
                  Calendrier
                </TabsTrigger>
                <TabsTrigger value="matches" className="flex-shrink-0">
                  Matches
                </TabsTrigger>
                <TabsTrigger value="members" className="flex-shrink-0">
                  Membres
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">
                    À propos de cette édition
                  </h3>
                  <div className="prose dark:prose-invert max-w-none">
                    <p className="text-muted-foreground">
                      {edition.name ||
                        "Aucune description disponible pour cette édition."}
                    </p>
                    {edition.description && <p className="mt-2">{edition.description}</p>}
                  </div>

                  {edition.editionRules && (
                    <div className="mt-8 pt-8 border-t">
                      <h4 className="text-lg font-bold mb-3">
                        Règles spécifiques
                      </h4>
                      <div className="bg-muted p-4 rounded-lg text-sm border">
                        {edition.editionRules}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-card border rounded-xl p-6">
                  <CommentsSection
                    entityId={edition.id}
                    entityType="EDITION"
                    title="Discussion de l'édition"
                  />
                </div>
              </TabsContent>

              <TabsContent value="standings" className="mt-6 space-y-4">
                <EditionStandingsTab
                  activePhaseId={activePhaseId}
                  registrations={edition.registrations || []}
                  currentRegistrationId={currentUserRegistration?.id}
                />
              </TabsContent>

              <TabsContent value="groups" className="mt-6">
                <EditionPhasesView
                  phases={phases}
                  editionId={edition.id}
                  currentUserId={user?.id}
                  isAdmin={isOrganizer}
                  onUpdate={() => router.refresh()}
                />
              </TabsContent>

              <TabsContent value="calendar" className="mt-6">
                <div className="bg-card border rounded-xl p-12 text-center space-y-4">
                  <Typography variant="h4" weight="bold">Calendrier des matches</Typography>
                  <Typography variant="body-sm" theme="muted">Consultez les dates et heures de tous les matches de l&apos;édition.</Typography>
                  <Button variant="default" asChild>
                    <a href={`/tournaments/${tournament.id}/editions/${edition.id}/calendar`}>
                      Ouvrir le calendrier complet
                    </a>
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="matches" className="mt-6">
                 <EditionMatchesTab 
                   activePhaseId={activePhaseId}
                   currentUserId={user?.id}
                   isAdmin={isOrganizer}
                 />
              </TabsContent>

              <TabsContent value="members" className="mt-6">
                <EditionParticipantsList
                  participants={edition.registrations || []}
                />
              </TabsContent>
            </Tabs>
          </div>

          <div className="hidden lg:block w-80 space-y-6">
            <div className="bg-card border rounded-xl p-3 sticky top-24">
              <h4 className="font-bold mb-4">Informations Tournoi</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jeu</span>
                  <span className="font-medium">{tournament.game}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organisateur</span>
                  <span className="font-medium truncate ml-2">
                    Organisateur
                  </span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-6" asChild>
                <a href={`/tournaments/${tournament.id}`}>
                  Voir le tournoi principal
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <EditionJoinDialog
        edition={edition}
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
        onConfirm={handleConfirmJoin}
        isLoading={joinMutation.isPending}
        userTeam={currentUserMember?.team ? currentUserMember.team : undefined}
      />

      <EditionPaymentDialog
        edition={edition}
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        memberId={currentUserMember?.id}
      />
    </div >
  );
}
