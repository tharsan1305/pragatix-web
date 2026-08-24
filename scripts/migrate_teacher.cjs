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

const teacherFiles = [
  'pages/StudentsDirectoryPage.tsx',
  'pages/TeacherActivityWorkflowPage.tsx',
  'tabs/ActivityTab.tsx',
  'tabs/AttendanceTab.tsx',
  'tabs/CCInboxTab.tsx',
  'tabs/HodPerformanceTab.tsx',
  'tabs/LeaderboardTab.tsx',
  'tabs/PerformanceActivitiesTab.tsx',
  'tabs/ProfileTab.tsx',
  'tabs/TeacherGroupManagementTab.tsx'
];

const standardReplacements = [
  [/font-heading text-3xl font-bold/g, 'type-h2'],
  [/font-heading text-2xl font-extrabold/g, 'type-h3'],
  [/font-heading text-2xl font-bold/g, 'type-h3'],
  [/font-heading text-xl font-bold/g, 'type-h4'],
  [/font-heading text-lg font-bold/g, 'type-h4'],
  [/font-heading text-base font-bold/g, 'type-h5'],
  [/font-heading font-bold text-slate-800 text-base/g, 'type-h5 text-slate-800'],
  [/font-heading font-bold text-slate-800/g, 'type-h5 text-slate-800'],
  [/font-heading font-bold/g, 'type-h5'],
  [/font-heading font-semibold/g, 'type-h5'],
  [/text-4xl font-bold/g, 'type-h1'],
  [/text-3xl font-extrabold/g, 'type-h2'],
  [/text-2xl font-bold/g, 'type-h3'],
  [/text-xl font-bold/g, 'type-h4 font-bold'],
  [/text-lg font-bold/g, 'type-h4 font-bold'],
  [/text-lg font-semibold/g, 'type-h5 font-semibold'],
  [/<th className="([^"]*)text-xs font-semibold([^"]*)">/g, '<th className="$1type-table-head$2">'],
  [/<th className="([^"]*)text-xs font-bold([^"]*)">/g, '<th className="$1type-table-head$2">'],
  [/<th className="([^"]*)text-xs([^"]*)">/g, '<th className="$1type-table-head$2">'],
  [/<th className="([^"]*)text-sm font-semibold([^"]*)">/g, '<th className="$1type-table-head$2">'],
  [/<td className="([^"]*)text-sm font-medium([^"]*)">/g, '<td className="$1type-table-cell font-medium$2">'],
  [/<td className="([^"]*)text-sm font-semibold([^"]*)">/g, '<td className="$1type-table-cell font-semibold$2">'],
  [/<td className="([^"]*)text-sm([^"]*)">/g, '<td className="$1type-table-cell$2">'],
  [/<td className="([^"]*)text-xs([^"]*)">/g, '<td className="$1type-table-cell$2">'],
  [/text-xs font-bold/g, 'type-caption font-bold'],
  [/text-xs font-semibold/g, 'type-caption font-semibold'],
  [/text-xs font-medium/g, 'type-caption font-medium'],
  [/text-xs text-slate-500/g, 'type-caption text-slate-500'],
  [/text-xs text-slate-400/g, 'type-caption text-slate-400'],
  [/text-sm text-slate-500/g, 'type-body-sm text-slate-500'],
  [/text-sm text-slate-600/g, 'type-body-sm text-slate-600'],
  [/text-sm font-bold/g, 'type-body-sm font-bold'],
  [/text-sm font-semibold/g, 'type-body-sm font-semibold'],
  [/text-sm font-medium/g, 'type-body-sm font-medium']
];

teacherFiles.forEach(file => {
  const filePath = path.join(__dirname, '../src/features/teacher', file);
  replaceInFile(filePath, standardReplacements);
});

console.log('Teacher files migrated successfully.');
