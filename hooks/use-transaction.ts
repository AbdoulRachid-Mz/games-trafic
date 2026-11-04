"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createTransaction as createWalletTransaction } from "@/actions/transactions";
import { verifyWalletPin } from "@/actions/wallets";
import { getTransactionFees } from "@/actions/transactions";

interface UseTransactionProps {
  walletId: string;
  userId: string;
}

interface TransactionData {
  type: "PURCHASE" | "VIP_SUBSCRIPTION" | "GAME_ITEM_PURCHASE" | "THEME_PURCHASE" | "DEPOSIT" | "WITHDRAWAL" | "REFUND" | "TRANSFER" | "ORDER_PURCHASE" | "TOURNAMENT_PARTICIPATION" | "BONUS";
  amount: number;
  targetId?: string;
  description?: string;
  metadata?: any;
  fees?: number;
  totalAmount?: number;
}

/**
 * Hook pour gérer les transactions wallet
 * ✅ REFACTORÉ: Utilise maintenant les server actions au lieu de l'API
 */
export function useTransaction({ walletId, userId }: UseTransactionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const calculateFees = useCallback(async (type: string, amount: number): Promise<number> => {
    try {
      const feeCalc = await getTransactionFees(type, amount);
      return feeCalc.fees;
    } catch (error) {
      console.error("Error calculating fees:", error);
      return 0;
    }
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const result = await verifyWalletPin(walletId, pin);

      if (!result.success) {
        toast.error(result.error || "PIN incorrect");
        return false;
      }

      return true;
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la vérification du PIN");
      return false;
    }
  }, [walletId]);

  const createTransaction = useCallback(async (
    data: TransactionData,
    pin?: string
  ): Promise<any> => {
    setIsLoading(true);
    setError(null);

    try {
      // Vérifier le PIN si fourni
      if (pin) {
        const isPinValid = await verifyPin(pin);
        if (!isPinValid) {
          throw new Error("PIN invalide");
        }
      }

      // Calculer les frais si non fournis
      const fees = data.fees || await calculateFees(data.type, data.amount);

      // Créer la transaction via server action
      const transaction = await createWalletTransaction({
        walletId,
        type: data.type,
        amount: data.amount.toFixed(2),
        description: data.description,
        metadata: {
          ...data.metadata,
          targetId: data.targetId,
          userId,
        },
        fees: fees.toFixed(2),
      });

      toast.success("Transaction effectuée avec succès !");
      router.refresh(); // Rafraîchir les données
      return transaction;
    } catch (error: any) {
      const errorMessage = error.message || "Erreur lors de la transaction";
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletId, userId, calculateFees, verifyPin, router]);

  const validateTransaction = useCallback(async (
    amount: number,
    walletBalance: number
  ): Promise<{ isValid: boolean; message?: string }> => {
    if (amount <= 0) {
      return { isValid: false, message: "Le montant doit être supérieur à 0" };
    }

    if (amount > walletBalance) {
      return { isValid: false, message: "Solde insuffisant" };
    }

    return { isValid: true };
  }, []);

  const getTransactionTypes = useCallback(() => {
    return [
      {
        id: "THEME_PURCHASE",
        label: "Achat de thème",
        description: "Acheter un thème premium",
      },
      {
        id: "VIP_SUBSCRIPTION",
        label: "Abonnement VIP",
        description: "Devenir membre VIP",
      },
      {
        id: "ORDER_PURCHASE",
        label: "Achat produit",
        description: "Acheter un produit",
      },
      {
        id: "TOURNAMENT_PARTICIPATION",
        label: "Participation tournoi",
        description: "S'inscrire à un tournoi",
      },
      {
        id: "GAME_ITEM_PURCHASE",
        label: "Achat item jeu",
        description: "Acheter des items de jeu",
      },
      {
        id: "DEPOSIT",
        label: "Dépôt",
        description: "Ajouter des fonds",
      },
      {
        id: "TRANSFER",
        label: "Transfert",
        description: "Envoyer à un utilisateur",
      },
    ];
  }, []);

  return {
    isLoading,
    error,
    createTransaction,
    verifyPin,
    validateTransaction,
    calculateFees,
    getTransactionTypes,
  };
}
