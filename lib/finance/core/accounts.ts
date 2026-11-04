/**
 * lib/finance/core/accounts.ts
 *
 * Résolution et création idempotente des comptes financiers.
 * Les comptes système sont identifiés par une `system_key` stable,
 * jamais par leur type (qui peut avoir des doublons historiques).
 */

import { db } from "@/lib/db";
import {
  financialAccounts,
  userWallets,
  type FinancialAccount,
  type FinancialAccountType,
} from "@/database/schema";
import { eq } from "drizzle-orm";
import { FinanceError } from "./errors";

type DbClient = typeof db | any;

export type SystemAccountKey =
  | "GTC_ISSUANCE"
  | "EXTERNAL_CLEARING"
  | "ESCROW"
  | "FEES"
  | "ADJUSTMENT"
  | "TOURNAMENT_POOL";

interface SystemAccountDefinition {
  type: FinancialAccountType;
  allowNegativeBalance: boolean;
}

export const SYSTEM_ACCOUNT_DEFINITIONS: Record<
  SystemAccountKey,
  SystemAccountDefinition
> = {
  GTC_ISSUANCE: {
    type: "SYSTEM_GTC_ISSUANCE",
    allowNegativeBalance: true,
  },
  EXTERNAL_CLEARING: {
    type: "SYSTEM_EXTERNAL_CLEARING",
    allowNegativeBalance: true,
  },
  ESCROW: {
    type: "PLATFORM_ESCROW",
    allowNegativeBalance: false,
  },
  FEES: {
    type: "PLATFORM_FEES",
    allowNegativeBalance: false,
  },
  ADJUSTMENT: {
    type: "SYSTEM_ADJUSTMENT",
    allowNegativeBalance: false,
  },
  TOURNAMENT_POOL: {
    type: "TOURNAMENT_POOL",
    allowNegativeBalance: false,
  },
};

/**
 * Récupère ou crée un compte système de façon idempotente.
 * `INSERT ... ON CONFLICT (system_key) DO NOTHING` puis lecture.
 */
export async function getOrCreateSystemAccount(
  client: DbClient,
  key: SystemAccountKey
): Promise<FinancialAccount> {
  const definition = SYSTEM_ACCOUNT_DEFINITIONS[key];
  if (!definition) {
    throw new FinanceError(
      "ACCOUNT_NOT_FOUND",
      `Clé de compte système inconnue: ${key}`
    );
  }

  const [existing] = await client
    .select()
    .from(financialAccounts)
    .where(eq(financialAccounts.systemKey, key))
    .limit(1);

  if (existing) {
    return existing as FinancialAccount;
  }

  await client
    .insert(financialAccounts)
    .values({
      type: definition.type,
      systemKey: key,
      allowNegativeBalance: definition.allowNegativeBalance,
      currency: "GTC",
      isActive: true,
      isLocked: false,
      metadata: { createdBy: "finance-core", systemAccountKey: key },
    })
    .onConflictDoNothing({ target: financialAccounts.systemKey });

  const [created] = await client
    .select()
    .from(financialAccounts)
    .where(eq(financialAccounts.systemKey, key))
    .limit(1);

  if (!created) {
    throw new FinanceError(
      "ACCOUNT_NOT_FOUND",
      `Impossible de créer le compte système ${key}.`
    );
  }

  return created as FinancialAccount;
}

/**
 * Résout le compte financier d'un wallet utilisateur.
 */
export async function getWalletFinancialAccount(
  client: DbClient,
  walletId: string
): Promise<FinancialAccount> {
  const [wallet] = await client
    .select()
    .from(userWallets)
    .where(eq(userWallets.id, walletId))
    .limit(1);

  if (!wallet) {
    throw new FinanceError(
      "ACCOUNT_NOT_FOUND",
      `Wallet introuvable: ${walletId}`
    );
  }

  if (!wallet.financialAccountId) {
    throw new FinanceError(
      "ACCOUNT_NOT_FOUND",
      `Aucun compte financier lié au wallet ${walletId}.`
    );
  }

  const [account] = await client
    .select()
    .from(financialAccounts)
    .where(eq(financialAccounts.id, wallet.financialAccountId))
    .limit(1);

  if (!account) {
    throw new FinanceError(
      "ACCOUNT_NOT_FOUND",
      `Compte financier introuvable pour le wallet ${walletId}.`
    );
  }

  return account as FinancialAccount;
}

/**
 * Récupère un compte par identifiant et vérifie son utilisabilité.
 */
export async function requireUsableAccount(
  client: DbClient,
  accountId: string
): Promise<FinancialAccount> {
  const [account] = await client
    .select()
    .from(financialAccounts)
    .where(eq(financialAccounts.id, accountId))
    .limit(1);

  if (!account) {
    throw new FinanceError(
      "ACCOUNT_NOT_FOUND",
      `Compte financier introuvable: ${accountId}`
    );
  }
  if (!account.isActive) {
    throw new FinanceError(
      "ACCOUNT_INACTIVE",
      `Compte financier inactif: ${accountId}`
    );
  }
  if (account.isLocked) {
    throw new FinanceError(
      "ACCOUNT_LOCKED",
      `Compte financier verrouillé: ${accountId}`
    );
  }

  return account as FinancialAccount;
}
