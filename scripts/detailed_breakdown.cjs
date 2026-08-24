const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts = ['.tsx', '.ts']) {
  let files = [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(entry => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== 'dist' && entry.name !== '.git' && entry.name !== 'test' && entry.name !== 'scripts') {
        files = files.concat(getAllFiles(fullPath, exts));
      }
    } else if (exts.includes(path.extname(entry.name))) {
      files.push(fullPath);
    }
  });
  return files;
}

const files = getAllFiles(path.join(__dirname, '../src'));
const remainingList = [];

files.forEach(file => {
  const relPath = path.relative(path.join(__dirname, '..'), file);
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const textMatches = line.match(/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)\b/g);
    const fontMatches = line.match(/\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/g);
    if (textMatches || fontMatches) {
      remainingList.push({
        file: relPath,
        line: idx + 1,
        textMatches: textMatches || [],
        fontMatches: fontMatches || [],
        content: line.trim()
      });
    }
  });
});

console.log('Total remaining lines with typography classes:', remainingList.length);
console.log('Sample of remaining lines:');
remainingList.slice(0, 30).forEach(r => {
  console.log(`[${r.file}:${r.line}] text: ${r.textMatches.join(', ')} | font: ${r.fontMatches.join(', ')} -> ${r.content.slice(0, 100)}`);
});
