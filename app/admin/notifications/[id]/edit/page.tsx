"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Bell,
    ChevronLeft,
    Loader2,
    Save,
    AlertCircle,
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useNotification, useUpdateNotification } from "@/hooks/use-notifications";

export default function EditNotificationPage() {
    const router = useRouter();
    const { id } = useParams() as { id: string };
    const { data: notification, isLoading, error } = useNotification(id);
    const updateNotification = useUpdateNotification();

    const [formData, setFormData] = useState({
        title: "",
        message: "",
        type: "SYSTEM",
        linkUrl: "",
        read: false,
        isActive: true,
    });

    useEffect(() => {
        if (notification) {
            setFormData({
                title: notification.title,
                message: notification.message,
                type: notification.type,
                linkUrl: notification.linkUrl || "",
                read: notification.read || false,
                isActive: notification.isActive || false,
            });
        }
    }, [notification]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.message) {
            toast.error("Veuillez remplir les champs obligatoires");
            return;
        }

        updateNotification.mutate(
            { id, data: formData },
            {
                onSuccess: (result) => {
                    if (result.success) {
                        toast.success("Notification mise à jour avec succès");
                        router.push("/admin/notifications");
                    } else {
                        toast.error(result.error || "Une erreur est survenue");
                    }
                },
                onError: () => {
                    toast.error("Erreur lors de la mise à jour");
                },
            }
        );
    };

    if (isLoading) {
        return (
            <div className="container max-w-4xl py-6 space-y-6">
                <Skeleton className="h-12 w-48" />
                <Card>
                    <CardHeader>
                        <Skeleton className="h-8 w-64" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !notification) {
        return (
            <div className="container max-w-4xl py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <Typography variant="h3">Notification non trouvée</Typography>
                <Button onClick={() => router.back()} variant="outline" className="mt-4">
                    Retour
                </Button>
            </div>
        );
    }

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
                        Modifier la Notification
                    </Typography>
                    <Typography variant="muted">
                        ID: {id}
                    </Typography>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5 text-primary" />
                            Contenu de la Notification
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                                <div className="space-y-2">
                                    <Label>Statut</Label>
                                    <Select
                                        value={formData.isActive ? "active" : "inactive"}
                                        onValueChange={(v) => setFormData({ ...formData, isActive: v === "active" })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">Titre <span className="text-destructive">*</span></Label>
                                <Input
                                    id="title"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message <span className="text-destructive">*</span></Label>
                                <Textarea
                                    id="message"
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
                                    value={formData.linkUrl}
                                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="read"
                                    checked={formData.read}
                                    onChange={(e) => setFormData({ ...formData, read: e.target.checked })}
                                    className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="read" className="cursor-pointer">Marquer comme lue</Label>
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
                            <Button type="submit" disabled={updateNotification.isPending}>
                                {updateNotification.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Enregistrement...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Enregistrer les modifications
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
