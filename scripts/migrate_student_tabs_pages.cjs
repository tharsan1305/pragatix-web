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

// 1. DashboardTab.tsx
replaceInFile(path.join(__dirname, '../src/features/student/tabs/DashboardTab.tsx'), [
  [/font-heading text-2xl font-extrabold/g, 'type-h3'],
  [/font-heading text-xl font-bold/g, 'type-h4'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading font-bold text-slate-800 text-base/g, 'type-h5 text-slate-800'],
  [/font-heading font-bold text-slate-800/g, 'type-h5 text-slate-800'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/text-4xl font-bold/g, 'type-h1'],
  [/text-lg font-bold text-slate-800/g, 'type-h4 text-slate-800 font-bold'],
  [/text-lg font-bold text-indigo-600/g, 'type-h4 text-indigo-600 font-bold'],
  [/text-lg font-bold/g, 'type-h4 font-bold'],
  [/text-xs font-bold text-indigo-600/g, 'type-btn text-indigo-600'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs font-medium/g, 'type-caption font-medium'],
  [/text-xs text-slate-500/g, 'type-caption text-slate-500'],
  [/text-xs text-slate-400/g, 'type-caption text-slate-400'],
  [/text-xs text-indigo-200/g, 'type-caption text-indigo-200'],
  [/text-slate-500 text-sm/g, 'type-body-sm text-slate-500'],
  [/text-slate-600 text-sm/g, 'type-body-sm text-slate-600'],
  [/text-sm font-bold/g, 'type-body-sm font-bold'],
  [/text-sm font-semibold/g, 'type-body-sm font-semibold'],
  [/text-sm font-medium/g, 'type-body-sm font-medium']
]);

// 2. ActivitiesTab.tsx
replaceInFile(path.join(__dirname, '../src/features/student/tabs/ActivitiesTab.tsx'), [
  [/font-heading text-2xl font-bold/g, 'type-h3'],
  [/font-heading text-xl font-bold/g, 'type-h4'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/font-heading font-bold/g, 'type-h5'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs font-medium/g, 'type-caption font-medium'],
  [/text-sm font-bold/g, 'type-body-sm font-bold'],
  [/text-sm font-semibold/g, 'type-body-sm font-semibold'],
  [/text-sm font-medium/g, 'type-body-sm font-medium'],
  [/text-xs text-slate-500/g, 'type-caption text-slate-500'],
  [/text-xs text-slate-400/g, 'type-caption text-slate-400'],
  [/text-sm text-slate-500/g, 'type-body-sm text-slate-500'],
  [/text-sm text-slate-600/g, 'type-body-sm text-slate-600']
]);

// 3. LeaderboardTab.tsx
replaceInFile(path.join(__dirname, '../src/features/student/tabs/LeaderboardTab.tsx'), [
  [/font-heading text-2xl font-bold/g, 'type-h3'],
  [/font-heading text-xl font-bold/g, 'type-h4'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/text-3xl font-extrabold/g, 'type-h2'],
  [/text-2xl font-bold/g, 'type-h3'],
  [/text-lg font-bold/g, 'type-h4 font-bold'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs font-medium/g, 'type-caption font-medium'],
  [/text-sm font-bold/g, 'type-body-sm font-bold'],
  [/text-sm font-semibold/g, 'type-body-sm font-semibold'],
  [/text-sm font-medium/g, 'type-body-sm font-medium'],
  [/text-xs text-slate-500/g, 'type-caption text-slate-500'],
  [/text-xs text-slate-400/g, 'type-caption text-slate-400'],
  [/text-sm text-slate-500/g, 'type-body-sm text-slate-500'],
  [/text-sm text-slate-600/g, 'type-body-sm text-slate-600']
]);

// 4. LevelsBadgesTab.tsx
replaceInFile(path.join(__dirname, '../src/features/student/tabs/LevelsBadgesTab.tsx'), [
  [/font-heading text-2xl font-bold/g, 'type-h3'],
  [/font-heading text-xl font-bold/g, 'type-h4'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs font-medium/g, 'type-caption font-medium'],
  [/text-sm font-bold/g, 'type-body-sm font-bold'],
  [/text-sm font-semibold/g, 'type-body-sm font-semibold'],
  [/text-sm font-medium/g, 'type-body-sm font-medium'],
  [/text-xs text-slate-500/g, 'type-caption text-slate-500'],
  [/text-xs text-slate-400/g, 'type-caption text-slate-400'],
  [/text-sm text-slate-500/g, 'type-body-sm text-slate-500'],
  [/text-sm text-slate-600/g, 'type-body-sm text-slate-600']
]);

// 5. PointReviewTab.tsx
replaceInFile(path.join(__dirname, '../src/features/student/tabs/PointReviewTab.tsx'), [
  [/font-heading text-2xl font-bold/g, 'type-h3'],
  [/font-heading text-xl font-bold/g, 'type-h4'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs font-medium/g, 'type-caption font-medium'],
  [/text-sm font-bold/g, 'type-body-sm font-bold'],
  [/text-sm font-semibold/g, 'type-body-sm font-semibold'],
  [/text-sm font-medium/g, 'type-body-sm font-medium'],
  [/text-xs text-slate-500/g, 'type-caption text-slate-500'],
  [/text-xs text-slate-400/g, 'type-caption text-slate-400'],
  [/text-sm text-slate-500/g, 'type-body-sm text-slate-500'],
  [/text-sm text-slate-600/g, 'type-body-sm text-slate-600']
]);

