"use client";

import { useRouter, useParams } from "next/navigation";
import {
    Megaphone,
    ChevronLeft,
    Calendar,
    User,
    Image as ImageIcon,
    Video,
    Pin,
    CheckCircle2,
    AlertCircle,
    Eye,
    Trash2,
    Edit3,
    Clock,
    Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { useAnnouncement, useDeleteAnnouncement } from "@/hooks/use-announcements";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ViewAnnouncementPage() {
    const router = useRouter();
    const { id } = useParams() as { id: string };
    const { data: announcement, isLoading, error } = useAnnouncement(id, { populate: ['author'] });
    const deleteAnnouncement = useDeleteAnnouncement();

    const handleDelete = async () => {
        if (!announcement) return;

        if (confirm("Êtes-vous sûr de vouloir supprimer cette annonce ? (Soft delete)")) {
            deleteAnnouncement.mutate(id, {
                onSuccess: () => {
                    toast.success("Annonce supprimée");
                    router.push("/admin/announcements");
                },
                onError: (err: any) => {
                    toast.error(err.message || "Erreur lors de la suppression");
                },
            });
        }
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
                        <Skeleton className="h-40 w-full" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                            Détails de l'Annonce
                        </Typography>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Megaphone className="h-4 w-4" />
                            <span className="text-sm">Announcement ID: {id}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/announcements/${id}/edit`)}
                    >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Modifier
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleteAnnouncement.isPending}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card className={announcement.isPinned ? "border-primary/50 bg-primary/5" : ""}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        {announcement.isPinned && <Pin className="h-4 w-4 text-primary fill-primary" />}
                                        <CardTitle className="text-2xl">{announcement.title}</CardTitle>
                                    </div>
                                    <CardDescription className="flex items-center gap-4">
                                        <span className="flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />
                                            {formatDate(announcement.createdAt || new Date())}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Filter className="h-3.5 w-3.5" />
                                            {announcement.type}
                                        </span>
                                    </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant={announcement.isActive ? "default" : "secondary"}>
                                        {announcement.isActive ? "Active" : "Brouillon"}
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <Typography variant="body-sm" className="whitespace-pre-wrap leading-relaxed">
                                    {announcement.content}
                                </Typography>
                            </div>

                            {announcement.video && (
                                <div className="space-y-2">
                                    <Typography variant="body-base" weight="semibold" className="flex items-center gap-2">
                                        <Video className="h-4 w-4" /> Vidéo attachée
                                    </Typography>
                                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center border overflow-hidden">
                                        <a href={announcement.video} target="_blank" className="flex flex-col items-center gap-2 text-primary hover:underline">
                                            <Video className="h-8 w-8" />
                                            Voir la vidéo
                                        </a>
                                    </div>
                                </div>
                            )}

                            {announcement.images && announcement.images.length > 0 && (
                                <div className="space-y-4">
                                    <Typography variant="body-base" weight="semibold" className="flex items-center gap-2">
                                        <ImageIcon className="h-4 w-4" /> Galérie d'images
                                    </Typography>
                                    <div className="grid grid-cols-2 gap-4">
                                        {announcement.images.map((img, idx) => (
                                            <div key={idx} className="aspect-square bg-muted rounded-lg border overflow-hidden group relative">
                                                <img src={img} alt={`Preview ${idx}`} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Button variant="secondary" size="sm" asChild>
                                                        <a href={img} target="_blank">Agrandir</a>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Auteur de l'annonce</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12">
                                    <AvatarImage src={(announcement as any).author?.image || undefined} />
                                    <AvatarFallback>{(announcement as any).author?.username?.substring(0, 2).toUpperCase() || "A"}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="font-semibold text-lg">{(announcement as any).author?.username || "Administrateur"}</div>
                                    <div className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full inline-block mt-1">
                                        System Auth
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t space-y-3">
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">ID Auteur:</span>
                                    <span className="font-mono text-[10px]">{announcement.authorId}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">Rôle Auteur:</span>
                                    <Badge variant="outline" className="h-5 text-[10px]">Admin</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Paramètres d'affichage</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                    <span>Visibilité</span>
                                </div>
                                <Badge variant={announcement.isActive ? "default" : "secondary"}>
                                    {announcement.isActive ? "Publique" : "Privée"}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Pin className="h-4 w-4 text-muted-foreground" />
                                    <span>Épinglée</span>
                                </div>
                                <Badge variant={announcement.isPinned ? "default" : "outline"}>
                                    {announcement.isPinned ? "Oui" : "Non"}
                                </Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                                    <span>État</span>
                                </div>
                                <span className="text-success font-medium">Validée</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
