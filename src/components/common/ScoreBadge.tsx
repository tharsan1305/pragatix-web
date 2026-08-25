import React from 'react';

interface ScoreBadgeProps {
  score: number;
  showLabel?: boolean;
}

export const ScoreBadge: React.FC<ScoreBadgeProps> = ({ score, showLabel = true }) => {
  let badgeColor = 'bg-bg text-text-primary border-border';
  let label = 'Standard';

  if (score >= 90) {
    badgeColor = 'bg-accent-tint text-accent border-accent/30 font-bold';
    label = 'Elite';
  } else if (score >= 75) {
    badgeColor = 'bg-success-tint text-success border-success/30 font-semibold';
    label = 'Advanced';
  } else if (score >= 50) {
    badgeColor = 'bg-bg text-text-primary border-border';
    label = 'Standard';
  } else {
    badgeColor = 'bg-warning-tint text-warning border-warning/30 font-semibold';
    label = 'At Risk';
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md type-caption border ${badgeColor}`}>
      <span className="font-bold mr-1">{score} XP</span>
      {showLabel && <span className="opacity-90">• {label}</span>}
    </span>
  );
};

export default ScoreBadge;
