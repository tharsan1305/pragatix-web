import { useState, useEffect } from 'react';
import { Award, Check, RefreshCw, ExternalLink, ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

interface Props {
  onBack?: () => void;
}

export default function AdminBadgeRequestsTab({ onBack }: Props) {
  const [requests, setRequests] = useState<any[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [rejectingReq, setRejectingReq] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      let response;
      try {
        response = await apiClient.get('/api/admin/badge-requests');
      } catch (_e) {
        response = await apiClient.get('/api/v1/admin/badge-requests');
      }

      if (response.data?.success) {
        const raw = response.data.data;
        const list = Array.isArray(raw) ? raw : (raw?.content || []);
        setRequests(list);
        filterList(list, selectedStatus);
      }
    } catch (e) {
      console.error("Failed to fetch badge requests:", e);
      toast.error("Failed to fetch badge requests");
    } finally {
      setIsLoading(false);
    }
  };

  const filterList = (list: any[], status: string, search: string = searchQuery) => {
    setSelectedStatus(status);
    const statusUpper = status.toUpperCase();
    const query = search.toLowerCase().trim();

    const filtered = list.filter(r => {
      const matchStatus = (r.status || 'PENDING').toUpperCase() === statusUpper;
      if (!matchStatus) return false;
      if (!query) return true;

      const studentName = (r.studentName || r.student?.fullName || r.fullName || '').toLowerCase();
      const regNo = (r.regNo || r.registerNumber || r.student?.registerNumber || '').toLowerCase();
      const badgeName = (r.badgeName || r.badge?.title || r.badgeTitle || '').toLowerCase();
      const deptName = (r.departmentName || '').toLowerCase();

      return studentName.includes(query) || regNo.includes(query) || badgeName.includes(query) || deptName.includes(query);
    });

    setFilteredRequests(filtered);
  };

  const getStatusCount = (status: string) => {
    return requests.filter(r => (r.status || 'PENDING').toUpperCase() === status.toUpperCase()).length;
  };

  const handleApprove = async (id: number) => {
    const toastId = toast.loading("Approving badge request...");
    try {
      let response;
      try {
        response = await apiClient.put(`/api/admin/badge-requests/${id}/approve`);
      } catch (_e) {
        response = await apiClient.put(`/api/v1/admin/badge-requests/${id}/approve`);
      }
      toast.dismiss(toastId);
      if (response.status === 200 || response.data?.success) {
        toast.success("Badge request approved successfully");
        fetchRequests();
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error("Failed to approve badge request:", e);
      toast.error(e.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReq) return;
    const toastId = toast.loading("Rejecting badge request...");
    try {
      let response;
      try {
        response = await apiClient.put(`/api/admin/badge-requests/${rejectingReq.id}/reject`, {
          reason: rejectReason
        });
      } catch (_e) {
        response = await apiClient.put(`/api/v1/admin/badge-requests/${rejectingReq.id}/reject`, {
          reason: rejectReason
        });
      }
      toast.dismiss(toastId);
      if (response.status === 200 || response.data?.success) {
        toast.success("Badge request rejected");
        setRejectingReq(null);
        setRejectReason('');
        fetchRequests();
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error("Failed to reject badge request:", e);
      toast.error(e.response?.data?.message || 'Failed to reject request');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 relative pb-20">
      {/* Header Bar */}
      <div className="bg-[#1E293B] px-6 pt-10 pb-5 shadow-md text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold">Badge Requests Approval</h1>
              <p className="text-xs text-slate-400 mt-0.5">Review student badge applications, proof files, and status decisions</p>
            </div>
          </div>
          <button onClick={fetchRequests} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors" title="Refresh">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Status Filter Chips & Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex space-x-2">
            {['PENDING', 'APPROVED', 'REJECTED'].map(st => {
              const active = selectedStatus === st;
              const count = getStatusCount(st);
              return (
                <button
                  key={st}
                  onClick={() => filterList(requests, st, searchQuery)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-1.5 ${
                    active 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <span>{st}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    active ? 'bg-slate-900 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by name, regNo, badge..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                filterList(requests, selectedStatus, e.target.value);
              }}
              className="w-full px-3 py-1.5 bg-slate-800 text-white placeholder-slate-400 text-xs rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No {selectedStatus.toLowerCase()} badge requests found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map(req => {
              const studentName = req.studentName || req.student?.fullName || req.fullName || 'Student';
              const regNo = req.regNo || req.registerNumber || req.student?.registerNumber || 'N/A';
              const badgeName = req.badgeName || req.badge?.title || req.badgeTitle || 'Badge Request';
              const badgeIcon = req.badgeIcon || req.badge?.icon;
              const proofLink = req.proofLink || req.proofUrl || req.documentUrl;
              const status = (req.status || 'PENDING').toUpperCase();

              return (
                <div key={req.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shrink-0 border border-amber-200/60">
                        {badgeIcon ? (
                          <img src={badgeIcon} alt="badge" className="w-7 h-7 object-contain" onError={(e: any) => { e.target.style.display='none'; }} />
                        ) : (
                          <Award className="w-6 h-6" />
                        )}
                      </div>

                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{badgeName}</h3>
                        <p className="text-xs text-slate-600 font-medium">{studentName} <span className="text-slate-400">({regNo})</span></p>
                        {req.departmentName && (
                          <p className="text-[11px] text-slate-400 mt-0.5">{req.departmentName} • {req.sectionName || 'Section'}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 self-end md:self-center">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 ${
                        status === 'APPROVED' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                          : status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {status === 'APPROVED' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {status === 'REJECTED' && <XCircle className="w-3.5 h-3.5" />}
                        {status === 'PENDING' && <Clock className="w-3.5 h-3.5" />}
                        <span>{status}</span>
                      </span>
                    </div>
                  </div>

                  {proofLink && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center space-x-2">
                      <ExternalLink className="w-4 h-4 text-blue-600" />
                      <a 
                        href={proofLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        View Verification Proof Document
                      </a>
                    </div>
                  )}

                  {req.reviewedBy && (
                    <div className="mt-3 text-[11px] text-slate-400">
                      Reviewed by {req.reviewedBy} {req.reviewedAt ? `on ${new Date(req.reviewedAt).toLocaleDateString()}` : ''}
                    </div>
                  )}

                  {status === 'PENDING' && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end space-x-3">
                      <button
                        onClick={() => setRejectingReq(req)}
                        className="px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl font-semibold text-xs transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="px-5 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl font-semibold text-xs transition-colors shadow-xs flex items-center space-x-1.5"
                      >
                        <Check className="w-4 h-4" />
                        <span>Approve Request</span>
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
      {rejectingReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Reject Badge Request</h3>
            <p className="text-xs text-slate-500">
              Please state the reason for rejecting <span className="font-semibold text-slate-700">{rejectingReq.badgeName || 'this badge request'}</span> for {rejectingReq.studentName}.
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
                  onClick={() => setRejectingReq(null)}
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
