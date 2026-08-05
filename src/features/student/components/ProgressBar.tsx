import React from 'react';

interface ProgressBarProps {
  progress: number; // Percentage 0 - 100
  barColor?: string;
  backgroundColor?: string;
  heightClass?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  barColor = 'bg-white',
  backgroundColor = 'bg-white/20',
  heightClass = 'h-2',
}) => {
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={`w-full ${backgroundColor} ${heightClass} rounded-full overflow-hidden`}>
      <div
        className={`${barColor} h-full transition-all duration-300 ease-out`}
        style={{ width: `${normalizedProgress}%` }}
      />
    </div>
  );
};

export default ProgressBar;
