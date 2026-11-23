# Document 04 — Analyse Comparative et Matrice des Écarts (Gap Analysis) — Révisé

Ce document compare point par point l'architecture actuelle de Games Trafics avec les standards de l'industrie représentés par **Toornament**, **Challonge**, **Start.gg** et **FACEIT**.

---

## 1. Tableau Comparatif par Domaine d'Architecture

### A. Modèle de Participant et Roster

| Fonctionnalité | Games Trafics Actuel | Toornament | Challonge | Start.gg | FACEIT |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Joueur Solo (1v1)** | `tournament_members` + `edition_registrations` | `Participant` | `Participant` | `Entrant` (1 Participant) | `Player` |
| **Équipe Collective (TvT)** | `teams` lié via `tournament_members` | `Participant` (type: team) | `Participant` (nom texte) | `Entrant` (N Participants) | `Team` |
| **Roster figé par édition** | ❌ **Non** (utilise `team_members` global) | ✅ **Oui** (`lineup` instancié par tournoi) | ❌ Non | ✅ **Oui** (Participants liés à l'Entrant) | ✅ **Oui** (Roster verrouillé par cup) |
| **Rôles dans l'équipe (Coach/Sub)** | Partiel (`team_members.role`) | ✅ Oui (`player`, `substitute`, `coach`) | ❌ Non | ✅ Oui (`role`, `isCaptain`) | ✅ Oui (`captain`, `substitute`) |
| **Participants Invités (Sans compte)** | ⚠️ Partiel (crée un faux `tournament_member`) | ✅ Oui (Participant indépendant de compte) | ✅ Oui (`name` texte libre) | ✅ Oui (Entrant sans compte utilisateur) | ❌ Non (Comptes Steam/FACEIT obligatoires) |
| **Distinction Équipe réelle vs Club de jeu** | ❌ **Non** (champ `clubName` confus) | ✅ Oui (Equipe vs In-game loadout) | ❌ Non | ✅ Oui (Entrant vs Character/Team) | ✅ Oui |
| **Séparation Staff vs Compétiteurs** | ❌ **Non** (mélangés dans `tournament_members`) | ✅ Oui (Permissions distinctes) | ✅ Oui | ✅ Oui (Admin/Staff vs Entrant) | ✅ Oui (Roles séparés) |
| **Check-in dynamique** | ✅ Oui (`checkedIn`, `checkedInAt`) | ✅ Oui (`checked_in`, dates) | ✅ Oui | ✅ Oui | ✅ Oui |

---

### B. Modèle de Structure de Compétition

| Fonctionnalité | Games Trafics Actuel | Toornament | Challonge | Start.gg | FACEIT |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Hiérarchie globale** | Tournoi -> Édition -> Phase -> Groupe | Project -> Tournament -> Stage -> Group | Tournament -> Round | Tournament -> Event -> Phase -> PhaseGroup | Hub -> Championship -> Stage |
| **Multi-Phases ordonnées** | ✅ Oui (`tournament_phases.order`) | ✅ Oui (`stages`) | ❌ Non (1 seul format/arbre) | ✅ Oui (`phases`) | ✅ Oui (`stages`) |
| **Séparation Poule vs Journée** | ❌ **Non** (Journée = `phase_group` surchargé) | ✅ **Oui** (`groups` contiennent des `rounds`) | ⚠️ Par `round` | ✅ **Oui** (`phaseGroups` avec `rounds`) | ✅ **Oui** (`rounds` temporels) |
| **Format Single Elimination** | ✅ Oui (`bracket_nodes`) | ✅ Oui | ✅ Oui | ✅ Oui | ✅ Oui |
| **Format Double Elimination** | ⚠️ Partiel (Upper/Lower dans schema, moteur incomplet) | ✅ Oui (complet avec Bracket Reset) | ✅ Oui (complet) | ✅ Oui (complet avec Bracket Reset) | ✅ Oui |
| **Format Championnat / Round-Robin** | ✅ Oui (Aller ou Aller-Retour) | ✅ Oui | ✅ Oui | ✅ Oui | ✅ Oui |
| **Format Suisse (Swiss)** | ⚠️ Prévu dans schema, générateur partiel | ✅ Oui (système suisse complet) | ✅ Oui | ✅ Oui | ✅ Oui |
| **Arbre symétrique / Visuel 3D** | ✅ **Exceptionnel** (`playoffs-engine.ts`) | ⚠️ Standard horizontal | ⚠️ Standard horizontal | ⚠️ Standard horizontal | ⚠️ Standard horizontal |

---

### C. Modèle de Match et Confrontation

| Fonctionnalité | Games Trafics Actuel | Toornament | Challonge | Start.gg | FACEIT |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Nombre d'adversaires max** | ❌ **Rigide (2 participants obligatoires)** | ✅ **Universel (2 ou N via `opponents`)** | ❌ Rigide (2 joueurs) | ✅ **Universel (2 ou N)** | ❌ Rigide (2 équipes) |
| **Support Battle Royale / FFA direct** | ❌ **Impossible** | ✅ **Natif (`type: ffa`)** | ❌ Impossible | ✅ **Natif (`entrants` multiples)** | ❌ Non |
| **Confrontations Collectives (Inter-Régions)** | ❌ **Impossible nativement** | ⚠️ Partiel | ❌ Non | ⚠️ Complexe | ⚠️ Non |
| **Séries Best-of-X (BO1, BO3, BO5)** | ⚠️ Simulé (`matches.metadata.format`) | ✅ **Natif (Match -> Games)** | ⚠️ Par scores_csv | ✅ **Natif (Set -> Games)** | ✅ **Natif (Match -> Maps)** |
| **Score par manche élémentaire** | ❌ Non (stocké dans `gameData: jsonb`) | ✅ Oui (`games.score`) | ⚠️ Chaîne `scores_csv` | ✅ Oui (`games.score`) | ✅ Oui (`maps.score`) |
| **Slots relationnels d'arbre (DAG)** | ❌ Non (placeholders textuels non typés) | ✅ Oui | ✅ Oui | ✅ Oui (Seeds & Slots) | ✅ Oui |
| **Preuves (Screenshots, Vidéos)** | ✅ Oui (`screenshot`, `proofLinks`) | ⚠️ En pièce jointe | ✅ Oui (`attachments`) | ⚠️ Non natif | ✅ Démos serveur auto |

---

### D. Modèle de Scoring et Départage

| Fonctionnalité | Games Trafics Actuel | Toornament | Challonge | Start.gg | FACEIT |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Scoring Sport / Football (Victoire/Nul/Défaite)** | ✅ Oui (`scoring.ts`, 3/1/0) | ✅ Oui | ✅ Oui | ❌ (Orientation win/loss) | ❌ (Win/loss binaire) |
| **Scoring Battle Royale (Points Place + Kills)** | ❌ **Non géré** | ✅ **Oui (`ranking_points` configurables)** | ❌ Non géré | ✅ **Oui** | ❌ Non géré |
| **Départage Confrontation directe (Head-to-head)** | ❌ **NON IMPLÉMENTÉ dans `rankParticipants()`** (ignoré par le code de tri réel) | ✅ Oui | ✅ Oui | ✅ Oui | ❌ |
| **Départage Différence de score (Goal diff)** | ✅ Oui (`GOAL_DIFF`) | ✅ Oui | ✅ Oui | ✅ Oui | ❌ |
| **Départage Buts marqués (Goals for)** | ✅ Oui (`GOALS_FOR`) | ✅ Oui | ✅ Oui | ✅ Oui | ❌ |
| **Départage Buchholz / Sonneborn-Berger** | ❌ Non implémenté | ✅ Oui | ✅ Oui | ✅ Oui | ❌ |
| **Chronométrage au centième / millième (Courses)** | ❌ Non (uniquement entiers) | ✅ Oui (métadonnées temporelles) | ❌ Non | ⚠️ Limité | ❌ Non |

---

## 2. Synthèse des Écarts Critiques (Gap Analysis)

```text
┌─────────────────────────┬─────────────────────────────────────────────────────────────┬───────────┐
│ DOMAINE ARCHITECTURAL   │ SITUATION GAMES TRAFICS ACTUELLE                            │ CRITICITÉ │
├─────────────────────────┼─────────────────────────────────────────────────────────────┼───────────┤
│ Matches FFA / BR        │ Schéma bloqué à 2 colonnes (participant1 / participant2)    │ BLOQUANT  │
├─────────────────────────┼─────────────────────────────────────────────────────────────┼───────────┤
│ Confrontations Collectives | Impossible de regrouper des sous-matchs sous 2 camps      │ BLOQUANT  │
├─────────────────────────┼─────────────────────────────────────────────────────────────┼───────────┤
│ Découpage Match / Game  │ Pas de table 'games' : les manches n'existent pas en base   │ MAJEUR    │
├─────────────────────────┼─────────────────────────────────────────────────────────────┼───────────┤
│ Roster d'Équipe         │ Les équipes n'ont pas de roster figé par édition            │ MAJEUR    │
├─────────────────────────┼─────────────────────────────────────────────────────────────┼───────────┤
│ Départage HEAD_TO_HEAD  │ Ignoré dans l'implémentation réelle de `rankParticipants()` │ MAJEUR    │
├─────────────────────────┼─────────────────────────────────────────────────────────────┼───────────┤
│ Surcharge PhaseGroup    │ Les journées de championnat polluent les tables de groupes  │ MODÉRÉ    │
├─────────────────────────┼─────────────────────────────────────────────────────────────┼───────────┤
│ Slots de progression    │ Dépendances stockées en text / JSON opaque au lieu de FK    │ MAJEUR    │
└─────────────────────────┴─────────────────────────────────────────────────────────────┴───────────┘
```

---

## 3. Matrice de Maturité Compétitive

* **Niveau 1 — Basique (Challonge v1) :** Tournois duels 1v1 simples, bracket éliminatoire généré à la volée, scores manuels.
* **Niveau 2 — Intermédiaire Avancé (État actuel de Games Trafics) :** Tournois multi-phases, matches aller-retour, calcul dynamique des classements, prize pool en GTC et arbres 3D.
* **Niveau 3 — Professionnel Esports Universel (Cible Games Trafics V2) :** Découpage Rencontre / Sous-matchs / Manches, entités Entrant et Roster figé, oppositions universelles (Duels, FFA direct sans côtés artificiels, et Chocs Collectifs avec camps), slots relationnels DAG, et Rule Engine paramétrable sans déploiement de code.
