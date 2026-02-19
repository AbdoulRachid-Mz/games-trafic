"use client";

import React, { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Loader2 } from "lucide-react";
import { updateTournamentPhase } from "@/actions/phases";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface PhaseDetailActionsProps {
    phaseId: string;
    isActive: boolean;
    isCompleted: boolean;
}

export function PhaseDetailActions({
    phaseId,
    isActive,
    isCompleted,
}: PhaseDetailActionsProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleToggleActive = () => {
        startTransition(async () => {
            try {
                await updateTournamentPhase(phaseId, { isActive: !isActive });
                toast.success(isActive ? "Phase désactivée" : "Phase activée");
                router.refresh();
            } catch (error) {
                toast.error("Erreur lors de la mise à jour");
            }
        });
    };

    const handleToggleCompleted = () => {
        startTransition(async () => {
            try {
                await updateTournamentPhase(phaseId, { isCompleted: !isCompleted });
                toast.success(isCompleted ? "Phase réouverte" : "Phase terminée");
                router.refresh();
            } catch (error) {
                toast.error("Erreur lors de la mise à jour");
            }
        });
    };

    return (
        <div className="flex items-center gap-2 flex-wrap">
            <Button
                variant="outline"
                size="sm"
                onClick={handleToggleActive}
                disabled={isPending}
            >
                {isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : (
                    isActive ? <Lock className="h-3.5 w-3.5 mr-1.5" /> : <Unlock className="h-3.5 w-3.5 mr-1.5" />
                )}
                {isActive ? "Désactiver" : "Activer"}
            </Button>
            <Button
                variant={isCompleted ? "outline" : "default"}
                size="sm"
                onClick={handleToggleCompleted}
                disabled={isPending}
            >
                {isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                {isCompleted ? "Réouvrir" : "Terminer"}
            </Button>
        </div>
    );
}
