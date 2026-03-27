"use client";

import React, { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, CheckCircle, XCircle, CreditCard, UserCheck, MoreHorizontal, UserX } from "lucide-react";
import { deleteEditionRegistrationAction } from "@/actions/editions";
import { updateEditionRegistration } from "@/actions/tournaments";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction
} from "@/components/ui/alert-dialog";

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

    const [isAlertOpen, setIsAlertOpen] = React.useState(false);

    const handleDelete = () => {
        startTransition(async () => {
            try {
                await deleteEditionRegistrationAction(registrationId);
                toast.success("Participant supprimé");
                setIsAlertOpen(false);
            } catch (error) {
                toast.error("Erreur lors de la suppression");
            }
        });
    };

    return (
        <div className="flex items-center justify-end gap-2">
            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Retirer le participant</AlertDialogTitle>
                        <AlertDialogDescription>
                            Êtes-vous sûr de vouloir retirer ce participant de l'édition ?
                            Cette action supprimera également ses résultats dans les groupes et brackets.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                handleDelete();
                            }}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            disabled={isPending}
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="hidden lg:flex items-center gap-1.5">
                <Button
                    variant={checkedIn ? "secondary" : "outline"}
                    size="sm"
                    className={cn(
                        "h-8 gap-1.5",
                        checkedIn ? "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20" : ""
                    )}
                    onClick={handleToggleCheckin}
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <UserCheck className="h-3.5 w-3.5" />}
                    {checkedIn ? "Checked" : "Check-in"}
                </Button>

                <Button
                    variant={feePaid ? "secondary" : "outline"}
                    size="sm"
                    className={cn(
                        "h-8 gap-1.5",
                        feePaid ? "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20" : ""
                    )}
                    onClick={handleToggleFeePaid}
                    disabled={isPending}
                >
                    {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3.5 w-3.5" />}
                    {feePaid ? "Payé" : "Payer"}
                </Button>
            </div>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
                        {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions Participant</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleToggleCheckin}>
                        <UserCheck className="h-4 w-4 mr-2" />
                        {checkedIn ? "Annuler Check-in" : "Confirmer Check-in"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleToggleFeePaid}>
                        <CreditCard className="h-4 w-4 mr-2" />
                        {feePaid ? "Marquer impayé" : "Marquer payé"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSetStatus(status === "PARTICIPATED" ? "REGISTERED" : "PARTICIPATED")}>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {status === "PARTICIPATED" ? "Rendre Inscrit" : "Rendre Participant"}
                    </DropdownMenuItem>
                    {status !== "ELIMINATED" && (
                        <DropdownMenuItem className="text-amber-600" onClick={() => handleSetStatus("ELIMINATED")}>
                            <UserX className="h-4 w-4 mr-2" />
                            Éliminer
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        className="text-destructive"
                        onSelect={(e) => {
                            e.preventDefault();
                            setIsAlertOpen(true);
                        }}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Retirer de l'édition
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
