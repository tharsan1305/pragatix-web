import { logger } from '../../../utils/logger';
import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, ChevronDown, Trophy, FilterX, ArrowLeft, Search } from 'lucide-react';
import apiClient from '../../../services/apiClient';

interface FilterOption {
  id: number | string;
  name: string;
}

interface Props {
  onBack?: () => void;
}

export default function TeacherLeaderboardTab({ onBack }: Props = {}) {
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
      const d = res.data?.data || res.data;
      if (d) {
        if (Array.isArray(d.years)) setYearOptions(d.years);
        if (Array.isArray(d.departments)) setDepartmentOptions(d.departments);
        if (Array.isArray(d.sections)) setSectionOptions(d.sections);
      }
    } catch (e) {
      logger.error('Failed to fetch leaderboard filters', e);
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
      let rawList: any[] = [];
      if (Array.isArray(response.data)) {
        rawList = response.data;
      } else if (Array.isArray(response.data?.data)) {
        rawList = response.data.data;
      } else if (response.data?.success && Array.isArray(response.data?.data)) {
        rawList = response.data.data;
      } else if (response.data?.content && Array.isArray(response.data.content)) {
        rawList = response.data.content;
      }
      setLeaderboardList(rawList);
    } catch (e) {
      logger.error('Failed to fetch leaderboard', e);
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
  };

  const handleDeptChange = async (val: string | null) => {
    setSelectedDept(val);
    setSelectedSection(null);
    await fetchFilters(selectedYear, val);
  };

  const handleSectionChange = async (val: string | null) => {
    setSelectedSection(val);
  };

  const handleSearchLeaderboard = () => {
    fetchLeaderboard(selectedYear, selectedDept, selectedSection);
  };

  return (
    <div className="flex flex-col min-h-full bg-bg relative pb-28 text-text-primary">
      {/* Top Header Bar */}
      <div className="bg-card text-text-primary px-6 py-5 border-b border-border flex justify-between items-center sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">Student Leaderboard</h1>
            <p className="type-caption text-text-secondary font-medium mt-0.5">Real-time student rankings across departments and sections</p>
          </div>
        </div>

        <button
          onClick={() => {
            fetchFilters(selectedYear, selectedDept);
            fetchLeaderboard(selectedYear, selectedDept, selectedSection);
          }}
          className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
          title="Refresh Leaderboard"
        >
          <RefreshCw className={`w-4 h-4 text-accent ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Cascading Filter Bar */}
      <div className="bg-card px-6 py-3.5 border-b border-border grid grid-cols-1 sm:grid-cols-4 gap-3 items-center shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
        {/* Year Filter */}
        <div className="relative">
          <select
            value={selectedYear ?? ''}
            onChange={(e) => handleYearChange(e.target.value || null)}
            className="w-full bg-bg border border-border text-text-primary type-body-sm font-semibold rounded-lg px-3.5 py-2 appearance-none focus:outline-none focus:border-text-primary cursor-pointer"
          >
            <option value="">Year (All)</option>
            {yearOptions.map(opt => (
              <option key={opt.id} value={String(opt.id)}>
                {opt.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Department Filter */}
        <div className="relative">
          <select
            value={selectedDept ?? ''}
            onChange={(e) => handleDeptChange(e.target.value || null)}
            className="w-full bg-bg border border-border text-text-primary type-body-sm font-semibold rounded-lg px-3.5 py-2 appearance-none focus:outline-none focus:border-text-primary cursor-pointer"
          >
            <option value="">Department (All)</option>
            {departmentOptions.map(opt => (
              <option key={opt.id} value={String(opt.id)}>
                {opt.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Section Filter */}
        <div className="relative">
          <select
            value={selectedSection ?? ''}
            onChange={(e) => handleSectionChange(e.target.value || null)}
            className="w-full bg-bg border border-border text-text-primary type-body-sm font-semibold rounded-lg px-3.5 py-2 appearance-none focus:outline-none focus:border-text-primary cursor-pointer"
          >
            <option value="">Section (All)</option>
            {sectionOptions.map(opt => (
              <option key={opt.id} value={String(opt.id)}>
                {opt.name}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Explicit Search Button */}
        <button
          onClick={handleSearchLeaderboard}
          className="w-full px-4 py-2 bg-accent hover:bg-accent-hover text-card type-btn font-bold rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-none"
        >
          <Search className="w-4 h-4" />
          <span>Search</span>
        </button>
      </div>

      {/* Leaderboard List Content */}
      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-text-primary" />
          </div>
        ) : leaderboardList.length === 0 ? (
          <div className="bg-card rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-12 text-center text-text-muted flex flex-col items-center justify-center space-y-3">
            <FilterX className="w-12 h-12 text-text-muted" />
            <p className="font-semibold text-text-primary type-body">No students found on leaderboard.</p>
            <p className="type-caption text-text-secondary max-w-xs">
              Try selecting a different Year, Department, or Section filter.
            </p>
          </div>
        ) : (
          <>
            {/* Top 3 Visual Podium Section */}
            {leaderboardList.length >= 3 && (
              <div className="bg-card rounded-lg p-6 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] text-text-primary">
                <div className="text-center type-caption font-extrabold uppercase tracking-widest text-text-secondary mb-4">
                  Top Performers
                </div>
                <div className="flex items-end justify-center gap-2 sm:gap-6 pt-4 pb-2">
                  {/* 2nd Place (Silver) */}
                  {leaderboardList[1] && (
                    <div className="flex flex-col items-center flex-1 max-w-[120px]">
                      <Trophy className="w-6 h-6 text-text-secondary mb-1" />
                      <div className="w-14 h-14 rounded-full bg-bg border-2 border-border flex items-center justify-center text-text-primary font-extrabold type-h5 shadow-sm">
                        {(leaderboardList[1].fullName || leaderboardList[1].studentName || 'S')[0]}
                      </div>
                      <span className="font-bold type-caption text-text-primary truncate w-full text-center mt-2">
                        {leaderboardList[1].fullName || leaderboardList[1].studentName}
                      </span>
                      <span className="type-fine text-text-secondary font-semibold mb-2">
                        {leaderboardList[1].totalXp ?? leaderboardList[1].score ?? 0} pts
                      </span>
                      <div className="w-full h-24 bg-bg border border-border rounded-t-lg flex items-center justify-center font-extrabold text-text-secondary type-body">
                        #2
                      </div>
                    </div>
                  )}

                  {/* 1st Place (Gold) */}
                  {leaderboardList[0] && (
                    <div className="flex flex-col items-center flex-1 max-w-[130px]">
                      <Trophy className="w-8 h-8 text-accent fill-accent mb-1" />
                      <div className="w-16 h-16 rounded-full bg-card border-2 border-accent flex items-center justify-center text-text-primary font-extrabold type-h4 shadow-md ring-4 ring-accent/10">
                        {(leaderboardList[0].fullName || leaderboardList[0].studentName || 'S')[0]}
                      </div>
                      <span className="font-bold type-body-sm text-text-primary truncate w-full text-center mt-2">
                        {leaderboardList[0].fullName || leaderboardList[0].studentName}
                      </span>
                      <span className="type-caption text-accent font-bold mb-2">
                        {leaderboardList[0].totalXp ?? leaderboardList[0].score ?? 0} pts
                      </span>
                      <div className="w-full h-32 bg-accent-tint border border-accent/20 rounded-t-lg flex items-center justify-center font-extrabold text-accent type-h4">
                        #1
                      </div>
                    </div>
                  )}

                  {/* 3rd Place (Bronze) */}
                  {leaderboardList[2] && (
                    <div className="flex flex-col items-center flex-1 max-w-[120px]">
                      <Trophy className="w-6 h-6 text-text-secondary mb-1" />
                      <div className="w-14 h-14 rounded-full bg-bg border-2 border-border flex items-center justify-center text-text-primary font-extrabold type-h5 shadow-sm">
                        {(leaderboardList[2].fullName || leaderboardList[2].studentName || 'S')[0]}
                      </div>
                      <span className="font-bold type-caption text-text-primary truncate w-full text-center mt-2">
                        {leaderboardList[2].fullName || leaderboardList[2].studentName}
                      </span>
                      <span className="type-fine text-text-secondary font-semibold mb-2">
                        {leaderboardList[2].totalXp ?? leaderboardList[2].score ?? 0} pts
                      </span>
                      <div className="w-full h-20 bg-bg border border-border rounded-t-lg flex items-center justify-center font-extrabold text-text-secondary type-body">
                        #3
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Remaining Student List (#4+) */}
            <div className="space-y-3">
              {(leaderboardList.length >= 3 ? leaderboardList.slice(3) : leaderboardList).map((student, idx) => {
                const rank = student.rank || (leaderboardList.length >= 3 ? idx + 4 : idx + 1);
                const score = student.totalXp ?? student.score ?? student.xp ?? 0;
                const name = student.fullName || student.studentName || 'Student';
                const regNo = student.regNo || student.username || '';
                const isCaptain = student.isCaptain || student.teamRole === 'CAPTAIN';

                return (
                  <div
                    key={student.regNo || idx}
                    className="bg-card rounded-lg p-4 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-text-secondary transition-all flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      {/* Rank Indicator */}
                      <div className="w-9 h-9 rounded-lg bg-bg border border-border flex items-center justify-center font-extrabold type-caption text-text-primary shrink-0">
                        #{rank}
                      </div>

                      {/* Student Info */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-text-primary type-body-sm truncate">{name}</span>
                          {isCaptain && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-warning-tint text-warning border border-warning/30 uppercase tracking-wider">
                              👑 CAPTAIN
                            </span>
                          )}
                        </div>
                        <p className="type-caption text-text-secondary font-medium mt-0.5">
                          {student.departmentName} • {student.year} {student.section && `• Sec ${student.section}`} {regNo && `(${regNo})`}
                        </p>
                      </div>
                    </div>

                    {/* Score */}
                    <div className="text-right shrink-0 ml-3">
                      <span className="type-body font-extrabold text-accent">{score}</span>
                      <span className="type-caption font-bold text-text-muted ml-1">pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
