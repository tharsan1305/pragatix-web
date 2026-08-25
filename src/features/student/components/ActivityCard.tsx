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
      className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
        isCompleted
          ? 'bg-card border-border hover:border-emerald-300'
          : isLocked
          ? 'bg-bg border-border opacity-60'
          : 'bg-card border-border hover:border-accent/40 hover:shadow-sm'
      }`}
    >
      {/* Icon Box */}
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
          isCompleted
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : isLocked
            ? 'bg-bg text-text-muted border-border'
            : 'bg-accent-tint text-accent border-accent/20'
        }`}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
        ) : isLocked ? (
          <Lock className="w-5 h-5 stroke-[2]" />
        ) : (
          <Star className="w-5 h-5 stroke-[2]" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="font-bold type-body text-text-primary truncate">
          {activity.activityName}
        </div>
        {activity.description && (
          <p className="type-caption text-text-secondary line-clamp-1 mt-0.5 font-medium">
            {activity.description}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {isCompleted ? (
            <span className="type-fine font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              ✓ Completed • Earned {awardedXp} XP
            </span>
          ) : (
            <span className="type-fine font-bold px-2 py-0.5 rounded-md bg-accent-tint text-accent border border-accent/20 flex items-center gap-1">
              <Star className="w-3 h-3" />
              <span>Reward: {rewardXp} XP</span>
            </span>
          )}
        </div>
      </div>

      {/* Right Chevron */}
      <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center text-text-muted shrink-0 group-hover:text-accent transition-colors">
        <ChevronRight className="w-4 h-4" />
      </div>
    </div>
  );
};

export default ActivityCard;
