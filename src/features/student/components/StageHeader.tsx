import React from 'react';
import type { Stage } from '../types/activity';
import { ProgressBar } from './ProgressBar';

interface StageHeaderProps {
  stage: Stage;
}

export const StageHeader: React.FC<StageHeaderProps> = ({ stage }) => {
  const percentage = Math.round(stage.percentage);

  return (
    <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl p-5 text-white shadow-lg mb-6">
      {/* Top Row: Title & Completion % */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="type-h3 tracking-tight">Stage Summary</h3>
          <span className={`type-caption font-bold ${
            stage.isCompleted ? 'text-emerald-300' : (stage.isLocked ? 'text-slate-300' : 'text-amber-200')
          }`}>
            {stage.stageStatus}
          </span>
        </div>
        <div className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full type-caption font-bold text-white shadow-sm">
          {percentage}% Complete
        </div>
      </div>

      {/* Description */}
      {stage.description && (
        <p className="type-caption text-white/90 leading-relaxed mb-4">
          {stage.description}
        </p>
      )}

      {/* Stats Columns: Current XP | Expected XP | Categories */}
      <div className="grid grid-cols-3 gap-2 py-3 border-t border-white/10 text-center my-2">
        <div>
          <div className="text-[11px] text-white/70 font-medium">Current XP</div>
          <div className="type-h4">{stage.currentXp}</div>
        </div>
        <div>
          <div className="text-[11px] text-white/70 font-medium">Expected XP</div>
          <div className="type-h4">{stage.expectedXp}</div>
        </div>
        <div>
          <div className="text-[11px] text-white/70 font-medium">Categories</div>
          <div className="type-h4">{stage.subgroups.length}</div>
        </div>
      </div>

      {/* Linear Progress Bar */}
      <ProgressBar
        progress={percentage}
        barColor="bg-white"
        backgroundColor="bg-white/20"
        heightClass="h-2"
      />
    </div>
  );
};

export default StageHeader;
