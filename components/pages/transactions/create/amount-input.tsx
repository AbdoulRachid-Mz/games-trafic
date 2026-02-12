"use client";

import React from "react";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TransactionType, TransactionEntity } from "@/types/transaction-types";
import { ArrowLeft, ArrowRight, Wallet, Info } from "lucide-react";

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
  onContinue,
  onBack,
}: TransactionAmountInputProps) {
  const isDeposit = transactionType === "DEPOSIT";
  const isWithdrawal = transactionType === "WITHDRAWAL";
  const isTransfer = transactionType === "TRANSFER";
  const isGameItem = transactionType === "GAME_ITEM_PURCHASE";
  const isVip = transactionType === "VIP_SUBSCRIPTION";
  const isTournamentParticipation = transactionType === "TOURNAMENT_PARTICIPATION";

  // Selon l'utilisateur: seulement requests (deposit/withdrawal), game-items et transfert 
  // ont besoin de champ pour le montant/quantité.
  const isFixedPrice =
    isVip ||
    (!!entity?.price && (isTournamentParticipation || !isGameItem));
  const itemType =
    (entity as any)?.metadata?.type?.toString()?.toUpperCase() ||
    (entity as any)?.type?.toString()?.toUpperCase() ||
    "";
  const requiresAmountInput =
    isDeposit ||
    isWithdrawal ||
    isTransfer ||
    (isGameItem && (itemType === "COIN" || itemType === "CURRENCY")) ||
    !isFixedPrice;

  const hasSufficientBalance =
    isDeposit ||
    (walletBalance !== undefined && fees.totalAmount <= walletBalance);

  const quickAmounts = isDeposit
    ? [500, 1000, 5000, 10000]
    : transactionType === "TRANSFER"
      ? [100, 500, 1000, 2000]
      : [];

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <Typography variant="h3" weight="bold">
          {requiresAmountInput ? "Quel montant ?" : "Confirmer l'achat"}
        </Typography>
        <Typography variant="body-base" theme="muted">
          {isDeposit
            ? "Saisissez le montant à recharger"
            : "Saisissez le montant de la transaction"}
        </Typography>
      </div>

      <Card className="bg-card/40 backdrop-blur-xl border-border/50 shadow-2xl overflow-hidden">
        <CardContent className="p-8">
          {entity && (
            <div className="mb-8 p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center justify-between">
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
          )}

          {requiresAmountInput && (
            <div className="space-y-8">
              <div className="relative flex justify-center py-4">
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    placeholder="0.00"
                    value={amount || ""}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    className="text-6xl font-black h-24 text-center border-none bg-transparent focus-visible:ring-0 shadow-none p-0 w-full min-w-[200px] max-w-[400px]"
                    min="0"
                    step="0.01"
                    autoFocus
                  />
                  <span className="absolute top-1/2 -right-12 -translate-y-1/2 text-2xl font-bold text-muted-foreground">
                    GTC
                  </span>
                </div>
              </div>

              {quickAmounts.length > 0 && (
                <div className="flex flex-wrap justify-center gap-3">
                  {quickAmounts.map((quickAmount) => (
                    <button
                      key={quickAmount}
                      onClick={() => onChange(quickAmount)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold transition-all border",
                        amount === quickAmount
                          ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/25"
                          : "bg-card/50 border-border hover:border-primary/50 hover:bg-card/80"
                      )}
                    >
                      {quickAmount} GTC
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="my-8 h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          {/* Breakdown Info */}
          <div className="space-y-3 bg-card/30 rounded-xl p-4 border border-border/50">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-bold">
                {(entity?.price || amount || 0).toFixed(2)} GTC
              </span>
            </div>
            {fees.percentage > 0 && (
              <div className="flex justify-between items-center text-sm text-orange-500">
                <span className="flex items-center gap-1">
                  Frais <Info className="w-3 h-3" />
                </span>
                <span className="font-bold">+{fees.amount.toFixed(2)} GTC</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-border/50">
              <span className="font-bold text-lg">Total</span>
              <span className="font-black text-xl text-primary">
                {fees.totalAmount.toFixed(2)} GTC
              </span>
            </div>
          </div>

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
            (!amount && !entity?.price) ||
            (amount <= 0 && !entity?.price) ||
            !hasSufficientBalance
          }
          className="flex-1 h-12 gap-2 text-base font-bold rounded-xl shadow-lg shadow-primary/20"
        >
          Continuer <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
