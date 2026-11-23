# Document 06 — Réévaluation des Scénarios d'Évolution Architecturale

Ce document réévalue formellement les options stratégiques d'ingénierie à la lumière de la nouvelle directive métier : **aucune compétition n'est en cours, les anciennes éditions sont terminées et leurs structures sportives peuvent être supprimées, à la condition stricte de préserver les utilisateurs, les équipes générales et la traçabilité financière (wallets/ledger).**

---

## 1. Impact Fondamental de la Nouvelle Contrainte

Dans l'évaluation initiale, le maintien d'une couche de compatibilité (Scénario B) était rendu obligatoire par l'hypothèse de tournois en production actifs qu'il ne fallait pas perturber.

La confirmation que **toutes les anciennes compétitions peuvent être purgées** change radicalement l'équation d'ingénierie :
* Maintenir des adaptateurs ou une double écriture devient un **gaspillage d'effort et une source inutile de complexité**.
* Le patching par JSONB (Scénario A) perd sa seule justification (l'urgence).
* L'opportunité d'une **transition nette ("Clean Slate Universel")** devient la voie royale : déployer directement le modèle cible parfait, sans compromis et sans code hérité.

---

## 2. Réévaluation Comparative des Scénarios

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                 RÉÉVALUATION STRATÉGIQUE DES 3 SCÉNARIOS                    │
├─────────────────────────────────────────────────────────────────────────────┤
│ SCÉNARIO A : Patching Incrémental via JSONB                                 │
│   • VERDICT : REJETÉ DÉFINITIVEMENT.                                        │
│   • Aucun sens de bricoler du JSON sur un système sans tournoi en cours.    │
├─────────────────────────────────────────────────────────────────────────────┤
│ SCÉNARIO B : Architecture Hybride avec Adaptateur de Rétrocompatibilité      │
│   • VERDICT : RENDU OBSOLÈTE PAR LE NOUVEAU CONTEXTE.                       │
│   • L'adaptateur ne servirait qu'à maintenir des données mortes.            │
├─────────────────────────────────────────────────────────────────────────────┤
│ SCÉNARIO C : Clean Slate Universel avec Préservation Financière             │
│   • VERDICT : FORTE RECOMMANDATION (LE MEILLEUR CHOIX TECHNIQUE).           │
│   • Purge ciblée des tables sportives obsolètes.                            │
│   • Conservation absolue du ledger financier, des users et des teams.       │
│   • Déploiement direct du schéma cible universel de niveau international.   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Analyse Détaillée du Scénario C (Clean Slate Universel)

### A. Périmètre de Ce Qui Est Préservé (Intangible)
1. **Identités & Communauté :** Table `users` (profils, statistiques globales, avatars, identifiants).
2. **Organisations Pérennes :** Table `teams` (clubs réels, logos, créateurs) et `team_members` (appartenance des joueurs).
3. **Moteur Financier & Ledger :**
   * `wallets` et `user_wallets` : soldes en GTC strictement préservés.
   * `wallet_transactions` : historique immuable de tous les dépôts, retraits, transferts et paiements passés.
   * `financial_accounts` : comptes escrow et comptes système.
   * **Traitement de `registration_payments` :** Découplage de la contrainte `onDelete: 'cascade'` pour figer l'historique de paiement avant la suppression des anciennes éditions.

### B. Périmètre de Ce Qui Est Purgé (Tables Sportives Obsolètes)
* `matches` (modèle binaire 1v1 obsolète).
* `bracket_nodes` (ancien arbre non relationnel).
* `phase_group_participants` (statistiques de poules dénormalisées).
* `phase_groups` (anciennes poules et journées confondues).
* `tournament_phases` (anciennes phases).
* `edition_results` (anciens résultats sportifs).
* `tournament_members` (ancienne table ambiguë mélangeant staff et participants).
* `tournament_editions` et `tournaments` (anciens conteneurs sportifs dont les structures sont obsolètes).

### C. Déploiement du Nouveau Schéma Cible
* Déploiement direct des tables propres : `tournament_staff`, `competition_entrants`, `entrant_roster_members`, `competition_stages`, `competition_groups`, `competition_rounds`, `competition_encounters`, `encounter_sides`, `encounter_side_entrants`, `encounter_matches`, `match_slots`, `match_games`, `competition_rulesets`.
* Remplacement complet des anciens moteurs de `lib/tournaments/` par le nouveau moteur déclaratif universel.

---

## 4. Matrice de Décision Réactualisée

| Critère Stratégique | Scénario A (Patching) | Scénario B (Hybride Adaptateur) | Scénario C (Clean Slate - Recommandé) |
|:---|:---:|:---:|:---:|
| **Qualité et Pureté du Code** | 1 / 5 | 3 / 5 | **5 / 5 (Excellente, zéro dette)** |
| **Prise en charge de tous les formats (FFA, BR, Collectif)** | 2 / 5 | 5 / 5 | **5 / 5 (Natif et robuste)** |
| **Sécurité Comptable et Financière** | 2 / 5 | 4 / 5 | **5 / 5 (Auditabilité totale)** |
| **Rapidité de Développement** | 3 / 5 | 2 / 5 (Complexité adaptateur) | **4 / 5 (Moins de code d'adaptation)** |
| **Charge de Maintenance Future** | 1 / 5 (Cauchemar) | 3 / 5 | **5 / 5 (Minimale)** |
| **Stabilité des Performances** | 2 / 5 | 3 / 5 | **5 / 5 (Requêtes SQL optimales)** |

---

## 5. Conclusion et Validation Stratégique

La décision d'autoriser la suppression des anciennes données sportives offre à Games Trafics une **opportunité architecturale rare : repartir sur des bases saines sans traîner un passif technique.**

Le **Scénario C (Clean Slate Universel)** est la recommandation définitive :
1. Il élimine 100 % de la dette technique accumulée.
2. Il évite d'écrire des milliers de lignes de code d'adaptation temporaires qui auraient dû être jetées plus tard.
3. Il garantit une sécurité financière absolue en protégeant le ledger de toute cascade destructrice.
