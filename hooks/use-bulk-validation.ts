// hooks/use-bulk-validation.ts

import { useQuery } from "@tanstack/react-query";
import type { ValidationResult } from "@/lib/tournaments/bulk-validation";

// Server Action wrapper pour appeler la validation depuis le client
import { validateGroupCapacityAction } from "@/actions/validation";

/**
 * Hook pour vérifier la capacité d'un groupe
 * À utiliser dans les Client Components
 */
export function useGroupCapacity(groupId: string, additionalCount: number = 1) {
  return useQuery({
    queryKey: ["group-capacity", groupId, additionalCount],
    queryFn: async (): Promise<ValidationResult> => {
      const result = await validateGroupCapacityAction(groupId, additionalCount);
      return result;
    },
    enabled: !!groupId,
    staleTime: 1000 * 30, // 30 secondes
  });
}