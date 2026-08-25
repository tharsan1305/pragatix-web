import { logger } from '../../../utils/logger';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, ChevronDown, FilterX, RefreshCw, Search, X, ArrowLeft } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../store/authContext';
import { ROLE_ACCESS, getEffectiveRole } from '../../../config/roleAccess';

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

interface Props {
  onBack?: () => void;
}

export default function AdminLeaderboardTab({ onBack }: Props = {}) {
  const auth = useAuth();
  const { user, isSuperAdmin, isHOD, isAdmin, role, subRoles } = auth;
  const effectiveRole = getEffectiveRole(user, { isSuperAdmin, isHOD, isAdmin, role, subRoles });
  const roleConfig = ROLE_ACCESS[effectiveRole];

  const userYear = user?.academicYear || user?.assignedYear || user?.year || (user?.adminDetails?.academicYear);
  const userDept = user?.department || user?.departmentName || user?.dept || (user?.superAdminDetails?.department);

  const scopeLabel = roleConfig.dataScope === 'institution'
    ? 'INSTITUTION SCOPE'
    : roleConfig.dataScope === 'year'
    ? `ADMIN SCOPE: ${userYear || 'ASSIGNED YEAR'}`
    : `HOD SCOPE: ${userDept || 'YOUR DEPARTMENT'}`;

  const isHodUser = !roleConfig.canViewAllDepartments;

  const [isLoading, setIsLoading] = useState(true);
  const [studentList, setStudentList] = useState<LeaderboardStudent[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter state
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(isHodUser && user?.departmentId ? String(user.departmentId) : null);
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
      setStudentList(students);
    } catch (e) {
      logger.error('Failed to fetch leaderboard', e);
      setStudentList([]);
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

  // Filter list with live search query
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return studentList;
    const q = searchQuery.toLowerCase().trim();
    return studentList.filter(s => 
      s.fullName.toLowerCase().includes(q) || 
      s.regNo.toLowerCase().includes(q) || 
      s.departmentName.toLowerCase().includes(q)
    );
  }, [studentList, searchQuery]);

  const topThree = filteredList.slice(0, 3);
  const remaining = filteredList.slice(3);

  const renderPodiumCell = (student: LeaderboardStudent, rank: number, height: string) => {
    if (!student) return null;
    const isFirst = rank === 1;
    const isSecond = rank === 2;

    const rankConfig = isFirst
      ? {
          trophyColor: 'text-amber-500',
          borderRing: 'border-amber-400 bg-amber-50',
          avatarBg: 'bg-amber-500 text-white',
          podiumBg: 'bg-gradient-to-t from-amber-500 to-amber-400 text-white border-amber-500',
          badgeText: '🥇 1st Place',
        }
      : isSecond
      ? {
          trophyColor: 'text-slate-400',
          borderRing: 'border-slate-300 bg-slate-50',
          avatarBg: 'bg-slate-500 text-white',
          podiumBg: 'bg-gradient-to-t from-slate-400 to-slate-300 text-white border-slate-400',
          badgeText: '🥈 2nd Place',
        }
      : {
          trophyColor: 'text-amber-700',
          borderRing: 'border-amber-600/30 bg-amber-50/50',
          avatarBg: 'bg-amber-700 text-white',
          podiumBg: 'bg-gradient-to-t from-amber-700 to-amber-600 text-white border-amber-700',
          badgeText: '🥉 3rd Place',
        };

    return (
      <div className="flex flex-col items-center justify-end flex-1 max-w-[120px] sm:max-w-[150px] px-1 group">
        <Trophy className={`mb-1.5 w-6 h-6 ${rankConfig.trophyColor} transition-transform group-hover:scale-110`} />
        
        {/* Avatar Ring */}
        <div className="relative mb-2">
          <div className={`${isFirst ? 'w-16 h-16 sm:w-18 sm:h-18' : 'w-13 h-13 sm:w-15 sm:h-15'} rounded-full border-2 ${rankConfig.borderRing} flex items-center justify-center p-1 shadow-xs`}>
            <div className={`w-full h-full ${rankConfig.avatarBg} rounded-full flex items-center justify-center font-black ${isFirst ? 'type-h4' : 'type-h5'}`}>
              {student.fullName ? student.fullName[0].toUpperCase() : 'S'}
            </div>
          </div>
          {student.teamRole === 'CAPTAIN' && (
            <span className="absolute -top-1 -right-1 text-sm" title="Team Captain">👑</span>
          )}
          {student.teamRole === 'VICE_CAPTAIN' && (
            <span className="absolute -top-1 -right-1 text-sm" title="Vice Captain">🛡️</span>
          )}
        </div>

        {/* Student Name */}
        <div className="w-full text-center text-text-primary font-bold type-fine truncate px-1" title={student.fullName}>
          {student.fullName}
        </div>

        {/* Score */}
        <div className="text-text-primary font-black type-caption mb-2 text-center flex items-center gap-1">
          <span className="text-accent">{student.score}</span>
          <span className="text-text-muted text-[10px] font-bold">PTS</span>
        </div>
        
        {/* Podium Block */}
        <div 
          className={`w-full max-w-[95px] sm:max-w-[120px] ${height} rounded-t-xl border flex flex-col items-center justify-center font-black shadow-xs transition-all ${rankConfig.podiumBg}`}
        >
          <span className="type-h3 leading-none">#{rank}</span>
          <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">{rankConfig.badgeText.split(' ')[1]}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-bg min-h-full flex flex-col pb-20">
      {/* Compact Header & Filter Bar (Only Title & Filters) */}
      <div className="bg-card text-text-primary border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] sticky top-0 z-20">
        {/* Title and Action */}
        <div className="px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3.5">
            {onBack && (
              <button onClick={onBack} className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="type-h3 font-bold text-text-primary tracking-tight">Leaderboard</h1>
              <span className="px-2.5 py-0.5 rounded-md type-fine font-bold uppercase bg-bg text-text-secondary border border-border tracking-wider">
                {scopeLabel}
              </span>
            </div>
          </div>
          <button
            onClick={() => fetchLeaderboard(selectedYear, selectedDept, selectedSection)}
            disabled={isLoading}
            className="p-2 bg-card border border-border hover:bg-bg rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Leaderboard"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-accent' : ''}`} />
          </button>
        </div>

        {/* Multi-Filter & Search Row */}
        <div className="px-6 py-3 flex flex-wrap items-center gap-2.5 border-t border-border-subtle">
          {/* Live Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search rank list..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchLeaderboard(selectedYear, selectedDept, selectedSection);
                }
              }}
              className="w-full pl-9 pr-8 py-2 bg-bg text-text-primary placeholder:text-text-muted type-body-sm font-semibold rounded-lg border border-border focus:border-text-primary outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Year Filter */}
          <div className="min-w-[130px] relative">
            <select
              value={selectedYear ?? ''}
              onChange={(e) => handleYearChange(e.target.value || null)}
              className="w-full bg-bg border border-border text-text-primary type-body-sm font-semibold rounded-lg pl-3.5 pr-8 py-2 appearance-none focus:outline-none focus:border-text-primary cursor-pointer"
            >
              <option value="" className="text-text-primary">All Years</option>
              {yearOptions.map(opt => (
                <option key={opt.id} value={String(opt.id)} className="text-text-primary">{opt.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Department Filter */}
          <div className="min-w-[160px] relative">
            <select
              value={selectedDept ?? ''}
              disabled={isHodUser}
              onChange={(e) => handleDeptChange(e.target.value || null)}
              className={`w-full bg-bg border border-border text-text-primary type-body-sm font-semibold rounded-lg pl-3.5 pr-8 py-2 appearance-none focus:outline-none focus:border-text-primary ${
                isHodUser ? 'opacity-70 cursor-not-allowed bg-bg' : 'cursor-pointer'
              }`}
            >
              {!isHodUser && <option value="" className="text-text-primary">All Departments</option>}
              {deptOptions.map(opt => (
                <option key={opt.id} value={String(opt.id)} className="text-text-primary">{opt.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Section Filter */}
          <div className="min-w-[120px] relative">
            <select
              value={selectedSection ?? ''}
              onChange={(e) => handleSectionChange(e.target.value || null)}
              className="w-full bg-bg border border-border text-text-primary type-body-sm font-semibold rounded-lg pl-3.5 pr-8 py-2 appearance-none focus:outline-none focus:border-text-primary cursor-pointer"
            >
              <option value="" className="text-text-primary">All Sections</option>
              {sectionOptions.map(opt => (
                <option key={opt.id} value={String(opt.id)} className="text-text-primary">{opt.name}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
          
          {/* Search Button */}
          <button
            onClick={() => fetchLeaderboard(selectedYear, selectedDept, selectedSection)}
            className="px-4 py-2 bg-accent hover:bg-accent-hover text-card type-caption font-bold rounded-lg transition-colors flex items-center space-x-1.5 shadow-none cursor-pointer shrink-0"
            title="Search & Refresh records from Database"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-accent" />
            <p className="type-body-sm text-text-secondary font-medium">Loading leaderboard rankings...</p>
          </div>
        ) : filteredList.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-2xl border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] p-8 space-y-3 flex flex-col items-center">
            <div className="w-14 h-14 rounded-xl bg-bg border border-border flex items-center justify-center text-text-muted mb-1">
              <FilterX className="w-7 h-7 text-accent" />
            </div>
            <p className="type-h4 font-bold text-text-primary">No students found on leaderboard</p>
            <p className="type-body-sm text-text-secondary max-w-md">Adjust your search query, year, department, or section filters above.</p>
          </div>
        ) : (
          <>
            {/* Podium Card inside normal scroll flow */}
            {topThree.length > 0 && (
              <div className="bg-card rounded-2xl border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-6">
                <div className="text-center mb-2">
                  <h3 className="type-h5 font-bold text-text-primary">Top Performers Podium</h3>
                  <p className="type-fine text-text-secondary font-medium">Highest score leaders across selected filters</p>
                </div>
                <div className="pt-4 pb-2 px-2 flex justify-center items-end gap-2 sm:gap-6">
                  {topThree.length > 1 && renderPodiumCell(topThree[1], 2, 'h-[90px] sm:h-[105px]')}
                  {renderPodiumCell(topThree[0], 1, 'h-[125px] sm:h-[145px]')}
                  {topThree.length > 2 && renderPodiumCell(topThree[2], 3, 'h-[75px] sm:h-[90px]')}
                </div>
              </div>
            )}

            {/* Complete Rank List (#4 onwards or all) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between px-1">
                <h4 className="type-caption font-bold text-text-secondary uppercase tracking-wider">
                  {remaining.length > 0 ? `Student Standings (${remaining.length} Remaining)` : 'All Standings'}
                </h4>
                <span className="type-fine text-text-muted font-medium">
                  Total: {filteredList.length} Students
                </span>
              </div>

              {remaining.length === 0 && topThree.length > 0 ? (
                <div className="text-center py-6 bg-card rounded-xl border border-border text-text-muted type-body-sm">
                  Top 3 students are shown in the podium above.
                </div>
              ) : (
                remaining.map((s, idx) => {
                  const rank = idx + 4;
                  return (
                    <div 
                      key={s.regNo || idx}
                      className="rounded-xl border border-border bg-card flex items-center p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:border-accent/40 transition-all"
                    >
                      <div className="w-9 h-9 rounded-lg bg-bg border border-border text-text-primary font-black text-[12px] flex items-center justify-center shrink-0">
                        #{rank}
                      </div>
                      <div className="ml-4 flex-1 min-w-0">
                        <div className="font-bold type-body-sm text-text-primary truncate flex items-center gap-1.5">
                          {s.teamRole === 'CAPTAIN' && <span title="Captain">👑</span>}
                          {s.teamRole === 'VICE_CAPTAIN' && <span title="Vice Captain">🛡️</span>}
                          <span>{s.fullName}</span>
                          <span className="type-fine text-text-muted font-normal">({s.regNo})</span>
                        </div>
                        <div className="type-caption text-text-secondary truncate mt-0.5 flex items-center gap-1.5">
                          <span>{s.departmentName}</span>
                          <span>•</span>
                          <span>Year {s.year} - Sec {s.section}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex items-center space-x-1.5 shrink-0 bg-bg px-3.5 py-1.5 rounded-lg border border-border">
                        <span className="font-black text-accent type-body-sm">{s.score}</span>
                        <span className="type-fine text-text-muted font-bold">pts</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
