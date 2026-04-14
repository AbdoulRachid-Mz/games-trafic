// @/hooks/use-signals.ts  createSignal,
import {
  useMutation,
  useQuery,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import {
  getSignalById,
  getSignals,
  updateSignal,
  deleteSignal,
  markSignalAsProcessed,
  getSignalsCountByStatus,
  assignSignal,
  createSignal,
} from "@/actions/signals";
import {
  CreateSignalInput,
  SignalFilters,
  UpdateSignalInput,
} from "../types/api";

const QUERY_KEYS = {
  signals: "signals",
  signal: (id: string) => ["signal", id],
  signalsCount: "signals-count",
} as const;

// ------------------ Queries ------------------

export function useSignalById(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.signal(id),
    queryFn: () => getSignalById(id),
    enabled: !!id,
  });
}

export function useSignals(filters: SignalFilters) {
  return useQuery({
    queryKey: [QUERY_KEYS.signals, filters],
    queryFn: () => getSignals(filters),
    placeholderData: (previousData) => previousData,
  });
}

export function useInfiniteSignals(initialFilters: SignalFilters = {}) {
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.signals, "infinite", initialFilters],
    queryFn: ({ pageParam = 0 }) =>
      getSignals({ ...initialFilters, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      const nextOffset = pages.reduce((acc, p) => acc + p.data.length, 0);
      return nextOffset < lastPage.pagination.total ? nextOffset : undefined;
    },
  });
}

export function useSignalsCountByStatus(userId?: string) {
  return useQuery({
    queryKey: [QUERY_KEYS.signalsCount, userId],
    queryFn: () => getSignalsCountByStatus(userId),
  });
}

// ------------------ Mutations ------------------

export function useCreateSignal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSignalInput) => createSignal(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.signals] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.signalsCount] });
    },
  });
}

export function useUpdateSignal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateSignalInput }) =>
      updateSignal(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.signal(id) });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.signals] });
    },
  });
}

export function useDeleteSignal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSignal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.signals] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.signalsCount] });
    },
  });
}

export function useMarkSignalAsProcessed() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => markSignalAsProcessed(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.signal(id) });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.signals] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.signalsCount] });
    },
  });
}

export function useAssignSignal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adminId }: { id: string; adminId: string }) =>
      assignSignal(id, adminId),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.signal(id) });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.signals] });
    },
  });
}
