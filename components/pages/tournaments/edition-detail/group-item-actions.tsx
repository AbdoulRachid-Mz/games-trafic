"use client";

import React, { useTransition } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Trash2, Loader2, Lock, Unlock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import {
  updatePhaseGroup,
  deletePhaseGroupCascade,
  getPhaseGroups,
  toggleGroupLock,
} from "@/actions/phases";

interface GroupItemActionsProps {
  group: any;
  basePath: string;
  isFirst: boolean;
  isLast: boolean;
  phaseId: string;
}

export function GroupItemActions({
  group,
  basePath,
  isFirst,
  isLast,
  phaseId,
}: GroupItemActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleMove = (direction: "up" | "down") => {
    startTransition(async () => {
      try {
        const list = await getPhaseGroups({
          filters: { phaseId },
          options: { sortBy: "order", sortOrder: "asc" },
          pagination: { page: 1, limit: 500 },
        });
        const arr = list.data
          .slice()
          .sort((a, b: any) => (a.order ?? 0) - (b.order ?? 0));
        const idx = arr.findIndex((g) => g.id === group.id);
        const swapWith = direction === "up" ? idx - 1 : idx + 1;

        if (idx === -1 || swapWith < 0 || swapWith >= arr.length) return;

        const a = arr[idx];
        const b = arr[swapWith];

        await updatePhaseGroup(a.id, {
          order: b.order ?? swapWith + 1,
        } as any);
        await updatePhaseGroup(b.id, {
          order: a.order ?? idx + 1,
        } as any);

        toast.success("Ordre mis à jour");
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors du déplacement");
      }
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deletePhaseGroupCascade(group.id);
        toast.success("Groupe supprimé");
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors de la suppression");
      }
    });
  };

  const handleToggleLock = () => {
    startTransition(async () => {
      try {
        await toggleGroupLock(group.id, !group.isLocked);
        toast.success(
          group.isLocked ? "Groupe déverrouillé" : "Groupe verrouillé",
        );
        router.refresh();
      } catch (error) {
        toast.error("Erreur lors du changement de statut");
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => handleMove("up")}
        disabled={isFirst || isPending}
        aria-label="Monter le groupe"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ArrowUp className="h-3.5 w-3.5" />
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => handleMove("down")}
        disabled={isLast || isPending}
        aria-label="Descendre le groupe"
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ArrowDown className="h-3.5 w-3.5" />
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn(
          "h-8 w-8 p-0",
          group.isLocked &&
            "border-secondary/40 bg-secondary/10 text-secondary-foreground",
        )}
        onClick={handleToggleLock}
        disabled={isPending}
        title={group.isLocked ? "Déverrouiller le groupe" : "Verrouiller le groupe"}
        aria-label={
          group.isLocked ? "Déverrouiller le groupe" : "Verrouiller le groupe"
        }
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : group.isLocked ? (
          <Lock className="h-3.5 w-3.5" />
        ) : (
          <Unlock className="h-3.5 w-3.5" />
        )}
      </Button>

      <Button size="sm" variant="outline" asChild>
        <Link href={`${basePath}/groups/${group.id}`}>Gérer</Link>
      </Button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            disabled={isPending}
            aria-label={`Supprimer le groupe ${group.name}`}
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le groupe</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera le groupe &quot;{group.name}&quot; ainsi
              que ses participants, matchs et nœuds de bracket associés. Cette
              suppression est définitive.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
