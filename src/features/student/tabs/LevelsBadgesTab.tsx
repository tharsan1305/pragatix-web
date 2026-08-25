import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { Lock, Check, Zap, ShieldCheck, HelpCircle, Clock, X, Award, Link2, CheckCircle2, ArrowLeft } from 'lucide-react';
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

interface LevelsBadgesTabProps {
  onBack?: () => void;
}

export default function LevelsBadgesTab({ onBack }: LevelsBadgesTabProps = {}) {
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
      <div className="flex h-screen items-center justify-center bg-bg text-text-primary">
        <p className="type-body-sm font-semibold text-text-secondary">Loading levels & badges...</p>
      </div>
    );
  }

  if (activeTab === 'levels' && !progressionData) {
    return (
      <div className="bg-bg min-h-screen flex items-center justify-center p-8 text-text-primary">
        <p className="text-text-muted font-medium type-body-sm">Progression data unavailable</p>
      </div>
    );
  }

  const currentLevelNum = progressionData?.currentLevel ?? 1;
  const currentLevelTitle = progressionData?.currentLevelName ?? '';
  const displayTotalXp = progressionData?.totalXp ?? 0;
  const xpMax = progressionData?.currentLevelMaxXp ?? 0;
  const remainingXp = Math.max(0, progressionData?.remainingXp ?? 0);
  const levelProgress = (progressionData?.progressPercentage ?? 0) / 100;
  const isEligibleForPathway = currentLevelNum >= 3;

  const dynamicLevelsList = [
    ...(progressionData?.unlockedLevels || []).map((l: any) => ({ ...l, isUnlockedApi: true })),
    ...(progressionData?.lockedLevels || []).map((l: any) => ({ ...l, isUnlockedApi: false })),
  ];

  return (
    <div className="bg-bg min-h-screen pb-24 text-text-primary">
      {/* Header */}
      <div className="bg-card text-text-primary sticky top-0 z-10 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="px-6 py-5 flex items-center justify-between">
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
              <h1 className="type-h3 font-bold text-text-primary tracking-tight">Levels & Badges</h1>
              <p className="type-caption text-text-secondary font-medium mt-0.5">Explore milestone progression, skill pathways, and badge collections</p>
            </div>
          </div>
        </div>
        <div className="flex border-t border-border px-6 py-2 gap-2 bg-card">
          <button 
            className={`px-4 py-2 rounded-lg type-caption font-bold transition-all cursor-pointer border ${
              activeTab === 'levels' 
                ? 'bg-accent-tint text-accent border-accent/30 shadow-none' 
                : 'bg-bg text-text-secondary border-border hover:text-text-primary hover:bg-card'
            }`}
            onClick={() => setActiveTab('levels')}
          >
            Level & Pathway
          </button>
          <button 
            className={`px-4 py-2 rounded-lg type-caption font-bold transition-all cursor-pointer border ${
              activeTab === 'badges' 
                ? 'bg-accent-tint text-accent border-accent/30 shadow-none' 
                : 'bg-bg text-text-secondary border-border hover:text-text-primary hover:bg-card'
            }`}
            onClick={() => setActiveTab('badges')}
          >
            Badge Collection
          </button>
        </div>
      </div>

      <div className="p-5 lg:p-7 xl:p-8 max-w-[1400px] mx-auto space-y-6">
        {activeTab === 'levels' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
            
            {/* Level Progress Card */}
            <div className="bg-card rounded-2xl p-6 border border-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] text-text-primary space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="type-fine font-bold text-text-muted uppercase tracking-wider mb-0.5">CURRENT LEVEL</div>
                  <div className="type-h2 font-black text-text-primary tracking-tight">Lvl {currentLevelNum}: {currentLevelTitle}</div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent shadow-xs">
                  <Zap className="w-6 h-6" />
                </div>
              </div>
              
              <div className="flex justify-between type-caption font-bold">
                <span className="text-text-primary">{displayTotalXp} XP Points</span>
                <span className="text-text-secondary">
                  {progressionData?.isMaxLevel ? 'Maximum Level Achieved' : `Target: ${xpMax} XP (Remaining: ${remainingXp})`}
                </span>
              </div>
              
              <div className="h-2.5 w-full bg-bg border border-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-1000 rounded-full" 
                  style={{ width: `${Math.min(100, Math.max(0, levelProgress * 100))}%` }}
                />
              </div>
            </div>

            {/* Pathways */}
            <div>
              <h2 className="type-h4 font-bold text-text-primary">Skill Pathways</h2>
              <p className="type-body-sm text-text-secondary mb-3">Select your focus domain starting from Level 3 (Innovator).</p>
              
              {!isEligibleForPathway ? (
                <div className="bg-card border border-border rounded-lg p-4 flex gap-3 items-center text-text-muted shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                  <Lock className="w-5 h-5 shrink-0" />
                  <span className="type-body-sm font-medium">Unlocks at Level 3 (Innovator) — 501+ XP</span>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                  <label className="type-form-label type-body-sm font-bold text-text-primary flex gap-2 items-center">
                    <HelpCircle className="w-4 h-4 text-accent" /> Choose Your Active Pathway
                  </label>
                  <select 
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent appearance-none cursor-pointer"
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
                      <div className="bg-bg border border-border rounded-lg p-3 type-body-sm text-text-primary mt-2 space-y-1">
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
              <h2 className="type-h4 font-bold text-text-primary mb-4">Level Progression Map</h2>
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
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                          isCompleted ? 'bg-emerald-50 border-emerald-300 text-emerald-800' :
                          isCurrent ? 'bg-accent border-accent text-card ring-4 ring-accent/15' :
                          'bg-bg border-border text-text-muted'
                        }`}>
                          {isCompleted ? <Check className="w-4 h-4 stroke-[2.5]" /> : 
                           isCurrent ? <Zap className="w-4 h-4 stroke-[2.5]" /> : 
                           <Lock className="w-4 h-4 stroke-[2]" />}
                        </div>
                        {idx < dynamicLevelsList.length - 1 && (
                          <div className={`w-0.5 h-full min-h-[80px] my-1.5 ${isCompleted ? 'bg-emerald-300' : 'bg-border'}`} />
                        )}
                      </div>
                      
                      <div className={`flex-1 pb-6 ${isLocked ? 'opacity-60' : ''}`}>
                        <div className={`rounded-xl p-5 border transition-all ${
                          isCurrent ? 'bg-card border-accent/40 shadow-[0_1px_3px_rgba(0,0,0,0.03)]' : 
                          'bg-card border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)]'
                        }`}>
                          <div className="flex justify-between items-start mb-1.5">
                            <h3 className="type-h4 font-bold text-text-primary">Lvl {lvlNum}: {lvlTitle}</h3>
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border uppercase tracking-wider ${
                              isCurrent ? 'bg-accent-tint text-accent border-accent/20' : 'bg-bg text-text-secondary border-border'
                            }`}>
                              {stageText}
                            </span>
                          </div>
                          <div className="text-emerald-800 type-caption font-bold mb-2.5">XP Range: {range}</div>
                          <div className="type-body-sm text-text-secondary mb-2.5 font-medium"><strong className="text-text-primary">Objective:</strong> {objective}</div>
                          <div className="type-caption text-text-muted bg-bg p-3 rounded-lg border border-border font-medium">
                            <strong className="text-text-secondary font-bold">Unlocks:</strong> {unlocks}
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
            {/* Badge Collection Progress Card */}
            <div className="bg-card border border-border rounded-2xl p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="type-fine font-bold text-text-muted uppercase tracking-wider">Badge Collection Progress</span>
                  <h2 className="type-h3 font-black text-text-primary tracking-tight mt-0.5">
                    {earnedBadgeIds.length} of {Object.values(badgesByTier).flat().length || 10} Badges Earned
                  </h2>
                </div>
                <button
                  onClick={() => setIsSubmitModalOpen(true)}
                  className="px-4 py-2 bg-accent hover:bg-accent-hover text-card rounded-xl type-caption font-bold flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <Award className="w-4 h-4" />
                  <span>Claim Badge</span>
                </button>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between type-caption font-bold">
                  <span className="text-text-primary">Collection Progress</span>
                  <span className="text-text-secondary">
                    {Math.round((earnedBadgeIds.length / (Object.values(badgesByTier).flat().length || 10)) * 100)}% Completed
                  </span>
                </div>
                <div className="h-2.5 w-full bg-bg border border-border rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent transition-all duration-1000 rounded-full"
                    style={{
                      width: `${Math.min(100, Math.max(0, Math.round((earnedBadgeIds.length / (Object.values(badgesByTier).flat().length || 10)) * 100)))}%`
                    }}
                  />
                </div>
              </div>
            </div>
            {Object.entries(badgesByTier).map(([tierName, badges]) => (
              <div key={tierName}>
                <div className="flex items-center gap-3 mb-4">
                  <h2 className="type-h4 font-bold text-text-primary">{tierName} Tier</h2>
                  <div className="h-px flex-1 bg-border" />
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
                        className={`rounded-lg border p-4 flex flex-col justify-between relative overflow-hidden transition-all cursor-pointer hover:border-text-muted shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${
                          isEarned ? 'bg-card border-border' :
                          isPending ? 'bg-card border-border' :
                          'bg-card border-border opacity-80'
                        }`}
                      >
                        <div>
                          <div className={`w-10 h-10 rounded-full mb-3 flex items-center justify-center border ${
                            isEarned ? 'bg-success-tint border-success/30 text-success' :
                            isPending ? 'bg-warning-tint border-warning/30 text-warning' :
                            'bg-bg border-border text-text-muted'
                          }`}>
                            {isEarned ? <ShieldCheck className="w-5 h-5" /> :
                             isPending ? <Clock className="w-5 h-5" /> :
                             <Lock className="w-5 h-5" />}
                          </div>
                          
                          <h3 className="type-h6 font-bold mb-1 text-text-primary">
                            {badge.name}
                          </h3>
                          <p className="type-caption text-text-secondary leading-relaxed mb-3">
                            {badge.description}
                          </p>
                        </div>
                        
                        <div className="mt-auto flex justify-between items-end border-t border-border pt-3">
                          <span className="type-fine font-bold px-2 py-0.5 rounded uppercase bg-bg text-text-secondary border border-border">
                            {badge.rarity}
                          </span>
                          
                          {isEarned && <span className="type-caption font-bold text-success">Earned!</span>}
                          {isPending && <span className="type-caption font-bold text-warning">Pending</span>}
                          {!isEarned && !isPending && <span className="type-caption font-bold text-text-muted">Locked</span>}
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

      {/* Claim Badge Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-text-primary/40 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-card text-text-primary border border-border rounded-lg p-6 w-full max-w-md shadow-xl space-y-4 relative animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-lg bg-accent-tint text-accent border border-accent/30 shrink-0">
                <Award className="w-7 h-7" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="type-h4 font-bold text-text-primary leading-tight">
                  {selectedBadgeObj?.name || selectedBadgeToClaim || "Badge Details"}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-bg text-text-primary border border-border uppercase">
                    {selectedBadgeObj?.rarity || "COMMON"}
                  </span>
                  <span className="type-caption text-text-secondary font-medium">
                    Authority: {selectedBadgeObj?.authority || "Faculty"}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsSubmitModalOpen(false)} 
                className="p-1.5 text-text-secondary hover:text-text-primary rounded-lg hover:bg-bg transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Description */}
            <p className="type-caption text-text-secondary leading-relaxed bg-bg p-3 rounded-lg border border-border">
              {selectedBadgeObj?.description || "Maintain high discipline and participation standards to earn this badge."}
            </p>

            {/* 6-Step Approval Workflow */}
            <div className="space-y-2 pt-1">
              <h4 className="font-heading type-caption font-bold text-text-primary">Badge Approval Workflow (6 Steps)</h4>
              
              <div className="space-y-2 type-caption">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-text-primary">Claim Submitted</div>
                    <div className="text-[10px] text-text-muted">Student requests badge via portal</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-bg border border-border text-text-secondary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">2</div>
                  <div>
                    <div className="font-semibold text-text-secondary">Evaluator Review</div>
                    <div className="text-[10px] text-text-muted">Verifies eligibility (1-3 days)</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-bg border border-border text-text-secondary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">3</div>
                  <div>
                    <div className="font-semibold text-text-secondary">Faculty Check</div>
                    <div className="text-[10px] text-text-muted">Quality committee check (2-5 days)</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-bg border border-border text-text-secondary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">4</div>
                  <div>
                    <div className="font-semibold text-text-secondary">Maker-Checker Sign-off</div>
                    <div className="text-[10px] text-text-muted">Approval authority sign-off (1-2 days)</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-bg border border-border text-text-secondary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">5</div>
                  <div>
                    <div className="font-semibold text-text-secondary">Badge Issued</div>
                    <div className="text-[10px] text-text-muted">Awarded to student profile</div>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-4 h-4 rounded-full bg-bg border border-border text-text-secondary font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">6</div>
                  <div>
                    <div className="font-semibold text-text-secondary">Audit Logging</div>
                    <div className="text-[10px] text-text-muted">Permanent record logged</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Submission Form */}
            <form onSubmit={submitBadgeClaim} className="space-y-3 pt-2">
              <div className="relative">
                <Link2 className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input 
                  type="url"
                  required
                  className="w-full bg-bg border border-border rounded-lg pl-9 pr-3 py-2.5 type-body-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent"
                  placeholder="Proof Link (Required)"
                  value={evidenceUrl}
                  onChange={e => setEvidenceUrl(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-accent hover:bg-accent-hover text-card py-3 rounded-lg type-body-sm font-bold shadow-none transition-colors disabled:opacity-50 cursor-pointer"
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
