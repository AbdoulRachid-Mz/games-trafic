import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const svgDir = path.join(projectRoot, 'public', 'svg');

const svgs: { file: string; content: string }[] = [
  // --- BRAND ---
  {
    file: 'brand/games-trafics-mark.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <defs>
    <linearGradient id="gtGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="50%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#4F46E5"/>
    </linearGradient>
    <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10B981"/>
      <stop offset="100%" stop-color="#059669"/>
    </linearGradient>
  </defs>
  <!-- Background Shield -->
  <rect width="100" height="100" rx="28" fill="url(#gtGradient)"/>
  <!-- D-Pad Left -->
  <path d="M28 45H36V37H44V45H52V53H44V61H36V53H28V45Z" fill="#FFFFFF" fill-opacity="0.95"/>
  <!-- Buttons Right -->
  <circle cx="68" cy="41" r="5" fill="url(#accentGradient)"/>
  <circle cx="76" cy="49" r="5" fill="#FFFFFF" fill-opacity="0.95"/>
  <circle cx="68" cy="57" r="5" fill="#FFFFFF" fill-opacity="0.95"/>
  <circle cx="60" cy="49" r="5" fill="#FFFFFF" fill-opacity="0.95"/>
  <!-- Central Accent Bar -->
  <rect x="42" y="70" width="16" height="4" rx="2" fill="#FFFFFF" fill-opacity="0.6"/>
</svg>`,
  },
  {
    file: 'brand/games-trafics-logo.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 80" fill="none">
  <defs>
    <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="100%" stop-color="#6D28D9"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#3B82F6"/>
    </linearGradient>
  </defs>
  <!-- Icon Mark -->
  <rect x="10" y="10" width="60" height="60" rx="18" fill="url(#logoBg)"/>
  <path d="M26 36H32V30H38V36H44V42H38V48H32V42H26V36Z" fill="#FFFFFF"/>
  <circle cx="54" cy="34" r="3.5" fill="#10B981"/>
  <circle cx="60" cy="40" r="3.5" fill="#FFFFFF"/>
  <circle cx="54" cy="46" r="3.5" fill="#FFFFFF"/>
  <circle cx="48" cy="40" r="3.5" fill="#FFFFFF"/>
  <!-- Text Brand -->
  <text x="86" y="44" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="900" letter-spacing="-0.04em" fill="currentColor">
    GAMES<tspan fill="url(#textGrad)">TRAFICS</tspan>
  </text>
  <text x="88" y="58" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-weight="700" letter-spacing="0.16em" fill="#9CA3AF" text-transform="uppercase">
    ESPORT &amp; MARKETPLACE
  </text>
</svg>`,
  },
  {
    file: 'brand/gtc-token.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none">
  <defs>
    <linearGradient id="goldOuter" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FCD34D"/>
      <stop offset="50%" stop-color="#F59E0B"/>
      <stop offset="100%" stop-color="#D97706"/>
    </linearGradient>
    <linearGradient id="purpleInner" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#5B21B6"/>
    </linearGradient>
  </defs>
  <!-- Gold Ring -->
  <circle cx="50" cy="50" r="46" fill="url(#goldOuter)" stroke="#FBBF24" stroke-width="2"/>
  <circle cx="50" cy="50" r="38" fill="url(#purpleInner)"/>
  <!-- GTC Lettering -->
  <text x="50" y="58" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="900" text-anchor="middle" fill="#FCD34D" letter-spacing="-0.02em">
    GTC
  </text>
  <!-- Sparkles -->
  <polygon points="50,18 52,24 58,26 52,28 50,34 48,28 42,26 48,24" fill="#FFFFFF"/>
</svg>`,
  },

  // --- GAMING ---
  {
    file: 'gaming/controller.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/>
  <line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/>
  <rect width="20" height="12" x="2" y="6" rx="6"/>
</svg>`,
  },
  {
    file: 'gaming/trophy.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
  <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
  <path d="M4 22h16"/>
  <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
  <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
  <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
</svg>`,
  },
  {
    file: 'gaming/bracket.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3 4h4v6h4"/>
  <path d="M3 16h4v-6"/>
  <path d="M11 10h4v4h6"/>
  <path d="M11 20h4v-6"/>
</svg>`,
  },
  {
    file: 'gaming/crosshair.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <line x1="22" x2="18" y1="12" y2="12"/>
  <line x1="6" x2="2" y1="12" y2="12"/>
  <line x1="12" x2="12" y1="6" y2="2"/>
  <line x1="12" x2="12" y1="22" y2="18"/>
  <circle cx="12" cy="12" r="3"/>
</svg>`,
  },
  {
    file: 'gaming/podium.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M2 20h20"/>
  <path d="M7 20v-7h4v7"/>
  <path d="M11 20V9h4v11"/>
  <path d="M15 20v-5h4v5"/>
  <path d="M13 5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"/>
</svg>`,
  },
  {
    file: 'gaming/team.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
  <circle cx="9" cy="7" r="4"/>
  <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
  <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
</svg>`,
  },

  // --- MARKETPLACE ---
  {
    file: 'marketplace/shop.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/>
  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
  <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/>
  <path d="M2 7h20"/>
</svg>`,
  },
  {
    file: 'marketplace/escrow-shield.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  <path d="m9 12 2 2 4-4"/>
</svg>`,
  },
  {
    file: 'marketplace/verified-badge.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>
  <path d="m9 12 2 2 4-4"/>
</svg>`,
  },
  {
    file: 'marketplace/package.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M16.5 9.4 7.55 4.24"/>
  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
  <polyline points="3.29 7 12 12 20.71 7"/>
  <line x1="12" x2="12" y1="22" y2="12"/>
</svg>`,
  },

  // --- WALLET ---
  {
    file: 'wallet/wallet.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
  <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
</svg>`,
  },
  {
    file: 'wallet/deposit.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2v14"/>
  <path d="m19 9-7 7-7-7"/>
  <rect width="20" height="6" x="2" y="16" rx="2"/>
</svg>`,
  },
  {
    file: 'wallet/withdraw.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 16V2"/>
  <path d="m5 9 7-7 7 7"/>
  <rect width="20" height="6" x="2" y="16" rx="2"/>
</svg>`,
  },
  {
    file: 'wallet/transfer.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="m16 3 4 4-4 4"/>
  <path d="M20 7H4"/>
  <path d="m8 21-4-4 4-4"/>
  <path d="M4 17h16"/>
</svg>`,
  },
  {
    file: 'wallet/pin-code.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  <circle cx="12" cy="16" r="1.5"/>
</svg>`,
  },

  // --- STATUS ---
  {
    file: 'status/status-vip.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#F59E0B">
  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
</svg>`,
  },
  {
    file: 'status/status-verified.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 6 9 17l-5-5"/>
</svg>`,
  },
  {
    file: 'status/status-pending.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <polyline points="12 6 12 12 16 14"/>
</svg>`,
  },
  {
    file: 'status/status-completed.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <path d="m9 12 2 2 4-4"/>
</svg>`,
  },
  {
    file: 'status/status-failed.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#EF4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"/>
  <line x1="15" x2="9" y1="9" y2="15"/>
  <line x1="9" x2="15" y1="9" y2="15"/>
</svg>`,
  },

  // --- ILLUSTRATIONS / EMPTY STATES ---
  {
    file: 'illustrations/empty-tournaments.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <circle cx="100" cy="100" r="80" fill="#7C3AED" fill-opacity="0.08"/>
  <circle cx="100" cy="100" r="56" fill="#7C3AED" fill-opacity="0.12"/>
  <path d="M70 70H60a12 12 0 0 1 0-24h10" stroke="#7C3AED" stroke-width="4" stroke-linecap="round"/>
  <path d="M130 70h10a12 12 0 0 0 0-24h-10" stroke="#7C3AED" stroke-width="4" stroke-linecap="round"/>
  <path d="M60 148h80" stroke="#7C3AED" stroke-width="4" stroke-linecap="round"/>
  <path d="M85 106v16c0 4-4 8-8 10-4 3-7 8-7 16" stroke="#7C3AED" stroke-width="4" stroke-linecap="round"/>
  <path d="M115 106v16c0 4 4 8 8 10 4 3 7 8 7 16" stroke="#7C3AED" stroke-width="4" stroke-linecap="round"/>
  <path d="M130 40H70v34a30 30 0 0 0 60 0V40Z" fill="#7C3AED" fill-opacity="0.2" stroke="#7C3AED" stroke-width="4" stroke-linejoin="round"/>
  <circle cx="100" cy="65" r="8" fill="#F59E0B"/>
</svg>`,
  },
  {
    file: 'illustrations/empty-products.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <circle cx="100" cy="100" r="80" fill="#7C3AED" fill-opacity="0.08"/>
  <rect x="55" y="70" width="90" height="80" rx="16" fill="#7C3AED" fill-opacity="0.15" stroke="#7C3AED" stroke-width="4"/>
  <path d="m45 70 18-30h74l18 30" stroke="#7C3AED" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="100" cy="110" r="16" stroke="#7C3AED" stroke-width="3" stroke-dasharray="4 4"/>
  <line x1="100" y1="102" x2="100" y2="118" stroke="#7C3AED" stroke-width="3" stroke-linecap="round"/>
  <line x1="92" y1="110" x2="108" y2="110" stroke="#7C3AED" stroke-width="3" stroke-linecap="round"/>
</svg>`,
  },
  {
    file: 'illustrations/empty-wallet.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <circle cx="100" cy="100" r="80" fill="#7C3AED" fill-opacity="0.08"/>
  <rect x="45" y="65" width="110" height="75" rx="18" fill="#7C3AED" fill-opacity="0.15" stroke="#7C3AED" stroke-width="4"/>
  <path d="M50 80h100" stroke="#7C3AED" stroke-width="3" stroke-linecap="round"/>
  <rect x="115" y="90" width="35" height="25" rx="8" fill="#7C3AED" fill-opacity="0.3" stroke="#7C3AED" stroke-width="3"/>
  <circle cx="127" cy="102" r="4" fill="#F59E0B"/>
</svg>`,
  },
  {
    file: 'illustrations/empty-messages.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <circle cx="100" cy="100" r="80" fill="#7C3AED" fill-opacity="0.08"/>
  <rect x="50" y="60" width="85" height="60" rx="16" fill="#7C3AED" fill-opacity="0.15" stroke="#7C3AED" stroke-width="4"/>
  <path d="M65 120v15l18-15" stroke="#7C3AED" stroke-width="4" stroke-linejoin="round"/>
  <rect x="75" y="85" width="80" height="55" rx="16" fill="#10B981" fill-opacity="0.15" stroke="#10B981" stroke-width="3"/>
  <path d="M140 140v12l-15-12" stroke="#10B981" stroke-width="3" stroke-linejoin="round"/>
</svg>`,
  },
  {
    file: 'illustrations/empty-clips.svg',
    content: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none">
  <circle cx="100" cy="100" r="80" fill="#7C3AED" fill-opacity="0.08"/>
  <rect x="45" y="60" width="110" height="80" rx="16" fill="#7C3AED" fill-opacity="0.15" stroke="#7C3AED" stroke-width="4"/>
  <polygon points="90,85 120,100 90,115" fill="#7C3AED"/>
</svg>`,
  },
];

for (const s of svgs) {
  const targetPath = path.join(svgDir, s.file);
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  fs.writeFileSync(targetPath, s.content, 'utf8');
  console.log(`✨ Créé : public/svg/${s.file}`);
}

console.log(`\n🎉 ${svgs.length} SVG officiels générés avec succès !`);
