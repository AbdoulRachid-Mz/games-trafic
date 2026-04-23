export const FINAL_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

export function getRequiredWins(format: string) {
  switch (format) {
    case "BEST_OF_5":
      return 3;
    case "BEST_OF_3":
      return 2;
    default:
      return 1;
  }
}

export function computeWinner(matches: any[], requiredWins: number) {
  const wins = new Map<string, number>();

  for (const m of matches) {
    if (!m.winnerRegistrationId) continue;

    wins.set(
      m.winnerRegistrationId,
      (wins.get(m.winnerRegistrationId) || 0) + 1,
    );
  }

  for (const [id, count] of wins.entries()) {
    if (count >= requiredWins) {
      return { winnerId: id, wins };
    }
  }

  return { winnerId: null, wins };
}

export function resolveSlotIndex(childPosition?: string | null) {
  if (!childPosition) return null;

  if (["UPPER", "WINNER"].includes(childPosition)) return 0;
  if (["LOWER", "LOSER"].includes(childPosition)) return 1;

  return null;
}


// Dans bracket-engine.ts, ajouter cette fonction
export function computeAggregatedWinner(
  matches: any[],
): {
  winnerId: string | null;
  aggregateScore1: number;
  aggregateScore2: number;
} {
  let aggregateScore1 = 0;
  let aggregateScore2 = 0;
  let winnerId: string | null = null;

  for (const m of matches) {
    if (m.status !== "COMPLETED" || !m.confirmedByAdmin) continue;

    aggregateScore1 += m.score1 ?? 0;
    aggregateScore2 += m.score2 ?? 0;
  }

  if (aggregateScore1 > aggregateScore2) {
    winnerId = matches[0]?.participant1RegistrationId ?? null;
  } else if (aggregateScore2 > aggregateScore1) {
    winnerId = matches[0]?.participant2RegistrationId ?? null;
  }

  return { winnerId, aggregateScore1, aggregateScore2 };
}