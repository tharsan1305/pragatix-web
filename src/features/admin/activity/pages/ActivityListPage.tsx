import { logger } from '../../../../utils/logger';
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, RefreshCw, AlertCircle, X, PlusCircle, ListPlus, Star, User, Users, Folder, Repeat, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { activityService } from '../api/activityService';
import type { ActivityModel, GroupedActivityModel, ActivityOptionModel } from '../types/ActivityTypes';
import ActivityCard from '../components/ActivityCard';
import { useAuth } from '../../../../store/authContext';

interface ActivityListPageProps {
  onBack?: () => void;
  subgroup?: any;
  subgroupId?: number;
  stageId?: number;
  subgroupName?: string;
  academicYear?: string;
  onPushView?: (name: string, props?: any) => void;
}

const toTitleCase = (text: string) => {
  if (!text) return text;
  return text
    .split(/\s+/)
    .map(word => (word ? word[0].toUpperCase() + word.slice(1).toLowerCase() : ''))
    .join(' ');
};

const getSubgroupIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes('must')) return Star;
  if (lower.includes('individual')) return User;
  if (lower.includes('group')) return Users;
  return Folder;
};

export default function ActivityListPage({ 
  onBack = () => {}, 
  subgroup, 
  subgroupId: directSubgroupId,
  stageId: directStageId,
  subgroupName: directSubgroupName,
  academicYear: directAcademicYear,
  onPushView = () => {} 
}: ActivityListPageProps) {
  const { isCC: isCc, isAdmin } = useAuth();
  const canAssign = isAdmin || isCc;

  const [activities, setActivities] = useState<ActivityModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal States matching Flutter
  const [unmapActivityTarget, setUnmapActivityTarget] = useState<ActivityModel | null>(null);
  const [deleteActivityTarget, setDeleteActivityTarget] = useState<ActivityModel | null>(null);
  const [isAddOptionsModalOpen, setIsAddOptionsModalOpen] = useState(false);
  const [isSelectExistingModalOpen, setIsSelectExistingModalOpen] = useState(false);
  const [isFetchingGrouped, setIsFetchingGrouped] = useState(false);
  const [groupedActivities, setGroupedActivities] = useState<GroupedActivityModel[]>([]);

  // Secure parameter resolution
  const effectiveSubgroupId = directSubgroupId ?? subgroup?.id ?? subgroup?.subgroupId ?? null;
  const effectiveStageId = directStageId ?? subgroup?.stageId ?? null;
  const effectiveSubgroupName = directSubgroupName ?? subgroup?.name ?? subgroup?.subgroupName ?? 'Must';
  const effectiveAcademicYear = directAcademicYear ?? subgroup?.academicYear ?? '1st Year';

  const fetchActivities = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await activityService.fetchActivities(
        effectiveSubgroupId ? Number(effectiveSubgroupId) : undefined,
        effectiveStageId ? Number(effectiveStageId) : undefined,
        effectiveSubgroupName
      );
      setActivities(data || []);
    } catch (err: any) {
      logger.error('Failed to fetch activities:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load activities for this category.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveSubgroupId, effectiveStageId, effectiveSubgroupName]);

  const handleUnmapConfirm = async () => {
    if (!unmapActivityTarget || !effectiveStageId) return;
    const toastId = toast.loading("Removing activity from stage...");
    try {
      await activityService.unmapActivityFromStage(Number(effectiveStageId), unmapActivityTarget.id);
      toast.dismiss(toastId);
      toast.success("Activity removed from stage successfully");
      setUnmapActivityTarget(null);
      fetchActivities();
    } catch (err: any) {
      toast.dismiss(toastId);
      logger.error(err);
      toast.error(err.response?.data?.message || 'Failed to remove activity from stage');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteActivityTarget) return;
    const toastId = toast.loading("Deleting activity from system...");
    try {
      await activityService.deleteActivity(deleteActivityTarget.id, true);
      toast.dismiss(toastId);
      toast.success("Activity deleted from system successfully");
      setDeleteActivityTarget(null);
      fetchActivities();
    } catch (err: any) {
      toast.dismiss(toastId);
      logger.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete activity from system');
    }
  };

  const handleOpenAddExisting = async () => {
    setIsAddOptionsModalOpen(false);
    setIsSelectExistingModalOpen(true);
    setIsFetchingGrouped(true);
    try {
      const data = await activityService.fetchGroupedActivities(
        effectiveSubgroupName,
        effectiveStageId ? Number(effectiveStageId) : undefined,
        effectiveSubgroupId ? Number(effectiveSubgroupId) : undefined
      );
      setGroupedActivities(data || []);
    } catch (err: any) {
      logger.error('Error loading grouped activities:', err);
      setGroupedActivities([]);
    } finally {
      setIsFetchingGrouped(false);
    }
  };

  const handleSelectExistingActivity = async (act: ActivityOptionModel) => {
    setIsSelectExistingModalOpen(false);
    if (!effectiveStageId) {
      toast.error("Stage ID is missing.");
      return;
    }
    const toastId = toast.loading("Mapping activity to stage...");
    try {
      await activityService.mapActivityToStage(
        Number(effectiveStageId),
        act.id,
        effectiveSubgroupName
      );
      toast.dismiss(toastId);
      toast.success("Activity mapped successfully");
      fetchActivities();
    } catch (err: any) {
      toast.dismiss(toastId);
      logger.error(err);
      toast.error(err.response?.data?.message || err.message || "Failed to map activity to stage");
    }
  };

  const getCleanName = (fullName: string) => {
    if (!fullName) return 'Activities';
    const lower = fullName.toLowerCase();
    if (lower.endsWith(' (must)')) return fullName.substring(0, fullName.length - 7);
    if (lower.endsWith(' (individual)')) return fullName.substring(0, fullName.length - 13);
    if (lower.endsWith(' (group)')) return fullName.substring(0, fullName.length - 8);
    return fullName;
  };

  const cleanTitle = getCleanName(effectiveSubgroupName);
  const categoryLabel = (subgroup?.category || effectiveSubgroupName || 'MUST').toUpperCase();

  // Filter out already mapped activities by case-insensitive name comparison
  const existingNames = new Set(activities.map(a => (a.name || '').toLowerCase()));
  const filteredGroups = groupedActivities
    .map(g => ({
      subgroup: g.subgroup,
      activities: (g.activities || []).filter(a => !existingNames.has((a.name || '').toLowerCase()))
    }))
    .filter(g => g.activities.length > 0);

  return (
    <div className="flex flex-col min-h-full bg-bg text-text-primary relative overflow-x-hidden">
      {/* Top Header Bar */}
      <div className="bg-card text-text-primary px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3.5 min-w-0">
          <button 
            onClick={onBack} 
            className="px-3.5 py-2 bg-card border border-border rounded-lg text-text-primary hover:bg-bg transition-colors cursor-pointer flex items-center gap-2 font-bold type-caption shrink-0"
            title="Back to Stage"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Stage</span>
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="type-h4 font-bold text-text-primary truncate">{cleanTitle} – Activities</h1>
              <span className="px-2.5 py-0.5 rounded-md type-fine font-bold uppercase bg-bg text-text-secondary border border-border">
                {categoryLabel}
              </span>
            </div>
            <p className="type-caption text-text-secondary font-medium mt-0.5">
              {activities.length} activities configured in this category
            </p>
          </div>
        </div>

        <button 
          onClick={fetchActivities} 
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-accent' : ''}`} />
          <span className="type-caption font-bold hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="flex-1 px-4 sm:px-6 py-6 pb-28 max-w-6xl mx-auto w-full space-y-6">
        {error && (
          <div className="bg-accent-tint border border-accent/20 text-accent p-4 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="type-body-sm font-medium">{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-lg border border-border space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-accent" />
            <p className="type-body-sm text-text-secondary font-medium">Loading activities list...</p>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16 text-text-secondary bg-card rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-8 space-y-3 flex flex-col items-center">
            <div className="w-12 h-12 rounded-lg bg-bg border border-border flex items-center justify-center text-text-muted">
              <Folder className="w-6 h-6" />
            </div>
            <h3 className="type-h5 font-bold text-text-primary">No Activities Found</h3>
            <p className="type-body-sm text-text-secondary max-w-sm">
              Click the Add Activity button below to create or map an activity for this category.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activities.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                isReadOnly={!canAssign}
                isCc={isCc}
                onEdit={isAdmin ? () => onPushView('edit_activity', { activity, activityId: activity.id, subgroupId: effectiveSubgroupId }) : undefined}
                onUnmap={isAdmin ? () => setUnmapActivityTarget(activity) : undefined}
                onDelete={isAdmin ? () => setDeleteActivityTarget(activity) : undefined}
                onAssign={canAssign ? () => onPushView('assign_faculty', { activity, activityId: activity.id, subgroupId: effectiveSubgroupId, stageId: effectiveStageId }) : undefined}
                onTap={() => {
                  const type = (activity.type || 'individual').toLowerCase();
                  if (type.includes('group')) {
                    onPushView('group_activity_year', { activityId: activity.id, stageId: effectiveStageId });
                  } else {
                    onPushView('teacher_workflow', { activity, stageId: effectiveStageId, subgroupName: effectiveSubgroupName, academicYear: effectiveAcademicYear || (activity as any)?.academicYear });
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button (Admin Only matching Flutter 1:1) */}
      {isAdmin && (
        <div className="fixed bottom-20 right-6 z-20">
          <button
            onClick={() => setIsAddOptionsModalOpen(true)}
            className="flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover text-card px-5 py-3.5 rounded-lg shadow-lg transition-all font-bold cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>Add Activity</span>
          </button>
        </div>
      )}

      {/* Flutter Parity Modal 1: Remove Activity from Stage Dialog */}
      {unmapActivityTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="type-h4 text-slate-900">Remove Activity</h3>
            <p className="type-body-sm text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong>'{unmapActivityTarget.name}'</strong> from this stage?
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button 
                onClick={() => setUnmapActivityTarget(null)}
                className="px-4 py-2 type-caption font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleUnmapConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white type-caption font-bold rounded-xl shadow-md transition-colors"
              >
                Remove from Stage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flutter Parity Modal 2: Delete from System Dialog */}
      {deleteActivityTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="type-h4 text-slate-900">Delete from System</h3>
            <p className="type-body-sm text-slate-600 leading-relaxed">
              Are you sure you want to completely delete <strong>'{deleteActivityTarget.name}'</strong> from the entire system? This is permanent.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button 
                onClick={() => setDeleteActivityTarget(null)}
                className="px-4 py-2 type-caption font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white type-caption font-bold rounded-xl shadow-md transition-colors"
              >
                Delete Everywhere
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flutter Parity Modal 3: Add Activity Options Sheet */}
      {isAddOptionsModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in slide-in-from-bottom">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="type-h4 text-slate-900">Add Activity</h3>
              <button onClick={() => setIsAddOptionsModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setIsAddOptionsModalOpen(false);
                  onPushView('create_activity', { subgroupId: effectiveSubgroupId, stageId: effectiveStageId, subgroupName: effectiveSubgroupName });
                }}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center space-x-4 text-left transition-colors"
              >
                <PlusCircle className="w-6 h-6 text-[#EA4335]" />
                <div>
                  <h4 className="font-bold type-body-sm text-slate-900">Create New Activity</h4>
                  <p className="type-caption text-slate-500">Create a brand new activity for this stage</p>
                </div>
              </button>

              <button 
                onClick={handleOpenAddExisting}
                className="w-full p-4 type-btn bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center space-x-4 text-left transition-colors"
              >
                <ListPlus className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="font-bold type-body-sm text-slate-900">Add Existing Activity</h4>
                  <p className="type-caption text-slate-500">Select from activities already in the system</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Flutter Parity Modal 4: Select Existing Activity Modal (GroupedActivitySelectionDialog) */}
      {isSelectExistingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl max-h-[80vh]">
            {/* Header matching Flutter GroupedActivitySelectionDialog */}
            <div className="bg-[#1E293B] px-5 py-4 flex items-center justify-between text-white border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <ListPlus className="w-5 h-5 text-white" />
                <h3 className="type-h4 text-white">Select Existing Activity</h3>
              </div>
              <button 
                onClick={() => setIsSelectExistingModalOpen(false)} 
                className="p-1 text-white hover:bg-slate-800 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto">
              {isFetchingGrouped ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                  <RefreshCw className="w-8 h-8 animate-spin text-[#EA4335] mb-2" />
                  <span className="type-body-sm font-medium">Loading activities...</span>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="flex items-center justify-center py-16 px-6 text-center text-slate-500 type-body font-medium">
                  No available activities found.
                </div>
              ) : (
                <div className="py-2">
                  {filteredGroups.map((group, groupIdx) => {
                    const IconComponent = getSubgroupIcon(group.subgroup);
                    const sectionTitle = `${toTitleCase(group.subgroup).toUpperCase()} ACTIVITIES`;

                    return (
                      <div key={groupIdx} className="mb-2">
                        {/* Section Header */}
                        <div className="bg-slate-100 px-4 py-2.5 mt-2 mb-1 flex items-center space-x-2 border-y border-slate-200/60">
                          <IconComponent className="w-4 h-4 text-[#EA4335]" />
                          <span className="font-bold type-caption tracking-wider text-[#1E293B] uppercase">
                            {sectionTitle}
                          </span>
                        </div>

                        {/* Activities List */}
                        {group.activities.map((act, actIdx) => (
                          <div key={act.id}>
                            <button
                              type="button"
                              onClick={() => handleSelectExistingActivity(act)}
                              className="w-full text-left p-4 hover:bg-slate-50 transition-colors flex flex-col space-y-2 group"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <h4 className="font-bold type-h4 text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2">
                                  {act.name}
                                </h4>
                                <span className="px-2.5 py-0.5 type-caption font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full shrink-0">
                                  +{act.awardXp} XP
                                </span>
                              </div>

                              {act.description && act.description.trim().length > 0 && (
                                <p className="type-caption text-slate-600 line-clamp-2">
                                  {act.description}
                                </p>
                              )}

                              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 type-caption text-slate-600 pt-1">
                                <span className="flex items-center font-medium">
                                  <Repeat className="w-3.5 h-3.5 text-slate-400 mr-1" />
                                  {act.awardFrequency}
                                </span>
                                <span className="flex items-center font-medium">
                                  <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
                                  {act.type}
                                </span>
                              </div>
                            </button>

                            {actIdx < group.activities.length - 1 && (
                              <div className="border-t border-slate-100 mx-4" />
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
