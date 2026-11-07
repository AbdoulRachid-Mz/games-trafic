"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  FileText,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Loader2,
  ExternalLink,
  MessageSquare,
  Shield,
  Ban,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/contexts/auth-context";
import { getUserClaims, createClaim } from "@/actions/claims";
import {
  CLAIM_TYPES,
  claimTypeLabel,
  claimStatusLabel,
} from "@/lib/claims/claim-types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface UserClaim {
  id: string;
  type: string;
  title: string;
  description: string;
  transactionId: string | null;
  evidence: string | null;
  image: string | null;
  status: string | null;
  resolution: string | null;
  createdAt: string | Date | null;
  updatedAt: string | Date | null;
}

const STATUS_TABS = [
  { value: "ALL", label: "Toutes" },
  { value: "PENDING", label: "En attente" },
  { value: "IN_PROGRESS", label: "En cours" },
  { value: "RESOLVED", label: "Résolues" },
  { value: "REJECTED", label: "Rejetées" },
] as const;

export default function ClaimsPage() {
  const { user } = useAuthContext();
  const [claims, setClaims] = useState<UserClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<string>("ALL");
  const [selectedClaim, setSelectedClaim] = useState<UserClaim | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    description: "",
    transactionId: "",
    evidence: "",
    image: "",
  });

  const loadClaims = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const claimsData = await getUserClaims(user.id, {
        pagination: { page: 1, limit: 50 },
      });
      setClaims(claimsData.data as unknown as UserClaim[]);
    } catch (error) {
      console.error("Error loading claims:", error);
      toast.error("Erreur lors du chargement de vos réclamations");
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    if (!user?.id) {
      toast.error("Vous devez être connecté pour soumettre une réclamation");
      setIsSubmitting(false);
      return;
    }
    if (!formData.type) {
      toast.error("Veuillez sélectionner un type de réclamation");
      setIsSubmitting(false);
      return;
    }
    if (formData.title.trim().length < 5) {
      toast.error("Le titre doit contenir au moins 5 caractères");
      setIsSubmitting(false);
      return;
    }
    if (formData.description.trim().length < 20) {
      toast.error("La description doit contenir au moins 20 caractères");
      setIsSubmitting(false);
      return;
    }

    try {
      await createClaim({
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        transactionId: formData.transactionId.trim() || undefined,
        evidence: formData.evidence.trim() || undefined,
        image: formData.image || undefined,
        userId: user.id,
      });
      toast.success("Réclamation soumise avec succès");
      setFormData({
        type: "",
        title: "",
        description: "",
        transactionId: "",
        evidence: "",
        image: "",
      });
      await loadClaims();
    } catch (error) {
      console.error("Erreur lors de la création de la réclamation:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de la soumission de la réclamation"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredClaims =
    statusTab === "ALL"
      ? claims
      : claims.filter((c) => c.status === statusTab);

  const stats = {
    pending: claims.filter((c) => c.status === "PENDING").length,
    inProgress: claims.filter((c) => c.status === "IN_PROGRESS").length,
    resolved: claims.filter((c) => c.status === "RESOLVED").length,
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "PENDING":
        return {
          className:
            "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
          icon: Clock,
          label: "En attente",
        };
      case "IN_PROGRESS":
        return {
          className:
            "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
          icon: Loader2,
          label: "En cours",
        };
      case "RESOLVED":
        return {
          className:
            "bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30",
          icon: CheckCircle,
          label: "Résolu",
        };
      case "REJECTED":
        return {
          className:
            "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
          icon: XCircle,
          label: "Rejeté",
        };
      default:
        return {
          className: "bg-muted text-muted-foreground border-border",
          icon: FileText,
          label: status || "—",
        };
    }
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Typography variant="h1" weight="bold" animated>
          Centre de Réclamations
        </Typography>
        <Typography variant="body-base" theme="muted" className="mt-1">
          Signalez les problèmes et obtenez de l&apos;aide pour votre wallet
        </Typography>
      </motion.div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <Typography variant="h4" weight="bold">
                {stats.pending}
              </Typography>
              <Typography variant="caption2" theme="muted">
                En attente
              </Typography>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <Typography variant="h4" weight="bold">
                {stats.inProgress}
              </Typography>
              <Typography variant="caption2" theme="muted">
                En cours
              </Typography>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <Typography variant="h4" weight="bold">
                {stats.resolved}
              </Typography>
              <Typography variant="caption2" theme="muted">
                Résolues
              </Typography>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grille de contenu */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire de réclamation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardContent className="p-6">
              <Typography variant="h4" weight="semibold" className="mb-6">
                Soumettre une Réclamation
              </Typography>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Typography variant="body-sm" weight="medium">
                      Type de réclamation *
                    </Typography>
                    <Select
                      value={formData.type}
                      onValueChange={(value) =>
                        setFormData({ ...formData, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CLAIM_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {claimTypeLabel(type)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Typography variant="body-sm" weight="medium">
                      ID de transaction (optionnel)
                    </Typography>
                    <Input
                      placeholder="ex: tx_123456..."
                      value={formData.transactionId}
                      onChange={(e) =>
                        setFormData({ ...formData, transactionId: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Typography variant="body-sm" weight="medium">
                    Titre
                  </Typography>
                  <Input
                    placeholder="Décrivez brièvement le problème"
                    value={formData.title}
                    maxLength={200}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Typography variant="body-sm" weight="medium">
                    Description détaillée
                  </Typography>
                  <Textarea
                    placeholder="Décrivez le problème en détail, incluez toutes les informations pertinentes..."
                    value={formData.description}
                    maxLength={5000}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Typography variant="body-sm" weight="medium">
                    Preuves / Pièces jointes
                  </Typography>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Typography variant="caption2" theme="muted">
                        Capture d&apos;écran
                      </Typography>
                      <AdvancedUpload
                        value={formData.image}
                        onChange={(url) =>
                          setFormData({ ...formData, image: url })
                        }
                        maxSizeMB={5}
                        isRounded={false}
                        showInternalSelection={false}
                      />
                    </div>
                    <div className="space-y-2">
                      <Typography variant="caption2" theme="muted">
                        Lien vers une preuve
                      </Typography>
                      <Input
                        placeholder="URL (Drive, Dropbox, etc.)"
                        value={formData.evidence}
                        onChange={(e) =>
                          setFormData({ ...formData, evidence: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <Typography variant="caption2">
                    Nous traiterons votre réclamation dans les 24-48 heures
                  </Typography>
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {isSubmitting ? "Soumission..." : "Soumettre la réclamation"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>

        {/* Liste des réclamations */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <Typography variant="h4" weight="semibold">
                  Mes Réclamations
                </Typography>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={loadClaims}
                  disabled={loading}
                >
                  <RotateCcw
                    className={cn("h-4 w-4", loading && "animate-spin")}
                  />
                </Button>
              </div>

              {/* Filtres de statut */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {STATUS_TABS.map((tab) => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setStatusTab(tab.value)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                      statusTab === tab.value
                        ? "bg-primary/10 border-primary/40 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-xl border border-border/50 bg-muted/20 animate-pulse space-y-2"
                    >
                      <div className="h-4 w-2/3 bg-muted-foreground/10 rounded" />
                      <div className="h-3 w-1/2 bg-muted-foreground/10 rounded" />
                    </div>
                  ))
                ) : filteredClaims.length > 0 ? (
                  filteredClaims.map((claim, index) => {
                    const badge = getStatusBadge(claim.status);
                    const Icon = badge.icon;
                    return (
                      <motion.button
                        key={claim.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(index * 0.05, 0.3) }}
                        onClick={() => setSelectedClaim(claim)}
                        className="w-full text-left p-4 rounded-xl border border-border/50 hover:border-primary/40 hover:shadow-sm transition-all bg-background/30"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <Typography
                              variant="body-sm"
                              weight="semibold"
                              className="line-clamp-1"
                            >
                              {claim.title}
                            </Typography>
                            <Badge
                              variant="outline"
                              className={cn(
                                "gap-1 shrink-0",
                                badge.className
                              )}
                            >
                              <Icon
                                className="h-3 w-3"
                                style={
                                  claim.status === "IN_PROGRESS"
                                    ? { animation: "spin 1s linear infinite" }
                                    : undefined
                                }
                              />
                              {badge.label}
                            </Badge>
                          </div>
                          <Badge variant="outline" className="text-[10px]">
                            {claimTypeLabel(claim.type)}
                          </Badge>
                          <Typography
                            variant="caption2"
                            theme="muted"
                            className="line-clamp-2"
                          >
                            {claim.description}
                          </Typography>
                          {claim.resolution && (
                            <div className="flex items-start gap-2 pt-1">
                              <Shield className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                              <Typography
                                variant="caption2"
                                className="text-green-600 dark:text-green-400 line-clamp-1"
                              >
                                Réponse admin : {claim.resolution}
                              </Typography>
                            </div>
                          )}
                          <div className="flex items-center pt-1">
                            <Typography variant="caption2" theme="muted">
                              {format(
                                new Date(claim.createdAt || Date.now()),
                                "dd MMM yyyy",
                                { locale: fr }
                              )}
                            </Typography>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <Typography variant="body-base" theme="muted">
                      {statusTab === "ALL"
                        ? "Aucune réclamation"
                        : "Aucune réclamation dans ce statut"}
                    </Typography>
                    <Typography variant="body-sm" theme="muted" className="mt-1">
                      {statusTab === "ALL"
                        ? "Soumettez votre première réclamation"
                        : "Essayez un autre filtre"}
                    </Typography>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Info box */}
          <Card className="mt-6 bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="space-y-1">
                  <Typography variant="body-sm" weight="medium">
                    Conseils pour une réclamation efficace
                  </Typography>
                  <Typography variant="caption2" theme="muted">
                    • Incluez tous les détails pertinents
                    <br />
                    • Joignez des preuves visuelles
                    <br />
                    • Mentionnez l&apos;ID de transaction si applicable
                    <br />• Soyez précis dans votre description
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Dialog détail réclamation */}
      <Dialog
        open={!!selectedClaim}
        onOpenChange={(open) => !open && setSelectedClaim(null)}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {selectedClaim && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 pr-6">
                  {selectedClaim.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px]">
                    {claimTypeLabel(selectedClaim.type)}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px] gap-1",
                      getStatusBadge(selectedClaim.status).className
                    )}
                  >
                    {claimStatusLabel(selectedClaim.status || "")}
                  </Badge>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Typography variant="body-sm" weight="medium" className="mb-1">
                    Votre description
                  </Typography>
                  <Typography
                    variant="body-sm"
                    theme="muted"
                    className="whitespace-pre-wrap"
                  >
                    {selectedClaim.description}
                  </Typography>
                </div>

                {selectedClaim.transactionId && (
                  <div className="p-3 rounded-lg bg-muted/50">
                    <Typography variant="caption2" theme="muted">
                      Transaction concernée
                    </Typography>
                    <Typography
                      variant="caption1"
                      className="font-mono break-all"
                    >
                      {selectedClaim.transactionId}
                    </Typography>
                  </div>
                )}

                {selectedClaim.image && (
                  <div className="space-y-2">
                    <Typography variant="body-sm" weight="medium">
                      Capture d&apos;écran
                    </Typography>
                    <img
                      src={selectedClaim.image}
                      alt="Preuve"
                      className="rounded-xl border border-border max-h-72 w-full object-contain"
                    />
                  </div>
                )}

                {selectedClaim.evidence && (
                  <a
                    href={selectedClaim.evidence}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-primary hover:underline break-all"
                  >
                    <ExternalLink className="h-4 w-4 shrink-0" />
                    {selectedClaim.evidence}
                  </a>
                )}

                <div
                  className={cn(
                    "p-4 rounded-xl border space-y-2",
                    selectedClaim.status === "RESOLVED"
                      ? "bg-green-500/5 border-green-500/30"
                      : selectedClaim.status === "REJECTED"
                      ? "bg-red-500/5 border-red-500/30"
                      : "bg-blue-500/5 border-blue-500/30"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {selectedClaim.status === "RESOLVED" ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : selectedClaim.status === "REJECTED" ? (
                      <Ban className="h-4 w-4 text-red-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-500" />
                    )}
                    <Typography variant="body-sm" weight="medium">
                      Réponse de l&apos;équipe
                    </Typography>
                  </div>
                  {selectedClaim.resolution ? (
                    <Typography
                      variant="body-sm"
                      theme="muted"
                      className="whitespace-pre-wrap"
                    >
                      {selectedClaim.resolution}
                    </Typography>
                  ) : (
                    <Typography variant="caption2" theme="muted">
                      Pas encore de réponse. Nous revenons vers vous sous
                      24-48h.
                    </Typography>
                  )}
                </div>

                {selectedClaim.updatedAt && (
                  <Typography variant="caption2" theme="muted">
                    Dernière mise à jour :{" "}
                    {format(new Date(selectedClaim.updatedAt), "dd MMM yyyy 'à' HH:mm", {
                      locale: fr,
                    })}
                  </Typography>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
