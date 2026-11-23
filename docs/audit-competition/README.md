# Audit Approfondi du Système de Compétition de Games Trafics
## Benchmark International, Analyse Critique et Proposition d'Architecture Cible

*Auteurs : Antigravity & Équipe d'Ingénierie Games Trafics*  
*Date de publication : Novembre 2026 (Version Révisée & Approfondie)*  
*Statut du document : Proposition Architecturale Validée et Dossier Complet (Lecture Seule — Zéro modification de code en production)*

---

## 1. Résumé Exécutif et Décision Stratégique

À la suite de la revue détaillée de l'audit et à la confirmation d'une décision métier capitale — **toutes les anciennes compétitions sont achevées, aucun tournoi n'est en cours et leurs données peuvent être supprimées sans impacter les utilisateurs, les équipes générales et la traçabilité financière** —, l'architecture cible a été réévaluée et enrichie :

1. **Option Retenue : Le Scénario C (Clean Slate Universel)**  
   Plutôt que d'écrire des couches de compatibilité ou d'adaptateurs pour des données passées, nous optons pour une **transition nette**. Les tables sportives obsolètes seront purgées après avoir sécurisé le lien comptable de `registration_payments`, permettant de déployer directement le schéma universel sans dette technique.
2. **Modèle de Participant Robuste :**  
   Séparation nette entre le Staff (`tournament_staff`), l'entité compétitrice (`competition_entrants`), son roster d'édition figé (`entrant_roster_members`), l'organisation générale (`teams`) et le club cosmétique choisi dans le jeu (`in_game_club: "Real Madrid"`).
3. **Support Natif des Confrontations Collectives :**  
   Formalisation des chocs de type "Région Dakar vs Région Thiès" ou "Guerres de Clans" via une rencontre parent encadrant deux côtés (`encounter_sides`), regroupant chacun leurs compétiteurs, avec N sous-matchs individuels ou duos et règles d'agrégation configurables (points de match ou cumul des scores).
4. **Brackets DAG et Slots Relationnels :**  
   Remplacement de tout champ JSON opaque par des colonnes relationnelles strictes dans `match_slots`, assurant la gestion native du Double Élimination (Winner / Loser Brackets), du Grand Finals Reset conditionnel et la détection d'acyclicité.
5. **Moteur de Règles Déclaratif (Rule Engine) :**  
   Séparation étanche entre les données brutes, les règles déclaratives configurables en base (`competition_rulesets`) et un évaluateur TypeScript universel. **Aucun code TypeScript n'est requis pour ajouter un nouveau jeu ou barème.**

---

## 2. Table des Matières du Dossier d'Audit

Le dossier comprend désormais 8 documents d'ingénierie détaillés :

| N° | Fichier | Description |
|:---|:---|:---|
| **01** | [`01-CONTEXT-AND-PROBLEM.md`](./01-CONTEXT-AND-PROBLEM.md) | Contexte métier de Games Trafics, vision du moteur universel et formulation des verrous actuels. |
| **02** | [`02-COMPETITOR-RESEARCH.md`](./02-COMPETITOR-RESEARCH.md) | Benchmark approfondi de Toornament, Challonge, Start.gg, FACEIT et Battlefy avec extraction des 6 invariants mondiaux. |
| **03** | [`03-CURRENT-GAMES-TRAFICS-AUDIT.md`](./03-CURRENT-GAMES-TRAFICS-AUDIT.md) | Audit chirurgical du schéma existant, rectification sur le Head-to-Head et analyse des dépendances financières. |
| **04** | [`04-ARCHITECTURE-COMPARISON.md`](./04-ARCHITECTURE-COMPARISON.md) | Tableaux comparatifs systématiques, matrice de maturité et analyse des écarts critiques (Gap Analysis). |
| **05** | [`05-PROPOSED-TARGET-ARCHITECTURE.md`](./05-PROPOSED-TARGET-ARCHITECTURE.md) | **Proposition d'architecture cible approfondie** : schéma relationnel complet (Mermaid ERD), spécification des entités, duels, collectifs et FFA. |
| **06** | [`06-ARCHITECTURE-SCENARIOS.md`](./06-ARCHITECTURE-SCENARIOS.md) | Réévaluation des scénarios à la lumière de la purge des données et justification du choix **Clean Slate Universel**. |
| **07** | [`07-IMPLEMENTATION-ROADMAP.md`](./07-IMPLEMENTATION-ROADMAP.md) | Feuille de route d'implémentation en **4 sprints de développement** et procédure de purge sécurisée préservant le ledger. |
| **08** | [`08-ARCHITECTURAL-DECISIONS.md`](./08-ARCHITECTURAL-DECISIONS.md) | **Document de Décisions Architecturales** : réponses détaillées aux 7 points de cadrage (Participants, Collectif, Slots, Ruleset Engine, Purge). |

---

## 3. Synthèse des Réponses aux 7 Points de Cadrage Métier

1. **Purge et Traçabilité Financière :** La suppression des anciennes éditions est précédée du découplage de `registration_payments` pour préserver le lien avec `wallet_transactions` et `wallets`. Aucune donnée financière n'est altérée.
2. **Participants et Rosters :** L'entrant (`competition_entrants`) est la seule entité en compétition. Les membres d'une équipe sont figés dans `entrant_roster_members`. Le club de football choisi dans le jeu (`in_game_club`) est un simple attribut de loadout distinct de l'équipe réelle. Le staff est isolé dans `tournament_staff`.
3. **Confrontations Collectives :** Modélisation parent/enfant robuste : Rencontre collective (`competition_encounters`) -> 2 Côtés (`encounter_sides`) -> Sous-matchs individuels (`encounter_matches`) -> Agrégation par points de match ou scores cumulés.
4. **Brackets et Progression :** Emplacements normalisés (`match_slots`) avec clés étrangères vers les matchs ou groupes sources. Support complet du Double Elimination, Grand Finals Reset, BYE et validation d'acyclicité (DAG).
5. **Règles Configurables :** Moteur piloté par les données (Data-Driven Rule Engine) : table `competition_rulesets` stockant barèmes, matrices de placement et chaînes de départage, sans besoin de coder de Strategy TypeScript par jeu.
6. **Structure Découplée :** Distinction nette : Phase (étape logique) -> Groupe (poule de classement) -> Round (journée temporelle) -> Rencontre -> Manche (Game).
7. **Corrections d'Audit :** Constat confirmé de l'absence de confrontation directe dans `standings.engine.ts` actuel ; le nouveau Rule Engine intégrera un calcul formel de `HEAD_TO_HEAD`.
