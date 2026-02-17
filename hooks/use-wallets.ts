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

