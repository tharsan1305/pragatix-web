import { useState, useEffect } from 'react';
import { Medal, UserMinus, CheckCircle2, XCircle, Link, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../store/authContext';
import apiClient from '../../../services/apiClient';
import { getSafeHref } from '../../../core/utils/url';

export default function RemovalRequestsTab() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'badges' | 'removals'>('badges');
  
  const [isBadgeLoading, setIsBadgeLoading] = useState(true);
  const [pendingBadgeClaims, setPendingBadgeClaims] = useState<any[]>([]);
  
  const [isRemovalsLoading, setIsRemovalsLoading] = useState(true);
  const [pendingRemovalRequests, setPendingRemovalRequests] = useState<any[]>([]);

  useEffect(() => {
    fetchBadgeClaims();
    fetchRemovalRequests();
  }, [token]);

  const fetchBadgeClaims = async () => {
    setIsBadgeLoading(true);
    try {
      const response = await apiClient.get('/api/v1/badges/pending');
      if (response.data.success) {
        const rawClaims: any[] = response.data.data || [];
        // Deduplicate claims by unique claim ID or key
        const uniqueClaims = Array.from(
          new Map(rawClaims.map((item: any) => [item.id ?? `${item.regNo || item.studentRegNo}_${item.badgeName || item.badge?.name}_${item.evidenceUrl}`, item])).values()
        );
        setPendingBadgeClaims(uniqueClaims);
      }
    } catch (error) {
      console.error("Failed to fetch pending badge claims:", error);
      setPendingBadgeClaims([]);
    } finally {
      setIsBadgeLoading(false);
    }
  };

  const fetchRemovalRequests = async () => {
    setIsRemovalsLoading(true);
    try {
      const response = await apiClient.get('/api/v1/teams/removal-requests/pending');
      if (response.data.success) {
        setPendingRemovalRequests(response.data.data || []);
      }
    } catch {
      // mock or ignore
      setPendingRemovalRequests([]);
    } finally {
      setIsRemovalsLoading(false);
    }
  };

  const approveClaim = async (claimId: number, badgeName: string) => {
    const toastId = toast.loading(`Approving ${badgeName}...`);
    try {
      const response = await apiClient.post(`/api/v1/cc/badge-requests/${claimId}/action`, {
        action: 'APPROVE',
        rejectionReason: ''
      });
      toast.dismiss(toastId);
      if (response.data.success) {
        toast.success(`Badge '${badgeName}' successfully approved!`);
        setPendingBadgeClaims(prev => prev.filter(c => c.id !== claimId));
      } else {
        toast.error(response.data.message || 'Failed to approve badge.');
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(`Error approving claim: ${e.response?.data?.message || e.message}`);
    }
  };

  const rejectClaim = async (claimId: number, badgeName: string) => {
    const toastId = toast.loading(`Rejecting ${badgeName}...`);
    try {
      const response = await apiClient.post(`/api/v1/cc/badge-requests/${claimId}/action`, {
        action: 'REJECT',
        rejectionReason: 'Rejected by Coordinator'
      });
      toast.dismiss(toastId);
      if (response.data.success) {
        toast.success(`Badge '${badgeName}' rejected.`);
        setPendingBadgeClaims(prev => prev.filter(c => c.id !== claimId));
      } else {
        toast.error(response.data.message || 'Failed to reject claim.');
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(`Error rejecting claim: ${e.response?.data?.message || e.message}`);
    }
  };

  const handleRemovalRequest = async (id: number, approve: boolean) => {
    const toastId = toast.loading(`Processing removal request...`);
    try {
      const endpoint = approve ? "approve" : "reject";
      const response = await apiClient.put(`/api/v1/teams/removal-requests/${id}/${endpoint}`);
      toast.dismiss(toastId);
      if (response.data.success) {
        toast.success(`Request ${approve ? "approved" : "rejected"} successfully`);
        fetchRemovalRequests();
      } else {
        toast.error(response.data.message || 'Failed to update request');
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(`Error: ${e.message}`);
    }
  };

  const renderBadgeClaims = () => {
    if (isBadgeLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      );
    }

    if (pendingBadgeClaims.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <Medal className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-sm font-medium">No pending badge claims to approve!</p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4">
        {pendingBadgeClaims.map(claim => {
          const studentName = claim.studentName || claim.fullName || claim.student?.fullName || claim.student?.studentName || claim.username || "Unknown Student";
          const rollNo = claim.regNo || claim.studentRegNo || claim.studentId || claim.student?.studentId || claim.student?.regNo || claim.sprNo || claim.rollNo || "";
          const badgeName = claim.badgeName || claim.badge?.name || claim.activityName || "";
          const tier = claim.tier || claim.badge?.tier || claim.category || claim.badgeTier || "BADGE CLAIM";

          return (
            <div key={claim.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-[16px] text-slate-800">{studentName}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Roll No: {rollNo}</p>
                  </div>
                  <div className="bg-teal-50 text-teal-700 px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider">
                    {tier}
                  </div>
                </div>
                
                <div className="h-px bg-slate-100 my-3" />
                
                <div className="flex items-center gap-2 mb-3">
                  <Medal className="w-5 h-5 text-amber-500" />
                  <span className="font-semibold text-sm text-slate-800">
                    Claiming Badge: {badgeName}
                  </span>
                </div>
                
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex gap-2 items-start">
                  <Link className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <a href={getSafeHref(claim.evidenceUrl)} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline break-all">
                    {claim.evidenceUrl || "No evidence provided"}
                  </a>
                </div>
              </div>
              
              <div className="bg-slate-50 border-t border-slate-100 p-3 flex justify-end gap-3">
                <button 
                  onClick={() => rejectClaim(claim.id, badgeName)}
                  className="px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                >
                  Reject
                </button>
                <button 
                  onClick={() => approveClaim(claim.id, badgeName)}
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" /> Approve Claim
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderGroupRemovals = () => {
    if (isRemovalsLoading) {
      return (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      );
    }

    if (pendingRemovalRequests.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-slate-400">
          <UserMinus className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-sm font-medium">No pending group removal requests!</p>
        </div>
      );
    }

    return (
      <div className="p-4 space-y-4">
        {pendingRemovalRequests.map(req => (
          <div key={req.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[15px] text-slate-800">Remove {req.studentName}</h3>
              <div className="text-xs text-slate-600 mt-2 space-y-1">
                <p><span className="font-semibold">From:</span> {req.teamName}</p>
                <p><span className="font-semibold">Requested by:</span> {req.captainName}</p>
                <p><span className="font-semibold">Reason:</span> {req.reason}</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-2 shrink-0">
              <button 
                onClick={() => handleRemovalRequest(req.id, true)}
                className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                title="Approve"
              >
                <CheckCircle2 className="w-6 h-6" />
              </button>
              <button 
                onClick={() => handleRemovalRequest(req.id, false)}
                className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                title="Reject"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-slate-800 text-white sticky top-0 z-10 shadow-md">
        <div className="px-6 py-4">
          <h1 className="text-xl font-bold">Approvals & Requests</h1>
        </div>
        <div className="flex border-t border-slate-700">
          <button 
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex justify-center items-center gap-2 ${activeTab === 'badges' ? 'border-teal-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('badges')}
          >
            <Medal className="w-4 h-4" /> Badge Claims
          </button>
          <button 
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex justify-center items-center gap-2 ${activeTab === 'removals' ? 'border-teal-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('removals')}
          >
            <UserMinus className="w-4 h-4" /> Group Removals
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'badges' ? renderBadgeClaims() : renderGroupRemovals()}
      </div>
    </div>
  );
}
