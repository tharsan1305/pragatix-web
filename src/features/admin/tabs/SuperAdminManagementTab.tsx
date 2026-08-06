import { useState, useEffect } from 'react';
import { RefreshCw, Edit2, Trash2, ArrowLeft, ShieldCheck, UserPlus, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

interface Props {
  onBack?: () => void;
}

export default function SuperAdminManagementTab({ onBack }: Props) {
  const [yearAdmins, setYearAdmins] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    academicYear: '' as string | null
  });

  // Conflict Replacement Modal State
  const [conflictModal, setConflictModal] = useState<{
    open: boolean;
    existingAdminName: string;
    targetYear: string;
    pendingData: any;
  }>({
    open: false,
    existingAdminName: '',
    targetYear: '',
    pendingData: null
  });

  // Delete Confirmation State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ open: boolean; adminId: number | null; username: string }>({
    open: false,
    adminId: null,
    username: ''
  });

  useEffect(() => {
    fetchYearAdmins();
  }, []);

  const fetchYearAdmins = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get('/api/v1/superadmin/year-admins');
      if (response.data?.success) {
        setYearAdmins(response.data.data || []);
      } else if (Array.isArray(response.data)) {
        setYearAdmins(response.data);
      } else {
        setYearAdmins([]);
      }
    } catch (e: any) {
      console.error('Failed to fetch year admins:', e);
      setError(e.response?.data?.message || e.message || 'Failed to fetch year admins');
    } finally {
      setIsLoading(false);
    }
  };

  const openAdminModal = (admin: any = null) => {
    setEditingAdmin(admin);
    if (admin) {
      setFormData({
        fullName: admin.fullName || '',
        username: admin.username || '',
        email: admin.email || '',
        phone: admin.phone || '',
        password: '',
        academicYear: admin.academicYear || ''
      });
    } else {
      setFormData({
        fullName: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        academicYear: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingAdmin) {
      if (!formData.fullName.trim() || !formData.username.trim() || !formData.password.trim()) {
        toast.error('Full Name, Username, and Password are required.');
        return;
      }
    }

    const payload: any = {};
    if (editingAdmin) {
      payload.academicYear = formData.academicYear || null;
    } else {
      payload.fullName = formData.fullName.trim();
      payload.username = formData.username.trim();
      payload.email = formData.email.trim();
      payload.phone = formData.phone.trim();
      payload.password = formData.password.trim();
      payload.academicYear = formData.academicYear || null;
      payload.active = true;
    }

    // Check for conflict if year is selected
    if (formData.academicYear) {
      const existing = yearAdmins.find(
        a => a.academicYear === formData.academicYear &&
             a.id !== editingAdmin?.id &&
             a.active !== false
      );

      if (existing) {
        setConflictModal({
          open: true,
          existingAdminName: existing.username || existing.fullName || 'Admin',
          targetYear: formatYearLabel(formData.academicYear),
          pendingData: payload
        });
        return;
      }
    }

    await saveAdminData(payload);
  };

  const saveAdminData = async (payload: any) => {
    const toastId = toast.loading(editingAdmin ? 'Updating Year Admin...' : 'Creating Year Admin...');
    try {
      if (editingAdmin) {
        await apiClient.put(`/api/v1/superadmin/year-admins/${editingAdmin.id}`, payload);
      } else {
        await apiClient.post('/api/v1/superadmin/year-admins', payload);
      }
      toast.dismiss(toastId);
      toast.success(editingAdmin ? 'Year Admin updated successfully' : 'Year Admin created successfully');
      setIsModalOpen(false);
      setConflictModal({ open: false, existingAdminName: '', targetYear: '', pendingData: null });
      fetchYearAdmins();
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error('Failed to save year admin:', e);
      toast.error(e.response?.data?.message || 'Failed to save Year Admin assignment');
    }
  };

  const confirmDeleteAdmin = async () => {
    const { adminId, username } = deleteConfirmModal;
    if (!adminId) return;

    setDeleteConfirmModal({ open: false, adminId: null, username: '' });
    const toastId = toast.loading(`Removing ${username}...`);
    try {
      await apiClient.delete(`/api/v1/superadmin/year-admins/${adminId}`);
      toast.dismiss(toastId);
      toast.success(`Removed ${username} successfully`);
      fetchYearAdmins();
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error(e);
      toast.error(e.response?.data?.message || 'Failed to delete Year Admin');
    }
  };

  const formatYearLabel = (yearStr: string | null) => {
    if (!yearStr) return 'Not Assigned';
    return yearStr
      .replace('_', ' ')
      .toLowerCase()
      .split(' ')
      .map(s => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 relative pb-20">
      {/* Header Bar matching Super Admin Theme */}
      <div className="bg-[#1E293B] text-white px-6 pt-10 pb-5 shadow-md">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-4">
            {onBack && (
              <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold flex items-center space-x-2">
                <ShieldCheck className="w-6 h-6 text-indigo-400" />
                <span>Super Admin Management</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Manage system administrators and assign Academic Year privileges</p>
            </div>
          </div>
          <button onClick={fetchYearAdmins} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors" title="Refresh">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        {/* Action Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800">Year Administrators Directory</h2>
          <button
            onClick={() => openAdminModal()}
            className="flex items-center space-x-2 bg-[#1E293B] hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-sm transition-transform active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>New Year Admin</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <p className="font-semibold text-slate-700 text-base mb-2">{error}</p>
            <button onClick={fetchYearAdmins} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800">
              Retry
            </button>
          </div>
        ) : yearAdmins.length === 0 ? (
          <div className="text-center py-16 text-slate-400 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">No Year Admins configured yet.</p>
            <p className="text-xs text-slate-400 mt-1">Click New Year Admin above to add an administrator.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {yearAdmins.map((admin) => {
              const username = admin.username || admin.fullName || 'Admin';
              const cleanYear = formatYearLabel(admin.academicYear);
              const isAssigned = admin.academicYear !== null && admin.academicYear !== '';

              return (
                <div key={admin.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 font-bold shrink-0 border border-indigo-100">
                      <ShieldCheck className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{username}</h3>
                      <p className="text-xs text-slate-500 font-medium">
                        Year Assignment: <span className={`font-semibold ${isAssigned ? 'text-indigo-600' : 'text-slate-400'}`}>{cleanYear}</span>
                      </p>
                      {admin.email && <p className="text-[11px] text-slate-400 mt-0.5">{admin.email}</p>}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openAdminModal(admin)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors flex items-center space-x-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isAssigned ? 'Edit Year' : 'Assign Year'}</span>
                    </button>
                    <button
                      onClick={() => setDeleteConfirmModal({ open: true, adminId: admin.id, username })}
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Remove Year Admin"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Admin Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">
                {editingAdmin ? 'Assign Academic Year' : 'New Year Admin'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {!editingAdmin && (
                <>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Full Name *</label>
                    <input
                      required
                      type="text"
                      value={formData.fullName}
                      onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-sm focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Username *</label>
                    <input
                      required
                      type="text"
                      value={formData.username}
                      onChange={e => setFormData({ ...formData, username: e.target.value })}
                      placeholder="e.g. admin_year1"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-sm focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Password *</label>
                    <input
                      required
                      type="password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter password"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-sm focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Email address"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-sm focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone</label>
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Mobile number"
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl outline-none text-sm focus:ring-2 focus:ring-slate-900"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Assigned Academic Year</label>
                <select
                  value={formData.academicYear || ''}
                  onChange={e => setFormData({ ...formData, academicYear: e.target.value || null })}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl outline-none text-sm bg-white focus:ring-2 focus:ring-slate-900 font-semibold"
                >
                  <option value="">Not Assigned</option>
                  <option value="FIRST_YEAR">First Year</option>
                  <option value="SECOND_YEAR">Second Year</option>
                  <option value="THIRD_YEAR">Third Year</option>
                  <option value="FOURTH_YEAR">Fourth Year</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 font-semibold text-xs hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E293B] text-white font-semibold text-xs hover:bg-slate-800 rounded-lg shadow-xs"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Conflict Replacement Confirmation Modal */}
      {conflictModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-600">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold text-slate-900">Replace Assignment?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">{conflictModal.existingAdminName}</span> is already assigned to <span className="font-semibold text-indigo-600">{conflictModal.targetYear}</span>. Do you want to replace them?
            </p>
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setConflictModal({ open: false, existingAdminName: '', targetYear: '', pendingData: null })}
                className="px-4 py-2 text-slate-600 font-semibold text-xs hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => saveAdminData(conflictModal.pendingData)}
                className="px-5 py-2 bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 rounded-lg shadow-xs"
              >
                Replace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmModal.open}
        title="Confirm Delete"
        description={`Are you sure you want to remove ${deleteConfirmModal.username}?`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmDeleteAdmin}
        onCancel={() => setDeleteConfirmModal({ open: false, adminId: null, username: '' })}
      />
    </div>
  );
}
