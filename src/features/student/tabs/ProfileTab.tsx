import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { User as UserIcon, LogOut, RefreshCw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../store/authContext';
import apiClient from '../../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import LogoutModal from '../../../components/common/LogoutModal';

export default function ProfileTab() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Call GET /api/v1/profile/me and attendance summary in parallel
      const [profileRes, attSummaryRes] = await Promise.allSettled([
        apiClient.get('/api/v1/profile/me').catch(() => apiClient.get('/api/v1/auth/me')),
        apiClient.get('/api/student/attendance/summary').catch(() => null),
      ]);

      let d: any = null;
      if (profileRes.status === 'fulfilled' && profileRes.value?.data?.data) {
        d = profileRes.value.data.data;
      }

      let realAttendancePct: number | null = null;
      if (attSummaryRes.status === 'fulfilled' && attSummaryRes.value?.data) {
        const attData = attSummaryRes.value.data.data || attSummaryRes.value.data;
        if (attData && attData.attendancePercentage !== undefined) {
          realAttendancePct = Math.round(attData.attendancePercentage);
        }
      }

      if (d) {
        const stDetails = d.studentDetails || {};

        setProfile({
          fullName: d.fullName || d.name || "",
          username: d.username || d.regNo || d.registerNumber || "",
          email: d.email || "",
          phone: d.phone || "",
          department: d.department || d.departmentName || "",
          accountStatus: d.accountStatus || d.status || "",
          role: d.role ? String(d.role).replace(/_/g, ' ') : (d.userType ? String(d.userType).replace(/_/g, ' ') : "STUDENT"),
          studentDetails: {
            registerNumber: stDetails.registerNumber || d.registerNumber || d.username || "",
            academicYear: stDetails.academicYear || d.year || d.academicYear || "",
            section: stDetails.section || d.section || "",
            isCaptain: stDetails.isCaptain ?? d.isCaptain ?? false,
            isViceCaptain: stDetails.isViceCaptain ?? d.isViceCaptain ?? false,
            currentXp: stDetails.currentXp ?? d.totalXp ?? d.score ?? 0,
            attendancePercentage: realAttendancePct !== null ? realAttendancePct : (stDetails.attendancePercentage ?? d.attendancePercentage ?? 0),
            rank: stDetails.rank ?? d.rank ?? 0,
          }
        });
      } else {
        setProfile(null);
      }
    } catch (e: any) {
      logger.warn("Failed to load profile details:", e);
      setError(e.response?.data?.message || "Error loading profile");
      setProfile(null);
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

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-slate-50 gap-4 p-8 text-center">
        <AlertCircle className="w-10 h-10 text-rose-500" />
        <p className="type-body-sm font-semibold text-rose-600">Error loading profile: {error}</p>
        <button
          onClick={fetchProfile}
          className="inline-flex items-center type-btn px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium type-body-sm">Profile not found.</p>
      </div>
    );
  }

  const leadershipRole = profile.studentDetails?.isCaptain
    ? 'Captain'
    : (profile.studentDetails?.isViceCaptain ? 'Vice Captain' : 'Member');

  const SharedProfileRow = ({ label, value }: { label: string; value: string | number }) => (
    <div className="flex justify-between items-center py-2">
      <span className="type-caption text-slate-500">{label}</span>
      <span className="type-caption font-bold text-slate-800 text-right">{value}</span>
    </div>
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header Bar matching Flutter AppBar */}
      <div className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-10 shadow-md flex items-center justify-between">
        <h1 className="type-h4">Profile</h1>
        <button
          onClick={fetchProfile}
          className="p-2 type-btn bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors cursor-pointer"
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
          
          <h2 className="type-h2 text-slate-900 text-center">{profile.fullName}</h2>
          <span className="type-caption font-bold text-slate-400 uppercase tracking-wider mt-0.5">
            {profile.role}
          </span>
        </div>

        {/* Card 1: Personal Information matching Flutter _buildCommonInfoCard */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm space-y-1">
          <h3 className="type-h5 text-slate-900 mb-2">Personal Information</h3>
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
            <h3 className="type-h5 text-slate-900 mb-2">Academic Details</h3>
            <div className="h-px bg-slate-100 -mx-4 mb-2" />

            <SharedProfileRow label="Register Number" value={profile.studentDetails.registerNumber} />
            <SharedProfileRow label="Academic Year" value={profile.studentDetails.academicYear} />
            <SharedProfileRow label="Section" value={profile.studentDetails.section} />
            <SharedProfileRow label="Leadership Role" value={leadershipRole} />
          </div>

          <div>
            <h3 className="type-h5 text-slate-900 mb-2 pt-2">Performance</h3>
            <div className="h-px bg-slate-100 -mx-4 mb-2" />

            <SharedProfileRow label="Current XP" value={profile.studentDetails.currentXp} />
            <SharedProfileRow label="Attendance" value={`${profile.studentDetails.attendancePercentage}%`} />
            <SharedProfileRow label="Rank" value={profile.studentDetails.rank} />
          </div>
        </div>

        {/* Quick Actions matching Flutter _buildQuickActions */}
        <div className="space-y-3 pt-2">
          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl type-btn transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 pb-2">
          <p className="type-caption text-slate-400 tracking-wide">
            JJCET © 2026 All rights reserved
          </p>
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
