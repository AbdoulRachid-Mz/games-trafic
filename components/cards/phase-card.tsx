// @/components/cards/phase-card.tsx
"use client";

import React, { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Typography } from "@/components/ui/typography";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  GitBranch,
  Settings2,
  Trash2,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteTournamentPhase } from "@/actions/phases";
import {
  reorderPhasesAction,
  activatePhaseAction,
} from "@/actions/editions";
import { BaseCardProps, CardActionMenu, extraActionsProps } from "./card-action-menu";

export interface PhaseCardProps extends BaseCardProps<any> {
  tournamentId: string;
  editionId: string;
  isFirst?: boolean;
  isLast?: boolean;
  phasesCount?: number;
  /** Masque les actions d'administration (lecture seule). */
  canManage?: boolean;
}

const PHASE_TYPES = [
  { value: "ELIMINATION", label: "Élimination directe" },
  { value: "ROUND_ROBIN", label: "Round Robin" },
  { value: "GROUP_STAGE", label: "Phase de poules" },
  { value: "SWISS", label: "Système suisse" },
  { value: "KNOCKOUT", label: "Knockout" },
  { value: "CUSTOM", label: "Personnalisé" },
] as const;

export function phaseTypeLabel(type: string | null | undefined): string {
  return PHASE_TYPES.find((t) => t.value === type)?.label || type || "—";
}

export function phaseTypeBadgeColor(type: string | null | undefined): string {
  switch (type) {
    case "ELIMINATION":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
    case "ROUND_ROBIN":
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
    case "GROUP_STAGE":
      return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
    case "SWISS":
      return "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400";
    case "KNOCKOUT":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400";
  }
}

