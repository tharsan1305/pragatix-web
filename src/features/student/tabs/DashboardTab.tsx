import { logger } from '../../../utils/logger';
import { useEffect, useState } from 'react';
import {
  Trophy, Shield, Stars, Users, Activity, TrendingUp, LockKeyhole,
  BarChart2, Flame, Target, Clock, ArrowUpRight, Crown
} from 'lucide-react';
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
  myGroupTabIndex?: number;
}

export default function DashboardTab({ onSelectTab, onOpenStreaks, myGroupTabIndex = 3 }: DashboardTabProps) {
  const { token, user: authUser } = useAuth();
  const {
    xpByCategory, streaks, activityStreaks, history, progression, totalXp,
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
      } catch (_) { }
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

  if (isLoading && !profile.studentName) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="type-body-sm font-semibold text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const safeXpCategory = xpByCategory || {};
  const individualXp = safeXpCategory["individualXp"] ?? safeXpCategory["INDIVIDUAL"] ?? 0;
  const groupXp = safeXpCategory["groupXp"] ?? safeXpCategory["GROUP"] ?? 0;
  const mustXp = safeXpCategory["mustXp"] ?? safeXpCategory["MUST"] ?? 0;

  const chartData = [
    { name: 'Individual', xp: individualXp, fill: '#1E293B' },
    { name: 'Group', xp: groupXp, fill: '#64748B' },
    { name: 'MUST', xp: mustXp, fill: '#94A3B8' },
  ];

  const portalLabel = profile.isCaptain ? 'CAPTAIN' : profile.isViceCaptain ? 'VICE CAPTAIN' : null;
  const dashboardTitle = profile.isCaptain ? 'Captain Dashboard' : profile.isViceCaptain ? 'Vice Captain Dashboard' : 'Student Dashboard';

  const currentStageNum = Math.max(1, profile.currentStage || 1);
  const stageMaxXp = activeStageExpectedXp || 1;
  const stagePct = Math.min(100, Math.round((displayXp / stageMaxXp) * 100));

  return (
    <div className="bg-bg text-text-primary min-h-screen">
      {/* ── Sticky Top Header ── */}
      <div className="bg-card border-b border-border sticky top-0 z-10 px-6 lg:px-8 py-3.5 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div>
          <h1 className="text-lg font-black text-text-primary tracking-tight">{dashboardTitle}</h1>
          <p className="text-xs text-text-muted font-medium mt-0.5">Overview of your activity performance and team progression</p>
        </div>
        <div className="flex items-center gap-2.5">
          <FireStreakIcon streakCount={displayStreak} onClick={onOpenStreaks} />
          <button
            onClick={() => onSelectTab && onSelectTab(myGroupTabIndex)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg hover:bg-accent-tint border border-border rounded-lg text-xs font-semibold text-text-secondary hover:text-accent transition-colors cursor-pointer"
            title="My Group"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">My Group</span>
          </button>
        </div>
      </div>

      <div className="p-5 lg:p-7 xl:p-8 max-w-[1400px] mx-auto">

        {/* ── Hero Welcome Banner ── */}
        <div className="bg-card rounded-2xl border border-border p-5 lg:p-6 mb-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5 relative overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          {/* Accent border indicator */}
          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-accent rounded-l-2xl" />

          <div className="flex items-center gap-4 pl-2">
            {/* Avatar with Circular Level Progress Ring */}
            <div className="relative shrink-0 flex items-center justify-center">
              <svg className="w-20 h-20 transform -rotate-90">
                <circle cx="40" cy="40" r="34" stroke="currentColor" strokeWidth="4" className="text-border-subtle" fill="transparent" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-accent transition-all duration-1000"
                  fill="transparent"
                  strokeDasharray={213.6}
                  strokeDashoffset={213.6 - (213.6 * Math.min(100, Math.max(0, Math.round(progress * 100)))) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute w-15 h-15 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent font-black text-2xl shadow-xs">
                {(profile.studentName || 'S')[0]?.toUpperCase()}
              </div>
              {portalLabel && (
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-accent text-card flex items-center justify-center shadow-xs">
                  {profile.isCaptain ? <Crown className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Welcome back</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-bg text-text-secondary border border-border">
                  {Math.round(progress * 100)}% to Lvl {levelNum + 1}
                </span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl lg:text-2xl font-black text-text-primary tracking-tight leading-tight">
                  {profile.studentName || 'Student'}
                </h2>
                {portalLabel && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md bg-accent text-card uppercase tracking-wider">
                    {profile.isCaptain ? <Crown className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                    {portalLabel}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono font-bold text-text-muted mt-0.5">
                {profile.studentId || 'N/A'} &bull; {profile.department || 'N/A'} &bull; {profile.year} Year &bull; Sec {profile.section || 'A'}
              </p>
            </div>
          </div>

          {/* Right: quick stats */}
          <div className="w-full lg:w-auto flex items-center justify-between lg:justify-end gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-border">
            <div className="text-center px-4 py-2.5 rounded-xl bg-bg border border-border flex-1 lg:flex-none min-w-[90px]">
              <div className="text-2xl font-black text-accent">{displayXp}</div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Total XP</div>
            </div>
            <div className="text-center px-4 py-2.5 rounded-xl bg-bg border border-border flex-1 lg:flex-none min-w-[90px]">
              <div className="text-2xl font-black text-text-primary">#{profile.rank}</div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Rank</div>
            </div>
            <div className="text-center px-4 py-2.5 rounded-xl bg-bg border border-border flex-1 lg:flex-none min-w-[90px]">
              <div className="text-2xl font-black text-text-primary">{displayStreak}</div>
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Streak</div>
            </div>
          </div>
        </div>

        {/* ── Vice Captain / Captain Leadership Banner (if Vice Captain / Captain) ── */}
        {(profile.isCaptain || profile.isViceCaptain) && (
          <div className="bg-card border border-border rounded-2xl p-4 lg:p-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-bg border border-border text-accent flex items-center justify-center shrink-0">
                {profile.isCaptain ? <Crown className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="type-h4 font-bold text-text-primary">
                    {profile.isCaptain ? 'Captain Squad Desk' : 'Vice Captain Co-Leadership Desk'}
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-bg text-text-secondary border border-border uppercase">
                    {teamDetails?.teamName || 'My Squad'}
                  </span>
                </div>
                <p className="type-caption text-text-secondary font-medium">
                  {profile.isCaptain
                    ? 'Manage squad roster, track group XP, and lead team progress'
                    : 'Assist team captain in monitoring squad attendance and member performance'}
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelectTab && onSelectTab(myGroupTabIndex)}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-card rounded-xl type-caption font-bold flex items-center gap-2 transition-colors cursor-pointer shrink-0"
            >
              <Users className="w-4 h-4" />
              <span>Open Squad Roster</span>
            </button>
          </div>
        )}

        {/* ── Main 2-Column Grid ── */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* LEFT COLUMN — 2/3 width */}
          <div className="xl:col-span-2 space-y-6">

            {/* KPI Cards Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Discipline XP', value: displayXp, icon: Shield, color: 'text-text-primary', bg: 'bg-bg', border: 'border-border' },
                { label: 'Leaderboard Rank', value: `#${profile.rank}`, icon: Trophy, color: 'text-text-secondary', bg: 'bg-bg', border: 'border-border' },
                { label: 'Current Stage', value: `Stage ${currentStageNum}`, icon: Target, color: 'text-text-secondary', bg: 'bg-bg', border: 'border-border' },
                { label: 'Active Streaks', value: displayStreak, icon: Flame, color: 'text-text-secondary', bg: 'bg-bg', border: 'border-border' },
              ].map((kpi, i) => (
                <div key={i} className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                  <div className={`w-9 h-9 rounded-xl ${kpi.bg} border ${kpi.border} flex items-center justify-center`}>
                    <kpi.icon className={`w-4.5 h-4.5 ${kpi.color}`} />
                  </div>
                  <div>
                    <div className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</div>
                    <div className="text-xs font-semibold text-text-muted mt-0.5">{kpi.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* XP by Category Chart */}
            <div className="bg-card rounded-2xl border border-border p-5 lg:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-accent-tint border border-accent/20 rounded-lg flex items-center justify-center">
                    <BarChart2 className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-text-primary">XP by Category</h3>
                    <p className="text-xs text-text-muted font-medium">Breakdown of earned points</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold text-text-muted">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#1E293B] inline-block" />Individual</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#64748B] inline-block" />Group</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-[#94A3B8] inline-block" />MUST</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                {[
                  { label: 'Individual XP', value: individualXp },
                  { label: 'Group XP', value: groupXp },
                  { label: 'MUST XP', value: mustXp },
                ].map((item, i) => (
                  <div key={i} className="bg-bg border border-border rounded-xl p-3 text-center">
                    <div className={`text-lg font-black ${i === 0 ? 'text-text-primary' : i === 1 ? 'text-text-secondary' : 'text-text-muted'}`}>{item.value}</div>
                    <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mt-0.5">{item.label}</div>
                  </div>
                ))}
              </div>

              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: '#8A8A8A', fontWeight: 600 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#F6F6F6', radius: 4 }}
                      contentStyle={{ borderRadius: '10px', border: '1px solid #E5E5E5', backgroundColor: '#FFFFFF', color: '#000000', fontSize: '12px', fontWeight: 600, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                    />
                    <Bar dataKey="xp" radius={[6, 6, 0, 0]} maxBarSize={48}>
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Level & Stage Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Level Progress */}
              <div className="bg-card rounded-2xl border border-border p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-bg border border-border rounded-lg flex items-center justify-center">
                      <Stars className="w-4 h-4 text-accent" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Current Milestone</p>
                      <h3 className="text-sm font-black text-text-primary">Level {levelNum} — {levelTitle}</h3>
                    </div>
                  </div>
                  <span className="text-sm font-black text-accent">{Math.round(progress * 100)}%</span>
                </div>
                <div className="h-2.5 w-full bg-bg border border-border rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-accent transition-all duration-700 rounded-full"
                    style={{ width: `${Math.min(100, progress * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs font-semibold text-text-muted">
                  <span>{displayXp} XP earned</span>
                  <span>{levelMaxXp} XP max</span>
                </div>
              </div>

              {/* Stage Progress */}
              {!hasActiveStage ? (
                <div className="bg-card rounded-2xl border border-border p-5 flex flex-col items-center justify-center gap-2 text-center">
                  <LockKeyhole className="w-8 h-8 text-text-muted/50" />
                  <h3 className="text-sm font-black text-text-muted">No Active Stage</h3>
                  <p className="text-xs text-text-muted font-medium">Activities are currently locked.</p>
                </div>
              ) : (
                <div className="bg-card rounded-2xl border border-border p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-bg border border-border rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Active Stage</p>
                        <h3 className="text-sm font-black text-text-primary">Stage {currentStageNum} Progress</h3>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${stagePct >= 100 ? 'bg-bg text-text-secondary border border-border' : 'bg-bg text-text-secondary border border-border'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-text-secondary" />
                      Active
                    </span>
                  </div>
                  <div className="h-2.5 w-full bg-bg border border-border rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full transition-all duration-700 rounded-full ${stagePct >= 100 ? 'bg-text-secondary' : 'bg-accent'}`}
                      style={{ width: `${Math.min(100, stagePct)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-text-muted">{displayXp} / {activeStageExpectedXp} XP</span>
                    <span className={stagePct >= 100 ? 'text-text-secondary' : 'text-accent'}>{stagePct}% Complete</span>
                  </div>
                </div>
              )}
            </div>

            {/* Recent Point Actions */}
            <div className="bg-card rounded-2xl border border-border p-5 lg:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-bg border border-border rounded-lg flex items-center justify-center">
                    <Clock className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-text-primary">Recent Point Actions</h3>
                    <p className="text-xs text-text-muted font-medium">Your latest XP activity</p>
                  </div>
                </div>
              </div>
              {history.length === 0 ? (
                <div className="py-10 text-center text-text-muted">
                  <Activity className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">No recent activities recorded</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.slice(0, 6).map((log, idx) => {
                    const isPositive = log.xpPoints > 0;
                    return (
                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-bg border border-border hover:border-text-muted/30 transition-colors">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isPositive ? 'bg-bg border border-border text-text-secondary' : 'bg-accent-tint text-accent'}`}>
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-text-primary truncate">{log.activityName || log.category}</div>
                          <div className="text-xs text-text-muted font-medium">
                            {new Date(log.submittedAt).toLocaleDateString()} &bull; {log.status}
                          </div>
                        </div>
                        <div className={`text-sm font-black ${isPositive ? 'text-text-primary' : 'text-accent'}`}>
                          {isPositive ? '+' : ''}{log.xpPoints} XP
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN — 1/3 width */}
          <div className="space-y-6">

            {/* My Group Card */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-bg border border-border rounded-lg flex items-center justify-center">
                    <Users className="w-4 h-4 text-accent" />
                  </div>
                  <h3 className="text-sm font-black text-text-primary">My Group</h3>
                </div>
                {onSelectTab && (
                  <button
                    onClick={() => onSelectTab(3)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-hover transition-colors cursor-pointer"
                  >
                    View <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {teamDetails ? (
                <div
                  onClick={() => onSelectTab && onSelectTab(3)}
                  className="cursor-pointer space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-text-primary text-base">{teamDetails.teamName || 'Unnamed Team'}</h4>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-bg text-text-primary border border-border uppercase">
                      {teamDetails.stage || 'STAGE 1'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {['🏢 ' + (teamDetails.department || 'N/A'), '👥 ' + (teamDetails.currentMemberCount || 0) + ' Members'].map((t, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-bg border border-border text-[11px] font-semibold text-text-secondary">{t}</span>
                    ))}
                  </div>

                  <div className="h-px bg-border" />

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase mb-0.5">Captain</p>
                      <p className="text-xs font-bold text-text-primary truncate">{teamDetails.captainName || 'Not Assigned'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-muted uppercase mb-0.5">Vice Captain</p>
                      <p className="text-xs font-bold text-text-primary truncate">{teamDetails.viceCaptainName || 'Not Assigned'}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-bg border border-border rounded-xl p-3">
                    <span className="text-xs font-bold text-text-muted">Team Total XP</span>
                    <span className="text-base font-black text-text-secondary">{teamDetails.totalTeamXp ?? 0} XP</span>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-text-muted">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-semibold">No Team Assigned</p>
                </div>
              )}
            </div>

            {/* XP Summary Card */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-bg border border-border rounded-lg flex items-center justify-center">
                  <Activity className="w-4 h-4 text-accent" />
                </div>
                <h3 className="text-sm font-black text-text-primary">XP Summary</h3>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: 'Individual XP', value: individualXp, bar: 'bg-[#1E293B]', pct: displayXp > 0 ? (individualXp / displayXp) * 100 : 0 },
                  { label: 'Group XP', value: groupXp, bar: 'bg-[#64748B]', pct: displayXp > 0 ? (groupXp / displayXp) * 100 : 0 },
                  { label: 'MUST XP', value: mustXp, bar: 'bg-[#94A3B8]', pct: displayXp > 0 ? (mustXp / displayXp) * 100 : 0 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-semibold text-text-secondary">{item.label}</span>
                      <span className="text-xs font-black text-text-primary">{item.value} XP</span>
                    </div>
                    <div className="h-1.5 bg-bg border border-border rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.bar} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(100, item.pct)}%` }}
                      />
                    </div>
                  </div>
                ))}

                <div className="h-px bg-border my-1" />
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-text-primary">Total XP</span>
                  <span className="text-base font-black text-accent">{displayXp} XP</span>
                </div>
              </div>
            </div>

            {/* Active Streaks */}
            <div className="bg-card rounded-2xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-bg border border-border rounded-lg flex items-center justify-center">
                    <Flame className="w-4 h-4 text-text-muted" />
                  </div>
                  <h3 className="text-sm font-black text-text-primary">Active Streaks</h3>
                </div>
                {onOpenStreaks && (
                  <button
                    onClick={onOpenStreaks}
                    className="inline-flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-hover cursor-pointer"
                  >
                    All <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {streaks.length === 0 ? (
                <p className="text-xs text-text-muted font-medium py-4 text-center">No active streaks recorded.</p>
              ) : (
                <div className="space-y-2">
                  {streaks.slice(0, 4).map((s, idx) => (
                    <div key={idx} className={`flex items-center justify-between p-2.5 rounded-xl border ${s.isBroken ? 'border-border bg-bg' : 'border-orange-100 bg-orange-50/50'}`}>
                      <span className="text-xs font-semibold text-text-primary truncate">{s.streakType?.replace('_', ' ')}</span>
                      <span className={`text-xs font-black flex items-center gap-1 ${s.isBroken ? 'text-text-muted' : 'text-orange-600'}`}>
                        {s.isBroken ? '❄️ Broken' : `🔥 ${s.currentStreak}d`}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Activity Streaks */}
              {activityStreaks.length > 0 && (
                <>
                  <div className="h-px bg-border my-3" />
                  <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Activity Streaks</p>
                  <div className="space-y-2">
                    {activityStreaks.slice(0, 3).map((s, idx) => {
                      const count = Number(s?.currentStreak ?? 0);
                      const isBroken = count === 0;
                      return (
                        <div key={idx} className={`flex items-center justify-between p-2.5 rounded-xl border ${isBroken ? 'border-border bg-bg' : 'border-accent/10 bg-accent-tint/30'}`}>
                          <span className="text-xs font-semibold text-text-primary truncate">{s?.activityName || 'Activity'}</span>
                          <span className={`text-xs font-black ${isBroken ? 'text-text-muted' : 'text-accent'}`}>
                            {isBroken ? '💤 No Streak' : `⚡ ${count}x`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
