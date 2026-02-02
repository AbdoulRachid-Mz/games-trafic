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
  AlertCircle,
  CreditCard,
  Building,
  Wallet,
  Banknote,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionWithdrawalFormProps {
  onSubmit: (details: any) => void;
  onBack: () => void;
}

const PAYMENT_METHODS = [
  {
    id: "BANK_TRANSFER",
    label: "Virement bancaire",
    icon: Building,
    color: "bg-blue-500/10 text-blue-600",
    description: "2-3 jours ouvrés",
  },
  {
    id: "MOBILE_MONEY",
    label: "Mobile Money",
    icon: Wallet,
    color: "bg-orange-500/10 text-orange-600",
    description: "Recommandé • Rapide",
  },
  {
    id: "WESTERN_UNION",
    label: "Western Union",
    icon: Banknote,
    color: "bg-yellow-500/10 text-yellow-600",
    description: "Agences/Points de retrait",
  },
  {
    id: "CRYPTO",
    label: "Cryptomonnaie",
    icon: "₿",
    color: "bg-purple-500/10 text-purple-600",
    description: "Moins de 24h",
  },
];

const BANK_OPTIONS = ["BNI", "BOA", "ECOBANK", "UBA", "SGBC", "BGFI"];
const MOBILE_MONEY_OPTIONS = ["MTN", "ORANGE", "WAVE", "MOOV"];

export function TransactionWithdrawalForm({
  onSubmit,
  onBack,
}: TransactionWithdrawalFormProps) {
  const [formData, setFormData] = useState({
    paymentMethod: "",
    paymentProvider: "",
    paymentAccountId: "",
    accountHolderName: "",
    bankName: "",
    swiftCode: "",
    iban: "",
    notes: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulation
    await new Promise((resolve) => setTimeout(resolve, 1000));

    onSubmit({
      ...formData,
      submittedAt: new Date().toISOString(),
    });

    setLoading(false);
  };

  const getProviders = () => {
    switch (formData.paymentMethod) {
      case "BANK_TRANSFER":
        return BANK_OPTIONS;
      case "MOBILE_MONEY":
        return MOBILE_MONEY_OPTIONS;
      case "WESTERN_UNION":
        return ["WESTERN_UNION"];
      case "CRYPTO":
        return ["BITCOIN", "ETHEREUM", "USDT"];
      default:
        return [];
    }
  };

  const renderFormFields = () => {
    switch (formData.paymentMethod) {
      case "BANK_TRANSFER":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du bénéficiaire</Label>
                <Input
                  className="bg-background/50 h-11"
                  placeholder="Nom complet"
                  value={formData.accountHolderName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      accountHolderName: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Nom de la banque</Label>
                <Input
                  className="bg-background/50 h-11"
                  placeholder="Nom de la banque"
                  value={formData.bankName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      bankName: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Numéro de compte / IBAN</Label>
                <Input
                  className="bg-background/50 h-11 transition-all"
                  placeholder="IBAN ou numéro de compte"
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
                <Label>Code SWIFT/BIC</Label>
                <Input
                  className="bg-background/50 h-11"
                  placeholder="Code SWIFT"
                  value={formData.swiftCode}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      swiftCode: e.target.value,
                    }))
                  }
                  required
                />
              </div>
            </div>
          </motion.div>
        );

      case "MOBILE_MONEY":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Numéro de téléphone</Label>
              <Input
                className="bg-background/50 h-11 text-lg font-mono tracking-wide"
                placeholder="+225 XX XX XX XX XX"
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
              <Label>Nom du titulaire</Label>
              <Input
                className="bg-background/50 h-11"
                placeholder="Nom complet tel qu'enregistré"
                value={formData.accountHolderName}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    accountHolderName: e.target.value,
                  }))
                }
                required
              />
            </div>
          </motion.div>
        );

      case "CRYPTO":
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            <div className="bg-blue-500/5 p-4 rounded-lg border border-blue-500/20">
              <p className="text-sm text-blue-500">
                Assurez-vous que l'adresse correspond au réseau sélectionné. Les
                transferts vers de mauvaises adresses sont irréversibles.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Adresse du wallet</Label>
              <Input
                className="bg-background/50 h-11 font-mono text-sm"
                placeholder="0x..."
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
              <Label>Réseau blockchain</Label>
              <Select
                value={formData.paymentProvider}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, paymentProvider: value }))
                }
              >
                <SelectTrigger className="h-11 bg-background/50">
                  <SelectValue placeholder="Sélectionnez un réseau" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ETHEREUM">Ethereum (ERC-20)</SelectItem>
                  <SelectItem value="BITCOIN">Bitcoin</SelectItem>
                  <SelectItem value="TRON">Tron (TRC-20)</SelectItem>
                  <SelectItem value="BSC">Binance Smart Chain</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <Typography variant="h3" weight="bold">
          Retrait de fonds
        </Typography>
        <Typography variant="body-base" theme="muted">
          Où souhaitez-vous transférer votre argent ?
        </Typography>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-8">
              {/* Selection Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PAYMENT_METHODS.map((method) => (
                  <div
                    key={method.id}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentMethod: method.id,
                        paymentProvider: "",
                        paymentAccountId: "",
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
                        {typeof method.icon === "string" ? (
                          <span className="text-xl font-bold">
                            {method.icon}
                          </span>
                        ) : (
                          <method.icon className="w-5 h-5" />
                        )}
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

                    {formData.paymentMethod !== "CRYPTO" && (
                      <div className="space-y-2">
                        <Label>Fournisseur</Label>
                        <Select
                          value={formData.paymentProvider}
                          onValueChange={(value) =>
                            setFormData((prev) => ({
                              ...prev,
                              paymentProvider: value,
                            }))
                          }
                        >
                          <SelectTrigger className="h-11 bg-background/50">
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
                    )}

                    {renderFormFields()}

                    <div className="space-y-2">
                      <Label>Note pour l'admin (Optionnel)</Label>
                      <Textarea
                        className="bg-background/50 min-h-[80px]"
                        placeholder="Instructions spéciales..."
                        value={formData.notes}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                      <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                      <div className="space-y-1">
                        <Typography
                          variant="body-sm"
                          weight="medium"
                          className="text-amber-800 dark:text-amber-300"
                        >
                          Important
                        </Typography>
                        <Typography
                          variant="caption2"
                          className="text-amber-800/80 dark:text-amber-300/80"
                        >
                          • Délai de traitement: 24-48h
                          <br />• Vérifiez deux fois les coordonnées bancaires
                        </Typography>
                      </div>
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
                disabled={loading}
                className="flex-1 h-12 rounded-xl font-bold"
              >
                Retour
              </Button>
              <Button
                type="submit"
                disabled={!formData.paymentMethod || loading}
                className="flex-1 h-12 rounded-xl font-bold shadow-lg shadow-primary/25"
              >
                {loading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Traitement...
                  </>
                ) : (
                  "Valider le retrait"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
