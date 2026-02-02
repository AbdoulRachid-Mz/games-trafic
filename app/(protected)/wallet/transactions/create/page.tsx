"use client";

import React, { useState, useEffect, Suspense } from "react";
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
import {
  TRANSACTION_CONFIGS,
  type TransactionType,
  type TransactionData,
  type TransactionStep,
} from "@/types/transaction-types";
import { useUserProfile } from "@/hooks/use-profile";

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
  const { data: completeData } = useUserProfile(!!user?.id);
  const { settings } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
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

  // Récupération des paramètres d'URL
  useEffect(() => {
    const type = searchParams.get("type") as TransactionType;
    const amount = searchParams.get("amount");
    const targetId = searchParams.get("targetId");
    const entityData = searchParams.get("entityData");

    if (type && TRANSACTION_CONFIGS[type]) {
      const config = TRANSACTION_CONFIGS[type];

      const newData: TransactionData = {
        type,
        amount: amount ? parseFloat(amount) : 0,
        metadata: {},
      };

      if (targetId && config.needsTargetId) {
        newData.targetId = targetId;
        if (entityData) {
          newData.entity = JSON.parse(entityData);
        }
      }

      setTransactionData(newData);

      // Calculer les étapes initiales
      const initialStepIndex = getInitialStepForType(type, config, !!targetId);
      setCurrentStep(initialStepIndex);

      // Calculate fees immediately if amount is provided
      if (amount && parseFloat(amount) > 0) {
        calculateFees(type, parseFloat(amount));
      }
    }

    if (!completeData?.wallet) {
      toast.error("Vous devez avoir un wallet pour effectuer des transactions");
      router.push("/wallet");
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

  const getFeeKey = (type: TransactionType): string => {
    switch (type) {
      case "THEME_PURCHASE":
      case "PRODUCT_PURCHASE":
      case "GAME_ITEM_PURCHASE":
        return "purchaseFeePercentage";
      case "VIP_SUBSCRIPTION":
        return "transactionFeePercentage";
      case "TOURNAMENT_PARTICIPATION":
        return "tournamentParticipationFeePercentage";
      case "DEPOSIT":
        return "depositFeePercentage";
      case "WITHDRAWAL":
        return "withdrawalFeePercentage";
      case "TRANSFER":
        return "transferFeePercentage";
      default:
        return "transactionFeePercentage";
    }
  };

  const handleTypeSelect = (type: TransactionType) => {
    setTransactionData({
      type,
      amount: 0,
      metadata: {},
    });
    setCurrentStep(0);
  };

  const handleEntitySelect = (entity: any) => {
    setTransactionData((prev) => ({
      ...prev,
      targetId: entity.id,
      entity: entity,
      amount: entity.price || prev.amount,
    }));

    // Passer à l'étape suivante
    const nextStepIndex = steps.indexOf(currentStepType) + 1;
    if (nextStepIndex < steps.length) {
      setCurrentStep(nextStepIndex);
    }
    if (transactionData.type && (entity.price || transactionData.amount)) {
      calculateFees(
        transactionData.type,
        entity.price || transactionData.amount
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
          //   metadata: transactionData.metadata
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
        type: transactionData.type as
          | "THEME_PURCHASE"
          | "VIP_SUBSCRIPTION"
          | "TOURNAMENT_PARTICIPATION"
          | "GAME_ITEM_PURCHASE"
          | "DEPOSIT"
          | "WITHDRAWAL"
          | "TRANSFER"
          | "PURCHASE"
          | "REFUND"
          | "ORDER_PURCHASE"
          | "BONUS",
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
        return `Transfert à ${
          (data.metadata as any).recipientName || "utilisateur"
        }`;
      default:
        return "Transaction";
    }
  };

  if (!completeData?.wallet) {
    return null;
  }

  const renderStep = () => {
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
              //   entityData: transactionData.entity,
              //   recipient: transactionData.recipientUser
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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Typography variant="h1" weight="bold" className="mb-2">
            {config?.label || "Nouvelle transaction"}
          </Typography>
          <Typography variant="body-base" theme="muted">
            {config
              ? `Étape ${currentStep + 1} sur ${steps.length}`
              : "Sélectionnez le type de transaction"}
          </Typography>
        </div>

        <div className="space-y-6">
          {config && (
            <TransactionStepper
              steps={steps}
              currentStep={currentStep}
              currentStepType={currentStepType}
            />
          )}

          {renderStep()}
        </div>
      </div>
    </div>
  );
}

function TransactionSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-64" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
