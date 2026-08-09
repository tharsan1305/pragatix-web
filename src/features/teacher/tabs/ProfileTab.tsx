import { useState, useEffect } from 'react';
import { LogOut, Lock, RefreshCw, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../store/authContext';
import apiClient from '../../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import LogoutModal from '../../../components/common/LogoutModal';

export default function ProfileTab() {
  const { logout, subRoles } = useAuth();
  const navigate = useNavigate();

  const isCC = subRoles.some((r: any) => {
    const clean = String(r).trim().toUpperCase();
    return clean === 'CC' || clean === 'CLASS_COORDINATOR' || clean === 'ROLE_CC' || clean === 'ROLE_CLASS_COORDINATOR';
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  const [profileData, setProfileData] = useState({
    username: "jaga",
    fullName: "jaga",
    email: "jaga@gmail.com",
    phone: "Not Available",
    department: "Cyber Security",
    status: "Active",
    employeeId: "jaga",
    totalStudents: 0,
    attendanceTaken: 0,
    role: "TEACHER"
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/v1/auth/me');
      if (response.data?.success && response.data?.data) {
        const d = response.data.data;
        const stats = d.teacherDetails || {};

        setProfileData({
          username: d.username || d.employeeId || "jaga",
          fullName: d.fullName || d.name || "jaga",
          email: d.email || "jaga@gmail.com",
          phone: d.phone || d.mobileNumber || "Not Available",
          department: d.department || d.departmentName || "Cyber Security",
          status: d.accountStatus || d.status || "Active",
          employeeId: d.employeeId || d.username || "jaga",
          totalStudents: stats.totalStudents ?? d.totalStudents ?? 0,
          attendanceTaken: stats.attendanceTakenCount ?? d.attendanceTaken ?? 0,
          role: (d.role || "TEACHER").replace("ROLE_", "")
        });
      }
    } catch (e) {
      console.error("Failed to fetch profile:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    logout();
    toast.success("Signed out successfully");
    navigate('/login');
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.trim().length < 4) {
      toast.error("Password must be at least 4 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    setIsChangingPass(true);
    const toastId = toast.loading("Updating password...");
    try {
      await apiClient.post('/api/v1/auth/change-password', { newPassword: newPassword.trim() });
      toast.dismiss(toastId);
      toast.success("Password updated successfully!");
      setIsPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error(e);
      toast.error(e.response?.data?.message || "Failed to update password");
    } finally {
      setIsChangingPass(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return 'J';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 relative pb-24">
      <div className="flex-1 p-4 md:p-6 max-w-lg mx-auto w-full space-y-6 pt-6">
        
        {/* Top Avatar Header (Flutter Aligned 1:1) */}
        <div className="flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-rose-100/70 border-4 border-white shadow-md flex items-center justify-center mb-3">
            <span className="text-3xl font-black text-rose-500">
              {getInitials(profileData.fullName)}
            </span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">{profileData.fullName}</h2>
          <p className="text-xs font-bold text-slate-400 tracking-wider uppercase mt-0.5">
            {profileData.role} {isCC ? '• CLASS COORDINATOR' : ''}
          </p>
        </div>

        {/* Card 1: Personal Information (Flutter Aligned 1:1) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-base text-center pb-2 border-b border-slate-100">
            Personal Information
          </h3>

          <div className="space-y-2.5 text-xs md:text-sm">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-400">Username</span>
              <span className="font-bold text-slate-900">{profileData.username}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-400">Email</span>
              <span className="font-bold text-slate-900 truncate max-w-[200px]">{profileData.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-400">Phone</span>
              <span className="font-bold text-slate-900">{profileData.phone}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-400">Department</span>
              <span className="font-bold text-slate-900">{profileData.department}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-400">Status</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {profileData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Teacher Information (Flutter Aligned 1:1) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-900 text-base text-center pb-2 border-b border-slate-100">
            Teacher Information
          </h3>

          <div className="space-y-2.5 text-xs md:text-sm">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-400">Employee ID</span>
              <span className="font-bold text-slate-900">{profileData.employeeId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-400">Total Students</span>
              <span className="font-bold text-slate-900">{profileData.totalStudents}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-400">Attendance Taken</span>
              <span className="font-bold text-slate-900">{profileData.attendanceTaken}</span>
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons (Flutter Aligned 1:1) */}
        <div className="space-y-3 pt-2">
          {/* Change Password Button (Blue #4F46E5) */}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full bg-[#4338CA] hover:bg-[#3730A3] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>Change Password</span>
          </button>

          {/* Logout Button (Red #EF4444) */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white font-bold py-3.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

      </div>

      {/* Change Password Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
              <button 
                onClick={() => setIsPasswordModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password..."
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Confirm New Password</label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password..."
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 text-sm"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 font-semibold text-xs hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPass}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 rounded-xl shadow-xs flex items-center space-x-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      <LogoutModal
        open={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
