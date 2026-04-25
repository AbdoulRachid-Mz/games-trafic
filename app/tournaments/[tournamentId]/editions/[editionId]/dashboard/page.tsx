import { Metadata } from "next";
import {
  getEditionRegistrations,
  getTournamentPhases,
  getMatches,
} from "@/actions/tournaments";
import { getTournamentEditionWithRelations } from "@/actions/editions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import {
  Users,
  Trophy,
  Activity,
  Calendar,
  GitBranch,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { StatsCard } from "@/components/ui/stats-card";
import Image from "next/image";
import { StatsCarousel } from "@/components/shared/stats-carousel";
import { CalendarCogIcon } from "@/components/icons/calendar-cog";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { EditionDashboardActions } from "@/components/pages/tournaments/edition-detail/edition-dashboard-actions";
import { db } from "@/lib/db";
import { bracketNodes, phaseGroupParticipants, phaseGroups } from "@/database/schema";
import { eq, and, desc, isNull, asc } from "drizzle-orm";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

export const metadata: Metadata = {
  title: "Dashboard Édition - Vue d'ensemble",
};

interface EditionConfig {
  competitionType?: "CHAMPIONSHIP" | "CUP" | "LDC" | "SWISS";
  competitionMode?: "AUTO" | "MANUAL";
  [key: string]: any;
}

