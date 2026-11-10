"use client";

import React from "react";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  TransactionType,
  TransactionEntity,
  resolveTransactionPricingMode,
  isCurrencyLikeGameItem,
  type TransactionPricingMode,
} from "@/types/transaction-types";
import { ArrowLeft, ArrowRight, Wallet, Info, AlertTriangle } from "lucide-react";

interface TransactionAmountInputProps {
  amount: number;
  onChange: (amount: number) => void;
  walletBalance: number;
  fees: {
    percentage: number;
    amount: number;
    totalAmount: number;
  };
  transactionType: TransactionType;
  entity?: TransactionEntity;
  alreadyVip?: boolean;
  metadata?: {
    gameAccount?: string;
    encryptedPassword?: string;
    additionalInfo?: string;
  };
  onMetadataChange?: (data: {
    gameAccount?: string;
    encryptedPassword?: string;
    additionalInfo?: string;
  }) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function TransactionAmountInput({
  amount,
  onChange,
  walletBalance,
  fees,
  transactionType,
  entity,
  alreadyVip,
  metadata,
  onMetadataChange,
  onContinue,
  onBack,
}: TransactionAmountInputProps) {
  const [qty, setQty] = React.useState<number>(1);
  const isDeposit = transactionType === "DEPOSIT";
  const isWithdrawal = transactionType === "WITHDRAWAL";
  const isTransfer = transactionType === "TRANSFER";
  const isGameItem = transactionType === "GAME_ITEM_PURCHASE";
  const isVip = transactionType === "VIP_SUBSCRIPTION";

  // Tarification explicite : FIXED (prix de référence connu, 0 compris),
  // VARIABLE (montant libre), QUANTITY (quantité × prix unitaire).
  // JAMAIS `!!entity?.price` — un prix nul reste un prix défini.
  const pricingMode = resolveTransactionPricingMode(transactionType, entity);
  const isFixedPrice = pricingMode === "FIXED";
  const isCurrencyLikeItem = isCurrencyLikeGameItem(entity);
  const requiresAmountInput = pricingMode === "VARIABLE";
  const requiresQuantity = pricingMode === "QUANTITY";
  const unitPrice = entity?.price ?? 0;
  const quantityMissingPrice = requiresQuantity && unitPrice <= 0;
  const grossAmount = amount || 0;
  const feeAmount = fees.amount || 0;
  const debitedAmount = grossAmount;
  const receivedAmount = Math.max(0, grossAmount - feeAmount);
  const [gameAccount, setGameAccount] = React.useState(metadata?.gameAccount || "");
  const [gamePassword, setGamePassword] = React.useState(metadata?.encryptedPassword || "");
  const [additionalInfo, setAdditionalInfo] = React.useState(metadata?.additionalInfo || "");

  React.useEffect(() => {
    if (!onMetadataChange || !isGameItem) return;
    onMetadataChange({
      gameAccount,
      encryptedPassword: gamePassword,
      additionalInfo,
    });
  }, [gameAccount, gamePassword, additionalInfo, isGameItem, onMetadataChange]);

  const status = entity?.metadata?.status || (entity as any)?.status;
  const isUnavailable = status && status !== "NON_VENDU";

  const hasSufficientBalance =
    isDeposit ||
    (walletBalance !== undefined && fees.totalAmount <= walletBalance);

  const MIN_AMOUNT = process.env.NEXT_PUBLIC_MIN_TRANSACTION_AMOUNT 
    ? parseFloat(process.env.NEXT_PUBLIC_MIN_TRANSACTION_AMOUNT) 
    : 100;
  
  const isMinAmountRestricted = (isTransfer || isWithdrawal) && amount > 0 && amount < MIN_AMOUNT;

  // Validité du montant pour autoriser l'étape suivante, selon le mode :
  // - VARIABLE : montant strictement positif (les crédits/débits libres) ;
  // - FIXED : prix de référence connu (0 = gratuit, autorisé) ;
  // - QUANTITY : quantité ≥ 1 et total > 0 (unitaire défini).
  const isAmountValid =
    pricingMode === "FIXED"
      ? entity?.price != null || amount > 0
      : requiresQuantity
        ? quantityMissingPrice
          ? false
          : qty >= 1 && (amount || 0) > 0
        : amount > 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <Typography variant="h3" weight="bold">
          {requiresQuantity ? "Quelle quantité ?" : requiresAmountInput ? "Quel montant ?" : "Confirmer l'achat"}
        </Typography>
        <Typography variant="body-base" theme="muted">
          {isDeposit
            ? "Saisissez le montant à recharger"
            : requiresQuantity
              ? "Saisissez la quantité à acheter"
              : "Saisissez le montant de la transaction"}
        </Typography>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden">
        <CardContent className="p-8">
          {isVip && alreadyVip && (
            <div className="mb-6 p-4 rounded-xl border border-amber-300/40 bg-amber-200/15">
              <Typography variant="body-base" className="font-bold text-amber-700">
                Vous êtes déjà VIP. Veuillez attendre l’expiration pour renouveler.
              </Typography>
            </div>
          )}

          {entity && (
            <div className="space-y-4 mb-8">
              <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
                <div>
                  <Typography variant="h5" weight="bold" className="text-primary">
                    {entity.name}
                  </Typography>
                  {entity.description && (
                    <Typography
                      variant="caption1"
                      className="text-muted-foreground"
                    >
                      {entity.description}
                    </Typography>
                  )}
                </div>
                <div className="text-right">
                  <Typography
                    variant="h4"
                    weight="bold"
                    className="text-foreground"
                  >
                    {entity.price?.toFixed(2)}{" "}
                    <span className="text-sm font-bold text-muted-foreground">
                      GTC
                    </span>
                  </Typography>
                </div>
              </div>

              {isUnavailable && (
                <div className={cn(
                  "p-4 rounded-xl border flex items-center gap-3",
                  status === "RESERVE" 
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-700" 
                    : "bg-rose-500/10 border-rose-500/20 text-rose-700"
                )}>
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <Typography variant="body-sm" weight="bold">
                    {status === "RESERVE" 
                      ? "Attention: Ce compte est déjà réservé par un autre utilisateur." 
                      : status === "VENDU" 
                        ? "Erreur: Ce compte a déjà été vendu." 
                        : `Attention: Ce compte n'est pas disponible (Statut: ${status})`}
                  </Typography>
                </div>
              )}
            </div>
          )}

          {(requiresAmountInput || requiresQuantity) && (
            <div className="space-y-8">
              <div className="relative flex justify-center py-4">
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    placeholder={requiresQuantity ? "0" : "0.00"}
                    value={
                      requiresQuantity && unitPrice > 0
                        ? Math.max(0, Math.round((amount || 0) / unitPrice))
                        : amount || ""
                    }
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      if (requiresQuantity) {
                        const total = Math.max(0, v) * unitPrice;
                        setQty(Math.max(0, v));
                        onChange(total);
                      } else {
                        onChange(v);
                      }
                    }}
                    className="text-3xl sm:text-4xl font-black h-16 sm:h-20 text-center border-none bg-transparent focus-visible:ring-0 shadow-none p-0 w-full min-w-[120px] max-w-full"
                    min="0"
                    step={requiresQuantity ? "1" : "0.01"}
                    autoFocus
                  />
                  {!requiresQuantity && (
                    <span className="absolute top-1/2 -right-10 sm:-right-12 -translate-y-1/2 text-xl sm:text-2xl font-bold text-muted-foreground">
                      GTC
                    </span>
                  )}
                </div>
              </div>

              {/* Saisie manuelle uniquement : les raccourcis de type
                  +1000/+100 (et tout équivalent) sont supprimés
                  définitivement (PROMPT.md §11) — pas de substitut. */}

              {isMinAmountRestricted && (
                <div className="flex items-center gap-2 justify-center text-red-500 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <AlertTriangle className="w-5 h-5" />
                  <Typography variant="body-sm" weight="bold">
                    Le montant minimum pour cette transaction est de {MIN_AMOUNT} GTC
                  </Typography>
                </div>
              )}

              {quantityMissingPrice && (
                <div className="flex items-center gap-2 justify-center text-amber-600 bg-amber-500/10 p-3 rounded-lg border border-amber-500/20">
                  <AlertTriangle className="w-5 h-5" />
                  <Typography variant="body-sm" weight="bold">
                    Cet article n&apos;a pas de prix unitaire défini — transaction
                    impossible.
                  </Typography>
                </div>
              )}
            </div>
          )}

          <div className="my-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Breakdown Info */}
          <div className="space-y-3 bg-card/30 rounded-xl p-4 border border-border/50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Montant brut</span>
              <span className="font-bold">
                {grossAmount.toFixed(2)} GTC
              </span>
            </div>
            {fees.percentage > 0 && (
              <div className="flex justify-between items-center text-sm text-orange-500">
                <span className="flex items-center gap-1">
                  Frais <Info className="w-3 h-3" />
                </span>
                <span className="font-bold">{feeAmount.toFixed(2)} GTC</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-border/50">
              <span className="font-bold text-sm">Montant débité</span>
              <span className="font-black text-lg text-primary">
                {debitedAmount.toFixed(2)} GTC
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Montant reçu</span>
              <span className="font-bold">{receivedAmount.toFixed(2)} GTC</span>
            </div>
          </div>

          {isGameItem && (
            <div className="mt-8 space-y-4">
              <div className="space-y-2">
                <Label>Compte de jeu</Label>
                <Input
                  className="bg-background/50 h-11"
                  placeholder="Identifiant du compte"
                  value={gameAccount}
                  onChange={(e) => setGameAccount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Mot de passe</Label>
                <Input
                  type="password"
                  className="bg-background/50 h-11"
                  placeholder="Mot de passe du compte"
                  value={gamePassword}
                  onChange={(e) => setGamePassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Infos supplémentaires</Label>
                <Textarea
                  className="bg-background/50 min-h-[90px]"
                  placeholder="Serveur, pseudo, contraintes particulières..."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                />
              </div>
            </div>
          )}

          {!isDeposit && (
            <div
              className={cn(
                "mt-6 flex items-center justify-between p-3 rounded-lg border transition-all",
                hasSufficientBalance
                  ? "bg-green-500/10 border-green-500/20"
                  : "bg-red-500/10 border-red-500/20"
              )}
            >
              <div className="flex items-center gap-2">
                <Wallet
                  className={cn(
                    "w-4 h-4",
                    hasSufficientBalance ? "text-green-500" : "text-red-500"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-bold",
                    hasSufficientBalance
                      ? "text-green-700 dark:text-green-400"
                      : "text-red-700 dark:text-red-400"
                  )}
                >
                  Solde disponible: {walletBalance?.toFixed(2) ?? "0.00"} GTC
                </span>
              </div>
              {!hasSufficientBalance && (
                <span className="text-xs font-bold text-red-500">
                  Insuffisant
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onBack}
          className="flex-1 h-12 gap-2 text-base font-bold rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </Button>
        <Button
          size="lg"
          onClick={onContinue}
          disabled={
            !isAmountValid ||
            isMinAmountRestricted ||
            !hasSufficientBalance ||
            (isVip && !!alreadyVip) ||
            isUnavailable
          }
          className="flex-1 h-12 gap-2 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
        >
          Continuer <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
