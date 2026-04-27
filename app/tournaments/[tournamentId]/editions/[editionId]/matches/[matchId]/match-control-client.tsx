// app/tournaments/[tournamentId]/editions/[editionId]/matches/match-control-client.tsx
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
  ImageIcon,
  ShieldAlert,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  Minus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  submitMatchResult,
  adminConfirmMatchResult,
  updateMatchResult,
} from "@/actions/tournaments";
import { useAuthContext } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { Typography } from "@/components/ui/typography";
import { deleteMatch } from "@/actions/phases";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { Badge } from "@/components/ui/badge";
import { MatchSuccessDialog } from "@/components/pages/tournaments/matches/match-success-dialog";

interface MatchControlClientProps {
  match: any;
  tournamentId: string;
  editionId: string;
  autoSubmit?: boolean;
  isOrganizer?: boolean;
}

export function MatchControlClient({
  match,
  tournamentId,
  editionId,
  autoSubmit = false,
  isOrganizer: isOrganizerProp = false,
}: MatchControlClientProps) {
  const router = useRouter();
  const { user } = useAuthContext();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const [adminForceEdit, setAdminForceEdit] = useState(false);
  const formRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    score1: match.score1 ?? 0,
    score2: match.score2 ?? 0,
    proofUrl: match.proofUrl || "",
    disputeReason: match.disputeReason || ""
  });

  const [showCelebration, setShowCelebration] = useState(false);
  const [shouldShowConfetti, setShouldShowConfetti] = useState(false);
  const [celebrationData, setCelebrationData] = useState({
    p1Name: match.participant1?.member?.displayName || "Participant 1",
    p2Name: match.participant2?.member?.displayName || "Participant 2",
    score1: match.score1 ?? 0,
    score2: match.score2 ?? 0,
    winnerName: "",
    progressionResult: null as any
  });

  // Déterminer les rôles
  const isMatchCompleted = match.status === "COMPLETED";
  const isMatchDisputed = match.status === "DISPUTED";
  const isMatchPending = match.status === "PENDING" || match.status === "PENDING_REVIEW";
  
  // Vérifier si l'utilisateur est participant
  const participant1UserId = match.participant1?.member?.userId;
  const participant2UserId = match.participant2?.member?.userId;
  const isParticipant1 = user?.id === participant1UserId;
  const isParticipant2 = user?.id === participant2UserId;
  const isParticipant = isParticipant1 || isParticipant2;
  
  // Vérifier si l'utilisateur est organisateur (via props ou via les membres du tournoi)
  const isOwner = user?.id === match.edition?.tournament?.organizerId;
  const isCoOrganizer = match.edition?.tournament?.members?.some(
    (m: any) => m.userId === user?.id && (m.isCoOrganizer || m.role === "CO_ORGANIZER")
  );
  const isAdmin = isOrganizerProp || isOwner || isCoOrganizer;
  
  // Vérifier qui a soumis le résultat
  const isSubmittedByParticipant1 = match.submittedByUserId === participant1UserId;
  const isSubmittedByParticipant2 = match.submittedByUserId === participant2UserId;
  const isSubmittedByAdmin = match.submittedByUserId && !isSubmittedByParticipant1 && !isSubmittedByParticipant2;
  
  // Déterminer si l'utilisateur peut soumettre un résultat
  const canSubmitResult = !isMatchCompleted && (isParticipant || isAdmin);
  
  // Déterminer si l'utilisateur peut confirmer/admin valider
  const canConfirmMatch = isAdmin && !isMatchCompleted;
  
  // Déterminer si l'utilisateur peut modifier le score (admin ou participant si match non terminé)
  const canEditScore = (isAdmin && (!isMatchCompleted || adminForceEdit)) || (isParticipant && isMatchPending);

  // Auto-focus sur le formulaire si autoSubmit est true
  useEffect(() => {
    if (autoSubmit && formRef.current && (canSubmitResult || isAdmin)) {
      formRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.info("Prêt pour la saisie du score !");
      if (isParticipant) {
        setIsEditing(true);
      }
    }
  }, [autoSubmit, canSubmitResult, isAdmin, isParticipant]);

  const handleScoreChange = (field: "score1" | "score2", value: string | number) => {
    if (!canEditScore) return;
    let val = typeof value === "string" ? parseInt(value) : value;
    if (isNaN(val) || val < 0) val = 0;
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const onSubmitResult = () => {
    if (!user) {
      toast.error("Vous devez être connecté pour soumettre un résultat");
      return;
    }
    if (!canSubmitResult) {
      toast.error("Vous ne pouvez pas soumettre de résultat pour ce match");
      return;
    }

    startTransition(async () => {
      try {
        await submitMatchResult(
          match.id,
          formData.score1,
          formData.score2,
          user.id,
          formData.proofUrl
        );
        toast.success("Résultat soumis avec succès ! En attente de validation.");
        setIsEditing(false);
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la soumission");
      }
    });
  };

  const onConfirmMatch = () => {
    startTransition(async () => {
      try {
        const result = await adminConfirmMatchResult(match.id, formData.score1, formData.score2);
        toast.success("Match confirmé et clôturé !");
        setCelebrationData({
          p1Name: match.participant1?.member?.displayName || "Participant 1",
          p2Name: match.participant2?.member?.displayName || "Participant 2",
          score1: formData.score1,
          score2: formData.score2,
          winnerName: result.winnerName || (formData.score1 > formData.score2 ? match.participant1?.member?.displayName : match.participant2?.member?.displayName),
          progressionResult: result.progressionResult
        });
        setShouldShowConfetti(!!result.needsProgression);
        setShowCelebration(true);
        if (result.progressionResult?.isPhaseComplete) {
          toast.info("La phase est terminée !");
        } else if (result.progressionResult?.isGroupComplete) {
          toast.info("Le groupe est terminé !");
        } else if (result.needsProgression) {
          toast.info(`${result.winnerName || "Le vainqueur"} est qualifié pour la phase suivante !`);
        }
        router.refresh();
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la confirmation");
      }
    });
  };

  const onDeleteMatch = () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce match ? Cette action est irréversible.")) return;

    startTransition(async () => {
      try {
        await deleteMatch(match.id);
        toast.success("Match supprimé avec succès");
        router.push(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/matches`);
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la suppression");
      }
    });
  };

  // Obtenir le statut du match avec un libellé clair
  const getMatchStatusInfo = () => {
    if (match.status === "COMPLETED") {
      return { label: "Terminé", color: "text-emerald-600", bg: "bg-emerald-500/10", icon: CheckCircle2 };
    }
    if (match.status === "IN_PROGRESS") {
      return { label: "En cours", color: "text-blue-600", bg: "bg-blue-500/10", icon: RefreshCw };
    }
    if (match.status === "DISPUTED") {
      return { label: "Litige", color: "text-red-600", bg: "bg-red-500/10", icon: AlertTriangle };
    }
    if (match.status === "PENDING_REVIEW") {
      return { label: "En attente de validation", color: "text-amber-600", bg: "bg-amber-500/10", icon: Eye };
    }
    return { label: "Programmé", color: "text-muted-foreground", bg: "bg-muted", icon: ShieldCheck };
  };

  const statusInfo = getMatchStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Statut du match */}
      <div className={cn("p-4 rounded-xl border", statusInfo.bg, "border-current/20")}>
        <div className="flex items-center gap-3">
          <StatusIcon className={cn("h-5 w-5", statusInfo.color)} />
          <div>
            <p className={cn("text-sm font-bold", statusInfo.color)}>{statusInfo.label}</p>
            {match.status === "PENDING_REVIEW" && (
              <p className="text-xs text-muted-foreground mt-1">
                Résultat soumis par {isSubmittedByParticipant1 ? match.participant1?.member?.displayName : isSubmittedByParticipant2 ? match.participant2?.member?.displayName : "un administrateur"}. 
                En attente de validation par un organisateur.
              </p>
            )}
            {match.status === "DISPUTED" && (
              <p className="text-xs text-muted-foreground mt-1">
                Raison: {match.disputeReason || "Non spécifiée"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Formulaire de saisie du score */}
      <Card 
        ref={formRef}
        className={cn(
          "border-2 transition-all",
          (canSubmitResult || isAdmin) && !isMatchCompleted ? "border-primary/20 shadow-lg" : "border-transparent bg-muted/20",
          autoSubmit && (canSubmitResult || isAdmin) && !isMatchCompleted && "ring-2 ring-primary ring-offset-2"
        )}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            {isAdmin ? (
              <Settings2 className="h-5 w-5 text-primary" />
            ) : canSubmitResult ? (
              <Send className="h-5 w-5 text-primary" />
            ) : (
              <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            )}
            {isAdmin ? "Contrôle Organisateur" : canSubmitResult ? "Saisie du Résultat" : "Résultats Enregistrés"}
          </CardTitle>
          <CardDescription className="text-xs">
            {isAdmin 
              ? "En tant qu'organisateur, vous pouvez modifier ou valider le résultat final."
              : canSubmitResult
              ? "Entrez le score final constaté à la fin de la rencontre."
              : "Le score affiché est celui actuellement enregistré."}
          </CardDescription>
        </CardHeader>
        
        {isAdmin && isMatchCompleted && !adminForceEdit && (
          <div className="px-6 pb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setAdminForceEdit(true)}
              className="w-full border-amber-500/30 text-amber-600 hover:bg-amber-500/10"
            >
              <Unlock className="h-4 w-4 mr-2" />
              Déverrouiller le résultat
            </Button>
          </div>
        )}
        
        <CardContent className="space-y-6">
          {/* Score inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center justify-center py-4 px-2">
            <div className="space-y-3 text-center">
              <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider block">
                {match.participant1?.member?.displayName || "Participant 1"}
                {isParticipant1 && !isMatchCompleted && (
                  <Badge variant="outline" className="ml-2 text-[8px]">Vous</Badge>
                )}
              </Label>
              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-12 w-12 rounded-full flex-shrink-0"
                  disabled={!canEditScore || formData.score1 <= 0}
                  onClick={() => handleScoreChange("score1", formData.score1 - 1)}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  min={0}
                  value={formData.score1}
                  disabled={!canEditScore}
                  onChange={(e) => handleScoreChange("score1", e.target.value)}
                  className={cn(
                    "h-20 max-md:h-12 text-4xl max-md:text-2xl font-black text-center bg-background border-2 shadow-sm w-24 max-md:w-16",
                    canEditScore && "focus:border-primary focus:ring-2 focus:ring-primary/20"
                  )}
                />
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  className="h-12 w-12 max-md:w-8 max-md:h-8 rounded-full text-primary bg-primary/10  flex-shrink-0"
                  disabled={!canEditScore}
                  onClick={() => handleScoreChange("score1", formData.score1 + 1)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-3 text-center">
              <Label className="text-xs uppercase font-bold text-muted-foreground tracking-wider block">
                {match.participant2?.member?.displayName || "Participant 2"}
                {isParticipant2 && !isMatchCompleted && (
                  <Badge variant="outline" className="ml-2 text-[8px]">Vous</Badge>
                )}
              </Label>
              <div className="flex items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="h-12 w-12 max-md:w-8 max-md:h-8 rounded-full flex-shrink-0"
                  disabled={!canEditScore || formData.score2 <= 0}
                  onClick={() => handleScoreChange("score2", formData.score2 - 1)}
                >
                  <Minus className="h-5 w-5" />
                </Button>
                <Input
                  type="number"
                  value={formData.score2}
                  min={0}
                  disabled={!canEditScore}
                  onChange={(e) => handleScoreChange("score2", e.target.value)}
                  className={cn(
                    "h-20 max-md:h-14 text-4xl max-md:text-2xl font-black text-center bg-background border-2 shadow-sm w-24 max-md:w-16",
                    canEditScore && "focus:border-primary focus:ring-2 focus:ring-primary/20"
                  )}
                />
                <Button
                  type="button"
                  variant="default"
                  size="icon"
                  className="h-12 w-12 max-md:w-8 max-md:h-8 rounded-full text-primary bg-primary/10 flex-shrink-0"
                  disabled={!canEditScore}
                  onClick={() => handleScoreChange("score2", formData.score2 + 1)}
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Upload de preuve */}
          {(canSubmitResult || (isAdmin && !isMatchCompleted)) && (
            <div className="space-y-3 pt-2 border-t border-border/50">
              <Label className="text-xs font-bold flex items-center gap-2">
                <Upload className="h-3.5 w-3.5" /> Preuve de victoire (Screenshot)
              </Label>
              <AdvancedUpload
                value={formData.proofUrl}
                onChange={(url) => setFormData(prev => ({ ...prev, proofUrl: url }))}
                disabled={!canSubmitResult && !isAdmin}
                maxSizeMB={2}
                maxWidthOrHeight={1920}
                uploadPath="match-proofs"
                uploadPreset="match_proofs"
                className="bg-background/50"
                previewClassName="rounded-md"
                showInternalSelection={true}
                internalImagesFolder="match-proofs"
                dropzoneOptions={{
                  accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif'] },
                  maxFiles: 1
                }}
                emptyPreview={
                  <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground py-4">
                    <ImageIcon className="h-8 w-8" />
                    <p className="text-xs">Glissez-déposez ou cliquez</p>
                  </div>
                }
              />
            </div>
          )}
        </CardContent>

        {/* Bouton de soumission pour les participants */}
        {canSubmitResult && !isMatchCompleted && (
          <CardFooter className="bg-primary/5 border-t border-primary/10 py-4">
            <Button
              onClick={onSubmitResult}
              disabled={isPending}
              className="w-full sm:w-auto ml-auto gap-2 text-sm h-11 px-8 shadow-lg shadow-primary/20"
            >
              {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Soumettre le résultat
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Panneau de contrôle administrateur */}
      {isAdmin && (
        <Card className="border-amber-500/20 shadow-xl shadow-amber-500/5 bg-gradient-to-br from-card to-amber-500/[0.02]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
              <ShieldAlert className="h-5 w-5" /> Administration du match
            </CardTitle>
            <CardDescription className="text-xs">
              Actions réservées aux organisateurs et co-organisateurs
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {/* Bouton de validation officielle */}
              <ConfirmationDialog
                title="Validation Officielle"
                description={`Êtes-vous sûr de vouloir valider officiellement le score ${formData.score1} - ${formData.score2} ? Cette action verrouillera le match et pourra déclencher la qualification pour la phase suivante.`}
                onConfirm={onConfirmMatch}
                confirmLabel="Confirmer la validation"
                variant="default"
              >
                <Button
                  disabled={isPending || isMatchCompleted}
                  className="flex-1 min-w-[200px] h-11 gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/20"
                >
                  {isPending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  Valider officiellement
                </Button>
              </ConfirmationDialog>

              {/* Bouton litige */}
              <Button
                variant="outline"
                className="flex-1 min-w-[150px] h-11 gap-2 border-red-500/30 text-red-600 hover:bg-red-50 text-sm font-medium"
                onClick={() => {
                  const reason = prompt("Raison du litige:");
                  if (reason) {
                    // Appel API pour signaler un litige
                    toast.info(`Litige signalé: ${reason}`);
                  }
                }}
              >
                <AlertTriangle className="h-4 w-4" /> Signaler un litige
              </Button>
            </div>

            {/* Danger zone */}
            <div className="pt-4 border-t border-border/50 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase">Zone de danger</p>
                <p className="text-[10px] text-muted-foreground/60 italic">
                  Supprime définitivement toutes les données du match.
                </p>
              </div>
              <ConfirmationDialog
                title="Suppression du match"
                description="Cette action est irréversible. Toutes les données du match seront supprimées définitivement. Continuer ?"
                onConfirm={onDeleteMatch}
                confirmLabel="Supprimer définitivement"
                variant="destructive"
              >
                <Button
                  disabled={isPending}
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </ConfirmationDialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations de session */}
      <div className="bg-muted/30 p-4 rounded-xl border border-border/40 flex items-start gap-4">
        <div className="h-10 w-10 shrink-0 bg-background rounded-full flex items-center justify-center border text-muted-foreground">
          <UserIcon className="h-5 w-5" />
        </div>
        <div className="space-y-1 flex-1">
          <Typography variant="caption1" weight="bold" className="uppercase tracking-widest text-muted-foreground text-xs">
            Informations de session
          </Typography>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Connecté en tant que : <span className="font-medium text-foreground">{user?.username || user?.fullName || "Visiteur"}</span>
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {isAdmin && (
              <Badge variant="default" className="bg-primary/10 text-primary text-[9px] gap-1">
                <ShieldCheck className="h-3 w-3" /> Organisateur
              </Badge>
            )}
            {isParticipant && (
              <Badge variant="secondary" className="text-[9px] gap-1">
                <UserIcon className="h-3 w-3" /> Participant
              </Badge>
            )}
            {!isAdmin && !isParticipant && (
              <Badge variant="outline" className="text-[9px] gap-1">
                <Eye className="h-3 w-3" /> Spectateur
              </Badge>
            )}
          </div>
        </div>
      </div>

      <MatchSuccessDialog
        open={showCelebration}
        onOpenChange={setShowCelebration}
        matchData={celebrationData}
        showConfetti={shouldShowConfetti}
        onOrganizeNext={() => {
          router.push(`/tournaments/${tournamentId}/editions/${editionId}/dashboard/phases`);
        }}
      />
    </div>
  );
}