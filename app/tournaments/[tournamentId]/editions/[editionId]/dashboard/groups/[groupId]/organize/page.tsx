import { Metadata } from "next";
import { getPhaseGroupById, getBracketNodes } from "@/actions/phases";
import { notFound } from "next/navigation";
import { ChevronLeft, LayoutGrid, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GroupNodesOrganizeClient } from "@/components/pages/tournaments/edition-detail/group-nodes-organize-client";

export const metadata: Metadata = {
  title: "Organisation des Nœuds du Groupe",
};

export default async function GroupNodesOrganizePage({
  params,
}: {
  params: Promise<{ tournamentId: string; editionId: string; groupId: string }>;
}) {
  const { tournamentId, editionId, groupId } = await params;
  const group = await getPhaseGroupById(groupId, { populate: ["phase"] });
  if (!group) notFound();

  const nodesRes = await getBracketNodes({
    filters: { groupId },
    options: { sortBy: "order", sortOrder: "asc" },
    pagination: { limit: 100, page: 1 },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Link 
              href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/groups/${groupId}`}
              className="hover:text-primary flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Retour au groupe
            </Link>
          </div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6 text-primary" /> Organiser les Nœuds du Groupe
          </h1>
          <p className="text-muted-foreground text-sm">
            Créez ou gérez en masse les nœuds de bracket pour le groupe {group.name || groupId.slice(0, 8)}.
          </p>
        </div>
      </div>

      <GroupNodesOrganizeClient
        groupId={groupId}
        phaseId={group.phaseId}
        existingNodes={nodesRes.data as any[]}
      />
    </div>
  );
}
