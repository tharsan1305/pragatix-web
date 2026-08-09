import React, { useState } from 'react';
import { ArrowLeft, Star, Award, User, RefreshCw, Eye, Send, ExternalLink, CheckCircle } from 'lucide-react';
import type { Activity } from '../types/activity';
import { ActivityService } from '../services/activityService';

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
  const [showDialog, setShowDialog] = useState(false);

  if (!activity) return null;

  const isCompleted = activity.isCompleted || activity.status === 'COMPLETED';
  const allowStudentRequest = activity.allowStudentRequest === true;

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
        setShowDialog(false);
        onClose();
      }, 1200);
    } else {
      setSubmitMessage('Failed to submit completion request. Please try again.');
    }
  };

  const statusText = activity.statusPillText || activity.status || (isCompleted ? 'COMPLETED' : 'NOT_STARTED');
  const facultyName = activity.facultyName || 'subashree';
  const frequency = activity.frequency || 'Per Assignment';
  const evidenceList = (activity.evidence && activity.evidence.length > 0)
    ? activity.evidence
    : ['Direct Observation'];
  const awardedXp = activity.awardedXp ?? 0;

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col overflow-y-auto animate-in slide-in-from-right duration-200">
      {/* Top Header Bar */}
      <div className="bg-white px-6 py-4 sticky top-0 z-10 flex items-center border-b border-slate-100">
        <button
          onClick={onClose}
          className="p-2 -ml-2 text-slate-900 hover:bg-slate-100 rounded-full transition"
          title="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
      </div>

      <div className="p-6 max-w-xl mx-auto w-full space-y-6 flex-1 pb-24">
        {/* Status Pill Badge */}
        <div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-bold text-[11px] uppercase tracking-wider ${
            isCompleted 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-amber-50 border-amber-200 text-amber-700'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span>{statusText}</span>
          </span>
        </div>

        {/* Title & Subtitle */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 leading-tight">
            {activity.activityName}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1 leading-relaxed">
            {activity.description || 'No description provided.'}
          </p>
        </div>

        <hr className="border-slate-100 my-4" />

        {/* Information Section Card (Matching Flutter Screen) */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900">Information</h2>
          
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-4">
            {/* Reward */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span>Reward</span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                {activity.rewardXp} XP
              </span>
            </div>

            {/* Awarded */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
                <Award className="w-5 h-5 text-indigo-500" />
                <span>Awarded</span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                {awardedXp} XP
              </span>
            </div>

            {/* Faculty / Owner */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
                <User className="w-5 h-5 text-purple-500" />
                <span>Faculty / Owner</span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                {facultyName}
              </span>
            </div>

            {/* Frequency */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-500 text-sm font-semibold">
                <RefreshCw className="w-5 h-5 text-emerald-500" />
                <span>Frequency</span>
              </div>
              <span className="text-sm font-bold text-slate-900">
                {frequency}
              </span>
            </div>
          </div>
        </div>

        {/* Required Evidence Section Card */}
        {evidenceList.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-base font-bold text-slate-900">Required Evidence</h2>
            
            <div className="flex flex-wrap gap-2">
              {evidenceList.map((ev, idx) => (
                <div
                  key={idx}
                  className="inline-flex items-center gap-2 bg-slate-100/80 text-slate-700 font-semibold text-xs px-3.5 py-2 rounded-xl border border-slate-200/60"
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
              href={activity.evidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs transition flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              View Submission
            </a>
          </div>
        )}
      </div>

      {/* Bottom Bar matching Flutter's bottomNavigationBar */}
      {allowStudentRequest && (
        <div className="sticky bottom-0 bg-white border-t border-slate-100 p-4 shadow-lg z-20">
          {isCompleted ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl p-3 flex items-center gap-2 font-bold text-sm">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Completed ✓</span>
            </div>
          ) : (
            <button
              onClick={() => setShowDialog(true)}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span>{activity.buttonText || 'Request Activity'}</span>
            </button>
          )}
        </div>
      )}

      {/* Flutter Completion Request Dialog Popup */}
      {showDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-lg font-bold text-slate-900">Request Activity</h3>
            
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Reason / Remarks
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Describe your completion details..."
                  rows={3}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Proof URL (Optional)
                </label>
                <input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {submitMessage && (
                <div
                  className={`text-xs font-bold p-3 rounded-xl ${
                    submitMessage.includes('successfully')
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                >
                  {submitMessage}
                </div>
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowDialog(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition disabled:opacity-50"
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
