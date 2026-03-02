"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Key, Trash2, Edit2, Plus, Smartphone } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasskeyManagement() {
    const [passkeys, setPasskeys] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [addingPasskey, setAddingPasskey] = useState(false);
    const [passkeyName, setPasskeyName] = useState("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState("");

    const loadPasskeys = async () => {
        setLoading(true);
        const { data, error } = await authClient.passkey.listUserPasskeys();
        if (error) {
            toast.error("Erreur lors du chargement des passkeys");
        } else {
            setPasskeys(data || []);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadPasskeys();
    }, []);

    const handleAddPasskey = async () => {
        setAddingPasskey(true);
        const { data, error } = await authClient.passkey.addPasskey({
            name: passkeyName || undefined,
            authenticatorAttachment: "platform",
        });

        if (error) {
            toast.error("Échec de l'ajout de la passkey : " + error.message);
        } else {
            toast.success("Passkey ajoutée avec succès");
            setPasskeyName("");
            await loadPasskeys();
        }
        setAddingPasskey(false);
    };

    const handleDeletePasskey = async (id: string) => {
        const { error } = await authClient.passkey.deletePasskey({ id });

        if (error) {
            toast.error("Échec de la suppression");
        } else {
            toast.success("Passkey supprimée");
            await loadPasskeys();
        }
    };

    const handleUpdatePasskey = async (id: string) => {
        const { error } = await authClient.passkey.updatePasskey({
            id,
            name: newName,
        });

        if (error) {
            toast.error("Échec de la mise à jour");
        } else {
            toast.success("Passkey mise à jour");
            setEditingId(null);
            setNewName("");
            await loadPasskeys();
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Key className="h-5 w-5" />
                            Passkeys
                        </CardTitle>
                        <CardDescription>
                            Gérez vos méthodes d'authentification biométrique
                        </CardDescription>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Ajouter
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Ajouter une nouvelle Passkey</DialogTitle>
                                <DialogDescription>
                                    Utilisez votre empreinte digitale, Face ID ou un code PIN pour une connexion rapide et sécurisée
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="passkey-name">Nom de la Passkey (optionnel)</Label>
                                    <Input
                                        id="passkey-name"
                                        placeholder="Ex: Mon iPhone, Mon ordinateur..."
                                        value={passkeyName}
                                        onChange={(e) => setPasskeyName(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleAddPasskey} disabled={addingPasskey} className="w-full">
                                    {addingPasskey ? "Ajout en cours..." : "Ajouter la Passkey"}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p className="text-muted-foreground text-sm">Chargement...</p>
                ) : passkeys.length === 0 ? (
                    <div className="text-center py-8 space-y-3">
                        <Smartphone className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">
                            Aucune passkey configurée. Ajoutez-en une pour une connexion plus rapide.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {passkeys.map((passkey) => (
                            <div key={passkey.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex-1">
                                    {editingId === passkey.id ? (
                                        <div className="flex gap-2">
                                            <Input
                                                value={newName}
                                                onChange={(e) => setNewName(e.target.value)}
                                                placeholder="Nouveau nom"
                                            />
                                            <Button size="sm" onClick={() => handleUpdatePasskey(passkey.id)}>
                                                Sauvegarder
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setEditingId(null);
                                                    setNewName("");
                                                }}
                                            >
                                                Annuler
                                            </Button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="font-medium">{passkey.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Ajoutée le {new Date(passkey.createdAt).toLocaleDateString()}
                                            </p>
                                            <Badge variant="secondary" className="mt-1">
                                                {passkey.deviceType}
                                            </Badge>
                                        </>
                                    )}
                                </div>
                                {editingId !== passkey.id && (
                                    <div className="flex gap-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => {
                                                setEditingId(passkey.id);
                                                setNewName(passkey.name);
                                            }}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            onClick={() => handleDeletePasskey(passkey.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}