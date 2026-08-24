import React from 'react';
import { CheckCircle2, Lock, Unlock, ChevronRight } from 'lucide-react';
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
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm transition-all duration-200 p-5 space-y-4 ${
        isLocked ? 'opacity-70 cursor-not-allowed bg-slate-50/80' : 'hover:shadow-md cursor-pointer'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Left Circle Avatar Icon matching Flutter */}
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
            isLocked
              ? 'bg-slate-200 text-slate-500'
              : (isCompleted
                ? 'bg-emerald-100/90 text-emerald-600'
                : 'bg-indigo-50 text-indigo-600')
          }`}
        >
          {isLocked ? (
            <Lock className="w-6 h-6 stroke-[2.2]" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
          ) : (
            <Unlock className="w-6 h-6 stroke-[2.2]" />
          )}
        </div>

        {/* Content Details matching Flutter */}
        <div className="flex-1 min-w-0">
          <h3 className={`type-h5 truncate ${isLocked ? 'text-slate-500' : 'text-slate-800'}`}>
            {stage.name}
          </h3>
          <div
            className={`type-caption font-bold mt-0.5 ${
              isLocked
                ? 'text-slate-500'
                : (isCompleted ? 'text-emerald-600' : 'text-amber-600')
            }`}
          >
            {isLocked
              ? 'Stage Locked'
              : (isCompleted
                ? 'Stage Completed'
                : `Progress: ${percentage}% • ${stage.completedSubgroups}/${stage.totalSubgroups} Subgroups`)}
          </div>
        </div>

        {/* Right Chevron Arrow matching Flutter */}
        {isClickable && <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />}
      </div>

      {/* Embedded Linear Progress Bar & XP breakdown */}
      <div className="pt-3 border-t border-slate-100 space-y-2">
        <div className="flex justify-between items-center type-caption text-slate-500 font-medium">
          <span>Current XP: <strong className="text-slate-900">{stage.currentXp}</strong> / {stage.expectedXp}</span>
          <span>Subgroups: <strong className="text-slate-900">{stage.completedSubgroups}/{stage.totalSubgroups}</strong></span>
        </div>

        <ProgressBar
          progress={percentage}
          barColor={isCompleted ? 'bg-emerald-500' : 'bg-indigo-600'}
          backgroundColor="bg-slate-100"
          heightClass="h-1.5"
        />
      </div>
    </div>
  );
};

export default StageCard;
