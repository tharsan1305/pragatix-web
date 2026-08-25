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
      <div className="flex h-screen items-center justify-center bg-bg text-text-primary">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-text-primary animate-spin" />
          <p className="text-text-secondary font-semibold type-body-sm">Loading Department Analytics...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && !dashboardData) {
    return (
      <div className="flex flex-col h-full bg-bg min-h-screen text-text-primary">
        <div className="bg-card text-text-primary px-6 py-4 border-b border-border flex justify-between items-center">
          <h1 className="type-h4">HOD Performance Dashboard</h1>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="bg-card border border-border p-8 rounded-lg max-w-md w-full text-center space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="w-12 h-12 rounded-full bg-accent-tint text-accent flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="type-h4 text-text-primary">Unable to Load Analytics</h3>
            <p className="type-caption text-text-secondary">{errorMessage}</p>
            <button
              onClick={fetchDashboard}
              className="inline-flex items-center px-4 py-2 bg-text-primary hover:bg-text-secondary text-card font-bold type-btn rounded-lg shadow-none transition cursor-pointer"
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
    <div className="flex flex-col min-h-screen bg-bg text-text-primary pb-20">
      {/* Header Bar */}
      <div className="bg-card px-6 py-6 sticky top-0 z-30 border-b border-border flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent" />
            <h1 className="type-h4 text-text-primary tracking-tight">{deptName} Analytics</h1>
          </div>
          <p className="type-caption text-text-secondary mt-0.5 font-medium">HOD Dashboard • Dept Code: {deptCode}</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Study Year Dropdown */}
          <div className="flex items-center gap-2 bg-card px-3 py-1.5 rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <Filter className="w-3.5 h-3.5 text-text-muted" />
            <span className="type-caption text-text-secondary">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent type-caption font-bold text-text-primary outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr} className="bg-card text-text-primary">
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
            className="p-2 bg-card hover:bg-bg text-text-secondary hover:text-text-primary rounded-lg border border-border transition cursor-pointer"
            title="Refresh Dashboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-5 lg:p-7 xl:p-8 max-w-[1400px] mx-auto w-full space-y-6">
        {/* 4 Overview Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Students */}
          <div className="bg-card border border-border p-4 rounded-lg flex flex-col justify-between h-[105px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex justify-between items-center">
              <span className="type-caption text-text-secondary font-medium">Total Students</span>
              <div className="p-2 bg-bg border border-border text-text-primary rounded-lg">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="type-h3 text-text-primary">{totalStudents}</div>
          </div>

          {/* Card 2: Total Teachers */}
          <div className="bg-card border border-border p-4 rounded-lg flex flex-col justify-between h-[105px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex justify-between items-center">
              <span className="type-caption text-text-secondary font-medium">Total Teachers</span>
              <div className="p-2 bg-bg border border-border text-text-primary rounded-lg">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>
            <div className="type-h3 text-text-primary">{totalTeachers}</div>
          </div>

          {/* Card 3: Discipline Score */}
          <div className="bg-card border border-border p-4 rounded-lg flex flex-col justify-between h-[105px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex justify-between items-center">
              <span className="type-caption text-text-secondary font-medium">Discipline Score</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                avgDisciplineScore >= 85 ? 'bg-success-tint text-success border border-success/30' : (avgDisciplineScore >= 60 ? 'bg-warning-tint text-warning border border-warning/30' : 'bg-accent-tint text-accent border border-accent/30')
              }`}>
                Max 100
              </span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`type-h3 ${
                avgDisciplineScore >= 85 ? 'text-success' : (avgDisciplineScore >= 60 ? 'text-warning' : 'text-accent')
              }`}>
                {avgDisciplineScore.toFixed(1)}
              </span>
              <span className="type-caption text-text-muted">/ 100</span>
            </div>
          </div>

          {/* Card 4: Avg Student XP */}
          <div className="bg-card border border-border p-4 rounded-lg flex flex-col justify-between h-[105px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex justify-between items-center">
              <span className="type-caption text-text-secondary font-medium">Avg Student XP</span>
              <div className="p-2 bg-bg border border-border text-text-primary rounded-lg">
                <Zap className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="type-h3 text-text-primary">{avgXp}</span>
              <span className="type-caption text-text-muted font-semibold">XP ({totalSections} Secs)</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation (5 Subtabs: Attendance, XP, Discipline, Leaderboard, Sections) */}
        <div className="flex bg-card p-1.5 rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-x-auto gap-1">
          <button
            onClick={() => setActiveSubTab('attendance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg type-caption font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'attendance'
                ? 'bg-text-primary text-card shadow-none'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            Attendance
          </button>
          <button
            onClick={() => setActiveSubTab('xp')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg type-caption font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'xp'
                ? 'bg-text-primary text-card shadow-none'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Zap className="w-4 h-4" />
            XP Analytics
          </button>
          <button
            onClick={() => setActiveSubTab('discipline')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg type-caption font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'discipline'
                ? 'bg-text-primary text-card shadow-none'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Discipline
          </button>
          <button
            onClick={() => setActiveSubTab('leaderboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg type-caption font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'leaderboard'
                ? 'bg-text-primary text-card shadow-none'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Trophy className="w-4 h-4" />
            Leaderboard
          </button>
          <button
            onClick={() => setActiveSubTab('sections')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg type-caption font-bold transition-all shrink-0 cursor-pointer ${
              activeSubTab === 'sections'
                ? 'bg-text-primary text-card shadow-none'
                : 'text-text-secondary hover:text-text-primary'
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
              <div className="bg-card border border-border p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="type-caption text-text-secondary">Overall Attendance</span>
                <div className="type-h3 text-text-primary mt-1">
                  {(attendance.overallAttendancePct ?? 0).toFixed(1)}%
                </div>
                <span className="text-[11px] text-text-muted font-medium">
                  {attendance.totalRecords ?? 0} Recorded Sessions
                </span>
              </div>
              <div className="bg-card border border-border p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="type-caption text-text-secondary">Full Present</span>
                <div className="type-h3 text-success mt-1">
                  {attendance.presentCount ?? 0}
                </div>
                <span className="text-[11px] text-text-muted font-medium">All Periods Attended</span>
              </div>
              <div className="bg-card border border-border p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="type-caption text-text-secondary">Absences</span>
                <div className="type-h3 text-accent mt-1">
                  {attendance.fullAbsentCount ?? 0} <span className="type-body-sm text-text-muted font-normal">Full</span> / {attendance.partialAbsentCount ?? 0} <span className="type-body-sm text-text-muted font-normal">Part</span>
                </div>
                <span className="text-[11px] text-text-muted font-medium">Full & Partial Absences</span>
              </div>
            </div>

            {/* Section Attendance Breakdown */}
            {attendance.sectionAttendance && attendance.sectionAttendance.length > 0 && (
              <div className="bg-card border border-border p-5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
                <h3 className="type-h5 text-text-primary">Section-wise Attendance Rates</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {attendance.sectionAttendance.map((sa: any, idx: number) => {
                    const pct = Number(sa.attendancePercentage ?? 0);
                    return (
                      <div key={idx} className="bg-bg p-3.5 rounded-lg border border-border flex justify-between items-center">
                        <div>
                          <span className="type-caption font-bold text-text-primary bg-card border border-border px-2 py-0.5 rounded-md">
                            Sec {sa.sectionName}
                          </span>
                          <p className="text-[11px] text-text-secondary mt-1">{sa.studentCount} Students</p>
                        </div>
                        <span className={`type-h5 ${
                          pct >= 85 ? 'text-success' : (pct >= 75 ? 'text-warning' : 'text-accent')
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
            <div className="bg-card border border-border p-5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-3">
                <div>
                  <h3 className="type-h5 text-text-primary">Daily Attendance Matrix</h3>
                  <p className="type-caption text-text-secondary">Period-wise student attendance log for selected date</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Year selector */}
                  {lookupYears.length > 0 && (
                    <select
                      value={matrixYearId}
                      onChange={(e) => setMatrixYearId(Number(e.target.value))}
                      className="bg-card type-caption font-bold text-text-primary border border-border px-3 py-1.5 rounded-lg outline-none cursor-pointer"
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
                    className="bg-card type-caption font-bold text-text-primary border border-border px-3 py-1.5 rounded-lg outline-none cursor-pointer"
                  >
                    <option value="">All Sections</option>
                    {lookupSections.map((s) => (
                      <option key={s.id} value={s.id}>
                        Sec {s.sectionName}
                      </option>
                    ))}
                  </select>

                  {/* Date Picker */}
                  <div className="flex items-center gap-1.5 bg-card border border-border px-2.5 py-1.5 rounded-lg">
                    <Calendar className="w-3.5 h-3.5 text-text-muted" />
                    <input
                      type="date"
                      value={matrixDate}
                      onChange={(e) => setMatrixDate(e.target.value)}
                      className="bg-transparent type-caption font-bold text-text-primary outline-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  placeholder="Search student or register number..."
                  value={matrixSearch}
                  onChange={(e) => setMatrixSearch(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg pl-9 pr-4 py-2 type-caption text-text-primary placeholder-text-muted outline-none focus:border-text-primary transition"
                />
              </div>

              {/* Matrix Table */}
              {isLoadingMatrix ? (
                <div className="py-12 flex justify-center">
                  <RefreshCw className="w-6 h-6 text-text-primary animate-spin" />
                </div>
              ) : !matrixSummary || !matrixSummary.students || matrixSummary.students.length === 0 ? (
                <div className="py-12 text-center text-text-muted type-caption">
                  No attendance records found for this date/section.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-border bg-bg text-[11px] font-bold text-text-secondary uppercase tracking-wider">
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
                    <tbody className="divide-y divide-border type-table-cell">
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
                            let bg = 'bg-bg text-text-muted border border-border';
                            if (raw === 'P' || raw === 'PRESENT') bg = 'bg-success-tint text-success font-bold border border-success/30';
                            else if (raw === 'A' || raw === 'ABSENT') bg = 'bg-accent-tint text-accent font-bold border border-accent/30';
                            else if (raw === 'OD') bg = 'bg-bg text-text-primary font-bold border border-border';
                            else if (raw === 'L') bg = 'bg-warning-tint text-warning font-bold border border-warning/30';

                            return (
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-[11px] ${bg}`}>
                                {raw === 'PRESENT' ? 'P' : (raw === 'ABSENT' ? 'A' : raw)}
                              </span>
                            );
                          };

                          return (
                            <tr key={st.studentId || idx} className="hover:bg-bg transition">
                              <td className="py-2.5 px-3 text-center text-text-muted font-mono">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-mono font-semibold text-text-secondary">{st.registerNumber}</td>
                              <td className="py-2.5 px-3 font-semibold text-text-primary">{st.studentName}</td>
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
              <div className="bg-card border border-border p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="type-caption text-text-secondary">Total XP</span>
                <div className="type-h3 text-text-primary mt-1">{xp.totalXp ?? 0} XP</div>
                <span className="text-[11px] text-text-muted font-medium">All Department Students</span>
              </div>
              <div className="bg-card border border-border p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="type-caption text-text-secondary">Awarded XP</span>
                <div className="type-h3 text-success mt-1">+{xp.awardXp ?? 0} XP</div>
                <span className="text-[11px] text-text-muted font-medium">Positive Rewards</span>
              </div>
              <div className="bg-card border border-border p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="type-caption text-text-secondary">Penalty Deductions</span>
                <div className="type-h3 text-accent mt-1">-{xp.penaltyXp ?? 0} XP</div>
                <span className="text-[11px] text-text-muted font-medium">Discipline Violations</span>
              </div>
              <div className="bg-card border border-border p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="type-caption text-text-secondary">Net XP Growth</span>
                <div className="type-h3 text-text-primary mt-1">{xp.netXp ?? 0} XP</div>
                <span className="text-[11px] text-text-muted font-medium">Awarded - Penalty</span>
              </div>
            </div>

            {/* Top Students vs Students Needing Focus */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Achievers */}
              <div className="bg-card border border-border p-5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
                <div className="flex items-center gap-2 text-success">
                  <Award className="w-5 h-5" />
                  <h3 className="type-h5 text-text-primary">Top 5 XP Achievers</h3>
                </div>
                <div className="space-y-2">
                  {!xp.topStudents || xp.topStudents.length === 0 ? (
                    <p className="type-caption text-text-muted py-4 text-center">No student XP data available</p>
                  ) : (
                    xp.topStudents.map((s: any, idx: number) => (
                      <div key={idx} className="bg-bg p-3 rounded-lg border border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-card border border-border text-text-primary font-bold type-caption flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="type-caption font-bold text-text-primary">{s.studentName}</p>
                            <p className="text-[10px] text-text-secondary font-mono">{s.regNo} • Sec {s.sectionName || '-'}</p>
                          </div>
                        </div>
                        <span className="type-caption font-bold text-success">+{s.totalXp ?? s.xp} XP</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Lowest Students */}
              <div className="bg-card border border-border p-5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
                <div className="flex items-center gap-2 text-warning">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="type-h5 text-text-primary">Students Needing Focus</h3>
                </div>
                <div className="space-y-2">
                  {!xp.lowestStudents || xp.lowestStudents.length === 0 ? (
                    <p className="type-caption text-text-muted py-4 text-center">No student records needing focus</p>
                  ) : (
                    xp.lowestStudents.map((s: any, idx: number) => (
                      <div key={idx} className="bg-bg p-3 rounded-lg border border-border flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-card border border-border text-text-primary font-bold type-caption flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <div>
                            <p className="type-caption font-bold text-text-primary">{s.studentName}</p>
                            <p className="text-[10px] text-text-secondary font-mono">{s.regNo} • Sec {s.sectionName || '-'}</p>
                          </div>
                        </div>
                        <span className="type-caption font-bold text-warning">{s.totalXp ?? s.xp} XP</span>
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
              <div className="bg-card border border-border p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="type-caption text-text-secondary">Discipline Average</span>
                <div className="type-h3 text-text-primary mt-1">
                  {(discipline.avgScore ?? avgDisciplineScore).toFixed(1)} / 100
                </div>
                <span className="type-fine text-text-muted font-medium">Department Average</span>
              </div>
              <div className="bg-card border border-border p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="type-caption text-text-secondary">Clean Record Rate</span>
                <div className="type-h3 text-success mt-1">
                  {(discipline.cleanRecordPct ?? 100).toFixed(1)}%
                </div>
                <span className="type-fine text-text-muted font-medium">Zero Penalties</span>
              </div>
              <div className="bg-card border border-border p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="type-caption text-text-secondary">Total Penalties</span>
                <div className="type-h3 text-accent mt-1">
                  {discipline.totalPenalties ?? recentPenalties.length}
                </div>
                <span className="type-fine text-text-muted font-medium">Recorded Deductions</span>
              </div>
              <div className="bg-card border border-border p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <span className="type-caption text-text-secondary">At-Risk Students</span>
                <div className="type-h3 text-warning mt-1">
                  {discipline.atRiskCount ?? 0}
                </div>
                <span className="type-fine text-text-muted font-medium">Negative XP</span>
              </div>
            </div>

            <div className="bg-card border border-border p-5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <h3 className="type-h5 text-text-primary">Recent Disciplinary Penalties</h3>
                  <p className="type-caption text-text-secondary">History of penalty XP deductions applied to department students</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search by student, reg no or reason..."
                    value={penaltySearch}
                    onChange={(e) => setPenaltySearch(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg pl-8 pr-3 py-1.5 type-body-sm text-text-primary placeholder-text-muted outline-none focus:border-text-primary"
                  />
                </div>
              </div>

              {recentPenalties.length === 0 ? (
                <div className="py-10 text-center text-text-muted type-caption">
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
                      <div key={idx} className="bg-bg p-3.5 rounded-lg border border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="type-caption font-bold text-text-primary">{p.studentName}</span>
                            <span className="type-fine font-mono text-text-secondary bg-card border border-border px-1.5 py-0.5 rounded">
                              {p.regNo}
                            </span>
                            {p.sectionName && (
                              <span className="type-fine text-text-primary bg-card px-1.5 py-0.5 rounded border border-border">
                                Sec {p.sectionName}
                              </span>
                            )}
                          </div>
                          <p className="type-caption text-text-secondary font-medium">
                            <span className="text-accent font-bold">Reason:</span> {p.reason || 'Disciplinary deduction'}
                          </p>
                          <div className="flex items-center gap-3 type-fine text-text-muted">
                            <span>Date: {p.penaltyDate || 'Recent'}</span>
                            {p.addedBy && <span>By: {p.addedBy}</span>}
                          </div>
                        </div>

                        <span className="type-caption font-bold px-2.5 py-1 bg-accent-tint text-accent border border-accent/30 rounded-lg shrink-0">
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
          <div className="bg-card border border-border p-5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
            <div>
              <h3 className="type-h5 text-text-primary">Department Leaderboard</h3>
              <p className="type-caption text-text-secondary">Top ranked students ranked by net XP and discipline score</p>
            </div>

            {leaderboard.length === 0 ? (
              <div className="py-12 text-center text-text-muted type-caption">
                No leaderboard standings found for this department.
              </div>
            ) : (
              <div className="space-y-2.5">
                {leaderboard.map((s: any, idx: number) => {
                  const rank = s.rank || idx + 1;
                  let rankColor = 'bg-bg text-text-secondary border border-border';
                  if (rank === 1) rankColor = 'bg-accent-tint text-accent border border-accent/30 font-bold';
                  else if (rank === 2) rankColor = 'bg-bg text-text-primary border border-border font-bold';
                  else if (rank === 3) rankColor = 'bg-bg text-text-secondary border border-border font-bold';

                  return (
                    <div key={idx} className="bg-bg p-3.5 rounded-lg border border-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center type-caption ${rankColor}`}>
                          #{rank}
                        </span>
                        <div>
                          <p className="type-caption font-bold text-text-primary">{s.studentName}</p>
                          <p className="type-fine text-text-secondary font-mono">
                            {s.regNo} {s.sectionName ? `• Sec ${s.sectionName}` : ''} {s.yearName ? `• ${s.yearName}` : ''}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="type-caption font-bold text-accent">{s.netXp ?? s.totalXp ?? 0} XP</span>
                        {s.disciplineScore != null && (
                          <p className="text-[10px] text-text-muted font-medium">
                            Discipline: <span className="text-success font-bold">{Math.min(100, Math.round(s.disciplineScore))}/100</span>
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
            <h3 className="type-h5 text-text-primary">Section Comparison Overview</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sectionComparison.length === 0 ? (
                <div className="col-span-full py-12 text-center text-text-muted type-caption">
                  No section data available for comparison.
                </div>
              ) : (
                sectionComparison.map((sec: any, idx: number) => {
                  const disc = Math.min(100, Math.round(Number(sec.avgDisciplineScore ?? 100)));
                  const att = Math.round(Number(sec.attendancePct ?? 0));

                  return (
                    <div key={idx} className="bg-card border border-border p-5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="type-body-sm font-bold text-text-primary bg-bg px-3 py-1 rounded-lg border border-border">
                          Section {sec.sectionName}
                        </span>
                        <span className="type-caption text-text-secondary">{sec.totalStudents} Students</span>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-border type-caption">
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Average XP:</span>
                          <span className="font-bold text-text-primary">{Math.round(sec.avgXp ?? 0)} XP</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Discipline Score:</span>
                          <span className="font-bold text-success">{disc} / 100</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-text-secondary">Attendance:</span>
                          <span className="font-bold text-text-primary">{att}%</span>
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
