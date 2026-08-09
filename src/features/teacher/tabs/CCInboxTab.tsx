import { useState, useEffect } from 'react';
import { AlertTriangle, Check, RefreshCw, Clock, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../store/authContext';

interface Props {
  onBack?: () => void;
}

export default function CCInboxTab({ onBack }: Props) {
  const { subRoles } = useAuth();
  const isCC = subRoles.some((r: any) => {
    const clean = String(r).trim().toUpperCase();
    return clean === 'CC' || clean === 'CLASS_COORDINATOR' || clean === 'ROLE_CC' || clean === 'ROLE_CLASS_COORDINATOR';
  });

  const [mainTab, setMainTab] = useState<'MY_CLASS' | 'MY_REQUESTS'>(isCC ? 'MY_CLASS' : 'MY_REQUESTS');
  const [inbox, setInbox] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'ALL'>('ALL');

  const [rejectingItem, setRejectingItem] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  useEffect(() => {
    if (isCC) fetchCcInbox();
    fetchMyRequests();
  }, [isCC]);

  const handleMainTabChange = (tab: 'MY_CLASS' | 'MY_REQUESTS') => {
    setMainTab(tab);
    setActiveTab('ALL');
  };

  const fetchCcInbox = async () => {
    setIsLoading(true);
    try {
      const combined: any[] = [];

      // 1. Fetch Activity Completion Requests submitted by students matching Flutter ActivityCompletionService.getInbox()
      try {
        const actRes = await apiClient.get('/api/activity-requests/inbox');
        if (actRes.data?.success && Array.isArray(actRes.data.data)) {
          const actItems = actRes.data.data.map((item: any) => ({
            ...item,
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
        console.error("Failed to fetch activity requests inbox:", e);
      }

      // 2. Fetch Penalty requests
      try {
        let penRes;
        try {
          penRes = await apiClient.get('/api/penalties/cc-inbox');
        } catch (e) {
          penRes = await apiClient.get('/api/v1/penalties/cc-inbox');
        }

        if (penRes.data?.success) {
          const raw = penRes.data.data;
          const penItems = Array.isArray(raw) ? raw : (raw?.content || []);
          combined.push(...penItems.map((item: any) => ({ ...item, isActivityRequest: false })));
        }
      } catch (e) {
        console.error("Failed to fetch penalty CC inbox:", e);
      }

      setInbox(combined);
    } catch (e) {
      console.error("Failed to load CC inbox:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    setIsLoading(true);
    try {
      let response;
      try {
        response = await apiClient.get('/api/penalties/my-requests');
      } catch (e) {
        response = await apiClient.get('/api/v1/penalties/my-requests');
      }

      if (response.data?.success) {
        const raw = response.data.data;
        setMyRequests(Array.isArray(raw) ? raw : (raw?.content || []));
      }
    } catch (e) {
      console.error("Failed to fetch my penalty requests:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (item: any) => {
    const isAct = item.isActivityRequest || item.activityName;
    const toastId = toast.loading(isAct ? "Approving activity request..." : "Approving penalty request...");
    try {
      let response;
      if (isAct) {
        response = await apiClient.put(`/api/activity-requests/${item.id}/approve`);
      } else {
        try {
          response = await apiClient.put(`/api/penalties/${item.id}/approve`);
        } catch (e) {
          response = await apiClient.put(`/api/v1/penalties/${item.id}/approve`);
        }
      }
      toast.dismiss(toastId);
      if (response.status === 200 || response.data?.success) {
        toast.success(isAct ? "Activity request approved successfully!" : "Penalty approved successfully!");
        fetchCcInbox();
        fetchMyRequests();
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error("Failed to approve request:", e);
      toast.error(e.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingItem) return;
    const isAct = rejectingItem.isActivityRequest || rejectingItem.activityName;
    const toastId = toast.loading(isAct ? "Rejecting activity request..." : "Rejecting penalty request...");
    try {
      let response;
      if (isAct) {
        response = await apiClient.put(`/api/activity-requests/${rejectingItem.id}/reject`, {
          reason: rejectReason
        });
      } else {
        try {
          response = await apiClient.put(`/api/penalties/${rejectingItem.id}/reject`, {
            reason: rejectReason
          });
        } catch (e) {
          response = await apiClient.put(`/api/v1/penalties/${rejectingItem.id}/reject`, {
            reason: rejectReason
          });
        }
      }
      toast.dismiss(toastId);
      if (response.status === 200 || response.data?.success) {
        toast.success(isAct ? "Activity request rejected" : "Penalty rejected");
        setRejectingItem(null);
        setRejectReason('');
        fetchCcInbox();
        fetchMyRequests();
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error("Failed to reject request:", e);
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
            <h1 className="text-xl font-bold">Class Coordinator Inbox</h1>
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
          {isCC && (
            <button
              onClick={() => handleMainTabChange('MY_CLASS')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                mainTab === 'MY_CLASS' ? 'bg-teal-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Class Inbox ({inbox.length})
            </button>
          )}
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
              const isAct = req.isActivityRequest || req.activityName;
              const studentName = req.studentName || req.studentRegNo || req.student?.fullName || req.fullName || 'Student';
              const regNo = req.studentRegNo || req.registerNumber || req.regNo || req.student?.registerNumber || 'N/A';
              const activity = req.activityName || req.penaltyActivity || 'Activity Request';
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

              return (
                <div key={req.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-3">
                  {/* Top Header Row: Student Name + Type + Status Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${isAct ? 'bg-indigo-100 text-indigo-800' : 'bg-rose-100 text-rose-800'}`}>
                        {isAct ? 'Activity Request' : 'Penalty Request'}
                      </span>
                      <h3 className="font-bold text-slate-900 text-base">{studentName}</h3>
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
                          href={proofUrl}
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
                        <span>Approve {isAct ? 'Activity' : 'Penalty'}</span>
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
            <h3 className="text-lg font-bold text-slate-900">Reject Request</h3>
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
