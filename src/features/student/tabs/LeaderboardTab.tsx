import { logger } from '../../../utils/logger';
import { useState, useEffect, useCallback } from 'react';
import { Trophy, ChevronDown, FilterX, ArrowLeft } from 'lucide-react';
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

interface LeaderboardTabProps {
  onBack?: () => void;
}

export default function LeaderboardTab({ onBack }: LeaderboardTabProps) {
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
  const [searchQuery, setSearchQuery] = useState('');

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
        const list = Array.isArray(res.data.data) ? res.data.data : (res.data.data.content || []);
        const mapped = list.map((item: any) => ({
          regNo: item.registerNumber || item.regNo || item.studentRegNo || item.username || '',
          fullName: item.studentName || item.fullName || item.name || 'Student',
          departmentName: item.departmentName || item.department || '',
          year: String(item.year || item.academicYear || ''),
          section: item.section || '',
          score: item.totalXp ?? item.score ?? 0,
          teamRole: item.teamRole,
        }));
        setFilteredList(mapped);
      }
    } catch (e) {
      logger.error('Failed to load leaderboard data', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const authRes = await apiClient.get('/api/v1/auth/me');
        if (authRes.data?.success && authRes.data?.data) {
          const user = authRes.data.data;
          const regNo = user.username || user.sprNo || user.regNo || '';
          setCurrentUserId(regNo);
          setCurrentUserName(user.name || user.fullName || '');
          const yId = user.yearId ? String(user.yearId) : null;
          setStudentYearId(yId);
          await fetchFilters(yId, null);
          await fetchLeaderboard(yId, null, null);
        }
      } catch (e) {
        logger.error('Failed to init leaderboard user data', e);
        await fetchFilters(null, null);
        await fetchLeaderboard(null, null, null);
      }
    };
    init();
  }, [fetchFilters, fetchLeaderboard]);

  // ── Cascading filter handlers (match Flutter behavior) ──
  const handleDeptChange = async (val: string | null) => {
    if (val === selectedDept) return;
    setSelectedDept(val);
    setSelectedSection(null);
    await fetchFilters(studentYearId, val);
  };

  const handleSectionChange = async (val: string | null) => {
    if (val === selectedSection) return;
    setSelectedSection(val);
  };

  const handleSearch = () => {
    fetchLeaderboard(studentYearId, selectedDept, selectedSection);
  };

  // ── Current user rank (match Flutter: uses regNo) ──
  const userRankIndex = currentUserId ? filteredList.findIndex(s => s.regNo === currentUserId) : -1;
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : -1;
  const currentUserScore = userRankIndex >= 0 ? filteredList[userRankIndex].score : 0;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg text-text-primary">
        <p className="type-body-sm font-semibold text-text-secondary">Loading leaderboard...</p>
      </div>
    );
  }

  const activeList = searchQuery.trim()
    ? filteredList.filter(s =>
        s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.regNo.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filteredList;

  const topThree = activeList.slice(0, 3);
  const remaining = activeList.slice(3);

  const renderPodiumCell = (student: LeaderboardStudent, rank: number, height: string, _iconColor: string, isCurrentUser: boolean) => {
    if (!student) return null;
    const isFirst = rank === 1;
    const isSecond = rank === 2;

    const styleConfig = isFirst
      ? {
          trophyClass: 'text-amber-500 fill-amber-400/30 w-8 h-8 drop-shadow-sm',
          avatarClass: 'bg-gradient-to-br from-amber-100 to-amber-50 border-2 border-amber-400 text-amber-700 shadow-md',
          pillarClass: 'bg-gradient-to-t from-amber-500/20 via-amber-500/5 to-card border-2 border-amber-400 text-amber-600 shadow-md font-black',
          scoreClass: 'text-amber-600 font-black',
          badgeText: '👑 GOLD',
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
        }
      : isSecond
      ? {
          trophyClass: 'text-slate-400 fill-slate-300/30 w-7 h-7',
          avatarClass: 'bg-gradient-to-br from-slate-100 to-slate-50 border-2 border-slate-300 text-slate-700 shadow-sm',
          pillarClass: 'bg-gradient-to-t from-slate-400/20 via-slate-400/5 to-card border-2 border-slate-300 text-slate-700 shadow-sm font-black',
          scoreClass: 'text-slate-700 font-bold',
          badgeText: '🥈 SILVER',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
        }
      : {
          trophyClass: 'text-amber-700 fill-amber-800/30 w-6 h-6',
          avatarClass: 'bg-gradient-to-br from-amber-900/10 to-amber-900/5 border-2 border-amber-700/40 text-amber-900 shadow-sm',
          pillarClass: 'bg-gradient-to-t from-amber-700/20 via-amber-700/5 to-card border-2 border-amber-700/30 text-amber-900 shadow-sm font-black',
          scoreClass: 'text-amber-800 font-bold',
          badgeText: '🥉 BRONZE',
          badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
        };

    return (
      <div className="flex flex-col items-center justify-end flex-1 max-w-[120px] sm:max-w-[150px] px-1">
        <Trophy className={`mb-1.5 transition-transform hover:scale-110 ${styleConfig.trophyClass}`} />
        
        <div className="relative mb-2 flex flex-col items-center">
          <div className={`${isFirst ? 'w-16 h-16' : 'w-13 h-13'} rounded-2xl flex items-center justify-center ${styleConfig.avatarClass} ${isCurrentUser ? 'ring-4 ring-accent/30' : ''}`}>
            <div className={`font-black ${isFirst ? 'type-h3' : 'type-h4'}`}>
              {student.fullName[0] || 'S'}
            </div>
          </div>
          <span className={`mt-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${styleConfig.badgeClass} uppercase tracking-wider`}>
            {styleConfig.badgeText}
          </span>
        </div>

        <div className="w-full text-center text-text-primary font-black type-body-sm truncate px-1 mt-0.5" title={student.fullName}>
          {student.fullName}
        </div>
        <div className={`type-fine mb-3 text-center ${styleConfig.scoreClass}`} title={`${student.score} XP`}>
          {student.score} <span className="text-text-muted text-[11px] font-normal">XP</span>
        </div>
        
        <div className={`w-full max-w-[95px] sm:max-w-[115px] ${height} rounded-t-2xl flex items-center justify-center type-h3 font-black ${styleConfig.pillarClass}`}>
          #{rank}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-bg min-h-screen flex flex-col pb-32 text-text-primary">
      {/* Header */}
      <div className="bg-card text-text-primary px-6 py-5 sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex justify-between items-center">
        <div className="flex items-center space-x-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 border border-border bg-card hover:bg-bg rounded-lg transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">Student Leaderboard</h1>
            <p className="type-caption text-text-secondary font-medium mt-0.5">Top rank performers and departmental XP rankings</p>
          </div>
        </div>
      </div>

      {/* Filter Row with Instant Search */}
      <div className="bg-card px-4 sm:px-6 py-3.5 flex flex-wrap gap-2.5 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] items-center">
        {/* Instant Search Input */}
        <div className="flex-1 min-w-[200px] relative">
          <input
            type="text"
            placeholder="Search student or Reg No..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-bg border border-border text-text-primary type-caption font-bold rounded-xl px-3 py-2 outline-none focus:border-accent"
          />
        </div>
        {/* Department Filter */}
        <div className="flex-1 min-w-[140px] relative">
          <select
            value={selectedDept ?? ''}
            onChange={(e) => handleDeptChange(e.target.value || null)}
            className="w-full bg-bg border border-border text-text-primary type-caption font-bold rounded-xl pl-3 pr-8 py-2 appearance-none focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="" className="text-text-primary">All Departments</option>
            {deptOptions.map(opt => (
              <option key={opt.id} value={String(opt.id)} className="text-text-primary">{opt.name}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Section Filter */}
        <div className="flex-1 min-w-[120px] relative">
          <select
            value={selectedSection ?? ''}
            onChange={(e) => handleSectionChange(e.target.value || null)}
            className="w-full bg-bg border border-border text-text-primary type-caption font-bold rounded-xl pl-3 pr-8 py-2 appearance-none focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="" className="text-text-primary">All Sections</option>
            {sectionOptions.map(opt => (
              <option key={opt.id} value={String(opt.id)} className="text-text-primary">{opt.name}</option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-text-secondary absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Search / Apply Button */}
        <button
          onClick={handleSearch}
          className="px-5 py-2 rounded-xl bg-accent hover:bg-accent-hover text-card type-caption font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-none shrink-0"
        >
          <span>🔍 Search</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col p-5 lg:p-7 xl:p-8 max-w-[1400px] mx-auto w-full">
        {filteredList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-text-muted p-8">
            <FilterX className="w-16 h-16 mb-3 text-text-muted" />
            <p className="type-body-sm font-medium">No students found.</p>
          </div>
        ) : (
          <>
            {topThree.length > 0 && (
              <div className="bg-card rounded-2xl pt-6 pb-6 px-4 flex justify-evenly items-end border border-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] mb-6 max-w-2xl mx-auto w-full">
                {topThree.length > 1 && renderPodiumCell(topThree[1], 2, 'h-[80px]', '#525252', topThree[1].regNo === currentUserId)}
                {renderPodiumCell(topThree[0], 1, 'h-[110px]', '#000000', topThree[0].regNo === currentUserId)}
                {topThree.length > 2 && renderPodiumCell(topThree[2], 3, 'h-[70px]', '#525252', topThree[2].regNo === currentUserId)}
              </div>
            )}

            <div className="flex-1 space-y-2.5 pb-28">
              {remaining.map((s, idx) => {
                const rank = idx + 4;
                const isCurrentUser = s.regNo === currentUserId;
                
                return (
                  <div 
                    key={s.regNo}
                    className={`mb-2.5 rounded-xl border flex items-center p-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all ${
                      isCurrentUser ? 'bg-accent-tint border-accent/40' : 'bg-card border-border hover:border-accent/30'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-bg border border-border text-text-primary font-black type-fine flex items-center justify-center shrink-0">
                      #{rank}
                    </div>
                    <div className="ml-3.5 flex-1 min-w-0">
                      <div className="type-body-sm font-bold truncate flex items-center gap-1.5 text-text-primary">
                        {s.teamRole === 'CAPTAIN' && <span title="Captain">👑 </span>}
                        {s.teamRole === 'VICE_CAPTAIN' && <span title="Vice Captain">🥈 </span>}
                        <span>{s.fullName}</span>
                      </div>
                      <div className="type-caption text-text-secondary truncate font-medium mt-0.5">
                        {s.regNo} • {s.departmentName} • Year {s.year} - {s.section}
                      </div>
                    </div>
                    <div className="ml-3 font-bold text-accent type-body-sm whitespace-nowrap bg-accent-tint border border-accent/20 px-2.5 py-1 rounded-lg">
                      {s.score} XP
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
