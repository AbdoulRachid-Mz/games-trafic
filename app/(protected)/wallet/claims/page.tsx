"use client";

import React, { useState, useEffect } from "react";
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
  Image as ImageIcon,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { useAuthContext } from "@/contexts/auth-context";
import { getUserClaims, createClaim } from "@/actions/claims";

export default function ClaimsPage() {
  const { user } = useAuthContext();
  const [claims, setClaims] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    title: "",
    description: "",
    transactionId: "",
    evidence: "",
    image: "",
  });

  const claimTypes = [
    { value: "TRANSACTION_ISSUE", label: "Problème de transaction" },
    { value: "WALLET_LOCKED", label: "Wallet bloqué" },
    { value: "VERIFICATION_ISSUE", label: "Problème de vérification" },
    { value: "SECURITY_CONCERN", label: "Problème de sécurité" },
    { value: "OTHER", label: "Autre" },
  ];

  useEffect(() => {
    loadClaims();
  }, []);

  const loadClaims = async () => {
    try {
      const claimsData = await getUserClaims(user?.id || "", {
        pagination: { page: 1, limit: 20 },
        filters: { isDeleted: false },
      });
setClaims(claimsData.data as any);
    } catch (error) {
      console.error("Error loading claims:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Appel direct de la fonction serveur createClaim
      const newClaim = await createClaim({
        ...formData,
        userId: user?.id ?? "",
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
      loadClaims();
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
  

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" />
            En attente
          </span>
        );
      case "RESOLVED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" />
            Résolu
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" />
            Rejeté
          </span>
        );
      default:
        return <span className="text-xs">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Typography variant="h1" weight="bold" gradient animated>
          Centre de Réclamations
        </Typography>
        <Typography variant="body-base" theme="muted" className="mt-1">
          Signalez les problèmes et obtenez de l'aide pour votre wallet
        </Typography>
      </motion.div>

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
                      Type de réclamation
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
                        {claimTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
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
                        Capture d'écran
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
                  <Send className="h-4 w-4" />
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
              <div className="flex items-center justify-between mb-6">
                <Typography variant="h4" weight="semibold">
                  Mes Réclamations
                </Typography>
                <Badge variant="outline">{claims.length}</Badge>
              </div>

              <div className="space-y-4">
                {claims.length > 0 ? (
                  claims.map((claim: any, index) => (
                    <motion.div
                      key={claim.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <Typography
                                variant="body-sm"
                                weight="semibold"
                                className="line-clamp-1"
                              >
                                {claim.title}
                              </Typography>
                              {getStatusBadge(claim.status)}
                            </div>
                            <Typography
                              variant="caption2"
                              theme="muted"
                              className="line-clamp-2"
                            >
                              {claim.description}
                            </Typography>
                            <div className="flex items-center justify-between pt-2">
                              <Typography variant="caption2" theme="muted">
                                {format(
                                  new Date(claim.createdAt),
                                  "dd MMM yyyy",
                                  { locale: fr }
                                )}
                              </Typography>
                              <Button variant="ghost" size="sm">
                                <FileText className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <Typography variant="body-base" theme="muted">
                      Aucune réclamation
                    </Typography>
                    <Typography variant="body-sm" theme="muted" className="mt-1">
                      Soumettez votre première réclamation
                    </Typography>
                  </div>
                )}
              </div>

              <div className="pt-6 border-t mt-6">
                <Button variant="outline" className="w-full gap-2">
                  <Plus className="h-4 w-4" />
                  Voir toutes les réclamations
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info box */}
          <Card className="mt-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
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
                    • Mentionnez l'ID de transaction si applicable
                    <br />• Soyez précis dans votre description
                  </Typography>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}