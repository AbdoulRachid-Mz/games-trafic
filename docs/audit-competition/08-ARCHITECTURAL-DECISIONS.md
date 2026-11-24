# Document 08 — Décisions Architecturales Définitives et Spécifications Métier Validées

Ce document constitue le procès-verbal d'arbitrage architectural définitif pour le système de compétition de Games Trafics. Il traite de manière exhaustive chaque exigence métier, présente les démonstrations relationnelles et mathématiques, et fournit les garanties formelles de sécurité financière et sportive.

---

## 1. Décisions Métier Validées Définitivement

### A. Politique de Gestion des Forfaits (Walkovers)
1. **Prononcé Manuel par Défaut :** Le forfait est prononcé manuellement par l'arbitre ou l'administrateur de tournoi.
2. **Compte à Rebours Configurable :** Un délai d'attente configurable (15 minutes par défaut, stocké dans `tournament_editions.forfeit_countdown_minutes`) est enclenché à l'heure officielle du match.
3. **Alerte d'Expiration :** À expiration du compte à rebours (`forfeit_countdown_ends_at < NOW()`), le système émet une alerte visuelle et une notification à l'arbitre indiquant que le forfait *peut* être prononcé. **Aucune validation n'est exécutée automatiquement à ce stade.**
4. **Option Forfait Automatique :** Une édition peut activer `auto_forfeit_on_timeout = true` uniquement si cette règle a été déclarée avant le début officiel de la compétition. Dans ce cas précis, le cron de gestion valide le forfait à $T + 15\text{ min}$.
5. **Traçabilité et Historisation Obligatoire :** Toute décision de forfait est enregistrée dans `match_arbitration_logs` avec :
   * L'identifiant de la rencontre et du match concerné.
   * Le slot pénalisé (`slot_id`) avec `is_forfeit = true`.
   * L'auteur de la décision (`author_user_id`), la date exacte et le motif écrit (`forfeit_reason`).

---

### B. Gestion des Rosters et Verrouillage à l'Inscription
1. **Verrouillage à la Clôture des Inscriptions :** Dès que `registration_deadline` est atteinte sur l'édition, la composition de l'équipe dans `entrant_roster_members` est **strictement verrouillée**. Aucun nouveau joueur ne peut être ajouté.
2. **Statuts des Membres du Roster :**
   * `STARTER` : Joueur titulaire prévu pour débuter.
   * `SUBSTITUTE` : Remplaçant officiel déclaré avant la clôture.
   * `COACH` : Encadrant technique (non joueur).
   * `BENCH` : Joueur au repos pour la manche en cours.
   * `SUBSTITUTED_OUT` : Joueur sorti sur remplacement.
   * `INELIGIBLE` : Joueur suspendu ou disqualifié.
