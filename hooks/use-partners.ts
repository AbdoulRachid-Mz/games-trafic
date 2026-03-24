// @/hooks/use-partners.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getPartners,
  getPartnerById,
  getFeaturedPartners,
  createPartner,
  updatePartner,
  deletePartner,
} from "@/actions/partners";
import type {
  PartnerFilters,
  CreatePartnerInput,
  UpdatePartnerInput,
} from "@/validations/partners";
import { type PartnerCard } from "@/types/view-models";
import { toast } from "sonner";

// Hook to fetch partners with filters
export function usePartners(filters?: PartnerFilters) {
  return useQuery({
    queryKey: ["partners", filters],
    queryFn: async () => {
      const result = await getPartners(filters);
      if (!result.success) {
        throw new Error(result.error);
      }
      return { partners: (result.data as PartnerCard[]) || [], total: result.total || 0 };
    },
  });
}

// Hook to fetch a single partner
export function usePartner(id: string) {
  return useQuery({
    queryKey: ["partner", id],
    queryFn: async () => {
      const result = await getPartnerById(id);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!id,
  });
}

// Hook to fetch featured partners
export function useFeaturedPartners() {
  return useQuery({
    queryKey: ["partners", "featured"],
    queryFn: async () => {
      const result = await getFeaturedPartners();
      if (!result.success) {
        throw new Error(result.error);
      }
      return (result.data as PartnerCard[]) || [];
    },
  });
}

// Hook to create a partner
export function useCreatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      data,
      userId,
    }: {
      data: CreatePartnerInput;
      userId: string;
    }) => {
      const result = await createPartner(data, userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] }); 
      toast.success("Partenaire créé avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to create partner");
    },
  });
}

// Hook to update a partner
export function useUpdatePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      userId,
    }: {
      id: string;
      data: UpdatePartnerInput;
      userId: string;
    }) => {
      const result = await updatePartner(id, data, userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      queryClient.invalidateQueries({ queryKey: ["partner", variables.id] });
      toast.success("Partenaire mis à jour avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to update partner");
    },
  });
}

// Hook to delete a partner
export function useDeletePartner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const result = await deletePartner(id, userId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partners"] });
      toast.success("Partenaire supprimé avec succès");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to delete partner");
    },
  });
}
