import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit2, ArrowLeft, ShieldCheck, RefreshCw, Mail, Phone, Calendar, Building, Sparkles, AlertCircle, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

interface YearAdmin {
  id: number;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  assignedYearId?: number | null;
  assignedYearName?: string | null;
  academicYear?: string;
  yearNo?: number;
  yearName?: string;
  departmentName?: string;
  active?: boolean;
  createdAt?: string;
}

interface AcademicYearOption {
  id: number;
  yearName: string;
  yearNo?: number;
}

interface SuperAdminManagementTabProps {
  onBack?: () => void;
}

export default function SuperAdminManagementTab({ onBack }: SuperAdminManagementTabProps) {
  const [admins, setAdmins] = useState<YearAdmin[]>([]);
  const [yearsList, setYearsList] = useState<AcademicYearOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // Form State
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [editingAdminId, setEditingAdminId] = useState<number | null>(null);

  // Custom Confirmation Dialog States
  const [replaceConfirmData, setReplaceConfirmData] = useState<{ existingAdminName: string; yearName: string } | null>(null);
  const [deleteConfirmData, setDeleteConfirmData] = useState<{ adminId: number; adminName: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [adminsRes, yearsRes] = await Promise.all([
        apiClient.get('/api/v1/superadmin/year-admins').catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/admin/years').catch(() => ({ data: { data: [] } }))
      ]);

      const fetchedAdmins = Array.isArray(adminsRes.data?.data) ? adminsRes.data.data : (Array.isArray(adminsRes.data) ? adminsRes.data : []);
      const fetchedYears = Array.isArray(yearsRes.data?.data) ? yearsRes.data.data : (Array.isArray(yearsRes.data) ? yearsRes.data : []);

      setAdmins(fetchedAdmins);
      setYearsList(fetchedYears);
    } catch (error) {
      logger.error('Error loading Year Admins:', error);
      toast.error('Failed to load Year Admins');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSecurePassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    let result = 'Admin@';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleEditClick = (admin: YearAdmin) => {
    setEditingAdminId(admin.id);
    setUsername(admin.username);
    setFullName(admin.fullName);
    setEmail(admin.email || '');
    setPhone(admin.phone || '');
    setSelectedYearId(admin.assignedYearId ?? (admin.academicYear ? resolveYearIdFromEnum(admin.academicYear) : null));
    setShowAddModal(true);
  };

  const resolveYearIdFromEnum = (enumStr: string): number | null => {
    const clean = enumStr.replace('_', ' ').toLowerCase();
    const found = yearsList.find(y => y.yearName.toLowerCase().includes(clean));
    return found ? found.id : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !username.trim()) {
      toast.error('Full name and username are required');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toast.error('A valid Email address is required');
      return;
    }

    if (!selectedYearId) {
      toast.error('Assigned Academic Year is required');
      return;
    }

    // Check if selected year is already assigned to another active admin
    const existingAdmin = admins.find(
      a => (a.assignedYearId === selectedYearId || (a.academicYear && resolveYearIdFromEnum(a.academicYear) === selectedYearId)) &&
           a.id !== editingAdminId &&
           a.active !== false
    );

    if (existingAdmin) {
      const yearObj = yearsList.find(y => y.id === selectedYearId);
      setReplaceConfirmData({
        existingAdminName: existingAdmin.username || existingAdmin.fullName,
        yearName: yearObj?.yearName || `Year ID ${selectedYearId}`
      });
      return;
    }

    executeSave();
  };

  const executeSave = async () => {
    setReplaceConfirmData(null);
    setIsSubmitting(true);
    try {
      const payload: any = {
        username: username.trim(),
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        assignedYearId: selectedYearId,
        active: true
      };

      if (!editingAdminId) {
        // Automatically supply a secure internal password to satisfy backend entity constraint
        payload.password = generateSecurePassword();
      }

      let res;
      if (editingAdminId) {
        res = await apiClient.put(`/api/v1/superadmin/year-admins/${editingAdminId}`, payload);
      } else {
        res = await apiClient.post('/api/v1/superadmin/year-admins', payload);
      }

      if (res.data?.success || res.status === 200 || res.status === 201) {
        toast.success(editingAdminId ? `Year Admin updated successfully!` : `Year Admin created successfully!`);
        setShowAddModal(false);
        resetForm();
        fetchData();
      } else {
        toast.error(res.data?.message || `Failed to ${editingAdminId ? 'update' : 'create'} Year Admin`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${editingAdminId ? 'update' : 'create'} Year Admin`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAdmin = (adminId: number, adminName: string) => {
    setDeleteConfirmData({ adminId, adminName });
  };

  const executeDelete = async () => {
    if (!deleteConfirmData) return;
    const { adminId, adminName } = deleteConfirmData;
    setDeleteConfirmData(null);

    try {
      await apiClient.delete(`/api/v1/superadmin/year-admins/${adminId}`);
      toast.success(`Removed ${adminName}`);
      setAdmins(prev => prev.filter(a => a.id !== adminId));
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to remove Year Admin');
    }
  };

  const resetForm = () => {
    setUsername('');
    setFullName('');
    setEmail('');
    setPhone('');
    setSelectedYearId(null);
    setEditingAdminId(null);
  };

  const formatAcademicYear = (admin: YearAdmin) => {
    if (admin.assignedYearName) return admin.assignedYearName;
    if (admin.assignedYearId) {
      const match = yearsList.find(y => y.id === admin.assignedYearId);
      if (match) return match.yearName;
    }
    if (admin.academicYear) {
      switch (admin.academicYear) {
        case 'FIRST_YEAR': return 'First Year';
        case 'SECOND_YEAR': return 'Second Year';
        case 'THIRD_YEAR': return 'Third Year';
        case 'FOURTH_YEAR': return 'Fourth Year';
        default: return admin.academicYear.replace('_', ' ');
      }
    }
    if (admin.yearName) return admin.yearName;
    if (admin.yearNo) return `Year ${admin.yearNo}`;
    return 'Not Assigned';
  };

  const handleRefreshCache = async () => {
    const toastId = toast.loading('Refreshing database cache...');
    try {
      const res = await apiClient.post('/api/v1/superadmin/cache/refresh');
      toast.dismiss(toastId);
      if (res.data?.success || res.status === 200) {
        toast.success('Database cache refreshed successfully');
        fetchData();
      } else {
        toast.error(res.data?.message || 'Failed to refresh database cache');
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || 'Failed to refresh database cache');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg">
      {/* Top Header matching Admin Theme */}
      <div className="bg-card text-text-primary px-4 sm:px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-lg border border-border hover:bg-bg transition-colors text-text-secondary hover:text-text-primary">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="type-h3 tracking-tight text-text-primary flex items-center space-x-2">
              <ShieldCheck className="w-6 h-6 text-text-primary" />
              <span>Super Admin Management</span>
            </h1>
            <p className="type-caption text-text-secondary font-medium hidden sm:block">Manage Year Admins, assignments, and permissions</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefreshCache}
            className="p-2.5 rounded-lg bg-card border border-border hover:bg-bg text-text-secondary hover:text-text-primary transition-colors type-caption flex items-center space-x-1.5 cursor-pointer"
            title="Refresh Database Cache"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden md:inline">Sync Cache</span>
          </button>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="px-4 py-2.5 rounded-lg bg-accent hover:bg-accent-hover text-card type-btn shadow-none transition-all flex items-center space-x-2 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Year Admin</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Metric Banner Card */}
        <div className="bg-card rounded-xl p-6 text-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col md:flex-row items-center justify-between gap-6 border border-border">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-2.5 py-1 rounded-md bg-accent-tint border border-accent/20 text-accent type-caption font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Super Admin Privileges Active</span>
            </div>
            <h2 className="type-h3 font-bold tracking-tight text-text-primary">Year Administrators</h2>
            <p className="type-body-sm text-text-secondary font-medium max-w-xl">
              Assign dedicated Year Admins to oversee academic years, cohorts, and their respective departments.
            </p>
          </div>

          <div className="flex items-center bg-bg p-3.5 rounded-xl border border-border divide-x divide-border">
            <div className="text-center px-5">
              <span className="block type-h2 font-black text-text-primary">{admins.length}</span>
              <span className="type-fine text-text-secondary font-bold uppercase tracking-wider">Total Admins</span>
            </div>
            <div className="text-center px-5">
              <span className="block type-h2 font-black text-accent">
                {admins.filter(a => a.assignedYearId != null || !!a.academicYear).length} / {yearsList.length || 4}
              </span>
              <span className="type-fine text-text-secondary font-bold uppercase tracking-wider">Assigned Years</span>
            </div>
          </div>
        </div>

        {/* Admin Cards Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
            <RefreshCw className="w-10 h-10 animate-spin text-accent" />
            <p className="type-body font-semibold text-text-secondary">Loading Year Admins...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="bg-card rounded-lg p-12 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-bg border border-border text-text-muted rounded-lg flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-accent" />
            </div>
            <div>
              <h3 className="type-h4 font-bold text-text-primary">No Year Admins Configured</h3>
              <p className="type-body-sm text-text-secondary mt-1">Click "Add Year Admin" to assign administrators to academic years.</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="type-btn px-5 py-2.5 bg-accent hover:bg-accent-hover text-card font-bold rounded-lg shadow-none transition-all cursor-pointer"
            >
              Add First Year Admin
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="bg-card rounded-xl border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-accent/40 transition-all p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-xl bg-bg border border-border text-accent font-black type-h4 flex items-center justify-center">
                        {admin.fullName ? admin.fullName.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <h3 className="type-h5 font-bold text-text-primary">{admin.fullName || admin.username}</h3>
                        <span className="type-caption font-mono font-bold text-text-secondary">@{admin.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditClick(admin)}
                        className="p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
                        title="Edit Year Admin"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin.id, admin.fullName || admin.username)}
                        className="p-2 rounded-lg text-text-secondary hover:text-accent hover:bg-accent-tint transition-colors cursor-pointer"
                        title="Remove Year Admin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-border type-caption text-text-secondary font-medium">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-text-muted" />
                      <span>Assigned Year: <strong className="text-text-primary font-bold">{formatAcademicYear(admin)}</strong></span>
                    </div>

                    {admin.departmentName && (
                      <div className="flex items-center space-x-2">
                        <Building className="w-4 h-4 text-text-muted" />
                        <span>Dept: <strong className="text-text-primary font-bold">{admin.departmentName}</strong></span>
                      </div>
                    )}

                    {admin.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-text-muted" />
                        <span className="truncate">{admin.email}</span>
                      </div>
                    )}

                    {admin.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-text-muted" />
                        <span>{admin.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>ACTIVE YEAR ADMIN</span>
                  </span>
                  <span className="text-[11px] text-text-muted font-bold">ID: #{admin.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Year Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg max-w-md w-full p-6 shadow-xl border border-border space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-border-subtle pb-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-text-primary" />
                <h3 className="type-h5 text-text-primary">{editingAdminId ? 'Edit Year Admin' : 'Add New Year Admin'}</h3>
              </div>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="text-text-muted hover:text-text-primary type-h5 p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="type-form-label block font-bold text-text-primary uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full px-3.5 py-2.5 bg-card border border-border rounded-lg type-body-sm font-semibold outline-none focus:border-text-primary text-text-primary"
                />
              </div>

              <div>
                <label className="type-form-label block font-bold text-text-primary uppercase mb-1">Username / Admin ID *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. year1_admin"
                  className="w-full px-3.5 py-2.5 bg-card border border-border rounded-lg type-body-sm font-semibold outline-none focus:border-text-primary text-text-primary"
                />
              </div>

              <div>
                <label className="type-form-label block font-bold text-text-primary uppercase mb-1">
                  Email Address * <span className="type-fine lowercase text-text-muted font-normal">(Primary for OTP & Login)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@jjcet.ac.in"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-card border border-border rounded-lg type-body-sm font-semibold outline-none focus:border-text-primary text-text-primary"
                  />
                  <Mail className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="type-form-label block font-bold text-text-primary uppercase mb-1">Assigned Academic Year *</label>
                <select
                  required
                  value={selectedYearId ?? ''}
                  onChange={(e) => setSelectedYearId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 bg-card border border-border rounded-lg type-body-sm font-semibold outline-none focus:border-text-primary text-text-primary"
                >
                  <option value="">-- Select Academic Year --</option>
                  {yearsList.map(y => (
                    <option key={y.id} value={y.id}>
                      {y.yearName || `Year ${y.yearNo}`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="type-form-label block font-bold text-text-primary uppercase mb-1">Phone Number (Optional)</label>
                <div className="relative">
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-card border border-border rounded-lg type-body-sm font-semibold outline-none focus:border-text-primary text-text-primary"
                  />
                  <Phone className="w-4 h-4 text-text-muted absolute left-3 top-3" />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-4 py-2.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg type-btn cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-lg bg-text-primary hover:bg-text-secondary text-card font-bold type-btn shadow-none disabled:opacity-50 flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>{editingAdminId ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span>{editingAdminId ? 'Update Year Admin' : 'Create Year Admin'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Replace Assignment Modal */}
      {replaceConfirmData && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg max-w-sm w-full p-6 shadow-xl border border-border space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-warning">
              <div className="w-10 h-10 rounded-lg bg-warning-tint flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-warning" />
              </div>
              <h3 className="type-h5 text-text-primary">Replace Assignment?</h3>
            </div>
            <p className="type-body-sm text-text-secondary leading-relaxed">
              <strong className="text-text-primary font-bold">"{replaceConfirmData.existingAdminName}"</strong> is already assigned to <span className="font-semibold text-text-primary">{replaceConfirmData.yearName}</span>. Do you want to replace them?
            </p>
            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setReplaceConfirmData(null)}
                className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg type-btn cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSave}
                className="px-4 py-2 rounded-lg bg-text-primary hover:bg-text-secondary text-card font-bold type-btn shadow-none"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmData && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-card rounded-lg max-w-sm w-full p-6 shadow-xl border border-border space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-accent">
              <div className="w-10 h-10 rounded-lg bg-accent-tint flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-accent" />
              </div>
              <h3 className="type-h5 text-text-primary">Confirm Delete</h3>
            </div>
            <p className="type-body-sm text-text-secondary leading-relaxed">
              Are you sure you want to remove Year Admin <strong className="text-text-primary font-bold">"{deleteConfirmData.adminName}"</strong>?
            </p>
            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmData(null)}
                className="px-4 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-bg type-btn cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-4 py-2 rounded-lg bg-accent hover:bg-accent-hover text-card font-bold type-btn shadow-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
