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
    existingPhases?: any[];
}

export function CreatePhaseDialog({
    editionId,
    tournamentId,
    nextOrder,
    existingPhases = [],
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
        const participantSource = formData.get("participantSource") as string;

        // Advanced data — champs explicitement remplis uniquement :
        // ils écrasent les défauts ; laissés vides, ils restent héritants.
        const explicitNumber = (key: string): number | undefined => {
            const raw = formData.get(key);
            if (typeof raw !== "string" || raw.trim() === "" || isNaN(Number(raw))) return undefined;
            const n = Number(raw);
            return n > 0 ? n : undefined;
        };
        const groupsCount = explicitNumber("groupsCount");
        const pointsPerWin = explicitNumber("pointsPerWin");
        const pointsPerDraw = explicitNumber("pointsPerDraw");
        const pointsPerLoss = explicitNumber("pointsPerLoss");
        const seedingMethod = formData.get("seedingMethod") as string || "RANDOM";
        const advanceFromGroup = explicitNumber("advanceFromGroup");
        const advanceCount = explicitNumber("advanceCount");
        const matchesPerParticipant = explicitNumber("matchesPerParticipant") ?? 1;

        try {
            await createTournamentPhase({
                editionId,
                name,
                phaseType: type,
                order: nextOrder,
                isDoubleElimination,
                config: {
                    participantSource,
                    seedingMethod,
                    matchesPerParticipant,
                    // GROUP_STAGE (poules classiques) : top-N PAR groupe.
                    // ROUND_ROBIN (groupes = journées) : top-N de la PHASE
                    // (un classement général, jamais par journée).
                    ...(phaseType === "GROUP_STAGE" && {
                        groupsCount,
                        advanceFromGroup,
                    }),
                    ...(phaseType !== "GROUP_STAGE" && { advanceCount }),
                    ...(pointsPerWin !== undefined && { pointsPerWin }),
                    ...(pointsPerDraw !== undefined && { pointsPerDraw }),
                    ...(pointsPerLoss !== undefined && { pointsPerLoss }),
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
                                defaultValue={`Phase ${nextOrder + 1}`}
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

                    <div className="space-y-2">
                        <Label htmlFor="participantSource">Source des participants</Label>
                        <select
                            id="participantSource"
                            name="participantSource"
                            className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full"
                            required
                        >
                            <option value="EDITION">Inscriptions Directes de l'Édition</option>
                            {existingPhases.map((p) => (
                                <option key={p.id} value={`PHASE_${p.id}`}>
                                    Qualifiés de la phase : {p.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-[10px] text-muted-foreground italic">
                            Définit d'où proviennent les joueurs/équipes pour cette étape.
                        </p>
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
                                    <Input type="number" id="pointsPerWin" name="pointsPerWin" placeholder="3" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pointsPerDraw">Pts Nul</Label>
                                    <Input type="number" id="pointsPerDraw" name="pointsPerDraw" placeholder="1" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="pointsPerLoss">Pts Défaite</Label>
                                    <Input type="number" id="pointsPerLoss" name="pointsPerLoss" placeholder="0" />
                                </div>
                            </div>
                        )}

                        {phaseType === "ROUND_ROBIN" && (
                            <div className="space-y-2">
                                <Label htmlFor="advanceCount">Qualifiés de la phase (top N)</Label>
                                <Input type="number" id="advanceCount" name="advanceCount" min={1} placeholder="2" />
                                <p className="text-[10px] text-muted-foreground italic">
                                    Championnat à un classement général : le top N du
                                    classement de la phase se qualifie à la validation
                                    de la phase (jamais par journée).
                                </p>
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
