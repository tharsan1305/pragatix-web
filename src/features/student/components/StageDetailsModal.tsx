import React from 'react';
import { X } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-900">{stage.name}</h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Stage Summary Gradient Header */}
          <StageHeader stage={stage} />

          {/* Subgroups & Activities List or Empty State */}
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

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition"
          >
            Close Stage Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default StageDetailsModal;
