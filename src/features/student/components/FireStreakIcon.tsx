import React from 'react';

interface FireStreakIconProps {
  streakCount: number;
  onClick?: () => void;
}

export const FireStreakIcon: React.FC<FireStreakIconProps> = ({ streakCount, onClick }) => {
  const hasStreak = streakCount > 0;

  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
        hasStreak
          ? 'bg-orange-500/10 border-orange-500/50 text-orange-400 hover:bg-orange-500/20'
          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-700'
      }`}
      title={hasStreak ? `${streakCount} Active Streak Days!` : 'No Active Streak'}
    >
      <span className={hasStreak ? 'text-amber-400 animate-pulse' : 'text-slate-400 grayscale'}>
        🔥
      </span>
      <span>{streakCount}</span>
    </button>
  );
};

export default FireStreakIcon;
