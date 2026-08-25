import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { 
  LogOut, RefreshCw, Mail, Phone, Building, 
  GraduationCap, ShieldCheck, Sparkles, Award, 
  Calendar, Trophy, BookOpen, User, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../store/authContext';
import apiClient from '../../../services/apiClient';
import { useNavigate } from 'react-router-dom';
import LogoutModal from '../../../components/common/LogoutModal';

interface ProfileTabProps {
  onBack?: () => void;
}

export default function ProfileTab({ onBack }: ProfileTabProps = {}) {
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
          accountStatus: d.accountStatus || d.status || "Active",
          role: d.role ? String(d.role).replace(/_/g, ' ') : (d.userType ? String(d.userType).replace(/_/g, ' ') : "STUDENT"),
          studentDetails: {
            registerNumber: stDetails.registerNumber || d.registerNumber || d.username || "",
            academicYear: stDetails.academicYear || d.year || d.academicYear || "",
            section: stDetails.section || d.section || "",
            currentXp: stDetails.currentXp ?? d.totalXp ?? d.score ?? 0,
            attendancePercentage: realAttendancePct !== null ? realAttendancePct : (stDetails.attendancePercentage ?? 0),
            rank: stDetails.rank || d.rank || 1,
            isCaptain: d.isCaptain ?? (d.teamRole === 'CAPTAIN'),
            isViceCaptain: d.isViceCaptain ?? (d.teamRole === 'VICE_CAPTAIN'),
          }
        });
      }
    } catch (err: any) {
      logger.error('Error fetching profile:', err);
      setError(err?.message || 'Failed to load profile');
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

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg p-6 text-center space-y-4">
        <p className="type-body-sm font-semibold text-accent">Error loading profile: {error}</p>
        <button
          onClick={fetchProfile}
          className="inline-flex items-center type-btn px-5 py-2.5 bg-accent hover:bg-accent-hover text-card rounded-xl font-semibold shadow-none transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <p className="text-text-muted font-medium type-body-sm">Profile not found.</p>
      </div>
    );
  }

  const isCaptain = profile.studentDetails?.isCaptain;
  const isViceCaptain = profile.studentDetails?.isViceCaptain;
  const leadershipRole = isCaptain ? 'Captain' : (isViceCaptain ? 'Vice Captain' : 'Team Member');

  const getInitials = (name: string) => {
    if (!name) return 'S';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  return (
    <div className="bg-bg min-h-screen pb-24 text-text-primary">
      {/* Header Bar */}
      <div className="bg-card text-text-primary px-6 py-5 sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 border border-border bg-card hover:bg-bg rounded-lg transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">Account Profile</h1>
            <p className="type-caption text-text-secondary font-medium mt-0.5">Manage personal information and academic credentials</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-accent hover:bg-accent-hover text-card rounded-xl type-caption font-bold flex items-center gap-2 transition-colors cursor-pointer"
            title="Export / Print XP Transcript"
          >
            <span>🖨️ Export Transcript</span>
          </button>
          <button
            onClick={fetchProfile}
            className="p-2 bg-bg hover:bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Refresh Profile"
          >
            <RefreshCw className={`w-4 h-4 text-accent ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-5 lg:p-7 xl:p-8 max-w-[1400px] mx-auto space-y-6">
        {/* Profile Hero Card */}
        <div className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] p-6 sm:p-8 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-bg border-2 border-border flex items-center justify-center text-accent font-black text-3xl sm:text-4xl shadow-xs shrink-0">
              {getInitials(profile.fullName)}
            </div>

            <div className="space-y-1.5 flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                <h2 className="type-h2 font-black text-text-primary tracking-tight truncate">
                  {profile.fullName}
                </h2>
                {(isCaptain || isViceCaptain) ? (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent border border-accent/20 type-fine font-bold tracking-wider uppercase">
                    <Award className="w-3.5 h-3.5" />
                    <span>{isCaptain ? '👑 CAPTAIN' : '🥈 VICE CAPTAIN'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-bg text-text-secondary border border-border type-fine font-bold tracking-wider uppercase">
                    <Sparkles className="w-3 h-3 text-accent" />
                    <span>STUDENT</span>
                  </span>
                )}
              </div>

              <p className="type-body-sm font-mono font-bold text-text-secondary">
                Reg No: {profile.username || profile.studentDetails?.registerNumber || 'N/A'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="px-2.5 py-1 rounded-md bg-bg border border-border text-text-secondary type-fine font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                  <span>{profile.department || 'General'}</span>
                </span>

                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 type-fine font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>{profile.accountStatus || 'Active'}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Card 1: Contact & Personal Details */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="type-h4 font-bold text-text-primary flex items-center gap-2 pb-3 border-b border-border">
              <User className="w-4 h-4 text-accent" />
              <span>Contact & Personal</span>
            </h3>

            <div className="space-y-3.5 type-body-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-text-muted" /> Email
                </span>
                <span className="font-bold text-text-primary truncate max-w-[200px]">{profile.email || 'Not Provided'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-text-muted" /> Phone
                </span>
                <span className="font-bold text-text-primary">{profile.phone || 'Not Provided'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium flex items-center gap-2">
                  <Building className="w-4 h-4 text-text-muted" /> Department
                </span>
                <span className="font-bold text-text-primary truncate max-w-[200px]">{profile.department}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-text-muted" /> Year & Section
                </span>
                <span className="font-bold text-text-primary">{profile.studentDetails?.academicYear || '1st'} Year • Sec {profile.studentDetails?.section || 'A'}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Academic Leadership & Performance */}
          <div className="bg-card rounded-2xl p-6 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] space-y-4">
            <h3 className="type-h4 font-bold text-text-primary flex items-center gap-2 pb-3 border-b border-border">
              <GraduationCap className="w-4 h-4 text-accent" />
              <span>Performance & Leadership</span>
            </h3>

            <div className="space-y-3.5 type-body-sm">
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium flex items-center gap-2">
                  <Award className="w-4 h-4 text-text-muted" /> Leadership Role
                </span>
                <span className="font-bold text-accent">{leadershipRole}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-text-muted" /> Discipline / Total XP
                </span>
                <span className="font-black text-text-primary">{profile.studentDetails?.currentXp ?? 0} XP</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-text-muted" /> Overall Attendance
                </span>
                <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 type-fine">
                  {profile.studentDetails?.attendancePercentage ?? 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-secondary font-medium flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-text-muted" /> Class Rank
                </span>
                <span className="font-bold text-text-primary">#{profile.studentDetails?.rank || 1}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="pt-2">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full py-3.5 bg-accent hover:bg-accent-hover text-card rounded-xl type-btn transition flex items-center justify-center gap-2 shadow-none cursor-pointer font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out from Captain Portal</span>
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
