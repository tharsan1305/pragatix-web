import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronDown, Award, Trophy, FilterX } from 'lucide-react';
import apiClient from '../../../services/apiClient';

interface FilterOption {
  id: number | string;
  name: string;
}

export default function TeacherLeaderboardTab() {
  const [leaderboardList, setLeaderboardList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters — stored as numeric string IDs or null (matching Flutter)
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const [yearOptions, setYearOptions] = useState<FilterOption[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<FilterOption[]>([]);
  const [sectionOptions, setSectionOptions] = useState<FilterOption[]>([]);

  // Fetch cascading filter options matching Flutter LeaderboardService.getFilters
  const fetchFilters = useCallback(async (yearId: string | null, departmentId: string | null) => {
    try {
      const params: Record<string, string> = {};
      if (yearId) params.yearId = yearId;
      if (departmentId) params.departmentId = departmentId;

      const res = await apiClient.get('/api/v1/leaderboard/filters', { params });
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        if (Array.isArray(d.years)) setYearOptions(d.years);
        if (Array.isArray(d.departments)) setDepartmentOptions(d.departments);
        if (Array.isArray(d.sections)) setSectionOptions(d.sections);
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard filters', e);
    }
  }, []);

  // Fetch leaderboard matching Flutter LeaderboardService.getLeaderboard
  const fetchLeaderboard = useCallback(async (yearId: string | null, departmentId: string | null, sectionId: string | null) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (yearId) params.yearId = yearId;
      if (departmentId) params.departmentId = departmentId;
      if (sectionId) params.sectionId = sectionId;

      const response = await apiClient.get('/api/v1/leaderboard', { params });
      if (response.data?.success && Array.isArray(response.data?.data)) {
        setLeaderboardList(response.data.data);
      } else {
        setLeaderboardList([]);
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard', e);
      setLeaderboardList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFilters(null, null);
    fetchLeaderboard(null, null, null);
  }, [fetchFilters, fetchLeaderboard]);

  const handleYearChange = async (val: string | null) => {
    setSelectedYear(val);
    setSelectedDept(null);
    setSelectedSection(null);
    await fetchFilters(val, null);
    await fetchLeaderboard(val, null, null);
  };

  const handleDeptChange = async (val: string | null) => {
    setSelectedDept(val);
    setSelectedSection(null);
    await fetchFilters(selectedYear, val);
    await fetchLeaderboard(selectedYear, val, null);
  };

  const handleSectionChange = async (val: string | null) => {
    setSelectedSection(val);
    await fetchLeaderboard(selectedYear, selectedDept, val);
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 relative pb-28">
      {/* Top Header Bar */}
      <div className="bg-slate-900 text-white px-6 pt-10 pb-6 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Student Leaderboard</h1>
          <p className="text-xs text-slate-400 mt-0.5">Real-time student rankings across departments and sections</p>
        </div>

        <button
          onClick={() => {
            fetchFilters(selectedYear, selectedDept);
            fetchLeaderboard(selectedYear, selectedDept, selectedSection);
          }}
          className="p-2.5 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
          title="Refresh Leaderboard"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Cascading Filter Bar matching Flutter LeaderboardService */}
      <div className="bg-slate-800 px-4 md:px-6 py-3 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Year Filter */}
        <div className="relative">
          <select
            value={selectedYear ?? ''}
            onChange={(e) => handleYearChange(e.target.value || null)}
            className="w-full bg-slate-900/90 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="">Year (All)</option>
            {yearOptions.map(opt => (
              <option key={opt.id} value={String(opt.id)} className="bg-slate-900 text-white">
                {opt.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Department Filter */}
        <div className="relative">
          <select
            value={selectedDept ?? ''}
            onChange={(e) => handleDeptChange(e.target.value || null)}
            className="w-full bg-slate-900/90 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="">Department (All)</option>
            {departmentOptions.map(opt => (
              <option key={opt.id} value={String(opt.id)} className="bg-slate-900 text-white">
                {opt.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Section Filter */}
        <div className="relative">
          <select
            value={selectedSection ?? ''}
            onChange={(e) => handleSectionChange(e.target.value || null)}
            className="w-full bg-slate-900/90 border border-slate-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="">Section (All)</option>
            {sectionOptions.map(opt => (
              <option key={opt.id} value={String(opt.id)} className="bg-slate-900 text-white">
                {opt.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Leaderboard List Content */}
      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
          </div>
        ) : leaderboardList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
            <FilterX className="w-12 h-12 text-slate-300" />
            <p className="font-semibold text-slate-700 text-base">No students found on leaderboard.</p>
            <p className="text-xs text-slate-500 max-w-xs">
              Try selecting a different Year, Department, or Section filter.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {leaderboardList.map((student, idx) => {
              const rank = student.rank || (idx + 1);
              const score = student.totalXp ?? student.score ?? student.xp ?? 0;
              const name = student.fullName || student.studentName || 'Student';
              const regNo = student.regNo || student.username || '';
              const isCaptain = student.isCaptain || student.teamRole === 'CAPTAIN';

              return (
                <div
                  key={student.regNo || idx}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {/* Rank Indicator */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0">
                      {rank === 1 ? (
                        <Trophy className="w-6 h-6 text-amber-500 fill-amber-400" />
                      ) : rank === 2 ? (
                        <Award className="w-6 h-6 text-slate-400" />
                      ) : rank === 3 ? (
                        <Award className="w-6 h-6 text-amber-700" />
                      ) : (
                        <span className="text-slate-500 font-bold">#{rank}</span>
                      )}
                    </div>

                    {/* Student Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm truncate">{name}</span>
                        {isCaptain && (
                          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 uppercase tracking-wider">
                            👑 CAPTAIN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {student.departmentName} • {student.year} {student.section && `• Sec ${student.section}`} {regNo && `(${regNo})`}
                      </p>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0 ml-3">
                    <span className="text-base font-extrabold text-indigo-600">{score}</span>
                    <span className="text-xs font-bold text-slate-400 ml-1">pts</span>
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
