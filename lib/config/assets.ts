/**
 * Games Trafics — Centralized Asset Paths
 *
 * All public asset paths are defined here.
 * Import from this file instead of hardcoding paths in components.
 */

// ─── Brand ──────────────────────────────────────────────────────────────────

export const BRAND_ASSETS = {
  logoPrimary: "/icons/gt-primary.png",
  logoGold: "/icons/gt-gold.png",
  logoMan: "/icons/gt-man.png",
  controller: "/icons/gt-controller-600.png",
  gtcIcon: "/icons/gtc-icon.png",
  avatar: "/icons/avatar.png",
  avatar2: "/icons/avatar-2.png",
  avatar240: "/icons/avatar-240.png",
  avatar500: "/icons/avatar-500.png",
  shop: "/icons/shop.png",
  tournament: "/icons/tournament-500.png",
} as const;

// ─── PWA Icons ───────────────────────────────────────────────────────────────

export const PWA_ICONS = {
  icon72: "/icons/icon-72.png",
  icon128: "/icons/icon-128.png",
  icon192: "/icons/icon-192.png",
  icon192Maskable: "/icons/icon-192-maskable.png",
  icon512: "/icons/icon-512.png",
  icon512Maskable: "/icons/icon-512-maskable.png",
} as const;

// ─── Placeholders ───────────────────────────────────────────────────────────

export const PLACEHOLDER_ASSETS = {
  imageUpload: "/images/placeholders/image-upload.png",
  multiUpload: "/images/placeholders/multi-upload.png",
  videoUpload: "/images/placeholders/video-upload.png",
  emptyMedia: "/images/placeholders/empty-media.png",
  gtUpload: "/images/placeholders/games-trafics-upload.png",
  defaultAvatar: "/images/placeholders/default-avatar.png",
  defaultTournament: "/images/placeholders/default-tournament.png",
  defaultShop: "/images/placeholders/default-shop.png",
  defaultCover: "/images/default-cover.jpg",
} as const;

// ─── SVG Library ─────────────────────────────────────────────────────────────

export const SVG_ASSETS = {
  // Brand
  brand: {
    mark: "/svg/brand/games-trafics-mark.svg",
    logo: "/svg/brand/games-trafics-logo.svg",
    gtcToken: "/svg/brand/gtc-token.svg",
  },
  // Gaming
  gaming: {
    controller: "/svg/gaming/controller.svg",
    trophy: "/svg/gaming/trophy.svg",
    bracket: "/svg/gaming/bracket.svg",
    crosshair: "/svg/gaming/crosshair.svg",
    podium: "/svg/gaming/podium.svg",
    team: "/svg/gaming/team.svg",
  },
  // Marketplace
  marketplace: {
    shop: "/svg/marketplace/shop.svg",
    escrowShield: "/svg/marketplace/escrow-shield.svg",
    verifiedBadge: "/svg/marketplace/verified-badge.svg",
    package: "/svg/marketplace/package.svg",
  },
  // Wallet
  wallet: {
    wallet: "/svg/wallet/wallet.svg",
    deposit: "/svg/wallet/deposit.svg",
    withdraw: "/svg/wallet/withdraw.svg",
    transfer: "/svg/wallet/transfer.svg",
    pinCode: "/svg/wallet/pin-code.svg",
  },
  // Status
  status: {
    vip: "/svg/status/status-vip.svg",
    verified: "/svg/status/status-verified.svg",
    pending: "/svg/status/status-pending.svg",
    completed: "/svg/status/status-completed.svg",
    failed: "/svg/status/status-failed.svg",
  },
  // Illustrations (empty states)
  illustrations: {
    emptyTournaments: "/svg/illustrations/empty-tournaments.svg",
    emptyProducts: "/svg/illustrations/empty-products.svg",
    emptyWallet: "/svg/illustrations/empty-wallet.svg",
    emptyMessages: "/svg/illustrations/empty-messages.svg",
    emptyClips: "/svg/illustrations/empty-clips.svg",
  },
} as const;

// ─── Game Assets ──────────────────────────────────────────────────────────────

export const GAME_ASSETS = {
  // Football / eFootball / FC Mobile
  football: {
    efootballCoins: "/images/games/football/items/efootball-coins.png",
    fcPoints: "/images/games/football/items/fc-points.png",
    footballBoots: "/images/games/football/items/football-boots.png",
    goldenBall: "/images/games/football/collectibles/golden-ball.png",
  },
  // FPS / Call of Duty
  fps: {
    codPointsCrate: "/images/games/fps/items/cod-points-crate.png",
    cyberRifleSkin: "/images/games/fps/items/cyber-rifle-skin.png",
  },
  // Battle Royale / PUBG
  battleRoyale: {
    pubgAirdrop: "/images/games/battle-royale/items/pubg-airdrop.png",
    level3Helmet: "/images/games/battle-royale/items/level3-helmet.png",
  },
  // Racing
  racing: {
    nitroBoost: "/images/games/racing/items/nitro-boost.png",
    racingHypercar: "/images/games/racing/vehicles/racing-hypercar.png",
  },
  // Shared
  shared: {
    gtcToken: "/images/games/shared/coins/gtc-token.png",
    lootChest: "/images/games/shared/crates/loot-chest.png",
  },
} as const;

// ─── Backgrounds / Auth ──────────────────────────────────────────────────────

export const BG_ASSETS = {
  controller: "/images/icons/background/bg-controller.jpg",
  efootball: "/images/icons/background/efootball.jpg",
  signIn: "/images/icons/pages/auth/sign-in.jpg",
  signUp: "/images/icons/pages/auth/sign-up.jpg",
  appLogo: "/images/icons/app/gt-primary.png",
  gameLogo: "/images/icons/logo/game_logo.png",
  avatarMan: "/images/icons/avatar/man.png",
} as const;

// ─── Convenience re-export ───────────────────────────────────────────────────

export const ASSETS = {
  brand: BRAND_ASSETS,
  pwa: PWA_ICONS,
  placeholders: PLACEHOLDER_ASSETS,
  svg: SVG_ASSETS,
  games: GAME_ASSETS,
  bg: BG_ASSETS,
} as const;

export default ASSETS;
