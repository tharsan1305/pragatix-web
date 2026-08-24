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

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Fix broken combinations like "font-heading type-body-sm"
  content = content.replace(/font-heading\s+type-body-sm/g, 'type-h5');
  content = content.replace(/font-heading\s+type-body/g, 'type-h4');
  content = content.replace(/font-heading\s+type-h2\s+font-extrabold/g, 'type-h2');
  content = content.replace(/font-heading\s+type-h3/g, 'type-h3');
  content = content.replace(/font-heading\s+type-h4/g, 'type-h4');
  content = content.replace(/font-heading\s+type-h5/g, 'type-h5');
  content = content.replace(/font-heading\s+type-h6/g, 'type-h6');
  content = content.replace(/type-caption\s+font-bold\s+text-slate-500\s+mb-1/g, 'type-form-label text-slate-500 mb-1');

  // 2. Buttons without type-btn
  content = content.replace(/(<button[^>]*className=["'][^"']*?)\b(px-\d+|py-\d+|bg-[a-z0-9#-]+|hover:bg-[a-z0-9#-]+)\b([^"']*?["'])/g, (match, p1, p2, p3) => {
    if (match.includes('type-') || match.includes('p-1') || match.includes('p-2 rounded-full') || match.includes('absolute')) return match;
    return `${p1}type-btn ${p2}${p3}`;
  });

  // 3. Labels without type-form-label
  content = content.replace(/(<label[^>]*className=["'][^"']*?)(["'])/g, (match, p1, p2) => {
    if (match.includes('type-')) return match;
    return `${p1} type-form-label${p2}`;
  });

  // 4. Clean up redundant font weights after type-* classes
  content = content.replace(/\btype-h1\s+font-(bold|extrabold|black)\b/g, 'type-h1');
  content = content.replace(/\btype-h2\s+font-(semibold|bold|extrabold)\b/g, 'type-h2');
  content = content.replace(/\btype-h3\s+font-(semibold|bold|extrabold)\b/g, 'type-h3');
  content = content.replace(/\btype-h4\s+font-(semibold|bold|extrabold)\b/g, 'type-h4');
  content = content.replace(/\btype-h5\s+font-(semibold|bold)\b/g, 'type-h5');
  content = content.replace(/\btype-h6\s+font-(semibold|bold)\b/g, 'type-h6');
  content = content.replace(/\btype-btn\s+font-(semibold|bold|medium)\b/g, 'type-btn');
  content = content.replace(/\btype-nav\s+font-(semibold|bold|medium)\b/g, 'type-nav');
  content = content.replace(/\btype-form-label\s+font-(semibold|bold|medium)\b/g, 'type-form-label');
  content = content.replace(/\btype-table-head\s+font-(semibold|bold|medium)\b/g, 'type-table-head');
  content = content.replace(/\btype-table-cell\s+font-(normal|regular)\b/g, 'type-table-cell');
  content = content.replace(/\btype-body\s+font-(normal|regular)\b/g, 'type-body');
  content = content.replace(/\btype-body-sm\s+font-(normal|regular)\b/g, 'type-body-sm');
  content = content.replace(/\btype-caption\s+font-(medium|semibold)\b/g, 'type-caption');
  content = content.replace(/\btype-fine\s+font-(normal|regular)\b/g, 'type-fine');

  // 5. Replace remaining standalone text-xs/text-sm in non-button non-label spans/divs/p
  content = content.replace(/(<(span|div|p)[^>]*className=["'][^"']*?)\btext-xs\b([^"']*?["'])/g, (match, p1, tag, p2) => {
    if (match.includes('type-')) return match;
    return `${p1}type-caption${p2}`;
  });
  content = content.replace(/(<(span|div|p)[^>]*className=["'][^"']*?)\btext-sm\b([^"']*?["'])/g, (match, p1, tag, p2) => {
    if (match.includes('type-')) return match;
    return `${p1}type-body-sm${p2}`;
  });
  content = content.replace(/(<(span|div|p)[^>]*className=["'][^"']*?)\btext-base\b([^"']*?["'])/g, (match, p1, tag, p2) => {
    if (match.includes('type-')) return match;
    return `${p1}type-body${p2}`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

console.log('Thorough typography cleaner executed successfully.');
