import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { Download, Settings, Calendar, ArrowLeft, RefreshCw, X, Search, CalendarOff, Users, CheckCircle2, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../store/authContext';
import AttendanceSettingsPage from '../pages/AttendanceSettingsPage';
import AcademicCalendarPage from '../pages/AcademicCalendarPage';

import { ROLE_ACCESS, getEffectiveRole } from '../../../config/roleAccess';

interface Props {
  onBack?: () => void;
}

export default function AdminAttendanceTab({ onBack }: Props) {
  const auth = useAuth();
  const { user, isSuperAdmin, isHOD, isAdmin, role, subRoles } = auth;
  const effectiveRole = getEffectiveRole(user, { isSuperAdmin, isHOD, isAdmin, role, subRoles });
  const roleConfig = ROLE_ACCESS[effectiveRole];
  
  // Role Detection: isYearAdmin / isHOD
  const isYearAdmin = roleConfig.dataScope === 'year';
  const isHodUser = !roleConfig.canViewAllDepartments;

  const userYear = user?.academicYear || user?.assignedYear || user?.year || (user?.adminDetails?.academicYear);
  const userDept = user?.department || user?.departmentName || user?.dept || (user?.superAdminDetails?.department);

  const scopeLabel = roleConfig.dataScope === 'institution'
    ? 'INSTITUTION SCOPE'
    : roleConfig.dataScope === 'year'
    ? `ADMIN SCOPE: ${userYear || 'ASSIGNED YEAR'}`
    : `HOD SCOPE: ${userDept || 'YOUR DEPARTMENT'}`;

  // Filter States
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [yearId, setYearId] = useState<string>('');
  const [departmentId, setDepartmentId] = useState<string>('');
  const [sectionId, setSectionId] = useState<string>('');
  const [period, setPeriod] = useState<string>(''); // '' = All Periods

  // Lookup Lists
  const [years, setYears] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);

  // UI States
  const [isLoadingLookups, setIsLoadingLookups] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isHoliday, setIsHoliday] = useState<boolean>(false);
  const [summary, setSummary] = useState<any>(null);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'present' | 'absent'>('all');
  const [hasAppliedFilters, setHasAppliedFilters] = useState<boolean>(false);

  useEffect(() => {
    loadLookups();
  }, []);

  const loadLookups = async () => {
    setIsLoadingLookups(true);
    try {
      const [yearRes, deptRes] = await Promise.all([
        apiClient.get('/api/v1/admin/years').catch(() => ({ data: { data: [] } })),
        apiClient.get('/api/v1/admin/departments').catch(() => ({ data: { data: [] } }))
      ]);

      const fetchedYears = Array.isArray(yearRes.data?.data) ? yearRes.data.data : (Array.isArray(yearRes.data) ? yearRes.data : []);
      const fetchedDepts = Array.isArray(deptRes.data?.data) ? deptRes.data.data : (Array.isArray(deptRes.data) ? deptRes.data : []);

      setYears(fetchedYears);
      setDepartments(fetchedDepts);

      if (fetchedYears.length > 0 && fetchedYears[0]?.id) {
        setYearId(fetchedYears[0].id.toString());
      }

      if (fetchedDepts.length > 0) {
        if (isHodUser && (userDept || user?.departmentId)) {
          const matchedDept = fetchedDepts.find((d: any) => 
            (user?.departmentId && String(d.id) === String(user.departmentId)) ||
            (userDept && (d.name?.toLowerCase() === userDept.toLowerCase() || d.code?.toLowerCase() === userDept.toLowerCase()))
          ) || fetchedDepts[0];

          if (matchedDept?.id) {
            const targetDeptId = matchedDept.id.toString();
            setDepartmentId(targetDeptId);
            loadSections(targetDeptId);
          }
        } else if (isYearAdmin && fetchedDepts[0]?.id) {
          const firstDeptId = fetchedDepts[0].id.toString();
          setDepartmentId(firstDeptId);
          loadSections(firstDeptId);
        }
      }

      // Note: Do not auto-fetch summary on mount. Wait for user to select filters and click "Apply Filters".
    } catch (e) {
      logger.error("Error loading filters:", e);
      setYears([]);
      setDepartments([]);
    } finally {
      setIsLoadingLookups(false);
    }
  };

  const loadSections = async (deptId: string) => {
    if (!deptId) {
      setFilteredSections([]);
      setSectionId('');
      return;
    }
    try {
      const res = await apiClient.get(`/api/v1/admin/sections?departmentId=${deptId}`);
      const fetchedSecs = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setFilteredSections(fetchedSecs);
      setSectionId('');
    } catch (e) {
      setFilteredSections([]);
      setSectionId('');
    }
  };

  const handleDepartmentChange = (newDeptId: string) => {
    setDepartmentId(newDeptId);
    if (newDeptId) {
      loadSections(newDeptId);
    } else {
      setFilteredSections([]);
      setSectionId('');
    }
  };

  const fetchSummary = async (overrideYearId?: string, overrideDeptId?: string) => {
    const activeYearId = overrideYearId || yearId || (years.length > 0 && years[0]?.id ? String(years[0].id) : '1');
    const activeDeptId = overrideDeptId !== undefined ? overrideDeptId : departmentId;

    setIsLoading(true);
    setIsHoliday(false);
    setSummary(null);

    try {
      const params = new URLSearchParams({
        date: selectedDate,
        yearId: activeYearId,
      });

      if (activeDeptId && activeDeptId.trim().length > 0) params.append('departmentId', activeDeptId);
      if (sectionId && sectionId.trim().length > 0) params.append('sectionId', sectionId);
      if (period && period.trim().length > 0) params.append('period', period);

      const res = await apiClient.get(`/api/admin/attendance/summary?${params.toString()}`);
      const summaryData = res.data?.data || res.data;

      if (summaryData) {
        setSummary(summaryData);
      } else {
        setSummary({
          totalStudents: 0,
          totalPresent: 0,
          totalAbsent: 0,
          attendancePercentage: 0,
          students: [],
          presentStudents: [],
          absentStudents: [],
        });
      }
    } catch (e: any) {
      const errMsg = e.response?.data?.message || e.message || '';
      if (errMsg.toLowerCase().includes('holiday')) {
        setIsHoliday(true);
        setSummary(null);
      } else {
        logger.warn('Backend server response warning:', e);
        setSummary({
          totalStudents: 0,
          totalPresent: 0,
          totalAbsent: 0,
          attendancePercentage: 0,
          students: [],
          presentStudents: [],
          absentStudents: [],
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      let studentList: any[] = [];
      if (summary?.students && Array.isArray(summary.students) && summary.students.length > 0) {
        studentList = summary.students;
      } else {
        const pList = Array.isArray(summary?.presentStudents) ? summary.presentStudents : [];
        const aList = Array.isArray(summary?.absentStudents) ? summary.absentStudents : [];
        studentList = [
          ...pList.map((s: any) => ({ ...s, status: 'PRESENT' })),
          ...aList.map((s: any) => ({ ...s, status: 'ABSENT' }))
        ];
      }

      if (studentList.length === 0) {
        toast.error('No attendance records available to export.');
        return;
      }

      const currentDeptName = departments.find(d => String(d.id) === String(departmentId))?.name || (departmentId ? 'Selected Dept' : 'All Departments');
      const currentYearName = years.find(y => String(y.id) === String(yearId))?.yearName || years.find(y => String(y.id) === String(yearId))?.name || 'All Years';
      const currentSecName = filteredSections.find(s => String(s.id) === String(sectionId))?.sectionName || filteredSections.find(s => String(s.id) === String(sectionId))?.name || (sectionId ? 'Selected Section' : 'All Sections');

      const isSinglePeriod = Boolean(period && period.trim().length > 0);

      let headers: string[] = [];
      if (isSinglePeriod) {
        headers = ['S.No', 'Register Number', 'Student Name', 'Department', 'Year', 'Section', `Period ${period} Status`, 'Date'];
      } else {
        headers = ['S.No', 'Register Number', 'Student Name', 'Department', 'Year', 'Section', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'Overall Status', 'Date'];
      }

      const rows: any[][] = [headers];

      studentList.forEach((s: any, idx: number) => {
        const rawRegNo = s.registerNumber || s.regNo || 'N/A';
        // Prefix with tab inside quotes so Excel/WPS Spreadsheet preserves register numbers as text without scientific notation
        const formattedRegNo = rawRegNo !== 'N/A' ? `\t${rawRegNo}` : 'N/A';
        const studentName = s.studentName || s.fullName || 'Student';
        const dept = s.departmentName || currentDeptName;
        const yr = s.yearName || currentYearName;
        const sec = s.sectionName || currentSecName;

        const periodMap = s.periodStatuses || {};

        if (isSinglePeriod) {
          const rawStatus = (periodMap[period] || periodMap[Number(period)] || s.status || '').toUpperCase();
          let statusText = 'NOT RECORDED';
          if (rawStatus === 'P' || rawStatus === 'PRESENT') statusText = 'PRESENT';
          else if (rawStatus === 'A' || rawStatus === 'ABSENT') statusText = 'ABSENT';
          else if (rawStatus === 'OD') statusText = 'ON DUTY';
          else if (rawStatus === 'L') statusText = 'LEAVE';
          else if (rawStatus && rawStatus !== '—') statusText = rawStatus;

          rows.push([
            idx + 1,
            formattedRegNo,
            studentName,
            dept,
            yr,
            sec,
            statusText,
            selectedDate
          ]);
        } else {
          // All Periods 1..8
          const p1 = (periodMap[1] || periodMap['1'] || '—').toUpperCase();
          const p2 = (periodMap[2] || periodMap['2'] || '—').toUpperCase();
          const p3 = (periodMap[3] || periodMap['3'] || '—').toUpperCase();
          const p4 = (periodMap[4] || periodMap['4'] || '—').toUpperCase();
          const p5 = (periodMap[5] || periodMap['5'] || '—').toUpperCase();
          const p6 = (periodMap[6] || periodMap['6'] || '—').toUpperCase();
          const p7 = (periodMap[7] || periodMap['7'] || '—').toUpperCase();
          const p8 = (periodMap[8] || periodMap['8'] || '—').toUpperCase();

          const allPeriods = [p1, p2, p3, p4, p5, p6, p7, p8];
          const presentCount = allPeriods.filter(p => p === 'P' || p === 'OD').length;
          const absentCount = allPeriods.filter(p => p === 'A' || p === 'L').length;

          let overallStatus = 'NOT RECORDED';
          if (s.status) {
            overallStatus = s.status;
          } else if (presentCount === 8) {
            overallStatus = 'PRESENT';
          } else if (absentCount === 8) {
            overallStatus = 'ABSENT';
          } else if (presentCount > 0 && absentCount === 0) {
            overallStatus = 'PRESENT';
          } else if (presentCount > 0 && absentCount > 0) {
            overallStatus = `PARTIAL (${presentCount}P / ${absentCount}A)`;
          } else if (absentCount > 0) {
            overallStatus = 'ABSENT';
          } else if (allPeriods.every(p => p === 'OD')) {
            overallStatus = 'ON DUTY';
          }

          rows.push([
            idx + 1,
            formattedRegNo,
            studentName,
            dept,
            yr,
            sec,
            p1,
            p2,
            p3,
            p4,
            p5,
            p6,
            p7,
            p8,
            overallStatus,
            selectedDate
          ]);
        }
      });

      const escapeCell = (val: any) => {
        const str = String(val ?? '');
        return `"${str.replace(/"/g, '""')}"`;
      };

      const csvString = '\uFEFF' + rows.map(r => r.map(escapeCell).join(',')).join('\r\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      const cleanDept = currentDeptName.replace(/[^a-zA-Z0-9]/g, '_');
      link.setAttribute('download', `attendance_${cleanDept}_${selectedDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Attendance report exported successfully!');
    } catch (e) {
      toast.error('Failed to export report');
    } finally {
      setIsExporting(false);
    }
  };

  // Extract student list for display
  const getProcessedStudents = () => {
    if (!summary) return [];
    let list: any[] = [];

    if (summary.students && Array.isArray(summary.students) && summary.students.length > 0) {
      list = summary.students;
    } else {
      const pList = Array.isArray(summary.presentStudents) ? summary.presentStudents.map((s: any) => ({ ...s, status: 'PRESENT' })) : [];
      const aList = Array.isArray(summary.absentStudents) ? summary.absentStudents.map((s: any) => ({ ...s, status: 'ABSENT' })) : [];
      list = [...pList, ...aList];
    }

    if (activeTab === 'present') {
      list = list.filter((s: any) => {
        if (!s) return false;
        if (period && period.trim()) {
          const pStatus = (s.periodStatuses?.[period] || s.periodStatuses?.[Number(period)] || s.status || '').toUpperCase();
          return pStatus === 'P' || pStatus === 'OD' || pStatus === 'PRESENT';
        }
        const statuses = Object.values(s.periodStatuses || {}).map((v: any) => String(v).toUpperCase());
        if (statuses.length > 0) {
          return statuses.some((v: string) => v === 'P' || v === 'OD' || v === 'PRESENT');
        }
        return s.status === 'PRESENT' || s.isPresent === true || s.status === 'P';
      });
    } else if (activeTab === 'absent') {
      list = list.filter((s: any) => {
        if (!s) return false;
        if (period && period.trim()) {
          const pStatus = (s.periodStatuses?.[period] || s.periodStatuses?.[Number(period)] || s.status || '').toUpperCase();
          return pStatus === 'A' || pStatus === 'L' || pStatus === 'ABSENT';
        }
        const statuses = Object.values(s.periodStatuses || {}).map((v: any) => String(v).toUpperCase());
        if (statuses.length > 0) {
          const hasPres = statuses.some((v: string) => v === 'P' || v === 'OD' || v === 'PRESENT');
          const hasAbs = statuses.some((v: string) => v === 'A' || v === 'L' || v === 'ABSENT');
          return hasAbs || (!hasPres && statuses.every((v: string) => v === '—' || v === 'A' || v === 'L'));
        }
        return s.status === 'ABSENT' || s.isPresent === false || s.status === 'A';
      });
    }

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((s: any) => {
        if (!s) return false;
        const name = String(s.studentName || s.fullName || '').toLowerCase();
        const reg = String(s.registerNumber || s.regNo || '').toLowerCase();
        return name.includes(q) || reg.includes(q);
      });
    }

    return list;
  };

  const processedStudents = getProcessedStudents();
  
  // Calculate dynamic stats matching selected period or all periods
  const calculateDynamicStats = () => {
    if (!summary) return { totalCount: 0, presentCount: 0, absentCount: 0, attendancePct: 0 };
    
    let allList: any[] = [];
    if (summary.students && Array.isArray(summary.students) && summary.students.length > 0) {
      allList = summary.students;
    } else {
      const pList = Array.isArray(summary.presentStudents) ? summary.presentStudents.map((s: any) => ({ ...s, status: 'PRESENT' })) : [];
      const aList = Array.isArray(summary.absentStudents) ? summary.absentStudents.map((s: any) => ({ ...s, status: 'ABSENT' })) : [];
      allList = [...pList, ...aList];
    }

    const total = allList.length || (summary.totalStudents ?? 0);
    if (total === 0) return { totalCount: 0, presentCount: 0, absentCount: 0, attendancePct: 0 };

    if (period && period.trim()) {
      let pCount = 0;
      let aCount = 0;
      for (const s of allList) {
        const pStatus = (s.periodStatuses?.[period] || s.periodStatuses?.[Number(period)] || s.status || '').toUpperCase();
        if (pStatus === 'P' || pStatus === 'OD' || pStatus === 'PRESENT') pCount++;
        else if (pStatus === 'A' || pStatus === 'L' || pStatus === 'ABSENT') aCount++;
      }
      const pct = Math.round((pCount / total) * 1000) / 10;
      return { totalCount: total, presentCount: pCount, absentCount: aCount, attendancePct: pct };
    }

    const pCount = summary.totalPresent ?? allList.filter((s: any) => {
      const statuses = Object.values(s.periodStatuses || {}).map((v: any) => String(v).toUpperCase());
      return statuses.length > 0 ? statuses.some((v: string) => v === 'P' || v === 'OD' || v === 'PRESENT') : (s.status === 'PRESENT' || s.isPresent);
    }).length;

    const aCount = summary.totalAbsent ?? allList.filter((s: any) => {
      const statuses = Object.values(s.periodStatuses || {}).map((v: any) => String(v).toUpperCase());
      return statuses.length > 0 ? statuses.some((v: string) => v === 'A' || v === 'L' || v === 'ABSENT') : (s.status === 'ABSENT' || !s.isPresent);
    }).length;

    const pct = summary.attendancePercentage ?? (total > 0 ? Math.round((pCount / total) * 1000) / 10 : 0);
    return { totalCount: total, presentCount: pCount, absentCount: aCount, attendancePct: pct };
  };

  const { totalCount, presentCount, absentCount, attendancePct } = calculateDynamicStats();

  if (showCalendar) {
    return <AcademicCalendarPage onBack={() => setShowCalendar(false)} />;
  }

  // If Settings View Active
  if (showSettings) {
    return (
      <AttendanceSettingsPage 
        onBack={() => setShowSettings(false)} 
        onNavigateAcademicCalendar={() => {
          setShowSettings(false);
          setShowCalendar(true);
        }} 
      />
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg text-text-primary">
      {/* 1. Header Bar */}
      <div className="bg-card text-text-primary px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="type-h3 font-bold tracking-tight text-text-primary">Attendance Dashboard</h1>
              <span className="px-2.5 py-0.5 rounded-md type-fine font-bold uppercase bg-bg text-text-primary border border-border tracking-wider">
                {scopeLabel}
              </span>
            </div>
            <p className="type-caption text-text-secondary font-medium hidden sm:block mt-0.5">
              Monitor student daily attendance, periods, and department metrics
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={() => setShowCalendar(true)}
            className="p-2.5 rounded-lg bg-card hover:bg-bg text-text-primary transition-colors border border-border flex items-center space-x-1.5 type-caption cursor-pointer"
            title="Academic Calendar"
          >
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline font-bold">Calendar</span>
          </button>

          <button
            onClick={handleExport}
            disabled={isExporting}
            className="p-2.5 rounded-lg bg-card hover:bg-bg text-text-primary transition-colors border border-border flex items-center space-x-1.5 type-caption cursor-pointer"
            title="Export to Excel / CSV"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin text-accent" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline font-bold">Export</span>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-lg bg-card hover:bg-bg text-text-primary transition-colors border border-border flex items-center space-x-1.5 type-caption cursor-pointer"
            title="Attendance Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline font-bold">Settings</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full space-y-6">
        {/* 2. Compact Instant Filter Toolbar */}
        <div className="bg-card rounded-lg p-4 sm:p-5 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          {isLoadingLookups ? (
            <div className="flex items-center justify-center py-4 text-text-muted space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin text-accent" />
              <span className="type-body-sm font-medium">Loading filter options...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 items-end">
              {/* 1. Academic Year */}
              {!isYearAdmin && (
                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    Year
                  </label>
                  <select
                    value={yearId}
                    onChange={(e) => setYearId(e.target.value)}
                    className="w-full bg-bg border border-border rounded-lg px-3 py-2 type-body-sm font-semibold text-text-primary outline-none focus:border-text-primary cursor-pointer transition-colors"
                  >
                    <option value="">All Years</option>
                    {years.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.yearName || (y.yearNo !== undefined ? `Year ${y.yearNo}` : y.name)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* 2. Department */}
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Department {isHodUser && '(Locked)'}
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => handleDepartmentChange(e.target.value)}
                  disabled={isHodUser}
                  className={`w-full bg-bg border border-border rounded-lg px-3 py-2 type-body-sm font-semibold text-text-primary outline-none focus:border-text-primary transition-colors ${
                    isHodUser ? 'opacity-80 cursor-not-allowed bg-border/40' : 'cursor-pointer'
                  }`}
                >
                  {!isHodUser && <option value="">All Depts</option>}
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name || d.deptName || d.code}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Section */}
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Section
                </label>
                <select
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 type-body-sm font-semibold text-text-primary outline-none focus:border-text-primary cursor-pointer transition-colors"
                >
                  <option value="">All Sections</option>
                  {filteredSections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.sectionName || s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Date */}
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 type-body-sm font-semibold text-text-primary outline-none focus:border-text-primary cursor-pointer transition-colors"
                />
              </div>

              {/* 5. Period */}
              <div>
                <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Period
                </label>
                <select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 type-body-sm font-semibold text-text-primary outline-none focus:border-text-primary cursor-pointer transition-colors"
                >
                  <option value="">All Periods</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                    <option key={p} value={p}>
                      Period {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* 6. Apply Button */}
              <div>
                <button
                  onClick={() => {
                    setHasAppliedFilters(true);
                    fetchSummary();
                  }}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-accent hover:bg-accent-hover text-card font-bold type-caption rounded-lg transition-colors shadow-none flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Loading...' : 'Apply Filters'}</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 3. Dashboard Results Section */}
        {!hasAppliedFilters ? (
          <div className="bg-card rounded-lg p-12 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-bg text-text-muted rounded-lg flex items-center justify-center border border-border">
              <Search className="w-6 h-6 text-text-secondary" />
            </div>
            <div>
              <h3 className="type-h4 font-bold text-text-primary">Attendance Records Ready</h3>
              <p className="type-body-sm text-text-secondary mt-1 max-w-md font-medium">
                Select your desired Year, Department, Section, Date, or Period from the filters above and click <strong className="text-accent font-bold">Apply Filters</strong> to view attendance metrics.
              </p>
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
            <RefreshCw className="w-10 h-10 animate-spin text-accent" />
            <p className="type-body-sm font-semibold text-text-secondary">Fetching campus attendance records...</p>
          </div>
        ) : isHoliday ? (
          <div className="bg-card rounded-lg p-10 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-warning-tint text-warning rounded-lg flex items-center justify-center border border-warning/20">
              <CalendarOff className="w-6 h-6" />
            </div>
            <div>
              <h3 className="type-h3 font-bold text-text-primary">Holiday Configured</h3>
              <p className="type-body-sm text-text-secondary mt-1 max-w-sm font-medium">
                This date (<span className="font-semibold text-text-primary">{selectedDate}</span>) is configured as a Holiday in academic settings.
              </p>
            </div>
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* 4 Stat Cards with Soft Colored Icon Tiles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Card 1: Total */}
              <div className="bg-card rounded-2xl p-5 border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between group">
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Enrolled</p>
                  <h3 className="text-3xl font-black text-text-primary tracking-tight mt-1">{totalCount}</h3>
                  <p className="text-xs font-medium text-text-secondary mt-0.5">Students evaluated</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50/90 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              {/* Card 2: Present */}
              <div className="bg-card rounded-2xl p-5 border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between group">
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Present Today</p>
                  <h3 className="text-3xl font-black text-emerald-600 tracking-tight mt-1">{presentCount}</h3>
                  <p className="text-xs font-medium text-text-secondary mt-0.5">Attended classes</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50/90 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </div>

              {/* Card 3: Absent */}
              <div className="bg-card rounded-2xl p-5 border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between group">
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Absent Today</p>
                  <h3 className="text-3xl font-black text-rose-600 tracking-tight mt-1">{absentCount}</h3>
                  <p className="text-xs font-medium text-text-secondary mt-0.5">Unexcused / Leave</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-rose-50/90 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <CalendarOff className="w-6 h-6" />
                </div>
              </div>

              {/* Card 4: Attendance % */}
              <div className="bg-card rounded-2xl p-5 border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex items-center justify-between group">
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Attendance Rate</p>
                  <h3 className={`text-3xl font-black tracking-tight mt-1 ${Number(attendancePct) >= 85 ? 'text-emerald-600' : Number(attendancePct) >= 75 ? 'text-amber-600' : 'text-rose-600'}`}>
                    {attendancePct}%
                  </h3>
                  <p className="text-xs font-medium text-text-secondary mt-0.5">Campus Average</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-purple-50/90 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* 4. Table Controls & List Container */}
            <div className="bg-card rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
              {/* Search & Subtabs Header */}
              <div className="p-4 border-b border-border-subtle bg-card flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student or reg no..."
                    className="w-full pl-9 pr-8 py-2 type-body-sm bg-card border border-border rounded-lg outline-none text-text-primary placeholder-text-muted font-medium"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex bg-bg p-1 rounded-lg border border-border w-full sm:w-auto type-caption font-bold">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 sm:px-4 py-1.5 rounded-md transition-all ${
                      activeTab === 'all' ? 'bg-text-primary text-card shadow-none' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    All ({totalCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('present')}
                    className={`flex-1 sm:px-4 py-1.5 rounded-md transition-all ${
                      activeTab === 'present' ? 'bg-text-primary text-card shadow-none' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Present ({presentCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('absent')}
                    className={`flex-1 sm:px-4 py-1.5 rounded-md transition-all ${
                      activeTab === 'absent' ? 'bg-text-primary text-card shadow-none' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    Absent ({absentCount})
                  </button>
                </div>
              </div>

              {/* Data Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-bg type-table-head font-bold text-text-primary uppercase tracking-wider">
                      <th className="py-3 px-3 w-12 text-center">#</th>
                      <th className="py-3 px-3">Reg. No</th>
                      <th className="py-3 px-4">Student Name</th>
                      {period ? (
                        <th className="py-3 px-3 text-center w-20">Period {period}</th>
                      ) : (
                        <>
                          <th className="py-3 px-2 text-center w-10">P1</th>
                          <th className="py-3 px-2 text-center w-10">P2</th>
                          <th className="py-3 px-2 text-center w-10">P3</th>
                          <th className="py-3 px-2 text-center w-10">P4</th>
                          <th className="py-3 px-2 text-center w-10">P5</th>
                          <th className="py-3 px-2 text-center w-10">P6</th>
                          <th className="py-3 px-2 text-center w-10">P7</th>
                          <th className="py-3 px-2 text-center w-10">P8</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-subtle type-table-cell">
                    {processedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={period ? 4 : 11} className="py-12 text-center text-text-muted type-caption">
                          No attendance records found matching filters.
                        </td>
                      </tr>
                    ) : (
                      processedStudents.map((st: any, idx: number) => {
                        const regNo = st.registerNumber || st.regNo || 'N/A';
                        const name = st.studentName || st.fullName || 'Student';
                        const periodStatuses = st.periodStatuses || {};

                        const renderPeriodCell = (pNum: number) => {
                          const status = (periodStatuses[pNum] || periodStatuses[String(pNum)] || (st.status === 'PRESENT' ? 'P' : (st.status === 'ABSENT' ? 'A' : '—'))).toUpperCase();
                          
                          let bg = 'bg-bg text-text-muted border-border';
                          if (status === 'P' || status === 'PRESENT') bg = 'bg-success-tint text-success border-success-tint font-bold';
                          else if (status === 'A' || status === 'ABSENT') bg = 'bg-warning-tint text-warning border-warning-tint font-bold';
                          else if (status === 'OD') bg = 'bg-bg text-text-secondary border-border font-bold';
                          else if (status === 'L') bg = 'bg-warning-tint text-warning border-warning-tint font-bold';

                          return (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md type-fine border ${bg}`}>
                              {status === 'PRESENT' ? 'P' : (status === 'ABSENT' ? 'A' : status)}
                            </span>
                          );
                        };

                        return (
                          <tr key={st.studentId || st.id || idx} className="bg-card hover:bg-bg transition-colors">
                            <td className="py-[13px] px-3 text-center font-medium text-text-secondary type-table-cell">
                              {idx + 1}
                            </td>
                            <td className="py-[13px] px-3 font-mono font-semibold text-text-secondary type-table-cell">
                              {regNo}
                            </td>
                            <td className="py-[13px] px-4 font-semibold text-text-primary type-table-cell sm:type-table-cell">
                              {name}
                            </td>
                            {period ? (
                              <td className="py-[13px] px-3 text-center">
                                {renderPeriodCell(Number(period))}
                              </td>
                            ) : (
                              <>
                                <td className="py-[13px] px-1 text-center">{renderPeriodCell(1)}</td>
                                <td className="py-[13px] px-1 text-center">{renderPeriodCell(2)}</td>
                                <td className="py-[13px] px-1 text-center">{renderPeriodCell(3)}</td>
                                <td className="py-[13px] px-1 text-center">{renderPeriodCell(4)}</td>
                                <td className="py-[13px] px-1 text-center">{renderPeriodCell(5)}</td>
                                <td className="py-[13px] px-1 text-center">{renderPeriodCell(6)}</td>
                                <td className="py-[13px] px-1 text-center">{renderPeriodCell(7)}</td>
                                <td className="py-[13px] px-1 text-center">{renderPeriodCell(8)}</td>
                              </>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-lg p-12 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-bg border border-border text-text-muted rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="type-body-sm font-semibold text-text-secondary">
              Select department and filters above, then click <span className="text-accent font-bold">Load Dashboard</span> to view report.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
