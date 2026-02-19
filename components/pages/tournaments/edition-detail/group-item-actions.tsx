"use client";

import React, { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp, ArrowDown, Trash2, Loader2 } from "lucide-react";
import { updatePhaseGroup, deletePhaseGroup, getPhaseGroups } from "@/actions/phases";
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
                const arr = list.data.slice().sort((a, b: any) => (a.order ?? 0) - (b.order ?? 0));
                const idx = arr.findIndex((g) => g.id === group.id);
                const swapWith = direction === "up" ? idx - 1 : idx + 1;

                if (idx === -1 || swapWith < 0 || swapWith >= arr.length) return;

                const a = arr[idx];
                const b = arr[swapWith];

                await updatePhaseGroup(a.id, { order: b.order ?? swapWith + 1 } as any);
                await updatePhaseGroup(b.id, { order: a.order ?? idx + 1 } as any);

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
                await deletePhaseGroup(group.id);
                toast.success("Groupe supprimé");
                router.refresh();
            } catch (error) {
                toast.error("Erreur lors de la suppression");
            }
        });
    };

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleMove("up")}
                disabled={isFirst || isPending}
            >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => handleMove("down")}
                disabled={isLast || isPending}
            >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowDown className="h-3.5 w-3.5" />}
            </Button>

            <Button size="sm" variant="outline" asChild>
                <Link href={`${basePath}/groups/${group.id}`}>Gérer</Link>
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive h-8 w-8 p-0"
                        disabled={isPending}
                    >
                        ✕
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer le groupe</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action supprimera le groupe &quot;{group.name}&quot; et toutes ses données associées.
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
