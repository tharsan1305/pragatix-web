import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, RefreshCw, AlertCircle, X, PlusCircle, ListPlus, Star, User, Users, Folder, Repeat, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import { activityService } from '../api/activityService';
import type { ActivityModel, GroupedActivityModel, ActivityOptionModel } from '../types/ActivityTypes';
import ActivityCard from '../components/ActivityCard';

interface ActivityListPageProps {
  onBack?: () => void;
  subgroup?: any;
  subgroupId?: number;
  stageId?: number;
  subgroupName?: string;
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
  onPushView = () => {} 
}: ActivityListPageProps) {
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
      console.error('Failed to fetch activities:', err);
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
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to remove activity from stage');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteActivityTarget) return;
    const toastId = toast.loading("Deleting activity from system...");
    try {
      await activityService.deleteActivity(deleteActivityTarget.id);
      toast.dismiss(toastId);
      toast.success("Activity deleted from system successfully");
      setDeleteActivityTarget(null);
      fetchActivities();
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete activity from system');
    }
  };

  const handleOpenAddExisting = async () => {
    setIsAddOptionsModalOpen(false);
    setIsSelectExistingModalOpen(true);
    setIsFetchingGrouped(true);
    try {
      const data = await activityService.fetchGroupedActivities(effectiveSubgroupName);
      setGroupedActivities(data || []);
    } catch (err: any) {
      console.error('Error loading grouped activities:', err);
      toast.error(`Error loading activities: ${err.response?.data?.message || err.message}`);
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
      console.error(err);
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
    <div className="flex flex-col min-h-full bg-slate-50 relative">
      {/* Top Header */}
      <div className="bg-slate-900 px-6 pt-12 pb-6 flex items-center space-x-4 sticky top-0 z-10">
        <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-white">{cleanTitle} – Activities</h1>
        </div>
        <button onClick={fetchActivities} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 p-6 pb-24 max-w-4xl mx-auto w-full">
        <div className="mb-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">{cleanTitle}</h2>
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-red-50 text-red-700 border border-red-200 uppercase tracking-wide">
              {categoryLabel}
            </span>
          </div>
          <p className="text-sm text-slate-600 mt-2 font-medium">
            {activities.length} activities configured
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl mb-6 flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-200">
            <p className="text-lg font-medium text-slate-700 mb-2">No Activities Found</p>
            <p className="text-sm text-slate-500">Tap the Add Activity button to create one for this category.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {activities.map(activity => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                onEdit={() => onPushView('edit_activity', { activity, subgroupId: effectiveSubgroupId })}
                onUnmap={() => setUnmapActivityTarget(activity)}
                onDelete={() => setDeleteActivityTarget(activity)}
                onAssign={() => onPushView('assign_faculty', { activity, subgroupId: effectiveSubgroupId })}
                onTap={() => {}}
              />
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-20 right-6 z-20">
        <button
          onClick={() => setIsAddOptionsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[#EA4335] text-white px-5 py-3.5 rounded-2xl shadow-lg hover:bg-red-600 transition-all font-semibold active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Add Activity
        </button>
      </div>

      {/* Flutter Parity Modal 1: Remove Activity from Stage Dialog */}
      {unmapActivityTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Remove Activity</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong>'{unmapActivityTarget.name}'</strong> from this stage?
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button 
                onClick={() => setUnmapActivityTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleUnmapConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
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
            <h3 className="text-lg font-bold text-slate-900">Delete from System</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to completely delete <strong>'{deleteActivityTarget.name}'</strong> from the entire system? This is permanent.
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button 
                onClick={() => setDeleteActivityTarget(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
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
              <h3 className="text-lg font-bold text-slate-900">Add Activity</h3>
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
                  <h4 className="font-bold text-sm text-slate-900">Create New Activity</h4>
                  <p className="text-xs text-slate-500">Create a brand new activity for this stage</p>
                </div>
              </button>

              <button 
                onClick={handleOpenAddExisting}
                className="w-full p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center space-x-4 text-left transition-colors"
              >
                <ListPlus className="w-6 h-6 text-blue-600" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Add Existing Activity</h4>
                  <p className="text-xs text-slate-500">Select from activities already in the system</p>
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
                <h3 className="text-lg font-bold text-white">Select Existing Activity</h3>
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
                  <span className="text-sm font-medium">Loading activities...</span>
                </div>
              ) : filteredGroups.length === 0 ? (
                <div className="flex items-center justify-center py-16 px-6 text-center text-slate-500 text-base font-medium">
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
                          <span className="font-bold text-xs tracking-wider text-[#1E293B] uppercase">
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
                                <h4 className="font-bold text-base text-slate-900 group-hover:text-red-600 transition-colors line-clamp-2">
                                  {act.name}
                                </h4>
                                <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full shrink-0">
                                  +{act.awardXp} XP
                                </span>
                              </div>

                              {act.description && act.description.trim().length > 0 && (
                                <p className="text-xs text-slate-600 line-clamp-2">
                                  {act.description}
                                </p>
                              )}

                              <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
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
