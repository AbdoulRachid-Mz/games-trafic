"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
    Megaphone,
    ChevronLeft,
    Loader2,
    Save,
    Image as ImageIcon,
    CheckCircle2,
    Type,
    FileText,
    Video,
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
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAnnouncement, useUpdateAnnouncement } from "@/hooks/use-announcements";

export default function EditAnnouncementPage() {
    const router = useRouter();
    const { id } = useParams() as { id: string };
    const { data: announcement, isLoading, error } = useAnnouncement(id);
    const updateAnnouncement = useUpdateAnnouncement();

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        type: "GENERAL",
        images: [] as string[],
        video: "",
        isActive: true,
        isPinned: false,
    });

    useEffect(() => {
        if (announcement) {
            setFormData({
                title: announcement.title,
                content: announcement.content,
                type: announcement.type || "GENERAL",
                images: announcement.images || [],
                video: announcement.video || "",
                isActive: announcement.isActive || false,
                isPinned: announcement.isPinned || false,
            });
        }
    }, [announcement]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.content) {
            toast.error("Veuillez remplir les champs obligatoires");
            return;
        }

        updateAnnouncement.mutate(
            { id, data: formData as any },
            {
                onSuccess: () => {
                    toast.success("Annonce mise à jour avec succès");
                    router.push("/admin/announcements");
                },
                onError: (error: any) => {
                    toast.error(error.message || "Erreur lors de la mise à jour");
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
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error || !announcement) {
        return (
            <div className="container max-w-4xl py-12 text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <Typography variant="h3">Annonce non trouvée</Typography>
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
                        Modifier l'Annonce
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
                            <Megaphone className="h-5 w-5 text-primary" />
                            Détails de l'Annonce
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type d'annonce</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(v) => setFormData({ ...formData, type: v })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GENERAL">Général</SelectItem>
                                            <SelectItem value="UPDATE">Mise à jour</SelectItem>
                                            <SelectItem value="PROMO">Promotion</SelectItem>
                                            <SelectItem value="EVENT">Événement</SelectItem>
                                            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <Label>Épingler l'annonce</Label>
                                        <p className="text-xs text-muted-foreground italic">
                                            L'annonce apparaîtra en haut de la liste
                                        </p>
                                    </div>
                                    <Switch
                                        checked={formData.isPinned}
                                        onCheckedChange={(v) => setFormData({ ...formData, isPinned: v })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="title">Titre <span className="text-destructive">*</span></Label>
                                <div className="relative">
                                    <Type className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="title"
                                        className="pl-9"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="content">Contenu <span className="text-destructive">*</span></Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Textarea
                                        id="content"
                                        className="pl-9 min-h-[150px]"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="video">URL de la vidéo</Label>
                                    <div className="relative">
                                        <Video className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="video"
                                            className="pl-9"
                                            value={formData.video}
                                            onChange={(e) => setFormData({ ...formData, video: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Visibilité</Label>
                                    <Select
                                        value={formData.isActive ? "active" : "inactive"}
                                        onValueChange={(v) => setFormData({ ...formData, isActive: v === "active" })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Publique</SelectItem>
                                            <SelectItem value="inactive">Brouillon / Cachée</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Images (URL, une par ligne)</Label>
                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Textarea
                                        className="pl-9"
                                        value={formData.images.join("\n")}
                                        onChange={(e) => setFormData({ ...formData, images: e.target.value.split("\n").filter(i => i.trim() !== "") })}
                                    />
                                </div>
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
                            <Button type="submit" disabled={updateAnnouncement.isPending}>
                                {updateAnnouncement.isPending ? (
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
