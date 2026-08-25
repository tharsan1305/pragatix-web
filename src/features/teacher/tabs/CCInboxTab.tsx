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
          remarks: rejectReason,
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
    <div className="min-h-screen bg-bg flex flex-col pb-28 text-text-primary">
      {/* Top Header Banner */}
      <div className="bg-card text-text-primary px-6 py-5 border-b border-border flex items-center justify-between sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          {onBack && (
            <button onClick={onBack} className="p-2 border border-border bg-card hover:bg-bg rounded-lg transition-colors cursor-pointer text-text-secondary hover:text-text-primary">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">Class Coordinator Inbox</h1>
            <p className="type-caption text-text-secondary font-medium mt-0.5">Review student activity completion & penalty requests</p>
          </div>
        </div>
        <button
          onClick={() => { fetchCcInbox(); fetchMyRequests(); }}
          className="p-2 bg-card border border-border hover:bg-bg rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          title="Refresh Requests"
        >
          <RefreshCw className={`w-4 h-4 text-accent ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Tabs (My Class Requests vs My Submitted Requests) */}
      <div className="bg-card border-b border-border px-6 py-3.5 flex flex-wrap gap-3 justify-between items-center shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
        <div className="flex bg-bg p-1 rounded-xl border border-border gap-1">
          <button
            onClick={() => handleMainTabChange('MY_CLASS')}
            className={`px-4 py-2 rounded-lg type-caption font-bold transition-all cursor-pointer ${
              mainTab === 'MY_CLASS' 
                ? 'bg-card text-text-primary border border-border shadow-xs' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            My Class Inbox ({inbox.filter(r => (r.status || 'PENDING').toUpperCase() === 'PENDING').length})
          </button>
          <button
            onClick={() => handleMainTabChange('MY_REQUESTS')}
            className={`px-4 py-2 rounded-lg type-caption font-bold transition-all cursor-pointer ${
              mainTab === 'MY_REQUESTS' 
                ? 'bg-card text-text-primary border border-border shadow-xs' 
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            My Submitted Requests ({myRequests.length})
          </button>
        </div>
      </div>

      <div className="p-5 lg:p-7 xl:p-8 max-w-[1400px] mx-auto w-full space-y-6">
        {/* KPI Summary Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card p-4.5 rounded-2xl border border-border flex flex-col gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Pending Action</span>
            <div className="text-2xl font-black text-accent">{pendingList.length}</div>
            <span className="text-[11px] font-medium text-text-muted">Awaiting Triage</span>
          </div>

          <div className="bg-card p-4.5 rounded-2xl border border-border flex flex-col gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Approved Requests</span>
            <div className="text-2xl font-black text-text-primary">{approvedList.length}</div>
            <span className="text-[11px] font-medium text-text-muted">Verified & Awarded</span>
          </div>

          <div className="bg-card p-4.5 rounded-2xl border border-border flex flex-col gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Rejected Requests</span>
            <div className="text-2xl font-black text-text-secondary">{rejectedList.length}</div>
            <span className="text-[11px] font-medium text-text-muted">Returned with Note</span>
          </div>

          <div className="bg-card p-4.5 rounded-2xl border border-border flex flex-col gap-1.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Submissions</span>
            <div className="text-2xl font-black text-text-primary">{activeSourceList.length}</div>
            <span className="text-[11px] font-medium text-text-muted">Processed to Date</span>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => handleMainTabChange('MY_CLASS')}
            className={`px-4 py-2 rounded-lg type-caption font-bold transition-all cursor-pointer border ${
              mainTab === 'MY_CLASS' 
                ? 'bg-accent-tint text-accent border-accent/30 shadow-none' 
                : 'bg-bg text-text-secondary border-border hover:text-text-primary hover:bg-card'
            }`}
          >
            Class Inbox ({inbox.length})
          </button>
          <button
            onClick={() => handleMainTabChange('MY_REQUESTS')}
            className={`px-4 py-2 rounded-lg type-caption font-bold transition-all cursor-pointer border ${
              mainTab === 'MY_REQUESTS' 
                ? 'bg-accent-tint text-accent border-accent/30 shadow-none' 
                : 'bg-bg text-text-secondary border-border hover:text-text-primary hover:bg-card'
            }`}
          >
            My Requests ({myRequests.length})
          </button>
        </div>

        {/* Secondary Filter Badges */}
        <div className="flex space-x-2">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'REJECTED', label: 'Rejected' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-lg type-caption font-bold uppercase transition-all cursor-pointer border ${
                activeTab === tab.id 
                  ? 'bg-text-primary text-card border-text-primary shadow-none' 
                  : 'bg-bg text-text-secondary border-border hover:text-text-primary hover:bg-card'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-text-primary" />
          </div>
        ) : currentList.length === 0 ? (
          <div className="text-center py-16 text-text-muted bg-card rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-6">
            <AlertTriangle className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <p className="type-body-sm font-semibold text-text-primary">No {activeTab.toLowerCase()} requests found.</p>
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
                status === 'AUTO_APPROVED' || status === 'APPROVED' ? 'bg-success-tint text-success border-success/30' :
                status === 'REJECTED' ? 'bg-accent-tint text-accent border-accent/30' :
                'bg-warning-tint text-warning border-warning/30';

              const isBadge = req.isBadgeRequest || req.badgeName;
              const isAct = req.isActivityRequest || req.activityName;
              const isRemoval = req.isRemovalRequest;
              const badgeLabel = isBadge ? 'Badge Request' : isAct ? 'Activity Request' : isRemoval ? 'Removal Request' : 'Penalty Request';

              return (
                <div key={req.id} className="bg-card rounded-lg p-5 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-text-secondary transition-all space-y-3">
                  {/* Top Header Row: Student Name + Type + Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded bg-bg text-text-secondary border border-border type-fine font-bold uppercase tracking-wider">
                        {badgeLabel}
                      </span>
                      <h3 className="type-h5 text-text-primary">{studentName}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-md type-caption font-bold border uppercase tracking-wider ${statusBg}`}>
                      {status}
                    </span>
                  </div>

                  {/* Register Number */}
                  <p className="type-caption text-text-secondary">
                    Register No: <span className="text-text-primary font-bold">{regNo}</span>
                  </p>

                  <div className="h-px bg-border my-1" />

                  {/* Activity Details */}
                  <div className="space-y-1">
                    <p className="type-caption font-bold text-text-primary">
                      Activity: <span className="text-text-secondary font-medium">{activity}</span>
                    </p>
                    {!isAct && penaltyXP > 0 && (
                      <p className="type-caption font-extrabold text-accent">
                        Penalty XP: -{penaltyXP}
                      </p>
                    )}
                    {reason && (
                      <p className="type-caption text-text-secondary bg-bg p-2.5 rounded-lg border border-border mt-1">
                        <strong className="text-text-primary">Note / Reason:</strong> {reason}
                      </p>
                    )}
                    {proofUrl && (
                      <div className="pt-1">
                        <a
                          href={getSafeHref(proofUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg text-text-primary hover:bg-border-subtle rounded-lg type-caption border border-border transition font-semibold"
                        >
                          🔗 View Proof Link
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Requested Time & Reviewer Details */}
                  <div className="pt-2 border-t border-border type-caption text-text-muted space-y-1">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-text-muted" />
                      <span>Submitted: {formatDate(submittedTime)}</span>
                    </div>

                    {status !== 'PENDING' && (
                      <div className="flex flex-wrap items-center gap-3 text-text-secondary pt-0.5">
                        <span className="flex items-center space-x-1">
                          {status === 'REJECTED' ? (
                            <XCircle className="w-3.5 h-3.5 text-accent" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                          )}
                          <span>Reviewed By: <strong className="text-text-primary">{approvedBy || 'Class Coordinator'}</strong></span>
                        </span>
                        {approvalTime && (
                          <span>• Reviewed At: {formatDate(approvalTime)}</span>
                        )}
                      </div>
                    )}
                    {rejectedReason && status === 'REJECTED' && (
                      <p className="mt-2 type-caption text-accent italic">Rejection Reason: {rejectedReason}</p>
                    )}
                  </div>

                  {mainTab === 'MY_CLASS' && status === 'PENDING' && (
                    <div className="mt-4 pt-3 border-t border-border flex justify-end space-x-3">
                      <button
                        onClick={() => setRejectingItem(req)}
                        className="px-4 py-2 text-text-secondary bg-bg hover:bg-border-subtle border border-border rounded-lg type-btn transition-colors cursor-pointer"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req)}
                        className="px-5 py-2 text-card bg-accent hover:bg-accent-hover rounded-lg type-btn transition-colors shadow-none flex items-center space-x-1.5 cursor-pointer font-bold"
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card text-text-primary border border-border rounded-lg max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="type-h4 text-text-primary">Reject Request</h3>
            <p className="type-caption text-text-secondary">
              Please enter the reason for rejecting request for <span className="font-semibold text-text-primary">{rejectingItem.studentName}</span>.
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Enter rejection reason..."
                className="w-full p-3 bg-card border border-border rounded-lg outline-none focus:border-text-primary text-text-primary type-body-sm"
              />
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setRejectingItem(null)}
                  className="px-4 py-2 border border-border text-text-secondary type-btn hover:bg-bg rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent text-card type-btn hover:bg-accent-hover rounded-lg shadow-none cursor-pointer font-bold"
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
