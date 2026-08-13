/**
 * Core Utility Formatters for React Web
 * Parity with Flutter's core/utils architecture.
 */

export const formatXp = (xp: number | undefined | null): string => {
  if (xp === undefined || xp === null) return '0 XP';
  return `${xp.toLocaleString()} XP`;
};

export const formatRank = (rank: number | undefined | null): string => {
  if (!rank || rank <= 0) return '#-';
  if (rank === 1) return '🥇 #1';
  if (rank === 2) return '🥈 #2';
  if (rank === 3) return '🥉 #3';
  return `#${rank}`;
};

export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
};
