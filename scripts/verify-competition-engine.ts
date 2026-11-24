/**
 * Script de validation technique, immutabilité et reproduction du Moteur de Compétition Games Trafics.
 * 
 * Exécute sous PostgreSQL 17.12 :
 * 1. Sécurisation de l'exécution (schéma temporaire unique généré dynamiquement, garde-fous stricts)
 * 2. Partie A — Banc d'essai synthétique complet des 21 tables canoniques (Identifiants TEXT, Index partiels, FK composites)
 * 3. Tests d'immutabilité stricte des rulesets publiés (Triggers SQL anti-UPDATE et anti-DELETE)
 * 4. Tests de correspondance exacte entre le ruleset du match et les métriques enregistrées (Verrou relationnel composite)
 * 5. Exécution des 10 tests de rejet bloqués nativement par le moteur relationnel
 * 6. Partie B — Validation de la migration réelle sur une copie représentative et isolée du schéma Games Trafics
 * 7. Audit comparatif approfondi avant/après (zéro perte financière, traçabilité et Container Preservation)
 * 
 * Exécution :
 * bun run test:competition-engine
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERREUR: DATABASE_URL n'est pas définie dans l'environnement.");
  process.exit(1);
}

// Sécurisation : Génération d'identifiants de schémas temporaires uniques et isolés
const RUN_ID = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
const SYNTHETIC_SANDBOX = `test_competition_synth_${RUN_ID}`;
const REAL_SCHEMA_SANDBOX = `test_competition_real_${RUN_ID}`;

// Garde-fou strict : refus d'exécution si le nom de schéma ne commence pas par le préfixe sécurisé
function assertSafeSchema(schemaName: string) {
  if (!schemaName.startsWith('test_competition_')) {
    throw new Error(`SÉCURITÉ VIOLÉE: Tentative d'opération sur un schéma non autorisé (${schemaName}) !`);
  }
}

const pool = new Pool({ connectionString: databaseUrl });

async function runVerification() {
  assertSafeSchema(SYNTHETIC_SANDBOX);
  assertSafeSchema(REAL_SCHEMA_SANDBOX);

  const client = await pool.connect();
  console.log("================================================================================");
  console.log("   GAMES TRAFICS — BANC D'ESSAI TECHNIQUE & VALIDATION SÉCURISÉE DU MOTEUR");
  console.log("================================================================================\n");

  try {
    // 0. Version PostgreSQL
    const versionRes = await client.query('SELECT version();');
    const pgVersion = versionRes.rows[0].version;
    console.log(`[ENV] Moteur SGBD détecté :\n${pgVersion}\n`);

    // ============================================================================
    // PARTIE A : BANC D'ESSAI SYNTHÉTIQUE DES 21 TABLES CANONIQUES
    // ============================================================================
    console.log("================================================================================");
    console.log(`   PARTIE A : BANC D'ESSAI SYNTHÉTIQUE (Schéma: ${SYNTHETIC_SANDBOX})`);
    console.log("================================================================================\n");

    await client.query(`CREATE SCHEMA ${SYNTHETIC_SANDBOX};`);
    await client.query(`SET search_path TO ${SYNTHETIC_SANDBOX}, public;`);

    // Tables socles
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

    // DDL des 21 Tables Canoniques avec ID TEXT
    await client.query(`
      -- 1. Tournois
      CREATE TABLE tournaments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        game TEXT NOT NULL,
        description TEXT,
        visibility TEXT NOT NULL DEFAULT 'PUBLIC',
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 2. Éditions de tournoi
      CREATE TABLE tournament_editions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        edition_number INT NOT NULL,
        name TEXT NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        end_date TIMESTAMP WITH TIME ZONE,
        status TEXT NOT NULL DEFAULT 'UPCOMING',
        max_entrants INT,
        entry_fee NUMERIC(15, 2) DEFAULT 0.00,
        prize_pool NUMERIC(15, 2) DEFAULT 0.00,
        prize_currency TEXT DEFAULT 'GTC',
        financial_account_id TEXT REFERENCES financial_accounts(id) ON DELETE RESTRICT,
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
        role TEXT NOT NULL CHECK (role IN ('ADMIN', 'ORGANIZER', 'HEAD_REFEREE', 'REFEREE', 'CASTER')),
        permissions TEXT[] DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (edition_id, tournament_id) REFERENCES tournament_editions(id, tournament_id) ON DELETE CASCADE,
        UNIQUE(tournament_id, edition_id, user_id, role)
      );

      -- 4. Entrants officiels (SOLO, TEAM, GUEST)
      CREATE TABLE competition_entrants (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL REFERENCES tournament_editions(id) ON DELETE CASCADE,
        type TEXT NOT NULL CHECK (type IN ('SOLO', 'TEAM', 'GUEST')),
        user_id TEXT REFERENCES users(id) ON DELETE RESTRICT,
        team_id TEXT REFERENCES teams(id) ON DELETE RESTRICT,
        guest_identifier TEXT,
        name TEXT NOT NULL,
        tag TEXT,
        seed INT,
        status TEXT NOT NULL DEFAULT 'REGISTERED',
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

      -- 5. Roster des participants
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

      -- 6. Quittance comptable d'inscription découplée
      CREATE TABLE registration_payments (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        entrant_id TEXT REFERENCES competition_entrants(id) ON DELETE SET NULL,
        transaction_id TEXT NOT NULL UNIQUE REFERENCES wallet_transactions(id) ON DELETE RESTRICT,
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

      -- 7. Rulesets
      CREATE TABLE competition_rulesets (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        game TEXT NOT NULL,
        name TEXT NOT NULL,
        discipline TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 8. Versions immuables des rulesets
      CREATE TABLE ruleset_versions (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        ruleset_id TEXT NOT NULL REFERENCES competition_rulesets(id) ON DELETE CASCADE,
        version INT NOT NULL,
        match_format TEXT NOT NULL DEFAULT 'BEST_OF_1',
        scoring_system TEXT NOT NULL DEFAULT 'STANDARD_WIN_LOSS',
        rules_config JSONB NOT NULL DEFAULT '{}',
        is_published BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(ruleset_id, version),
        UNIQUE(id, ruleset_id)
      );

      -- 9. Dictionnaire des métriques
      CREATE TABLE metric_definitions (
        code TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        game TEXT NOT NULL,
        metric_type TEXT NOT NULL,
        aggregation TEXT NOT NULL DEFAULT 'SUM'
      );

      -- 10. Métriques autorisées par version de ruleset
      CREATE TABLE ruleset_metric_configs (
        ruleset_version_id TEXT NOT NULL REFERENCES ruleset_versions(id) ON DELETE CASCADE,
        metric_code TEXT NOT NULL REFERENCES metric_definitions(code) ON DELETE RESTRICT,
        weight NUMERIC(12, 4) DEFAULT 1.0,
        is_mandatory BOOLEAN DEFAULT FALSE,
        PRIMARY KEY (ruleset_version_id, metric_code)
      );

      -- TRIGGERS D'IMMUABILITÉ STRICTE SUR LES VERSIONS PUBLIÉES
      CREATE OR REPLACE FUNCTION trg_enforce_ruleset_version_immutability()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_TABLE_NAME = 'ruleset_versions' THEN
          IF TG_OP = 'UPDATE' THEN
            IF OLD.is_published = TRUE THEN
              IF NEW.is_published = FALSE THEN
                RAISE EXCEPTION 'CANNOT_UNPUBLISH_RULESET_VERSION: Une version publiée ne peut être dépubliée.';
              END IF;
              IF NEW.match_format IS DISTINCT FROM OLD.match_format OR
                 NEW.scoring_system IS DISTINCT FROM OLD.scoring_system OR
                 NEW.rules_config IS DISTINCT FROM OLD.rules_config THEN
                RAISE EXCEPTION 'IMMUTABLE_PUBLISHED_RULESET_VERSION: Modification interdite sur une version publiée.';
              END IF;
            END IF;
          ELSIF TG_OP = 'DELETE' THEN
            IF OLD.is_published = TRUE THEN
              RAISE EXCEPTION 'CANNOT_DELETE_PUBLISHED_RULESET_VERSION: Suppression interdite sur une version publiée.';
            END IF;
          END IF;
        ELSIF TG_TABLE_NAME = 'ruleset_metric_configs' THEN
          IF TG_OP IN ('INSERT', 'UPDATE') THEN
            IF EXISTS (SELECT 1 FROM ruleset_versions WHERE id = NEW.ruleset_version_id AND is_published = TRUE) THEN
              RAISE EXCEPTION 'IMMUTABLE_PUBLISHED_RULESET_METRICS: Ajout/Modification de métrique interdite sur version publiée.';
            END IF;
          ELSIF TG_OP = 'DELETE' THEN
            IF EXISTS (SELECT 1 FROM ruleset_versions WHERE id = OLD.ruleset_version_id AND is_published = TRUE) THEN
              RAISE EXCEPTION 'IMMUTABLE_PUBLISHED_RULESET_METRICS: Suppression de métrique interdite sur version publiée.';
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

      -- 11. Phases / Stages de compétition
      CREATE TABLE competition_stages (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL REFERENCES tournament_editions(id) ON DELETE CASCADE,
        ruleset_version_id TEXT NOT NULL REFERENCES ruleset_versions(id) ON DELETE RESTRICT,
        stage_order INT NOT NULL,
        name TEXT NOT NULL,
        stage_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(id, edition_id),
        UNIQUE(edition_id, stage_order)
      );

      -- 12. Groupes
      CREATE TABLE competition_groups (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        stage_id TEXT NOT NULL REFERENCES competition_stages(id) ON DELETE CASCADE,
        group_order INT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(id, stage_id),
        UNIQUE(stage_id, group_order)
      );

      -- 13. Rounds
      CREATE TABLE competition_rounds (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        stage_id TEXT NOT NULL REFERENCES competition_stages(id) ON DELETE CASCADE,
        group_id TEXT REFERENCES competition_groups(id) ON DELETE CASCADE,
        round_number INT NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(id, stage_id),
        UNIQUE(stage_id, round_number)
      );

      -- 14. Rencontres (Nœuds de confrontation)
      CREATE TABLE competition_encounters (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        edition_id TEXT NOT NULL,
        stage_id TEXT NOT NULL,
        group_id TEXT,
        round_id TEXT,
        encounter_type TEXT NOT NULL CHECK (encounter_type IN ('DUEL', 'FFA', 'COLLECTIVE_FIXTURE')),
        ruleset_version_id TEXT NOT NULL REFERENCES ruleset_versions(id) ON DELETE RESTRICT,
        encounter_order INT NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (stage_id, edition_id) REFERENCES competition_stages(id, edition_id) ON DELETE CASCADE,
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

      -- 16. Entrants composant chaque camp
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

      -- 17. Matchs d'une rencontre (encounter_matches)
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (encounter_id, edition_id) REFERENCES competition_encounters(id, edition_id) ON DELETE CASCADE,
        FOREIGN KEY (encounter_id, encounter_type) REFERENCES competition_encounters(id, encounter_type) ON DELETE CASCADE,
        -- Hérite obligatoirement du ruleset_version_id de la rencontre
        FOREIGN KEY (encounter_id, ruleset_version_id) REFERENCES competition_encounters(id, ruleset_version_id) ON DELETE CASCADE,
        UNIQUE(encounter_id, match_order),
        UNIQUE(id, encounter_id),
        UNIQUE(id, edition_id),
        UNIQUE(id, encounter_type),
        UNIQUE(id, ruleset_version_id)
      );

      -- 18. Slots participants d'un match (match_slots)
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
        is_forfeit BOOLEAN DEFAULT FALSE,
        forfeit_reason TEXT,
        final_match_score NUMERIC(12, 4) DEFAULT 0,
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

      -- 19. Manches d'un match (match_games)
      CREATE TABLE match_games (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        match_id TEXT NOT NULL REFERENCES encounter_matches(id) ON DELETE CASCADE,
        game_number INT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(match_id, game_number),
        UNIQUE(id, match_id)
      );

      -- 20. Métriques de performance par manche (game_metrics)
      CREATE TABLE game_metrics (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        ruleset_version_id TEXT NOT NULL,
        match_id TEXT NOT NULL,
        game_id TEXT NOT NULL,
        slot_id TEXT NOT NULL,
        metric_code TEXT NOT NULL,
        raw_value NUMERIC(15, 4) NOT NULL DEFAULT 0,
        calculated_points NUMERIC(12, 4) NOT NULL DEFAULT 0,
        FOREIGN KEY (game_id, match_id) REFERENCES match_games(id, match_id) ON DELETE CASCADE,
        FOREIGN KEY (slot_id, match_id) REFERENCES match_slots(id, match_id) ON DELETE CASCADE,
        -- Verrou relationnel 1 : ruleset_version_id correspond OBLIGATOIREMENT au match
        FOREIGN KEY (match_id, ruleset_version_id) REFERENCES encounter_matches(id, ruleset_version_id) ON DELETE CASCADE,
        -- Verrou relationnel 2 : metric_code est configuré dans CE ruleset_version_id
        FOREIGN KEY (ruleset_version_id, metric_code) REFERENCES ruleset_metric_configs(ruleset_version_id, metric_code) ON DELETE RESTRICT,
        UNIQUE(game_id, slot_id, metric_code)
      );

      -- 21. Journal d'audit d'arbitrage
      CREATE TABLE match_arbitration_logs (
        id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        encounter_id TEXT NOT NULL REFERENCES competition_encounters(id) ON DELETE CASCADE,
        match_id TEXT REFERENCES encounter_matches(id) ON DELETE CASCADE,
        slot_id TEXT REFERENCES match_slots(id) ON DELETE CASCADE,
        action_type TEXT NOT NULL,
        author_user_id TEXT NOT NULL REFERENCES users(id),
        reason TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("✔ DDL complet des 21 tables canoniques (tous IDs en TEXT) déployé avec succès.\n");

    // Données positives de base
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

      INSERT INTO tournaments (id, name, slug, game) VALUES 
        ('tourn_1', 'Tournoi National Sénégal', 'tournoi-national-senegal', 'FC25');

      INSERT INTO tournament_editions (id, tournament_id, edition_number, name, start_date) VALUES 
        ('ed_1', 'tourn_1', 1, 'Edition 2026 Dakar', NOW());

      INSERT INTO tournament_staff (id, tournament_id, edition_id, user_id, role) VALUES 
        ('staff_1', 'tourn_1', 'ed_1', 'u_admin', 'HEAD_REFEREE');

      INSERT INTO metric_definitions (code, name, game, metric_type) VALUES 
        ('GOALS', 'Buts marqués', 'FC25', 'INTEGER'),
        ('ASSISTS', 'Passes décisives', 'FC25', 'INTEGER'),
        ('KILLS', 'Eliminations', 'CS2', 'INTEGER');

      INSERT INTO competition_rulesets (id, game, name, discipline) VALUES 
        ('ruleset_fc', 'FC25', 'Règlement Officiel FC25', 'ESPORT');

      -- Version 1 créée en mode brouillon, configurée puis publiée
      INSERT INTO ruleset_versions (id, ruleset_id, version, match_format, is_published) VALUES 
        ('rv_fc_v1', 'ruleset_fc', 1, 'BEST_OF_1', FALSE);

      INSERT INTO ruleset_metric_configs (ruleset_version_id, metric_code, weight) VALUES 
        ('rv_fc_v1', 'GOALS', 1.0);

      UPDATE ruleset_versions SET is_published = TRUE WHERE id = 'rv_fc_v1';

      -- Version 2 créée en parallèle sans altérer la Version 1
      INSERT INTO ruleset_versions (id, ruleset_id, version, match_format, is_published) VALUES 
        ('rv_fc_v2', 'ruleset_fc', 2, 'BEST_OF_3', FALSE);

      INSERT INTO ruleset_metric_configs (ruleset_version_id, metric_code, weight) VALUES 
        ('rv_fc_v2', 'GOALS', 1.0),
        ('rv_fc_v2', 'ASSISTS', 0.5);

      UPDATE ruleset_versions SET is_published = TRUE WHERE id = 'rv_fc_v2';

      INSERT INTO competition_stages (id, edition_id, ruleset_version_id, stage_order, name, stage_type) VALUES 
        ('stage_groups', 'ed_1', 'rv_fc_v1', 1, 'Phase de Groupes', 'GROUPS');

      INSERT INTO competition_groups (id, stage_id, group_order, name) VALUES 
        ('group_a', 'stage_groups', 1, 'Groupe A');

      INSERT INTO competition_rounds (id, stage_id, group_id, round_number, name) VALUES 
        ('round_1', 'stage_groups', 'group_a', 1, 'Journée 1');

      INSERT INTO competition_entrants (id, edition_id, type, user_id, name) VALUES 
        ('ent_solo1', 'ed_1', 'SOLO', 'u_solo1', 'Solo Player');

      INSERT INTO competition_entrants (id, edition_id, type, team_id, name) VALUES 
        ('ent_team_a', 'ed_1', 'TEAM', 'team_a', 'Equipe Alpha'),
        ('ent_team_b', 'ed_1', 'TEAM', 'team_b', 'Equipe Beta');

      INSERT INTO entrant_roster_members (id, edition_id, entrant_id, user_id, in_game_name, role) VALUES 
        ('ros_cap_a', 'ed_1', 'ent_team_a', 'u_cap_a', 'AlphaCaptain', 'CAPTAIN'),
        ('ros_p1_a', 'ed_1', 'ent_team_a', 'u_player_a1', 'AlphaPlayer1', 'STARTER'),
        ('ros_cap_b', 'ed_1', 'ent_team_b', 'u_cap_b', 'BetaCaptain', 'CAPTAIN'),
        ('ros_p1_b', 'ed_1', 'ent_team_b', 'u_player_b1', 'BetaPlayer1', 'STARTER');

      -- Rencontre collective avec match, manche et métrique
      INSERT INTO competition_encounters (id, edition_id, stage_id, encounter_type, ruleset_version_id) VALUES 
        ('enc_coll', 'ed_1', 'stage_groups', 'COLLECTIVE_FIXTURE', 'rv_fc_v1');

      INSERT INTO encounter_sides (id, encounter_id, side_number, name) VALUES 
        ('side_dakar', 'enc_coll', 1, 'Camp Dakar'),
        ('side_thies', 'enc_coll', 2, 'Camp Thiès');

      INSERT INTO encounter_side_entrants (id, edition_id, encounter_id, side_id, entrant_id) VALUES 
        ('se_dakar_a', 'ed_1', 'enc_coll', 'side_dakar', 'ent_team_a'),
        ('se_thies_b', 'ed_1', 'enc_coll', 'side_thies', 'ent_team_b');

      INSERT INTO encounter_matches (id, edition_id, encounter_id, encounter_type, ruleset_version_id, match_order, title) VALUES 
        ('m_sub1', 'ed_1', 'enc_coll', 'COLLECTIVE_FIXTURE', 'rv_fc_v1', 1, 'Sous-Match 1 (Alpha vs Beta)');

      INSERT INTO match_slots (id, edition_id, encounter_id, encounter_type, match_id, slot_position, side_id, assigned_entrant_id) VALUES 
        ('slot_1', 'ed_1', 'enc_coll', 'COLLECTIVE_FIXTURE', 'm_sub1', 1, 'side_dakar', 'ent_team_a'),
        ('slot_2', 'ed_1', 'enc_coll', 'COLLECTIVE_FIXTURE', 'm_sub1', 2, 'side_thies', 'ent_team_b');

      INSERT INTO match_games (id, match_id, game_number) VALUES 
        ('game_1', 'm_sub1', 1);

      INSERT INTO game_metrics (id, ruleset_version_id, match_id, game_id, slot_id, metric_code, raw_value, calculated_points) VALUES 
        ('met_1', 'rv_fc_v1', 'm_sub1', 'game_1', 'slot_1', 'GOALS', 3, 3);
    `);
    console.log("✔ Données positives représentatives et Version 2 insérées avec succès.\n");

    // --- TESTS NÉGATIFS (BLOQUÉS NATIVEMENT PAR POSTGRESQL) ---
    console.log("--- VÉRIFICATION DES 10 CAS DE REJET PAR LE MOTEUR POSTGRESQL ---");

    // 1. Second capitaine
    try {
      await client.query("INSERT INTO entrant_roster_members (id, edition_id, entrant_id, user_id, in_game_name, role) VALUES ('rc_bad', 'ed_1', 'ent_team_a', 'u_player_a1', 'Cap2', 'CAPTAIN');");
      throw new Error("ÉCHEC: 2e capitaine non bloqué.");
    } catch (e: any) {
      if (e.code === '23505' && e.message.includes('entrant_roster_captain_unique')) {
        console.log("✔ Rejet 1 : Second capitaine bloqué par index partiel entrant_roster_captain_unique.");
      } else throw e;
    }

    // 2. Joueur multi-équipes
    try {
      await client.query("INSERT INTO entrant_roster_members (id, edition_id, entrant_id, user_id, in_game_name, role) VALUES ('rc_multi', 'ed_1', 'ent_team_b', 'u_player_a1', 'Traitor', 'STARTER');");
      throw new Error("ÉCHEC: Cumul multi-équipes non bloqué.");
    } catch (e: any) {
      if (e.code === '23505' && e.message.includes('roster_edition_user_unique')) {
        console.log("✔ Rejet 2 : Cumul multi-équipes bloqué par index partiel roster_edition_user_unique.");
      } else throw e;
    }

    // 3. Assignation cross-side
    try {
      await client.query("INSERT INTO match_slots (id, edition_id, encounter_id, encounter_type, match_id, slot_position, side_id, assigned_entrant_id) VALUES ('sl_bad', 'ed_1', 'enc_coll', 'COLLECTIVE_FIXTURE', 'm_sub1', 3, 'side_dakar', 'ent_team_b');");
      throw new Error("ÉCHEC: Assignation cross-side non bloquée.");
    } catch (e: any) {
      if (e.code === '23503' && e.message.includes('match_slots_side_id_assigned_entrant_id_fkey')) {
        console.log("✔ Rejet 3 : Joueur du camp B dans le camp A bloqué par FK composite (side_id, assigned_entrant_id).");
      } else throw e;
    }

    // 4. Incohérence type / side_id
    try {
      await client.query(`
        INSERT INTO competition_encounters (id, edition_id, stage_id, encounter_type, ruleset_version_id) VALUES ('enc_d', 'ed_1', 'stage_groups', 'DUEL', 'rv_fc_v1');
        INSERT INTO encounter_matches (id, edition_id, encounter_id, encounter_type, ruleset_version_id, match_order) VALUES ('m_d', 'ed_1', 'enc_d', 'DUEL', 'rv_fc_v1', 1);
        INSERT INTO match_slots (id, edition_id, encounter_id, encounter_type, match_id, slot_position, side_id, assigned_entrant_id) VALUES ('sl_d_bad', 'ed_1', 'enc_d', 'DUEL', 'm_d', 1, 'side_dakar', 'ent_solo1');
      `);
      throw new Error("ÉCHEC: Slot DUEL avec side_id non bloqué.");
    } catch (e: any) {
      if (e.code === '23514') {
        console.log("✔ Rejet 4 : Slot DUEL avec side_id bloqué par contrainte CHECK.");
      } else throw e;
    }

    // 5. Métrique non configurée
    try {
      await client.query("INSERT INTO game_metrics (id, ruleset_version_id, match_id, game_id, slot_id, metric_code, raw_value) VALUES ('gm_bad1', 'rv_fc_v1', 'm_sub1', 'game_1', 'slot_1', 'KILLS', 5);");
      throw new Error("ÉCHEC: Métrique non configurée non bloquée.");
    } catch (e: any) {
      if (e.code === '23503' && e.message.includes('game_metrics_ruleset_version_id_metric_code_fkey')) {
        console.log("✔ Rejet 5 : Métrique non déclarée dans ruleset_metric_configs bloquée par FK composite.");
      } else throw e;
    }

    // 6. Incohérence Staff tournoi / édition
    try {
      await client.query(`
        INSERT INTO tournaments (id, name, slug, game) VALUES ('tourn_other', 'Autre Tournoi', 'autre-tournoi', 'LOL');
        INSERT INTO tournament_staff (id, tournament_id, edition_id, user_id, role) VALUES ('st_bad', 'tourn_other', 'ed_1', 'u_admin', 'REFEREE');
      `);
      throw new Error("ÉCHEC: Staff incohérent non bloqué.");
    } catch (e: any) {
      if (e.code === '23503' && e.message.includes('tournament_staff_edition_id_tournament_id_fkey')) {
        console.log("✔ Rejet 6 : Staff incohérent bloqué par FK composite (edition_id, tournament_id).");
      } else throw e;
    }

    // 7. IMMUTABILITÉ : Tentative d'UPDATE d'une version publiée
    try {
      await client.query("UPDATE ruleset_versions SET match_format = 'BEST_OF_5' WHERE id = 'rv_fc_v1';");
      throw new Error("ÉCHEC: Modification de règles sur version publiée non bloquée.");
    } catch (e: any) {
      if (e.message.includes('IMMUTABLE_PUBLISHED_RULESET_VERSION')) {
        console.log("✔ Rejet 7 (Immutabilité) : UPDATE sur version publiée bloqué par trigger trg_ruleset_versions_immutability.");
      } else throw e;
    }

    // 8. IMMUTABILITÉ : Tentative de DELETE d'une version publiée
    try {
      await client.query("DELETE FROM ruleset_versions WHERE id = 'rv_fc_v2';");
      throw new Error("ÉCHEC: Suppression de version publiée non bloquée.");
    } catch (e: any) {
      if (e.message.includes('CANNOT_DELETE_PUBLISHED_RULESET_VERSION')) {
        console.log("✔ Rejet 8 (Immutabilité) : DELETE sur version publiée bloqué par trigger trg_ruleset_versions_immutability.");
      } else throw e;
    }

    // 9. IMMUTABILITÉ : Tentative d'ajout de métrique sur version publiée
    try {
      await client.query("INSERT INTO ruleset_metric_configs (ruleset_version_id, metric_code, weight) VALUES ('rv_fc_v1', 'ASSISTS', 0.5);");
      throw new Error("ÉCHEC: Ajout de métrique sur version publiée non bloqué.");
    } catch (e: any) {
      if (e.message.includes('IMMUTABLE_PUBLISHED_RULESET_METRICS')) {
        console.log("✔ Rejet 9 (Immutabilité) : Ajout de métrique sur version publiée bloqué par trigger trg_ruleset_metric_configs_immutability.");
      } else throw e;
    }

    // 10. EXACT MATCH RULESET : Métrique enregistrée avec Version 2 alors que le match est en Version 1
    try {
      // Version 2 autorise ASSISTS, mais Match m_sub1 est lié à Version 1
      await client.query("INSERT INTO game_metrics (id, ruleset_version_id, match_id, game_id, slot_id, metric_code, raw_value) VALUES ('gm_bad_v2', 'rv_fc_v2', 'm_sub1', 'game_1', 'slot_1', 'ASSISTS', 2);");
      throw new Error("ÉCHEC: Incohérence ruleset match/métrique non bloquée.");
    } catch (e: any) {
      if (e.code === '23503' && e.message.includes('game_metrics_match_id_ruleset_version_id_fkey')) {
        console.log("✔ Rejet 10 (Verrou Match/Ruleset) : Métrique avec autre version de ruleset bloquée par FK composite (match_id, ruleset_version_id).\n");
      } else throw e;
    }

    // Nettoyage Partie A
    await client.query(`DROP SCHEMA ${SYNTHETIC_SANDBOX} CASCADE;`);
    console.log(`[CLEANUP] Schéma synthétique '${SYNTHETIC_SANDBOX}' nettoyé avec succès.\n`);

    // ============================================================================
    // PARTIE B : VALIDATION DE LA MIGRATION SUR COPIE RÉELLE DU SCHÉMA GAMES TRAFICS
    // ============================================================================
    console.log("================================================================================");
    console.log(`   PARTIE B : VALIDATION SUR COPIE RÉELLE ISOLÉE (Schéma: ${REAL_SCHEMA_SANDBOX})`);
    console.log("================================================================================\n");

    await client.query(`CREATE SCHEMA ${REAL_SCHEMA_SANDBOX};`);
    await client.query(`SET search_path TO ${REAL_SCHEMA_SANDBOX}, public;`);

    // Recréation des tables réelles Games Trafics (copie miroir exacte de database/schema.ts)
    await client.query(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        role TEXT DEFAULT 'USER',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE teams (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        tag TEXT,
        leader_id TEXT REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE tournaments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        game TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE tournament_editions (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        edition_number INT NOT NULL,
        name TEXT NOT NULL,
        start_date TIMESTAMP WITH TIME ZONE NOT NULL,
        status TEXT NOT NULL DEFAULT 'UPCOMING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(id, tournament_id),
        UNIQUE(tournament_id, edition_number)
      );

      CREATE TABLE financial_accounts (
        id TEXT PRIMARY KEY,
        owner_user_id TEXT REFERENCES users(id),
        owner_shop_id TEXT,
        owner_edition_id TEXT, -- Colonne réelle liant le compte à l'édition
        type TEXT NOT NULL DEFAULT 'USER_WALLET',
        currency TEXT DEFAULT 'GTC',
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE user_wallets (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        financial_account_id TEXT REFERENCES financial_accounts(id),
        is_active BOOLEAN DEFAULT TRUE
      );

      CREATE TABLE wallet_transactions (
        id TEXT PRIMARY KEY,
        wallet_id TEXT NOT NULL REFERENCES user_wallets(id),
        financial_account_id TEXT REFERENCES financial_accounts(id),
        amount NUMERIC(15, 2) NOT NULL,
        fees NUMERIC(15, 2) DEFAULT 0,
        net_amount NUMERIC(15, 2) NOT NULL,
        balance_after NUMERIC(15, 2) NOT NULL,
        currency TEXT DEFAULT 'GTC',
        type TEXT NOT NULL,
        status TEXT DEFAULT 'COMPLETED',
        reference TEXT UNIQUE,
        reversal_of TEXT REFERENCES wallet_transactions(id),
        reversed_by TEXT REFERENCES wallet_transactions(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE ledger_entries (
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL REFERENCES wallet_transactions(id),
        account_id TEXT NOT NULL REFERENCES financial_accounts(id),
        debit NUMERIC(15, 2) DEFAULT 0,
        credit NUMERIC(15, 2) DEFAULT 0,
        currency TEXT DEFAULT 'GTC',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE tournament_members (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id),
        team_id TEXT REFERENCES teams(id),
        role TEXT NOT NULL DEFAULT 'PARTICIPANT',
        display_name TEXT NOT NULL
      );

      CREATE TABLE tournament_phases (
        id TEXT PRIMARY KEY,
        edition_id TEXT NOT NULL REFERENCES tournament_editions(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        order_num INT NOT NULL
      );

      CREATE TABLE phase_groups (
        id TEXT PRIMARY KEY,
        phase_id TEXT NOT NULL REFERENCES tournament_phases(id) ON DELETE CASCADE,
        name TEXT NOT NULL
      );

      CREATE TABLE edition_registrations (
        id TEXT PRIMARY KEY,
        edition_id TEXT NOT NULL REFERENCES tournament_editions(id) ON DELETE CASCADE,
        member_id TEXT NOT NULL REFERENCES tournament_members(id) ON DELETE CASCADE,
        registration_type TEXT DEFAULT 'REGULAR',
        status TEXT DEFAULT 'CONFIRMED'
      );

      CREATE TABLE registration_payments (
        id TEXT PRIMARY KEY,
        registration_id TEXT NOT NULL REFERENCES edition_registrations(id) ON DELETE CASCADE,
        transaction_id TEXT NOT NULL REFERENCES wallet_transactions(id),
        amount NUMERIC(10, 2) NOT NULL,
        currency TEXT DEFAULT 'GTC',
        paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        payment_method TEXT DEFAULT 'WALLET',
        status TEXT DEFAULT 'COMPLETED',
        reference TEXT UNIQUE,
        notes TEXT
      );

      CREATE TABLE matches (
        id TEXT PRIMARY KEY,
        edition_id TEXT NOT NULL REFERENCES tournament_editions(id) ON DELETE CASCADE,
        phase_id TEXT REFERENCES tournament_phases(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'PENDING'
      );

      CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        tournament_id TEXT REFERENCES tournaments(id),
        edition_id TEXT REFERENCES tournament_editions(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE interactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        tournament_id TEXT REFERENCES tournaments(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        tournament_id TEXT REFERENCES tournaments(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Injection de données miroirs représentatives de la base réelle
    await client.query(`
      -- Utilisateurs & Équipes
      INSERT INTO users (id, name, email) VALUES 
        ('u_real_1', 'Amadou Diop', 'amadou@real.sn'),
        ('u_real_2', 'Fatou Ndiaye', 'fatou@real.sn');

      INSERT INTO teams (id, name, leader_id) VALUES 
        ('t_real_1', 'Lions Gaming', 'u_real_1');

      -- 2 Tournois réels miroirs
      INSERT INTO tournaments (id, name, slug, game) VALUES 
        ('4b3e6516-8089-4c1b-a9b5-1cf7d42da01c', 'Tournoi de H3infiniy Gaming', 'tournoi-h3infinity', 'FC25'),
        ('fa82db43-4348-47a2-bf68-a94eacafb4b1', 'Tournoi de rashwightmz', 'tournoi-rashwightmz', 'COD');

      -- 2 Éditions réelles miroirs
      INSERT INTO tournament_editions (id, tournament_id, edition_number, name, start_date) VALUES 
        ('6acb3db9-399b-4b24-b005-6f912cc5de21', '4b3e6516-8089-4c1b-a9b5-1cf7d42da01c', 1, 'H3 Edition 1', NOW()),
        ('16e0181f-cc81-434f-b2f5-dffe38170283', 'fa82db43-4348-47a2-bf68-a94eacafb4b1', 1, 'Rash Edition 1', NOW());

      -- Comptes financiers dont compte escrow d'édition (comme les 13 de prod)
      INSERT INTO financial_accounts (id, owner_user_id, owner_edition_id, type) VALUES 
        ('fa_amadou', 'u_real_1', NULL, 'USER_WALLET'),
        ('fa_edition_escrow', NULL, '6acb3db9-399b-4b24-b005-6f912cc5de21', 'TOURNAMENT_ESCROW');

      INSERT INTO user_wallets (id, user_id, financial_account_id) VALUES 
        ('w_amadou', 'u_real_1', 'fa_amadou');

      -- Transactions financières représentatives (Paiement + Inversion)
      INSERT INTO wallet_transactions (id, wallet_id, financial_account_id, amount, net_amount, fees, balance_after, type, status, reference) VALUES 
        ('tx_entry_1', 'w_amadou', 'fa_amadou', 500.00, 500.00, 0, 1500.00, 'TOURNAMENT_ENTRY', 'COMPLETED', 'REF-ENTRY-1'),
        ('tx_entry_2', 'w_amadou', 'fa_amadou', 200.00, 200.00, 0, 1300.00, 'TOURNAMENT_ENTRY', 'COMPLETED', 'REF-ENTRY-2'),
        ('tx_refund_2', 'w_amadou', 'fa_amadou', 200.00, 200.00, 0, 1500.00, 'REFUND', 'COMPLETED', 'REF-REFUND-2');

      UPDATE wallet_transactions SET reversed_by = 'tx_refund_2' WHERE id = 'tx_entry_2';
      UPDATE wallet_transactions SET reversal_of = 'tx_entry_2' WHERE id = 'tx_refund_2';

      INSERT INTO ledger_entries (id, transaction_id, account_id, debit, credit) VALUES 
        ('led_1', 'tx_entry_1', 'fa_amadou', 500.00, 0),
        ('led_2', 'tx_entry_1', 'fa_edition_escrow', 0, 500.00),
        ('led_3', 'tx_entry_2', 'fa_amadou', 200.00, 0),
        ('led_4', 'tx_entry_2', 'fa_edition_escrow', 0, 200.00),
        ('led_5', 'tx_refund_2', 'fa_edition_escrow', 200.00, 0),
        ('led_6', 'tx_refund_2', 'fa_amadou', 0, 200.00);

      -- Structures sportives anciennes
      INSERT INTO tournament_members (id, tournament_id, user_id, display_name) VALUES 
        ('tm_1', '4b3e6516-8089-4c1b-a9b5-1cf7d42da01c', 'u_real_1', 'Amadou Diop Member');

      INSERT INTO edition_registrations (id, edition_id, member_id, registration_type) VALUES 
        ('reg_real_1', '6acb3db9-399b-4b24-b005-6f912cc5de21', 'tm_1', 'SOLO');

      INSERT INTO registration_payments (id, registration_id, transaction_id, amount, reference, notes) VALUES 
        ('pay_real_1', 'reg_real_1', 'tx_entry_1', 500.00, 'REF-ENTRY-1', 'Paiement inscription réelle');

      INSERT INTO tournament_phases (id, edition_id, name, order_num) VALUES 
        ('ph_1', '6acb3db9-399b-4b24-b005-6f912cc5de21', 'Poules', 1);

      INSERT INTO matches (id, edition_id, phase_id) VALUES 
        ('m_real_1', '6acb3db9-399b-4b24-b005-6f912cc5de21', 'ph_1');

      -- Messages et notifications
      INSERT INTO messages (id, content, tournament_id, edition_id) VALUES 
        ('msg_real_1', 'Match à 18h', '4b3e6516-8089-4c1b-a9b5-1cf7d42da01c', '6acb3db9-399b-4b24-b005-6f912cc5de21');
      INSERT INTO notifications (id, title, tournament_id) VALUES 
        ('notif_real_1', 'Nouveau tournoi', '4b3e6516-8089-4c1b-a9b5-1cf7d42da01c');
    `);

    // SNAPSHOT COMPLET PRÉ-MIGRATION SCHÉMA RÉEL
    const preRealPayments = await client.query("SELECT id, registration_id, transaction_id, amount, currency, status, reference FROM registration_payments ORDER BY id;");
    const preRealWalletTx = await client.query("SELECT id, wallet_id, amount, net_amount, balance_after, reversal_of, reversed_by FROM wallet_transactions ORDER BY id;");
    const preRealLedger = await client.query("SELECT id, transaction_id, account_id, debit, credit FROM ledger_entries ORDER BY id;");
    const preRealAccounts = await client.query("SELECT id, owner_edition_id FROM financial_accounts ORDER BY id;");
    const preRealTournaments = await client.query("SELECT id, name FROM tournaments ORDER BY id;");
    const preRealEditions = await client.query("SELECT id, name FROM tournament_editions ORDER BY id;");
    const preRealMessages = await client.query("SELECT id, tournament_id, edition_id FROM messages ORDER BY id;");

    console.log(`[AUDIT PRÉ-MIGRATION SCHÉMA RÉEL] :
  - Tournois enregistrés    : ${preRealTournaments.rows.length}
  - Éditions enregistrées   : ${preRealEditions.rows.length}
  - Comptes financiers      : ${preRealAccounts.rows.length} (dont liés à des éditions: ${preRealAccounts.rows.filter(r => r.owner_edition_id).length})
  - Paiements enregistrés   : ${preRealPayments.rows.length} (Total: ${preRealPayments.rows.reduce((acc, r) => acc + parseFloat(r.amount), 0).toFixed(2)} GTC)
  - Transactions wallet     : ${preRealWalletTx.rows.length}
  - Écritures ledger        : ${preRealLedger.rows.length}
  - Messages rattachés      : ${preRealMessages.rows.length}`);

    // EXÉCUTION DE LA PROCÉDURE DE MIGRATION DOCUMENTÉE DANS 07-IMPLEMENTATION-ROADMAP.MD
    await client.query(`
      -- 1. Découplage et snapshot d'archivage dans registration_payments
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

      -- 2. Déconnexion de la FK cascade vers les inscriptions
      ALTER TABLE registration_payments DROP CONSTRAINT IF EXISTS registration_payments_registration_id_fkey;
      ALTER TABLE registration_payments ALTER COLUMN registration_id DROP NOT NULL;
      ALTER TABLE registration_payments RENAME COLUMN registration_id TO legacy_registration_id;
      ALTER TABLE registration_payments ADD COLUMN entrant_id TEXT;

      -- 3. Suppression sélective des tables sportives obsolètes (Container Preservation)
      DROP TABLE IF EXISTS matches;
      DROP TABLE IF EXISTS phase_groups;
      DROP TABLE IF EXISTS tournament_phases;
      DROP TABLE IF EXISTS edition_registrations;
      DROP TABLE IF EXISTS tournament_members;
    `);

    // SNAPSHOT COMPLET POST-MIGRATION SCHÉMA RÉEL
    const postRealPayments = await client.query(`
      SELECT id, legacy_registration_id, transaction_id, amount, currency, status, reference,
             archived_edition_id, archived_edition_name, archived_tournament_id, archived_tournament_name,
             archived_user_id, archived_participant_name, archived_registration_type
      FROM registration_payments ORDER BY id;
    `);
    const postRealWalletTx = await client.query("SELECT id, wallet_id, amount, net_amount, balance_after, reversal_of, reversed_by FROM wallet_transactions ORDER BY id;");
    const postRealLedger = await client.query("SELECT id, transaction_id, account_id, debit, credit FROM ledger_entries ORDER BY id;");
    const postRealAccounts = await client.query("SELECT id, owner_edition_id FROM financial_accounts ORDER BY id;");
    const postRealTournaments = await client.query("SELECT id, name FROM tournaments ORDER BY id;");
    const postRealEditions = await client.query("SELECT id, name FROM tournament_editions ORDER BY id;");
    const postRealMessages = await client.query("SELECT id, tournament_id, edition_id FROM messages ORDER BY id;");

    console.log(`\n[AUDIT POST-MIGRATION SCHÉMA RÉEL] :
  - Tournois préservés     : ${postRealTournaments.rows.length}
  - Éditions préservées    : ${postRealEditions.rows.length}
  - Comptes financiers     : ${postRealAccounts.rows.length} (dont liés à des éditions: ${postRealAccounts.rows.filter(r => r.owner_edition_id).length})
  - Paiements vérifiés     : ${postRealPayments.rows.length} (Total: ${postRealPayments.rows.reduce((acc, r) => acc + parseFloat(r.amount), 0).toFixed(2)} GTC)
  - Transactions wallet    : ${postRealWalletTx.rows.length}
  - Écritures ledger       : ${postRealLedger.rows.length}
  - Messages rattachés     : ${postRealMessages.rows.length}`);

    // VALIDATION STRICTE CHAMP PAR CHAMP
    if (preRealPayments.rows.length !== postRealPayments.rows.length) {
      throw new Error(`Incohérence paiements: pré=${preRealPayments.rows.length}, post=${postRealPayments.rows.length}`);
    }

    const pay = postRealPayments.rows[0];
    if (pay.legacy_registration_id !== 'reg_real_1') throw new Error("legacy_registration_id incorrect");
    if (pay.archived_edition_name !== 'H3 Edition 1') throw new Error("archived_edition_name incorrect");
    if (pay.archived_tournament_name !== 'Tournoi de H3infiniy Gaming') throw new Error("archived_tournament_name incorrect");
    if (pay.archived_participant_name !== 'Amadou Diop Member') throw new Error("archived_participant_name incorrect");

    // Intégrité absolue des conteneurs et flux financiers
    if (JSON.stringify(preRealTournaments.rows) !== JSON.stringify(postRealTournaments.rows)) {
      throw new Error("Altération des tournois conteneurs détectée !");
    }
    if (JSON.stringify(preRealEditions.rows) !== JSON.stringify(postRealEditions.rows)) {
      throw new Error("Altération des éditions conteneurs détectée !");
    }
    if (JSON.stringify(preRealAccounts.rows) !== JSON.stringify(postRealAccounts.rows)) {
      throw new Error("Altération des comptes financiers détectée !");
    }
    if (JSON.stringify(preRealWalletTx.rows) !== JSON.stringify(postRealWalletTx.rows)) {
      throw new Error("Altération des transactions de portefeuille détectée !");
    }
    if (JSON.stringify(preRealLedger.rows) !== JSON.stringify(postRealLedger.rows)) {
      throw new Error("Altération des écritures de ledger double-entrée détectée !");
    }
    if (JSON.stringify(preRealMessages.rows) !== JSON.stringify(postRealMessages.rows)) {
      throw new Error("Altération des messages rattachés détectée !");
    }

    console.log("✔ Validation sur copie réelle 100% conforme : Container Preservation respecté, zéro perte financière, snapshot d'archive complet.\n");

    // Nettoyage Partie B
    await client.query(`DROP SCHEMA ${REAL_SCHEMA_SANDBOX} CASCADE;`);
    console.log(`[CLEANUP] Schéma de copie réelle '${REAL_SCHEMA_SANDBOX}' nettoyé avec succès.`);

    console.log("================================================================================");
    console.log("   TOUTES LES VALIDATIONS ONT RÉUSSI AVEC SUCCÈS (GO FINAL VALIDÉ)");
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
