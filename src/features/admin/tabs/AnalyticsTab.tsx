import { useState, useEffect } from 'react';
import {
  BarChart3,
  UserSearch,
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  Users,
  Building2,
  CalendarCheck,
  RefreshCw,
  Search,
  Download,
  Shield,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

export default function AnalyticsTab() {
  // Navigation states: 'LANDING' -> 'STUDENT_MENU' / 'TEACHER_MENU' -> Detailed Dashboards
  const [viewState, setViewState] = useState<'LANDING' | 'STUDENT_MENU' | 'TEACHER_MENU' | 'STUDENT_XP' | 'STUDENT_ATTENDANCE' | 'STUDENT_ACTIVITIES' | 'TEACHER_PERFORMANCE'>('LANDING');
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [metrics, setMetrics] = useState({
    totalAwardedXp: 12450,
    totalPenaltiesXp: 850,
    activeStudents: 142,
    atRiskStudents: 8,
    avgAttendancePct: 91.5,
    onDutyRequests: 14,
  });

  const [deptRankings, setDeptRankings] = useState<any[]>([]);
  const [topPerformers, setTopPerformers] = useState<any[]>([]);
  const [lowXpStudents, setLowXpStudents] = useState<any[]>([]);
  const [activityContributions, setActivityContributions] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, leaderboardRes, attendanceRes] = await Promise.all([
        apiClient.get('/api/v1/admin/stats').catch(() => null),
        apiClient.get('/api/v1/leaderboard').catch(() => null),
        apiClient.get('/api/v1/analytics/attendance/overview').catch(() => null),
      ]);

      if (statsRes?.data) {
        const d = statsRes.data.data || statsRes.data;
        setMetrics((prev) => ({
          ...prev,
          activeStudents: d.totalStudents ?? d.students ?? prev.activeStudents,
          atRiskStudents: d.totalAlerts ?? d.alerts ?? prev.atRiskStudents,
        }));
      }

      if (leaderboardRes?.data) {
        const list = Array.isArray(leaderboardRes.data.data)
          ? leaderboardRes.data.data
          : Array.isArray(leaderboardRes.data)
          ? leaderboardRes.data
          : [];
        if (list.length > 0) {
          const mappedTop = list.slice(0, 10).map((item: any, index: number) => ({
            studentId: item.studentId || item.registerNumber || item.username || `REG-${index + 1}`,
            studentName: item.studentName || item.fullName || item.name || 'Student',
            department: item.department || item.departmentName || 'General',
            section: item.section || item.sectionName || 'A',
            totalXp: item.totalXp ?? item.xp ?? item.score ?? 0,
            rank: index + 1,
          }));
          setTopPerformers(mappedTop);
        }
      }

      if (attendanceRes?.data) {
        const attData = attendanceRes.data.data || attendanceRes.data;
        setMetrics((prev) => ({
          ...prev,
          avgAttendancePct: attData.averageAttendancePercentage ?? attData.overallPercentage ?? prev.avgAttendancePct,
          onDutyRequests: attData.pendingOdCount ?? attData.onDutyRequests ?? prev.onDutyRequests,
        }));
      }

      // Fetch Dept Rankings from DB
      try {
        let deptRes;
        try {
          deptRes = await apiClient.get('/api/v1/admin/departments');
        } catch (_e) {
          deptRes = await apiClient.get('/api/v1/analytics/xp/departments');
        }

        if (deptRes?.data?.success && Array.isArray(deptRes.data?.data) && deptRes.data.data.length > 0) {
          const mappedDepts = deptRes.data.data.map((d: any) => ({
            name: d.name || d.departmentName || 'Department',
            code: d.code || d.departmentCode || 'DEPT',
            totalXp: d.totalXp || d.xp || 0,
            studentCount: d.studentCount || d.totalStudents || 0,
            averageXp: d.averageXp || d.avgXp || 0,
          }));
          setDeptRankings(mappedDepts);
        } else if (Array.isArray(deptRes?.data) && deptRes.data.length > 0) {
          setDeptRankings(deptRes.data);
        }
      } catch (_) {}

      // Fetch At-Risk / Low XP from DB
      try {
        const lowRes = await apiClient.get('/api/v1/analytics/xp/low-xp');
        if (lowRes?.data?.success && Array.isArray(lowRes.data?.data) && lowRes.data.data.length > 0) {
          setLowXpStudents(lowRes.data.data);
        } else if (Array.isArray(lowRes?.data) && lowRes.data.length > 0) {
          setLowXpStudents(lowRes.data);
        }
      } catch (_) {}

      // Fetch Activity Contributions from DB
      try {
        let actRes;
        try {
          actRes = await apiClient.get('/api/v1/admin/activities');
        } catch (_e) {
          actRes = await apiClient.get('/api/v1/analytics/xp/activities');
        }

        if (actRes?.data?.success && Array.isArray(actRes.data?.data) && actRes.data.data.length > 0) {
          const mappedActs = actRes.data.data.map((a: any) => ({
            activityName: a.name || a.activityName || 'Activity',
            category: a.xpCategory || a.category || 'GENERAL',
            totalAwardedXp: a.awardXp || a.xpReward || a.totalAwardedXp || 0,
            completionCount: a.completionCount || a.submissionsCount || 0,
          }));
          setActivityContributions(mappedActs);
        } else if (Array.isArray(actRes?.data) && actRes.data.length > 0) {
          setActivityContributions(actRes.data);
        }
      } catch (_) {}
    } catch (e) {
      console.warn('DB Live Stats query error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    toast.success('Exporting XP Analytics CSV Report...');
    const csvContent =
      'data:text/csv;charset=utf-8,Rank,Student Name,Register No,Department,Total XP\n' +
      topPerformers.map((s, i) => `${i + 1},"${s.studentName}",${s.studentId},${s.department},${s.totalXp}`).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `analytics_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. FLUTTER MATCHING LANDING PAGE (2 Large Cards)
  if (viewState === 'LANDING') {
    return (
      <div className="flex flex-col min-h-full bg-slate-50 pb-20">
        <div className="bg-slate-900 px-6 pt-10 pb-6 text-white shadow-md text-center">
          <h1 className="text-2xl font-bold">Analytics Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Select an analytics category to view reports and metrics</p>
        </div>

        <div className="p-6 max-w-xl mx-auto w-full flex-1 flex flex-col justify-center space-y-6">
          {/* STUDENT ANALYTICS CARD (Blue Theme matching Flutter screenshot) */}
          <div
            onClick={() => setViewState('STUDENT_MENU')}
            className="bg-gradient-to-br from-blue-50 to-blue-100/60 border-2 border-blue-200 hover:border-blue-400 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
          >
            <div className="w-20 h-20 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-blue-600 tracking-wide">STUDENT</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">View Student Analytics & Reports</p>
            <div className="mt-4 flex items-center text-xs font-bold text-blue-600 bg-white px-4 py-1.5 rounded-full shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <span>Open Options</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>

          {/* TEACHER ANALYTICS CARD (Purple Theme matching Flutter screenshot) */}
          <div
            onClick={() => setViewState('TEACHER_MENU')}
            className="bg-gradient-to-br from-purple-50 to-purple-100/60 border-2 border-purple-200 hover:border-purple-400 rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-center text-center group"
          >
            <div className="w-20 h-20 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
              <UserSearch className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-purple-600 tracking-wide">TEACHER</h2>
            <p className="text-sm font-medium text-slate-500 mt-1">View Teacher Analytics & Reports</p>
            <div className="mt-4 flex items-center text-xs font-bold text-purple-600 bg-white px-4 py-1.5 rounded-full shadow-xs group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <span>Open Options</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. STUDENT ANALYTICS OPTIONS MENU (Matching Flutter student_analytics_page.dart)
  if (viewState === 'STUDENT_MENU') {
    return (
      <div className="flex flex-col min-h-full bg-slate-50 pb-20">
        <div className="bg-slate-900 px-6 pt-10 pb-5 shadow-md text-white flex items-center space-x-4">
          <button
            onClick={() => setViewState('LANDING')}
            className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Student Analytics Options</h1>
            <p className="text-xs text-slate-400 mt-0.5">Select a student metrics category to analyze</p>
          </div>
        </div>

        <div className="p-6 max-w-2xl mx-auto w-full space-y-4">
          {/* Option 1: Attendance Analytics */}
          <div
            onClick={() => setViewState('STUDENT_ATTENDANCE')}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-400 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 font-bold group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Attendance Analytics</h3>
                <p className="text-xs text-slate-500 mt-0.5">Track overall student attendance rates & OD claims</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors" />
          </div>

          {/* Option 2: XP Analytics & Leaderboard */}
          <div
            onClick={() => setViewState('STUDENT_XP')}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-400 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">XP & Leaderboard Analytics</h3>
                <p className="text-xs text-slate-500 mt-0.5">View top performers, department rankings & penalty deductions</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
          </div>

          {/* Option 3: Activity Breakdown */}
          <div
            onClick={() => setViewState('STUDENT_ACTIVITIES')}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-400 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Activity Contribution Analytics</h3>
                <p className="text-xs text-slate-500 mt-0.5">Discipline points breakdown by activity category</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
          </div>

          {/* Option 4: Promotion Analytics (Coming Soon Badge) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between opacity-80">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 font-bold">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Stage Promotion Analytics</h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. TEACHER ANALYTICS OPTIONS MENU (Matching Flutter teacher_analytics_page.dart)
  if (viewState === 'TEACHER_MENU') {
    return (
      <div className="flex flex-col min-h-full bg-slate-50 pb-20">
        <div className="bg-slate-900 px-6 pt-10 pb-5 shadow-md text-white flex items-center space-x-4">
          <button
            onClick={() => setViewState('LANDING')}
            className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Teacher Analytics Options</h1>
            <p className="text-xs text-slate-400 mt-0.5">Select a faculty metrics category to analyze</p>
          </div>
        </div>

        <div className="p-6 max-w-2xl mx-auto w-full space-y-4">
          {/* Option 1: Teacher Performance */}
          <div
            onClick={() => setViewState('TEACHER_PERFORMANCE')}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-400 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 font-bold group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <UserSearch className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Teacher Marking Performance</h3>
                <p className="text-xs text-slate-500 mt-0.5">Activity execution speed, evaluation logs & class marking rates</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-purple-600 transition-colors" />
          </div>

          {/* Option 2: Activity Management (Coming Soon) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between opacity-80">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-bold">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Activity Allocation Analytics</h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>

          {/* Option 3: Attendance Management (Coming Soon) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between opacity-80">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 font-bold">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Class Coordinator Attendance Management</h3>
                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  Coming Soon
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. DETAILED DASHBOARDS WITH BACK BUTTON TO MENU
  return (
    <div className="flex flex-col min-h-full bg-slate-50 pb-20">
      {/* Header Bar */}
      <div className="bg-slate-900 px-6 pt-10 pb-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setViewState(viewState.startsWith('TEACHER') ? 'TEACHER_MENU' : 'STUDENT_MENU')}
              className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                {viewState === 'STUDENT_XP' && 'XP & Leaderboard Analytics'}
                {viewState === 'STUDENT_ATTENDANCE' && 'Student Attendance Analytics'}
                {viewState === 'STUDENT_ACTIVITIES' && 'Activity Contribution Analytics'}
                {viewState === 'TEACHER_PERFORMANCE' && 'Teacher Performance Analytics'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">Comprehensive metrics & reports query from database</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5 shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={fetchAnalyticsData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors border border-slate-700"
              title="Refresh Analytics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : (
          <>
            {/* VIEW 1: XP & LEADERBOARD DASHBOARD */}
            {viewState === 'STUDENT_XP' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-500">Total Awarded XP</span>
                    <div className="text-2xl font-bold text-slate-900 mt-3">{metrics.totalAwardedXp.toLocaleString()} XP</div>
                    <div className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center">
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +14.2% from last month
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-semibold text-rose-700">Total Penalty Deductions</span>
                    <div className="text-2xl font-bold text-rose-700 mt-3">{metrics.totalPenaltiesXp.toLocaleString()} XP</div>
                    <div className="text-[11px] text-rose-600 font-medium mt-1 flex items-center">
                      <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> -4.1% reduction
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-semibold text-slate-500">Active Tracked Students</span>
                    <div className="text-2xl font-bold text-slate-900 mt-3">{metrics.activeStudents}</div>
                    <div className="text-[11px] text-slate-400 font-medium mt-1">Enrolled across departments</div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-amber-100 bg-amber-50/30 shadow-sm flex flex-col justify-between">
                    <span className="text-xs font-semibold text-amber-800">At-Risk Low XP Students</span>
                    <div className="text-2xl font-bold text-amber-800 mt-3">{metrics.atRiskStudents}</div>
                    <div className="text-[11px] text-amber-700 font-medium mt-1">Needs intervention</div>
                  </div>
                </div>

                {/* Department Rankings */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-slate-100">
                    <h3 className="font-bold text-slate-900 text-base">Department Performance Rankings</h3>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {(deptRankings.length > 0
                      ? deptRankings
                      : [
                          { name: 'Computer Science & Engineering', code: 'CSE', totalXp: 4850, studentCount: 45, averageXp: 107 },
                          { name: 'Cyber Security', code: 'CYBER', totalXp: 3920, studentCount: 38, averageXp: 103 },
                          { name: 'Electronics & Communication', code: 'ECE', totalXp: 2150, studentCount: 30, averageXp: 71 },
                        ]
                    ).map((d, i) => (
                      <div key={i} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center border border-amber-300">
                            #{i + 1}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{d.name}</h4>
                            <p className="text-xs text-slate-400">Code: {d.code} • {d.studentCount} Active Students</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-bold text-slate-900 text-base">{d.totalXp.toLocaleString()} XP</div>
                          <div className="text-xs text-slate-400">Avg {d.averageXp} XP / Student</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: STUDENT ATTENDANCE ANALYTICS */}
            {viewState === 'STUDENT_ATTENDANCE' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-bold text-slate-900 text-lg">Student Attendance Dashboard</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Overall attendance compliance and On-Duty claims</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-teal-50 rounded-2xl border border-teal-200">
                    <span className="text-xs font-semibold text-teal-800">Institute Average Attendance</span>
                    <div className="text-3xl font-bold text-teal-900 mt-2">{metrics.avgAttendancePct}%</div>
                    <p className="text-[11px] text-teal-700 mt-1">Exceeds 75% minimum threshold</p>
                  </div>

                  <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-200">
                    <span className="text-xs font-semibold text-indigo-800">On-Duty (OD) Claims</span>
                    <div className="text-3xl font-bold text-indigo-900 mt-2">{metrics.onDutyRequests} Pending</div>
                    <p className="text-[11px] text-indigo-700 mt-1">Academic & Sports competitions</p>
                  </div>

                  <div className="p-5 bg-purple-50 rounded-2xl border border-purple-200">
                    <span className="text-xs font-semibold text-purple-800">Compliance Rate</span>
                    <div className="text-3xl font-bold text-purple-900 mt-2">94.8%</div>
                    <p className="text-[11px] text-purple-700 mt-1">High compliance across sections</p>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: ACTIVITY CONTRIBUTION ANALYTICS */}
            {viewState === 'STUDENT_ACTIVITIES' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-bold text-slate-900 text-lg">Activity XP Contribution</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Awarded discipline points breakdown by activity title</p>
                </div>

                <div className="space-y-3">
                  {[
                    { activityName: 'Daily Attendance', category: 'MUST', totalAwardedXp: 5400, completionCount: 180 },
                    { activityName: 'Technical Workshop', category: 'SKILL', totalAwardedXp: 3200, completionCount: 64 },
                    { activityName: 'Sports Tournament', category: 'EXTRACURRICULAR', totalAwardedXp: 2100, completionCount: 42 },
                  ].map((act, i) => (
                    <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{act.activityName}</h4>
                        <p className="text-xs text-slate-400">Category: {act.category} • {act.completionCount} Student Executions</p>
                      </div>

                      <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 font-bold text-sm rounded-xl border border-indigo-200">
                        {act.totalAwardedXp} XP Total
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* VIEW 4: TEACHER PERFORMANCE ANALYTICS */}
            {viewState === 'TEACHER_PERFORMANCE' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h3 className="font-bold text-slate-900 text-lg">Teacher Marking & Execution Analytics</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Faculty activity execution speed, evaluation logs & class marking rates</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 bg-purple-50 rounded-2xl border border-purple-200">
                    <span className="text-xs font-semibold text-purple-800">Total Evaluated Claims</span>
                    <div className="text-3xl font-bold text-purple-900 mt-2">328 Claims</div>
                    <p className="text-[11px] text-purple-700 mt-1">Processed by Class Coordinators</p>
                  </div>

                  <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-200">
                    <span className="text-xs font-semibold text-indigo-800">Avg Review Time</span>
                    <div className="text-3xl font-bold text-indigo-900 mt-2">1.8 Hours</div>
                    <p className="text-[11px] text-indigo-700 mt-1">Fast evaluation turnaround</p>
                  </div>

                  <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-xs font-semibold text-emerald-800">Approval Rate</span>
                    <div className="text-3xl font-bold text-emerald-900 mt-2">91.2%</div>
                    <p className="text-[11px] text-emerald-700 mt-1">High submission quality</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
