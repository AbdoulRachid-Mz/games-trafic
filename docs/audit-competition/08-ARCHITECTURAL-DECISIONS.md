# Document 08 — Décisions Architecturales Définitives et Spécifications Métier Validées

Ce document constitue le procès-verbal d'arbitrage architectural définitif pour le système de compétition de Games Trafics. Il traite de manière exhaustive chaque exigence métier, présente les spécifications mathématiques et relationnelles, et fournit les garanties formelles de sécurité financière.

---

## 1. Décision Fondamentale : Clean Slate et Sort des Tables Existantes

### A. Clarification sur `tournaments` et `tournament_editions`
* **Les tables `tournaments` et `tournament_editions` sont CONSERVÉES conceptuellement**, car elles représentent la colonne vertébrale produit de Games Trafics (un conteneur de marque pérenne accueillant des éditions successives).
* **Leurs données historiques sont PURGÉES** (toutes les compétitions passées étant terminées).
* **Leurs schémas sont ÉPURÉS** : suppression des colonnes devenues obsolètes (`winnerId` pointant vers l'ancien `tournament_members`, `editionConfig` qui surinvestissait les règles sportives désormais déportées dans `competition_rulesets`).

### B. Matrice Exhaustive de Purge et Préservation Financière

| Table du Schéma Actuel | Catégorie | Action Décidée | Contraintes & FK Existantes | Justification & Préservation |
|:---|:---|:---|:---|:---|
| **`users`** | Utilisateur | **PRÉSERVER** | Aucune altération | Identité, profil, login, historique. |
| **`teams`** | Organisation | **PRÉSERVER** | Aucune altération | Club pérenne de la plateforme. |
| **`team_members`** | Adhésion | **PRÉSERVER** | FK vers `teams.id` et `users.id` | Historique des membres de clubs. |
| **`wallets` / `user_wallets`** | Finance | **PRÉSERVER** | Aucune altération | Soldes réels en GTC de tous les utilisateurs. |
| **`wallet_transactions`** | Finance | **PRÉSERVER** | FK `walletId`, `financialAccountId` | Ledger comptable immuable à double entrée. |
| **`financial_accounts`** | Finance | **PRÉSERVER** | Comptes Escrow / Fees / Pools | Traçabilité des fonds de la plateforme. |
| **`registration_payments`** | Finance / Sport | **DÉCOUPLER & ARCHIVER** | `registrationId` -> FK `edition_registrations` (CASCADE) | **Point critique :** On supprime la FK cascade, on fige le nom du tournoi dans `archived_edition_name` et on conserve la ligne liée à `wallet_transactions.id`. |
| **`matches`** | Sport Ancien | **PURGER / SUPPRIMER** | FK vers `edition_registrations`, etc. | Modèle binaire 1v1 obsolète. |
| **`bracket_nodes`** | Sport Ancien | **PURGER / SUPPRIMER** | FK vers `phases`, `groups` | Arbre rigide non relationnel obsolète. |
| **`phase_group_participants`**| Sport Ancien | **PURGER / SUPPRIMER** | FK vers `groups`, `registrations` | Stats dénormalisées obsolètes. |
| **`phase_groups`** | Sport Ancien | **PURGER / SUPPRIMER** | FK vers `phases` | Surcharge journées/poules obsolète. |
| **`tournament_phases`** | Sport Ancien | **PURGER / SUPPRIMER** | FK vers `tournament_editions` | Remplacé par `competition_stages`. |
| **`edition_results`** | Sport Ancien | **PURGER / SUPPRIMER** | FK vers `registrations`, `editions` | Remplacé par `competition_entrants.final_rank`. |
| **`tournament_members`** | Sport Ancien | **PURGER / SUPPRIMER** | FK vers `tournaments`, `users`, `teams` | Confusion staff/joueurs obsolète. |
| **`edition_registrations`** | Sport Ancien | **PURGER / SUPPRIMER** | FK vers `editions`, `members` | Remplacé par `competition_entrants`. |

---

## 2. Spécification Complète du Rule Engine

Le Rule Engine est piloté par les données (Data-Driven) à travers la table `competition_rulesets` et un évaluateur TypeScript universel unique (`lib/tournaments/rules/rule-evaluator.ts`). **Aucun code TypeScript n'est requis pour ajouter un nouveau jeu ou barème.**

### A. Données Brutes et Précision Numérique
* Toutes les métriques brutes sont typées :
  * `score` : entier relatif (buts, points de jeu).
  * `kills` : entier positif $\ge 0$.
  * `placement` : entier $\ge 1$ (rang d'arrivée ou de survie).
  * `survival_time_ms` : entier 64-bit (millisecondes).
  * `laps_time_ms` : entier 64-bit (chronométrage au millième de seconde).
  * `penalties` : numérique (`numeric(12, 4)`).
* **Tous les points calculés et moyennes sont stockés en `numeric(12, 4)`** avec arrondi bancaire standard (Half-Up), permettant de gérer les fractions de points sans perte de précision.

### B. Algorithme de Départage Formel (Tiebreaker) avec Vrai `HEAD_TO_HEAD`
L'évaluateur traite les égalités via un algorithme récursif sur sous-graphe :
```text
Fonction résoudreDépartage(candidats, chaîneCritères, historiqueMatchs) :
  Si candidats.taille <= 1 OU chaîneCritères.estVide() :
    Retourner candidats (ordre conservé)
  
  critèreActuel = chaîneCritères.dépiler()
  
  Si critèreActuel == "HEAD_TO_HEAD" :
    1. Isoler uniquement les matchs ayant opposé les candidats entre eux.
    2. Calculer le mini-classement (points, diff) sur ces confrontations directes.
    3. Si le mini-classement départage tout ou partie des candidats :
         Trier et récurser sur les sous-groupes résiduels d'égalités.
    4. Si égalité parfaite (cycle A bat B, B bat C, C bat A) :
         Passer au critère suivant de la chaîne.
  
  Sinon si critèreActuel == "GOAL_DIFF" / "KILLS" / "PLACEMENT" :
    Trier selon la valeur de la métrique.
    Pour chaque groupe de valeurs identiques :
      Récurser avec le reste de la chaîne de critères.
```

### C. Versioning et Pérennité des Règles
* `competition_rulesets` comporte une colonne `version INT NOT NULL DEFAULT 1`.
* Lors de la création d'une édition, `ruleset_id` et `ruleset_version` sont copiés dans `tournament_editions`.
* Toute modification ultérieure d'un barème par un administrateur crée une nouvelle version dans la table, garantissant que les calculs des éditions passées ou en cours ne dérivent jamais.

### D. Exemples Complets de Configuration JSON en Base de Données

#### 1. eFootball / EA Sports FC (Football Standard)
```json
{
  "name": "Football Standard 3-1-0",
  "game": "EFOOTBALL",
  "scoring_mode": "POINTS_TABLE",
  "points_config": {
    "win": 3,
    "draw": 1,
    "loss": 0
  },
  "tiebreaker_chain": [
    "TOTAL_POINTS",
    "HEAD_TO_HEAD",
    "GOAL_DIFFERENCE",
    "GOALS_FOR",
    "WINS_COUNT"
  ],
  "qualification": {
    "advance_per_group": 2,
    "cross_group_best": 0
  }
}
```

#### 2. Call of Duty Mobile (Série Best-of-3)
```json
{
  "name": "COD Mobile SnD BO3",
  "game": "CODM",
  "scoring_mode": "SERIES_WINS",
  "series_config": {
    "required_game_wins": 2,
    "max_games": 3
  },
  "tiebreaker_chain": [
    "SERIES_WINS",
    "GAMES_DIFFERENCE",
    "TOTAL_ROUNDS_DIFF"
  ]
}
```

#### 3. Free Fire (Battle Royale Esports 12 Escouades)
```json
{
  "name": "Free Fire Official BR Scoring",
  "game": "FREE_FIRE",
  "scoring_mode": "METRIC_ACCUMULATION",
  "placement_matrix": {
    "1": 12, "2": 9, "3": 8, "4": 7, "5": 6,
    "6": 5, "7": 4, "8": 3, "9": 2, "10": 1,
    "11": 0, "12": 0
  },
  "metrics": {
    "kills": { "multiplier": 1.0 }
  },
  "tiebreaker_chain": [
    "TOTAL_POINTS",
    "TOTAL_KILLS",
    "BEST_SINGLE_GAME_PLACEMENT",
    "LAST_GAME_PLACEMENT"
  ]
}
```

#### 4. Asphalt 9 (Course 8 Pilotes)
```json
{
  "name": "Asphalt 9 Grand Prix",
  "game": "ASPHALT_9",
  "scoring_mode": "METRIC_ACCUMULATION",
  "placement_matrix": {
    "1": 25, "2": 18, "3": 15, "4": 12, "5": 10,
    "6": 8, "7": 6, "8": 4
  },
  "metrics": {
    "fastest_lap": { "bonus_points": 1.0 }
  },
  "tiebreaker_chain": [
    "TOTAL_POINTS",
    "BEST_PLACEMENT",
    "LOWEST_TOTAL_TIME"
  ]
}
```

---

## 3. Brackets, Slots et Graphe de Progression (DAG)

### A. Structure des Dépendances de Progression Relationnelles
Dans la table `match_slots`, chaque participant attendu dans un match est modélisé par une ligne pointant directement vers sa source amont :

```text
[Match 1: Demi-finale A] ──(Vainqueur)──► [Match 3: Finale - Slot 1 (source_match_id = M1, source_type = MATCH_WINNER)]
[Match 2: Demi-finale B] ──(Vainqueur)──► [Match 3: Finale - Slot 2 (source_match_id = M2, source_type = MATCH_WINNER)]
```

### B. Double Élimination et Grand Finals Reset
1. **Upper Bracket :** Les vainqueurs avancent vers le tour supérieur de l'Upper Bracket (`source_type: MATCH_WINNER`).
2. **Lower Bracket :** Les perdants de l'Upper descendent vers le tour correspondant du Lower Bracket (`source_type: MATCH_LOSER`).
3. **Grand Finals (Match GF1) :**
   * Slot 1 = Vainqueur de la finale Upper (`source_type: MATCH_WINNER, source_match_id: UB_FINAL`).
   * Slot 2 = Vainqueur de la finale Lower (`source_type: MATCH_WINNER, source_match_id: LB_FINAL`).
4. **Grand Finals Reset (Match GF2, conditionnel) :**
   * Pré-généré avec `is_conditional = true` et `status = PENDING`.
   * Si Slot 1 gagne GF1 : Slot 1 est sacré champion, GF2 passe à `CANCELLED`.
   * Si Slot 2 gagne GF1 : GF2 s'active immédiatement (`status = READY`), opposant à nouveau les deux joueurs pour la manche décisive.

### C. Qualifications Transversales (Meilleurs Deuxièmes ou Troisièmes)
Pour modéliser la qualification des 2 meilleurs troisièmes parmi 4 poules :
* `source_type` : `CROSS_GROUP_RANK`.
* `source_group_id` : null (car transversal).
* `source_rank` : 3 (les 3es de chaque poule).
* L'évaluateur compare tous les 3es de poules de la phase selon la chaîne de critères globale (Points, Diff, Buts) et injecte les 2 premiers dans les slots cibles.

### D. Traitement des BYE
Un BYE est représenté formellement dans `match_slots` :
* `source_type = 'BYE'`.
* `assigned_entrant_id = null`.
* Dès la publication de l'arbre, le système détecte le slot BYE, marque le match comme `COMPLETED` et qualifie automatiquement l'adversaire présent vers le tour suivant.

### E. Protection des Modifications Manuelles (`is_locked`)
* Si un arbitre modifie manuellement le participant d'un slot (`assigned_entrant_id`) suite à une disqualification ou une dérogation, il active le drapeau `is_locked = true`.
* **Règle absolue du moteur de progression :** Tout slot ayant `is_locked = true` est **ignoré par les recalculs automatiques**, même si un match amont change de score ultérieurement. Une alerte administrative est consignée dans le journal d'audit de l'édition.

### F. Validation du Graphe Acyclique (DAG Anti-Cycles)
Avant toute insertion ou mise à jour de structure de bracket, l'algorithme parcourt les dépendances :
```ts
function validateBracketAcyclic(matches: MatchNode[]): boolean {
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function dfs(matchId: string): boolean {
    if (visiting.has(matchId)) return false; // Cycle détecté !
    if (visited.has(matchId)) return true;

    visiting.add(matchId);
    for (const parentId of getIncomingMatchDependencies(matchId)) {
      if (!dfs(parentId)) return false;
    }
    visiting.delete(matchId);
    visited.add(matchId);
    return true;
  }

  return matches.every(m => dfs(m.id));
}
```

---

## 4. Matrice de Couverture des Exigences Métier

| Exigence Métier | Composant / Modèle Relationnel | Statut |
|:---|:---|:---:|
| **Duels 1v1 & TvT** | `competition_encounters` + 1 `encounter_matches` + 2 `match_slots` | ✅ Couvert |
| **Séries BO3 / BO5** | 1 `encounter_matches` découpé en N `match_games` | ✅ Couvert |
| **FFA Direct (Courses, Smash)** | 1 `encounter_matches` avec N `match_slots` directs (**zéro côté artificiel**) | ✅ Couvert |
| **Battle Royale Multi-Manches** | 1 `encounter_matches` (12 escouades) + M `match_games` + `game_metrics` (placement+kills) | ✅ Couvert |
| **Confrontations Collectives (Inter-Régions)** | `competition_encounters` (COLLECTIVE) + 2 `encounter_sides` + N sous-matchs | ✅ Couvert |
| **Rosters d'Équipes Figés** | Table `entrant_roster_members` liée à l'édition | ✅ Couvert |
| **Club de Jeu vs Équipe Réelle** | Colonne `in_game_club` sur `competition_entrants` distincte de `team_id` | ✅ Couvert |
| **Départage HEAD_TO_HEAD Réel** | Algorithme sur sous-graphe des participants ex aequo | ✅ Couvert |
| **Double Élimination & Reset** | `source_type: MATCH_WINNER / MATCH_LOSER` + Match conditionnel GF2 | ✅ Couvert |
| **Pérennité Financière Intacte** | Découplage de `registration_payments` avant suppression | ✅ Couvert |

---

## 5. Limites Connues du Modèle

Afin de maintenir une clarté totale, voici les limites fonctionnelles résiduelles identifiées :
1. **Intégration directe aux API des éditeurs de jeu (In-Game API) :** Le modèle n'inclut pas de bots d'extraction automatique des scores en mémoire pour les jeux fermés sur mobile (Free Fire, eFootball). La saisie des scores et l'upload des screenshots de preuve restent sous la responsabilité des capitaines et arbitres.
2. **Streaming vidéo P2P direct :** La plateforme gère les liens de streams (`stream_link`), mais n'héberge pas son propre réseau de diffusion vidéo.
3. **Pondération dynamique par carte en cours de match :** Dans un BO3, chaque carte a le même poids (1 manche gagnée). Une manche comptant double doit être définie comme deux sous-matchs distincts.

---

## 6. Procédure Pas-à-Pas de Migration et Requêtes SQL Sécurisées

Cette procédure est fournie à titre de documentation pour la phase ultérieure d'implémentation. **Elle ne sera exécutée qu'après validation explicite.**

### Étape 1 : Sauvegarde Complète (Snapshot Neon)
Création d'une branche de sauvegarde Neon ou export `pg_dump` de la base actuelle.

### Étape 2 : Découplage et Préservation Comptable de `registration_payments`
```sql
-- 1. Figer le libellé de l'édition pour chaque paiement historique
ALTER TABLE registration_payments ADD COLUMN archived_edition_name TEXT;

UPDATE registration_payments rp
SET archived_edition_name = te.name
FROM edition_registrations er
JOIN tournament_editions te ON te.id = er.edition_id
WHERE er.id = rp.registration_id;

-- 2. Supprimer la contrainte de clé étrangère en cascade
ALTER TABLE registration_payments DROP CONSTRAINT IF EXISTS registration_payments_registration_id_fkey;

-- 3. Renommer la colonne en référence d'archive
ALTER TABLE registration_payments RENAME COLUMN registration_id TO legacy_registration_id;
```

### Étape 3 : Suppression Ordonnée des Tables Sportives Obsolètes
```sql
-- Suppression respectant l'arborescence des clés étrangères
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS bracket_nodes CASCADE;
DROP TABLE IF EXISTS phase_group_participants CASCADE;
DROP TABLE IF EXISTS phase_groups CASCADE;
DROP TABLE IF EXISTS tournament_phases CASCADE;
DROP TABLE IF EXISTS edition_results CASCADE;
DROP TABLE IF EXISTS edition_registrations CASCADE;
DROP TABLE IF EXISTS tournament_members CASCADE;
-- Les données de tournament_editions et tournaments sont vidées
TRUNCATE TABLE tournament_editions CASCADE;
TRUNCATE TABLE tournaments CASCADE;
```

### Étape 4 : Déploiement des Nouvelles Tables Universelles
Application de la migration Drizzle contenant les 13 nouvelles entités spécifiées au Document 05.
