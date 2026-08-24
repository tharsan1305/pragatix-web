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
    <div className="fixed inset-0 bg-white z-[100] flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
      {/* Top Header Bar matching Flutter AppBar */}
      <div className="bg-white px-6 py-4 sticky top-0 z-10 flex items-center border-b border-slate-100 shadow-xs">
        <button
          onClick={onClose}
          className="p-2 -ml-2 text-slate-900 type-btn hover:bg-slate-100 rounded-full transition cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <span className="ml-2 font-bold text-slate-900 type-h5">Activity Details</span>
      </div>

      <div className="p-6 max-w-xl mx-auto w-full space-y-6 flex-1 pb-28">
        {/* Status Pill Badge matching Flutter */}
        <div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-bold type-caption uppercase tracking-wider ${
            isCompleted 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : isPending 
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-slate-100 border-slate-200 text-slate-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-slate-400'}`}></span>
            <span>{statusText}</span>
          </span>
        </div>

        {/* Title & Description matching Flutter */}
        <div>
          <h1 className="font-heading type-h1 text-slate-900 leading-tight">
            {activity.activityName}
          </h1>
          <p className="type-body-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">
            {activity.description || 'No description provided.'}
          </p>
        </div>

        <hr className="border-slate-100 my-4" />

        {/* Information Section Card matching Flutter _InfoRow list */}
        <div className="space-y-3">
          <h2 className="type-h5 text-slate-900">Information</h2>
          
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
            {/* Reward */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-500 type-body-sm font-semibold">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span>Reward</span>
              </div>
              <span className="type-body-sm font-bold text-slate-900">
                {activity.rewardXp} XP
              </span>
            </div>

            {/* Awarded */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-500 type-body-sm font-semibold">
                <Award className="w-5 h-5 text-indigo-500" />
                <span>Awarded</span>
              </div>
              <span className="type-body-sm font-bold text-slate-900">
                {awardedXp} XP
              </span>
            </div>

            {/* Faculty / Owner */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-500 type-body-sm font-semibold">
                <User className="w-5 h-5 text-purple-500" />
                <span>Faculty / Owner</span>
              </div>
              <span className="type-body-sm font-bold text-slate-900 truncate max-w-[200px] text-right">
                {facultyName}
              </span>
            </div>

            {/* Frequency */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-500 type-body-sm font-semibold">
                <RefreshCw className="w-5 h-5 text-emerald-500" />
                <span>Frequency</span>
              </div>
              <span className="type-body-sm font-bold text-slate-900">
                {frequency}
              </span>
            </div>
          </div>
        </div>

        {/* Required Evidence Section Card matching Flutter */}
        {evidenceList.length > 0 && (
          <div className="space-y-3">
            <h2 className="type-h5 text-slate-900">Required Evidence</h2>
            
            <div className="flex flex-wrap gap-2">
              {evidenceList.map((ev, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 font-semibold type-caption px-3.5 py-2 rounded-xl border border-slate-200"
                >
                  <Eye className="w-4 h-4 text-slate-500" />
                  <span>{ev}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submission Evidence View Button */}
        {activity.evidenceUrl && (
          <div className="pt-2">
            <a
              href={getSafeHref(activity.evidenceUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold type-caption transition flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              View Submission Proof
            </a>
          </div>
        )}
      </div>

      {/* Bottom Bar matching Flutter activity_details_screen.dart */}
      {allowStudentRequest && (
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 shadow-lg z-20 max-w-xl mx-auto w-full space-y-3">
          {isCompleted ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-3.5 flex items-center gap-2 font-bold type-body-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Completed ✓</span>
            </div>
          ) : (
            <>
              {isRejected && existingRequest && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl type-caption text-rose-700 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <strong>Previous request rejected:</strong> {existingRequest.rejectedReason || 'No reason provided'}
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowDialog(true)}
                disabled={!buttonEnabled || isLoadingRequests}
                className={`w-full py-3.5 rounded-2xl font-bold type-body-sm transition flex items-center justify-center gap-2 shadow-sm ${
                  isPending
                    ? 'bg-amber-100 text-amber-800 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
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

      {/* Flutter Completion Request Dialog Popup matching AlertDialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="type-h4 text-slate-900">Request Activity</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="type-form-label block font-bold text-slate-700 mb-1">
                  Reason / Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Describe your completion details..."
                  rows={3}
                  className="w-full type-caption p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="type-form-label block font-bold text-slate-700 mb-1">
                  Proof URL (Optional)
                </label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full type-caption p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold type-caption transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold type-caption transition disabled:opacity-50 cursor-pointer"
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
