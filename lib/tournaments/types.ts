export type ParticipantStatus =
  | "ACTIVE"
  | "ELIMINATED"
  | "QUALIFIED"
  | "PENDING";

export type ParticipantType = "INDIVIDUAL" | "TEAM";

export interface NormalizedParticipant {
  registrationId: string;
  type: ParticipantType;
  userId?: string | null;
  teamId?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  seed?: number | null;
  status: ParticipantStatus;
}

export interface Participant {
  id: string;
  name: string;
  status: ParticipantStatus;
}

export type MatchType = "SINGLE" | "HOME_AWAY";

export interface Match {
  id: string;
  playerA?: Participant | null;
  playerB?: Participant | null;
  score1?: number | null;
  score2?: number | null;
  winnerRegistrationId?: string | null;
  loserRegistrationId?: string | null;
  round: number;
  bracketNodeId?: string;
}

export interface Group {
  id: string;
  name: string;
  participants: Participant[];
  matches: Match[];
}

export interface BracketNode {
  id: string;
  round: number;
  /** nodeCode may be null in DB rows that were created before the field was added. */
  nodeCode?: string | null;
  match?: Match;
  nextNodeId?: string;
  metadata?: {
    participants?: string[];
    name?: string;
    generateMatches?: boolean;
    matchesCount?: number;
    format?: MatchType;
    isBye?: boolean;
    requiresMatch?: boolean;
  };
}

export interface Bracket {
  id: string;
  type: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION";
  nodes: BracketNode[];
}

export interface Phase {
  id: string;
  /**
   * Aligned with DB schema `tournamentFormatEnum`:
   * ELIMINATION | GROUP_STAGE | ROUND_ROBIN | SWISS | KNOCKOUT | CUSTOM
   *
   * Legacy aliases "GROUP" and "BRACKET" are kept for backwards compatibility
   * with in-memory engine code that has not yet been migrated.
   * Do NOT use them for new DB comparisons — use the schema enum values.
   */
  type:
    | "ELIMINATION"
    | "GROUP_STAGE"
    | "ROUND_ROBIN"
    | "SWISS"
    | "KNOCKOUT"
    | "CUSTOM"
    | "GROUP"
    | "BRACKET";
  groups?: Group[];
  bracket?: Bracket;
  isActive: boolean;
}
