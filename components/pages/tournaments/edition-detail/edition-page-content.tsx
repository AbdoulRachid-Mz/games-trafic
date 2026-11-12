// @/components/pages/tournaments/edition-detail/edition-page-content.tsx
"use client";

import React, { useState, useEffect } from "react";
import {
  Tournament,
  TournamentPhase,
  TournamentMember,
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
import { EditionBracketsTab } from "./edition-brackets-tab";
import { EditionRulesTab } from "./edition-rules-tab";
import { EditionStandingsTab } from "./edition-standings-tab";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { useAuthContext } from "@/contexts/auth-context";
import { useJoinEdition } from "@/hooks/use-editions";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import {
  type JoinEditionFormValues,
} from "./edition-join-dialog";
import {
  Calendar,
  Info,
  LayoutGrid,
  Swords,
  Shield,
  Star,
  Zap,
  Gift,
  Award,
  ArrowRight,
} from "lucide-react";
import { useScreenSize } from "@/hooks/use-screen";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getTypeName } from "@/lib/tournaments/get-name";
import { cn } from "@/lib/utils";
import { EditionCalendarTimeline } from "@/app/tournaments/[tournamentId]/editions/[editionId]/calendar/edition-calendar-timeline";

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
  const searchParams = useSearchParams();

  // Active tab synchronized with searchParams (?tab=...)
  const initialTab = searchParams.get("tab") || searchParams.get("activeTab") || "overview";
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [joinValues, setJoinValues] = useState<JoinEditionFormValues | null>(null);
  const [paymentMemberId, setPaymentMemberId] = useState<string | undefined>();
  const joinMutation = useJoinEdition();

  const isRegistered = !!currentUserRegistration;
  const registrations = edition.registrations || [];

  // Synchroniser l'URL sans rechargement lourd
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tabId);
      url.searchParams.delete("activeTab");
      window.history.replaceState({}, "", url.toString());
    }
  };

  const handleJoinClick = () => {
    if (!user) {
      toast.error("Vous devez être connecté pour participer");
      router.push("/sign-in");
      return;
    }
    setShowJoinDialog(true);
  };

  // ?join=1 (QR code / lien partagé) : ouvre directement le dialogue d'inscription.
  useEffect(() => {
    const wantsToJoin = searchParams.get("join") === "1";
    if (!wantsToJoin || isRegistered || !user || showJoinDialog) return;
    setShowJoinDialog(true);
  }, [searchParams, isRegistered, user, showJoinDialog]);

  const handleConfirmJoin = async (values?: JoinEditionFormValues) => {
    if (!user) return;

    // Conserve les valeurs du formulaire pour le retour depuis le paiement.
    const payload = values ?? joinValues;
    if (payload) setJoinValues(payload);

    joinMutation.mutate(
      {
        editionId: edition.id,
        userId: user.id,
        userInfo: {
          username: user.username || user.fullName || "User",
          image: user.profileImage,
          playerName: payload?.playerName,
          teamName: payload?.teamName,
        },
      },
      {
        onSuccess: (data) => {
          if (data.paymentRequired) {
            setShowJoinDialog(false);
            setPaymentMemberId(data.memberId ?? currentUserMember?.id);
            setShowPaymentDialog(true);
            return;
          }

          if (data.success) {
            setShowJoinDialog(false);
            toast.success(data.message || "Inscription confirmée");
            if (data.registrationStatus && data.registrationStatus !== "REGISTERED") {
              toast.info("Votre inscription est en attente de validation par l'organisateur.");
            }
            // Redirection vers le profil membre réel (ids serveur).
            if (data.tournamentId && data.memberId) {
              router.push(
                `/tournaments/${data.tournamentId}/members/${data.memberId}`,
              );
            } else {
              router.refresh();
            }
          } else if (data.message) {
            toast.error(data.message);
          }
        },
        onError: (err: any) => {
          console.error(err);
          toast.error(err?.message || "Impossible de rejoindre l'édition");
        },
      },
    );
  };

  return (
    <div className="min-h-screen pb-12 md:pb-20 bg-gradient-to-b from-transparent to-background">
      {/* HEADER DE L'ÉDITION AVEC TOUTES LES INFOS ET LES TABS COMPÉTITION INTÉGRÉS */}
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
        activeTab={activeTab}
        onTabChange={handleTabChange}
        tabCounts={{
          matches: edition.completedMatchCount || undefined,
          participants: registrations.length || undefined,
          phases: phases.length || undefined,
        }}
      />

      <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 space-y-4 md:space-y-8 relative z-10">
        {/* CTA D'INSCRIPTION RAPIDE SI NON INSCRIT */}
        {!isRegistered && (
          <div className="relative overflow-hidden bg-gradient-to-br from-card via-card/70 to-card/40 border border-primary/20 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(var(--primary),0.1)] group">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-primary/10 opacity-40 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="relative z-10 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-3 border border-primary/20">
                <Zap className="w-3.5 h-3.5 fill-primary" />
                Inscriptions Ouvertes
              </div>
              <h3 className="text-2xl md:text-3xl font-black italic tracking-tighter mb-2">
                Participez à la compétition
              </h3>
              <p className="text-muted-foreground text-sm md:text-base font-medium">
                Affrontez les meilleurs compétiteurs sur {tournament.game}.
                Il reste <strong className="text-foreground">{(edition.maxParticipants || 32) - registrations.length}</strong> places disponibles.
              </p>
            </div>
            <div className="relative z-10 w-full md:w-auto">
              <Button
                size="lg"
                onClick={handleJoinClick}
                className="w-full md:w-auto px-10 py-6 text-base font-black uppercase tracking-wider italic shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)] transition-all hover:scale-105"
                disabled={joinMutation.isPending}
              >
                {joinMutation.isPending ? "Inscription en cours..." : "Rejoindre l'édition"}
              </Button>
            </div>
          </div>
        )}

        {/* CONTENU DU TAB SÉLECTIONNÉ */}
        <div className="min-w-0">
          {/* TAB: VUE D'ENSEMBLE (OVERVIEW) */}
          {activeTab === "overview" && (
            <div className="space-y-6 md:space-y-8">
              {/* Carte Principale de Présentation */}
              <div className="bg-card/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-[120px] -z-10" />

                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black italic tracking-tighter flex items-center gap-3">
                    <Info className="h-6 w-6 text-primary" />
                    À propos de la Compétition
                  </h3>
                  <Button variant="outline" size="sm" asChild className="gap-2 border-white/10">
                    <Link href={`/tournaments/${tournament.id}`}>
                      Tournoi Principal
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </Button>
                </div>

                <div className="prose dark:prose-invert max-w-none text-muted-foreground leading-relaxed">
                  <p className="text-base md:text-lg text-foreground font-medium">
                    {edition.name || `Édition #${edition.editionNumber} de ${tournament.name}`}
                  </p>
                  {edition.description && (
                    <div className="mt-4 p-5 rounded-2xl bg-background/50 border border-white/5 text-sm md:text-base leading-relaxed">
                      {edition.description}
                    </div>
                  )}
                </div>

                {/* Grille des caractéristiques esports */}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-background/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Jeu Officiel</span>
                    <span className="font-black text-base md:text-lg">{tournament.game}</span>
                  </div>
                  <div className="bg-background/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Format</span>
                    <Badge variant="secondary" className="w-fit font-bold mt-0.5">
                      {phases.length > 0 && phases[phases.length - 1].phaseType
                        ? getTypeName(phases[phases.length - 1].phaseType!)
                        : "Standard"}
                    </Badge>
                  </div>
                  <div className="bg-background/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Lieu / Mode</span>
                    <span className="font-black text-base md:text-lg">
                      {edition.locationType === "ONLINE" ? "En Ligne" : "Présentiel"}
                    </span>
                  </div>
                  <div className="bg-background/50 border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Capacité</span>
                    <span className="font-black text-base md:text-lg text-primary">
                      {edition.maxParticipants || 32} Joueurs
                    </span>
                  </div>
                </div>

                {/* Dotation / Cashprize Breakdown si défini */}
                {edition.entryFee && Number(edition.entryFee) > 0 && (
                  <div className="mt-8 pt-8 border-t border-white/5">
                    <h4 className="text-lg font-black italic tracking-tighter mb-4 flex items-center gap-2 text-yellow-400">
                      <Gift className="h-5 w-5" />
                      Dotations & Cashprize
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-500/15 to-yellow-600/5 border border-yellow-500/30">
                        <div className="text-xs uppercase font-black tracking-wider text-yellow-400">1ère Place 🥇</div>
                        <div className="text-2xl font-black mt-1 text-foreground">50% du Prize Pool</div>
                        <div className="text-xs text-muted-foreground mt-1">Trophée + Titre de Champion</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-400/15 to-slate-500/5 border border-slate-400/30">
                        <div className="text-xs uppercase font-black tracking-wider text-slate-300">2ème Place 🥈</div>
                        <div className="text-2xl font-black mt-1 text-foreground">30% du Prize Pool</div>
                        <div className="text-xs text-muted-foreground mt-1">Médaille d&apos;Argent</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-700/15 to-amber-800/5 border border-amber-700/30">
                        <div className="text-xs uppercase font-black tracking-wider text-amber-500">3ème Place 🥉</div>
                        <div className="text-2xl font-black mt-1 text-foreground">20% du Prize Pool</div>
                        <div className="text-xs text-muted-foreground mt-1">Médaille de Bronze</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: ARBRE & PLAYOFFS (BRACKETS) */}
          {activeTab === "brackets" && (
            <EditionBracketsTab
              editionId={edition.id}
              tournamentId={tournament.id}
              phases={phases}
              isOrganizer={isOrganizer}
            />
          )}

          {/* TAB: PHASES & POULES */}
          {activeTab === "phases" && (
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-3 md:p-6 shadow-xl">
              <EditionPhasesView
                phases={phases}
                editionId={edition.id}
                tournamentId={tournament.id}
                currentUserId={user?.id}
                isAdmin={isOrganizer}
                onUpdate={() => router.refresh()}
              />
            </div>
          )}

          {/* TAB: MATCHS */}
          {activeTab === "matches" && (
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-3 md:p-6 shadow-xl">
              <EditionMatchesTab
                editionId={edition.id}
                tournamentId={edition.tournamentId}
                activePhaseId={activePhaseId}
                currentUserId={user?.id}
                isAdmin={isOrganizer}
                phases={phases}
              />
            </div>
          )}

          {/* TAB: CLASSEMENT (STANDINGS) */}
          {activeTab === "standings" && (
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-3 md:p-6 shadow-xl">
              <EditionStandingsTab
                activePhaseId={activePhaseId}
                registrations={edition.registrations || []}
                currentRegistrationId={currentUserRegistration?.id}
              />
            </div>
          )}

          {/* TAB: PARTICIPANTS */}
          {activeTab === "participants" && (
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-3 md:p-6 shadow-xl">
              <EditionParticipantsList
                participants={edition.registrations || []}
                editionId={edition.id}
              />
            </div>
          )}

          {/* TAB: CALENDRIER */}
          {activeTab === "calendar" && (
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-4 md:p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <h3 className="text-2xl font-black italic tracking-tighter flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-primary" />
                    Programme & Calendrier
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground font-medium">
                    Horaires officiels de toutes les rencontres de l&apos;édition
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild className="gap-2 border-white/10">
                  <Link href={`/tournaments/${tournament.id}/editions/${edition.id}/calendar`}>
                    Ouvrir la page calendrier
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </Button>
              </div>

              <EditionCalendarTimeline editionId={edition.id} currentUserId={user?.id} />
            </div>
          )}

          {/* TAB: STATS & MVPS */}
          {activeTab === "stats" && (
            <div className="bg-card/40 backdrop-blur-xl border border-white/5 rounded-3xl p-3 md:p-6 shadow-xl">
              <EditionBestParticipantsTab editionId={edition.id} />
            </div>
          )}

          {/* TAB: RÈGLEMENT */}
          {activeTab === "rules" && (
            <EditionRulesTab tournament={tournament} edition={edition} />
          )}
        </div>
      </div>

      {/* DIALOGS DE PARTICIPATION & PAIEMENT */}
      <EditionJoinDialog
        edition={edition}
        open={showJoinDialog}
        onOpenChange={setShowJoinDialog}
        onConfirm={handleConfirmJoin}
        isLoading={joinMutation.isPending}
        userTeam={currentUserMember?.team ? currentUserMember.team : undefined}
        defaultPlayerName={user?.fullName || user?.username || ""}
      />

      <EditionPaymentDialog
        edition={edition}
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        memberId={paymentMemberId ?? currentUserMember?.id}
      />
    </div>
  );
}
