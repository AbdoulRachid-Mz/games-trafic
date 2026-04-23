"use client";

import React, { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Lock, Unlock, Loader2, RefreshCcw } from "lucide-react";
import { updateTournamentPhase } from "@/actions/phases";
import { MarkCompleteDialog } from "./mark-complete-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Link from "next/link";

interface PhaseDetailActionsProps {
    phaseId: string;
    isActive: boolean;
    isCompleted: boolean;
    phaseType?: string;
    editionType?: string;
}

export function PhaseDetailActions({
    phaseId,
    isActive,
    isCompleted,
    phaseType,
    editionType,
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

    const handleReopen = () => {
        startTransition(async () => {
            try {
                await updateTournamentPhase(phaseId, { isCompleted: false });
                toast.success("Phase réouverte");
                router.refresh();
            } catch (error) {
                toast.error("Erreur lors de la réouverture");
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

            {isCompleted ? (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReopen}
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5 mr-1.5" />}
                    Réouvrir
                </Button>
            ) : (
                <MarkCompleteDialog
                    type="PHASE"
                    id={phaseId}
                    name="Phase"
                    editionConfig={{
                        competitionMode: editionType === "AUTO" ? "AUTO" : "MANUAL",
                        competitionType: phaseType,
                    }}
                    onComplete={() => router.refresh()}
                />
            )}
        </div>
    );
}
