// @/app/tournaments/[tournamentId]/editions/[editionId]/dashboard/brackets/[bracketId]/page.tsx

import ClientBracketNodeDetailPage from "./client-page";
import { getBracketNodeById, getPhaseGroupParticipants } from "@/actions/phases";
import { getEditionRegistrations, getMatches } from "@/actions/tournaments";
import { getTournamentEditionById } from "@/actions/editions";
import type { BracketNodeWithDetails } from "@/types/api";

interface PageProps {
  params: Promise<{
    tournamentId: string;
    editionId: string;
    bracketId: string;
  }>;
}

export default async function BracketNodeDetailPage({ params }: PageProps) {
  const { tournamentId, editionId, bracketId } = await params;
  const basePath = `/tournaments/${tournamentId}/editions/${editionId}/dashboard`;

  // Récupération des données côté serveur
  const node = (await getBracketNodeById(bracketId, {
    populate: ["phase", "group"],
  })) as BracketNodeWithDetails | null;
  
  const [regsRes, matchesRes, edition] = await Promise.all([
    getEditionRegistrations({
      filters: { editionId },
      options: { populate: ["member", "member.user", "member.team"] },
      pagination: { page: 1, limit: 500 },
    }),
    getMatches({
      filters: { editionId, bracketNodeId: bracketId },
      options: { sortBy: "round", sortOrder: "asc" },
      pagination: { page: 1, limit: 100 },
    }),
    getTournamentEditionById(editionId)
  ]);
  
  const groupParticipantsRes = node?.groupId
    ? await getPhaseGroupParticipants({
        filters: { groupId: node.groupId },
        options: { sortBy: "position", sortOrder: "asc" },
        pagination: { page: 1, limit: 500 },
      })
    : { data: [] };
  
  // Passer toutes les données sérialisables au composant client
  return (
    <ClientBracketNodeDetailPage
      tournamentId={tournamentId}
      editionId={editionId}
      bracketId={bracketId}
      basePath={basePath}
      node={JSON.parse(JSON.stringify(node))} // Sérialisation sécurisée
      registrations={JSON.parse(JSON.stringify(regsRes.data))}
      groupParticipants={JSON.parse(JSON.stringify(groupParticipantsRes.data))}
      matches={JSON.parse(JSON.stringify(matchesRes.data))}
      editionConfig={(edition?.editionConfig as any) || {}}
    />
  );
}