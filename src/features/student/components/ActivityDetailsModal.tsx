import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Award, User, RefreshCw, Eye, Send, ExternalLink, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Activity } from '../types/activity';
import { ActivityService } from '../services/activityService';
import apiClient from '../../../services/apiClient';
import { getSafeHref } from '../../../core/utils/url';

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
  const [showDialog, setShowDialog] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  useEffect(() => {
    if (!activity) {
      setExistingRequest(null);
      return;
    }

    const loadMyRequests = async () => {
      setIsLoadingRequests(true);
      try {
        const res = await apiClient.get('/api/activity-requests/my-requests');
        if (res.data?.success && Array.isArray(res.data.data)) {
          const req = res.data.data.find(
            (r: any) => Number(r.activityId) === Number(activity.id) && !r.teamId
          );
          setExistingRequest(req || null);
        }
      } catch (_) {
        // Silently continue
      } finally {
        setIsLoadingRequests(false);
      }
    };

    loadMyRequests();
  }, [activity]);

  if (!activity) return null;

  const reqStatus = (existingRequest?.status || '').toUpperCase();
  const isCompleted = activity.isCompleted || activity.status === 'COMPLETED' || reqStatus === 'APPROVED';
  const isPending = reqStatus === 'PENDING';
  const isRejected = reqStatus === 'REJECTED';
  const allowStudentRequest = activity.allowStudentRequest === true;
  const buttonEnabled = !isCompleted && !isPending && !isSubmitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity.id) return;

    setIsSubmitting(true);
    const toastId = toast.loading('Submitting activity request...');

    const success = await ActivityService.submitActivityCompletion(
      activity.id,
      proofUrl,
      remarks
    );

    setIsSubmitting(false);
    toast.dismiss(toastId);

    if (success) {
      toast.success('Activity Request Submitted Successfully');
      setShowDialog(false);
      setExistingRequest({ status: 'PENDING' });
      if (onSuccess) onSuccess();
    } else {
      toast.error('Failed to submit request. Please try again.');
    }
  };

  const statusText = isCompleted ? 'COMPLETED' : (isPending ? 'PENDING' : (activity.statusPillText || activity.status || 'NOT_STARTED'));
  const facultyName = activity.facultyName || 'Unassigned';
  const frequency = activity.frequency || 'N/A';
  const evidenceList = activity.evidence && activity.evidence.length > 0 ? activity.evidence : [];
  const awardedXp = activity.awardedXp ?? 0;

  return (
    <div className="fixed inset-0 bg-bg text-text-primary z-[100] flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
      {/* Top Header Bar */}
      <div className="bg-card text-text-primary px-6 py-5 sticky top-0 z-10 flex items-center justify-between border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          <button
            onClick={onClose}
            className="p-2 border border-border bg-card hover:bg-bg rounded-lg transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
            title="Back to Activities"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="type-h4 font-bold text-text-primary tracking-tight">Activity Details</h1>
            <p className="type-caption text-text-secondary font-medium mt-0.5">Task requirements, rewards, and evidence submission</p>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-xl mx-auto w-full space-y-5 flex-1 pb-28">
        {/* Main Hero Card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-3">
          {/* Status Pill Badge */}
          <div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md border font-bold type-caption uppercase tracking-wider ${
              isCompleted 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : isPending 
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-bg border-border text-text-secondary'
            }`}>
              <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-600' : isPending ? 'bg-amber-500' : 'bg-text-muted'}`}></span>
              <span>{statusText.replace('_', ' ')}</span>
            </span>
          </div>

          {/* Title & Description */}
          <div>
            <h2 className="type-h2 font-black text-text-primary tracking-tight">
              {activity.activityName}
            </h2>
            <p className="type-body-sm text-text-secondary mt-2 leading-relaxed whitespace-pre-line font-medium">
              {activity.description || 'No description provided.'}
            </p>
          </div>
        </div>

        {/* Information Section Card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
          <h3 className="type-h4 font-bold text-text-primary flex items-center gap-2 pb-3 border-b border-border">
            <Star className="w-4 h-4 text-accent" />
            <span>Activity Overview</span>
          </h3>
          
          <div className="space-y-3.5 type-body-sm">
            {/* Reward */}
            <div className="flex items-center justify-between">
              <span className="text-text-secondary font-medium flex items-center gap-2">
                <Star className="w-4 h-4 text-accent" /> Reward Points
              </span>
              <span className="font-bold px-2.5 py-0.5 rounded-md bg-accent-tint text-accent border border-accent/20">
                {activity.rewardXp} XP
              </span>
            </div>

            {/* Awarded */}
            <div className="flex items-center justify-between">
              <span className="text-text-secondary font-medium flex items-center gap-2">
                <Award className="w-4 h-4 text-text-muted" /> Awarded Points
              </span>
              <span className="font-bold text-text-primary">
                {awardedXp} XP
              </span>
            </div>

            {/* Faculty / Owner */}
            <div className="flex items-center justify-between">
              <span className="text-text-secondary font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-text-muted" /> Faculty / Owner
              </span>
              <span className="font-bold text-text-primary truncate max-w-[200px] text-right">
                {facultyName}
              </span>
            </div>

            {/* Frequency */}
            <div className="flex items-center justify-between">
              <span className="text-text-secondary font-medium flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-text-muted" /> Frequency
              </span>
              <span className="font-bold text-text-primary">
                {frequency}
              </span>
            </div>
          </div>
        </div>

        {/* Required Evidence Section Card */}
        {evidenceList.length > 0 && (
          <div className="bg-card rounded-2xl p-6 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-3">
            <h3 className="type-h4 font-bold text-text-primary">Required Evidence</h3>
            
            <div className="flex flex-wrap gap-2">
              {evidenceList.map((ev, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 bg-bg text-text-primary font-bold type-caption px-3.5 py-2 rounded-xl border border-border"
                >
                  <Eye className="w-4 h-4 text-accent" />
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submission Evidence View Button */}
        {activity.evidenceUrl && (
          <div className="pt-1">
            <a
              href={getSafeHref(activity.evidenceUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-card hover:bg-bg text-text-primary border border-border rounded-xl font-bold type-caption transition flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-text-muted" />
              <span>View Submission Proof Link</span>
            </a>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      {allowStudentRequest && (
        <div className="sticky bottom-0 bg-card border-t border-border p-4 shadow-none z-20 max-w-xl mx-auto w-full space-y-3">
          {isCompleted ? (
            <div className="bg-success-tint border border-success/30 text-success rounded-lg p-3.5 flex items-center gap-2 font-bold type-body-sm">
              <CheckCircle className="w-5 h-5 text-success shrink-0" />
              <span>Completed ✓</span>
            </div>
          ) : (
            <>
              {isRejected && existingRequest && (
                <div className="p-3 bg-accent-tint/40 border border-accent/30 rounded-lg type-caption text-accent flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <strong>Previous request rejected:</strong> {existingRequest.rejectedReason || 'No reason provided'}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowDialog(true)}
                disabled={!buttonEnabled || isLoadingRequests}
                className={`w-full py-3.5 rounded-lg font-bold type-body-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                  isPending
                    ? 'bg-warning-tint text-warning border border-warning/30 cursor-not-allowed'
                    : 'bg-accent hover:bg-accent-hover text-card'
                }`}
              >
                {isPending ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>Request Pending</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{activity.buttonText || 'Request Activity'}</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      )}

      {/* Completion Request Dialog Popup */}
      {showDialog && (
        <div className="fixed inset-0 bg-text-primary/40 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6 border border-border shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="type-h4 font-bold text-text-primary">Request Activity</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="type-form-label block font-bold text-text-primary mb-1">
                  Reason / Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Describe your completion details..."
                  rows={3}
                  className="w-full type-caption p-3 rounded-lg border border-border bg-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="type-form-label block font-bold text-text-primary mb-1">
                  Proof URL (Optional)
                </label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full type-caption p-3 rounded-lg border border-border bg-bg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="px-4 py-2.5 bg-bg hover:bg-border border border-border text-text-primary rounded-lg font-bold type-caption transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-card rounded-lg font-bold type-caption transition disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityDetailsModal;
