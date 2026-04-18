// app/tournaments/[tournamentId]/editions/[editionId]/dashboard/groups/[groupId]/page.tsx
import {
  getPhaseGroupById,
  getPhaseGroupParticipants,
  getBracketNodes,
  recalculateGroupStandings,
  getTournamentPhases,
} from "@/actions/phases";
import { getEditionRegistrations } from "@/actions/tournaments";
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
    const qParticipants = await getPhaseGroupParticipants({
      filters: { phaseId: phase.id, qualified: true },
      pagination: { limit: 1000, page: 1 },
    });
    qualifiedByPhase[phase.id] = {
      name: phase.name || `Phase ${phase.order}`,
      registrationIds: (qParticipants.data as any[]).map(
        (p) => p.registrationId,
      ),
    };
  }

  // Determine source from phase config
  const phaseConfig = (group?.phase as any)?.config || {};
  const participantSource = phaseConfig.participantSource || "EDITION";

  // Fetch Bracket Nodes
  const nodesRes = await getBracketNodes({
    filters: { groupId },
    options: { sortBy: "order", sortOrder: "asc" },
    pagination: { page: 1, limit: 200 },
  });
  const nodes = nodesRes.data;

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
      basePath={basePath}
      totalMatches={totalMatches}
    />
  );
}
