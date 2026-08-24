import { logger } from '../../../utils/logger';
import { useState, useEffect, useCallback } from 'react';
import { Trophy, ChevronDown, FilterX, Star } from 'lucide-react';
import apiClient from '../../../services/apiClient';

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

export default function LeaderboardTab() {
  const [isLoading, setIsLoading] = useState(true);
  const [filteredList, setFilteredList] = useState<LeaderboardStudent[]>([]);
  
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string | null>(null);
  const [studentYearId, setStudentYearId] = useState<string | null>(null);

  // Filter state – Department & Section only (showYearFilter is FALSE for students in Flutter)
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const [deptOptions, setDeptOptions] = useState<FilterOption[]>([]);
  const [sectionOptions, setSectionOptions] = useState<FilterOption[]>([]);

  // ── Fetch filters from /api/v1/leaderboard/filters (parity with Flutter) ──
  const fetchFilters = useCallback(async (yearId: string | null, departmentId: string | null) => {
    try {
      const params: Record<string, string> = {};
      if (yearId && yearId !== 'All') params.yearId = yearId;
      if (departmentId && departmentId !== 'All') params.departmentId = departmentId;

      const res = await apiClient.get('/api/v1/leaderboard/filters', { params });
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setDeptOptions(d.departments ?? []);
        setSectionOptions(d.sections ?? []);
      }
    } catch (e) {
      logger.error('Failed to fetch leaderboard filters', e);
    }
  }, []);

  // ── Fetch leaderboard from /api/v1/leaderboard (parity with Flutter) ──
  const fetchLeaderboard = useCallback(async (yearId: string | null, departmentId: string | null, sectionId: string | null) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (yearId && yearId !== 'All') params.yearId = yearId;
      if (departmentId && departmentId !== 'All') params.departmentId = departmentId;
      if (sectionId && sectionId !== 'All') params.sectionId = sectionId;

      const res = await apiClient.get('/api/v1/leaderboard', { params });
      if (res.data?.success && res.data.data) {
        const students: LeaderboardStudent[] = (res.data.data as any[]).map((s: any) => ({
          regNo: s.regNo ?? '',
          fullName: s.fullName ?? '',
          departmentName: s.departmentName ?? '',
          year: s.year ?? '',
          section: s.section ?? '',
          score: s.score ?? 0,
          teamRole: s.teamRole ?? '',
        }));
        setFilteredList(students);
      }
    } catch (e) {
      logger.error('Failed to fetch leaderboard', e);
      setFilteredList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Initial load: get current user, their year, filters, and leaderboard ──
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      let userYear: string | null = null;
      try {
        let profileRes;
        try {
          profileRes = await apiClient.get('/api/v1/profile/me');
        } catch {
          profileRes = await apiClient.get('/api/v1/auth/me');
        }

        if (profileRes.data?.success && profileRes.data.data) {
          const d = profileRes.data.data;
          const reg = d.username || d.regNo || d.registerNumber || null;
          setCurrentUserId(reg);
          setCurrentUserName(d.fullName || d.name || null);

          // Get student's academic year ID if available
          const st = d.studentDetails || {};
          const yr = st.yearId?.toString() || d.yearId?.toString() || d.year?.toString() || null;
          if (yr) {
            userYear = yr;
            setStudentYearId(yr);
          }
        }
      } catch (e) {
        logger.error('Failed to get current user profile', e);
      }

      await fetchFilters(userYear, null);
      await fetchLeaderboard(userYear, null, null);
    };
    init();
  }, [fetchFilters, fetchLeaderboard]);

  // ── Cascading filter handlers (match Flutter behavior) ──
  const handleDeptChange = async (val: string | null) => {
    if (val === selectedDept) return;
    setSelectedDept(val);
    setSelectedSection(null);
    await fetchFilters(studentYearId, val);
    await fetchLeaderboard(studentYearId, val, null);
  };

  const handleSectionChange = async (val: string | null) => {
    if (val === selectedSection) return;
    setSelectedSection(val);
    await fetchLeaderboard(studentYearId, selectedDept, val);
  };

  // ── Current user rank (match Flutter: uses regNo) ──
  const userRankIndex = currentUserId ? filteredList.findIndex(s => s.regNo === currentUserId) : -1;
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : -1;
  const currentUserScore = userRankIndex >= 0 ? filteredList[userRankIndex].score : 0;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const topThree = filteredList.slice(0, 3);
  const remaining = filteredList.slice(3);

  const renderPodiumCell = (student: LeaderboardStudent, rank: number, height: string, iconColor: string, isCurrentUser: boolean) => {
    if (!student) return null;
    const isFirst = rank === 1;
    return (
      <div className="flex flex-col items-center justify-end flex-1 max-w-[105px] sm:max-w-[130px] px-0.5">
        <Trophy className={`mb-1 ${isFirst ? 'w-6 h-6' : 'w-5 h-5'}`} style={{ color: iconColor }} />
        <div className="relative mb-1">
          <div className={`${isFirst ? 'w-15 h-15 sm:w-16 sm:h-16' : 'w-12 h-12 sm:w-14 sm:h-14'} rounded-full bg-white/20 flex items-center justify-center`}>
            <div className={`${isFirst ? 'w-12 h-12 sm:w-13 sm:h-13' : 'w-10 h-10 sm:w-12 sm:h-12'} rounded-full flex items-center justify-center text-white font-bold ${isFirst ? 'type-h4' : 'type-h5'} ${isCurrentUser ? 'bg-indigo-600' : 'bg-slate-700'} shadow-md`}>
              {student.fullName[0] || 'S'}
            </div>
          </div>
        </div>
        <div className="w-full text-center text-white font-bold type-fine truncate px-1" title={student.fullName}>
          {student.fullName}
        </div>
        <div className="text-amber-300 font-bold type-fine mb-2 text-center" title={`${student.score} pts`}>
          {student.score} <span className="text-white/60 text-[11px] font-normal">pts</span>
        </div>
        
        <div className={`w-full max-w-[85px] sm:max-w-[100px] ${height} rounded-t-2xl border flex items-center justify-center type-h4 font-bold shadow-inner`} 
             style={{ backgroundColor: `${iconColor}20`, borderColor: `${iconColor}50`, color: iconColor }}>
          #{rank}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col pb-32">
      <div className="bg-slate-800 text-white px-6 py-4 sticky top-0 z-10 shadow-md">
        <h1 className="type-h4">Leaderboard</h1>
      </div>

      {/* Filter Row (Matching Flutter: Only Department and Section for Student) */}
      <div className="bg-slate-800 px-4 py-3 flex gap-2 shadow-inner">
        {/* Department Filter */}
        <div className="flex-1 relative">
          <select
            value={selectedDept ?? ''}
            onChange={(e) => handleDeptChange(e.target.value || null)}
            className="w-full bg-white/10 border border-white/20 text-white type-body-sm font-bold rounded-lg pl-3 pr-8 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
          >
            <option value="" className="text-slate-800">All Departments</option>
            {deptOptions.map(opt => (
              <option key={opt.id} value={String(opt.id)} className="text-slate-800">{opt.name}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-white/70 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Section Filter */}
        <div className="flex-1 relative">
          <select
            value={selectedSection ?? ''}
            onChange={(e) => handleSectionChange(e.target.value || null)}
            className="w-full bg-white/10 border border-white/20 text-white type-body-sm font-bold rounded-lg pl-3 pr-8 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-white/30 cursor-pointer"
          >
            <option value="" className="text-slate-800">Section</option>
            {sectionOptions.map(opt => (
              <option key={opt.id} value={String(opt.id)} className="text-slate-800">{opt.name}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-white/70 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {filteredList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
            <FilterX className="w-16 h-16 mb-3" />
            <p className="type-body-sm font-medium">No students found.</p>
          </div>
        ) : (
          <>
            {topThree.length > 0 && (
              <div className="bg-slate-800 rounded-b-3xl pt-2 pb-6 px-4 flex justify-evenly items-end">
                {topThree.length > 1 && renderPodiumCell(topThree[1], 2, 'h-[80px]', '#94a3b8', topThree[1].regNo === currentUserId)}
                {renderPodiumCell(topThree[0], 1, 'h-[110px]', '#fbbf24', topThree[0].regNo === currentUserId)}
                {topThree.length > 2 && renderPodiumCell(topThree[2], 3, 'h-[70px]', '#fb923c', topThree[2].regNo === currentUserId)}
              </div>
            )}

            <div className="flex-1 px-5 py-4 overflow-y-auto">
              {remaining.map((s, idx) => {
                const rank = idx + 4;
                const isCurrentUser = s.regNo === currentUserId;
                
                return (
                  <div 
                    key={s.regNo}
                    className={`mb-2 rounded-2xl border flex items-center p-3 shadow-xs ${
                      isCurrentUser ? 'bg-indigo-50 border-indigo-200 shadow-indigo-100' : 'bg-white border-slate-100 shadow-slate-100/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold type-fine flex items-center justify-center shrink-0">
                      #{rank}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className={`type-body-sm font-bold truncate flex items-center gap-1 ${isCurrentUser ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {s.teamRole === 'CAPTAIN' && <span title="Captain">👑 </span>}
                        {s.teamRole === 'VICE_CAPTAIN' && <span title="Vice Captain">🥈 </span>}
                        <span>{s.fullName}</span>
                      </div>
                      <div className="type-caption text-slate-500 truncate">
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
          </>
        )}
      </div>

      {/* Bottom user rank bar (match Flutter: only show when userRank found) */}
      {userRank !== -1 && (
        <div className="fixed bottom-[72px] inset-x-0 mx-auto max-w-3xl rounded-t-3xl px-6 py-3.5 shadow-[0_-4px_15px_rgba(0,0,0,0.1)] z-10 flex items-center gap-3 bg-indigo-600 text-white">
          <Star className="w-6 h-6 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-medium text-white/70">
              Your Rank
            </div>
            <div className="text-[13px] font-bold truncate">
              #{userRank} | {currentUserName ?? 'Student'} ({currentUserScore} pts)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
