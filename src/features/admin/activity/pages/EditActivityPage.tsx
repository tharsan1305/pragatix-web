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
    <div className="flex flex-col min-h-full bg-bg text-text-primary">
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
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">Edit Activity</h1>
            <p className="type-body-sm text-text-secondary font-medium mt-0.5">
              Update task point values, evaluation frequency, and rules
            </p>
          </div>
        </div>
        <button 
          type="submit" 
          form="activity-form"
          disabled={isSubmitting} 
          className="text-card font-bold type-btn px-5 py-2.5 bg-accent hover:bg-accent-hover rounded-lg transition-colors shadow-none disabled:opacity-50 cursor-pointer"
        >
          {isSubmitting ? 'Saving...' : 'Update Activity'}
        </button>
      </div>

      <div className="flex-1 p-6 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
            <RefreshCw className="w-10 h-10 animate-spin text-accent" />
            <p className="type-body-sm font-semibold text-text-secondary">Fetching activity details...</p>
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
