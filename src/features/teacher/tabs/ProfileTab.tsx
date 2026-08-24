import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';

import { LogOut, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../store/authContext';
import apiClient from '../../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import LogoutModal from '../../../components/common/LogoutModal';

interface ProfileState {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  department: string;
  status: string;
  role: string;
  ccDetails?: {
    section?: string;
    academicYear?: string;
  } | null;
  hodDetails?: {
    totalFaculty?: number;
    totalStudents?: number;
  } | null;
  teacherDetails?: {
    employeeId?: string;
    totalStudents?: number;
    attendanceTakenCount?: number;
  } | null;
  adminDetails?: {
    academicYear?: string;
  } | null;
}

export default function ProfileTab() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [profile, setProfile] = useState<ProfileState>({
    fullName: "Teacher",
    username: "teacher",
    email: "Not Available",
    phone: "Not Available",
    department: "Not Available",
    status: "Active",
    role: "TEACHER",
    ccDetails: null,
    hodDetails: null,
    teacherDetails: null,
    adminDetails: null
  });

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
        const d = response.data.data;

        setProfile({
          fullName: d.fullName || d.name || "User",
          username: d.username || d.employeeId || "user",
          email: d.email || "Not Available",
          phone: d.phone || d.mobileNumber || "Not Available",
          department: d.department || d.departmentName || "Not Available",
          status: d.accountStatus || d.status || "Active",
          role: d.role ? String(d.role).replace("ROLE_", "") : "TEACHER",
          ccDetails: d.ccDetails || null,
          hodDetails: d.hodDetails || null,
          teacherDetails: d.teacherDetails || null,
          adminDetails: d.adminDetails || null,
        });
      }
    } catch (e) {
      logger.error("Failed to fetch profile:", e);
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
            <span className="type-h2 font-black text-rose-500">
              {getInitials(profile.fullName)}
            </span>
          </div>
          <h2 className="type-h3 text-slate-900">{profile.fullName}</h2>
          <p className="type-caption font-bold text-slate-400 tracking-wider uppercase mt-0.5">
            {profile.role}
          </p>
        </div>

        {/* Card 1: Personal Information (Flutter Aligned 1:1) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
          <h3 className="type-h5 text-slate-900 text-center pb-2 border-b border-slate-100">
            Personal Information
          </h3>

          <div className="space-y-2.5 type-caption">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-400">Username</span>
              <span className="font-bold text-slate-900">{profile.username}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-400">Email</span>
              <span className="font-bold text-slate-900 truncate max-w-[220px]">{profile.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-400">Phone</span>
              <span className="font-bold text-slate-900">{profile.phone}</span>
            </div>
            {profile.adminDetails ? (
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-400">Assigned Year</span>
                <span className="font-bold text-slate-900">{profile.adminDetails.academicYear || 'Not Available'}</span>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-400">Department</span>
                <span className="font-bold text-slate-900">{profile.department}</span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="font-semibold text-slate-400">Status</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {profile.status}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Role-Specific Details (Flutter Aligned 1:1) */}
        {profile.ccDetails && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="type-h5 text-slate-900 text-center pb-2 border-b border-slate-100">
              Class Coordinator Info
            </h3>
            <div className="space-y-2.5 type-caption">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-400">Section</span>
                <span className="font-bold text-slate-900">{profile.ccDetails.section || 'Not Available'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-400">Assigned Year</span>
                <span className="font-bold text-slate-900">{profile.ccDetails.academicYear || 'Not Available'}</span>
              </div>
            </div>
          </div>
        )}

        {profile.hodDetails && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="type-h5 text-slate-900 text-center pb-2 border-b border-slate-100">
              HOD Statistics
            </h3>
            <div className="space-y-2.5 type-caption">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-400">Total Faculty</span>
                <span className="font-bold text-slate-900">{profile.hodDetails.totalFaculty ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-400">Total Students</span>
                <span className="font-bold text-slate-900">{profile.hodDetails.totalStudents ?? 0}</span>
              </div>
            </div>
          </div>
        )}

        {profile.teacherDetails && !profile.ccDetails && !profile.hodDetails && (
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
            <h3 className="type-h5 text-slate-900 text-center pb-2 border-b border-slate-100">
              Teacher Information
            </h3>
            <div className="space-y-2.5 type-caption">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-400">Employee ID</span>
                <span className="font-bold text-slate-900">{profile.teacherDetails.employeeId || 'Not Available'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-400">Total Students</span>
                <span className="font-bold text-slate-900">{profile.teacherDetails.totalStudents ?? 0}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-400">Attendance Taken</span>
                <span className="font-bold text-slate-900">{profile.teacherDetails.attendanceTakenCount ?? 0}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Action Buttons (Flutter Aligned 1:1) */}
        <div className="space-y-3 pt-2">
          {/* Logout Button */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full bg-[#DC2626] hover:bg-[#B91C1C] text-white type-btn py-3.5 px-4 rounded-2xl shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
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

      {/* Logout Modal */}
      <LogoutModal
        open={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