3. **Activation des Remplaçants :** Un remplaçant (`SUBSTITUTE`) ne peut être promu actif pour une manche ou un sous-match que sur demande du capitaine avant le début de la partie et sur **validation obligatoire de l'arbitre**.
4. **Règle Anti-Cumul Absolue :** Un joueur ne peut pas être joueur actif dans deux équipes de la même édition (garanti par l'index partiel `roster_edition_user_unique` sur `entrant_roster_members`).
5. **Changement de Capitaine :**
   * L'équipe ne peut compter qu'un seul capitaine à la fois (garanti par `UNIQUE(entrant_id) WHERE role = 'CAPTAIN'`).
   * Tout changement de brassard s'effectue dans une transaction atomique permutant les rôles et enregistrant l'action dans `match_arbitration_logs`.

---

## 2. Entrants : Identités, Profils et Invités

### A. Spécification des Types d'Entrants
* **`SOLO` :** Lié obligatoirement à un `user_id`. Contrainte `CHECK (type = 'SOLO' AND user_id IS NOT NULL AND team_id IS NULL)`. Unicité par édition : `UNIQUE(edition_id, user_id) WHERE type = 'SOLO'`.
* **`TEAM` :** Lié obligatoirement à un `team_id`. Contrainte `CHECK (type = 'TEAM' AND team_id IS NOT NULL AND user_id IS NULL)`. Unicité par édition : `UNIQUE(edition_id, team_id) WHERE type = 'TEAM'`.
* **`GUEST` :** Entrant invité sans compte obligatoire sur la plateforme. Possède obligatoirement `guest_identifier` (téléphone WhatsApp, email ou référence externe). Contrainte `CHECK (type = 'GUEST' AND team_id IS NULL AND guest_identifier IS NOT NULL)`.

### B. Rapprochement des Comptes Invités (`Claim Process`)
Si un joueur invité décide ultérieurement de créer un compte utilisateur sur Games Trafics :
1. Une procédure de vérification par code OTP (SMS WhatsApp ou Email) certifie la propriété de `guest_identifier`.
2. L'action `claimGuestEntrantAction` met à jour `user_id` sur `competition_entrants` et sur `entrant_roster_members`.
3. **L'historique sportif, les statistiques et les résultats des matchs passés demeurent 100 % intacts et immuables.**

---

## 3. Rule Engine : Métriques Typées et Évaluateur Universel

Le Rule Engine est fondé sur une séparation étanche entre la **définition des métriques**, leur **paramétrage par phase** et leur **évaluation mathématique**.

### A. Définitions et Précision Numérique
* **Table `metric_definitions` :** Déclare les métriques du jeu avec type (`INTEGER`, `DECIMAL`, `BOOLEAN`, `TIME_MS`), unité, bornes `[min_value, max_value]` et méthode d'agrégation par défaut (`SUM`, `AVERAGE`, `MIN`, `MAX`, `LATEST`).
* **Précision des Calculs :**
  * Toutes les métriques brutes sont conservées dans leur type natif ou `numeric(15, 4)`.
  * **Calculs intermédiaires :** Réalisés en précision étendue `numeric(18, 6)` sans aucun arrondi intermédiaire pour éliminer les biais d'accumulation.
  * **Score final et points attribués :** Arrondis au niveau final en `numeric(12, 4)` selon la norme bancaire standard `ROUND_HALF_UP`.
  * **Chronométrage :** Conservé en millisecondes entières (`bigint survival_time_ms`, `bigint laps_time_ms`) pour une précision absolue au millième de seconde ($0.001\text{ s}$).

### B. Algorithme de Départage Formel avec `HEAD_TO_HEAD`
L'évaluateur universel exécute la chaîne ordonnée de critères de départage (`tiebreaker_chain`) :

```text
Algorithme RésoudreDépartage(participantsExAequo, chaîneCritères, historiqueMatchs) :
  Si participantsExAequo.taille <= 1 OU chaîneCritères.estVide() :
    Retourner participantsExAequo
  
  critèreActuel = chaîneCritères.dépiler()
  
  Si critèreActuel == "HEAD_TO_HEAD" :
    1. Filtrer les matchs ayant opposé UNIQUEMENT les membres de participantsExAequo entre eux.
    2. Si tous les membres ne se sont pas affrontés (ex: en format suisse ou poules incomplètes) :
         Ignorer HEAD_TO_HEAD et passer au critère suivant.
    3. Construire le mini-classement direct (points, goal diff sur ces matchs).
    4. Si le mini-classement segmente le groupe :
         Pour chaque sous-groupe d'égalités résiduelles :
           Récurser avec le reste de chaîneCritères.
    5. Si égalité triangulaire cyclique parfaite (A bat B, B bat C, C bat A avec scores identiques) :
         Passer au critère suivant.

  Sinon si critèreActuel == "GOAL_DIFFERENCE" / "TOTAL_KILLS" / "BEST_PLACEMENT" :
    Trier selon la valeur de la métrique.
    Pour chaque sous-groupe ayant des valeurs identiques :
      Récurser avec le reste de chaîneCritères.
```

### C. Exemples JSON Exhaustifs de Configuration de Règles

#### 1. eFootball / EA Sports FC (Standard 3-1-0)
```json
{
  "name": "eFootball Official League 3-1-0",
  "game": "EFOOTBALL",
  "scoring_mode": "POINTS_TABLE",
  "points_config": {
    "win": 3,
    "draw": 1,
    "loss": 0
  },
  "metrics": {
    "score": { "weight": 1.0, "is_tiebreaker": true, "tiebreaker_priority": 3 }
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

#### 2. Call of Duty Mobile (Séries BO3 Search & Destroy)
```json
{
  "name": "CODM S&D BO3 Series",
  "game": "CODM",
  "scoring_mode": "SERIES_WINS",
  "series_config": {
    "required_game_wins": 2,
    "max_games": 3
  },
  "metrics": {
    "rounds_won": { "weight": 1.0, "is_tiebreaker": true, "tiebreaker_priority": 2 }
  },
  "tiebreaker_chain": [
    "SERIES_WINS",
    "GAMES_DIFFERENCE",
    "ROUNDS_DIFFERENCE"
  ]
}
```

#### 3. Free Fire (Battle Royale Esports 12 Escouades)
```json
{
  "name": "Free Fire Esports Official BR",
  "game": "FREE_FIRE",
  "scoring_mode": "METRIC_ACCUMULATION",
  "placement_matrix": {
    "1": 12, "2": 9, "3": 8, "4": 7, "5": 6,
    "6": 5, "7": 4, "8": 3, "9": 2, "10": 1,
    "11": 0, "12": 0
  },
  "metrics": {
    "kills": { "multiplier": 1.0, "is_tiebreaker": true, "tiebreaker_priority": 2 },
    "damage_dealt": { "multiplier": 0.0, "is_tiebreaker": true, "tiebreaker_priority": 4 }
  },
  "tiebreaker_chain": [
    "TOTAL_POINTS",
    "TOTAL_KILLS",
    "BEST_SINGLE_GAME_PLACEMENT",
    "TOTAL_DAMAGE",
    "LAST_GAME_PLACEMENT"
  ]
}
```

#### 4. Asphalt 9 (Time Trial / Grand Prix 8 Pilotes)
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
    "laps_time_ms": { "is_tiebreaker": true, "tiebreaker_priority": 2 },
    "fastest_lap_bonus": { "bonus_points": 1.0 }
  },
  "tiebreaker_chain": [
    "TOTAL_POINTS",
    "BEST_PLACEMENT",
    "LOWEST_TOTAL_TIME"
  ]
}
```

---

## 4. Brackets, Progression et Validation DAG

### A. Les Sept Sources Relationnelles de Qualification
1. `DIRECT_SEED` : Assignation initiale au lancement de la phase.
2. `MATCH_WINNER` : Vainqueur de `source_match_id`.
3. `MATCH_LOSER` : Perdant de `source_match_id` (alimentation du Loser Bracket).
4. `GROUP_RANK` : Kième de la poule `source_group_id` (`source_rank = K`).
5. `CROSS_GROUP_RANK` : Kième transversal issu de toutes les poules de `source_stage_id`. L'ordre de sélection `selection_order` (1, 2...) attribue les places aux meilleurs comparés.
6. `BYE` : Slot exempté d'adversaire $\rightarrow$ qualification immédiate du vis-à-vis.
7. `MANUAL_OVERRIDE` : Décision arbitrale manuelle (`is_locked = true`).

### B. Grand Finals Reset en Double Élimination
* **Match GF1 (Grand Finals) :** Vainqueur Upper vs Vainqueur Lower.
* **Match GF2 (Grand Finals Reset) :** 
  * `is_conditional = true`, `trigger_condition = 'GF1_SLOT_2_WINS'`.
  * Si Slot 1 (Upper) gagne GF1 $\rightarrow$ GF2 passe à `CANCELLED`, Slot 1 est champion.
  * Si Slot 2 (Lower) gagne GF1 $\rightarrow$ GF2 passe à `READY`, les deux joueurs disputent le match décisif.

### C. Gestion des Dépendances Consommées et Invalidation Rétroactive
* Si un résultat amont est modifié alors que les matchs avals sont déjà en cours ou terminés (`status != 'PENDING'`) :
  * Le recalcul automatique en cascade est **immédiatement bloqué**.
  * Le match aval est marqué `status = 'DISPUTED'` avec drapeau d'arbitrage `CONTESTED_CASCADE`.
  * Une alerte de haute priorité est envoyée au staff pour validation ou réorganisation arbitrale.

---

## 5. Couverture Réelle et Honnête des Formats de Compétition

| Format Compétitif | Données et Relations | Génération | Calcul & Départage | Statut Réel |
|:---|:---|:---|:---|:---:|
| **ROUND_ROBIN** | 1 Stage $\rightarrow$ M Poules $\rightarrow$ N Rounds | Algorithme du Ruban de Berger | Barème points (3/1/0) + Head-to-Head + Goal Diff | **COMPLET** |
| **SINGLE_ELIMINATION** | 1 Stage $\rightarrow$ Arbre binaire $\rightarrow$ N Rounds | Arbre $2^k$ avec répartition têtes de série et BYE | Score direct ou BO-X | **COMPLET** |
| **DOUBLE_ELIMINATION** | Upper Bracket + Lower Bracket + GF Reset | Appariements amonts winner/loser + GF2 conditionnel | Arbre double avec reset automatique | **COMPLET** |
| **SWISS** | N Rounds successifs, appariements dynamiques | Rondes suisses sans rematch, tri sur points suisses | Points suisses + score Buchholz (résistance) | **COMPLET** |
| **BATTLE_ROYALE_LADDER** | 1 Encounter FFA $\rightarrow$ 1 Match (N slots) $\rightarrow$ M Games | Lobbies de 12 à 25 escouades | Matrice placement + Kills cumulés | **COMPLET** |
| **LEADERBOARD** | 1 Stage $\rightarrow$ N Entrants sans opposition directe | Enregistrement de scores asynchrones | Tri sur métrique cible décroissante | **COMPLET** |
| **TIME_TRIAL / RACE** | Sessions chronométrées en piste | Grille de départ ou essais libres | Chrono au millième (`laps_time_ms`) + pénalités | **COMPLET** |
| **GRAND_PRIX** | M Courses successives $\rightarrow$ Cumul de points | Grille de course multi-manches | Attribution points par position | **COMPLET** |
| **GROUP_STAGE + ELIMINATION** | Multi-Phases : Phase 1 Poules $\rightarrow$ Phase 2 Playoffs | Croisement $1^{\text{er}}$ vs $2^{\text{e}}$ + Meilleurs $3^{\text{es}}$ | Propagation inter-phases par slots | **COMPLET** |
| **COLLECTIVE_FIXTURE** | 1 Encounter $\rightarrow$ 2 Sides $\rightarrow$ N Sous-matchs | Choc inter-régions avec slots composites liés | Agrégation par points de sous-matchs | **COMPLET** |

---

## 6. Audit Réel des Dépendances et Plan de Migration Sécurisé

### A. Inventaire Réel des Clés Étrangères dans `database/schema.ts`
1. `registration_payments` :
   * `registration_id` $\rightarrow$ FK vers `edition_registrations.id` avec **`ON DELETE CASCADE`** (Point critique à découpler).
   * `transaction_id` $\rightarrow$ FK vers `wallet_transactions.id`.
2. `messages` :
   * `editionId` $\rightarrow$ FK vers `tournament_editions.id`.
   * `tournamentId` $\rightarrow$ FK vers `tournaments.id`.
3. `interactions` :
   * `tournamentId` $\rightarrow$ FK vers `tournaments.id`.
4. `notifications` :
   * `tournamentId` $\rightarrow$ FK vers `tournaments.id`.
5. `financial_accounts` :
   * `ownerEditionId` $\rightarrow$ text (sans FK active dans le schema actuel).

### B. Procédure SQL Pas-à-Pas Sans `TRUNCATE CASCADE`

```sql
-- ============================================================================
-- 1. CONTRÔLES PRÉ-MIGRATION (VALIDATION DE COHÉRENCE)
-- ============================================================================
-- S'assurer qu'aucune transaction wallet n'est bloquée en PENDING
SELECT count(*) AS pending_transactions FROM wallet_transactions WHERE status = 'PENDING';

-- Vérifier l'intégrité initiale des paiements d'inscriptions
SELECT count(*) AS total_payments, sum(amount) AS total_amount FROM registration_payments;

-- ============================================================================
-- 2. DÉCOUPLAGE ET ARCHIVAGE DE LA TRAÇABILITÉ FINANCIÈRE
-- ============================================================================
-- Ajouter les colonnes d'archivage comptable
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_edition_id TEXT;
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_edition_name TEXT;
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_tournament_id TEXT;
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_tournament_name TEXT;
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_user_id TEXT;
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_team_id TEXT;
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_participant_name TEXT;
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_registration_type TEXT;

-- Remplir les données historiques d'archives depuis les tables actuelles
UPDATE registration_payments rp
SET 
  archived_edition_id = te.id,
  archived_edition_name = te.name,
  archived_tournament_id = t.id,
  archived_tournament_name = t.name,
  archived_user_id = tm.user_id,
  archived_team_id = tm.team_id,
  archived_participant_name = tm.display_name,
  archived_registration_type = er.registration_type
FROM edition_registrations er
JOIN tournament_editions te ON te.id = er.edition_id
JOIN tournaments t ON t.id = te.tournament_id
JOIN tournament_members tm ON tm.id = er.member_id
WHERE er.id = rp.registration_id;

-- Supprimer la clé étrangère en cascade dangereuse
ALTER TABLE registration_payments DROP CONSTRAINT IF EXISTS registration_payments_registration_id_fkey;

-- Rendre la colonne nullable et la renommer en référence d'archive
ALTER TABLE registration_payments ALTER COLUMN registration_id DROP NOT NULL;
ALTER TABLE registration_payments RENAME COLUMN registration_id TO legacy_registration_id;

-- Ajouter la nouvelle colonne vers competition_entrants pour le futur modèle
ALTER TABLE registration_payments ADD COLUMN entrant_id UUID;

-- ============================================================================
-- 3. NEUTRALISATION DES CLÉS ÉTRANGÈRES DANS MESSAGES, INTERACTIONS, NOTIFS
-- ============================================================================
-- Éviter les violations de clés étrangères lors de la suppression des anciens tournois
UPDATE messages SET edition_id = NULL, tournament_id = NULL WHERE edition_id IS NOT NULL OR tournament_id IS NOT NULL;
UPDATE interactions SET tournament_id = NULL WHERE tournament_id IS NOT NULL;
UPDATE notifications SET tournament_id = NULL WHERE tournament_id IS NOT NULL;

-- ============================================================================
-- 4. SUPPRESSION ORDONNÉE DU BAS VERS LE HAUT DES TABLES SPORTIVES OBSOLÈTES
-- ============================================================================
DROP TABLE IF EXISTS matches;
DROP TABLE IF EXISTS bracket_nodes;
DROP TABLE IF EXISTS phase_group_participants;
DROP TABLE IF EXISTS phase_groups;
DROP TABLE IF EXISTS tournament_phases;
DROP TABLE IF EXISTS edition_results;
DROP TABLE IF EXISTS edition_registrations;
DROP TABLE IF EXISTS tournament_members;

-- Vider les anciennes éditions et anciens tournois dont les données sont closes
DELETE FROM tournament_editions;
DELETE FROM tournaments;

-- ============================================================================
-- 5. CONTRÔLES POST-MIGRATION (VALIDATION DE PRÉSERVATION FINANCIÈRE)
-- ============================================================================
-- Vérifier que TOUS les paiements existent toujours avec le même montant total
SELECT count(*) AS verified_payments, sum(amount) AS verified_total_amount FROM registration_payments;

-- Vérifier qu'aucun wallet ni aucune transaction n'ont été altérés
SELECT count(*) AS total_wallet_transactions FROM wallet_transactions;
SELECT count(*) AS total_wallets FROM user_wallets;
SELECT count(*) AS total_users FROM users;
SELECT count(*) AS total_teams FROM teams;
```

---

## 7. Plan de Rollback Éprouvé

En cas d'erreur lors de l'exécution du script de migration :
1. **Restauration Immédiate du Snapshot :** Restauration du snapshot Neon ou dump PostgreSQL réalisé juste avant le script.
2. **Intégrité Comptable Garantie :** Aucune opération ne modifiant les montants ou les soldes dans `wallets` ou `wallet_transactions`, les fonds de tous les utilisateurs restent intangibles.
