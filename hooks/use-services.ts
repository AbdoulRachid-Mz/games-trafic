// import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
// import { getServiceById, getServices, getServiceStats, createService, updateService, deleteService } from '@/actions/services';
// import { type Service, type NewService } from '@/database/schema';
// import { type ListQuery, type PaginationResponse } from '@/types/api';

// // Query keys factory
// const serviceKeys = {
//   all: ['services'] as const,
//   lists: () => [...serviceKeys.all, 'list'] as const,
//   list: (filters: any) => [...serviceKeys.lists(), filters] as const,
//   details: () => [...serviceKeys.all, 'detail'] as const,
//   detail: (id: string) => [...serviceKeys.details(), id] as const,
//   stats: () => [...serviceKeys.all, 'stats'] as const,
//   stat: (filters: any) => [...serviceKeys.stats(), filters] as const,
//   infinite: () => [...serviceKeys.all, 'infinite'] as const,
// };

// // ============================================================================
// // QUERIES
// // ============================================================================

// /**
//  * Hook to fetch a single service by ID
//  */
// export function useService(id: string, options?: { populate?: string[] }) {
//   return useQuery({
//     queryKey: serviceKeys.detail(id),
//     queryFn: () => getServiceById(id, options),
//     enabled: !!id,
//     staleTime: 5 * 60 * 1000, // 5 minutes
//   });
// }

// /**
//  * Hook to fetch paginated services with filters
//  */
// export function useServices(query: ListQuery<any> = {}) {
//   return useQuery({
//     queryKey: serviceKeys.list(query),
//     queryFn: () => getServices(query),
//     staleTime: 5 * 60 * 1000,
//     keepPreviousData: true,
//   });
// }

// /**
//  * Hook to fetch services infinitely (for large lists)
//  */

// export function useInfiniteServices(query: ListQuery<any> = {}) {
//   return useInfiniteQuery({
//     queryKey: serviceKeys.infinite(),
//     queryFn: ({ pageParam = 1 }) => getServices({ ...query, pagination: { ...query.pagination, page: pageParam } }),
//     getNextPageParam: (lastPage: PaginationResponse<Service>) => {
//       return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined;
//     },
//     staleTime: 5 * 60 * 1000,
//   });
// }

// /**
//  * Hook to fetch service statistics
//  */
// export function useServiceStats(filters?: any) {
//   return useQuery({
//     queryKey: serviceKeys.stat(filters),
//     queryFn: () => getServiceStats(filters),
//     staleTime: 10 * 60 * 1000, // 10 minutes
//   });
// }

// // ============================================================================
// // MUTATIONS
// // ============================================================================

// /**
//  * Hook to create a new service
//  */
// export function useCreateService() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (data: NewService) => createService(data),
//     onSuccess: (newService) => {
//       // Invalidate list queries to refetch
//       queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: serviceKeys.stats() });
//       // Optionally add to cache immediately
//       queryClient.setQueryData(serviceKeys.detail(newService.id), newService);
//     },
//   });
// }

// /**
//  * Hook to update a service
//  */
// export function useUpdateService() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ id, data }: { id: string; data: Partial<NewService> }) => updateService(id, data),
//     onSuccess: (updatedService) => {
//       // Update cache immediately
//       queryClient.setQueryData(serviceKeys.detail(updatedService.id), updatedService);
//       // Invalidate list queries
//       queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: serviceKeys.stats() });
//     },
//   });
// }

// /**
//  * Hook to delete (soft delete) a service
//  */
// export function useDeleteService() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: (id: string) => deleteService(id),
//     onSuccess: (deletedService) => {
//       // Remove from cache
//       queryClient.removeQueries({ queryKey: serviceKeys.detail(deletedService.id) });
//       // Invalidate list queries
//       queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: serviceKeys.stats() });
//     },
//   });
// }

// // ============================================================================
// // OPTIMISTIC UPDATES (optional helpers)
// // ============================================================================

// /**
//  * Helper for optimistic updates when updating a service
//  */
// export function useOptimisticUpdateService() {
//   const queryClient = useQueryClient();

//   return useMutation({
//     mutationFn: ({ id, data }: { id: string; data: Partial<NewService> }) => updateService(id, data),
//     onMutate: async ({ id, data }) => {
//       // Cancel any outgoing refetches
//       await queryClient.cancelQueries({ queryKey: serviceKeys.detail(id) });

//       // Snapshot the previous value
//       const previousService = queryClient.getQueryData(serviceKeys.detail(id));

//       // Optimistically update to the new value
//       if (previousService) {
//         queryClient.setQueryData(serviceKeys.detail(id), { ...previousService, ...data });
//       }

//       // Return context with the previous service
//       return { previousService };
//     },
//     onError: (err, { id }, context) => {
//       // Rollback on error
//       if (context?.previousService) {
//         queryClient.setQueryData(serviceKeys.detail(id), context.previousService);
//       }
//     },
//     onSettled: (data, error, { id }) => {
//       // Always refetch after error or success
//       queryClient.invalidateQueries({ queryKey: serviceKeys.detail(id) });
//       queryClient.invalidateQueries({ queryKey: serviceKeys.lists() });
//       queryClient.invalidateQueries({ queryKey: serviceKeys.stats() });
//     },
//   });
// }
