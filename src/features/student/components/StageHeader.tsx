import React from 'react';
import type { Stage } from '../types/activity';
import { ProgressBar } from './ProgressBar';

interface StageHeaderProps {
  stage: Stage;
}

export const StageHeader: React.FC<StageHeaderProps> = ({ stage }) => {
  const percentage = Math.round(stage.percentage);

  return (
    <div className="bg-card rounded-2xl p-6 text-text-primary border border-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] mb-6 space-y-4">
      {/* Top Row: Title & Completion % */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="type-h3 font-bold tracking-tight text-text-primary">Stage Summary</h3>
          <span className={`type-caption font-bold uppercase tracking-wider ${
            stage.isCompleted ? 'text-emerald-800' : (stage.isLocked ? 'text-text-muted' : 'text-accent')
          }`}>
            {stage.stageStatus || (stage.isCompleted ? 'COMPLETED' : 'ACTIVE')}
          </span>
        </div>
        <div className="bg-accent-tint text-accent border border-accent/20 px-3 py-1 rounded-lg type-caption font-bold shadow-none">
          {percentage}% Complete
        </div>
      </div>

      {/* Description */}
      {stage.description && (
        <p className="type-body-sm text-text-secondary leading-relaxed">
          {stage.description}
        </p>
      )}

      {/* Stats Columns: Current XP | Expected XP | Categories */}
      <div className="grid grid-cols-3 gap-3 py-2 text-center">
        <div className="p-3 bg-bg rounded-xl border border-border">
          <div className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Current XP</div>
          <div className="type-h3 font-black text-text-primary mt-0.5">{stage.currentXp}</div>
        </div>
        <div className="p-3 bg-bg rounded-xl border border-border">
          <div className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Expected XP</div>
          <div className="type-h3 font-black text-text-primary mt-0.5">{stage.expectedXp}</div>
        </div>
        <div className="p-3 bg-bg rounded-xl border border-border">
          <div className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Categories</div>
          <div className="type-h3 font-black text-text-primary mt-0.5">{stage.subgroups.length}</div>
        </div>
      </div>

      {/* Linear Progress Bar */}
      <ProgressBar
        progress={percentage}
        barColor={stage.isCompleted ? 'bg-emerald-600' : 'bg-accent'}
        backgroundColor="bg-bg border border-border"
        heightClass="h-2.5"
      />
    </div>
  );
};

export default StageHeader;
