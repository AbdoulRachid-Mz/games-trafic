"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { createTournamentPhase } from "@/actions/tournaments";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Typography } from "@/components/ui/typography";

const PHASE_TYPES = [
    { value: "ELIMINATION", label: "Élimination directe" },
    { value: "ROUND_ROBIN", label: "Round Robin" },
    { value: "GROUP_STAGE", label: "Phase de poules" },
    { value: "SWISS", label: "Système suisse" },
] as const;

interface CreatePhaseDialogProps {
    editionId: string;
    tournamentId: string;
    nextOrder: number;
}

export function CreatePhaseDialog({
    editionId,
    tournamentId,
    nextOrder,
}: CreatePhaseDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const phaseType = formData.get("phaseType") as any;
        const isDoubleElimination = formData.get("isDoubleElimination") === "on";

        try {
            await createTournamentPhase({
                editionId,
                name,
                phaseType,
                order: nextOrder,
                isDoubleElimination,
            });

            toast.success("Phase créée avec succès");
            setOpen(false);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la création");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="shrink-0">
                    <Plus className="mr-2 h-4 w-4" /> Ajouter une phase
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle>Nouvelle phase</DialogTitle>
                    <DialogDescription>
                        Configurez une nouvelle étape pour votre tournoi.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom de la phase</Label>
                        <Input
                            id="name"
                            name="name"
                            defaultValue={`Phase ${nextOrder}`}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phaseType">Type de compétition</Label>
                        <select
                            id="phaseType"
                            name="phaseType"
                            defaultValue="ELIMINATION"
                            className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full"
                            required
                        >
                            {PHASE_TYPES.map((t) => (
                                <option key={t.value} value={t.value}>
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            name="isDoubleElimination"
                            id="dblElim"
                            className="h-4 w-4 rounded border"
                        />
                        <Label htmlFor="dblElim" className="font-normal">
                            Double élimination (bracket perdants)
                        </Label>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={loading}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Créer la phase
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
