Salut ! Tu es un expert en développement de systèmes de gestion de tournois complexes (multi-formats : élimination, round-robin, suisse, hybride).

J’ai déjà implémenté la majorité de mon système (backend + frontend), mais je veux maintenant améliorer la logique globale, la cohérence métier et l’automatisation.

Ta mission est de :
1. Analyser toute l’architecture existante (actions serveur, moteurs, composants frontend, structure des phases/groupes/brackets)
2. Identifier les incohérences
3. Proposer une refactorisation propre, unifiée et scalable
4. Implémenter une logique centralisée de progression automatique

---

# 🎯 OBJECTIF PRINCIPAL

Automatiser entièrement la progression des tournois après validation des matchs, tout en respectant :
- le type de phase (ELIMINATION, GROUP_STAGE, ROUND_ROBIN, SWISS)
- le type d’édition (ex: CHAMPIONS / LDC / WORLD CUP (ici type ldc et world cup sont les memes, ils doivent avoir le meme comportement: une phase groupe et une phase elimination avec nombre de groupes et qualifiés fixes par défaut et peut renommer: groupe et élimination) / CUSTOM)
- le mode (AUTO (on avance automatiquement sans intervention) / MANUAL (on avance manuellement))
- la structure réelle (groups comme source unique)

---

# ⚙️ 1. AUTOMATISATION APRÈS VALIDATION MATCH

Dans la page :
/tournaments/[tournamentId]/editions/[editionId]/matches/[matchId]

👉 Après validation admin d’un match :

Implémenter une logique globale qui :

### ✅ Étapes
1. Vérifie si le match est le dernier :
   - du bracket node
   - du group
   - ou de la phase

2. Si OUI :
   - Calculer automatiquement les qualifiés / vainqueurs
   - Selon :
     - type de phase
     - format (BO1, BO3, BO5, aller-retour)
     - mode de compétition

3. Déclencher un dialog intelligent qui :
   - affiche les qualifiés / vainqueurs
   - propose de :
     → marquer comme terminé
     → organiser le niveau suivant (tirage / génération)

4. Enchaîner automatiquement :
   - bracket → group → phase → edition (si applicable)

---

# 🧩 2. LOGIQUE PAR TYPE DE PHASE

## 🟡 ÉLIMINATION (KNOCKOUT)
- Progression via GROUPS (rounds : 1/8, 1/4, demi, finale)
- Chaque group = un round
- Les qualifiés sont propagés vers le group suivant
- Pas de metadata.participants → uniquement phaseGroupParticipants

---

## 🔵 ROUND ROBIN / CHAMPIONNAT
- Progression par journées (rounds)
- Matchs :
  - aller simple OU
  - aller-retour (selon config)
- Classement dynamique
- Qualification basée sur :
  - position
  - points
  - règles de tie-break

---

## 🟣 SWISS
- Génération dynamique des rounds
- Pairing basé sur score (victoires/défaites)
- Pas d’élimination directe
- Qualification basée sur :
  - score final
  - nombre de rounds

--- 

## ⚪ MODE (IMPORTANT)
Chaque logique doit adapter son comportement selon :
- AUTO → tout générer automatiquement
- MANUAL → laisser contrôle admin

---

# 🔁 3. PROPAGATION AUTOMATIQUE

Après chaque validation :

👉 Implémenter un moteur central :

```ts
progressTournamentAfterMatch(matchId)


le plus important c'est la gestion des progression avec confirmation via dialog dans les pages matches: /tournaments/[tournamentId]/editions/[editionId]/matches/[matchId] et la page calendrier: /tournaments/[tournamentId]/editions/[editionId]/dashboard/matches.

dans la page dashboard: /tournaments/[tournamentId]/editions/[editionId]/matches/[matchId] quand c'est valider par l'admin , on ne peut pas modifier mais il faut enlever cette condition mais on desactive les champs jusqu'a ce que l'admin essaie de modifier. au niveau des champs score , il faut mettre les boutons + et - c'est mieux.

ref de fichiers: 

-@/database/schema.ts
- @/actions/tournaments.ts, @/actions/editions.ts, @/actions/phases.ts, @/actions/participants.ts, 
- @/lib/tournaments
- @/hooks: use-phase-manager, use-match-manager, use-edition-manager, use-tournament, use-group-manager, use-bracket-manager etc..
- @/components/pages/tournaments/edition-detail/edition-detail

pages: 
/tournaments/[tournamentId]/editions/[editionId]/matches/[matchId]
/tournaments/[tournamentId]/editions/[editionId]/calendar
/tournaments/[tournamentId]/editions/[editionId]
/tournaments/[tournamentId]/editions/[editionId]/dashboard/ tous les pages dans le dashboard editions

@/utils

etc...

