🎯 OBJECTIF

Refactoriser et corriger entièrement la gestion des éditions de tournois, en respectant une logique réelle de compétition, avec :

Chargement correct des données
Gestion des participants cohérente
Génération intelligente (auto + manuelle)
Progression automatique
Bulk actions
Standings dynamiques
UX propre et réaliste

⚠️ IMPORTANT :
Ne rien recréer inutilement → corriger, compléter, améliorer l’existant

1️⃣ 🔍 ANALYSE OBLIGATOIRE AVANT TOUT

Analyser TOUS les fichiers liés :

actions (server)
hooks (tanstack)
schema (drizzle)
components (UI)
pages (app router)
utils / lib

👉 Identifier :

incohérences de data fetching
relations mal exploitées
données non jointes (participants, matches, standings)

3️⃣ 📊 CORRECTION PAGE editionId (PUBLIC)
❌ Problème actuel
Données mal récupérées
Tout dépend de la requête édition
✅ Nouvelle règle

👉 CHAQUE TAB = FETCH INDÉPENDANT

🧩 TAB MATCHES
À faire :
récupérer séparément
pagination (20 par batch)
afficher participants (plus de “À déterminer”)
UI :
Stats globales :
total matches
terminés
en cours
afficher :
👉 10 derniers matches
bouton :
👉 "Voir tous les matches"
🧩 TAB STANDINGS (CLASSEMENT)
❌ problème :

scores = 0

✅ solution :

Recalcul backend basé sur matches :

matchesPlayed
wins
losses
draws
points
goalDiff

👉 basé sur :

score1 / score2
winnerRegistrationId
🧩 TAB GROUPES
❌ problème :

"Aucune phase configurée"

✅ solution :
fetch phases
fetch groupes liés
fetch matches liés

👉 si matches existent → afficher structure automatiquement

4️⃣ 🧑‍🤝‍🧑 DASHBOARD ÉDITION — PARTICIPANTS
❌ problème
liste incomplète
✅ logique correcte
Deux listes OBLIGATOIRES :
1. Participants de l’édition
2. Membres du tournoi NON dans l’édition
Actions :
➕ Ajouter

(si membre ∉ édition)

➖ Retirer

(si membre ∈ édition)

⚠️ Règle critique (SUPPRESSION)

Avant suppression vérifier :

a des matches ?
dans un groupe ?
dans un bracket ?

👉 si OUI → bloquer ou confirmer

5️⃣ 🧩 BULK ACTIONS (PARTOUT)

À ajouter dans :

participants
groupes
brackets
matches
Types :
ajout multiple
suppression multiple
génération auto
modification multiple
6️⃣ 🎮 CRÉATION MATCH — VALIDATION STRICTE
❌ problèmes :
1 seul joueur
duplication
✅ règles :
player1 ≠ player2
match déjà existant → ALERTE

👉 vérifier :

participant1 === X && participant2 === Y
OU
participant1 === Y && participant2 === X
7️⃣ ⚙️ GÉNÉRATION MATCHES (GROUP / BRACKET)
📍 Page GroupId
bouton "Générer matches"

➡️ ouvre un dialog

config :
nombre de nodes
type :
round robin
elimination
aller simple / aller-retour

👉 basé UNIQUEMENT sur :
participants du groupe

📍 Page BracketId

➡️ générer matches depuis nodes

8️⃣ 🧠 ORGANISATION COMPLÈTE (FEATURE MAJEURE)
Nouvelle page :

👉 /edition/[id]/organize

Objectif :

Créer TOUT en une seule fois :

étapes :
créer phases
créer groupes par phase
assigner participants :
tous
qualifiés
éliminés
manuel
créer brackets
générer matches
Résultat :

👉 à la soumission :

génération automatique des matches (phase 1)
structure complète prête
9️⃣ 🔄 PROGRESSION AUTOMATIQUE
À chaque fin de match :
vérifier :
joueur a fini tous ses matches ?
est qualifié ?
SI QUALIFIÉ :

➡️ ajouter dans phase suivante

SINON :

➡️ éliminé

🔟 📈 STANDINGS (PARTOUT)

Ajouter :

édition
groupe
bracket
calcul dynamique basé sur matches
11️⃣ 🧩 PHASES — LOGIQUE AVANCÉE
création multiple :

ex:

👉 "Group Stage + Elimination"

➡️ crée :

phase 1 (groupes)
phase 2 (knockout)
12️⃣ 📦 STRUCTURE HOOKS

Créer :

usePhaseManager
useGroupManager
useBracketManager
avec :
actions simples
bulk actions
génération auto
génération manuelle
13️⃣ 🎯 UX OBLIGATOIRE

Dans CHAQUE PAGE :

bouton :
ajouter
bulk
générer auto
stats-carousel utilisé partout
✅ RÉSULTAT ATTENDU

Un système :

cohérent
scalable
réaliste (comme FIFA / esports)
automatisé mais contrôlable
sans incohérences de données