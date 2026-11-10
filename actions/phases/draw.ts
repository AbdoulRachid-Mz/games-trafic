"use server";

/**
 * actions/phases/draw.ts
 *
 * Tirage au sort côté SERVEUR (PROMPT.md §13, §13 BIS).
 *
 * Principe non négociable : l'animation ne décide JAMAIS des affectations.
 * 1. Le serveur valide la structure et les participants.
 * 2. Le serveur effectue le tirage réel (Fisher-Yates).
 * 3. Le résultat est persisté de manière transactionnelle.
 * 4. Le frontend reçoit la vérité persistée et la révèle progressivement.
 * 5. À la fin, l'écran affiche exactement les affectations persistées.
 *
 * Un tirage déjà effectué ne peut pas être remplacé silencieusement :
 * il faut `force: true` ET un flux explicitement déclenché par un
 * organisateur (le client doit afficher une confirmation).
 */

import { db } from "@/lib/db";
import { and, eq, inArray } from "drizzle-orm";
import {
  editionRegistrations,
  phaseGroupParticipants,
  phaseGroups,
  tournamentPhases,
  bracketNodes,
  matches,
} from "@/database/schema";
import { assertOrganizerOrAdminByPhase, getPhaseQualifiedRegistrationIds } from "./helpers";
import {
  buildLeagueCalendar,
} from "@/lib/tournaments/match.generator";
import { inheritScoringToGroup } from "@/lib/tournaments/scoring";
import { getEffectiveAdvanceCount } from "@/lib/tournaments/config";

export interface DrawAssignmentGroup {
  groupId: string;
  groupName: string;
  order: number;
  /** Ordre de tirage du groupe : la révélation suit exactement cet ordre. */
  participantIds: string[];
}

export interface DrawParticipantsResult {
  assignments: DrawAssignmentGroup[];
  /** Noms d'affichage résolus serveur (user, team, displayName). */
  names: Record<string, string>;
  photos: Record<string, string | null>;
  reGenerated: boolean;
}

export interface DrawNodesResult {
  nodes: Array<{
    id: string;
    nodeCode: string;
    name: string;
    dayNumber: number;
    fixtureIndex: number;
    p1: string | null;
    p2: string | null;
    p1Name: string;
    p2Name: string;
  }>;
  /** Membres exemptés de la journée (confrontations impaires). */
  byeMembers: Array<{ id: string; name: string }>;
  names: Record<string, string>;
  reGenerated: boolean;
}

/** Fisher-Yates pur — le tirage a lieu uniquement ici, jamais côté client. */
function fisherYates<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function displayNameFromUser(reg: any): string {
  return (
    reg?.member?.displayName ||
    reg?.member?.user?.username ||
    reg?.member?.team?.name ||
    "Joueur"
  );
}

function photoFromUser(reg: any): string | null {
  return (
    reg?.member?.avatar ||
    reg?.member?.user?.profileImage ||
    reg?.member?.user?.image ||
    reg?.member?.team?.logo ||
    null
  );
}

/**
 * Résout la liste des participants d'une phase d'après
 * `phase.config.participantSource` — miroir de la page d'organisation.
 */
async function resolvePhaseSourceRegistrations(
  editionId: string,
  phaseConfig: Record<string, any>,
): Promise<{ id: string; name: string; photo: string | null }[]> {
  const source = phaseConfig.participantSource || "EDITION";
  if (source.startsWith("PHASE_")) {
    const ids = await getPhaseQualifiedRegistrationIds(
      source.replace("PHASE_", ""),
    );
    if (ids.length === 0) return [];
    const regs = await db.query.editionRegistrations.findMany({
      where: inArray(editionRegistrations.id, ids),
      with: {
        member: { with: { user: true, team: true } },
      },
    });
    return regs.map((r: any) => ({
      id: r.id,
      name: displayNameFromUser(r),
      photo: photoFromUser(r),
    }));
  }
  const regs = await db.query.editionRegistrations.findMany({
    where: and(
      eq(editionRegistrations.editionId, editionId),
      eq(editionRegistrations.status, "REGISTERED"),
    ),
    with: {
      member: { with: { user: true, team: true } },
    },
  });
  return regs.map((r: any) => ({
    id: r.id,
    name: displayNameFromUser(r),
    photo: photoFromUser(r),
  }));
}

class DrawError extends Error {}

