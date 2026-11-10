"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import { createPhaseGroup, bulkCreatePhaseGroupParticipants, getPhaseQualifiedParticipantsAction } from "@/actions/phases";
import { resolveScoring } from "@/lib/tournaments/scoring";
import { getEffectiveAdvanceCount } from "@/lib/tournaments/config";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";

interface CreateGroupDialogProps {
    phaseId: string;
    nextOrder: number;
    previousPhases?: { id: string; name: string }[];
    asFormOnly?: boolean;
    /** Phase parente : sert uniquement au préremplissage (héritage). */
    phase?: { config?: unknown } | null;
}

export function CreateGroupDialog({
    phaseId,
    nextOrder,
    previousPhases = [],
    asFormOnly = false,
    phase,
}: CreateGroupDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [selectedPhases, setSelectedPhases] = useState<string[]>([]);
    const router = useRouter();

    // Scoring et qualifiés préremplis depuis la phase (héritage éditable :
    // champ vide = hérite, champ rempli = écrase explicitement).
    const effectiveScoring = resolveScoring((phase?.config as any) || null);
    const effectiveAdvanceCount = getEffectiveAdvanceCount(phase);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const name = formData.get("name") as string;

        // Advanced data — un champ laissé vide écrit RIEN dans config :
        // le groupe hérite alors de la phase (jamais de valeur par défaut
        // toute faite qui bloquerait l'héritage).
        const explicitNumber = (key: string): number | undefined => {
            const raw = formData.get(key);
            if (typeof raw !== "string" || raw.trim() === "" || isNaN(Number(raw))) {
                return undefined;
            }
            return Number(raw);
        };
        const seeding = formData.get("seeding") as string || "RANDOM";
        const advanceCount = explicitNumber("advanceCount");
        const pointsPerWin = explicitNumber("pointsPerWin");
        const pointsPerDraw = explicitNumber("pointsPerDraw");
        const pointsPerLoss = explicitNumber("pointsPerLoss");
        const matchesPerParticipant = explicitNumber("matchesPerParticipant") ?? 1;

        try {
            const newGroup = await createPhaseGroup({
                phaseId,
                name,
                order: nextOrder,
                config: {
                    seeding,
                    matchesPerParticipant,
                    ...(advanceCount !== undefined && { advanceCount }),
                    ...(pointsPerWin !== undefined && { pointsPerWin }),
                    ...(pointsPerDraw !== undefined && { pointsPerDraw }),
                    ...(pointsPerLoss !== undefined && { pointsPerLoss }),
                } as any
            } as any);

            // Auto-add participants if selected
            if (selectedPhases.length > 0 && newGroup?.id) {
                const qualifiedRegIds = new Set<string>();

                await Promise.all(selectedPhases.map(async (pId) => {
                    // Qualifiés officiels : phase.config.qualifiers d'abord
                    // (phases « groupes = journées »), lignes de groupe en repli.
                    const res = await getPhaseQualifiedParticipantsAction(pId);
                    res.registrationIds.forEach((regId) => qualifiedRegIds.add(regId));
                }));

                if (qualifiedRegIds.size > 0) {
                    await bulkCreatePhaseGroupParticipants(
                        Array.from(qualifiedRegIds).map(regId => ({
                            groupId: newGroup.id,
                            registrationId: regId,
                        } as any))
                    );
                }
            }

            toast.success("Groupe créé avec succès");
            setOpen(false);
            setSelectedPhases([]);
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la création");
        } finally {
            setLoading(false);
        }
    };

    const formContent = (
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nom du groupe</Label>
                <Input
                    id="name"
                    name="name"
                    placeholder="Nom du groupe"
                    defaultValue={`Groupe ${nextOrder}`}
                    required
                />
            </div>

            <div className="border rounded-lg p-4 bg-muted/30 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="seeding">Seeding</Label>
                        <select
                            name="seeding"
                            id="seeding"
                            className="h-9 px-3 py-1 rounded-md border bg-background text-sm w-full"
                        >
                            <option value="RANDOM">Aléatoire</option>
                            <option value="RANKING">Classement</option>
                            <option value="MANUAL">Manuel</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="advanceCount">Qualifiés (vide = hérite)</Label>
                        <Input type="number" id="advanceCount" name="advanceCount" placeholder={`${effectiveAdvanceCount}`} />
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-2">
                        <Label htmlFor="pointsPerWin">Pts Victoire</Label>
                        <Input type="number" id="pointsPerWin" name="pointsPerWin" placeholder={`${effectiveScoring.pointsPerWin}`} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pointsPerDraw">Pts Nul</Label>
                        <Input type="number" id="pointsPerDraw" name="pointsPerDraw" placeholder={`${effectiveScoring.pointsPerDraw}`} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pointsPerLoss">Pts Défaite</Label>
                        <Input type="number" id="pointsPerLoss" name="pointsPerLoss" placeholder={`${effectiveScoring.pointsPerLoss}`} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="matchesPerParticipant">Matches par participant</Label>
                    <Input type="number" id="matchesPerParticipant" name="matchesPerParticipant" placeholder="1" />
                </div>
            </div>

            {previousPhases.length > 0 && (
                <div className="space-y-3 p-4 border rounded-lg bg-primary/5">
                    <Label className="text-xs font-bold uppercase tracking-widest text-primary">Auto-seeding (Qualifiés)</Label>
                    <div className="grid grid-cols-1 gap-2">
                        {previousPhases.map((phase) => (
                            <div key={phase.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`phase-${phase.id}`} 
                                    checked={selectedPhases.includes(phase.id)}
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            setSelectedPhases(prev => [...prev, phase.id]);
                                        } else {
                                            setSelectedPhases(prev => prev.filter(id => id !== phase.id));
                                        }
                                    }}
                                />
                                <label
                                    htmlFor={`phase-${phase.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    Ajouter les qualifiés de: {phase.name}
                                </label>
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground italic">
                        Les participants qualifiés de ces phases seront automatiquement ajoutés à ce groupe.
                    </p>
                </div>
            )}

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
                    Créer
                </Button>
            </DialogFooter>
        </form>
    );

    if (asFormOnly) return formContent;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Plus className="h-4 w-4 mr-1.5" /> Ajouter un groupe
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nouveau groupe</DialogTitle>
                </DialogHeader>
                {formContent}
            </DialogContent>
        </Dialog>
    );
}
