import React from 'react';
import { CheckCircle2, Lock, Sparkles, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Stage } from '../types/activity';
import { ProgressBar } from './ProgressBar';

interface StageCardProps {
  stage: Stage;
  onClick: (stage: Stage) => void;
}

export const StageCard: React.FC<StageCardProps> = ({ stage, onClick }) => {
  const isCompleted = stage.isCompleted || stage.stageStatus === 'COMPLETED';
  const isLocked = (stage.isLocked || stage.stageStatus === 'LOCKED') && !isCompleted;
  const isClickable = !isCompleted && !isLocked;
  const percentage = Math.round(stage.percentage);

  const handleClick = () => {
    if (isLocked) {
      toast.error('This stage is currently locked.');
      return;
    }
    if (isCompleted) {
      toast('This stage is already completed.', { icon: 'ℹ️' });
    }
    onClick(stage);
  };

  return (
    <div
      onClick={handleClick}
      className={`bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-all duration-200 p-5 space-y-4 ${
        isLocked 
          ? 'opacity-60 cursor-not-allowed bg-bg' 
          : 'hover:border-accent/40 cursor-pointer hover:shadow-md'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Left Icon Container */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
            isLocked
              ? 'bg-bg text-text-muted border-border'
              : (isCompleted
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-accent-tint text-accent border-accent/20')
          }`}
        >
          {isLocked ? (
            <Lock className="w-5 h-5 stroke-[2]" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
          ) : (
            <Sparkles className="w-5 h-5 stroke-[2]" />
          )}
        </div>

        {/* Content Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className={`type-h4 font-bold truncate ${isLocked ? 'text-text-muted' : 'text-text-primary'}`}>
              {stage.name}
            </h3>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
              isLocked 
                ? 'bg-bg text-text-muted border border-border' 
                : isCompleted 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : 'bg-accent-tint text-accent border border-accent/20'
            }`}>
              {isLocked ? 'Locked' : isCompleted ? 'Completed' : 'Active'}
            </span>
          </div>

          <div
            className={`type-caption font-bold mt-1 ${
              isLocked
                ? 'text-text-muted'
                : (isCompleted ? 'text-emerald-800' : 'text-accent')
            }`}
          >
            {isLocked
              ? 'Stage Locked'
              : (isCompleted
                ? 'Stage Completed'
                : `Progress: ${percentage}% • ${stage.completedSubgroups}/${stage.totalSubgroups} Subgroups`)}
          </div>
        </div>

        {/* Right Chevron Arrow */}
        {isClickable && (
          <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center text-text-muted shrink-0 group-hover:text-accent transition-colors">
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Embedded Linear Progress Bar & XP breakdown */}
      <div className="pt-3 border-t border-border space-y-2">
        <div className="flex justify-between items-center type-caption text-text-secondary font-medium">
          <span>Current XP: <strong className="text-text-primary font-bold">{stage.currentXp}</strong> / {stage.expectedXp}</span>
          <span>Subgroups: <strong className="text-text-primary font-bold">{stage.completedSubgroups}/{stage.totalSubgroups}</strong></span>
        </div>

        <ProgressBar
          progress={percentage}
          barColor={isCompleted ? 'bg-emerald-600' : 'bg-accent'}
          backgroundColor="bg-bg border border-border"
          heightClass="h-2"
        />
      </div>
    </div>
  );
};

export default StageCard;
