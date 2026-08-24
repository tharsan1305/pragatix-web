import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { Award, Check, RefreshCw, ExternalLink, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import { getSafeHref } from '../../../core/utils/url';

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
      let response = null;
      try {
        response = await apiClient.get('/api/admin/badge-requests');
      } catch (_e1) {
        try {
          response = await apiClient.get('/api/cc/badge-requests');
        } catch (_e2) {
          response = null;
        }
      }

      if (response && response.data?.success) {
        const raw = response.data.data;
        const list = Array.isArray(raw) ? raw : (raw?.content || []);
        setRequests(list);
        filterList(list, selectedStatus);
      } else {
        setRequests([]);
        filterList([], selectedStatus);
      }
    } catch (e) {
      logger.error("Failed to fetch badge requests:", e);
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
    const approveEndpoints = [
      `/api/admin/badge-requests/${id}/approve`,
      `/api/cc/badge-requests/${id}/approve`,
      `/api/v1/admin/badge-requests/${id}/approve`,
      `/api/v1/badges/${id}/approve`
    ];

    let success = false;
    let lastError: any = null;

    for (const endpoint of approveEndpoints) {
      try {
        const response = await apiClient.put(endpoint);
        if (response.status === 200 || response.data?.success) {
          success = true;
          break;
        }
      } catch (e: any) {
        lastError = e;
      }
    }

    toast.dismiss(toastId);
    if (success) {
      toast.success("Badge request approved successfully");
      fetchRequests();
    } else {
      logger.error("Failed to approve badge request:", lastError);
      toast.error(lastError?.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingReq) return;
    const toastId = toast.loading("Rejecting badge request...");

    const rejectEndpoints = [
      `/api/admin/badge-requests/${rejectingReq.id}/reject`,
      `/api/cc/badge-requests/${rejectingReq.id}/reject`,
      `/api/v1/admin/badge-requests/${rejectingReq.id}/reject`,
      `/api/v1/badges/${rejectingReq.id}/reject`
    ];

    let success = false;
    let lastError: any = null;

    for (const endpoint of rejectEndpoints) {
      try {
        const response = await apiClient.put(endpoint, {
          remarks: rejectReason,
          reason: rejectReason,
        });
        if (response.status === 200 || response.data?.success) {
          success = true;
          break;
        }
      } catch (e: any) {
        lastError = e;
      }
    }

    toast.dismiss(toastId);
    if (success) {
      toast.success("Badge request rejected");
      setRejectingReq(null);
      setRejectReason('');
      fetchRequests();
    } else {
      logger.error("Failed to reject badge request:", lastError);
      toast.error(lastError?.response?.data?.message || 'Failed to reject request');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 relative pb-20">
      {/* Header Bar */}
      <div className="bg-[#1E293B] px-6 pt-10 pb-5 shadow-md text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button onClick={onBack} className="p-2 type-btn bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="type-h3">Badge Requests Approval</h1>
              <p className="type-caption text-slate-400 mt-0.5">Review student badge applications, proof files, and status decisions</p>
            </div>
          </div>
          <button onClick={fetchRequests} className="p-2 type-btn bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors" title="Refresh">
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
                  className={`px-4 py-1.5 rounded-full type-caption font-bold transition-all flex items-center space-x-1.5 ${
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
              className="w-full px-3 py-1.5 bg-slate-800 text-white placeholder-slate-400 type-body-sm rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
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
              const remarksText = req.remarks || req.reason;

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
                        <h3 className="type-h5 text-slate-900">{badgeName}</h3>
                        <p className="type-caption text-slate-600 font-medium">{studentName} <span className="text-slate-400">({regNo})</span></p>
                        {(req.departmentName || req.sectionName || req.academicYear) && (
                          <p className="type-fine text-slate-400 mt-0.5">
                            {[req.departmentName, req.sectionName ? `Sec ${req.sectionName}` : null, req.academicYear].filter(Boolean).join(' • ')}
                          </p>
                        )}
                        {remarksText && (
                          <p className="type-caption text-slate-600 italic mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                            Remarks: "{remarksText}"
                          </p>
                        )}
                        {req.reviewedBy && (
                          <p className="type-fine text-slate-400 mt-1">
                            Reviewed by: <span className="font-medium text-slate-600">{req.reviewedBy}</span>
                            {req.reviewedAt && ` on ${new Date(req.reviewedAt).toLocaleDateString()}`}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-end md:self-center">
                      {proofLink && (
                        <a
                          href={getSafeHref(proofLink)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="type-caption text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>View Proof</span>
                        </a>
                      )}

                      {status === 'PENDING' ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl type-btn transition-colors flex items-center space-x-1 shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectingReq(req);
                              setRejectReason('');
                            }}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl type-btn transition-colors flex items-center space-x-1 shadow-xs cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1 rounded-full type-caption font-bold flex items-center space-x-1 ${
                          status === 'APPROVED' 
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                            : status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {status === 'APPROVED' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          <span>{status}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="type-h4 text-slate-900">Reject Badge Request</h3>
                <p className="type-caption text-slate-500">{rejectingReq.badgeName || 'Badge'} for {rejectingReq.studentName || 'Student'}</p>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="type-form-label text-slate-700 mb-1 block">Reason for Rejection *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this badge claim is being rejected..."
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 type-body-sm bg-white resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingReq(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 text-slate-600 type-btn hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold type-btn rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
