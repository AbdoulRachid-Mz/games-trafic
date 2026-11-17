// app/tournaments/[tournamentId]/editions/[editionId]/dashboard/phases/[phaseId]/page.tsx
import {
  getBracketNodes,
  getPhaseGroups,
  getPhaseStandings,
  getTournamentPhases,
} from "@/actions/phases";
import { getEditionRegistrations } from "@/actions/tournaments/members";
import { getTournamentEditionById } from "@/actions/editions";
import { computeBracketStandings } from "@/lib/tournaments/bracket-standings";
import type {
  BracketStandingRow,
  StandingRow,
} from "@/components/pages/tournaments/edition-detail/standings-table";
import { PhaseDetailClient } from "./phase-detail-client";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
    phaseId: string;
  }>;
}

// Couleurs utilitaires de catégorie (statut), rendues compatibles clair/sombre.
const phaseTypeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  ELIMINATION: { label: "Élimination directe", color: "text-red-700 dark:text-red-300", bgColor: "bg-red-500/10 border-red-500/20" },
  DOUBLE_ELIMINATION: { label: "Double élimination", color: "text-orange-700 dark:text-orange-300", bgColor: "bg-orange-500/10 border-orange-500/20" },
  ROUND_ROBIN: { label: "Round Robin", color: "text-blue-700 dark:text-blue-300", bgColor: "bg-blue-500/10 border-blue-500/20" },
  GROUP_STAGE: { label: "Phase de groupes", color: "text-green-700 dark:text-green-300", bgColor: "bg-green-500/10 border-green-500/20" },
  SWISS: { label: "Suisse", color: "text-purple-700 dark:text-purple-300", bgColor: "bg-purple-500/10 border-purple-500/20" },
  KNOCKOUT: { label: "K.O.", color: "text-pink-700 dark:text-pink-300", bgColor: "bg-pink-500/10 border-pink-500/20" },
  CUSTOM: { label: "Personnalisé", color: "text-gray-700 dark:text-gray-300", bgColor: "bg-gray-500/10 border-gray-500/20" },
  GROUP_ELIMINATION: { label: "Groupes + Élimination", color: "text-teal-700 dark:text-teal-300", bgColor: "bg-teal-500/10 border-teal-500/20" },
};

export default async function PhaseDetailPage({ params }: PageProps) {
  const { tournamentId, editionId, phaseId } = await params;

  const [allPhasesRes, edition, groupsRes, phaseStandings, registrationsRes] =
    await Promise.all([
      getTournamentPhases({
        filters: { editionId },
        options: { sortBy: "order", sortOrder: "asc" },
      }),
      getTournamentEditionById(editionId),
      getPhaseGroups({
        filters: { phaseId },
        options: { sortBy: "order", sortOrder: "asc" },
        pagination: { page: 1, limit: 500 },
      }),
      getPhaseStandings(phaseId),
      getEditionRegistrations({
        filters: { editionId },
        options: {
          populate: ["member", "member.user", "member.team"],
          sortBy: "registeredAt",
          sortOrder: "asc",
        },
        pagination: { page: 1, limit: 1000 },
      }),
    ]);

  const allPhases = allPhasesRes.data;
  const phase = allPhases.find((p) => p.id === phaseId);

  const hasGroupStandings = phaseStandings.length > 0;

  const registrations = registrationsRes.data ?? [];
  const namesById = new Map<string, string>(
    registrations.map((registration: any) => [
      registration.id,
      registration.member?.displayName ||
        registration.member?.user?.username ||
        registration.member?.user?.fullName ||
        "Joueur",
    ]),
  );
  const imagesById = new Map<string, string | undefined>(
    registrations.map((registration: any) => [
      registration.id,
      registration.member?.user?.profileImage ||
        registration.member?.user?.image ||
        undefined,
    ]),
  );

  const standingGroups = phaseStandings.map((group: any) => ({
    ...group,
    rows: (group.rows ?? []).map((row: any) => ({
      ...row,
      participantName: row.participantName || row.displayName,
      participantImage: row.participantImage || row.avatar,
    })) as StandingRow[],
  }));

  let bracketRows: BracketStandingRow[] = [];
  if (!hasGroupStandings) {
    const nodesRes = await getBracketNodes({
      filters: { phaseId },
      options: { sortBy: "round", sortOrder: "asc" },
      pagination: { page: 1, limit: 500 },
    });

    bracketRows = computeBracketStandings(nodesRes.data ?? [], namesById).map(
      (row) => ({
        ...row,
        participantImage: imagesById.get(row.registrationId),
      }),
    );
  }

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
      editionConfig={(edition?.editionConfig as any) || {}}
      standings={standingGroups}
      bracketRows={bracketRows}
      registrations={registrations}
    />
  );
}
