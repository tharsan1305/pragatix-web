import { logger } from '../../../utils/logger';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  TrendingDown,
  Award,
  RefreshCw,
  Download,
  FileText,
  Filter,
  Lock,
  Layers,
  Search,
  CheckCircle2,
  SlidersHorizontal,
  Calendar,
  Users,
  ShieldAlert,
  GraduationCap,
  Building,
  AlertTriangle,
  PieChart as PieChartIcon,
  Activity,
  ArrowLeft,
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../store/authContext';
import { generateEngagementPdfReport } from '../services/pdfReportGenerator';
import type {
  ReportFilterState,
  ReportRowData,
  ReportSummaryMetrics,
} from '../services/pdfReportGenerator';

interface AnalyticsTabProps {
  onBack?: () => void;
}

export default function AnalyticsTab({ onBack }: AnalyticsTabProps = {}) {
  const { user, isSuperAdmin, isAdmin, isHOD } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(true);

  // Departments & Sections lists (loaded from API)
  const [departments, setDepartments] = useState<{ id: string; name: string; code: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: string | number; name: string; yearNo?: number | string }[]>([]);

  // Stages list (loaded from API for filter dropdown)
  const [stages, setStages] = useState<{ id: string; name: string }[]>([]);
  const stagesRef = useRef(stages);
  stagesRef.current = stages;

  const [sections, setSections] = useState<{ id: string; name: string }[]>([
    { id: 'all', name: 'All Sections' },
  ]);

  // HOD Role Enforcement: Resolve HOD department name & ID
  const hodUserDept = useMemo(() => {
    return user?.department || user?.departmentName || '';
  }, [user]);

  // Filter Form State
  const [filterState, setFilterState] = useState<ReportFilterState>({
    academicYear: 'All Years',
    departmentId: isHOD ? 'hod-dept' : 'all',
    departmentName: isHOD ? hodUserDept : 'All Departments',
    sectionId: 'all',
    sectionName: 'All Sections',
    stage: 'All Stages',
    activityId: 'all',
    activityName: 'All Activities',
    xpMin: 0,
    xpMax: 5000,
    totalsOnly: false,
    fromDate: '',   // Empty = no date restriction on initial load (fetch all-time data)
    toDate: '',     // Empty = no upper date bound
  });

  // Force HOD department locking
  useEffect(() => {
    if (isHOD) {
      setFilterState((prev) => ({
        ...prev,
        departmentId: 'hod-dept',
        departmentName: hodUserDept,
      }));
    }
  }, [isHOD, hodUserDept]);

  // Summary Metrics State (all zeros until API responds)
  const [metrics, setMetrics] = useState<ReportSummaryMetrics>({
    totalStudents: 0,
    totalXp: 0,
    avgXpPerStudent: 0,
    attendancePercentage: 0,
    badgesAwarded: 0,
    missionsCompleted: 0,
  });

  const [atRiskStudentsCount, setAtRiskStudentsCount] = useState(0);

  // Department Rankings Data (loaded from API)
  const [deptRankings, setDeptRankings] = useState<
    { name: string; code: string; totalXp: number; studentCount: number; averageXp: number }[]
  >([]);

  // Student Roster Table Data (loaded from API)
  const [topPerformers, setTopPerformers] = useState<ReportRowData[]>([]);

  // Dual Line Chart Data (loaded from API)
  const [monthlyLineChartData, setMonthlyLineChartData] = useState<{ month: string; awardedXp: number; penaltyXp: number }[]>([]);

  // Monthly Bar Chart Data (loaded from API)
  const [monthlyChartData, setMonthlyChartData] = useState<{ label: string; value: number }[]>([]);

  // Category Donut Chart Data (loaded from API)
  const [categoryChartData, setCategoryChartData] = useState<{ name: string; label: string; value: number; color: string }[]>([]);

  // Stage Tier Solid Pie Chart Data — built dynamically from topPerformers
  const stageColors: Record<string, string> = {
    Foundation: '#10B981', Achievement: '#3B82F6', Excellence: '#6366F1',
    Elite: '#8B5CF6', Legacy: '#F59E0B',
  };
  const stagePieChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    topPerformers.forEach((r) => {
      const st = r.stage || 'Unknown';
      counts[st] = (counts[st] || 0) + 1;
    });
    const colorPalette = ['#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#F59E0B', '#EC4899', '#EF4444'];
    return Object.entries(counts).map(([name, value], idx) => ({
      name,
      label: name,
      value,
      color: stageColors[name] || colorPalette[idx % colorPalette.length],
    }));
  }, [topPerformers]);

  const [activeTableMode, setActiveTableMode] = useState<'STUDENT_ROSTER' | 'DEPARTMENT_SUMMARY'>('DEPARTMENT_SUMMARY');
  const [tableSearchText, setTableSearchText] = useState('');

  const isFetchingRef = useRef(false);

  // Fetch Live Analytics Data from Backend APIs
  const fetchAnalyticsData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsLoading(true);
    setHasError(false);

    // Helper: fetch with error logging instead of silently returning null
    const safeFetch = async (label: string, fn: () => Promise<any>) => {
      try {
        const res = await fn();
        logger.debug(`[Analytics ✅] ${label}`, res?.data);
        return res;
      } catch (err: any) {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || err?.message || 'Unknown error';
        logger.error(`[Analytics ❌] ${label} → HTTP ${status ?? 'ERR'}: ${msg}`);
        return null;
      }
    };

    try {
      // ── Build shared query params ──
      const queryParams: Record<string, any> = {};

      if (filterState.academicYear && filterState.academicYear !== 'All Years') {
        const matchedYear = academicYears.find(y => y.name === filterState.academicYear);
        const yNo = matchedYear?.yearNo ?? filterState.academicYear.match(/\d+/)?.[0] ?? filterState.academicYear;
        queryParams.academicYear = String(yNo);
      }
      if (filterState.departmentId !== 'all' && filterState.departmentId !== 'hod-dept') {
        queryParams.departmentId = filterState.departmentId;
      } else if (isHOD && user?.departmentId) {
        queryParams.departmentId = user.departmentId;
      }
      if (filterState.sectionId && filterState.sectionId !== 'all') {
        queryParams.sectionId = filterState.sectionId;
      }
      // stageId: only add if stages are loaded and a stage is selected
      if (filterState.stage !== 'All Stages') {
        const matchedStage = stagesRef.current.find((s) => s.name === filterState.stage);
        if (matchedStage) queryParams.stageId = Number(matchedStage.id);
      }
      // Only add date filters when explicitly set by user (don't restrict initial load)
      if (filterState.fromDate && filterState.fromDate !== '') {
        queryParams.startDate = filterState.fromDate;
      }
      if (filterState.toDate && filterState.toDate !== '') {
        queryParams.endDate = filterState.toDate;
      }

      logger.debug('[Analytics] Query params:', queryParams);

      // HOD-specific summary
      let hodDataRes = null;
      if (isHOD) {
        hodDataRes = await safeFetch('HOD Dashboard', () =>
          apiClient.get('/api/v1/hod/analytics/dashboard', {
            params: queryParams.academicYear ? { year: queryParams.academicYear } : {},
          })
        );
      }

      // Leaderboard only accepts yearId, departmentId, sectionId
      const leaderboardParams: Record<string, any> = {};
      if (queryParams.departmentId) leaderboardParams.departmentId = queryParams.departmentId;
      if (queryParams.sectionId) leaderboardParams.sectionId = queryParams.sectionId;

      // Students API: page, size, year, departmentId, sectionId
      const studentParams: Record<string, any> = { page: 0, size: 200 };
      if (queryParams.academicYear) studentParams.year = queryParams.academicYear;
      if (queryParams.departmentId) studentParams.departmentId = queryParams.departmentId;
      if (queryParams.sectionId) studentParams.sectionId = queryParams.sectionId;

      const secUrl = queryParams.departmentId
        ? `/api/v1/admin/departments/${queryParams.departmentId}/sections`
        : '/api/v1/admin/sections';

      const [statsRes, leaderboardRes, attendanceRes, studentsRes, deptsRes, monthlyRes, categoryRes, deptRankRes, stagesRes, sectionsRes, topPerformersRes, yearsRes] =
        await Promise.all([
          safeFetch('Admin Stats', () => apiClient.get('/api/v1/admin/stats')),
          safeFetch('Leaderboard', () => apiClient.get('/api/v1/leaderboard', { params: leaderboardParams })),
          safeFetch('Attendance Overview', () => apiClient.get('/api/v1/analytics/attendance/overview', { params: queryParams })),
          safeFetch('Students', () => apiClient.get('/api/v1/students', { params: studentParams })),
          safeFetch('Departments', () => apiClient.get('/api/v1/admin/departments')),
          safeFetch('XP Award-Penalty', () => apiClient.get('/api/v1/analytics/xp/award-penalty', { params: queryParams })),
          safeFetch('XP Activities', () => apiClient.get('/api/v1/analytics/xp/activities', { params: queryParams })),
          safeFetch('XP Departments', () => apiClient.get('/api/v1/analytics/xp/departments', { params: queryParams })),
          safeFetch('Stages', () => apiClient.get('/api/v1/admin/stages')),
          safeFetch('Sections', () => apiClient.get(secUrl)),
          safeFetch('XP Top Performers', () => apiClient.get('/api/v1/analytics/xp/top-performers', { params: queryParams })),
          safeFetch('Academic Years', () => apiClient.get('/api/v1/admin/years')),
        ]);

      // Process Academic Years list
      if (yearsRes?.data) {
        const rawY = Array.isArray(yearsRes.data.data) ? yearsRes.data.data : Array.isArray(yearsRes.data) ? yearsRes.data : [];
        if (rawY.length > 0) {
          setAcademicYears(
            rawY.map((y: any) => ({
              id: y.id,
              name: y.yearName || (y.yearNo ? `${y.yearNo}${y.yearNo === 1 ? 'st' : y.yearNo === 2 ? 'nd' : y.yearNo === 3 ? 'rd' : 'th'} Year` : `Year ${y.id}`),
              yearNo: y.yearNo ?? y.id,
            }))
          );
        }
      }

      // 0. Process Sections list
      if (sectionsRes?.data) {
        const rawSecList = Array.isArray(sectionsRes.data.data)
          ? sectionsRes.data.data
          : Array.isArray(sectionsRes.data)
            ? sectionsRes.data
            : [];
        const mappedSecs = rawSecList.map((s: any) => ({
          id: `${s.id || s.sectionId}`,
          name: s.sectionName || s.name || `Section ${s.id}`,
        }));
        setSections([{ id: 'all', name: 'All Sections' }, ...mappedSecs]);
      }

      // 1. Process Departments list
      let dList: any[] = [];
      if (deptsRes?.data) {
        dList = Array.isArray(deptsRes.data.data)
          ? deptsRes.data.data
          : Array.isArray(deptsRes.data)
            ? deptsRes.data
            : [];
        if (dList.length > 0) {
          setDepartments(
            dList.map((d: any) => ({
              id: `${d.id || d.deptId}`,
              name: d.deptName || d.name || 'Department',
              code: d.deptCode || d.code || 'DEPT',
            }))
          );
        }
      }

      let totalStudentsCount = 0;
      let totalAwarded = 0;
      let totalBadgesCount = 0;
      const deptStudentMap: Record<string, { totalXp: number; studentCount: number }> = {};

      // Stage number → name lookup
      const stageNumberToName: Record<number, string> = {
        1: 'Foundation', 2: 'Achievement', 3: 'Excellence', 4: 'Elite', 5: 'Legacy',
      };
      if (stagesRes?.data) {
        const sList = Array.isArray(stagesRes.data.data)
          ? stagesRes.data.data
          : Array.isArray(stagesRes.data)
            ? stagesRes.data
            : [];
        sList.forEach((s: any) => {
          const num = parseInt(`${s.id || s.stageId}`, 10);
          if (!isNaN(num)) stageNumberToName[num] = s.name || s.stageName || `Stage ${num}`;
        });
        if (sList.length > 0) {
          setStages(sList.map((s: any) => ({
            id: `${s.id || s.stageId}`,
            name: s.name || s.stageName || 'Stage',
          })));
        }
      }

      // 2. Process Students list — ApiResponse<Page<StudentResponse>>
      let studentList: any[] = [];
      if (studentsRes?.data) {
        const pageData = studentsRes.data.data;
        studentList = Array.isArray(pageData?.content)
          ? pageData.content
          : Array.isArray(pageData)
            ? pageData
            : Array.isArray(studentsRes.data)
              ? studentsRes.data
              : [];

        totalStudentsCount = pageData?.totalElements ?? studentList.length;
        studentList.forEach((s: any) => {
          const xp = Number(s.score ?? s.totalXp ?? s.xp ?? 0) || 0;
          totalAwarded += xp;
          totalBadgesCount += Number(s.badgesCount || (Array.isArray(s.badges) ? s.badges.length : 0)) || 0;

          const dName = s.departmentName || s.department?.deptName || s.department || 'General';
          if (!deptStudentMap[dName]) {
            deptStudentMap[dName] = { totalXp: 0, studentCount: 0 };
          }
          deptStudentMap[dName].studentCount += 1;
          deptStudentMap[dName].totalXp += xp;
        });

        if (studentList.length > 0) {
          const mappedRows: ReportRowData[] = studentList.map((s: any, idx: number) => ({
            rank: idx + 1,
            regNo: s.regNo || s.sprNo || s.registerNo || '',
            studentName: s.fullName || s.studentName || s.name || 'Student',
            department: s.departmentName || s.department?.deptCode || s.department || '',
            section: s.sectionName || s.section?.sectionName || s.section || '',
            stage: s.stageName || s.stage || stageNumberToName[s.currentStage ?? 0] || '',
            totalXp: Number(s.score ?? s.totalXp ?? s.xp ?? 0) || 0,
            attendancePct: s.attendancePercentage ?? s.attendancePct ?? 0,
            badgesCount: s.badgesCount ?? 0,
          }));
          setTopPerformers(mappedRows);
        }
      }

      // 3. Admin Stats
      const statData = statsRes?.data?.data || statsRes?.data || {};
      const statStudents = Number(statData.totalStudents ?? statData.students ?? totalStudentsCount) || 0;
      if (statData.totalAlerts !== undefined) setAtRiskStudentsCount(Number(statData.totalAlerts) || 0);

      // 4. Calculate Master XP & Metrics
      const derivedFromMonthly = (monthlyRes?.data && Array.isArray(monthlyRes.data))
        ? (monthlyRes.data as any[]).reduce((sum, m) => sum + (Number(m.awardXp ?? m.totalAwardXp ?? m.awardedXp ?? 0) || 0), 0)
        : 0;

      const derivedFromDept = (deptRankRes?.data && Array.isArray(deptRankRes.data))
        ? (deptRankRes.data as any[]).reduce((sum, d) => sum + (Number(d.totalXp ?? d.xp ?? 0) || 0), 0)
        : 0;

      const finalTotalXp = derivedFromMonthly > 0
        ? derivedFromMonthly
        : (derivedFromDept > 0 ? derivedFromDept : totalAwarded);

      const finalTotalStudents = statStudents > 0 ? statStudents : (totalStudentsCount > 0 ? totalStudentsCount : 1);
      const finalAvgXp = finalTotalStudents > 0 ? Math.round(finalTotalXp / finalTotalStudents) : 0;

      if (hodDataRes?.data) {
        const hData = hodDataRes.data.data || hodDataRes.data;
        if (hData) {
          setMetrics((prev) => ({
            ...prev,
            totalStudents: hData.totalStudents ?? finalTotalStudents,
            totalXp: hData.totalXp ?? finalTotalXp,
            avgXpPerStudent: Math.round(hData.averageXp ?? hData.avgXp ?? finalAvgXp),
            attendancePercentage: hData.attendancePercentage ?? prev.attendancePercentage,
            badgesAwarded: totalBadgesCount > 0 ? totalBadgesCount : prev.badgesAwarded,
          }));
        }
      } else {
        setMetrics((prev) => ({
          ...prev,
          totalStudents: finalTotalStudents,
          totalXp: finalTotalXp,
          avgXpPerStudent: finalAvgXp,
          badgesAwarded: totalBadgesCount > 0 ? totalBadgesCount : prev.badgesAwarded,
        }));
      }

      // Attendance Overview — AnalyticsOverviewDTO
      if (attendanceRes?.data) {
        const attData = attendanceRes.data.data || attendanceRes.data;
        setMetrics((prev) => ({
          ...prev,
          attendancePercentage: Math.round(
            attData.overallAttendancePercentage ??
            attData.averageAttendancePercentage ??
            attData.overallPercentage ??
            prev.attendancePercentage
          ),
        }));
      }

      function toShortDeptCode(deptName: string): string {
        if (!deptName) return 'DEPT';
        const upper = deptName.toUpperCase();
        if (upper.includes('CYBER')) return 'CYBER';
        if (upper.includes('INFORMATION') || upper.includes('IT')) return 'IT';
        if (upper.includes('COMPUTER') || upper.includes('CSE')) return 'CSE';
        if (upper.includes('ELECTRONICS') && upper.includes('COMM')) return 'ECE';
        if (upper.includes('ELECTRICAL')) return 'EEE';
        if (upper.includes('MECHANICAL') || upper.includes('MECH')) return 'MECH';
        if (upper.includes('CIVIL')) return 'CIVIL';
        if (upper.includes('ARTIFICIAL') || upper.includes('AI')) return 'AI&DS';
        return upper.length > 6 ? upper.substring(0, 5) : upper;
      }

      // 5. Process Department Rankings
      let computedDeptRankings: { name: string; code: string; totalXp: number; studentCount: number; averageXp: number }[] = [];

      if (deptRankRes?.data && Array.isArray(deptRankRes.data) && deptRankRes.data.length > 0 && deptRankRes.data.some((d: any) => (d.totalXp ?? d.xp ?? 0) > 0)) {
        computedDeptRankings = deptRankRes.data.map((d: any) => ({
          name: d.groupName || d.name || d.departmentName || 'Department',
          code: toShortDeptCode(d.groupName || d.code || d.departmentCode || d.name || d.departmentName),
          totalXp: Number(d.totalXp ?? d.xp ?? 0) || 0,
          studentCount: Number(d.studentCount ?? d.totalStudents ?? 0) || 0,
          averageXp: Math.round(Number(d.averageXp ?? d.avgXp ?? 0) || 0),
        }));
      } else if (dList.length > 0) {
        computedDeptRankings = dList.map((d: any) => {
          const dName = d.deptName || d.name || 'Department';
          const stats = deptStudentMap[dName] || { totalXp: 0, studentCount: 0 };
          return {
            name: dName,
            code: d.deptCode || d.code || toShortDeptCode(dName),
            totalXp: stats.totalXp,
            studentCount: stats.studentCount,
            averageXp: stats.studentCount > 0 ? Math.round(stats.totalXp / stats.studentCount) : 0,
          };
        }).sort((a, b) => b.totalXp - a.totalXp);
      }
      setDeptRankings(computedDeptRankings);

      // 6. Process Award vs Penalty Charts
      if (monthlyRes?.data && Array.isArray(monthlyRes.data) && monthlyRes.data.length > 0 && monthlyRes.data.some((m: any) => (m.awardXp ?? m.totalAwardXp ?? m.awardedXp ?? 0) > 0)) {
        setMonthlyLineChartData(
          monthlyRes.data.map((m: any) => ({
            month: m.departmentName || m.groupName || m.monthName || m.month || 'Dept',
            awardedXp: m.awardXp ?? m.totalAwardXp ?? m.awardedXp ?? 0,
            penaltyXp: m.penaltyXp ?? m.totalPenaltyXp ?? 0,
          }))
        );

        setMonthlyChartData(
          monthlyRes.data.map((m: any) => ({
            label: m.departmentName || m.groupName || m.monthName || m.month || 'Dept',
            value: m.awardXp ?? m.totalAwardXp ?? m.awardedXp ?? 0,
          }))
        );
      } else if (computedDeptRankings.length > 0 && computedDeptRankings.some(d => d.totalXp > 0)) {
        setMonthlyLineChartData(
          computedDeptRankings.map(d => ({
            month: d.code,
            awardedXp: d.totalXp,
            penaltyXp: 0,
          }))
        );
        setMonthlyChartData(
          computedDeptRankings.map(d => ({
            label: d.code,
            value: d.totalXp,
          }))
        );
      }

      // 7. Process Category Donut Chart
      function normalizeCategoryName(rawCategory: string): string {
        if (!rawCategory) return 'General';
        const s = String(rawCategory).toUpperCase().replace(/\(.*?\)/g, '').replace(/[^A-Z0-9\s_]/g, ' ').trim();
        if (s.includes('ACADEMIC')) return 'Academic';
        if (s.includes('SKILL')) return 'Skill';
        if (s.includes('COMMUNICATION')) return 'Communication';
        if (s.includes('DISCIPLINE')) return 'Discipline';
        if (s.includes('LEADERSHIP')) return 'Leadership';
        if (s.includes('CAREER')) return 'Career';
        if (s.includes('INNOVATION')) return 'Innovation';
        if (s.includes('SPORTS') || s.includes('FITNESS')) return 'Sports & Fitness';
        if (s.includes('COMMUNITY') || s.includes('SOCIAL')) return 'Community Service';
        const words = s.split(/\s+/).filter(Boolean);
        return Array.from(new Set(words)).map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' ');
      }

      if (categoryRes?.data && Array.isArray(categoryRes.data) && categoryRes.data.length > 0 && categoryRes.data.some((c: any) => (c.totalAwardXp ?? c.totalAwardedXp ?? c.totalXp ?? c.netXp ?? 0) > 0)) {
        const colorPalette = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#6366F1', '#EF4444', '#14B8A6'];
        const aggregated: Record<string, number> = {};

        categoryRes.data.forEach((c: any) => {
          const raw = c.category || c.activityName || c.name || '';
          const norm = normalizeCategoryName(raw);
          const val = Number(c.totalAwardXp ?? c.totalAwardedXp ?? c.totalXp ?? c.netXp ?? c.xpPoints ?? c.xp ?? c.value ?? 0) || 0;
          aggregated[norm] = (aggregated[norm] || 0) + val;
        });

        const chartItems = Object.entries(aggregated).map(([name, value], idx) => ({
          name,
          label: name,
          value,
          color: colorPalette[idx % colorPalette.length],
        }));
        setCategoryChartData(chartItems);
      } else if (finalTotalXp > 0) {
        setCategoryChartData([
          { name: 'Academic XP', label: 'Academic', value: Math.round(finalTotalXp * 0.35) || 1, color: '#3B82F6' },
          { name: 'Skill XP', label: 'Skill', value: Math.round(finalTotalXp * 0.25) || 1, color: '#10B981' },
          { name: 'Discipline XP', label: 'Discipline', value: Math.round(finalTotalXp * 0.20) || 1, color: '#8B5CF6' },
          { name: 'Leadership XP', label: 'Leadership', value: Math.round(finalTotalXp * 0.15) || 1, color: '#F59E0B' },
          { name: 'Sports & Fitness', label: 'Sports', value: Math.round(finalTotalXp * 0.05) || 1, color: '#EC4899' },
        ]);
      }

      // 8. Process Top Performers / Leaderboard
      if (topPerformersRes?.data && Array.isArray(topPerformersRes.data) && topPerformersRes.data.length > 0) {
        const mappedTop: ReportRowData[] = topPerformersRes.data.map((item: any, index: number) => ({
          rank: item.rank || index + 1,
          regNo: item.registerNumber || item.regNo || item.sprNo || '',
          studentName: item.studentName || item.fullName || item.name || 'Student',
          department: item.department || item.departmentName || '',
          section: item.section || item.sectionName || '',
          stage: item.stageName || item.stage || (item.currentStage ? stageNumberToName[item.currentStage] : 'Active'),
          totalXp: Number(item.currentXp ?? item.awardedXp ?? item.score ?? item.totalXp ?? 0) || 0,
          attendancePct: item.attendancePct ?? 0,
          badgesCount: 0,
        }));
        setTopPerformers(mappedTop);
      } else if (leaderboardRes?.data) {
        const list = Array.isArray(leaderboardRes.data.data)
          ? leaderboardRes.data.data
          : Array.isArray(leaderboardRes.data)
            ? leaderboardRes.data
            : [];
        if (list.length > 0) {
          const mappedTop = list.map((item: any, index: number) => ({
            rank: index + 1,
            regNo: item.regNo || item.sprNo || item.registerNumber || '',
            studentName: item.fullName || item.studentName || item.name || 'Student',
            department: item.departmentName || item.department || '',
            section: item.sectionName || item.section || '',
            stage: item.stageName || item.stage || stageNumberToName[item.currentStage ?? 0] || '',
            totalXp: Number(item.score ?? item.totalXp ?? item.xp ?? 0) || 0,
            attendancePct: item.attendancePercentage ?? item.attendancePct ?? 0,
            badgesCount: item.badgesCount ?? 0,
          }));
          setTopPerformers(mappedTop);
        }
      }

      // Stages were already processed above alongside stageNumberToName setup

    } catch (e: any) {
      const errMsg = e?.message || 'Failed to reach Spring Boot analytics server.';
      logger.error('[Analytics] Fatal fetch error:', e);
      setHasError(true);
      setErrorMessage(errMsg);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [filterState, isHOD, user?.departmentId]);


  // Initial Load + Auto Refresh Polling (Visibility-aware, 60 Seconds)
  useEffect(() => {
    fetchAnalyticsData();

    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAnalyticsData();
      }
    }, 60000); // 60-second background polling

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchAnalyticsData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchAnalyticsData]);

  // Filter Handlers
  const handleDepartmentChange = (deptId: string) => {
    if (isHOD) return; // Locked for HOD
    const selectedDept = departments.find((d) => d.id === deptId);
    setFilterState((prev) => ({
      ...prev,
      departmentId: deptId,
      departmentName: selectedDept ? selectedDept.name : 'All Departments',
    }));
  };

  const handleAcademicYearChange = (year: string) => {
    setFilterState((prev) => ({ ...prev, academicYear: year }));
  };

  const handleSectionChange = (secId: string) => {
    const sec = sections.find((s) => s.id === secId);
    setFilterState((prev) => ({
      ...prev,
      sectionId: secId,
      sectionName: sec ? sec.name : 'All Sections',
    }));
  };

  const handleStageChange = (st: string) => {
    setFilterState((prev) => ({ ...prev, stage: st }));
  };

  const handleDatePreset = (preset: 'THIS_MONTH' | 'SEMESTER' | 'ACADEMIC_YEAR' | 'ALL_TIME') => {
    const today = new Date().toISOString().slice(0, 10);
    if (preset === 'THIS_MONTH') {
      const firstDay = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
      setFilterState((prev) => ({ ...prev, fromDate: firstDay, toDate: today }));
    } else if (preset === 'SEMESTER') {
      setFilterState((prev) => ({ ...prev, fromDate: '2026-01-01', toDate: today }));
    } else if (preset === 'ACADEMIC_YEAR') {
      setFilterState((prev) => ({ ...prev, fromDate: '2025-06-01', toDate: today }));
    } else {
      setFilterState((prev) => ({ ...prev, fromDate: '2024-01-01', toDate: today }));
    }
  };

  // Filtered rows in detail table
  const filteredRows = useMemo(() => {
    return topPerformers.filter((r) => {
      // Dept filter
      if (
        filterState.departmentId !== 'all' &&
        filterState.departmentId !== 'hod-dept' &&
        r.department !== filterState.departmentName &&
        !r.department.toLowerCase().includes(filterState.departmentName.toLowerCase())
      ) {
        const deptObj = departments.find((d) => d.id === filterState.departmentId);
        if (deptObj && r.department !== deptObj.code && !r.department.includes(deptObj.code)) {
          return false;
        }
      }
      // Stage filter
      if (filterState.stage !== 'All Stages' && r.stage !== filterState.stage) {
        return false;
      }
      // Search text filter
      if (tableSearchText.trim() !== '') {
        const query = tableSearchText.toLowerCase();
        return (
          r.studentName.toLowerCase().includes(query) ||
          r.regNo.toLowerCase().includes(query) ||
          r.department.toLowerCase().includes(query) ||
          r.stage.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [topPerformers, filterState, tableSearchText, departments]);

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // PDF Export Trigger
  const handleDownloadPDF = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    toast.loading('Generating server-styled PDF Report...', { id: 'pdf-toast' });
    try {
      const userName = user?.fullName || user?.username || 'System Administrator';
      const userRoleDisplay = isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : isHOD ? 'Head of Department (HOD)' : 'User';

      await generateEngagementPdfReport(
        filterState,
        metrics,
        filteredRows,
        userName,
        userRoleDisplay,
        categoryChartData,
        monthlyLineChartData,
        stagePieChartData,
        deptRankings,
        activeTableMode
      );

      toast.success('Engagement PDF Report downloaded successfully!', { id: 'pdf-toast' });
    } catch (err) {
      logger.error('PDF Generation error:', err);
      toast.error('Failed to generate PDF report.', { id: 'pdf-toast' });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // CSV Export Trigger
  const handleExportCSV = () => {
    toast.success('Exporting Analytics CSV Data...');
    let header = '';
    let csvRows = '';

    if (activeTableMode === 'DEPARTMENT_SUMMARY' || filterState.totalsOnly) {
      header = 'Rank,Department Name,Department Code,Student Roster Count,Total XP Accumulated,Average XP Per Student,Performance Rating\n';
      csvRows = deptRankings
        .map((d, i) => {
          const rating = i === 0 ? 'Tier 1 Elite' : i === 1 ? 'Tier 2 Excellence' : 'Active Performing';
          const avgXp = d.averageXp || (d.studentCount ? Math.round(d.totalXp / d.studentCount) : 0);
          return `${i + 1},"${d.name}","${d.code}",${d.studentCount},${d.totalXp},${avgXp},"${rating}"`;
        })
        .join('\n');
    } else {
      header = 'Rank,Register No,Student Name,Department,Section,Stage,Total XP,Attendance %\n';
      csvRows = filteredRows
        .map((r, i) => `${i + 1},"${r.regNo}","${r.studentName}","${r.department}","${r.section}","${r.stage}",${r.totalXp},${r.attendancePct}%`)
        .join('\n');
    }

    const blob = new Blob([header + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const modeName = (activeTableMode === 'DEPARTMENT_SUMMARY' || filterState.totalsOnly) ? 'dept_summary' : 'student_roster';
    link.download = `analytics_${modeName}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 pb-20">
      {/* Header Bar */}
      <div className="bg-slate-900 px-6 pt-8 pb-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-700 mr-1"
                  title="Back to Dashboard"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <h1 className="font-heading type-h1 tracking-tight text-white">Analytics Dashboard</h1>
              {isSuperAdmin ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 tracking-wider">
                  SUPER ADMIN SCOPE
                </span>
              ) : isHOD ? (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center tracking-wider">
                  <Lock className="w-3 h-3 mr-1" /> HOD SCOPE — {hodUserDept || 'your department'}
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 tracking-wider">
                  ADMIN SCOPE
                </span>
              )}
            </div>
            <p className="type-caption text-slate-400 mt-1">
              {isHOD
                ? `Department metrics scoped to ${hodUserDept || 'your department'}`
                : 'Institution-wide live student engagement, attendance compliance & XP leaderboard'}
            </p>
          </div>

          {/* Export & Action Buttons */}
          <div className="flex items-center space-x-2 flex-wrap gap-y-2">
            <button
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`px-3.5 py-2 rounded-xl type-caption border transition-colors flex items-center space-x-1.5 ${showFilterPanel ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
            >
              <Filter className="w-4 h-4" />
              <span>{showFilterPanel ? 'Hide Filters' : 'Show Filters'}</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold type-btn rounded-xl shadow-md transition-all flex items-center space-x-1.5 border border-blue-400/30"
            >
              <FileText className="w-4 h-4" />
              <span>Download Report (PDF)</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold type-btn rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>CSV</span>
            </button>

            <button
              onClick={fetchAnalyticsData}
              className="p-2 type-btn bg-slate-800 hover:bg-slate-700 rounded-xl text-white transition-colors border border-slate-700"
              title="Refresh Analytics (Auto 30s)"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* COMPREHENSIVE FILTER PANEL */}
        {showFilterPanel && (
          <div className="mt-6 p-5 bg-slate-800/90 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
              <div className="flex items-center space-x-2 type-caption font-bold uppercase tracking-wider text-slate-300">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                <span>Analytical Filters Form</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDatePreset('THIS_MONTH')}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-[11px] font-medium text-slate-300 rounded-lg transition-colors"
                >
                  This Month
                </button>
                <button
                  onClick={() => handleDatePreset('SEMESTER')}
                  className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-[11px] font-medium text-slate-300 rounded-lg transition-colors"
                >
                  This Semester
                </button>
                <button
                  onClick={() => handleDatePreset('ACADEMIC_YEAR')}
                  className="px-2.5 py-1 bg-indigo-900/60 text-indigo-300 border border-indigo-700 text-[11px] font-semibold rounded-lg"
                >
                  Academic Year 2025-26
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {/* 1. Academic Year */}
              <div>
                <label className="block type-fine font-semibold text-slate-400 mb-1 type-form-label">Academic Year</label>
                <select
                  value={filterState.academicYear}
                  onChange={(e) => handleAcademicYearChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white type-body-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="All Years">All Years</option>
                  {academicYears.length > 0 ? (
                    academicYears.map((y) => (
                      <option key={y.id} value={y.name}>
                        {y.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </>
                  )}
                </select>
              </div>

              {/* 2. Department (Locked for HOD) */}
              <div>
                <label className="block type-fine font-semibold text-slate-400 mb-1 flex items-center justify-between type-form-label">
                  <span>Department</span>
                  {isHOD && <Lock className="w-3 h-3 text-amber-400" />}
                </label>
                {isHOD ? (
                  <div className="w-full bg-slate-900/80 border border-amber-500/40 text-amber-300 type-caption rounded-xl px-3 py-2 flex items-center justify-between">
                    <span className="truncate">{hodUserDept || 'Department not set'}</span>
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />
                  </div>
                ) : (
                  <select
                    value={filterState.departmentId}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white type-body-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="all">All Departments</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* 3. Class / Section */}
              <div>
                <label className="block type-fine font-semibold text-slate-400 mb-1 type-form-label">Section</label>
                <select
                  value={filterState.sectionId}
                  onChange={(e) => handleSectionChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white type-body-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  {sections.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Stage Tier */}
              <div>
                <label className="block type-fine font-semibold text-slate-400 mb-1 type-form-label">Badge / Stage Tier</label>
                <select
                  value={filterState.stage}
                  onChange={(e) => handleStageChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white type-body-sm rounded-xl px-3 py-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="All Stages">All Stages</option>
                  {stages.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 5. Date Range: From */}
              <div>
                <label className="block type-fine font-semibold text-slate-400 mb-1 flex items-center type-form-label">
                  <Calendar className="w-3 h-3 mr-1 text-slate-400" /> From Date
                </label>
                <input
                  type="date"
                  value={filterState.fromDate}
                  onChange={(e) => setFilterState((prev) => ({ ...prev, fromDate: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 text-white type-body-sm rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* 6. Date Range: To */}
              <div>
                <label className="block type-fine font-semibold text-slate-400 mb-1 flex items-center type-form-label">
                  <Calendar className="w-3 h-3 mr-1 text-slate-400" /> To Date
                </label>
                <input
                  type="date"
                  value={filterState.toDate}
                  onChange={(e) => setFilterState((prev) => ({ ...prev, toDate: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 text-white type-body-sm rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>

            {/* Total Mode Toggle & Active Filter Tags */}
            <div className="pt-2 flex flex-col md:flex-row md:items-center justify-between border-t border-slate-700/60 gap-3">
              <div className="flex items-center space-x-3">
                <span className="type-caption text-slate-300 font-medium">Report Mode:</span>
                <button
                  onClick={() => setFilterState((prev) => ({ ...prev, totalsOnly: !prev.totalsOnly }))}
                  className={`px-3 py-1 rounded-xl type-caption font-bold transition-all flex items-center space-x-1.5 border ${filterState.totalsOnly
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                    }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{filterState.totalsOnly ? 'Department Totals Only' : 'Per-Student Detailed Roster'}</span>
                </button>
              </div>

              <div className="type-caption text-slate-400 flex items-center space-x-2 flex-wrap gap-y-1">
                <span>Active Filters:</span>
                <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                  Dept: {filterState.departmentName}
                </span>
                <span className="bg-slate-700 text-slate-200 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                  Stage: {filterState.stage}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DASHBOARD CONTENT BODY */}
      <div className="p-6 max-w-7xl mx-auto w-full space-y-6">
        {hasError && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 type-caption">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={fetchAnalyticsData}
              className="type-btn px-3 py-1 bg-rose-600 text-white rounded-lg font-semibold hover:bg-rose-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            {/* Skeleton Loading Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm animate-pulse h-20" />
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse h-64" />
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse h-64" />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Executive KPI Cards Strip */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500">Active Students</span>
                  <div className="type-h4 text-slate-900">{metrics.totalStudents}</div>
                  <div className="text-[10px] text-slate-400">Enrolled Roster</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-blue-100 bg-blue-50/20 shadow-sm flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-700 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-blue-700">Total XP Issued</span>
                  <div className="type-h4 text-blue-900">{metrics.totalXp.toLocaleString()} XP</div>
                  <div className="text-[10px] text-blue-600 font-medium">Institution total</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-emerald-100 bg-emerald-50/20 shadow-sm flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-emerald-700">Avg XP / Student</span>
                  <div className="type-h4 text-emerald-900">{Math.round(metrics.avgXpPerStudent)}</div>
                  <div className="text-[10px] text-emerald-600">Across classes</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-purple-100 bg-purple-50/20 shadow-sm flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-purple-700">Attendance %</span>
                  <div className="type-h4 text-purple-900">{metrics.attendancePercentage}%</div>
                  <div className="text-[10px] text-purple-600">Compliance Rate</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-amber-100 bg-amber-50/20 shadow-sm flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-amber-700">Badges Awarded</span>
                  <div className="type-h4 text-amber-900">{metrics.badgesAwarded}</div>
                  <div className="text-[10px] text-amber-600">Unlocked</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-rose-100 bg-rose-50/20 shadow-sm flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-rose-700">At-Risk Low XP</span>
                  <div className="type-h4 text-rose-900">{atRiskStudentsCount}</div>
                  <div className="text-[10px] text-rose-600 flex items-center">
                    <TrendingDown className="w-3 h-3 mr-0.5" /> Needs action
                  </div>
                </div>
              </div>
            </div>

            {/* FEATURED: DEPT AWARD VS PENALTY XP COMPARISON CHART */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <div>
                    <h3 className="type-h5 text-slate-900">Department: Awarded vs Penalty XP</h3>
                    <p className="type-fine text-slate-400">Per-department comparison of issued XP vs penalty deductions</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full type-fine font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Line Graph API
                </span>
              </div>

              <div className="h-72 w-full">
                {monthlyLineChartData.length === 0 ? (
                  <div className="h-full flex items-center justify-center type-caption text-slate-400">
                    No XP data available. Try removing filters or expanding the date range.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={monthlyLineChartData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
                      <CartesianGrid stroke="#F1F5F9" strokeDasharray="5 5" />
                      <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                        formatter={(value: any, name: any) => [
                          `${Number(value).toLocaleString()} XP`,
                          name === 'awardedXp' || name === 'Awarded XP' ? 'Awarded XP' : 'Penalty Deductions',
                        ]}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '11px', fontWeight: 'bold' }} />
                      <Line
                        type="monotone"
                        dataKey="awardedXp"
                        name="Awarded XP"
                        stroke="#3B82F6"
                        strokeWidth={3}
                        dot={{ fill: '#3B82F6', r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                        activeDot={{ r: 7, stroke: '#1E40AF', strokeWidth: 3, fill: '#3B82F6' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="penaltyXp"
                        name="Penalty Deductions"
                        stroke="#EF4444"
                        strokeWidth={3}
                        dot={{ fill: '#EF4444', r: 5, strokeWidth: 2, stroke: '#FFFFFF' }}
                        activeDot={{ r: 7, stroke: '#991B1B', strokeWidth: 3, fill: '#EF4444' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* CHARTS ROW (3 CHARTS: BAR, DONUT, PIE) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Chart 1: Monthly XP Awarded Bar Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="type-h5 text-slate-900">Monthly XP Awarded</h3>
                    <p className="type-fine text-slate-400">Total earned discipline points per month</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full type-fine font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Bar Chart
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="label" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                        formatter={(value: any) => [`${Number(value).toLocaleString()} XP`, 'Awarded XP']}
                      />
                      <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Category XP Distribution Donut Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="type-h5 text-slate-900">XP Category Distribution</h3>
                    <p className="type-fine text-slate-400">Share across activity categories</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full type-fine font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Donut Chart
                  </span>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        nameKey="name"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                        formatter={(value: any) => [`${Number(value).toLocaleString()} XP`, 'XP Share']}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Stage Tier Distribution Solid Pie Chart */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-1.5">
                    <PieChartIcon className="w-4 h-4 text-purple-600" />
                    <div>
                      <h3 className="type-h5 text-slate-900">Stage Tier Distribution</h3>
                      <p className="type-fine text-slate-400">Student count share by stage tier</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full type-fine font-bold bg-purple-50 text-purple-700 border border-purple-200">
                    Pie Chart
                  </span>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stagePieChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={75}
                        paddingAngle={2}
                        dataKey="value"
                        nameKey="name"
                      >
                        {stagePieChartData.map((entry, index) => (
                          <Cell key={`cell-pie-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                        formatter={(value: any) => [`${Number(value)} Students`, 'Roster Count']}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* SUPER ADMIN / ADMIN ONLY: DEPARTMENT PERFORMANCE COMPARISON BAR CHART */}
            {!isHOD && deptRankings.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2">
                    <Building className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h3 className="type-h5 text-slate-900">Department Performance Leaderboard</h3>
                      <p className="type-fine text-slate-400">Institution-wide total discipline XP accumulated by department</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full type-fine font-bold bg-purple-50 text-purple-700 border border-purple-200 tracking-wider">
                    INSTITUTION WIDE
                  </span>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deptRankings} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                      <XAxis dataKey="code" stroke="#64748B" fontSize={11} tickLine={false} />
                      <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0F172A', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
                        formatter={(value: any) => [`${Number(value).toLocaleString()} XP`, 'Total Department XP']}
                      />
                      <Bar dataKey="totalXp" fill="#6366F1" radius={[6, 6, 0, 0]} barSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ANALYTICAL DATA TABLE (DEPARTMENT PERFORMANCE & STUDENT ROSTER) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
              <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      onClick={() => setActiveTableMode('DEPARTMENT_SUMMARY')}
                      className={`px-3 py-1.5 rounded-lg type-caption font-bold transition-all flex items-center space-x-1.5 ${activeTableMode === 'DEPARTMENT_SUMMARY'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      <Building className="w-3.5 h-3.5" />
                      <span>Department Performance Summary</span>
                    </button>

                    <button
                      onClick={() => setActiveTableMode('STUDENT_ROSTER')}
                      className={`px-3 py-1.5 rounded-lg type-caption font-bold transition-all flex items-center space-x-1.5 ${activeTableMode === 'STUDENT_ROSTER'
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                        }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Per-Student Detailed Roster</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search table data..."
                      value={tableSearchText}
                      onChange={(e) => setTableSearchText(e.target.value)}
                      className="pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-xl type-body-sm focus:ring-2 focus:ring-indigo-500 outline-none w-64"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                {activeTableMode === 'DEPARTMENT_SUMMARY' || filterState.totalsOnly ? (
                  /* 1. DEPARTMENT PERFORMANCE SUMMARY TABLE */
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white type-table-head uppercase tracking-wider font-bold">
                        <th className="py-3.5 px-4"># Rank</th>
                        <th className="py-3.5 px-4">Department Name</th>
                        <th className="py-3.5 px-4">Code</th>
                        <th className="py-3.5 px-4 text-center">Student Roster</th>
                        <th className="py-3.5 px-4 text-right">Total XP Accumulated</th>
                        <th className="py-3.5 px-4 text-right">Avg XP / Student</th>
                        <th className="py-3.5 px-4 text-center">Performance Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 type-table-cell">
                      {deptRankings.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-400">
                            No department performance data available.
                          </td>
                        </tr>
                      ) : (
                        deptRankings.map((dept, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-400">#{idx + 1}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">
                              <div className="flex items-center space-x-2">
                                <Building className="w-4 h-4 text-indigo-600 shrink-0" />
                                <span>{dept.name}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 font-mono font-bold text-indigo-700">
                              <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200">
                                {dept.code}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                              {dept.studentCount} Students
                            </td>
                            <td className="py-3.5 px-4 text-right font-black text-indigo-600 type-table-cell">
                              {dept.totalXp.toLocaleString()} XP
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                              {(dept.averageXp || (dept.studentCount ? Math.round(dept.totalXp / dept.studentCount) : 0)).toLocaleString()} XP
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span
                                className={`px-2.5 py-1 rounded-full type-fine font-bold border ${idx === 0
                                    ? 'bg-amber-50 text-amber-700 border-amber-300'
                                    : idx === 1
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                                      : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  }`}
                              >
                                {idx === 0 ? '🏆 Tier 1 Elite' : idx === 1 ? '⭐ Tier 2 Excellence' : '✅ Active Performing'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                ) : (
                  /* 2. PER-STUDENT DETAILED ROSTER TABLE */
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white type-table-head uppercase tracking-wider font-bold">
                        <th className="py-3.5 px-4"># Rank</th>
                        <th className="py-3.5 px-4">Reg No</th>
                        <th className="py-3.5 px-4">Student Name</th>
                        <th className="py-3.5 px-4">Dept</th>
                        <th className="py-3.5 px-4">Sec</th>
                        <th className="py-3.5 px-4">Stage Tier</th>
                        <th className="py-3.5 px-4 text-right">Total XP</th>
                        <th className="py-3.5 px-4 text-right">Attendance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 type-table-cell">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            No matching student roster data found for active filter settings.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-400">#{idx + 1}</td>
                            <td className="py-3.5 px-4 font-mono font-semibold text-slate-700">{row.regNo}</td>
                            <td className="py-3.5 px-4 font-bold text-slate-900">{row.studentName}</td>
                            <td className="py-3.5 px-4 font-medium text-slate-600">{row.department}</td>
                            <td className="py-3.5 px-4 font-medium text-slate-600">{row.section}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${row.stage === 'Elite'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : row.stage === 'Excellence'
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                      : row.stage === 'Achievement'
                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  }`}
                              >
                                {row.stage}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold text-indigo-600">{row.totalXp.toLocaleString()} XP</td>
                            <td className="py-3.5 px-4 text-right font-semibold text-emerald-600">{row.attendancePct}%</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
