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
import { Plus, Loader2, UserPlus, Mail, Phone } from "lucide-react";
import { addEditionParticipantAction } from "@/actions/editions";
import { toast } from "sonner";
import { Field, FieldContent, FieldLabel, FieldGroup } from "@/components/ui/field";
import { useRouter } from "next/navigation";

interface AddParticipantDialogProps {
    editionId: string;
    tournamentId: string;
}

export function AddParticipantForm({
    editionId,
    tournamentId,
}: AddParticipantDialogProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

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
                router.back();
            }
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'ajout du participant");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <FieldGroup className="gap-5">
                <Field>
                    <FieldLabel htmlFor="displayName">Nom d'affichage *</FieldLabel>
                    <FieldContent>
                        <div className="relative">
                            <Input
                                id="displayName"
                                name="displayName"
                                placeholder="Ex: John Doe"
                                required
                                className="pl-9 h-11"
                            />
                            <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="email">Email (optionnel)</FieldLabel>
                    <FieldContent>
                        <div className="relative">
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="john@example.com"
                                className="pl-9 h-11"
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                    </FieldContent>
                </Field>

                <Field>
                    <FieldLabel htmlFor="phone">Téléphone (optionnel)</FieldLabel>
                    <FieldContent>
                        <div className="relative">
                            <Input
                                id="phone"
                                name="phone"
                                placeholder="+229 ..."
                                className="pl-9 h-11"
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                    </FieldContent>
                </Field>
            </FieldGroup>

            <div className="flex gap-2 sm:gap-0 justify-end pt-4 border-t">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={() => router.back()}
                    disabled={loading}
                    className="flex-1 sm:flex-none mr-2"
                >
                    Annuler
                </Button>
                <Button type="submit" disabled={loading} className="flex-1 sm:flex-none px-8 font-bold">
                    {loading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Plus className="mr-2 h-4 w-4" />
                    )}
                    Ajouter
                </Button>
            </div>
        </form>
    );
}
