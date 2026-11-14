import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'public');

interface FileInfo {
  relPath: string;
  ext: string;
  sizeBytes: number;
  dir: string;
  usedInCode: boolean;
  references: string[];
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  let results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(fullPath, baseDir));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

// 1. Liste de tous les fichiers dans public/
const publicFiles = getAllFiles(publicDir);
console.log(`📊 Total fichiers dans public/ : ${publicFiles.length}`);

// 2. Extensions
const extCounts: Record<string, number> = {};
for (const f of publicFiles) {
  const ext = path.extname(f).toLowerCase();
  extCounts[ext] = (extCounts[ext] || 0) + 1;
}
console.log('Extensions :', JSON.stringify(extCounts, null, 2));

// 3. Scan du code pour repérer l'utilisation
const srcDirs = ['actions', 'app', 'components', 'hooks', 'lib', 'database', 'types', 'docs'];
const codeFiles: string[] = [];
for (const s of srcDirs) {
  const full = path.join(projectRoot, s);
  codeFiles.push(...getAllFiles(full));
}
// Ajout des fichiers à la racine (ex: package.json, manifests)
const rootFiles = ['package.json', 'next.config.ts', 'next.config.js', 'next.config.mjs'];
for (const rf of rootFiles) {
  const full = path.join(projectRoot, rf);
  if (fs.existsSync(full)) codeFiles.push(full);
}

console.log(`🔎 Total fichiers de code scannés : ${codeFiles.length}`);

const codeContents: { path: string; content: string }[] = [];
for (const cf of codeFiles) {
  try {
    const content = fs.readFileSync(cf, 'utf8');
    codeContents.push({ path: cf, content });
  } catch {}
}

const fileReport: FileInfo[] = [];

for (const pf of publicFiles) {
  const relPath = path.relative(publicDir, pf).replace(/\\/g, '/');
  const ext = path.extname(pf).toLowerCase();
  const stat = fs.statSync(pf);
  const fileName = path.basename(pf);
  const baseNameWithoutExt = path.basename(pf, ext);

  // Recherche dans le code : avec / au début, sans /, ou juste le nom de fichier
  const searchPatterns = [
    `/${relPath}`,
    relPath,
    `"${fileName}"`,
    `'${fileName}'`,
    `\`${fileName}\``,
  ];

  const references: string[] = [];
  for (const cc of codeContents) {
    for (const pat of searchPatterns) {
      if (cc.content.includes(pat)) {
        references.push(path.relative(projectRoot, cc.path).replace(/\\/g, '/'));
        break;
      }
    }
  }

  fileReport.push({
    relPath,
    ext,
    sizeBytes: stat.size,
    dir: path.dirname(relPath),
    usedInCode: references.length > 0,
    references: Array.from(new Set(references)),
  });
}

// Statistiques
const used = fileReport.filter(f => f.usedInCode);
const unused = fileReport.filter(f => !f.usedInCode);

console.log(`\n✅ Fichiers utilisés dans le code : ${used.length}`);
console.log(`⚠️ Fichiers non référencés directement dans le code : ${unused.length}`);

// Regroupement par dossier
const dirSummary: Record<string, { total: number; used: number; totalBytes: number }> = {};
for (const f of fileReport) {
  const topDir = f.relPath.split('/')[0];
  if (!dirSummary[topDir]) dirSummary[topDir] = { total: 0, used: 0, totalBytes: 0 };
  dirSummary[topDir].total++;
  if (f.usedInCode) dirSummary[topDir].used++;
  dirSummary[topDir].totalBytes += f.sizeBytes;
}

console.log('\n📁 Répartition par dossier :');
for (const [d, s] of Object.entries(dirSummary)) {
  console.log(`  - ${d}: ${s.total} fichiers (${(s.totalBytes / (1024*1024)).toFixed(2)} MB), ${s.used} utilisés`);
}

// Détection des fichiers avec "copy" dans le nom
const copyFiles = fileReport.filter(f => f.relPath.includes('copy'));
console.log(`\n🗑️ Fichiers "copy" détectés (${copyFiles.length}) :`);
copyFiles.forEach(f => console.log(`  - ${f.relPath} (utilisé: ${f.usedInCode})`));

// Sauvegarde du rapport JSON complet pour inspection
fs.writeFileSync(
  path.join(projectRoot, 'public-audit-report.json'),
  JSON.stringify(fileReport, null, 2)
);
console.log('\n📄 Rapport complet sauvegardé dans public-audit-report.json');
