"use client";

import React, { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Lock, Unlock, Loader2, RefreshCcw, MoreHorizontal, Trash2, CheckCircle2 } from "lucide-react";
import { deleteTournamentPhase, updateTournamentPhase } from "@/actions/phases";
import { MarkCompleteDialog } from "./mark-complete-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PhaseDetailActionsProps {
  phaseId: string;
  phaseName?: string;
  isActive: boolean;
  isCompleted: boolean;
  phaseType?: string;
  editionType?: string;
  basePath?: string;
}

export function PhaseDetailActions({
  phaseId,
  phaseName = "Phase",
  isActive,
  isCompleted,
  phaseType,
  editionType,
  basePath,
}: PhaseDetailActionsProps) {
  const [isPending, startTransition] = useTransition();
  const [showDelete, setShowDelete] = useState(false);
  const router = useRouter();

  const handleToggleActive = () => {
    startTransition(async () => {
      try {
        await updateTournamentPhase(phaseId, { isActive: !isActive });
        toast.success(isActive ? "Phase désactivée" : "Phase activée");
        router.refresh();
      } catch {
        toast.error("Erreur lors de la mise à jour");
      }
    });
  };

  const handleReopen = () => {
    startTransition(async () => {
      try {
        await updateTournamentPhase(phaseId, { isCompleted: false });
        toast.success("Phase rouverte");
        router.refresh();
      } catch {
        toast.error("Erreur lors de la réouverture");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteTournamentPhase(phaseId);
        toast.success("Phase supprimée");
        setShowDelete(false);
        if (basePath) {
          router.push(`${basePath}/phases`);
        } else {
          router.refresh();
        }
      } catch (error: any) {
        toast.error(error?.message || "Erreur lors de la suppression");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2" disabled={isPending} aria-label="Actions de la phase">
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem onSelect={handleToggleActive} disabled={isPending}>
            {isActive ? <Lock className="mr-2 h-4 w-4" /> : <Unlock className="mr-2 h-4 w-4" />}
            {isActive ? "Désactiver" : "Activer"}
          </DropdownMenuItem>
          {isCompleted ? (
            <DropdownMenuItem onSelect={handleReopen} disabled={isPending}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Rouvrir
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-destructive focus:text-destructive"
            onSelect={() => setShowDelete(true)}
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer la phase
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {!isCompleted && (
        <MarkCompleteDialog
          type="PHASE"
          id={phaseId}
          name={phaseName}
          editionConfig={{
            competitionMode: editionType === "AUTO" ? "AUTO" : "MANUAL",
            competitionType: phaseType,
          }}
          onComplete={() => router.refresh()}
        />
      )}

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la phase</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la phase « {phaseName} » ? Cette action est irréversible et
              supprimera en cascade tous les groupes, nœuds de bracket, participants de groupe et matchs associés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
