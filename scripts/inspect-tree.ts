import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const publicDir = path.join(projectRoot, 'public');

function inspectDir(dir: string, indent: string = '') {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      const subItems = fs.readdirSync(full);
      const fileCount = subItems.filter(i => fs.statSync(path.join(full, i)).isFile()).length;
      const dirCount = subItems.filter(i => fs.statSync(path.join(full, i)).isDirectory()).length;
      console.log(`${indent}📁 ${item}/ (${fileCount} fichiers, ${dirCount} sous-dossiers)`);
      if (indent.length < 8) {
        inspectDir(full, indent + '  ');
      }
    }
  }
}

console.log('Arborescence détaillée de public/ :');
inspectDir(publicDir);
