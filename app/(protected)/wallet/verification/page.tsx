"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { Typography } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import {
  Shield,
  CheckCircle,
  Upload,
  FileText,
  Camera,
  AlertCircle,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";
import { countries } from "@/lib/countries";
import { useUserProfile } from "@/hooks/use-profile";

export default function VerificationPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { data: completeData } = useUserProfile(!!user?.id);
  console.log(completeData)
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    documentType: "CNI",
    documentNumber: "",
    firstName: completeData?.fullName || "",
    lastName: completeData?.username || "",
    birthDate: "",
    nationality: "NE",
    address: "",
    city: "Niamey",
    postalCode: "",
    documentFront: "",
    documentBack: "",
    // selfie: "",
  });

  const steps = [
    { number: 1, title: "Informations personnelles", icon: UserCheck },
    { number: 2, title: "Document d'identité", icon: FileText },
    { number: 3, title: "Soumission", icon: Shield },
  ];

  const documentTypes = [
    { value: "CNI", label: "Carte Nationale d'Identité" },
    { value: "PASSPORT", label: "Passeport" },
    { value: "DRIVER_LICENSE", label: "Permis de conduire" },
    { value: "RESIDENCE_PERMIT", label: "Titre de séjour" },
  ];

  const requirements = [
    "Document original et valide",
    "Photo nette et bien éclairée",
    "Toutes les informations visibles",
    "Format JPG, PNG ou PDF",
    "Taille max: 5MB par fichier",
  ];

  const handleSubmit = async () => {
    if (step < 3) {
      // Valider l'étape courante
      if (step === 1) {
        if (!formData.firstName || !formData.lastName || !formData.birthDate) {
          toast.error("Veuillez remplir tous les champs obligatoires");
          return;
        }
      }
      if (step === 2) {
        if (!formData.documentNumber || !formData.documentFront) {
          toast.error("Veuillez télécharger votre document d'identité");
          return;
        }
      }
      setStep(step + 1);
      return;
    }

    // Soumission finale
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/wallet/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Vérification soumise avec succès");
        setTimeout(() => {
          router.push("/wallet");
        }, 1500);
      } else {
        throw new Error("Erreur lors de la soumission");
      }
    } catch (error) {
      toast.error("Erreur lors de la soumission");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 py-4">
      <div className="mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* En-tête */}
          <div className="text-center mb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center"
            >
              <Shield className="h-10 w-10 text-white" />
            </motion.div>
            
            <Typography variant="h2" weight="bold" animated>
              Vérification d'Identité
            </Typography>
            <Typography variant="body-lg" theme="muted" className="mt-2 max-w-2xl mx-auto">
              Complétez cette procédure pour sécuriser votre wallet et augmenter vos limites
            </Typography>
          </div>

          {/* Étapes */}
          <div className="mb-4">
            <Progress value={(step / 3) * 100} className="h-2 mb-4" />
            <div className="grid grid-cols-3 gap-4">
              {steps.map((s) => {
                const StepIcon = s.icon;
                return (
                  <div
                    key={s.number}
                    className={`flex flex-col items-center gap-2 text-center ${
                      step >= s.number ? "text-primary" : "text-muted-foreground"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center ${
                      step >= s.number 
                        ? "border-primary bg-primary/10" 
                        : "border-muted"
                    }`}>
                      {step > s.number ? (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <Typography variant="caption1" weight="medium" className="text-xs">
                      {s.title}
                    </Typography>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            {/* Étape 1: Informations personnelles */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="p-3">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      Informations Personnelles
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">Prénom *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) =>
                            setFormData({ ...formData, firstName: e.target.value })
                          }
                          placeholder="Votre prénom"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName">Nom *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) =>
                            setFormData({ ...formData, lastName: e.target.value })
                          }
                          placeholder="Votre nom"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="birthDate">Date de naissance *</Label>
                        <Input
                          id="birthDate"
                          type="date"
                          value={formData.birthDate}
                          onChange={(e) =>
                            setFormData({ ...formData, birthDate: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nationality">Nationalité</Label>
                        <Select
                          value={formData.nationality}
                          onValueChange={(value) =>
                            setFormData({ ...formData, nationality: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country.code} value={country.code}>
                                {country.flag} {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Adresse</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) =>
                          setFormData({ ...formData, address: e.target.value })
                        }
                        placeholder="Adresse complète"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">Ville</Label>
                        <Input
                          id="city"
                          value={formData.city || "Niamey"}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          placeholder="Ville"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="postalCode">Code postal</Label>
                        <Input
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={(e) =>
                            setFormData({ ...formData, postalCode: e.target.value })
                          }
                          placeholder="Code postal"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Étape 2: Document d'identité */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Document d'Identité
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Type de document *</Label>
                        <Select
                          value={formData.documentType}
                          onValueChange={(value) =>
                            setFormData({ ...formData, documentType: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez" />
                          </SelectTrigger>
                          <SelectContent>
                            {documentTypes.map((doc) => (
                              <SelectItem key={doc.value} value={doc.value}>
                                {doc.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="documentNumber">Numéro du document *</Label>
                        <Input
                          id="documentNumber"
                          value={formData.documentNumber}
                          onChange={(e) =>
                            setFormData({ ...formData, documentNumber: e.target.value })
                          }
                          placeholder="Numéro du document"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Recto du document *</Label>
                        <AdvancedUpload
                          value={formData.documentFront}
                          onChange={(url) =>
                            setFormData({ ...formData, documentFront: url })
                          }
                          maxSizeMB={5}
                          uploadPath="verification"
                          emptyPreview={
                            <div className="text-center">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <Typography variant="body-sm" theme="muted">
                                Recto du document
                              </Typography>
                            </div>
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Verso du document</Label>
                        <AdvancedUpload
                          value={formData.documentBack}
                          onChange={(url) =>
                            setFormData({ ...formData, documentBack: url })
                          }
                          maxSizeMB={5}
                          uploadPath="verification"
                          emptyPreview={
                            <div className="text-center">
                              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                              <Typography variant="body-sm" theme="muted">
                                Verso du document
                              </Typography>
                            </div>
                          }
                        />
                      </div>
                    </div>

                    <div className="bg-muted/50 rounded-lg p-4">
                      <Typography variant="body-sm" weight="medium" className="mb-2">
                        Exigences du document:
                      </Typography>
                      <ul className="space-y-1">
                        {requirements.map((req, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <Typography variant="caption2" theme="muted">
                              {req}
                            </Typography>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Étape 3: Vérification faciale */}
            {/* {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Camera className="h-5 w-5" />
                      Vérification Faciale
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="text-center">
                      <Typography variant="body-lg" className="mb-4">
                        Prenez une selfie pour vérifier votre identité
                      </Typography>
                      
                      <div className="max-w-md mx-auto space-y-4">
                        <div className="relative aspect-square rounded-lg overflow-hidden border-2 border-dashed border-muted">
                          {formData.selfie ? (
                            <img
                              src={formData.selfie}
                              alt="Selfie"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <Camera className="h-16 w-16 text-muted-foreground mb-4" />
                              <Typography variant="body-sm" theme="muted">
                                Aucune photo
                              </Typography>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <AdvancedUpload
                            value={formData.selfie}
                            onChange={(url) =>
                              setFormData({ ...formData, selfie: url })
                            }
                            maxSizeMB={5}
                            uploadPath="verification/selfies"
                            emptyPreview={
                              <div className="text-center py-8">
                                <Camera className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                                <Typography variant="body-sm" theme="muted">
                                  Téléchargez ou prenez une photo
                                </Typography>
                              </div>
                            }
                          />

                          <Button
                            variant="outline"
                            className="w-full gap-2"
                            onClick={() => {
                              // Ici vous implémenteriez la prise de photo via webcam
                              toast.info("Fonctionnalité caméra à implémenter");
                            }}
                          >
                            <Camera className="h-4 w-4" />
                            Prendre une photo maintenant
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <Typography variant="body-sm" weight="medium">
                            Conseils pour une bonne photo:
                          </Typography>
                          <ul className="mt-1 space-y-1">
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-blue-600" />
                              <Typography variant="caption2" theme="muted">
                                Bon éclairage naturel
                              </Typography>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-blue-600" />
                              <Typography variant="caption2" theme="muted">
                                Visage bien visible
                              </Typography>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-blue-600" />
                              <Typography variant="caption2" theme="muted">
                                Regardez droit devant vous
                              </Typography>
                            </li>
                            <li className="flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-blue-600" />
                              <Typography variant="caption2" theme="muted">
                                Pas de lunettes de soleil
                              </Typography>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )} */}

            {/* Étape 4: Soumission */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Soumission & Vérification
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center py-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center"
                      >
                        <Shield className="h-10 w-10 text-green-600" />
                      </motion.div>
                      <Typography variant="h4" weight="bold" className="mb-2">
                        Prêt à soumettre!
                      </Typography>
                      <Typography variant="body-base" theme="muted">
                        Vérifiez que toutes les informations sont correctes
                      </Typography>
                    </div>

                    <div className="space-y-4">
                      <Card>
                        <CardContent className="p-4">
                          <Typography variant="body-sm" weight="medium" className="mb-2">
                            Résumé de votre soumission:
                          </Typography>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Typography variant="caption2" theme="muted">
                                Nom complet:
                              </Typography>
                              <Typography variant="caption2" weight="medium">
                                {formData.firstName} {formData.lastName}
                              </Typography>
                            </div>
                            <div className="flex justify-between">
                              <Typography variant="caption2" theme="muted">
                                Document:
                              </Typography>
                              <Badge variant="outline">
                                {documentTypes.find(d => d.value === formData.documentType)?.label}
                              </Badge>
                            </div>
                            <div className="flex justify-between">
                              <Typography variant="caption2" theme="muted">
                                Photos soumises:
                              </Typography>
                              <Typography variant="caption2" weight="medium">
                                {[formData.documentFront, formData.documentBack]
                                  .filter(Boolean).length}/2
                              </Typography>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-2">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                          <div>
                            <Typography variant="body-sm" weight="medium">
                              Avantages après vérification:
                            </Typography>
                            <ul className="mt-1 space-y-1">
                              <li className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-green-600" />
                                <Typography variant="caption2" theme="muted">
                                  Limites de transaction augmentées
                                </Typography>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-green-600" />
                                <Typography variant="caption2" theme="muted">
                                  Accès aux retraits bancaires
                                </Typography>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-green-600" />
                                <Typography variant="caption2" theme="muted">
                                  Statut de membre vérifié
                                </Typography>
                              </li>
                              <li className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-green-600" />
                                <Typography variant="caption2" theme="muted">
                                  Support prioritaire
                                </Typography>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4" />
                        <Typography variant="caption2">
                          Le traitement prend généralement 24-48 heures. Vous serez notifié par email.
                        </Typography>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Navigation */}
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => step > 1 && setStep(step - 1)}
                disabled={step === 1}
              >
                Précédent
              </Button>

              <Button
                type="button"
                className="gap-2 min-w-[140px]"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {step < 3 ? (
                  <>
                    Suivant
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  isSubmitting ? "Soumission..." : "Soumettre la vérification"
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}