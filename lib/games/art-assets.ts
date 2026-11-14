/**
 * MANIFESTE TYPÉ D'ASSETS 3D GAMING — GAMES-TRAFICS
 * Centralise les correspondances visuelles, univers, thèmes et fallbacks déterministes.
 */

export type GameUniverseKey =
  | 'football'
  | 'fps'
  | 'battle-royale'
  | 'racing'
  | 'fighting'
  | 'rpg'
  | 'shared';

export type GameItemType = 'COIN' | 'ITEM' | 'SKIN' | 'EQUIPMENT' | 'CURRENCY';

export interface GameUniverseInfo {
  key: GameUniverseKey;
  label: string;
  tagline: string;
  gradient: string;
  accent: string;
  border: string;
  badgeClass: string;
  genres: string[];
  tags: string[];
  popularGames: string[];
}

export interface GameArtAsset {
  id: string;
  gameKey: string;
  universe: GameUniverseKey;
  itemType: GameItemType;
  name: string;
  description: string;
  image: string;
  fallbackImage: string;
  accentColor: string;
  glowColor: string;
}

export interface GameArtVisual {
  image: string;
  fallbackImage: string;
  universe: GameUniverseKey;
  universeLabel: string;
  accentColor: string;
  glowColor: string;
  gradientClass: string;
  borderClass: string;
  badgeClass: string;
  isCustom3D: boolean;
}

// ============================================================================
// UNIVERS OFFICIELS REPRÉSENTÉS DANS GAMES-TRAFICS
// ============================================================================

export const GAME_UNIVERSES: Record<GameUniverseKey, GameUniverseInfo> = {
  football: {
    key: 'football',
    label: 'Football & Sport',
    tagline: 'eFootball, EA Sports FC & compétitions de football virtuel',
    gradient: 'from-amber-500/25 via-yellow-500/10 to-transparent',
    accent: 'text-amber-400',
    border: 'border-amber-500/30',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    genres: ['Sport', 'Football', 'Soccer'],
    tags: ['football', 'sport', 'multiplayer', 'esports', 'fifa', 'efootball'],
    popularGames: ['eFootball 2024', 'eFootball', 'EA Sports FC 24', 'FIFA Mobile'],
  },
  fps: {
    key: 'fps',
    label: 'FPS & Tactique',
    tagline: 'Call of Duty Mobile, Warzone & affrontements tactiques',
    gradient: 'from-orange-500/25 via-red-500/10 to-transparent',
    accent: 'text-orange-400',
    border: 'border-orange-500/30',
    badgeClass: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    genres: ['FPS', 'Action', 'Shooter'],
    tags: ['fps', 'shooter', 'war', 'tactical', 'cod', 'call of duty'],
    popularGames: ['Call of Duty Mobile', 'Call of Duty Warzone', 'Apex Legends Mobile'],
  },
  'battle-royale': {
    key: 'battle-royale',
    label: 'Battle Royale',
    tagline: 'PUBG Mobile, Free Fire & survie compétitive',
    gradient: 'from-cyan-500/25 via-blue-500/10 to-transparent',
    accent: 'text-cyan-400',
    border: 'border-cyan-500/30',
    badgeClass: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    genres: ['Battle Royale', 'Survival'],
    tags: ['pubg', 'battle-royale', 'survival', 'airdrop'],
    popularGames: ['PUBG Mobile', 'Free Fire'],
  },
  racing: {
    key: 'racing',
    label: 'Courses & Vitesse',
    tagline: 'Asphalt, Need for Speed & simulation automobile',
    gradient: 'from-fuchsia-500/25 via-purple-500/10 to-transparent',
    accent: 'text-fuchsia-400',
    border: 'border-fuchsia-500/30',
    badgeClass: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/30',
    genres: ['Course', 'Racing'],
    tags: ['racing', 'cars', 'asphalt', 'speed', 'drift'],
    popularGames: ['Asphalt 9: Legends', 'Real Racing 3'],
  },
  fighting: {
    key: 'fighting',
    label: 'Combat & Versus',
    tagline: 'Tekken, Street Fighter & jeux de combat 1v1',
    gradient: 'from-red-500/25 via-rose-500/10 to-transparent',
    accent: 'text-red-400',
    border: 'border-red-500/30',
    badgeClass: 'bg-red-500/20 text-red-300 border-red-500/30',
    genres: ['Combat', 'Fighting'],
    tags: ['fighting', 'versus', 'arcade'],
    popularGames: ['Tekken', 'Street Fighter'],
  },
  rpg: {
    key: 'rpg',
    label: 'RPG & Aventure',
    tagline: 'Jeux de rôle, quêtes et objets magiques',
    gradient: 'from-emerald-500/25 via-teal-500/10 to-transparent',
    accent: 'text-emerald-400',
    border: 'border-emerald-500/30',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    genres: ['RPG', 'Adventure'],
    tags: ['rpg', 'adventure', 'fantasy'],
    popularGames: ['Genshin Impact'],
  },
  shared: {
    key: 'shared',
    label: 'Économie Games-Trafics',
    tagline: 'Monnaies universelles, coffres de récompenses et jetons GTC',
    gradient: 'from-violet-500/25 via-primary/10 to-transparent',
    accent: 'text-violet-400',
    border: 'border-violet-500/30',
    badgeClass: 'bg-primary/20 text-primary border-primary/30',
    genres: ['Tous'],
    tags: ['currency', 'coin', 'wallet', 'token'],
    popularGames: ['Games-Trafics Platform'],
  },
};

