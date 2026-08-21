import React from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Stage, Activity } from '../types/activity';
import { StageHeader } from './StageHeader';
import { CategorySection } from './CategorySection';
import { EmptyState } from './EmptyState';

interface StageDetailsModalProps {
  stage: Stage | null;
  onClose: () => void;
  onSelectActivity: (activity: Activity) => void;
}

export const StageDetailsModal: React.FC<StageDetailsModalProps> = ({
  stage,
  onClose,
  onSelectActivity,
}) => {
  if (!stage) return null;

  const validSubgroups = stage.subgroups.filter(
    (s) => s.activities && s.activities.length > 0
  );

  const isLocked = stage.stageStatus === 'LOCKED' || stage.isLocked;

  return (
    <div className="fixed inset-0 bg-slate-50 z-[90] flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
      {/* Top App Bar Header */}
      <div className="bg-white px-6 py-4 sticky top-0 z-10 flex items-center gap-4 border-b border-slate-100 shadow-sm">
        <button
          onClick={onClose}
          className="p-2 -ml-2 text-slate-900 hover:bg-slate-100 rounded-full transition"
          title="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-heading text-xl font-bold text-slate-900">{stage.name}</h1>
      </div>

      {/* Main Body */}
      <div className="p-5 max-w-xl mx-auto w-full space-y-6 flex-1 pb-20">
        {/* Stage Summary Gradient Card */}
        <StageHeader stage={stage} />

        {/* Subgroups & Activities */}
        {validSubgroups.length === 0 ? (
          <EmptyState message="No activities available for this stage yet." />
        ) : (
          <div className="space-y-6">
            {validSubgroups.map((subgroup) => (
              <CategorySection
                key={subgroup.id}
                subgroup={subgroup}
                onSelectActivity={onSelectActivity}
              />
            ))}
          </div>
        )}
      </div>

      {/* Locked Bottom Snackbar / Banner */}
      {isLocked && (
        <div className="fixed bottom-0 inset-x-0 bg-slate-800 text-white py-3.5 px-6 text-center text-xs font-bold shadow-lg z-20">
          This stage is currently locked.
        </div>
      )}
    </div>
  );
};

export default StageDetailsModal;
