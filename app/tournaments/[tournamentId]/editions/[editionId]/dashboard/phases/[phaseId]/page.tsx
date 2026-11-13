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
