import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { 
  LogOut, RefreshCw, ShieldCheck, Mail, Phone, Building, 
  Users, GraduationCap, CheckCircle2, 
  Database, UserCheck, KeyRound, Sparkles, ArrowLeft
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../store/authContext';
import apiClient from '../../../services/apiClient';
import LogoutModal from '../../../components/common/LogoutModal';
import { ROLE_ACCESS, getEffectiveRole } from '../../../config/roleAccess';

interface Props {
  onBack?: () => void;
}

export default function AdminProfileTab({ onBack }: Props = {}) {
  const auth = useAuth();
  const { logout, user, isSuperAdmin, isHOD, isAdmin, role, subRoles } = auth;
  const effectiveRole = getEffectiveRole(user, { isSuperAdmin, isHOD, isAdmin, role, subRoles });
  const roleConfig = ROLE_ACCESS[effectiveRole];

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);
  const [showCacheConfirm, setShowCacheConfirm] = useState(false);

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

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-accent" />
          <p className="type-body-sm text-text-secondary font-medium">Loading profile credentials...</p>
        </div>
      </div>
    );
  }

  const superAdminStats = profile?.superAdminDetails;
  const adminStats = profile?.adminDetails;
  const isSuper = effectiveRole === 'SUPER_ADMIN';
  const isYearAdmin = effectiveRole === 'ADMIN';
  const isHodUser = effectiveRole === 'HOD';

  const fullName = profile?.fullName || user?.name || 'Administrator';
  const username = profile?.username || user?.username || 'admin';
  const email = profile?.email || user?.email || 'admin@pragatix.edu';
  const phone = profile?.phone || user?.phone || 'Not Configured';

  return (
    <div className="flex flex-col min-h-full bg-bg pb-16">
      <div className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 md:p-8 space-y-6">
        
        {/* Back Button */}
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
                {fullName.charAt(0).toUpperCase()}
              </div>

              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                  <h1 className="type-h2 font-black text-text-primary tracking-tight">
                    {fullName}
                  </h1>
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-accent-tint text-accent border border-accent/20 type-fine font-bold tracking-wider uppercase">
                    <Sparkles className="w-3 h-3" />
                    <span>{roleConfig.roleDisplayName}</span>
                  </span>
                </div>

                <p className="type-body-sm font-mono font-bold text-text-secondary">
                  @{username}
                </p>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-md bg-bg border border-border text-text-secondary type-fine font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-accent" />
                    <span>
                      {isSuper ? 'JJCET Campus-Wide Scope' : isYearAdmin ? `Assigned Year: ${adminStats?.academicYear || 'All'}` : `Dept: ${profile?.department || 'HOD Scope'}`}
                    </span>
                  </span>

                  <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 type-fine font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>Active Credentials</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-center md:self-start">
              {roleConfig.canManageAdmins && (
                <button
                  onClick={() => setShowCacheConfirm(true)}
                  disabled={isRefreshingCache}
                  className="px-4 py-2.5 bg-bg hover:bg-card text-text-primary border border-border rounded-xl type-caption font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-xs disabled:opacity-50"
                  title="Synchronize and refresh Redis database cache"
                >
                  <RefreshCw className={`w-4 h-4 text-accent ${isRefreshingCache ? 'animate-spin' : ''}`} />
                  <span>Sync Cache</span>
                </button>
              )}

              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="px-4 py-2.5 bg-accent-tint hover:bg-accent-tint/80 text-accent border border-accent/20 rounded-xl type-caption font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-xs"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Account Details */}
          <div className="space-y-6 lg:col-span-1">
            {/* Personal Information Card */}
            <div className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6 space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center text-text-primary">
                  <UserCheck className="w-4 h-4" />
                </div>
                <h3 className="type-h5 font-bold text-text-primary">
                  Personal Information
                </h3>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="type-fine text-text-muted font-bold uppercase tracking-wider block mb-0.5">Username</label>
                  <p className="type-body-sm font-bold text-text-primary font-mono">{username}</p>
                </div>

                <div className="pt-2 border-t border-border-subtle">
                  <label className="type-fine text-text-muted font-bold uppercase tracking-wider block mb-0.5 flex items-center gap-1.5">
                    <Mail className="w-3 h-3 text-text-muted" />
                    <span>Official Email</span>
                  </label>
                  <p className="type-body-sm font-bold text-text-primary truncate" title={email}>{email}</p>
                </div>

                <div className="pt-2 border-t border-border-subtle">
                  <label className="type-fine text-text-muted font-bold uppercase tracking-wider block mb-0.5 flex items-center gap-1.5">
                    <Phone className="w-3 h-3 text-text-muted" />
                    <span>Contact Phone</span>
                  </label>
                  <p className="type-body-sm font-bold text-text-primary">{phone}</p>
                </div>

                <div className="pt-2 border-t border-border-subtle">
                  <label className="type-fine text-text-muted font-bold uppercase tracking-wider block mb-0.5 flex items-center gap-1.5">
                    <Building className="w-3 h-3 text-text-muted" />
                    <span>Administrative Scope</span>
                  </label>
                  <p className="type-body-sm font-bold text-text-primary">
                    {isSuper ? 'Campus-Wide (Institution)' : isYearAdmin ? `Academic Year: ${adminStats?.academicYear || 'All'}` : `Department: ${profile?.department || 'N/A'}`}
                  </p>
                </div>

                <div className="pt-2 border-t border-border-subtle">
                  <label className="type-fine text-text-muted font-bold uppercase tracking-wider block mb-0.5">Status</label>
                  <span className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold type-fine">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    <span>{profile?.accountStatus || 'Active & Authorized'}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6 space-y-3">
              <h4 className="type-h5 font-bold text-text-primary pb-2 border-b border-border">Session Controls</h4>
              
              {roleConfig.canManageAdmins && (
                <button
                  onClick={() => setShowCacheConfirm(true)}
                  disabled={isRefreshingCache}
                  className="w-full py-2.5 px-4 bg-bg hover:bg-card text-text-primary border border-border rounded-xl type-caption font-bold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 text-accent ${isRefreshingCache ? 'animate-spin' : ''}`} />
                  <span>Flush & Sync Cache</span>
                </button>
              )}

              <button
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full py-2.5 px-4 bg-accent-tint hover:bg-accent-tint/80 text-accent border border-accent/20 rounded-xl type-caption font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out of Session</span>
              </button>
            </div>
          </div>

          {/* Right Column: System Statistics & Permissions Overview */}
          <div className="space-y-6 lg:col-span-2">
            
            {/* System Metrics Grid for Super Admin */}
            {isSuper && superAdminStats && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="type-h4 font-bold text-text-primary">Institutional Metrics</h3>
                  <span className="type-fine font-bold text-text-secondary bg-bg px-2.5 py-1 rounded-md border border-border">
                    Live System Totals
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Total Departments */}
                  <div className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent shrink-0">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block type-h3 font-black text-text-primary">{superAdminStats.totalDepartments}</span>
                      <span className="type-caption text-text-secondary font-bold">Total Departments</span>
                    </div>
                  </div>

                  {/* Total Students */}
                  <div className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block type-h3 font-black text-accent">{superAdminStats.totalStudents}</span>
                      <span className="type-caption text-text-secondary font-bold">Active Students</span>
                    </div>
                  </div>

                  {/* Total Faculty */}
                  <div className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent shrink-0">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block type-h3 font-black text-text-primary">{superAdminStats.totalTeachers}</span>
                      <span className="type-caption text-text-secondary font-bold">Faculty Members</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Academic Year Metrics for Year Admin */}
            {isYearAdmin && adminStats && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="type-h4 font-bold text-text-primary">Academic Year Metrics</h3>
                  <span className="type-fine font-bold text-text-secondary bg-bg px-2.5 py-1 rounded-md border border-border">
                    {adminStats.academicYear || 'Assigned Year'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent shrink-0">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block type-h3 font-black text-text-primary">{adminStats.academicYear || 'All'}</span>
                      <span className="type-caption text-text-secondary font-bold">Assigned Cohort</span>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block type-h3 font-black text-accent">{adminStats.totalStudentsInYear ?? 0}</span>
                      <span className="type-caption text-text-secondary font-bold">Cohort Students</span>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent shrink-0">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block type-h3 font-black text-text-primary">{adminStats.totalGroups ?? 0}</span>
                      <span className="type-caption text-text-secondary font-bold">Active Teams</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Department Metrics for HOD */}
            {isHodUser && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="type-h4 font-bold text-text-primary">Department Metrics</h3>
                  <span className="type-fine font-bold text-text-secondary bg-bg px-2.5 py-1 rounded-md border border-border">
                    {profile?.department || user?.department || 'Department Scope'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent shrink-0">
                      <Building className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block type-h3 font-black text-text-primary">{profile?.department || user?.department || 'Assigned'}</span>
                      <span className="type-caption text-text-secondary font-bold">Department Scope</span>
                    </div>
                  </div>

                  <div className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent shrink-0">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="block type-h3 font-black text-accent">HOD Lead</span>
                      <span className="type-caption text-text-secondary font-bold">Department Head Access</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privileges & Governance Card */}
            <div className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6 space-y-4">
              <div className="flex items-center space-x-2.5 pb-3 border-b border-border">
                <div className="w-8 h-8 rounded-lg bg-bg border border-border flex items-center justify-center text-accent">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="type-h5 font-bold text-text-primary">
                    Administrative Privileges & Permissions
                  </h3>
                  <p className="type-fine text-text-secondary font-medium">Authorized system capabilities assigned to your security role</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {[
                  { title: 'Campus-Wide Data Scope', desc: 'Full institutional visibility across all academic cohorts', active: isSuper },
                  { title: 'Activity & Threshold Engine', desc: 'Configure stages, points, and minimum graduation thresholds', active: true },
                  { title: 'Attendance Engine & AWD', desc: 'Manage AWD multipliers, monthly academic calendars & rules', active: true },
                  { title: 'Group & Peer Learning Roster', desc: 'Create student teams, assign captains, and configure rewards', active: true },
                  { title: 'Badge Application Verification', desc: 'Review, preview proof documents, and grant or reject badges', active: true },
                  { title: 'Year Administrators Management', desc: 'Assign and oversee dedicated Year Admins for all classes', active: isSuper },
                ].map((priv, idx) => (
                  <div 
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-start space-x-3 transition-colors ${
                      priv.active 
                        ? 'bg-bg border-border text-text-primary' 
                        : 'bg-bg/50 border-border/50 opacity-60 text-text-muted'
                    }`}
                  >
                    <CheckCircle2 className={`w-5 h-5 shrink-0 mt-0.5 ${priv.active ? 'text-emerald-600' : 'text-text-muted'}`} />
                    <div>
                      <h4 className="type-caption font-bold text-text-primary">{priv.title}</h4>
                      <p className="type-fine text-text-secondary mt-0.5">{priv.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* System Engine Health Card */}
            <div className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3 text-center sm:text-left">
                <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center text-text-primary shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="type-caption font-bold text-text-primary">Database & Engine Synchronization</h4>
                  <p className="type-fine text-text-secondary">PragatiX Core Engine • REST v1 & v8 Engine Connected</p>
                </div>
              </div>

              <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 type-fine font-bold shrink-0">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <span>Engine Operational</span>
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* Cache Refresh Confirmation Modal */}
      {showCacheConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-card border border-border w-full max-w-sm rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="type-h5 font-bold text-text-primary">Flush System Cache?</h3>
                <p className="type-fine text-text-secondary">PragatiX Institution-Wide Sync</p>
              </div>
            </div>

            <p className="type-body-sm text-text-secondary font-medium">
              This will refresh and synchronize cached analytics, student rosters, and leaderboards across all departments. Continue?
            </p>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-border">
              <button
                onClick={() => setShowCacheConfirm(false)}
                className="px-4 py-2 type-btn font-bold text-text-secondary hover:text-text-primary hover:bg-bg border border-border rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowCacheConfirm(false);
                  handleRefreshCache();
                }}
                disabled={isRefreshingCache}
                className="px-5 py-2 type-btn font-bold text-card bg-accent hover:bg-accent-hover rounded-lg shadow-none transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                {isRefreshingCache ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Refresh Cache</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      <LogoutModal
        open={isLogoutModalOpen}
        onCancel={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
