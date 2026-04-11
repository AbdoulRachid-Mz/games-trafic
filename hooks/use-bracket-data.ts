// @/hooks/use-bracket-data.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getBracketNodeById, deleteMatch } from '@/actions/phases';
import { getEditionRegistrations, getMatches } from '@/actions/tournaments';
import { getPhaseGroupParticipants } from '@/actions/phases';
import { toast } from 'sonner';

export function useBracketData(tournamentId: string, editionId: string, bracketId: string) {
  const queryClient = useQueryClient();

  // Query pour récupérer le nœud
  const nodeQuery = useQuery({
    queryKey: ['bracket-node', bracketId],
    queryFn: async () => {
      const node = await getBracketNodeById(bracketId, {
        populate: ['phase', 'group'],
      });
      return node;
    },
  });

  // Query pour les inscriptions
  const registrationsQuery = useQuery({
    queryKey: ['edition-registrations', editionId],
    queryFn: async () => {
      const res = await getEditionRegistrations({
        filters: { editionId },
        options: { populate: ['member', 'member.user', 'member.team'] },
        pagination: { page: 1, limit: 500 },
      });
      return res.data;
    },
  });

  // Query pour les participants du groupe
  const groupParticipantsQuery = useQuery({
    queryKey: ['group-participants', nodeQuery.data?.groupId],
    queryFn: async () => {
      if (!nodeQuery.data?.groupId) return [];
      const res = await getPhaseGroupParticipants({
        filters: { groupId: nodeQuery.data.groupId },
        options: { sortBy: 'position', sortOrder: 'asc' },
        pagination: { page: 1, limit: 500 },
      });
      return res.data;
    },
    enabled: !!nodeQuery.data?.groupId,
  });

  // Query pour les matchs
  const matchesQuery = useQuery({
    queryKey: ['bracket-matches', bracketId, editionId],
    queryFn: async () => {
      const res = await getMatches({
        filters: { editionId, bracketNodeId: bracketId },
        options: { sortBy: 'round', sortOrder: 'asc' },
        pagination: { page: 1, limit: 100 },
      });
      return res.data;
    },
  });

  // Mutation pour supprimer un match
  const deleteMatchMutation = useMutation({
    mutationFn: async (matchId: string) => {
      const result = await deleteMatch(matchId);
      return result;
    },
    onSuccess: () => {
      // Invalider et re-fetch les données
      queryClient.invalidateQueries({ queryKey: ['bracket-matches', bracketId] });
      queryClient.invalidateQueries({ queryKey: ['bracket-node', bracketId] });
      toast.success('Match supprimé avec succès');
    },
    onError: (error) => {
      toast.error('Erreur lors de la suppression du match');
      console.error(error);
    },
  });

  return {
    node: nodeQuery.data,
    registrations: registrationsQuery.data || [],
    groupParticipants: groupParticipantsQuery.data || [],
    matches: matchesQuery.data || [],
    isLoading: nodeQuery.isLoading || registrationsQuery.isLoading || matchesQuery.isLoading,
    isError: nodeQuery.isError || registrationsQuery.isError || matchesQuery.isError,
    deleteMatch: deleteMatchMutation.mutate,
    isDeleting: deleteMatchMutation.isPending,
    refetchAll: () => {
      nodeQuery.refetch();
      registrationsQuery.refetch();
      groupParticipantsQuery.refetch();
      matchesQuery.refetch();
    },
  };
}