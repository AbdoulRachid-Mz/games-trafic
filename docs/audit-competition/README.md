# Audit Approfondi du Système de Compétition de Games Trafics
## Benchmark International, Analyse Critique et Proposition d'Architecture Cible

*Auteurs : Antigravity & Équipe d'Ingénierie Games Trafics*  
*Date de publication : Novembre 2026*  
*Statut du document : Proposition Architecturale et Étude Complète (Lecture Seule — Zéro modification de code en production)*

---

## 1. Résumé Exécutif (Executive Summary)

Games Trafics dispose aujourd'hui d'une fondation solide et différenciante : un moteur financier rigoureux avec ledger double-entrée, un rendu visuel 3D et des arbres symétriques pour les playoffs de grande qualité, ainsi qu'un système de notification multicanal complet (WhatsApp Cloud API, Push VAPID, Email).

Cependant, l'audit approfondi du code et du schéma de base de données révèle que le moteur de tournoi actuel a été initialement conçu autour d'un **paradigme restreint de duel binaire 1v1 footballistique**. Ce parti-pris technique initial constitue aujourd'hui un **plafond de verre architectural** qui empêche Games Trafics d'exploiter les scènes esports les plus dynamiques du continent et du monde :
* **Les Battle Royale (PUBG Mobile, Free Fire, Warzone Mobile)** sont impossibles à héberger car la table `matches` impose strictement deux colonnes : `participant1RegistrationId` et `participant2RegistrationId`.
* **Les tournois par équipes avec manches (Best-of-3 / Best-of-5 sur COD Mobile, Valorant)** sont dégradés car les sous-manches (cartes) n'existent pas en tant qu'entités de base de données relationnelles.
* **Les compositions d'équipes (rosters)** ne sont pas figées par édition, créant un risque de distorsion rétroactive des historiques.

L'étude comparative des leaders mondiaux (**Toornament**, **Start.gg**, **Challonge**, **FACEIT**) met en évidence des invariants architecturaux éprouvés à l'échelle internationale. 

Nous préconisons d'adopter une **Refonte Modulaire Progressive avec Couche de Compatibilité (Scénario B)**. Cette approche introduit les entités cibles normalisées (`competition_entrants`, `entrant_members`, `competition_encounters`, `encounter_opponents`, `encounter_games`) tout en maintenant un adaptateur pour garantir la continuité totale et sans régression des tournois en cours.

---

## 2. Table des Matières du Dossier d'Audit

Le dossier complet comprend 7 documents d'ingénierie détaillés :

| N° | Fichier | Description |
|:---|:---|:---|
| **01** | [`01-CONTEXT-AND-PROBLEM.md`](./01-CONTEXT-AND-PROBLEM.md) | Contexte métier de Games Trafics, vision du moteur universel et formulation des verrous actuels. |
| **02** | [`02-COMPETITOR-RESEARCH.md`](./02-COMPETITOR-RESEARCH.md) | Benchmark approfondi de Toornament, Challonge, Start.gg, FACEIT et Battlefy avec extraction des 6 invariants mondiaux. |
| **03** | [`03-CURRENT-GAMES-TRAFICS-AUDIT.md`](./03-CURRENT-GAMES-TRAFICS-AUDIT.md) | Audit chirurgical du schéma Drizzle, des moteurs `lib/tournaments/` et des Server Actions, avec forces et limites. |
| **04** | [`04-ARCHITECTURE-COMPARISON.md`](./04-ARCHITECTURE-COMPARISON.md) | Tableaux comparatifs systématiques, matrice de maturité et analyse des écarts critiques (Gap Analysis). |
| **05** | [`05-PROPOSED-TARGET-ARCHITECTURE.md`](./05-PROPOSED-TARGET-ARCHITECTURE.md) | Modèle relationnel cible (Mermaid ERD), spécification des entités, diagrammes de flux et support des disciplines. |
| **06** | [`06-ARCHITECTURE-SCENARIOS.md`](./06-ARCHITECTURE-SCENARIOS.md) | Analyse comparative de 3 scénarios (Patching vs Modulaire vs Big Bang) et justification du choix retenu. |
| **07** | [`07-IMPLEMENTATION-ROADMAP.md`](./07-IMPLEMENTATION-ROADMAP.md) | Feuille de route opérationnelle en 5 phases étalées sur 6 semaines, avec stratégie de tests et gestion des risques. |

---

## 3. Réponses Synthétiques aux 10 Questions Fondamentales de la Mission

