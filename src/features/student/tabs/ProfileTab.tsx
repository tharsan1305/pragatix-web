import { useState, useEffect } from 'react';
import { User as UserIcon, Lock, LogOut, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../store/authContext';
import apiClient from '../../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import LogoutModal from '../../../components/common/LogoutModal';

export default function ProfileTab() {
  const { token, user: authUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  
  const [profile, setProfile] = useState<any>({
    fullName: authUser?.fullName || "surendar",
    username: authUser?.username || authUser?.sprNo || "99",
    email: authUser?.email || "saarendar@gmail.com",
    phone: authUser?.phone || "1234567890",
    department: authUser?.department || "Cyber Security",
    accountStatus: "Active",
    role: "STUDENT",
    studentDetails: {
      registerNumber: authUser?.username || "99",
      academicYear: authUser?.year || "First Year",
      section: authUser?.section || "A",
      isCaptain: authUser?.isCaptain || false,
      isViceCaptain: authUser?.isViceCaptain || false,
      currentXp: authUser?.totalXp ?? authUser?.score ?? -10,
      attendancePercentage: 100,
      rank: authUser?.rank || 265,
    }
  });

  useEffect(() => {
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      // Call GET /api/v1/profile/me matching Flutter ProfileRepository.getMyProfile
      let response;
      try {
        response = await apiClient.get('/api/v1/profile/me');
      } catch (_) {
        response = await apiClient.get('/api/v1/auth/me');
      }

      if (response.data?.success && response.data?.data) {
        const d = response.data.data;
        const stDetails = d.studentDetails || {};

        const isCap = d.isCaptain || stDetails.isCaptain || d.teamRole === 'CAPTAIN';
        const isVice = d.isViceCaptain || stDetails.isViceCaptain || d.teamRole === 'VICE_CAPTAIN';

        setProfile({
          fullName: d.fullName || d.name || profile.fullName,
          username: d.username || d.regNo || d.registerNumber || profile.username,
          email: d.email || profile.email,
          phone: d.phone || profile.phone,
          department: d.department || d.departmentName || profile.department,
          accountStatus: d.accountStatus || d.status || "Active",
          role: d.role ? String(d.role).replace(/_/g, ' ') : (d.userType ? String(d.userType).replace(/_/g, ' ') : "STUDENT"),
          studentDetails: {
            registerNumber: stDetails.registerNumber || d.registerNumber || d.username || profile.studentDetails.registerNumber,
            academicYear: stDetails.academicYear || d.year || d.academicYear || profile.studentDetails.academicYear,
            section: stDetails.section || d.section || profile.studentDetails.section,
            isCaptain: isCap,
            isViceCaptain: isVice,
            currentXp: stDetails.currentXp ?? d.totalXp ?? d.score ?? profile.studentDetails.currentXp,
            attendancePercentage: stDetails.attendancePercentage ?? d.attendancePercentage ?? profile.studentDetails.attendancePercentage,
            rank: stDetails.rank ?? d.rank ?? profile.studentDetails.rank,
          }
        });
      }
    } catch (e) {
      console.warn("Failed to load profile details:", e);
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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  const leadershipRole = profile.studentDetails?.isCaptain 
    ? 'Captain' 
    : (profile.studentDetails?.isViceCaptain ? 'Vice Captain' : 'Member');

  const SharedProfileRow = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex justify-between items-center py-2">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span className="text-xs font-bold text-slate-800 text-right">{value}</span>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header Bar matching Flutter AppBar */}
      <div className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-10 shadow-md flex items-center justify-between">
        <h1 className="text-xl font-bold">Profile</h1>
        <button
          onClick={fetchProfile}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors"
          title="Refresh Profile"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Profile Avatar Header Card matching Flutter SharedProfileHeader */}
        <div className="flex flex-col items-center py-6 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-3 shadow-inner">
            <UserIcon className="w-10 h-10 text-slate-500" />
          </div>
          
          <h2 className="text-xl font-extrabold text-slate-900 text-center">{profile.fullName}</h2>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            {profile.role}
          </span>
        </div>

        {/* Card 1: Personal Information matching Flutter _buildCommonInfoCard */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-1">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Personal Information</h3>
          <div className="h-px bg-slate-100 -mx-4 mb-2" />
          
          <SharedProfileRow label="Username" value={profile.username} />
          <SharedProfileRow label="Email" value={profile.email} />
          <SharedProfileRow label="Phone" value={profile.phone} />
          <SharedProfileRow label="Department" value={profile.department} />
          <SharedProfileRow label="Status" value={profile.accountStatus} />
        </div>

        {/* Card 2 & 3: Academic Details & Performance matching Flutter _buildStudentCard */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2">Academic Details</h3>
            <div className="h-px bg-slate-100 -mx-4 mb-2" />

            <SharedProfileRow label="Register Number" value={profile.studentDetails.registerNumber} />
            <SharedProfileRow label="Academic Year" value={profile.studentDetails.academicYear} />
            <SharedProfileRow label="Section" value={profile.studentDetails.section} />
            <SharedProfileRow label="Leadership Role" value={leadershipRole} />
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-900 mb-2 pt-2">Performance</h3>
            <div className="h-px bg-slate-100 -mx-4 mb-2" />

            <SharedProfileRow label="Current XP" value={profile.studentDetails.currentXp} />
            <SharedProfileRow label="Attendance" value={`${profile.studentDetails.attendancePercentage}%`} />
            <SharedProfileRow label="Rank" value={profile.studentDetails.rank} />
          </div>
        </div>

        {/* Quick Actions matching Flutter _buildQuickActions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={() => toast.success("Password change feature coming soon")}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            <Lock className="w-4 h-4" />
            <span>Change Password</span>
          </button>

          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      <LogoutModal
        open={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
