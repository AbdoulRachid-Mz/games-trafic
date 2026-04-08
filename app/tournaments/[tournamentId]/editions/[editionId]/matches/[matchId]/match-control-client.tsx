"use client";

import { useTransition, useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Save,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Upload,
  User as UserIcon,
  ShieldCheck,
  Send,
  Settings2,
  ImageIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  submitMatchResult,
  adminConfirmMatchResult,
} from "@/actions/tournaments";
import { useAuthContext } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";
import { deleteMatch } from "@/actions/phases";
import { AdvancedUpload } from "@/components/ui/advanced-upload";

export function MatchControlClient({
  match,
  tournamentId,
  editionId,
  autoSubmit = false,
}: {
  match: any;
  tournamentId: string;
  editionId: string;
  autoSubmit?: boolean;
}) {
  const router = useRouter();
  const { user } = useAuthContext();
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    score1: match.score1 ?? 0,
    score2: match.score2 ?? 0,
    proofUrl: match.proofUrl || "",
    disputeReason: ""
  });

  const isOrganizer = user?.id === match.edition?.tournament?.organizerId;
  const isParticipant1 = user?.id === match.participant1?.member?.userId;
  const isParticipant2 = user?.id === match.participant2?.member?.userId;
  const isParticipant = isParticipant1 || isParticipant2;

  const canSubmit = isParticipant && match.status !== "COMPLETED" && match.status !== "DISPUTED";
  const canAdmin = isOrganizer;

  useEffect(() => {
    if (autoSubmit && formRef.current && (canSubmit || canAdmin)) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.info("Prêt pour la saisie du score !");
    }
  }, [autoSubmit, canSubmit, canAdmin]);

  const handleScoreChange = (field: "score1" | "score2", value: string) => {
    const val = parseInt(value) || 0;
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const onSubmitResult = () => {
    if (!user) return;

    startTransition(async () => {
      try {
        await submitMatchResult(
          match.id,
          formData.score1,
          formData.score2,
          user.id,
          formData.proofUrl
        );
        toast.success("Résultat soumis avec succès !");
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la soumission");
      }
    });
  };

  const onConfirmMatch = () => {
    startTransition(async () => {
      try {
        await adminConfirmMatchResult(match.id, formData.score1, formData.score2);
        toast.success("Match confirmé et clôturé !");
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la confirmation");
      }
    });
  };

  const onDeleteMatch = () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce match ?")) return;

    startTransition(async () => {
      try {
        await deleteMatch(match.id);
        toast.success("Match supprimé");
        router.push(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/matches`);
      } catch (error: any) {
        toast.error("Erreur lors de la suppression");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* 🧩 1. Participants View / Form */}
      <Card 
        ref={formRef}
        className={cn(
          "border-2 transition-all",
          (canSubmit || canAdmin) ? "border-primary/20 shadow-lg" : "border-transparent bg-muted/20",
          autoSubmit && "ring-2 ring-primary ring-offset-2 animate-pulse"
        )}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {canAdmin ? (
              <Settings2 className="h-5 w-5 text-primary" />
            ) : canSubmit ? (
              <Send className="h-5 w-5 text-primary" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            )}
            {canAdmin ? "Contrôle Organisateur" : canSubmit ? "Saisie du Résultat" : "Résultats Enregistrés"}
          </CardTitle>
          <CardDescription className="text-[10px] sm:text-xs">
            {canAdmin 
              ? "En tant qu'organisateur, vous pouvez forcer le résultat final."
              : canSubmit
              ? "Entrez le score final constaté à la fin de la rencontre."
              : "Le score affiché est celui actuellement enregistré en base de données."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center justify-center py-4 px-2">
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">{match.participant1?.member?.displayName || "Participant 1"}</Label>
              <Input
                type="number"
                value={formData.score1}
                disabled={!canSubmit && !canAdmin}
                onChange={(e) => handleScoreChange("score1", e.target.value)}
                className="h-16 text-3xl font-black text-center bg-background border-2 focus:border-primary shadow-sm"
              />
            </div>
            <div className="space-y-3">
              <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest text-right block">{match.participant2?.member?.displayName || "Participant 2"}</Label>
              <Input
                type="number"
                value={formData.score2}
                disabled={!canSubmit && !canAdmin}
                onChange={(e) => handleScoreChange("score2", e.target.value)}
                className="h-16 text-3xl font-black text-center bg-background border-2 focus:border-primary shadow-sm"
              />
            </div>
          </div>

          {(canSubmit || (canAdmin && match.status !== "COMPLETED")) && (
            <div className="space-y-3 pt-2 border-t border-border/50">
              <Label className="text-xs font-bold flex items-center gap-2">
                <Upload className="h-3 w-3" /> Preuve de victoire (Image / Screenshot)
              </Label>
              <AdvancedUpload
                value={formData.proofUrl}
                onChange={(url) => setFormData(prev => ({ ...prev, proofUrl: url }))}
                disabled={!canSubmit && !canAdmin}
                maxSizeMB={2}
                maxWidthOrHeight={1920}
                uploadPath="match-proofs"
                uploadPreset="match_proofs"
                className="bg-background/50"
                previewClassName="rounded-md"
                showInternalSelection={true}
                internalImagesFolder="match-proofs"
                dropzoneOptions={{
                  accept: {
                    'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
                  },
                  maxFiles: 1
                }}
                emptyPreview={
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                    <ImageIcon className="h-8 w-8" />
                    <p className="text-xs">Glissez-déposez ou cliquez</p>
                  </div>
                }
              />
            </div>
          )}
        </CardContent>

        {canSubmit && (
          <CardFooter className="bg-primary/5 border-t border-primary/10 py-4">
            <Button
              onClick={onSubmitResult}
              disabled={isPending}
              className="w-full sm:w-auto ml-auto gap-2 text-xs h-10 px-8 shadow-lg shadow-primary/20"
            >
              {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Envoyer le résultat
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* 🧩 2. Admin Controls */}
      {canAdmin && (
        <Card className="border-amber-500/20 shadow-xl shadow-amber-500/5 bg-gradient-to-br from-card to-amber-500/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
              <Settings2 className="h-5 w-5" /> Contrôle Organisateur
            </CardTitle>
            <CardDescription className="text-xs">Actions privilégiées pour la gestion du tournoi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={onConfirmMatch}
                disabled={isPending || match.status === "COMPLETED"}
                className="flex-1 min-w-[200px] h-11 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
              >
                {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Valider officiellement le score
              </Button>

              <Button
                variant="outline"
                className="flex-1 min-w-[150px] h-11 gap-2 border-amber-500/30 text-amber-700 hover:bg-amber-50 text-xs font-bold"
              >
                <AlertTriangle className="h-4 w-4" /> Signaler un Litige
              </Button>
            </div>

            <div className="pt-4 border-t border-border/50 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Danger zone</p>
                <p className="text-[9px] text-muted-foreground/60 italic">Supprime toutes les données du match définitivement.</p>
              </div>
              <Button
                onClick={onDeleteMatch}
                disabled={isPending}
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 🧩 3. Legend / Status Info */}
      <div className="bg-muted/30 p-4 rounded-xl border border-border/40 flex items-start gap-4">
        <div className="h-10 w-10 shrink-0 bg-background rounded-full flex items-center justify-center border text-muted-foreground">
          <UserIcon className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <Typography variant="caption1" weight="bold" className="uppercase tracking-widest text-muted-foreground">Log de Session</Typography>
          <p className="text-[10px] text-muted-foreground italic leading-relaxed">
            Session active : {user?.username || "Visiteur"}.
            Actions disponibles basées sur le rôle {isOrganizer ? "Organisateur" : isParticipant ? "Joueur" : "Spectateur"}.
          </p>
        </div>
      </div>
    </div>
  );
}
