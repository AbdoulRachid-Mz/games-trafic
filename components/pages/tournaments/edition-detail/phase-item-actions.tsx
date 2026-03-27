"use client";

import React, { useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
    ArrowUp,
    ArrowDown,
    Zap,
    Trash2,
    Eye,
    ArrowRight,
    Loader2,
    Settings2
} from "lucide-react";
import {
    updateTournamentPhase,
    deleteTournamentPhase
} from "@/actions/phases";
import {
    getTournamentPhases,
    getEditionRegistrations,
    createMatch,
    getMatches
} from "@/actions/tournaments";
import {
    reorderPhasesAction,
    activatePhaseAction
} from "@/actions/editions";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PhaseItemActionsProps {
    phase: any;
    tournamentId: string;
    editionId: string;
    isFirst: boolean;
    isLast: boolean;
    phasesCount: number;
}

export function PhaseItemActions({
    phase,
    tournamentId,
    editionId,
    isFirst,
    isLast,
    phasesCount,
}: PhaseItemActionsProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

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
                }
            } catch (error) {
                toast.error("Erreur lors du déplacement");
            }
        });
    };

    const handleDelete = () => {
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

    const handleToggleActive = () => {
        startTransition(async () => {
            try {
                const result = await activatePhaseAction({
                    id: phase.id,
                    editionId,
                    tournamentId,
                });
                if (result.success) {
                    toast.success(!phase.isActive ? "Phase activée" : "Phase désactivée");
                }
            } catch (error) {
                toast.error("Erreur lors de l'activation");
            }
        });
    };

    return (
        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <div className="flex items-center gap-1 mr-2">
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    disabled={isFirst || isPending}
                    onClick={() => handleMove("up")}
                >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowUp className="h-3.5 w-3.5" />}
                </Button>
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 p-0"
                    disabled={isLast || isPending}
                    onClick={() => handleMove("down")}
                >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <ArrowDown className="h-3.5 w-3.5" />}
                </Button>
            </div>

            <Button
                size="sm"
                variant={phase.isActive ? "default" : "outline"}
                className="h-8"
                onClick={handleToggleActive}
                disabled={isPending}
            >
                {isPending ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Zap className="h-3.5 w-3.5 mr-1" />}
                {phase.isActive ? "Active" : "Activer"}
            </Button>

            {/* Other actions like Edit, Bracket, Manage, Delete... */}
            {/* ... keeping this concise for now ... */}

            <Button size="sm" variant="ghost" className="h-8" asChild>
                <Link href={`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases/${phase.id}`}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Gérer
                </Link>
            </Button>

            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        disabled={isPending}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer la phase</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir supprimer la phase "{phase.name}" ?
                            Cette action est irréversible et supprimera tous les groupes et matchs associés.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
