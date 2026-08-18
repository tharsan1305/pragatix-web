import { logger } from '../../../utils/logger';
import React, { useState, useEffect } from 'react';
import { LogOut, RefreshCw, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../store/authContext';
import apiClient from '../../../services/apiClient';
import LogoutModal from '../../../components/common/LogoutModal';

export default function AdminProfileTab() {
  const { logout, isSuperAdmin } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      let response;
      try {
        response = await apiClient.get('/api/v1/profile/me');
      } catch {
        response = await apiClient.get('/api/v1/auth/me');
      }

      if (response.data?.success && response.data?.data) {
        setProfile(response.data.data);
      } else if (response.data?.data) {
        setProfile(response.data.data);
      }
    } catch (e) {
      logger.error("Failed to fetch admin profile:", e);
      toast.error("Failed to load profile data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshCache = async () => {
    setIsRefreshingCache(true);
    const toastId = toast.loading("Refreshing database cache...");
    try {
      const response = await apiClient.post('/api/v1/superadmin/cache/refresh');
      toast.dismiss(toastId);
      if (response.data?.success || response.status === 200) {
        toast.success(response.data?.message || "Database cache refreshed successfully");
        fetchProfile();
      } else {
        toast.error(response.data?.message || "Failed to refresh database cache");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || "Error refreshing database cache");
    } finally {
      setIsRefreshingCache(false);
    }
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword.trim()) {
      toast.error("Password cannot be empty");
      return;
    }
    setIsChangingPass(true);
    try {
      await apiClient.post('/api/v1/auth/change-password', { newPassword });
      toast.success("Password changed successfully");
      setIsPasswordModalOpen(false);
      setNewPassword('');
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Failed to change password");
    } finally {
      setIsChangingPass(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F1F5F9]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-500"></div>
      </div>
    );
  }

  const superAdminStats = profile?.superAdminDetails;
  const adminStats = profile?.adminDetails;
  const isAdmin = !!adminStats;
  const isSuper = !!superAdminStats || isSuperAdmin || profile?.role === 'SUPER_ADMIN';

  return (
    <div className="flex flex-col min-h-full bg-[#F8FAFC]">
      <div className="flex-1 overflow-y-auto flex flex-col items-center pt-8 pb-12 px-4 sm:px-6">
        
        {/* Profile Header matching Flutter SharedProfileHeader */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1E293B] tracking-tight">
            {profile?.fullName || (isSuper ? 'System Administrator' : 'Administrator')}
          </h1>
          <p className="text-xs sm:text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">
            {profile?.role || (isSuper ? 'SUPER_ADMIN' : 'ADMIN')}
          </p>
        </div>

        <div className="w-full max-w-md space-y-4">
          {/* 1. Personal Information Card */}
          <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
              Personal Information
            </h3>
            
            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">Username</span>
              <span className="font-bold text-[#1E293B]">{profile?.username || 'Not Available'}</span>
            </div>

            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">Email</span>
              <span className="font-bold text-[#1E293B] truncate max-w-[220px]">{profile?.email || 'Not Available'}</span>
            </div>

            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">Phone</span>
              <span className="font-bold text-[#1E293B]">{profile?.phone || 'Not Available'}</span>
            </div>

            {isAdmin ? (
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-500 font-medium">Assigned Year</span>
                <span className="font-bold text-[#1E293B]">{adminStats?.academicYear || 'Not Available'}</span>
              </div>
            ) : (
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-500 font-medium">Department</span>
                <span className="font-bold text-[#1E293B]">{profile?.department || 'N/A'}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs sm:text-sm">
              <span className="text-slate-500 font-medium">Status</span>
              <span className="font-bold text-emerald-600">
                {profile?.accountStatus || 'Active'}
              </span>
            </div>
          </div>

          {/* 2. System Statistics Card (Super Admin) matching Flutter */}
          {isSuper && superAdminStats && (
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                System Statistics
              </h3>
              
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-500 font-medium">Total Departments</span>
                <span className="font-bold text-[#1E293B]">{superAdminStats.totalDepartments}</span>
              </div>

              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-500 font-medium">Total Students</span>
                <span className="font-bold text-[#1E293B]">{superAdminStats.totalStudents}</span>
              </div>

              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-500 font-medium">Total Teachers</span>
                <span className="font-bold text-[#1E293B]">{superAdminStats.totalTeachers}</span>
              </div>
            </div>
          )}

          {/* 3. Academic Statistics Card (Year Admin) matching Flutter */}
          {isAdmin && !isSuper && adminStats && (
            <div className="bg-white rounded-3xl shadow-xs border border-slate-200/80 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Academic Statistics
              </h3>
              
              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-500 font-medium">Assigned Year</span>
                <span className="font-bold text-[#1E293B]">{adminStats.academicYear || 'All Years'}</span>
              </div>

              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-500 font-medium">Total Students</span>
                <span className="font-bold text-[#1E293B]">{adminStats.totalStudentsInYear ?? 0}</span>
              </div>

              <div className="flex justify-between items-center text-xs sm:text-sm">
                <span className="text-slate-500 font-medium">Total Groups</span>
                <span className="font-bold text-[#1E293B]">{adminStats.totalGroups ?? 0}</span>
              </div>
            </div>
          )}

          {/* Action Buttons matching Flutter */}
          <div className="pt-2 space-y-3">
            {/* Refresh DB Cache button for Super Admin */}
            {isSuper && (
              <button
                onClick={handleRefreshCache}
                disabled={isRefreshingCache}
                className="w-full py-3.5 px-4 bg-[#3B5998] hover:bg-[#2d4373] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshingCache ? 'animate-spin' : ''}`} />
                <span>Refresh DB Cache</span>
              </button>
            )}

            {/* Change Password Button */}
            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              <span>Change Password</span>
            </button>

            {/* Logout Button matching Flutter Red Logout */}
            <button
              onClick={() => setIsLogoutModalOpen(true)}
              className="w-full py-3.5 px-4 bg-[#E53E3E] hover:bg-[#C53030] text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <LogoutModal
        open={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Change Admin Password</h3>
              <button onClick={() => setIsPasswordModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer">
                ✕
              </button>
            </div>
            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 mb-1 block">New Password *</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-900 text-sm font-semibold"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="px-4 py-2 text-xs text-slate-600 font-bold hover:bg-slate-100 rounded-xl cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={isChangingPass} className="px-5 py-2 text-xs bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-xs cursor-pointer">
                  {isChangingPass ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
