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
import { EditionMatchesTab } from "./edition-matches-tab";
import { EditionBestParticipantsTab } from "./edition-best-participants-tab";
import {
  ResponsiveTabs,
  type ResponsiveTab,
} from "@/components/ui/responsive-tabs";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/auth-context";
import { useJoinEdition } from "@/hooks/use-editions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { CommentsSection } from "@/components/comments/comments-section";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import {
  Users,
  Target,
  Trophy,
  Calendar,
  Wallet,
  Info,
  LayoutGrid,
  Swords,
  Shield,
  Star,
} from "lucide-react";
import { useScreenSize } from "@/hooks/use-screen";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { EditionStandingsTab } from "./edition-standings-tab";
import { getTypeName } from "@/lib/tournaments/get-name";

interface EditionPageContentProps {
  tournament: Tournament;
  edition: TournamentEditionWithRelations;
  phases: TournamentPhase[];
  activePhaseId?: string;
  currentUserMember?: TournamentMember & { team?: Team };
  currentUserRegistration?: EditionRegistrationWithRelations;
  isOrganizer?: boolean;
  recentMatches?: any[];
}

export function EditionPageContent({
  tournament,
  edition,
  phases,
  activePhaseId,
  currentUserMember,
  currentUserRegistration,
  isOrganizer = false,
  recentMatches = [],
}: EditionPageContentProps) {
  const { user } = useAuthContext();
  const { isMobile } = useScreenSize();
  const router = useRouter();
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [standingsMode, setStandingsMode] = useState<"group" | "edition">(
    "group",
  );
  const joinMutation = useJoinEdition();

  const isRegistered = !!currentUserRegistration;
  const registrations = edition.registrations || [];
  const checkedInCount = registrations.filter((r) => r.checkedIn).length;

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

  const tabs: ResponsiveTab[] = [
    {
      value: "standings",
      label: "Classement",
      icon: <Trophy className="h-4 w-4" />,
      content: (
        <EditionStandingsTab
          activePhaseId={activePhaseId}
          registrations={edition.registrations || []}
          currentRegistrationId={currentUserRegistration?.id}
        />
      ),
    },
    {
      value: "groups",
      label: "Phases & Groupes",
      icon: <LayoutGrid className="h-4 w-4" />,
      content: (
        <EditionPhasesView
          phases={phases}
          editionId={edition.id}
          currentUserId={user?.id}
          isAdmin={isOrganizer}
          onUpdate={() => router.refresh()}
        />
      ),
    },
    {
      value: "matches",
      label: "Matches",
      icon: <Swords className="h-4 w-4" />,
      content: (
        <EditionMatchesTab
          editionId={edition.id}
          tournamentId={edition.tournamentId}
          activePhaseId={activePhaseId}
          currentUserId={user?.id}
          isAdmin={isOrganizer}
          phases={phases}
        />
      ),
    },
    {
      value: "best_participants",
      label: "Meilleurs Participants",
      icon: <Star className="h-4 w-4" />,
      content: <EditionBestParticipantsTab editionId={edition.id} />,
    },
    {
      value: "overview",
      label: "Infos",
      icon: <Info className="h-4 w-4" />,
      content: (
        <div className="space-y-4 mt-4">
          <div className="bg-card border rounded-xl p-3 md:p-6">
            <h3 className="text-xl font-bold mb-4">
              À propos de cette édition
            </h3>
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-muted-foreground">
                {edition.name ||
                  "Aucune description disponible pour cette édition."}
              </p>
              {edition.description &&
                (edition.description.length > 60 ? (
                  <p className="mt-2">
                    {edition.description.length > 100
                      ? edition.description.substring(0, 60) + "..."
                      : edition.description}
                  </p>
                ) : (
                  <p className="mt-2">{edition.description}</p>
                ))}
            </div>
            <div className="block w-full space-y-4 md:space-y-6">
              <div className="bg-card border rounded-2xl p-3 md:p-5 sticky top-24">
                <h4 className="font-bold mb-4 flex items-center gap-2">
                  <Info className="h-4 w-4 text-primary" />
                  Détails du Tournoi
                </h4>
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Jeu</span>
                    <span className="font-bold">{tournament.game}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Type</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {phases.length > 0 && phases[phases.length - 1].phaseType
                        ? getTypeName(phases[phases.length - 1].phaseType!)
                        : "Standard"}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Plateforme</span>
                    <span className="font-medium">Web / PC</span>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-6" asChild>
                  <Link href={`/tournaments/${tournament.id}`}>
                    Voir le tournoi principal
                  </Link>
                </Button>
              </div>
            </div>

            {edition.editionRules && (
              <div className="mt-8 pt-8 border-t">
                <h4 className="text-lg font-bold mb-3">Règles spécifiques</h4>
                <div className="bg-muted p-4 rounded-lg text-sm border">
                  {edition.editionRules}
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border rounded-xl p-2 md:p-4">
            <CommentsSection
              entityId={edition.id}
              entityType="EDITION"
              title="Discussion de l'édition"
            />
          </div>
        </div>
      ),
    },
    {
      value: "calendar",
      label: "Calendrier",
      icon: <Calendar className="h-4 w-4" />,
      content: (
        <div className="bg-card border rounded-xl p-12 text-center space-y-4 mt-4">
          <Typography variant="h4" weight="bold">
            Calendrier des matches
          </Typography>
          <Typography variant="body-sm" theme="muted">
            Consultez les dates et heures de tous les matches de l&apos;édition.
          </Typography>
          <Button variant="default" asChild>
            <Link
              href={`/tournaments/${tournament.id}/editions/${edition.id}/calendar`}
            >
              Ouvrir le calendrier complet
            </Link>
          </Button>
        </div>
      ),
    },
    {
      value: "members",
      label: "Membres",
      icon: <Users className="h-4 w-4" />,
      content: (
        <EditionParticipantsList
          participants={edition.registrations || []}
          editionId={edition.id}
        />
      ),
    },
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
      },
    );
  };

  return (
    <div className="min-h-screen pb-8 md:pb-16">
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
        recentMatches={recentMatches}
      />

      <div className="py-4 md:py-6 space-y-6 md:space-y-8">
        {/* Stats Carousel */}
        <StatsCarousel
          data={editionStats}
          itemsPerView={{ mobile: 2, lg: 4, xl: 5 }}
        />

        <div className="flex flex-col lg:flex-row gap-4 md:gap-8 items-start">
          <div className="flex-1 w-full space-y-4 md:space-y-6">
            {/* Organizer dashboard link */}
            {isOrganizer && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold">
                      Vous organisez cette édition
                    </h3>
                    <p className="text-muted-foreground text-xs">
                      Accédez au dashboard pour gérer les phases, participants
                      et matchs.
                    </p>
                  </div>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="w-full sm:w-auto shadow-lg shadow-primary/20"
                  asChild
                >
                  <Link
                    href={`/tournaments/${tournament.id}/editions/${edition.id}/dashboard`}
                  >
                    Dashboard organisateur
                  </Link>
                </Button>
              </div>
            )}

            {!isRegistered && (
              <div className="bg-card border rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-1">
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
                  className="w-full sm:w-auto px-8 font-bold"
                  disabled={joinMutation.isPending}
                >
                  {joinMutation.isPending
                    ? "Inscription..."
                    : "Rejoindre la compétition"}
                </Button>
              </div>
            )}

            <ResponsiveTabs
              tabs={tabs}
              defaultValue="standings"
              className="w-full flex-1 min-w-0"
              mobileCount={2}
              tabletCount={3}
              swipeable
              showNavButtons
            />
          </div>

          {/* <div className="hidden lg:block w-80 space-y-6">
            <div className="bg-card border rounded-2xl p-5 sticky top-24">
              <h4 className="font-bold mb-4 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Détails du Tournoi
              </h4>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Jeu</span>
                  <span className="font-bold">{tournament.game}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border/50">
                  <span className="text-muted-foreground">Type</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {phases.length > 0 
                      ? (phases[phases.length - 1].phaseType === "ELIMINATION" ? "Élimination Directe" : "Championnat / Groupes")
                      : "Standard"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Plateforme</span>
                  <span className="font-medium">Web / PC</span>
                </div>
              </div>
              <Button variant="outline" className="w-full mt-6" asChild>
                <Link href={`/tournaments/${tournament.id}`}>
                  Voir le tournoi principal
                </Link>
              </Button>
            </div>
          </div> */}
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
