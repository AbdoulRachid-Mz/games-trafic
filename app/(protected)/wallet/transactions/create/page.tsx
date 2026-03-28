"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuthContext } from "@/contexts/auth-context";
import { useApp } from "@/contexts/app-context";
import { Typography } from "@/components/ui/typography";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { fireConfettiPreset } from "@/utils/confetti";
import { generateEnhancedReceipt } from "@/utils/receipt-templates";
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
import { createProductOrder } from "@/actions/orders";
import { getThemeById } from "@/actions/themes";
import { getProductById } from "@/actions/products";
import { getGameItemById } from "@/actions/game-items";
import { getTournamentEditionWithRelations } from "@/actions/editions";
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
import { useTransactionFees } from "@/hooks/use-transaction-fees";
import { getTournamentMembers } from "@/actions/members";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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
  const { data: completeData, refresh: refreshProfile } = useUserProfile({
    enabled: true,
    mode: "minimal",
  });
  const { settings } = useApp();

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [transactionData, setTransactionData] = useState<TransactionData>({
    type: null as unknown as TransactionType,
    amount: 0,
    metadata: {},
  });
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [prefilledRecipientWalletId, setPrefilledRecipientWalletId] = useState<string | null>(null);

  // Fetch fees via the dedicated hook
  const {
    fees,
    total,
    isLoading: feesLoading,
    isError,
    error,
    refetch
  } = useTransactionFees(
    transactionData.type,
    transactionData.amount,
    { enabled: !!transactionData.type && transactionData.amount > 0 }
  );

  const feesObj = useMemo(() => {
    const baseAmount = transactionData.amount || 0;
    const feeAmount = typeof fees === "number" ? fees : 0;
    const totalAmount = typeof total === "number" ? total : baseAmount;
    const percentage = baseAmount > 0 ? feeAmount / baseAmount : 0;
    return {
      percentage,
      amount: feeAmount,
      totalAmount,
    };
  }, [fees, total, transactionData.amount]);

  const fetchEntityByType = async (type: TransactionType, id: string) => {
    if (!id) return null;
    switch (type) {
      case "THEME_PURCHASE": {
        const theme = await getThemeById(id);
        if (!theme || theme.id !== id) return null;
        return {
          id: theme.id,
          name: theme.name,
          description: theme.description || "",
          price: parseFloat(theme.price || "0"),
          currency: "GTC",
          image: theme.thumbnail || undefined,
          metadata: {
            creatorId: theme.creatorId,
          },
        };
      }
      case "PRODUCT_PURCHASE": {
        const product = await getProductById(id);
        if (!product || product.id !== id) return null;
        return {
          id: product.id,
          name: product.name,
          description: product.description || "",
          price: parseFloat(product.price || "0"),
          currency: product.currency || "GTC",
          image: product.featuredImage || product.images?.[0] || undefined,
          metadata: {
            shopId: product.shopId,
            sellerId: product.userId,
          },
        };
      }
      case "GAME_ITEM_PURCHASE": {
        const item = await getGameItemById(id);
        if (!item || item.id !== id) return null;
        return {
          id: item.id,
          name: item.name,
          description: item.description || "",
          price: parseFloat(item.priceGtc || "0"),
          currency: "GTC",
          image: item.icon || undefined,
          metadata: {
            gameId: item.gameId,
            type: item.type,
          },
        };
      }
      case "TOURNAMENT_PARTICIPATION": {
        const edition = await getTournamentEditionWithRelations(id);
        if (!edition || edition.id !== id) return null;
        return {
          id: edition.id,
          name: edition.name || `Édition #${edition.editionNumber}`,
          description: edition.description || "",
          price: parseFloat(edition.entryFee || "0"),
          currency: edition.prizeCurrency || "GTC",
          image: edition.tournament?.profileImage || edition.tournament?.profileImage || undefined,
          metadata: {
            tournamentId: edition.tournamentId,
            editionNumber: edition.editionNumber,
          },
        };
      }
      default:
        return null;
    }
  };

  // Récupération des paramètres d'URL et fetch de l'entité
  // Dans le composant CreateTransactionContent, mettre à jour loadTransactionFromParams

  useEffect(() => {
    const loadTransactionFromParams = async () => {
      const type = searchParams.get("type") as TransactionType;
      const amount = searchParams.get("amount");
      const entityId = searchParams.get("entityId");
      const targetId = searchParams.get("targetId");
      const itemId = searchParams.get("itemId");
      const imageUrl = searchParams.get("image"); // Ajout du paramètre image

      if (type && TRANSACTION_CONFIGS[type]) {
        const config = TRANSACTION_CONFIGS[type];
        const actualEntityId = entityId || targetId || itemId;

        const newData: TransactionData = {
          type,
          amount: amount ? parseFloat(amount) : 0,
          metadata: {
            ...(imageUrl && { image: imageUrl }) // Stocker l'image
          },
        };

        // Pour DEPOSIT et WITHDRAWAL, on pré-rempli les détails si fournis
        const hasPaymentDetails = searchParams.get("paymentMethod") ||
          searchParams.get("paymentProvider") ||
          searchParams.get("paymentAccountId");

        if ((type === "DEPOSIT" || type === "WITHDRAWAL") && hasPaymentDetails) {
          
          newData.metadata = {
            ...newData.metadata,
            paymentMethod: searchParams.get("paymentMethod") || "",
            paymentProvider: searchParams.get("paymentProvider") || "",
            paymentAccountId: searchParams.get("paymentAccountId") || "",
          };
        }

        if (type === "VIP_SUBSCRIPTION" && !newData.amount) {
          const monthly = parseFloat(settings?.vipMonthlyPrice || "0");
          if (monthly > 0) {
            newData.amount = monthly;
          }
        }

        if (type === "TRANSFER" && actualEntityId) {
          newData.recipientWalletId = actualEntityId;
          setPrefilledRecipientWalletId(actualEntityId);
        } else {
          setPrefilledRecipientWalletId(null);
        }

        if (actualEntityId && config.needsTargetId) {
          try {
            const entity = await fetchEntityByType(type, actualEntityId);
            if (entity) {
              newData.targetId = actualEntityId;
              // Ajouter l'image si elle vient des paramètres
              if (imageUrl) {
                entity.image = imageUrl;
              }
              newData.entity = entity as any;
              if (type === "GAME_ITEM_PURCHASE" && entity.price) {
                if (newData.amount && Math.abs(newData.amount - entity.price) > 0.01) {
                  newData.metadata = {
                    ...newData.metadata,
                    originalAmount: newData.amount,
                  };
                }
                newData.amount = entity.price;
              } else if (!newData.amount && entity.price) {
                newData.amount = entity.price;
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
          !!newData.targetId || !!newData.recipientWalletId
        );
        setCurrentStep(initialStepIndex);
      }

      if (completeData && !completeData?.wallet) {
        toast.error("Vous devez avoir un wallet pour effectuer des transactions");
        router.push("/wallet");
      }
    };

    if (completeData) {
      loadTransactionFromParams();
    }
  }, [searchParams, completeData, router, settings]);

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
    if (type === "TRANSFER") {
      const recipientStepIndex = config.steps.indexOf("RECIPIENT_SELECTION");
      return recipientStepIndex >= 0 ? recipientStepIndex : 0;
    }

    if (config.requiresEntity) {
      if (hasTargetId) {
        const amountStepIndex = config.steps.indexOf("AMOUNT_INPUT");
        return amountStepIndex >= 0 ? amountStepIndex : 0;
      }
      const entityStepIndex = config.steps.indexOf("ENTITY_SELECTION");
      if (entityStepIndex >= 0) return entityStepIndex;
    }

    if (config.steps.includes("AMOUNT_INPUT")) {
      const amountStepIndex = config.steps.indexOf("AMOUNT_INPUT");
      return amountStepIndex >= 0 ? amountStepIndex : 0;
    }

    return config.steps.indexOf("TYPE_SELECTION") >= 0 ? 1 : 0;
  };

  const handleTypeSelect = (type: TransactionType | "QR_SCAN") => {
    if (type === "QR_SCAN") {
      setShowScanner(true);
      setTransactionData({ type: null as any, amount: 0, metadata: {} });
      setCurrentStep(0);
      return;
    }
    setPrefilledRecipientWalletId(null);
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
      const imageUrl = decoded.i; // Récupérer l'image du QR

      const newData: TransactionData = {
        type,
        amount: amount || 0,
        metadata: decoded.m || {},
      };

      // Ajouter l'image si présente
      if (imageUrl) {
        newData.metadata.image = imageUrl;
      }

      if (type === "TRANSFER" && entityId) {
        newData.recipientWalletId = entityId;
        setPrefilledRecipientWalletId(entityId);
      } else {
        setPrefilledRecipientWalletId(null);
      }

      try {
        const entity = await fetchEntityByType(type, entityId);
        if (entity) {
          newData.targetId = entityId;
          // Ajouter l'image du QR si disponible
          if (imageUrl) {
            entity.image = imageUrl;
          }
          newData.entity = entity as any;
          if (type === "GAME_ITEM_PURCHASE" && entity.price) {
            if (newData.amount && Math.abs(newData.amount - entity.price) > 0.01) {
              newData.metadata = {
                ...newData.metadata,
                originalAmount: newData.amount,
              };
            }
            newData.amount = entity.price;
          } else if (!newData.amount && entity.price) {
            newData.amount = entity.price;
          }
        }
      } catch (err) {
        console.error("Error fetching scanned entity:", err);
      }

      setTransactionData(newData);

      const config = TRANSACTION_CONFIGS[type];
      const initialStep = getInitialStepForType(
        type,
        config,
        !!newData.targetId || !!newData.recipientWalletId
      );
      setCurrentStep(initialStep);

      toast.success("QR Code scanné avec succès");
    } else {
      toast.error("QR Code invalide ou format non supporté");
    }
  };

  const handleEntitySelect = async (entity: any) => {
    if (transactionData.type === "THEME_PURCHASE" || transactionData.type === "PRODUCT_PURCHASE") {
      const creatorId = entity.creatorId || entity.userId || entity.ownerId;
      if (creatorId && user?.id && creatorId === user.id) {
        toast.error("Action non autorisée: vous êtes l'auteur de cet élément");
        return;
      }
    }

    if (transactionData.type === "TOURNAMENT_PARTICIPATION" && user?.id) {
      const tId =
        entity?.metadata?.tournamentId ||
        entity?.tournamentId ||
        entity?.tournament?.id;
      if (tId) {
        try {
          const res = await getTournamentMembers({
            pagination: { page: 1, limit: 1 },
            filters: { tournamentId: tId, userId: user.id } as any,
          });
          if (res?.data && res.data.length > 0) {
            toast.error("Vous êtes déjà membre ou organisateur de ce tournoi");
            return;
          }
        } catch (e) {
        }
      }
    }

    let finalEntity = entity;
    if (transactionData.type === "TOURNAMENT_PARTICIPATION") {
      const edition = await getTournamentEditionWithRelations(entity.id);
      if (edition) {
        finalEntity = {
          ...entity,
          name: edition.name || entity.name,
          description: edition.description || entity.description,
          price: parseFloat(edition.entryFee || "0"),
          currency: edition.prizeCurrency || "GTC",
          image: edition.tournament?.profileImage || entity.image,
          metadata: {
            ...(entity.metadata || {}),
            tournamentId: edition.tournamentId,
            editionNumber: edition.editionNumber,
          },
        };
      }
    }

    const price = finalEntity.priceGtc
      ? parseFloat(finalEntity.priceGtc)
      : finalEntity.price || 0;
    setTransactionData((prev) => ({
      ...prev,
      targetId: finalEntity.id,
      entity: finalEntity,
      amount: price || prev.amount,
    }));

    const nextStepIndex = steps.indexOf(currentStepType) + 1;
    if (nextStepIndex < steps.length) {
      setCurrentStep(nextStepIndex);
    }
  };

  const handleAmountChange = (amount: number) => {
    setTransactionData((prev) => ({ ...prev, amount }));
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
      await refreshProfile();
      nextStep();
    } catch {
      toast.error("Code PIN incorrect");
    } finally {
      setIsLoading(false);
    }
  };

  const executeConfirm = async (allowDuplicate: boolean) => {
    if (!transactionData.type || !transactionData.amount) {
      throw new Error("Données de transaction incomplètes");
    }

    if (!completeData?.wallet?.id) {
      throw new Error("Wallet non trouvé");
    }

    if (transactionData.type === "DEPOSIT" || transactionData.type === "WITHDRAWAL") {
      const request = await createRequest(
        {
          userId: user!.id,
          type: transactionData.type,
          amount: transactionData.amount.toString(),
          paymentMethod: transactionData.metadata?.paymentMethod || "WALLET",
          paymentProvider: transactionData.metadata?.paymentProvider,
          paymentAccountId: transactionData.metadata?.paymentAccountId,
        },
        { allowDuplicate }
      );

      if (!request) throw new Error("Erreur lors de la création de la requête");
      setTransactionId(request.id);
      toast.success("Demande créée ! Elle sera traitée par un administrateur.");
      await refreshProfile();
      nextStep();
      return;
    }

    if (transactionData.type === "GAME_ITEM_PURCHASE") {
      if (!transactionData.targetId) throw new Error("Item non trouvé");
      const gameAccount = transactionData.metadata?.gameAccount as string | undefined;
      const encryptedPassword = transactionData.metadata?.encryptedPassword as string | undefined;
      const additionalInfo = transactionData.metadata?.additionalInfo as string | undefined;
      if (!gameAccount || !encryptedPassword) {
        throw new Error("Veuillez renseigner les informations du compte de jeu");
      }
      const quantity =
        transactionData.entity?.price
          ? Math.max(1, Math.round(transactionData.amount / (transactionData.entity?.price || 1)))
          : 1;
      const request = await createRequest(
        {
          userId: user!.id,
          type: "GAME_ITEMS",
          amount: transactionData.amount.toString(),
          gameItemId: transactionData.targetId,
          gameAccount,
          encryptedPassword,
          additionalInfo,
          metadata: {
            quantity,
            totalGtc: transactionData.amount.toString(),
          },
        },
        { allowDuplicate }
      );
      setTransactionId(request.id);
      toast.success("Demande créée ! L’équipe va traiter votre achat.");
      await refreshProfile();
      nextStep();
      return;
    }

    if (transactionData.type === "PRODUCT_PURCHASE") {
      if (!transactionData.targetId) throw new Error("Produit non trouvé");
      const order = await createProductOrder(
        {
          productId: transactionData.targetId,
          totalAmount: transactionData.amount,
          buyerInstructions: transactionData.metadata?.buyerInstructions as string | undefined,
        },
        { allowDuplicate }
      );
      if (!order.success) {
        throw new Error(order.error || "Erreur lors de la création de la commande");
      }
      setTransactionId(order.orderId || null);
      toast.success("Commande créée ! Elle sera validée par la boutique.");
      await refreshProfile();
      nextStep();
      return;
    }

    const transaction = await createTransaction(
      {
        walletId: completeData.wallet.id,
        type: transactionData.type as any,
        amount: transactionData.amount.toString(),
        description: getTransactionDescription(transactionData),
        metadata: {
          ...transactionData.metadata,
          targetId: transactionData.targetId,
          entity: transactionData.entity,
          recipientWalletId: transactionData.recipientWalletId,
          feesAmount: feesObj.amount,
          feesPercentage: feesObj.percentage,
          totalCalculated: feesObj.totalAmount,
        },
      },
      { allowDuplicate }
    );

    setTransactionId(transaction.id);

    await fireConfettiPreset("success");

    generateEnhancedReceipt({
      transactionId: transaction.id,
      amount: transactionData.amount,
      type: transactionData.type,
      fees: feesObj.amount,
      totalAmount: feesObj.totalAmount,
      date: new Date(),
      reference: `TX-${transaction.id.slice(-8)}`,
      newBalance:
        parseFloat(completeData.ledgerBalance || "0") - feesObj.totalAmount,
      entityData: transactionData.entity,
      metadata: transactionData.metadata,
    });

    toast.success("Transaction effectuée !");
    await refreshProfile();
    nextStep();

    setTimeout(() => {
      router.push("/wallet/transactions");
    }, 5000);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await executeConfirm(false);
    } catch (error: any) {
      if (error?.message?.includes("déjà en cours")) {
        setDuplicateDialogOpen(true);
      } else {
        toast.error(error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateConfirm = async () => {
    setDuplicateDialogOpen(false);
    setIsLoading(true);
    try {
      await executeConfirm(true);
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
            walletBalance={parseFloat(completeData?.ledgerBalance || "0")}
            fees={feesObj}
            transactionType={transactionData.type}
            entity={transactionData.entity}
            alreadyVip={
              transactionData.type === "VIP_SUBSCRIPTION"
                ? !!completeData?.hasActiveSubscription
                : false
            }
            metadata={transactionData.metadata}
            onMetadataChange={(data) =>
              setTransactionData((prev) => ({
                ...prev,
                metadata: { ...prev.metadata, ...data },
              }))
            }
            onContinue={handleContinue}
            onBack={handleBack}
          />
        );

      case "RECIPIENT_SELECTION":
        return (
          <TransactionRecipientSelector
            onSelect={handleRecipientSelect}
            onBack={handleBack}
            initialWalletId={prefilledRecipientWalletId || undefined}
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
              fees: feesObj.amount,
              totalAmount: feesObj.totalAmount,
            }}
          />
        );

      case "CONFIRMATION":
        return (
          <TransactionConfirmation
            transactionData={{
              ...transactionData,
              fees: feesObj.amount,
              totalAmount: feesObj.totalAmount,
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
              parseFloat(completeData?.ledgerBalance || "0") -
              feesObj.totalAmount
            }
            isRequest={
              transactionData.type === "DEPOSIT" ||
              transactionData.type === "WITHDRAWAL" ||
              transactionData.type === "GAME_ITEM_PURCHASE" ||
              transactionData.type === "PRODUCT_PURCHASE"
            }
            onReturnHome={() => router.push("/wallet")}
            onViewHistory={() => router.push("/wallet/transactions")}
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
                <span className="text-sm font-black text-primary">{completeData.ledgerBalance || "0"} GTC</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
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
      <AlertDialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Transaction déjà en cours</AlertDialogTitle>
            <AlertDialogDescription>
              Une opération du même type est déjà en cours. Voulez-vous continuer quand même ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDuplicateConfirm}>
              Continuer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
