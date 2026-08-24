const fs = require('fs');
const path = require('path');

function getAllFiles(dir, exts = ['.tsx']) {
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

  // 1. Convert button elements with text-sm/text-base/text-xs to type-btn if not already type-btn
  content = content.replace(/(<button[^>]*className=["'`][^"'`]*)\btext-(sm|base|xs)\b([^"'`]*["'`])/g, (match, prefix, size, suffix) => {
    if (match.includes('type-')) return match;
    return `${prefix}type-btn${suffix}`;
  });

  // 2. Convert label elements to type-form-label
  content = content.replace(/(<label[^>]*className=["'`][^"'`]*)\btext-(sm|xs|base)\b([^"'`]*["'`])/g, (match, prefix, size, suffix) => {
    if (match.includes('type-')) return match;
    return `${prefix}type-form-label${suffix}`;
  });

  // 3. Convert input/select/textarea elements to type-body-sm / type-body
  content = content.replace(/(<(input|select|textarea)[^>]*className=["'`][^"'`]*)\btext-(sm|xs)\b([^"'`]*["'`])/g, (match, prefix, tag, size, suffix) => {
    if (match.includes('type-')) return match;
    return `${prefix}type-body-sm${suffix}`;
  });

  // 4. Convert table head th and td
  content = content.replace(/(<th[^>]*className=["'`][^"'`]*)\b(text-xs|text-sm|font-semibold|font-bold|font-medium)\b([^"'`]*["'`])/g, (match, prefix, cls, suffix) => {
    if (match.includes('type-table-head')) return match;
    return `${prefix}type-table-head${suffix}`;
  });
  content = content.replace(/(<td[^>]*className=["'`][^"'`]*)\b(text-xs|text-sm)\b([^"'`]*["'`])/g, (match, prefix, cls, suffix) => {
    if (match.includes('type-table-cell')) return match;
    return `${prefix}type-table-cell${suffix}`;
  });

  // 5. Convert h1-h6 elements that still have hardcoded text sizes
  content = content.replace(/(<h1[^>]*className=["'`][^"'`]*)\btext-(4xl|5xl|3xl|2xl)\b([^"'`]*["'`])/g, (m, p, s, sfx) => m.includes('type-') ? m : `${p}type-h1${sfx}`);
  content = content.replace(/(<h2[^>]*className=["'`][^"'`]*)\btext-(3xl|2xl|xl)\b([^"'`]*["'`])/g, (m, p, s, sfx) => m.includes('type-') ? m : `${p}type-h2${sfx}`);
  content = content.replace(/(<h3[^>]*className=["'`][^"'`]*)\btext-(2xl|xl|lg)\b([^"'`]*["'`])/g, (m, p, s, sfx) => m.includes('type-') ? m : `${p}type-h3${sfx}`);
  content = content.replace(/(<h4[^>]*className=["'`][^"'`]*)\btext-(xl|lg|base)\b([^"'`]*["'`])/g, (m, p, s, sfx) => m.includes('type-') ? m : `${p}type-h4${sfx}`);
  content = content.replace(/(<h5[^>]*className=["'`][^"'`]*)\btext-(lg|base|sm)\b([^"'`]*["'`])/g, (m, p, s, sfx) => m.includes('type-') ? m : `${p}type-h5${sfx}`);
  content = content.replace(/(<h6[^>]*className=["'`][^"'`]*)\btext-(base|sm|xs)\b([^"'`]*["'`])/g, (m, p, s, sfx) => m.includes('type-') ? m : `${p}type-h6${sfx}`);

  // 6. Convert common text-xs / text-[10px] / text-[11px] badges, chips, fine print
  content = content.replace(/\btext-\[10px\]\b/g, 'type-fine');
  content = content.replace(/\btext-\[11px\]\b/g, 'type-fine');
  content = content.replace(/\btext-\[12px\]\b/g, 'type-caption');
  content = content.replace(/\btext-\[13px\]\b/g, 'type-fine');
  content = content.replace(/\btext-\[14px\]\b/g, 'type-caption');
  content = content.replace(/\btext-\[15px\]\b/g, 'type-table-cell');
  content = content.replace(/\btext-\[16px\]\b/g, 'type-body-sm');
  content = content.replace(/\btext-\[18px\]\b/g, 'type-body');

  // 7. Clean up redundant font weights after standard type-* classes
  content = content.replace(/\btype-btn\s+font-(bold|semibold|medium)\b/g, 'type-btn');
  content = content.replace(/\btype-nav\s+font-(bold|semibold|medium)\b/g, 'type-nav');
  content = content.replace(/\btype-form-label\s+font-(bold|semibold|medium)\b/g, 'type-form-label');
  content = content.replace(/\btype-table-head\s+font-(bold|semibold|medium)\b/g, 'type-table-head');
  content = content.replace(/\btype-table-cell\s+font-normal\b/g, 'type-table-cell');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

console.log('Deep typography migration completed.');
