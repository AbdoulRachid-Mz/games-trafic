"use client";

import React, { useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  AlertCircle,
  CreditCard,
  Building,
  Wallet,
  Check,
  Bitcoin,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionDepositFormProps {
  onSubmit: (details: any) => void;
  onBack: () => void;
}

const PAYMENT_METHODS = [
  {
    id: "BANK_TRANSFER",
    label: "Virement Bancaire",
    icon: Building,
    description: "24-48h • Sans frais",
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  {
    id: "MOBILE_MONEY",
    label: "Mobile Money",
    icon: Wallet,
    description: "Instantané • 1% frais",
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  {
    id: "CRYPTO",
    label: "Cryptomonnaie",
    icon: Bitcoin,
    description: "Instantané • Frais réseau",
    color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  },
  {
    id: "CREDIT_CARD",
    label: "Carte Bancaire",
    icon: CreditCard,
    description: "Instantané • 2.5% frais",
    color: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  },
];

const PAYMENT_PROVIDERS = {
  BANK_TRANSFER: ["BNI", "BOA", "ECOBANK", "UBA"],
  MOBILE_MONEY: ["MTN", "ORANGE", "WAVE", "MOOV"],
  CRYPTO: ["BITCOIN", "ETHEREUM", "USDT"],
};

export function TransactionDepositForm({
  onSubmit,
  onBack,
}: TransactionDepositFormProps) {
  const [formData, setFormData] = useState({
    paymentMethod: "",
    paymentProvider: "",
    paymentAccountId: "",
    paymentReference: "",
    notes: "",
    proofImage: null as File | null,
  });

  const [uploading, setUploading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // Simulate upload
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setFormData((prev) => ({ ...prev, proofImage: file }));
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  const getProviders = () => {
    if (!formData.paymentMethod) return [];
    return (
      PAYMENT_PROVIDERS[
        formData.paymentMethod as keyof typeof PAYMENT_PROVIDERS
      ] || []
    );
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <Typography variant="h3" weight="bold">
          Détails du paiement
        </Typography>
        <Typography variant="body-base" theme="muted">
          Choisissez votre méthode de paiement préférée
        </Typography>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-8">
              {/* Payment Method Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((method) => (
                  <div
                    key={method.id}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentMethod: method.id,
                        paymentProvider: "",
                      }))
                    }
                    className={cn(
                      "relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:bg-muted/50",
                      formData.paymentMethod === method.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-transparent bg-muted/30"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className={cn("p-2.5 rounded-lg", method.color)}>
                        <method.icon className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <span className="block font-bold text-sm">
                          {method.label}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {method.description}
                        </span>
                      </div>
                    </div>
                    {formData.paymentMethod === method.id && (
                      <div className="absolute top-2 right-2 text-primary">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {formData.paymentMethod && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6"
                  >
                    <div className="border-t border-border/50 pt-6" />

                    {/* Provider Selection */}
                    <div className="space-y-2">
                      <Label>Fournisseur de service</Label>
                      <Select
                        value={formData.paymentProvider}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            paymentProvider: value,
                          }))
                        }
                      >
                        <SelectTrigger className="h-12 bg-background/50">
                          <SelectValue placeholder="Sélectionnez un fournisseur" />
                        </SelectTrigger>
                        <SelectContent>
                          {getProviders().map((provider) => (
                            <SelectItem key={provider} value={provider}>
                              {provider}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Account Details */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>
                          {formData.paymentMethod === "CRYPTO"
                            ? "Votre adresse Wallet (Source)"
                            : formData.paymentMethod === "BANK_TRANSFER"
                            ? "Numéro de compte / IBAN Emetteur"
                            : "Numéro de téléphone"}
                        </Label>
                        <Input
                          className="h-12 bg-background/50"
                          placeholder={
                            formData.paymentMethod === "CRYPTO"
                              ? "0x..."
                              : "Entrez les détails"
                          }
                          value={formData.paymentAccountId}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              paymentAccountId: e.target.value,
                            }))
                          }
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Référence de transaction</Label>
                        <Input
                          className="h-12 bg-background/50 font-mono text-sm"
                          placeholder="ID de transaction / Référence"
                          value={formData.paymentReference}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              paymentReference: e.target.value,
                            }))
                          }
                          required
                        />
                        <p className="text-xs text-muted-foreground">
                          Collez l'ID de transaction fourni par votre
                          application de paiement.
                        </p>
                      </div>
                    </div>

                    {/* Upload Proof */}
                    <div className="space-y-2">
                      <Label>Preuve de paiement (Reçu)</Label>
                      <div className="border-2 border-dashed border-muted-foreground/20 rounded-xl p-8 hover:border-primary/50 transition-colors bg-muted/5 group text-center relative overflow-hidden">
                        <input
                          type="file"
                          id="proof-upload"
                          className="hidden"
                          accept="image/*,.pdf"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileUpload(file);
                          }}
                        />
                        <label
                          htmlFor="proof-upload"
                          className="cursor-pointer block relative z-10"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <div className="p-3 bg-muted rounded-full group-hover:scale-110 transition-transform duration-300">
                              <Upload className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <div className="space-y-1">
                              <span className="block text-sm font-bold text-foreground">
                                Cliquez pour ajouter le reçu
                              </span>
                              <span className="block text-xs text-muted-foreground">
                                PNG, JPG ou PDF (Max 5MB)
                              </span>
                            </div>
                          </div>
                        </label>
                        {formData.proofImage && (
                          <div className="absolute inset-0 bg-green-500/10 backdrop-blur-sm flex items-center justify-center z-20">
                            <div className="text-center">
                              <div className="mx-auto w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mb-2">
                                <Check className="w-5 h-5 text-white" />
                              </div>
                              <p className="text-xs font-bold text-green-700 dark:text-green-400 truncate max-w-[200px] px-2">
                                {formData.proofImage.name}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  setFormData((prev) => ({
                                    ...prev,
                                    proofImage: null,
                                  }));
                                }}
                                className="text-[10px] uppercase font-bold text-red-500 mt-2 hover:underline"
                              >
                                Supprimer
                              </button>
                            </div>
                          </div>
                        )}
                        {uploading && (
                          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-30">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                      <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400 shrink-0" />
                      <p className="text-xs text-orange-800 dark:text-orange-300">
                        Votre dépôt sera validé manuellement après vérification
                        de la preuve de paiement. Cela peut prendre quelques
                        heures.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="p-6 bg-muted/30 border-t border-border/50 flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={onBack}
                className="flex-1 h-12 rounded-xl font-bold"
              >
                Retour
              </Button>
              <Button
                type="submit"
                disabled={
                  !formData.paymentMethod ||
                  !formData.paymentProvider ||
                  !formData.paymentAccountId ||
                  !formData.proofImage
                }
                className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/25"
              >
                Confirmer le dépôt
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
