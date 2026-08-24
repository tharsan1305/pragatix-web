const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts = ['.tsx', '.ts']) {
  let files = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git' && entry.name !== 'test') {
        files = files.concat(getAllFiles(fullPath, exts));
      }
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  });
  return files;
}

const files = getAllFiles(path.join(__dirname, '../src'));
let totalType = 0;
let totalText = 0;
let totalFont = 0;
const detailed = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const typeMatches = (content.match(/type-[a-z0-9-]+/g) || []).length;
  // match font size classes
  const textMatches = (content.match(/text-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|\[[^\]]+\])/g) || []);
  // match font weight classes
  const fontMatches = (content.match(/font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/g) || []);

  totalType += typeMatches;
  totalText += textMatches.length;
  totalFont += fontMatches.length;

  if (textMatches.length > 0 || fontMatches.length > 0) {
    detailed.push({
      file: path.relative(path.join(__dirname, '..'), file),
      typeMatches,
      textCount: textMatches.length,
      fontCount: fontMatches.length,
      sampleText: textMatches.slice(0, 5),
      sampleFont: fontMatches.slice(0, 5)
    });
  }
}

detailed.sort((a, b) => (b.textCount + b.fontCount) - (a.textCount + a.fontCount));

console.log('=== TYPOGRAPHY AUDIT SUMMARY ===');
console.log('Total files checked:', files.length);
console.log('Total centralized type-* class usages:', totalType);
console.log('Total remaining text-* size classes:', totalText);
console.log('Total remaining font-* weight classes:', totalFont);
console.log('Files with remaining classes:', detailed.length);
console.log('\nTop 20 files with remaining occurrences:');
detailed.slice(0, 20).forEach(d => {
  console.log(`${d.file} -> type: ${d.typeMatches}, text: ${d.textCount}, font: ${d.fontCount}`);
});
