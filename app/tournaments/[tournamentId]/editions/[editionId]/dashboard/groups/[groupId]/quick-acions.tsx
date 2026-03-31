// @/tournaments/[tournamentId]/editions/[editionId]/dashboard/groups/[groupId]/quick-acions.tsx
"use client";

import { GenerateGroupMatchesDialog } from "@/components/pages/tournaments/edition-detail/generate-group-matches-dialog";
import { UpdatePhaseGroupDialog } from "@/components/pages/tournaments/edition-detail/update-phase-group-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuContent } from "@/components/ui/dropdown-menu";
import { useScreenSize } from "@/hooks/use-screen";
import { ArrowLeft, MoreHorizontal, Settings } from "lucide-react";
import Link from "next/link";

interface QuickActionProps {
  basePath: string;
  groupId: string;
  editionId: string;
  group: any;
  tournamentId: string;
}

export const QuicKAction = ({basePath, groupId, editionId, group, tournamentId}: QuickActionProps) => {
  const { isMobile } = useScreenSize();

  const actions = [
    {
      title: "Organiser",
      url: `${basePath}/organize`,
      icon: Settings,
      child: (
        <div className="flex items-center gap-2 w-full">
          <Button variant="outline" asChild>
            <Link
              href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${group?.phaseId}`}
            >
              <ArrowLeft className="h-4 w-4 mr-1" /> Retour
            </Link>
          </Button>
          {/* Generate matches */}
          <GenerateGroupMatchesDialog
            groupId={groupId}
            editionId={editionId}
            phaseId={group?.phaseId || ""}
          />

          <Button variant="outline" className="gap-1.5" asChild>
            <Link href={`${basePath}/organize`}>
              <Settings className="h-4 w-4" /> Organiser les Nœuds
            </Link>
          </Button>

          {group && <UpdatePhaseGroupDialog group={group} />}

        </div>
      )
    },
  ]

  const renderActions = () => {
    const allActions = actions[0].child.props.children;
    const firstTwo = allActions.slice(0, 2);
    const rest = allActions.slice(2);

    if (!isMobile) {
      return actions[0].child;
    }

    return (
      <div className="flex items-center gap-2 w-full">
        {firstTwo}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {rest.map((action: React.ReactNode, idx: number) => (
              <DropdownMenuItem key={idx} asChild>
                {action}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  };

  return renderActions();
}

