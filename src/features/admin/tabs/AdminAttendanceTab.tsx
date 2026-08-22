import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { Download, Settings, Calendar, ArrowLeft, RefreshCw, AlertCircle, X, Search, CalendarOff } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../store/authContext';
import AttendanceSettingsPage from '../pages/AttendanceSettingsPage';
import AcademicCalendarPage from '../pages/AcademicCalendarPage';

interface Props {
  onBack?: () => void;
}

export default function AdminAttendanceTab({ onBack }: Props) {
  const { isSuperAdmin, isAdmin } = useAuth();
  
  // Role Detection matching Flutter: isYearAdmin
  const isYearAdmin = isAdmin && !isSuperAdmin;

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

      if (fetchedDepts.length > 0 && fetchedDepts[0]?.id) {
        if (isYearAdmin) {
          const firstDeptId = fetchedDepts[0].id.toString();
          setDepartmentId(firstDeptId);
          loadSections(firstDeptId);
        }
      }
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

  const fetchSummary = async () => {
    const activeYearId = yearId || (years.length > 0 && years[0]?.id ? String(years[0].id) : '1');

    setIsLoading(true);
    setIsHoliday(false);
    setSummary(null);

    try {
      const params = new URLSearchParams({
        date: selectedDate,
        yearId: activeYearId,
      });

      if (departmentId && departmentId.trim().length > 0) params.append('departmentId', departmentId);
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
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* 1. Header Bar matching Flutter 1:1 */}
      <div className="bg-[#1E293B] text-white px-4 sm:px-6 py-4 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button 
              onClick={onBack} 
              className="p-2 rounded-full hover:bg-slate-700 transition-colors text-white"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-white">Attendance Dashboard</h1>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">Monitor student daily attendance, periods, and department metrics</p>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all border border-slate-700/80 flex items-center space-x-1.5 text-xs font-semibold"
            title="Export to Excel / CSV"
          >
            {isExporting ? <RefreshCw className="w-4 h-4 animate-spin text-orange-400" /> : <Download className="w-4 h-4" />}
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white transition-all border border-slate-700/80 flex items-center space-x-1.5 text-xs font-semibold"
            title="Attendance Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* 2. Filters Card matching Flutter Screenshot 1:1 */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-5">
          {isLoadingLookups ? (
            <div className="flex items-center justify-center py-8 text-slate-400 space-x-2">
              <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
              <span className="text-sm font-medium">Loading filters...</span>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {/* Academic Year (if not year admin) */}
                {!isYearAdmin && (
                  <div className="relative pt-2">
                    <fieldset className="border border-slate-300 rounded-2xl px-3 pb-2 pt-0 focus-within:border-slate-800 transition-colors">
                      <legend className="text-[11px] font-semibold text-slate-500 px-1.5">Academic Year</legend>
                      <select
                        value={yearId}
                        onChange={(e) => setYearId(e.target.value)}
                        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer py-1"
                      >
                        <option value="">Select Academic Year</option>
                        {years.map((y) => (
                          <option key={y.id} value={y.id}>
                            {y.yearName || (y.yearNo !== undefined ? `Year ${y.yearNo}` : y.name)}
                          </option>
                        ))}
                      </select>
                    </fieldset>
                  </div>
                )}

                {/* Department Dropdown */}
                <div className="relative pt-1">
                  <fieldset className="border border-slate-300 rounded-2xl px-3 pb-2 pt-0 focus-within:border-slate-800 transition-colors">
                    <legend className="text-[11px] font-semibold text-slate-500 px-1.5">Department</legend>
                    <select
                      value={departmentId}
                      onChange={(e) => handleDepartmentChange(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer py-1"
                    >
                      <option value="">All Departments</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name || d.deptName || d.code}
                        </option>
                      ))}
                    </select>
                  </fieldset>
                </div>

                {/* Section Dropdown */}
                <div className="relative pt-1">
                  <fieldset className="border border-slate-300 rounded-2xl px-3 pb-2 pt-0 focus-within:border-slate-800 transition-colors">
                    <legend className="text-[11px] font-semibold text-slate-500 px-1.5">Section</legend>
                    <select
                      value={sectionId}
                      onChange={(e) => setSectionId(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer py-1"
                    >
                      <option value="">All Sections</option>
                      {filteredSections.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.sectionName || s.name}
                        </option>
                      ))}
                    </select>
                  </fieldset>
                </div>

                {/* Date Input */}
                <div className="relative pt-1">
                  <fieldset className="border border-slate-300 rounded-2xl px-3 pb-2 pt-0 focus-within:border-slate-800 transition-colors">
                    <legend className="text-[11px] font-semibold text-slate-500 px-1.5">Date</legend>
                    <div className="flex items-center justify-between py-1">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
                      />
                      <Calendar className="w-5 h-5 text-slate-400 ml-2 pointer-events-none" />
                    </div>
                  </fieldset>
                </div>

                {/* Period Dropdown */}
                <div className="relative pt-1">
                  <fieldset className="border border-slate-300 rounded-2xl px-3 pb-2 pt-0 focus-within:border-slate-800 transition-colors">
                    <legend className="text-[11px] font-semibold text-slate-500 px-1.5">Period</legend>
                    <select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer py-1"
                    >
                      <option value="">All Periods</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                        <option key={p} value={p}>
                          Period {p}
                        </option>
                      ))}
                    </select>
                  </fieldset>
                </div>
              </div>

              {/* Load Dashboard Action Button matching Flutter Screenshot 1:1 */}
              <div className="pt-2 flex justify-center">
                <button
                  onClick={fetchSummary}
                  disabled={isLoading}
                  className="w-full max-w-md py-3.5 px-8 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-extrabold text-base rounded-2xl shadow-lg shadow-red-500/25 transition-all transform active:scale-98 flex items-center justify-center space-x-2"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Loading Dashboard...</span>
                    </>
                  ) : (
                    <span>Load Dashboard</span>
                  )}
                </button>
              </div>
            </>
          )}
        </div>

        {/* 3. Dashboard Results Section */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <RefreshCw className="w-10 h-10 animate-spin text-red-500" />
            <p className="text-sm font-semibold text-slate-600">Fetching attendance records...</p>
          </div>
        ) : isHoliday ? (
          <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center border border-amber-200">
              <CalendarOff className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-heading text-2xl font-bold text-slate-800">Holiday Configured</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm">
                This date (<span className="font-semibold text-slate-700">{selectedDate}</span>) is configured as a Holiday in attendance settings. Attendance cannot be recorded.
              </p>
            </div>
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* 4 Stat Cards matching Flutter Screenshot 1:1 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {/* Card 1: Total */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm text-center flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-600 mb-1">Total</span>
                <span className="text-2xl sm:text-3xl font-black text-[#2563EB]">{totalCount}</span>
              </div>

              {/* Card 2: Present */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm text-center flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-600 mb-1">Present</span>
                <span className="text-2xl sm:text-3xl font-black text-[#16A34A]">{presentCount}</span>
              </div>

              {/* Card 3: Absent */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm text-center flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-600 mb-1">Absent</span>
                <span className="text-2xl sm:text-3xl font-black text-[#DC2626]">{absentCount}</span>
              </div>

              {/* Card 4: Attendance % */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200/90 shadow-sm text-center flex flex-col items-center justify-center">
                <span className="text-xs font-bold text-slate-600 mb-1">Attendance</span>
                <span className="text-2xl sm:text-3xl font-black text-[#9333EA]">{attendancePct}%</span>
              </div>
            </div>

            {/* 4. Table Controls & List Container */}
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
              {/* Search & Subtabs Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by student or reg no..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-800 font-medium"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex bg-slate-200/70 p-1 rounded-xl w-full sm:w-auto text-xs font-bold">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`flex-1 sm:px-4 py-1.5 rounded-lg transition-all ${
                      activeTab === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All ({totalCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('present')}
                    className={`flex-1 sm:px-4 py-1.5 rounded-lg transition-all ${
                      activeTab === 'present' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Present ({presentCount})
                  </button>
                  <button
                    onClick={() => setActiveTab('absent')}
                    className={`flex-1 sm:px-4 py-1.5 rounded-lg transition-all ${
                      activeTab === 'absent' ? 'bg-white text-red-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Absent ({absentCount})
                  </button>
                </div>
              </div>

              {/* Data Table matching Flutter admin_attendance_tab.dart 1:1 */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-[#1E293B] text-[11px] font-bold text-white uppercase tracking-wider">
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
                  <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
                    {processedStudents.length === 0 ? (
                      <tr>
                        <td colSpan={period ? 4 : 11} className="py-10 text-center text-slate-400 text-xs font-medium">
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
                          
                          let bg = 'bg-slate-100 text-slate-400';
                          if (status === 'P' || status === 'PRESENT') bg = 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold';
                          else if (status === 'A' || status === 'ABSENT') bg = 'bg-rose-100 text-rose-800 border-rose-200 font-bold';
                          else if (status === 'OD') bg = 'bg-blue-100 text-blue-800 border-blue-200 font-bold';
                          else if (status === 'L') bg = 'bg-amber-100 text-amber-800 border-amber-200 font-bold';

                          return (
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-md text-xs border ${bg}`}>
                              {status === 'PRESENT' ? 'P' : (status === 'ABSENT' ? 'A' : status)}
                            </span>
                          );
                        };

                        return (
                          <tr key={st.studentId || st.id || idx} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/80 transition-colors' : 'bg-slate-50/40 hover:bg-slate-50/80 transition-colors'}>
                            <td className="py-3 px-3 text-center font-medium text-slate-500 text-xs">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-3 font-mono font-semibold text-slate-700 text-xs">
                              {regNo}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900 text-xs sm:text-sm">
                              {name}
                            </td>
                            {period ? (
                              <td className="py-3 px-3 text-center">
                                {renderPeriodCell(Number(period))}
                              </td>
                            ) : (
                              <>
                                <td className="py-2 px-1 text-center">{renderPeriodCell(1)}</td>
                                <td className="py-2 px-1 text-center">{renderPeriodCell(2)}</td>
                                <td className="py-2 px-1 text-center">{renderPeriodCell(3)}</td>
                                <td className="py-2 px-1 text-center">{renderPeriodCell(4)}</td>
                                <td className="py-2 px-1 text-center">{renderPeriodCell(5)}</td>
                                <td className="py-2 px-1 text-center">{renderPeriodCell(6)}</td>
                                <td className="py-2 px-1 text-center">{renderPeriodCell(7)}</td>
                                <td className="py-2 px-1 text-center">{renderPeriodCell(8)}</td>
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
          <div className="bg-white rounded-3xl p-10 border border-slate-200 shadow-sm text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-600">
              Select department and filters above, then click <span className="text-red-600 font-bold">Load Dashboard</span> to view report.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
