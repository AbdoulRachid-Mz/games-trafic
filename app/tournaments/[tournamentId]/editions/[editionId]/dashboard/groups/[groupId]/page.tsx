// app/tournaments/[tournamentId]/editions/[editionId]/dashboard/groups/[groupId]/page.tsx
import {
  getPhaseGroupById,
  getPhaseGroupParticipants,
  getPhaseQualifiedParticipantsAction,
  getBracketNodes,
  recalculateGroupStandings,
  getTournamentPhases,
  getMatchesWithParticipants,
} from "@/actions/phases";
import { getEditionRegistrations } from "@/actions/tournaments";
import { getTournamentEditionById } from "@/actions/editions";
import { GroupDetailClient } from "./group-detail-client";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
    groupId: string;
  }>;
}

interface BracketNode {
  id: string;
  nodeCode: string;
  round: number;
  matchNumber: number;
  bracketType: string;
  metadata?: any;
}

export default async function GroupDetailPage({ params }: PageProps) {
  const { tournamentId, editionId, groupId } = await params;
  const basePath = `/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups/${groupId}`;

  // Ensure standings are fresh
  await recalculateGroupStandings(groupId);

  const group = (await getPhaseGroupById(groupId, {
    populate: ["phase"],
  })) as any;
  const participantsRes = await getPhaseGroupParticipants({
    filters: { groupId },
    options: { sortBy: "points", sortOrder: "desc" },
    pagination: { page: 1, limit: 500 },
  });
  const regsRes = await getEditionRegistrations({
    filters: { editionId },
    options: { populate: ["member", "member.user", "member.team"] },
    pagination: { page: 1, limit: 500 },
  });

  const participants = participantsRes.data;
  const allRegs = regsRes.data as any[];

  // Fetch Previous Phases & Qualified Participants
  const allPhasesRes = await getTournamentPhases({
    filters: { editionId },
    options: { sortBy: "order", sortOrder: "asc" },
  });
  const allPhases = allPhasesRes.data;
  const currentPhaseOrder = (group?.phase as any)?.order || 0;
  const previousPhases = allPhases.filter(
    (p) => (p.order || 0) < currentPhaseOrder,
  );

  // Fetch qualified participants for each previous phase
  const qualifiedByPhase: Record<
    string,
    { name: string; registrationIds: string[] }
  > = {};

  for (const phase of previousPhases) {
    // ROUND ROBIN (groupes = journées) : les lignes phaseGroupParticipants
    // des phases récentes ne portent rien — les qualifiés officiels sont
    // dans phase.config.qualifiers (helper central, repli sur les lignes
    // pour les modèles historiques).
    const qualifiedRes = await getPhaseQualifiedParticipantsAction(phase.id);
    qualifiedByPhase[phase.id] = {
      name: phase.name || `Phase ${phase.order}`,
      registrationIds: qualifiedRes.registrationIds,
    };
  }

  // Determine source from phase config
  const phaseConfig = (group?.phase as any)?.config || {};
  const participantSource = phaseConfig.participantSource || "EDITION";

  const [nodesRes, matchesRes, edition] = await Promise.all([
    getBracketNodes({
      filters: { groupId },
      options: { sortBy: "order", sortOrder: "asc" },
      pagination: { page: 1, limit: 200 },
    }),
    getMatchesWithParticipants({
      filters: { groupId, editionId },
      pagination: { page: 1, limit: 500 },
      options: { sortBy: "matchNumber", sortOrder: "asc" },
    }),
    getTournamentEditionById(editionId)
  ]);
  
  const nodes = nodesRes.data;
  const matches = matchesRes.data;

  // Global stats
  const totalMatches =
    participants.reduce((acc, p) => acc + (p.matchesPlayed ?? 0), 0) / 2;

  return (
    <GroupDetailClient
      tournamentId={tournamentId}
      editionId={editionId}
      groupId={groupId}
      group={group}
      participants={participants}
      allRegs={allRegs}
      qualifiedByPhase={qualifiedByPhase}
      participantSource={participantSource}
      nodes={
        nodes.map((node) => ({
          ...node,
          nodeCode: node.nodeCode ?? "",
        })) as BracketNode[]
      }
      matches={matches}
      basePath={basePath}
      totalMatches={totalMatches}
      editionConfig={(edition?.editionConfig as any) || {}}
    />
  );
}
