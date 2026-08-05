import React from 'react';
import type { Subgroup, Activity } from '../types/activity';
import { ActivityCard } from './ActivityCard';

interface CategorySectionProps {
  subgroup: Subgroup;
  onSelectActivity: (activity: Activity) => void;
}

export const CategorySection: React.FC<CategorySectionProps> = ({
  subgroup,
  onSelectActivity,
}) => {
  const toTitleCase = (str: string) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  const isPassed = subgroup.categoryXp >= subgroup.threshold && subgroup.threshold > 0;

  return (
    <div className="space-y-3">
      {/* Category Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-base font-bold text-slate-800">
          {toTitleCase(subgroup.name)}
        </h3>
        <div
          className={`px-3 py-1 rounded-full text-xs font-bold ${
            isPassed
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-blue-100 text-blue-700'
          }`}
        >
          {subgroup.categoryXp} / {subgroup.threshold} XP
        </div>
      </div>

      {/* Activity Cards List */}
      <div className="space-y-3">
        {subgroup.activities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onClick={onSelectActivity}
          />
        ))}
      </div>
    </div>
  );
};

export default CategorySection;
