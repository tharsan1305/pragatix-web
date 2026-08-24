const fs = require('fs');
const path = require('path');

const targetFiles = [
  'src/features/admin/tabs/AnalyticsTab.tsx',
  'src/features/admin/tabs/StudentsTab.tsx',
  'src/features/admin/tabs/AdminProfileTab.tsx',
  'src/features/teacher/tabs/TeacherGroupManagementTab.tsx',
  'src/features/teacher/pages/StudentsDirectoryPage.tsx'
];

targetFiles.forEach(relPath => {
  const fullPath = path.join(__dirname, '..', relPath);
  if (!fs.existsSync(fullPath)) return;
  const lines = fs.readFileSync(fullPath, 'utf8').split('\n');
  console.log(`\n================== ${relPath} ==================`);
  lines.forEach((line, idx) => {
    if (line.match(/\btext-(xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl)\b/) || line.match(/\bfont-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)\b/)) {
      if (line.length < 160) {
        console.log(`L${idx + 1}: ${line.trim()}`);
      } else {
        console.log(`L${idx + 1}: ${line.trim().slice(0, 150)}...`);
      }
    }
  });
});
