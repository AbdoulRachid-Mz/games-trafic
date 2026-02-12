export type ParticipantStatus =
  | "ACTIVE"
  | "ELIMINATED"
  | "QUALIFIED"
  | "PENDING";

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
  scoreA?: number | null;
  scoreB?: number | null;
  winnerId?: string | null;
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
  match?: Match;
  nextNodeId?: string;
}

export interface Bracket {
  id: string;
  type: "SINGLE_ELIMINATION" | "DOUBLE_ELIMINATION";
  nodes: BracketNode[];
}

export interface Phase {
  id: string;
  type: "GROUP" | "BRACKET";
  groups?: Group[];
  bracket?: Bracket;
  isActive: boolean;
}
