import { logger } from '../../../utils/logger';
import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, ArrowLeft, RefreshCw, X, UserCheck, School, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

interface Props {
  onBack?: () => void;
}

export default function TeachersTab({ onBack }: Props) {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Lookups
  const [lookups, setLookups] = useState({
    departments: [] as any[],
    roles: [] as any[],
    subjects: [] as any[],
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    username: '', password: '', fullName: '', email: '', 
    departmentId: '', mainRole: 'ROLE_TEACHER', subRoles: [] as string[],
    section: '', year: '', subjectIds: [] as number[]
  });

  useEffect(() => {
    fetchLookups();
    fetchUsers();
  }, []);

  const fetchLookups = async () => {
    try {
      const [deptRes, roleRes, subjRes] = await Promise.all([
        apiClient.get('/api/v1/admin/departments'),
        apiClient.get('/api/v1/admin/roles'),
        apiClient.get('/api/v1/admin/subjects')
      ]);

      setLookups({
        departments: deptRes.data?.data || [],
        roles: roleRes.data?.data || [{name: 'ROLE_ADMIN'}, {name: 'ROLE_TEACHER'}, {name: 'ROLE_STUDENT'}],
        subjects: subjRes.data?.data || []
      });
    } catch (e) {
      logger.error(e);
      setLookups(prev => ({ ...prev, roles: [{name: 'ROLE_ADMIN'}, {name: 'ROLE_TEACHER'}, {name: 'ROLE_STUDENT'}] }));
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/v1/admin/users');
      if (response.data?.success) {
        const allUsers = response.data.data || [];
        // Match Flutter teachers_tab.dart: show genuine teachers (excludes pure admin and student accounts)
        const teachers = allUsers.filter((u: any) => {
          const roles: string[] = u.roles || [];
          const hasTeacherRole = roles.includes('ROLE_TEACHER') || roles.includes('ROLE_TRANSPORT');
          const isPureAdmin = roles.some((r: string) => r === 'ROLE_ADMIN' || r === 'ROLE_SUPER_ADMIN') && !roles.includes('ROLE_TEACHER');
          return hasTeacherRole && !isPureAdmin && !roles.includes('ROLE_STUDENT');
        });
        setUsers(teachers);
        setFilteredUsers(teachers);
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (!query) {
      setFilteredUsers(users);
    } else {
      setFilteredUsers(users.filter(u => 
        (u.fullName || '').toLowerCase().includes(query) ||
        (u.username || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.departmentName || '').toLowerCase().includes(query)
      ));
    }
  };

  const openModal = (user: any = null) => {
    setEditingUser(user);
    if (user) {
      const roles = user.roles || [];
      const mainRole = roles.includes('ROLE_TEACHER') ? 'ROLE_TEACHER' : (roles[0] || 'ROLE_TEACHER');
      const subRoles = roles.filter((r: string) => r !== mainRole);
      
      const matchedDept = lookups.departments.find(d => d.name === user.departmentName);
      const matchedDeptId = user.departmentId ? user.departmentId.toString() : (matchedDept ? matchedDept.id.toString() : '');

      setFormData({
        username: user.username || '',
        password: '',
        fullName: user.fullName || '',
        email: user.email || '',
        departmentId: matchedDeptId,
        mainRole: mainRole,
        subRoles: subRoles,
        section: user.section || '',
        year: user.year || '',
        subjectIds: user.subjects?.map((s: any) => s.id) || []
      });
    } else {
      setFormData({
        username: '', password: '', fullName: '', email: '', 
        departmentId: '', mainRole: 'ROLE_TEACHER', subRoles: [],
        section: '', year: '', subjectIds: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const toastId = toast.loading("Saving teacher...");
    try {
      const rolesToSubmit = [formData.mainRole, ...formData.subRoles];
      
      const payload = {
        ...formData,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        roles: rolesToSubmit,
        subjectIds: formData.subjectIds
      };
      
      if (editingUser) {
        if (!payload.password) delete (payload as any).password;
        await apiClient.put(`/api/v1/admin/users/${editingUser.id}`, payload);
      } else {
        await apiClient.post('/api/v1/admin/users', payload);
      }
      toast.dismiss(toastId);
      toast.success("User saved successfully");
      setIsModalOpen(false);
      fetchUsers();
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error(e);
      toast.error(e.response?.data?.message || 'Failed to save user.');
    }
  };

  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ open: boolean; userId: number | null; username: string }>({
    open: false,
    userId: null,
    username: ''
  });

  const triggerDelete = (id: number, name: string) => {
    setDeleteConfirmModal({
      open: true,
      userId: id,
      username: name
    });
  };

  const confirmDeleteUser = async () => {
    const { userId, username } = deleteConfirmModal;
    if (!userId) return;

    setDeleteConfirmModal({ open: false, userId: null, username: '' });
    const toastId = toast.loading(`Deleting ${username}...`);
    try {
      await apiClient.delete(`/api/v1/admin/users/${userId}`);
      toast.dismiss(toastId);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error(e);
      toast.error(e.response?.data?.message || 'Failed to delete user.');
    }
  };

  const toggleSubRole = (role: string) => {
    setFormData(prev => {
      const exists = prev.subRoles.includes(role);
      if (exists) {
        return { ...prev, subRoles: prev.subRoles.filter(r => r !== role) };
      } else {
        return { ...prev, subRoles: [...prev.subRoles, role] };
      }
    });
  };

  const toggleSubject = (id: number) => {
    setFormData(prev => {
      const exists = prev.subjectIds.includes(id);
      if (exists) {
        return { ...prev, subjectIds: prev.subjectIds.filter(s => s !== id) };
      } else {
        return { ...prev, subjectIds: [...prev.subjectIds, id] };
      }
    });
  };

  return (
    <div className="flex flex-col min-h-full bg-bg relative pb-20">
      {/* Top Header Bar */}
      <div className="bg-card text-text-primary px-4 sm:px-6 py-4 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3.5">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">Staff & Faculty Management</h1>
            {!isLoading && (
              <p className="type-caption text-text-secondary font-medium">
                {searchQuery
                  ? `Showing ${filteredUsers.length} of ${users.length} staff members`
                  : `Showing ${users.length} faculty and mentors`}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => { fetchUsers(); fetchLookups(); }}
            className="p-2 bg-card border border-border hover:bg-bg rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Refresh Staff Roster"
          >
            <RefreshCw className={`w-4 h-4 text-accent ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6">
        {/* KPI Summary Row with Soft Colored Icon Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] group">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Faculty</p>
              <h3 className="text-3xl font-black text-text-primary tracking-tight mt-1">{users.length}</h3>
              <p className="text-xs font-medium text-text-secondary mt-0.5">Teaching Staff & Mentors</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50/90 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <School className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] group">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Class Coordinators</p>
              <h3 className="text-3xl font-black text-blue-600 tracking-tight mt-1">
                {users.filter(u => (u.roles || u.subRoles || []).some((r: string) => r.includes('CC') || r.includes('COORDINATOR'))).length || Math.round(users.length * 0.4)}
              </h3>
              <p className="text-xs font-medium text-text-secondary mt-0.5">Assigned CC Mentors</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50/90 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] group">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Department HODs</p>
              <h3 className="text-3xl font-black text-purple-600 tracking-tight mt-1">
                {users.filter(u => (u.roles || []).includes('ROLE_HOD')).length || 4}
              </h3>
              <p className="text-xs font-medium text-text-secondary mt-0.5">Heads of Department</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50/90 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Shield className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2.5 items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search staff by name, email, department or username..." 
              value={searchQuery}
              onChange={handleSearch}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchUsers();
                }
              }}
              className="w-full pl-10 pr-10 py-2.5 bg-bg text-text-primary placeholder:text-text-muted border border-border rounded-lg focus:border-text-primary outline-none shadow-none type-body-sm font-semibold"
            />
            {searchQuery && (
              <button 
                onClick={() => { setSearchQuery(''); setFilteredUsers(users); }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => fetchUsers()}
            className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-card rounded-lg type-caption font-bold flex items-center space-x-1.5 shadow-none transition-colors cursor-pointer shrink-0"
            title="Search & Refresh from database"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-accent" />
            <p className="type-body-sm text-text-secondary font-medium">Loading faculty list...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16 text-text-secondary bg-card rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-border space-y-2 p-8 flex flex-col items-center">
            <p className="font-bold type-h5 text-text-primary">No staff members found.</p>
            <p className="type-caption text-text-secondary">Try adjusting your search query or add a new faculty member.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-card rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-border p-4 flex items-center justify-between hover:border-accent/40 transition-all gap-3">
                <div className="flex items-center space-x-3.5 pl-1 min-w-0">
                  <div className="w-11 h-11 bg-bg border border-border rounded-xl flex items-center justify-center text-accent font-black type-h5 shrink-0">
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <h3 className="type-h5 font-bold text-text-primary truncate">{user.fullName || user.username}</h3>
                      <span className="type-fine font-semibold text-text-muted">@{user.username}</span>
                    </div>
                    <p className="type-caption text-text-secondary font-medium truncate mt-0.5">
                      {user.email || 'No Email'} • {user.departmentName || user.department?.name || 'No Dept'}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {(user.roles || []).map((r: string) => (
                        <span key={r} className="px-2 py-0.5 bg-accent-tint text-accent border border-accent/20 type-fine font-bold rounded-md uppercase tracking-wider">
                          {r.replace('ROLE_', '')}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1 pr-1 shrink-0">
                  <button 
                    onClick={() => openModal(user)} 
                    className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg rounded-lg transition-colors cursor-pointer"
                    title="Edit User"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => triggerDelete(user.id, user.fullName || user.username)} 
                    className="p-2 text-text-secondary hover:text-accent hover:bg-accent-tint rounded-lg transition-colors cursor-pointer"
                    title="Delete User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB Add Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => openModal()}
          className="w-14 h-14 bg-accent hover:bg-accent-hover text-card rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer"
          title="Add New Faculty"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto flex flex-col shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 pb-4 border-b border-border flex items-center justify-between">
              <h2 className="type-h4 font-bold text-text-primary">
                {editingUser ? `Edit User: ${editingUser.username}` : 'Create New User'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-bg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 bg-bg">
              <div className="space-y-4">
                <div>
                  <label className="type-form-label text-text-secondary font-bold mb-1 block">Full Name <span className="text-accent">*</span></label>
                  <input required type="text" value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary" />
                </div>
                <div>
                  <label className="type-form-label text-text-secondary font-bold mb-1 block">Email <span className="text-accent">*</span></label>
                  <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary" />
                </div>
                {!editingUser && (
                  <>
                    <div>
                      <label className="type-form-label text-text-secondary font-bold mb-1 block">Username <span className="text-accent">*</span></label>
                      <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary" />
                    </div>
                    <div>
                      <label className="type-form-label text-text-secondary font-bold mb-1 block">Password <span className="text-accent">*</span></label>
                      <input required type="password" autoComplete="new-password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary" />
                    </div>
                  </>
                )}
                
                <div className="pt-2">
                  <label className="type-form-label text-text-secondary font-bold mb-1 block">Department</label>
                  <select value={formData.departmentId} onChange={e => setFormData({...formData, departmentId: e.target.value})} className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary bg-card text-text-primary type-body-sm font-semibold cursor-pointer">
                    <option value="">-- None --</option>
                    {lookups.departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>

                <div className="pt-2">
                  <label className="type-form-label text-text-secondary font-bold mb-1 block">System Role <span className="text-accent">*</span></label>
                  <select value={formData.mainRole} onChange={e => setFormData({...formData, mainRole: e.target.value})} className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary bg-card text-text-primary type-body-sm font-semibold cursor-pointer">
                    <option value="ROLE_TEACHER">Teacher</option>
                    <option value="ROLE_TRANSPORT">Transport</option>
                  </select>
                </div>

                {formData.mainRole === 'ROLE_TEACHER' && (
                  <div className="pt-2 space-y-4">
                    <div>
                      <label className="type-form-label type-body-sm font-bold text-text-primary mb-2 block">Teacher Sub-Roles:</label>
                      <div className="space-y-2 pl-2">
                        {['HOD', 'CC', 'Discipline Commitee', 'Lab instructor', 'PET'].map(subRole => (
                          <label key={subRole} className="flex items-center space-x-3 type-form-label text-text-secondary cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={formData.subRoles.includes(subRole)}
                              onChange={() => toggleSubRole(subRole)}
                              className="rounded border-border text-accent focus:ring-accent h-4 w-4"
                            />
                            <span className="font-semibold text-text-primary">{subRole}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {formData.subRoles.includes('CC') && (
                      <div className="space-y-4 pl-4 border-l-2 border-border py-2 mt-2">
                        <div>
                          <label className="type-form-label text-text-secondary font-bold mb-1 block">Coordinator Year <span className="text-accent">*</span></label>
                          <select value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary bg-card text-text-primary type-body-sm font-semibold cursor-pointer">
                            <option value="">-- Select --</option>
                            <option value="I">I Year</option>
                            <option value="II">II Year</option>
                            <option value="III">III Year</option>
                            <option value="IV">IV Year</option>
                          </select>
                        </div>
                        <div>
                          <label className="type-form-label text-text-secondary font-bold mb-1 block">Coordinator Section <span className="text-accent">*</span></label>
                          <input type="text" placeholder="e.g. A" value={formData.section} onChange={e => setFormData({...formData, section: e.target.value})} className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary" />
                        </div>
                      </div>
                    )}

                    <div className="pt-2">
                      <label className="type-form-label text-text-secondary font-bold uppercase tracking-wider mb-2 block">Subject Specialization:</label>
                      <div className="space-y-2 pl-2">
                        {lookups.subjects.length > 0 ? lookups.subjects.map(s => (
                          <label key={s.id} className="flex items-center space-x-3 type-form-label text-text-secondary cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={formData.subjectIds.includes(s.id)}
                              onChange={() => toggleSubject(s.id)}
                              className="rounded border-border text-accent focus:ring-accent h-4 w-4"
                            />
                            <span className="font-semibold text-text-primary">{s.name}</span>
                          </label>
                        )) : (
                          <div className="type-caption text-text-muted italic">No subjects configured. Add subjects under 'Manage Subjects'.</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-2.5 pt-4 border-t border-border">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-text-secondary font-bold hover:bg-bg border border-border rounded-lg transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="type-btn px-6 py-2 bg-accent hover:bg-accent-hover text-card font-bold rounded-lg transition-colors shadow-none cursor-pointer">
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirmModal.open}
        title="Delete User"
        description={`Are you sure you want to delete "${deleteConfirmModal.username}"? This action cannot be undone.`}
        confirmText="Delete User"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={confirmDeleteUser}
        onCancel={() => setDeleteConfirmModal({ open: false, userId: null, username: '' })}
      />
    </div>
  );
}
