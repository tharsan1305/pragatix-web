import { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  ShieldCheck, 
  Zap, 
  RefreshCw, 
  Calendar, 
  Trophy, 
  Layers, 
  AlertCircle, 
  Search, 
  Filter, 
  Award, 
  Building2,
  CalendarCheck
} from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { logger } from '../../../utils/logger';

export default function HodPerformanceTab() {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('All Years');
  const [activeSubTab, setActiveSubTab] = useState<'attendance' | 'xp' | 'discipline' | 'leaderboard' | 'sections'>('attendance');

  // Matrix Filter State
  const [matrixDate, setMatrixDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [matrixYearId, setMatrixYearId] = useState<number | ''>('');
  const [matrixSectionId, setMatrixSectionId] = useState<number | ''>('');
  const [matrixSummary, setMatrixSummary] = useState<any>(null);
  const [isLoadingMatrix, setIsLoadingMatrix] = useState(false);
  const [matrixSearch, setMatrixSearch] = useState<string>('');
  const [penaltySearch, setPenaltySearch] = useState<string>('');

  const [availableYears, setAvailableYears] = useState<string[]>([
    'All Years',
    'First Year',
    'Second Year',
    'Third Year',
    'Fourth Year',
  ]);
  const [lookupYears, setLookupYears] = useState<any[]>([]);
  const [lookupSections, setLookupSections] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboard();
    fetchLookups();
  }, [selectedYear]);

  const fetchDashboard = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const yearParam = selectedYear !== 'All Years' ? `?year=${encodeURIComponent(selectedYear)}` : '';
      const response = await apiClient.get(`/api/v1/hod/analytics/dashboard${yearParam}`);
      if (response.data && (response.data.success || response.status === 200)) {
        const data = response.data.data || response.data;
        setDashboardData(data);
        if (data.availableYears && Array.isArray(data.availableYears)) {
          setAvailableYears(data.availableYears);
        }
      } else {
        setErrorMessage(response.data?.message || 'Failed to load HOD analytics');
      }
    } catch (err: any) {
      logger.error('Failed to load HOD dashboard:', err);
      setErrorMessage(err.response?.data?.message || 'Error connecting to HOD analytics service');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const [yearsRes] = await Promise.allSettled([
        apiClient.get('/api/v1/admin/years'),
      ]);

      if (yearsRes.status === 'fulfilled' && yearsRes.value?.data) {
        const yList = yearsRes.value.data.data || yearsRes.value.data || [];
        setLookupYears(Array.isArray(yList) ? yList : []);
        if (yList.length > 0 && !matrixYearId) {
          setMatrixYearId(yList[0].id);
        }
      }

      // Fetch Sections for department
      fetchDepartmentSections();
    } catch (err) {
      logger.warn('Failed to load lookups', err);
    }
  };

  const fetchDepartmentSections = async () => {
    try {
      const res = await apiClient.get('/api/v1/admin/sections');
      if (res.data) {
        const sList = res.data.data || res.data || [];
        setLookupSections(Array.isArray(sList) ? sList : []);
      }
    } catch {
      setLookupSections([]);
    }
  };

  useEffect(() => {
    if (matrixYearId) {
      fetchMatrixAttendance();
    }
  }, [matrixDate, matrixYearId, matrixSectionId]);

  const fetchMatrixAttendance = async () => {
    if (!matrixYearId) return;
    setIsLoadingMatrix(true);
    try {
      const deptId = dashboardData?.departmentInfo?.id || '';
      let url = `/api/admin/attendance/summary?date=${matrixDate}&yearId=${matrixYearId}`;
      if (deptId) url += `&departmentId=${deptId}`;
      if (matrixSectionId) url += `&sectionId=${matrixSectionId}`;

      const res = await apiClient.get(url);
      if (res.data) {
        setMatrixSummary(res.data.data || res.data);
      }
    } catch (err) {
      logger.warn('Failed to load attendance matrix:', err);
      setMatrixSummary(null);
    } finally {
      setIsLoadingMatrix(false);
    }
  };

  if (isLoading && !dashboardData) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-400 animate-spin" />
          <p className="text-slate-400 font-semibold type-body-sm">Loading Department Analytics...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !dashboardData) {
    return (
      <div className="flex flex-col h-full bg-slate-900 min-h-screen">
        <div className="bg-slate-950 text-white px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <h1 className="type-h4">HOD Performance Dashboard</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-slate-800/80 border border-slate-700 p-8 rounded-2xl max-w-md w-full text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="type-h4 text-white">Unable to Load Analytics</h3>
            <p className="type-caption text-slate-400">{errorMessage}</p>
            <button
              onClick={fetchDashboard}
              className="inline-flex items-center px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold type-btn rounded-xl shadow transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const deptInfo = dashboardData?.departmentInfo || {};
  const deptName = deptInfo.name || 'Department';
  const deptCode = deptInfo.code || 'DEPT';

  const overview = dashboardData?.overview || {};
  const totalStudents = overview.totalStudents ?? 0;
  const totalTeachers = overview.totalTeachers ?? 0;
  const totalSections = overview.totalSections ?? 0;
  const avgXp = Math.round(overview.averageXp ?? 0);
  const rawScore = Number(overview.averageDisciplineScore ?? 100);
  const avgDisciplineScore = Math.min(100, Math.max(0, Math.round(rawScore * 10) / 10));

  // Sub-tabs data
  const attendance = dashboardData?.attendance || {};
  const xp = dashboardData?.xp || {};
  const discipline = dashboardData?.discipline || {};
  const leaderboard = dashboardData?.leaderboard || [];
  const sectionComparison = dashboardData?.sectionComparison || [];
  const recentPenalties = dashboardData?.recentPenalties || [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 pb-20">
      {/* Header Bar */}
      <div className="bg-slate-950/90 backdrop-blur-md px-6 py-4 sticky top-0 z-30 border-b border-slate-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-teal-400" />
            <h1 className="type-h4 text-white tracking-tight">{deptName} Analytics</h1>
          </div>
          <p className="type-caption text-slate-400 mt-0.5 font-medium">HOD Dashboard • Dept Code: {deptCode}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Study Year Dropdown */}
          <div className="flex items-center gap-2 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 shadow-xs">
            <Filter className="w-3.5 h-3.5 text-teal-400" />
            <span className="type-caption text-slate-400">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent type-caption font-bold text-teal-300 outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-slate-800 text-white">
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              fetchDashboard();
              if (matrixYearId) fetchMatrixAttendance();
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700 transition cursor-pointer"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* 4 Overview Metric Cards matching Flutter */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Students */}
          <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl flex flex-col justify-between h-[105px] shadow-sm">
            <div className="flex justify-between items-center">
              <span className="type-caption text-slate-400">Total Students</span>
              <div className="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="type-h3 text-white">{totalStudents}</div>
          </div>

          {/* Card 2: Total Teachers */}
          <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl flex flex-col justify-between h-[105px] shadow-sm">
            <div className="flex justify-between items-center">
              <span className="type-caption text-slate-400">Total Teachers</span>
              <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="type-h3 text-white">{totalTeachers}</div>
          </div>

          {/* Card 3: Discipline Score */}
          <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl flex flex-col justify-between h-[105px] shadow-sm">
            <div className="flex justify-between items-center">
              <span className="type-caption text-slate-400">Discipline Score</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                avgDisciplineScore >= 85 ? 'bg-emerald-500/10 text-emerald-400' : (avgDisciplineScore >= 60 ? 'bg-amber-500/10 text-amber-400' : 'bg-rose-500/10 text-rose-400')
              }`}>
                Max 100
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`type-h3 ${
                avgDisciplineScore >= 85 ? 'text-emerald-400' : (avgDisciplineScore >= 60 ? 'text-amber-400' : 'text-rose-400')
              }`}>
                {avgDisciplineScore.toFixed(1)}
              </span>
              <span className="type-caption text-slate-400">/ 100</span>
            </div>
          </div>

          {/* Card 4: Avg Student XP */}
          <div className="bg-slate-800/90 border border-slate-700/80 p-4 rounded-2xl flex flex-col justify-between h-[105px] shadow-sm">
            <div className="flex justify-between items-center">
              <span className="type-caption text-slate-400">Avg Student XP</span>
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="type-h3 text-amber-400">{avgXp}</span>
              <span className="type-caption text-slate-400 font-semibold">XP ({totalSections} Secs)</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation (5 Subtabs: Attendance, XP, Discipline, Leaderboard, Sections) */}
        <div className="flex bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/80 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl type-caption font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'attendance'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Attendance
          </button>
          <button
            onClick={() => setActiveSubTab('xp')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl type-caption font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'xp'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-4 h-4" />
            XP Analytics
          </button>
          <button
            onClick={() => setActiveSubTab('discipline')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl type-caption font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'discipline'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Discipline
          </button>
          <button
            onClick={() => setActiveSubTab('leaderboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl type-caption font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'leaderboard'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>
          <button
            onClick={() => setActiveSubTab('sections')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl type-caption font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'sections'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Sections
          </button>
        </div>

        {/* Tab 1: ATTENDANCE */}
        {activeSubTab === 'attendance' && (
          <div className="space-y-6">
            {/* Top Attendance Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800/70 border border-slate-700/70 p-4 rounded-2xl">
                <span className="type-caption text-slate-400">Overall Attendance</span>
                <div className="type-h3 text-teal-400 mt-1">
                  {(attendance.overallAttendancePct ?? 0).toFixed(1)}%
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  {attendance.totalRecords ?? 0} Recorded Sessions
                </span>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 p-4 rounded-2xl">
                <span className="type-caption text-slate-400">Full Present</span>
                <div className="type-h3 text-emerald-400 mt-1">
                  {attendance.presentCount ?? 0}
                </div>
                <span className="text-[11px] text-slate-500 font-medium">All Periods Attended</span>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 p-4 rounded-2xl">
                <span className="type-caption text-slate-400">Absences</span>
                <div className="type-h3 text-rose-400 mt-1">
                  {attendance.fullAbsentCount ?? 0} <span className="type-body-sm text-slate-400 font-normal">Full</span> / {attendance.partialAbsentCount ?? 0} <span className="type-body-sm text-slate-400 font-normal">Part</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Full & Partial Absences</span>
              </div>
            </div>

            {/* Section Attendance Breakdown */}
            {attendance.sectionAttendance && attendance.sectionAttendance.length > 0 && (
              <div className="bg-slate-800/70 border border-slate-700/70 p-5 rounded-2xl space-y-3">
                <h3 className="type-h5 text-white">Section-wise Attendance Rates</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {attendance.sectionAttendance.map((sa: any, idx: number) => {
                    const pct = Number(sa.attendancePercentage ?? 0);
                    return (
                      <div key={idx} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700 flex justify-between items-center">
                        <div>
                          <span className="type-caption font-bold text-white bg-slate-800 px-2 py-0.5 rounded-md">
                            Sec {sa.sectionName}
                          </span>
                          <p className="text-[11px] text-slate-400 mt-1">{sa.studentCount} Students</p>
                        </div>
                        <span className={`type-h5 ${
                          pct >= 85 ? 'text-emerald-400' : (pct >= 75 ? 'text-amber-400' : 'text-rose-400')
                        }`}>
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Daily Attendance Matrix Table */}
            <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl space-y-4">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                <div>
                  <h3 className="type-h5 text-white">Daily Attendance Matrix</h3>
                  <p className="type-caption text-slate-400">Period-wise student attendance log for selected date</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Year selector */}
                  {lookupYears.length > 0 && (
                    <select
                      value={matrixYearId}
                      onChange={(e) => setMatrixYearId(Number(e.target.value))}
                      className="bg-slate-900 type-caption font-bold text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl outline-none cursor-pointer"
                    >
                      {lookupYears.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.yearName || `Year ${y.id}`}
                        </option>
                      ))}
                    </select>
                  )}

                  {/* Section selector */}
                  <select
                    value={matrixSectionId}
                    onChange={(e) => setMatrixSectionId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="bg-slate-900 type-caption font-bold text-slate-200 border border-slate-700 px-3 py-1.5 rounded-xl outline-none cursor-pointer"
                  >
                    <option value="">All Sections</option>
                    {lookupSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        Sec {s.sectionName}
                      </option>
                    ))}
                  </select>

                  {/* Date Picker */}
                  <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-xl">
                    <Calendar className="w-3.5 h-3.5 text-teal-400" />
                    <input
                      type="date"
                      value={matrixDate}
                      onChange={(e) => setMatrixDate(e.target.value)}
                      className="bg-transparent type-caption font-bold text-slate-200 outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or register number..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 type-caption text-white placeholder-slate-500 outline-none focus:border-teal-500 transition"
                />
              </div>

              {/* Matrix Table */}
              {isLoadingMatrix ? (
                <div className="py-12 flex justify-center">
                  <RefreshCw className="w-6 h-6 text-teal-400 animate-spin" />
                </div>
              ) : !matrixSummary || !matrixSummary.students || matrixSummary.students.length === 0 ? (
                <div className="py-12 text-center text-slate-500 type-caption">
                  No attendance records found for this date/section.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3">Reg. No</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-1.5 text-center w-8">P1</th>
                        <th className="py-2.5 px-1.5 text-center w-8">P2</th>
                        <th className="py-2.5 px-1.5 text-center w-8">P3</th>
                        <th className="py-2.5 px-1.5 text-center w-8">P4</th>
                        <th className="py-2.5 px-1.5 text-center w-8">P5</th>
                        <th className="py-2.5 px-1.5 text-center w-8">P6</th>
                        <th className="py-2.5 px-1.5 text-center w-8">P7</th>
                        <th className="py-2.5 px-1.5 text-center w-8">P8</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 type-table-cell">
                      {matrixSummary.students
                        .filter((st: any) => {
                          if (!matrixSearch.trim()) return true;
                          const q = matrixSearch.toLowerCase().trim();
                          return (
                            (st.studentName || '').toLowerCase().includes(q) ||
                            (st.registerNumber || '').toLowerCase().includes(q)
                          );
                        })
                        .map((st: any, idx: number) => {
                          const renderPBadge = (pNum: number) => {
                            const raw = (st.periodStatuses?.[pNum] || st.periodStatuses?.[String(pNum)] || '—').toUpperCase();
                            let bg = 'bg-slate-800 text-slate-500';
                            if (raw === 'P' || raw === 'PRESENT') bg = 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30';
                            else if (raw === 'A' || raw === 'ABSENT') bg = 'bg-rose-500/20 text-rose-400 font-bold border border-rose-500/30';
                            else if (raw === 'OD') bg = 'bg-sky-500/20 text-sky-400 font-bold border border-sky-500/30';
                            else if (raw === 'L') bg = 'bg-amber-500/20 text-amber-400 font-bold border border-amber-500/30';

                            return (
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[11px] ${bg}`}>
                                {raw === 'PRESENT' ? 'P' : (raw === 'ABSENT' ? 'A' : raw)}
                              </span>
                            );
                          };

                          return (
                            <tr key={st.studentId || idx} className="hover:bg-slate-800/40 transition">
                              <td className="py-2.5 px-3 text-center text-slate-500 font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-mono font-semibold text-slate-300">{st.registerNumber}</td>
                              <td className="py-2.5 px-3 font-semibold text-white">{st.studentName}</td>
                              <td className="py-2.5 px-1 text-center">{renderPBadge(1)}</td>
                              <td className="py-2.5 px-1 text-center">{renderPBadge(2)}</td>
                              <td className="py-2.5 px-1 text-center">{renderPBadge(3)}</td>
                              <td className="py-2.5 px-1 text-center">{renderPBadge(4)}</td>
                              <td className="py-2.5 px-1 text-center">{renderPBadge(5)}</td>
                              <td className="py-2.5 px-1 text-center">{renderPBadge(6)}</td>
                              <td className="py-2.5 px-1 text-center">{renderPBadge(7)}</td>
                              <td className="py-2.5 px-1 text-center">{renderPBadge(8)}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: XP ANALYTICS */}
        {activeSubTab === 'xp' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/70 border border-slate-700/70 p-4 rounded-2xl">
                <span className="type-caption text-slate-400">Total XP</span>
                <div className="type-h3 text-sky-400 mt-1">{xp.totalXp ?? 0} XP</div>
                <span className="text-[11px] text-slate-500 font-medium">All Department Students</span>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 p-4 rounded-2xl">
                <span className="type-caption text-slate-400">Awarded XP</span>
                <div className="type-h3 text-emerald-400 mt-1">+{xp.awardXp ?? 0} XP</div>
                <span className="text-[11px] text-slate-500 font-medium">Positive Rewards</span>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 p-4 rounded-2xl">
                <span className="type-caption text-slate-400">Penalty Deductions</span>
                <div className="type-h3 text-rose-400 mt-1">-{xp.penaltyXp ?? 0} XP</div>
                <span className="text-[11px] text-slate-500 font-medium">Discipline Violations</span>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 p-4 rounded-2xl">
                <span className="type-caption text-slate-400">Net XP Growth</span>
                <div className="type-h3 text-indigo-400 mt-1">{xp.netXp ?? 0} XP</div>
                <span className="text-[11px] text-slate-500 font-medium">Awarded - Penalty</span>
              </div>
            </div>

            {/* Top Students vs Students Needing Focus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Achievers */}
              <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <Award className="w-5 h-5" />
                  <h3 className="type-h5 text-white">Top 5 XP Achievers</h3>
                </div>
                <div className="space-y-2">
                  {!xp.topStudents || xp.topStudents.length === 0 ? (
                    <p className="type-caption text-slate-500 py-4 text-center">No student XP data available</p>
                  ) : (
                    xp.topStudents.map((s: any, idx: number) => (
                      <div key={idx} className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold type-caption flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="type-caption font-bold text-white">{s.studentName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{s.regNo} • Sec {s.sectionName || '-'}</p>
                          </div>
                        </div>
                        <span className="type-caption font-bold text-emerald-400">+{s.totalXp ?? s.xp} XP</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Lowest Students */}
              <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="type-h5 text-white">Students Needing Focus</h3>
                </div>
                <div className="space-y-2">
                  {!xp.lowestStudents || xp.lowestStudents.length === 0 ? (
                    <p className="type-caption text-slate-500 py-4 text-center">No student records needing focus</p>
                  ) : (
                    xp.lowestStudents.map((s: any, idx: number) => (
                      <div key={idx} className="bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold type-caption flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="type-caption font-bold text-white">{s.studentName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{s.regNo} • Sec {s.sectionName || '-'}</p>
                          </div>
                        </div>
                        <span className="type-caption font-bold text-amber-400">{s.totalXp ?? s.xp} XP</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: DISCIPLINE */}
        {activeSubTab === 'discipline' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/70 border border-slate-700/70 p-4 rounded-2xl">
                <span className="type-caption text-slate-400">Discipline Average</span>
                <div className="type-h3 text-teal-400 mt-1">
                  {(discipline.avgScore ?? avgDisciplineScore).toFixed(1)} / 100
                </div>
                <span className="type-fine text-slate-500 font-medium">Department Average</span>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 p-4 rounded-2xl">
                <span className="type-caption text-slate-400">Clean Record Rate</span>
                <div className="type-h3 text-emerald-400 mt-1">
                  {(discipline.cleanRecordPct ?? 100).toFixed(1)}%
                </div>
                <span className="type-fine text-slate-500 font-medium">Zero Penalties</span>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 p-4 rounded-2xl">
                <span className="type-caption text-slate-400">Total Penalties</span>
                <div className="type-h3 text-rose-400 mt-1">
                  {discipline.totalPenalties ?? recentPenalties.length}
                </div>
                <span className="type-fine text-slate-500 font-medium">Recorded Deductions</span>
              </div>
              <div className="bg-slate-800/70 border border-slate-700/70 p-4 rounded-2xl">
                <span className="type-caption text-slate-400">At-Risk Students</span>
                <div className="type-h3 text-amber-400 mt-1">
                  {discipline.atRiskCount ?? 0}
                </div>
                <span className="type-fine text-slate-500 font-medium">Negative XP</span>
              </div>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="type-h5 text-white">Recent Disciplinary Penalties</h3>
                  <p className="type-caption text-slate-400">History of penalty XP deductions applied to department students</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search by student, reg no or reason..."
                    value={penaltySearch}
                    onChange={(e) => setPenaltySearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 type-body-sm text-white placeholder-slate-500 outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {recentPenalties.length === 0 ? (
                <div className="py-10 text-center text-slate-500 type-caption">
                  No disciplinary penalties recorded for this department.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {recentPenalties
                    .filter((p: any) => {
                      if (!penaltySearch.trim()) return true;
                      const q = penaltySearch.toLowerCase().trim();
                      return (
                        (p.studentName || '').toLowerCase().includes(q) ||
                        (p.regNo || '').toLowerCase().includes(q) ||
                        (p.reason || '').toLowerCase().includes(q)
                      );
                    })
                    .map((p: any, idx: number) => (
                      <div key={idx} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="type-caption font-bold text-white">{p.studentName}</span>
                            <span className="type-fine font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                              {p.regNo}
                            </span>
                            {p.sectionName && (
                              <span className="type-fine text-teal-300 bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800">
                                Sec {p.sectionName}
                              </span>
                            )}
                          </div>
                          <p className="type-caption text-slate-300 font-medium">
                            <span className="text-rose-400 font-bold">Reason:</span> {p.reason || 'Disciplinary deduction'}
                          </p>
                          <div className="flex items-center gap-3 type-fine text-slate-500">
                            <span>Date: {p.penaltyDate || 'Recent'}</span>
                            {p.addedBy && <span>By: {p.addedBy}</span>}
                          </div>
                        </div>

                        <span className="type-caption font-bold px-2.5 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-lg shrink-0">
                          -{p.penaltyXp ?? 0} XP
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: LEADERBOARD */}
        {activeSubTab === 'leaderboard' && (
          <div className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl space-y-4">
            <div>
              <h3 className="type-h5 text-white">Department Leaderboard</h3>
              <p className="type-caption text-slate-400">Top ranked students ranked by net XP and discipline score</p>
            </div>

            {leaderboard.length === 0 ? (
              <div className="py-12 text-center text-slate-500 type-caption">
                No leaderboard standings found for this department.
              </div>
            ) : (
              <div className="space-y-2.5">
                {leaderboard.map((s: any, idx: number) => {
                  const rank = s.rank || idx + 1;
                  let rankColor = 'bg-slate-800 text-slate-400';
                  if (rank === 1) rankColor = 'bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold';
                  else if (rank === 2) rankColor = 'bg-slate-400/20 text-slate-300 border border-slate-400/40 font-bold';
                  else if (rank === 3) rankColor = 'bg-amber-700/20 text-amber-600 border border-amber-700/40 font-bold';

                  return (
                    <div key={idx} className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center type-caption ${rankColor}`}>
                          #{rank}
                        </span>
                        <div>
                          <p className="type-caption font-bold text-white">{s.studentName}</p>
                          <p className="type-fine text-slate-400 font-mono">
                            {s.regNo} {s.sectionName ? `• Sec ${s.sectionName}` : ''} {s.yearName ? `• ${s.yearName}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="type-caption font-bold text-teal-400">{s.netXp ?? s.totalXp ?? 0} XP</span>
                        {s.disciplineScore != null && (
                          <p className="text-[10px] text-slate-400 font-medium">
                            Discipline: <span className="text-emerald-400 font-bold">{Math.min(100, Math.round(s.disciplineScore))}/100</span>
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: SECTIONS COMPARISON */}
        {activeSubTab === 'sections' && (
          <div className="space-y-4">
            <h3 className="type-h5 text-white">Section Comparison Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sectionComparison.length === 0 ? (
                <div className="col-span-full py-12 text-center text-slate-500 type-caption">
                  No section data available for comparison.
                </div>
              ) : (
                sectionComparison.map((sec: any, idx: number) => {
                  const disc = Math.min(100, Math.round(Number(sec.avgDisciplineScore ?? 100)));
                  const att = Math.round(Number(sec.attendancePct ?? 0));

                  return (
                    <div key={idx} className="bg-slate-800/80 border border-slate-700 p-5 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="type-body-sm font-bold text-white bg-slate-900 px-3 py-1 rounded-lg border border-slate-700">
                          Section {sec.sectionName}
                        </span>
                        <span className="type-caption text-slate-400">{sec.totalStudents} Students</span>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-slate-700/60 type-caption">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Average XP:</span>
                          <span className="font-bold text-amber-400">{Math.round(sec.avgXp ?? 0)} XP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Discipline Score:</span>
                          <span className="font-bold text-emerald-400">{disc} / 100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Attendance:</span>
                          <span className="font-bold text-teal-400">{att}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
