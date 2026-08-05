import React, { useState } from 'react';
import { CheckCircle2, Star, Lock, X, ExternalLink, Send } from 'lucide-react';
import type { Activity } from '../types/activity';
import { ActivityService } from '../services/activityService';
import { StatusChip } from './StatusChip';

interface ActivityDetailsModalProps {
  activity: Activity | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ActivityDetailsModal: React.FC<ActivityDetailsModalProps> = ({
  activity,
  onClose,
  onSuccess,
}) => {
  const [proofUrl, setProofUrl] = useState('');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  if (!activity) return null;

  const isCompleted = activity.isCompleted || activity.status === 'COMPLETED';
  const isLocked = activity.status === 'LOCKED';
  const isPending = !isCompleted && !isLocked;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.id) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    const success = await ActivityService.submitActivityCompletion(
      activity.id,
      proofUrl,
      remarks
    );

    setIsSubmitting(false);

    if (success) {
      setSubmitMessage('Activity completion request submitted successfully!');
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setSubmitMessage('Failed to submit completion request. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 relative animate-in fade-in zoom-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Section */}
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isCompleted
                ? 'bg-emerald-100 text-emerald-600'
                : isLocked
                ? 'bg-slate-100 text-slate-500'
                : 'bg-blue-100 text-blue-600'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />
            ) : isLocked ? (
              <Lock className="w-6 h-6 stroke-[2.2]" />
            ) : (
              <Star className="w-6 h-6 stroke-[2.2]" />
            )}
          </div>
          <div>
            <h3 className="font-bold text-lg text-slate-900 leading-tight">
              {activity.activityName}
            </h3>
            <span className="inline-block mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700">
              {activity.rewardXp || activity.awardedXp || 0} XP Points
            </span>
          </div>
        </div>

        {/* Description */}
        {activity.description && (
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
            {activity.description}
          </div>
        )}

        {/* Status Badge & Review Status */}
        <div className="space-y-2 pt-1 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-400">Activity Status</span>
            <StatusChip status={activity.status} size="sm" />
          </div>

          {activity.requestStatus && (
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-400">Submission Status</span>
              <span className="font-bold text-slate-700">{activity.requestStatus}</span>
            </div>
          )}
        </div>

        {/* Evidence / Proof Form (Submit Activity) */}
        {isPending && activity.buttonEnabled !== false && (
          <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Evidence / Certificate Link (Optional)
              </label>
              <input
                type="url"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Remarks / Notes
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Describe your completion details..."
                rows={2}
                className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {submitMessage && (
              <div
                className={`text-xs font-bold p-2.5 rounded-xl ${
                  submitMessage.includes('successfully')
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-rose-50 text-rose-700'
                }`}
              >
                {submitMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : activity.buttonText || 'Submit Activity'}
            </button>
          </form>
        )}

        {/* View Submission Evidence Button */}
        {activity.evidenceUrl && (
          <div className="pt-2">
            <a
              href={activity.evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              View Submission
            </a>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm transition"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default ActivityDetailsModal;
