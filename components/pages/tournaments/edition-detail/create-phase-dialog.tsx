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
    const [phaseType, setPhaseType] = useState<string>("ELIMINATION");
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;
        const type = formData.get("phaseType") as any;
        const isDoubleElimination = formData.get("isDoubleElimination") === "on";

        // Advanced data
        const groupsCount = parseInt(formData.get("groupsCount") as string) || 1;
        const pointsPerWin = parseInt(formData.get("pointsPerWin") as string) || 3;
        const pointsPerDraw = parseInt(formData.get("pointsPerDraw") as string) || 1;
        const pointsPerLoss = parseInt(formData.get("pointsPerLoss") as string) || 0;
        const seedingMethod = formData.get("seedingMethod") as string || "RANDOM";
        const advanceFromGroup = parseInt(formData.get("advanceFromGroup") as string) || 2;
        const matchesPerParticipant = parseInt(formData.get("matchesPerParticipant") as string) || 1;

        try {
            await createTournamentPhase({
                editionId,
                name,
                phaseType: type,
                order: nextOrder,
                isDoubleElimination,
                config: {
                    groupsCount,
                    pointsPerWin,
                    pointsPerDraw,
                    pointsPerLoss,
                    seedingMethod,
                    advanceFromGroup,
                    matchesPerParticipant,
                } as any
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
            <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nouvelle phase</DialogTitle>
                    <DialogDescription>
                        Configurez une nouvelle étape pour votre tournoi.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                value={phaseType}
                                onChange={(e) => setPhaseType(e.target.value)}
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
                    </div>

                    <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                        <Typography variant="body-sm" weight="semibold">Configuration avancée</Typography>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="seedingMethod">Méthode de Seeding</Label>
                                <select
                                    name="seedingMethod"
                                    id="seedingMethod"
                                    className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full"
                                >
                                    <option value="RANDOM">Aléatoire (Random)</option>
                                    <option value="RANKING">Classement (Ranking)</option>
                                    <option value="MANUAL">Manuel</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="matchesPerParticipant">Matches par participant</Label>
                                <Input type="number" id="matchesPerParticipant" name="matchesPerParticipant" defaultValue={1} />
                            </div>
                        </div>

                        {(phaseType === "ROUND_ROBIN" || phaseType === "GROUP_STAGE") && (
                            <div className="grid grid-cols-3 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="pointsPerWin">Pts Victoire</Label>
                                    <Input type="number" id="pointsPerWin" name="pointsPerWin" defaultValue={3} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pointsPerDraw">Pts Nul</Label>
                                    <Input type="number" id="pointsPerDraw" name="pointsPerDraw" defaultValue={1} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pointsPerLoss">Pts Défaite</Label>
                                    <Input type="number" id="pointsPerLoss" name="pointsPerLoss" defaultValue={0} />
                                </div>
                            </div>
                        )}

                        {phaseType === "GROUP_STAGE" && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="groupsCount">Nombre de groupes</Label>
                                    <Input type="number" id="groupsCount" name="groupsCount" defaultValue={4} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="advanceFromGroup">Qualifiés par groupe</Label>
                                    <Input type="number" id="advanceFromGroup" name="advanceFromGroup" defaultValue={2} />
                                </div>
                            </div>
                        )}

                        {phaseType === "ELIMINATION" && (
                            <div className="flex items-center gap-2 pt-2">
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
                        )}
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
