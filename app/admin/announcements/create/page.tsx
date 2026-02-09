"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";
import { useCreateAnnouncement } from "@/hooks/use-announcements";
import { useAuth } from "@/hooks/use-auth";

export default function CreateAnnouncementPage() {
    const router = useRouter();
    const { user } = useAuth();
    const createAnnouncement = useCreateAnnouncement();

    const [formData, setFormData] = useState({
        title: "",
        content: "",
        type: "GENERAL",
        images: [] as string[],
        video: "",
        isActive: true,
        isPinned: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error("Vous devez être connecté pour créer une annonce");
            return;
        }

        if (!formData.title || !formData.content) {
            toast.error("Veuillez remplir les champs obligatoires");
            return;
        }

        createAnnouncement.mutate(
            {
                ...formData,
                authorId: user.id,
            } as any,
            {
                onSuccess: () => {
                    toast.success("Annonce créée avec succès");
                    router.push("/admin/announcements");
                },
                onError: (error: any) => {
                    toast.error(error.message || "Erreur lors de la création de l'annonce");
                },
            }
        );
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
                        Nouvelle Annonce
                    </Typography>
                    <Typography variant="muted">
                        Créez une annonce pour tous les utilisateurs de la plateforme
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
                                        placeholder="ex: Bienvenue sur GT-v3 !"
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
                                        placeholder="Détails de votre annonce..."
                                        className="pl-9 min-h-[150px]"
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="video">URL de la vidéo (optionnelle)</Label>
                                    <div className="relative">
                                        <Video className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="video"
                                            placeholder="Lien YouTube, Vimeo..."
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
                                        placeholder="https://example.com/image1.jpg"
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
                            <Button type="submit" disabled={createAnnouncement.isPending || !user}>
                                {createAnnouncement.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Publication...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4" />
                                        Publier l'annonce
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
