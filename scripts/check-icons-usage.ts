import fs from 'fs';

const report = JSON.parse(fs.readFileSync('public-audit-report.json', 'utf8'));

const inIcons = report.filter((f: any) => f.relPath.startsWith('icons/') && !f.relPath.startsWith('icons/3d'));
console.log(`Fichiers sous public/icons/ : ${inIcons.length}`);

for (const f of inIcons) {
  if (f.usedInCode) {
    console.log(`\n✅ ${f.relPath} (${(f.sizeBytes / 1024).toFixed(1)} KB) -> Réfs: ${f.references.join(', ')}`);
  } else {
    // console.log(`⚪ ${f.relPath}`);
  }
}

const unused = inIcons.filter((f: any) => !f.usedInCode);
console.log(`\nInutilisés sous public/icons/ : ${unused.length}`);
unused.forEach((f: any) => console.log(`  - ${f.relPath} (${(f.sizeBytes/1024).toFixed(1)} KB)`));
