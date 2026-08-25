import React from 'react';

interface XpProgressBarProps {
  currentScore: number;
  maxScore?: number;
  level?: string;
}

export const XpProgressBar: React.FC<XpProgressBarProps> = ({
  currentScore,
  maxScore = 100,
  level = 'Level Progression',
}) => {
  const percentage = Math.min(100, Math.max(0, (currentScore / maxScore) * 100));

  return (
    <div className="w-full bg-card rounded-lg p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border">
      <div className="flex justify-between items-center mb-2">
        <span className="type-caption text-text-primary font-bold">{level}</span>
        <span className="type-caption text-accent font-bold">
          {currentScore} / {maxScore} XP ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="w-full bg-bg border border-border rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-accent h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default XpProgressBar;
