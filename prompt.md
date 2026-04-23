## OBJECTIF

Refonte complète de l'architecture des phases de tournoi pour éliminer la double source de vérité (metadata.participants vs phaseGroupParticipants) et uniformiser la gestion des participants.

## PRINCIPE FONDAMENTAL

**UN SEUL ENDROIT POUR LES PARTICIPANTS : phaseGroupParticipants**

- Toute phase, tout groupe, tout bracket node utilise `phaseGroupParticipants` comme source unique
- `metadata.participants` est SUPPRIMÉ progressivement
- Les bracketNodes sont TOUJOURS rattachés à un group (même pour élimination directe)

## NOUVEAU MODÈLE
PHASE
└── GROUPS (TOUJOURS)
├── participants (via phaseGroupParticipants)
└── bracketNodes (matchs du groupe)

text

### Types de groupes par phase

| Phase Type | Group représente |
|------------|------------------|
| GROUP_STAGE | Groupe A, B, C |
| ROUND_ROBIN | Groupe unique |
| ELIMINATION | Round (1/8, 1/4, Demi, Finale) |
| SWISS | Round dynamique |

## TÂCHES À RÉALISER

### PARTIE 1 : BACKEND - ACTIONS

#### 1.1 Créer `getPhaseContextAction`

Fichier : `@/actions/phases.ts`