export default async function DashboardOverviewPage({ params }: PageProps) {
  const { tournamentId, editionId } = await params;

  const [edition, registrationsResponse, phasesResponse, matchesResponse] =
    await Promise.all([
      getTournamentEditionWithRelations(editionId),
      getEditionRegistrations({
        filters: { editionId },
        pagination: { limit: 5, page: 1 },
        options: {
          sortBy: "registeredAt",
          sortOrder: "desc",
          populate: ["member", "member.user"],
        },
      }),
      getTournamentPhases({ filters: { editionId } }),
      getMatches({
        filters: { editionId },
        pagination: { limit: 5, page: 1 },
      }),
    ]);

  if (!edition) notFound();

  const stats = [
    {
      label: "Participants",
      value: `${edition.registrations?.length || 0} / ${edition.maxParticipants || "∞"}`,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      description: "Inscrits confirmés",
    },
    {
      label: "Cashprize",
      value: `${edition.prizePool || 0} ${edition.prizeCurrency || "GTC"}`,
      icon: Trophy,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      description: "Récompense totale",
    },
    {
      label: "Phases",
      value: phasesResponse.data.length || edition.phases?.length,
      icon: GitBranch,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      description: "Structure active",
    },
    {
      label: "Matches",
      value: matchesResponse.pagination.total,
      icon: Activity,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      description: "Total des rencontres",
    },
  ];

  const editionConfig = (edition.editionConfig as EditionConfig) || {};

  // Tentative de détection du vainqueur potentiel
  let potentialWinnerId = edition.winnerId || undefined;
  let potentialWinnerName = (edition.winnerMetadata as any)?.displayName || undefined;

  if (!potentialWinnerId && phasesResponse.data.length > 0) {
    const lastPhase = phasesResponse.data[phasesResponse.data.length - 1];
    
    if (lastPhase.phaseType === "ELIMINATION" || lastPhase.phaseType === "KNOCKOUT") {
      // Trouver le noeud final (celui qui n'a pas de parent)
      const finalNode = await db.query.bracketNodes.findFirst({
        where: and(eq(bracketNodes.phaseId, lastPhase.id), isNull(bracketNodes.parentNodeId)),
        with: { winnerRegistration: { with: { member: true } } }
      });
      if (finalNode?.winnerRegistrationId) {
        potentialWinnerId = finalNode.winnerRegistrationId;
        potentialWinnerName = finalNode.winnerRegistration?.member?.displayName || "Gagnant Finale";
      }
    } else if (lastPhase.phaseType === "ROUND_ROBIN" || lastPhase.phaseType === "GROUP_STAGE") {
      // Trouver le premier du classement du dernier groupe
      const lastGroup = await db.query.phaseGroups.findFirst({
        where: eq(phaseGroups.id, lastPhase.id), // Si une seule ligue
        orderBy: [desc(phaseGroups.order)]
      });
      if (lastGroup) {
        const topParticipant = await db.query.phaseGroupParticipants.findFirst({
          where: eq(phaseGroupParticipants.groupId, lastGroup.id),
          orderBy: [asc(phaseGroupParticipants.position)],
          with: { registration: { with: { member: true } } }
        });
        if (topParticipant) {
          potentialWinnerId = topParticipant.registrationId;
          potentialWinnerName = topParticipant.registration?.member?.displayName || "Leader Classement";
        }
      }
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <EditionDashboardActions 
        tournamentId={tournamentId}
        editionId={editionId}
        status={edition.status || "DRAFT"}
        potentialWinnerId={potentialWinnerId}
        potentialWinnerName={potentialWinnerName}
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Typography variant="h3" weight="bold" className="tracking-tight">
            Vue d'ensemble
          </Typography>
          <Typography
            variant="body-sm"
            theme="muted"
            className="flex items-center gap-2 mt-1"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Tableau de bord de l'édition{" "}
            {edition.name || `#${edition.editionNumber}`}
          </Typography>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Competition Config Badges */}
          <div className="flex items-center gap-1.5 mr-2">
            <Badge className="bg-primary/10 text-primary border-primary/20 shadow-sm text-[10px] font-bold px-2 py-0.5">
              {editionConfig.competitionType === "CHAMPIONSHIP" ? "CHAMPIONNAT" : 
               editionConfig.competitionType === "CUP" ? "COUPE" :
               editionConfig.competitionType === "SWISS" ? "SUISSE" : "LDC"}
            </Badge>
            <Badge className={cn(
              "shadow-sm text-[10px] font-bold px-2 py-0.5",
              editionConfig.competitionMode === "AUTO" 
                ? "bg-blue-500/10 text-blue-600 border-blue-200" 
                : "bg-amber-500/10 text-amber-600 border-amber-200"
            )}>
              {editionConfig.competitionMode === "AUTO" ? "ASST. AUTO" : "MODE MANUEL"}
            </Badge>
          </div>

          <Badge
            variant="outline"
            className="px-3 py-1 font-medium bg-background"
          >
            {edition.status}
          </Badge>
          <Button size="sm" asChild variant="ghost" className="h-8">
            <Link href={`/tournaments/${tournamentId}/editions/${editionId}`}>
              Vue publique
            </Link>
          </Button>
          
          {/* link to organisation page */}
          {(phasesResponse.data.length < 1) && (
            <Button size="sm" variant="default" asChild className="h-8 shadow-md">
              <Link
                href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/organize`}
              >
                Organiser <CalendarCogIcon className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <StatsCarousel
        data={stats.map((stat) => ({
          title: stat.label,
          value: stat.value,
          icon: <stat.icon />,
          variant:
            stat.color === "text-blue-500"
              ? "primary"
              : stat.color === "text-amber-500"
                ? "warning"
                : stat.color === "text-purple-500"
                  ? "secondary"
                  : stat.color === "text-emerald-500"
                    ? "success"
                    : "default",
          className:
            "min-w-full md:min-w-[250px] lg:flex-1 p-1 border-secondary border-2 bg-secondary/20",
          bgType: "solid",
          description: stat.description,
        }))}
        itemsPerView={{
          mobile: 1,
          md: 2,
          lg: 3,
          xl: 4,
        }}
        gap={12}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Registrations */}
        <Card className="lg:col-span-2 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div className="space-y-0.5">
              <CardTitle className="text-lg flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-primary" />
                Inscriptions Récentes
              </CardTitle>
            </div>
            <Button variant="ghost" size="sm" className="text-xs h-8" asChild>
              <Link
                href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/participants`}
              >
                Tout voir <ArrowRightIcon className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {registrationsResponse.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-10 w-10 text-muted/30 mb-3" />
                <Typography variant="body-sm" theme="muted">
                  Aucune inscription pour le moment
                </Typography>
              </div>
            ) : (
              <div className="space-y-1">
                {registrationsResponse.data.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 relative rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-xs font-bold text-primary overflow-hidden">
                        {reg.member?.avatar ? (
                          <Image
                            src={reg.member.avatar || "/icons/avatar-2-128.png"}
                            fill
                            alt={`avatar image - ${reg.member?.displayName}`}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          reg.member?.displayName
                            ?.substring(0, 2)
                            .toUpperCase() || "??"
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-sm group-hover:text-primary transition-colors">
                          {reg.member?.displayName || "Utilisateur"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Inscrit{" "}
                          {formatDistanceToNow(new Date(reg.registeredAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={cn(
                          "text-[10px] px-2 py-0.5 font-medium",
                          reg.feePaid
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-200"
                            : "bg-amber-500/10 text-amber-600 border-amber-200",
                        )}
                        variant="outline"
                      >
                        {reg.feePaid ? "Payé" : "Attente Paiement"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions / Notices */}
        <div className="space-y-6">
          <Card className="border-border/50">
            <CardHeader className="py-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-primary" />
                Alertes Organisateur
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(phasesResponse.data.length === 0 || edition.phases?.length === 0) ? (
                <div className="p-4 border border-amber-500/20 bg-amber-500/5 rounded-xl space-y-3">
                  <div className="flex gap-3">
                    <Activity className="h-5 w-5 text-amber-500 shrink-0" />
                    <div>
                      <Typography
                        variant="body-sm"
                        weight="bold"
                        className="text-amber-700 leading-tight"
                      >
                        Structure manquante
                      </Typography>
                      <Typography
                        variant="caption1"
                        className="text-amber-600/80 mt-1"
                      >
                        Définissez les phases (éliminations, poules) pour lancer
                        le tournoi.
                      </Typography>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-white hover:bg-amber-50 text-amber-600 border-amber-200"
                    asChild
                  >
                    <Link
                      href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`}
                    >
                      Configurer les phases
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
                  <UserCheck className="h-5 w-5 text-emerald-500" />
                  <Typography variant="body-sm" className="text-emerald-700">
                    Structure configurée ({phasesResponse.data.length} phases)
                  </Typography>
                </div>
              )}

              <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl space-y-1">
                <Typography
                  variant="caption1"
                  weight="bold"
                  className="text-primary uppercase tracking-wider"
                >
                  Note Rapide
                </Typography>
                <Typography variant="body-sm" theme="muted">
                  Pensez à vérifier les paiements avant de valider l'arbre
                  final.
                </Typography>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
