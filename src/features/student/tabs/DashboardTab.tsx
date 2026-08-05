import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Shield, Stars, Users, Activity, TrendingUp, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAuth } from '../../../store/authContext';
import { useXpStore } from '../../../store/xpStore';
import apiClient from '../../../services/apiClient';

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

const LEVEL_THRESHOLDS = [
  { level: 1, title: "Explorer", min: 0, max: 100 },
  { level: 2, title: "Builder", min: 101, max: 500 },
  { level: 3, title: "Innovator", min: 501, max: 1500 },
  { level: 4, title: "Specialist", min: 1501, max: 3000 },
  { level: 5, title: "Leader", min: 3001, max: 5000 },
  { level: 6, title: "Mentor", min: 5001, max: 7000 },
  { level: 7, title: "Architect", min: 7001, max: 10000 },
  { level: 8, title: "Industry Ready", min: 10001, max: 99999 },
];

interface DashboardTabProps {
  onSelectTab?: (tabIndex: number) => void;
  onOpenStreaks?: () => void;
}

export default function DashboardTab({ onSelectTab, onOpenStreaks }: DashboardTabProps) {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { xpByCategory, streaks, history, isLoading: isXpLoading, totalXp, fetchSummary, fetchHistory, fetchStreaks } = useXpStore();

  const [isLoading, setIsLoading] = useState(true);
  const [teamDetails, setTeamDetails] = useState<any>(null);
  const [profile, setProfile] = useState<ProfileData>({
    studentName: "",
    studentId: "",
    department: "",
    section: "",
    year: "",
    score: 0,
    rank: 1,
    currentStage: 1,
    isCaptain: false,
    isViceCaptain: false,
  });

  const fetchTeamDetails = async (studentId?: string) => {
    try {
      const res = await apiClient.get('/api/v1/teams/my-team/details');
      if (res.data.success && res.data.data) {
        setTeamDetails(res.data.data);
        return;
      }
    } catch (err) {
      try {
        const fallback = await apiClient.get('/api/v1/teams/my-team');
        if (fallback.data.success && fallback.data.data) {
          const t = fallback.data.data;
          setTeamDetails({
            teamName: t.name || t.teamName || 'My Team',
            captainName: t.captainName || t.captain?.fullName || 'Not Assigned',
            viceCaptainName: t.viceCaptainName || t.viceCaptain?.fullName || 'Not Assigned',
            totalTeamXp: t.totalTeamXp || t.teamXp || 0,
            stage: t.stage || 'Stage 1',
            department: t.departmentName || t.department?.name || profile.department || 'N/A',
            section: t.sectionName || t.section?.sectionName || profile.section || 'N/A',
            currentMemberCount: t.memberCount || (t.members?.length || 0),
            members: t.members || [],
          });
          return;
        }
      } catch (err2) {
        if (studentId) {
          try {
            const fallback2 = await apiClient.get(`/api/v1/teams/student/${studentId}`);
            if (fallback2.data.success && fallback2.data.data) {
              setTeamDetails(fallback2.data.data);
            }
          } catch (err3) {
            console.error("Failed to load team details", err3);
          }
        }
      }
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      try {
        if (token === 'debug_token') {
          setIsLoading(false);
          return; // Skip fetch for mock login
        }
        fetchTeamDetails();
        const res = await apiClient.get('/api/v1/auth/me');
        if (res.data.success && res.data.data) {
          const p = res.data.data;
          const regNo = p.username || p.sprNo || "";
          setProfile(prev => ({
            ...prev,
            studentName: p.fullName || prev.studentName,
            studentId: regNo,
            section: p.section || prev.section,
            year: p.year || prev.year,
            department: p.department || prev.department,
            score: p.score ?? p.totalXp ?? prev.score,
            rank: p.rank || prev.rank,
            currentStage: p.stage ?? prev.currentStage,
            isCaptain: p.isCaptain ?? (p.teamRole === 'CAPTAIN'),
            isViceCaptain: p.isViceCaptain ?? (p.teamRole === 'VICE_CAPTAIN'),
            teamRole: p.teamRole,
          }));

          if (regNo) {
            fetchSummary(regNo);
            fetchHistory(regNo);
            fetchStreaks(regNo);
            fetchTeamDetails(regNo);
          }
        }
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (profile.studentId && profile.studentId !== "24IT077" && !isLoading) {
      fetchSummary(profile.studentId);
      fetchHistory(profile.studentId);
      fetchStreaks(profile.studentId);
      fetchTeamDetails(profile.studentId);
    }
  }, [profile.studentId, isLoading, fetchSummary, fetchHistory, fetchStreaks]);

  const getLevelInfo = (xp: number) => {
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (xp <= LEVEL_THRESHOLDS[i].max) {
        return LEVEL_THRESHOLDS[i];
      }
    }
    return LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  };

  const displayXp = totalXp || profile.score || 0;
  const levelInfo = getLevelInfo(displayXp);
  const progress = Math.min(1, Math.max(0, (displayXp - levelInfo.min) / (levelInfo.max - levelInfo.min)));

  const maxStreak = (streaks || []).reduce((max, s) => {
    const current = s?.currentStreak || 0;
    return !s?.isBroken && current > max ? current : max;
  }, 0);
  const displayStreak = maxStreak > 0 ? maxStreak : 37;

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
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-md">
        <h1 className="text-xl font-bold">Student Dashboard</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const streaksEl = document.getElementById('streaks-section');
              if (streaksEl) streaksEl.scrollIntoView({ behavior: 'smooth' });
            }}
            className="flex items-center gap-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-black text-sm cursor-pointer transition-colors"
            title="Active Streaks"
          >
            <span>🔥</span>
            <span>{displayStreak}</span>
          </button>
          <button
            onClick={() => {
              if (onSelectTab) {
                onSelectTab(3);
              } else if (profile.isCaptain) {
                navigate('/captain');
              } else {
                const groupEl = document.getElementById('my-group-section');
                if (groupEl) groupEl.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
            title="My Group"
          >
            <Users className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      <div className="p-5 max-w-3xl mx-auto space-y-6">
        {/* Welcome Section */}
        <div>
          <p className="text-slate-500 font-medium text-sm mb-1">Welcome back,</p>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-slate-800">{profile.studentName}</h2>
            {profile.isCaptain ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm">
                <Stars className="w-3.5 h-3.5" />
                👑 CAPTAIN
              </span>
            ) : profile.isViceCaptain ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-slate-500 to-slate-600 text-white shadow-sm">
                <Award className="w-3.5 h-3.5 text-slate-200" />
                🥈 VICE CAPTAIN
              </span>
            ) : null}
          </div>
        </div>

        {/* Discipline Score Card */}
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-3xl p-6 text-white shadow-lg shadow-indigo-500/30">
          <div className="flex justify-between items-center mb-2">
            <span className="text-indigo-100 font-medium">Discipline Score</span>
            <Shield className="w-6 h-6 text-white/90" />
          </div>
          <div className="text-4xl font-bold mb-5">{displayXp} Points</div>

          <div className="h-px bg-white/20 mb-4" />

          <div className="flex justify-between items-center text-sm">
            <div>
              <div className="text-indigo-200 text-xs mb-1">Department</div>
              <div className="font-semibold">{profile.department}</div>
            </div>
            <div className="text-right">
              <div className="text-indigo-200 text-xs mb-1">Section & Year</div>
              <div className="font-semibold">{profile.year} Year - Sec {profile.section}</div>
            </div>
          </div>
        </div>

        {/* Level Progress */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-slate-800">Level {levelInfo.level} — {levelInfo.title}</h3>
            <Stars className="w-6 h-6 text-indigo-500" />
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-indigo-600 transition-all duration-500 rounded-full"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {displayXp} / {levelInfo.max} XP to next level
          </p>
        </div>

        {/* Stage Progress Card (Matching Flutter) */}
        {(() => {
          const currentStage = Math.max(1, profile.currentStage || 3);
          const stageMaxXp = currentStage === 3 ? 60 : (currentStage === 1 ? 500 : 1200);
          const stagePct = Math.min(100, Math.round((displayXp / stageMaxXp) * 100));

          return (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-slate-800 text-base">Stage {currentStage} Progress</h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  Ended
                </span>
              </div>

              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${stagePct >= 100 ? 'bg-emerald-500' : 'bg-indigo-600'}`}
                  style={{ width: `${Math.min(100, stagePct)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-sm font-bold">
                <span className="text-slate-700">{displayXp} / {stageMaxXp} XP</span>
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
              <div className="text-xs text-slate-500 font-medium mb-1">Leaderboard Rank</div>
              <div className="text-lg font-bold text-slate-800">#{profile.rank}</div>
            </div>
          </div>
          <div className="bg-teal-50 rounded-2xl p-4 flex items-center gap-4">
            <div className="p-3 bg-teal-100/50 rounded-full">
              <Shield className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <div className="text-xs text-slate-500 font-medium mb-1">Active Stage</div>
              <div className="text-lg font-bold text-slate-800">Stage {Math.max(1, profile.currentStage)}</div>
            </div>
          </div>
        </div>

        {/* Active Streaks */}
        <div id="streaks-section">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-slate-800">Active Streaks</h3>
            {onOpenStreaks && (
              <button
                onClick={onOpenStreaks}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1"
              >
                <span>View All Records</span>
                <span>→</span>
              </button>
            )}
          </div>
          {streaks.length === 0 ? (
            <p className="text-slate-500 text-sm">No active streaks recorded.</p>
          ) : (
            <div className="flex overflow-x-auto gap-3 pb-2 snap-x">
              {streaks.map((s, idx) => (
                <div key={idx} className={`snap-start shrink-0 w-32 p-3 rounded-2xl border-2 bg-white ${s.isBroken ? 'border-red-200' : 'border-green-200'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-slate-800 truncate w-20">
                      {s.streakType.replace('_', ' ')}
                    </span>
                    <span className="text-xs">{s.isBroken ? "❄️" : "🔥"}</span>
                  </div>
                  <div className={`text-sm font-bold ${s.isBroken ? 'text-red-500' : 'text-green-500'}`}>
                    {s.isBroken ? "Broken" : `${s.currentStreak} Days`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* XP Summary Grid */}
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-slate-800">XP Summary</h3>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center p-2.5 rounded-xl border bg-purple-500/5 border-purple-500/20">
              <div className="w-1.5 self-stretch rounded-full mr-2.5 bg-purple-500" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-slate-500 truncate">Individual XP</div>
                <div className="text-sm font-bold text-purple-600">{individualXp} XP</div>
              </div>
            </div>
            <div className="flex items-center p-2.5 rounded-xl border bg-green-500/5 border-green-500/20">
              <div className="w-1.5 self-stretch rounded-full mr-2.5 bg-green-500" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-slate-500 truncate">Group XP</div>
                <div className="text-sm font-bold text-green-600">{groupXp} XP</div>
              </div>
            </div>
            <div className="flex items-center p-2.5 rounded-xl border bg-amber-500/5 border-amber-500/20">
              <div className="w-1.5 self-stretch rounded-full mr-2.5 bg-amber-500" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-slate-500 truncate">MUST XP</div>
                <div className="text-sm font-bold text-amber-600">{mustXp} XP</div>
              </div>
            </div>
            <div className="flex items-center p-2.5 rounded-xl border bg-blue-500/5 border-blue-500/20">
              <div className="w-1.5 self-stretch rounded-full mr-2.5 bg-blue-500" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-slate-500 truncate">Total XP</div>
                <div className="text-sm font-bold text-blue-600">{displayXp} XP</div>
              </div>
            </div>
          </div>
          <div className="h-px bg-slate-100 mb-4" />
          <div className="flex justify-between items-center">
            <span className="font-bold text-slate-800 text-sm">Total XP</span>
            <span className="font-bold text-indigo-600 text-lg">{displayXp} XP</span>
          </div>
        </div>

        {/* Category Bar Chart */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3">XP by Category</h3>
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
            <h3 className="text-lg font-bold text-slate-800">My Group</h3>
            {onSelectTab && (
              <button
                onClick={() => onSelectTab(3)}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
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
                    <h4 className="font-bold text-slate-800 text-base">{teamDetails.teamName || 'Unnamed Team'}</h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
                    {teamDetails.stage || 'STAGE 1'}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2 text-xs font-semibold">
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

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-slate-400 font-semibold mb-0.5">Captain</div>
                    <div className="font-bold text-slate-800 truncate">{teamDetails.captainName || 'Not Assigned'}</div>
                  </div>
                  <div>
                    <div className="text-slate-400 font-semibold mb-0.5">Vice Captain</div>
                    <div className="font-bold text-slate-800 truncate">{teamDetails.viceCaptainName || 'Not Assigned'}</div>
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center text-xs font-bold bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-slate-600">Total Group XP</span>
                  <span className="text-emerald-600 text-sm font-black">
                    {teamDetails.totalTeamXp ?? teamDetails.teamXp ?? 0} XP
                  </span>
                </div>
              </>
            ) : (
              <div className="text-center py-6 text-slate-400 font-medium text-sm">
                <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <div>No Team Assigned</div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div>
          <h3 className="text-lg font-bold text-slate-800 mb-3">Recent Point Actions</h3>
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
                      <div className="font-semibold text-slate-800 truncate text-sm">
                        {log.activityName || log.category}
                      </div>
                      <div className="text-xs text-slate-500">
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
