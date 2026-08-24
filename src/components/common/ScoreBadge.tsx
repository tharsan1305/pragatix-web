import React from 'react';

interface ScoreBadgeProps {
  score: number;
  showLabel?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, showLabel = true }) => {
  let badgeColor = 'bg-gray-100 text-gray-800 border-gray-300';
  let label = 'Standard';

  if (score >= 90) {
    badgeColor = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
    label = 'Elite';
  } else if (score >= 75) {
    badgeColor = 'bg-blue-100 text-blue-900 border-blue-300 font-semibold';
    label = 'Advanced';
  } else if (score >= 50) {
    badgeColor = 'bg-slate-100 text-slate-800 border-slate-300';
    label = 'Standard';
  } else {
    badgeColor = 'bg-rose-100 text-rose-900 border-rose-300 font-semibold';
    label = 'At Risk';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full type-caption border ${badgeColor}`}>
      <span className="font-semibold mr-1">{score} XP</span>
      {showLabel && <span className="opacity-90">• {label}</span>}
    </span>
  );
};

export default ScoreBadge;
