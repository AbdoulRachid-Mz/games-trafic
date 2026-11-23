# Document 04 — Analyse Comparative et Matrice des Écarts (Gap Analysis)

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
| **Custom Fields par tournoi** | ❌ Non (champs figés dans schema) | ✅ Oui (`custom_fields: key-value`) | ⚠️ Limité (`misc`) | ✅ Oui (`customData`) | ⚠️ Limité |
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
| **Nombre d'adversaires max** | ❌ **Rigide (2 participants)** | ✅ **Universel (2 ou N via `opponents`)** | ❌ Rigide (2 joueurs) | ✅ **Universel (2 ou N)** | ❌ Rigide (2 équipes) |
| **Support Battle Royale / FFA** | ❌ **Impossible** | ✅ **Natif (`type: ffa`)** | ❌ Impossible | ✅ **Natif (`entrants` multiples)** | ❌ Non |
| **Séries Best-of-X (BO1, BO3, BO5)** | ⚠️ Simulé (`matches.metadata.format`) | ✅ **Natif (Match -> Games)** | ⚠️ Par scores_csv | ✅ **Natif (Set -> Games)** | ✅ **Natif (Match -> Maps)** |
| **Score par manche élémentaire** | ❌ Non (stocké dans `gameData: jsonb`) | ✅ Oui (`games.score`) | ⚠️ Chaîne `scores_csv` | ✅ Oui (`games.score`) | ✅ Oui (`maps.score`) |
| **Statut de validation par partie** | Global au match | Par manche et par match | Global au match | Par manche et par set | Automatisé via serveur |
| **Preuves (Screenshots, Vidéos)** | ✅ Oui (`screenshot`, `proofLinks`) | ⚠️ En pièce jointe | ✅ Oui (`attachments`) | ⚠️ Non natif | ✅ Démos serveur auto |

---

### D. Modèle de Scoring et Départage

| Fonctionnalité | Games Trafics Actuel | Toornament | Challonge | Start.gg | FACEIT |
|:---|:---:|:---:|:---:|:---:|:---:|
| **Scoring Sport / Football (Victoire/Nul/Défaite)** | ✅ Oui (`scoring.ts`, 3/1/0) | ✅ Oui | ✅ Oui | ❌ (Orientation win/loss) | ❌ (Win/loss binaire) |
| **Scoring Battle Royale (Points Place + Kills)** | ❌ **Non géré** | ✅ **Oui (`ranking_points` configurables)** | ❌ Non géré | ✅ **Oui** | ❌ Non géré |
| **Départage Confrontation directe (Head-to-head)** | ✅ Oui (`standings.engine.ts`) | ✅ Oui | ✅ Oui | ✅ Oui | ❌ |
| **Départage Différence de score (Goal diff)** | ✅ Oui | ✅ Oui | ✅ Oui | ✅ Oui | ❌ |
| **Départage Buchholz / Sonneborn-Berger** | ❌ Non implémenté | ✅ Oui | ✅ Oui | ✅ Oui | ❌ |
| **Chronométrage au centième / millième (Courses)** | ❌ Non (uniquement entiers de scores) | ✅ Oui (métadonnées temporelles) | ❌ Non | ⚠️ Limité | ❌ Non |

---

## 2. Synthèse des Écarts Critiques (Gap Analysis)

```text
┌─────────────────────────┬─────────────────────────────────────────────────────────────┬───────────┐
│ DOMAINE ARCHITECTURAL   │ SITUATION GAMES TRAFICS ACTUELLE                            │ CRITICITÉ │
├─────────────────────────┼─────────────────────────────────────────────────────────────┼───────────┤
│ Matches FFA / BR        │ Schéma bloqué à 2 colonnes (participant1 / participant2)    │ BLOQUANT  │
├─────────────────────────┼─────────────────────────────────────────────────────────────┼───────────┤
│ Découpage Match / Game  │ Pas de table 'games' : les manches n'existent pas en base   │ MAJEUR    │
├─────────────────────────┼─────────────────────────────────────────────────────────────┼───────────┤
│ Roster d'Équipe         │ Les équipes n'ont pas de roster figé par édition            │ MAJEUR    │
├─────────────────────────┼─────────────────────────────────────────────────────────────┼───────────┤
│ Surcharge PhaseGroup    │ Les journées de championnat polluent les tables de groupes  │ MODÉRÉ    │
├─────────────────────────┼─────────────────────────────────────────────────────────────┼───────────┤
│ Participants Invités    │ Crée un faux membre de tournoi global pour chaque invité    │ MODÉRÉ    │
├─────────────────────────┼─────────────────────────────────────────────────────────────┼───────────┤
│ Moteur de Scoring BR    │ Aucun calcul de points par palier de survie ni par kill     │ MAJEUR    │
└─────────────────────────┴─────────────────────────────────────────────────────────────┴───────────┘
```

---

## 3. Matrice de Maturité Compétitive

* **Niveau 1 — Basique (Challonge v1) :** Tournois duels 1v1 simples, bracket éliminatoire généré à la volée, scores manuels.  
  * *Games Trafics dépasse déjà largement ce niveau (gestion financière, notifications, design 3D).*
* **Niveau 2 — Intermédiaire Avancé (État actuel de Games Trafics) :** Tournois multi-phases (poules + élimination), matches aller-retour, calcul dynamique des classements, gestion des clubs et prize pool en monnaie virtuelle.
* **Niveau 3 — Professionnel Esports (Toornament / Start.gg) :** Découpage Match / Games (BO3, BO5), entités Entrant et Opponent universelles (1v1, TvT, FFA Battle Royale), rosters instanciés, moteur de scoring enfichable par jeu.  
  * *C'est le niveau cible de notre proposition d'architecture.*
* **Niveau 4 — Intégré Serveurs de Jeu (FACEIT) :** Déploiement automatique de serveurs de jeu dédiés, bot de gestion de lobby dans le jeu, récupération des scores par API mémoire/démo.
