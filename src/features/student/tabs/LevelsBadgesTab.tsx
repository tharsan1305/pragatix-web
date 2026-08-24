import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { Lock, Check, Zap, ShieldCheck, HelpCircle, Clock, X, Award, Link2, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../store/authContext';
import apiClient from '../../../services/apiClient';

const PATHWAYS = [
  { name: "Core Engineering", domain: "Domain-specific (Mech/Civil/Aero/EEE/ECE)", categories: "Academic XP, Skill XP", alignment: "Faculty Mentor (dept. HoD)" },
  { name: "Cybersecurity", domain: "Security, ethical hacking", categories: "Skill XP, Certification XP", alignment: "Technical Coordinator" },
  { name: "Data Science", domain: "Analytics, visualization", categories: "Skill XP, Research XP", alignment: "Technical Coordinator" },
  { name: "Entrepreneurship", domain: "Startup, product thinking", categories: "Innovation XP, Leadership XP", alignment: "Senior Mentor (Stage 3)" },
  { name: "Research", domain: "Academic research, patents", categories: "Research XP, Innovation XP", alignment: "Research Committee" }
];

const DEFAULT_BADGES_BY_TIER: Record<string, any[]> = {
  Foundation: [
    {
      id: 1,
      name: "Attendance Warrior",
      description: "Maintain 95% attendance for a full calendar month.",
      authority: "Class Coordinator",
      rarity: "Common",
      tier: "Foundation",
    },
    {
      id: 2,
      name: "Participation Star",
      description: "Actively participate and answer questions in all class hours for a week.",
      authority: "Class Coordinator",
      rarity: "Common",
      tier: "Foundation",
    },
    {
      id: 3,
      name: "Punctuality Pro",
      description: "Arrive before the bell rings without any late entries for 2 consecutive weeks.",
      authority: "Class Coordinator",
      rarity: "Common",
      tier: "Foundation",
    },
  ],
  Achievement: [
    {
      id: 4,
      name: "Code Ninja",
      description: "Complete daily coding challenges on C/Python for 15 consecutive days.",
      authority: "Technical Coordinator",
      rarity: "Uncommon",
      tier: "Achievement",
    },
    {
      id: 5,
      name: "GPA Master",
      description: "Score a GPA of 8.5 or higher in the semester examinations.",
      authority: "HOD / Academic Mentor",
      rarity: "Uncommon",
      tier: "Achievement",
    },
    {
      id: 6,
      name: "Consistency Champion",
      description: "Maintain all active daily streaks for 30 consecutive days.",
      authority: "Class Coordinator",
      rarity: "Uncommon",
      tier: "Achievement",
    },
    {
      id: 7,
      name: "Hackathon Finisher",
      description: "Participate and submit a working project in an internal department hackathon.",
      authority: "Technical Coordinator",
      rarity: "Uncommon",
      tier: "Achievement",
    },
  ],
  Excellence: [
    {
      id: 8,
      name: "Full Stack Warrior",
      description: "Build and host a web application with complete frontend and backend services.",
      authority: "Technical Coordinator",
      rarity: "Rare",
      tier: "Excellence",
    },
    {
      id: 9,
      name: "Interview Slayer",
      description: "Clear the first-round technical mock interviews conducted by internal placement cell.",
      authority: "Placement Cell",
      rarity: "Rare",
      tier: "Excellence",
    },
    {
      id: 10,
      name: "Internship Achiever",
      description: "Secure and successfully complete a verified 4-week industry internship.",
      authority: "HOD / Placement Coordinator",
      rarity: "Rare",
      tier: "Excellence",
    },
    {
      id: 11,
      name: "Event Commander",
      description: "Lead and organize a technical/non-technical program or seminar in the college.",
      authority: "Program Coordinator",
      rarity: "Rare",
      tier: "Excellence",
    },
  ],
  Elite: [
    {
      id: 12,
      name: "Team Captain Badge",
      description: "Serve as a team captain and lead the group to an Elite status (4500+ XP).",
      authority: "HOD / Academic Dean",
      rarity: "Very Rare",
      tier: "Elite",
    },
    {
      id: 13,
      name: "Mentor Hero",
      description: "Conduct peer teaching and mentor at least 5 junior students to improve their grades.",
      authority: "Faculty Mentor",
      rarity: "Very Rare",
      tier: "Elite",
    },
    {
      id: 14,
      name: "Research Pioneer",
      description: "Submit a research paper draft accepted/reviewed by the department committee.",
      authority: "Research Committee",
      rarity: "Very Rare",
      tier: "Elite",
    },
    {
      id: 15,
      name: "Innovation Catalyst",
      description: "Develop a working prototype in the CoE/D2P Lab validated by an industry mentor.",
      authority: "CoE / D2P Lab Mentor",
      rarity: "Very Rare",
      tier: "Elite",
    },
  ],
  Legacy: [
    {
      id: 16,
      name: "Startup Builder",
      description: "Create a viable project proposal incubated or registered as a student startup.",
      authority: "Incubation Center / Principal",
      rarity: "Legendary",
      tier: "Legacy",
    },
    {
      id: 17,
      name: "Placement Champion",
      description: "Get placed in a tier-1 company with a package exceeding threshold limit.",
      authority: "Placement Director",
      rarity: "Legendary",
      tier: "Legacy",
    },
    {
      id: 18,
      name: "JJCET Legend",
      description: "Reach a lifetime cumulative score of 3500+ XP points.",
      authority: "Dean of Academics",
      rarity: "Legendary",
      tier: "Legacy",
    },
    {
      id: 19,
      name: "Alumni Pioneer",
      description: "Act as institutional ambassador and secure industry linkage / MoUs for college.",
      authority: "Institutional Ambassador",
      rarity: "Legendary",
      tier: "Legacy",
    },
  ],
};

export default function LevelsBadgesTab() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'levels' | 'badges'>('levels');
  const [isLoading, setIsLoading] = useState(true);
  
  const [selectedPathway, setSelectedPathway] = useState<string>("None");

  const [badgesByTier, setBadgesByTier] = useState<Record<string, any[]>>(DEFAULT_BADGES_BY_TIER);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState<(number | string)[]>([]);
  const [pendingBadgeIds, setPendingBadgeIds] = useState<(number | string)[]>([]);
  
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedBadgeObj, setSelectedBadgeObj] = useState<any>(null);
  const [selectedBadgeToClaim, setSelectedBadgeToClaim] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [progressionData, setProgressionData] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const progRes = await apiClient.get('/api/v1/student-level/progression');
      if (progRes.data?.success && progRes.data?.data) {
        setProgressionData(progRes.data.data);
      }
    } catch {
      // Ignore
    }

    try {
      const allBadgesRes = await apiClient.get('/api/v1/badges');
      const rawData = allBadgesRes.data?.data || allBadgesRes.data;
      if (Array.isArray(rawData) && rawData.length > 0) {
        const fetchedBadges: any[] = rawData;
        const grouped: Record<string, any[]> = JSON.parse(JSON.stringify(DEFAULT_BADGES_BY_TIER));
        for (const b of fetchedBadges) {
          const tier = b.tier || b.badgeTier || "Foundation";
          if (!grouped[tier]) grouped[tier] = [];
          const existingIdx = grouped[tier].findIndex((item: any) => 
            (b.id && item.id === b.id) || 
            (b.name && item.name.toLowerCase() === b.name.toLowerCase())
          );
          const mappedBadge = {
            id: b.id,
            name: b.name || b.badgeName,
            description: b.description || 'Maintain high standards to earn this badge.',
            authority: b.approvalAuthority || b.authority || 'Faculty Mentor',
            rarity: b.rarity || 'Common',
            tier: tier,
          };
          if (existingIdx >= 0) {
            grouped[tier][existingIdx] = { ...grouped[tier][existingIdx], ...mappedBadge };
          } else {
            grouped[tier].push(mappedBadge);
          }
        }
        setBadgesByTier(grouped);
      }
    } catch (e) {
      logger.warn("Could not fetch badges from server", e);
    }

    try {
      const earnedSet = new Set<string | number>();
      const pendingSet = new Set<string | number>();

      const [badgesRes, myReqsRes] = await Promise.allSettled([
        apiClient.get('/api/v1/badges/student/me'),
        apiClient.get('/api/badge-requests/my'),
      ]);

      if (badgesRes.status === 'fulfilled' && badgesRes.value.data?.success && Array.isArray(badgesRes.value.data.data)) {
        badgesRes.value.data.data.forEach((b: any) => {
          const id = b.badgeId || b.badge?.id || b.id;
          if (b.status === "APPROVED") earnedSet.add(id);
          if (b.status === "PENDING") pendingSet.add(id);
        });
      }

      if (myReqsRes.status === 'fulfilled' && myReqsRes.value.data?.success && Array.isArray(myReqsRes.value.data.data)) {
        myReqsRes.value.data.data.forEach((r: any) => {
          const id = r.badgeId || r.badge?.id || r.id;
          if (r.status === "APPROVED") earnedSet.add(id);
          if (r.status === "PENDING") pendingSet.add(id);
        });
      }

      setEarnedBadgeIds(Array.from(earnedSet));
      setPendingBadgeIds(Array.from(pendingSet));
    } catch {
      // Fallback
    }

    setIsLoading(false);
  };

  const submitBadgeClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBadgeToClaim || !evidenceUrl.trim()) {
      toast.error("Please select a badge and provide evidence link.");
      return;
    }

    const allOptions = Object.values(badgesByTier).flat();
    const selectedObj = allOptions.find(b => String(b.id) === String(selectedBadgeToClaim) || b.name === selectedBadgeToClaim);
    const badgeId = selectedObj?.id;
    const badgeName = selectedObj?.name || selectedBadgeToClaim;

    if (!badgeId && !badgeName) {
      toast.error("Could not identify the selected badge. Please try again.");
      return;
    }

    let validUrl = evidenceUrl.trim();
    if (!validUrl.startsWith('http://') && !validUrl.startsWith('https://')) {
      validUrl = 'https://' + validUrl;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Submitting badge request...");

    try {
      let res;
      try {
        res = await apiClient.post('/api/badge-requests', {
          badgeId: typeof badgeId === 'number' ? badgeId : undefined,
          badgeName,
          proofLink: validUrl
        });
      } catch {
        res = await apiClient.post('/api/v1/badges/submit', {
          badgeName,
          evidenceUrl: validUrl
        });
      }

      toast.dismiss(toastId);
      if (res?.data?.success === true || res?.status === 200) {
        toast.success("Badge request submitted successfully.");
        if (badgeId) {
          setPendingBadgeIds(prev => [...prev, badgeId]);
        }
        fetchData();
      } else {
        toast.error(res?.data?.message || "Failed to submit badge request.");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error("Badge request submission error:", e);
      toast.error(e.response?.data?.message || e.message || "Failed to submit badge request.");
    } finally {
      setIsSubmitting(false);
      setIsSubmitModalOpen(false);
      setSelectedBadgeToClaim("");
      setEvidenceUrl("");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (activeTab === 'levels' && !progressionData) {
    return (
      <div className="bg-slate-50 min-h-screen flex items-center justify-center p-8">
        <p className="text-slate-500 font-medium type-body-sm">Progression data unavailable</p>
      </div>
    );
  }

  const currentLevelNum = progressionData?.currentLevel ?? 1;
  const currentLevelTitle = progressionData?.currentLevelName ?? '';
  const displayTotalXp = progressionData?.totalXp ?? 0;
  const xpMax = progressionData?.currentLevelMaxXp ?? 0;
  const remainingXp = progressionData?.remainingXp ?? 0;
  const levelProgress = (progressionData?.progressPercentage ?? 0) / 100;
  const isEligibleForPathway = currentLevelNum >= 3;

  const dynamicLevelsList = [
    ...(progressionData?.unlockedLevels || []).map((l: any) => ({ ...l, isUnlockedApi: true })),
    ...(progressionData?.lockedLevels || []).map((l: any) => ({ ...l, isUnlockedApi: false })),
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-slate-800 text-white sticky top-0 z-10 shadow-md">
        <div className="px-6 py-4">
          <h1 className="type-h4">Levels & Badges</h1>
        </div>
        <div className="flex border-t border-slate-700">
          <button 
            className={`flex-1 py-3 type-body-sm font-bold border-b-2 transition-colors ${activeTab === 'levels' ? 'border-indigo-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('levels')}
          >
            Level & Pathway
          </button>
          <button 
            className={`flex-1 py-3 type-body-sm font-bold border-b-2 transition-colors ${activeTab === 'badges' ? 'border-indigo-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            onClick={() => setActiveTab('badges')}
          >
            Badge Collection
          </button>
        </div>
      </div>

      <div className="p-5 max-w-4xl mx-auto space-y-6">
        {activeTab === 'levels' && (
          <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Level Progress Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-3xl p-6 shadow-lg shadow-indigo-500/20 text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="type-caption font-bold text-indigo-200 tracking-wider mb-1">CURRENT LEVEL</div>
                  <div className="type-h3">Lvl {currentLevelNum}: {currentLevelTitle}</div>
                </div>
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-amber-300 fill-amber-300" />
                </div>
              </div>
              
              <div className="flex justify-between type-body-sm font-bold mb-2">
                <span>{displayTotalXp} XP Points</span>
                <span className="text-indigo-200">
                  {progressionData?.isMaxLevel ? 'Maximum Level Achieved' : `Target: ${xpMax} XP (Remaining: ${remainingXp})`}
                </span>
              </div>
              
              <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-1000" 
                  style={{ width: `${Math.min(100, Math.max(0, levelProgress * 100))}%` }}
                />
              </div>
            </div>

            {/* Pathways */}
            <div>
              <h2 className="type-h4 text-slate-800">Skill Pathways</h2>
              <p className="type-body-sm text-slate-500 mb-3">Select your focus domain starting from Level 3 (Innovator).</p>
              
              {!isEligibleForPathway ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 flex gap-3 items-center text-slate-500">
                  <Lock className="w-5 h-5 shrink-0" />
                  <span className="type-body-sm font-medium">Unlocks at Level 3 (Innovator) — 501+ XP</span>
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                  <label className="type-form-label type-body-sm font-bold text-slate-800 flex gap-2 items-center">
                    <HelpCircle className="w-4 h-4 text-indigo-600" /> Choose Your Active Pathway
                  </label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                    value={selectedPathway}
                    onChange={e => setSelectedPathway(e.target.value)}
                  >
                    <option value="None">Select a Skill Pathway</option>
                    {PATHWAYS.map(p => (
                      <option key={p.name} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                  
                  {selectedPathway !== "None" && (() => {
                    const activeP = PATHWAYS.find(p => p.name === selectedPathway);
                    if (!activeP) return null;
                    return (
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 type-body-sm text-indigo-900 mt-2 space-y-1">
                        <div><span className="font-bold opacity-70">Domain:</span> {activeP.domain}</div>
                        <div><span className="font-bold opacity-70">Focus XP:</span> {activeP.categories}</div>
                        <div><span className="font-bold opacity-70">Mentor:</span> {activeP.alignment}</div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>

            {/* Progression Map */}
            <div>
              <h2 className="type-h4 text-slate-800 mb-4">Level Progression Map</h2>
              <div className="space-y-0">
                {dynamicLevelsList.map((lvl: any, idx: number) => {
                  const lvlNum = lvl.levelNumber ?? lvl.level;
                  const lvlTitle = lvl.title;
                  const isCurrent = lvlNum === currentLevelNum;
                  const isCompleted = lvl.isUnlockedApi !== undefined ? (lvl.isUnlockedApi && !isCurrent) : (lvlNum < currentLevelNum);
                  const isLocked = lvl.isUnlockedApi !== undefined ? (!lvl.isUnlockedApi && !isCurrent) : (lvlNum > currentLevelNum);
                  const range = `${lvl.xpMin} - ${lvl.xpMax === 99999 ? '10000+' : lvl.xpMax}`;
                  const objective = lvl.primaryObjective || lvl.objective || 'Build skills & discipline';
                  const unlocks = lvl.keyUnlocks || lvl.unlocks || 'Level unlocks';
                  const stageText = lvl.stage ? (typeof lvl.stage === 'number' ? `STAGE ${lvl.stage}` : String(lvl.stage).toUpperCase()) : 'STAGE 1';

                  return (
                    <div key={lvlNum} className="flex gap-4 group">
                      <div className="flex flex-col items-center">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                          isCompleted ? 'bg-emerald-500 border-emerald-500 text-white' :
                          isCurrent ? 'bg-indigo-600 border-white ring-4 ring-indigo-100 text-white' :
                          'bg-slate-200 border-transparent text-slate-500'
                        }`}>
                          {isCompleted ? <Check className="w-3.5 h-3.5" /> : 
                           isCurrent ? <Zap className="w-3.5 h-3.5" /> : 
                           <Lock className="w-3.5 h-3.5" />}
                        </div>
                        {idx < dynamicLevelsList.length - 1 && (
                          <div className={`w-0.5 h-full min-h-[80px] my-1 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                        )}
                      </div>
                      
                      <div className={`flex-1 pb-6 ${isLocked ? 'opacity-60' : ''}`}>
                        <div className={`rounded-2xl p-4 border transition-all ${
                          isCurrent ? 'bg-white border-indigo-200 shadow-sm shadow-indigo-100' : 
                          'bg-white border-slate-200'
                        }`}>
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="font-heading font-bold text-slate-800 text-[15px]">Lvl {lvlNum}: {lvlTitle}</h3>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              isCurrent ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-500'
                            }`}>
                              {stageText}
                            </span>
                          </div>
                          <div className="text-emerald-500 type-caption font-bold mb-3">XP Range: {range}</div>
                          <div className="type-body-sm text-slate-600 mb-2"><span className="font-medium opacity-80">Objective:</span> {objective}</div>
                          <div className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                            Unlocks: {unlocks}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'badges' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {Object.entries(badgesByTier).map(([tierName, badges]) => (
              <div key={tierName}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="type-h4 text-slate-800">{tierName} Tier</h2>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.map(badge => {
                    const isEarned = earnedBadgeIds.some((id) => String(id) === String(badge.id));
                    const isPending = pendingBadgeIds.some((id) => String(id) === String(badge.id));

                    return (
                      <div
                        key={badge.id}
                        onClick={() => {
                          setSelectedBadgeObj(badge);
                          setSelectedBadgeToClaim(badge.id);
                          setIsSubmitModalOpen(true);
                        }}
                        className={`rounded-2xl border p-4 flex flex-col justify-between relative overflow-hidden transition-all cursor-pointer hover:shadow-md ${
                          isEarned ? 'bg-indigo-50/70 border-indigo-200 shadow-sm' :
                          isPending ? 'bg-amber-50/70 border-amber-200 shadow-sm' :
                          'bg-white border-slate-200 opacity-80'
                        }`}
                      >
                        <div>
                          <div className="w-10 h-10 rounded-full mb-3 flex items-center justify-center bg-white shadow-sm border border-slate-100">
                            {isEarned ? <ShieldCheck className="w-5 h-5 text-indigo-600" /> :
                             isPending ? <Clock className="w-5 h-5 text-amber-500" /> :
                             <Lock className="w-5 h-5 text-slate-400" />}
                          </div>
                          
                          <h3 className={`type-h6 mb-1 ${isEarned ? 'text-indigo-900' : 'text-slate-800'}`}>
                            {badge.name}
                          </h3>
                          <p className="type-caption text-slate-500 leading-relaxed mb-3">
                            {badge.description}
                          </p>
                        </div>
                        
                        <div className="mt-auto flex justify-between items-end border-t border-slate-100 pt-3">
                          <span className={`type-fine font-bold px-2 py-0.5 rounded uppercase ${
                            isEarned ? 'bg-indigo-200/60 text-indigo-800' : 'bg-slate-100 text-slate-500'
                          }`}>
                            {badge.rarity}
                          </span>
                          
                          {isEarned && <span className="type-caption font-bold text-indigo-600">Earned!</span>}
                          {isPending && <span className="type-caption font-bold text-amber-600">Pending</span>}
                          {!isEarned && !isPending && <span className="type-caption font-bold text-slate-400">Locked</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Claim Badge Modal matching Flutter Badge Approval Workflow */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 relative animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
                <Award className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="type-h4 text-slate-900 leading-tight">
                  {selectedBadgeObj?.name || selectedBadgeToClaim || "Badge Details"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 uppercase">
                    {selectedBadgeObj?.rarity || "COMMON"}
                  </span>
                  <span className="type-caption text-slate-400 font-medium">
                    Authority: {selectedBadgeObj?.authority || "Faculty"}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsSubmitModalOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="type-caption text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
              {selectedBadgeObj?.description || "Maintain high discipline and participation standards to earn this badge."}
            </p>

            {/* 6-Step Approval Workflow matching Flutter Screen */}
            <div className="space-y-2 pt-1">
              <h4 className="font-heading type-caption font-bold text-slate-800">Badge Approval Workflow (6 Steps)</h4>
              
              <div className="space-y-2 type-caption">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-800">Claim Submitted</div>
                    <div className="text-[10px] text-slate-400">Student requests badge via portal</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <div>
                    <div className="font-semibold text-slate-700">Evaluator Review</div>
                    <div className="text-[10px] text-slate-400">Verifies eligibility (1-3 days)</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <div>
                    <div className="font-semibold text-slate-700">Faculty Check</div>
                    <div className="text-[10px] text-slate-400">Quality committee check (2-5 days)</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">4</div>
                  <div>
                    <div className="font-semibold text-slate-700">Maker-Checker Sign-off</div>
                    <div className="text-[10px] text-slate-400">Approval authority sign-off (1-2 days)</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">5</div>
                  <div>
                    <div className="font-semibold text-slate-700">Badge Issued</div>
                    <div className="text-[10px] text-slate-400">Awarded to student profile</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">6</div>
                  <div>
                    <div className="font-semibold text-slate-700">Audit Logging</div>
                    <div className="text-[10px] text-slate-400">Permanent record logged</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Form matching Flutter Proof Link Input */}
            <form onSubmit={submitBadgeClaim} className="space-y-3 pt-2">
              <div className="relative">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="url"
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 type-body-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  placeholder="Proof Link (Required)"
                  value={evidenceUrl}
                  onChange={e => setEvidenceUrl(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-2xl type-body-sm font-bold shadow-md transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Claim'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
