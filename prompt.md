🧠 PROMPT FINAL — REFONTE & CORRECTION MODULE TOURNOIS (PRO LEVEL)
🎯 OBJECTIF GLOBAL

Refactorer, corriger et compléter le système de gestion des tournois (éditions, phases, groupes, brackets, matches) en respectant :

✅ L’architecture existante (NE PAS casser)
✅ Les tables déjà définies (source of truth)
✅ Les pages/components déjà en place
✅ Ajouter uniquement ce qui manque + corriger les incohérences
🧩 ÉTAPE 1 — AUDIT COMPLET (OBLIGATOIRE AVANT TOUT)

Analyser TOUS les fichiers liés aux tournois :

Backend / Data
schema (déjà fourni)
actions (CRUD + logique métier)
queries / getters
lib / utils
Frontend
hooks
components
pages (dashboard + public)
forms
tables
stats-carousel
⚠️ IMPORTANT

Ne rien coder avant d’avoir identifié :

incohérences
duplications
logiques cassées
manques
🧠 ÉTAPE 2 — ARCHITECTURE DES HOOKS (NOUVELLE STRUCTURE)

Créer des hooks modulaires par entité :

1. Phases
usePhaseManager(editionId)
Inclut :
createPhase (single / bulk)
updatePhase
deletePhase
reorderPhase (⚠️ backend gère order)
activatePhase
Helpers :
generatePhasesAuto(config)
validatePhase()
2. Groupes
useGroupManager(phaseId)
Inclut :
createGroup (single / bulk)
assignParticipants (auto / manual)
removeParticipant
generateGroupsAuto()
Helpers :
seedParticipantsRandom()
seedParticipantsManual()
3. Brackets
useBracketManager({ phaseId, groupId })
Inclut :
generateBracket (AUTO / MANUAL)
createNode
deleteNode
linkNodes
Helpers :
generateSingleElimination()
generateDoubleElimination()
detectConflicts()
4. Matches
useMatchManager(context)
Inclut :
createMatch (single / bulk)
updateMatch
deleteMatch
bulkActions
⚠️ CRITICAL

Avant création :

checkDuplicateMatch(participant1, participant2)

➡️ Si existe → afficher WARNING (pas bloquant)

📊 ÉTAPE 3 — ENRICHISSEMENT DES GETTERS (STATS + CONTEXT)

Chaque getById doit retourner :

🎯 Edition
total participants
checked-in
éliminés / actifs
total matches
matches terminés / en cours
progression réelle
standings
🎯 Phase
nombre de groupes
participants total
matches stats
completion %
🎯 Groupe
participants
matches
standings (points, diff, etc.)
qualifiés
🎯 Bracket
rounds
nodes
matches liés
progression
🎯 Match
statut détaillé
participants
historique
validation
🧱 ÉTAPE 4 — LOGIQUE DE GESTION PAR NIVEAU (ULTRA IMPORTANT)
🧩 RÈGLE FONDAMENTALE

👉 Chaque entité gère SES ENFANTS DIRECTS

🎮 Edition

Pages :

overview
members
phases
standings
Members page

2 listes :

✅ membres de l’édition
➕ membres du tournoi NON ajoutés

Actions :

ajouter à l’édition
retirer de l’édition
⚠️ CONTRAINTE RETRAIT

Avant suppression :

vérifier matches
vérifier groupes
vérifier bracket

➡️ sinon bloquer

🧩 Phase

Gère :

groupes uniquement
👥 Groupe
Participants page

2 tabs :

dans le groupe
hors groupe (mais dans édition)

Actions :

add/remove
⚔️ Bracket
généré depuis participants du groupe
AUTO ou MANUAL
support :
aller simple
aller-retour
🎯 Match
lié à :
phase
group (optionnel)
bracketNode (optionnel)
⚙️ ÉTAPE 5 — BULK ACTIONS (OBLIGATOIRE)

Créer un composant :

<BulkActions />

Supporte :

création multiple
suppression multiple
update multiple

Utilisé dans :

matches
groupes
brackets
⚠️ ÉTAPE 6 — CORRECTIONS CRITIQUES
❌ Problèmes à corriger
1. Doublons de matches

✔️ Ajouter vérification + warning UI

2. Mauvaise source participants

✔️ Toujours utiliser :

EditionParticipants (registrations)

❌ jamais directement tournamentMembers

3. Order dans forms

✔️ supprimer des formulaires
✔️ gérer uniquement backend

4. Relations cassées

✔️ Vérifier cascade logique :

edition → phase → group → bracket → match
🏆 ÉTAPE 7 — STANDINGS (IMPORTANT)

Ajouter standings :

1. Edition (public page)
classement global
2. Groupe
points
wins/loss
diff
3. Bracket
progression
élimination
🎨 ÉTAPE 8 — UI/UX (AMÉLIORATION)
Stats

Utiliser :

<StatsCarousel />

Pour :

édition
phase
groupe
bracket
Actions

Chaque entité doit avoir :

➕ Add
✏️ Edit
❌ Delete
👁️ View details
Pages détails

Chaque entité → page dédiée avec :

infos
stats
enfants
🔐 ÉTAPE 9 — RÈGLES MÉTIER IMPORTANTES
un participant = editionRegistration
un groupe ⟶ contient uniquement participants de l’édition
un match ⟶ appartient à :
phase (obligatoire)
group (optionnel)
bracket (optionnel)
🚀 LIVRABLE ATTENDU

Le système doit permettre :

✅ gérer une édition complète
✅ ajouter/retirer participants proprement
✅ générer groupes automatiquement
✅ générer brackets intelligents
✅ gérer matches (single + bulk)
✅ afficher stats + standings partout
✅ éviter incohérences
on assure bien le responsive (surtout pour les mobile) avec le hook use-screen

💡 BONUS (OPTIONNEL MAIS FORTEMENT RECOMMANDÉ)
cache avec React Query / TanStack
optimistic updates