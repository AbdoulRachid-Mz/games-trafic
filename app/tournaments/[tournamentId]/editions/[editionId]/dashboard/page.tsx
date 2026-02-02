import { Metadata } from "next";
import {
  getTournamentEditionById,
  getEditionRegistrations,
  getTournamentPhases,
  getMatches,
} from "@/actions/tournaments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Users, Trophy, Activity, Calendar, GitBranch } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { notFound } from "next/navigation";

interface DashboardPageProps {
  params: {
    tournamentId: string;
    editionId: string;
  };
}

export const metadata: Metadata = {
  title: "Dashboard Édition - Vue d'ensemble",
};

export default async function DashboardOverviewPage({
  params,
}: DashboardPageProps) {
  const { editionId } = params;

  // Parallel fetching
  const [edition, registrationsResponse, phasesResponse, matchesResponse] =
    await Promise.all([
      getTournamentEditionById(editionId),
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
      value: `${edition.currentParticipants || 0} / ${edition.maxParticipants}`,
      icon: Users,
      color: "text-blue-500",
      description: "Inscrits confirmés",
    },
    {
      label: "Cashprize",
      value: `${edition.prizePool || 0} GTC`,
      icon: Trophy,
      color: "text-yellow-500",
      description: "Montant total",
    },
    {
      label: "Phases",
      value: phasesResponse.data.length,
      icon: GitBranch,
      color: "text-purple-500",
      description: "Structure du tournoi",
    },
    {
      label: "Statut",
      value: edition.status,
      icon: Activity,
      color: "text-green-500",
      description: "État actuel",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Typography variant="h3" weight="bold">
          Vue d'ensemble
        </Typography>
        <Typography variant="body-sm" theme="muted">
          Bienvenue sur le tableau de bord de l'édition.
        </Typography>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Card key={i}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <Typography variant="body-sm" theme="muted" className="mb-1">
                  {stat.label}
                </Typography>
                <Typography variant="h4" weight="bold" className="mb-1">
                  {stat.value}
                </Typography>
                <Typography
                  variant="caption2"
                  theme="muted"
                  className="text-xs"
                >
                  {stat.description}
                </Typography>
              </div>
              <div className={`p-3 rounded-full bg-muted/50 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Inscriptions Récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {registrationsResponse.data.length === 0 ? (
              <div className="text-muted-foreground text-sm text-center py-4">
                Aucune inscription récente
              </div>
            ) : (
              <div className="space-y-4">
                {registrationsResponse.data.map((reg) => (
                  <div
                    key={reg.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold">
                        {/* @ts-ignore - quick access to deep prop if exists */}
                        {reg.member?.displayName
                          ?.substring(0, 2)
                          .toUpperCase() || "??"}
                      </div>
                      <div>
                        {/* @ts-ignore */}
                        <div className="font-medium text-sm">
                          {reg.member?.displayName || "Utilisateur"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(reg.registeredAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        reg.feePaid
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {reg.feePaid ? "Payé" : "En attente"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions / Notices */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions Requises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {phasesResponse.data.length === 0 && (
                <div className="p-4 border border-yellow-500/20 bg-yellow-500/5 rounded-lg">
                  <h4 className="font-medium text-yellow-600 mb-1">
                    Configuration incomplète
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Vous n'avez pas encore défini les phases du tournoi.
                  </p>
                  {/* Link to phases settings would go here */}
                </div>
              )}

              {/* Placeholder for other alerts */}
              <p className="text-sm text-muted-foreground">
                Aucune autre action urgente requise pour le moment.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
