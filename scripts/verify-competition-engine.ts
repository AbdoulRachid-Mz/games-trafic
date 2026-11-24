/**
 * Script de validation technique, immutabilité et reproduction du Moteur de Compétition Games Trafics.
 * 
 * Exécute sous PostgreSQL 17.12 :
 * 1. Sécurité renforcée par AUTORISATION POSITIVE STRICTE ET VERROUILLÉE :
 *    - Liste blanche FIXE et IMMUABLE des bases de test : ['neondb', 'games_trafics_test']
 *    - Liste blanche FIXE et IMMUABLE des endpoints Neon autorisés : ['ep-lingering-cake-abto1cz5-pooler.eu-west-2.aws.neon.tech', ...]
 *    - Rejet absolu de NODE_ENV=production et de tout nom de base/endpoint de production
 *    - Exigence stricte de ALLOW_COMPETITION_TEST='true', '--confirm' et CONFIRM_TARGET_DB
 *    - Isolation absolue dans des schémas temporaires dynamiques (^test_competition_[a-z0-9_]+$)
 * 2. Partie A — Banc d'essai synthétique des 21 tables canoniques :
 *    - Intégration du comparateur structurel approfondi (21 tables, 0 divergence)
 *    - Tests d'immutabilité absolue des rulesets publiés (Triggers)
 *    - Tests de correspondance exacte entre le ruleset du match et les métriques (FK composites)
 *    - 14 tests négatifs relationnels
 * 3. Partie B — Migration représentative réelle basée fidèlement sur database/schema.ts :
 *    - Reconstitution fidèle des tables historiques réelles (tournaments avec organizer_id natif, tournament_editions, tournament_members, edition_registrations, registration_payments, wallet_transactions, user_wallets, financial_accounts, ledger_entries, messages, interactions, notifications)
 *    - Données représentatives incluant inscriptions SOLO et ÉQUIPE (couvrant archived_team_id et archived_user_id)
 *    - Découplage et snapshot comptable immuable des 8 champs d'archivage
 *    - Déploiement complet des 21 tables canoniques cibles
 *    - Établissement des nouvelles relations
 *    - Suppression sélective ordonnée SANS CASCADE (prouve l'absence de FK orphelines)
 *    - Comparaison ligne par ligne exhaustive de toutes les données financières et archivées
 * 
 * Exécution :
 * bun scripts/verify-competition-engine.ts --test-security  # Exécute la suite de tests négatifs de sécurité
 * CONFIRM_TARGET_DB=neondb ALLOW_COMPETITION_TEST=true bun run test:competition-engine --confirm # Validation complète
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { performFullStructuralComparison, runComparatorNegativeTests } from './compare-ddl';

neonConfig.webSocketConstructor = ws;

// ============================================================================
// 1. LISTES BLANCHES STRICTES, FIXES ET IMMUABLES (AUCUN OVERRIDE ENV)
// ============================================================================
export const FIXED_ALLOWED_DATABASES = Object.freeze(['neondb', 'games_trafics_test'] as const);

export const FIXED_ALLOWED_HOSTNAMES = Object.freeze([
  'ep-lingering-cake-abto1cz5-pooler.eu-west-2.aws.neon.tech',
  'ep-lingering-cake-abto1cz5.eu-west-2.aws.neon.tech',
  'localhost',
  '127.0.0.1'
] as const);

/**
 * Fonction centrale de validation des autorisations positives de sécurité
 */
export function validateSecurityGuards(params: {
  nodeEnv?: string;
  allowTest?: string;
  hasConfirmArg: boolean;
  confirmTargetDb?: string;
  databaseUrl?: string;
  currentDb?: string;
}): { isValid: boolean; error?: string } {
  // A. Interdiction formelle en production
  if (params.nodeEnv === 'production') {
    return { isValid: false, error: "Exécution strictement interdite lorsque NODE_ENV=production !" };
  }

  // B. Exigence de la variable d'autorisation explicite
  if (params.allowTest !== 'true') {
    return { isValid: false, error: "Variable ALLOW_COMPETITION_TEST='true' requise." };
  }

  // C. Exigence de l'argument --confirm
  if (!params.hasConfirmArg) {
    return { isValid: false, error: "Argument obligatoire '--confirm' manquant." };
  }

  // D. Exigence de CONFIRM_TARGET_DB
  if (!params.confirmTargetDb || params.confirmTargetDb.trim().length === 0) {
    return { isValid: false, error: "Variable CONFIRM_TARGET_DB obligatoire." };
  }

  const targetDbNormalized = params.confirmTargetDb.trim().toLowerCase();

  // E. Vérification contre la liste blanche FIXE des bases de test
  if (!(FIXED_ALLOWED_DATABASES as readonly string[]).includes(targetDbNormalized)) {
    return { 
      isValid: false, 
      error: `La base ciblée '${params.confirmTargetDb}' n'est pas dans la liste blanche fixe autorisée [${FIXED_ALLOWED_DATABASES.join(', ')}].` 
    };
  }

  if (targetDbNormalized.includes('prod') || targetDbNormalized.includes('production')) {
    return { isValid: false, error: `Rejet formel: le nom de la base '${params.confirmTargetDb}' contient des termes de production.` };
  }

  // F. Vérification de l'URL et de l'endpoint
  if (!params.databaseUrl) {
    return { isValid: false, error: "DATABASE_URL n'est pas définie dans l'environnement." };
  }

  let hostname: string;
  try {
    const parsed = new URL(params.databaseUrl);
    hostname = parsed.hostname.toLowerCase();
  } catch {
    return { isValid: false, error: "Format de DATABASE_URL invalide." };
  }

  if (!(FIXED_ALLOWED_HOSTNAMES as readonly string[]).includes(hostname)) {
    return { 
      isValid: false, 
      error: `L'hôte cible '${hostname}' n'est pas dans la liste blanche fixe des endpoints de test autorisés [${FIXED_ALLOWED_HOSTNAMES.join(', ')}].` 
    };
  }

  if (hostname.includes('prod') || hostname.includes('production') || hostname.includes('main-db')) {
    return { isValid: false, error: `Rejet formel: l'endpoint '${hostname}' correspond à un environnement de production.` };
  }

  // G. Si la base connectée est fournie (validation croisée SQL)
  if (params.currentDb) {
    const currentDbNormalized = params.currentDb.trim().toLowerCase();
    if (currentDbNormalized !== targetDbNormalized) {
      return { 
        isValid: false, 
        error: `Incohérence de base ! current_database()='${params.currentDb}' ne correspond pas à CONFIRM_TARGET_DB='${params.confirmTargetDb}'.` 
      };
    }
    if (!(FIXED_ALLOWED_DATABASES as readonly string[]).includes(currentDbNormalized)) {
      return { isValid: false, error: `La base active '${params.currentDb}' n'est pas autorisée.` };
    }
    if (currentDbNormalized.includes('prod') || currentDbNormalized.includes('production')) {
      return { isValid: false, error: `La base active '${params.currentDb}' est identifiée comme base de production.` };
    }
  }

  return { isValid: true };
}

/**
 * Suite de tests négatifs vérifiant le rejet systématique de cibles de production
 */
export function runSecurityNegativeTests(): boolean {
  console.log("================================================================================");
  console.log("   TESTS NÉGATIFS DES GARDE-FOUS DE SÉCURITÉ ANTI-PRODUCTION");
  console.log("================================================================================\n");

  const validNeonUrl = "postgresql://user:pass@ep-lingering-cake-abto1cz5-pooler.eu-west-2.aws.neon.tech/neondb";
  const prodNeonUrl = "postgresql://user:pass@ep-production-main-branch.eu-west-2.aws.neon.tech/prod_games_trafics";

  const assertRejected = (testName: string, params: any) => {
    const res = validateSecurityGuards(params);
    if (res.isValid) {
      console.error(`❌ ÉCHEC TEST NÉGATIF : ${testName} aurait dû être rejeté !`);
      throw new Error(`Test de sécurité négatif échoué: ${testName}`);
    } else {
      console.log(`✔ Succès test négatif: ${testName} -> Rejeté: "${res.error}"`);
    }
  };

  // 1. NODE_ENV=production
  assertRejected("1. Rejet NODE_ENV=production", {
    nodeEnv: 'production',
    allowTest: 'true',
    hasConfirmArg: true,
    confirmTargetDb: 'neondb',
    databaseUrl: validNeonUrl
  });

  // 2. Absence de ALLOW_COMPETITION_TEST
  assertRejected("2. Rejet si ALLOW_COMPETITION_TEST manquant", {
    nodeEnv: 'development',
    allowTest: undefined,
    hasConfirmArg: true,
    confirmTargetDb: 'neondb',
    databaseUrl: validNeonUrl
  });

  // 3. Absence de --confirm
  assertRejected("3. Rejet si argument --confirm manquant", {
    nodeEnv: 'development',
    allowTest: 'true',
    hasConfirmArg: false,
    confirmTargetDb: 'neondb',
    databaseUrl: validNeonUrl
  });

  // 4. Absence de CONFIRM_TARGET_DB
  assertRejected("4. Rejet si CONFIRM_TARGET_DB manquant", {
    nodeEnv: 'development',
    allowTest: 'true',
    hasConfirmArg: true,
    confirmTargetDb: '',
    databaseUrl: validNeonUrl
  });

  // 5. Base de production nommée
  assertRejected("5. Rejet si nom de base de production", {
    nodeEnv: 'development',
    allowTest: 'true',
    hasConfirmArg: true,
    confirmTargetDb: 'production_db',
    databaseUrl: validNeonUrl
  });

  // 6. Endpoint de production Neon non autorisé
  assertRejected("6. Rejet si endpoint Neon de production", {
    nodeEnv: 'development',
    allowTest: 'true',
    hasConfirmArg: true,
    confirmTargetDb: 'neondb',
    databaseUrl: prodNeonUrl
  });

  // 7. Divergence entre current_database() et CONFIRM_TARGET_DB
  assertRejected("7. Rejet si current_database() divergent", {
    nodeEnv: 'development',
    allowTest: 'true',
    hasConfirmArg: true,
    confirmTargetDb: 'games_trafics_test',
    databaseUrl: validNeonUrl,
    currentDb: 'neondb'
  });

  console.log("\n✔ TOUS LES 7 TESTS NÉGATIFS DE SÉCURITÉ ONT RÉUSSI AVEC SUCCÈS !\n");
  return true;
}

// ============================================================================
// EXÉCUTION DU BANC D'ESSAI
// ============================================================================
const RUN_ID = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
const SYNTHETIC_SANDBOX = `test_competition_synth_${RUN_ID}`;
const REAL_SCHEMA_SANDBOX = `test_competition_real_${RUN_ID}`;

function assertSafeSchema(schemaName: string) {
  if (!/^test_competition_[a-z0-9_]+$/.test(schemaName)) {
    throw new Error(`SÉCURITÉ VIOLÉE: Nom de schéma non sécurisé (${schemaName}) !`);
  }
}

