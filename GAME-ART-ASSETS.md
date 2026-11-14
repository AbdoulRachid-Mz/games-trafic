# GAME-ART-ASSETS.md — Documentation des Assets Visuels Gaming

> **Games-Trafics** — Bibliothèque d'assets 3D et visuels pour la marketplace gaming.

---

## Direction Artistique

### Thème de l'Application
- **Fond dominant** : Dark glass (bg-card/80, backdrop-blur-xl, border-white/10)
- **Accents neon** : Primary (violet/indigo), amber (coins), blue (items), purple (skins), emerald (equipment), rose (currency)
- **Typographie** : font-black italic uppercase pour les titres gaming
- **Arrondis** : rounded-2xl / rounded-3xl / rounded-[2rem] pour les cartes

### Logo Games-Trafics (GT)
- `public/icons/gt-primary.png` — Logo principal (couleur primaire)
- `public/icons/icon-72.png` — Icône 72×72px (PWA / petits formats)

**Utilisation** :
- Watermark discret (opacity-15/20) en bas-droite de chaque visuel d'item
- Logo centré (opacity-20) dans les placeholders sans image
- Composant `<GameItemVisual>` gère automatiquement le branding

---

## Composant Central : `<GameItemVisual>`

```tsx
import { GameItemVisual } from "@/components/pages/games/game-item-visual";

<GameItemVisual
  item={gameItemWithRelations}
  mode="card"       // "card" (compact) | "detail" (grand format)
  withGTBranding    // logo GT watermark (true par défaut)
  priority={false}  // Next.js Image priority
  className="..."
/>
```

---

## Catalogue des Assets 3D

### Assets Générés (5 disponibles)

| ID | Fichier | Jeu | Type | Status |
|---|---|---|---|---|
| `efootball-coins-3d` | `football/items/efootball-coins.png` | eFootball 2024 | CURRENCY | ✅ Prêt |
| `fc-points-3d` | `football/items/fc-points.png` | EA Sports FC | CURRENCY | ✅ Prêt |
| `cod-points-crate-3d` | `fps/items/cod-points-crate.png` | Call of Duty | ITEM | ✅ Prêt |
| `pubg-airdrop-3d` | `battle-royale/items/pubg-airdrop.png` | PUBG Mobile | ITEM | ✅ Prêt |
| `racing-hypercar-3d` | `racing/vehicles/racing-hypercar.png` | Racing | ITEM | ✅ Prêt |

### Assets avec Fallback 3dicons (7 en attente)

| ID | Fallback Utilisé | Description | Status |
|---|---|---|---|
| `golden-ball-3d` | `3dicons-trophy-dynamic-color.png` | Ballon d'or football | ⏳ Quota épuisé |
| `football-boots-3d` | `3dicons-tools-dynamic-color.png` | Crampons de foot | ⏳ Quota épuisé |
| `cyber-rifle-skin-3d` | `3dicons-shield-dynamic-color.png` | Skin arme FPS | ⏳ Quota épuisé |
| `level3-helmet-3d` | `3dicons-shield-dynamic-color.png` | Casque PUBG Lv3 | ⏳ Quota épuisé |
| `nitro-boost-3d` | `3dicons-fire-dynamic-color.png` | Boost nitro racing | ⏳ Quota épuisé |
| `gtc-token-3d` | `3dicons-3d-coin-iso-color.png` | Jeton GTC Games-Trafics | ⏳ Quota épuisé |
| `loot-chest-3d` | `3dicons-gift-box-dynamic-color.png` | Coffre loot générique | ⏳ Quota épuisé |

---

## Structure des Dossiers

```
public/images/games/
├── football/
│   ├── items/
│   │   ├── efootball-coins.png   ✅
│   │   ├── fc-points.png         ✅
│   │   └── football-boots.png    ⏳
│   ├── collectibles/
│   │   └── golden-ball.png       ⏳
│   └── players/
├── fps/
│   ├── items/
│   │   ├── cod-points-crate.png  ✅
│   │   └── cyber-rifle-skin.png  ⏳
│   └── operators/
├── battle-royale/
│   ├── items/
│   │   ├── pubg-airdrop.png      ✅
│   │   └── level3-helmet.png     ⏳
│   └── characters/
├── racing/
│   ├── vehicles/
│   │   └── racing-hypercar.png   ✅
│   └── items/
│       └── nitro-boost.png       ⏳
└── shared/
    ├── coins/
    │   └── gtc-token.png         ⏳
    ├── crates/
    │   └── loot-chest.png        ⏳
    ├── currencies/
    ├── equipment/
    └── skins/

public/images/icons/3d-icons/     ← 80+ icônes de fallback disponibles
```

---

## Univers et Thèmes

| Univers | Accent | Gradient | Jeux couverts |
|---|---|---|---|
| `football` | `text-amber-400` | amber → yellow | eFootball, EA FC |
| `fps` | `text-orange-400` | orange → red | Call of Duty Mobile |
| `battle-royale` | `text-cyan-400` | cyan → blue | PUBG Mobile, Free Fire |
| `racing` | `text-fuchsia-400` | fuchsia → purple | Asphalt 9 |
| `fighting` | `text-red-400` | red → rose | Tekken, SF |
| `rpg` | `text-emerald-400` | emerald → teal | Genshin Impact |
| `shared` | `text-violet-400` | violet → primary | GTC Platform |

---

## Lib : `lib/games/art-assets.ts`

Fonctions exportées :

- `detectGameUniverse(game)` → `GameUniverseKey` — détection automatique par genre/tags/name
- `getGameItemVisual(item, game)` → `GameArtVisual` — résolution déterministe image+fallback+thème
- `GAME_UNIVERSES` — Dictionnaire des 7 univers avec styles, genres, jeux
- `GAME_ART_CATALOG` — Liste des assets référencés avec chemins et couleurs

---

## Contraintes et Règles

> [!IMPORTANT]
> - Chaque image doit être **individuellement exploitable** — pas la même pour toutes les catégories
> - `object-contain` obligatoire (jamais `object-cover` pour les items — les artefacts en PNG 3D ont fond transparent)
> - Le logo GT en watermark est **toujours discret** (opacity ≤ 20%)
> - Pas de fausses étoiles/ratings basées sur `popularity`
> - Pas de badges "Vérifié" inventés

> [!NOTE]
> Le quota d'image generation se réinitialise périodiquement.
> Les 7 assets en attente seront générés au prochain reset du quota.
> En attendant, les 3dicons assurent un fallback cohérent.