/**
 * TIRAGE DES GROUPES D'UNE PHASE.
 * Répartit les participants de la phase dans `groupsCount` groupes
 * (Fisher-Yates serveur), persiste la structure et RENVOIE la vérité.
 */
export async function drawPhaseGroupsAction(
  phaseId: string,
  options: {
    groupsCount: number;
    participantsPerGroup?: number;
    force?: boolean;
  }
): Promise<DrawParticipantsResult> {
  try {
    await assertOrganizerOrAdminByPhase(phaseId);

    const phase = await db.query.tournamentPhases.findFirst({
      where: eq(tournamentPhases.id, phaseId),
    });
    if (!phase) throw new DrawError("Phase non trouvée");

    // Phase « groupes = journées » : les journées sont générées par le
    // générateur de championnat (structure métier), pas par un tirage manuel.
    if (phase.phaseType === "ROUND_ROBIN") {
      const groups = await db.query.phaseGroups.findMany({
        where: and(
          eq(phaseGroups.phaseId, phaseId),
          eq(phaseGroups.isDeleted, false),
        ),
      });
      const isMatchdayPhase =
        groups.length > 0 &&
        groups.every((g) => ((g.config as any) || {}).isMatchday === true);
      if (isMatchdayPhase) {
        throw new DrawError(
          "Cette phase championnat génère ses journées automatiquement (Circle Method). Le tirage manuel des groupes n'est pas applicable.",
        );
      }
    }

    const phaseConfig = (phase.config as any) || {};
    const groupsCount = Math.max(1, Math.floor(options.groupsCount || 1));

    // Un tirage déjà acté ne se remplace jamais en silence.
    const existingGroups = await db.query.phaseGroups.findMany({
      where: and(
        eq(phaseGroups.phaseId, phaseId),
        eq(phaseGroups.isDeleted, false),
      ),
      with: {
        participants: { limit: 1 },
      },
    });
    const hasAssignedGroups = existingGroups.some(
      (g: any) => (g.participants?.length ?? 0) > 0,
    );
    if (hasAssignedGroups && !options.force) {
      throw new DrawError(
        "Un tirage existe déjà pour cette phase. Utilisez une réorganisation explicite pour le remplacer.",
      );
    }

    // Annuaire + annuaire dédoublonné (un registrationId = un seul slot).
    const source = await resolvePhaseSourceRegistrations(
      phase.editionId,
      phaseConfig,
    );
    const seen = new Set<string>();
    const pool = source.filter((p) => {
      if (!p.id || seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    if (pool.length < 2 * groupsCount) {
      throw new DrawError(
        `Participants insuffisants : ${pool.length} disponible(s) pour ${groupsCount} groupe(s) (minimum 2 par groupe).`,
      );
    }

    // Détermination de l'ordre de tirage.
    const ordered = pool;
    const perGroup =
      options.participantsPerGroup && options.participantsPerGroup > 0
        ? Math.floor(options.participantsPerGroup)
        : Math.ceil(ordered.length / groupsCount);

    // TIRAGE : Fisher-Yates côté serveur.
    const shuffled = fisherYates(ordered);
    const draft: { groupName: string; order: number; participantIds: string[] }[] = [];
    for (let i = 0; i < groupsCount; i++) {
      draft.push({
        groupName:
          phaseConfig.groupPrefix || phaseConfig.dayNamePrefix
            ? `${phaseConfig.groupPrefix || "Groupe"} ${String.fromCharCode(65 + i)}`
            : `Groupe ${String.fromCharCode(65 + i)}`,
        order: i,
        participantIds: shuffled
          .slice(i * perGroup, (i + 1) * perGroup)
          .map((p) => p.id)
          .filter(Boolean),
      });
    }
    // Les restants (pool % perGroup) rejoignent le premier groupe non plein.
    const remainder = shuffled.slice(groupsCount * perGroup).map((p) => p.id);
    if (remainder.length > 0) {
      const leftovers = draft
        .slice()
        .sort((a, b) => a.participantIds.length - b.participantIds.length)
        .filter((g) => g.participantIds.length < perGroup);
      let cursor = 0;
      for (const g of leftovers) {
        while (g.participantIds.length < perGroup && cursor < remainder.length) {
          g.participantIds.push(remainder[cursor++]);
        }
      }
    }
    const underfilled = draft.filter((g) => g.participantIds.length < 2);
    if (underfilled.length > 0) {
      throw new DrawError(
        "Tirage impossible : au moins un groupe compte moins de 2 participants. Réduisez le nombre de groupes.",
      );
    }

    // PERSISTANCE : structure + appartenances en une transaction.
    const result = await db.transaction(async (tx) => {
      if (options.force) {
        const groupIds = existingGroups.map((g: any) => g.id);
        if (groupIds.length > 0) {
          await tx.delete(phaseGroupParticipants).where(
            inArray(phaseGroupParticipants.groupId, groupIds),
          );
          await tx.delete(phaseGroups).where(
            inArray(phaseGroups.id, groupIds),
          );
        }
      }

      const created: DrawAssignmentGroup[] = [];
      for (const g of draft) {
        const [row] = await tx
          .insert(phaseGroups)
          .values({
            phaseId,
            name: g.groupName,
            order: g.order,
            participantCount: g.participantIds.length,
            groupType: phase.phaseType === "ROUND_ROBIN" ? "ROUND_ROBIN" : "STANDARD",
            config: inheritScoringToGroup(phaseConfig, {
              seeding: phaseConfig.seedingMethod || "RANDOM",
              participantsPerGroup: perGroup,
              advanceCount: getEffectiveAdvanceCount(phase),
              participants: g.participantIds,
            }),
            isCompleted: false,
            isLocked: false,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();
        for (const registrationId of g.participantIds) {
          await tx.insert(phaseGroupParticipants).values({
            groupId: row.id,
            registrationId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
        created.push({
          groupId: row.id,
          groupName: g.groupName,
          order: g.order,
          participantIds: g.participantIds,
        });
      }
      return created;
    });

    const names: Record<string, string> = {};
    const photos: Record<string, string | null> = {};
    for (const p of pool) {
      names[p.id] = p.name;
      photos[p.id] = p.photo;
    }

    return { assignments: result, names, photos, reGenerated: !!options.force };
  } catch (error) {
    if (error instanceof DrawError) throw error;
    console.error("Error drawing phase groups:", error);
    throw new Error(
      (error as Error)?.message || "Erreur serveur lors du tirage des groupes.",
    );
  }
}

/**
 * TIRAGE DES CONFRONTATIONS D'UN GROUPE-JOURNÉE (RR refondu).
 * Les participants du groupe sont appariés (Circle Method sur l'ordre de
 * tirage) : 1 node = 1 confrontation à 2 participants. Persistés avec
 * metadata.dayNumber / fixtureIndex pour rester reconstructibles.
 */
export async function drawGroupMatchesAction(
  groupId: string,
  options?: { force?: boolean }
): Promise<DrawNodesResult> {
  try {
    const group = await db.query.phaseGroups.findFirst({
      where: eq(phaseGroups.id, groupId),
      with: {
        phase: true,
        participants: {
          with: {
            registration: {
              with: { member: { with: { user: true, team: true } } },
            },
          },
        },
      },
    });
    if (!group) throw new DrawError("Groupe non trouvé");

    await assertOrganizerOrAdminByPhase(group.phaseId);

    const groupConfig = (group.config as any) || {};
    if (!groupConfig.isMatchday) {
      throw new DrawError(
        "Le tirage automatique des confrontations s'applique aux groupes-journées du modèle championnat (RR refondu).",
      );
    }

    const existingNodes = await db.query.bracketNodes.findMany({
      where: and(
        eq(bracketNodes.groupId, groupId),
        eq(bracketNodes.isDeleted, false),
      ),
    });
    if (existingNodes.length > 0 && !options?.force) {
      throw new DrawError(
        "Les confrontations de cette journée existent déjà. Utilisez une réorganisation explicite pour les remplacer.",
      );
    }

    // Annuaire des membres du groupe (confrontés + exemptés), dédoublonné.
    const members: { id: string; name: string; photo: string | null }[] = [];
    const seen = new Set<string>();
    for (const p of group.participants || []) {
      if (!p.registrationId || seen.has(p.registrationId)) continue;
      seen.add(p.registrationId);
      const reg = p.registration as any;
      members.push({
        id: p.registrationId,
        name: displayNameFromUser(reg),
        photo: photoFromUser(reg),
      });
    }
    if (members.length < 2) {
      throw new DrawError(
        "Participants insuffisants : ce groupe doit compter au moins 2 membres.",
      );
    }

    // TIRAGE : ordre aléatoire serveur, puis appariement (les appariements
    // de journée sont produits par le calendrier pur Circle Method).
    const ordered = fisherYates(members);
    const dayNumber = Number(groupConfig.dayNumber) || 1;
    const isHomeAway = groupConfig.isHomeAway === true;

    // Calendrier complet puis filtre sur la journée du groupe : c'est la
    // source unique de la construction des confrontations (cohérent avec
    // setupLeaguePhase / buildLeagueCalendar).
    const calendar = buildLeagueCalendar(
      ordered.map((m) => m.id),
      { isHomeAway },
    );
    const day = calendar.find((d) => d.day === dayNumber) ?? calendar[0];
    if (!day) throw new DrawError("Calendrier indisponible pour cette journée.");

    // Confrontations rélimitées aux membres du groupe (BYE compris).
    const memberIds = new Set(members.map((m) => m.id));
    const fixtures = day.fixtures
      .filter((f) => memberIds.has(f.p1!) && memberIds.has(f.p2!))
      .map((f, i) => ({ ...f, fixture: i + 1 }));

    const names: Record<string, string> = {};
    for (const m of members) names[m.id] = m.name;

    const phaseConfig = (group.phase as any)?.config || {};
    const generateMatches = groupConfig.generateMatches !== false;

    const seeded = await db.transaction(async (tx) => {
      if (options?.force && existingNodes.length > 0) {
        const nodeIds = existingNodes.map((n: any) => n.id);
        await tx
          .delete(matches)
          .where(inArray(matches.bracketNodeId, nodeIds));
        await tx
          .delete(bracketNodes)
          .where(inArray(bracketNodes.id, nodeIds));
      }

      const createdNodes: DrawNodesResult["nodes"] = [];
      for (const [i, fixture] of fixtures.entries()) {
        const [node] = await tx
          .insert(bracketNodes)
          .values({
            phaseId: group.phaseId,
            groupId,
            nodeCode: `J${dayNumber}-C${i + 1}`,
            round: dayNumber,
            matchNumber: i + 1,
            bracketType: "UPPER",
            order: dayNumber * 100 + (i + 1),
            metadata: {
              participants: [fixture.p1, fixture.p2].filter(Boolean),
              name: `${group.name} — Confrontation ${i + 1}`,
              dayNumber,
              fixtureIndex: i + 1,
              isLegTwo: dayNumber > Math.ceil(calendar.length / 2) && isHomeAway,
              generateMatches,
              matchesCount: 1,
              format: groupConfig.matchFormat || "BEST_OF_1",
              nodeType: "ROUND_ROBIN",
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        if (generateMatches) {
          await tx.insert(matches).values({
            editionId: (group.phase as any).editionId,
            phaseId: group.phaseId,
            groupId,
            bracketNodeId: node.id,
            participant1RegistrationId: fixture.p1 ?? null,
            participant2RegistrationId: fixture.p2 ?? null,
            matchCode: node.nodeCode,
            status: "PENDING",
            round: dayNumber,
            matchNumber: i + 1,
            metadata: {
              dayNumber,
              leg: dayNumber > Math.ceil(calendar.length / 2) && isHomeAway ? 2 : 1,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        createdNodes.push({
          id: node.id,
          nodeCode: String(node.nodeCode),
          name: `${group.name} — Confrontation ${i + 1}`,
          dayNumber,
          fixtureIndex: i + 1,
          p1: fixture.p1 ?? null,
          p2: fixture.p2 ?? null,
          p1Name: names[fixture.p1!] || "À déterminer",
          p2Name: names[fixture.p2!] || "À déterminer",
        });
      }
      return createdNodes;
    });

    // Exemptés : membres du groupe sans confrontation cette journée.
    const playing = new Set(fixtures.flatMap((f) => [f.p1, f.p2]));
    const byeMembers = members
      .filter((m) => !playing.has(m.id))
      .map((m) => ({ id: m.id, name: m.name }));

    return {
      nodes: seeded,
      byeMembers,
      names,
      reGenerated: !!options?.force,
    };
  } catch (error) {
    if (error instanceof DrawError) throw error;
    console.error("Error drawing group matches:", error);
    throw new Error(
      (error as Error)?.message ||
        "Erreur serveur lors du tirage des confrontations.",
    );
  }
}