// 6. ProfileTab.tsx
replaceInFile(path.join(__dirname, '../src/features/student/tabs/ProfileTab.tsx'), [
  [/font-heading text-2xl font-bold/g, 'type-h3'],
  [/font-heading text-xl font-bold/g, 'type-h4'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs font-medium/g, 'type-caption font-medium'],
  [/text-sm font-bold/g, 'type-body-sm font-bold'],
  [/text-sm font-semibold/g, 'type-body-sm font-semibold'],
  [/text-sm font-medium/g, 'type-body-sm font-medium'],
  [/text-xs text-slate-500/g, 'type-caption text-slate-500'],
  [/text-xs text-slate-400/g, 'type-caption text-slate-400'],
  [/text-sm text-slate-500/g, 'type-body-sm text-slate-500'],
  [/text-sm text-slate-600/g, 'type-body-sm text-slate-600']
]);

// 7. StudentAttendanceTab.tsx
replaceInFile(path.join(__dirname, '../src/features/student/tabs/StudentAttendanceTab.tsx'), [
  [/font-heading text-2xl font-bold/g, 'type-h3'],
  [/font-heading text-xl font-bold/g, 'type-h4'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs font-medium/g, 'type-caption font-medium'],
  [/text-sm font-bold/g, 'type-body-sm font-bold'],
  [/text-sm font-semibold/g, 'type-body-sm font-semibold'],
  [/text-sm font-medium/g, 'type-body-sm font-medium'],
  [/text-xs text-slate-500/g, 'type-caption text-slate-500'],
  [/text-xs text-slate-400/g, 'type-caption text-slate-400'],
  [/text-sm text-slate-500/g, 'type-body-sm text-slate-500'],
  [/text-sm text-slate-600/g, 'type-body-sm text-slate-600']
]);

// 8. StudentGroupTab.tsx
replaceInFile(path.join(__dirname, '../src/features/student/tabs/StudentGroupTab.tsx'), [
  [/font-heading text-2xl font-bold/g, 'type-h3'],
  [/font-heading text-xl font-bold/g, 'type-h4'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs font-medium/g, 'type-caption font-medium'],
  [/text-sm font-bold/g, 'type-body-sm font-bold'],
  [/text-sm font-semibold/g, 'type-body-sm font-semibold'],
  [/text-sm font-medium/g, 'type-body-sm font-medium'],
  [/text-xs text-slate-500/g, 'type-caption text-slate-500'],
  [/text-xs text-slate-400/g, 'type-caption text-slate-400'],
  [/text-sm text-slate-500/g, 'type-body-sm text-slate-500'],
  [/text-sm text-slate-600/g, 'type-body-sm text-slate-600']
]);

// 9. ActivityStreaksPage.tsx
replaceInFile(path.join(__dirname, '../src/features/student/pages/ActivityStreaksPage.tsx'), [
  [/font-heading text-2xl font-bold/g, 'type-h3'],
  [/font-heading text-xl font-bold/g, 'type-h4'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs font-medium/g, 'type-caption font-medium'],
  [/text-sm font-bold/g, 'type-body-sm font-bold'],
  [/text-sm font-semibold/g, 'type-body-sm font-semibold'],
  [/text-sm font-medium/g, 'type-body-sm font-medium'],
  [/text-xs text-slate-500/g, 'type-caption text-slate-500'],
  [/text-xs text-slate-400/g, 'type-caption text-slate-400'],
  [/text-sm text-slate-500/g, 'type-body-sm text-slate-500'],
  [/text-sm text-slate-600/g, 'type-body-sm text-slate-600']
]);

// 10. StudentDetailsPage.tsx & StudentListPage.tsx
replaceInFile(path.join(__dirname, '../src/features/student/pages/StudentDetailsPage.tsx'), [
  [/font-heading text-2xl font-bold/g, 'type-h3'],
  [/font-heading text-xl font-bold/g, 'type-h4'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs font-medium/g, 'type-caption font-medium'],
  [/text-sm font-bold/g, 'type-body-sm font-bold'],
  [/text-sm font-semibold/g, 'type-body-sm font-semibold'],
  [/text-sm font-medium/g, 'type-body-sm font-medium'],
  [/text-xs text-slate-500/g, 'type-caption text-slate-500'],
  [/text-xs text-slate-400/g, 'type-caption text-slate-400'],
  [/text-sm text-slate-500/g, 'type-body-sm text-slate-500'],
  [/text-sm text-slate-600/g, 'type-body-sm text-slate-600']
]);

replaceInFile(path.join(__dirname, '../src/features/student/pages/StudentListPage.tsx'), [
  [/font-heading text-2xl font-bold/g, 'type-h3'],
  [/font-heading text-xl font-bold/g, 'type-h4'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs font-medium/g, 'type-caption font-medium'],
  [/text-sm font-bold/g, 'type-body-sm font-bold'],
  [/text-sm font-semibold/g, 'type-body-sm font-semibold'],
  [/text-sm font-medium/g, 'type-body-sm font-medium'],
  [/text-xs text-slate-500/g, 'type-caption text-slate-500'],
  [/text-xs text-slate-400/g, 'type-caption text-slate-400'],
  [/text-sm text-slate-500/g, 'type-body-sm text-slate-500'],
  [/text-sm text-slate-600/g, 'type-body-sm text-slate-600']
]);

console.log('Student tabs and pages updated.');
