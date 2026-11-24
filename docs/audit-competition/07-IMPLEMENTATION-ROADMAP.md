# Document 07 — Feuille de Route d'Implémentation "Clean Slate" et Procédure de Migration Sécurisée (Révisée)

Ce document détaille le plan de déploiement du Scénario C (Clean Slate Universel), incluant la procédure pas-à-pas de migration vérifiée, les contrôles pré et post migration et le plan de rollback garantissant l'intégrité absolue du ledger financier.

---

## 1. Procédure de Migration et Découplage Comptable

Pour supprimer les anciennes compétitions sans jamais rompre l'auditabilité des transactions de portefeuilles (`wallets` et `walletTransactions`), la migration exclut tout recours à un `TRUNCATE CASCADE` aveugle et applique un ordre strict de déconnexion et de suppression.

```mermaid
flowchart TD
    A[Étape 1: Contrôles de Cohérence Pré-Migration] --> B[Étape 2: Découplage & Archivage Comptable de registration_payments]
    B --> C[Étape 3: Neutralisation des FK dans messages, interactions, notifs]
    C --> D[Étape 4: Suppression Ordonnée des Tables Sportives Obsolètes]
    D --> E[Étape 5: Déploiement du Schéma Cible Drizzle]
    E --> F[Étape 6: Contrôles de Cohérence Post-Migration]
    F --> G[Étape 7: Déploiement des Moteurs & Server Actions]
```

### Script SQL de Migration Vérifié sur le Schéma Réel

```sql
-- ============================================================================
-- 1. CONTRÔLES PRÉ-MIGRATION (VALIDATION DE COHÉRENCE)
-- ============================================================================
SELECT count(*) AS pending_transactions FROM wallet_transactions WHERE status = 'PENDING';
SELECT count(*) AS total_payments, sum(amount) AS total_amount FROM registration_payments;

-- ============================================================================
-- 2. DÉCOUPLAGE ET ARCHIVAGE DE LA TRAÇABILITÉ FINANCIÈRE
-- ============================================================================
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_edition_id TEXT;
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_edition_name TEXT;
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_tournament_id TEXT;
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_tournament_name TEXT;
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_user_id TEXT;
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_team_id TEXT;
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_participant_name TEXT;
ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_registration_type TEXT;

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

-- Supprimer la FK cascade vers les anciennes inscriptions
ALTER TABLE registration_payments DROP CONSTRAINT IF EXISTS registration_payments_registration_id_fkey;
ALTER TABLE registration_payments ALTER COLUMN registration_id DROP NOT NULL;
ALTER TABLE registration_payments RENAME COLUMN registration_id TO legacy_registration_id;
ALTER TABLE registration_payments ADD COLUMN entrant_id UUID;

-- ============================================================================
-- 3. NEUTRALISATION DES CLÉS ÉTRANGÈRES DANS MESSAGES, INTERACTIONS, NOTIFS
-- ============================================================================
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
DELETE FROM tournament_editions;
DELETE FROM tournaments;

-- ============================================================================
-- 5. CONTRÔLES POST-MIGRATION (VALIDATION DE PRÉSERVATION FINANCIÈRE)
-- ============================================================================
SELECT count(*) AS verified_payments, sum(amount) AS verified_total_amount FROM registration_payments;
SELECT count(*) AS total_wallet_transactions FROM wallet_transactions;
SELECT count(*) AS total_wallets FROM user_wallets;
SELECT count(*) AS total_users FROM users;
SELECT count(*) AS total_teams FROM teams;
```

---

## 2. Feuille de Route Opérationnelle (4 Sprints de Développement)

```mermaid
gantt
    title Déploiement Clean Slate du Moteur de Compétition
    dateFormat  YYYY-MM-DD
    section Sprint 1 : Purge & Schéma Cible
    Exécution SQL Purge & Drizzle Migration   :s1_1, 2026-12-01, 3d
    Contraintes SQL Composites & Types        :s1_2, after s1_1, 4d
    section Sprint 2 : Rule Engine & Métriques
    Évaluateur Universel & Métriques Typées   :s2_1, after s1_2, 4d
    Algorithme de Départage Head-to-Head      :s2_2, after s2_1, 3d
    section Sprint 3 : Brackets DAG & Collectif
    Brackets DAG & Grand Finals Reset         :s3_1, after s2_2, 4d
    Confrontations Collectives (Sides & Slots):s3_2, after s3_1, 3d
    section Sprint 4 : Dashboards & Recette
    Dashboards de Saisie & Validation Arbitre :s4_1, after s3_2, 4d
    Recette Complète sur les Formats          :s4_2, after s4_1, 3d
```

---

## 3. Stratégie de Rollback

En cas d'incident pendant la migration du Sprint 1 :
1. **Restauration Immédiate du Snapshot :** Restauration du snapshot Neon ou dump PostgreSQL réalisé juste avant le script.
2. **Intégrité Comptable Garantie :** Aucune opération ne modifiant les montants ou les soldes dans `wallets` ou `wallet_transactions`, les fonds de tous les utilisateurs restent intangibles.
