import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { 
  RefreshCw, Users, School, Building2, Trophy, Trash2, BarChart3, 
  ArrowRight, Activity, CalendarCheck, Award, ShieldCheck, 
  ChevronRight
} from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../store/authContext';
import { ROLE_ACCESS, getEffectiveRole } from '../../../config/roleAccess';

interface Props {
  onPushView: (name: string, props?: any) => void;
  onNavigateTab?: (slug: string) => void;
}

interface Stats {
  students: number;
  teachers: number;
  departments: number;
  pendingRequests: number;
}

export default function OverviewTab({ onPushView, onNavigateTab }: Props) {
  const auth = useAuth();
  const { user, isSuperAdmin, isHOD, isAdmin, role, subRoles } = auth;
  const effectiveRole = getEffectiveRole(user, { isSuperAdmin, isHOD, isAdmin, role, subRoles });
  const roleConfig = ROLE_ACCESS[effectiveRole];

  const userYear = user?.academicYear || user?.assignedYear || user?.year || (user?.adminDetails?.academicYear);
  const userDept = user?.department || user?.departmentName || user?.dept || (user?.superAdminDetails?.department);

  const scopeLabel = roleConfig.dataScope === 'institution'
    ? 'INSTITUTION SCOPE'
    : roleConfig.dataScope === 'year'
    ? `ADMIN SCOPE: ${userYear || 'ASSIGNED YEAR'}`
    : `HOD SCOPE: ${userDept || 'YOUR DEPARTMENT'}`;

  const [stats, setStats] = useState<Stats>({
    students: 0,
    teachers: 0,
    departments: 0,
    pendingRequests: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const queryParams = {
        scope: roleConfig.dataScope,
        year: userYear,
        department: userDept,
        departmentId: user?.departmentId,
      };

      let response;
      try {
        response = await apiClient.get('/api/v1/admin/stats', { params: queryParams });
      } catch {
        response = await apiClient.get('/api/admin/dashboard/stats', { params: queryParams });
      }
      if (response && response.data) {
        const data = response.data.data || response.data;
        setStats({
          students: Number(data.totalStudents ?? data.students ?? data.studentCount ?? (user?.adminDetails?.totalStudentsInYear ?? 0)),
          teachers: Number(data.teachersCount ?? data.totalTeachers ?? data.teachers ?? data.teacherCount ?? data.totalFaculty ?? data.facultyCount ?? 0),
          departments: Number(data.totalDepartments ?? data.departments ?? data.departmentCount ?? (effectiveRole === 'HOD' ? 1 : 0)),
          pendingRequests: Number(data.pendingBadgeRequests ?? data.pendingRequests ?? data.pending ?? 0),
        });
      }
    } catch (error) {
      logger.error('Failed to fetch admin stats', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleConfig.dataScope, userYear, userDept]);

  const overviewTitle = effectiveRole === 'SUPER_ADMIN' 
    ? 'Super Admin Overview' 
    : effectiveRole === 'HOD' 
    ? 'HOD Overview' 
    : 'Admin Overview';

  const overviewSubtitle = roleConfig.dataScope === 'institution'
    ? 'Executive summary of institution engagement, discipline metrics, and student achievements.'
    : roleConfig.dataScope === 'year'
    ? `Discipline system metrics and student progress for ${userYear ? String(userYear).replace('_', ' ') : 'your assigned year'}.`
    : `Discipline system metrics for ${userDept || 'your department'}.`;

  const handleActionNavigate = (slug: string, fallbackView?: string) => {
    if (onNavigateTab) {
      onNavigateTab(slug);
    } else if (fallbackView) {
      onPushView(fallbackView);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-bg pb-16">
      {/* Header Bar */}
      <div className="bg-card px-6 py-5 border-b border-border text-text-primary sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center space-x-3">
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">{overviewTitle}</h1>
            <span className="px-2.5 py-0.5 rounded-md type-fine font-bold uppercase bg-bg text-text-secondary border border-border tracking-wider">
              {scopeLabel}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPushView('recycle_bin')}
              className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
              title="Recycle Bin"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={fetchStats}
              disabled={isLoading}
              className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 text-accent ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div>
          <h2 className="type-h4 font-bold text-text-primary">
            Welcome back, {user?.name ? user.name : roleConfig.roleDisplayName}
          </h2>
          <p className="type-caption text-text-secondary font-medium mt-0.5">
            {overviewSubtitle}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 lg:px-8 py-6 max-w-[1400px] mx-auto w-full space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-accent" />
            <p className="type-body-sm text-text-secondary font-medium">Loading executive dashboard metrics...</p>
          </div>
        ) : (
          <>
            {/* Quick Launch Analytics Banner (Precision Light) */}
            <div
              onClick={() => onPushView('analytics')}
              className="bg-card text-text-primary rounded-2xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.03)] cursor-pointer hover:border-accent/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5 border border-border group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent rounded-l-2xl" />
              <div className="flex items-start sm:items-center space-x-4 pl-2">
                <div className="w-13 h-13 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent shrink-0 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="type-h4 font-black text-text-primary tracking-tight">Executive Analytics & Reporting</h3>
                    <span className="px-2.5 py-0.5 rounded-md type-fine font-extrabold bg-bg text-text-secondary border border-border tracking-wider uppercase">
                      Live Reports
                    </span>
                  </div>
                  <p className="type-caption text-text-secondary font-medium mt-1 max-w-xl">
                    Live student engagement statistics, departmental point comparisons, penalty analytics & downloadable PDF audit reports.
                  </p>
                </div>
              </div>

              <button className="flex items-center space-x-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-card font-extrabold type-btn rounded-xl transition-colors shrink-0 shadow-none cursor-pointer self-start sm:self-auto">
                <span>View Analytics</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 4 Primary Metric Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Enrolled Students"
                count={stats.students.toString()}
                subtitle="Active student directory"
                icon={Users}
                tag="Directory"
                onClick={() => onPushView('students')}
              />
              <StatCard
                title="Faculty & Mentors"
                count={stats.teachers.toString()}
                subtitle="Teaching & evaluation faculty"
                icon={School}
                tag="Faculty"
                onClick={() => onPushView('teachers')}
              />
              <StatCard
                title="Departments"
                count={stats.departments.toString()}
                subtitle="Academic branches"
                icon={Building2}
                tag="Branches"
                onClick={() => onPushView('departments')}
              />
              <StatCard
                title="Rankings"
                count="Live"
                subtitle="Top performers leaderboard"
                icon={Trophy}
                tag="Standings"
                onClick={() => handleActionNavigate('leaderboard', 'leaderboard')}
              />
            </div>

            {/* Core Operations & Quick Navigation Grid */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="type-h4 font-black text-text-primary tracking-tight">Governance & Administrative Modules</h3>
                  <p className="text-xs text-text-muted font-medium mt-0.5">Quick access to academic policies, attendance rules, and approval workflows</p>
                </div>
                <span className="type-fine font-extrabold text-text-muted uppercase tracking-wider bg-bg px-3 py-1 rounded-lg border border-border">Quick Navigation</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Activity & Thresholds */}
                <div
                  onClick={() => handleActionNavigate('activity')}
                  className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 hover:border-accent/50 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="type-h5 font-extrabold text-text-primary group-hover:text-accent transition-colors">
                        Activity & Thresholds
                      </h4>
                      <p className="type-fine text-text-secondary mt-1 font-medium">
                        Configure stages, point quotas, and graduation thresholds across 4 academic years.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-border-subtle flex items-center justify-between type-caption font-extrabold text-accent">
                    <span>Manage Activities</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 2. Attendance Engine */}
                <div
                  onClick={() => handleActionNavigate('attendance')}
                  className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 hover:border-accent/50 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center text-text-primary">
                      <CalendarCheck className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="type-h5 font-extrabold text-text-primary group-hover:text-accent transition-colors">
                        Attendance Engine & AWD
                      </h4>
                      <p className="type-fine text-text-secondary mt-1 font-medium">
                        Manage monthly AWD multipliers, academic working days, and attendance logging rules.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-border-subtle flex items-center justify-between type-caption font-extrabold text-accent">
                    <span>Attendance Settings</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 3. Group Management & Captain Rewards */}
                <div
                  onClick={() => handleActionNavigate('groups')}
                  className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 hover:border-accent/50 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center text-text-primary">
                      <Users className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <h4 className="type-h5 font-extrabold text-text-primary group-hover:text-accent transition-colors">
                        Peer Groups & Teams
                      </h4>
                      <p className="type-fine text-text-secondary mt-1 font-medium">
                        Form student cohorts, assign captains, and configure leadership point bonuses.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-border-subtle flex items-center justify-between type-caption font-extrabold text-accent">
                    <span>Manage Groups</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 4. Requests & Badge Approval */}
                <div
                  onClick={() => handleActionNavigate('requests')}
                  className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 hover:border-accent/50 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="type-h5 font-extrabold text-text-primary group-hover:text-accent transition-colors">
                          Badge Approvals
                        </h4>
                        {stats.pendingRequests > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-accent text-card">
                            {stats.pendingRequests} New
                          </span>
                        )}
                      </div>
                      <p className="type-fine text-text-secondary mt-1 font-medium">
                        Verify student badge proof submissions and approve or reject claims with remarks.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-border-subtle flex items-center justify-between type-caption font-extrabold text-accent">
                    <span>Review Requests</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Health Footer Card */}
            <div className="bg-card rounded-2xl border border-border p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-bg border border-border flex items-center justify-center text-accent shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="type-caption font-extrabold text-text-primary">System Integrity & Synchronization</h4>
                  <p className="type-fine text-text-secondary font-medium">
                    PragatiX Enterprise Discipline System &bull; Connected to Active Institution Database
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span>All Services Nominal</span>
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, count, subtitle, icon: Icon, tag, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 hover:border-accent/50 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
    >
      <div className="flex justify-between items-start mb-3">
        <div className="p-2.5 rounded-xl bg-bg border border-border text-text-primary group-hover:border-accent/30 transition-colors">
          <Icon className="w-5 h-5 text-accent" />
        </div>
        <div className="flex items-center gap-1.5">
          {tag && (
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-bg text-text-muted border border-border">
              {tag}
            </span>
          )}
          <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-accent group-hover:translate-x-1 transition-all" />
        </div>
      </div>
      <div>
        <h4 className="text-3xl font-black text-text-primary tracking-tight">{count}</h4>
        <p className="type-caption font-extrabold text-text-secondary mt-1">{title}</p>
        {subtitle && <p className="type-fine text-text-muted mt-0.5 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}
