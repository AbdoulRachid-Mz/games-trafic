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
import { AdvancedUpload } from "@/components/ui/advanced-upload";
import { Badge } from "@/components/ui/badge";
import { Package, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { createProduct } from "@/actions/products";

type ProductFormData = {
  name: string;
  price: string;
  currency: string;
  description: string;
  featuredImage: string;
  images: string[];
};

const initialData: ProductFormData = {
  name: "",
  price: "",
  currency: "GTC",
  description: "",
  featuredImage: "",
  images: [],
};

export default function CreateProductPage() {
  const params = useParams();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialData);

  const updateField = <K extends keyof ProductFormData>(
    key: K,
    value: ProductFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const nextStep = () => setStep((s) => Math.min(s + 1, 3));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.price.trim()) {
      toast.error("Nom et prix sont requis");
      return;
    }
    setIsSubmitting(true);
    try {
      const shopId = params.shopId as string;
      const product = await createProduct({
        shopId,
        name: formData.name,
        price: formData.price,
        currency: formData.currency,
        description: formData.description,
        featuredImage: formData.featuredImage,
        images: formData.images.filter(Boolean),
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
          <CardTitle className="text-base">Étape {step} sur 3</CardTitle>
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
                      Ajoutez une image principale et une galerie
                    </Typography>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Image principale</Label>
                      <AdvancedUpload
                        value={formData.featuredImage}
                        onChange={(url) => updateField("featuredImage", url)}
                        maxSizeMB={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Galerie (3 images max)</Label>
                      <div className="grid grid-cols-3 gap-4">
                        {[...Array(3)].map((_, i) => (
                          <AdvancedUpload
                            key={i}
                            value={formData.images[i] || ""}
                            onChange={(url) => {
                              const next = [...formData.images];
                              next[i] = url;
                              updateField("images", next);
                            }}
                            maxSizeMB={3}
                            className="aspect-square"
                          />
                        ))}
                      </div>
                    </div>
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
                    <Typography variant="h2" weight="bold">
                      Aperçu
                    </Typography>
                    <Typography variant="body-sm" theme="muted">
                      Vérifiez avant confirmation
                    </Typography>
                  </div>
                  <div className="relative rounded-xl overflow-hidden border">
                    <div className="h-40 bg-gradient-to-r from-primary/20 to-primary/10 relative">
                      {formData.featuredImage ? (
                        <img
                          src={formData.featuredImage}
                          alt="Produit"
                          className="w-full h-full object-cover"
                        />
                      ) : formData.images[0] ? (
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
                      <Typography variant="h3" weight="bold" className="mb-2">
                        {formData.name || "Nouveau produit"}
                      </Typography>
                      {formData.description && (
                        <Typography
                          variant="body-base"
                          theme="muted"
                          className="mb-4"
                        >
                          {formData.description}
                        </Typography>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                          <Badge variant="secondary">{formData.currency}</Badge>
                          <Badge variant="outline">
                            {formData.images.filter(Boolean).length} image(s)
                          </Badge>
                        </div>
                        <Typography
                          variant="body-lg"
                          weight="bold"
                          className="text-primary"
                        >
                          {formData.price || "0.00"} {formData.currency}
                        </Typography>
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
          {step < 3 ? (
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
