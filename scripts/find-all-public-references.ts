import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();

function getAllCodeFiles(dir: string): string[] {
  let res: string[] = [];
  if (!fs.existsSync(dir)) return res;
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      if (item !== 'node_modules' && item !== '.git' && item !== '.next') {
        res = res.concat(getAllCodeFiles(full));
      }
    } else if (/\.(tsx|ts|jsx|js|css|json|md)$/.test(item)) {
      res.push(full);
    }
  }
  return res;
}

const allFiles = [
  ...getAllCodeFiles(path.join(projectRoot, 'app')),
  ...getAllCodeFiles(path.join(projectRoot, 'components')),
  ...getAllCodeFiles(path.join(projectRoot, 'lib')),
  ...getAllCodeFiles(path.join(projectRoot, 'actions')),
  ...getAllCodeFiles(path.join(projectRoot, 'hooks')),
];

const foundPaths = new Set<string>();

const regex = /(["'`])(\/(?:images|icons|svg|videos|screenshots|fonts)[^"'`]+)\1/g;

for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;
  while ((match = regex.exec(content)) !== null) {
    foundPaths.add(match[2]);
  }
}

console.log(`Trouvé ${foundPaths.size} chemins publics distincts utilisés dans le code :`);
const sorted = Array.from(foundPaths).sort();
for (const p of sorted) {
  const localPath = path.join(projectRoot, 'public', p.slice(1));
  const exists = fs.existsSync(localPath);
  console.log(`  ${exists ? '✅' : '❌ MANQUANT:'} ${p}`);
}
