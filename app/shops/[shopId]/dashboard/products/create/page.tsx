"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Typography } from "@/components/ui/typography";
import { AdvancedMultiUpload } from "@/components/ui/advanced-multi-upload";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Shield,
  Lock,
} from "lucide-react";
import { createProduct } from "@/actions/products";
import { encryptData } from "@/lib/encryption";

type ProductFormData = {
  name: string;
  price: string;
  currency: string;
  description: string;
  featuredImage: string;
  images: string[];
  accountLogin: string;
  accountPassword: string;
};

const initialData: ProductFormData = {
  name: "",
  price: "",
  currency: "GTC",
  description: "",
  featuredImage: "",
  images: [],
  accountLogin: "",
  accountPassword: "",
};

export default function CreateProductPage() {
  const params = useParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialData);

  const updateField = <K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 4));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.price.trim()) {
      toast.error("Nom et prix sont requis");
      return;
    }
    setIsSubmitting(true);
    try {
      const shopId = params.shopId as string;

      // Chiffrer le mot de passe s'il est fourni
      const encryptedPassword = formData.accountPassword
        ? encryptData(formData.accountPassword)
        : undefined;

      const product = await createProduct({
        shopId,
        name: formData.name,
        price: formData.price,
        currency: formData.currency,
        description: formData.description,
        featuredImage:
          formData.featuredImage ||
          (formData.images.length > 0 ? formData.images[0] : ""),
        images: formData.images.filter(Boolean),
        accountLogin: formData.accountLogin || undefined,
        encryptedPassword,
        isActive: true,
        isVisible: true,
      } as any);
      toast.success("Produit créé avec succès");
      router.push(`/marketplace/${product.id}/dashboard`);
    } catch (e: any) {
      toast.error(e?.message || "Erreur lors de la création du produit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8 text-center">
        <Typography variant="h1" className="text-3xl font-bold mb-2">
          Créer un produit
        </Typography>
        <Typography variant="body-sm" theme="muted">
          3 étapes rapides: médias, informations, aperçu
        </Typography>
      </div>

      <Card className="border-border/50 shadow-xl overflow-hidden min-h-[400px] flex flex-col">
        <CardHeader className="pb-0">
          <CardTitle className="text-base">Étape {step} sur 4</CardTitle>
        </CardHeader>
        <CardContent className="p-6 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <Package className="h-8 w-8 text-primary" />
                    </div>
                    <Typography variant="h2" weight="bold">
                      Médias du produit
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      Ajoutez les images de votre produit (max 3)
                    </Typography>
                  </div>
                  <div className="space-y-4">
                    <Label>Galerie d'images</Label>
                    <AdvancedMultiUpload
                      value={formData.images}
                      onChange={(urls) => {
                        updateField("images", urls);
                        if (urls.length > 0 && !formData.featuredImage) {
                          updateField("featuredImage", urls[0]);
                        }
                      }}
                      maxImages={3}
                      maxSizeMB={5}
                      className="min-h-[200px]"
                    />
                    <Typography variant="caption1" theme="muted">
                      La première image sera utilisée comme image principale.
                    </Typography>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center mb-2">
                    <Typography variant="h2" weight="bold">
                      Informations requises
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      Nom et prix suffisent pour commencer
                    </Typography>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nom du produit *</Label>
                      <Input
                        id="name"
                        placeholder="Ex: Skin épique valorant"
                        value={formData.name}
                        onChange={(e) => updateField("name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price">Prix *</Label>
                      <div className="flex gap-2">
                        <Input
                          id="price"
                          type="number"
                          placeholder="0.00"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => updateField("price", e.target.value)}
                        />
                        <Input
                          value={formData.currency}
                          onChange={(e) =>
                            updateField("currency", e.target.value)
                          }
                          className="w-24"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="desc">Description (optionnel)</Label>
                    <Textarea
                      id="desc"
                      placeholder="Décrivez ce que vous vendez"
                      value={formData.description}
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                      rows={3}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center mb-2">
                    <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-3">
                      <Shield className="h-8 w-8 text-primary" />
                    </div>
                    <Typography variant="h2" weight="bold">
                      Accès au compte
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      Informations de connexion (facultatif mais recommandé pour
                      les comptes)
                    </Typography>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3 items-start mb-6">
                    <Lock className="h-5 w-5 text-amber-600 mt-0.5" />
                    <Typography variant="caption1" className="text-amber-800">
                      Ces informations seront <strong>chiffrées</strong> et
                      uniquement visibles par l'acheteur après la confirmation
                      de la vente.
                    </Typography>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="accountLogin">
                        Nom d'utilisateur / Email
                      </Label>
                      <Input
                        id="accountLogin"
                        placeholder="Ex: player_one@gmail.com"
                        value={formData.accountLogin}
                        onChange={(e) =>
                          updateField("accountLogin", e.target.value)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="accountPassword">Mot de passe</Label>
                      <Input
                        id="accountPassword"
                        type="password"
                        placeholder="••••••••"
                        value={formData.accountPassword}
                        onChange={(e) =>
                          updateField("accountPassword", e.target.value)
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="text-center mb-2">
                    <Typography variant="h2" weight="bold">
                      Aperçu
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      Vérifiez avant confirmation
                    </Typography>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border bg-card">
                    <div className="h-40 bg-gradient-to-r from-primary/20 to-primary/10 relative">
                      {formData.images.length > 0 ? (
                        <img
                          src={formData.images[0]}
                          alt="Produit"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Package className="h-16 w-16 text-primary/30" />
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <Typography variant="h3" weight="bold">
                          {formData.name || "Nouveau produit"}
                        </Typography>
                        <Typography
                          variant="h4"
                          weight="bold"
                          className="text-primary font-mono"
                        >
                          {formData.price || "0.00"} {formData.currency}
                        </Typography>
                      </div>

                      {formData.description && (
                        <Typography
                          variant="body-base"
                          theme="muted"
                          className="mb-4 line-clamp-2"
                        >
                          {formData.description}
                        </Typography>
                      )}

                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge variant="secondary" className="gap-1">
                          <Package className="h-3 w-3" />
                          {formData.images.length} image(s)
                        </Badge>
                        {formData.accountLogin && (
                          <Badge
                            variant="outline"
                            className="text-green-600 bg-green-50 border-green-200 gap-1"
                          >
                            <Shield className="h-3 w-3" />
                            Accès inclus
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </CardContent>
        <CardFooter className="bg-secondary/10 p-6 flex justify-between border-t border-border/50">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 1 || isSubmitting}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          {step < 4 ? (
            <Button
              onClick={nextStep}
              disabled={
                step === 2 && (!formData.name.trim() || !formData.price.trim())
              }
              title={
                step === 2 && (!formData.name.trim() || !formData.price.trim())
                  ? "Renseignez le nom et le prix"
                  : undefined
              }
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              Suivant
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="gap-2 bg-green-600 hover:bg-green-700 text-white"
            >
              {isSubmitting ? "Création..." : "Confirmer et créer"}
              {!isSubmitting && <CheckCircle2 className="h-4 w-4" />}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
