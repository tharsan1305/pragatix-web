import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, RefreshCw, X, Star, User, Users, ChevronRight, ChevronDown, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import ConfirmationModal from '../../../components/common/ConfirmationModal';
import ActivityCard from '../activity/components/ActivityCard';
import { activityService } from '../activity/api/activityService';
import type { ActivityModel } from '../activity/types/ActivityTypes';

interface Props {
  stageId: number;
  stageName: string;
  stageDescription?: string;
  teachersList?: any[];
  isTeacherView?: boolean;
  isCcAssignMode?: boolean;
  onBack: () => void;
  onPushView?: (name: string, props?: any) => void;
}

export default function StageDetailsPage({ 
  stageId, 
  stageName, 
  stageDescription = '', 
  isTeacherView = false,
  isCcAssignMode = false,
  onBack,
  onPushView = () => {} 
}: Props) {
  const [subgroups, setSubgroups] = useState<any[]>([]);
  const [stageDetails, setStageDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubgroup, setEditingSubgroup] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'individual',
    threshold: '150'
  });



  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ open: boolean; subId: number | null; subName: string }>({
    open: false,
    subId: null,
    subName: ''
  });

  const [expandedSubgroups, setExpandedSubgroups] = useState<Record<number, boolean>>({});
  const [subgroupActivities, setSubgroupActivities] = useState<Record<number, ActivityModel[]>>({});
  const [subgroupLoading, setSubgroupLoading] = useState<Record<number, boolean>>({});
  const [deleteActivityTarget, setDeleteActivityTarget] = useState<ActivityModel | null>(null);
  const [unmapActivityTarget, setUnmapActivityTarget] = useState<ActivityModel | null>(null);

  const toggleSubgroupExpand = async (sub: any) => {
    const subId = sub.id || 1;
    const isCurrentlyExpanded = !!expandedSubgroups[subId];
    
    setExpandedSubgroups(prev => ({ ...prev, [subId]: !isCurrentlyExpanded }));

    if (!isCurrentlyExpanded && !subgroupActivities[subId]) {
      setSubgroupLoading(prev => ({ ...prev, [subId]: true }));
      try {
        const acts = await activityService.fetchActivities(subId, stageId, sub.name);
        setSubgroupActivities(prev => ({ ...prev, [subId]: acts || [] }));
      } catch (err) {
        logger.error("Failed to load subgroup activities:", err);
      } finally {
        setSubgroupLoading(prev => ({ ...prev, [subId]: false }));
      }
    }
  };

  const handleUnmapConfirm = async () => {
    if (!unmapActivityTarget || !stageId) return;
    const toastId = toast.loading("Removing activity from stage...");
    try {
      await activityService.unmapActivityFromStage(Number(stageId), unmapActivityTarget.id);
      toast.dismiss(toastId);
      toast.success("Activity removed from stage successfully");
      setUnmapActivityTarget(null);
      fetchSubgroups();
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
      fetchSubgroups();
    } catch (err: any) {
      toast.dismiss(toastId);
      logger.error(err);
      toast.error(err.response?.data?.message || 'Failed to delete activity from system');
    }
  };

  const openModal = (sub: any = null) => {
    setEditingSubgroup(sub);
    if (sub) {
      setFormData({
        name: sub.name || '',
        category: (sub.category || 'individual').toLowerCase(),
        threshold: sub.threshold?.toString() || '0'
      });
    } else {
      setFormData({
        name: '',
        category: 'individual',
        threshold: '150'
      });
    }
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchSubgroups();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageId]);

  const fetchSubgroups = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let response;
      if (isTeacherView) {
        try {
          response = await apiClient.get('/api/v1/cc/activities/stages');
        } catch {
          try {
            response = await apiClient.get('/api/v1/cc/stages');
          } catch {
            response = await apiClient.get('/api/v1/admin/stages');
          }
        }
      } else {
        response = await apiClient.get('/api/v1/admin/stages');
      }
      const fetchedData = response.data?.data || response.data;
      if (Array.isArray(fetchedData)) {
        const stages = fetchedData;
        const currentStage = stages.find((s: any) => 
          String(s.id) === String(stageId) || 
          Number(s.id) === Number(stageId) || 
          (stageName && String(s.name || '').toLowerCase() === String(stageName).toLowerCase())
        );

        if (currentStage) {
          setStageDetails(currentStage);
          
          const mustTh = currentStage.mustThreshold ?? 150;
          const indTh = currentStage.individualThreshold ?? 150;
          const grpTh = currentStage.groupThreshold ?? 150;

          const existingSubs = currentStage.subgroups as any[] || [];
          if (existingSubs.length > 0) {
            const seenNames = new Set<string>();
            const parsedSubs: any[] = [];
            for (const s of existingSubs) {
              const name = s.name || s.subgroupName || '';
              if (name && !seenNames.has(name.toLowerCase())) {
                seenNames.add(name.toLowerCase());
                parsedSubs.push({
                  id: s.id,
                  name: name,
                  threshold: s.threshold || 0,
                  category: s.category || name.toLowerCase()
                });
              }
            }
            setSubgroups(parsedSubs.length > 0 ? parsedSubs : [
              { id: 1, name: 'Must', threshold: mustTh, category: 'must' },
              { id: 2, name: 'Individual', threshold: indTh, category: 'individual' },
              { id: 3, name: 'Group', threshold: grpTh, category: 'group' }
            ]);
          } else {
            setSubgroups([
              { id: 1, name: 'Must', threshold: mustTh, category: 'must' },
              { id: 2, name: 'Individual', threshold: indTh, category: 'individual' },
              { id: 3, name: 'Group', threshold: grpTh, category: 'group' }
            ]);
          }
        } else if (stages.length > 0) {
          const fallbackStage = stages[0];
          setStageDetails(fallbackStage);
          setSubgroups([
            { id: 1, name: 'Must', threshold: fallbackStage.mustThreshold ?? 150, category: 'must' },
            { id: 2, name: 'Individual', threshold: fallbackStage.individualThreshold ?? 150, category: 'individual' },
            { id: 3, name: 'Group', threshold: fallbackStage.groupThreshold ?? 150, category: 'group' }
          ]);
        } else {
          setError(`Stage with ID ${stageId} not found.`);
        }
      }
    } catch (e: any) {
      logger.error('Failed to fetch stage details:', e);
      setSubgroups([
        { id: 1, name: 'Must', threshold: 150, category: 'must' },
        { id: 2, name: 'Individual', threshold: 150, category: 'individual' },
        { id: 3, name: 'Group', threshold: 150, category: 'group' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Subgroup Name is required');
      return;
    }

    const toastId = toast.loading("Saving subgroup...");
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        threshold: parseInt(formData.threshold) || 0
      };

      if (editingSubgroup && editingSubgroup.id > 10) {
        await apiClient.put(`/api/v1/admin/stages/${stageId}/subgroups/${editingSubgroup.id}`, payload);
      } else {
        await apiClient.post(`/api/v1/admin/stages/${stageId}/subgroups`, payload);
      }
      
      toast.dismiss(toastId);
      toast.success("Subgroup saved successfully!");
      setIsModalOpen(false);
      fetchSubgroups();
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error(e);
      toast.error(e.response?.data?.message || 'Failed to save subgroup');
    }
  };

  const confirmDeleteSubgroup = async () => {
    const { subId } = deleteConfirmModal;
    if (!subId) return;

    setDeleteConfirmModal({ open: false, subId: null, subName: '' });
    const toastId = toast.loading("Deleting subgroup...");
    try {
      if (subId > 10) {
        await apiClient.delete(`/api/v1/admin/stages/${stageId}/subgroups/${subId}`);
      }
      toast.dismiss(toastId);
      toast.success("Subgroup deleted successfully!");
      fetchSubgroups();
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error(e);
      toast.error(e.response?.data?.message || 'Failed to delete subgroup');
    }
  };



  const displayName = stageDetails?.name || stageName;
  const displayDesc = stageDetails?.description || stageDescription;
  const mustXP = stageDetails?.mustThreshold ?? 150;
  const individualXP = stageDetails?.individualThreshold ?? 150;
  const groupXP = stageDetails?.groupThreshold ?? 150;

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      {/* Top Bar */}
      <div className="bg-slate-900 px-6 pt-12 pb-6 flex items-center space-x-4">
        <button onClick={onBack} className="p-2 type-btn bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <h1 className="type-h3 text-white">{displayName}</h1>
        </div>
        <button onClick={fetchSubgroups} className="p-2 type-btn bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
        {/* Stage Overview & Threshold Card */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5">
          <div>
            <h2 className="type-h3 text-slate-900">{displayName}</h2>
            <p className="type-body-sm text-slate-500 mt-1">{displayDesc || 'Stage configuration & thresholds'}</p>
          </div>

          <div className="h-px bg-slate-100" />

          <div>
            <h3 className="type-h5 text-slate-700 mb-3">
              Stage Progression Thresholds
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="bg-rose-50/70 border border-rose-100 rounded-2xl p-4 flex items-center space-x-3">
                <div className="p-2 bg-rose-500 text-white rounded-xl">
                  <Star className="w-5 h-5 fill-white" />
                </div>
                <div>
                  <p className="type-caption font-bold text-rose-600">Must</p>
                  <p className="type-h4 text-slate-900">{mustXP} XP</p>
                </div>
              </div>

              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 flex items-center space-x-3">
                <div className="p-2 bg-blue-500 text-white rounded-xl">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <p className="type-caption font-bold text-blue-600">Individual</p>
                  <p className="type-h4 text-slate-900">{individualXP} XP</p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 flex items-center space-x-3">
              <div className="p-2 bg-emerald-500 text-white rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="type-caption font-bold text-emerald-600">Group</p>
                <p className="type-h4 text-slate-900">{groupXP} XP</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-2xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="type-body-sm font-medium">{error}</span>
          </div>
        )}

        {/* Activity Categories / Subgroups Roster */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="type-h4 text-slate-900">Activity Categories</h3>
            {!isTeacherView && (
              <button 
                onClick={() => openModal()}
                className="flex items-center space-x-1.5 bg-[#EA4335] hover:bg-red-600 text-white px-3.5 py-2 rounded-xl type-caption font-bold shadow-sm transition-transform active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subgroup</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="space-y-3">
              {subgroups.map((sub, idx) => {
                const subId = sub.id || (idx + 1);
                const subName = sub.name || `Subgroup ${idx + 1}`;
                const catLower = (sub.category || subName || '').toLowerCase();
                const IconComponent = catLower.includes('must') ? Star : (catLower.includes('group') ? Users : User);
                const isExpanded = !!expandedSubgroups[subId];
                const acts = subgroupActivities[subId] || [];
                const isActLoading = !!subgroupLoading[subId];

                return (
                  <div key={subId} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden transition-all">
                    {/* Subgroup Header Card - ONLY displays subgroup info & chevron (NO Assign/Edit/Delete on card!) */}
                    <div 
                      onClick={() => toggleSubgroupExpand(sub)}
                      className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-700">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold type-h4 text-slate-900">{subName}</h4>
                          <p className="type-caption text-slate-500 mt-0.5 font-medium">
                            Threshold: {sub.threshold || 150} XP
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onPushView('activity_list', { 
                              subgroup: sub, 
                              subgroupId: subId, 
                              stageId: stageId, 
                              subgroupName: subName 
                            });
                          }}
                          className="type-caption font-bold px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full transition-colors"
                        >
                          View Full List
                        </button>
                        <div className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg">
                          {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-600" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                        </div>
                      </div>
                    </div>

                    {/* Expanded Content: Activities belonging to this Subgroup */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
                        {isActLoading ? (
                          <div className="flex justify-center py-6">
                            <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
                          </div>
                        ) : acts.length === 0 ? (
                          <div className="text-center py-6 text-slate-500 type-body-sm">
                            <p className="font-medium text-slate-700 mb-1">No activities in this category yet.</p>
                            {!isTeacherView && (
                              <button
                                onClick={() => onPushView('create_activity', { subgroupId: subId, stageId, subgroupName: subName })}
                                className="type-caption font-bold text-blue-600 hover:underline mt-1 inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add First Activity
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex justify-between items-center px-1 mb-2">
                              <span className="type-caption font-bold uppercase tracking-wider text-slate-500">Activities in {subName}</span>
                              {!isTeacherView && (
                                <button
                                  onClick={() => onPushView('create_activity', { subgroupId: subId, stageId, subgroupName: subName })}
                                  className="flex items-center gap-1 bg-[#EA4335] text-white hover:bg-red-600 px-3 py-1 rounded-lg type-caption font-bold transition-colors cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Activity
                                </button>
                              )}
                            </div>
                            {acts.map((activity) => (
                              <ActivityCard
                                key={activity.id}
                                activity={activity}
                                isReadOnly={false}
                                isCc={isTeacherView && !isCcAssignMode}
                                onTap={isTeacherView && !isCcAssignMode ? () => onPushView('teacher_workflow', { activity, stageId, stageName: displayName, academicYear: stageDetails?.academicYear || (activity as any)?.academicYear }) : undefined}
                                onEdit={!isTeacherView ? () => onPushView('edit_activity', { activity, subgroupId: subId }) : undefined}
                                onDelete={!isTeacherView ? () => setDeleteActivityTarget(activity) : undefined}
                                onUnmap={!isTeacherView ? () => setUnmapActivityTarget(activity) : undefined}
                                onAssign={() => onPushView('assign_faculty', { activity, activityId: activity.id, subgroupId: subId, stageId, isCcProp: isTeacherView })}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Subgroup Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden flex flex-col shadow-2xl">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="type-h4 text-slate-800">
                {editingSubgroup ? 'Edit Subgroup' : 'Add New Subgroup'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="type-form-label text-slate-700">Subgroup Name *</label>
                <input 
                  required 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Must, Individual, Group"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none type-body-sm" 
                />
              </div>
              <div className="space-y-1">
                <label className="type-form-label text-slate-700">Category Type *</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white type-body-sm"
                >
                  <option value="must">Must-Do Activity (must)</option>
                  <option value="individual">Individual Activity (individual)</option>
                  <option value="group">Group Activity (group)</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="type-form-label text-slate-700">Threshold (XP) *</label>
                <input 
                  required 
                  type="number" 
                  value={formData.threshold} 
                  onChange={e => setFormData({...formData, threshold: e.target.value})} 
                  placeholder="e.g. 150"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none type-body-sm" 
                />
              </div>
              
              <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 type-btn text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 text-white type-btn rounded-xl hover:bg-blue-700 shadow-md cursor-pointer">
                  {editingSubgroup ? 'Update' : 'Save Subgroup'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Delete Subgroup Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmModal.open}
        title="Delete Subgroup"
        description={`Are you sure you want to delete "${deleteConfirmModal.subName}" and all associated tasks? This action cannot be undone.`}
        confirmText="Delete Subgroup"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmDeleteSubgroup}
        onCancel={() => setDeleteConfirmModal({ open: false, subId: null, subName: '' })}
      />

      {/* Remove Activity from Stage Dialog */}
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

      {/* Delete Activity from System Dialog */}
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
    </div>
  );
}
