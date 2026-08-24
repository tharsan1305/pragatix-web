import { logger } from '../../../utils/logger';
import { useEffect, useState } from 'react';
import { Trophy, Shield, Stars, Users, Activity, TrendingUp, Award, LockKeyhole } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../../../store/authContext';
import { useXpStore } from '../../../store/xpStore';
import apiClient from '../../../services/apiClient';
import { FireStreakIcon } from '../components/FireStreakIcon';

interface ProfileData {
  studentName: string;
  studentId: string;
  department: string;
  section: string;
  year: string;
  score: number;
  rank: number;
  currentStage: number;
  isCaptain: boolean;
  isViceCaptain?: boolean;
  teamRole?: string;
}

interface DashboardTabProps {
  onSelectTab?: (tabIndex: number) => void;
  onOpenStreaks?: () => void;
}

export default function DashboardTab({ onSelectTab, onOpenStreaks }: DashboardTabProps) {
  const { token, user: authUser } = useAuth();
  const {
    xpByCategory, streaks, activityStreaks, history, progression, isLoading: isXpLoading, totalXp,
    fetchSummary, fetchHistory, fetchStreaks, fetchActivityStreaks, fetchProgression,
  } = useXpStore();

  const [isLoading, setIsLoading] = useState(false);
  const [teamDetails, setTeamDetails] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData>(() => {
    const regNo = authUser?.username || authUser?.studentId || authUser?.regNo || authUser?.sprNo || "";
    return {
      studentName: authUser?.fullName || authUser?.name || "",
      studentId: regNo,
      department: authUser?.department || authUser?.departmentName || "",
      section: authUser?.section || authUser?.sectionName || "",
      year: authUser?.year || "",
      score: authUser?.totalXp ?? authUser?.score ?? 0,
      rank: authUser?.rank || 1,
      currentStage: authUser?.currentStage ?? authUser?.stage ?? 1,
      isCaptain: authUser?.isCaptain ?? (authUser?.teamRole === 'CAPTAIN'),
      isViceCaptain: authUser?.isViceCaptain ?? (authUser?.teamRole === 'VICE_CAPTAIN'),
      teamRole: authUser?.teamRole,
    };
  });

  const fetchTeamDetails = async (_studentId?: string) => {
    try {
      const res = await apiClient.get('/api/v1/teams/my-team/details');
      if (res.data?.success && res.data?.data) {
        const t = res.data.data;
        setTeamDetails({
          teamName: t.teamName || 'My Team',
          captainName: t.captainName || 'Not Assigned',
          viceCaptainName: t.viceCaptainName || 'Not Assigned',
          totalTeamXp: t.totalTeamXp ?? 0,
          stage: t.stage || 'Stage 1',
          department: t.department || '',
          section: t.section || '',
          currentMemberCount: t.currentMemberCount ?? (t.members?.length || 0),
          members: t.members || [],
        });
      }
    } catch {
      // Student has no team assigned yet — silently set to null
      setTeamDetails(null);
    }
  };

  const [activeStageExpectedXp, setActiveStageExpectedXp] = useState<number>(0);
  const [hasActiveStage, setHasActiveStage] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/api/v1/auth/me');
        if (res.data?.success && res.data?.data && isMounted) {
          const p = res.data.data;
          const regNo = p.username || p.sprNo || p.regNo || "";
          setProfile({
            studentName: p.fullName || p.name || "",
            studentId: regNo,
            section: p.section || "",
            year: p.year || "",
            department: p.department || "",
            score: p.totalXp ?? p.score ?? 0,
            rank: p.rank || 1,
            currentStage: p.stage ?? 1,
            isCaptain: p.isCaptain ?? (p.teamRole === 'CAPTAIN'),
            isViceCaptain: p.isViceCaptain ?? (p.teamRole === 'VICE_CAPTAIN'),
            teamRole: p.teamRole,
          });

          if (regNo) {
            fetchSummary(regNo);
            fetchHistory(regNo);
            fetchStreaks(regNo);
            fetchActivityStreaks();
            fetchProgression();
            fetchTeamDetails(regNo);
          }
        }
      } catch (error) {
        logger.error("Failed to load profile data", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }

      try {
        const fetchedStages = await apiClient.get('/api/v1/students/stages');
        if (fetchedStages.data?.success && Array.isArray(fetchedStages.data?.data) && isMounted) {
          const list = fetchedStages.data.data;
          const active = list.find((s: any) => s.isActive === true || s.active === true || s.stageStatus === 'ACTIVE');
          if (active) {
            setHasActiveStage(true);
            setActiveStageExpectedXp(Number(active.expectedXp) || 0);
          } else {
            setHasActiveStage(false);
          }
        }
      } catch (_) {}
    };

    if (token) {
      loadDashboardData();
    }
    return () => { isMounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const displayXp = profile.score !== undefined && profile.score !== null ? profile.score : (totalXp ?? 0);
  const levelNum = progression?.currentLevel ?? 1;
  const levelTitle = progression?.currentLevelName ?? 'Explorer';
  const levelMaxXp = progression?.currentLevelMaxXp ?? 100;
  const progress = progression ? Math.min(1, Math.max(0, (progression.progressPercentage ?? 0) / 100)) : 0;

  const maxStreak = (() => {
    if (!streaks) return 0;
    if (typeof streaks === 'number') return streaks;
    if (Array.isArray(streaks)) {
      if (streaks.length === 0) return 0;
      return streaks.reduce((max, s) => {
        if (typeof s === 'number') return s > max ? s : max;
        const current = Number(s?.currentStreak ?? s?.streakCount ?? s?.streak ?? s?.count ?? 0);
        const isBroken = s?.isBroken === true || s?.status === 'Broken' || s?.status === 'BROKEN';
        return !isBroken && current > max ? current : max;
      }, 0);
    }
    if (typeof streaks === 'object') {
      return Number((streaks as any).activeStreakCount ?? (streaks as any).currentStreak ?? (streaks as any).totalStreak ?? 0);
    }
    return 0;
  })();
  const displayStreak = maxStreak;

  if (isLoading || isXpLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const safeXpCategory = xpByCategory || {};
  const individualXp = safeXpCategory["individualXp"] ?? safeXpCategory["INDIVIDUAL"] ?? 0;
  const groupXp = safeXpCategory["groupXp"] ?? safeXpCategory["GROUP"] ?? 0;
  const mustXp = safeXpCategory["mustXp"] ?? safeXpCategory["MUST"] ?? 0;

  const chartData = [
    { name: 'Individual', xp: individualXp, fill: '#a855f7' },
    { name: 'Group', xp: groupXp, fill: '#22c55e' },
    { name: 'MUST', xp: mustXp, fill: '#fbbf24' },
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* Header */}
      <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
        <h1 className="type-h4">Student Dashboard</h1>
        <div className="flex items-center gap-3">
          <FireStreakIcon streakCount={displayStreak} onClick={onOpenStreaks} />

          <button
            onClick={() => onSelectTab && onSelectTab(3)}
            className="p-2 bg-slate-700 hover:bg-slate-600 rounded-full text-slate-300 hover:text-white transition-colors"
            title="My Group"
          >
            <Users className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-6">
        {/* Welcome Banner */}
        <div className="flex justify-between items-center">
          <div>
            <div className="type-body-sm text-slate-500">Welcome back,</div>
            <h2 className="type-h3 text-slate-900 flex items-center gap-2">
              {profile.studentName}
              {(profile.isCaptain || profile.isViceCaptain) && (
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  {profile.isCaptain ? 'CAPTAIN' : 'VICE CAPTAIN'}
                </span>
              )}
            </h2>
          </div>
        </div>

        {/* Discipline Score Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-indigo-100 font-medium">Discipline Score</span>
            <Shield className="w-6 h-6 text-white/90" />
          </div>
          <div className="type-h1 mb-5">{displayXp} Points</div>

          <div className="h-px bg-white/20 mb-4" />

          <div className="flex justify-between items-center type-body-sm">
            <div>
              <div className="text-indigo-200 type-caption mb-1">Department</div>
              <div className="font-semibold">{profile.department}</div>
            </div>
            <div className="text-right">
              <div className="text-indigo-200 type-caption mb-1">Section & Year</div>
              <div className="font-semibold">{profile.year} Year - Sec {profile.section}</div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="type-h5 text-slate-800">Level {levelNum} — {levelTitle}</h3>
            <Stars className="w-6 h-6 text-indigo-500" />
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="type-caption text-slate-500 font-medium">
            {displayXp} / {levelMaxXp} XP to next level
          </p>
        </div>

        {/* Stage Progress Card (matches Flutter's _buildStageProgressBanner) */}
        {!hasActiveStage ? (
          <div className="bg-red-50 rounded-2xl p-5 border border-red-200 text-center space-y-2">
            <LockKeyhole className="w-8 h-8 mx-auto text-red-500" />
            <h3 className="type-h5 text-red-600">No Active Stage</h3>
            <p className="type-caption text-red-500">No active stage is currently available. Activities are locked.</p>
          </div>
        ) : (() => {
          const currentStage = Math.max(1, profile.currentStage || 1);
          const stageMaxXp = activeStageExpectedXp || 1;
          const stagePct = Math.min(100, Math.round((displayXp / stageMaxXp) * 100));

          return (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="type-h5 text-slate-800">Stage {currentStage} Progress</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full type-caption font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Active
                </span>
              </div>

              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${stagePct >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                  style={{ width: `${Math.min(100, stagePct)}%` }}
                />
              </div>

              <div className="flex justify-between items-center type-body-sm font-bold">
                <span className="text-slate-700">{displayXp} / {activeStageExpectedXp} XP</span>
                <span className={stagePct >= 100 ? 'text-emerald-600' : 'text-indigo-600'}>{stagePct}%</span>
              </div>
            </div>
          );
        })()}

        {/* Metric Cards Row */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-amber-50 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-amber-100/50 rounded-full">
              <Trophy className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <div className="type-caption text-slate-500 font-medium mb-1">Leaderboard Rank</div>
              <div className="type-h4 text-slate-800 font-bold">#{profile.rank}</div>
            </div>
          </div>
          <div className="bg-teal-50 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-teal-100/50 rounded-full">
              <Shield className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <div className="type-caption text-slate-500 font-medium mb-1">Active Stage</div>
              <div className="type-h4 text-slate-800 font-bold">Stage {Math.max(1, profile.currentStage)}</div>
            </div>
          </div>
        </div>

        {/* Active Streaks */}
        <div id="streaks-section">
          <div className="flex justify-between items-center mb-3">
            <h3 className="type-h4 text-slate-800">Active Streaks</h3>
            {onOpenStreaks && (
              <button
                onClick={onOpenStreaks}
                className="type-btn text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
              >
                <span>View All Records</span>
                <span>→</span>
              </button>
            )}
          </div>
          {streaks.length === 0 ? (
            <p className="type-body-sm text-slate-500">No active streaks recorded.</p>
          ) : (
            <div className="flex overflow-x-auto gap-3 pb-2 snap-x">
              {streaks.map((s, idx) => (
                <div key={idx} className={`snap-start shrink-0 w-32 p-3 rounded-2xl border-2 bg-white ${s.isBroken ? 'border-red-200' : 'border-green-200'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-800 truncate w-20">
                      {s.streakType.replace('_', ' ')}
                    </span>
                    <span className="type-caption">{s.isBroken ? "❄️" : "🔥"}</span>
                  </div>
                  <div className={`type-body-sm font-bold ${s.isBroken ? 'text-red-500' : 'text-green-500'}`}>
                    {s.isBroken ? "Broken" : `${s.currentStreak} Days`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Streaks */}
        <div>
          <h3 className="type-h4 text-slate-800 mb-3">Activity Streaks</h3>
          {activityStreaks.length === 0 ? (
            <p className="type-body-sm text-slate-500">No active activity streaks recorded.</p>
          ) : (
            <div className="flex overflow-x-auto gap-3 pb-2 snap-x">
              {activityStreaks.map((s, idx) => {
                const count = Number(s?.currentStreak ?? 0);
                const isBroken = count === 0;
                const name = s?.activityName || 'Activity';
                return (
                  <div key={idx} className={`snap-start shrink-0 w-32 p-3 rounded-2xl border-2 bg-white ${isBroken ? 'border-red-200' : 'border-orange-200'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] font-bold text-slate-800 truncate w-20">{name}</span>
                      <span className="type-caption">{isBroken ? "💤" : "⚡"}</span>
                    </div>
                    <div className={`type-body-sm font-bold ${isBroken ? 'text-red-500' : 'text-orange-600'}`}>
                      {isBroken ? "No Streak" : `${count} Times`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* XP Summary Grid */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h3 className="type-h5 text-slate-800">XP Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center p-2.5 rounded-xl border bg-purple-500/5 border-purple-500/20">
              <div className="w-1.5 self-stretch rounded-full mr-2.5 bg-purple-500" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-slate-500 truncate">Individual XP</div>
                <div className="type-body-sm font-bold text-purple-600">{individualXp} XP</div>
              </div>
            </div>
            <div className="flex items-center p-2.5 rounded-xl border bg-green-500/5 border-green-500/20">
              <div className="w-1.5 self-stretch rounded-full mr-2.5 bg-green-500" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-slate-500 truncate">Group XP</div>
                <div className="type-body-sm font-bold text-green-600">{groupXp} XP</div>
              </div>
            </div>
            <div className="flex items-center p-2.5 rounded-xl border bg-amber-500/5 border-amber-500/20">
              <div className="w-1.5 self-stretch rounded-full mr-2.5 bg-amber-500" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-slate-500 truncate">MUST XP</div>
                <div className="type-body-sm font-bold text-amber-600">{mustXp} XP</div>
              </div>
            </div>
            <div className="flex items-center p-2.5 rounded-xl border bg-blue-500/5 border-blue-500/20">
              <div className="w-1.5 self-stretch rounded-full mr-2.5 bg-blue-500" />
              <div className="flex-1 min-w-0">
                <div className="type-fine font-medium text-slate-500 truncate">Total XP</div>
                <div className="type-body-sm font-bold text-blue-600">{displayXp} XP</div>
              </div>
            </div>
          </div>
          <div className="h-px bg-slate-100 mb-4" />
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800 type-body-sm">Total XP</span>
            <span className="type-h5 font-bold text-indigo-600">{displayXp} XP</span>
          </div>
        </div>

        {/* Category Bar Chart */}
        <div>
          <h3 className="type-h4 text-slate-800 mb-3">XP by Category</h3>
          <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
                  interval={0}
                />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="xp" radius={[6, 6, 0, 0]} maxBarSize={36}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* My Group Card */}
        <div id="my-group-section">
          <div className="flex justify-between items-center mb-3">
            <h3 className="type-h4 text-slate-800">My Group</h3>
            {onSelectTab && (
              <button
                onClick={() => onSelectTab(3)}
                className="type-btn text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
              >
                View Details →
              </button>
            )}
          </div>
          <div 
            onClick={() => onSelectTab && onSelectTab(3)}
            className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 cursor-pointer hover:border-indigo-200 transition-colors"
          >
            {teamDetails ? (
              <>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <h4 className="font-bold text-slate-800 type-h4">{teamDetails.teamName || 'Unnamed Team'}</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full type-caption font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                    {teamDetails.stage || 'STAGE 1'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 type-caption">
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                    🏢 {teamDetails.department || profile.department || 'N/A'}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                    🏫 Sec: {teamDetails.section || profile.section || 'N/A'}
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700">
                    👥 {teamDetails.currentMemberCount || (teamDetails.members?.length || 0)} Members
                  </span>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="grid grid-cols-2 gap-4 type-caption">
                  <div>
                    <div className="text-slate-400 font-semibold mb-0.5">Captain</div>
                    <div className="font-bold text-slate-800 truncate">{teamDetails.captainName || 'Not Assigned'}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-semibold mb-0.5">Vice Captain</div>
                    <div className="font-bold text-slate-800 truncate">{teamDetails.viceCaptainName || 'Not Assigned'}</div>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center type-caption font-bold bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-600">Total Group XP</span>
                  <span className="text-emerald-600 type-body-sm font-black">
                    {teamDetails.totalTeamXp ?? teamDetails.teamXp ?? 0} XP
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-400 font-medium type-body-sm">
                <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <div>No Team Assigned</div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <h3 className="type-h4 text-slate-800 mb-3">Recent Point Actions</h3>
          {history.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center text-slate-500 border border-slate-100 shadow-sm">
              No recent activities recorded.
            </div>
          ) : (
            <div className="space-y-3">
              {history.slice(0, 5).map((log, idx) => {
                const isPositive = log.xpPoints > 0;
                return (
                  <div key={idx} className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-slate-100 shadow-sm">
                    <div className={`p-2.5 rounded-full ${isPositive ? 'bg-green-50' : 'bg-red-50'}`}>
                      <TrendingUp className={`w-5 h-5 ${isPositive ? 'text-green-500' : 'text-red-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800 truncate type-body-sm">
                        {log.activityName || log.category}
                      </div>
                      <div className="type-caption text-slate-500">
                        {new Date(log.submittedAt).toLocaleDateString()} • {log.status}
                      </div>
                    </div>
                    <div className={`font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? '+' : ''}{log.xpPoints}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
