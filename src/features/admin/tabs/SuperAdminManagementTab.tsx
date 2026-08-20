import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { UserPlus, Trash2, Edit2, ArrowLeft, ShieldCheck, RefreshCw, Mail, Phone, Calendar, Building, Sparkles, AlertCircle, AlertTriangle, Key } from 'lucide-react';
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
  const [password, setPassword] = useState('');
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
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleEditClick = (admin: YearAdmin) => {
    setEditingAdminId(admin.id);
    setUsername(admin.username);
    setPassword('');
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
    if (!username || !fullName) {
      toast.error('Username and full name are required');
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
      const finalPassword = password ? password : (!editingAdminId ? generateSecurePassword() : undefined);

      const payload: any = {
        username: username.trim(),
        fullName: fullName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        assignedYearId: selectedYearId,
        active: true
      };

      if (finalPassword) {
        payload.password = finalPassword;
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
    setPassword('');
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

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* Top Header matching Admin Theme */}
      <div className="bg-[#1E293B] text-white px-4 sm:px-6 py-4 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button onClick={onBack} className="p-2 rounded-full hover:bg-slate-700 transition-colors text-white">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center space-x-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <span>Super Admin Management</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">Manage Year Admins, assignments, and permissions</p>
          </div>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-xs shadow-lg shadow-red-500/20 transition-all flex items-center space-x-2"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Year Admin</span>
        </button>
      </div>

      <div className="flex-1 p-4 sm:p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Metric Banner Card */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Super Admin Privileges Active</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Year Administrators</h2>
            <p className="text-sm text-slate-300 max-w-xl">
              Assign dedicated Year Admins to manage academic years and their departments.
            </p>
          </div>

          <div className="flex items-center space-x-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
            <div className="text-center px-4 border-r border-white/10">
              <span className="block text-2xl font-black text-white">{admins.length}</span>
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Total Admins</span>
            </div>
            <div className="text-center px-4">
              <span className="block text-2xl font-black text-emerald-400">
                {admins.filter(a => a.assignedYearId != null || !!a.academicYear).length} / {yearsList.length || 4}
              </span>
              <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">Assigned Years</span>
            </div>
          </div>
        </div>

        {/* Admin Cards Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <RefreshCw className="w-10 h-10 animate-spin text-red-500" />
            <p className="text-sm font-semibold text-slate-600">Loading Year Admins...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800">No Year Admins Configured</h3>
              <p className="text-sm text-slate-500 mt-1">Click "Add Year Admin" to assign administrators to academic years.</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowAddModal(true); }}
              className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              Add First Year Admin
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {admins.map((admin) => (
              <div
                key={admin.id}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white font-black text-lg flex items-center justify-center shadow-md">
                        {admin.fullName ? admin.fullName.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">{admin.fullName || admin.username}</h3>
                        <span className="text-xs font-mono font-semibold text-slate-500">@{admin.username}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleEditClick(admin)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Edit Year Admin"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAdmin(admin.id, admin.fullName || admin.username)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Remove Year Admin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100 text-xs font-medium text-slate-600">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Assigned Year: <strong className="text-slate-800 font-bold">{formatAcademicYear(admin)}</strong></span>
                    </div>

                    {admin.departmentName && (
                      <div className="flex items-center space-x-2">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>Dept: <strong className="text-slate-800 font-bold">{admin.departmentName}</strong></span>
                      </div>
                    )}

                    {admin.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{admin.email}</span>
                      </div>
                    )}

                    {admin.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{admin.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                    ACTIVE YEAR ADMIN
                  </span>
                  <span className="text-[11px] text-slate-400 font-semibold">ID: #{admin.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Year Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-lg text-slate-900">{editingAdminId ? 'Edit Year Admin' : 'Add New Year Admin'}</h3>
              </div>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Dr. Rajesh Kumar"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Username / Admin ID *</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. year1_admin"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Password {editingAdminId ? '(Leave blank to keep current)' : '(Leave blank to auto-generate)'}
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-900"
                  />
                  {!editingAdminId && (
                    <button
                      type="button"
                      onClick={() => {
                        const gen = generateSecurePassword();
                        setPassword(gen);
                        toast.success(`Generated: ${gen}`);
                      }}
                      className="absolute right-2 top-2 px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold flex items-center space-x-1"
                      title="Generate random secure password"
                    >
                      <Key className="w-3 h-3" />
                      <span>Auto</span>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Assigned Academic Year *</label>
                <select
                  required
                  value={selectedYearId ?? ''}
                  onChange={(e) => setSelectedYearId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-slate-900"
                >
                  <option value="">-- Select Academic Year --</option>
                  {yearsList.map(y => (
                    <option key={y.id} value={y.id}>
                      {y.yearName || `Year ${y.yearNo}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Email (Optional)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@jjcet.ac.in"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Phone (Optional)</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold text-xs shadow-md disabled:opacity-50 flex items-center space-x-2"
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
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Replace Assignment?</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong className="text-slate-900 font-bold">"{replaceConfirmData.existingAdminName}"</strong> is already assigned to <span className="font-semibold text-slate-800">{replaceConfirmData.yearName}</span>. Do you want to replace them?
            </p>
            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setReplaceConfirmData(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeSave}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirmData && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900">Confirm Delete</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to remove Year Admin <strong className="text-slate-900 font-bold">"{deleteConfirmData.adminName}"</strong>?
            </p>
            <div className="pt-2 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmData(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
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
