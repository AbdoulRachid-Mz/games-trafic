import fs from 'fs';
import path from 'path';

const report = JSON.parse(fs.readFileSync('public-audit-report.json', 'utf8'));

const usedInImagesIcons = report.filter((f: any) => f.relPath.startsWith('images/icons') && f.usedInCode);
console.log(`Fichiers sous images/icons utilisés dans le code : ${usedInImagesIcons.length} / ${report.filter((f: any) => f.relPath.startsWith('images/icons')).length}`);

for (const f of usedInImagesIcons) {
  console.log(`\n📄 ${f.relPath}`);
  console.log(`   Taille: ${(f.sizeBytes / 1024).toFixed(1)} KB`);
  console.log(`   Références (${f.references.length}) :`, f.references.slice(0, 5));
}
