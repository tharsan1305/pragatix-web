import { logger } from '../../../../utils/logger';
import { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { activityService } from '../api/activityService';
import ActivityForm from '../components/ActivityForm';

interface CreateActivityPageProps {
  onBack: () => void;
  onSuccess?: () => void;
  subgroupId?: number;
  stageId?: number;
  subgroupName?: string;
}

export default function CreateActivityPage({ 
  onBack, 
  onSuccess,
  subgroupId, 
  stageId, 
  subgroupName = 'Must' 
}: CreateActivityPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    setToast(null);
    try {
      await activityService.createActivity(data, subgroupId, stageId, subgroupName);
      setToast({ message: 'Activity created successfully!', type: 'success' });
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          onBack();
        }
      }, 1000);
    } catch (err: any) {
      logger.error('Failed to create activity:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to create activity';
      setToast({ message: msg, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 relative">
      {/* Web In-App Toast Confirmation Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-2xl shadow-xl flex items-center space-x-3 text-sm font-bold animate-in slide-in-from-top duration-300 ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="bg-slate-900 px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white">Create New Activity</h1>
        </div>
        <button 
          type="submit" 
          form="activity-form"
          disabled={isSubmitting} 
          className="text-white font-bold text-sm px-4 py-2 bg-[#EA4335] hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="flex-1 p-6">
        <ActivityForm 
          onSubmit={handleSubmit} 
          onCancel={onBack}
          isSubmitting={isSubmitting} 
        />
      </div>
    </div>
  );
}
