// @/hooks/use-bracket-manager.ts
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getBracketNodes,
  getBracketNodeById,
  createBracketNode,
  updateBracketNode,
  deleteBracketNode,
  getPhaseGroupParticipants,
} from "@/actions/phases";
import { getEditionRegistrations } from "@/actions/tournaments";
import type { BracketNode, NewBracketNode } from "@/database/schema";
import {
  generateSingleEliminationBracket,
} from "@/lib/tournaments/bracket.generator";
import { toast } from "sonner";

// ============================================================================
// QUERY KEYS
// ============================================================================
export const bracketKeys = {
  all: ["bracket-nodes"] as const,
  lists: () => [...bracketKeys.all, "list"] as const,
  listByPhase: (phaseId: string) =>
    [...bracketKeys.lists(), "phase", phaseId] as const,
  listByGroup: (groupId: string) =>
    [...bracketKeys.lists(), "group", groupId] as const,
  details: () => [...bracketKeys.all, "detail"] as const,
  detail: (id: string) => [...bracketKeys.details(), id] as const,
};

// ============================================================================
// QUERIES
// ============================================================================

export function useBracketNodesByPhase(phaseId: string, enabled = true) {
  return useQuery({
    queryKey: bracketKeys.listByPhase(phaseId),
    queryFn: () =>
      getBracketNodes({
        filters: { phaseId },
        options: { sortBy: "round", sortOrder: "asc" },
        pagination: { page: 1, limit: 500 },
      }),
    enabled: !!phaseId && enabled,
    staleTime: 1000 * 60,
  });
}

export function useBracketNodesByGroup(groupId: string, enabled = true) {
  return useQuery({
    queryKey: bracketKeys.listByGroup(groupId),
    queryFn: () =>
      getBracketNodes({
        filters: { groupId },
        options: { sortBy: "round", sortOrder: "asc" },
        pagination: { page: 1, limit: 500 },
      }),
    enabled: !!groupId && enabled,
    staleTime: 1000 * 60,
  });
}

// ============================================================================
// MANAGER HOOK
// ============================================================================

interface BracketManagerContext {
  phaseId: string;
  groupId?: string;
  editionId?: string;
}

/**
 * useBracketManager — génération et gestion de l'arbre d'élimination
 */
