import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'public');

// 1. default-cover.jpg
const bgSrc = path.join(publicDir, 'images/icons/background/bg-controller.jpg');
const defaultCoverTarget = path.join(publicDir, 'images/default-cover.jpg');
if (fs.existsSync(bgSrc)) {
  fs.copyFileSync(bgSrc, defaultCoverTarget);
  console.log('✅ default-cover.jpg créé');
}

// 2. golden-ball.png
const goldenBallArtifact = 'C:\\Users\\user\\.gemini\\antigravity\\brain\\32c5d06b-0fe7-4bb6-9cbb-c00706c5a600\\golden_ball_1794654402629.jpg';
const goldenBallTarget = path.join(publicDir, 'images/games/football/collectibles/golden-ball.png');
fs.mkdirSync(path.dirname(goldenBallTarget), { recursive: true });
if (fs.existsSync(goldenBallArtifact)) {
  fs.copyFileSync(goldenBallArtifact, goldenBallTarget);
  console.log('✅ golden-ball.png créé depuis artefact');
} else {
  const ball3d = path.join(publicDir, 'images/icons/3d-icons/3dicons-ball-dynamic-color.png');
  fs.copyFileSync(ball3d, goldenBallTarget);
  console.log('✅ golden-ball.png créé depuis ball-dynamic-color');
}

// 3. football-boots.png
const bootsTarget = path.join(publicDir, 'images/games/football/items/football-boots.png');
fs.mkdirSync(path.dirname(bootsTarget), { recursive: true });
const fcPointsSrc = path.join(publicDir, 'images/games/football/items/fc-points.png');
if (fs.existsSync(fcPointsSrc)) {
  fs.copyFileSync(fcPointsSrc, bootsTarget);
  console.log('✅ football-boots.png créé');
}

// 4. level3-helmet.png
const helmetTarget = path.join(publicDir, 'images/games/battle-royale/items/level3-helmet.png');
fs.mkdirSync(path.dirname(helmetTarget), { recursive: true });
const airdropSrc = path.join(publicDir, 'images/games/battle-royale/items/pubg-airdrop.png');
if (fs.existsSync(airdropSrc)) {
  fs.copyFileSync(airdropSrc, helmetTarget);
  console.log('✅ level3-helmet.png créé');
}

// 5. cyber-rifle-skin.png
const rifleTarget = path.join(publicDir, 'images/games/fps/items/cyber-rifle-skin.png');
fs.mkdirSync(path.dirname(rifleTarget), { recursive: true });
const crateSrc = path.join(publicDir, 'images/games/fps/items/cod-points-crate.png');
if (fs.existsSync(crateSrc)) {
  fs.copyFileSync(crateSrc, rifleTarget);
  console.log('✅ cyber-rifle-skin.png créé');
}

// 6. nitro-boost.png
const nitroTarget = path.join(publicDir, 'images/games/racing/items/nitro-boost.png');
fs.mkdirSync(path.dirname(nitroTarget), { recursive: true });
const fire3d = path.join(publicDir, 'images/icons/3d-icons/3dicons-fire-dynamic-color.png');
if (fs.existsSync(fire3d)) {
  fs.copyFileSync(fire3d, nitroTarget);
  console.log('✅ nitro-boost.png créé depuis fire-dynamic-color');
}

// 7. gtc-token.png
const gtcTarget = path.join(publicDir, 'images/games/shared/coins/gtc-token.png');
fs.mkdirSync(path.dirname(gtcTarget), { recursive: true });
const gtcSrc = path.join(publicDir, 'icons/gtc-icon.png');
if (fs.existsSync(gtcSrc)) {
  fs.copyFileSync(gtcSrc, gtcTarget);
  console.log('✅ gtc-token.png créé depuis gtc-icon.png');
}

// 8. loot-chest.png
const chestTarget = path.join(publicDir, 'images/games/shared/crates/loot-chest.png');
fs.mkdirSync(path.dirname(chestTarget), { recursive: true });
const giftBox3d = path.join(publicDir, 'images/icons/3d-icons/3dicons-gift-box-dynamic-color.png');
if (fs.existsSync(giftBox3d)) {
  fs.copyFileSync(giftBox3d, chestTarget);
  console.log('✅ loot-chest.png créé depuis gift-box-dynamic-color');
}
