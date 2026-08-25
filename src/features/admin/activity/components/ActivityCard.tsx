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
      className={`bg-card shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border rounded-lg mb-3.5 p-5 ${onTap ? 'cursor-pointer hover:border-accent/40 hover:shadow-md transition-all' : ''}`}
    >
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2.5">
        <h3 className="font-bold type-h5 text-text-primary flex-1 leading-snug">{activity.name}</h3>
        {!isReadOnly && (
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {onAssign && !isCc && (
              <button 
                onClick={(e) => { e.stopPropagation(); onAssign(); }}
                className="flex items-center gap-1.5 bg-card hover:bg-bg text-text-primary border border-border px-3 py-1.5 rounded-lg type-caption font-bold transition-colors cursor-pointer"
                title="Assign Faculty"
              >
                <UserPlus className="w-3.5 h-3.5 text-accent" />
                <span>Assign Faculty</span>
              </button>
            )}
            {onEdit && !isCc && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="flex items-center gap-1.5 bg-card hover:bg-bg text-text-secondary hover:text-text-primary border border-border px-3 py-1.5 rounded-lg type-caption font-bold transition-colors cursor-pointer"
                title="Edit Activity"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}
            {onUnmap && !isCc && (
              <button 
                onClick={(e) => { e.stopPropagation(); onUnmap(); }}
                className="p-1.5 text-text-secondary hover:text-accent hover:bg-accent-tint rounded-lg transition-colors border border-border cursor-pointer"
                title="Remove from Stage"
              >
                <MinusCircle className="w-4 h-4" />
              </button>
            )}
            {onDelete && !isCc && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="flex items-center gap-1.5 bg-card hover:bg-accent-tint text-text-secondary hover:text-accent border border-border rounded-lg px-3 py-1.5 type-caption font-bold transition-colors cursor-pointer"
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
        <p className="type-body-sm font-medium text-text-secondary mt-1">{activity.description}</p>
      )}

      <div className="h-px bg-border my-3.5" />

      {/* Feature & Value Badges */}
      <div className="flex flex-wrap gap-2 mb-3.5">
        {(activity.awardEnabled ?? true) && (
          <span className="type-fine font-bold px-2.5 py-1 rounded-md bg-success-tint text-success border border-success/20 uppercase flex items-center gap-1">
            Award: +{awardXp} XP
          </span>
        )}
        {activity.penaltyEnabled && (
          <span className="type-fine font-bold px-2.5 py-1 rounded-md bg-accent-tint text-accent border border-accent/20 uppercase flex items-center gap-1">
            Penalty: -{penaltyXp} XP
          </span>
        )}
        <span className="type-fine font-bold px-2.5 py-1 rounded-md bg-bg text-text-secondary border border-border uppercase">
          Cap: {capVal}
        </span>
        <span className="type-fine font-bold px-2.5 py-1 rounded-md bg-bg text-text-secondary border border-border uppercase">
          Freq: {freqVal}
        </span>
        <span className="type-fine font-bold px-2.5 py-1 rounded-md bg-bg text-text-secondary border border-border uppercase">
          Type: {typeVal}
        </span>
      </div>

      {/* Faculty Assignment List */}
      {uniqueAssignments.length === 0 ? (
        <div className="flex items-start gap-2 mb-2">
          <UserPlus className="w-4 h-4 text-text-muted mt-0.5 shrink-0" />
          <span className="type-caption text-text-muted font-medium">
            Department: {activity.ownerDepartment || "Unassigned"} (No assigned staff yet)
          </span>
        </div>
      ) : (
        <div className="mb-2">
          <div className="flex items-start gap-2 mb-1.5">
            <UserPlus className="w-4 h-4 text-accent mt-0.5 shrink-0" />
            <span className="type-caption text-text-primary font-bold">
              {activity.assignmentMode === 'GLOBAL'
                ? 'Assignment Mode: Global (All Departments)'
                : `Staff Assignments (${activity.ownerDepartment || 'Dept'}):`}
            </span>
          </div>
          <div className="pl-6 flex flex-wrap gap-2">
            {uniqueAssignments.map((text: string, idx: number) => (
              <span key={idx} className="type-fine font-semibold px-2.5 py-1 bg-bg border border-border rounded-md text-text-secondary">
                {text}
              </span>
            ))}
          </div>
        </div>
      )}

      {evidenceText && (
        <div className="flex items-start gap-2 mt-2 pt-2 border-t border-border">
          <BookOpen className="w-4 h-4 text-text-secondary mt-0.5 shrink-0" />
          <span className="type-caption text-text-secondary font-medium italic">
            Evidence: {evidenceText}
          </span>
        </div>
      )}
      
      {activity.justification && (
        <div className="flex items-start gap-2 mt-1.5">
          <div className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="type-caption text-text-muted italic">
            Justification: {activity.justification}
          </span>
        </div>
      )}
    </div>
  );
}
