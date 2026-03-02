import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "@/actions/users";
import { toast } from "sonner";

export function useProfileUpdate(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => updateUser(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile"] });
      toast.success("Profil mis à jour");
    },
    onError: (error: any) => {
      toast.error(error.message || "Erreur lors de la mise à jour");
    },
  });
}