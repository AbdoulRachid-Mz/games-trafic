# Document 08 — Décisions Architecturales Détaillées et Réponses aux Exigences Métier

Ce document présente les arbitrages et spécifications techniques détaillées répondant aux exigences et clarifications soulevées lors de la revue d'audit.

---

## 1. Décision sur la Purge des Données et Préservation Financière

### Contexte et Décision Validée
Puisque toutes les anciennes compétitions sont achevées et qu'aucun tournoi n'est en cours, **le Scénario C (Clean Slate Universel)** est officiellement retenu. 

Toutes les anciennes tables de compétition (`matches`, `bracket_nodes`, `phase_group_participants`, `phase_groups`, `tournament_phases`, `edition_results`, `tournament_members`, `edition_registrations`, etc.) seront supprimées pour repartir sur une base de code 100 % saine.

### Mécanisme de Protection Absolue de la Traçabilité Financière
Pour que la suppression en cascade de `edition_registrations` ne détruise pas les pièces justificatives des débits de wallets :
1. **Étape 1 :** Découplage de la clé étrangère :
   ```sql
   ALTER TABLE registration_payments DROP CONSTRAINT registration_payments_registration_id_fkey;
   ALTER TABLE registration_payments RENAME COLUMN registration_id TO legacy_registration_id;
   ```
2. **Étape 2 :** Enrichissement de `registration_payments` pour figer le contexte comptable :
   ```sql
   ALTER TABLE registration_payments ADD COLUMN archived_edition_name TEXT;
   UPDATE registration_payments rp
   SET archived_edition_name = te.name
   FROM edition_registrations er
   JOIN tournament_editions te ON te.id = er.edition_id
   WHERE er.id = rp.legacy_registration_id;
   ```
3. **Résultat :** Toutes les tables financières (`wallet_transactions`, `wallets`, `user_wallets`, `financial_accounts`, `registration_payments`) restent intactes, cohérentes et auditables.

---

## 2. Modèle Détaillé des Participants, Rosters, Staff et Clubs en Jeu

### A. Matrice des Responsabilités par Entité

| Entité | Nature | Rôle & Responsabilité | Clés et Relations |
|:---|:---|:---|:---|
| **`users`** | Compte Utilisateur Global | L'identité numérique de la personne physique (connexion, wallet, réputation). | Indépendant de tout tournoi. |
| **`teams`** | Organisation / Club Pérenne | L'écurie ou le club d'esports (ex. *FC Douane*, *Team Vitality*). | Propriété d'un créateur/capitaine. |
| **`team_members`** | Adhésion Globale | Historique de contrat d'un joueur dans une équipe sur la plateforme. | Lie `teams` et `users`. |
| **`tournament_staff`** | Encadrement & Arbitrage | Les administrateurs, arbitres, casters ou observateurs du tournoi. | Lie `tournaments` / `editions` et `users`. **Totalement séparé des compétiteurs !** |
| **`competition_entrants`** | Entité Compétitive Unique | **Le participant officiel de l'édition.** C'est lui qui concourt, reçoit un seed et un classement. | FK vers `edition_id`. Optionnellement vers `user_id` (solo) ou `team_id` (équipe). |
| **`entrant_roster_members`** | Roster Figé de l'Édition | La composition exacte des joueurs inscrits pour cette édition. | FK vers `entrant_id`. Permet d'intégrer des joueurs invités sans compte (`user_id = null`). |
| **`in_game_club`** | Attribut Cosmétique de Jeu | Le club sélectionné dans le jeu (ex. *Real Madrid*, *FC Barcelone*). | Simple champ texte/métadonnée sur l'entrant, **distinct de l'équipe réelle**. |

### B. Précisions Importantes
1. **Les joueurs d'une équipe ne deviennent pas des participants autonomes :** Si *FC Douane* s'inscrit à un tournoi par équipes, il n'existe qu'un seul `competition_entrant` portant le nom "FC Douane". Ses 5 joueurs sont enregistrés dans `entrant_roster_members`.
2. **Dissociation du club in-game :** Dans un tournoi FIFA où le joueur Moussa joue avec le Real Madrid, son entrant est Moussa (`user_id`), son équipe réelle est son club local s'il en a un, et son `in_game_club` est "Real Madrid".

---

## 3. Modélisation Relationnelle des Confrontations Collectives

### A. Problématique et Comparaison des Approches
Nous devons représenter des rencontres opposant deux camps (ex. **Région Dakar contre Région Thiès** ou **Clan Alpha vs Clan Beta**), où chaque camp aligne plusieurs compétiteurs disputant une série de matchs individuels ou duos, le tout agrégé en un score final pour la région/le clan.

* **Approche 1 — Matchs individuels avec métadonnées partagées (Rejetée) :** Créer des matchs indépendants avec un simple tag `"inter-region: dakar-thies"`.  
  * *Défaut :* Pas de conteneur parent, pas d'horaire commun, pas d'état global de la confrontation, agrégation fragile.
