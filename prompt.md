🎯 OBJECTIF

Refactoriser et corriger toute la gestion des phases, groupes, brackets (nodes) et matches pour garantir :

Cohérence stricte entre niveaux
Respect des configurations parent/enfant
Gestion intelligente des participants
Création auto + manuelle fiable
Progression automatique contrôlée
UI/UX réaliste (niveau plateforme esport)

⚠️ IMPORTANT
Ne rien recréer inutilement → corriger, adapter et unifier l’existant

1️⃣ 🔍 ANALYSE OBLIGATOIRE

Avant toute modification, analyser :

hooks (tanstack)
server actions
components (forms + bulk)
pages (edition / dashboard)
utils (génération / logique)

👉 Identifier :

incohérences de hiérarchie
mauvaise récupération des participants
absence de validation métier
logique de génération cassée
2️⃣ 🧩 PRINCIPE FONDAMENTAL (CRITIQUE)
🔗 CHAQUE NIVEAU DÉPEND DU PARENT
Niveau	Source participants
Edition	registrations
Phase	édition / phase précédente
Groupe	phase
Bracket	groupe
Match	bracket / groupe
⚠️ RÈGLE ABSOLUE

❌ INTERDIT : utiliser les participants globaux
✅ OBLIGATOIRE : utiliser ceux du niveau courant

3️⃣ ⚙️ VALIDATION PAR CONFIG PARENTE

Avant toute action (create / bulk / generate) :

Vérifier :
type de phase (ROUND_ROBIN / ELIMINATION)
config (nombre de qualifiés, matches, etc.)
nombre de participants disponibles
limite atteinte
🎯 COMPORTEMENT
SI limite atteinte :
désactiver :
bouton ajouter
bouton générer
bouton bulk
4️⃣ 🎮 CORRECTION MATCHES (CRITIQUE)
❌ Problème actuel
participants = "À déterminer"
✅ Solution

Dans fetch matches :

➡️ JOIN OBLIGATOIRE :

participant1 → registration → user/team
participant2 → registration → user/team
Résultat UI :

👉 afficher :

nom joueur
avatar
tag
5️⃣ 🧠 LOGIQUE BRACKETS AVEC PARTICIPANTS
Problème :

Pas de table participants pour brackets

✅ Solution

👉 stocker participants dans :

bracketNode.config = {
  participants: registrationIds[]
}
⚙️ Règles :
participants viennent du groupe parent
un joueur ne peut être que dans un seul bracket du même groupe
✅ Génération matches :

basée uniquement sur :

bracket.config.participants
6️⃣ 🎲 GÉNÉRATION MATCHES (AUTO PRIORITAIRE)
Priorité :

👉 génération depuis bracketId

Types :
aléatoire
aller simple
aller-retour
Contraintes :
pas de duplication
équilibre des rencontres
7️⃣ 🧩 LOGIQUE PAR FORMAT
🟣 ROUND ROBIN

Structure :

Phase unique
Journées (Day 1, Day 2…)
Chaque journée :
plusieurs brackets
plusieurs matches
🔴 ELIMINATION

Structure :

arbres (Upper / Lower / Final)
🧠 Naming automatique (OBLIGATOIRE)
Elimination :
Round 1 → "1/16 finale"
Round 2 → "1/8 finale"
Quarter → "Quart de finale"
Semi → "Demi-finale"
Final → "Finale"
8️⃣ 🧠 ORGANISATION D’UNE PHASE

Lors de création :

Vérifier phase précédente :

👉 filtrer participants :

tous
qualifiés
éliminés
⚙️ Config :
nombre qualifiés
distribution automatique
9️⃣ 🔄 PROGRESSION AUTOMATIQUE
À chaque résultat de match :
vérifier :
joueur a terminé ses matches ?
est qualifié ?
SI OUI :

➡️ ouvrir dialog :

"Ce joueur est qualifié, l’envoyer à la phase suivante ?"

SI CONFIRMÉ :

➡️ ajout automatique dans phase suivante

🔟 ✅ VALIDATION MATCH (ROLE)
SI :
organisateur
co-organisateur

👉 match = auto confirmé

SINON :

👉 système de confirmation classique

11️⃣ 📊 STATUT DES NIVEAUX

Ajouter boutons :

✅ Terminer groupe
✅ Terminer bracket
✅ Terminer phase
✅ Terminer édition
Effets :
lock modifications
update standings
update editionResults
12️⃣ 📈 STANDINGS AVANCÉS
Ajouter filtres dynamiques :
par phase
par groupe
par bracket
UX :
cascade :
sélectionner phase
sélectionner groupe
sélectionner bracket
13️⃣ 🧑‍💻 DASHBOARD — NOUVELLES PAGES

