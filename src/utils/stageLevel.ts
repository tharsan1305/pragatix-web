export const getStageName = (level: number | string): string => {
  const num = typeof level === 'string' ? parseInt(level, 10) : level;
  switch (num) {
    case 1:
      return 'Explorer';
    case 2:
      return 'Builder';
    case 3:
      return 'Innovator';
    case 4:
      return 'Specialist';
    case 5:
      return 'Leader';
    case 6:
      return 'Mentor';
    case 7:
      return 'Architect';
    case 8:
      return 'Industry Ready';
    default:
      return 'Explorer';
  }
};
