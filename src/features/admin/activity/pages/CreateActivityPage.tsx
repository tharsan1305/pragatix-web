import { useState } from 'react';
import { ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import ActivityForm from '../components/ActivityForm';
import { activityService } from '../api/activityService';

interface CreateActivityPageProps {
  subgroupId?: string | number;
  stageId?: string | number;
  subgroupName?: string;
  onBack: () => void;
  onSuccess?: () => void;
}

export default function CreateActivityPage({
  subgroupId,
  stageId,
  subgroupName,
  onBack,
  onSuccess
}: CreateActivityPageProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (formData: any) => {
    setIsSubmitting(true);
    try {
      await activityService.createActivity(
        formData, 
        subgroupId ? Number(subgroupId) : undefined, 
        stageId ? Number(stageId) : undefined, 
        subgroupName
      );
      setToast({ message: 'Activity created successfully', type: 'success' });
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          onBack();
        }
      }, 1000);
    } catch (err: any) {
      console.error('Failed to create activity', err);
      setToast({ 
        message: err?.response?.data?.message || err?.message || 'Failed to create activity', 
        type: 'error' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-bg text-text-primary">
      {/* Toast Notification matching Flutter Top SnackBar */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3.5 rounded-lg shadow-xl flex items-center space-x-3 type-body-sm font-bold animate-in slide-in-from-top duration-300 ${
          toast.type === 'success' ? 'bg-success text-card' : 'bg-accent text-card'
        }`}>
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="bg-card text-text-primary px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3.5">
          <button 
            onClick={onBack} 
            className="px-3.5 py-2 bg-card border border-border rounded-lg text-text-primary hover:bg-bg transition-colors cursor-pointer flex items-center gap-2 font-bold type-caption"
            title="Back to Activities"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Activities</span>
          </button>
          <div>
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">Create New Activity</h1>
            <p className="type-body-sm text-text-secondary font-medium mt-0.5">
              Define points, evaluation frequency, and rules for this task
            </p>
          </div>
        </div>
        <button 
          type="submit" 
          form="activity-form"
          disabled={isSubmitting} 
          className="text-card font-bold type-btn px-5 py-2.5 bg-accent hover:bg-accent-hover rounded-lg transition-colors shadow-none disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Saving...' : 'Save Activity'}
        </button>
      </div>

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        <ActivityForm 
          onSubmit={handleSubmit} 
          onCancel={onBack}
          isSubmitting={isSubmitting} 
        />
      </div>
    </div>
  );
}
