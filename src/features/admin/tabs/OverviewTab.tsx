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
    <div className="flex flex-col min-h-full bg-[#F8FAFC] text-slate-900 pb-16">
      {/* Explicit Clean White/Grey Header Bar */}
      <div className="bg-white px-6 py-5 border-b border-slate-200 text-slate-900 sticky top-0 z-20 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{overviewTitle}</h1>
            <span className="px-2.5 py-0.5 rounded-md text-xs font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200 tracking-wider">
              {scopeLabel}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPushView('recycle_bin')}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Recycle Bin"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={fetchStats}
              disabled={isLoading}
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-4 h-4 text-slate-900 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-base font-bold text-slate-900">
            Welcome back, {user?.name ? user.name : roleConfig.roleDisplayName}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {overviewSubtitle}
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-5 lg:px-8 py-6 max-w-[1400px] mx-auto w-full space-y-6">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-900" />
            <p className="type-body-sm text-slate-500 font-medium">Loading executive dashboard metrics...</p>
          </div>
        ) : (
          <>
            {/* Quick Launch Analytics Banner (Pure Clean White Card) */}
            <div
              onClick={() => onPushView('analytics')}
              className="bg-white text-slate-900 rounded-2xl p-6 shadow-xs cursor-pointer hover:border-slate-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-5 border border-slate-200 group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-900 rounded-l-2xl" />
              <div className="flex items-start sm:items-center space-x-4 pl-2">
                <div className="w-13 h-13 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-900 shrink-0 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">Executive Analytics & Reporting</h3>
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 tracking-wider uppercase">
                      Live Reports
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-1 max-w-xl">
                    Live student engagement statistics, departmental point comparisons, penalty analytics & downloadable PDF audit reports.
                  </p>
                </div>
              </div>

              <button className="flex items-center space-x-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shrink-0 shadow-none cursor-pointer self-start sm:self-auto">
                <span>View Analytics</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* 4 Primary Metric Stat Cards with Vibrant Colors */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
              <StatCard
                title="Students"
                count={stats.students.toString()}
                subtitle="Enrolled Students"
                icon={Users}
                colorScheme="blue"
                onClick={() => onPushView('students')}
              />
              <StatCard
                title="Teachers"
                count={stats.teachers.toString()}
                subtitle="Faculty & Mentors"
                icon={School}
                colorScheme="emerald"
                onClick={() => onPushView('teachers')}
              />
              <StatCard
                title="Departments"
                count={stats.departments.toString()}
                subtitle="Academic branches"
                icon={Building2}
                colorScheme="amber"
                onClick={() => onPushView('departments')}
              />
              <StatCard
                title="Leaderboard"
                count="Live"
                subtitle="Top performers"
                icon={Trophy}
                colorScheme="rose"
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
                  className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 hover:border-indigo-300 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50/90 border border-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-105 transition-transform">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="type-h5 font-extrabold text-text-primary group-hover:text-indigo-600 transition-colors">
                        Activity & Thresholds
                      </h4>
                      <p className="type-fine text-text-secondary mt-1 font-medium">
                        Configure stages, point quotas, and graduation thresholds across 4 academic years.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-border-subtle flex items-center justify-between type-caption font-extrabold text-indigo-600">
                    <span>Manage Activities</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 2. Attendance Engine */}
                <div
                  onClick={() => handleActionNavigate('attendance')}
                  className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-50/90 border border-sky-100 flex items-center justify-center text-sky-600 group-hover:scale-105 transition-transform">
                      <CalendarCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="type-h5 font-extrabold text-text-primary group-hover:text-sky-600 transition-colors">
                        Attendance Engine & AWD
                      </h4>
                      <p className="type-fine text-text-secondary mt-1 font-medium">
                        Manage monthly AWD multipliers, academic working days, and attendance logging rules.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-border-subtle flex items-center justify-between type-caption font-extrabold text-sky-600">
                    <span>Attendance Settings</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 3. Group Management & Captain Rewards */}
                <div
                  onClick={() => handleActionNavigate('groups')}
                  className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 hover:border-purple-300 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50/90 border border-purple-100 flex items-center justify-center text-purple-600 group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="type-h5 font-extrabold text-text-primary group-hover:text-purple-600 transition-colors">
                        Peer Groups & Teams
                      </h4>
                      <p className="type-fine text-text-secondary mt-1 font-medium">
                        Form student cohorts, assign captains, and configure leadership point bonuses.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-border-subtle flex items-center justify-between type-caption font-extrabold text-purple-600">
                    <span>Manage Groups</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>

                {/* 4. Requests & Badge Approval */}
                <div
                  onClick={() => handleActionNavigate('requests')}
                  className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 hover:border-amber-300 transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50/90 border border-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-105 transition-transform">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between">
                        <h4 className="type-h5 font-extrabold text-text-primary group-hover:text-amber-600 transition-colors">
                          Badge Approvals
                        </h4>
                        {stats.pendingRequests > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-600 text-white">
                            {stats.pendingRequests} New
                          </span>
                        )}
                      </div>
                      <p className="type-fine text-text-secondary mt-1 font-medium">
                        Verify student badge proof submissions and approve or reject claims with remarks.
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-border-subtle flex items-center justify-between type-caption font-extrabold text-amber-600">
                    <span>Review Requests</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            </div>

            {/* Operational Health Footer Card */}
            <div className="bg-card rounded-2xl border border-border p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="flex items-center space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50/90 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
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

function StatCard({ title, count, subtitle, icon: Icon, colorScheme = 'blue', onClick }: any) {
  const stylesMap: Record<string, { tileBg: string; tileText: string; borderHover: string }> = {
    blue: {
      tileBg: 'bg-blue-50/90 border-blue-100',
      tileText: 'text-blue-600',
      borderHover: 'hover:border-blue-300',
    },
    emerald: {
      tileBg: 'bg-emerald-50/90 border-emerald-100',
      tileText: 'text-emerald-600',
      borderHover: 'hover:border-emerald-300',
    },
    amber: {
      tileBg: 'bg-amber-50/90 border-amber-100',
      tileText: 'text-amber-600',
      borderHover: 'hover:border-amber-300',
    },
    rose: {
      tileBg: 'bg-rose-50/90 border-rose-100',
      tileText: 'text-rose-600',
      borderHover: 'hover:border-rose-300',
    },
  };

  const currentStyle = stylesMap[colorScheme] || stylesMap.blue;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 ${currentStyle.borderHover} hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl border ${currentStyle.tileBg} ${currentStyle.tileText} group-hover:scale-105 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-1 transition-all" />
      </div>
      <div>
        <h4 className="text-4xl font-black text-slate-900 tracking-tight mb-0.5">{count}</h4>
        <p className="text-sm font-extrabold text-slate-600">{title}</p>
        {subtitle && <p className="text-xs font-semibold text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