// ============================================================================
// CATALOGUE DES ASSETS 3D OFFICIELS
// ============================================================================

export const GAME_ART_CATALOG: GameArtAsset[] = [
  // FOOTBALL
  {
    id: 'efootball-coins-3d',
    gameKey: 'efootball',
    universe: 'football',
    itemType: 'CURRENCY',
    name: 'eFootball Coins Pack',
    description: 'Pile de pièces dorées métalliques officielles avec reflets néon bleu et or.',
    image: '/images/games/football/items/efootball-coins.png',
    fallbackImage: '/images/icons/3d-icons/3dicons-3d-coin-iso-color.png',
    accentColor: '#f59e0b',
    glowColor: 'rgba(245, 158, 11, 0.3)',
  },
  {
    id: 'fc-points-3d',
    gameKey: 'fifa',
    universe: 'football',
    itemType: 'CURRENCY',
    name: 'FC Points Pack Premium',
    description: 'Cartes et gemmes hexagonales vert émeraude et or EA Sports FC.',
    image: '/images/games/football/items/fc-points.png',
    fallbackImage: '/images/icons/3d-icons/3dicons-dollar-dynamic-color.png',
    accentColor: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.3)',
  },
  {
    id: 'golden-ball-3d',
    gameKey: 'efootball',
    universe: 'football',
    itemType: 'ITEM',
    name: 'Ballon Doré des Champions',
    description: 'Ballon de football 3D doré de compétition officielle sur socle.',
    image: '/images/games/football/collectibles/golden-ball.png',
    fallbackImage: '/images/icons/3d-icons/3dicons-ball-dynamic-color.png',
    accentColor: '#fbbf24',
    glowColor: 'rgba(251, 191, 36, 0.35)',
  },
  {
    id: 'football-boots-3d',
    gameKey: 'efootball',
    universe: 'football',
    itemType: 'EQUIPMENT',
    name: 'Crampons de Vitesse Cyber',
    description: 'Crampons de compétition aérodynamiques avec détails cyan et magenta.',
    image: '/images/games/football/items/football-boots.png',
    fallbackImage: '/images/icons/3d-icons/3dicons-flash-dynamic-color.png',
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.3)',
  },

  // FPS (CALL OF DUTY)
  {
    id: 'cod-points-crate-3d',
    gameKey: 'cod',
    universe: 'fps',
    itemType: 'CURRENCY',
    name: 'Caisse de Points COD CP',
    description: 'Caisse militaire tactique blindée avec jauges énergétiques orange.',
    image: '/images/games/fps/items/cod-points-crate.png',
    fallbackImage: '/images/icons/3d-icons/3dicons-locker-dynamic-color.png',
    accentColor: '#f97316',
    glowColor: 'rgba(249, 115, 22, 0.35)',
  },
  {
    id: 'cyber-rifle-skin-3d',
    gameKey: 'cod',
    universe: 'fps',
    itemType: 'SKIN',
    name: 'Fusil d’Assaut Cybernétique',
    description: 'Fusil tactique 3D haute précision avec circuits bleus et viseur holo.',
    image: '/images/games/fps/items/cyber-rifle-skin.png',
    fallbackImage: '/images/icons/3d-icons/3dicons-target-dynamic-color.png',
    accentColor: '#3b82f6',
    glowColor: 'rgba(59, 130, 246, 0.35)',
  },

  // BATTLE ROYALE (PUBG)
  {
    id: 'pubg-airdrop-3d',
    gameKey: 'pubg',
    universe: 'battle-royale',
    itemType: 'ITEM',
    name: 'Caisse Airdrop de Ravitaillement',
    description: 'Conteneur airdrop rouge et bleu iconique avec sangle et fumigène.',
    image: '/images/games/battle-royale/items/pubg-airdrop.png',
    fallbackImage: '/images/icons/3d-icons/3dicons-gift-box-dynamic-color.png',
    accentColor: '#ef4444',
    glowColor: 'rgba(239, 68, 68, 0.35)',
  },
  {
    id: 'level3-helmet-3d',
    gameKey: 'pubg',
    universe: 'battle-royale',
    itemType: 'EQUIPMENT',
    name: 'Casque Spetsnaz Niveau 3',
    description: 'Casque blindé mythique avec visière de soudure et rayures de combat.',
    image: '/images/games/battle-royale/items/level3-helmet.png',
    fallbackImage: '/images/icons/3d-icons/3dicons-shield-dynamic-color.png',
    accentColor: '#06b6d4',
    glowColor: 'rgba(6, 182, 212, 0.35)',
  },

  // RACING
  {
    id: 'racing-hypercar-3d',
    gameKey: 'asphalt',
    universe: 'racing',
    itemType: 'ITEM',
    name: 'Hypercar de Course Cyber',
    description: 'Supercar aérodynamique avec carrosserie carbone et néon sous châssis.',
    image: '/images/games/racing/vehicles/racing-hypercar.png',
    fallbackImage: '/images/icons/3d-icons/3dicons-flash-dynamic-color.png',
    accentColor: '#d946ef',
    glowColor: 'rgba(217, 70, 239, 0.35)',
  },
  {
    id: 'nitro-boost-3d',
    gameKey: 'asphalt',
    universe: 'racing',
    itemType: 'EQUIPMENT',
    name: 'Bouteille Nitro Pro Boost',
    description: 'Bouteille de protoxyde d’azote chromée avec manomètre haute pression.',
    image: '/images/games/racing/items/nitro-boost.png',
    fallbackImage: '/images/icons/3d-icons/3dicons-fire-dynamic-color.png',
    accentColor: '#38bdf8',
    glowColor: 'rgba(56, 189, 248, 0.35)',
  },

  // SHARED / GTC
  {
    id: 'gtc-token-3d',
    gameKey: 'shared',
    universe: 'shared',
    itemType: 'CURRENCY',
    name: 'Token GTC Games-Trafics',
    description: 'Jeton premium holographique officiel de la plateforme Games-Trafics.',
    image: '/images/games/shared/coins/gtc-token.png',
    fallbackImage: '/images/icons/3d-icons/3dicons-3d-coin-iso-color.png',
    accentColor: '#8b5cf6',
    glowColor: 'rgba(139, 92, 246, 0.35)',
  },
  {
    id: 'loot-chest-3d',
    gameKey: 'shared',
    universe: 'shared',
    itemType: 'ITEM',
    name: 'Coffre de Récompenses Mythique',
    description: 'Coffre légendaire s’ouvrant sur une aura de lumière dorée étincelante.',
    image: '/images/games/shared/crates/loot-chest.png',
    fallbackImage: '/images/icons/3d-icons/3dicons-gift-dynamic-color.png',
    accentColor: '#ec4899',
    glowColor: 'rgba(236, 72, 153, 0.35)',
  },
];

