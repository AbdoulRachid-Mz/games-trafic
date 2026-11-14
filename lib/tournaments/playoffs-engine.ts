/**
 * Playoff Bracket Generation & Layout Engine
 * Games-Trafics Esports
 *
 * Moteur de calcul et de transformation pour les schémas de tournois,
 * supportant l'arbre symétrique officiel "THE PLAYOFFS", l'arbre horizontal
 * esports et les vues avec bannières / images collées.
 */

export interface PlayoffParticipant {
  id?: string;
  registrationId?: string;
  name: string;
  tag?: string;
  avatar?: string;
  seed?: number;
  score?: number | null;
  isWinner?: boolean;
  isPlaceholder?: boolean;
}

export interface PlayoffMatchNode {
  id: string;
  code?: string;
  round: number;
  roundName: string;
  matchNumber?: number;
  participant1: PlayoffParticipant;
  participant2: PlayoffParticipant;
  status: "SCHEDULED" | "LIVE" | "COMPLETED" | "PENDING";
  scheduledTime?: string | null;
  winnerRegistrationId?: string | null;
  isFinal?: boolean;
  isSemiFinal?: boolean;
  isQuarterFinal?: boolean;
  isThirdPlace?: boolean;
  side?: "left" | "right" | "center";
  nextMatchId?: string | null;
}

export interface SymmetricalPlayoffTree {
  totalRounds: number;
  leftWing: {
    rounds: {
      roundIndex: number;
      roundName: string;
      matches: PlayoffMatchNode[];
    }[];
  };
  rightWing: {
    rounds: {
      roundIndex: number;
      roundName: string;
      matches: PlayoffMatchNode[];
    }[];
  };
  center: {
    finalMatch?: PlayoffMatchNode;
    thirdPlaceMatch?: PlayoffMatchNode;
  };
  allMatches: PlayoffMatchNode[];
}

export interface PlayoffThemeConfig {
  id: string;
  name: string;
  bgImage?: string;
  badgeStyle: "neon-cyan-orange" | "cyber-purple" | "gold-championship";
}

export const PLAYOFF_THEMES: PlayoffThemeConfig[] = [
  {
    id: "classic-championship",
    name: "Playoffs Championnat (Cyan & Orange)",
    badgeStyle: "neon-cyan-orange",
    bgImage: "/playoffs/playoffs-4.jpg",
  },
  {
    id: "cyber-arena",
    name: "Arène Cyber Esports",
    badgeStyle: "cyber-purple",
    bgImage: "/playoffs/playoffs-1.webp",
  },
  {
    id: "world-trophy",
    name: "World Trophy Élite",
    badgeStyle: "gold-championship",
    bgImage: "/playoffs/playoffs-5.jpg",
  },
];

/**
 * Normalise un participant brut de base de données en PlayoffParticipant
 */
export function normalizePlayoffParticipant(
  rawParticipant: any,
  placeholderLabel = "À déterminer"
): PlayoffParticipant {
  if (!rawParticipant) {
    return {
      name: placeholderLabel,
      isPlaceholder: true,
    };
  }

  const member = rawParticipant.member;
  const user = member?.user;
  const team = member?.team;

  const name =
    team?.name ||
    rawParticipant.name ||
    rawParticipant.displayName ||
    member?.displayName ||
    user?.username ||
    user?.name ||
    placeholderLabel;

  const tag =
    team?.tag ||
    rawParticipant.gameTag ||
    member?.gameLevel ||
    undefined;

  const avatar =
    team?.logo ||
    rawParticipant.avatar ||
    member?.avatar ||
    user?.profileImage ||
    undefined;

  return {
    id: rawParticipant.id,
    registrationId: rawParticipant.registrationId || rawParticipant.id,
    name,
    tag,
    avatar,
    seed: rawParticipant.seed,
    score: rawParticipant.score ?? null,
    isWinner: !!rawParticipant.isWinner,
    isPlaceholder: false,
  };
}

/**
 * Extrait et structure les rounds et les matchs en arbre symétrique
 */