```typescript
export async function getPhaseContextAction(phaseId: string): Promise<{
  isFinalPhase: boolean;
  nextPhaseId: string | null;
  nextPhaseName: string | null;
  phaseType: string;
  groupsCount: number;
  qualifiedCount: number;
  hasPendingEntities: boolean;
}>
Fonction : Retourne le contexte d'une phase pour le dialogue de clôture.

1.2 Refactor organizeNextPhaseAction
Fichier : @/actions/phases.ts - cas ELIMINATION/KNOCKOUT

À remplacer : appel à setupBracketPhase

Par : création de groups par round

typescript
// Nouvelle logique pour élimination directe
async function setupEliminationGroups(tx, editionId, phase, participantRegIds, options) {
  const participantCount = participantRegIds.length;
  const totalRounds = Math.ceil(Math.log2(participantCount));
  const createdGroups = [];
  let currentParticipants = [...participantRegIds];

  // Mélange si demandé
  if (options.seedingMethod === "RANDOM") {
    currentParticipants = shuffle(currentParticipants);
  }

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex++) {
    const matchesThisRound = Math.pow(2, totalRounds - roundIndex - 1);
    const groupName = getRoundName(matchesThisRound * 2);

    // Créer le group pour ce round
    const [group] = await tx.insert(phaseGroups).values({
      phaseId: phase.id,
      name: groupName,
      order: roundIndex,
      participantCount: roundIndex === 0 ? participantCount : matchesThisRound * 2,
      groupType: "ELIMINATION_ROUND",
      config: {
        round: roundIndex + 1,
        advanceCount: matchesThisRound,
        isHomeAway: options.isHomeAway || false,
        matchFormat: options.matchFormat || "BEST_OF_1",
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    createdGroups.push(group);

    // Assigner les participants UNIQUEMENT au premier round
    if (roundIndex === 0) {
      for (const regId of currentParticipants) {
        await tx.insert(phaseGroupParticipants).values({
          groupId: group.id,
          registrationId: regId,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    // Créer les bracketNodes pour ce group (un par match)
    for (let matchIdx = 0; matchIdx < matchesThisRound; matchIdx++) {
      const p1 = roundIndex === 0 ? currentParticipants[matchIdx * 2] : null;
      const p2 = roundIndex === 0 ? currentParticipants[matchIdx * 2 + 1] : null;

      const [node] = await tx.insert(bracketNodes).values({
        phaseId: phase.id,
        groupId: group.id,
        nodeCode: `${groupName.slice(0, 3).toUpperCase()}-M${matchIdx + 1}`,
        round: roundIndex + 1,
        matchNumber: matchIdx + 1,
        bracketType: "UPPER",
        order: matchIdx,
        metadata: {
          requiresMatch: roundIndex === 0,
          matchFormat: options.matchFormat || "BEST_OF_1",
          isHomeAway: options.isHomeAway || false,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Générer les matchs uniquement pour le premier round
      if (roundIndex === 0 && p1 && p2 && options.generateMatches) {
        const matchesToCreate = options.isHomeAway ? 2 : 1;
        for (let mIdx = 0; mIdx < matchesToCreate; mIdx++) {
          await tx.insert(matches).values({
            editionId,
            phaseId: phase.id,
            groupId: group.id,
            bracketNodeId: node.id,
            participant1RegistrationId: mIdx === 0 ? p1 : p2,
            participant2RegistrationId: mIdx === 0 ? p2 : p1,
            matchCode: matchesToCreate > 1 ? `${node.nodeCode}-L${mIdx + 1}` : node.nodeCode,
            status: "PENDING",
            round: roundIndex + 1,
            matchNumber: matchIdx + 1,
            metadata: {
              format: options.matchFormat || "BEST_OF_1",
              leg: mIdx + 1,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    }

    // Préparer les participants pour le round suivant (placeholders)
    currentParticipants = Array(matchesThisRound).fill(null).map((_, idx) => `WINNER_R${roundIndex + 1}_M${idx + 1}`);
  }

  return createdGroups;
}

function getRoundName(matchCount: number): string {
  switch (matchCount) {
    case 2: return "Finale";
    case 4: return "Demi-finale";
    case 8: return "Quart de finale";
    case 16: return "Huitième de finale";
    case 32: return "Seizième de finale";
    case 64: return "Trente-deuxième de finale";
    default: return `Top ${matchCount}`;
  }
}
1.3 Refactor markGroupCompleteAction
Fichier : @/actions/phases.ts

Ajouter la propagation automatique vers le group suivant pour les phases élimination.

typescript
// Dans markGroupCompleteAction, après avoir marqué les qualifiés
if (group.groupType === "ELIMINATION_ROUND") {
  const nextGroup = await getNextEliminationGroup(tx, group.id);
  if (nextGroup) {
    const qualified = await getQualifiedParticipantsForGroup(tx, group.id);
    for (const q of qualified) {
      await tx.insert(phaseGroupParticipants).values({
        groupId: nextGroup.id,
        registrationId: q.registrationId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  }
}
1.4 Refactor markBracketNodeCompleteAction
Fichier : @/actions/phases.ts

Supprimer la logique de propagation vers parentNode

Remplacer par : mise à jour des stats + si tous les nodes du group sont terminés → marquer group comme complet

typescript
// Après avoir déterminé le winnerId
// 1. Mettre à jour le bracketNode
await tx.update(bracketNodes).set({
  isCompleted: true,
  winnerRegistrationId: winnerId,
  updatedAt: new Date(),
}).where(eq(bracketNodes.id, nodeId));

// 2. Vérifier si tous les nodes du group sont terminés
const groupNodes = await tx.query.bracketNodes.findMany({
  where: and(eq(bracketNodes.groupId, node.groupId), eq(bracketNodes.isDeleted, false)),
});
const allCompleted = groupNodes.every(n => n.isCompleted);

if (allCompleted && node.groupId) {
  // Marquer le group comme complet
  await markGroupCompleteAction(node.groupId);
}
1.5 Refactor getQualifiedParticipantsPreviewAction
Fichier : @/actions/phases.ts

Supprimer le cas "CASE BRACKET"

Toujours utiliser les groups

typescript
// Supprimer ce bloc :
else if (phase.bracketNodes && phase.bracketNodes.length > 0) { ... }

// Remplacer par une logique unifiée basée sur les groups
1.6 Supprimer generateBracketMatches
Fichier : @/actions/phases.ts

Marquer comme @deprecated

Rediriger vers generateMatchesAction

typescript
export async function generateBracketMatches(bracketNodeId: string, config?: any) {
  console.warn("generateBracketMatches is deprecated, use generateMatchesAction instead");
  return generateMatchesAction("NODE", bracketNodeId, config);
}
1.7 Créer getGroupQualifiedPreviewAction
Fichier : @/actions/phases.ts

typescript
export async function getGroupQualifiedPreviewAction(groupId: string): Promise<{
  success: boolean;
  qualified: Array<{ registrationId: string; name: string; position: number }>;
}>
PARTIE 2 : FRONTEND - COMPOSANTS
2.1 Refactor MarkCompleteDialog
Fichier : @/components/pages/tournaments/edition-detail/mark-complete-dialog.tsx

Remplacer isLastPhase (prop) par appel à getPhaseContextAction

Supprimer isLastPhase des props

typescript
// Avant :
const isFinalPhase = type === 'PHASE' && isLastPhase;

// Après :
const { data: context } = useQuery({
  queryKey: ['phase-context', id],
  queryFn: () => getPhaseContextAction(id),
  enabled: type === 'PHASE' && !!id && isOpen,
});
const isFinalPhase = !context?.nextPhaseId;
2.2 Refactor BracketNodeMatchesOrganizeClient
Fichier : @/components/pages/tournaments/edition-detail/bracket-node-matches-organize-client.tsx

Remplacer metadata.participants par phaseGroupParticipants

Remplacer participant1RegistrationId/participant2RegistrationId par les vrais IDs

Supprimer generateBracketMatches au profit de generateMatchesAction

2.3 Refactor GenerateGroupMatchesDialog
Fichier : @/components/pages/tournaments/edition-detail/generate-group-matches-dialog.tsx

Simplifier : ne génère que les matchs pour un group

Utiliser generateMatchesAction("GROUP", groupId, options)

Supprimer la logique de sélection de brackets (c'est l'affaire du backend)

2.4 Refactor GroupDetailClient
Fichier : app/.../groups/[groupId]/GroupDetailClient.tsx

Remplacer l'appel à organizeNextPhaseAction par generateMatchesAction

Ajouter un onglet "Round" pour l'élimination directe

2.5 Refactor PhaseDetailClient
Fichier : app/.../phases/[phaseId]/phase-detail-client.tsx

Remplacer l'appel à organizeNextPhaseAction pour les groupes par generateMatchesAction

2.6 Refactor ClientBracketNodeDetailPage
Fichier : app/.../brackets/[bracketId]/client-page.tsx

Remplacer nodeParticipants (metadata) par requête sur phaseGroupParticipants

Remplacer generateBracketMatches par generateMatchesAction

2.7 bloquer les pages obsolètes
group-nodes-organize/page.tsx (si GroupNodesOrganizeClient n'existe pas ou est obsolète)

brackets/[bracketId]/organize/page.tsx (fusionner avec la page detail)

PARTIE 3 : LIBRAIRIES
3.1 Refactor structure-engine.ts
Supprimer setupBracketPhase

Utiliser setupEliminationGroups à la place

3.2 Refactor generators.ts
Supprimer setupBracketPhase

Ajouter setupEliminationGroups

3.3 Supprimer propagation-service.ts
Logique déplacée dans markGroupCompleteAction

3.4 Supprimer tree.engine.ts
Plus nécessaire avec la nouvelle architecture

PARTIE 4 : TYPES
4.1 Mettre à jour les types
Fichier : @/database/schema.ts

typescript
// Ajouter groupType = "ELIMINATION_ROUND"
export const phaseGroups = pgTable('phase_groups', {
  // ...
  groupType: text('group_type').default('ROUND_ROBIN'), // Ajouter 'ELIMINATION_ROUND'
  // ...
});
PARTIE 5 : MIGRATION DB
5.1 Créer une migration
sql
-- Ajouter la valeur 'ELIMINATION_ROUND' à l'enum group_type
ALTER TYPE group_type ADD VALUE IF NOT EXISTS 'ELIMINATION_ROUND';

-- Pour les brackets nodes existants en élimination, créer les groups manquants
-- (script à écrire selon les données existantes)
CONTRAINTES
Backward compatibility : Les anciennes données doivent continuer à fonctionner

Pas de regression : Les fonctionnalités existantes (group_stage, round_robin, swiss) ne sont pas cassées

Progressive : On peut déployer par phase (d'abord backend, puis front)

Typage strict : Toutes les nouvelles fonctions ont des types TypeScript explicites

LIVRABLES ATTENDUS
Code modifié des fichiers listés

Nouvelles migrations DB

Mise à jour des types

Suppression des fichiers obsolètes

Documentation des breaking changes (si applicable)

COMMENCER PAR
Refactor de organizeNextPhaseAction (cas ELIMINATION)

Refactor de markGroupCompleteAction (propagation)

Refactor de MarkCompleteDialog