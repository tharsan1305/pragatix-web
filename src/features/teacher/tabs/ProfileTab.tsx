import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { 
  LogOut, RefreshCw, Mail, Phone, Building, 
  GraduationCap, ShieldCheck, Sparkles, ArrowLeft, 
  UserCheck, CalendarCheck, Users, Briefcase 
} from 'lucide-react';
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

interface Props {
  onBack?: () => void;
}

export default function ProfileTab({ onBack }: Props = {}) {
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
      <div className="flex h-screen items-center justify-center bg-bg text-text-primary">
        <RefreshCw className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  const getInitials = (name: string) => {
    if (!name) return 'T';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <div className="flex flex-col min-h-full bg-bg relative pb-24 text-text-primary">
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6">
        
        {/* Top Back Button */}
        {onBack && (
          <div>
            <button
              onClick={onBack}
              className="px-3.5 py-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer inline-flex items-center gap-2 type-caption font-bold shadow-xs"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Overview</span>
            </button>
          </div>
        )}

        {/* Profile Hero Card */}
        <div className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
            {/* Left: Avatar + Details */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-bg border-2 border-border flex items-center justify-center text-accent font-black text-3xl sm:text-4xl shadow-xs shrink-0">
                {getInitials(profile.fullName)}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="type-h2 font-black text-text-primary tracking-tight">
                    {profile.fullName}
                  </h1>
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent border border-accent/20 type-fine font-bold tracking-wider uppercase">
                    <Sparkles className="w-3 h-3" />
                    <span>{profile.role}</span>
                  </span>
                </div>

                <p className="type-body-sm font-mono font-bold text-text-secondary">
                  @{profile.username}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-md bg-bg border border-border text-text-secondary type-fine font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                    <span>{profile.department}</span>
                  </span>

                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 type-fine font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Active Credentials</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Refresh */}
            <div className="flex items-center gap-2">
              <button
                onClick={fetchProfile}
                className="p-2.5 bg-bg hover:bg-card border border-border rounded-xl text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                title="Refresh Profile"
              >
                <RefreshCw className="w-4 h-4 text-accent" />
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Contact & Department Information */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="type-h4 font-bold text-text-primary flex items-center gap-2 pb-3 border-b border-border">
              <Building className="w-4 h-4 text-accent" />
              <span>Contact & Department</span>
            </h3>

            <div className="space-y-3.5 type-body-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-text-muted" /> Email
                </span>
                <span className="font-bold text-text-primary truncate max-w-[200px]">{profile.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-text-muted" /> Phone
                </span>
                <span className="font-bold text-text-primary">{profile.phone}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium flex items-center gap-2">
                  <Building className="w-4 h-4 text-text-muted" /> Department
                </span>
                <span className="font-bold text-text-primary">{profile.department}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-text-muted" /> Account Status
                </span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 type-fine">
                  {profile.status}
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Faculty Role & Teaching Statistics */}
          <div className="bg-card rounded-xl p-6 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="type-h4 font-bold text-text-primary flex items-center gap-2 pb-3 border-b border-border">
              <GraduationCap className="w-4 h-4 text-accent" />
              <span>Academic & Role Info</span>
            </h3>

            <div className="space-y-3.5 type-body-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-text-muted" /> Employee ID
                </span>
                <span className="font-bold text-text-primary font-mono">{profile.username}</span>
              </div>

              {profile.ccDetails ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary font-medium flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-text-muted" /> Assigned Class
                    </span>
                    <span className="font-bold text-text-primary">{profile.ccDetails.section || 'Class Coordinator'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-text-muted" /> Academic Year
                    </span>
                    <span className="font-bold text-text-primary">{profile.ccDetails.academicYear || 'All'}</span>
                  </div>
                </>
              ) : profile.hodDetails ? (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-text-muted" /> Total Faculty
                    </span>
                    <span className="font-bold text-text-primary">{profile.hodDetails.totalFaculty ?? 0} Mentors</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary font-medium flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-text-muted" /> Department Students
                    </span>
                    <span className="font-bold text-text-primary">{profile.hodDetails.totalStudents ?? 0} Students</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary font-medium flex items-center gap-2">
                      <Users className="w-4 h-4 text-text-muted" /> Mentored Students
                    </span>
                    <span className="font-bold text-text-primary">{profile.teacherDetails?.totalStudents ?? 0} Students</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-text-secondary font-medium flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-text-muted" /> Attendance Marked
                    </span>
                    <span className="font-bold text-text-primary">{profile.teacherDetails?.attendanceTakenCount ?? 0} Sessions</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Buttons */}
        <div className="pt-2">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full bg-accent hover:bg-accent-hover text-card type-btn py-3 px-4 rounded-xl shadow-none transition-all flex items-center justify-center space-x-2 cursor-pointer font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out from Teacher Portal</span>
          </button>
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
