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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2 } from "lucide-react";
import { addEditionParticipantAction } from "@/actions/editions";
import { toast } from "sonner";

interface AddParticipantDialogProps {
    editionId: string;
    tournamentId: string;
}

export function AddParticipantDialog({
    editionId,
    tournamentId,
}: AddParticipantDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        const displayName = formData.get("displayName") as string;
        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;

        try {
            const result = await addEditionParticipantAction({
                editionId,
                tournamentId,
                displayName,
                email,
                phone,
            });

            if (result.success) {
                toast.success("Participant ajouté avec succès");
                setOpen(false);
            }
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'ajout du participant");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    <span>Ajouter un participant</span>
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajouter un participant</DialogTitle>
                    <DialogDescription>
                        Ajoutez manuellement un participant à cette édition. Un compte membre sera créé s'il n'existe pas.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="displayName">Nom d'affichage *</Label>
                        <Input
                            id="displayName"
                            name="displayName"
                            placeholder="Ex: John Doe"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email (optionnel)</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="john@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Téléphone (optionnel)</Label>
                        <Input
                            id="phone"
                            name="phone"
                            placeholder="+229 ..."
                        />
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
                            Ajouter
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
