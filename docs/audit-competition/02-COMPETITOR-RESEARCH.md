# Document 02 — Analyse Comparative des Plateformes Professionnelles

Ce document présente une étude approfondie des leaders mondiaux de l'organisation de compétitions esports et jeux vidéo : **Toornament**, **Challonge**, **Start.gg**, **FACEIT** et **Battlefy**. L'objectif est d'extraire les invariants conceptuels et les modèles de données éprouvés à l'échelle internationale.

---

## 1. Toornament (L'étalon d'or de l'organisation esports)

*Documentation de référence : Toornament Developer API v2 (`developer.toornament.com`)*

Toornament est la plateforme la plus modulaire et la plus complète du marché. Son architecture a été conçue dès l'origine pour découpler le moteur de règles de l'interface graphique.

### A. Modèle de Données et Hiérarchie

```text
[Project / Circuit] (Optionnel: circuits majeurs, saisons)
   └── [Tournament] (Discipline, règles générales, fuseau horaire, inscription)
         └── [Stages] (Étapes successives : Poules, Swiss, Playoffs...)
               └── [Groups / Brackets / Pools] (Conteneurs de répartition)
                     └── [Rounds] (Tours, journées de championnat)
                           └── [Matches] (Confrontations entre adversaires)
                                 └── [Games] (Manches / cartes individuelles)
```

### B. Gestion des Participants (Player vs Team vs Lineup)
* **Entité `Participant` :** C'est l'unité de compétition inscrite dans le tournoi.
  * Pour une discipline solo (1v1) : le participant représente le joueur.
  * Pour une discipline collective (ex. 5v5) : le participant est **l'Équipe** en tant que personne morale de compétition.
* **Lineup (Roster) :** Pour les équipes, Toornament associe une liste de membres (`lineup`) avec des rôles précis : titulaires (`players`), remplaçants (`substitutes`), coach/capitaine (`coach`). Ce roster est **instancié et figé pour le tournoi** ; si l'équipe change de joueurs sur son profil général, la composition inscrite au tournoi reste historisée.
* **Custom Fields :** Champs libres configurables par tournoi (ex. PSN ID, Riot ID, Tag Discord, Rang de compte, Pays).
* **Statut de participation :** Cycle de vie strict : `pending` -> `validated` / `refused` -> `checked_in` -> `active` / `disqualified`.

### C. Modèle de Match : Duel vs FFA
Toornament résout le problème des formats via une typologie fondamentale au niveau du match :
1. **Type `duel` :** Exactement deux adversaires (`opponents: [OpponentA, OpponentB]`).
   * Chaque `Opponent` possède : `id`, `participant_id`, `score`, `result` (`win`, `loss`, `draw`), `forfeit`.
2. **Type `ffa` (Free-For-All) :** N adversaires (`opponents: [Opponent1, Opponent2, ..., OpponentN]`).
   * Utilisé pour les Battle Royale, jeux de course, poker.
   * Chaque opposant dispose d'un `rank` (position finale dans la manche), de points (`score`) et de métadonnées de performance (kills, temps, dégâts).

### D. Hiérarchie Match -> Games (Manches / Maps)
Un `Match` représente la série globale (ex. Best-of-3). Il contient une collection de `Games` :
* `Match.games` : `[Game 1, Game 2, Game 3]`
* Chaque `Game` possède son propre statut, son ordre, la carte jouée (`map: "Hardpoint - Standoff"`), les scores spécifiques de la manche et les captures de preuve.

---

## 2. Challonge (L'archétype du bracket et de la simplicité)

*Documentation de référence : Challonge API v2.1 (REST JSON:API Specification)*

Challonge est historiquement la référence des brackets en ligne (tournois locaux, bars gaming, ligues amateurs).

### A. Principes Architecturaux
* Conforme à la norme **JSON:API v2.1**, très prédictible et relationnel.
* Le tournoi est modélisé autour d'un algorithme mathématique strict de graphe d'arbre binaire pour les brackets.

### B. Modèle de Données
* **Tournament :** Définit le `tournament_type` (`single elimination`, `double elimination`, `round robin`, `swiss`).
* **Participant :** Représente l'inscrit (`name`, `seed`, `misc`, `active`, `final_rank`).
  * Challonge gère les participants invités sans compte de manière fluide : un participant peut être une simple chaîne de caractères (`name`) sans exiger d'utilisateur lié.
* **Match :**
  * Lié directement aux rounds : `round: 1` (Winner bracket tour 1), `round: -1` (Loser bracket tour 1).
  * Structure binaire historique : `player1_id`, `player2_id`, `winner_id`, `loser_id`.
  * Score stocké sous forme de chaîne tabulaire (`scores_csv: "3-1, 2-3, 3-0"`).

### C. Limites Identifiées chez Challonge
* Incapacité native à gérer le FFA (Free-For-All) ou les tournois de Battle Royale.
* Support faible des compositions d'équipe détaillées (gérées comme un simple nom texte).
* Pas de notion explicite d'étape multiple au sein d'un même conteneur (oblige souvent à créer 2 tournois liés : Tournoi Poules + Tournoi Finales).

