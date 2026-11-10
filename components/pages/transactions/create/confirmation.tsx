"use client";

import React from "react";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";
import {
  CheckCircle,
  AlertCircle,
  Copy,
  User,
  ShoppingBag,
  Palette,
  Trophy,
  GamepadIcon,
  Star,
  Wallet,
  CreditCard,
  Building,
  ArrowRight,
} from "lucide-react";
import { TransactionType, TransactionEntity } from "@/types/transaction-types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface TransactionConfirmationProps {
  transactionData: {
    type: TransactionType;
    amount: number;
    fees: number;
    totalAmount: number;
    entity?: TransactionEntity;
    recipientUser?: {
      id: string;
      name: string;
      walletNumber: string;
    };
    metadata?: Record<string, any>;
  };
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function TransactionConfirmation({
  transactionData,
  onConfirm,
  onCancel,
  isLoading = false,
}: TransactionConfirmationProps) {
  const transactionReference = `TX-${Date.now().toString().slice(-8)}`;

  const getTypeIcon = () => {
    switch (transactionData.type) {
      case "THEME_PURCHASE":
        return Palette;
      case "VIP_SUBSCRIPTION":
        return Star;
      case "ORDER_PURCHASE":
        return ShoppingBag;
      case "TOURNAMENT_PARTICIPATION":
        return Trophy;
      case "GAME_ITEM_PURCHASE":
        return GamepadIcon;
      case "DEPOSIT":
        return Wallet;
      case "WITHDRAWAL":
        return CreditCard;
      case "TRANSFER":
        return User;
      default:
        return ShoppingBag;
    }
  };

  const getTypeLabel = () => {
    switch (transactionData.type) {
      case "THEME_PURCHASE":
        return "Achat de thème";
      case "VIP_SUBSCRIPTION":
        return "Abonnement VIP";
      case "ORDER_PURCHASE":
        return "Achat de produit";
      case "TOURNAMENT_PARTICIPATION":
        return "Participation tournoi";
      case "GAME_ITEM_PURCHASE":
        return "Achat d'item de jeu";
      case "DEPOSIT":
        return "Dépôt";
      case "WITHDRAWAL":
        return "Retrait";
      case "TRANSFER":
        return "Transfert";
      default:
        return "Transaction";
    }
  };

  const getTypeColor = () => {
    switch (transactionData.type) {
      case "DEPOSIT":
        return "text-green-500 from-green-500/20 to-green-500/5";
      case "TRANSFER":
        return "text-blue-500 from-blue-500/20 to-blue-500/5";
      case "WITHDRAWAL":
        return "text-amber-500 from-amber-500/20 to-amber-500/5";
      default:
        return "text-purple-500 from-purple-500/20 to-purple-500/5";
    }
  };

  const TypeIcon = getTypeIcon();

  // Sémantique des frais (convention serveur §3.2 — actions/transactions.ts) :
  // - DEPOSIT/WITHDRAWAL passent par createRequest : AUCUN frais facturé
  //   dans ce parcours (l'admin valide ensuite) → on ne les affiche pas ci
  //   dessous (des frais estimés laissaient croire à un prélèvement) ;
  // - TRANSFER/WITHDRAWAL/TOURNAMENT_PARTICIPATION : frais AJOUTÉS au payeur
  //   (total débité = montant + frais) et le destinataire reçoit le plein
  //   montant ;
  // - achats : le payeur débite le montant seul (frais sur le vendeur) —
  //   un « montant reçu » n'a donc pas de sens ici.
  const isRequestFlow =
    transactionData.type === "DEPOSIT" || transactionData.type === "WITHDRAWAL";
  const isTransfer = transactionData.type === "TRANSFER";
  const feesShown = !isRequestFlow && transactionData.fees > 0;
  const amountReceived = transactionData.amount; // le destinataire reçoit plein montant

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Vous pourriez ajouter un toast ici
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4 border border-primary/20"
        >
          <CheckCircle className="h-8 w-8 text-primary" />
        </motion.div>
        <Typography variant="h3" weight="bold">
          Confirmation
        </Typography>
        <Typography variant="body-base" theme="muted">
          Vérifiez les détails avant de confirmer définitivement
        </Typography>
      </div>

      <Card className="bg-card border-border/50 shadow-xl overflow-hidden">
        <CardContent className="p-0">
          <div className="p-6 space-y-8">
            {/* Main Summary Card */}
            <div className="relative rounded-2xl overflow-hidden border border-border/50">
              <div
                className={cn(
                  "absolute inset-0 bg-linear-to-br opacity-50",
                  getTypeColor()
                )}
              />
              <div className="relative p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-background/50 border border-border/30 shadow-sm">
                      <TypeIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <Typography variant="body-lg" weight="bold">
                        {getTypeLabel()}
                      </Typography>
                      <div className="flex items-center gap-2 opacity-70">
                        <Typography variant="caption1" className="font-mono">
                          {transactionReference}
                        </Typography>
                      </div>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-background/30 border-border/30"
                  >
                    {format(new Date(), "dd/MM/yyyy")}
                  </Badge>
                </div>

                <div className="flex flex-col gap-2 p-4 rounded-xl bg-background/40 border border-border/30">
                  <div className="flex justify-between items-center">
                    <Typography variant="body-sm" theme="muted">
                      Montant brut
                    </Typography>
                    <Typography variant="body-lg" weight="bold">
                      {transactionData.amount.toFixed(2)} GTC
                    </Typography>
                  </div>
                  {feesShown && (
                    <div className="flex justify-between items-center">
                      <Typography variant="body-sm" theme="muted">
                        Frais
                      </Typography>
                      <Typography variant="body-sm" weight="medium">
                        {transactionData.fees.toFixed(2)} GTC
                      </Typography>
                    </div>
                  )}
                  <Separator className="bg-white/10 my-1" />
                  <div className="flex justify-between items-center">
                    <Typography variant="body-lg" weight="bold">
                      {isRequestFlow && transactionData.type === "DEPOSIT"
                        ? "Montant du dépôt"
                        : "Montant débité"}
                    </Typography>
                    <Typography
                      variant="h3"
                      weight="extrabold"
                      className="text-primary"
                    >
                      {(isRequestFlow
                        ? transactionData.amount
                        : transactionData.totalAmount
                      ).toFixed(2)}{" "}
                      <span className="text-lg font-bold opacity-70">GTC</span>
                    </Typography>
                  </div>
                  {isTransfer && (
                    <div className="flex justify-between items-center">
                      <Typography variant="body-sm" theme="muted">
                        Le destinataire reçoit
                      </Typography>
                      <Typography variant="body-sm" weight="medium">
                        {amountReceived.toFixed(2)} GTC
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Detailed Info */}
            <div className="space-y-6">
              {/* Entity Info */}
              {transactionData.entity && (
                <div className="space-y-3">
                  <Typography
                    variant="body-sm"
                    weight="bold"
                    theme="muted"
                    className="uppercase tracking-wider"
                  >
                    Détails de l'élément
                  </Typography>
                  <div className="bg-muted/20 rounded-xl p-4 border border-border/50">
                    <div className="flex justify-between mb-2">
                      <Typography variant="body-sm" theme="muted">
                        Nom
                      </Typography>
                      <Typography variant="body-sm" weight="medium">
                        {transactionData.entity.name}
                      </Typography>
                    </div>
                    {transactionData.entity.description && (
                      <div className="flex justify-between mb-2">
                        <Typography variant="body-sm" theme="muted">
                          Description
                        </Typography>
                        <Typography
                          variant="body-sm"
                          className="text-right max-w-[200px] truncate opacity-80"
                        >
                          {transactionData.entity.description}
                        </Typography>
                      </div>
                    )}
                    {transactionData.entity.metadata?.seller && (
                      <div className="flex justify-between">
                        <Typography variant="body-sm" theme="muted">
                          Vendeur
                        </Typography>
                        <Typography variant="body-sm">
                          {transactionData.entity.metadata.seller}
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recipient Info */}
              {transactionData.type === "TRANSFER" &&
                transactionData.recipientUser && (
                  <div className="space-y-3">
                    <Typography
                      variant="body-sm"
                      weight="bold"
                      theme="muted"
                      className="uppercase tracking-wider"
                    >
                      Destinataire
                    </Typography>
                    <div className="flex items-center justify-between bg-muted/20 rounded-xl p-4 border border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <Typography variant="body-sm" weight="bold">
                            {transactionData.recipientUser.name}
                          </Typography>
                          <Typography
                            variant="caption1"
                            theme="muted"
                            className="font-mono"
                          >
                            {transactionData.recipientUser.walletNumber}
                          </Typography>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Payment/Withdrawal Details */}
              {(transactionData.type === "DEPOSIT" ||
                transactionData.type === "WITHDRAWAL") && (
                <div className="space-y-3">
                  <Typography
                    variant="body-sm"
                    weight="bold"
                    theme="muted"
                    className="uppercase tracking-wider"
                  >
                    {transactionData.type === "DEPOSIT"
                      ? "Moyen de paiement"
                      : "Compte de retrait"}
                  </Typography>
                  <div className="bg-muted/20 rounded-xl p-4 border border-border/50 space-y-2">
                    {transactionData.metadata?.paymentMethod && (
                      <div className="flex justify-between">
                        <Typography variant="body-sm" theme="muted">
                          Méthode
                        </Typography>
                        <Typography variant="body-sm" weight="medium">
                          {transactionData.metadata.paymentMethod}
                        </Typography>
                      </div>
                    )}
                    {transactionData.metadata?.paymentProvider && (
                      <div className="flex justify-between">
                        <Typography variant="body-sm" theme="muted">
                          Fournisseur
                        </Typography>
                        <Typography variant="body-sm" weight="medium">
                          {transactionData.metadata.paymentProvider}
                        </Typography>
                      </div>
                    )}
                    {transactionData.metadata?.paymentAccountId && (
                      <div className="flex justify-between">
                        <Typography variant="body-sm" theme="muted">
                          Compte/Numéro
                        </Typography>
                        <Typography variant="body-sm" className="font-mono">
                          {transactionData.metadata.paymentAccountId}
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes */}
              {transactionData.metadata?.notes && (
                <div className="space-y-3">
                  <Typography
                    variant="body-sm"
                    weight="bold"
                    theme="muted"
                    className="uppercase tracking-wider"
                  >
                    Notes
                  </Typography>
                  <div className="bg-muted/20 rounded-xl p-4 border border-border/50">
                    <Typography variant="body-sm" className="italic opacity-80">
                      "{transactionData.metadata.notes}"
                    </Typography>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Avertissement */}
            <div className="flex gap-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="shrink-0 h-5 w-5 text-amber-500" />
              <div className="space-y-1">
                <Typography
                  variant="body-sm"
                  weight="bold"
                  className="text-amber-600 dark:text-amber-400"
                >
                  Important
                </Typography>
                <Typography
                  variant="caption1"
                  className="text-amber-600/80 dark:text-amber-400/80 leading-tight"
                >
                  {transactionData.type === "DEPOSIT" ||
                  transactionData.type === "WITHDRAWAL"
                    ? "Votre demande sera traitée manuellement par notre équipe dans un délai de 24 à 48 heures."
                    : "Cette action est irréversible. Assurez-vous que tous les détails sont corrects."}
                </Typography>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={onCancel}
                className="flex-1 h-12 rounded-xl font-bold"
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                onClick={onConfirm}
                disabled={isLoading}
                className="flex-2 h-12 rounded-xl font-bold shadow-lg shadow-primary/25"
              >
                {isLoading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                    Traitement...
                  </>
                ) : (
                  <>
                    {transactionData.type === "DEPOSIT" ||
                    transactionData.type === "WITHDRAWAL"
                      ? "Confirmer la demande"
                      : "Confirmer le paiement"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
