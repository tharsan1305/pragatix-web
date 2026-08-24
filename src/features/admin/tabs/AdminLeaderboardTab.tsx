import { logger } from '../../../utils/logger';
import { useState, useEffect, useCallback } from 'react';
import { Trophy, ChevronDown, FilterX, RefreshCw } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../store/authContext';

interface LeaderboardStudent {
  regNo: string;
  fullName: string;
  departmentName: string;
  year: string;
  section: string;
  score: number;
  teamRole?: string;
}

interface FilterOption {
  id: number | string;
  name: string;
}

export default function AdminLeaderboardTab() {
  const { user, isHOD } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [filteredList, setFilteredList] = useState<LeaderboardStudent[]>([]);

  // Filter state
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(isHOD && user?.departmentId ? String(user.departmentId) : null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const [yearOptions, setYearOptions] = useState<FilterOption[]>([]);
  const [deptOptions, setDeptOptions] = useState<FilterOption[]>([]);
  const [sectionOptions, setSectionOptions] = useState<FilterOption[]>([]);

  // Fetch cascading filter options
  const fetchFilters = useCallback(async (yearId: string | null, departmentId: string | null) => {
    try {
      const params: Record<string, string> = {};
      if (yearId && yearId !== 'All') params.yearId = yearId;
      if (departmentId && departmentId !== 'All') params.departmentId = departmentId;

      const res = await apiClient.get('/api/v1/leaderboard/filters', { params });
      const d = res.data?.data || res.data;
      if (d) {
        if (Array.isArray(d.years)) setYearOptions(d.years);
        if (Array.isArray(d.departments)) setDeptOptions(d.departments);
        if (Array.isArray(d.sections)) setSectionOptions(d.sections);
      }
    } catch (e) {
      logger.error('Failed to fetch leaderboard filters', e);
    }
  }, []);

  // Fetch leaderboard
  const fetchLeaderboard = useCallback(async (yearId: string | null, departmentId: string | null, sectionId: string | null) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (yearId && yearId !== 'All') params.yearId = yearId;
      if (departmentId && departmentId !== 'All') params.departmentId = departmentId;
      if (sectionId && sectionId !== 'All') params.sectionId = sectionId;

      const res = await apiClient.get('/api/v1/leaderboard', { params });
      let rawList: any[] = [];

      if (Array.isArray(res.data)) {
        rawList = res.data;
      } else if (Array.isArray(res.data?.data)) {
        rawList = res.data.data;
      } else if (res.data?.content && Array.isArray(res.data.content)) {
        rawList = res.data.content;
      }

      // Fallback to students API if leaderboard endpoint has no data
      if (rawList.length === 0) {
        const studentParams: Record<string, any> = { page: 0, size: 100, sortBy: 'score' };
        if (yearId && yearId !== 'All') studentParams.year = yearId;
        if (departmentId && departmentId !== 'All') studentParams.departmentId = departmentId;
        if (sectionId && sectionId !== 'All') studentParams.sectionId = sectionId;

        const studRes = await apiClient.get('/api/v1/students', { params: studentParams });
        const studPage = studRes.data?.data || studRes.data;
        rawList = Array.isArray(studPage?.content) ? studPage.content : Array.isArray(studPage) ? studPage : [];
      }

      const students: LeaderboardStudent[] = rawList.map((s: any) => ({
        regNo: s.regNo || s.sprNo || s.registerNumber || s.registerNo || '',
        fullName: s.fullName || s.studentName || s.name || 'Student',
        departmentName: s.departmentName || s.department?.deptName || s.department || '',
        year: s.year ? `${s.year}` : (s.academicYear ? `${s.academicYear}` : '1'),
        section: s.sectionName || s.section?.sectionName || s.section || 'A',
        score: Number(s.score ?? s.totalXp ?? s.xp ?? 0),
        teamRole: s.teamRole || '',
      }));

      // Sort descending by score
      students.sort((a, b) => (b.score || 0) - (a.score || 0));
      setFilteredList(students);
    } catch (e) {
      logger.error('Failed to fetch leaderboard', e);
      setFilteredList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilters(selectedYear, selectedDept);
    fetchLeaderboard(selectedYear, selectedDept, selectedSection);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleYearChange = async (val: string | null) => {
    setSelectedYear(val);
    setSelectedDept(null);
    setSelectedSection(null);
    await fetchFilters(val, null);
    await fetchLeaderboard(val, null, null);
  };

  const handleDeptChange = async (val: string | null) => {
    if (val === selectedDept) return;
    setSelectedDept(val);
    setSelectedSection(null);
    await fetchFilters(selectedYear, val);
    await fetchLeaderboard(selectedYear, val, null);
  };

  const handleSectionChange = async (val: string | null) => {
    if (val === selectedSection) return;
    setSelectedSection(val);
    await fetchLeaderboard(selectedYear, selectedDept, val);
  };

  const topThree = filteredList.slice(0, 3);
  const remaining = filteredList.slice(3);

  const renderPodiumCell = (student: LeaderboardStudent, rank: number, height: string, iconColor: string) => {
    if (!student) return null;
    const isFirst = rank === 1;
    return (
      <div className="flex flex-col items-center justify-end flex-1 max-w-[105px] sm:max-w-[130px] px-0.5">
        <Trophy className={`mb-1 ${isFirst ? 'w-6 h-6' : 'w-5 h-5'}`} style={{ color: iconColor }} />
        <div className="relative mb-1">
          <div className={`${isFirst ? 'w-15 h-15 sm:w-16 sm:h-16' : 'w-12 h-12 sm:w-14 sm:h-14'} rounded-full bg-white/15 flex items-center justify-center`}>
            <div className={`${isFirst ? 'w-12 h-12 sm:w-13 sm:h-13' : 'w-10 h-10 sm:w-12 sm:h-12'} rounded-full flex items-center justify-center text-white font-bold ${isFirst ? 'type-h4' : 'type-h5'} bg-slate-700 shadow-md`}>
              {student.fullName ? student.fullName[0].toUpperCase() : 'S'}
            </div>
          </div>
        </div>
        <div className="w-full text-center text-white font-bold type-fine truncate px-1" title={student.fullName}>
          {student.fullName}
        </div>
        <div className="text-amber-300 font-bold type-fine mb-2 text-center" title={`${student.score} pts`}>
          {student.score} <span className="text-white/60 text-[11px] font-normal">pts</span>
        </div>
        
        <div 
          className={`w-full max-w-[85px] sm:max-w-[100px] ${height} rounded-t-2xl border flex items-center justify-center type-h4 font-bold shadow-inner`} 
          style={{ backgroundColor: `${iconColor}20`, borderColor: `${iconColor}50`, color: iconColor }}
        >
          #{rank}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col pb-16">
      {/* Seamless Dark Header Card (Matching Student Leaderboard Design) */}
      <div className="bg-slate-800 text-white rounded-b-3xl shadow-lg">
        {/* Title and Action */}
        <div className="px-6 pt-5 pb-3 flex justify-between items-center">
          <h1 className="type-h3 tracking-tight">Leaderboard</h1>
          <button
            onClick={() => fetchLeaderboard(selectedYear, selectedDept, selectedSection)}
            disabled={isLoading}
            className="p-2 bg-slate-700/80 hover:bg-slate-700 rounded-full text-white transition-colors cursor-pointer"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Row */}
        <div className="px-6 py-2 flex flex-wrap gap-2.5">
          {/* Year Filter */}
          <div className="flex-1 min-w-[130px] relative">
            <select
              value={selectedYear ?? ''}
              onChange={(e) => handleYearChange(e.target.value || null)}
              className="w-full bg-white/10 border border-white/20 text-white type-body-sm font-semibold rounded-xl pl-3.5 pr-8 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
            >
              <option value="" className="text-slate-800">All Years</option>
              {yearOptions.map(opt => (
                <option key={opt.id} value={String(opt.id)} className="text-slate-800">{opt.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-white/70 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Department Filter */}
          <div className="flex-1 min-w-[140px] relative">
            <select
              value={selectedDept ?? ''}
              disabled={isHOD}
              onChange={(e) => handleDeptChange(e.target.value || null)}
              className={`w-full bg-white/10 border border-white/20 text-white type-body-sm font-semibold rounded-xl pl-3.5 pr-8 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer ${
                isHOD ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <option value="" className="text-slate-800">All Departments</option>
              {deptOptions.map(opt => (
                <option key={opt.id} value={String(opt.id)} className="text-slate-800">{opt.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-white/70 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Section Filter */}
          <div className="flex-1 min-w-[120px] relative">
            <select
              value={selectedSection ?? ''}
              onChange={(e) => handleSectionChange(e.target.value || null)}
              className="w-full bg-white/10 border border-white/20 text-white type-body-sm font-semibold rounded-xl pl-3.5 pr-8 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
            >
              <option value="" className="text-slate-800">All Sections</option>
              {sectionOptions.map(opt => (
                <option key={opt.id} value={String(opt.id)} className="text-slate-800">{opt.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-white/70 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Podium Area (Top 3) */}
        {!isLoading && filteredList.length > 0 && (
          <div className="pt-2 pb-6 px-4 flex justify-evenly items-end">
            {topThree.length > 1 && renderPodiumCell(topThree[1], 2, 'h-[80px]', '#94a3b8')}
            {renderPodiumCell(topThree[0], 1, 'h-[110px]', '#fbbf24')}
            {topThree.length > 2 && renderPodiumCell(topThree[2], 3, 'h-[70px]', '#fb923c')}
          </div>
        )}
      </div>

      {/* Main Content (Loading, Empty, or Student List) */}
      <div className="flex-1 flex flex-col pt-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12">
            <FilterX className="w-16 h-16 mb-3 text-slate-300" />
            <p className="type-body-sm font-medium">No students found on leaderboard.</p>
          </div>
        ) : (
          <div className="flex-1 px-5 py-2 overflow-y-auto max-w-5xl mx-auto w-full">
            {remaining.map((s, idx) => {
              const rank = idx + 4;
              return (
                <div 
                  key={s.regNo || idx}
                  className="mb-2.5 rounded-2xl border border-slate-100 bg-white flex items-center p-3.5 shadow-xs hover:shadow-sm transition-shadow"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                    #{rank}
                  </div>
                  <div className="ml-3.5 flex-1 min-w-0">
                    <div className="font-bold type-body-sm text-slate-800 truncate flex items-center gap-1.5">
                      {s.teamRole === 'CAPTAIN' && <span title="Captain">👑</span>}
                      {s.teamRole === 'VICE_CAPTAIN' && <span title="Vice Captain">🥈</span>}
                      <span>{s.fullName}</span>
                    </div>
                    <div className="type-caption text-slate-500 truncate mt-0.5">
                      {s.regNo} • {s.departmentName} • Year {s.year} - {s.section}
                    </div>
                  </div>
                  <div className="ml-3 font-bold text-indigo-600 type-body-sm whitespace-nowrap">
                    {s.score} pts
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

