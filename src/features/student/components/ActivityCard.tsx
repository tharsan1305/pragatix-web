import React from 'react';
import { CheckCircle2, Star, Lock, ChevronRight } from 'lucide-react';
import type { Activity } from '../types/activity';

interface ActivityCardProps {
  activity: Activity;
  onClick: (activity: Activity) => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onClick }) => {
  const isCompleted = activity.isCompleted || activity.status === 'COMPLETED';
  const isLocked = activity.status === 'LOCKED';
  const rewardXp = activity.rewardXp || 0;
  const awardedXp = (activity.awardedXp !== undefined && activity.awardedXp !== null) ? activity.awardedXp : 0;

  return (
    <div
      onClick={() => onClick(activity)}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
        isCompleted
          ? 'bg-emerald-50/40 border-emerald-200 hover:border-emerald-300'
          : isLocked
          ? 'bg-slate-50/60 border-slate-200 opacity-75'
          : 'bg-white border-slate-200 hover:border-indigo-300 shadow-sm hover:shadow-md'
      }`}
    >
      {/* Icon Circle */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isCompleted
            ? 'bg-emerald-100 text-emerald-600'
            : isLocked
            ? 'bg-slate-100 text-slate-500'
            : 'bg-blue-100 text-blue-600'
        }`}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
        ) : isLocked ? (
          <Lock className="w-5 h-5 stroke-[2.2]" />
        ) : (
          <Star className="w-5 h-5 stroke-[2.2]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-bold type-body-sm text-slate-800 truncate">
          {activity.activityName}
        </div>
        {activity.description && (
          <p className="type-caption text-slate-500 line-clamp-1 mt-0.5">
            {activity.description}
          </p>
        )}
        <div
          className={`type-caption mt-1 ${
            isCompleted ? 'text-emerald-700' : 'text-slate-500'
          }`}
        >
          {isCompleted
            ? `Completed • Earned ${awardedXp} XP`
            : `Reward: ${rewardXp} XP`}
        </div>
      </div>

      {/* Right Chevron */}
      <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
    </div>
  );
};

export default ActivityCard;
