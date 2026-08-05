import { useState, useEffect } from 'react';
import { RefreshCw, Plus, Edit2, Trash2, ChevronRight, ListFilter } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

interface Props {
  onPushView?: (name: string, props?: any) => void;
}

export default function ActivityTab({ onPushView = () => {} }: Props) {
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
    fetchStages();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await apiClient.get('/api/v1/admin/users');
      if (response.data?.success) {
        const allUsers = response.data.data || [];
        setTeachers(allUsers.filter((u: any) => u.roles?.includes('ROLE_TEACHER')));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStages = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/v1/admin/stages');
      if (response.data?.success) {
        setStages(response.data.data || []);
      }
    } catch (e) {
      console.error(e);
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
      console.error(e);
      toast.error(e.response?.data?.message || 'Failed to delete stage');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      {/* Header Bar */}
      <div className="bg-slate-900 px-6 pt-12 pb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white">Activity & Thresholds</h1>
        <button onClick={fetchStages} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 p-6 space-y-6">
        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-slate-800">Configure Stages & Thresholds</h2>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => onPushView('all_activities')}
              className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-transform active:scale-95"
            >
              <ListFilter className="w-4 h-4" />
              <span>All Activities</span>
            </button>
            <button 
              onClick={() => onPushView('create_stage')}
              className="flex items-center space-x-2 bg-[#EA4335] hover:bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-sm transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Stage</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : stages.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-2xl shadow-sm border border-slate-200">
            <p className="text-base font-semibold text-slate-700">No stages configured yet.</p>
            <p className="text-sm text-slate-400 mt-1">Click Add Stage above to create one.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stages.map(stage => {
              const active = stage.isActive ?? stage.active ?? (stage.status === 'ACTIVE');
              const statusText = stage.status || (active ? 'ACTIVE' : 'UPCOMING');
              const displayOrder = stage.displayOrder ?? stage.order ?? 0;
              const expectedXp = stage.expectedXp ?? stage.totalXp ?? 0;
              const mThresh = stage.mustThreshold ?? stage.mThreshold ?? 0;
              const iThresh = stage.individualThreshold ?? stage.iThreshold ?? 0;
              const gThresh = stage.groupThreshold ?? stage.gThreshold ?? 0;

              return (
                <div 
                  key={stage.id} 
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 cursor-pointer hover:border-red-300 transition-all flex items-center justify-between group"
                  onClick={() => onPushView('stage_details', { 
                    stageId: stage.id, 
                    stageName: stage.name, 
                    stageDescription: stage.description,
                    teachersList: teachers 
                  })}
                >
                  <div className="flex-1 pr-4 space-y-3">
                    {/* Header line */}
                    <div className="flex items-center space-x-3">
                      <h3 className="font-bold text-xl text-slate-900">{stage.name}</h3>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase border tracking-wider ${
                        statusText === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                          : statusText === 'UPCOMING'
                          ? 'bg-blue-50 text-blue-800 border-blue-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}>
                        {statusText}
                      </span>
                    </div>

                    {/* Metrics Row (Order, XP, M, I, G) - 1:1 Flutter Alignment */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                      <span className="text-slate-800 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-md">
                        Order: {displayOrder}
                      </span>
                      <span className="text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                        XP: {expectedXp}
                      </span>
                      <span className="text-red-800 bg-red-50 border border-red-200 px-2.5 py-1 rounded-md">
                        M: {mThresh}
                      </span>
                      <span className="text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
                        I: {iThresh}
                      </span>
                      <span className="text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
                        G: {gThresh}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Icons */}
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onPushView('edit_stage', { stage }); }} 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); triggerDelete(stage.id, stage.name); }} 
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors ml-1" />
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
