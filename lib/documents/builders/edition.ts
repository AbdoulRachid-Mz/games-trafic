import {
  matchStatusLabel,
  registrationStatusLabel,
} from "../format";
import type {
  DocumentColumn,
  DocumentField,
  DocumentModel,
  DocumentSection,
  DocumentTable,
} from "../types";
import {
  buildDocumentMeta,
  createDocument,
  currencyField,
  dateField,
  field,
  numberField,
} from "./common";

/* -------------------------------------------------------------------------- */
/* Types d'entrée (DTO serveur → builder)                                     */
/* -------------------------------------------------------------------------- */

export interface EditionInfo {
  id: string;
  name: string;
  editionNumber: number;
  tournamentName: string;
  tournamentId?: string;
  game?: string | null;
  format?: string | null;
  status?: string | null;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  organizerName?: string | null;
  location?: string | null;
}

export interface EditionParticipantRow {
  registrationId: string;
  displayName: string;
  username?: string | null;
  email?: string | null;
  teamName?: string | null;
  status?: string | null;
  registrationType?: string | null;
  checkedIn?: boolean | null;
  feePaid?: boolean | null;
  registeredAt?: Date | string | null;
  matchesPlayed?: number | null;
  matchesWon?: number | null;
  matchesDrawn?: number | null;
  matchesLost?: number | null;
  points?: number | null;
  position?: number | null;
}

export interface EditionMatchRow {
  id: string;
  code?: string | null;
  phaseName?: string | null;
  groupName?: string | null;
  round?: number | null;
  matchNumber?: number | null;
  participant1Name: string;
  participant2Name: string;
  score1?: number | null;
  score2?: number | null;
  winnerName?: string | null;
  status?: string | null;
  matchType?: string | null;
  scheduledTime?: Date | string | null;
  actualStartTime?: Date | string | null;
  actualEndTime?: Date | string | null;
  duration?: number | null;
  bracketNodeCode?: string | null;
}

export interface EditionStandingRow {
  registrationId: string;
  position?: number | null;
  displayName: string;
  teamName?: string | null;
  groupName?: string | null;
  matchesPlayed?: number | null;
  matchesWon?: number | null;
  matchesDrawn?: number | null;
  matchesLost?: number | null;
  scoreFor?: number | null;
  scoreAgainst?: number | null;
  scoreDifference?: number | null;
  points?: number | null;
  qualified?: boolean | null;
}

export interface BracketNodeRow {
  round?: number | null;
  nodeCode?: string | null;
  matchNumber?: number | null;
  participant1Name?: string | null;
  participant2Name?: string | null;
  score1?: number | null;
  score2?: number | null;
  winnerName?: string | null;
  status?: string | null;
  isCompleted?: boolean | null;
  scheduledTime?: Date | string | null;
}

