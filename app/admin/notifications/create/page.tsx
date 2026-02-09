"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Bell,
    CheckCircle2,
    ChevronLeft,
    Globe,
    Loader2,
    Save,
    Store,
    Trophy,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Typography } from "@/components/ui/typography";
import { toast } from "sonner";
import { useCreateNotification } from "@/hooks/use-notifications";

type NotificationTarget = "user" | "shop" | "tournament" | "global";

export default function CreateNotificationPage() {
    const router = useRouter();
    const createNotification = useCreateNotification();

    const [target, setTarget] = useState<NotificationTarget>("user");
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        type: "SYSTEM",
        linkUrl: "",
        userId: "",
        shopId: "",
        tournamentId: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.message) {
            toast.error("Veuillez remplir les champs obligatoires");
            return;
        }

        if (target === "user" && !formData.userId) {
            toast.error("Veuillez spécifier un utilisateur");
            return;
        }

        if (target === "shop" && !formData.shopId) {
            toast.error("Veuillez spécifier un shop");
            return;
        }

        if (target === "tournament" && !formData.tournamentId) {
            toast.error("Veuillez spécifier un tournoi");
            return;
        }

        const notificationData: any = {
            title: formData.title,
            message: formData.message,
            type: formData.type,
            linkUrl: formData.linkUrl || undefined,
            userId: target === "user" ? formData.userId : target === "global" ? "system" : undefined,
        };

        if (target === "shop") notificationData.shopId = formData.shopId;
        if (target === "tournament") notificationData.tournamentId = formData.tournamentId;

        createNotification.mutate(notificationData, {
            onSuccess: (result) => {
                if (result.success) {
                    toast.success("Notification créée et envoyée avec succès");
                    router.push("/admin/notifications");
                } else {
                    toast.error(result.error || "Une erreur est survenue");
                }
            },
            onError: () => {
                toast.error("Erreur lors de la création de la notification");
            },
        });
    };

    return (
        <div className="container max-w-4xl py-6 space-y-6">
            <div className="flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.back()}
                    className="shrink-0"
                >
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <Typography variant="h2" weight="bold">
                        Nouvelle Notification
                    </Typography>
                    <Typography variant="muted">
                        Envoyez une notification ciblée à vos utilisateurs
                    </Typography>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            Détails de la Notification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Cible de la notification</Label>
                                    <Select
                                        value={target}
                                        onValueChange={(v: NotificationTarget) => setTarget(v)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="user">
                                                <div className="flex items-center gap-2">
                                                    <Users className="h-4 w-4" />
                                                    Utilisateur spécifique
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="shop">
                                                <div className="flex items-center gap-2">
                                                    <Store className="h-4 w-4" />
                                                    Shop spécifique
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="tournament">
                                                <div className="flex items-center gap-2">
                                                    <Trophy className="h-4 w-4" />
                                                    Tournoi spécifique
                                                </div>
                                            </SelectItem>
                                            <SelectItem value="global">
                                                <div className="flex items-center gap-2">
                                                    <Globe className="h-4 w-4" />
                                                    Global (Système)
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(v) => setFormData({ ...formData, type: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SYSTEM">Système</SelectItem>
                                            <SelectItem value="ORDER">Commande</SelectItem>
                                            <SelectItem value="MESSAGE">Message</SelectItem>
                                            <SelectItem value="PROMO">Promotion</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {target === "user" && (
                                <div className="space-y-2">
                                    <Label htmlFor="userId">ID de l'utilisateur <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="userId"
                                        placeholder="ex: user-123..."
                                        value={formData.userId}
                                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            {target === "shop" && (
                                <div className="space-y-2">
                                    <Label htmlFor="shopId">ID du Shop <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="shopId"
                                        placeholder="ex: shop-123..."
                                        value={formData.shopId}
                                        onChange={(e) => setFormData({ ...formData, shopId: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            {target === "tournament" && (
                                <div className="space-y-2">
                                    <Label htmlFor="tournamentId">ID du Tournoi <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="tournamentId"
                                        placeholder="ex: tournament-123..."
                                        value={formData.tournamentId}
                                        onChange={(e) => setFormData({ ...formData, tournamentId: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="title">Titre <span className="text-destructive">*</span></Label>
                                <Input
                                    id="title"
                                    placeholder="ex: Bienvenue sur Games Traffics"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
                                <Textarea
                                    id="message"
                                    placeholder="Contenu de la notification..."
                                    rows={4}
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="linkUrl">Lien optionnel</Label>
                                <Input
                                    id="linkUrl"
                                    placeholder="ex: /profile/wallet"
                                    value={formData.linkUrl}
                                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                                />
                                <p className="text-xs text-muted-foreground italic">
                                    Lien vers lequel l'utilisateur sera redirigé en cliquant sur la notification.
                                </p>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                            >
                                Annuler
                            </Button>
                            <Button type="submit" disabled={createNotification.isPending}>
                                {createNotification.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Envoi...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Envoyer la notification
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </form>
        </div>
    );
}
