import { Match } from "./types";

export interface ParticipantStats {
  matchesPlayed: number;
  matchesWon: number;
  matchesDrawn: number;
  matchesLost: number;
  points: number;
  scoreFor: number;
  scoreAgainst: number;
  scoreDifference: number;
}

export interface StandingsConfig {
  pointsPerWin: number;
  pointsPerDraw: number;
  pointsPerLoss: number;
  tiebreakerRules: string[]; // e.g. ["POINTS", "HEAD_TO_HEAD", "GOAL_DIFF", "GOALS_FOR"]
}

const DEFAULT_CONFIG: StandingsConfig = {
  pointsPerWin: 3,
  pointsPerDraw: 1,
  pointsPerLoss: 0,
  tiebreakerRules: ["POINTS", "GOAL_DIFF", "GOALS_FOR"],
};

export function syncStandingsWithMatches(
  participantsIds: string[],
  matches: Match[],
  config: Partial<StandingsConfig> = {}
): Map<string, ParticipantStats> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const statsMap = new Map<string, ParticipantStats>();

  // Initialize all participants to 0
  for (const pid of participantsIds) {
    statsMap.set(pid, {
      matchesPlayed: 0,
      matchesWon: 0,
      matchesDrawn: 0,
      matchesLost: 0,
      points: 0,
      scoreFor: 0,
      scoreAgainst: 0,
      scoreDifference: 0,
    });
  }

  for (const m of matches as any[]) {
    const status = m.status;
    if (status !== "COMPLETED" && status !== "FINISHED" && !m.confirmedByAdmin) continue;
    
    // Using string mapping assuming Match uses `participant1RegistrationId`
    const p1Id = m.participant1RegistrationId;
    const p2Id = m.participant2RegistrationId;
    
    if (!p1Id || !p2Id) continue;

    let p1 = statsMap.get(p1Id);
    let p2 = statsMap.get(p2Id);

    // If participant not initialized but somehow has a match, initialize them.
    if (!p1) {
       p1 = { matchesPlayed: 0, matchesWon: 0, matchesDrawn: 0, matchesLost: 0, points: 0, scoreFor: 0, scoreAgainst: 0, scoreDifference: 0 };
       statsMap.set(p1Id, p1);
    }
    if (!p2) {
       p2 = { matchesPlayed: 0, matchesWon: 0, matchesDrawn: 0, matchesLost: 0, points: 0, scoreFor: 0, scoreAgainst: 0, scoreDifference: 0 };
       statsMap.set(p2Id, p2);
    }

    const s1 = m.score1 ?? m.scoreA ?? 0;
    const s2 = m.score2 ?? m.scoreB ?? 0;

    p1.matchesPlayed++;
    p2.matchesPlayed++;
    
    p1.scoreFor += s1;
    p1.scoreAgainst += s2;
    p2.scoreFor += s2;
    p2.scoreAgainst += s1;

    const winnerId = m.winnerRegistrationId || m.winnerId;

    if (s1 > s2 || (winnerId && winnerId === p1Id)) {
      p1.matchesWon++;
      p1.points += finalConfig.pointsPerWin;
      p2.matchesLost++;
      p2.points += finalConfig.pointsPerLoss;
    } else if (s1 < s2 || (winnerId && winnerId === p2Id)) {
      p2.matchesWon++;
      p2.points += finalConfig.pointsPerWin;
      p1.matchesLost++;
      p1.points += finalConfig.pointsPerLoss;
    } else {
      p1.matchesDrawn++;
      p2.matchesDrawn++;
      p1.points += finalConfig.pointsPerDraw;
      p2.points += finalConfig.pointsPerDraw;
    }
    
    p1.scoreDifference = p1.scoreFor - p1.scoreAgainst;
    p2.scoreDifference = p2.scoreFor - p2.scoreAgainst;
  }

  return statsMap;
}

export function rankParticipants(
    statsMap: Map<string, ParticipantStats>,
    config: Partial<StandingsConfig> = {}
): { registrationId: string; stats: ParticipantStats }[] {
    const finalConfig = { ...DEFAULT_CONFIG, ...config };
    const list = Array.from(statsMap.entries()).map(([id, stats]) => ({ registrationId: id, stats }));
    
    return list.sort((a, b) => {
        for (const rule of finalConfig.tiebreakerRules) {
            if (rule === "POINTS" && a.stats.points !== b.stats.points) {
               return b.stats.points - a.stats.points;
            }
            if (rule === "GOAL_DIFF" && a.stats.scoreDifference !== b.stats.scoreDifference) {
               return b.stats.scoreDifference - a.stats.scoreDifference;
            }
            if (rule === "GOALS_FOR" && a.stats.scoreFor !== b.stats.scoreFor) {
               return b.stats.scoreFor - a.stats.scoreFor;
            }
        }
        return 0;
    });
}
