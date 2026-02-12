"use client";

import React, { useMemo, useState } from "react";
import { Typography } from "@/components/ui/typography";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QrScanner } from "@/components/shared/qr-scanner";
import { decodeTransactionQR } from "@/utils/qr-utils";
import { toast } from "sonner";
import { PinVerification } from "@/components/pages/transactions/create/pin-verification";
import { getTransactionFees, createTransaction } from "@/actions/transactions";
import { useUserProfile } from "@/hooks/use-profile";
import { getProductById } from "@/actions/products";
import { getGameItemById } from "@/actions/games";
import { getTournamentEditionById } from "@/actions/tournaments";
import { TransactionType } from "@/types/transaction-types";
type DetectedPayload =
  | {
      type: TransactionType;
      targetId?: string;
      amount?: number;
      label?: string;
      extra?: Record<string, any>;
    }
  | null;

export function QrTransaction() {
  const { data: completeData } = useUserProfile({ mode: "partial", relations: ["wallet"] });
  const walletId = completeData?.wallet?.id || "";
  const [detected, setDetected] = useState<DetectedPayload>(null);
  const [fees, setFees] = useState({ fees: 0, total: 0 });
  const [step, setStep] = useState<"SCAN" | "SUMMARY" | "PIN" | "DONE">("SCAN");
  const [isLoading, setIsLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [scanningEnabled, setScanningEnabled] = useState(true);

  const canTransact = useMemo(() => !!walletId, [walletId]);

  const detectEntity = async (type: TransactionType, id?: string, amount?: number) => {
    if (!type) return { label: "", amount: amount || 0, extra: {} };
    if (type === "PRODUCT_PURCHASE" && id) {
      const product = await getProductById(id);
      return { label: product?.name || "Produit", amount: amount ?? parseFloat(product?.price || "0"), extra: {} };
    }
    if (type === "GAME_ITEM_PURCHASE" && id) {
      const item = await getGameItemById(id);
      return { label: item?.name || "Item", amount: amount ?? parseFloat(item?.priceGtc || "0"), extra: { gameId: item?.gameId } };
    }
    if (type === "TOURNAMENT_PARTICIPATION" && id) {
      const edition = await getTournamentEditionById(id);
      return { label: edition?.name || "Édition", amount: amount ?? parseFloat(edition?.entryFee || "0"), extra: { tournamentId: edition?.tournamentId, editionNumber: edition?.editionNumber } };
    }
    if (type === "VIP_SUBSCRIPTION") {
      return { label: "Abonnement VIP", amount: amount || 0, extra: {} };
    }
    return { label: "", amount: amount || 0, extra: {} };
  };

  const handleScan = async (data: string) => {
    try {
      const decoded = decodeTransactionQR(data);
      if (!decoded) {
        toast.error("QR non pris en charge");
        return;
      }
      const type = decoded.t as TransactionType;
      const targetId = decoded.id;
      const amount = typeof decoded.a === "number" ? decoded.a : undefined;
      const detectedInfo = await detectEntity(type, targetId, amount);
      const feesObj = await getTransactionFees(type, detectedInfo.amount || 0);
      setDetected({
        type,
        targetId,
        amount: detectedInfo.amount || 0,
        label: detectedInfo.label,
        extra: { ...(decoded.m || {}), ...detectedInfo.extra },
      });
      setFees({ fees: feesObj.fees, total: (detectedInfo.amount || 0) + feesObj.fees });
      setScanningEnabled(false);
      setStep("SUMMARY");
      toast.success("QR détecté");
    } catch {
      toast.error("QR invalide");
    }
  };

  const handleProceed = () => {
    if (!canTransact || !detected) {
      toast.error("Wallet requis");
      return;
    }
    setStep("PIN");
  };

  const handleVerifyPin = async (pin: string) => {
    if (!detected || !walletId) return;
    setIsLoading(true);
    try {
      const tx = await createTransaction({
        walletId,
        type: detected.type === "PRODUCT_PURCHASE" ? "PURCHASE" : detected.type,
        amount: String(detected.amount || 0),
        description: detected.label,
        metadata: {
          targetId: detected.targetId,
          ...detected.extra,
          amount: String(detected.amount || 0),
        },
      });
      setTransactionId(tx.id);
      setStep("DONE");
      toast.success("Transaction effectuée");
    } catch (err: any) {
      toast.error(err?.message || "Échec de la transaction");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <Typography variant="h3" weight="bold">
          Scanner et Payer
        </Typography>
        <Typography variant="body-base" theme="muted">
          Scannez le QR de produit, item ou édition
        </Typography>
      </div>

      {step === "SCAN" && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <QrScanner onScan={handleScan} active={scanningEnabled} />
            <div className="text-center">
              <Typography variant="caption1" theme="muted">
                Placez le QR dans le cadre
              </Typography>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" className="h-10 rounded-xl" onClick={() => setScanningEnabled(false)}>
                Arrêter
              </Button>
              <Button variant="secondary" className="h-10 rounded-xl" onClick={() => setScanningEnabled(true)}>
                Relancer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === "SUMMARY" && detected && (
        <Card>
          <CardContent className="p-6 space-y-4">
            <Typography variant="h4" className="font-black italic uppercase tracking-tighter">
              {detected.label}
            </Typography>
            <div className="flex items-center justify-between">
              <Typography variant="body-sm" theme="muted">Montant</Typography>
              <Typography variant="body-sm" weight="bold">{(detected.amount || 0).toFixed(2)} GTC</Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="body-sm" theme="muted">Frais</Typography>
              <Typography variant="body-sm" weight="bold">{fees.fees.toFixed(2)} GTC</Typography>
            </div>
            <div className="flex items-center justify-between">
              <Typography variant="body-sm" theme="muted">Total</Typography>
              <Typography variant="body-sm" weight="bold">{fees.total.toFixed(2)} GTC</Typography>
            </div>
            <Button className="w-full h-12 rounded-xl font-bold" onClick={handleProceed}>
              Continuer
            </Button>
          </CardContent>
        </Card>
      )}

      {step === "PIN" && detected && (
        <PinVerification
          onVerify={handleVerifyPin}
          onBack={() => setStep("SUMMARY")}
          isLoading={isLoading}
          transactionDetails={{
            type: detected.type,
            amount: detected.amount || 0,
            fees: fees.fees,
            totalAmount: fees.total,
          }}
        />
      )}

      {step === "DONE" && (
        <Card>
          <CardContent className="p-6 space-y-4 text-center">
            <Typography variant="h3" weight="bold">Paiement Réussi</Typography>
            <Typography variant="body-sm" theme="muted">
              Référence: {transactionId}
            </Typography>
            <Button className="w-full h-12 rounded-xl font-bold" onClick={() => { setDetected(null); setStep("SCAN"); }}>
              Nouvelle opération
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
