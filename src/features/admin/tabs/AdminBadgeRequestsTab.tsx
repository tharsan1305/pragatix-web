import { logger } from '../../../utils/logger';
import { useState, useEffect, useMemo } from 'react';
import { 
  Award, Check, RefreshCw, ExternalLink, ArrowLeft, XCircle, 
  Search, X, Eye, FilterX
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import { getSafeHref } from '../../../core/utils/url';
import { useAuth } from '../../../store/authContext';
import { ROLE_ACCESS, getEffectiveRole } from '../../../config/roleAccess';

interface Props {
  onBack?: () => void;
}

export default function AdminBadgeRequestsTab({ onBack }: Props) {
  const auth = useAuth();
  const { user, isSuperAdmin, isHOD, isAdmin, role, subRoles } = auth;
  const effectiveRole = getEffectiveRole(user, { isSuperAdmin, isHOD, isAdmin, role, subRoles });
  const roleConfig = ROLE_ACCESS[effectiveRole];

  const userYear = user?.academicYear || user?.assignedYear || user?.year || (user?.adminDetails?.academicYear);
  const userDept = user?.department || user?.departmentName || user?.dept || (user?.superAdminDetails?.department);

  const scopeLabel = roleConfig.dataScope === 'institution'
    ? 'INSTITUTION SCOPE'
    : roleConfig.dataScope === 'year'
    ? `ADMIN SCOPE: ${userYear || 'ASSIGNED YEAR'}`
    : `HOD SCOPE: ${userDept || 'YOUR DEPARTMENT'}`;

  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Filters
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [selectedSection, setSelectedSection] = useState<string>('All');
  const [selectedBadge, setSelectedBadge] = useState<string>('All');

  // Modals
  const [rejectingReq, setRejectingReq] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const [previewReq, setPreviewReq] = useState<any>(null);

  useEffect(() => {
    fetchRequests();
  }, [roleConfig.dataScope, userYear, userDept]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      let response = null;
      try {
        response = await apiClient.get('/api/admin/badge-requests', {
          params: {
            scope: roleConfig.dataScope,
            year: userYear,
            department: userDept,
            departmentId: user?.departmentId
          }
        });
      } catch (_e1) {
        try {
          response = await apiClient.get('/api/cc/badge-requests', {
            params: {
              scope: roleConfig.dataScope,
              year: userYear,
              department: userDept,
              departmentId: user?.departmentId
            }
          });
        } catch (_e2) {
          response = null;
        }
      }

      if (response && response.data?.success) {
        const raw = response.data.data;
        let list: any[] = Array.isArray(raw) ? raw : (raw?.content || []);

        // Client-side defense-in-depth scoping
        if (roleConfig.dataScope === 'department' && userDept) {
          const deptQuery = userDept.toLowerCase().trim();
          list = list.filter(r => {
            const rDept = (r.departmentName || r.dept || r.department || r.student?.department || '').toLowerCase();
            return !rDept || rDept.includes(deptQuery) || deptQuery.includes(rDept);
          });
        } else if (roleConfig.dataScope === 'year' && userYear) {
          const yearStr = String(userYear).toLowerCase().replace(/[^0-9]/g, '');
          if (yearStr) {
            list = list.filter(r => {
              const rYear = String(r.academicYear || r.year || r.student?.year || '').toLowerCase().replace(/[^0-9]/g, '');
              return !rYear || rYear === yearStr;
            });
          }
        }

        setRequests(list);
      } else {
        setRequests([]);
      }
    } catch (e) {
      logger.error("Failed to fetch badge requests:", e);
      toast.error("Failed to fetch badge requests");
    } finally {
      setIsLoading(false);
    }
  };

  // Extract unique filter options from loaded dataset
  const availableYears = useMemo(() => {
    const set = new Set<string>();
    requests.forEach(r => {
      const y = r.academicYear || r.year || r.yearName || r.student?.year || r.student?.academicYear;
      if (y) set.add(String(y).trim());
    });
    const sorted = Array.from(set).sort();
    return ['All', ...sorted];
  }, [requests]);

  const availableDepts = useMemo(() => {
    const set = new Set<string>();
    requests.forEach(r => {
      const d = r.departmentName || r.dept || r.department || r.student?.department || r.student?.departmentName;
      if (d) set.add(String(d).trim());
    });
    const sorted = Array.from(set).sort();
    return ['All', ...sorted];
  }, [requests]);

  const availableSections = useMemo(() => {
    const set = new Set<string>();
    requests.forEach(r => {
      const s = r.sectionName || r.section || r.student?.section || r.student?.sectionName;
      if (s) set.add(String(s).trim());
    });
    const sorted = Array.from(set).sort();
    return ['All', ...sorted];
  }, [requests]);

  const availableBadges = useMemo(() => {
    const set = new Set<string>();
    requests.forEach(r => {
      const b = r.badgeName || r.badge?.title || r.badgeTitle || r.title;
      if (b) set.add(String(b).trim());
    });
    const sorted = Array.from(set).sort();
    return ['All', ...sorted];
  }, [requests]);

  // Master Filter Pipeline
  const filteredRequests = useMemo(() => {
    const statusUpper = selectedStatus.toUpperCase();
    const q = searchQuery.toLowerCase().trim();

    return requests.filter(r => {
      // 1. Status Filter
      const matchStatus = (r.status || 'PENDING').toUpperCase() === statusUpper;
      if (!matchStatus) return false;

      // 2. Academic Year Filter
      if (selectedYear !== 'All') {
        const rYear = String(r.academicYear || r.year || r.yearName || r.student?.year || r.student?.academicYear || '').toLowerCase();
        const targetYear = selectedYear.toLowerCase();
        if (!rYear.includes(targetYear) && !targetYear.includes(rYear)) return false;
      }

      // 3. Department Filter
      if (selectedDept !== 'All') {
        const rDept = String(r.departmentName || r.dept || r.department || r.student?.department || r.student?.departmentName || '').toLowerCase();
        const targetDept = selectedDept.toLowerCase();
        if (!rDept.includes(targetDept) && !targetDept.includes(rDept)) return false;
      }

      // 4. Section Filter
      if (selectedSection !== 'All') {
        const rSec = String(r.sectionName || r.section || r.student?.section || r.student?.sectionName || '').toLowerCase();
        const targetSec = selectedSection.toLowerCase();
        if (rSec !== targetSec && !rSec.includes(targetSec)) return false;
      }

      // 5. Badge Filter
      if (selectedBadge !== 'All') {
        const rBadge = String(r.badgeName || r.badge?.title || r.badgeTitle || r.title || '').toLowerCase();
        const targetBadge = selectedBadge.toLowerCase();
        if (!rBadge.includes(targetBadge) && !targetBadge.includes(rBadge)) return false;
      }

      // 6. Search Query Filter
      if (q) {
        const studentName = String(r.studentName || r.student?.fullName || r.fullName || '').toLowerCase();
        const regNo = String(r.regNo || r.registerNumber || r.student?.registerNumber || '').toLowerCase();
        const badgeName = String(r.badgeName || r.badge?.title || r.badgeTitle || '').toLowerCase();
        const deptName = String(r.departmentName || r.dept || '').toLowerCase();
        const secName = String(r.sectionName || r.section || '').toLowerCase();

        const matched = studentName.includes(q) || regNo.includes(q) || badgeName.includes(q) || deptName.includes(q) || secName.includes(q);
        if (!matched) return false;
      }

      return true;
    });
  }, [requests, selectedStatus, selectedYear, selectedDept, selectedSection, selectedBadge, searchQuery]);

  const hasActiveFilters = selectedYear !== 'All' || selectedDept !== 'All' || selectedSection !== 'All' || selectedBadge !== 'All' || !!searchQuery.trim();

  const resetFilters = () => {
    setSelectedYear('All');
    setSelectedDept('All');
    setSelectedSection('All');
    setSelectedBadge('All');
    setSearchQuery('');
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
    <div className="flex flex-col min-h-full bg-bg relative pb-20">
      {/* Top Header Bar */}
      <div className="bg-card px-6 py-5 border-b border-border text-text-primary sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3.5">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="type-h3 font-bold text-text-primary tracking-tight">Badge Requests Approval</h1>
                <span className="px-2.5 py-0.5 rounded-md type-fine font-bold uppercase bg-bg text-text-secondary border border-border tracking-wider">
                  {scopeLabel}
                </span>
              </div>
              <p className="type-caption text-text-secondary font-medium mt-0.5">
                Review student badge applications, examine proof files, and make approvals
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchRequests}
              disabled={isLoading}
              className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh requests"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-accent' : ''}`} />
            </button>
          </div>
        </div>

        {/* Status Tab Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-border-subtle">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'PENDING', label: 'Pending', count: getStatusCount('PENDING'), activeClass: 'bg-accent-tint text-accent border-accent/30', countClass: 'bg-accent text-card' },
              { id: 'APPROVED', label: 'Approved', count: getStatusCount('APPROVED'), activeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300', countClass: 'bg-emerald-600 text-white' },
              { id: 'REJECTED', label: 'Rejected', count: getStatusCount('REJECTED'), activeClass: 'bg-rose-50 text-rose-800 border-rose-300', countClass: 'bg-rose-600 text-white' }
            ].map(st => {
              const isActive = selectedStatus === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  className={`px-4 py-2 rounded-lg type-caption font-bold transition-all flex items-center space-x-2 cursor-pointer border ${
                    isActive
                      ? `${st.activeClass} shadow-none`
                      : 'bg-bg text-text-secondary border-border hover:text-text-primary hover:bg-card'
                  }`}
                >
                  <span>{st.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    isActive ? st.countClass : 'bg-card text-text-secondary border border-border'
                  }`}>
                    {st.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Counter Info */}
          <div className="type-fine text-text-secondary font-medium hidden sm:block">
            Showing <strong className="text-text-primary">{filteredRequests.length}</strong> {selectedStatus.toLowerCase()} requests
          </div>
        </div>
      </div>

      {/* Multi-Dimensional Filter Toolbar */}
      <div className="bg-card p-4 border-b border-border z-10 sticky top-[120px] shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="max-w-6xl mx-auto w-full flex flex-wrap items-center gap-3">
          {/* Live Search Input */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student, regNo, badge..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchRequests();
                }
              }}
              className="w-full pl-9 pr-8 py-2 bg-bg text-text-primary placeholder:text-text-muted type-body-sm font-semibold rounded-lg border border-border focus:border-text-primary outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Academic Year Filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="min-w-[130px] bg-bg border border-border rounded-lg px-3 py-2 type-caption font-bold text-text-primary focus:border-text-primary cursor-pointer"
          >
            <option value="All">All Years</option>
            {availableYears.filter(y => y !== 'All').map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="min-w-[160px] bg-bg border border-border rounded-lg px-3 py-2 type-caption font-bold text-text-primary focus:border-text-primary cursor-pointer"
          >
            <option value="All">All Departments</option>
            {availableDepts.filter(d => d !== 'All').map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>

          {/* Section Filter */}
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
            className="min-w-[120px] bg-bg border border-border rounded-lg px-3 py-2 type-caption font-bold text-text-primary focus:border-text-primary cursor-pointer"
          >
            <option value="All">All Sections</option>
            {availableSections.filter(s => s !== 'All').map(s => (
              <option key={s} value={s}>{s.startsWith('Section') || s.startsWith('Sec') ? s : `Sec ${s}`}</option>
            ))}
          </select>

          {/* Badge Type Filter */}
          <select
            value={selectedBadge}
            onChange={(e) => setSelectedBadge(e.target.value)}
            className="min-w-[150px] bg-bg border border-border rounded-lg px-3 py-2 type-caption font-bold text-text-primary focus:border-text-primary cursor-pointer"
          >
            <option value="All">All Badges</option>
            {availableBadges.filter(b => b !== 'All').map(b => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>

          {/* Search Action Button */}
          <button
            onClick={() => fetchRequests()}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-card type-caption font-bold rounded-lg transition-colors flex items-center space-x-1.5 shadow-none cursor-pointer shrink-0"
            title="Search & Refresh records from Database"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="px-3 py-2 bg-accent-tint text-accent border border-accent/20 hover:bg-accent/20 rounded-lg type-caption font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
              title="Reset all active filters"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Request Cards List */}
      <div className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-4">
        {isLoading ? (
          <div className="flex flex-col h-64 items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-accent" />
            <p className="type-body-sm text-text-secondary font-medium">Loading badge applications...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-8 space-y-3 flex flex-col items-center">
            <div className="w-14 h-14 rounded-lg bg-bg border border-border flex items-center justify-center text-text-muted mb-1">
              <Award className="w-7 h-7" />
            </div>
            <p className="type-h4 font-bold text-text-primary">No {selectedStatus.toLowerCase()} badge requests found</p>
            <p className="type-body-sm text-text-secondary font-medium max-w-md">
              {hasActiveFilters
                ? 'No requests match your current filter parameters. Try resetting filters or changing the status tab.'
                : `There are currently no ${selectedStatus.toLowerCase()} requests in this queue.`}
            </p>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="mt-3 px-5 py-2.5 bg-accent hover:bg-accent-hover text-card type-btn font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-none"
              >
                <FilterX className="w-4 h-4" />
                <span>Clear All Filters</span>
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredRequests.map(req => {
              const studentName = req.studentName || req.student?.fullName || req.fullName || 'Student';
              const regNo = req.regNo || req.registerNumber || req.student?.registerNumber || 'N/A';
              const badgeName = req.badgeName || req.badge?.title || req.badgeTitle || 'Badge Request';
              const badgeIcon = req.badgeIcon || req.badge?.icon;
              const proofLink = req.proofLink || req.proofUrl || req.documentUrl;
              const status = (req.status || 'PENDING').toUpperCase();
              const remarksText = req.remarks || req.reason;
              const deptName = req.departmentName || req.dept || req.department || req.student?.department || '—';
              const yearName = req.academicYear || req.year || req.student?.year || '—';
              const secName = req.sectionName || req.section || req.student?.section || '—';

              return (
                <div 
                  key={req.id} 
                  className="bg-card rounded-lg p-5 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-accent/40 transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Left: Badge Icon & Student Metadata */}
                    <div className="flex items-start space-x-4 min-w-0 flex-1">
                      <div className="w-12 h-12 bg-bg rounded-lg flex items-center justify-center text-text-primary shrink-0 border border-border">
                        {badgeIcon ? (
                          <img src={badgeIcon} alt="badge" className="w-8 h-8 object-contain" onError={(e: any) => { e.target.style.display='none'; }} />
                        ) : (
                          <Award className="w-6 h-6 text-accent" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="type-h4 font-bold text-text-primary truncate">{badgeName}</h3>
                          <span className="bg-bg border border-border text-text-secondary text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                            ID: #{req.id}
                          </span>
                        </div>

                        {/* Student Name & RegNo */}
                        <div className="flex items-center gap-2 flex-wrap text-text-primary type-body-sm font-bold mt-1">
                          <span>{studentName}</span>
                          <span className="text-text-muted font-normal text-[12px]">({regNo})</span>
                        </div>

                        {/* Department, Year, Section Badges */}
                        <div className="flex items-center gap-2 flex-wrap type-fine text-text-secondary font-medium mt-1.5">
                          <span className="bg-bg border border-border px-2 py-0.5 rounded">
                            {deptName}
                          </span>
                          <span className="bg-bg border border-border px-2 py-0.5 rounded">
                            {yearName.startsWith('Year') ? yearName : `Year ${yearName}`}
                          </span>
                          <span className="bg-bg border border-border px-2 py-0.5 rounded">
                            Sec {secName}
                          </span>
                        </div>

                        {/* Remarks / Rejection Reason */}
                        {remarksText && (
                          <div className="type-caption text-text-primary mt-2 bg-bg p-2.5 rounded-lg border border-border">
                            <span className="font-bold text-text-secondary">Remarks: </span>
                            <span className="italic">"{remarksText}"</span>
                          </div>
                        )}

                        {/* Reviewer Details */}
                        {req.reviewedBy && (
                          <p className="type-fine text-text-muted mt-2">
                            Reviewed by: <strong className="text-text-secondary">{req.reviewedBy}</strong>
                            {req.reviewedAt && ` on ${new Date(req.reviewedAt).toLocaleDateString()}`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Proof Link & Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-center">
                      {proofLink && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => {
                              setPreviewProofUrl(proofLink);
                              setPreviewReq(req);
                            }}
                            className="type-caption font-bold text-text-primary flex items-center space-x-1.5 py-2 px-3 bg-bg hover:bg-card border border-border rounded-lg transition-colors cursor-pointer"
                            title="Preview Proof Document"
                          >
                            <Eye className="w-3.5 h-3.5 text-accent" />
                            <span>Preview</span>
                          </button>
                          <a
                            href={getSafeHref(proofLink)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="type-caption font-bold text-text-primary flex items-center space-x-1 py-2 px-2.5 bg-bg hover:bg-card border border-border rounded-lg transition-colors"
                            title="Open Link in New Tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-text-muted" />
                          </a>
                        </div>
                      )}

                      {status === 'PENDING' ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg type-caption font-bold transition-colors flex items-center space-x-1.5 shadow-none cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => {
                              setRejectingReq(req);
                              setRejectReason('');
                            }}
                            className="px-4 py-2 bg-card border border-border text-text-secondary hover:text-accent hover:bg-accent-tint rounded-lg type-caption font-bold transition-colors flex items-center space-x-1.5 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <span className={`px-3 py-1.5 rounded-lg type-caption font-bold flex items-center space-x-1.5 border uppercase ${
                          status === 'APPROVED' 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : status === 'REJECTED'
                            ? 'bg-accent-tint text-accent border-accent/20'
                            : 'bg-bg text-text-secondary border-border'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            status === 'APPROVED' ? 'bg-emerald-600' : status === 'REJECTED' ? 'bg-accent' : 'bg-text-secondary'
                          }`} />
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

      {/* Interactive Proof Preview Modal */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-text-primary rounded-xl border border-border max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center text-accent">
                  <Eye className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="type-h4 font-bold text-text-primary">Proof Document Preview</h3>
                  <p className="type-fine text-text-secondary font-medium">
                    {previewReq?.studentName} • {previewReq?.badgeName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setPreviewProofUrl(null);
                  setPreviewReq(null);
                }}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-bg rounded-lg border border-border flex items-center justify-center p-4 min-h-[300px]">
              {previewProofUrl.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                <img 
                  src={previewProofUrl} 
                  alt="Proof document preview" 
                  className="max-h-[60vh] max-w-full object-contain rounded-md"
                />
              ) : (
                <div className="text-center space-y-3 p-6">
                  <Award className="w-12 h-12 text-accent mx-auto" />
                  <p className="type-body-sm font-semibold text-text-primary">Document is available online</p>
                  <p className="type-fine text-text-secondary max-w-sm">This proof file cannot be directly embedded. Click the button below to view in a new tab.</p>
                  <a
                    href={getSafeHref(previewProofUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-card type-btn font-bold rounded-lg"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open Document</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-border">
              <a
                href={getSafeHref(previewProofUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="type-caption font-bold text-accent flex items-center space-x-1 hover:underline"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open in Fullscreen Tab</span>
              </a>
              <button
                onClick={() => {
                  setPreviewProofUrl(null);
                  setPreviewReq(null);
                }}
                className="px-4 py-2 bg-card border border-border text-text-secondary hover:text-text-primary hover:bg-bg type-btn font-bold rounded-lg transition-colors cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectingReq && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-xl border border-border max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-lg bg-accent-tint border border-accent/20 flex items-center justify-center text-accent">
                <XCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="type-h4 font-bold text-text-primary">Reject Badge Request</h3>
                <p className="type-fine text-text-secondary font-medium">
                  {rejectingReq.badgeName || 'Badge'} for {rejectingReq.studentName || 'Student'}
                </p>
              </div>
            </div>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="type-form-label text-text-secondary mb-1.5 block font-bold">Reason for Rejection *</label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Explain why this badge claim is being rejected (visible to student)..."
                  className="w-full p-3 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-medium bg-bg text-text-primary resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => {
                    setRejectingReq(null);
                    setRejectReason('');
                  }}
                  className="px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-bg border border-border type-btn font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-accent hover:bg-accent-hover text-card font-bold type-btn rounded-lg shadow-none transition-colors cursor-pointer"
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
