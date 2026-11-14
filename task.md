# TASK — SUIVI PROGRESSIF : REFONTE GLOBALE GAMES-TRAFICS

## Statut global
- [x] Refonte précédente (Tournois, Matchs, Standings, Petite Finale, Validation 270 tests)
- [x] Refonte Visuelle 3D Gaming & Marketplace (`/games`, `/admin/games`, `<GameItemVisual>`, `<GameAssetPicker>`, Manifeste)
- [x] Phase 1 — Refonte Documentation Officielle (`docs/content/**`, nouveaux modules account, wallet, games, teams, community, vip)
- [x] Phase 2 — Guides Interactifs (`/docs/guides`, `/docs/guides/[guideId]`)
- [x] Phase 3 — Refonte Services Officiels (`/services`, `/services/[id]`, section "Comprendre la fonctionnalité", lien doc)
- [x] Phase 4 — Seed Idempotent & Non-destructif (`database/seed-guides-services.ts`, commande `db:seed:guides-services`)
- [x] Phase 5 — Composants d'Upload Sécurisés (`advanced-multi-upload.tsx`, `advanced-upload.tsx`, `advanced-video-upload.tsx`)
- [x] Phase 6 — Image PNG Placeholder Thématique (`public/images/placeholders/games-trafics-upload.png`)
- [x] Phase 7 — Validation & Tests (TSC 0 erreur, ESLint 0 erreur, Vitest 270/270 passed)

---

## Tâches détaillées

### Phase 1 — Refonte Documentation Officielle
- [x] Réécriture complète de `docs/content/getting-started.md` (vue d'ensemble, rôles réels, 5 étapes, sécurité).
- [x] Création de `docs/content/account/overview.md` (profils, rôles BUYER/SELLER/TRADER/ORGANIZER/VIP, KYC, Passkeys Better-Auth).
- [x] Création de `docs/content/wallet/overview.md` (architecture Wallet GTC, dépôts, retraits, transferts P2P, PIN, statuts PENDING/PROCESSING/COMPLETED/FAILED/REFUNDED).
- [x] Création de `docs/content/games/overview.md` (catalogue, 5 types COIN/ITEM/SKIN/EQUIPMENT/CURRENCY, parcours d'achat réel).
- [x] Création de `docs/content/teams/overview.md` (composition roster, rôles CAPTAIN/PLAYER/COACH/SUBSTITUTE, tournois).
- [x] Création de `docs/content/community/overview.md` (clips vidéo, publications, messagerie directe et groupes, notifications).
- [x] Création de `docs/content/vip/overview.md` (avantages statut VIP, réductions commissions, badge doré, formules).
- [x] Modernisation de `app/docs/page.tsx` avec les 10 catégories complètes.

### Phase 2 — Guides Interactifs
- [x] Vérification de `app/docs/guides/page.tsx` et alignement des filtres.
- [x] Rationalisation de `app/docs/guides/[guideId]/page.tsx` (gestion progressive des étapes, sans doublons).

### Phase 3 — Services Officiels
- [x] Suppression de tous les avis, étoiles fictives et badges marketing inventés ("5.0 Rating", "100% Garanti").
- [x] Remplacement du bouton de commande fictif par un vrai CTA de contact vers `/support`.
- [x] Ajout de la section obligatoire "Comprendre la fonctionnalité" avec `resolveServiceDocLink()` sur chaque page de service.
- [x] Nettoyage de `ServiceCard` et de la grille `/services`.

### Phase 4 — Seed Idempotent & Non-destructif
- [x] Création de `database/seed-guides-services.ts`.
- [x] Association dynamique avec un administrateur réel (`role = 'ADMIN'`).
- [x] Insertion de 5 guides complets avec leurs étapes et 4 services officiels.
- [x] Vérification d'idempotence stricte (aucune duplication lors d'exécutions successives).
- [x] Ajout du script `"db:seed:guides-services"` dans `package.json`.

### Phase 5 — Composants d'Upload
- [x] `advanced-multi-upload.tsx` : Remplacement des `alert()` par `toast`, gestion de concurrence (max 3), contrôle strict des quotas, bouton retry sur échec, nettoyage mémoire via `URL.revokeObjectURL`.
- [x] `advanced-upload.tsx` : Intégration du placeholder thématique GT et libération des URLs d'objet.
- [x] `advanced-video-upload.tsx` : Sécurisation du cloud name via variable d'environnement avec fallback.

### Phase 6 — Placeholder PNG
- [x] Création de `public/images/placeholders/games-trafics-upload.png` arborant la manette GT officielle.

### Phase 7 — Validation & Tests
- [x] `bunx tsc --noEmit` → 0 erreur.
- [x] `bun x vitest run tests/unit` → 270/270 tests passés (100%).
- [x] Tests d'idempotence validés en conditions réelles.
