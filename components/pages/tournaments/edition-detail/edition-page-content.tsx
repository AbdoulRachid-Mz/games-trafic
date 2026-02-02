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
// import { TournamentEditionWithRelations } from "@/actions/editions";
import { EditionDetailHeader } from "./edition-detail-header";
import { EditionStatsGrid } from "./edition-stats-grid";
import { EditionParticipantsList } from "./edition-participants-list";
import { EditionPhasesView } from "./edition-phases-view";
import { EditionJoinDialog } from "./edition-join-dialog";
import { EditionPaymentDialog } from "./edition-payment-dialog"; // Import new dialog
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/auth-context";
import { useJoinEdition } from "@/hooks/use-editions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CommentsSection } from "@/components/comments/comments-section";

interface EditionPageContentProps {
  tournament: Tournament;
  edition: TournamentEditionWithRelations;
  phases: TournamentPhase[];
  currentUserMember?: TournamentMember & { team?: Team };
  currentUserRegistration?: EditionRegistrationWithRelations;
}

export function EditionPageContent({
  tournament,
  edition,
  phases,
  currentUserMember,
  currentUserRegistration,
}: EditionPageContentProps) {
  const { user } = useAuthContext();
  const router = useRouter();
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false); // State for payment dialog
  const joinMutation = useJoinEdition();

  const isRegistered = !!currentUserRegistration;

  const handleJoinClick = () => {
    if (!user) {
      toast.error("Vous devez être connecté pour participer");
      router.push("/auth/sign-in");
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
    <div className="min-h-screen pb-20">
      <EditionDetailHeader
        tournament={tournament}
        edition={edition}
        isOrganizer={false}
      />

      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-1 w-full space-y-8">
            <EditionStatsGrid edition={edition} />

            {!isRegistered && (
              <div className="bg-card border rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
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

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
                <TabsTrigger value="overview">Aperçu</TabsTrigger>
                <TabsTrigger value="participants">Joueurs</TabsTrigger>
                <TabsTrigger value="phases">Arbre</TabsTrigger>
                <TabsTrigger value="comments">Discussion</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-6">
                <div className="bg-card border rounded-xl p-6">
                  <h3 className="text-xl font-bold mb-4">
                    À propos de cette édition
                  </h3>
                  <div className="prose dark:prose-invert max-w-none">
                    <p>
                      {edition.name ||
                        "Aucune description disponible pour cette édition."}
                    </p>
                    {edition.description && <p>{edition.description}</p>}
                  </div>

                  {edition.editionRules && (
                    <div className="mt-8 pt-8 border-t">
                      <h4 className="text-lg font-bold mb-3">
                        Règles spécifiques
                      </h4>
                      <div className="bg-muted p-4 rounded-lg text-sm">
                        {edition.editionRules}
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="participants" className="mt-6">
                <EditionParticipantsList
                  participants={edition.registrations || []}
                />
              </TabsContent>

              <TabsContent value="phases" className="mt-6">
                <EditionPhasesView phases={phases} />
              </TabsContent>

              <TabsContent value="comments" className="mt-6">
                <div className="bg-card border rounded-xl p-6">
                  <CommentsSection
                    entityId={edition.id}
                    entityType="TOURNAMENT"
                    title="Discussion de l'édition"
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="hidden lg:block w-80 space-y-6">
            <div className="bg-card border rounded-xl p-6 sticky top-24">
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
    </div>
  );
}
