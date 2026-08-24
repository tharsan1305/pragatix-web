import { useMemo } from 'react';
import { Pencil, Trash2, UserPlus, BookOpen, MinusCircle } from 'lucide-react';
import type { ActivityModel } from '../types/ActivityTypes';

interface ActivityCardProps {
  activity: ActivityModel;
  onEdit?: () => void;
  onDelete?: () => void;
  onUnmap?: () => void;
  onAssign?: () => void;
  onTap?: () => void;
  isCc?: boolean;
  isReadOnly?: boolean;
}

export default function ActivityCard({
  activity,
  onEdit,
  onDelete,
  onUnmap,
  onAssign,
  onTap,
  isCc = false,
  isReadOnly = false,
}: ActivityCardProps) {
  if (!activity) return null;

  const assignments = Array.isArray(activity.assignmentSummary) ? activity.assignmentSummary : [];
  
  // Deduplicate repeated assignments matching Flutter activity_card.dart (e.g. repeated 'Any Faculty')
  const uniqueAssignments = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const assign of assignments) {
      const secName = assign.section;
      const teachName = assign.teacher || assign.teacherName || 'Any Faculty';
      const text = secName 
        ? `Section ${secName} → ${teachName}`
        : `Assigned to → ${teachName}`;
      if (!seen.has(text)) {
        seen.add(text);
        result.push(text);
      }
    }
    return result;
  }, [assignments]);
  
  const evidenceText = Array.isArray(activity.evidence) 
    ? activity.evidence.join(', ') 
    : (typeof activity.evidence === 'string' ? activity.evidence : '');

  const awardXp = activity.awardXp ?? activity.awardPoints ?? activity.xpReward ?? 0;
  const penaltyXp = activity.penaltyXp ?? activity.penaltyPoints ?? 0;
  const capVal = activity.cap ?? activity.maxCap ?? 1;
  const freqVal = activity.awardFrequency ?? activity.frequency ?? 'Daily';
  const typeVal = activity.type ?? activity.activityType ?? 'Individual';

  return (
    <div 
      onClick={onTap}
      className={`bg-white shadow-sm border border-slate-200 rounded-2xl mb-4 p-5 ${onTap ? 'cursor-pointer hover:border-slate-300 transition-colors' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2.5">
        <h3 className="font-bold type-h5 text-slate-800 flex-1 leading-snug">{activity.name}</h3>
        {!isReadOnly && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {onAssign && !isCc && (
              <button 
                onClick={(e) => { e.stopPropagation(); onAssign(); }}
                className="flex items-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl type-caption font-bold transition-colors shadow-xs cursor-pointer"
                title="Assign Faculty"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Assign Faculty</span>
              </button>
            )}
            {onEdit && !isCc && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="flex items-center gap-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl type-caption font-bold transition-colors shadow-xs cursor-pointer"
                title="Edit Activity"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            {onUnmap && !isCc && (
              <button 
                onClick={(e) => { e.stopPropagation(); onUnmap(); }}
                className="p-1 sm:p-1.5 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors border border-amber-200 cursor-pointer"
                title="Remove from Stage"
              >
                <MinusCircle className="w-4 h-4" />
              </button>
            )}
            {onDelete && !isCc && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="flex items-center gap-1 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl type-caption font-bold transition-colors shadow-xs cursor-pointer"
                title="Delete Activity"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </div>

      {activity.description && (
        <p className="text-[13px] text-gray-600 mt-1">{activity.description}</p>
      )}

      <div className="h-px bg-slate-100 my-3.5" />

      <div className="flex flex-wrap gap-2 mb-3.5">
        {(activity.awardEnabled ?? true) && (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-green-100 text-green-800 uppercase">
            Award: {awardXp}
          </span>
        )}
        {activity.penaltyEnabled && (
          <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 uppercase">
            Penalty: {penaltyXp}
          </span>
        )}
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 uppercase">
          Cap: {capVal}
        </span>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
          Freq: {freqVal}
        </span>
        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">
          Type: {typeVal}
        </span>
      </div>

      {uniqueAssignments.length === 0 ? (
        <div className="flex items-start gap-2 mb-2">
          <UserPlus className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <span className="type-caption text-gray-700 font-medium">
            Department: {activity.ownerDepartment || "Unassigned"} (No assignments yet)
          </span>
        </div>
      ) : (
        <div className="mb-2">
          <div className="flex items-start gap-2 mb-1">
            <UserPlus className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <span className="type-caption text-gray-800 font-bold">
              {activity.assignmentMode === 'GLOBAL'
                ? 'Assignment Mode: Global (All Departments)'
                : `Assignments (${activity.ownerDepartment || 'Dept'}):`}
            </span>
          </div>
          <div className="pl-6 flex flex-col gap-1">
            {uniqueAssignments.map((text: string, idx: number) => (
              <span key={idx} className="type-caption text-gray-600">
                • {text}
              </span>
            ))}
          </div>
        </div>
      )}

      {evidenceText && (
        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-slate-50">
          <BookOpen className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
          <span className="type-caption text-gray-600 italic">
            Evidence: {evidenceText}
          </span>
        </div>
      )}
      
      {activity.justification && (
        <div className="flex items-start gap-2 mt-1.5">
          <div className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="type-caption text-gray-500 italic">
            Justification: {activity.justification}
          </span>
        </div>
      )}
    </div>
  );
}
