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
      <div className="flex justify-between items-center px-1">
        <h3 className="type-h4 font-bold text-text-primary tracking-tight">
          {toTitleCase(subgroup.name)}
        </h3>
        <div
          className={`px-3 py-1 rounded-lg type-caption font-bold border ${
            isPassed
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-accent-tint text-accent border-accent/20'
          }`}
        >
          {subgroup.categoryXp} / {subgroup.threshold} XP
        </div>
      </div>

      {/* Activity Cards List */}
      <div className="space-y-2.5">
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
