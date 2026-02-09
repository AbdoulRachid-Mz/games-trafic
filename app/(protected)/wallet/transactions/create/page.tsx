"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { useApp } from "@/contexts/app-context";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { fireConfettiPreset } from "@/utils/confetti";
import { generateTransactionReceipt } from "@/utils/pdf-generator";
import { TransactionStepper } from "@/components/pages/transactions/create/transaction-stepper";
import { TransactionTypeSelector } from "@/components/pages/transactions/create/type-selector";
import { TransactionEntitySelector } from "@/components/pages/transactions/create/entity-selector";
import { TransactionAmountInput } from "@/components/pages/transactions/create/amount-input";
import { TransactionRecipientSelector } from "@/components/pages/transactions/create/recipient-selector";
import { TransactionDepositForm } from "@/components/pages/transactions/create/deposit-form";
import { TransactionWithdrawalForm } from "@/components/pages/transactions/create/withdrawal-form";
import { PinVerification } from "@/components/pages/transactions/create/pin-verification";
import { TransactionConfirmation } from "@/components/pages/transactions/create/confirmation";
import { TransactionSuccess } from "@/components/pages/transactions/create/success";
import { createRequest } from "@/actions/requests";
import { createTransaction } from "@/actions/transactions";
import { getEntities } from "@/actions/entities";
import {
  TRANSACTION_CONFIGS,
  type TransactionType,
  type TransactionData,
  type TransactionStep,
} from "@/types/transaction-types";
import { useUserProfile } from "@/hooks/use-profile";
import { decodeTransactionQR, isValidTransactionQR } from "@/utils/qr-utils";
import { QrScanner } from "@/components/shared/qr-scanner";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CreateTransactionPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  return (
    <Suspense fallback={<TransactionSkeleton />}>
      <CreateTransactionContent searchParams={searchParams} router={router} />
    </Suspense>
  );
}