export function buildSymmetricalPlayoffTree(
  matches: any[] = [],
  nodes: any[] = []
): SymmetricalPlayoffTree {
  // 1. Déterminer les matchs existants ou reconstituer via les nœuds
  const normalizedMatches: PlayoffMatchNode[] = [];

  const rawMatches = matches.length > 0 ? matches : [];

  // Grouper par round
  const byRound: Record<number, any[]> = {};
  rawMatches.forEach((m) => {
    const round = m.round || 1;
    if (!byRound[round]) byRound[round] = [];
    byRound[round].push(m);
  });

  const roundNumbers = Object.keys(byRound)
    .map(Number)
    .sort((a, b) => a - b);

  const totalRounds = Math.max(1, roundNumbers.length);
  const finalRoundNumber = roundNumbers[roundNumbers.length - 1] || 1;

  rawMatches.forEach((m, idx) => {
    const round = m.round || 1;
    const distanceToFinal = finalRoundNumber - round;
    const isFinal = distanceToFinal === 0 && !m.metadata?.isThirdPlace;
    const isSemiFinal = distanceToFinal === 1;
    const isQuarterFinal = distanceToFinal === 2;
    const isThirdPlace =
      m.metadata?.isThirdPlace === true ||
      m.bracketNode?.bracketType === "CONSOLATION";

    let roundName = `Round ${round}`;
    if (isThirdPlace) roundName = "3ème Place";
    else if (isFinal) roundName = "Grande Finale";
    else if (isSemiFinal) roundName = "Demi-finales";
    else if (isQuarterFinal) roundName = "Quarts de finale";
    else if (distanceToFinal === 3) roundName = "Huitièmes";

    const p1 = normalizePlayoffParticipant(
      m.participant1 || {
        id: m.participant1RegistrationId,
        score: m.score1,
        isWinner: m.winnerRegistrationId && m.winnerRegistrationId === m.participant1RegistrationId,
      },
      m.placeholderParticipant1 || `Vainqueur Match ${idx * 2 + 1}`
    );
    p1.score = m.score1;
    if (m.winnerRegistrationId && m.winnerRegistrationId === m.participant1RegistrationId) {
      p1.isWinner = true;
    }

    const p2 = normalizePlayoffParticipant(
      m.participant2 || {
        id: m.participant2RegistrationId,
        score: m.score2,
        isWinner: m.winnerRegistrationId && m.winnerRegistrationId === m.participant2RegistrationId,
      },
      m.placeholderParticipant2 || `Vainqueur Match ${idx * 2 + 2}`
    );
    p2.score = m.score2;
    if (m.winnerRegistrationId && m.winnerRegistrationId === m.participant2RegistrationId) {
      p2.isWinner = true;
    }

    normalizedMatches.push({
      id: m.id || `match-${idx}`,
      code: m.matchCode || `M${idx + 1}`,
      round,
      roundName,
      matchNumber: m.matchNumber || idx + 1,
      participant1: p1,
      participant2: p2,
      status: m.status || "SCHEDULED",
      scheduledTime: m.scheduledTime,
      winnerRegistrationId: m.winnerRegistrationId,
      isFinal,
      isSemiFinal,
      isQuarterFinal,
      isThirdPlace,
    });
  });

  // Si pas de matchs existants, générer un template virtuel basé sur nodes ou un bracket standard 8 ou 16
  if (normalizedMatches.length === 0) {
    const mockTree = generateMockPlayoffTree(8);
    return mockTree;
  }

  // 2. Séparer en Aile Gauche, Aile Droite et Centre
  const finalMatch = normalizedMatches.find((m) => m.isFinal);
  const thirdPlaceMatch = normalizedMatches.find((m) => m.isThirdPlace);

  const nonFinalMatches = normalizedMatches.filter(
    (m) => !m.isFinal && !m.isThirdPlace
  );

  // Grouper les non-finals par round
  const roundsMap: Record<number, PlayoffMatchNode[]> = {};
  nonFinalMatches.forEach((m) => {
    if (!roundsMap[m.round]) roundsMap[m.round] = [];
    roundsMap[m.round].push(m);
  });

  const sortedRounds = Object.keys(roundsMap)
    .map(Number)
    .sort((a, b) => a - b);

  const leftRounds: {
    roundIndex: number;
    roundName: string;
    matches: PlayoffMatchNode[];
  }[] = [];

  const rightRounds: {
    roundIndex: number;
    roundName: string;
    matches: PlayoffMatchNode[];
  }[] = [];

  sortedRounds.forEach((rNum, rIdx) => {
    const roundMatches = roundsMap[rNum];
    const half = Math.ceil(roundMatches.length / 2);

    const left = roundMatches.slice(0, half).map((m) => ({ ...m, side: "left" as const }));
    const right = roundMatches.slice(half).map((m) => ({ ...m, side: "right" as const }));

    const rName = left[0]?.roundName || right[0]?.roundName || `Tour ${rNum}`;

    leftRounds.push({
      roundIndex: rIdx,
      roundName: rName,
      matches: left,
    });

    rightRounds.push({
      roundIndex: rIdx,
      roundName: rName,
      matches: right,
    });
  });

  return {
    totalRounds,
    leftWing: { rounds: leftRounds },
    rightWing: { rounds: rightRounds },
    center: {
      finalMatch: finalMatch ? { ...finalMatch, side: "center" } : undefined,
      thirdPlaceMatch: thirdPlaceMatch ? { ...thirdPlaceMatch, side: "center" } : undefined,
    },
    allMatches: normalizedMatches,
  };
}

