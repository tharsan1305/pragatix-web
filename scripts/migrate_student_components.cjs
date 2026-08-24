const fs = require('fs');
const path = require('path');

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement);
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

// 1. Student Components
replaceInFile(path.join(__dirname, '../src/features/student/components/ActivityCard.tsx'), [
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs font-medium/g, 'type-caption font-medium'],
  [/text-sm font-bold/g, 'type-body-sm font-bold'],
  [/text-xs/g, 'type-caption'],
  [/text-sm/g, 'type-body-sm']
]);

replaceInFile(path.join(__dirname, '../src/features/student/components/ActivityDetailsModal.tsx'), [
  [/font-heading text-xl font-bold/g, 'type-h3'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/text-sm font-semibold text-slate-700/g, 'type-form-label text-slate-700'],
  [/text-sm font-medium/g, 'type-body-sm font-medium'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs/g, 'type-caption'],
  [/text-sm/g, 'type-body-sm'],
  [/text-base font-semibold/g, 'type-btn']
]);

replaceInFile(path.join(__dirname, '../src/features/student/components/CategorySection.tsx'), [
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-sm/g, 'type-body-sm'],
  [/text-xs/g, 'type-caption']
]);

replaceInFile(path.join(__dirname, '../src/features/student/components/EmptyState.tsx'), [
  [/font-heading text-xl font-bold/g, 'type-h3'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/text-sm text-slate-500/g, 'type-body-sm text-slate-500'],
  [/text-xs/g, 'type-caption'],
  [/text-sm/g, 'type-body-sm']
]);

replaceInFile(path.join(__dirname, '../src/features/student/components/ProgressBar.tsx'), [
  [/text-sm font-semibold/g, 'type-caption font-semibold'],
  [/text-xs/g, 'type-fine'],
  [/text-sm/g, 'type-caption']
]);

replaceInFile(path.join(__dirname, '../src/features/student/components/StageCard.tsx'), [
  [/font-heading text-xl font-bold/g, 'type-h3'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs/g, 'type-caption'],
  [/text-sm font-bold/g, 'type-body-sm font-bold'],
  [/text-sm font-semibold/g, 'type-body-sm font-semibold'],
  [/text-sm/g, 'type-body-sm']
]);

replaceInFile(path.join(__dirname, '../src/features/student/components/StageDetailsModal.tsx'), [
  [/font-heading text-2xl font-bold/g, 'type-h2'],
  [/font-heading text-xl font-bold/g, 'type-h3'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs/g, 'type-caption'],
  [/text-sm font-semibold/g, 'type-body-sm font-semibold'],
  [/text-sm font-medium/g, 'type-body-sm font-medium'],
  [/text-sm/g, 'type-body-sm'],
  [/text-base font-semibold/g, 'type-btn']
]);

replaceInFile(path.join(__dirname, '../src/features/student/components/StageHeader.tsx'), [
  [/font-heading text-2xl font-bold/g, 'type-h2'],
  [/font-heading text-xl font-bold/g, 'type-h3'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs/g, 'type-caption'],
  [/text-sm/g, 'type-body-sm']
]);

replaceInFile(path.join(__dirname, '../src/features/student/components/StatusChip.tsx'), [
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs/g, 'type-caption'],
  [/text-sm/g, 'type-body-sm']
]);

console.log('Student components updated.');
