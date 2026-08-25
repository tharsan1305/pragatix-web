import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Edit2, Trash2, ChevronRight, ListFilter, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

interface Props {
  onPushView?: (name: string, props?: any) => void;
  initialYear?: string;
  onBackToYearSelection?: () => void;
}

export default function ActivityTab({ onPushView = () => {}, initialYear = 'FIRST_YEAR', onBackToYearSelection }: Props) {
  const [academicYear, _setAcademicYear] = useState(initialYear);
  const [stages, setStages] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ open: boolean; stageId: number | null; stageName: string }>({
    open: false,
    stageId: null,
    stageName: ''
  });

  useEffect(() => {
    fetchTeachers();
    fetchStages(academicYear);
  }, [academicYear]);

  const fetchTeachers = async () => {
    try {
      const response = await apiClient.get('/api/v1/admin/users');
      if (response.data?.success) {
        const allUsers = response.data.data || [];
        setTeachers(allUsers.filter((u: any) => u.roles?.includes('ROLE_TEACHER')));
      }
    } catch (e) {
      logger.error(e);
    }
  };

  const fetchStages = async (selectedYear = academicYear) => {
    setIsLoading(true);
    try {
      const url = selectedYear && selectedYear !== 'ALL'
        ? `/api/v1/admin/stages?academicYear=${selectedYear}`
        : '/api/v1/admin/stages';
      const response = await apiClient.get(url);
      if (response.data?.success) {
        setStages(response.data.data || []);
      }
    } catch (e) {
      logger.error(e);
      toast.error("Failed to fetch stages");
    } finally {
      setIsLoading(false);
    }
  };

  const triggerDelete = (id: number, name: string) => {
    setDeleteConfirmModal({
      open: true,
      stageId: id,
      stageName: name
    });
  };

  const confirmDeleteStage = async () => {
    const { stageId, stageName } = deleteConfirmModal;
    if (!stageId) return;

    setDeleteConfirmModal({ open: false, stageId: null, stageName: '' });
    const toastId = toast.loading(`Deleting ${stageName}...`);
    try {
      const response = await apiClient.delete(`/api/v1/admin/stages/${stageId}`);
      toast.dismiss(toastId);
      if (response.data?.success) {
        toast.success(`Deleted ${stageName} successfully`);
        fetchStages();
      } else {
        toast.error(response.data?.message || 'Failed to delete stage');
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error(e);
      toast.error(e.response?.data?.message || 'Failed to delete stage');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-bg">
      {/* Header Bar */}
      <div className="bg-card px-6 py-4 border-b border-border flex justify-between items-center text-text-primary">
        <div className="flex items-center space-x-3">
          {onBackToYearSelection && (
            <button
              onClick={onBackToYearSelection}
              className="p-2 bg-card border border-border hover:bg-bg text-text-primary rounded-lg type-caption flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Switch Year</span>
            </button>
          )}
          <h1 className="type-h4 text-text-primary">Activity & Thresholds</h1>
          {academicYear && (
            <span className="type-caption font-bold px-2.5 py-0.5 rounded-md bg-warning-tint text-warning border border-warning/20">
              {academicYear.replace('_', ' ')}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchStages()}
          className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-5 rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div>
            <h2 className="type-h4 font-bold text-text-primary">Stage Progression Pipeline</h2>
            <p className="type-body-sm text-text-secondary font-medium mt-0.5">
              Students must satisfy each stage's threshold requirements before advancing to the next milestone.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => onPushView('all_activities')}
              className="flex items-center space-x-2 bg-card hover:bg-bg text-text-primary border border-border px-4 py-2.5 rounded-lg type-body-sm font-bold transition-colors cursor-pointer"
            >
              <ListFilter className="w-4 h-4" />
              <span>Activity Catalog</span>
            </button>
            <button 
              onClick={() => onPushView('create_stage')}
              className="flex items-center space-x-2 bg-accent hover:bg-accent-hover text-card px-4 py-2.5 rounded-lg type-body-sm font-bold shadow-none transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stage</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-lg border border-border space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-accent" />
            <p className="type-body-sm text-text-secondary font-medium">Loading stage progression map...</p>
          </div>
        ) : stages.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-8 space-y-3 flex flex-col items-center">
            <div className="w-12 h-12 rounded-lg bg-bg border border-border flex items-center justify-center text-text-muted mb-1">
              <ListFilter className="w-6 h-6" />
            </div>
            <p className="type-h5 font-bold text-text-primary">No stages configured yet.</p>
            <p className="type-body-sm text-text-secondary max-w-sm">
              Click &quot;Add Stage&quot; above to create milestone stages for this academic year.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {stages.map((stage: any, idx: number) => {
              const active = stage.isActive ?? stage.active ?? (stage.status === 'ACTIVE');
              const statusText = stage.status || (active ? 'ACTIVE' : 'UPCOMING');
              const displayOrder = stage.displayOrder ?? stage.order ?? (idx + 1);
              const expectedXp = stage.expectedXp ?? stage.totalXp ?? 0;
              const mThresh = stage.mustThreshold ?? stage.mThreshold ?? 0;
              const iThresh = stage.individualThreshold ?? stage.iThreshold ?? 0;
              const gThresh = stage.groupThreshold ?? stage.gThreshold ?? 0;

              return (
                <div 
                  key={stage.id} 
                  className="bg-card p-6 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border cursor-pointer hover:border-accent/40 hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 group relative overflow-hidden"
                  onClick={() => onPushView('stage_details', { 
                    stageId: stage.id, 
                    stageName: stage.name, 
                    stageDescription: stage.description,
                    teachersList: teachers,
                    selectedYear: academicYear 
                  })}
                >
                  <div className="absolute top-0 left-0 bottom-0 w-1 bg-accent opacity-0 group-hover:opacity-100 transition-opacity" />

                  {/* Left: Stage Title & Milestones */}
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center space-x-3 flex-wrap gap-y-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-50/90 text-blue-600 border border-blue-100 font-black type-body-sm flex items-center justify-center shrink-0 shadow-sm">
                        {String(displayOrder).padStart(2, '0')}
                      </div>
                      <h3 className="type-h4 font-bold text-text-primary group-hover:text-accent transition-colors">
                        {stage.name}
                      </h3>
                      <span className={`type-fine font-bold px-2.5 py-0.5 rounded-md uppercase flex items-center gap-1.5 ${
                        statusText === 'ACTIVE' 
                          ? 'bg-success-tint text-success border border-success/20' 
                          : 'bg-warning-tint text-warning border border-warning/20'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${statusText === 'ACTIVE' ? 'bg-success' : 'bg-warning'}`} />
                        <span>{statusText}</span>
                      </span>
                    </div>

                    {stage.description && (
                      <p className="type-body-sm text-text-secondary font-medium line-clamp-1">
                        {stage.description}
                      </p>
                    )}

                    {/* Structured Threshold Metrics Row */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="type-fine font-bold text-text-primary bg-bg border border-border px-3 py-1.5 rounded-md flex items-center gap-1.5">
                        🎯 Total Target: <span className="font-extrabold text-accent">{expectedXp} XP</span>
                      </span>
                      <span className="type-fine font-bold text-text-secondary bg-bg border border-border px-3 py-1.5 rounded-md flex items-center gap-1.5">
                        ⭐ Must Pass: <span className="font-extrabold text-text-primary">{mThresh} XP</span>
                      </span>
                      <span className="type-fine font-bold text-text-secondary bg-bg border border-border px-3 py-1.5 rounded-md flex items-center gap-1.5">
                        👤 Individual: <span className="font-extrabold text-text-primary">{iThresh} XP</span>
                      </span>
                      <span className="type-fine font-bold text-text-secondary bg-bg border border-border px-3 py-1.5 rounded-md flex items-center gap-1.5">
                        👥 Group: <span className="font-extrabold text-text-primary">{gThresh} XP</span>
                      </span>
                    </div>
                  </div>
                  
                  {/* Right Action Icons & View Button */}
                  <div className="flex items-center space-x-2 shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-border">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onPushView('edit_stage', { stage }); }} 
                      className="p-2.5 text-text-secondary hover:text-text-primary hover:bg-bg border border-border rounded-lg transition-colors cursor-pointer"
                      title="Edit Stage"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); triggerDelete(stage.id, stage.name); }} 
                      className="p-2.5 text-text-secondary hover:text-accent hover:bg-accent-tint border border-border rounded-lg transition-colors cursor-pointer"
                      title="Delete Stage"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="pl-2 flex items-center text-text-secondary group-hover:text-accent font-bold type-caption transition-colors">
                      <span>Manage Stage</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Custom Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmModal.open}
        title="Delete Stage"
        description={`Are you sure you want to delete "${deleteConfirmModal.stageName}" and all associated subgroups? This action cannot be undone.`}
        confirmText="Delete Stage"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmDeleteStage}
        onCancel={() => setDeleteConfirmModal({ open: false, stageId: null, stageName: '' })}
      />
    </div>
  );
}