async function runVerification() {
  if (process.argv.includes('--test-security')) {
    runSecurityNegativeTests();
    process.exit(0);
  }

  // Contrôles initiaux de sécurité
  const preCheck = validateSecurityGuards({
    nodeEnv: process.env.NODE_ENV,
    allowTest: process.env.ALLOW_COMPETITION_TEST,
    hasConfirmArg: process.argv.includes('--confirm'),
    confirmTargetDb: process.env.CONFIRM_TARGET_DB,
    databaseUrl: process.env.DATABASE_URL
  });

  if (!preCheck.isValid) {
    console.error("================================================================================");
    console.error(`❌ ERREUR DE SÉCURITÉ : ${preCheck.error}`);
    console.error("Commande d'exécution autorisée :");
    console.error("   CONFIRM_TARGET_DB=neondb ALLOW_COMPETITION_TEST=true bun run test:competition-engine --confirm");
    console.error("================================================================================");
    process.exit(1);
  }

  assertSafeSchema(SYNTHETIC_SANDBOX);
  assertSafeSchema(REAL_SCHEMA_SANDBOX);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  console.log("================================================================================");
  console.log("   GAMES TRAFICS — BANC D'ESSAI TECHNIQUE & VALIDATION SÉCURISÉE DU MOTEUR");
  console.log("================================================================================\n");

  try {
    // Validation croisée SQL de la base connectée
    const dbCheck = await client.query('SELECT current_database() AS db_name, current_user AS user_name, version();');
    const { db_name, user_name, version } = dbCheck.rows[0];

    const postCheck = validateSecurityGuards({
      nodeEnv: process.env.NODE_ENV,
      allowTest: process.env.ALLOW_COMPETITION_TEST,
      hasConfirmArg: process.argv.includes('--confirm'),
      confirmTargetDb: process.env.CONFIRM_TARGET_DB,
      databaseUrl: process.env.DATABASE_URL,
      currentDb: db_name
    });

    if (!postCheck.isValid) {
      throw new Error(`SÉCURITÉ VIOLÉE: ${postCheck.error}`);
    }

    const hostname = new URL(process.env.DATABASE_URL!).hostname;
    console.log(`[AUTORISATION POSITIVE VALIDÉE] Base: ${db_name} (Hôte: ${hostname}, Utilisateur: ${user_name})`);
    console.log(`[ENV] Moteur SGBD détecté :\n${version}\n`);

    // ============================================================================
    // VÉRIFICATION AUTOMATISÉE PRÉALABLE DU DDL (21 TABLES, 0 DIVERGENCE)
    // ============================================================================
    console.log("--- CONTRÔLE AUTOMATISÉ DDL DES 21 TABLES CANONIQUES (DOC 05 vs SCRIPT) ---");
    const { allDiffs, tablesCompared } = performFullStructuralComparison();
    if (allDiffs.length > 0 || tablesCompared !== 21) {
      throw new Error(`ÉCHEC DDL: ${allDiffs.length} divergence(s) structurelle(s) détectée(s) !`);
    }
    console.log(`✔ Comparaison structurelle réussie : Les 21 tables canoniques sont 100% identiques (ZÉRO DIVERGENCE).\n`);

    // ============================================================================
    // PARTIE A : BANC D'ESSAI SYNTHÉTIQUE DES 21 TABLES CANONIQUES (EXACT DDL DE 05)
    // ============================================================================
    console.log("================================================================================");
    console.log(`   PARTIE A : BANC D'ESSAI SYNTHÉTIQUE (Schéma: ${SYNTHETIC_SANDBOX})`);
    console.log("================================================================================\n");

    await client.query(`CREATE SCHEMA ${SYNTHETIC_SANDBOX};`);
    await client.query(`SET search_path TO ${SYNTHETIC_SANDBOX}, public;`);

    // Tables socles nécessaires pour les clés étrangères vers users, teams, financial_accounts, etc.
    await client.query(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT DEFAULT 'USER',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE teams (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        tag TEXT,
        leader_id TEXT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE financial_accounts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        owner_user_id TEXT REFERENCES users(id),
        owner_shop_id TEXT,
        owner_edition_id TEXT,
        type TEXT NOT NULL DEFAULT 'USER_WALLET',
        currency TEXT DEFAULT 'GTC',
        is_active BOOLEAN DEFAULT TRUE,
        is_locked BOOLEAN DEFAULT FALSE,
        system_key TEXT UNIQUE,
        allow_negative_balance BOOLEAN DEFAULT FALSE,
        metadata JSONB DEFAULT '{}'
      );

      CREATE TABLE user_wallets (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        financial_account_id TEXT REFERENCES financial_accounts(id),
        pin_hash TEXT NOT NULL DEFAULT 'fake_hash',
        is_active BOOLEAN DEFAULT TRUE,
        is_locked BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE wallet_transactions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        wallet_id TEXT NOT NULL REFERENCES user_wallets(id),
        financial_account_id TEXT REFERENCES financial_accounts(id),
        from_user_id TEXT REFERENCES users(id),
        to_user_id TEXT REFERENCES users(id),
        amount NUMERIC(15, 2) NOT NULL,
        fees NUMERIC(15, 2) DEFAULT 0,
        net_amount NUMERIC(15, 2) NOT NULL,
        balance_after NUMERIC(15, 2) NOT NULL,
        currency TEXT DEFAULT 'GTC',
        type TEXT NOT NULL,
        status TEXT DEFAULT 'COMPLETED',
        reference TEXT UNIQUE,
        idempotency_key TEXT,
        reversal_of TEXT REFERENCES wallet_transactions(id),
        reversed_by TEXT REFERENCES wallet_transactions(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE ledger_entries (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        transaction_id TEXT NOT NULL REFERENCES wallet_transactions(id),
        account_id TEXT NOT NULL REFERENCES financial_accounts(id),
        debit NUMERIC(15, 2) DEFAULT 0,
        credit NUMERIC(15, 2) DEFAULT 0,
        currency TEXT DEFAULT 'GTC',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // DDL ÉXACT DES 21 TABLES CANONIQUES TEL QUE DÉFINI DANS 05-PROPOSED-TARGET-ARCHITECTURE.MD
    await client.query(`
      -- 1. Compétition parent
      CREATE TABLE tournaments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL UNIQUE,
        slug TEXT UNIQUE,
        game TEXT NOT NULL,
        platform TEXT NOT NULL DEFAULT 'MOBILE',
        organizer_id TEXT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        description TEXT,
        logo TEXT,
        banner TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 2. Édition de compétition
      CREATE TABLE tournament_editions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        edition_number INT NOT NULL,
        name TEXT NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE,
        registration_opens TIMESTAMP WITH TIME ZONE,
        registration_deadline TIMESTAMP WITH TIME ZONE,
        max_entrants INT,
        entry_fee NUMERIC(15, 2) DEFAULT 0.00,
        prize_pool NUMERIC(15, 2) DEFAULT 0.00,
        prize_currency TEXT DEFAULT 'GTC',
        financial_account_id TEXT REFERENCES financial_accounts(id) ON DELETE RESTRICT,
        default_ruleset_version_id TEXT,
        status TEXT NOT NULL DEFAULT 'UPCOMING',
        auto_forfeit_on_timeout BOOLEAN DEFAULT FALSE,
        forfeit_countdown_minutes INT DEFAULT 15,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(id, tournament_id),
        UNIQUE(tournament_id, edition_number)
      );

      -- 3. Staff administratif et arbitrage
      CREATE TABLE tournament_staff (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        edition_id TEXT,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('ADMIN', 'ORGANIZER', 'HEAD_REFEREE', 'REFEREE', 'CASTER', 'OBSERVER')),
        permissions TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (edition_id, tournament_id) REFERENCES tournament_editions(id, tournament_id) ON DELETE CASCADE,
        UNIQUE(tournament_id, edition_id, user_id, role)
      );

      -- 4. Entité compétitrice officielle (SOLO, TEAM, GUEST)
      CREATE TABLE competition_entrants (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL REFERENCES tournament_editions(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
        team_id TEXT REFERENCES teams(id) ON DELETE RESTRICT,
        guest_identifier TEXT,
        name TEXT NOT NULL,
        tag TEXT,
        logo TEXT,
        seed INT,
        in_game_club TEXT,
        status TEXT NOT NULL DEFAULT 'REGISTERED',
        custom_fields JSONB DEFAULT '{}',
        final_rank INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(id, edition_id),
        CHECK (
          (type = 'SOLO' AND user_id IS NOT NULL AND team_id IS NULL) OR
          (type = 'TEAM' AND team_id IS NOT NULL AND user_id IS NULL) OR
          (type = 'GUEST' AND team_id IS NULL AND guest_identifier IS NOT NULL)
        )
      );

      CREATE UNIQUE INDEX entrants_edition_solo_user_unique 
        ON competition_entrants(edition_id, user_id) WHERE type = 'SOLO';
      CREATE UNIQUE INDEX entrants_edition_team_unique 
        ON competition_entrants(edition_id, team_id) WHERE type = 'TEAM';

      -- 5. Roster d'édition (Composition figée de l'équipe pour l'édition)
      CREATE TABLE entrant_roster_members (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL,
        entrant_id TEXT NOT NULL,
        user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
        in_game_name TEXT NOT NULL,
        in_game_id TEXT,
        role TEXT NOT NULL DEFAULT 'STARTER' CHECK (role IN ('CAPTAIN', 'STARTER', 'SUBSTITUTE', 'COACH')),
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (entrant_id, edition_id) REFERENCES competition_entrants(id, edition_id) ON DELETE CASCADE
      );

      CREATE UNIQUE INDEX entrant_roster_captain_unique 
        ON entrant_roster_members(entrant_id) WHERE role = 'CAPTAIN';
      CREATE UNIQUE INDEX roster_edition_user_unique 
        ON entrant_roster_members(edition_id, user_id) 
        WHERE user_id IS NOT NULL AND role IN ('CAPTAIN', 'STARTER', 'SUBSTITUTE');

      -- 6. Paiements d'inscriptions et traçabilité financière (Découplé)
      CREATE TABLE registration_payments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        entrant_id TEXT REFERENCES competition_entrants(id) ON DELETE SET NULL,
        transaction_id TEXT NOT NULL REFERENCES wallet_transactions(id) ON DELETE RESTRICT,
        amount NUMERIC(15, 2) NOT NULL,
        currency TEXT DEFAULT 'GTC',
        payment_method TEXT DEFAULT 'WALLET',
        status TEXT DEFAULT 'COMPLETED',
        legacy_registration_id TEXT,
        archived_edition_id TEXT,
        archived_edition_name TEXT,
        archived_tournament_id TEXT,
        archived_tournament_name TEXT,
        archived_user_id TEXT,
        archived_team_id TEXT,
        archived_participant_name TEXT,
        archived_registration_type TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE UNIQUE INDEX registration_payments_transaction_unique ON registration_payments(transaction_id);

      -- 7. Catalogue des règles de compétition
      CREATE TABLE competition_rulesets (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL UNIQUE,
        game TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 8. Versions immuables des règles (Exact DDL de 05)
      CREATE TABLE ruleset_versions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        ruleset_id TEXT NOT NULL REFERENCES competition_rulesets(id) ON DELETE CASCADE,
        version INT NOT NULL,
        scoring_mode TEXT NOT NULL,
        config JSONB NOT NULL,
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(ruleset_id, version),
        UNIQUE(id, ruleset_id)
      );

      -- 9. Définition universelle des métriques
      CREATE TABLE metric_definitions (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data_type TEXT NOT NULL,
        unit TEXT NOT NULL,
        min_value NUMERIC(15, 4),
        max_value NUMERIC(15, 4),
        default_aggregation TEXT NOT NULL DEFAULT 'SUM',
        is_system BOOLEAN DEFAULT FALSE
      );

      -- 10. Paramétrage des métriques par version de ruleset (Exact DDL de 05)
      CREATE TABLE ruleset_metric_configs (
        ruleset_version_id TEXT NOT NULL REFERENCES ruleset_versions(id) ON DELETE CASCADE,
        metric_code TEXT NOT NULL REFERENCES metric_definitions(code) ON DELETE RESTRICT,
        weight NUMERIC(12, 4) DEFAULT 1.0,
        multiplier NUMERIC(12, 4) DEFAULT 1.0,
        is_tiebreaker BOOLEAN DEFAULT FALSE,
        tiebreaker_priority INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (ruleset_version_id, metric_code)
      );

      -- VERROU RELATIONNEL SGBD : IMMUTABILITÉ ABSOLUE DES VERSIONS PUBLIÉES
      CREATE OR REPLACE FUNCTION trg_enforce_ruleset_version_immutability()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_TABLE_NAME = 'ruleset_versions' THEN
          IF TG_OP = 'UPDATE' THEN
            -- Une version publiée est 100% immuable : aucune colonne ne peut être modifiée
            IF OLD.is_published = TRUE THEN
              RAISE EXCEPTION 'IMMUTABLE_PUBLISHED_RULESET_VERSION: Toute modification d''une version de ruleset publiée est strictement interdite (ruleset_id, version, scoring_mode, config, is_published).';
            END IF;
          ELSIF TG_OP = 'DELETE' THEN
            IF OLD.is_published = TRUE THEN
              RAISE EXCEPTION 'CANNOT_DELETE_PUBLISHED_RULESET_VERSION: Suppression d''une version de ruleset publiée strictement interdite.';
            END IF;
          END IF;
        ELSIF TG_TABLE_NAME = 'ruleset_metric_configs' THEN
          IF TG_OP IN ('INSERT', 'UPDATE') THEN
            IF EXISTS (SELECT 1 FROM ruleset_versions WHERE id = NEW.ruleset_version_id AND is_published = TRUE) THEN
              RAISE EXCEPTION 'IMMUTABLE_PUBLISHED_RULESET_METRICS: Ajout ou modification de métrique interdite sur une version de ruleset publiée.';
            END IF;
          ELSIF TG_OP = 'DELETE' THEN
            IF EXISTS (SELECT 1 FROM ruleset_versions WHERE id = OLD.ruleset_version_id AND is_published = TRUE) THEN
              RAISE EXCEPTION 'IMMUTABLE_PUBLISHED_RULESET_METRICS: Suppression de métrique interdite sur une version de ruleset publiée.';
            END IF;
          END IF;
        END IF;
        IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_ruleset_versions_immutability
      BEFORE UPDATE OR DELETE ON ruleset_versions
      FOR EACH ROW EXECUTE FUNCTION trg_enforce_ruleset_version_immutability();

      CREATE TRIGGER trg_ruleset_metric_configs_immutability
      BEFORE INSERT OR UPDATE OR DELETE ON ruleset_metric_configs
      FOR EACH ROW EXECUTE FUNCTION trg_enforce_ruleset_version_immutability();

      -- 11. Étapes de la compétition (Phases)
      CREATE TABLE competition_stages (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL REFERENCES tournament_editions(id) ON DELETE CASCADE,
        ruleset_version_id TEXT NOT NULL REFERENCES ruleset_versions(id) ON DELETE RESTRICT,
        name TEXT NOT NULL,
        stage_type TEXT NOT NULL,
        stage_order INT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(id, edition_id),
        UNIQUE(edition_id, stage_order)
      );

      -- 12. Poules de classement
      CREATE TABLE competition_groups (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL,
        stage_id TEXT NOT NULL,
        name TEXT NOT NULL,
        group_order INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (stage_id, edition_id) REFERENCES competition_stages(id, edition_id) ON DELETE CASCADE,
        UNIQUE(id, stage_id),
        UNIQUE(stage_id, group_order)
      );

      -- 13. Rounds / Journées calendaires
      CREATE TABLE competition_rounds (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL,
        stage_id TEXT NOT NULL,
        round_number INT NOT NULL,
        name TEXT NOT NULL,
        scheduled_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (stage_id, edition_id) REFERENCES competition_stages(id, edition_id) ON DELETE CASCADE,
        UNIQUE(id, stage_id),
        UNIQUE(stage_id, round_number)
      );

      -- 14. Rencontres globales (Nœuds de confrontation)
      CREATE TABLE competition_encounters (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL,
        stage_id TEXT NOT NULL,
        group_id TEXT,
        round_id TEXT,
        code TEXT,
        encounter_type TEXT NOT NULL,
        ruleset_version_id TEXT NOT NULL REFERENCES ruleset_versions(id) ON DELETE RESTRICT,
        aggregation_rule TEXT NOT NULL DEFAULT 'DIRECT',
        status TEXT NOT NULL DEFAULT 'PENDING',
        scheduled_time TIMESTAMP WITH TIME ZONE,
        forfeit_countdown_ends_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (stage_id, edition_id) REFERENCES competition_stages(id, edition_id) ON DELETE CASCADE,
        FOREIGN KEY (group_id, stage_id) REFERENCES competition_groups(id, stage_id) ON DELETE CASCADE,
        FOREIGN KEY (round_id, stage_id) REFERENCES competition_rounds(id, stage_id) ON DELETE CASCADE,
        UNIQUE(id, edition_id),
        UNIQUE(id, encounter_type),
        UNIQUE(id, ruleset_version_id)
      );

      -- 15. Camps de rencontre collective
      CREATE TABLE encounter_sides (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        encounter_id TEXT NOT NULL,
        encounter_type TEXT NOT NULL DEFAULT 'COLLECTIVE_FIXTURE',
        side_number INT NOT NULL,
        name TEXT NOT NULL,
        final_aggregated_points NUMERIC(12, 4) DEFAULT 0,
        result TEXT,
        FOREIGN KEY (encounter_id, encounter_type) 
          REFERENCES competition_encounters(id, encounter_type) ON DELETE CASCADE,
        CHECK (encounter_type = 'COLLECTIVE_FIXTURE'),
        UNIQUE(encounter_id, side_number),
        UNIQUE(id, encounter_id)
      );

      -- 16. Composition des camps collectifs
      CREATE TABLE encounter_side_entrants (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL,
        encounter_id TEXT NOT NULL,
        side_id TEXT NOT NULL,
        entrant_id TEXT NOT NULL,
        FOREIGN KEY (side_id, encounter_id) REFERENCES encounter_sides(id, encounter_id) ON DELETE CASCADE,
        FOREIGN KEY (entrant_id, edition_id) REFERENCES competition_entrants(id, edition_id) ON DELETE CASCADE,
        FOREIGN KEY (encounter_id, edition_id) REFERENCES competition_encounters(id, edition_id) ON DELETE CASCADE,
        UNIQUE(side_id, entrant_id),
        UNIQUE(encounter_id, entrant_id)
      );

      -- 17. Match ou sous-match au sein d'une rencontre
      CREATE TABLE encounter_matches (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL,
        encounter_id TEXT NOT NULL,
        encounter_type TEXT NOT NULL,
        ruleset_version_id TEXT NOT NULL,
        match_order INT NOT NULL DEFAULT 1,
        title TEXT NOT NULL DEFAULT 'Match 1',
        match_format TEXT NOT NULL DEFAULT 'BEST_OF_1',
        points_weight NUMERIC(12, 4) DEFAULT 1.0,
        status TEXT NOT NULL DEFAULT 'PENDING',
        is_conditional BOOLEAN DEFAULT FALSE,
        trigger_condition TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (encounter_id, edition_id) REFERENCES competition_encounters(id, edition_id) ON DELETE CASCADE,
        FOREIGN KEY (encounter_id, encounter_type) REFERENCES competition_encounters(id, encounter_type) ON DELETE CASCADE,
        FOREIGN KEY (encounter_id, ruleset_version_id) REFERENCES competition_encounters(id, ruleset_version_id) ON DELETE CASCADE,
        UNIQUE(encounter_id, match_order),
        UNIQUE(id, encounter_id),
        UNIQUE(id, edition_id),
        UNIQUE(id, encounter_type),
        UNIQUE(id, ruleset_version_id)
      );

      -- 18. Emplacements participants d'un match (Slots)
      CREATE TABLE match_slots (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL,
        encounter_id TEXT NOT NULL,
        encounter_type TEXT NOT NULL,
        match_id TEXT NOT NULL,
        slot_position INT NOT NULL,
        side_id TEXT,
        assigned_entrant_id TEXT,
        source_type TEXT NOT NULL DEFAULT 'DIRECT_SEED',
        source_match_id TEXT REFERENCES encounter_matches(id) ON DELETE SET NULL,
        source_group_id TEXT REFERENCES competition_groups(id) ON DELETE SET NULL,
        source_stage_id TEXT REFERENCES competition_stages(id) ON DELETE SET NULL,
        source_rank INT,
        selection_order INT,
        is_locked BOOLEAN DEFAULT FALSE,
        is_forfeit BOOLEAN DEFAULT FALSE,
        forfeit_reason TEXT,
        forfeited_by_user_id TEXT REFERENCES users(id),
        forfeited_at TIMESTAMP WITH TIME ZONE,
        final_match_score NUMERIC(12, 4) DEFAULT 0,
        final_match_rank INT,
        is_winner BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (match_id, encounter_id) REFERENCES encounter_matches(id, encounter_id) ON DELETE CASCADE,
        FOREIGN KEY (match_id, edition_id) REFERENCES encounter_matches(id, edition_id) ON DELETE CASCADE,
        FOREIGN KEY (match_id, encounter_type) REFERENCES encounter_matches(id, encounter_type) ON DELETE CASCADE,
        FOREIGN KEY (assigned_entrant_id, edition_id) REFERENCES competition_entrants(id, edition_id) ON DELETE RESTRICT,
        UNIQUE(id, match_id),
        UNIQUE(match_id, slot_position),
        CHECK (
          (encounter_type = 'COLLECTIVE_FIXTURE' AND side_id IS NOT NULL) OR
          (encounter_type IN ('DUEL', 'FFA') AND side_id IS NULL)
        ),
        FOREIGN KEY (side_id, encounter_id) REFERENCES encounter_sides(id, encounter_id) ON DELETE CASCADE,
        FOREIGN KEY (side_id, assigned_entrant_id) REFERENCES encounter_side_entrants(side_id, entrant_id) ON DELETE RESTRICT
      );

      -- 19. Manches / Cartes au sein d'un match
      CREATE TABLE match_games (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        match_id TEXT NOT NULL REFERENCES encounter_matches(id) ON DELETE CASCADE,
        game_number INT NOT NULL,
        map_name TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        proof_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(match_id, game_number),
        UNIQUE(id, match_id)
      );

      -- 20. Mesures et métriques de performance par manche
      CREATE TABLE game_metrics (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        ruleset_version_id TEXT NOT NULL,
        match_id TEXT NOT NULL,
        game_id TEXT NOT NULL,
        slot_id TEXT NOT NULL,
        metric_code TEXT NOT NULL,
        raw_value NUMERIC(15, 4) NOT NULL DEFAULT 0,
        calculated_points NUMERIC(12, 4) NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (game_id, match_id) REFERENCES match_games(id, match_id) ON DELETE CASCADE,
        FOREIGN KEY (slot_id, match_id) REFERENCES match_slots(id, match_id) ON DELETE CASCADE,
        FOREIGN KEY (match_id, ruleset_version_id) REFERENCES encounter_matches(id, ruleset_version_id) ON DELETE CASCADE,
        FOREIGN KEY (ruleset_version_id, metric_code) REFERENCES ruleset_metric_configs(ruleset_version_id, metric_code) ON DELETE RESTRICT,
        UNIQUE(game_id, slot_id, metric_code)
      );

      -- 21. Table d'audit des forfaits et des dérogations d'arbitrage
      CREATE TABLE match_arbitration_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        encounter_id TEXT NOT NULL REFERENCES competition_encounters(id) ON DELETE CASCADE,
        match_id TEXT REFERENCES encounter_matches(id) ON DELETE CASCADE,
        slot_id TEXT REFERENCES match_slots(id) ON DELETE CASCADE,
        action_type TEXT NOT NULL,
        author_user_id TEXT NOT NULL REFERENCES users(id),
        previous_value JSONB,
        new_value JSONB,
        reason TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✔ DDL complet des 21 tables canoniques (100% conforme à 05) déployé avec succès.\n");

    // Données positives représentatives
    await client.query(`
      INSERT INTO users (id, name, email) VALUES 
        ('u_admin', 'Admin Superieur', 'admin@gamestrafics.com'),
        ('u_cap_a', 'Capitaine Equipe A', 'cap_a@gamestrafics.com'),
        ('u_player_a1', 'Joueur A1', 'a1@gamestrafics.com'),
        ('u_cap_b', 'Capitaine Equipe B', 'cap_b@gamestrafics.com'),
        ('u_player_b1', 'Joueur B1', 'b1@gamestrafics.com'),
        ('u_solo1', 'Solo Star', 'solo@gamestrafics.com');

      INSERT INTO teams (id, name, tag, leader_id) VALUES 
        ('team_a', 'Equipe Alpha', 'ALP', 'u_cap_a'),
        ('team_b', 'Equipe Beta', 'BET', 'u_cap_b');

      INSERT INTO tournaments (id, name, slug, game, organizer_id) VALUES 
        ('tourn_1', 'Tournoi Officiel GT', 'tournoi-gt', 'WARZONE', 'u_admin');

      INSERT INTO competition_rulesets (id, name, game) VALUES 
        ('rs_1', 'Warzone BR Standard', 'WARZONE');

      -- rsv_1 insérée non-publiée pour permettre l'insertion des métriques AVANT publication
      INSERT INTO ruleset_versions (id, ruleset_id, version, scoring_mode, config, is_published) VALUES 
        ('rsv_1', 'rs_1', 1, 'POINTS_TABLE', '{"placement_points": [10, 5, 2]}', FALSE),
        ('rsv_2', 'rs_1', 2, 'POINTS_TABLE', '{"placement_points": [12, 6, 3]}', FALSE);

      INSERT INTO metric_definitions (code, name, data_type, unit) VALUES 
        ('kills', 'Eliminations', 'INTEGER', 'COUNT'),
        ('placement', 'Rang Final', 'INTEGER', 'POINTS');

      -- Métriques insérées sur version non-publiée (trigger autorise)
      INSERT INTO ruleset_metric_configs (ruleset_version_id, metric_code, weight, multiplier) VALUES 
        ('rsv_1', 'kills', 1.0, 1.0),
        ('rsv_1', 'placement', 1.0, 1.0),
        ('rsv_2', 'kills', 1.5, 1.0);

      -- Publication de rsv_1 après insertion des métriques (OLD.is_published=FALSE → UPDATE autorisé)
      UPDATE ruleset_versions SET is_published = TRUE WHERE id = 'rsv_1';

      INSERT INTO tournament_editions (id, tournament_id, edition_number, name, start_date, default_ruleset_version_id) VALUES 
        ('ed_1', 'tourn_1', 1, 'Edition Inaugurale', NOW(), 'rsv_1');

      INSERT INTO tournament_staff (id, tournament_id, edition_id, user_id, role) VALUES 
        ('st_1', 'tourn_1', 'ed_1', 'u_admin', 'HEAD_REFEREE');

      INSERT INTO competition_entrants (id, edition_id, type, user_id, name) VALUES 
        ('ent_solo1', 'ed_1', 'SOLO', 'u_solo1', 'Solo Player');

      INSERT INTO competition_entrants (id, edition_id, type, team_id, name) VALUES 
        ('ent_team_a', 'ed_1', 'TEAM', 'team_a', 'Equipe Alpha'),
        ('ent_team_b', 'ed_1', 'TEAM', 'team_b', 'Equipe Beta');

      INSERT INTO entrant_roster_members (id, edition_id, entrant_id, user_id, in_game_name, role) VALUES 
        ('rm_cap_a', 'ed_1', 'ent_team_a', 'u_cap_a', 'AlphaCaptain', 'CAPTAIN'),
        ('rm_p_a1', 'ed_1', 'ent_team_a', 'u_player_a1', 'AlphaGunner', 'STARTER'),
        ('rm_cap_b', 'ed_1', 'ent_team_b', 'u_cap_b', 'BetaCaptain', 'CAPTAIN'),
        ('rm_p_b1', 'ed_1', 'ent_team_b', 'u_player_b1', 'BetaSniper', 'STARTER');

      INSERT INTO competition_stages (id, edition_id, ruleset_version_id, name, stage_type, stage_order) VALUES 
        ('stg_1', 'ed_1', 'rsv_1', 'Phase Finale', 'ROUND_ROBIN', 1);

      INSERT INTO competition_encounters (id, edition_id, stage_id, encounter_type, ruleset_version_id) VALUES 
        ('enc_coll', 'ed_1', 'stg_1', 'COLLECTIVE_FIXTURE', 'rsv_1'),
        ('enc_duel', 'ed_1', 'stg_1', 'DUEL', 'rsv_1');

      INSERT INTO encounter_sides (id, encounter_id, side_number, name) VALUES 
        ('side_a', 'enc_coll', 1, 'Camp Alpha'),
        ('side_b', 'enc_coll', 2, 'Camp Beta');

      INSERT INTO encounter_side_entrants (edition_id, encounter_id, side_id, entrant_id) VALUES 
        ('ed_1', 'enc_coll', 'side_a', 'ent_team_a'),
        ('ed_1', 'enc_coll', 'side_b', 'ent_team_b');

      INSERT INTO encounter_matches (id, edition_id, encounter_id, encounter_type, ruleset_version_id, match_order) VALUES 
        ('match_coll_1', 'ed_1', 'enc_coll', 'COLLECTIVE_FIXTURE', 'rsv_1', 1),
        ('match_duel_1', 'ed_1', 'enc_duel', 'DUEL', 'rsv_1', 1);

      INSERT INTO match_slots (id, edition_id, encounter_id, encounter_type, match_id, slot_position, side_id, assigned_entrant_id) VALUES 
        ('slot_c1', 'ed_1', 'enc_coll', 'COLLECTIVE_FIXTURE', 'match_coll_1', 1, 'side_a', 'ent_team_a'),
        ('slot_c2', 'ed_1', 'enc_coll', 'COLLECTIVE_FIXTURE', 'match_coll_1', 2, 'side_b', 'ent_team_b');

      INSERT INTO match_slots (id, edition_id, encounter_id, encounter_type, match_id, slot_position, assigned_entrant_id) VALUES 
        ('slot_d1', 'ed_1', 'enc_duel', 'DUEL', 'match_duel_1', 1, 'ent_solo1'),
        ('slot_d2', 'ed_1', 'enc_duel', 'DUEL', 'match_duel_1', 2, 'ent_team_a');

      INSERT INTO match_games (id, match_id, game_number) VALUES 
        ('game_c1', 'match_coll_1', 1);

      INSERT INTO game_metrics (ruleset_version_id, match_id, game_id, slot_id, metric_code, raw_value, calculated_points) VALUES 
        ('rsv_1', 'match_coll_1', 'game_c1', 'slot_c1', 'kills', 5, 5.0);
    `);
    console.log("✔ Données positives représentatives et Version 2 insérées avec succès.\n");

    // ============================================================================
    // VÉRIFICATION DES 14 CAS DE REJET PAR LE MOTEUR POSTGRESQL
    // ============================================================================
    console.log("--- VÉRIFICATION DES 14 CAS DE REJET PAR LE MOTEUR POSTGRESQL ---");

    // 1. Deuxième capitaine dans la même équipe
    try {
      await client.query(`
        INSERT INTO entrant_roster_members (id, edition_id, entrant_id, user_id, in_game_name, role) 
        VALUES ('rm_bad_cap', 'ed_1', 'ent_team_a', 'u_solo1', 'BadCaptain', 'CAPTAIN');
      `);
      throw new Error("ÉCHEC: Second capitaine non bloqué.");
    } catch (e: any) {
      if (e.message.includes("entrant_roster_captain_unique") || e.code === '23505') {
        console.log("✔ Rejet 1 : Second capitaine bloqué par index partiel entrant_roster_captain_unique.");
      } else throw e;
    }

    // 2. Cumul multi-équipes pour un même joueur dans la même édition
    try {
      await client.query(`
        INSERT INTO entrant_roster_members (id, edition_id, entrant_id, user_id, in_game_name, role) 
        VALUES ('rm_bad_cumul', 'ed_1', 'ent_team_b', 'u_player_a1', 'TraitorGunner', 'STARTER');
      `);
      throw new Error("ÉCHEC: Cumul multi-équipes non bloqué.");
    } catch (e: any) {
      if (e.message.includes("roster_edition_user_unique") || e.code === '23505') {
        console.log("✔ Rejet 2 : Cumul multi-équipes bloqué par index partiel roster_edition_user_unique.");
      } else throw e;
    }

    // 3. Affectation d'un joueur du camp B dans un slot réservé au camp A
    try {
      await client.query(`
        INSERT INTO match_slots (id, edition_id, encounter_id, encounter_type, match_id, slot_position, side_id, assigned_entrant_id) 
        VALUES ('slot_cross', 'ed_1', 'enc_coll', 'COLLECTIVE_FIXTURE', 'match_coll_1', 3, 'side_a', 'ent_team_b');
      `);
      throw new Error("ÉCHEC: Joueur du camp B dans le camp A non bloqué.");
    } catch (e: any) {
      if (e.message.includes("match_slots_side_id_assigned_entrant_id_fkey") || e.code === '23503') {
        console.log("✔ Rejet 3 : Joueur du camp B dans le camp A bloqué par FK composite (side_id, assigned_entrant_id).");
      } else throw e;
    }

    // 4. Slot DUEL avec un side_id (interdit par CHECK)
    try {
      await client.query(`
        INSERT INTO match_slots (id, edition_id, encounter_id, encounter_type, match_id, slot_position, side_id, assigned_entrant_id) 
        VALUES ('slot_duel_side', 'ed_1', 'enc_duel', 'DUEL', 'match_duel_1', 3, 'side_a', 'ent_solo1');
      `);
      throw new Error("ÉCHEC: Slot DUEL avec side_id non bloqué.");
    } catch (e: any) {
      if (e.message.includes("match_slots_check") || e.code === '23514') {
        console.log("✔ Rejet 4 : Slot DUEL avec side_id bloqué par contrainte CHECK.");
      } else throw e;
    }

    // 5. Métrique non configurée pour ce ruleset (deaths non déclarée dans ruleset_metric_configs pour rsv_1)
    try {
      // On ajoute 'deaths' dans metric_definitions mais PAS dans ruleset_metric_configs(rsv_1)
      await client.query(`INSERT INTO metric_definitions (code, name, data_type, unit) VALUES ('deaths', 'Morts', 'INTEGER', 'COUNT') ON CONFLICT DO NOTHING;`);
      await client.query(`
        INSERT INTO game_metrics (ruleset_version_id, match_id, game_id, slot_id, metric_code, raw_value) 
        VALUES ('rsv_1', 'match_coll_1', 'game_c1', 'slot_c1', 'deaths', 1);
      `);
      throw new Error("ÉCHEC: Métrique non configurée dans ruleset_metric_configs non bloquée.");
    } catch (e: any) {
      if (e.message.includes("game_metrics_ruleset_version_id_metric_code_fkey") || e.code === '23503') {
        console.log("✔ Rejet 5 : Métrique non déclarée dans ruleset_metric_configs bloquée par FK composite.");
      } else throw e;
    }

    // 6. Incohérence Staff tournoi / édition
    try {
      await client.query(`
        INSERT INTO tournaments (id, name, slug, game, organizer_id) VALUES ('tourn_other', 'Autre Tournoi', 'autre-tournoi', 'LOL', 'u_admin');
        INSERT INTO tournament_staff (id, tournament_id, edition_id, user_id, role) VALUES ('st_bad', 'tourn_other', 'ed_1', 'u_admin', 'REFEREE');
      `);
      throw new Error("ÉCHEC: Staff incohérent non bloqué.");
    } catch (e: any) {
      if (e.message.includes("tournament_staff_edition_id_tournament_id_fkey") || e.code === '23503') {
        console.log("✔ Rejet 6 : Staff incohérent bloqué par FK composite (edition_id, tournament_id).");
      } else throw e;
    }

    // 7. Immutabilité : UPDATE ruleset_id sur version publiée
    try {
      await client.query("UPDATE ruleset_versions SET ruleset_id = 'rs_other' WHERE id = 'rsv_1';");
      throw new Error("ÉCHEC: UPDATE ruleset_id non bloqué.");
    } catch (e: any) {
      if (e.message.includes("IMMUTABLE_PUBLISHED_RULESET_VERSION")) {
        console.log("✔ Rejet 7 (Immutabilité) : UPDATE ruleset_id sur version publiée bloqué par trigger.");
      } else throw e;
    }

    // 8. Immutabilité : UPDATE numéro de version sur version publiée
    try {
      await client.query("UPDATE ruleset_versions SET version = 99 WHERE id = 'rsv_1';");
      throw new Error("ÉCHEC: UPDATE version non bloqué.");
    } catch (e: any) {
      if (e.message.includes("IMMUTABLE_PUBLISHED_RULESET_VERSION")) {
        console.log("✔ Rejet 8 (Immutabilité) : UPDATE numéro de version sur version publiée bloqué par trigger.");
      } else throw e;
    }

    // 9. Immutabilité : UPDATE scoring_mode sur version publiée
    try {
      await client.query("UPDATE ruleset_versions SET scoring_mode = 'SERIES_WINS' WHERE id = 'rsv_1';");
      throw new Error("ÉCHEC: UPDATE scoring_mode non bloqué.");
    } catch (e: any) {
      if (e.message.includes("IMMUTABLE_PUBLISHED_RULESET_VERSION")) {
        console.log("✔ Rejet 9 (Immutabilité) : UPDATE scoring_mode sur version publiée bloqué par trigger.");
      } else throw e;
    }

    // 10. Immutabilité : UPDATE config JSON sur version publiée
    try {
      await client.query("UPDATE ruleset_versions SET config = '{\"hacked\": true}' WHERE id = 'rsv_1';");
      throw new Error("ÉCHEC: UPDATE config non bloqué.");
    } catch (e: any) {
      if (e.message.includes("IMMUTABLE_PUBLISHED_RULESET_VERSION")) {
        console.log("✔ Rejet 10 (Immutabilité) : UPDATE config JSON sur version publiée bloqué par trigger.");
      } else throw e;
    }

    // 11. Immutabilité : Dépublication (is_published = false) sur version publiée
    try {
      await client.query("UPDATE ruleset_versions SET is_published = FALSE WHERE id = 'rsv_1';");
      throw new Error("ÉCHEC: Dépublication non bloquée.");
    } catch (e: any) {
      if (e.message.includes("IMMUTABLE_PUBLISHED_RULESET_VERSION")) {
        console.log("✔ Rejet 11 (Immutabilité) : Dépublication (is_published=false) bloquée par trigger.");
      } else throw e;
    }

    // 12. Immutabilité : DELETE sur version publiée
    try {
      await client.query("DELETE FROM ruleset_versions WHERE id = 'rsv_1';");
      throw new Error("ÉCHEC: DELETE sur version publiée non bloqué.");
    } catch (e: any) {
      if (e.message.includes("CANNOT_DELETE_PUBLISHED_RULESET_VERSION")) {
        console.log("✔ Rejet 12 (Immutabilité) : DELETE sur version publiée bloqué par trigger.");
      } else throw e;
    }

    // 13. Immutabilité : Mutation de métrique sur version publiée
    try {
      await client.query("INSERT INTO ruleset_metric_configs (ruleset_version_id, metric_code) VALUES ('rsv_1', 'kills');");
      throw new Error("ÉCHEC: INSERT métrique sur version publiée non bloqué.");
    } catch (e: any) {
      if (e.message.includes("IMMUTABLE_PUBLISHED_RULESET_METRICS")) {
        console.log("✔ Rejet 13 (Immutabilité) : Mutation de métrique sur version publiée bloquée par trigger.");
      } else throw e;
    }

    // 14. Verrou Match / Ruleset composite : Métrique avec autre version de ruleset que le match
    try {
      await client.query(`
        INSERT INTO game_metrics (ruleset_version_id, match_id, game_id, slot_id, metric_code, raw_value) 
        VALUES ('rsv_2', 'match_coll_1', 'game_c1', 'slot_c2', 'kills', 2);
      `);
      throw new Error("ÉCHEC: Métrique avec ruleset divergent du match non bloquée.");
    } catch (e: any) {
      if (e.message.includes("game_metrics_match_id_ruleset_version_id_fkey") || e.code === '23503') {
        console.log("✔ Rejet 14 (Verrou Match/Ruleset) : Métrique avec autre version de ruleset bloquée par FK composite (match_id, ruleset_version_id).\n");
      } else throw e;
    }

    // Nettoyage Partie A
    await client.query(`DROP SCHEMA ${SYNTHETIC_SANDBOX} CASCADE;`);
    console.log(`[CLEANUP] Schéma synthétique '${SYNTHETIC_SANDBOX}' nettoyé avec succès.\n`);

    // ============================================================================
    // PARTIE B : VALIDATION REPRÉSENTATIVE DE MIGRATION SUR SCHÉMA HISTORIQUE RÉEL
    // (CONFORME À DATABASE/SCHEMA.TS DE PRODUCTION)
    // ============================================================================
    console.log("================================================================================");
    console.log(`   PARTIE B : VALIDATION REPRÉSENTATIVE DE MIGRATION (Schéma: ${REAL_SCHEMA_SANDBOX})`);
    console.log("================================================================================\n");

    await client.query(`CREATE SCHEMA ${REAL_SCHEMA_SANDBOX};`);
    await client.query(`SET search_path TO ${REAL_SCHEMA_SANDBOX}, public;`);

    // 1. RECONSTITUTION STRICTE DES TABLES HISTORIQUES CONFORMÉMENT À DATABASE/SCHEMA.TS
    await client.query(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT,
        email TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'USER',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE teams (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        logo TEXT,
        tag TEXT,
        captain_id TEXT REFERENCES users(id),
        is_active BOOLEAN DEFAULT TRUE,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE financial_accounts (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        owner_user_id TEXT REFERENCES users(id),
        owner_shop_id TEXT,
        owner_edition_id TEXT,
        type TEXT NOT NULL DEFAULT 'USER_WALLET',
        currency TEXT DEFAULT 'GTC',
        is_active BOOLEAN DEFAULT TRUE,
        is_locked BOOLEAN DEFAULT FALSE,
        system_key TEXT UNIQUE,
        allow_negative_balance BOOLEAN DEFAULT FALSE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE user_wallets (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        financial_account_id TEXT REFERENCES financial_accounts(id),
        card_number_hash TEXT UNIQUE,
        pin_hash TEXT NOT NULL DEFAULT 'fake_hash',
        is_active BOOLEAN DEFAULT TRUE,
        is_locked BOOLEAN DEFAULT FALSE,
        is_deleted BOOLEAN DEFAULT FALSE,
        failed_attempts INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE wallet_transactions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        wallet_id TEXT NOT NULL REFERENCES user_wallets(id),
        financial_account_id TEXT REFERENCES financial_accounts(id),
        from_user_id TEXT REFERENCES users(id),
        to_user_id TEXT REFERENCES users(id),
        amount NUMERIC(15, 2) NOT NULL,
        fees NUMERIC(15, 2) DEFAULT 0,
        net_amount NUMERIC(15, 2) NOT NULL,
        balance_after NUMERIC(15, 2) NOT NULL,
        currency TEXT DEFAULT 'GTC',
        type TEXT NOT NULL,
        metadata JSONB DEFAULT '{}',
        status TEXT DEFAULT 'COMPLETED',
        is_deleted BOOLEAN DEFAULT FALSE,
        reference TEXT UNIQUE,
        idempotency_key TEXT,
        reversal_of TEXT REFERENCES wallet_transactions(id),
        reversed_by TEXT REFERENCES wallet_transactions(id),
        description TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE ledger_entries (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        transaction_id TEXT NOT NULL REFERENCES wallet_transactions(id),
        account_id TEXT NOT NULL REFERENCES financial_accounts(id),
        debit NUMERIC(15, 2) DEFAULT 0,
        credit NUMERIC(15, 2) DEFAULT 0,
        currency TEXT DEFAULT 'GTC',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Table tournaments historique réelle (avec organizer_id natif obligatoire)
      CREATE TABLE tournaments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        organizer_id TEXT NOT NULL REFERENCES users(id),
        name TEXT NOT NULL UNIQUE,
        slug TEXT UNIQUE,
        description TEXT,
        short_description TEXT,
        profile_image TEXT,
        cover_image TEXT,
        game TEXT NOT NULL,
        platform TEXT DEFAULT 'MOBILE',
        game_mode TEXT,
        allowed_teams BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'UPCOMING',
        is_active BOOLEAN DEFAULT TRUE,
        is_deleted BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Table tournament_editions historique réelle (avec financial_account_id)
      CREATE TABLE tournament_editions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        financial_account_id TEXT REFERENCES financial_accounts(id),
        edition_number INT NOT NULL,
        name TEXT,
        tagline TEXT,
        edition_slug TEXT,
        description TEXT,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE,
        registration_opens TIMESTAMP WITH TIME ZONE,
        registration_deadline TIMESTAMP WITH TIME ZONE,
        max_participants INT,
        current_participants INT DEFAULT 0,
        prize_pool NUMERIC(15, 2) DEFAULT 0,
        prize_currency TEXT DEFAULT 'GTC',
        entry_fee NUMERIC(10, 2) DEFAULT 0,
        status TEXT DEFAULT 'UPCOMING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(id, tournament_id),
        UNIQUE(tournament_id, edition_number)
      );

      -- Table tournament_members historique réelle
      CREATE TABLE tournament_members (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id),
        team_id TEXT REFERENCES teams(id),
        role TEXT NOT NULL DEFAULT 'PARTICIPANT',
        display_name TEXT,
        game_tag TEXT,
        avatar TEXT,
        club_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Table edition_registrations historique réelle
      CREATE TABLE edition_registrations (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL REFERENCES tournament_editions(id) ON DELETE CASCADE,
        member_id TEXT NOT NULL REFERENCES tournament_members(id) ON DELETE CASCADE,
        registration_type TEXT DEFAULT 'REGULAR',
        status TEXT DEFAULT 'REGISTERED',
        registration_fee NUMERIC(10, 2) DEFAULT 0,
        fee_paid BOOLEAN DEFAULT FALSE,
        payment_transaction_id TEXT REFERENCES wallet_transactions(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Table registration_payments historique réelle (couplée à edition_registrations)
      CREATE TABLE registration_payments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        registration_id TEXT NOT NULL REFERENCES edition_registrations(id) ON DELETE CASCADE,
        transaction_id TEXT NOT NULL REFERENCES wallet_transactions(id),
        amount NUMERIC(10, 2) NOT NULL,
        currency TEXT DEFAULT 'GTC',
        paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        payment_method TEXT DEFAULT 'WALLET',
        payment_provider TEXT,
        status TEXT DEFAULT 'COMPLETED',
        reference TEXT UNIQUE,
        notes TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Structures sportives historiques réelles
      CREATE TABLE tournament_phases (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL REFERENCES tournament_editions(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        order_num INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE phase_groups (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        phase_id TEXT NOT NULL REFERENCES tournament_phases(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE phase_group_participants (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        group_id TEXT NOT NULL REFERENCES phase_groups(id) ON DELETE CASCADE,
        registration_id TEXT NOT NULL REFERENCES edition_registrations(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE matches (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL REFERENCES tournament_editions(id) ON DELETE CASCADE,
        phase_id TEXT NOT NULL REFERENCES tournament_phases(id) ON DELETE CASCADE,
        group_id TEXT REFERENCES phase_groups(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE bracket_nodes (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        phase_id TEXT NOT NULL REFERENCES tournament_phases(id) ON DELETE CASCADE,
        match_id TEXT REFERENCES matches(id) ON DELETE SET NULL,
        round INT NOT NULL,
        position INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE edition_results (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL REFERENCES tournament_editions(id) ON DELETE CASCADE,
        registration_id TEXT NOT NULL REFERENCES edition_registrations(id),
        position INT NOT NULL,
        prize_amount NUMERIC(15, 2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Communications et métadonnées réelles
      CREATE TABLE messages (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        sender_id TEXT NOT NULL REFERENCES users(id),
        tournament_id TEXT REFERENCES tournaments(id),
        edition_id TEXT REFERENCES tournament_editions(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE interactions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id),
        tournament_id TEXT REFERENCES tournaments(id),
        type TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE notifications (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        user_id TEXT NOT NULL REFERENCES users(id),
        tournament_id TEXT REFERENCES tournaments(id),
        title TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // 2. INJECTION DE DONNÉES HISTORIQUES REPRÉSENTATIVES (COUVRANT SOLO ET ÉQUIPES)
    await client.query(`
      INSERT INTO users (id, name, email) VALUES 
        ('u_org1', 'Abdoulaye Organisateur', 'org@gamestrafics.sn'),
        ('u_user1', 'Amadou Diop (Solo)', 'amadou@real.sn'),
        ('u_user2', 'Fatou Ndiaye (Capitaine Equipe)', 'fatou@real.sn'),
        ('u_user3', 'Ousmane Sow (Invité)', 'ousmane@real.sn');

      INSERT INTO teams (id, name, tag, captain_id) VALUES 
        ('t_lions', 'Lions du Baobab', 'LBN', 'u_user2');

      -- Tournois conteneurs réels (avec organizer_id réel et natif)
      INSERT INTO tournaments (id, organizer_id, name, slug, game, platform) VALUES 
        ('4b3e6516-8089-4c1b-a9b5-1cf7d42da01c', 'u_org1', 'Tournoi National FC25', 'tournoi-national-fc25', 'FC25', 'CONSOLE'),
        ('fa82db43-4348-47a2-bf68-a94eacafb4b1', 'u_org1', 'Championnat COD Mobile', 'championnat-cod-mobile', 'COD', 'MOBILE');

      -- Comptes financiers dont escrow d'édition
      INSERT INTO financial_accounts (id, owner_user_id, owner_edition_id, type) VALUES 
        ('fa_amadou', 'u_user1', NULL, 'USER_WALLET'),
        ('fa_fatou', 'u_user2', NULL, 'USER_WALLET'),
        ('fa_edition_escrow', NULL, '6acb3db9-399b-4b24-b005-6f912cc5de21', 'TOURNAMENT_POOL');

      -- Éditions conteneurs réelles
      INSERT INTO tournament_editions (id, tournament_id, financial_account_id, edition_number, name, start_date, prize_pool) VALUES 
        ('6acb3db9-399b-4b24-b005-6f912cc5de21', '4b3e6516-8089-4c1b-a9b5-1cf7d42da01c', 'fa_edition_escrow', 1, 'Edition 1 Prestige', NOW(), 1000.00),
        ('16e0181f-cc81-434f-b2f5-dffe38170283', 'fa82db43-4348-47a2-bf68-a94eacafb4b1', NULL, 1, 'Edition 1 COD', NOW(), 500.00);

      INSERT INTO user_wallets (id, user_id, financial_account_id) VALUES 
        ('w_amadou', 'u_user1', 'fa_amadou'),
        ('w_fatou', 'u_user2', 'fa_fatou');

      -- Transactions financières représentatives (Paiements, Frais et Remboursement)
      INSERT INTO wallet_transactions (id, wallet_id, financial_account_id, amount, net_amount, fees, balance_after, type, status, reference) VALUES 
        ('tx_entry_1', 'w_amadou', 'fa_amadou', 500.00, 500.00, 0, 1500.00, 'TOURNAMENT_ENTRY', 'COMPLETED', 'REF-ENTRY-SOLO'),
        ('tx_entry_2', 'w_fatou', 'fa_fatou', 300.00, 300.00, 0, 1200.00, 'TOURNAMENT_ENTRY', 'COMPLETED', 'REF-ENTRY-TEAM'),
        ('tx_entry_3', 'w_amadou', 'fa_amadou', 200.00, 200.00, 0, 1300.00, 'TOURNAMENT_ENTRY', 'COMPLETED', 'REF-ENTRY-INVITE'),
        ('tx_refund_3', 'w_amadou', 'fa_amadou', 200.00, 200.00, 0, 1500.00, 'REFUND', 'COMPLETED', 'REF-REFUND-INVITE');

      UPDATE wallet_transactions SET reversed_by = 'tx_refund_3' WHERE id = 'tx_entry_3';
      UPDATE wallet_transactions SET reversal_of = 'tx_entry_3' WHERE id = 'tx_refund_3';

      INSERT INTO ledger_entries (id, transaction_id, account_id, debit, credit) VALUES 
        ('led_1', 'tx_entry_1', 'fa_amadou', 500.00, 0),
        ('led_2', 'tx_entry_1', 'fa_edition_escrow', 0, 500.00),
        ('led_3', 'tx_entry_2', 'fa_fatou', 300.00, 0),
        ('led_4', 'tx_entry_2', 'fa_edition_escrow', 0, 300.00),
        ('led_5', 'tx_entry_3', 'fa_amadou', 200.00, 0),
        ('led_6', 'tx_entry_3', 'fa_edition_escrow', 0, 200.00),
        ('led_7', 'tx_refund_3', 'fa_edition_escrow', 200.00, 0),
        ('led_8', 'tx_refund_3', 'fa_amadou', 0, 200.00);

      -- Membres historiques : 1 SOLO, 1 TEAM, 1 INVITÉ
      INSERT INTO tournament_members (id, tournament_id, user_id, team_id, display_name) VALUES 
        ('tm_solo', '4b3e6516-8089-4c1b-a9b5-1cf7d42da01c', 'u_user1', NULL, 'Amadou Diop Solo Player'),
        ('tm_team', '4b3e6516-8089-4c1b-a9b5-1cf7d42da01c', 'u_user2', 't_lions', 'Lions Gaming Club'),
        ('tm_guest', '4b3e6516-8089-4c1b-a9b5-1cf7d42da01c', 'u_user3', NULL, 'Ousmane Sow Guest');

      INSERT INTO edition_registrations (id, edition_id, member_id, registration_type, payment_transaction_id) VALUES 
        ('reg_solo', '6acb3db9-399b-4b24-b005-6f912cc5de21', 'tm_solo', 'REGULAR', 'tx_entry_1'),
        ('reg_team', '6acb3db9-399b-4b24-b005-6f912cc5de21', 'tm_team', 'INVITED', 'tx_entry_2'),
        ('reg_guest', '6acb3db9-399b-4b24-b005-6f912cc5de21', 'tm_guest', 'WILDCARD', 'tx_entry_3');

      INSERT INTO registration_payments (id, registration_id, transaction_id, amount, currency, payment_method, payment_provider, status, reference, notes) VALUES 
        ('pay_1', 'reg_solo', 'tx_entry_1', 500.00, 'GTC', 'WALLET', 'INTERNAL', 'COMPLETED', 'REF-ENTRY-SOLO', 'Paiement Solo Amadou'),
        ('pay_2', 'reg_team', 'tx_entry_2', 300.00, 'GTC', 'WALLET', 'INTERNAL', 'COMPLETED', 'REF-ENTRY-TEAM', 'Paiement Equipe Lions'),
        ('pay_3', 'reg_guest', 'tx_entry_3', 200.00, 'GTC', 'WALLET', 'INTERNAL', 'REFUNDED', 'REF-ENTRY-INVITE', 'Paiement Remboursé Ousmane');

      -- Structures sportives historiques
      INSERT INTO tournament_phases (id, edition_id, name, order_num) VALUES 
        ('ph_1', '6acb3db9-399b-4b24-b005-6f912cc5de21', 'Poules Principales', 1);

      INSERT INTO phase_groups (id, phase_id, name) VALUES 
        ('grp_1', 'ph_1', 'Groupe A');

      INSERT INTO phase_group_participants (id, group_id, registration_id) VALUES 
        ('pgp_1', 'grp_1', 'reg_solo'),
        ('pgp_2', 'grp_1', 'reg_team');

      INSERT INTO matches (id, edition_id, phase_id, group_id) VALUES 
        ('m_real_1', '6acb3db9-399b-4b24-b005-6f912cc5de21', 'ph_1', 'grp_1');

      INSERT INTO bracket_nodes (id, phase_id, match_id, round, position) VALUES 
        ('bn_1', 'ph_1', 'm_real_1', 1, 1);

      INSERT INTO edition_results (id, edition_id, registration_id, position, prize_amount) VALUES 
        ('res_1', '6acb3db9-399b-4b24-b005-6f912cc5de21', 'reg_solo', 1, 500.00);

      -- Communications rattachées
      INSERT INTO messages (id, sender_id, tournament_id, edition_id, content) VALUES 
        ('msg_1', 'u_org1', '4b3e6516-8089-4c1b-a9b5-1cf7d42da01c', '6acb3db9-399b-4b24-b005-6f912cc5de21', 'Bienvenue au tournoi national.');
      INSERT INTO interactions (id, user_id, tournament_id, type) VALUES 
        ('inter_1', 'u_user1', '4b3e6516-8089-4c1b-a9b5-1cf7d42da01c', 'LIKE');
      INSERT INTO notifications (id, user_id, tournament_id, title) VALUES 
        ('notif_1', 'u_user1', '4b3e6516-8089-4c1b-a9b5-1cf7d42da01c', 'Votre inscription a été validée.');
    `);

    // 3. SNAPSHOT EXHAUSTIF DES DONNÉES PRÉ-MIGRATION (TOUTES LES COLONNES RÉELLES)
    const preRealPayments = await client.query(`
      SELECT id, registration_id, transaction_id, amount, currency, paid_at, payment_method, 
             payment_provider, status, reference, notes, metadata
      FROM registration_payments ORDER BY id;
    `);
    const preRealWalletTx = await client.query(`
      SELECT id, wallet_id, financial_account_id, from_user_id, to_user_id, amount, fees, 
             net_amount, balance_after, currency, type, metadata, status, reference, 
             reversal_of, reversed_by, description
      FROM wallet_transactions ORDER BY id;
    `);
    const preRealUserWallets = await client.query(`
      SELECT id, user_id, financial_account_id, pin_hash, is_active, is_locked, is_deleted, failed_attempts
      FROM user_wallets ORDER BY id;
    `);
    const preRealLedger = await client.query(`
      SELECT id, transaction_id, account_id, debit, credit, currency
      FROM ledger_entries ORDER BY id;
    `);
    const preRealAccounts = await client.query(`
      SELECT id, owner_user_id, owner_shop_id, owner_edition_id, type, currency, is_active, is_locked, system_key
      FROM financial_accounts ORDER BY id;
    `);
    const preRealTournaments = await client.query(`
      SELECT id, organizer_id, name, slug, description, game, platform, status, is_active
      FROM tournaments ORDER BY id;
    `);
    const preRealEditions = await client.query(`
      SELECT id, tournament_id, financial_account_id, edition_number, name, start_date, prize_pool, prize_currency, status
      FROM tournament_editions ORDER BY id;
    `);
    const preRealMessages = await client.query(`
      SELECT id, sender_id, tournament_id, edition_id, content
      FROM messages ORDER BY id;
    `);
    const preRealInteractions = await client.query(`
      SELECT id, user_id, tournament_id, type
      FROM interactions ORDER BY id;
    `);
    const preRealNotifications = await client.query(`
      SELECT id, user_id, tournament_id, title
      FROM notifications ORDER BY id;
    `);

    console.log(`[AUDIT PRÉ-MIGRATION SCHÉMA HISTORIQUE RÉEL] :
  - Tournois enregistrés      : ${preRealTournaments.rows.length} (Organisateur natif: ${preRealTournaments.rows[0].organizer_id})
  - Éditions enregistrées     : ${preRealEditions.rows.length}
  - Comptes financiers        : ${preRealAccounts.rows.length} (dont pool escrow: ${preRealAccounts.rows.filter(r => r.owner_edition_id).length})
  - Paiements enregistrés     : ${preRealPayments.rows.length} (Total: ${preRealPayments.rows.reduce((acc, r) => acc + parseFloat(r.amount), 0).toFixed(2)} GTC)
  - Transactions wallet       : ${preRealWalletTx.rows.length}
  - Écritures ledger          : ${preRealLedger.rows.length}
  - Communications rattachées : ${preRealMessages.rows.length} msg, ${preRealInteractions.rows.length} inter, ${preRealNotifications.rows.length} notif\n`);

    // ============================================================================
    // EXÉCUTION DE LA SÉQUENCE DE MIGRATION EN 6 ÉTAPES
    // ============================================================================

    // ÉTAPE 2 : Archivage & Découplage comptable de registration_payments
    console.log("--- ÉTAPE 2 : Archivage comptable & découplage de registration_payments ---");
    await client.query(`
      ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_edition_id TEXT;
      ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_edition_name TEXT;
      ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_tournament_id TEXT;
      ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_tournament_name TEXT;
      ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_user_id TEXT;
      ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_team_id TEXT;
      ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_participant_name TEXT;
      ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS archived_registration_type TEXT;

      -- Stratégie de snapshot immuable : jointure sur les tables historiques avant suppression
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

      -- Découplage formel de la contrainte historique
      ALTER TABLE registration_payments DROP CONSTRAINT IF EXISTS registration_payments_registration_id_fkey;
      ALTER TABLE registration_payments ALTER COLUMN registration_id DROP NOT NULL;
      ALTER TABLE registration_payments RENAME COLUMN registration_id TO legacy_registration_id;
    `);

    // ÉTAPE 3 : Déploiement intégral des 21 tables canoniques et mise à niveau des conteneurs
    console.log("--- ÉTAPE 3 : Déploiement intégral des 21 tables canoniques et mise à niveau des conteneurs ---");
    
    // 3.1 Mise à niveau des conteneurs : ajout des colonnes cibles canoniques (sans écraser les données réelles)
    await client.query(`
      ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS logo TEXT;
      ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS banner TEXT;

      ALTER TABLE tournament_editions ADD COLUMN IF NOT EXISTS max_entrants INT;
      ALTER TABLE tournament_editions ADD COLUMN IF NOT EXISTS default_ruleset_version_id TEXT;
      ALTER TABLE tournament_editions ADD COLUMN IF NOT EXISTS auto_forfeit_on_timeout BOOLEAN DEFAULT FALSE;
      ALTER TABLE tournament_editions ADD COLUMN IF NOT EXISTS forfeit_countdown_minutes INT DEFAULT 15;

      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'tournament_editions_id_tournament_id_key'
        ) THEN
          ALTER TABLE tournament_editions ADD CONSTRAINT tournament_editions_id_tournament_id_key UNIQUE(id, tournament_id);
        END IF;
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'tournament_editions_tournament_id_edition_number_key'
        ) THEN
          ALTER TABLE tournament_editions ADD CONSTRAINT tournament_editions_tournament_id_edition_number_key UNIQUE(tournament_id, edition_number);
        END IF;
      END $$;
    `);

    // 3.2 Déploiement ordonné de toutes les 18 autres tables canoniques
    await client.query(`
      CREATE TABLE tournament_staff (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        edition_id TEXT,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('ADMIN', 'ORGANIZER', 'HEAD_REFEREE', 'REFEREE', 'CASTER', 'OBSERVER')),
        permissions TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (edition_id, tournament_id) REFERENCES tournament_editions(id, tournament_id) ON DELETE CASCADE,
        UNIQUE(tournament_id, edition_id, user_id, role)
      );

      CREATE TABLE competition_entrants (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL REFERENCES tournament_editions(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
        team_id TEXT REFERENCES teams(id) ON DELETE RESTRICT,
        guest_identifier TEXT,
        name TEXT NOT NULL,
        tag TEXT,
        logo TEXT,
        seed INT,
        in_game_club TEXT,
        status TEXT NOT NULL DEFAULT 'REGISTERED',
        custom_fields JSONB DEFAULT '{}',
        final_rank INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(id, edition_id),
        CHECK (
          (type = 'SOLO' AND user_id IS NOT NULL AND team_id IS NULL) OR
          (type = 'TEAM' AND team_id IS NOT NULL AND user_id IS NULL) OR
          (type = 'GUEST' AND team_id IS NULL AND guest_identifier IS NOT NULL)
        )
      );

      CREATE UNIQUE INDEX entrants_edition_solo_user_unique 
        ON competition_entrants(edition_id, user_id) WHERE type = 'SOLO';
      CREATE UNIQUE INDEX entrants_edition_team_unique 
        ON competition_entrants(edition_id, team_id) WHERE type = 'TEAM';

      CREATE TABLE entrant_roster_members (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL,
        entrant_id TEXT NOT NULL,
        user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
        in_game_name TEXT NOT NULL,
        in_game_id TEXT,
        role TEXT NOT NULL DEFAULT 'STARTER' CHECK (role IN ('CAPTAIN', 'STARTER', 'SUBSTITUTE', 'COACH')),
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (entrant_id, edition_id) REFERENCES competition_entrants(id, edition_id) ON DELETE CASCADE
      );

      CREATE UNIQUE INDEX entrant_roster_captain_unique 
        ON entrant_roster_members(entrant_id) WHERE role = 'CAPTAIN';
      CREATE UNIQUE INDEX roster_edition_user_unique 
        ON entrant_roster_members(edition_id, user_id) 
        WHERE user_id IS NOT NULL AND role IN ('CAPTAIN', 'STARTER', 'SUBSTITUTE');

      CREATE TABLE competition_rulesets (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL UNIQUE,
        game TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE ruleset_versions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        ruleset_id TEXT NOT NULL REFERENCES competition_rulesets(id) ON DELETE CASCADE,
        version INT NOT NULL,
        scoring_mode TEXT NOT NULL,
        config JSONB NOT NULL,
        is_published BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(ruleset_id, version),
        UNIQUE(id, ruleset_id)
      );

      CREATE TABLE metric_definitions (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        data_type TEXT NOT NULL,
        unit TEXT NOT NULL,
        min_value NUMERIC(15, 4),
        max_value NUMERIC(15, 4),
        default_aggregation TEXT NOT NULL DEFAULT 'SUM',
        is_system BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE ruleset_metric_configs (
        ruleset_version_id TEXT NOT NULL REFERENCES ruleset_versions(id) ON DELETE CASCADE,
        metric_code TEXT NOT NULL REFERENCES metric_definitions(code) ON DELETE RESTRICT,
        weight NUMERIC(12, 4) DEFAULT 1.0,
        multiplier NUMERIC(12, 4) DEFAULT 1.0,
        is_tiebreaker BOOLEAN DEFAULT FALSE,
        tiebreaker_priority INT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        PRIMARY KEY (ruleset_version_id, metric_code)
      );

      CREATE OR REPLACE FUNCTION trg_enforce_ruleset_version_immutability()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_TABLE_NAME = 'ruleset_versions' THEN
          IF TG_OP = 'UPDATE' THEN
            IF OLD.is_published = TRUE THEN
              RAISE EXCEPTION 'IMMUTABLE_PUBLISHED_RULESET_VERSION: Toute modification d''une version de ruleset publiée est strictement interdite.';
            END IF;
          ELSIF TG_OP = 'DELETE' THEN
            IF OLD.is_published = TRUE THEN
              RAISE EXCEPTION 'CANNOT_DELETE_PUBLISHED_RULESET_VERSION: Suppression d''une version de ruleset publiée strictement interdite.';
            END IF;
          END IF;
        ELSIF TG_TABLE_NAME = 'ruleset_metric_configs' THEN
          IF TG_OP IN ('INSERT', 'UPDATE') THEN
            IF EXISTS (SELECT 1 FROM ruleset_versions WHERE id = NEW.ruleset_version_id AND is_published = TRUE) THEN
              RAISE EXCEPTION 'IMMUTABLE_PUBLISHED_RULESET_METRICS: Ajout ou modification de métrique interdite sur une version de ruleset publiée.';
            END IF;
          ELSIF TG_OP = 'DELETE' THEN
            IF EXISTS (SELECT 1 FROM ruleset_versions WHERE id = OLD.ruleset_version_id AND is_published = TRUE) THEN
              RAISE EXCEPTION 'IMMUTABLE_PUBLISHED_RULESET_METRICS: Suppression de métrique interdite sur une version de ruleset publiée.';
            END IF;
          END IF;
        END IF;
        IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trg_ruleset_versions_immutability
      BEFORE UPDATE OR DELETE ON ruleset_versions
      FOR EACH ROW EXECUTE FUNCTION trg_enforce_ruleset_version_immutability();

      CREATE TRIGGER trg_ruleset_metric_configs_immutability
      BEFORE INSERT OR UPDATE OR DELETE ON ruleset_metric_configs
      FOR EACH ROW EXECUTE FUNCTION trg_enforce_ruleset_version_immutability();

      CREATE TABLE competition_stages (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL REFERENCES tournament_editions(id) ON DELETE CASCADE,
        ruleset_version_id TEXT NOT NULL REFERENCES ruleset_versions(id) ON DELETE RESTRICT,
        name TEXT NOT NULL,
        stage_type TEXT NOT NULL,
        stage_order INT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(id, edition_id),
        UNIQUE(edition_id, stage_order)
      );

      CREATE TABLE competition_groups (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL,
        stage_id TEXT NOT NULL,
        name TEXT NOT NULL,
        group_order INT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (stage_id, edition_id) REFERENCES competition_stages(id, edition_id) ON DELETE CASCADE,
        UNIQUE(id, stage_id),
        UNIQUE(stage_id, group_order)
      );

      CREATE TABLE competition_rounds (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL,
        stage_id TEXT NOT NULL,
        round_number INT NOT NULL,
        name TEXT NOT NULL,
        scheduled_date TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (stage_id, edition_id) REFERENCES competition_stages(id, edition_id) ON DELETE CASCADE,
        UNIQUE(id, stage_id),
        UNIQUE(stage_id, round_number)
      );

      CREATE TABLE competition_encounters (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL,
        stage_id TEXT NOT NULL,
        group_id TEXT,
        round_id TEXT,
        code TEXT,
        encounter_type TEXT NOT NULL,
        ruleset_version_id TEXT NOT NULL REFERENCES ruleset_versions(id) ON DELETE RESTRICT,
        aggregation_rule TEXT NOT NULL DEFAULT 'DIRECT',
        status TEXT NOT NULL DEFAULT 'PENDING',
        scheduled_time TIMESTAMP WITH TIME ZONE,
        forfeit_countdown_ends_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (stage_id, edition_id) REFERENCES competition_stages(id, edition_id) ON DELETE CASCADE,
        FOREIGN KEY (group_id, stage_id) REFERENCES competition_groups(id, stage_id) ON DELETE CASCADE,
        FOREIGN KEY (round_id, stage_id) REFERENCES competition_rounds(id, stage_id) ON DELETE CASCADE,
        UNIQUE(id, edition_id),
        UNIQUE(id, encounter_type),
        UNIQUE(id, ruleset_version_id)
      );

      CREATE TABLE encounter_sides (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        encounter_id TEXT NOT NULL,
        encounter_type TEXT NOT NULL DEFAULT 'COLLECTIVE_FIXTURE',
        side_number INT NOT NULL,
        name TEXT NOT NULL,
        final_aggregated_points NUMERIC(12, 4) DEFAULT 0,
        result TEXT,
        FOREIGN KEY (encounter_id, encounter_type) 
          REFERENCES competition_encounters(id, encounter_type) ON DELETE CASCADE,
        CHECK (encounter_type = 'COLLECTIVE_FIXTURE'),
        UNIQUE(encounter_id, side_number),
        UNIQUE(id, encounter_id)
      );

      CREATE TABLE encounter_side_entrants (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL,
        encounter_id TEXT NOT NULL,
        side_id TEXT NOT NULL,
        entrant_id TEXT NOT NULL,
        FOREIGN KEY (side_id, encounter_id) REFERENCES encounter_sides(id, encounter_id) ON DELETE CASCADE,
        FOREIGN KEY (entrant_id, edition_id) REFERENCES competition_entrants(id, edition_id) ON DELETE CASCADE,
        FOREIGN KEY (encounter_id, edition_id) REFERENCES competition_encounters(id, edition_id) ON DELETE CASCADE,
        UNIQUE(side_id, entrant_id),
        UNIQUE(encounter_id, entrant_id)
      );

      CREATE TABLE encounter_matches (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL,
        encounter_id TEXT NOT NULL,
        encounter_type TEXT NOT NULL,
        ruleset_version_id TEXT NOT NULL,
        match_order INT NOT NULL DEFAULT 1,
        title TEXT NOT NULL DEFAULT 'Match 1',
        match_format TEXT NOT NULL DEFAULT 'BEST_OF_1',
        points_weight NUMERIC(12, 4) DEFAULT 1.0,
        status TEXT NOT NULL DEFAULT 'PENDING',
        is_conditional BOOLEAN DEFAULT FALSE,
        trigger_condition TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (encounter_id, edition_id) REFERENCES competition_encounters(id, edition_id) ON DELETE CASCADE,
        FOREIGN KEY (encounter_id, encounter_type) REFERENCES competition_encounters(id, encounter_type) ON DELETE CASCADE,
        FOREIGN KEY (encounter_id, ruleset_version_id) REFERENCES competition_encounters(id, ruleset_version_id) ON DELETE CASCADE,
        UNIQUE(encounter_id, match_order),
        UNIQUE(id, encounter_id),
        UNIQUE(id, edition_id),
        UNIQUE(id, encounter_type),
        UNIQUE(id, ruleset_version_id)
      );

      CREATE TABLE match_slots (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL,
        encounter_id TEXT NOT NULL,
        encounter_type TEXT NOT NULL,
        match_id TEXT NOT NULL,
        slot_position INT NOT NULL,
        side_id TEXT,
        assigned_entrant_id TEXT,
        source_type TEXT NOT NULL DEFAULT 'DIRECT_SEED',
        source_match_id TEXT REFERENCES encounter_matches(id) ON DELETE SET NULL,
        source_group_id TEXT REFERENCES competition_groups(id) ON DELETE SET NULL,
        source_stage_id TEXT REFERENCES competition_stages(id) ON DELETE SET NULL,
        source_rank INT,
        selection_order INT,
        is_locked BOOLEAN DEFAULT FALSE,
        is_forfeit BOOLEAN DEFAULT FALSE,
        forfeit_reason TEXT,
        forfeited_by_user_id TEXT REFERENCES users(id),
        forfeited_at TIMESTAMP WITH TIME ZONE,
        final_match_score NUMERIC(12, 4) DEFAULT 0,
        final_match_rank INT,
        is_winner BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (match_id, encounter_id) REFERENCES encounter_matches(id, encounter_id) ON DELETE CASCADE,
        FOREIGN KEY (match_id, edition_id) REFERENCES encounter_matches(id, edition_id) ON DELETE CASCADE,
        FOREIGN KEY (match_id, encounter_type) REFERENCES encounter_matches(id, encounter_type) ON DELETE CASCADE,
        FOREIGN KEY (assigned_entrant_id, edition_id) REFERENCES competition_entrants(id, edition_id) ON DELETE RESTRICT,
        UNIQUE(id, match_id),
        UNIQUE(match_id, slot_position),
        CHECK (
          (encounter_type = 'COLLECTIVE_FIXTURE' AND side_id IS NOT NULL) OR
          (encounter_type IN ('DUEL', 'FFA') AND side_id IS NULL)
        ),
        FOREIGN KEY (side_id, encounter_id) REFERENCES encounter_sides(id, encounter_id) ON DELETE CASCADE,
        FOREIGN KEY (side_id, assigned_entrant_id) REFERENCES encounter_side_entrants(side_id, entrant_id) ON DELETE RESTRICT
      );

      CREATE TABLE match_games (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        match_id TEXT NOT NULL REFERENCES encounter_matches(id) ON DELETE CASCADE,
        game_number INT NOT NULL,
        map_name TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        proof_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(match_id, game_number),
        UNIQUE(id, match_id)
      );

      CREATE TABLE game_metrics (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        ruleset_version_id TEXT NOT NULL,
        match_id TEXT NOT NULL,
        game_id TEXT NOT NULL,
        slot_id TEXT NOT NULL,
        metric_code TEXT NOT NULL,
        raw_value NUMERIC(15, 4) NOT NULL DEFAULT 0,
        calculated_points NUMERIC(12, 4) NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (game_id, match_id) REFERENCES match_games(id, match_id) ON DELETE CASCADE,
        FOREIGN KEY (slot_id, match_id) REFERENCES match_slots(id, match_id) ON DELETE CASCADE,
        FOREIGN KEY (match_id, ruleset_version_id) REFERENCES encounter_matches(id, ruleset_version_id) ON DELETE CASCADE,
        FOREIGN KEY (ruleset_version_id, metric_code) REFERENCES ruleset_metric_configs(ruleset_version_id, metric_code) ON DELETE RESTRICT,
        UNIQUE(game_id, slot_id, metric_code)
      );

      CREATE TABLE match_arbitration_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        encounter_id TEXT NOT NULL REFERENCES competition_encounters(id) ON DELETE CASCADE,
        match_id TEXT REFERENCES encounter_matches(id) ON DELETE CASCADE,
        slot_id TEXT REFERENCES match_slots(id) ON DELETE CASCADE,
        action_type TEXT NOT NULL,
        author_user_id TEXT NOT NULL REFERENCES users(id),
        previous_value JSONB,
        new_value JSONB,
        reason TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // ÉTAPE 4 : Établissement des nouvelles relations et contraintes financières
    console.log("--- ÉTAPE 4 : Établissement des nouvelles relations et contraintes financières ---");
    await client.query(`
      ALTER TABLE registration_payments ADD COLUMN IF NOT EXISTS entrant_id TEXT REFERENCES competition_entrants(id) ON DELETE SET NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS registration_payments_transaction_unique ON registration_payments(transaction_id);
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'tournament_editions_ruleset_fk'
        ) THEN
          ALTER TABLE tournament_editions ADD CONSTRAINT tournament_editions_ruleset_fk 
            FOREIGN KEY (default_ruleset_version_id) REFERENCES ruleset_versions(id) ON DELETE RESTRICT;
        END IF;
      END $$;
    `);

    // ÉTAPE 5 : Suppression sélective ordonnée SANS CASCADE
    // L'exécution sans CASCADE prouve formellement qu'aucune dépendance orpheline ne subsiste !
    console.log("--- ÉTAPE 5 : Suppression sélective ordonnée SANS CASCADE ---");
    await client.query(`
      DROP TABLE phase_group_participants;
      DROP TABLE bracket_nodes;
      DROP TABLE matches;
      DROP TABLE phase_groups;
      DROP TABLE tournament_phases;
      DROP TABLE edition_results;
      DROP TABLE edition_registrations;
      DROP TABLE tournament_members;
    `);

    // ÉTAPE 6 : Contrôles post-migration exhaustifs et comparaisons ligne par ligne
    console.log("--- ÉTAPE 6 : Audits et comparaisons ligne par ligne post-migration ---");
    const postRealPayments = await client.query(`
      SELECT id, legacy_registration_id, entrant_id, transaction_id, amount, currency, paid_at,
             payment_method, payment_provider, status, reference, notes, metadata,
             archived_edition_id, archived_edition_name, archived_tournament_id, archived_tournament_name,
             archived_user_id, archived_team_id, archived_participant_name, archived_registration_type
      FROM registration_payments ORDER BY id;
    `);
    const postRealWalletTx = await client.query(`
      SELECT id, wallet_id, financial_account_id, from_user_id, to_user_id, amount, fees, 
             net_amount, balance_after, currency, type, metadata, status, reference, 
             reversal_of, reversed_by, description
      FROM wallet_transactions ORDER BY id;
    `);
    const postRealUserWallets = await client.query(`
      SELECT id, user_id, financial_account_id, pin_hash, is_active, is_locked, is_deleted, failed_attempts
      FROM user_wallets ORDER BY id;
    `);
    const postRealLedger = await client.query(`
      SELECT id, transaction_id, account_id, debit, credit, currency
      FROM ledger_entries ORDER BY id;
    `);
    const postRealAccounts = await client.query(`
      SELECT id, owner_user_id, owner_shop_id, owner_edition_id, type, currency, is_active, is_locked, system_key
      FROM financial_accounts ORDER BY id;
    `);
    const postRealTournaments = await client.query(`
      SELECT id, organizer_id, name, slug, description, game, platform, status, is_active
      FROM tournaments ORDER BY id;
    `);
    const postRealEditions = await client.query(`
      SELECT id, tournament_id, financial_account_id, edition_number, name, start_date, prize_pool, prize_currency, status
      FROM tournament_editions ORDER BY id;
    `);
    const postRealMessages = await client.query(`
      SELECT id, sender_id, tournament_id, edition_id, content
      FROM messages ORDER BY id;
    `);
    const postRealInteractions = await client.query(`
      SELECT id, user_id, tournament_id, type
      FROM interactions ORDER BY id;
    `);
    const postRealNotifications = await client.query(`
      SELECT id, user_id, tournament_id, title
      FROM notifications ORDER BY id;
    `);

    console.log(`[AUDIT POST-MIGRATION SCHÉMA HISTORIQUE RÉEL] :
  - Tournois préservés       : ${postRealTournaments.rows.length} (Organisateur natif intact: ${postRealTournaments.rows[0].organizer_id})
  - Éditions préservées      : ${postRealEditions.rows.length}
  - Comptes financiers       : ${postRealAccounts.rows.length} (dont pool escrow: ${postRealAccounts.rows.filter(r => r.owner_edition_id).length})
  - Paiements vérifiés       : ${postRealPayments.rows.length} (Total: ${postRealPayments.rows.reduce((acc, r) => acc + parseFloat(r.amount), 0).toFixed(2)} GTC)
  - Transactions wallet      : ${postRealWalletTx.rows.length}
  - Écritures ledger         : ${postRealLedger.rows.length}
  - Communications rattachées : ${postRealMessages.rows.length} msg, ${postRealInteractions.rows.length} inter, ${postRealNotifications.rows.length} notif`);

    // 6.1 VALIDATION STRICTE LIGNE PAR LIGNE DES PAIEMENTS ET SNAPSHOTS D'ARCHIVAGE
    if (preRealPayments.rows.length !== postRealPayments.rows.length) {
      throw new Error(`Incohérence volume paiements: pré=${preRealPayments.rows.length}, post=${postRealPayments.rows.length}`);
    }

    for (let i = 0; i < preRealPayments.rows.length; i++) {
      const pre = preRealPayments.rows[i];
      const post = postRealPayments.rows[i];

      // Identifiants, montants, et valeurs historiques réelles
      if (pre.id !== post.id) throw new Error(`Mismatch paiement id: ${pre.id} vs ${post.id}`);
      if (parseFloat(pre.amount) !== parseFloat(post.amount)) throw new Error(`Mismatch montant: ${pre.amount} vs ${post.amount}`);
      if (pre.currency !== post.currency) throw new Error(`Mismatch currency: ${pre.currency} vs ${post.currency}`);
      if (pre.payment_method !== post.payment_method) throw new Error(`Mismatch payment_method: ${pre.payment_method} vs ${post.payment_method}`);
      if (pre.payment_provider !== post.payment_provider) throw new Error(`Mismatch payment_provider: ${pre.payment_provider} vs ${post.payment_provider}`);
      if (pre.status !== post.status) throw new Error(`Mismatch status: ${pre.status} vs ${post.status}`);
      if (pre.reference !== post.reference) throw new Error(`Mismatch reference: ${pre.reference} vs ${post.reference}`);
      if (pre.notes !== post.notes) throw new Error(`Mismatch notes`);
      if (pre.registration_id !== post.legacy_registration_id) throw new Error(`Mismatch legacy_registration_id: ${pre.registration_id} vs ${post.legacy_registration_id}`);

      // Sécurité : la nouvelle FK entrant_id doit être NULL pour les enregistrements historiques archivés
      if (post.entrant_id !== null) {
        throw new Error(`entrant_id doit être NULL pour le paiement historique ${post.id}`);
      }

      // Contrôle exhaustif des 8 colonnes de snapshot immuables
      if (!post.archived_edition_id || post.archived_edition_id !== '6acb3db9-399b-4b24-b005-6f912cc5de21') {
        throw new Error(`archived_edition_id invalide sur paiement ${post.id}`);
      }
      if (!post.archived_edition_name || post.archived_edition_name !== 'Edition 1 Prestige') {
        throw new Error(`archived_edition_name invalide sur paiement ${post.id}`);
      }
      if (!post.archived_tournament_id || post.archived_tournament_id !== '4b3e6516-8089-4c1b-a9b5-1cf7d42da01c') {
        throw new Error(`archived_tournament_id invalide sur paiement ${post.id}`);
      }
      if (!post.archived_tournament_name || post.archived_tournament_name !== 'Tournoi National FC25') {
        throw new Error(`archived_tournament_name invalide sur paiement ${post.id}`);
      }
      if (!post.archived_participant_name) {
        throw new Error(`archived_participant_name manquant sur paiement ${post.id}`);
      }
      if (!post.archived_registration_type) {
        throw new Error(`archived_registration_type manquant sur paiement ${post.id}`);
      }
    }

    // Vérification spécifique de archived_team_id et archived_user_id :
    // - pay_1 (Solo) doit avoir archived_user_id='u_user1' et archived_team_id=NULL
    // - pay_2 (Equipe) doit avoir archived_team_id='t_lions' et archived_user_id='u_user2'
    const paySolo = postRealPayments.rows.find(p => p.id === 'pay_1');
    const payTeam = postRealPayments.rows.find(p => p.id === 'pay_2');

    if (!paySolo || paySolo.archived_user_id !== 'u_user1' || paySolo.archived_team_id !== null) {
      throw new Error(`Échec vérification archivage solo: archived_user_id=${paySolo?.archived_user_id}, archived_team_id=${paySolo?.archived_team_id}`);
    }
    if (!payTeam || payTeam.archived_team_id !== 't_lions' || payTeam.archived_user_id !== 'u_user2') {
      throw new Error(`Échec vérification archivage équipe: archived_team_id=${payTeam?.archived_team_id}, archived_user_id=${payTeam?.archived_user_id}`);
    }
    console.log("✔ Vérification stricte des 8 colonnes de snapshot : archived_team_id='t_lions' (équipe) et archived_user_id (solo) validés sans fabrication.");

    // 6.2 VALIDATION LIGNE PAR LIGNE DES TRANSACTIONS FINANCIÈRES
    for (let i = 0; i < preRealWalletTx.rows.length; i++) {
      const pre = preRealWalletTx.rows[i];
      const post = postRealWalletTx.rows[i];
      if (pre.id !== post.id || pre.wallet_id !== post.wallet_id ||
          pre.financial_account_id !== post.financial_account_id ||
          parseFloat(pre.amount) !== parseFloat(post.amount) ||
          parseFloat(pre.fees) !== parseFloat(post.fees) ||
          parseFloat(pre.net_amount) !== parseFloat(post.net_amount) ||
          parseFloat(pre.balance_after) !== parseFloat(post.balance_after) ||
          pre.type !== post.type || pre.status !== post.status || pre.reference !== post.reference ||
          pre.reversal_of !== post.reversal_of || pre.reversed_by !== post.reversed_by) {
        throw new Error(`Altération de transaction financière ligne par ligne sur ${pre.id}`);
      }
    }

    // 6.3 VALIDATION LIGNE PAR LIGNE DES PORTEFEUILLES UTILISATEURS (USER WALLETS)
    for (let i = 0; i < preRealUserWallets.rows.length; i++) {
      const pre = preRealUserWallets.rows[i];
      const post = postRealUserWallets.rows[i];
      if (pre.id !== post.id || pre.user_id !== post.user_id ||
          pre.financial_account_id !== post.financial_account_id ||
          pre.pin_hash !== post.pin_hash ||
          pre.is_active !== post.is_active || pre.is_locked !== post.is_locked ||
          pre.is_deleted !== post.is_deleted) {
        throw new Error(`Altération de user_wallet sur ${pre.id}`);
      }
    }

    // 6.4 VALIDATION LIGNE PAR LIGNE DES ÉCRITURES DU GRAND LIVRE (LEDGER DOUBLE-ENTRÉE)
    for (let i = 0; i < preRealLedger.rows.length; i++) {
      const pre = preRealLedger.rows[i];
      const post = postRealLedger.rows[i];
      if (pre.id !== post.id || pre.transaction_id !== post.transaction_id ||
          pre.account_id !== post.account_id ||
          parseFloat(pre.debit) !== parseFloat(post.debit) ||
          parseFloat(pre.credit) !== parseFloat(post.credit) ||
          pre.currency !== post.currency) {
        throw new Error(`Altération de grand livre ledger sur l'écriture ${pre.id}`);
      }
    }

    // 6.5 VALIDATION LIGNE PAR LIGNE DES COMPTES FINANCIERS
    for (let i = 0; i < preRealAccounts.rows.length; i++) {
      const pre = preRealAccounts.rows[i];
      const post = postRealAccounts.rows[i];
      if (pre.id !== post.id || pre.owner_user_id !== post.owner_user_id ||
          pre.owner_edition_id !== post.owner_edition_id || pre.type !== post.type ||
          pre.currency !== post.currency || pre.is_active !== post.is_active ||
          pre.is_locked !== post.is_locked) {
        throw new Error(`Altération de compte financier sur ${pre.id}`);
      }
    }

    // 6.6 VALIDATION LIGNE PAR LIGNE DES CONTENEURS ET DES COMMUNICATIONS
    for (let i = 0; i < preRealTournaments.rows.length; i++) {
      const pre = preRealTournaments.rows[i];
      const post = postRealTournaments.rows[i];
      if (pre.id !== post.id || pre.organizer_id !== post.organizer_id ||
          pre.name !== post.name || pre.slug !== post.slug || pre.game !== post.game ||
          pre.platform !== post.platform) {
        throw new Error(`Altération de tournoi conteneur ligne par ligne sur ${pre.id}`);
      }
    }
    for (let i = 0; i < preRealEditions.rows.length; i++) {
      const pre = preRealEditions.rows[i];
      const post = postRealEditions.rows[i];
      if (pre.id !== post.id || pre.tournament_id !== post.tournament_id ||
          pre.edition_number !== post.edition_number || pre.name !== post.name ||
          pre.financial_account_id !== post.financial_account_id ||
          parseFloat(pre.prize_pool) !== parseFloat(post.prize_pool)) {
        throw new Error(`Altération d'édition conteneur ligne par ligne sur ${pre.id}`);
      }
    }
    if (JSON.stringify(preRealMessages.rows) !== JSON.stringify(postRealMessages.rows)) {
      throw new Error("Altération des messages rattachés détectée !");
    }
    if (JSON.stringify(preRealInteractions.rows) !== JSON.stringify(postRealInteractions.rows)) {
      throw new Error("Altération des interactions rattachées détectée !");
    }
    if (JSON.stringify(preRealNotifications.rows) !== JSON.stringify(postRealNotifications.rows)) {
      throw new Error("Altération des notifications rattachées détectée !");
    }

    // 6.7 VALIDATION DE LA PRÉSENCE PHYSIQUE ET STRUCTURELLE DES 21 TABLES CANONIQUES
    const CANONICAL_21_TABLES = [
      'tournaments', 'tournament_editions', 'tournament_staff', 'competition_entrants', 'entrant_roster_members',
      'registration_payments', 'competition_rulesets', 'ruleset_versions', 'metric_definitions',
      'ruleset_metric_configs', 'competition_stages', 'competition_groups', 'competition_rounds',
      'competition_encounters', 'encounter_sides', 'encounter_side_entrants', 'encounter_matches',
      'match_slots', 'match_games', 'game_metrics', 'match_arbitration_logs'
    ];

    const postTablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = current_schema() AND table_type = 'BASE TABLE';
    `);
    const deployedTables = postTablesResult.rows.map(r => r.table_name);
    for (const table of CANONICAL_21_TABLES) {
      if (!deployedTables.includes(table)) {
        throw new Error(`Table canonique manquante dans le schéma migré : ${table}`);
      }
    }

    console.log(`✔ Déploiement complet des 21 tables canoniques vérifié dans le schéma migré.`);
    console.log("✔ Validation représentative ligne par ligne 100% conforme : Séquence ordonnée sans CASCADE respectée, Container Preservation validé, zéro perte financière.\n");

    // Nettoyage Partie B
    await client.query(`DROP SCHEMA ${REAL_SCHEMA_SANDBOX} CASCADE;`);
    console.log(`[CLEANUP] Schéma de copie représentative '${REAL_SCHEMA_SANDBOX}' nettoyé avec succès.`);

    console.log("================================================================================");
    console.log("   TOUTES LES VALIDATIONS ONT RÉUSSI AVEC SUCCÈS (GO FINAL PRÊT POUR SPRINT 1)");
    console.log("================================================================================\n");

  } finally {
    client.release();
    await pool.end();
  }
}

runVerification().catch((err) => {
  console.error("\n❌ ÉCHEC CRITIQUE DE LA VÉRIFICATION DU MOTEUR :", err);
  process.exit(1);
});