---

## 3. Start.gg / Smash.gg (La référence mondiale des compétitions massives)

*Documentation de référence : Start.gg GraphQL API (`api.start.gg/gql/alpha`)*

Start.gg est la plateforme officielle des plus grands tournois mondiaux (EVO, Genesis, circuits Nintendo/Capcom/Tekken).

### A. La Distinction Capitale : "Entrant" vs "Participant"
Start.gg introduit une distinction d'ingénierie fondamentale que toute plateforme sérieuse doit adopter :
* **Participant :** La personne physique humaine qui assiste au tournoi ou possède un compte utilisateur (nom, prénom, gamerTag, contact, badge sur place).
* **Entrant :** L'entité inscrite à une compétition spécifique (`Event`).
  * En 1v1 : l'Entrant est composé d'un seul Participant.
  * En 2v2 ou 5v5 : l'Entrant est l'équipe inscrite, et elle référence une collection de Participants.
  * C'est l'**Entrant** qui reçoit un Seed, qui est placé dans un groupe, qui joue des matchs et qui reçoit un classement final (`placement`).

### B. Découpage Structurel : Event -> Phase -> PhaseGroup -> Set
1. **Event :** La discipline compétitive (ex. *Street Fighter 6 1v1*, *Rocket League 3v3*).
2. **Phase :** Une grande étape logique (ex. *Wave A - Pools*, *Phase 2 - Top 64*, *Finales - Top 8*).
3. **PhaseGroup (Pool) :** Une sous-division physique de la phase (ex. *Pool A1*, *Pool A2*). Chaque groupe contient son propre sous-arbre ou son classement de poule.
4. **Set :** La confrontation entre Entrants (terme esports pour désigner le match).
5. **Seed :** Le rang initial assigné à un Entrant dans une phase donnée (permet d'alimenter les algorithmes de bracket sans dépendre du nom ou de l'ID du joueur).

---

## 4. FACEIT & Battlefy (Les modèles esports par équipe et arènes)

### A. FACEIT
* **Organizer & Hubs :** L'organisateur crée un hub ou un championnat.
* **Matchroom Dédiée :** Chaque match dispose d'une "salle de match" persistante (`Matchroom`) intégrant :
  * Le chat en direct entre capitaines et arbitres.
  * Le système de Pick & Ban (sélection des serveurs et veto des cartes de jeu).
  * L'intégration directe avec les serveurs de jeu (serveurs dédiés CS2/TF2 via RCON / Webhooks).
* **Roster avec remplaçants :** Gestion stricte des titulaires et remplaçants autorisés avec verrouillage (`lock`) à l'heure du match.

### B. Battlefy
* Pionnier des arbres à double élimination modulaires et des formats suisses avec calcul de résistance Buchholz / Sonneborn-Berger.
* Gestion des codes d'accès personnalisés par match pour les salons de jeux privés (ex. clés personnalisées Fortnite / Apex / PUBG).

---

## 5. Synthèse des Invariants Architecturaux

L'analyse de ces plateformes de référence fait ressortir 6 principes universels indispensables :

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LES 6 INVARIANTS UNIVERSELS                           │
├─────────────────────────────────────────────────────────────────────────────┤
│ 1. DÉCOUPLAGE DE L'INSCRIT (ENTRANT) ET DES HUMAINS (PARTICIPANTS/ROSTER)   │
│    L'arbre de tournoi ne manipule que des ENTRANTS. Chaque entrant pointe   │
│    vers un joueur unique OU une équipe avec son roster figé pour l'édition. │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. DÉCOUPLAGE CONFRONTATION (SERIES) VS MANCHES (GAMES/MAPS)                │
│    Un match global (BO1, BO3, BO5) contient 1 à N manches élémentaires      │
│    avec leurs scores propres et métadonnées spécifiques.                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. MODÈLE ADVERSAIRE GÉNÉRIQUE (OPPONENT / SEAT)                            │
│    Remplacer 'participant1 / participant2' par une collection 'opponents'   │
│    permettant de gérer aussi bien le duel (N=2) que le FFA (N=60).          │
├─────────────────────────────────────────────────────────────────────────────┤
│ 4. HIERARCHIE STRUCTURELLE À 4 NIVEAUX DÉLIMITÉS                            │
│    Édition  ──>  Phase (Stage)  ──>  Groupe / Pool  ──>  Round / Journée    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 5. REPRÉSENTATION PAR NOEUDS / SLOTS POUR LES ARBRES                        │
│    Un match dans un bracket n'attend pas des IDs de joueurs en dur mais     │
│    deux slots : "Vainqueur du Match X" et "Perdant du Match Y".             │
├─────────────────────────────────────────────────────────────────────────────┤
│ 6. MOTEUR DE SCORING ENFICHABLE (STRATEGY PATTERN)                          │
│    Séparer le stockage du score brut du barème de calcul de points et de    │
│    départage (Win/Draw/Loss pour foot, Placement + Kills pour BR).          │
└─────────────────────────────────────────────────────────────────────────────┘
```