export interface BuildContext {
  generatedBy?: string | null;
  filters?: Record<string, string | number | boolean | null | undefined>;
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function editionReference(edition: EditionInfo): string {
  return `ED-${edition.editionNumber}`;
}

function editionSubtitle(edition: EditionInfo): string {
  return [edition.tournamentName, edition.game].filter(Boolean).join(" · ");
}

function editionMetaFields(edition: EditionInfo): DocumentField[] {
  const dates =
    edition.startDate && edition.endDate
      ? `${new Date(edition.startDate).toLocaleDateString("fr-FR")} → ${new Date(
          edition.endDate,
        ).toLocaleDateString("fr-FR")}`
      : edition.startDate
        ? new Date(edition.startDate).toLocaleDateString("fr-FR")
        : null;

  return [
    field("Tournoi", edition.tournamentName),
    field("Édition", `Édition ${edition.editionNumber}${edition.name ? ` — ${edition.name}` : ""}`),
    field("Jeu", edition.game),
    field("Format", formatLabel(edition.format)),
    field("Statut", editionStatusLabel(edition.status)),
    field("Dates", dates),
    field("Organisateur", edition.organizerName),
    field("Lieu", edition.location),
  ].filter((entry) => entry.value !== null && entry.value !== undefined && entry.value !== "");
}

function formatLabel(value?: string | null): string | null {
  if (!value) return null;
  const labels: Record<string, string> = {
    CUP: "Coupe",
    LDC: "Ligue des champions",
    CHAMPIONSHIP: "Championnat",
    SWISS: "Système suisse",
    GROUP_STAGE: "Phase de groupes",
    ROUND_ROBIN: "Round Robin",
    DOUBLE_ELIMINATION: "Double élimination",
    ELIMINATION: "Élimination directe",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function statusTone(value?: string | null): "success" | "warning" | "danger" | "info" | "neutral" {
  switch (value) {
    case "COMPLETED":
    case "FINISHED":
    case "REGISTERED":
    case "ACTIVE":
    case "QUALIFIED":
      return "success";
    case "ONGOING":
    case "LIVE":
    case "IN_PROGRESS":
    case "PENDING":
    case "SCHEDULED":
    case "PENDING_REVIEW":
    case "AWAITING_ADMIN_CONFIRMATION":
      return "warning";
    case "CANCELLED":
    case "DISQUALIFIED":
    case "WITHDRAWN":
    case "FAILED":
    case "DISPUTED":
      return "danger";
    case "UPCOMING":
      return "info";
    default:
      return "neutral";
  }
}

function editionStatusLabel(value?: string | null): string | null {
  if (!value) return null;
  const labels: Record<string, string> = {
    UPCOMING: "À venir",
    ONGOING: "En cours",
    LIVE: "En direct",
    COMPLETED: "Terminée",
    CANCELLED: "Annulée",
    DRAFT: "Brouillon",
    PUBLISHED: "Publiée",
  };
  return labels[value] ?? value.replaceAll("_", " ");
}

function participantColumns(includeEmail: boolean): DocumentColumn[] {
  const columns: DocumentColumn[] = [
    { key: "position", label: "Pos.", type: "number", align: "right", width: 0.6 },
    { key: "displayName", label: "Participant", width: 2.2 },
    { key: "teamName", label: "Équipe", width: 1.5 },
  ];
  if (includeEmail) {
    columns.push({ key: "email", label: "Email", width: 2 });
  }
  columns.push(
    { key: "statusLabel", label: "Statut", width: 1.2 },
    { key: "registeredAt", label: "Inscription", type: "date", width: 1.1 },
    { key: "checkedIn", label: "Check-in", type: "boolean", align: "center", width: 0.8 },
    { key: "feePaid", label: "Payé", type: "boolean", align: "center", width: 0.7 },
    { key: "matchesPlayed", label: "MJ", type: "number", align: "right", width: 0.5 },
    { key: "matchesWon", label: "V", type: "number", align: "right", width: 0.5 },
    { key: "matchesDrawn", label: "N", type: "number", align: "right", width: 0.5 },
    { key: "matchesLost", label: "D", type: "number", align: "right", width: 0.5 },
    { key: "points", label: "Pts", type: "number", align: "right", width: 0.6 },
  );
  return columns;
}

function matchColumns(): DocumentColumn[] {
  return [
    { key: "code", label: "Code", width: 0.9 },
    { key: "phaseName", label: "Phase", width: 1.2 },
    { key: "groupName", label: "Groupe", width: 1 },
    { key: "round", label: "Tour", type: "number", align: "right", width: 0.5 },
    { key: "participant1Name", label: "Participant 1", width: 1.7 },
    { key: "score1", label: "Score 1", type: "number", align: "right", width: 0.6 },
    { key: "score2", label: "Score 2", type: "number", align: "right", width: 0.6 },
    { key: "participant2Name", label: "Participant 2", width: 1.7 },
    { key: "winnerName", label: "Vainqueur", width: 1.4 },
    { key: "statusLabel", label: "Statut", width: 1.1 },
    { key: "scheduledTime", label: "Début prévu", type: "datetime", width: 1.5 },
    { key: "actualEndTime", label: "Fin réelle", type: "datetime", width: 1.5 },
  ];
}

function standingColumns(includeQualified: boolean): DocumentColumn[] {
  const columns: DocumentColumn[] = [
    { key: "position", label: "Pos.", type: "number", align: "right", width: 0.6 },
    { key: "displayName", label: "Participant", width: 2.2 },
    { key: "teamName", label: "Équipe", width: 1.5 },
    { key: "matchesPlayed", label: "MJ", type: "number", align: "right", width: 0.6 },
    { key: "matchesWon", label: "V", type: "number", align: "right", width: 0.6 },
    { key: "matchesDrawn", label: "N", type: "number", align: "right", width: 0.6 },
    { key: "matchesLost", label: "D", type: "number", align: "right", width: 0.6 },
    { key: "scoreFor", label: "BP", type: "number", align: "right", width: 0.7 },
    { key: "scoreAgainst", label: "BC", type: "number", align: "right", width: 0.7 },
    { key: "scoreDifference", label: "Diff.", type: "number", align: "right", width: 0.7 },
    { key: "points", label: "Points", type: "number", align: "right", width: 0.8 },
  ];
  if (includeQualified) {
    columns.push({
      key: "qualified",
      label: "Qualifié",
      type: "boolean",
      align: "center",
      width: 0.8,
    });
  }
  return columns;
}

function participantsPayload(participants: EditionParticipantRow[]) {
  return participants.map((row) => ({
    registrationId: row.registrationId,
    displayName: row.displayName,
    username: row.username ?? null,
    email: row.email ?? null,
    teamName: row.teamName ?? null,
    status: row.status ?? null,
    registrationType: row.registrationType ?? null,
    checkedIn: row.checkedIn ?? false,
    feePaid: row.feePaid ?? false,
    registeredAt: row.registeredAt ?? null,
    position: row.position ?? null,
    stats: {
      matchesPlayed: row.matchesPlayed ?? 0,
      matchesWon: row.matchesWon ?? 0,
      matchesDrawn: row.matchesDrawn ?? 0,
      matchesLost: row.matchesLost ?? 0,
      points: row.points ?? 0,
    },
  }));
}

function matchesPayload(matches: EditionMatchRow[]) {
  return matches.map((match) => ({
    id: match.id,
    code: match.code ?? null,
    phaseName: match.phaseName ?? null,
    groupName: match.groupName ?? null,
    round: match.round ?? null,
    matchNumber: match.matchNumber ?? null,
    participant1Name: match.participant1Name,
    participant2Name: match.participant2Name,
    score1: match.score1 ?? null,
    score2: match.score2 ?? null,
    winnerName: match.winnerName ?? null,
    status: match.status ?? null,
    matchType: match.matchType ?? null,
    scheduledTime: match.scheduledTime ?? null,
    actualStartTime: match.actualStartTime ?? null,
    actualEndTime: match.actualEndTime ?? null,
    duration: match.duration ?? null,
    bracketNodeCode: match.bracketNodeCode ?? null,
  }));
}

/* -------------------------------------------------------------------------- */
/* Participants                                                               */
/* -------------------------------------------------------------------------- */

export function buildEditionParticipantsDocument(input: {
  edition: EditionInfo;
  participants: EditionParticipantRow[];
  context?: BuildContext;
}): DocumentModel {
  const { edition, participants, context } = input;
  const columns = participantColumns(true);
  const table: DocumentTable = {
    columns,
    rows: participants.map((row) => ({
      ...row,
      statusLabel: registrationStatusLabel(row.status),
      position: row.position ?? "",
      checkedIn: row.checkedIn ?? false,
      feePaid: row.feePaid ?? false,
      matchesPlayed: row.matchesPlayed ?? 0,
      matchesWon: row.matchesWon ?? 0,
      matchesDrawn: row.matchesDrawn ?? 0,
      matchesLost: row.matchesLost ?? 0,
      points: row.points ?? 0,
      // Retiré des colonnes publiques mais conservé pour le JSON :
      registrationType: row.registrationType ?? null,
    })),
  };

  const checkedIn = participants.filter((row) => row.checkedIn).length;
  const paid = participants.filter((row) => row.feePaid).length;
  const teams = new Set(
    participants.map((row) => row.teamName).filter(Boolean),
  ).size;

  const summary: DocumentField[] = [
    numberField("Participants", participants.length),
    numberField("Check-ins", checkedIn),
    numberField("Frais réglés", paid),
    numberField("Équipes", teams),
  ];

  const sections: DocumentSection[] = [
    { kind: "badges", badges: [
      { label: editionStatusLabel(edition.status) || "Édition", tone: statusTone(edition.status) },
      { label: `${participants.length} participant${participants.length > 1 ? "s" : ""}`, tone: "info" },
    ] },
    { kind: "fields", title: "Édition", fields: editionMetaFields(edition), columns: 2 },
    { kind: "table", title: "Participants", table },
    { kind: "summary", title: "Synthèse", fields: summary },
  ];

  const meta = buildDocumentMeta({
    type: "edition-participants",
    title: `Participants — ${edition.name}`,
    subtitle: editionSubtitle(edition),
    reference: editionReference(edition),
    generatedBy: context?.generatedBy,
    filters: context?.filters,
    totalRecords: participants.length,
    filename: `participants-${editionReference(edition)}`,
    subject: `Liste des participants de ${edition.name}`,
  });

  return createDocument({
    meta,
    sections,
    primaryTable: table,
    jsonData: {
      edition: {
        id: edition.id,
        tournamentId: edition.tournamentId ?? null,
        name: edition.name,
        editionNumber: edition.editionNumber,
        tournamentName: edition.tournamentName,
        game: edition.game ?? null,
        status: edition.status ?? null,
        startDate: edition.startDate ?? null,
        endDate: edition.endDate ?? null,
      },
      participants: participantsPayload(participants),
    },
    summary,
  });
}

/* -------------------------------------------------------------------------- */
/* Matchs                                                                     */
/* -------------------------------------------------------------------------- */

export function buildMatchesDocument(input: {
  edition: EditionInfo;
  matches: EditionMatchRow[];
  context?: BuildContext;
  title?: string;
}): DocumentModel {
  const { edition, matches, context } = input;
  const columns = matchColumns();
  const rows = matches.map((match) => ({
    ...match,
    code: match.code || (match.matchNumber ? `M${match.matchNumber}` : ""),
    phaseName: match.phaseName ?? "",
    groupName: match.groupName ?? "",
    round: match.round ?? "",
    participant1Name: match.participant1Name || "À déterminer",
    participant2Name: match.participant2Name || "À déterminer",
    score1: match.score1 ?? "",
    score2: match.score2 ?? "",
    winnerName: match.winnerName ?? "",
    statusLabel: matchStatusLabel(match.status),
    scheduledTime: match.scheduledTime ?? "",
    actualEndTime: match.actualEndTime ?? "",
  }));

  const table: DocumentTable = { columns, rows };
  const completed = matches.filter(
    (match) => match.status === "COMPLETED" || match.status === "FINISHED",
  ).length;
  const live = matches.filter((match) => match.status === "IN_PROGRESS").length;

  const summary: DocumentField[] = [
    numberField("Matchs", matches.length),
    numberField("Terminés", completed),
    numberField("En cours", live),
    numberField("À venir", Math.max(matches.length - completed - live, 0)),
  ];

  const sections: DocumentSection[] = [
    { kind: "badges", badges: [
      { label: editionStatusLabel(edition.status) || "Édition", tone: statusTone(edition.status) },
      { label: `${matches.length} match${matches.length > 1 ? "s" : ""}`, tone: "info" },
    ] },
    { kind: "fields", title: "Édition", fields: editionMetaFields(edition), columns: 2 },
    { kind: "table", title: input.title ?? "Matchs", table },
    { kind: "summary", title: "Synthèse", fields: summary },
  ];

  const meta = buildDocumentMeta({
    type: "matches-list",
    title: input.title ?? `Matchs — ${edition.name}`,
    subtitle: editionSubtitle(edition),
    reference: editionReference(edition),
    generatedBy: context?.generatedBy,
    filters: context?.filters,
    totalRecords: matches.length,
    filename: `matchs-${editionReference(edition)}`,
    subject: `Liste des matchs de ${edition.name}`,
  });

  return createDocument({
    meta,
    sections,
    primaryTable: table,
    jsonData: {
      edition: {
        id: edition.id,
        name: edition.name,
        editionNumber: edition.editionNumber,
        tournamentName: edition.tournamentName,
      },
      matches: matchesPayload(matches),
    },
    summary,
  });
}

/* -------------------------------------------------------------------------- */
/* Classements                                                                */
/* -------------------------------------------------------------------------- */

export function buildStandingsDocument(input: {
  edition: EditionInfo;
  scope: "edition" | "phase";
  scopeName?: string;
  standings: EditionStandingRow[];
  context?: BuildContext;
}): DocumentModel {
  const { edition, scope, scopeName, standings, context } = input;
  const includeQualified = scope === "phase";
  const includeGroup = standings.some((row) => Boolean(row.groupName));
  const columns = standingColumns(includeQualified);
  if (includeGroup) {
    columns.splice(3, 0, {
      key: "groupName",
      label: "Groupe",
      width: 1.2,
    });
  }
  const table: DocumentTable = {
    columns,
    rows: standings.map((row) => ({
      ...row,
      position: row.position ?? "",
      teamName: row.teamName ?? "",
      groupName: row.groupName ?? "",
      matchesPlayed: row.matchesPlayed ?? 0,
      matchesWon: row.matchesWon ?? 0,
      matchesDrawn: row.matchesDrawn ?? 0,
      matchesLost: row.matchesLost ?? 0,
      scoreFor: row.scoreFor ?? 0,
      scoreAgainst: row.scoreAgainst ?? 0,
      scoreDifference: row.scoreDifference ?? 0,
      points: row.points ?? 0,
      qualified: row.qualified ?? false,
    })),
  };

  const label = scope === "edition" ? "Classement global" : `Classement — ${scopeName ?? "Phase"}`;
  const played = standings.reduce(
    (total, row) => total + (row.matchesPlayed ?? 0),
    0,
  );

  const summary: DocumentField[] = [
    numberField("Participants classés", standings.length),
    numberField("Matchs joués (cumul)", played),
    ...(scope === "phase"
      ? [
          numberField(
            "Qualifiés",
            standings.filter((row) => row.qualified).length,
          ),
        ]
      : []),
  ];

  const sections: DocumentSection[] = [
    { kind: "badges", badges: [
      { label: scope === "edition" ? "Classement global" : "Classement de phase", tone: "info" },
      { label: `${standings.length} participant${standings.length > 1 ? "s" : ""}`, tone: "neutral" },
    ] },
    { kind: "fields", title: "Édition", fields: editionMetaFields(edition), columns: 2 },
    { kind: "table", title: label, table },
    { kind: "summary", title: "Synthèse", fields: summary },
  ];

  const meta = buildDocumentMeta({
    type: "edition-standings",
    title: label,
    subtitle: editionSubtitle(edition),
    reference: editionReference(edition),
    generatedBy: context?.generatedBy,
    filters: {
      ...(context?.filters ?? {}),
      portée: scope === "edition" ? "édition" : scopeName ?? "phase",
    },
    totalRecords: standings.length,
    filename:
      scope === "edition"
        ? `classement-global-${editionReference(edition)}`
        : `classement-${scopeName ?? "phase"}-${editionReference(edition)}`,
    subject: `${label} — ${edition.name}`,
  });

  return createDocument({
    meta,
    sections,
    primaryTable: table,
    jsonData: {
      edition: {
        id: edition.id,
        name: edition.name,
        editionNumber: edition.editionNumber,
        tournamentName: edition.tournamentName,
      },
      scope,
      scopeName: scopeName ?? null,
      standings: standings.map((row) => ({
        registrationId: row.registrationId,
        position: row.position ?? null,
        displayName: row.displayName,
        teamName: row.teamName ?? null,
        groupName: row.groupName ?? null,
        qualified: row.qualified ?? null,
        stats: {
          matchesPlayed: row.matchesPlayed ?? 0,
          matchesWon: row.matchesWon ?? 0,
          matchesDrawn: row.matchesDrawn ?? 0,
          matchesLost: row.matchesLost ?? 0,
          scoreFor: row.scoreFor ?? 0,
          scoreAgainst: row.scoreAgainst ?? 0,
          scoreDifference: row.scoreDifference ?? 0,
          points: row.points ?? 0,
        },
      })),
    },
    summary,
  });
}

/* -------------------------------------------------------------------------- */
/* Bracket                                                                    */
/* -------------------------------------------------------------------------- */

export function buildBracketDocument(input: {
  edition: EditionInfo;
  phaseName?: string | null;
  nodes: BracketNodeRow[];
  context?: BuildContext;
}): DocumentModel {
  const { edition, phaseName, nodes, context } = input;
  const columns: DocumentColumn[] = [
    { key: "round", label: "Tour", type: "number", align: "right", width: 0.6 },
    { key: "nodeCode", label: "Code", width: 1 },
    { key: "matchNumber", label: "Match", type: "number", align: "right", width: 0.6 },
    { key: "participant1Name", label: "Participant 1", width: 2 },
    { key: "score1", label: "Score 1", type: "number", align: "right", width: 0.6 },
    { key: "score2", label: "Score 2", type: "number", align: "right", width: 0.6 },
    { key: "participant2Name", label: "Participant 2", width: 2 },
    { key: "winnerName", label: "Vainqueur", width: 1.5 },
    { key: "statusLabel", label: "Statut", width: 1.1 },
    { key: "scheduledTime", label: "Date prévue", type: "datetime", width: 1.4 },
  ];

  const table: DocumentTable = {
    columns,
    rows: nodes.map((node) => ({
      ...node,
      round: node.round ?? "",
      nodeCode: node.nodeCode ?? "",
      matchNumber: node.matchNumber ?? "",
      participant1Name: node.participant1Name || "À déterminer",
      participant2Name: node.participant2Name || "À déterminer",
      score1: node.score1 ?? "",
      score2: node.score2 ?? "",
      winnerName: node.winnerName ?? "",
      statusLabel: node.isCompleted
        ? "Terminé"
        : node.status
          ? matchStatusLabel(node.status)
          : "En attente",
      scheduledTime: node.scheduledTime ?? "",
    })),
  };

  const completed = nodes.filter((node) => node.isCompleted).length;
  const summary: DocumentField[] = [
    numberField("Nœuds", nodes.length),
    numberField("Terminés", completed),
    numberField("En attente", Math.max(nodes.length - completed, 0)),
  ];

  const title = `Bracket${phaseName ? ` — ${phaseName}` : ""} — ${edition.name}`;
  const sections: DocumentSection[] = [
    { kind: "badges", badges: [
      { label: "Bracket", tone: "info" },
      ...(phaseName ? [{ label: phaseName, tone: "neutral" as const }] : []),
    ] },
    { kind: "fields", title: "Édition", fields: editionMetaFields(edition), columns: 2 },
    { kind: "table", title: "Tableau éliminatoire", table },
    { kind: "summary", title: "Synthèse", fields: summary },
  ];

  const meta = buildDocumentMeta({
    type: "bracket",
    title,
    subtitle: editionSubtitle(edition),
    reference: editionReference(edition),
    generatedBy: context?.generatedBy,
    filters: {
      ...(context?.filters ?? {}),
      ...(phaseName ? { phase: phaseName } : {}),
    },
    totalRecords: nodes.length,
    filename: `bracket-${editionReference(edition)}`,
    subject: title,
  });

  return createDocument({
    meta,
    sections,
    primaryTable: table,
    jsonData: {
      edition: {
        id: edition.id,
        name: edition.name,
        editionNumber: edition.editionNumber,
        tournamentName: edition.tournamentName,
      },
      phaseName: phaseName ?? null,
      nodes: nodes.map((node) => ({
        round: node.round ?? null,
        nodeCode: node.nodeCode ?? null,
        matchNumber: node.matchNumber ?? null,
        participant1Name: node.participant1Name ?? null,
        participant2Name: node.participant2Name ?? null,
        score1: node.score1 ?? null,
        score2: node.score2 ?? null,
        winnerName: node.winnerName ?? null,
        status: node.status ?? null,
        isCompleted: node.isCompleted ?? false,
        scheduledTime: node.scheduledTime ?? null,
      })),
    },
    summary,
  });
}

/* -------------------------------------------------------------------------- */
/* Feuille de match                                                           */
/* -------------------------------------------------------------------------- */

export interface MatchSheetInput {
  edition: EditionInfo;
  match: EditionMatchRow;
  context?: BuildContext;
  notes?: string | null;
  streamLink?: string | null;
}

export function buildMatchSheetDocument(input: MatchSheetInput): DocumentModel {
  const { edition, match, context } = input;
  const title = `Feuille de match — ${match.code || `M${match.matchNumber ?? ""}`}`;

  const general: DocumentField[] = [
    field("Compétition", edition.tournamentName),
    field("Édition", edition.name),
    field("Phase", match.phaseName),
    field("Groupe", match.groupName),
    field("Tour", match.round, { type: "number" }),
    field("Code match", match.code || match.bracketNodeCode),
    field("Type", match.matchType),
    dateField("Date prévue", match.scheduledTime),
    dateField("Début réel", match.actualStartTime),
    dateField("Fin réelle", match.actualEndTime),
    match.duration ? numberField("Durée (min)", match.duration) : field("Durée (min)", null),
    field("Statut", matchStatusLabel(match.status)),
  ];

  const result: DocumentField[] = [
    field("Participant 1", match.participant1Name || "À déterminer"),
    numberField("Score 1", match.score1),
    field("Participant 2", match.participant2Name || "À déterminer"),
    numberField("Score 2", match.score2),
    field("Vainqueur", match.winnerName),
  ];

  const sections: DocumentSection[] = [
    { kind: "badges", badges: [
      { label: matchStatusLabel(match.status) || "Match", tone: statusTone(match.status) },
      { label: edition.name, tone: "neutral" },
    ] },
    { kind: "fields", title: "Informations du match", fields: general.filter((entry) => entry.value !== null && entry.value !== undefined && entry.value !== ""), columns: 2 },
    { kind: "fields", title: "Résultat", fields: result.filter((entry) => entry.value !== null && entry.value !== undefined && entry.value !== ""), columns: 2 },
  ];

  if (input.notes) {
    sections.push({ kind: "text", title: "Notes", text: input.notes });
  }
  if (input.streamLink) {
    sections.push({ kind: "text", title: "Diffusion", text: input.streamLink });
  }

  const meta = buildDocumentMeta({
    type: "match-sheet",
    title,
    subtitle: editionSubtitle(edition),
    reference: match.code || match.id,
    generatedBy: context?.generatedBy,
    totalRecords: 1,
    filename: `feuille-match-${match.code || match.id}`,
    subject: title,
  });

  return createDocument({
    meta,
    sections,
    jsonData: {
      edition: {
        id: edition.id,
        name: edition.name,
        tournamentName: edition.tournamentName,
      },
      match: matchesPayload([match])[0],
      notes: input.notes ?? null,
      streamLink: input.streamLink ?? null,
    },
    summary: result,
  });
}

/* -------------------------------------------------------------------------- */
/* Rapport d'édition                                                          */
/* -------------------------------------------------------------------------- */

export function buildEditionReportDocument(input: {
  edition: EditionInfo;
  participants: EditionParticipantRow[];
  matches: EditionMatchRow[];
  standings: EditionStandingRow[];
  context?: BuildContext;
  prizePool?: { amount: number | string; currency?: string | null } | null;
}): DocumentModel {
  const { edition, participants, matches, standings, context } = input;
  const completed = matches.filter(
    (match) => match.status === "COMPLETED" || match.status === "FINISHED",
  ).length;
  const checkedIn = participants.filter((row) => row.checkedIn).length;
  const paid = participants.filter((row) => row.feePaid).length;

  const summary: DocumentField[] = [
    numberField("Participants", participants.length),
    numberField("Check-ins", checkedIn),
    numberField("Frais réglés", paid),
    numberField("Matchs", matches.length),
    numberField("Matchs terminés", completed),
    ...(input.prizePool
      ? [currencyField("Prize pool", input.prizePool.amount, input.prizePool.currency)]
      : []),
  ];

  const standingsTable: DocumentTable = {
    columns: standingColumns(false),
    rows: standings.slice(0, 10).map((row) => ({
      ...row,
      position: row.position ?? "",
      teamName: row.teamName ?? "",
      matchesPlayed: row.matchesPlayed ?? 0,
      matchesWon: row.matchesWon ?? 0,
      matchesDrawn: row.matchesDrawn ?? 0,
      matchesLost: row.matchesLost ?? 0,
      scoreFor: row.scoreFor ?? 0,
      scoreAgainst: row.scoreAgainst ?? 0,
      scoreDifference: row.scoreDifference ?? 0,
      points: row.points ?? 0,
    })),
  };

  const recentTable: DocumentTable = {
    columns: matchColumns(),
    rows: matches.slice(-10).map((match) => ({
      ...match,
      code: match.code || (match.matchNumber ? `M${match.matchNumber}` : ""),
      phaseName: match.phaseName ?? "",
      groupName: match.groupName ?? "",
      round: match.round ?? "",
      participant1Name: match.participant1Name || "À déterminer",
      participant2Name: match.participant2Name || "À déterminer",
      score1: match.score1 ?? "",
      score2: match.score2 ?? "",
      winnerName: match.winnerName ?? "",
      statusLabel: matchStatusLabel(match.status),
      scheduledTime: match.scheduledTime ?? "",
      actualEndTime: match.actualEndTime ?? "",
    })),
  };

  const sections: DocumentSection[] = [
    { kind: "badges", badges: [
      { label: editionStatusLabel(edition.status) || "Édition", tone: statusTone(edition.status) },
      { label: `${participants.length} participants`, tone: "info" },
      { label: `${completed}/${matches.length} matchs terminés`, tone: "neutral" },
    ] },
    { kind: "fields", title: "Édition", fields: editionMetaFields(edition), columns: 2 },
    { kind: "summary", title: "Chiffres clés", fields: summary },
    ...(standings.length > 0
      ? [
          {
            kind: "table" as const,
            title: "Top 10 du classement",
            table: standingsTable,
          },
        ]
      : []),
    ...(matches.length > 0
      ? [
          {
            kind: "table" as const,
            title: "Derniers matchs",
            table: recentTable,
          },
        ]
      : []),
  ];

  const meta = buildDocumentMeta({
    type: "edition-report",
    title: `Rapport — ${edition.name}`,
    subtitle: editionSubtitle(edition),
    reference: editionReference(edition),
    generatedBy: context?.generatedBy,
    filters: context?.filters,
    totalRecords: matches.length,
    filename: `rapport-${editionReference(edition)}`,
    subject: `Rapport de l'édition ${edition.name}`,
  });

  return createDocument({
    meta,
    sections,
    primaryTable: standingsTable,
    sheets: [
      {
        name: "Classement",
        columns: standingsTable.columns,
        rows: standingsTable.rows,
      },
      {
        name: "Matchs",
        columns: recentTable.columns,
        rows: recentTable.rows,
      },
      {
        name: "Participants",
        columns: participantColumns(true),
        rows: participants.map((row) => ({
          ...row,
          statusLabel: registrationStatusLabel(row.status),
          position: row.position ?? "",
          checkedIn: row.checkedIn ?? false,
          feePaid: row.feePaid ?? false,
          matchesPlayed: row.matchesPlayed ?? 0,
          matchesWon: row.matchesWon ?? 0,
          matchesDrawn: row.matchesDrawn ?? 0,
          matchesLost: row.matchesLost ?? 0,
          points: row.points ?? 0,
        })),
      },
    ],
    jsonData: {
      edition: {
        id: edition.id,
        name: edition.name,
        editionNumber: edition.editionNumber,
        tournamentName: edition.tournamentName,
        status: edition.status ?? null,
        startDate: edition.startDate ?? null,
        endDate: edition.endDate ?? null,
      },
      summary: {
        participants: participants.length,
        checkedIn,
        paid,
        matches: matches.length,
        completedMatches: completed,
        prizePool: input.prizePool ?? null,
      },
      standings: standings.map((row) => ({
        registrationId: row.registrationId,
        position: row.position ?? null,
        displayName: row.displayName,
        points: row.points ?? 0,
        matchesPlayed: row.matchesPlayed ?? 0,
        matchesWon: row.matchesWon ?? 0,
      })),
      matches: matchesPayload(matches),
      participants: participantsPayload(participants),
    },
    summary,
  });
}