### Question 1 : Quelles sont les forces et les faiblesses du modèle actuel de Games Trafics ?
* **Forces :** Isolation financière étanche (liée au wallet GTC), recalcul dynamique des classements depuis les matchs (`syncStandingsWithMatches`) éliminant les corruptions d'état, générateur visuel d'arbres symétriques de playoffs de qualité supérieure, notifications multicanales intégrées.
* **Faiblesses :** Structure de match figée à 2 participants (`participant1` vs `participant2`), absence de table pour les manches élémentaires (cartes d'un Best-of), surcharge de `phase_groups` pour stocker les journées de championnat, absence de roster d'équipe figé par édition, barème et vocabulaire implicitement footballistiques (`score_for`, `score_against`).

### Question 2 : Comment les plateformes professionnelles résolvent-elles ces défis ?
* **Toornament :** Découple le match en `duel` (2 adversaires) ou `ffa` (N adversaires) via une collection `opponents`, et décompose tout match en une collection de `games` (manches).
* **Start.gg :** Établit la distinction majeure entre `Participant` (l'être humain avec son compte) et `Entrant` (l'entité en compétition, solo ou collective, détenant le seed et le rang).
* **Challonge :** Utilise un graphe d'arbre de brackets prédictible où chaque nœud est résolu mathématiquement.
* **FACEIT :** Isole les compositions d'équipes (`roster`) avec rôles stricts (capitaine, remplaçants) verrouillés au lancement de la compétition.

### Question 3 : Quels concepts manquent actuellement dans Games Trafics ?
1. L'entité **Entrant** (détachée de l'utilisateur ou de l'équipe générale).
2. L'entité **Roster d'Édition** (composition instanciée et immuable pour un tournoi).
3. L'entité **Opponent (Siège/Adversaire)** permettant de représenter un match à N participants ($N \ge 2$).
4. L'entité **Game / Manche** (carte élémentaire d'un match BO3 ou manche de Battle Royale).
5. La distinction structurelle claire entre **Poule (Group)** et **Journée (Round)**.

### Question 4 : Comment modéliser proprement un participant (solo vs équipe vs roster vs invité) ?
Via deux entités complémentaires :
* `competition_entrants` : L'inscrit officiel (possède le nom de compétition, le logo, le seed, le statut de check-in et le lien vers le paiement).
* `entrant_members` : Les personnes physiques composant l'entrant pour cette édition. Pour un joueur solo, une seule ligne. Pour une équipe, la liste des titulaires et remplaçants. Si un participant est un invité sans compte, son `user_id` est `null` et ses coordonnées sont stockées localement sans polluer la table globale des utilisateurs.

### Question 5 : Comment découpler une confrontation (série) de ses manches individuelles ?
En séparant :
* `competition_encounters` : La rencontre globale (ex. *"Quart de finale A vs B en Best-of-3"* ou *"Session BR 4 Manches"*). Gère le statut global, l'horaire, le vainqueur final et les points totaux.
* `encounter_games` : Chaque manche spécifique (Carte 1, Carte 2...). Gère la carte jouée, le screenshot de preuve et les statistiques détaillées (kills, scores par round).

### Question 6 : Comment gérer les matchs à plus de 2 participants (Battle Royale, Racing, FFA) ?
En remplaçant les colonnes `participant1RegistrationId` et `participant2RegistrationId` par une table pivot relationnelle `encounter_opponents` liée à l'encounter :
* Dans un duel 1v1 : 2 lignes `encounter_opponents` (position 1 et 2).
* Dans une manche de Battle Royale : 16 à 25 lignes `encounter_opponents` (une par escouade), chacune recevant un `final_score`, un `placement` et un nombre de `kills`.

### Question 7 : Comment rendre le moteur de scoring universel et paramétrable ?
En appliquant le patron de conception **Strategy** (`BaseScoringStrategy`) :
* `SportsScoringStrategy` : 3 pts / 1 pt / 0 pt, départage par Goal Difference et confrontation directe.
* `VersusSeriesScoringStrategy` : Victoire au premier à X manches gagnées (BO3 = 2 victoires).
* `BattleRoyaleScoringStrategy` : Matrice de points selon le rang de survie (Top 1 = 12 pts, Top 2 = 9 pts...) + barème par élimination (1 kill = 1 pt).
* `RacingScoringStrategy` : Points décroissants selon la position chronométrée.

### Question 8 : Quel est le modèle de données cible recommandé pour Games Trafics ?
Le modèle cible comprend 8 entités clés reliées entre elles :
`tournaments` -> `tournament_editions` -> `competition_stages` -> `competition_groups` / `competition_rounds` -> `competition_encounters` -> `encounter_opponents` (N) -> `encounter_games` -> `game_participant_scores`.
Voir le schéma Mermaid complet dans [`05-PROPOSED-TARGET-ARCHITECTURE.md`](./05-PROPOSED-TARGET-ARCHITECTURE.md).

### Question 9 : Quel scénario d'évolution retenir parmi les 3 envisageables ?
Le **Scénario B (Refonte Modulaire Progressive avec Couche de Compatibilité)** est formellement recommandé. Il offre le niveau de qualité et d'universalité de Toornament et Start.gg, tout en garantissant un risque nul de régression sur les tournois existants grâce à un adaptateur d'API.

### Question 10 : Quelle est la feuille de route opérationnelle pour migrer sans casser l'existant ?
Un plan de déploiement en 5 phases sur 6 semaines :
* **Semaine 1 (Phase 0) :** Nouvelles tables et types universels Drizzle (migrations additives sans suppression).
* **Semaine 2 (Phase 1) :** Moteur de scoring enfichable et tests unitaires sur tous les barèmes.
* **Semaine 3 (Phase 2) :** Entrants et rosters figés par édition, gestion propre des invités.
* **Semaine 4 (Phase 3) :** Moteur d'encounters universel et support des lobbies FFA / Battle Royale.
* **Semaine 5 (Phase 4) :** Interfaces de saisie de résultats adaptées (score par carte et tableau de saisie BR).
* **Semaine 6 (Phase 5) :** Recette complète sur staging, bascule via Feature Flag et documentation.
