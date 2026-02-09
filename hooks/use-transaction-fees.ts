// hooks/use-transaction-fees.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { calculateTransactionFees } from "@/actions/entities";

export interface UseTransactionFeesOptions {
    enabled?: boolean;
    staleTime?: number;
}

/**
 * Hook TanStack Query pour calculer les frais de transaction
 * @param type Type de transaction
 * @param amount Montant de la transaction
 * @param options Options du hook
 */
export function useTransactionFees(
    type: string,
    amount: number,
    options: UseTransactionFeesOptions = {},
) {
    const { enabled = true, staleTime = 60000 } = options; // 1 minute par défaut

    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ["transaction-fees", type, amount],
        queryFn: async () => {
            if (!type || amount <= 0) {
                return { fees: 0, total: amount };
            }
            return calculateTransactionFees(type, amount);
        },
        enabled: enabled && !!type && amount > 0,
        staleTime: staleTime,
        // Les frais ne changent pas souvent, donc on peut garder en cache
        gcTime: 5 * 60 * 1000, // 5 minutes
    });

    return {
        fees: data?.fees || 0,
        total: data?.total || amount,
        isLoading,
        isError,
        error: isError ? (error as Error).message : null,
        refetch,
    };
}
