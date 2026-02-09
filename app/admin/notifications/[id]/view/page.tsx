"use client";

import { useRouter, useParams } from "next/navigation";
import {
    Bell,
    ChevronLeft,
    Calendar,
    User,
    ExternalLink,
    Store,
    Trophy,
    CheckCircle2,
    AlertCircle,
    Eye,
    Trash2,
    Edit3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { useNotification, useDeleteNotification } from "@/hooks/use-notifications";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ViewNotificationPage() {
    const router = useRouter();
    const { id } = useParams() as { id: string };
    const { data: notification, isLoading, error } = useNotification(id);
    const deleteNotification = useDeleteNotification();

    const handleDelete = async () => {
        if (!notification) return;

        if (confirm("Êtes-vous sûr de vouloir supprimer cette notification ?")) {
            deleteNotification.mutate(
                { notificationId: id, userId: notification.userId! },
                {
                    onSuccess: (result: any) => {
                        if (result.success) {
                            toast.success("Notification supprimée");
                            router.push("/admin/notifications");
                        } else {
                            toast.error(result.error || "Erreur lors de la suppression");
                        }
                    },
                }
            );
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
                        <Skeleton className="h-20 w-full" />
                        <div className="grid grid-cols-2 gap-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-10 w-full" />
                        </div>
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
                            Détails de la Notification
                        </Typography>
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Bell className="h-4 w-4" />
                            <span className="text-sm">Notification ID: {id}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/admin/notifications/${id}/edit`)}
                    >
                        <Edit3 className="mr-2 h-4 w-4" />
                        Modifier
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={deleteNotification.isPending}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle>{notification.title}</CardTitle>
                                <div className="flex gap-2">
                                    <Badge variant={notification.read ? "secondary" : "default"}>
                                        {notification.read ? "Lue" : "Non lue"}
                                    </Badge>
                                    <Badge variant="outline" className="capitalize">
                                        {notification.type}
                                    </Badge>
                                </div>
                            </div>
                            <CardDescription className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Envoyée le {formatDate(notification.createdAt || new Date())}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg border">
                                <Typography variant="body-sm" className="whitespace-pre-wrap italic text-muted-foreground">
                                    "{notification.message}"
                                </Typography>
                            </div>

                            {notification.linkUrl && (
                                <div className="flex items-center gap-2 text-primary font-medium">
                                    <ExternalLink className="h-4 w-4" />
                                    Lien: <a href={notification.linkUrl} target="_blank" className="hover:underline">{notification.linkUrl}</a>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                Cible et Contexte
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Typography variant="muted" className="text-xs">UTILISATEUR</Typography>
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarImage src={notification.user?.image || undefined} />
                                        <AvatarFallback>{notification.user?.username?.substring(0, 2).toUpperCase() || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <div className="font-medium">{notification.user?.username || "Inconnu"}</div>
                                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{notification.userId}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {notification.shop && (
                                    <div className="space-y-1">
                                        <Typography variant="muted" className="text-xs uppercase">Boutique liée</Typography>
                                        <div className="flex items-center gap-2">
                                            <Store className="h-4 w-4 text-primary" />
                                            <span className="font-medium">{notification.shop.name}</span>
                                        </div>
                                    </div>
                                )}

                                {notification.tournament && (
                                    <div className="space-y-1">
                                        <Typography variant="muted" className="text-xs uppercase">Tournoi lié</Typography>
                                        <div className="flex items-center gap-2">
                                            <Trophy className="h-4 w-4 text-primary" />
                                            <span className="font-medium">{notification.tournament.name}</span>
                                        </div>
                                    </div>
                                )}

                                {!notification.shop && !notification.tournament && (
                                    <div className="flex items-center gap-2 text-muted-foreground py-2 italic text-sm">
                                        <Info className="h-4 w-4" />
                                        Aucune entité supplémentaire liée
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm">Statut Système</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Active</span>
                                <Badge variant={notification.isActive ? "default" : "destructive"}>
                                    {notification.isActive ? "Oui" : "Non"}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Visibilité</span>
                                <span className="font-medium text-success flex items-center gap-1">
                                    <Eye className="h-4 w-4" /> Publique
                                </span>
                            </div>
                            <div className="pt-4 border-t">
                                <Button variant="outline" className="w-full" onClick={() => router.push(`/admin/notifications/${id}/edit`)}>
                                    Modifier les réglages
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function Info({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4" />
            <path d="M12 8h.01" />
        </svg>
    );
}