* **Approche 2 — Rencontre Parent Hiérarchique avec Sides (Retenue) :** Une entité parent (`competition_encounters` de type `COLLECTIVE_FIXTURE`) encadrant deux côtés (`encounter_sides`), chacun regroupant ses entrants, et contenant une collection de sous-matchs ordonnés (`encounter_matches`).

### B. Schéma Relationnel Retenu

```text
[competition_encounters] (Type: COLLECTIVE_FIXTURE, Aggregation: MATCH_POINTS)
   │
   ├──► [encounter_sides] (Côté 1: "Région Dakar")  ──► [encounter_side_entrants] (5 joueurs de Dakar)
   ├──► [encounter_sides] (Côté 2: "Région Thiès")  ──► [encounter_side_entrants] (5 joueurs de Thiès)
   │
   └──► [encounter_matches] (Sous-matchs de la confrontation)
           ├── Match 1 : Dakar 1 vs Thiès 1 (1 pt)  ──> Match Games (BO1)
           ├── Match 2 : Dakar 2 vs Thiès 2 (1 pt)  ──> Match Games (BO1)
           ├── Match 3 : Dakar 3 vs Thiès 3 (1 pt)  ──> Match Games (BO1)
           ├── Match 4 : Dakar 4 vs Thiès 4 (1 pt)  ──> Match Games (BO1)
           └── Match 5 : Dakar 5 vs Thiès 5 (1 pt)  ──> Match Games (BO1)
```

### C. Règles d'Agrégation Configurables
L'organisateur choisit la formule d'arbitrage de la confrontation :
1. **`MATCH_POINTS` :** Chaque sous-match gagné rapporte 1 point au camp. Le premier camp à 3 victoires (sur 5 matchs) l'emporte.
2. **`SCORE_SUM` :** Tous les buts ou points marqués dans les sous-matchs sont additionnés (ex. Dakar gagne 14 à 11 au cumul des scores).
3. **`DECIDER_MATCH` :** En cas d'égalité (ex. 2-2 sur 4 matchs), un 5e match décisif (Ace Match) détermine le camp vainqueur.

---

## 4. Brackets, Slots Relationnels et Graphe de Progression (DAG)

### A. Pourquoi Bannir le JSON `slot_origin` ?
Dans l'architecture précédente, les dépendances de qualification étaient consignées dans des chaînes de caractères de placeholders (`"QUALIFIER_1"`) ou dans un objet JSON. 
Cette approche empêchait toute requête relationnelle, rendait difficile le calcul du chemin critique d'un participant et ne permettait pas de garantir l'absence de cycles.

### B. Table `match_slots` : La Progression Normalisée

Chaque match possède N emplacements (généralement 2 en duel) représentés par des lignes dans `match_slots` :

```sql
CREATE TABLE match_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES encounter_matches(id) ON DELETE CASCADE,
    slot_position INT NOT NULL, -- 1 pour haut/domicile, 2 pour bas/extérieur
    assigned_entrant_id UUID REFERENCES competition_entrants(id) ON DELETE SET NULL,
    
    -- Source relationnelle stricte
    source_type TEXT NOT NULL, 
    -- Valeurs: 'DIRECT_SEED', 'MATCH_WINNER', 'MATCH_LOSER', 'GROUP_RANK', 'BYE', 'MANUAL_OVERRIDE'
    source_match_id UUID REFERENCES encounter_matches(id) ON DELETE SET NULL,
    source_group_id UUID REFERENCES competition_groups(id) ON DELETE SET NULL,
    source_rank INT, -- ex: 1 pour 1er de poule, 2 pour 2e
    
    is_locked BOOLEAN DEFAULT FALSE, -- Dérogation manuelle de l'arbitre
    score INT DEFAULT 0,
    is_winner BOOLEAN DEFAULT FALSE
);
```

### C. Gestion de la Double Élimination et du Bracket Reset
* **Upper Bracket (Winner) :**
  * Demi-finale Upper 1 (Match U1) -> Vainqueur va au Slot 1 de la Finale Upper (Match U3, `source_type: MATCH_WINNER, source_match_id: U1`).
  * Perdant tombe dans le Loser Bracket (Match L1, `source_type: MATCH_LOSER, source_match_id: U1`).
* **Lower Bracket (Loser) :**
  * Les vainqueurs progressent dans le Loser Bracket. Une seconde défaite entraîne l'élimination définitive.
* **Grand Finals et Bracket Reset :**
  * **Grand Finals (Match GF1) :** Slot 1 = Vainqueur Upper Bracket (`MATCH_WINNER`), Slot 2 = Vainqueur Lower Bracket (`MATCH_WINNER`).
  * **Grand Finals Reset (Match GF2, conditionnel) :** Si le Slot 2 (venant du Lower) bat le Slot 1 lors de GF1, le système active automatiquement le match GF2 pour le titre suprême.

