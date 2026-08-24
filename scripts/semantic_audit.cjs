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

  // Replace text-xs with type-caption where appropriate (spans, badges, paragraphs, small divs)
  // But preserve special classes like text-xs on SVG or icon containers if any
  content = content.replace(/\btext-xs\s+font-bold\b/g, 'type-caption font-bold');
  content = content.replace(/\btext-xs\s+font-semibold\b/g, 'type-caption font-semibold');
  content = content.replace(/\btext-xs\s+font-medium\b/g, 'type-caption font-medium');
  content = content.replace(/\btext-xs\s+text-slate-500\b/g, 'type-caption text-slate-500');
  content = content.replace(/\btext-xs\s+text-slate-400\b/g, 'type-caption text-slate-400');
  content = content.replace(/\btext-xs\s+text-slate-600\b/g, 'type-caption text-slate-600');
  content = content.replace(/\btext-xs\s+text-slate-700\b/g, 'type-caption text-slate-700');
  content = content.replace(/\btext-xs\s+text-slate-800\b/g, 'type-caption text-slate-800');
  content = content.replace(/\btext-xs\s+text-slate-900\b/g, 'type-caption text-slate-900');
  content = content.replace(/\btext-xs\s+text-gray-500\b/g, 'type-caption text-gray-500');
  content = content.replace(/\btext-xs\s+text-gray-400\b/g, 'type-caption text-gray-400');

  // Replace text-sm with type-body-sm where appropriate
  content = content.replace(/\btext-sm\s+font-bold\b/g, 'type-body-sm font-bold');
  content = content.replace(/\btext-sm\s+font-semibold\b/g, 'type-body-sm font-semibold');
  content = content.replace(/\btext-sm\s+font-medium\b/g, 'type-body-sm font-medium');
  content = content.replace(/\btext-sm\s+text-slate-500\b/g, 'type-body-sm text-slate-500');
  content = content.replace(/\btext-sm\s+text-slate-600\b/g, 'type-body-sm text-slate-600');
  content = content.replace(/\btext-sm\s+text-slate-700\b/g, 'type-body-sm text-slate-700');
  content = content.replace(/\btext-sm\s+text-slate-800\b/g, 'type-body-sm text-slate-800');
  content = content.replace(/\btext-sm\s+text-slate-900\b/g, 'type-body-sm text-slate-900');

  // Replace text-base with type-body or type-body-sm
  content = content.replace(/\btext-base\s+font-bold\b/g, 'type-h5 font-bold');
  content = content.replace(/\btext-base\s+font-semibold\b/g, 'type-h5 font-semibold');
  content = content.replace(/\btext-base\s+font-medium\b/g, 'type-body font-medium');
  content = content.replace(/\btext-base\s+text-slate-600\b/g, 'type-body text-slate-600');
  content = content.replace(/\btext-base\s+text-slate-700\b/g, 'type-body text-slate-700');
  content = content.replace(/\btext-base\s+text-slate-800\b/g, 'type-body text-slate-800');

  // Replace remaining text-lg with type-h4 / type-h5
  content = content.replace(/\btext-lg\s+font-bold\b/g, 'type-h4 font-bold');
  content = content.replace(/\btext-lg\s+font-semibold\b/g, 'type-h5 font-semibold');
  content = content.replace(/\btext-lg\s+font-extrabold\b/g, 'type-h4 font-extrabold');

  // Replace remaining text-2xl and text-3xl
  content = content.replace(/\btext-2xl\s+font-bold\b/g, 'type-h3 font-bold');
  content = content.replace(/\btext-2xl\s+font-extrabold\b/g, 'type-h3 font-extrabold');
  content = content.replace(/\btext-3xl\s+font-bold\b/g, 'type-h2 font-bold');
  content = content.replace(/\btext-3xl\s+font-extrabold\b/g, 'type-h2 font-extrabold');

  // Remove redundant font classes after type-* where the role already sets it
  content = content.replace(/\btype-h1\s+font-bold\b/g, 'type-h1');
  content = content.replace(/\btype-h2\s+font-semibold\b/g, 'type-h2');
  content = content.replace(/\btype-h3\s+font-semibold\b/g, 'type-h3');
  content = content.replace(/\btype-h4\s+font-semibold\b/g, 'type-h4');
  content = content.replace(/\btype-h5\s+font-semibold\b/g, 'type-h5');
  content = content.replace(/\btype-h6\s+font-semibold\b/g, 'type-h6');
  content = content.replace(/\btype-body\s+font-normal\b/g, 'type-body');
  content = content.replace(/\btype-body-sm\s+font-normal\b/g, 'type-body-sm');
  content = content.replace(/\btype-btn\s+font-semibold\b/g, 'type-btn');
  content = content.replace(/\btype-nav\s+font-semibold\b/g, 'type-nav');
  content = content.replace(/\btype-form-label\s+font-semibold\b/g, 'type-form-label');
  content = content.replace(/\btype-caption\s+font-medium\b/g, 'type-caption');
  content = content.replace(/\btype-fine\s+font-normal\b/g, 'type-fine');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
  }
}

console.log('Semantic audit pass completed.');
