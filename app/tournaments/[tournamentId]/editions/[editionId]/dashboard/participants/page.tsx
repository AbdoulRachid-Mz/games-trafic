import { getUnifiedEditionParticipantsAction } from "@/actions/editions";
import { ParticipantsManagementClient } from "@/components/pages/tournaments/edition-detail/participants-management-client";
import { StatsCarousel } from "@/components/shared/stats-carousel";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
  }>;
}

export default async function DashboardParticipantsPage({ params }: PageProps) {
  const { tournamentId, editionId } = await params;

  // Récupération unifiée complète de la base de participants (inscrits + membres non inscrits)
  const unifiedResponse = await getUnifiedEditionParticipantsAction(
    tournamentId,
    editionId,
    { limit: 2000, statusFilter: "all" }
  );

  const { counts } = unifiedResponse;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Statistiques globales réelles */}
      <StatsCarousel
        data={[
          {
            value: counts.registered,
            title: "Total Inscrits",
            className: "bg-muted/30 border-none shadow-none",
          },
          {
            value: counts.checkedIn,
            title: "Checked-in",
            className: "bg-green-500/5 border-none shadow-none",
            variant: "secondary",
          },
          {
            value: counts.paid,
            title: "Frais Payés",
            className: "bg-blue-500/5 border-none shadow-none",
            variant: "success",
          },
          {
            value: counts.unregistered,
            title: "Membres Tournoi Non Inscrits",
            className: "bg-amber-500/5 border-none shadow-none",
            variant: "warning",
          },
        ]}
        itemsPerView={{ mobile: 1, md: 2, lg: 4 }}
        gap={8}
      />

      <ParticipantsManagementClient 
        editionId={editionId} 
        tournamentId={tournamentId}
        initialUnified={unifiedResponse}
      />
    </div>
  );
}
