import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  getGuideById,
  getGuides,
  getGuideSteps,
  getGuideStats,
  createGuide,
  updateGuide,
  deleteGuide,
  restoreGuide,
  createGuideStep,
  updateGuideStep,
  deleteGuideStep,
  incrementGuideViewCount,
  getGuideStepById,
} from "@/actions/guides";
import { GuideFilters, GuideStepFilters, ListQuery } from "@/types/api";
import { NewGuide, NewGuideStep } from "@/database/schema";

// ===========================
// Query Keys
// ===========================
const guideKeys = {
  all: ["guides"] as const,
  lists: () => [...guideKeys.all, "list"] as const,
  list: (filters: GuideFilters) => [...guideKeys.lists(), filters] as const,
  infinite: (filters: GuideFilters) =>
    [...guideKeys.lists(), "infinite", filters] as const,
  details: () => [...guideKeys.all, "detail"] as const,
  detail: (id: string) => [...guideKeys.details(), id] as const,
  steps: (guideId: string) => [...guideKeys.detail(guideId), "steps"] as const,
  stats: () => [...guideKeys.all, "stats"] as const,
};

// ===========================
// Queries
// ===========================

/**
 * Hook pour récupérer un guide par ID (avec cache)
 */
export function useGuideById(id: string, options?: { populate?: string[] }) {
  return useQuery({
    queryKey: guideKeys.detail(id),
    queryFn: () => getGuideById(id, options),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}

/**
 * Hook pour lister les guides avec pagination classique
 */
export function useGuides(query: ListQuery<GuideFilters> = {}) {
  return useQuery({
    queryKey: guideKeys.list(query.filters || {}),
    queryFn: () => getGuides(query),
    staleTime: 3 * 60 * 1000, // 3 min
  });
}

/**
 * Hook pour lister les guides en pagination infinie (scroll infini)
 */
export function useInfiniteGuides(filters: GuideFilters = {}) {
  return useInfiniteQuery({
    queryKey: guideKeys.infinite(filters),
    queryFn: ({ pageParam = 1 }) =>
      getGuides({ pagination: { page: pageParam, limit: 20 }, filters }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 3 * 60 * 1000,
  });
}

/**
 * Hook pour lister les étapes d’un guide
 */
export function useGuideSteps(
  guideId: string,
  query: ListQuery<GuideStepFilters> = {}
) {
  return useQuery({
    queryKey: guideKeys.steps(guideId),
    queryFn: () => getGuideSteps(guideId, query),
    enabled: !!guideId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook pour récupérer les statistiques globales des guides
 */
export function useGuideStats(filters?: GuideFilters) {
  return useQuery({
    queryKey: [...guideKeys.stats(), filters],
    queryFn: () => getGuideStats(filters),
    staleTime: 10 * 60 * 1000, // 10 min
  });
}

// ===========================
// Mutations
// ===========================

/**
 * Hook pour créer un guide
 */
export function useCreateGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewGuide) => createGuide(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: guideKeys.lists() });
      queryClient.invalidateQueries({ queryKey: guideKeys.stats() });
    },
  });
}

/**
 * Hook pour mettre à jour un guide
 */
export function useUpdateGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewGuide> }) =>
      updateGuide(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: guideKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: guideKeys.lists() });
    },
  });
}

/**
 * Hook pour supprimer (soft) un guide
 */
export function useDeleteGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteGuide(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: guideKeys.lists() });
      queryClient.invalidateQueries({ queryKey: guideKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: guideKeys.stats() });
    },
  });
}

/**
 * Hook pour restaurer un guide supprimé
 */
export function useRestoreGuide() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => restoreGuide(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: guideKeys.lists() });
      queryClient.invalidateQueries({ queryKey: guideKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: guideKeys.stats() });
    },
  });
}

/**
 * Hook pour créer une étape de guide
 */
export function useCreateGuideStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: NewGuideStep) => createGuideStep(data),
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({
        queryKey: guideKeys.steps(data.guideId),
      });
    },
  });
}

/**
 * Hook pour mettre à jour une étape de guide
 */
export function useUpdateGuideStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NewGuideStep> }) =>
      updateGuideStep(id, data),
    onSuccess: async (_, { id }) => {
      const step = await getGuideStepById(id);
      if (step) {
        queryClient.invalidateQueries({
          queryKey: guideKeys.steps(step.guideId),
        });
      }
    },
  });
}

/**
 * Hook pour supprimer une étape de guide
 */
export function useDeleteGuideStep() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const step = await getGuideStepById(id);
      if (!step) throw new Error("Step not found");
      await deleteGuideStep(id);
      return step.guideId;
    },
    onSuccess: (guideId) => {
      queryClient.invalidateQueries({ queryKey: guideKeys.steps(guideId) });
    },
  });
}

/**
 * Hook pour incrémenter le compteur de vues d’un guide
 */
export function useIncrementGuideView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => incrementGuideViewCount(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: guideKeys.detail(id) });
    },
  });
}
