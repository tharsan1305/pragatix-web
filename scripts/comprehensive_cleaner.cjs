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

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // Replace text-[...] patterns
  content = content.replace(/\btext-\[10px\]\b/g, 'type-fine');
  content = content.replace(/\btext-\[11px\]\b/g, 'type-fine');
  content = content.replace(/\btext-\[12px\]\b/g, 'type-caption');
  content = content.replace(/\btext-\[13px\]\b/g, 'type-fine');
  content = content.replace(/\btext-\[14px\]\b/g, 'type-caption');
  content = content.replace(/\btext-\[15px\]\b/g, 'type-table-cell');
  content = content.replace(/\btext-\[16px\]\b/g, 'type-h6');
  content = content.replace(/\btext-\[18px\]\b/g, 'type-h5');
  content = content.replace(/\btext-\[20px\]\b/g, 'type-h4');
  content = content.replace(/\btext-\[22px\]\b/g, 'type-h4');
  content = content.replace(/\btext-\[24px\]\b/g, 'type-h3');
  content = content.replace(/\btext-\[28px\]\b/g, 'type-h3');
  content = content.replace(/\btext-\[32px\]\b/g, 'type-h2');
  content = content.replace(/\btext-\[36px\]\b/g, 'type-h1');
  content = content.replace(/\btext-\[40px\]\b/g, 'type-h1');

  // Convert labels
  content = content.replace(/<label([^>]*?)className=["']([^"']*?)["']/g, (match, before, cls) => {
    let newCls = cls;
    if (!newCls.includes('type-form-label')) {
      newCls = newCls.replace(/\btype-caption\b/g, '').replace(/\btext-sm\b/g, '').replace(/\btext-xs\b/g, '');
      newCls = `type-form-label ${newCls}`.trim().replace(/\s+/g, ' ');
    }
    return `<label${before}className="${newCls}"`;
  });

  // Clean redundant font weights inside typography classes
  content = content.replace(/\btype-form-label\s+(font-bold|font-semibold|font-medium)\b/g, 'type-form-label');
  content = content.replace(/\btype-btn\s+(font-bold|font-semibold|font-medium)\b/g, 'type-btn');
  content = content.replace(/\btype-nav\s+(font-bold|font-semibold|font-medium)\b/g, 'type-nav');
  content = content.replace(/\btype-table-head\s+(font-bold|font-semibold|font-medium)\b/g, 'type-table-head');
  content = content.replace(/\btype-table-cell\s+(font-normal|font-regular)\b/g, 'type-table-cell');
  content = content.replace(/\btype-h1\s+(font-bold|font-extrabold|font-black)\b/g, 'type-h1');
  content = content.replace(/\btype-h2\s+(font-bold|font-semibold|font-extrabold)\b/g, 'type-h2');
  content = content.replace(/\btype-h3\s+(font-bold|font-semibold|font-extrabold)\b/g, 'type-h3');
  content = content.replace(/\btype-h4\s+(font-bold|font-semibold|font-extrabold)\b/g, 'type-h4');
  content = content.replace(/\btype-h5\s+(font-bold|font-semibold)\b/g, 'type-h5');
  content = content.replace(/\btype-h6\s+(font-bold|font-semibold)\b/g, 'type-h6');
  content = content.replace(/\btype-body\s+(font-normal|font-regular)\b/g, 'type-body');
  content = content.replace(/\btype-body-sm\s+(font-normal|font-regular)\b/g, 'type-body-sm');
  content = content.replace(/\btype-caption\s+(font-medium|font-semibold)\b/g, 'type-caption');
  content = content.replace(/\btype-fine\s+(font-normal|font-regular)\b/g, 'type-fine');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

console.log('Comprehensive cleaner executed.');
