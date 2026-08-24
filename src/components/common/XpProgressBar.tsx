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
    <div className="w-full bg-white rounded-lg p-4 shadow-sm border border-gray-100">
      <div className="flex justify-between items-center mb-2">
        <span className="type-caption text-gray-700">{level}</span>
        <span className="type-caption text-indigo-600">
          {currentScore} / {maxScore} XP ({Math.round(percentage)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

export default XpProgressBar;