export function PhaseCard({
  item: phase,
  viewMode = "grid",
  isCliquable = true,
  isMini = false,
  activeAction = "view",
  onEdit,
  onView,
  onDelete,
  tournamentId,
  editionId,
  isFirst = false,
  isLast = false,
  canManage = true,
  className,
}: PhaseCardProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const isList = viewMode === "list";
  const isCompact = viewMode === "compact" || isMini;

  const detailUrl = `/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phase.id}`;
  const typeLabel = phaseTypeLabel(phase.phaseType);
  const typeColor = phaseTypeBadgeColor(phase.phaseType);

  const handleView = () => {
    if (onView) onView(phase);
    else router.push(detailUrl);
  };

  const handleMainAction = () => {
    if (!isCliquable) return;
    if (activeAction === "view") handleView();
    else if (activeAction === "edit" && onEdit) onEdit(phase);
    else if (activeAction === "delete" && onDelete) onDelete(phase);
    else handleView();
  };

  const handleMove = (direction: "up" | "down") => {
    startTransition(async () => {
      try {
        const result = await reorderPhasesAction({
          id: phase.id,
          direction,
          editionId,
          tournamentId,
        });
        if (result.success) {
          toast.success("Ordre mis à jour");
          router.refresh();
        }
      } catch (error) {
        toast.error("Erreur lors du déplacement");
      }
    });
  };

  const handleToggleActive = () => {
    startTransition(async () => {
      try {
        const result = await activatePhaseAction({
          id: phase.id,
          editionId,
          tournamentId,
        });
        if (result.success) {
          toast.success(
            !phase.isActive ? "Phase activée" : "Phase désactivée",
          );
          router.refresh();
        }
      } catch (error) {
        toast.error("Erreur lors de l'activation");
      }
    });
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(phase);
      return;
    }
    startTransition(async () => {
      try {
        await deleteTournamentPhase(phase.id);
        toast.success("Phase supprimée");
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    });
  };

  const extraActions: extraActionsProps[] = canManage
    ? [
        {
          id: "toggle-active",
          label: phase.isActive ? "Désactiver" : "Activer",
          icon: Zap,
          onClick: handleToggleActive,
        },
        ...(!isFirst
          ? [
              {
                id: "move-up",
                label: "Monter",
                icon: ArrowUp,
                onClick: () => handleMove("up"),
              },
            ]
          : []),
        ...(!isLast
          ? [
              {
                id: "move-down",
                label: "Descendre",
                icon: ArrowDown,
                onClick: () => handleMove("down"),
              },
            ]
          : []),
        {
          id: "manage",
          label: "Gérer",
          icon: Settings2,
          onClick: handleView,
        },
      ]
    : [
        {
          id: "manage",
          label: "Voir le détail",
          icon: ArrowRight,
          onClick: handleView,
        },
      ];

  const statusBadges = (
    <>
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
          typeColor,
        )}
      >
        {typeLabel}
      </span>
      {phase.isDoubleElimination && (
        <Badge variant="outline" className="h-5 px-2 text-[10px] bg-muted/50">
          Double Élim.
        </Badge>
      )}
      {phase.isActive && (
        <Badge className="h-5 border-none bg-green-600 px-2 text-[10px] text-white shadow-sm">
          Active
        </Badge>
      )}
      {phase.isCompleted && (
        <Badge variant="secondary" className="h-5 px-2 text-[10px]">
          Terminée
        </Badge>
      )}
    </>
  );

  const menu = (
    <div onClick={(event) => event.stopPropagation()}>
      <CardActionMenu
        onView={() => handleView()}
        onDelete={canManage && !onDelete ? handleDelete : undefined}
        entityName={`la phase ${phase.name}`}
        extraActions={extraActions}
      />
    </div>
  );

  if (isCompact) {
    return (
      <Card
        className={cn(
          "group relative cursor-pointer overflow-hidden transition-all hover:border-primary/50",
          isPending && "opacity-70",
          className,
        )}
        onClick={handleMainAction}
      >
        <CardContent className="flex items-center justify-between gap-3 p-3">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-bold text-xs text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              {phase.order}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-bold leading-none">
                {phase.name}
              </p>
              <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                <GitBranch className="h-3 w-3" />
                {typeLabel}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {menu}
            <ArrowRight className="h-3 w-3 text-muted-foreground transition-colors group-hover:text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isList) {
    return (
      <Card
        className={cn(
          "group relative overflow-hidden transition-all hover:border-primary/50",
          isPending && "opacity-70",
          className,
        )}
      >
        <CardContent className="flex flex-col justify-between p-0 md:flex-row md:items-center">
          <div
            onClick={handleMainAction}
            className="flex flex-1 cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-muted/30"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-black text-primary">
              {phase.order}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Typography
                  variant="body-base"
                  weight="bold"
                  className="truncate"
                >
                  {phase.name}
                </Typography>
                {statusBadges}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Settings2 className="h-3 w-3" /> Ordre {phase.order}
                </span>
                {phase.totalMatches != null && (
                  <span>
                    {phase.completedMatches ?? 0}/{phase.totalMatches} matchs
                    terminés
                  </span>
                )}
              </div>
            </div>
          </div>
          <div
            className="flex items-center justify-end gap-2 border-t bg-muted/5 p-4 md:border-l md:border-t-0"
            onClick={(event) => event.stopPropagation()}
          >
            <Button size="sm" variant="ghost" asChild>
              <a href={detailUrl}>Gérer</a>
            </Button>
            {menu}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "group relative flex flex-col overflow-hidden transition-all duration-200 hover:border-primary/50 hover:shadow-md",
        isCliquable && "cursor-pointer active:scale-[0.99]",
        isPending && "opacity-70",
        className,
      )}
      onClick={handleMainAction}
    >
      <CardHeader className="border-b bg-muted/30 pb-2 transition-colors group-hover:bg-muted/50">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              {statusBadges}
            </div>
            <CardTitle className="truncate text-lg font-bold tracking-tight">
              {phase.name}
            </CardTitle>
          </div>
          <div className="shrink-0">{menu}</div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-4">
        <div className="flex items-center justify-between border-b border-border/50 py-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Settings2 className="h-4 w-4" />
            <span>Ordre</span>
          </div>
          <span className="font-mono text-sm">#{phase.order}</span>
        </div>
        <div className="flex items-center justify-between py-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <GitBranch className="h-4 w-4" />
            <span>Matchs</span>
          </div>
          <span className="font-bold">
            {phase.totalMatches != null
              ? `${phase.completedMatches ?? 0}/${phase.totalMatches}`
              : "—"}
          </span>
        </div>
      </CardContent>

      <div
        className="flex gap-2 p-4 pt-0"
        onClick={(event) => event.stopPropagation()}
      >
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-xs"
          asChild
        >
          <a href={detailUrl}>
            <Settings2 className="h-3.5 w-3.5" /> Gérer
          </a>
        </Button>
      </div>
    </Card>
  );
}
