import { logger } from '../../../../utils/logger';
import { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { activityService } from '../api/activityService';
import type { ActivityModel } from '../types/ActivityTypes';
import ActivityForm from '../components/ActivityForm';

interface EditActivityPageProps {
  onBack: () => void;
  onSuccess?: () => void;
  activity?: ActivityModel;
  activityId?: number;
  subgroupId?: number | string;
}

export default function EditActivityPage({ onBack, onSuccess, activity: initialActivity, activityId }: EditActivityPageProps) {
  const [activity, setActivity] = useState<ActivityModel | undefined>(initialActivity);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialActivity && !!activityId);

  useEffect(() => {
    if (!initialActivity && activityId) {
      setIsLoading(true);
      activityService.fetchActivities(0, 0, '')
        .then((acts) => {
          const found = acts.find((a: any) => String(a.id) === String(activityId));
          if (found) setActivity(found);
        })
        .catch(logger.error)
        .finally(() => setIsLoading(false));
    }
  }, [initialActivity, activityId]);

  const handleSubmit = async (data: any) => {
    const targetId = activity?.id || activityId;
    if (!targetId) {
      toast.error("Invalid activity ID");
      return;
    }
    setIsSubmitting(true);
    const toastId = toast.loading("Updating event...");
    try {
      await activityService.updateActivity(targetId, data);
      toast.dismiss(toastId);
      toast.success("Event updated successfully!");
      if (onSuccess) {
        onSuccess();
      } else {
        onBack();
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      logger.error(err);
      toast.error(err.response?.data?.message || 'Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      {/* Flutter Parity Top Bar */}
      <div className="bg-slate-900 px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 type-btn bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="type-h4 text-white">Edit Event</h1>
        </div>
        <button 
          type="submit" 
          form="activity-form"
          disabled={isSubmitting} 
          className="text-white font-bold type-btn px-4 py-2 bg-[#EA4335] hover:bg-red-600 rounded-xl transition-colors disabled:opacity-50"
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="flex-1 p-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <RefreshCw className="w-10 h-10 animate-spin text-[#EA4335]" />
            <p className="type-body-sm font-semibold text-slate-600">Fetching event details...</p>
          </div>
        ) : (
          <ActivityForm 
            initialData={activity} 
            onSubmit={handleSubmit} 
            onCancel={onBack}
            isSubmitting={isSubmitting} 
          />
        )}
      </div>
    </div>
  );
}
