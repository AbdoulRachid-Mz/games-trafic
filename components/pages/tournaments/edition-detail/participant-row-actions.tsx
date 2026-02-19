"use client";

import React, { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, CheckCircle, XCircle } from "lucide-react";
import { deleteEditionRegistrationAction } from "@/actions/editions";
import { updateEditionRegistration } from "@/actions/tournaments";
import { toast } from "sonner";
import { revalidatePath } from "next/cache";

interface ParticipantRowActionsProps {
    registrationId: string;
    checkedIn: boolean;
    feePaid: boolean;
    status: string;
}

export function ParticipantRowActions({
    registrationId,
    checkedIn,
    feePaid,
    status,
}: ParticipantRowActionsProps) {
    const [isPending, startTransition] = useTransition();

    const handleToggleCheckin = () => {
        startTransition(async () => {
            try {
                await updateEditionRegistration(registrationId, { checkedIn: !checkedIn } as any);
                toast.success(checkedIn ? "Check-in annulé" : "Check-in confirmé");
            } catch (error) {
                toast.error("Erreur lors de la mise à jour");
            }
        });
    };

    const handleToggleFeePaid = () => {
        startTransition(async () => {
            try {
                await updateEditionRegistration(registrationId, { feePaid: !feePaid } as any);
                toast.success(feePaid ? "Marqué comme impayé" : "Marqué comme payé");
            } catch (error) {
                toast.error("Erreur lors de la mise à jour");
            }
        });
    };

    const handleSetStatus = (newStatus: string) => {
        startTransition(async () => {
            try {
                await updateEditionRegistration(registrationId, { status: newStatus } as any);
                toast.success(`Statut mis à jour: ${newStatus}`);
            } catch (error) {
                toast.error("Erreur lors de la mise à jour");
            }
        });
    };

    const handleDelete = () => {
        if (confirm("Êtes-vous sûr de vouloir supprimer ce participant ?")) {
            startTransition(async () => {
                try {
                    await deleteEditionRegistrationAction(registrationId);
                    toast.success("Participant supprimé");
                } catch (error) {
                    toast.error("Erreur lors de la suppression");
                }
            });
        }
    };

    return (
        <div className="flex items-center justify-end gap-1">
            <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleToggleCheckin}
                disabled={isPending}
            >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : checkedIn ? "Undo" : "Check-in"}
            </Button>
            <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={handleToggleFeePaid}
                disabled={isPending}
            >
                {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : feePaid ? "Impayé" : "Payé"}
            </Button>

            {status !== "ELIMINATED" && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                    onClick={() => handleSetStatus("ELIMINATED")}
                    disabled={isPending}
                    title="Éliminer"
                >
                    <XCircle className="h-3.5 w-3.5" />
                </Button>
            )}

            <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-red-50"
                onClick={handleDelete}
                disabled={isPending}
                title="Supprimer"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
        </div>
    );
}
