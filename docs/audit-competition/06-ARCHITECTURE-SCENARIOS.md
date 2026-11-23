# Document 06 — Scénarios d'Évolution Architecturale et Recommandation

Ce document présente et évalue trois scénarios d'évolution pour le système de compétition de Games Trafics, allant du colmatage minimal à la refonte totale, afin de guider le choix stratégique de l'équipe.

---

## 1. Description des Trois Scénarios

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LES TROIS TRAJECTOIRES                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ SCÉNARIO A : Patching Incrémental (Aménagement de l'existant via JSONB)     │
│   • On garde la table `matches` et `phase_groups`.                          │
│   • On stocke les manches et les participants FFA dans `gameData: jsonb`.   │
├─────────────────────────────────────────────────────────────────────────────┤
│ SCÉNARIO B : Refonte Modulaire Hybride avec Couche de Compatibilité         │
│   • Recommandé : On introduit les nouvelles tables relationnelles cibles.   │
│   • Un adaptateur bidirectionnel assure la compatibilité avec l'existant.   │
│   • Les tournois existants fonctionnent sans interruption.                  │
├─────────────────────────────────────────────────────────────────────────────┤
│ SCÉNARIO C : Réécriture Radicale "Big Bang" (Engine-First de zéro)          │
│   • Remplacement brutal de tout le code tournoi par un nouveau moteur.      │
│   • Rupture des anciennes données ou migration de force sous downtime.      │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Analyse Approfondie des Scénarios

### Scénario A : Patching Incrémental (Court Terme / Dette Technique)

#### Principe technique
* Conserver les 11 tables actuelles sans altération majeure de structure.
* Surcharger le champ `metadata` ou `gameData` de la table `matches` pour y consigner les sous-manches (BO3/BO5) et les listes d'adversaires pour le Battle Royale.
* Ajouter des drapeaux booléens dans `editionConfig` et `phase.config`.

#### Avantages
* Temps de mise en œuvre initial très court (1 à 2 semaines).
* Aucune migration de schéma critique.
* Les pages UI existantes continuent d'afficher les matchs sans modification des requêtes ORM.

#### Inconvénients et Risques Majeurs
* **Requêtes et Indexation impossibles :** Impossible de faire des agrégations SQL rapides (ex. "Meilleur fragueur de l'édition", "Statistiques par arme") sur des structures JSON imbriquées non normalisées.
* **Intégrité référentielle nulle :** Pas de clés étrangères (`foreign keys`) sur les identifiants d'adversaires dans le JSON ; risque élevé d'incohérences si un joueur est supprimé.
* **Complexité exponentielle du code TypeScript :** Les moteurs doivent multiplier les `if (match.metadata?.isFFA) ... else ...`, augmentant le risque de régressions à chaque modification.
* **Impasse à moyen terme :** Ce scénario reporte le problème et rendra la migration future deux fois plus douloureuse.

---

### Scénario B : Refonte Modulaire avec Couche d'Adaptation (Recommandé)

#### Principe technique
* Création des nouvelles tables propres : `competition_entrants`, `entrant_members`, `competition_encounters`, `encounter_opponents`, `encounter_games`.
* Déploiement d'un **Service Adaptateur (Tournament Compatibility Layer)** :
  * Pour les tournois existants (ou formats 1v1 classiques) : le code existant continue de lire/écrire via l'API historique ou une vue unifiée.
  * Pour les nouvelles éditions : le nouveau moteur universel prend en charge la totalité du cycle de vie.
  * Les Server Actions exposent une interface uniforme aux composants React.
* Refactorisation progressive des moteurs (`scoring`, `standings`, `progression`) pour consommer les entités normalisées.

#### Avantages
* **Pérennité absolue :** Modèle normalisé de niveau professionnel (similaire à Toornament et Start.gg).
* **Zéro régression sur la production :** Les tournois déjà terminés ou en cours restent consultables et intacts.
* **Support universel immédiat :** Permet de lancer officiellement des tournois PUBG Mobile, Free Fire et COD Mobile avec un scoring complet.
* **Auditabilité financière préservée :** La relation entre l'entrant et le paiement d'inscription reste limpide et indexée.

#### Inconvénients et Contraintes
* Nécessite un effort d'ingénierie rigoureux sur 4 à 6 semaines (découpé en phases).
* Nécessite la maintenance temporaire d'un adaptateur de compatibilité pendant la transition.

---

### Scénario C : Réécriture Radicale "Big Bang"

#### Principe technique
* Dépréciation immédiate des anciennes tables de matchs et de groupes.
* Migration totale de toutes les anciennes données de la base de données vers le nouveau schéma en un seul script.
* Réécriture complète de toutes les Server Actions et pages de dashboard.

#### Avantages
* Élimination instantanée de tout code hérité.
* Base de code ultra-propre sans adaptateur intermédiaire.

#### Inconvénients et Risques Majeurs
* **Risque de corruption de données inacceptable :** Risque de casser les historiques de tournois, les statistiques de joueurs et les références financières d'anciennes éditions.
* **Gel des développements :** Immobilise toute l'équipe pendant plusieurs semaines sans possibilité de livrer de correctifs sur la production.
* **Risque élevé de bugs invisibles au lancement.**

---

## 3. Matrice d'Évaluation Comparative

| Critère d'Évaluation (sur 5) | Scénario A (Patching) | Scénario B (Modulaire - Recommandé) | Scénario C (Big Bang) |
|:---|:---:|:---:|:---:|
| **Support réel de tous les formats (BR, TvT, Duels)** | 2 / 5 (Bricolé) | **5 / 5 (Natif)** | **5 / 5 (Natif)** |
| **Robustesse et Intégrité des données** | 2 / 5 (Faible) | **5 / 5 (Maximale)** | 4 / 5 (Risque migration) |
| **Sécurité pour les tournois en cours** | 4 / 5 | **5 / 5 (Zéro impact)** | 1 / 5 (Danger critique) |
| **Maintenabilité du code à long terme** | 1 / 5 (Dette toxique) | **5 / 5 (Excellente)** | 5 / 5 (Excellente) |
| **Facilité d'évolution future** | 1 / 5 | **5 / 5** | 5 / 5 |
| **Délai de mise en production** | **5 / 5 (1-2 sem.)** | 4 / 5 (4-5 sem.) | 2 / 5 (8+ sem.) |
| **Coût total de possession (TCO à 1 an)** | Élevé (Refonte inévitable) | **Faible / Optimal** | Moyen-Élevé |

---

## 4. Recommandation Finale et Justification

### Choix Préconisé : **Scénario B (Refonte Modulaire Progressive)**

Ce choix s'impose pour trois raisons stratégiques :

1. **La réputation de fiabilité de Games Trafics :** La plateforme gérant des fonds réels (wallets GTC et prize pools), il est inconcevable d'opter pour le Scénario A (qui fragiliserait la cohérence des résultats et des gains) ou pour le Scénario C (qui mettrait en péril les éditions historiques).
2. **L'ouverture immédiate aux marchés majeurs de l'Afrique et du mobile :** Les scènes esportives de Free Fire, PUBG Mobile et Call of Duty Mobile représentent un gisement de croissance massif. Le Scénario B apporte immédiatement le modèle d'équipes avec roster figé et le modèle de manches FFA indispensables à ces jeux.
3. **Une transition indolore pour l'équipe :** Les organisateurs actuels de tournois eFootball et FIFA ne perçoivent aucun bouleversement, tandis qu'une nouvelle catégorie de tournois (Battle Royale et Tournois d'équipes) devient opérationnelle en parallèle.
