// app/tournaments/[tournamentId]/editions/[editionId]/dashboard/brackets/[bracketId]/organize/page.tsx
import { Metadata } from "next";
import {
  getBracketNodeById,
  getMatchesWithParticipants,
  getPhaseGroupParticipants,
  getTournamentPhaseById,
} from "@/actions/phases";
import { getEditionRegistrations } from "@/actions/tournaments";
import { notFound } from "next/navigation";
import { ChevronLeft, Swords, Settings } from "lucide-react";
import Link from "next/link";
import { BracketNodeMatchesOrganizeClient } from "@/components/pages/tournaments/edition-detail/bracket-node-matches-organize-client";

export const metadata: Metadata = {
  title: "Organisation des Matchs du Bracket",
};

export default async function BracketNodeOrganizePage({
  params,
}: {
  params: Promise<{
    tournamentId: string;
    editionId: string;
    bracketId: string;
  }>;
}) {
  const { tournamentId, editionId, bracketId } = await params;
  
  const node = (await getBracketNodeById(bracketId, {
    populate: ["phase", "group"],
  })) as any;
  
  if (!node) notFound();

  // Récupération de la phase pour la configuration héritée
  const phase = node.phaseId ? await getTournamentPhaseById(node.phaseId) : null;
  const phaseConfig = (phase?.config as any) || {};

  const regsRes = await getEditionRegistrations({
    filters: { editionId },
    options: { populate: ["member", "member.user", "member.team"] },
    pagination: { page: 1, limit: 1000 },
  });

  const participantsRes = node.groupId
    ? await getPhaseGroupParticipants({
        filters: { groupId: node.groupId },
        pagination: { limit: 1000, page: 1 },
      })
    : { data: [] };

  const matchesRes = await getMatchesWithParticipants({
    filters: { editionId, bracketNodeId: bracketId },
    pagination: { page: 1, limit: 1000 },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Link
              href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/brackets/${bracketId}`}
              className="hover:text-primary flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Retour au nœud
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Organiser les Matchs
          </h1>
          <p className="text-muted-foreground text-sm">
            Gérez en masse les matchs pour le nœud{" "}
            {node.nodeCode || bracketId.slice(0, 8)}.
          </p>
        </div>
      </div>

      <BracketNodeMatchesOrganizeClient
        node={node as any}
        editionId={editionId}
        tournamentId={tournamentId}
        allRegistrations={regsRes.data as any[]}
        groupParticipants={participantsRes.data as any[]}
        existingMatches={matchesRes.data as any[]}
      />
    </div>
  );
}