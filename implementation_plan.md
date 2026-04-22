# Refonte de l'organisation des tournois (Mode LDC)

Ce plan d'implémentation détaille les modifications nécessaires pour passer l'organisation des tournois "LDC" vers une structure stricte à 2 phases (Groupes + Élimination), tout en automatisant la progression dans les brackets (tableaux) connectés sans créer une multitude de phases pour chaque tour.

## User Review Required

> [!WARNING]
> La refonte de `setupBracketPhase` modifiera la façon dont les tableaux (brackets) sont construits en base de données. Ils seront désormais correctement chaînés via `parentNodeId`, permettant à la victoire d'un match de propager automatiquement le gagnant au round suivant. Confirmez-vous que vous souhaitez ce comportement entièrement automatisé pour l'arbre d'élimination de la phase 2 ? oui

## Proposed Changes

### Configuration du Wizard et Interface
#### [MODIFY] `components/pages/tournaments/edition-detail/organize-wizard-client.tsx`
- **Séparation Home/Away** : Séparation de l'option `isHomeAway` du `AutoConfig` en deux options distinctes (`isHomeAwayGroups` et `isHomeAwayElimination`) pour le type LDC. L'UI affichera des cases à cocher spécifiques pour la phase de groupes et pour la phase finale.
- **Réduction à 2 Phases (Preset CHAMPIONS)** :
  - La méthode `buildAutoPhases` pour `CHAMPIONS` ne renverra plus qu'un tableau de deux objets `DraftPhase`: `GROUP_STAGE` (Phase 1) et `ELIMINATION` (Phase 2).
  - Suppression de la boucle `while (roundParticipants >= 2)` qui générait une phase indépendante pour chaque tour d'élimination.
- **Paramètres de la phase d'élimination** : La limite attendue des participants à cette phase finale sera de `groupsCount * groupsQualifiedCount`.

### Générateur d'Arbre d'Élimination (Brackets)
#### [MODIFY] `lib/tournaments/generators.ts`
- **Refonte de `setupBracketPhase`** :
  - **Création Arborescente Liée** : Transformation de la création des "Bracket Nodes" d'une logique "à plat" vers une structure arborée. Les nœuds du `round N` seront désignés comme parents des nœuds du `round N-1` correspondants, en utilisant `parentNodeId` et `childPosition` (`WINNER`).
  - L'assignation des participants ne s'effectuera que sur les "feuilles" (Round 1), garantissant une phase finale vierge mais prête pour une progression automatisée.

### Moteurs d'Actions de Phase
#### [MODIFY] `actions/phases.ts`
- **Progression post-Phase de Groupes** (`organizeNextPhaseAction`) :
  - Substitution de l'ancienne logique limitative ("UNIQUEMENT LE PREMIER ROUND") par un appel ciblé au nouveau `setupBracketPhase` pour générer toute l'arborescence future d'élimination d'un seul coup.
- **Amélioration de `markBracketNodeCompleteAction`** : L'action de clôture d'un nœud fera progresser automatiquement le participant dans le nœud parent, étant donné que le générateur inclut maintenant le contexte hiérarchique.

### Clôture et Transition (Mark Complete Dialog)
#### [MODIFY] `components/pages/tournaments/edition-detail/mark-complete-dialog.tsx`
- **Aperçu & Sélection des Qualifiés (Phase → Phase suivante)** :
  - Introduction d'une étape de prévisualisation lorsque le dialogue est utilisé pour clôturer la Phase 1 (Groupes). 
  - Affichage de la liste des participants automatiquement qualifiés (en fonction du classement de groupe), offrant l'option (via des cases à cocher) de modifier manuellement ceux qui iront vers l'Elimination.
  - La sélection sera envoyée dans les paramètres de la fonction appelante pour alimenter les "feuilles" de l'arbre d'élimination lors du cycle `organizeNextPhaseAction`.

## Open Questions

> [!IMPORTANT]
> - Dans le dialogue `mark-complete`, si un organisateur modifie manuellement les qualifiés (par exemple en ajoutant un éliminé ou en retirant un qualifié par erreur), devons-nous lui interdire la validation si le total de qualifiés finaux n'est pas une puissance de 2 (indispensable pour un arbre d'élimination canonique sans Byes) ? oui on m'empeche de le faire et on l'alerte.
> - Actuellement l'envoi de la liste modifiée depuis `mark-complete-dialog.tsx` vers l'action backend nécessite l'ajout d'une entrée `customQualifiedIds` dans `organizeNextPhaseAction`. Cela vous convient-il ? oui

## Verification Plan

### Automated Tests
Aucun test scripté supplémentaire, la vérification se basera sur la génération serveur.

### Manual Verification
1. **Création (Wizard)** : Démarrage d'une édition LDC "Auto". Validation UI de la visibilité des options "Aller/Retour Groupes" et "Aller/Retour Élimination". Résultat attendu : 2 phases générées. oui
2. **Transition (Mock matches)** : Fausse complétion des poules, ouverture de `MarkCompleteDialog` sur la phase "Groupes", contrôle et surclassement éventuel des qualifiés avec validation de l'interface "Preview". oui
3. **Arbre Bracket** : Examen backend (et Dashboard UI) pour valider une arborescence connectée sur les brackets de la phase "Élimination" (Parent et position "WINNER" reliés). oui

## Notes
- on ajoute une confitti a un joueur avec un belle card dialog dans la page /editions/editionId/matches/matchId la ou on soummet le resultat.

- dans les pages brackets, on peut exporter les données du bracket en format json/pdf/excel d'un bracket.