/**
 * Génère un arbre de démonstration complet pour la prévisualisation avant matchs
 */
export function generateMockPlayoffTree(participantCount = 8): SymmetricalPlayoffTree {
  const is16 = participantCount >= 16;

  const leftRounds: any[] = [];
  const rightRounds: any[] = [];

  if (is16) {
    // Round of 16
    leftRounds.push({
      roundIndex: 0,
      roundName: "Huitièmes",
      matches: [
        createMockMatch("R16-1", 1, "R16-1", "Seed #1", "Seed #16", 1),
        createMockMatch("R16-2", 1, "R16-2", "Seed #8", "Seed #9", 2),
        createMockMatch("R16-3", 1, "R16-3", "Seed #4", "Seed #13", 3),
        createMockMatch("R16-4", 1, "R16-4", "Seed #5", "Seed #12", 4),
      ],
    });
    rightRounds.push({
      roundIndex: 0,
      roundName: "Huitièmes",
      matches: [
        createMockMatch("R16-5", 1, "R16-5", "Seed #2", "Seed #15", 5),
        createMockMatch("R16-6", 1, "R16-6", "Seed #7", "Seed #10", 6),
        createMockMatch("R16-7", 1, "R16-7", "Seed #3", "Seed #14", 7),
        createMockMatch("R16-8", 1, "R16-8", "Seed #6", "Seed #11", 8),
      ],
    });
  }

  // Quarters
  leftRounds.push({
    roundIndex: is16 ? 1 : 0,
    roundName: "Quarts de finale",
    matches: [
      createMockMatch("QF-1", is16 ? 2 : 1, "QF 1", "Vainqueur R16-1", "Vainqueur R16-2", 9),
      createMockMatch("QF-2", is16 ? 2 : 1, "QF 2", "Vainqueur R16-3", "Vainqueur R16-4", 10),
    ],
  });
  rightRounds.push({
    roundIndex: is16 ? 1 : 0,
    roundName: "Quarts de finale",
    matches: [
      createMockMatch("QF-3", is16 ? 2 : 1, "QF 3", "Vainqueur R16-5", "Vainqueur R16-6", 11),
      createMockMatch("QF-4", is16 ? 2 : 1, "QF 4", "Vainqueur R16-7", "Vainqueur R16-8", 12),
    ],
  });

  // Semis
  leftRounds.push({
    roundIndex: is16 ? 2 : 1,
    roundName: "Demi-finale 1",
    matches: [
      createMockMatch("SF-1", is16 ? 3 : 2, "Demi-finale A", "Vainqueur QF 1", "Vainqueur QF 2", 13, true),
    ],
  });
  rightRounds.push({
    roundIndex: is16 ? 2 : 1,
    roundName: "Demi-finale 2",
    matches: [
      createMockMatch("SF-2", is16 ? 3 : 2, "Demi-finale B", "Vainqueur QF 3", "Vainqueur QF 4", 14, true),
    ],
  });

  // Final
  const finalMatch = createMockMatch(
    "FINAL-1",
    is16 ? 4 : 3,
    "Grande Finale",
    "Finaliste A",
    "Finaliste B",
    15,
    false,
    true
  );

  return {
    totalRounds: is16 ? 4 : 3,
    leftWing: { rounds: leftRounds },
    rightWing: { rounds: rightRounds },
    center: {
      finalMatch,
    },
    allMatches: [
      ...leftRounds.flatMap((r) => r.matches),
      ...rightRounds.flatMap((r) => r.matches),
      finalMatch,
    ],
  };
}

function createMockMatch(
  id: string,
  round: number,
  roundName: string,
  p1Name: string,
  p2Name: string,
  matchNumber: number,
  isSemiFinal = false,
  isFinal = false
): PlayoffMatchNode {
  return {
    id,
    code: `M${matchNumber}`,
    round,
    roundName,
    matchNumber,
    participant1: {
      name: p1Name,
      isPlaceholder: true,
    },
    participant2: {
      name: p2Name,
      isPlaceholder: true,
    },
    status: "PENDING",
    isSemiFinal,
    isFinal,
  };
}
