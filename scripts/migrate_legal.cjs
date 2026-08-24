const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'src', 'pages', 'legal');
fs.readdirSync(dir).forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace text-sm and text-xs in paragraphs and list items to type-body-sm or type-caption
  content = content.replace(/text-slate-600 leading-relaxed text-sm/g, 'type-body-sm text-slate-600');
  content = content.replace(/text-slate-600 text-sm/g, 'type-body-sm text-slate-600');
  content = content.replace(/text-slate-500 text-sm/g, 'type-body-sm text-slate-500');
  content = content.replace(/text-sm text-slate-500/g, 'type-body-sm text-slate-500');
  content = content.replace(/text-sm text-slate-600/g, 'type-body-sm text-slate-600');
  content = content.replace(/text-xs font-semibold text-slate-400/g, 'type-caption font-semibold text-slate-400');
  content = content.replace(/text-xs text-slate-400/g, 'type-caption text-slate-400');
  content = content.replace(/text-xs text-slate-500/g, 'type-caption text-slate-500');
  content = content.replace(/text-xs text-slate-600/g, 'type-caption text-slate-600');

  // Tables in DataSafetyPolicyPage & DPDP
  content = content.replace(/<th className="([^"]*)text-xs font-semibold([^"]*)">/g, '<th className="$1type-table-head$2">');
  content = content.replace(/<td className="([^"]*)text-xs([^"]*)">/g, '<td className="$1type-table-cell$2">');
  content = content.replace(/<td className="([^"]*)text-sm([^"]*)">/g, '<td className="$1type-table-cell$2">');

  fs.writeFileSync(filePath, content, 'utf8');
});

console.log('Legal pages migrated successfully.');
