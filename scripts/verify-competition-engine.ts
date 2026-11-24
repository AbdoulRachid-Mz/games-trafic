/**
 * Script de validation technique et de reproduction du Moteur de Compétition Games Trafics.
 * 
 * Exécute sous PostgreSQL 17.12 :
 * 1. Création complète des 21 tables canoniques et contraintes cibles
 * 2. Vérification des index partiels et clés étrangères composites
 * 3. Exécution des opérations positives représentatives (SOLO, TEAM, GUEST, Collectif, Métriques)
 * 4. Exécution et validation des 6 tests négatifs bloqués au niveau SGBD
 * 5. Vérification du versionnage immuable et des suppressions contrôlées (RESTRICT)
 * 6. Audit approfondi avant/après de la migration financière (zéro perte, traçabilité intégrale)
 * 
 * Exécution :
 * bun scripts/verify-competition-engine.ts
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("ERREUR: DATABASE_URL n'est pas définie dans l'environnement.");
  process.exit(1);
}

const pool = new Pool({ connectionString: databaseUrl });

const SANDBOX_SCHEMA = 'test_competition_engine_sandbox';

async function runVerification() {
  const client = await pool.connect();
  console.log("================================================================================");
  console.log("   GAMES TRAFICS — BANC D'ESSAI TECHNIQUE DU MOTEUR DE COMPÉTITION");
  console.log("================================================================================\n");

  try {
    // 0. Version PostgreSQL
    const versionRes = await client.query('SELECT version();');
    const pgVersion = versionRes.rows[0].version;
    console.log(`[ENV] Moteur SGBD détecté :\n${pgVersion}\n`);

    // 1. Initialisation sandbox isolée
    await client.query(`DROP SCHEMA IF EXISTS ${SANDBOX_SCHEMA} CASCADE;`);
    await client.query(`CREATE SCHEMA ${SANDBOX_SCHEMA};`);
    await client.query(`SET search_path TO ${SANDBOX_SCHEMA}, public;`);
    console.log(`[OK] Schéma sandbox '${SANDBOX_SCHEMA}' initialisé.\n`);

    // 2. Initialisation des tables socles
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

      CREATE TABLE financial_accounts (
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        financial_account_id TEXT REFERENCES financial_accounts(id),
        pin_hash TEXT NOT NULL DEFAULT 'fake_hash',
        is_active BOOLEAN DEFAULT TRUE,
        is_locked BOOLEAN DEFAULT FALSE
      );

      CREATE TABLE wallet_transactions (
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
        transaction_id TEXT NOT NULL REFERENCES wallet_transactions(id),
        account_id TEXT NOT NULL REFERENCES financial_accounts(id),
        debit NUMERIC(15, 2) DEFAULT 0,
        credit NUMERIC(15, 2) DEFAULT 0,
        currency TEXT DEFAULT 'GTC',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE messages (
        id TEXT PRIMARY KEY,
        content TEXT NOT NULL,
        tournament_id TEXT,
        edition_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE interactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        tournament_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        tournament_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("[OK] Tables socles (Users, Teams, FinancialAccounts, Wallets, Ledger, Messages) initialisées.\n");

    // 3. Déploiement des 21 Tables Canoniques du Moteur de Compétition
    console.log("--- 1. CRÉATION DES 21 TABLES CANONIQUES ET DES CONTRAINTES CIBLES ---");
    await client.query(`
      -- 1. Tournois
      CREATE TABLE tournaments (
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
        game TEXT NOT NULL,
        name TEXT NOT NULL,
        discipline TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- 8. Versions immuables des rulesets
      CREATE TABLE ruleset_versions (
        id TEXT PRIMARY KEY,
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

      -- 11. Phases / Stages de compétition
      CREATE TABLE competition_stages (
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
        stage_id TEXT NOT NULL REFERENCES competition_stages(id) ON DELETE CASCADE,
        group_order INT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(id, stage_id),
        UNIQUE(stage_id, group_order)
      );

      -- 13. Rounds
      CREATE TABLE competition_rounds (
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
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
        UNIQUE(id, encounter_type)
      );

      -- 15. Camps de rencontre collective
      CREATE TABLE encounter_sides (
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
        edition_id TEXT NOT NULL,
        encounter_id TEXT NOT NULL,
        encounter_type TEXT NOT NULL,
        match_order INT NOT NULL DEFAULT 1,
        title TEXT NOT NULL DEFAULT 'Match 1',
        match_format TEXT NOT NULL DEFAULT 'BEST_OF_1',
        points_weight NUMERIC(12, 4) DEFAULT 1.0,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        FOREIGN KEY (encounter_id, edition_id) REFERENCES competition_encounters(id, edition_id) ON DELETE CASCADE,
        FOREIGN KEY (encounter_id, encounter_type) REFERENCES competition_encounters(id, encounter_type) ON DELETE CASCADE,
        UNIQUE(encounter_id, match_order),
        UNIQUE(id, encounter_id),
        UNIQUE(id, edition_id),
        UNIQUE(id, encounter_type)
      );

      -- 18. Slots participants d'un match (match_slots)
      CREATE TABLE match_slots (
        id TEXT PRIMARY KEY,
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
        id TEXT PRIMARY KEY,
        match_id TEXT NOT NULL REFERENCES encounter_matches(id) ON DELETE CASCADE,
        game_number INT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDING',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(match_id, game_number),
        UNIQUE(id, match_id)
      );

      -- 20. Métriques de performance par manche (game_metrics)
      CREATE TABLE game_metrics (
        id TEXT PRIMARY KEY,
        ruleset_version_id TEXT NOT NULL,
        match_id TEXT NOT NULL,
        game_id TEXT NOT NULL,
        slot_id TEXT NOT NULL,
        metric_code TEXT NOT NULL,
        raw_value NUMERIC(15, 4) NOT NULL DEFAULT 0,
        calculated_points NUMERIC(12, 4) NOT NULL DEFAULT 0,
        FOREIGN KEY (game_id, match_id) REFERENCES match_games(id, match_id) ON DELETE CASCADE,
        FOREIGN KEY (slot_id, match_id) REFERENCES match_slots(id, match_id) ON DELETE CASCADE,
        FOREIGN KEY (ruleset_version_id, metric_code) REFERENCES ruleset_metric_configs(ruleset_version_id, metric_code) ON DELETE RESTRICT,
        UNIQUE(game_id, slot_id, metric_code)
      );

      -- 21. Journal d'audit d'arbitrage
      CREATE TABLE match_arbitration_logs (
        id TEXT PRIMARY KEY,
        encounter_id TEXT NOT NULL REFERENCES competition_encounters(id) ON DELETE CASCADE,
        match_id TEXT REFERENCES encounter_matches(id) ON DELETE CASCADE,
        slot_id TEXT REFERENCES match_slots(id) ON DELETE CASCADE,
        action_type TEXT NOT NULL,
        author_user_id TEXT NOT NULL REFERENCES users(id),
        reason TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log("[OK] Les 21 tables canoniques et contraintes cibles créées avec succès sous PostgreSQL 17.\n");

    // 4. Suite de Tests Positifs
    console.log("--- 2. EXÉCUTION DES INSERTIONS POSITIVES REPRÉSENTATIVES ---");
    // Données de base
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
        ('KILLS', 'Eliminations', 'CS2', 'INTEGER');

      INSERT INTO competition_rulesets (id, game, name, discipline) VALUES 
        ('ruleset_fc', 'FC25', 'Règlement Officiel FC25', 'ESPORT');

      INSERT INTO ruleset_versions (id, ruleset_id, version, is_published) VALUES 
        ('rv_fc_v1', 'ruleset_fc', 1, TRUE);

      INSERT INTO ruleset_metric_configs (ruleset_version_id, metric_code, weight) VALUES 
        ('rv_fc_v1', 'GOALS', 1.0);

      INSERT INTO competition_stages (id, edition_id, ruleset_version_id, stage_order, name, stage_type) VALUES 
        ('stage_groups', 'ed_1', 'rv_fc_v1', 1, 'Phase de Groupes', 'GROUPS');

      INSERT INTO competition_groups (id, stage_id, group_order, name) VALUES 
        ('group_a', 'stage_groups', 1, 'Groupe A');

      INSERT INTO competition_rounds (id, stage_id, group_id, round_number, name) VALUES 
        ('round_1', 'stage_groups', 'group_a', 1, 'Journée 1');

      -- Inscription SOLO
      INSERT INTO competition_entrants (id, edition_id, type, user_id, name) VALUES 
        ('ent_solo1', 'ed_1', 'SOLO', 'u_solo1', 'Solo Player');

      -- Inscription TEAM (Equipe Alpha)
      INSERT INTO competition_entrants (id, edition_id, type, team_id, name) VALUES 
        ('ent_team_a', 'ed_1', 'TEAM', 'team_a', 'Equipe Alpha');

      -- Inscription TEAM (Equipe Beta)
      INSERT INTO competition_entrants (id, edition_id, type, team_id, name) VALUES 
        ('ent_team_b', 'ed_1', 'TEAM', 'team_b', 'Equipe Beta');

      -- Roster Equipe Alpha
      INSERT INTO entrant_roster_members (id, edition_id, entrant_id, user_id, in_game_name, role) VALUES 
        ('ros_cap_a', 'ed_1', 'ent_team_a', 'u_cap_a', 'AlphaCaptain', 'CAPTAIN'),
        ('ros_p1_a', 'ed_1', 'ent_team_a', 'u_player_a1', 'AlphaPlayer1', 'STARTER');

      -- Roster Equipe Beta
      INSERT INTO entrant_roster_members (id, edition_id, entrant_id, user_id, in_game_name, role) VALUES 
        ('ros_cap_b', 'ed_1', 'ent_team_b', 'u_cap_b', 'BetaCaptain', 'CAPTAIN'),
        ('ros_p1_b', 'ed_1', 'ent_team_b', 'u_player_b1', 'BetaPlayer1', 'STARTER');

      -- Rencontre Collective Inter-Régions (Dakar vs Thiès)
      INSERT INTO competition_encounters (id, edition_id, stage_id, encounter_type, ruleset_version_id) VALUES 
        ('enc_coll', 'ed_1', 'stage_groups', 'COLLECTIVE_FIXTURE', 'rv_fc_v1');

      INSERT INTO encounter_sides (id, encounter_id, side_number, name) VALUES 
        ('side_dakar', 'enc_coll', 1, 'Camp Dakar'),
        ('side_thies', 'enc_coll', 2, 'Camp Thiès');

      INSERT INTO encounter_side_entrants (id, edition_id, encounter_id, side_id, entrant_id) VALUES 
        ('se_dakar_a', 'ed_1', 'enc_coll', 'side_dakar', 'ent_team_a'),
        ('se_thies_b', 'ed_1', 'enc_coll', 'side_thies', 'ent_team_b');

      INSERT INTO encounter_matches (id, edition_id, encounter_id, encounter_type, match_order, title) VALUES 
        ('m_sub1', 'ed_1', 'enc_coll', 'COLLECTIVE_FIXTURE', 1, 'Sous-Match 1 (Alpha vs Beta)');

      INSERT INTO match_slots (id, edition_id, encounter_id, encounter_type, match_id, slot_position, side_id, assigned_entrant_id) VALUES 
        ('slot_1', 'ed_1', 'enc_coll', 'COLLECTIVE_FIXTURE', 'm_sub1', 1, 'side_dakar', 'ent_team_a'),
        ('slot_2', 'ed_1', 'enc_coll', 'COLLECTIVE_FIXTURE', 'm_sub1', 2, 'side_thies', 'ent_team_b');

      INSERT INTO match_games (id, match_id, game_number) VALUES 
        ('game_1', 'm_sub1', 1);

      INSERT INTO game_metrics (id, ruleset_version_id, match_id, game_id, slot_id, metric_code, raw_value, calculated_points) VALUES 
        ('met_1', 'rv_fc_v1', 'm_sub1', 'game_1', 'slot_1', 'GOALS', 3, 3),
        ('met_2', 'rv_fc_v1', 'm_sub1', 'game_1', 'slot_2', 'GOALS', 1, 1);

      -- Rencontre DUEL Directe
      INSERT INTO competition_encounters (id, edition_id, stage_id, encounter_type, ruleset_version_id) VALUES 
        ('enc_duel', 'ed_1', 'stage_groups', 'DUEL', 'rv_fc_v1');

      INSERT INTO encounter_matches (id, edition_id, encounter_id, encounter_type, match_order, title) VALUES 
        ('m_duel', 'ed_1', 'enc_duel', 'DUEL', 1, 'Duel Direct 1v1');

      INSERT INTO match_slots (id, edition_id, encounter_id, encounter_type, match_id, slot_position, assigned_entrant_id) VALUES 
        ('slot_duel_1', 'ed_1', 'enc_duel', 'DUEL', 'm_duel', 1, 'ent_solo1');
    `);
    console.log("[OK] Toutes les insertions positives (SOLO, TEAM, Roster, Collectif, Duel, Métriques) ont réussi.\n");

    // 5. Suite des 6 Tests Négatifs Bloqués au Niveau SGBD
    console.log("--- 3. EXÉCUTION DES 6 TESTS NÉGATIFS (BLOQUÉS PAR POSTGRESQL) ---");

    // Test N1 : 2e capitaine sur le même entrant
    try {
      await client.query(`
        INSERT INTO entrant_roster_members (id, edition_id, entrant_id, user_id, in_game_name, role) VALUES 
          ('ros_cap_illegal', 'ed_1', 'ent_team_a', 'u_player_a1', 'SecondCap', 'CAPTAIN');
      `);
      throw new Error("ÉCHEC: Le second capitaine aurait dû être rejeté par entrant_roster_captain_unique.");
    } catch (e: any) {
      if (e.code === '23505' && e.message.includes('entrant_roster_captain_unique')) {
        console.log("✔ Test Négatif 1 validé : 2e capitaine rejeté par l'index partiel entrant_roster_captain_unique (code 23505).");
      } else throw e;
    }

    // Test N2 : Même joueur dans 2 équipes de la même édition
    try {
      await client.query(`
        INSERT INTO entrant_roster_members (id, edition_id, entrant_id, user_id, in_game_name, role) VALUES 
          ('ros_cumul_illegal', 'ed_1', 'ent_team_b', 'u_player_a1', 'PlayerTraitor', 'STARTER');
      `);
      throw new Error("ÉCHEC: Le cumul multi-équipes aurait dû être rejeté par roster_edition_user_unique.");
    } catch (e: any) {
      if (e.code === '23505' && e.message.includes('roster_edition_user_unique')) {
        console.log("✔ Test Négatif 2 validé : Cumul multi-équipes rejeté par roster_edition_user_unique (code 23505).");
      } else throw e;
    }

    // Test N3 : Assignation d'un joueur du Camp B dans le Camp A
    try {
      await client.query(`
        INSERT INTO match_slots (id, edition_id, encounter_id, encounter_type, match_id, slot_position, side_id, assigned_entrant_id) VALUES 
          ('slot_inv_illegal', 'ed_1', 'enc_coll', 'COLLECTIVE_FIXTURE', 'm_sub1', 3, 'side_dakar', 'ent_team_b');
      `);
      throw new Error("ÉCHEC: L'assignation cross-side aurait dû être rejetée par la FK composite match_slots(side_id, assigned_entrant_id).");
    } catch (e: any) {
      if (e.code === '23503' && e.message.includes('match_slots_side_id_assigned_entrant_id_fkey')) {
        console.log("✔ Test Négatif 3 validé : Assignation cross-side rejetée par FK composite (side_id, assigned_entrant_id) (code 23503).");
      } else throw e;
    }

    // Test N4 : Rencontre DUEL avec un side_id (ou COLLECTIVE sans side_id)
    try {
      await client.query(`
        INSERT INTO match_slots (id, edition_id, encounter_id, encounter_type, match_id, slot_position, side_id, assigned_entrant_id) VALUES 
          ('slot_type_illegal', 'ed_1', 'enc_duel', 'DUEL', 'm_duel', 2, 'side_dakar', 'ent_solo1');
      `);
      throw new Error("ÉCHEC: Le slot DUEL avec side_id aurait dû être rejeté par la contrainte CHECK conditionnelle.");
    } catch (e: any) {
      if (e.code === '23514') {
        console.log("✔ Test Négatif 4 validé : Incohérence type/side_id rejetée par contrainte CHECK (code 23514).");
      } else throw e;
    }

    // Test N5 : Métrique non autorisée par le ruleset de la phase
    try {
      await client.query(`
        INSERT INTO game_metrics (id, ruleset_version_id, match_id, game_id, slot_id, metric_code, raw_value) VALUES 
          ('met_rogue', 'rv_fc_v1', 'm_sub1', 'game_1', 'slot_1', 'KILLS', 10);
      `);
      throw new Error("ÉCHEC: La métrique KILLS aurait dû être rejetée car absente de ruleset_metric_configs pour rv_fc_v1.");
    } catch (e: any) {
      if (e.code === '23503' && e.message.includes('game_metrics_ruleset_version_id_metric_code_fkey')) {
        console.log("✔ Test Négatif 5 validé : Métrique non configurée rejetée par FK composite ruleset_metric_configs (code 23503).");
      } else throw e;
    }

    // Test N6 : Staff lié à une édition n'appartenant pas au tournoi spécifié
    try {
      await client.query(`
        INSERT INTO tournaments (id, name, slug, game) VALUES ('tourn_other', 'Autre Tournoi', 'autre-tournoi', 'LOL');
        INSERT INTO tournament_staff (id, tournament_id, edition_id, user_id, role) VALUES 
          ('staff_illegal', 'tourn_other', 'ed_1', 'u_admin', 'REFEREE');
      `);
      throw new Error("ÉCHEC: Le staff incohérent tournoi/édition aurait dû être rejeté.");
    } catch (e: any) {
      if (e.code === '23503' && e.message.includes('tournament_staff_edition_id_tournament_id_fkey')) {
        console.log("✔ Test Négatif 6 validé : Staff incohérent rejeté par FK composite (edition_id, tournament_id) (code 23503).\n");
      } else throw e;
    }

    // 6. Test d'Immuabilité et Suppression Contrôlée (RESTRICT)
    console.log("--- 4. VÉRIFICATION DE L'IMMUABILITÉ ET DU CONTRÔLE RESTRICT ---");
    // Suppression d'un entrant ayant des slots de match affectés -> Doit être rejetée par ON DELETE RESTRICT
    try {
      await client.query("DELETE FROM competition_entrants WHERE id = 'ent_team_a';");
      throw new Error("ÉCHEC: La suppression d'un entrant en jeu aurait dû être bloquée par RESTRICT.");
    } catch (e: any) {
      if (e.code === '23503') {
        console.log("✔ Suppression contrôlée validée : Entrant avec slots actifs protégé contre toute suppression par RESTRICT (code 23503).");
      } else throw e;
    }

    // Suppression d'un ruleset versionné lié à une phase -> Doit être rejetée par ON DELETE RESTRICT
    try {
      await client.query("DELETE FROM ruleset_versions WHERE id = 'rv_fc_v1';");
      throw new Error("ÉCHEC: La suppression d'une version de ruleset active aurait dû être bloquée par RESTRICT.");
    } catch (e: any) {
      if (e.code === '23503') {
        console.log("✔ Immuabilité validée : Version de ruleset en cours protégée contre toute suppression par RESTRICT (code 23503).\n");
      } else throw e;
    }

    // 7. Audit Approfondi de la Migration Financière
    console.log("--- 5. AUDIT COMPARATIF APPROFONDI DE LA MIGRATION FINANCIÈRE ---");
    
    // Setup représentatif de l'ancienne structure financière et sportive
    await client.query(`
      -- Tables anciennes
      CREATE TABLE old_tournaments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL
      );
      CREATE TABLE old_tournament_editions (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL REFERENCES old_tournaments(id),
        name TEXT NOT NULL
      );
      CREATE TABLE old_tournament_members (
        id TEXT PRIMARY KEY,
        tournament_id TEXT NOT NULL REFERENCES old_tournaments(id),
        user_id TEXT REFERENCES users(id),
        team_id TEXT REFERENCES teams(id),
        display_name TEXT NOT NULL
      );
      CREATE TABLE old_edition_registrations (
        id TEXT PRIMARY KEY,
        edition_id TEXT NOT NULL REFERENCES old_tournament_editions(id) ON DELETE CASCADE,
        member_id TEXT NOT NULL REFERENCES old_tournament_members(id) ON DELETE CASCADE,
        registration_type TEXT NOT NULL,
        status TEXT DEFAULT 'CONFIRMED'
      );
      CREATE TABLE old_registration_payments (
        id TEXT PRIMARY KEY,
        registration_id TEXT NOT NULL REFERENCES old_edition_registrations(id) ON DELETE CASCADE,
        transaction_id TEXT NOT NULL UNIQUE REFERENCES wallet_transactions(id),
        amount NUMERIC(10, 2) NOT NULL,
        currency TEXT DEFAULT 'GTC',
        paid_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        payment_method TEXT DEFAULT 'WALLET',
        payment_provider TEXT DEFAULT 'INTERNAL',
        status TEXT DEFAULT 'COMPLETED',
        reference TEXT UNIQUE,
        notes TEXT,
        metadata JSONB DEFAULT '{}'
      );

      -- Insertion de données représentatives
      INSERT INTO old_tournaments (id, name) VALUES ('old_t1', 'Tournoi Historique 2025');
      INSERT INTO old_tournament_editions (id, tournament_id, name) VALUES ('old_e1', 'old_t1', 'Édition Inaugurale 2025');
      INSERT INTO old_tournament_members (id, tournament_id, user_id, display_name) VALUES 
        ('old_m1', 'old_t1', 'u_solo1', 'Solo Player Historic');
      INSERT INTO old_edition_registrations (id, edition_id, member_id, registration_type) VALUES 
        ('old_reg1', 'old_e1', 'old_m1', 'SOLO');

      -- Configuration financière
      INSERT INTO financial_accounts (id, owner_user_id, owner_edition_id, type, currency) VALUES 
        ('fa_u_solo', 'u_solo1', NULL, 'USER_WALLET', 'GTC'),
        ('fa_edition', NULL, 'old_e1', 'TOURNAMENT_ESCROW', 'GTC');

      INSERT INTO user_wallets (id, user_id, financial_account_id) VALUES 
        ('w_solo1', 'u_solo1', 'fa_u_solo');

      -- Transactions financières représentatives (Paiement normal + Remboursement avec inversion)
      INSERT INTO wallet_transactions (id, wallet_id, financial_account_id, amount, net_amount, fees, balance_after, currency, type, status, reference) VALUES 
        ('tx_pay_1', 'w_solo1', 'fa_u_solo', 250.00, 250.00, 0, 750.00, 'GTC', 'TOURNAMENT_ENTRY', 'COMPLETED', 'REF-PAY-001'),
        ('tx_pay_2', 'w_solo1', 'fa_u_solo', 100.00, 100.00, 0, 650.00, 'GTC', 'TOURNAMENT_ENTRY', 'COMPLETED', 'REF-PAY-002'),
        ('tx_refund_2', 'w_solo1', 'fa_u_solo', 100.00, 100.00, 0, 750.00, 'GTC', 'REFUND', 'COMPLETED', 'REF-REV-002');

      -- Liaison de contrepartie (reversal_of / reversed_by)
      UPDATE wallet_transactions SET reversed_by = 'tx_refund_2' WHERE id = 'tx_pay_2';
      UPDATE wallet_transactions SET reversal_of = 'tx_pay_2' WHERE id = 'tx_refund_2';

      -- Écritures double-entrée
      INSERT INTO ledger_entries (id, transaction_id, account_id, debit, credit) VALUES 
        ('led_1_deb', 'tx_pay_1', 'fa_u_solo', 250.00, 0),
        ('led_1_crd', 'tx_pay_1', 'fa_edition', 0, 250.00),
        ('led_2_deb', 'tx_pay_2', 'fa_u_solo', 100.00, 0),
        ('led_2_crd', 'tx_pay_2', 'fa_edition', 0, 100.00),
        ('led_3_deb', 'tx_refund_2', 'fa_edition', 100.00, 0),
        ('led_3_crd', 'tx_refund_2', 'fa_u_solo', 0, 100.00);

      -- Paiements d'inscriptions
      INSERT INTO old_registration_payments (id, registration_id, transaction_id, amount, currency, status, reference, payment_method, notes) VALUES 
        ('pay_1', 'old_reg1', 'tx_pay_1', 250.00, 'GTC', 'COMPLETED', 'REF-PAY-001', 'WALLET', 'Paiement valide'),
        ('pay_2', 'old_reg1', 'tx_pay_2', 100.00, 'GTC', 'REFUNDED', 'REF-PAY-002', 'WALLET', 'Paiement remboursé');

      -- Références dans messages, interactions et notifications
      INSERT INTO messages (id, content, tournament_id, edition_id) VALUES 
        ('msg_1', 'Bienvenue au tournoi historique !', 'old_t1', 'old_e1');
      INSERT INTO interactions (id, type, tournament_id) VALUES 
        ('inter_1', 'LIKE', 'old_t1');
      INSERT INTO notifications (id, title, tournament_id) VALUES 
        ('notif_1', 'Le tournoi va démarrer', 'old_t1');
    `);

    // SNAPSHOT COMPLET PRÉ-MIGRATION
    const prePayments = await client.query(`
      SELECT id, registration_id, transaction_id, amount, currency, status, reference, payment_method, notes 
      FROM old_registration_payments ORDER BY id;
    `);
    const preWalletTx = await client.query(`
      SELECT id, wallet_id, amount, net_amount, fees, balance_after, currency, type, status, reference, reversal_of, reversed_by 
      FROM wallet_transactions ORDER BY id;
    `);
    const preLedger = await client.query(`
      SELECT id, transaction_id, account_id, debit, credit FROM ledger_entries ORDER BY id;
    `);
    const preFinancialAccounts = await client.query(`
      SELECT id, owner_user_id, owner_edition_id, type FROM financial_accounts ORDER BY id;
    `);
    const preMessages = await client.query("SELECT id, tournament_id, edition_id FROM messages ORDER BY id;");
    const preInteractions = await client.query("SELECT id, tournament_id FROM interactions ORDER BY id;");
    const preNotifications = await client.query("SELECT id, tournament_id FROM notifications ORDER BY id;");

    console.log(`[AUDIT PRÉ-MIGRATION] :
  - Paiements enregistrés : ${prePayments.rows.length} (Total: ${prePayments.rows.reduce((acc, r) => acc + parseFloat(r.amount), 0).toFixed(2)} GTC)
  - Transactions wallet   : ${preWalletTx.rows.length}
  - Écritures ledger      : ${preLedger.rows.length}
  - Comptes financiers    : ${preFinancialAccounts.rows.length} (dont liés à des éditions: ${preFinancialAccounts.rows.filter(r => r.owner_edition_id).length})
  - Messages/Notifs liés  : ${preMessages.rows.length + preInteractions.rows.length + preNotifications.rows.length}`);

    // EXÉCUTION DU PROTOCOLE DE MIGRATION SÉCURISÉE (CONTAINER PRESERVATION)
    // 1. Découplage et snapshot d'archive dans registration_payments
    await client.query(`
      ALTER TABLE old_registration_payments ADD COLUMN IF NOT EXISTS archived_edition_id TEXT;
      ALTER TABLE old_registration_payments ADD COLUMN IF NOT EXISTS archived_edition_name TEXT;
      ALTER TABLE old_registration_payments ADD COLUMN IF NOT EXISTS archived_tournament_id TEXT;
      ALTER TABLE old_registration_payments ADD COLUMN IF NOT EXISTS archived_tournament_name TEXT;
      ALTER TABLE old_registration_payments ADD COLUMN IF NOT EXISTS archived_user_id TEXT;
      ALTER TABLE old_registration_payments ADD COLUMN IF NOT EXISTS archived_team_id TEXT;
      ALTER TABLE old_registration_payments ADD COLUMN IF NOT EXISTS archived_participant_name TEXT;
      ALTER TABLE old_registration_payments ADD COLUMN IF NOT EXISTS archived_registration_type TEXT;

      UPDATE old_registration_payments rp
      SET 
        archived_edition_id = te.id,
        archived_edition_name = te.name,
        archived_tournament_id = t.id,
        archived_tournament_name = t.name,
        archived_user_id = tm.user_id,
        archived_team_id = tm.team_id,
        archived_participant_name = tm.display_name,
        archived_registration_type = er.registration_type
      FROM old_edition_registrations er
      JOIN old_tournament_editions te ON te.id = er.edition_id
      JOIN old_tournaments t ON t.id = te.tournament_id
      JOIN old_tournament_members tm ON tm.id = er.member_id
      WHERE er.id = rp.registration_id;

      -- Déconnexion de la FK cascade
      ALTER TABLE old_registration_payments DROP CONSTRAINT IF EXISTS old_registration_payments_registration_id_fkey;
      ALTER TABLE old_registration_payments ALTER COLUMN registration_id DROP NOT NULL;
      ALTER TABLE old_registration_payments RENAME COLUMN registration_id TO legacy_registration_id;
      ALTER TABLE old_registration_payments ADD COLUMN entrant_id TEXT;

      -- Suppression UNIQUEMENT des tables sportives obsolètes (CONTAINER PRESERVATION)
      DROP TABLE old_edition_registrations;
      DROP TABLE old_tournament_members;
    `);

    // SNAPSHOT COMPLET POST-MIGRATION
    const postPayments = await client.query(`
      SELECT id, legacy_registration_id, transaction_id, amount, currency, status, reference, payment_method, notes,
             archived_edition_id, archived_edition_name, archived_tournament_id, archived_tournament_name,
             archived_user_id, archived_team_id, archived_participant_name, archived_registration_type
      FROM old_registration_payments ORDER BY id;
    `);
    const postWalletTx = await client.query(`
      SELECT id, wallet_id, amount, net_amount, fees, balance_after, currency, type, status, reference, reversal_of, reversed_by 
      FROM wallet_transactions ORDER BY id;
    `);
    const postLedger = await client.query(`
      SELECT id, transaction_id, account_id, debit, credit FROM ledger_entries ORDER BY id;
    `);
    const postFinancialAccounts = await client.query(`
      SELECT id, owner_user_id, owner_edition_id, type FROM financial_accounts ORDER BY id;
    `);
    const postMessages = await client.query("SELECT id, tournament_id, edition_id FROM messages ORDER BY id;");
    const postInteractions = await client.query("SELECT id, tournament_id FROM interactions ORDER BY id;");
    const postNotifications = await client.query("SELECT id, tournament_id FROM notifications ORDER BY id;");

    console.log(`\n[AUDIT POST-MIGRATION] :
  - Paiements enregistrés : ${postPayments.rows.length} (Total: ${postPayments.rows.reduce((acc, r) => acc + parseFloat(r.amount), 0).toFixed(2)} GTC)
  - Transactions wallet   : ${postWalletTx.rows.length}
  - Écritures ledger      : ${postLedger.rows.length}
  - Comptes financiers    : ${postFinancialAccounts.rows.length} (dont liés à des éditions: ${postFinancialAccounts.rows.filter(r => r.owner_edition_id).length})
  - Messages/Notifs liés  : ${postMessages.rows.length + postInteractions.rows.length + postNotifications.rows.length}`);

    // VÉRIFICATIONS D'ÉGALITÉ STRICTE CHAMP PAR CHAMP
    if (prePayments.rows.length !== postPayments.rows.length) {
      throw new Error(`Incohérence du nombre de paiements: pré=${prePayments.rows.length}, post=${postPayments.rows.length}`);
    }

    for (let i = 0; i < prePayments.rows.length; i++) {
      const pre = prePayments.rows[i];
      const post = postPayments.rows[i];
      if (pre.id !== post.id) throw new Error(`Mismatch paiement id: ${pre.id} vs ${post.id}`);
      if (parseFloat(pre.amount) !== parseFloat(post.amount)) throw new Error(`Mismatch montant: ${pre.amount} vs ${post.amount}`);
      if (pre.currency !== post.currency) throw new Error(`Mismatch devise`);
      if (pre.status !== post.status) throw new Error(`Mismatch statut`);
      if (pre.reference !== post.reference) throw new Error(`Mismatch reference`);
      if (pre.transaction_id !== post.transaction_id) throw new Error(`Mismatch transaction_id`);
      if (pre.registration_id !== post.legacy_registration_id) throw new Error(`Mismatch legacy_registration_id`);
      
      // Vérification des colonnes d'archive
      if (!post.archived_edition_name || !post.archived_tournament_name || !post.archived_participant_name) {
        throw new Error(`Archivage contextuel incomplet pour le paiement ${post.id}`);
      }
    }

    // Vérification des transactions et inversions de remboursement
    if (JSON.stringify(preWalletTx.rows) !== JSON.stringify(postWalletTx.rows)) {
      throw new Error("Altération détectée dans les transactions de portefeuille !");
    }

    // Vérification des écritures double-entrée
    if (JSON.stringify(preLedger.rows) !== JSON.stringify(postLedger.rows)) {
      throw new Error("Altération détectée dans les écritures du grand livre ledger !");
    }

    // Vérification des comptes financiers et de owner_edition_id
    if (JSON.stringify(preFinancialAccounts.rows) !== JSON.stringify(postFinancialAccounts.rows)) {
      throw new Error("Altération détectée dans les comptes financiers !");
    }

    // Vérification des messages, interactions et notifications
    if (JSON.stringify(preMessages.rows) !== JSON.stringify(postMessages.rows) ||
        JSON.stringify(preInteractions.rows) !== JSON.stringify(postInteractions.rows) ||
        JSON.stringify(preNotifications.rows) !== JSON.stringify(postNotifications.rows)) {
      throw new Error("Altération détectée dans les liens messages/interactions/notifications !");
    }

    console.log("✔ Validation financière 100% conforme : aucune perte, intégrité du grand livre préservée, traçabilité contextuelle archivée avec succès.\n");

    // 8. Nettoyage du bac à sable
    await client.query(`DROP SCHEMA ${SANDBOX_SCHEMA} CASCADE;`);
    console.log(`[CLEANUP] Schéma sandbox '${SANDBOX_SCHEMA}' nettoyé avec succès.`);
    console.log("================================================================================");
    console.log("   TOUS LES TESTS ONT RÉUSSI SANS AUCUNE ANOMALIE.");
    console.log("================================================================================");

  } finally {
    client.release();
    await pool.end();
  }
}

runVerification().catch((err) => {
  console.error("\n❌ ÉCHEC DE LA VÉRIFICATION DU MOTEUR DE COMPÉTITION :", err);
  process.exit(1);
});
