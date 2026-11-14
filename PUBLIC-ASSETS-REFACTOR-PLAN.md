# PLAN D'AUDIT, COMPLÉTION ET REFONTE DES RESSOURCES PUBLIQUES

## 1. Diagnostic de l'existant (Phase 1)
- **Fichiers totaux :** 462 fichiers (~100 MB).
- **Problèmes identifiés :**
  1. Doublons Next.js à la racine (`* copy.svg`).
  2. Imbrication incohérente : `public/images/icons/` contient 244 fichiers (dont des icônes 3D, vidéos, sons mp3, pages d'auth).
  3. Fichiers bruts de téléphone / Background Eraser dans `public/icons/` (`20260326_*.png`, `BackgroundEraser_*.png`).
  4. 8 ressources manquantes référencées dans le code (`/images/default-cover.jpg`, et 7 items dans `lib/games/art-assets.ts`).
  5. Absence quasi-totale de SVG vectoriels originaux (seulement 5 SVGs boilerplate Next.js dupliqués en `copy.svg`).
  6. Polices en doublons massifs : `Roboto/static/` (54 fichiers) et `Montserrat/static/` (18 fichiers) inutilisés car les polices variables sont actives.
  7. Dossier `public/svg/` et `public/videos/` vides alors que des SVGs et vidéos sont éparpillés.

## 2. Besoins réels de l'application (Phase 2)
- **Identité Visuelle :** Logos Games-Trafics (SVG et PNG haute définition), marqueur compact, favicon, icônes PWA maskable.
- **Jeux supportés :** eFootball, Call of Duty Mobile, FC Mobile / EA Sports FC, PUBG Mobile, Racing / Asphalt.
  - Assets 3D transparents pour les 5 catégories d'items : `COIN`, `ITEM`, `SKIN`, `EQUIPMENT`, `CURRENCY`.
- **Marketplace & Boutiques :** Placeholders de produits, badge boutique certifiée, badge Escrow séquestre.
- **Tournois :** Cover par défaut (`/images/default-cover.jpg` ou webp), trophées, brackets, podium.
- **Uploads & Médias :** Illustrations dédiées upload image unique, multi-images, vidéo (basées sur la manette 3D GT).
- **États vides :** Empty states vectoriels ou webp stylisés pour produits, tournois, clips, messages, transactions.
- **Wallet & Transactions :** SVGs pour dépôt, retrait, transfert, lock PIN, GTC Token.
- **Statuts :** Badges vectoriels VIP, Vérifié, En attente, Succès, Échec.

## 3. Architecture cible de `public/` (Phase 3)
```text
public/
├── images/
│   ├── brand/               # Logos, bannières de marque
│   ├── placeholders/        # Upload image, upload multi, upload vidéo, default-cover, default-avatar
│   ├── illustrations/       # États vides (empty-tournaments, empty-products, empty-wallet, etc.)
│   ├── games/
│   │   ├── football/        # efootball-coins, fc-points, golden-ball, football-boots
│   │   ├── fps/             # cod-points-crate, cyber-rifle-skin
│   │   ├── battle-royale/   # pubg-airdrop, level3-helmet
│   │   ├── racing/          # racing-hypercar, nitro-boost
│   │   └── shared/          # gtc-token, loot-chest
│   ├── backgrounds/         # bg-controller.jpg, bg-mesh, bg-efootball.jpg
│   └── auth/                # sign-in.jpg, sign-up.jpg
│
├── icons/
│   ├── pwa/                 # icon-72, 96, 128, 144, 192, 512 + maskable
│   ├── brand/               # gt-primary, gt-gold, gtc-icon, gt-controller-600
│   └── 3d/                  # Icônes 3D légères sélectionnées et utilisées
│
├── svg/
│   ├── brand/               # Logo complet, symbole mark, monnaie GTC
│   ├── gaming/              # Manette, trophée, bracket, viseur, podium, team
│   ├── marketplace/         # Boutique, panier, badge vérifié, protection escrow
│   ├── wallet/              # Wallet, dépôt, retrait, transfert, pin-code
│   ├── status/              # VIP star, verified, pending, completed, failed
│   └── illustrations/       # Empty states vectoriels (empty-box, empty-trophy, etc.)
│
├── videos/
│   └── game_trafic2.webm
│
├── audio/
│   └── ui/                  # mouseDown.mp3, mouseUp.mp3, sendBtn.mp3
│
├── fonts/                   # Montserrat, Poppins, Roboto (nettoyé des statiques inutilisées)
│
├── favicon.ico
├── sw.js
```

## 4. Plan d'Exécution par étapes :
1. **Création des SVG vectoriels originaux Games-Trafics** (Brand, Gaming, Marketplace, Wallet, Status, Empty-states).
2. **Création des assets de jeux manquants** (Golden Ball, Football Boots, Cyber Rifle Skin, Level 3 Helmet, Nitro Boost, GTC Token, Loot Chest) et du cover par défaut.
3. **Création des illustrations d'upload dédiées** (Upload single, Upload multi, Upload vidéo) avec la direction artistique GT.
4. **Création du module centralisé de ressources `lib/config/assets.ts`**.
5. **Migration ordonnée et mise à jour de TOUTES les références dans le code**.
6. **Nettoyage des doublons** (`* copy.svg`, photos perso non renommées, polices statiques inutilisées).
7. **Validation complète** (TypeScript 0 erreur, ESLint 0 erreur, Vitest 270/270).
