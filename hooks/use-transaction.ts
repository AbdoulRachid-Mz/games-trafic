"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface UseTransactionProps {
  walletId: string;
  userId: string;
}

interface TransactionData {
  type: string;
  amount: number;
  targetId?: string;
  metadata?: any;
  fees?: number;
  totalAmount?: number;
}

export function useTransaction({ walletId, userId }: UseTransactionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const calculateFees = useCallback((type: string, amount: number): number => {
    const feeRates: Record<string, number> = {
      THEME_PURCHASE: 0.01, // 1%
      VIP_SUBSCRIPTION: 0.005, // 0.5%
      PRODUCT_PURCHASE: 0.02, // 2%
      TOURNAMENT_PARTICIPATION: 0.015, // 1.5%
      GAME_ITEM_PURCHASE: 0.03, // 3%
      DEPOSIT: 0.001, // 0.1%
      TRANSFER: 0.005, // 0.5%
    };

    return amount * (feeRates[type] || 0.01);
  }, []);

  const verifyPin = useCallback(async (pin: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/wallet/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ walletId, pin }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "PIN incorrect");
      }

      return true;
    } catch (error: any) {
      toast.error(error.message);
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
      // Calculer les frais si non fournis
      const fees = data.fees || calculateFees(data.type, data.amount);
      const totalAmount = data.totalAmount || data.amount + fees;

      // Vérifier le PIN si fourni
      if (pin) {
        const isPinValid = await verifyPin(pin);
        if (!isPinValid) {
          throw new Error("PIN invalide");
        }
      }

      // Créer la transaction
      const response = await fetch("/api/transactions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          walletId,
          userId,
          fees,
          totalAmount,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erreur lors de la transaction");
      }

      toast.success("Transaction effectuée avec succès !");
      return result.data;
    } catch (error: any) {
      setError(error.message);
      toast.error(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [walletId, userId, calculateFees, verifyPin]);

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
        id: "PRODUCT_PURCHASE",
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