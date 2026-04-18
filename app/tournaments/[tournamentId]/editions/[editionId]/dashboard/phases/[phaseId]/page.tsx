// app/tournaments/[tournamentId]/editions/[editionId]/dashboard/phases/[phaseId]/page.tsx
import { getTournamentPhases } from "@/actions/phases";
import { getPhaseGroups } from "@/actions/phases";
import { PhaseDetailClient } from "./phase-detail-client";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
    phaseId: string;
  }>;
}

const phaseTypeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  ELIMINATION: { label: "Élimination directe", color: "text-red-700", bgColor: "bg-red-100 border-red-200" },
  DOUBLE_ELIMINATION: { label: "Double élimination", color: "text-orange-700", bgColor: "bg-orange-100 border-orange-200" },
  ROUND_ROBIN: { label: "Round Robin", color: "text-blue-700", bgColor: "bg-blue-100 border-blue-200" },
  GROUP_STAGE: { label: "Phase de groupes", color: "text-green-700", bgColor: "bg-green-100 border-green-200" },
  SWISS: { label: "Suisse", color: "text-purple-700", bgColor: "bg-purple-100 border-purple-200" },
  KNOCKOUT: { label: "K.O.", color: "text-pink-700", bgColor: "bg-pink-100 border-pink-200" },
  CUSTOM: { label: "Personnalisé", color: "text-gray-700", bgColor: "bg-gray-100 border-gray-200" },
  GROUP_ELIMINATION: { label: "Groupes + Élimination", color: "text-teal-700", bgColor: "bg-teal-100 border-teal-200" },
};

export default async function PhaseDetailPage({ params }: PageProps) {
  const { tournamentId, editionId, phaseId } = await params;

  const allPhasesRes = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
  });
  const allPhases = allPhasesRes.data;
  const phase = allPhases.find((p) => p.id === phaseId);

  const groupsRes = await getPhaseGroups({
    filters: { phaseId },
    options: { sortBy: "order", sortOrder: "asc" },
    pagination: { page: 1, limit: 500 },
  });

  const basePath = `/tournaments/${tournamentId}/editions/${editionId}/dashboard`;
  const typeConf = phaseTypeConfig[phase?.phaseType || ""] || phaseTypeConfig.CUSTOM;

  return (
    <PhaseDetailClient
      tournamentId={tournamentId}
      editionId={editionId}
      phaseId={phaseId}
      phase={phase}
      groups={groupsRes.data}
      allPhases={allPhases}
      basePath={basePath}
      typeConf={typeConf}
    />
  );
}