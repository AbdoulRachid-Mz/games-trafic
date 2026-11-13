/**
 * lib/tournaments/bracket-standings.ts
 *
 * Mise en forme PURE des brackets pour l'affichage « classement de phase »
 * des phases d'élimination (où il n'existe pas de groupe de classement).
 *
 * Aucune règle de points n'est calculée ici : on lit uniquement les nœuds
 * déjà produits par le moteur de progression (round, participants, vainqueur,
 * isCompleted). Les phases à groupes doivent utiliser `getPhaseStandings`.
 */

export interface BracketNodeInput {
  round?: number | null;
  isCompleted?: boolean | null;
  winnerRegistrationId?: string | null;
  metadata?: unknown;
}

export interface BracketStandingViewRow {
  registrationId: string;
  participantName?: string;
  round: number;
  won: boolean;
  eliminated?: boolean;
  position: number;
}

interface Entry {
  registrationId: string;
  round: number;
  won: boolean;
  eliminated: boolean;
}

function participantIds(node: BracketNodeInput): string[] {
  const metadata = node.metadata;
  if (!metadata || typeof metadata !== "object") return [];
  const raw = (metadata as { participants?: unknown }).participants;
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (value): value is string =>
      typeof value === "string" && value.trim().length > 0,
  );
}

export function computeBracketStandings(
  nodes: BracketNodeInput[],
  namesById: Map<string, string> = new Map(),
): BracketStandingViewRow[] {
  const entries = new Map<string, Entry>();

  for (const node of nodes) {
    const round = node.round ?? 0;
    const ids = participantIds(node);
    if (ids.length === 0 && node.winnerRegistrationId) {
      ids.push(node.winnerRegistrationId);
    }

    for (const id of ids) {
      const current =
        entries.get(id) ??
        ({
          registrationId: id,
          round: 0,
          won: false,
          eliminated: false,
        } satisfies Entry);
      current.round = Math.max(current.round, round);

      if (node.isCompleted && node.winnerRegistrationId) {
        if (id === node.winnerRegistrationId) {
          current.won = true;
          current.eliminated = false;
        } else {
          current.won = false;
          current.eliminated = true;
        }
      }

      entries.set(id, current);
    }
  }

  return [...entries.values()]
    .sort((a, b) => {
      if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
      if (b.round !== a.round) return b.round - a.round;
      return a.registrationId.localeCompare(b.registrationId);
    })
    .map((entry, index) => ({
      registrationId: entry.registrationId,
      participantName: namesById.get(entry.registrationId),
      round: entry.round,
      won: entry.won,
      eliminated: entry.eliminated,
      position: index + 1,
    }));
}