Ajouter :

📍 /dashboard/edition/[id]/groups
liste tous les groupes
filtres
📍 /dashboard/edition/[id]/brackets
tous les nodes
filtres avancés
📍 /dashboard/edition/[id]/matches
pagination
filtres
gestion
📍 /dashboard/edition/[id]/matches/[matchId]
accès :
participant :
saisir score
organisateur :
full contrôle
14️⃣ ⚠️ COHÉRENCE BULK & FORM

Tous doivent :

respecter config parent
respecter participants disponibles
empêcher doublons
désactiver actions si limite atteinte
15️⃣ 🚫 RÈGLES CRITIQUES
❌ interdit :
joueur dans 2 brackets même groupe
match dupliqué
participant hors scope
16️⃣ 🔥 AMÉLIORATIONS PROPOSÉES
💡 Smart features :
✅ shuffle intelligent
✅ équilibrage auto
✅ preview avant création
✅ compteur dynamique
💡 UX :
badges (qualified / eliminated)
progression visuelle
loading states propres
17️⃣ 🎯 RÉSULTAT FINAL

Un système :

totalement cohérent
robuste
scalable
réaliste (niveau esport)
sans bugs de logique


==========================volet 2====================
🎯 Objectif

Ajouter :

Export des données clés d’une édition
Priorisation UX des matches (mes matches)
Pagination propre côté matches
Structure extensible (PDF / CSV / JSON)
📦 1. EXPORT DES DONNÉES (Edition)
🔍 Scope

Depuis la page editionId, ajouter un bouton :

Exporter les données
Dropdown :
Export Participants
Export Calendrier des matches
Export complet (optionnel)
📊 Données à exporter
🧑 Participants (édition)
Nom (displayName / teamName)
GameTag
Statut (checked-in, éliminé, qualifié)
Stats :
Matches joués
Victoires / défaites
Points
Position (si dispo)
⚔️ Matches (calendrier)
MatchCode
Phase / Groupe / Bracket
Participants (nom + tag)
Score
Statut
Date (scheduledTime)
Round / Match number
⚙️ Backend (actions)

Créer :

export async function exportEditionParticipants(editionId: string, format: 'csv' | 'json' | 'pdf')
export async function exportEditionMatches(editionId: string, format: 'csv' | 'json' | 'pdf')
📁 Format recommandé
CSV (priorité)
Simple à télécharger
Compatible Excel
JSON
Pour API / debug
PDF (option premium UX)
Pour partage tournoi
🧠 Logique
Toujours enrichir avec :
noms participants (join registrations → members)
contexte (phase, groupe, bracket)
Ne jamais retourner des IDs seuls
🎮 2. PRIORISATION “MES MATCHES”
📍 Dans tabs matches (editionId)
🔝 Ordre d’affichage :
Mes matches (prioritaires)
Autres matches
🧠 Détection “mes matches”
match.participant1.userId === currentUser.id
|| match.participant2.userId === currentUser.id
🎨 UI
Section séparée :
🔥 Mes matches
- liste (max 5 ou paginé)

🌍 Tous les matches
- liste classique
⚡ Bonus UX
Badge :
YOU
Highlight card (border primary)
📄 3. PAGINATION MATCHES
🎯 Page /matches
⚙️ Backend
getMatches({
  editionId,
  page = 1,
  limit = 20,
  filters
})
🔁 Réponse
{
  data: Match[],
  total: number,
  page: number,
  totalPages: number
}
🧠 Frontend
Chargement par lot : 20 matches
Boutons :
Suivant / Précédent
ou infinite scroll (optionnel)
📌 Important

Toujours récupérer :

participants (JOIN registrations → members)
éviter “À déterminer” si data existe
📊 4. AMÉLIORATION TAB MATCHES (editionId)
🔁 Remplacer le vide actuel par :
Stats rapides :
Total matches
Terminés
En cours
Liste :
10 matches récents
Bouton :
Voir tous les matches
🧠 5. COHÉRENCE GLOBALE
⚠️ Règles
Toujours hydrater :
participants
contexte (phase/group/bracket)
Jamais afficher :
IDs bruts
"À déterminer" si données existent
🚀 6. BONUS (RECOMMANDÉ)
📥 Export depuis dashboard admin
Export par :
Phase
Groupe
Bracket
📅 Export calendrier intelligent

Tri par :

ORDER BY scheduledTime ASC
📊 Export standings
Ajouter aussi :
classement complet (édition / groupe / bracket)
✅ RÉSULTAT ATTENDU
Export pro (type e-sport platform)
UX claire pour les joueurs
Matches lisibles et priorisés
Pagination performante
Données exploitables (Excel / partage)