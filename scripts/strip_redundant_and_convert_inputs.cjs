const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts = ['.tsx']) {
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

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Remove redundant text-sm, text-xs, text-base, text-lg after any type-* class
  content = content.replace(/(type-[a-z0-9-]+)(\s+)([^"'>]*?)\b(text-xs|text-sm|text-base|text-lg|text-xl|text-2xl)\b/g, '$1$2$3');
  content = content.replace(/\b(text-xs|text-sm|text-base|text-lg|text-xl|text-2xl)\b(\s+)([^"'>]*?)(type-[a-z0-9-]+)/g, '$3$4');

  // 2. Remove redundant font weights if element already has type-*
  // Note: type-h1 through type-h6, type-btn, type-nav, type-form-label, type-table-head already define font-weight.
  // type-body, type-body-sm, type-table-cell, type-fine are 400.
  // type-caption is 500.
  content = content.replace(/(type-(?:h[1-6]|btn|nav|form-label|table-head))(\s+)([^"'>]*?)\bfont-(?:bold|semibold|medium|extrabold)\b/g, '$1$2$3');
  content = content.replace(/\bfont-(?:bold|semibold|medium|extrabold)\b(\s+)([^"'>]*?)(type-(?:h[1-6]|btn|nav|form-label|table-head))/g, '$2$3');

  // 3. Convert all input / select / textarea font sizes to type-body-sm
  content = content.replace(/(<(?:input|select|textarea)[^>]*className=["'][^"']*?)\btext-(?:xs|sm|base)\b([^"']*?["'])/g, '$1type-body-sm$2');

  // 4. Convert table elements
  content = content.replace(/(<tbody[^>]*className=["'][^"']*?)\btext-(?:xs|sm)\b([^"']*?["'])/g, '$1type-table-cell$2');
  content = content.replace(/(<tr[^>]*className=["'][^"']*?)\btext-(?:xs|sm)\b([^"']*?["'])/g, '$1type-table-cell$2');

  // Clean double spaces in classNames
  content = content.replace(/className=(["'])(.*?)\1/g, (match, quote, cls) => {
    const cleaned = cls.replace(/\s+/g, ' ').trim();
    return `className=${quote}${cleaned}${quote}`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

console.log('Stripped redundant classes and converted inputs.');
