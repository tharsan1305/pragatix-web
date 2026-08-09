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

  // Filter state – null means "All" (no filter applied), matching Flutter's null = no filter
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  const [yearOptions, setYearOptions] = useState<FilterOption[]>([]);
  const [deptOptions, setDeptOptions] = useState<FilterOption[]>([]);
  const [sectionOptions, setSectionOptions] = useState<FilterOption[]>([]);

  // ── Fetch filters from /api/v1/leaderboard/filters (parity with Flutter) ──
  const fetchFilters = useCallback(async (yearId: string | null, departmentId: string | null) => {
    try {
      const params: Record<string, string> = {};
      if (yearId) params.yearId = yearId;
      if (departmentId) params.departmentId = departmentId;

      const res = await apiClient.get('/api/v1/leaderboard/filters', { params });
      if (res.data?.success && res.data.data) {
        const d = res.data.data;
        setYearOptions(d.years ?? []);
        setDeptOptions(d.departments ?? []);
        setSectionOptions(d.sections ?? []);
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard filters', e);
    }
  }, []);

  // ── Fetch leaderboard from /api/v1/leaderboard (parity with Flutter) ──
  const fetchLeaderboard = useCallback(async (yearId: string | null, departmentId: string | null, sectionId: string | null) => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (yearId) params.yearId = yearId;
      if (departmentId) params.departmentId = departmentId;
      if (sectionId) params.sectionId = sectionId;

      const res = await apiClient.get('/api/v1/leaderboard', { params });
      if (res.data?.success && res.data.data) {
        const students: LeaderboardStudent[] = (res.data.data as any[]).map((s: any) => ({
          regNo: s.regNo ?? '',
          fullName: s.fullName ?? '',
          departmentName: s.departmentName ?? '',
          year: s.year ?? '',
          section: s.section ?? '',
          score: s.totalXp ?? s.score ?? s.xp ?? 0,
          teamRole: s.teamRole ?? '',
        }));
        setFilteredList(students);
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard', e);
      setFilteredList([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Initial load: get current user, filters, and leaderboard ──
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        // Get current user (match Flutter: uses /api/v1/auth/me → username = regNo)
        const profileRes = await apiClient.get('/api/v1/auth/me');
        if (profileRes.data?.success && profileRes.data.data) {
          setCurrentUserId(profileRes.data.data.username ?? null);
          setCurrentUserName(profileRes.data.data.fullName ?? null);
        }
      } catch (e) {
        console.error('Failed to get current user profile', e);
      }

      await fetchFilters(null, null);
      await fetchLeaderboard(null, null, null);
    };
    init();
  }, [fetchFilters, fetchLeaderboard]);

  // ── Cascading filter handlers (match Flutter behavior) ──
  const handleYearChange = async (val: string | null) => {
    if (val === selectedYear) return;
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
    return (
      <div className="flex flex-col items-center justify-end" style={{ height: '220px' }}>
        <Trophy className="w-6 h-6 mb-1" style={{ color: iconColor }} />
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl ${isCurrentUser ? 'bg-indigo-600' : 'bg-slate-700'}`}>
              {student.fullName[0] || 'S'}
            </div>
          </div>
        </div>
        <div className="mt-2 w-20 text-center text-white font-bold text-[11px] truncate">{student.fullName}</div>
        <div className="text-white/70 text-[9px] font-medium mb-1.5">{student.departmentName} • {student.score} pts</div>
        
        <div className={`w-20 ${height} rounded-t-xl border flex items-center justify-center text-lg font-bold`} 
             style={{ backgroundColor: `${iconColor}20`, borderColor: `${iconColor}50`, color: iconColor }}>
          #{rank}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col pb-32">
      <div className="bg-slate-800 text-white px-6 py-4 sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold">Leaderboard</h1>
      </div>

      {/* Dynamic Cascading Filters (parity with Flutter) */}
      <div className="bg-slate-800 px-4 py-3 flex gap-2 shadow-inner">
        {/* Year Filter */}
        <div className="flex-1 relative">
          <select
            value={selectedYear ?? ''}
            onChange={(e) => handleYearChange(e.target.value || null)}
            className="w-full bg-white/10 border border-white/20 text-white text-sm font-bold rounded-lg pl-3 pr-8 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <option value="" className="text-slate-800">All Year</option>
            {yearOptions.map(opt => (
              <option key={opt.id} value={String(opt.id)} className="text-slate-800">{opt.name}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-white/70 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Department Filter */}
        <div className="flex-1 relative">
          <select
            value={selectedDept ?? ''}
            onChange={(e) => handleDeptChange(e.target.value || null)}
            className="w-full bg-white/10 border border-white/20 text-white text-sm font-bold rounded-lg pl-3 pr-8 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <option value="" className="text-slate-800">All Dept</option>
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
            className="w-full bg-white/10 border border-white/20 text-white text-sm font-bold rounded-lg pl-3 pr-8 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-white/30"
          >
            <option value="" className="text-slate-800">All Sec</option>
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
            <p className="text-sm font-medium">No students found.</p>
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
                    className={`mb-2 rounded-2xl border flex items-center p-3 shadow-sm ${
                      isCurrentUser ? 'bg-indigo-50 border-indigo-200 shadow-indigo-100' : 'bg-white border-slate-100 shadow-slate-100/50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0">
                      #{rank}
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <div className={`font-bold text-sm truncate flex items-center gap-1 ${isCurrentUser ? 'text-indigo-900' : 'text-slate-800'}`}>
                        {s.teamRole === 'CAPTAIN' && <span title="Captain">👑 </span>}
                        {s.teamRole === 'VICE_CAPTAIN' && <span title="Vice Captain">🥈 </span>}
                        <span>{s.fullName}</span>
                      </div>
                      <div className="text-xs text-slate-500 truncate">
                        {s.regNo} • {s.departmentName} • Year {s.year} - {s.section}
                      </div>
                    </div>
                    <div className="ml-3 font-bold text-indigo-600 text-sm whitespace-nowrap">
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
