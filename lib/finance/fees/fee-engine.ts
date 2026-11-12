import type { FeeCalculation, FeeOptions, TransactionType } from "../types";
import { DEFAULT_APP_SETTINGS } from "@/config/app-config";

/**
 * Calcule purement les frais d'une transaction à partir d'un taux et d'options.
 * Fonction 100% déterministe et sans effet de bord.
 */
export function calculatePureFee(
  amount: number,
  baseFeePercentage: number,
  options?: FeeOptions
): FeeCalculation {
  if (isNaN(amount) || amount <= 0) {
    return {
      feePercentage: 0,
      fees: 0,
      netAmount: 0,
      totalAmount: 0,
    };
  }

  let feePercentage = Math.max(0, baseFeePercentage);

  // Réduction VIP de 50% sur les frais de transaction
  if (options?.isVip) {
    feePercentage = feePercentage * 0.5;
  }

  // Calcul brut arrondi à 2 décimales
  const rawFees = amount * feePercentage;
  const fees = Math.round(rawFees * 100) / 100;
  const netAmount = Math.round((amount - fees) * 100) / 100;

  return {
    feePercentage,
    fees,
    netAmount,
    totalAmount: amount,
  };
}

/**
 * Résout le pourcentage de base selon le type de transaction et les paramètres de l'application.
 */
export function resolveBaseFeePercentage(
  type: TransactionType | string,
  settings: Record<string, any> | null
): number {
  if (!settings) return 0;

  switch (type) {
    case "THEME_PURCHASE":
    case "PRODUCT_PURCHASE":
    case "GAME_ITEM_PURCHASE":
    case "ORDER_PURCHASE":
      return parseFloat(settings.purchaseFeePercentage?.toString() || "0");
    case "VIP_SUBSCRIPTION":
      return parseFloat(settings.transactionFeePercentage?.toString() || "0");
    case "TOURNAMENT_PARTICIPATION":
      return parseFloat(
        settings.tournamentParticipationFeePercentage?.toString() || "0"
      );
    case "DEPOSIT":
      return parseFloat(settings.depositFeePercentage?.toString() || "0");
    case "WITHDRAWAL":
      return parseFloat(settings.withdrawalFeePercentage?.toString() || "0");
    case "TRANSFER":
      return parseFloat(settings.transferFeePercentage?.toString() || "0");
    case "BONUS":
    case "REFUND":
    default:
      return 0;
  }
}

/**
 * Calcule les frais de manière autoritaire pour une transaction.
 * Source UNIQUE de vérité pour tout le système financier.
 */
export async function calculateTransactionFees(
  type: TransactionType | string,
  amount: number,
  options?: { isVip?: boolean; settings?: any }
): Promise<FeeCalculation> {
  try {
    // Imports dynamiques : les fonctions pures ne doivent pas charger la session
    // ni les Server Actions (important pour les tests et le tree-shaking).
    const hasExplicitPolicy = options?.settings !== undefined;
    let settings = hasExplicitPolicy
      ? options?.settings
      : await (await import("@/actions/app-settings")).getAppSettings();

    if (settings === null || settings === undefined) {
      // Politique explicitement fournie et invalide => on échoue fermement.
      if (hasExplicitPolicy) {
        throw new Error("FEE_POLICY_UNAVAILABLE: Impossible de récupérer les paramètres de politique de frais.");
      }
      // Aucune ligne `app_settings` en base (ou base momentanément
      // indisponible) : on applique la politique par défaut du code plutôt
      // que de casser toutes les opérations financières. La ligne singleton
      // est normalement créée automatiquement par getAppSettings().
      console.warn(
        "FEE_POLICY_UNAVAILABLE: app_settings absent, utilisation de la politique de frais par défaut."
      );
      settings = DEFAULT_APP_SETTINGS;
    }

    const basePercentage = resolveBaseFeePercentage(type, settings);

    let isVip = options?.isVip;
    if (isVip === undefined) {
      const { getCurrentUser } = await import("@/lib/auth/session");
      const user = await getCurrentUser();
      isVip = !!user?.isVip;
    }

    return calculatePureFee(amount, basePercentage, { isVip });
  } catch (error) {
    console.error("Error calculating transaction fees:", error);
    if (error instanceof Error && error.message.includes("FEE_POLICY_UNAVAILABLE")) {
      throw error;
    }
    throw new Error("FEE_POLICY_UNAVAILABLE: Erreur lors de l'évaluation de la politique de frais.");
  }
}