export function useBracketManager(context: BracketManagerContext) {
  const { phaseId, groupId, editionId } = context;
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: bracketKeys.listByPhase(phaseId),
    });
    if (groupId) {
      queryClient.invalidateQueries({
        queryKey: bracketKeys.listByGroup(groupId),
      });
    }
    queryClient.invalidateQueries({
      queryKey: ["tournament-editions", "detail"],
    });
  };

  // ---- CREATE NODE ----
  const createNode = useMutation({
    mutationFn: (data: NewBracketNode) => createBracketNode(data),
    onSuccess: () => {
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la création du nœud");
    },
  });

  // ---- UPDATE NODE ----
  const updateNode = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<NewBracketNode>;
    }) => updateBracketNode(id, data),
    onSuccess: () => {
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la mise à jour du nœud");
    },
  });

  // ---- DELETE NODE ----
  const deleteNode = useMutation({
    mutationFn: (id: string) => deleteBracketNode(id),
    onSuccess: () => {
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la suppression du nœud");
    },
  });

  // ---- LINK NODES (set parentNodeId) ----
  const linkNodes = useMutation({
    mutationFn: ({
      childId,
      parentId,
    }: {
      childId: string;
      parentId: string;
    }) => updateBracketNode(childId, { parentNodeId: parentId }),
    onSuccess: () => {
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la liaison des nœuds");
    },
  });

  // ---- DETECT CONFLICTS ----
  const detectConflicts = async (nodes: BracketNode[]) => {
    const conflicts: string[] = [];

    // Check for nodes pointing to non-existent parents
    const nodeIds = new Set(nodes.map((n) => n.id));
    for (const node of nodes) {
      if (node.parentNodeId && !nodeIds.has(node.parentNodeId)) {
        conflicts.push(
          `Le nœud ${node.id} pointe vers un parent inexistant: ${node.parentNodeId}`
        );
      }
    }

    // Check for duplicate (round, matchNumber) pairs
    const seen = new Map<string, string>();
    for (const node of nodes) {
      const key = `r${node.round ?? 0}_m${node.matchNumber ?? 0}`;
      if (seen.has(key)) {
        conflicts.push(
          `Doublon détecté : round ${node.round}, match ${node.matchNumber}`
        );
      } else {
        seen.set(key, node.id);
      }
    }

    return conflicts;
  };

  // ---- GENERATE SINGLE ELIMINATION ----
  /**
   * Génère un bracket single elimination depuis les participants d'un groupe
   * ou de l'édition entière si pas de groupId.
   */
  const generateSingleElimination = useMutation({
    mutationFn: async (mode: "AUTO" | "MANUAL" = "AUTO") => {
      if (mode === "MANUAL") {
        // For manual mode, just return empty — user adds nodes manually
        return [];
      }

      // Récupérer les participants
      let participantsList: Array<{
        id: string;
        name: string;
        status: "ACTIVE" | "ELIMINATED" | "QUALIFIED" | "PENDING";
      }> = [];

      if (groupId) {
        const groupParticipants = await getPhaseGroupParticipants({
          filters: { groupId },
          pagination: { page: 1, limit: 200 },
        });
        participantsList = groupParticipants.data.map((p: any) => ({
          id: p.registrationId,
          name:
            p.registration?.member?.displayName ||
            `Participant_${p.registrationId.slice(0, 4)}`,
          status: "ACTIVE" as const,
        }));
      } else if (editionId) {
        const registrations = await getEditionRegistrations({
          filters: { editionId },
          pagination: { page: 1, limit: 500 },
        });
        participantsList = registrations.data.map((r: any) => ({
          id: r.id,
          name:
            r.member?.displayName ||
            r.member?.user?.username ||
            `Participant_${r.id.slice(0, 4)}`,
          status: "ACTIVE" as const,
        }));
      }

      if (participantsList.length < 2) {
        throw new Error(
          "Il faut au moins 2 participants pour générer un bracket"
        );
      }

      // Générer la structure bracket
      const bracket = generateSingleEliminationBracket(participantsList);

      // Persister les nœuds en DB
      const createdNodes: BracketNode[] = [];
      for (let nodeIndex = 0; nodeIndex < bracket.nodes.length; nodeIndex++) {
        const node = bracket.nodes[nodeIndex];
        const created = await createBracketNode({
          phaseId,
          groupId: groupId || null,
          bracketType: "WINNER",
          round: node.round,
          matchNumber: nodeIndex + 1,
          depth: node.round - 1,
          isDeleted: false,
        });
        createdNodes.push(created);
      }

      return createdNodes;
    },
    onSuccess: (nodes) => {
      toast.success(
        `Bracket single élimination généré (${nodes.length} matchs)`
      );
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(err.message || "Erreur lors de la génération du bracket");
    },
  });

  // ---- GENERATE DOUBLE ELIMINATION ----
  const generateDoubleElimination = useMutation({
    mutationFn: async () => {
      // Double elimination: Winner bracket + Loser bracket
      // For now, generate winner bracket + notify that loser bracket is separate
      toast.info(
        "Double élimination : le bracket perdants doit être créé séparément"
      );
      return generateSingleElimination.mutateAsync("AUTO");
    },
    onSuccess: () => {
      invalidate();
    },
    onError: (err: Error) => {
      toast.error(
        err.message || "Erreur lors de la génération du bracket double"
      );
    },
  });

  return {
    // Nodes CRUD
    createNode,
    updateNode,
    deleteNode,
    linkNodes,
    // Generation
    generateSingleElimination,
    generateDoubleElimination,
    // Helpers
    detectConflicts,
    // State
    isLoading:
      createNode.isPending ||
      updateNode.isPending ||
      deleteNode.isPending ||
      generateSingleElimination.isPending ||
      generateDoubleElimination.isPending,
  };
}
