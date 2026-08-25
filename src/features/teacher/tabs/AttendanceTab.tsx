import { logger } from '../../../utils/logger';
import { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, Save, UsersRound, RefreshCw, AlertCircle, Check, CalendarX } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import { sanitizeAcademicYears } from '../../../utils/academicYearUtils';

interface Student {
  studentId: number;
  studentName: string;
  registerNumber: string;
  status: 'PRESENT' | 'ABSENT';
  remarks?: string;
}

interface LookupOption {
  id: number;
  name: string;
  code?: string;
  yearNo?: number;
}

export default function AttendanceTab() {
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isHoliday, setIsHoliday] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'present' | 'absent'>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  // Form State — matching Flutter teacher_attendance_tab.dart 1:1
  const [academicYearId, setAcademicYearId] = useState<number | ''>('');
  const [yearId, setYearId] = useState<number | ''>('');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [sectionId, setSectionId] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<number>(1);

  // Dynamic Lookup options matching Flutter
  const [_academicYears, setAcademicYears] = useState<LookupOption[]>([]);
  const [years, setYears] = useState<LookupOption[]>([]);
  const [departments, setDepartments] = useState<LookupOption[]>([]);
  const [sections, setSections] = useState<LookupOption[]>([]);

  // 1. Fetch Next Available Period from Backend
  const fetchNextAvailablePeriod = useCallback(async (
    targetDate: string,
    deptId: number | '',
    yId?: number | '',
    secId?: number | ''
  ) => {
    if (!deptId) return;
    try {
      let url = `/api/teacher/attendance/next-period?date=${targetDate}&departmentId=${deptId}`;
      if (yId !== '' && yId !== undefined) {
        url += `&yearId=${yId}`;
      }
      if (secId !== '' && secId !== undefined && secId !== null) {
        url += `&sectionId=${secId}`;
      }

      const res = await apiClient.get(url);
      if (res.data && res.data.success && typeof res.data.data === 'number') {
        setPeriod(res.data.data);
      }
    } catch (err) {
      logger.warn('Could not fetch next available period', err);
    }
  }, []);

  // 2. Fetch Initial Lookups matching Flutter _loadLookups()
  useEffect(() => {
    const fetchInitialLookups = async () => {
      try {
        const [acadYearsRes, yearsRes, deptsRes, secsRes, profileRes, ccDetailsRes] = await Promise.allSettled([
          apiClient.get('/api/v1/admin/academic-years'),
          apiClient.get('/api/v1/admin/years'),
          apiClient.get('/api/v1/admin/departments'),
          apiClient.get('/api/v1/admin/sections'),
          apiClient.get('/api/v1/auth/me'),
          apiClient.get('/api/v1/cc/class-details')
        ]);

        let loadedAcadYears: LookupOption[] = [];
        let loadedYears: LookupOption[] = [];
        let loadedDepts: LookupOption[] = [];
        let loadedSecs: LookupOption[] = [];
        let userProfile: any = null;
        let ccData: any = null;

        // Parse Academic Years
        if (acadYearsRes.status === 'fulfilled') {
          const raw = Array.isArray(acadYearsRes.value?.data?.data)
            ? acadYearsRes.value.data.data
            : (Array.isArray(acadYearsRes.value?.data) ? acadYearsRes.value.data : []);
          loadedAcadYears = sanitizeAcademicYears(raw).map((ay) => ({
            id: typeof ay.id === 'number' ? ay.id : (parseInt(String(ay.id), 10) || 1),
            name: ay.academicYear || ay.name
          }));
        } else {
          loadedAcadYears = sanitizeAcademicYears([]).map((ay, idx) => ({
            id: idx + 1,
            name: ay.academicYear
          }));
        }
        setAcademicYears(loadedAcadYears);
        if (loadedAcadYears.length > 0) {
          setAcademicYearId(loadedAcadYears[0].id);
        }

        // Parse Years
        if (yearsRes.status === 'fulfilled') {
          const raw = Array.isArray(yearsRes.value?.data?.data)
            ? yearsRes.value.data.data
            : (Array.isArray(yearsRes.value?.data) ? yearsRes.value.data : []);
          loadedYears = raw.map((y: any) => ({
            id: y.id,
            name: y.yearName || y.name || (y.yearNo ? `Year ${y.yearNo}` : `Year ${y.id}`),
            yearNo: y.yearNo
          }));
        }
        if (loadedYears.length === 0) {
          loadedYears = [
            { id: 1, name: 'First Year', yearNo: 1 },
            { id: 2, name: 'Second Year', yearNo: 2 },
            { id: 3, name: 'Third Year', yearNo: 3 },
            { id: 4, name: 'Fourth Year', yearNo: 4 }
          ];
        }
        setYears(loadedYears);

        // Parse Departments
        if (deptsRes.status === 'fulfilled') {
          const raw = Array.isArray(deptsRes.value?.data?.data)
            ? deptsRes.value.data.data
            : (Array.isArray(deptsRes.value?.data) ? deptsRes.value.data : []);
          loadedDepts = raw.map((d: any) => ({
            id: d.id,
            name: d.name || d.deptName || d.code || `Department ${d.id}`,
            code: d.code
          }));
        }
        if (loadedDepts.length === 0) {
          loadedDepts = [
            { id: 1, name: 'Cyber Security' },
            { id: 2, name: 'Information Technology' },
            { id: 3, name: 'Computer Science and Engineering' },
            { id: 4, name: 'Electrical & Electronics Engineering' },
            { id: 5, name: 'Electronics & Communication Engineering' },
            { id: 6, name: 'Mechanical Engineering' },
            { id: 7, name: 'Civil Engineering' }
          ];
        }
        setDepartments(loadedDepts);

        // Parse Sections
        if (secsRes.status === 'fulfilled') {
          const raw = Array.isArray(secsRes.value?.data?.data)
            ? secsRes.value.data.data
            : (Array.isArray(secsRes.value?.data) ? secsRes.value.data : []);
          loadedSecs = raw.map((s: any) => ({
            id: s.id,
            name: s.sectionName || s.name || `Section ${s.id}`
          }));
        }
        setSections(loadedSecs);

        if (ccDetailsRes.status === 'fulfilled' && (ccDetailsRes.value?.data?.data || ccDetailsRes.value?.data)) {
          ccData = ccDetailsRes.value.data.data || ccDetailsRes.value.data;
        }

        if (profileRes.status === 'fulfilled' && (profileRes.value?.data?.data || profileRes.value?.data)) {
          userProfile = profileRes.value.data.data || profileRes.value.data;
        }

        // Auto pre-select based on CC class-details or Teacher profile
        let resolvedYearId: number | '' = '';
        let resolvedDeptId: number | '' = '';
        let resolvedSecId: number | '' = '';

        if (ccData) {
          if (ccData.departmentId) resolvedDeptId = Number(ccData.departmentId);
          if (ccData.sectionId) resolvedSecId = Number(ccData.sectionId);
          if (ccData.year || ccData.yearName) {
            const yrTarget = (ccData.yearName || ccData.year || '').toString().toLowerCase();
            const match = loadedYears.find(y => {
              const yStr = y.name.toLowerCase();
              return yStr === yrTarget || yStr.includes(yrTarget) || (yrTarget === '1' && yStr.includes('first'));
            });
            if (match) resolvedYearId = match.id;
          }
        }

        if (userProfile && resolvedDeptId === '') {
          const directDeptId = userProfile.departmentId || userProfile.department?.id;
          const directSecId = userProfile.sectionId || userProfile.section?.id;
          const assignedYearStr = userProfile.year?.toString() || userProfile.academicYear?.toString();
          const assignedDeptStr = userProfile.departmentName || userProfile.department?.name || userProfile.department?.toString();

          if (directDeptId && loadedDepts.some(d => d.id === Number(directDeptId))) {
            resolvedDeptId = Number(directDeptId);
          } else if (assignedDeptStr && loadedDepts.length > 0) {
            const match = loadedDepts.find(d => d.name.toLowerCase().includes(assignedDeptStr.toLowerCase()));
            if (match) resolvedDeptId = match.id;
          }

          if (assignedYearStr && loadedYears.length > 0) {
            const match = loadedYears.find(y => {
              const yStr = y.name.toString().toLowerCase();
              const target = assignedYearStr.toLowerCase();
              return yStr === target || yStr.includes(target) || (target === '1' && yStr.includes('first')) || (target === '2' && yStr.includes('second'));
            });
            if (match) resolvedYearId = match.id;
          }

          if (directSecId) {
            resolvedSecId = Number(directSecId);
          }
        }

        // Fallbacks
        if (resolvedYearId === '' && loadedYears.length > 0) resolvedYearId = loadedYears[0].id;
        if (resolvedDeptId === '' && loadedDepts.length > 0) resolvedDeptId = loadedDepts[0].id;

        setYearId(resolvedYearId);
        setDepartmentId(resolvedDeptId);
        if (resolvedSecId !== '') setSectionId(resolvedSecId);

        if (resolvedDeptId !== '') {
          fetchSectionsForDept(Number(resolvedDeptId));
          const todayDate = new Date().toISOString().split('T')[0];
          fetchNextAvailablePeriod(todayDate, Number(resolvedDeptId), Number(resolvedYearId), Number(resolvedSecId));
          fetchStudentRoster(Number(resolvedYearId), Number(resolvedDeptId), Number(resolvedSecId), todayDate, period);
        }
      } catch (err) {
        logger.warn('Could not load dynamic lookups', err);
      }
    };

    fetchInitialLookups();
  }, []);

  const fetchSectionsForDept = async (deptId: number): Promise<LookupOption[]> => {
    if (!deptId) {
      setSections([]);
      setSectionId('');
      return [];
    }
    try {
      let res;
      try {
        res = await apiClient.get(`/api/v1/admin/sections?departmentId=${deptId}`);
      } catch {
        try {
          res = await apiClient.get(`/api/v1/students/filters/sections?departmentId=${deptId}`);
        } catch {
          res = await apiClient.get(`/api/v1/admin/departments/${deptId}/sections`);
        }
      }
      const fetchedSecs = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      let formatted = fetchedSecs.map((s: any) => ({
        id: s.id,
        name: s.sectionName || s.name || `Section ${s.id}`
      }));

      if (formatted.length === 0) {
        formatted = [
          { id: 1, name: 'Section A' },
          { id: 2, name: 'Section B' },
          { id: 3, name: 'Section C' }
        ];
      }

      setSections(formatted);
      if (formatted.length === 1) {
        setSectionId(formatted[0].id);
      }
      return formatted;
    } catch (e) {
      const fallbackSecs = [
        { id: 1, name: 'Section A' },
        { id: 2, name: 'Section B' },
        { id: 3, name: 'Section C' }
      ];
      setSections(fallbackSecs);
      return fallbackSecs;
    }
  };

  const fetchStudentRoster = async (
    yId: number | '',
    dId: number | '',
    sId: number | '',
    targetDate: string,
    targetPeriod: number
  ) => {
    if (!dId) return;
    setLoading(true);
    setErrorMsg(null);
    setIsHoliday(false);
    setHasSearched(true);
    try {
      let url = `/api/teacher/attendance/students?date=${targetDate}&period=${targetPeriod}&departmentId=${dId}`;
      if (yId !== '') {
        url += `&yearId=${yId}`;
      }
      if (sId !== '' && sId !== null) {
        url += `&sectionId=${sId}`;
      }

      let response = await apiClient.get(url);
      let rawList = response.data?.data || response.data;
      let fetchedStudents = Array.isArray(rawList) ? rawList : [];

      // Fallback: If strict yearId filter returned 0 students, query without yearId
      if (fetchedStudents.length === 0 && yId !== '') {
        let fallbackUrl = `/api/teacher/attendance/students?date=${targetDate}&period=${targetPeriod}&departmentId=${dId}`;
        if (sId !== '' && sId !== null) fallbackUrl += `&sectionId=${sId}`;
        const fallbackRes = await apiClient.get(fallbackUrl);
        const fallbackRaw = fallbackRes.data?.data || fallbackRes.data;
        if (Array.isArray(fallbackRaw) && fallbackRaw.length > 0) {
          fetchedStudents = fallbackRaw;
        }
      }

      if (fetchedStudents.length > 0) {
        const formatted = fetchedStudents.map((s: any) => ({
          studentId: s.studentId || s.id,
          studentName: s.studentName || s.fullName || 'Student',
          registerNumber: s.registerNumber || s.regNo || s.username || '',
          status: (s.status ? String(s.status).toUpperCase() : 'PRESENT') as 'PRESENT' | 'ABSENT',
          remarks: s.remarks || ''
        }));
        setStudents(formatted);
      } else {
        setStudents([]);
        setErrorMsg('No students found matching the selected Year, Department, and Section.');
      }
    } catch (err: any) {
      logger.error('Failed to load students for attendance', err);
      const msg = err?.response?.data?.message || err?.message || '';
      if (msg.includes('Holiday')) {
        setIsHoliday(true);
        setStudents([]);
      } else {
        setStudents([]);
        setErrorMsg(msg || 'Failed to load students list');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDepartmentChange = (newDeptId: number | '') => {
    setDepartmentId(newDeptId);
    setSectionId('');
    if (typeof newDeptId === 'number') {
      fetchSectionsForDept(newDeptId);
      fetchNextAvailablePeriod(date, newDeptId, yearId, '');
    } else {
      setSections([]);
    }
  };

  const handleYearChange = (newYearId: number | '') => {
    setYearId(newYearId);
    if (departmentId) {
      fetchNextAvailablePeriod(date, departmentId, newYearId, sectionId);
    }
  };

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    if (departmentId) {
      fetchNextAvailablePeriod(newDate, departmentId, yearId, sectionId);
    }
  };

  const loadStudents = async () => {
    if (!yearId || !departmentId) {
      toast.error('Please select Year and Department');
      return;
    }
    fetchStudentRoster(yearId, departmentId, sectionId, date, period);
  };

  const markAllPresent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'PRESENT' })));
  };

  const markAllAbsent = () => {
    setStudents(prev => prev.map(s => ({ ...s, status: 'ABSENT' })));
  };

  const setStudentStatus = (studentId: number, status: 'PRESENT' | 'ABSENT') => {
    setStudents(prev =>
      prev.map(s => s.studentId === studentId ? { ...s, status } : s)
    );
  };

  const submitAttendance = async () => {
    if (students.length === 0) return;

    if (!yearId || !departmentId) {
      toast.error('Year and Department are required to save attendance');
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading("Saving attendance...");
    try {
      const parsedYearId = Number(yearId);
      const parsedDeptId = Number(departmentId);
      const parsedSecId = sectionId === '' || sectionId === null ? undefined : Number(sectionId);
      const parsedPeriod = Number(period) || 1;
      const parsedAcadYearId = academicYearId === '' ? parsedYearId : Number(academicYearId);

      const payload = {
        date,
        period: parsedPeriod,
        academicYearId: parsedAcadYearId,
        yearId: parsedYearId,
        departmentId: parsedDeptId,
        sectionId: parsedSecId,
        records: students.map((s) => ({
          studentId: Number(s.studentId),
          status: String(s.status).toUpperCase(),
          remarks: s.remarks && s.remarks.trim() !== '' ? s.remarks.trim() : null,
        })),
      };

      const response = await apiClient.post('/api/teacher/attendance/save', payload);
      toast.dismiss(toastId);
      if (response.data && (response.data.success || response.status === 200)) {
        toast.success('Attendance saved successfully!');
        // Automatically unlock and advance to next available period (matching Flutter)
        fetchNextAvailablePeriod(date, parsedDeptId, parsedYearId, parsedSecId);
      } else {
        toast.error(response.data?.message || 'Failed to save attendance');
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      logger.error('Failed to save attendance', err);
      const errDetail = err?.response?.data?.message || 'Error saving attendance';
      toast.error(errDetail);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="bg-slate-900 md:bg-indigo-600 text-white px-6 py-4 sticky top-0 z-20 shadow-md flex justify-between items-center">
        <h1 className="type-h4 flex items-center gap-2">
          <CalendarCheck className="w-6 h-6" /> Mark Attendance
        </h1>
      </div>

      <div className="p-4 flex flex-col md:flex-row gap-6 h-full overflow-hidden">
        {/* Form Section */}
        <div className="w-full md:w-1/3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-4 overflow-y-auto">
          <div>
            <label className="type-form-label block text-slate-500 uppercase mb-1">Year</label>
            <select
              value={yearId}
              onChange={(e) => handleYearChange(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 type-body-sm focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="">Select Year</option>
              {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
          </div>

          <div>
            <label className="type-form-label block text-slate-500 uppercase mb-1">Department</label>
            <select
              value={departmentId}
              onChange={(e) => handleDepartmentChange(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 type-body-sm focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div>
            <label className="type-form-label block text-slate-500 uppercase mb-1">Section (Optional)</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value === '' ? '' : Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 type-body-sm focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="">Any Section</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div>
            <label className="type-form-label block text-slate-500 uppercase mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 type-body-sm focus:outline-none focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="type-form-label block text-slate-500 uppercase mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(Number(e.target.value))}
              className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2.5 type-body-sm focus:outline-none focus:border-indigo-500 font-medium"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                <option key={p} value={p}>Period {p}</option>
              ))}
            </select>
          </div>

          <button
            onClick={loadStudents}
            disabled={loading}
            className="w-full mt-4 type-btn bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-lg font-bold shadow-md transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : null}
            {loading ? 'Loading...' : 'Load Students'}
          </button>
        </div>

        {/* Student List Section */}
        <div className="w-full md:w-2/3 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
          {loading ? (
            <div className="flex-1 space-y-3 overflow-y-auto pr-2">
              <div className="flex justify-between items-center mb-4">
                <div className="h-6 w-32 bg-slate-200 rounded animate-pulse"></div>
                <div className="h-4 w-48 bg-slate-200 rounded animate-pulse"></div>
              </div>
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 animate-pulse">
                  <div className="space-y-2">
                    <div className="h-4 w-36 bg-slate-200 rounded"></div>
                    <div className="h-3 w-24 bg-slate-200 rounded"></div>
                  </div>
                  <div className="h-7 w-20 bg-slate-200 rounded-full"></div>
                </div>
              ))}
            </div>
          ) : isHoliday ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-rose-50/50 rounded-xl border border-rose-200">
              <CalendarX className="w-16 h-16 text-rose-500 mb-4" />
              <h3 className="type-h5 text-rose-800 mb-2">Holiday Configured</h3>
              <p className="type-body-sm font-semibold text-rose-600 max-w-md">
                Attendance cannot be marked. Today is configured as a Holiday in the academic calendar.
              </p>
            </div>
          ) : !hasSearched ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <UsersRound className="w-16 h-16 mb-4 opacity-30" />
              <p className="type-body-sm font-medium">Select filters and click "Load Students"</p>
            </div>
          ) : students.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500">
              <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
              <h3 className="type-h5 text-slate-800 mb-1">No Students Found</h3>
              <p className="type-body-sm text-slate-500 max-w-sm">
                {errorMsg || 'No students were found in the database matching your selected Year, Department, and Section.'}
              </p>
              <button
                onClick={loadStudents}
                className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold type-btn rounded-lg hover:bg-indigo-100 transition cursor-pointer"
              >
                Try Again
              </button>
            </div>
          ) : (
            (() => {
              const presentCount = students.filter((s) => s.status === 'PRESENT').length;
              const absentCount = students.filter((s) => s.status === 'ABSENT').length;

              const visibleStudents = students.filter((s) => {
                if (statusFilter === 'present' && s.status !== 'PRESENT') return false;
                if (statusFilter === 'absent' && s.status !== 'ABSENT') return false;
                if (searchFilter.trim()) {
                  const q = searchFilter.toLowerCase().trim();
                  const name = (s.studentName || '').toLowerCase();
                  const reg = (s.registerNumber || '').toLowerCase();
                  return name.includes(q) || reg.includes(q);
                }
                return true;
              });

              return (
                <>
                  {/* Attendance Performance Summary Tiles */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="bg-bg p-3 rounded-xl border border-border flex flex-col items-center">
                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Attendance Rate</span>
                      <div className="text-xl font-black text-text-primary">{attendanceRate}%</div>
                    </div>
                    <div className="bg-bg p-3 rounded-xl border border-border flex flex-col items-center">
                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Present Count</span>
                      <div className="text-xl font-black text-emerald-800">{presentCount}</div>
                    </div>
                    <div className="bg-bg p-3 rounded-xl border border-border flex flex-col items-center">
                      <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Absent Count</span>
                      <div className="text-xl font-black text-text-secondary">{absentCount}</div>
                    </div>
                  </div>

                  {/* Top Stats & Title */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <h2 className="type-h5 text-slate-800">Student List</h2>
                    <div className="type-caption text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                      Total: <span className="text-slate-800 font-bold">{students.length}</span> • Present: <span className="text-emerald-700 font-bold">{presentCount}</span> • Absent: <span className="text-rose-700 font-bold">{absentCount}</span>
                    </div>
                  </div>

                  {/* Status Tabs and Search Input */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-3">
                    {/* Search */}
                    <div className="relative w-full sm:w-60">
                      <input
                        type="text"
                        value={searchFilter}
                        onChange={(e) => setSearchFilter(e.target.value)}
                        placeholder="Search student or reg no..."
                        className="w-full pl-3 pr-8 py-1.5 type-body-sm bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 font-medium"
                      />
                      {searchFilter && (
                        <button
                          type="button"
                          onClick={() => setSearchFilter('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex bg-slate-100 p-1 rounded-xl type-caption font-bold w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setStatusFilter('all')}
                        className={`flex-1 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          statusFilter === 'all'
                            ? 'bg-white text-slate-900 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        All ({students.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('present')}
                        className={`flex-1 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          statusFilter === 'present'
                            ? 'bg-white text-emerald-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Present ({presentCount})
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatusFilter('absent')}
                        className={`flex-1 sm:px-3 py-1 rounded-lg transition-all cursor-pointer ${
                          statusFilter === 'absent'
                            ? 'bg-white text-rose-700 shadow-xs'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        Absent ({absentCount})
                      </button>
                    </div>
                  </div>

                  {/* Quick Mark All Action Links - Matching Flutter 1:1 */}
                  <div className="flex items-center justify-between type-caption text-rose-500 mb-3 px-1">
                    <div className="flex items-center gap-4">
                      <button 
                        type="button" 
                        onClick={markAllPresent} 
                        className="hover:underline cursor-pointer transition-colors"
                      >
                        Mark All Present
                      </button>
                      <button 
                        type="button" 
                        onClick={markAllAbsent} 
                        className="hover:underline cursor-pointer transition-colors"
                      >
                        Mark All Absent
                      </button>
                    </div>
                    <span className="text-slate-400 font-normal">
                      Showing {visibleStudents.length} of {students.length}
                    </span>
                  </div>

                  {/* Student List Scrollable */}
                  <div className="flex-1 overflow-y-auto pr-2 space-y-2.5">
                    {visibleStudents.length === 0 ? (
                      <div className="py-12 text-center text-slate-400 type-caption">
                        No students match the selected filter.
                      </div>
                    ) : (
                      visibleStudents.map((student) => (
                        <div key={student.studentId} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200 shadow-xs">
                          <div>
                            <div className="font-bold text-slate-800 type-body-sm">{student.studentName}</div>
                            <div className="type-caption text-slate-500 mt-0.5 font-mono">{student.registerNumber}</div>
                          </div>

                          {/* Segmented [ P | A ] Control - Matching Flutter 1:1 */}
                          <div className="inline-flex rounded-full border border-slate-200 p-1 bg-white shadow-inner">
                            <button
                              type="button"
                              onClick={() => setStudentStatus(student.studentId, 'PRESENT')}
                              className={`flex items-center gap-1 px-4 py-1.5 rounded-full type-caption font-bold transition-all cursor-pointer ${
                                student.status === 'PRESENT'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {student.status === 'PRESENT' && <Check className="w-3.5 h-3.5" />}
                              <span>P</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setStudentStatus(student.studentId, 'ABSENT')}
                              className={`flex items-center gap-1 px-4 py-1.5 rounded-full type-caption font-bold transition-all cursor-pointer ${
                                student.status === 'ABSENT'
                                  ? 'bg-rose-500 text-white shadow-xs'
                                  : 'text-slate-500 hover:text-slate-800'
                              }`}
                            >
                              {student.status === 'ABSENT' && <Check className="w-3.5 h-3.5" />}
                              <span>A</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Purple Pill Save Attendance Button - Matching Flutter 1:1 */}
                  <div className="pt-4 mt-4 border-t border-slate-200 flex justify-center">
                    <button
                      onClick={submitAttendance}
                      disabled={submitting}
                      className="type-btn bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-full font-bold shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                    >
                      <Save className="w-5 h-5" />
                      <span>{submitting ? 'Saving...' : 'Save Attendance'}</span>
                    </button>
                  </div>
                </>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