function CreateTransactionContent({
  searchParams,
  router,
}: {
  searchParams: URLSearchParams;
  router: any;
}) {
  const { user } = useAuthContext();
  const { data: completeData } = useUserProfile({
    enabled: true,
    mode: "partial",
    relations: ["wallet"],
  });
  const { settings } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [transactionData, setTransactionData] = useState<TransactionData>({
    type: null as any,
    amount: 0,
    metadata: {},
  });
  const [fees, setFees] = useState({
    percentage: 0,
    amount: 0,
    totalAmount: 0,
  });
  const [transactionId, setTransactionId] = useState<string | null>(null);

  // Récupération des paramètres d'URL et fetch de l'entité
  useEffect(() => {
    const loadTransactionFromParams = async () => {
      const type = searchParams.get("type") as TransactionType;
      const amount = searchParams.get("amount");
      const entityId = searchParams.get("entityId");
      const targetId = searchParams.get("targetId"); // Fallback

      if (type && TRANSACTION_CONFIGS[type]) {
        const config = TRANSACTION_CONFIGS[type];
        const actualEntityId = entityId || targetId;

        const newData: TransactionData = {
          type,
          amount: amount ? parseFloat(amount) : 0,
          metadata: {},
        };

        // Fetch entity from database if entityId is provided
        if (actualEntityId && config.needsTargetId) {
          try {
            const entityType = getEntityTypeFromTransactionType(type);
            if (entityType) {
              const result = await getEntities(entityType as any, {
                search: actualEntityId,
                limit: 1,
                page: 1,
              });

              // Find the specific entity by ID
              const entity = result.data.find((e: any) => e.id === actualEntityId);

              if (entity) {
                newData.targetId = actualEntityId;
                newData.entity = entity;
                if (!newData.amount && entity.priceGtc) {
                  newData.amount = parseFloat(entity.priceGtc);
                }
              }
            }
          } catch (error) {
            console.error("Error fetching entity:", error);
          }
        }

        setTransactionData(newData);

        // Calculer les étapes initiales
        const initialStepIndex = getInitialStepForType(
          type,
          config,
          !!newData.targetId
        );
        setCurrentStep(initialStepIndex);

        // Calculate fees immediately if amount is provided
        if (newData.amount > 0) {
          calculateFees(type, newData.amount);
        }
      }

      if (completeData && !completeData?.wallet) {
        toast.error("Vous devez avoir un wallet pour effectuer des transactions");
        router.push("/wallet");
      }
    };

    if (completeData) {
      loadTransactionFromParams();
    }
  }, [searchParams, completeData, router]);

  const config = transactionData.type
    ? TRANSACTION_CONFIGS[transactionData.type]
    : null;
  const steps = config?.steps || [];
  const currentStepType = steps[currentStep];

  const getInitialStepForType = (
    type: TransactionType,
    config: (typeof TRANSACTION_CONFIGS)[TransactionType],
    hasTargetId: boolean
  ): number => {
    // If entity is required but not provided, start at entity selection
    if (config.requiresEntity && !hasTargetId) {
      const entityStepIndex = config.steps.indexOf("ENTITY_SELECTION");
      return entityStepIndex >= 0 ? entityStepIndex : 0;
    }

    // If amount input is needed and no amount provided, start there
    if (config.steps.includes("AMOUNT_INPUT")) {
      const amountStepIndex = config.steps.indexOf("AMOUNT_INPUT");
      return amountStepIndex >= 0 ? amountStepIndex : 0;
    }

    // Otherwise start at first step after type selection
    return config.steps.indexOf("TYPE_SELECTION") >= 0 ? 1 : 0;
  };

  const calculateFees = async (type: TransactionType, amount: number) => {
    try {
      const response = await fetch("/api/transactions/calculate-fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors du calcul des frais");
      }
      const data = await response.json();
      const feePercentage = parseFloat(data.feePercentage?.toString() || "0");
      const feeAmount = parseFloat(data.fees?.toString() || "0");
      const totalAmount = parseFloat(data.totalAmount?.toString() || "0");

      setFees({
        percentage: feePercentage,
        amount: feeAmount,
        totalAmount,
      });

      return { feeAmount, totalAmount };
    } catch (error) {
      console.error("Error calculating fees:", error);
      const feeAmount = amount * 0.01;
      const totalAmount = amount + feeAmount;
      setFees({
        percentage: 0.01,
        amount: feeAmount,
        totalAmount,
      });
      return { feeAmount, totalAmount };
    }
  };

  const getEntityTypeFromTransactionType = (
    type: TransactionType
  ): string | null => {
    switch (type) {
      case "THEME_PURCHASE":
        return "themes";
      case "PRODUCT_PURCHASE":
        return "products";
      case "GAME_ITEM_PURCHASE":
        return "gameItems";
      case "TOURNAMENT_PARTICIPATION":
        return "tournaments";
      default:
        return null;
    }
  };

  const handleTypeSelect = (type: TransactionType | "QR_SCAN") => {
    if (type === "QR_SCAN") {
      setShowScanner(true);
      return;
    }
    setTransactionData({
      type,
      amount: 0,
      metadata: {},
    });
    setCurrentStep(0);
  };

  const handleQrScan = async (scannedData: string) => {
    const decoded = decodeTransactionQR(scannedData);
    if (decoded && isValidTransactionQR(decoded)) {
      setShowScanner(false);

      const type = decoded.t;
      const entityId = decoded.id;
      const amount = decoded.a;

      const newData: TransactionData = {
        type,
        amount: amount || 0,
        targetId: entityId,
        metadata: decoded.m || {},
      };

      // Fetch entity details
      try {
        const entityType = getEntityTypeFromTransactionType(type);
        if (entityType) {
          const result = await getEntities(entityType as any, {
            search: entityId,
            limit: 1,
            page: 1,
          });
          const entity = result.data.find((e: any) => e.id === entityId);
          if (entity) {
            newData.entity = entity;
            if (!newData.amount && entity.priceGtc) {
              newData.amount = parseFloat(entity.priceGtc);
            }
          }
        }
      } catch (err) {
        console.error("Error fetching scanned entity:", err);
      }

      setTransactionData(newData);

      const config = TRANSACTION_CONFIGS[type];
      const initialStep = getInitialStepForType(type, config, !!newData.targetId);
      setCurrentStep(initialStep);

      if (newData.amount > 0) {
        calculateFees(type, newData.amount);
      }

      toast.success("QR Code scanné avec succès");
    } else {
      toast.error("QR Code invalide ou format non supporté");
    }
  };

  const handleEntitySelect = (entity: any) => {
    const price = entity.priceGtc ? parseFloat(entity.priceGtc) : entity.price || 0;
    setTransactionData((prev) => ({
      ...prev,
      targetId: entity.id,
      entity: entity,
      amount: price || prev.amount,
    }));

    // Passer à l'étape suivante
    const nextStepIndex = steps.indexOf(currentStepType) + 1;
    if (nextStepIndex < steps.length) {
      setCurrentStep(nextStepIndex);
    }
    if (transactionData.type && (price || transactionData.amount)) {
      calculateFees(
        transactionData.type,
        price || transactionData.amount
      );
    }
  };

  const handleAmountChange = async (amount: number) => {
    setTransactionData((prev) => ({ ...prev, amount }));
    if (transactionData.type) {
      await calculateFees(transactionData.type, amount);
    }
  };

  const handleRecipientSelect = (recipient: any) => {
    setTransactionData((prev) => ({
      ...prev,
      recipientWalletId: recipient.walletId,
      recipientUser: recipient.user,
      metadata: {
        ...prev.metadata,
        recipientName: recipient.user?.name,
      },
    }));
    nextStep();
  };

  const handleDepositDetails = (details: any) => {
    setTransactionData((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        ...details,
      },
    }));
    nextStep();
  };

  const handleWithdrawalDetails = (details: any) => {
    setTransactionData((prev) => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        ...details,
      },
    }));
    nextStep();
  };

  const handleContinue = () => {
    nextStep();
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      setTransactionData({ type: null as any, amount: 0, metadata: {} });
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePinVerify = async (pin: string) => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/wallet/verify-pin", {
        method: "POST",
        body: JSON.stringify({
          walletId: completeData?.wallet?.id,
          pin,
        }),
      });

      if (!response.ok) throw new Error("PIN incorrect");
      nextStep();
    } catch {
      toast.error("Code PIN incorrect");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      // Validation des données
      if (!transactionData.type || !transactionData.amount) {
        throw new Error("Données de transaction incomplètes");
      }

      if (!completeData?.wallet?.id) {
        throw new Error("Wallet non trouvé");
      }

      // Pour les dépôts/retraits, créer une requête
      if (
        transactionData.type === "DEPOSIT" ||
        transactionData.type === "WITHDRAWAL"
      ) {
        const request = await createRequest({
          userId: user!.id,
          type: transactionData.type,
          amount: transactionData.amount.toString(),
          paymentMethod: transactionData.metadata?.paymentMethod || "WALLET",
          paymentProvider: transactionData.metadata?.paymentProvider,
          paymentAccountId: transactionData.metadata?.paymentAccountId,
        });

        if (!request)
          throw new Error("Erreur lors de la création de la requête");

        setTransactionId(request.id);
        toast.success(
          "Demande créée ! Elle sera traitée par un administrateur."
        );
        nextStep();
        return;
      }

      // Pour les autres transactions, créer directement
      const transaction = await createTransaction({
        walletId: completeData.wallet.id,
        type: transactionData.type as any,
        amount: transactionData.amount.toString(),
        description: getTransactionDescription(transactionData),
        metadata: {
          ...transactionData.metadata,
          targetId: transactionData.targetId,
          entity: transactionData.entity,
          recipientWalletId: transactionData.recipientWalletId,
          feePercentage: fees.percentage,
        },
      });

      setTransactionId(transaction.id);

      // Lancer les confettis
      await fireConfettiPreset("success");

      // Générer le PDF
      generateTransactionReceipt({
        transactionId: transaction.id,
        amount: transactionData.amount,
        type: transactionData.type,
        fees: fees.amount,
        totalAmount: fees.totalAmount,
        date: new Date(),
        reference: `TX-${transaction.id.slice(-8)}`,
        newBalance:
          parseFloat(completeData.wallet.balance || "0") - fees.totalAmount,
        entityData: transactionData.entity,
      });

      toast.success("Transaction effectuée !");
      nextStep();

      // Rediriger après 5 secondes
      setTimeout(() => {
        router.push("/transactions");
      }, 5000);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getTransactionDescription = (data: TransactionData): string => {
    switch (data.type) {
      case "THEME_PURCHASE":
        return `Achat du thème "${data.entity?.name || "Inconnu"}"`;
      case "PRODUCT_PURCHASE":
        return `Achat du produit "${data.entity?.name || "Inconnu"}"`;
      case "TOURNAMENT_PARTICIPATION":
        return `Participation au tournoi "${data.entity?.name || "Inconnu"}"`;
      case "GAME_ITEM_PURCHASE":
        return `Achat d'items de jeu "${data.entity?.name || "Inconnu"}"`;
      case "VIP_SUBSCRIPTION":
        return "Abonnement VIP";
      case "DEPOSIT":
        return "Dépôt de fonds";
      case "WITHDRAWAL":
        return "Demande de retrait";
      case "TRANSFER":
        return `Transfert à ${(data.metadata as any).recipientName || "utilisateur"
          }`;
      default:
        return "Transaction";
    }
  };

  if (!completeData?.wallet) {
    return <TransactionSkeleton />;
  }

  const renderStep = () => {
    if (showScanner) {
      return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <Typography variant="h4" className="font-black italic uppercase tracking-tighter">Scanner QR Code</Typography>
            <Button variant="ghost" size="icon" onClick={() => setShowScanner(false)} className="rounded-full">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <QrScanner onScan={handleQrScan} />
          <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10">
            <Typography variant="body-sm" className="text-center text-muted-foreground leading-relaxed">
              Placez le QR Code de transaction, d'item ou de profil dans le cadre pour scanner automatiquement.
            </Typography>
          </div>
          <Button variant="outline" onClick={() => setShowScanner(false)} className="w-full h-12 rounded-2xl font-bold">
            <ArrowLeft className="h-4 w-4 mr-2" /> Retour à la liste
          </Button>
        </div>
      );
    }

    if (!config) {
      return <TransactionTypeSelector onSelect={handleTypeSelect} />;
    }

    switch (currentStepType) {
      case "TYPE_SELECTION":
        return <TransactionTypeSelector onSelect={handleTypeSelect} />;

      case "ENTITY_SELECTION":
        return (
          <TransactionEntitySelector
            type={transactionData.type}
            onSelect={handleEntitySelect}
            onBack={handleBack}
          />
        );

      case "AMOUNT_INPUT":
        return (
          <TransactionAmountInput
            amount={transactionData.amount}
            onChange={handleAmountChange}
            walletBalance={parseFloat(completeData?.wallet?.balance || "0")}
            fees={fees}
            transactionType={transactionData.type}
            entity={transactionData.entity}
            onContinue={handleContinue}
            onBack={handleBack}
          />
        );

      case "RECIPIENT_SELECTION":
        return (
          <TransactionRecipientSelector
            onSelect={handleRecipientSelect}
            onBack={handleBack}
          />
        );

      case "DEPOSIT_DETAILS":
        return (
          <TransactionDepositForm
            onSubmit={handleDepositDetails}
            onBack={handleBack}
          />
        );

      case "WITHDRAWAL_DETAILS":
        return (
          <TransactionWithdrawalForm
            onSubmit={handleWithdrawalDetails}
            onBack={handleBack}
          />
        );

      case "PIN_VERIFICATION":
        return (
          <PinVerification
            onVerify={handlePinVerify}
            onBack={handleBack}
            isLoading={isLoading}
            transactionDetails={{
              type: transactionData.type,
              amount: transactionData.amount,
              fees: fees.amount,
              totalAmount: fees.totalAmount,
            }}
          />
        );

      case "CONFIRMATION":
        return (
          <TransactionConfirmation
            transactionData={{
              ...transactionData,
              fees: fees.amount,
              totalAmount: fees.totalAmount,
            }}
            onConfirm={handleConfirm}
            onCancel={handleBack}
            isLoading={isLoading}
          />
        );

      case "SUCCESS":
        return (
          <TransactionSuccess
            transactionId={transactionId}
            transactionData={transactionData}
            newBalance={
              parseFloat(completeData?.wallet?.balance || "0") -
              fees.totalAmount
            }
            isRequest={
              transactionData.type === "DEPOSIT" ||
              transactionData.type === "WITHDRAWAL"
            }
            onReturnHome={() => router.push("/wallet")}
            onViewHistory={() => router.push("/transactions")}
          />
        );

      default:
        return <div>Étape non reconnue</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-12 text-center md:text-left">
          <Typography variant="h1" className="mb-3 font-black italic uppercase tracking-tighter text-4xl md:text-5xl">
            {config?.label || (showScanner ? "SCANNER" : "TRANSAC")}
          </Typography>
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Typography variant="body-base" theme="muted" className="font-bold flex-1">
              {config
                ? `Étape ${currentStep + 1} sur ${steps.length}`
                : showScanner ? "Scannez un QR Code pour continuer" : "Sélectionnez le type de transaction"}
            </Typography>
            {completeData?.wallet && !showScanner && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-2xl border border-primary/20 self-center md:self-auto">
                <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Solde:</span>
                <span className="text-sm font-black text-primary">{completeData.wallet.balance} GTC</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-8">
          {config && !showScanner && (
            <TransactionStepper
              steps={steps}
              currentStep={currentStep}
              currentStepType={currentStepType}
            />
          )}

          <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
}

function TransactionSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl space-y-8">
      <Skeleton className="h-16 w-3/4 rounded-3xl" />
      <Skeleton className="h-4 w-1/2 rounded-full" />
      <Skeleton className="h-[500px] w-full rounded-[2.5rem]" />
    </div>
  );
}
