import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'public');
const placeholdersDir = path.join(publicDir, 'images', 'placeholders');

if (!fs.existsSync(placeholdersDir)) {
  fs.mkdirSync(placeholdersDir, { recursive: true });
}

const controllerSrc = path.join(publicDir, 'icons', 'gt-controller-600.png');
const avatarSrc = path.join(publicDir, 'icons', 'avatar-500.png');
const tournamentSrc = path.join(publicDir, 'icons', 'tournament-500.png');
const shopSrc = path.join(publicDir, 'icons', 'shop.png');

const placeholderCopies = [
  { src: controllerSrc, target: 'image-upload.png' },
  { src: controllerSrc, target: 'multi-upload.png' },
  { src: controllerSrc, target: 'video-upload.png' },
  { src: controllerSrc, target: 'empty-media.png' },
  { src: controllerSrc, target: 'games-trafics-upload.png' },
  { src: avatarSrc, target: 'default-avatar.png' },
  { src: tournamentSrc, target: 'default-tournament.png' },
  { src: shopSrc, target: 'default-shop.png' },
];

for (const p of placeholderCopies) {
  const dest = path.join(placeholdersDir, p.target);
  if (fs.existsSync(p.src)) {
    fs.copyFileSync(p.src, dest);
    console.log(`✅ Placeholder créé : images/placeholders/${p.target}`);
  }
}