// ============================================================================
// DÉTECTION D'UNIVERS ET RESOLUTION D'ASSETS DÉTERMINISTE
// ============================================================================

export function detectGameUniverse(
  game?: { name?: string; genre?: string; tags?: string[] | null } | null
): GameUniverseKey {
  if (!game) return 'shared';

  const name = (game.name || '').toLowerCase();
  const genre = (game.genre || '').toLowerCase();
  const tags = (game.tags || []).map((t) => (t || '').toLowerCase());

  // Football check
  if (
    name.includes('foot') ||
    name.includes('fifa') ||
    name.includes('fc 2') ||
    genre.includes('sport') ||
    tags.some((t) => t.includes('foot') || t.includes('fifa') || t.includes('soccer'))
  ) {
    return 'football';
  }

  // FPS check
  if (
    name.includes('call of duty') ||
    name.includes('cod') ||
    name.includes('warzone') ||
    name.includes('apex') ||
    genre.includes('fps') ||
    tags.some((t) => t.includes('fps') || t.includes('shooter') || t.includes('cod'))
  ) {
    return 'fps';
  }

  // Battle Royale check
  if (
    name.includes('pubg') ||
    name.includes('free fire') ||
    name.includes('fortnite') ||
    genre.includes('battle royale') ||
    tags.some((t) => t.includes('battle-royale') || t.includes('pubg') || t.includes('survival'))
  ) {
    return 'battle-royale';
  }

  // Racing check
  if (
    name.includes('asphalt') ||
    name.includes('racing') ||
    name.includes('need for speed') ||
    genre.includes('course') ||
    genre.includes('racing') ||
    tags.some((t) => t.includes('racing') || t.includes('cars') || t.includes('speed'))
  ) {
    return 'racing';
  }

  // Combat check
  if (
    name.includes('tekken') ||
    name.includes('street fighter') ||
    name.includes('mortal kombat') ||
    genre.includes('combat') ||
    genre.includes('fighting')
  ) {
    return 'fighting';
  }

  return 'shared';
}

