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
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border type-fine font-black transition-all shadow-sm ${
        hasStreak
          ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-orange-400/60 text-orange-600 hover:scale-105 active:scale-95 shadow-orange-500/10'
          : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-slate-200'
      }`}
      title={hasStreak ? `${streakCount} Day Active Streak 🔥` : 'No Active Streak'}
    >
      <span className={`text-base leading-none ${hasStreak ? 'animate-pulse drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]' : 'grayscale opacity-40'}`}>
        🔥
      </span>
      <span className={`font-extrabold ${hasStreak ? 'text-orange-600' : 'text-slate-500'}`}>
        {streakCount} {hasStreak ? 'Days' : ''}
      </span>
    </button>
  );
};

export default FireStreakIcon;
