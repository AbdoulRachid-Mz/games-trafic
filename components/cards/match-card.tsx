"use client";

import React, { useState } from "react";
import {
    Clock,
    AlertCircle,
    CheckCircle2,
    User,
    History,
    Camera,
    Check,
    ShieldCheck
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { submitMatchResult, confirmMatchResult, adminConfirmMatchResult } from "@/actions/tournaments";
import { toast } from "sonner";

interface MatchCardProps {
    match: any; // Type from schema or relations
    currentUserId?: string;
    isAdmin?: boolean;
    onUpdate?: () => void;
}

export function MatchCard({ match, currentUserId, isAdmin, onUpdate }: MatchCardProps) {
    const [isSubmitOpen, setIsSubmitOpen] = useState(false);
    const [isAdminConfirmOpen, setIsAdminConfirmOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [score1, setScore1] = useState(match.score1?.toString() || "0");
    const [score2, setScore2] = useState(match.score2?.toString() || "0");
    const [proofUrl, setProofUrl] = useState(match.proofUrl || "");

    const p1 = match.participant1?.member?.user || match.participant1;
    const p2 = match.participant2?.member?.user || match.participant2;

    const isParticipant1 = match.participant1?.member?.userId === currentUserId;
    const isParticipant2 = match.participant2?.member?.userId === currentUserId;
    const isParticipant = isParticipant1 || isParticipant2;

    const getStatusBadge = () => {
        switch (match.status) {
            case "PENDING":
                return <Badge variant="outline" className="bg-slate-100 text-slate-700">Programmé</Badge>;
            case "IN_PROGRESS":
                return <Badge className="bg-blue-100 text-blue-700">En cours</Badge>;
            case "PENDING_REVIEW":
                return <Badge className="bg-yellow-100 text-yellow-700">En attente de confirmation</Badge>;
            case "AWAITING_ADMIN_CONFIRMATION":
                return <Badge className="bg-orange-100 text-orange-700">Vérification Admin</Badge>;
            case "COMPLETED":
                return <Badge className="bg-green-100 text-green-700"><Check className="w-3 h-3 mr-1" /> Terminé</Badge>;
            case "DISPUTED":
                return <Badge variant="destructive">Litige</Badge>;
            default:
                return <Badge variant="secondary">{match.status}</Badge>;
        }
    };

    const handleSubitResult = async () => {
        if (!currentUserId) return;
        setLoading(true);
        try {
            await submitMatchResult(match.id, parseInt(score1), parseInt(score2), currentUserId, proofUrl);
            toast.success("Résultat soumis avec succès");
            setIsSubmitOpen(false);
            onUpdate?.();
        } catch (error) {
            toast.error("Impossible de soumettre le résultat");
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmResult = async () => {
        const regId = isParticipant1 ? match.participant1RegistrationId : match.participant2RegistrationId;
        if (!regId) return;
        setLoading(true);
        try {
            await confirmMatchResult(match.id, regId);
            toast.success("Résultat confirmé");
            onUpdate?.();
        } catch (error) {
            toast.error("Impossible de confirmer le résultat");
        } finally {
            setLoading(false);
        }
    };

    const handleAdminConfirm = async () => {
        setLoading(true);
        try {
            await adminConfirmMatchResult(match.id, parseInt(score1), parseInt(score2));
            toast.success("Match validé par l'admin");
            setIsAdminConfirmOpen(false);
            onUpdate?.();
        } catch (error) {
            toast.error("Impossible de valider le match");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-all hover:shadow-md">
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {match.scheduledTime ? format(new Date(match.scheduledTime), "dd MMM, HH:mm", { locale: fr }) : "Non planifié"}
                </div>
                {getStatusBadge()}
            </div>

            <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-4">
                {/* Participant 1 */}
                <div className="flex flex-col items-center gap-2 text-center">
                    <Avatar className="h-14 w-14 border-2 border-background ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all">
                        <AvatarImage src={p1?.image || p1?.avatar} />
                        <AvatarFallback className="bg-slate-50 text-slate-400">
                            <User className="h-6 w-6" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                        <p className="max-w-[120px] truncate text-sm font-semibold text-foreground">
                            {p1?.name || p1?.username || "À déterminer"}
                        </p>
                        {match.confirmedByParticipant1 && (
                            <span className="flex items-center justify-center text-[10px] text-green-600 font-medium">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmé
                            </span>
                        )}
                    </div>
                </div>

                {/* Score / VS */}
                <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50 text-xl font-bold border-2 transition-colors",
                            match.status === 'COMPLETED' ? "border-slate-200" : "border-transparent"
                        )}>
                            {match.status === "PENDING" ? "-" : (match.score1 ?? 0)}
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">vs</span>
                        <div className={cn(
                            "flex h-12 w-12 items-center justify-center rounded-lg bg-slate-50 text-xl font-bold border-2 transition-colors",
                            match.status === 'COMPLETED' ? "border-slate-200" : "border-transparent"
                        )}>
                            {match.status === "PENDING" ? "-" : (match.score2 ?? 0)}
                        </div>
                    </div>
                    {match.status === "COMPLETED" && (
                        <div className="mt-2 text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Score Officiel
                        </div>
                    )}
                </div>

                {/* Participant 2 */}
                <div className="flex flex-col items-center gap-2 text-center">
                    <Avatar className="h-14 w-14 border-2 border-background ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all">
                        <AvatarImage src={p2?.image || p2?.avatar} />
                        <AvatarFallback className="bg-slate-50 text-slate-400">
                            <User className="h-6 w-6" />
                        </AvatarFallback>
                    </Avatar>
                    <div className="space-y-0.5">
                        <p className="max-w-[120px] truncate text-sm font-semibold text-foreground">
                            {p2?.name || p2?.username || "À déterminer"}
                        </p>
                        {match.confirmedByParticipant2 && (
                            <span className="flex items-center justify-center text-[10px] text-green-600 font-medium">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Confirmé
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
                {/* Actions for participants */}
                {isParticipant && match.status === "PENDING" && (
                    <Dialog open={isSubmitOpen} onOpenChange={setIsSubmitOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="w-full sm:w-auto bg-primary text-primary-foreground font-semibold">
                                Soumettre le score
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Soumettre le résultat</DialogTitle>
                                <DialogDescription>
                                    Entrez le score final et ajoutez une capture d'écran comme preuve.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>{p1?.name || "Joueur 1"}</Label>
                                        <Input type="number" value={score1} onChange={(e) => setScore1(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>{p2?.name || "Joueur 2"}</Label>
                                        <Input type="number" value={score2} onChange={(e) => setScore2(e.target.value)} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Preuve (Capture d'écran)</Label>
                                    <AdvancedUpload
                                        value={proofUrl || ""}
                                        onChange={(url) => setProofUrl(url)}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsSubmitOpen(false)}>Annuler</Button>
                                <Button onClick={handleSubitResult} disabled={loading}>{loading ? "Envoi..." : "Soumettre"}</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {isParticipant && match.status === "PENDING_REVIEW" && (
                    ((isParticipant1 && !match.confirmedByParticipant1) ||
                        (isParticipant2 && !match.confirmedByParticipant2)) && (
                        <Button size="sm" variant="default" className="w-full sm:w-auto bg-green-600 hover:bg-green-700" onClick={handleConfirmResult} disabled={loading}>
                            <Check className="mr-2 h-4 w-4" /> Confirmer le résultat
                        </Button>
                    )
                )}

                {/* Actions for admins */}
                {isAdmin && (
                    <Dialog open={isAdminConfirmOpen} onOpenChange={setIsAdminConfirmOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="w-full sm:w-auto border-primary text-primary hover:bg-primary/5">
                                {match.status === "COMPLETED" ? "Modifier le score (Admin)" : "Valider le match (Admin)"}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Validation Administrateur</DialogTitle>
                                <DialogDescription>
                                    Vérifiez le score et les preuves avant de valider. Cela mettra à jour le classement.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-6 py-4">
                                <div className="grid grid-cols-2 gap-4 text-center">
                                    <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">{p1?.name || "Joueur 1"}</p>
                                        <Input type="number" className="text-center font-bold text-lg" value={score1} onChange={(e) => setScore1(e.target.value)} />
                                    </div>
                                    <div className="space-y-2 p-3 bg-slate-50 rounded-lg">
                                        <p className="text-xs font-medium text-muted-foreground uppercase">{p2?.name || "Joueur 2"}</p>
                                        <Input type="number" className="text-center font-bold text-lg" value={score2} onChange={(e) => setScore2(e.target.value)} />
                                    </div>
                                </div>

                                {match.proofUrl && (
                                    <div className="space-y-2">
                                        <Label>Capture d'écran fournie :</Label>
                                        <div className="relative aspect-video overflow-hidden rounded-lg border">
                                            <img src={match.proofUrl} alt="Match proof" className="object-cover w-full h-full" />
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-lg bg-orange-50 p-3 text-xs text-orange-800 flex gap-2">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    Cette action est définitive et affectera immédiatement le classement du groupe.
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                <Button variant="outline" onClick={() => setIsAdminConfirmOpen(false)}>Fermer</Button>
                                <Button variant="default" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAdminConfirm} disabled={loading}>
                                    <ShieldCheck className="mr-2 h-4 w-4" /> Valider Officiellement
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                <Button size="sm" variant="ghost" className="hidden sm:flex ml-auto text-muted-foreground hover:text-foreground">
                    <History className="mr-2 h-4 w-4" /> Historique
                </Button>
            </div>

            {match.proofUrl && match.status !== "COMPLETED" && (
                <div className="absolute top-2 right-2 p-1 bg-primary/10 rounded-full" title="Preuve disponible">
                    <Camera className="w-3 h-3 text-primary" />
                </div>
            )}
        </div>
    );
}