/**
 * Récupère le visuel optimal (image 3D, fallback, couleurs, thème) pour un Game Item
 */
export function getGameItemVisual(
  item: {
    id?: string;
    name?: string;
    type?: string;
    icon?: string | null;
    gameId?: string;
  },
  game?: {
    id?: string;
    name?: string;
    genre?: string;
    tags?: string[] | null;
  } | null
): GameArtVisual {
  const universeKey = detectGameUniverse(game);
  const universeInfo = GAME_UNIVERSES[universeKey] || GAME_UNIVERSES.shared;
  const itemType = (item.type || 'ITEM') as GameItemType;
  const itemName = (item.name || '').toLowerCase();

  // 1. Si une image directe valide est spécifiée et n'est pas un placeholder générique
  const hasCustomIcon =
    Boolean(item.icon) &&
    typeof item.icon === 'string' &&
    item.icon.trim().length > 0 &&
    !item.icon.includes('example.com') &&
    item.icon !== 'coin' &&
    item.icon !== 'item';

  // 2. Recherche d'un asset spécifique dans le catalogue
  let matchedAsset: GameArtAsset | undefined;

  if (universeKey === 'football') {
    if (itemType === 'COIN' || itemType === 'CURRENCY' || itemName.includes('coin')) {
      matchedAsset = GAME_ART_CATALOG.find((a) => a.id === 'efootball-coins-3d');
    } else if (itemName.includes('point') || itemName.includes('fc')) {
      matchedAsset = GAME_ART_CATALOG.find((a) => a.id === 'fc-points-3d');
    } else if (itemType === 'EQUIPMENT' || itemName.includes('crampon') || itemName.includes('boot')) {
      matchedAsset = GAME_ART_CATALOG.find((a) => a.id === 'football-boots-3d');
    } else {
      matchedAsset = GAME_ART_CATALOG.find((a) => a.id === 'golden-ball-3d');
    }
  } else if (universeKey === 'fps') {
    if (itemType === 'SKIN' || itemName.includes('skin') || itemName.includes('arme')) {
      matchedAsset = GAME_ART_CATALOG.find((a) => a.id === 'cyber-rifle-skin-3d');
    } else {
      matchedAsset = GAME_ART_CATALOG.find((a) => a.id === 'cod-points-crate-3d');
    }
  } else if (universeKey === 'battle-royale') {
    if (itemType === 'EQUIPMENT' || itemName.includes('casque') || itemName.includes('helmet')) {
      matchedAsset = GAME_ART_CATALOG.find((a) => a.id === 'level3-helmet-3d');
    } else {
      matchedAsset = GAME_ART_CATALOG.find((a) => a.id === 'pubg-airdrop-3d');
    }
  } else if (universeKey === 'racing') {
    if (itemType === 'EQUIPMENT' || itemName.includes('nitro') || itemName.includes('turbo')) {
      matchedAsset = GAME_ART_CATALOG.find((a) => a.id === 'nitro-boost-3d');
    } else {
      matchedAsset = GAME_ART_CATALOG.find((a) => a.id === 'racing-hypercar-3d');
    }
  } else {
    if (itemType === 'COIN' || itemType === 'CURRENCY') {
      matchedAsset = GAME_ART_CATALOG.find((a) => a.id === 'gtc-token-3d');
    } else {
      matchedAsset = GAME_ART_CATALOG.find((a) => a.id === 'loot-chest-3d');
    }
  }

  const primaryImage = hasCustomIcon ? (item.icon as string) : (matchedAsset?.image || '/images/icons/3d-icons/3dicons-3d-coin-iso-color.png');
  const fallbackImage = matchedAsset?.fallbackImage || '/images/icons/3d-icons/3dicons-gift-dynamic-color.png';

  return {
    image: primaryImage,
    fallbackImage,
    universe: universeKey,
    universeLabel: universeInfo.label,
    accentColor: matchedAsset?.accentColor || '#8b5cf6',
    glowColor: matchedAsset?.glowColor || 'rgba(139, 92, 246, 0.3)',
    gradientClass: universeInfo.gradient,
    borderClass: universeInfo.border,
    badgeClass: universeInfo.badgeClass,
    isCustom3D: Boolean(matchedAsset),
  };
}
