import { getWalletExpenses, getWalletRevenues } from "@/actions/wallets";
import { getAccountBalance } from "@/lib/ledger/ledger-utils";
import { useQuery } from "@tanstack/react-query";
// hooks/use-wallets.ts

// hooks/use-wallets.ts
/**
 * Hook ultra-optimisé pour récupérer le solde d’un wallet.
 * Utilise TanStack Query pour le cache, le background-refetch, etc.
 */
export function useWalletBalance(accountId: string | undefined) {
  return useQuery({
    queryKey: ["wallet-balance", accountId],
    queryFn: () => getAccountBalance(accountId!),
    enabled: !!accountId, // pas de requête si pas d’accountId
    staleTime: 30_000, // considéré frais pendant 30s
    gcTime: 5 * 60_000, // garde en cache 5min après inutilisé
  });
}

/**
 * Hook ultra-optimisé pour récupérer les dépenses d’un wallet.
 * Utilise TanStack Query pour le cache, le background-refetch, etc.
 */
export function useWalletExpenses(walletId: string | undefined) {
  return useQuery({
    queryKey: ["wallet-expenses", walletId],
    queryFn: () => getWalletExpenses(walletId!),
    enabled: !!walletId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}

/**
 * Hook ultra-optimisé pour récupérer les revenus d’un wallet.
 * Utilise TanStack Query pour le cache, le background-refetch, etc.
 */
export function useWalletRevenues(walletId: string | undefined) {
  return useQuery({
    queryKey: ["wallet-revenues", walletId],
    queryFn: () => getWalletRevenues(walletId!),
    enabled: !!walletId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
  });
}