### D. Prévention des Cycles (Validation DAG)
Avant de persister la structure d'un tournoi, un algorithme de détection de cycles parcourt le graphe orienté des dépendances (`source_match_id`). Si un chemin mène un match à dépendre directement ou indirectement de son propre résultat, la génération est immédiatement rejetée avec une erreur explicite.

---

## 5. Moteur de Règles Déclaratif (Universal Rule Engine)

Plutôt que d'obliger un développeur à coder une classe TypeScript par jeu, la plateforme propose un **moteur universel piloté par les données (Data-Driven Rule Engine)**.

### A. Découpage en 4 Couches Indépendantes

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. DONNÉES BRUTES (Raw Match Data)                                          │
│    • Scores numériques, Kills, Placement/Rang de survie, Chronomètres.      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. CONFIGURATION DÉCLARATIVE EN BASE (Rule Presets / competition_rulesets)  │
│    • Barème Victoire/Nul/Défaite OU Matrice de points de placement.         │
│    • Multiplicateurs de frags (ex: 1 kill = 1 pt).                          │
│    • Chaîne de départage ordonnée (tiebreaker_chain).                       │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. ÉVALUATEUR UNIVERSEL UNIQUE (TypeScript Rule Evaluator)                  │
│    • Calcule : Points = (Win/Draw/Loss Points) + (Placement Pts) + (Kills * Multiplicateur). │
│    • Résout les égalités en exécutant la chaîne de départage déclarée.      │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. RÉSULTATS CALCULÉS (Standings & Qualifications)                          │
│    • Positions, Qualifiés, Éliminés, Différences de score.                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### B. Exemple de Configuration Déclarative en Base de Données

#### Cas 1 : Football / Sport (FIFA, eFootball)
```json
{
  "mode": "STANDARD_SPORTS",
  "points_for_win": 3,
  "points_for_draw": 1,
  "points_for_loss": 0,
  "tiebreaker_chain": ["POINTS", "HEAD_TO_HEAD", "GOAL_DIFF", "GOALS_FOR"]
}
```

#### Cas 2 : Battle Royale Esports (Free Fire, PUBG Mobile)
```json
{
  "mode": "METRIC_ACCUMULATION",
  "placement_points_table": {
    "1": 12, "2": 9, "3": 8, "4": 7, "5": 6,
    "6": 5, "7": 4, "8": 3, "9": 2, "10": 1
  },
  "metrics": {
    "kills": { "multiplier": 1.0 }
  },
  "tiebreaker_chain": ["TOTAL_POINTS", "TOTAL_KILLS", "BEST_PLACEMENT", "LAST_GAME_PLACEMENT"]
}
```

#### Cas 3 : Combat / FPS en Séries (Street Fighter, COD Mobile BO3)
```json
{
  "mode": "SERIES_WINS",
  "required_game_wins": 2,
  "tiebreaker_chain": ["SERIES_WINS", "GAMES_DIFF"]
}
```

L'organisateur dispose d'un assistant dans son dashboard avec des pré-configurations (presets) et peut ajuster chaque valeur sans aucune intervention de l'équipe technique.

---

## 6. Formalisation des Relations Structurelles

Pour lever toute ambiguïté sur le vocabulaire et la hiérarchie :

| Concept | Définition & Rôle | Cardinalité & Relations |
|:---|:---|:---|
| **Phase / Stage** | Grande étape logique de la compétition (ex. *Phase 1 : Poules*, *Phase 2 : Finales*). | Une édition possède 1 à N phases ordonnées (`order: 1, 2...`). |
| **Poule / Group** | Conteneur de classement dans lequel les participants sont comparés. | Une phase contient 1 à M poules (ex. Poule A, Poule B). |
| **Round / Journée** | Unité temporelle de calendrier (ex. *Journée 1*, *Quarts de finale*, *Session 1*). | Une phase planifie 1 à K rounds. **Un round n'est pas une poule !** |
| **Rencontre / Encounter** | La confrontation globale programmée entre adversaires (Duel, Collectif ou Lobby). | Rattachée à une phase, éventuellement à une poule et à un round. |
| **Manche / Game** | La partie ou carte élémentaire jouée au sein d'une rencontre (Carte 1, Carte 2...). | Une rencontre contient 1 à X manches. |

---

## 7. Rectification des Imprécisions de l'Audit Initial

1. **`HEAD_TO_HEAD` dans `standings.engine.ts` :** L'affirmation de l'audit précédent a été rectifiée. L'algorithme actuel `rankParticipants()` ne prend pas en compte la confrontation directe. Le nouveau Rule Engine intégrera un calcul formel de sous-graphe des participants à égalité pour résoudre le `HEAD_TO_HEAD` de manière mathématiquement irréprochable.
2. **Couche de compatibilité :** La proposition initiale de maintenir un adaptateur pour les anciens tournois est abandonnée au profit du Scénario Clean Slate, simplifiant drastiquement l'architecture et éliminant tout code mort.
