import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { AlertTriangle, Check, RefreshCw, Clock, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import { teamService } from '../../../services/teamService';
import { getSafeHref } from '../../../core/utils/url';

interface Props {
  onBack?: () => void;
}

export default function CCInboxTab({ onBack }: Props) {

  const [mainTab, setMainTab] = useState<'MY_CLASS' | 'MY_REQUESTS'>('MY_CLASS');
  const [inbox, setInbox] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('ALL');

  const [rejectingItem, setRejectingItem] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  useEffect(() => {
    fetchCcInbox();
    fetchMyRequests();
  }, []);

  const handleMainTabChange = (tab: 'MY_CLASS' | 'MY_REQUESTS') => {
    setMainTab(tab);
    setActiveTab('ALL');
  };

  const fetchCcInbox = async () => {
    setIsLoading(true);
    try {
      const combined: any[] = [];

      // 1. Fetch Class Badge Requests matching Flutter CCBadgeRequestsPage (/api/cc/badge-requests)
      try {
        const badgeRes = await apiClient.get('/api/cc/badge-requests');
        if (badgeRes.data?.success && Array.isArray(badgeRes.data.data)) {
          const badgeItems = badgeRes.data.data.map((item: any) => ({
            ...item,
            isBadgeRequest: true,
            isActivityRequest: false,
            title: item.badgeName || item.badge?.name || 'Class Badge Request',
            badgeName: item.badgeName || item.badge?.name || 'Badge Request',
            studentName: item.studentName || item.studentRegNo || item.student?.fullName || 'Student',
            studentRegNo: item.studentRegNo || item.studentId || item.regNo || '',
            description: item.reason || item.note || 'Student submitted badge claim request.',
            proofUrl: item.proofUrl || item.proofLink || item.evidenceUrl || '',
            date: item.requestedAt || item.createdAt || item.date,
          }));
          combined.push(...badgeItems);
        }
      } catch (e) {
        logger.error("Failed to fetch CC badge requests:", e);
      }

      // 2. Fetch Activity Completion Requests submitted by students
      try {
        const actRes = await apiClient.get('/api/activity-requests/inbox');
        if (actRes.data?.success && Array.isArray(actRes.data.data)) {
          const actItems = actRes.data.data.map((item: any) => ({
            ...item,
            isBadgeRequest: false,
            isActivityRequest: true,
            title: item.activityName || 'Activity Completion Request',
            studentName: item.studentName || item.studentRegNo || 'Student',
            description: item.reason || item.note || 'Student submitted activity completion claim.',
            proofUrl: item.proofUrl || item.evidenceUrl || '',
            date: item.createdAt || item.date,
          }));
          combined.push(...actItems);
        }
      } catch (e) {
        logger.error("Failed to fetch activity requests inbox:", e);
      }

      // 3. Fetch Penalty requests
      try {
        const penRes = await apiClient.get('/api/penalties/cc-inbox');

        if (penRes.data?.success) {
          const raw = penRes.data.data;
          const penItems = Array.isArray(raw) ? raw : (raw?.content || []);
          combined.push(...penItems.map((item: any) => ({ ...item, isBadgeRequest: false, isActivityRequest: false })));
        }
      } catch (e) {
        logger.error("Failed to fetch penalty CC inbox:", e);
      }

      // 4. Fetch pending team member removal requests (GET /api/v1/teams/removal-requests/pending)
      try {
        const removalRes = await teamService.getPendingRemovalRequests();
        if (removalRes.data?.success && Array.isArray(removalRes.data.data)) {
          const removalItems = removalRes.data.data.map((item: any) => ({
            ...item,
            isRemovalRequest: true,
            isBadgeRequest: false,
            isActivityRequest: false,
            title: 'Team Removal Request',
            studentName: item.studentName || item.memberName || item.regNo || 'Student',
            studentRegNo: item.regNo || item.studentRegNo || item.memberRegNo || '',
            description: item.reason || item.note || `Captain requested removal of this member from team "${item.teamName || ''}".`,
            date: item.requestedAt || item.createdAt || item.date,
          }));
          combined.push(...removalItems);
        }
      } catch (e) {
        logger.error("Failed to fetch team removal requests:", e);
      }

      setInbox(combined);
    } catch (e) {
      logger.error("Failed to load CC inbox:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/penalties/my-requests');

      if (response.data?.success) {
        const raw = response.data.data;
        setMyRequests(Array.isArray(raw) ? raw : (raw?.content || []));
      }
    } catch (e) {
      logger.error("Failed to fetch my penalty requests:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (item: any) => {
    const isBadge = item.isBadgeRequest || item.badgeName;
    const isAct = item.isActivityRequest || item.activityName;
    const isRemoval = item.isRemovalRequest;
    const label = isBadge ? "badge request" : isAct ? "activity request" : isRemoval ? "removal request" : "penalty request";
    const toastId = toast.loading(`Approving ${label}...`);
    try {
      let response;
      if (isBadge) {
        response = await apiClient.put(`/api/cc/badge-requests/${item.id}/approve`);
      } else if (isAct) {
        response = await apiClient.put(`/api/activity-requests/${item.id}/approve`);
      } else if (isRemoval) {
        response = await teamService.approveRemovalRequest(item.id);
      } else {
        response = await apiClient.put(`/api/penalties/${item.id}/approve`);
      }
      toast.dismiss(toastId);
      if (response.status === 200 || response.data?.success) {
        toast.success(`Request approved successfully!`);
        fetchCcInbox();
        fetchMyRequests();
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error("Failed to approve request:", e);
      toast.error(e.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    const isBadge = rejectingItem.isBadgeRequest || rejectingItem.badgeName;
    const isAct = rejectingItem.isActivityRequest || rejectingItem.activityName;
    const isRemoval = rejectingItem.isRemovalRequest;
    const label = isBadge ? "badge request" : isAct ? "activity request" : isRemoval ? "removal request" : "penalty request";
    const toastId = toast.loading(`Rejecting ${label}...`);
    try {
      let response;
      if (isBadge) {
        response = await apiClient.put(`/api/cc/badge-requests/${rejectingItem.id}/reject`, {
          reason: rejectReason
        });
      } else if (isAct) {
        response = await apiClient.put(`/api/activity-requests/${rejectingItem.id}/reject`, {
          reason: rejectReason
        });
      } else if (isRemoval) {
        response = await teamService.rejectRemovalRequest(rejectingItem.id);
      } else {
        response = await apiClient.put(`/api/penalties/${rejectingItem.id}/reject`, {
          reason: rejectReason
        });
      }
      toast.dismiss(toastId);
      if (response.status === 200 || response.data?.success) {
        toast.success(`Request rejected`);
        setRejectingItem(null);
        setRejectReason('');
        fetchCcInbox();
        fetchMyRequests();
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error("Failed to reject request:", e);
      toast.error(e.response?.data?.message || 'Failed to reject request');
    }
  };

  const formatDate = (dStr: any) => {
    if (!dStr) return 'N/A';
    try {
      const d = new Date(dStr);
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) +
        ' - ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    } catch {
      return String(dStr);
    }
  };

  const activeSourceList = mainTab === 'MY_CLASS' ? inbox : myRequests;

  const pendingList = activeSourceList.filter(r => (r.status || 'PENDING').toUpperCase() === 'PENDING');
  const approvedList = activeSourceList.filter(r => ['APPROVED', 'AUTO_APPROVED'].includes((r.status || '').toUpperCase()));
  const rejectedList = activeSourceList.filter(r => (r.status || '').toUpperCase() === 'REJECTED');

  const currentList = activeTab === 'ALL' 
    ? activeSourceList 
    : activeTab === 'PENDING' 
    ? pendingList 
    : activeTab === 'APPROVED' 
    ? approvedList 
    : rejectedList;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-28">
      {/* Top Header Banner */}
      <div className="bg-slate-900 text-white p-4 md:p-6 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="font-heading text-xl font-bold">Class Coordinator Inbox</h1>
            <p className="text-xs text-slate-400">Review student activity completion & penalty requests</p>
          </div>
        </div>
        <button
          onClick={() => { fetchCcInbox(); fetchMyRequests(); }}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-colors cursor-pointer"
          title="Refresh Requests"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Tabs (My Class Requests vs My Submitted Requests) */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-4 md:px-6 py-3 flex flex-wrap gap-4 justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => handleMainTabChange('MY_CLASS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mainTab === 'MY_CLASS' ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Class Inbox ({inbox.length})
          </button>
          <button
            onClick={() => handleMainTabChange('MY_REQUESTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              mainTab === 'MY_REQUESTS' ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            My Requests ({myRequests.length})
          </button>
        </div>

        {/* Secondary Filter Badges */}
        <div className="flex space-x-2">
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all cursor-pointer ${
                activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <AlertTriangle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No {activeTab.toLowerCase()} requests found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {currentList.map(req => {
              const studentName = req.studentName || req.studentRegNo || req.student?.fullName || req.fullName || 'Student';
              const regNo = req.studentRegNo || req.registerNumber || req.regNo || req.student?.registerNumber || 'N/A';
              const activity = req.activityName || req.penaltyActivity || (req.isRemovalRequest ? `Team removal — ${req.teamName || 'team'}` : 'Activity Request');
              const penaltyXP = req.penaltyXP ?? req.pointsDeducted ?? req.points ?? 0;
              const reason = req.reason || req.description || req.note || '';
              const proofUrl = req.proofUrl || req.evidenceUrl || '';
              const status = (req.status || 'PENDING').toUpperCase();
              const submittedTime = req.submittedTime || req.createdAt || req.date;
              const approvedBy = req.approvedBy || req.reviewedBy;
              const approvalTime = req.approvalTime || req.reviewedAt;
              const rejectedReason = req.rejectedReason || req.rejectionReason;

              const statusBg = 
                status === 'AUTO_APPROVED' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                status === 'REJECTED' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                'bg-amber-50 text-amber-600 border-amber-200';

              const isBadge = req.isBadgeRequest || req.badgeName;
              const isAct = req.isActivityRequest || req.activityName;
              const isRemoval = req.isRemovalRequest;
              const badgeLabel = isBadge ? 'Badge Request' : isAct ? 'Activity Request' : isRemoval ? 'Removal Request' : 'Penalty Request';
              const badgeClass = isBadge ? 'bg-purple-100 text-purple-800' : isAct ? 'bg-indigo-100 text-indigo-800' : isRemoval ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800';

              return (
                <div key={req.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  {/* Top Header Row: Student Name + Type + Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${badgeClass}`}>
                        {badgeLabel}
                      </span>
                      <h3 className="font-heading font-bold text-slate-900 text-base">{studentName}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-extrabold border uppercase tracking-wider ${statusBg}`}>
                      {status}
                    </span>
                  </div>

                  {/* Register Number */}
                  <p className="text-xs font-semibold text-slate-600">
                    Register No: <span className="text-slate-900 font-bold">{regNo}</span>
                  </p>

                  <div className="h-px bg-slate-100 my-1" />

                  {/* Activity Details */}
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-800">
                      Activity: <span className="text-slate-600 font-medium">{activity}</span>
                    </p>
                    {!isAct && penaltyXP > 0 && (
                      <p className="text-xs font-extrabold text-rose-600">
                        Penalty XP: -{penaltyXP}
                      </p>
                    )}
                    {reason && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-1">
                        <strong>Note / Reason:</strong> {reason}
                      </p>
                    )}
                    {proofUrl && (
                      <div className="pt-1">
                        <a
                          href={getSafeHref(proofUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold border border-blue-200 transition"
                        >
                          🔗 View Proof Link
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Requested Time & Reviewer Details */}
                  <div className="pt-2 border-t border-slate-100 text-xs text-slate-400 space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Submitted: {formatDate(submittedTime)}</span>
                    </div>

                    {status !== 'PENDING' && (
                      <div className="flex flex-wrap items-center gap-3 text-slate-500 pt-0.5">
                        <span className="flex items-center space-x-1">
                          {status === 'REJECTED' ? (
                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          <span>Reviewed By: <strong className="text-slate-700">{approvedBy || 'Class Coordinator'}</strong></span>
                        </span>
                        {approvalTime && (
                          <span>• Reviewed At: {formatDate(approvalTime)}</span>
                        )}
                      </div>
                    )}
                    {rejectedReason && status === 'REJECTED' && (
                      <p className="mt-2 text-xs text-rose-600 italic">Rejection Reason: {rejectedReason}</p>
                    )}
                  </div>

                  {mainTab === 'MY_CLASS' && status === 'PENDING' && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end space-x-3">
                      <button
                        onClick={() => setRejectingItem(req)}
                        className="px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-semibold text-xs transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req)}
                        className="px-5 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold text-xs transition-colors shadow-xs flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve {isAct ? 'Activity' : isRemoval ? 'Removal' : 'Penalty'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-heading text-lg font-bold text-slate-900">Reject Request</h3>
            <p className="text-xs text-slate-500">
              Please enter the reason for rejecting penalty request for <span className="font-semibold text-slate-700">{rejectingItem.studentName}</span>.
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 text-sm"
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 text-slate-600 font-semibold text-xs hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 text-white font-semibold text-xs hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Confirm Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
