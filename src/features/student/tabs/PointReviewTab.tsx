import { logger } from '../../../utils/logger';
import { useState, useEffect, useRef } from 'react';
import { Plus, X, Upload, CheckCircle2, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../store/authContext';
import { useXpStore } from '../../../store/xpStore';
import apiClient from '../../../services/apiClient';
import { ActivityService } from '../services/activityService';

interface ClaimableActivity {
  id?: number;
  name: string;
  xp: number;
  category: string;
  stage: number;
  cap: string;
}

const DEFAULT_CATEGORY_CONFIG = { color: "#9e9e9e", priority: "MEDIUM", decay: "Permanent" };

const CATEGORY_CONFIG: Record<string, any> = {
  "ACADEMIC": { color: "#3b82f6", bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500", priority: "HIGH", decay: "Streak decays if broken ↺" },
  "SKILL": { color: "#a855f7", bg: "bg-purple-500", text: "text-purple-500", border: "border-purple-500", priority: "HIGH", decay: "Permanent ✓" },
  "COMMUNICATION": { color: "#6366f1", bg: "bg-indigo-500", text: "text-indigo-500", border: "border-indigo-500", priority: "HIGH", decay: "Permanent ✓" },
  "LEADERSHIP": { color: "#fbbf24", bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-500", priority: "MEDIUM-HIGH", decay: "Permanent ✓" },
  "INNOVATION": { color: "#f97316", bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500", priority: "HIGH", decay: "Permanent ✓" },
  "PLACEMENT": { color: "#22c55e", bg: "bg-green-500", text: "text-green-500", border: "border-green-500", priority: "HIGH", decay: "Permanent ✓" },
  "DISCIPLINE": { color: "#ef4444", bg: "bg-red-500", text: "text-red-500", border: "border-red-500", priority: "MEDIUM", decay: "Resets if streak broken ↺" },
  "COMMUNITY": { color: "#14b8a6", bg: "bg-teal-500", text: "text-teal-500", border: "border-teal-500", priority: "MEDIUM", decay: "Resets per semester ↺" },
  "SPORTS": { color: "#ec4899", bg: "bg-pink-500", text: "text-pink-500", border: "border-pink-500", priority: "MEDIUM", decay: "Permanent ✓" },
  "CULTURAL": { color: "#06b6d4", bg: "bg-cyan-500", text: "text-cyan-500", border: "border-cyan-500", priority: "MEDIUM", decay: "Permanent ✓" },
};

export default function PointReviewTab() {
  const { user } = useAuth();
  const { xpByCategory, history, streaks, submitXpClaim, fetchSummary, fetchHistory, fetchStreaks } = useXpStore();

  const [currentStage, setCurrentStage] = useState(1);
  const [allActivities, setAllActivities] = useState<ClaimableActivity[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadData = async () => {
      let regNo = user?.username || user?.regNo || user?.sprNo || "";
      try {
        const res = await apiClient.get('/api/v1/auth/me');
        if (res.data?.success && res.data?.data) {
          if (!regNo) regNo = res.data.data.username || res.data.data.sprNo || "";
          setCurrentStage(res.data.data.stage ?? 1);
        }
      } catch (e) {
        logger.error("Failed to load user info in PointReviewTab", e);
      }
      if (regNo) {
        fetchSummary(regNo);
        fetchHistory(regNo);
        fetchStreaks(regNo);
      }

      // Match Flutter's XpProvider.fetchStages flattening: stage -> subgroup -> activities
      try {
        const stages = await ActivityService.fetchStudentStages();
        const flattened: ClaimableActivity[] = [];
        for (const stage of stages) {
          for (const sub of stage.subgroups) {
            for (const act of sub.activities) {
              flattened.push({
                id: act.id || act.activityId,
                name: act.activityName,
                xp: act.rewardXp,
                category: act.category || 'OTHER',
                stage: stage.displayOrder || 1,
                cap: act.frequency || 'Once',
              });
            }
          }
        }
        setAllActivities(flattened);
      } catch (e) {
        logger.error("Failed to load activities for claim wizard", e);
      }
    };

    loadData();
  }, [user, fetchSummary, fetchHistory, fetchStreaks]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<ClaimableActivity | null>(null);
  const [evidenceDesc, setEvidenceDesc] = useState("");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const codingStreak = streaks.find((s: any) => s.streakType === "C_CODING");
  const hasCodingBonus = codingStreak && (codingStreak.currentStreak >= 7) && !codingStreak.isBroken;

  const openModal = () => {
    setCurrentStep(1);
    setSelectedCategory("");
    setSelectedActivity(null);
    setEvidenceDesc("");
    setSelectedFileName(null);
    setIsModalOpen(true);
  };

  const handleNext = async () => {
    if (currentStep === 1 && !selectedCategory) {
      toast.error("Please select a category");
      return;
    }
    if (currentStep === 2 && !selectedActivity) {
      toast.error("Please select an activity");
      return;
    }
    if (currentStep === 3 && !evidenceDesc.trim()) {
      toast.error("Please describe your evidence");
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else if (selectedActivity) {
      setIsSubmitting(true);
      const toastId = toast.loading("Submitting XP claim...");
      const url = evidenceDesc.trim();
      const success = await submitXpClaim(
        selectedCategory,
        selectedActivity.name,
        selectedActivity.xp,
        url || "Link uploaded",
        selectedActivity.id
      );
      
      toast.dismiss(toastId);
      setIsSubmitting(false);
      setIsModalOpen(false);
      
      if (success) {
        toast.success("XP claim submitted for approval!");
      } else {
        toast.error("Failed to submit claim.");
      }
    }
  };

  const filteredActivities = allActivities.filter(act =>
    (selectedCategory ? act.category === selectedCategory : true) &&
    act.stage <= currentStage
  );

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-slate-800 text-white px-6 py-4 sticky top-0 z-10 shadow-md">
        <h1 className="type-h4">XP Tracker</h1>
      </div>

      {hasCodingBonus && (
        <div className="bg-indigo-600 p-3 text-white flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <span className="type-body-sm font-bold">7-Day Coding Streak Active — 2x XP all coding this week!</span>
        </div>
      )}

      <div className="p-4 max-w-3xl mx-auto space-y-6">
        
        {/* Category Cards */}
        <section>
          <h2 className="type-h4 text-slate-800 mb-3">XP Category Summary</h2>
          <div className="flex overflow-x-auto gap-3 pb-4 snap-x">
            {Object.entries(xpByCategory).map(([cat, val], idx) => {
              const conf = CATEGORY_CONFIG[cat] || DEFAULT_CATEGORY_CONFIG;
              return (
                <div key={idx} className="snap-start shrink-0 w-[180px] bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex flex-col justify-between h-[120px]">
                  <div className="flex justify-between items-start">
                    <span className={`text-[11px] font-bold ${conf.text} truncate max-w-[90px]`}>{cat}</span>
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded opacity-80" style={{ backgroundColor: conf.color + '20', color: conf.color }}>
                      {conf.priority}
                    </span>
                  </div>
                  <div className="type-h3 text-slate-800 my-1">{val as number} XP</div>
                  <div className="text-[8px] italic text-slate-400 truncate">{conf.decay}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* History List */}
        <section>
          <h2 className="type-h4 text-slate-800 mb-3">XP Submission History</h2>
          
          {history.length === 0 ? (
            <div className="text-center py-10 text-slate-500">
              No XP logs found. Submit your first activity claim!
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((log: any, idx: number) => {
                const cat = log.category || "SKILL";
                const isPositive = log.xpPoints > 0;
                const conf = CATEGORY_CONFIG[cat] || DEFAULT_CATEGORY_CONFIG;
                const status = log.status || "APPROVED";
                
                return (
                  <div key={idx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center">
                    <div className="w-3 h-3 rounded-full mr-4 shrink-0" style={{ backgroundColor: conf.color }} />
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="font-bold text-slate-800 type-body-sm truncate">{log.activityName || ""}</div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="type-caption text-slate-500">
                          {log.submittedAt ? new Date(log.submittedAt).toISOString().split('T')[0] : ''}
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                          status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {status}
                        </span>
                      </div>
                    </div>
                    <div className={`font-bold ${isPositive ? 'text-green-500' : 'text-red-500'} ${status === 'REJECTED' ? 'line-through' : ''}`}>
                      {isPositive ? '+' : ''}{log.xpPoints} XP
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* FAB */}
      <button 
        onClick={openModal}
        className="fixed bottom-20 right-6 w-14 h-14 type-btn bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-indigo-500/40 hover:bg-indigo-700 transition-colors z-20"
      >
        <Plus className="w-8 h-8" />
      </button>

      {/* Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div className="bg-white w-full sm:w-[480px] rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="type-h4 text-slate-800">Submit Activity Evidence</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="type-caption font-bold text-slate-400 mb-6 tracking-wider uppercase">Step {currentStep} of 4</div>

            <div className="space-y-4">
              {currentStep === 1 && (
                <div>
                  <label className="type-form-label block type-body-sm font-bold text-slate-700 mb-2">Select Category</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setSelectedActivity(null);
                    }}
                  >
                    <option value="" disabled>Choose a category</option>
                    {Object.keys(CATEGORY_CONFIG).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <label className="type-form-label block type-body-sm font-bold text-slate-700 mb-2">Select Activity</label>
                  <select 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent appearance-none"
                    value={selectedActivity?.name || ""}
                    onChange={(e) => {
                      const act = filteredActivities.find(a => a.name === e.target.value);
                      setSelectedActivity(act ?? null);
                    }}
                  >
                    <option value="" disabled>Choose an activity</option>
                    {filteredActivities.map((act, idx) => (
                      <option key={idx} value={act.name}>
                        {act.name} (+{act.xp} XP | {act.cap})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <label className="type-form-label block type-body-sm font-bold text-slate-700 mb-2">Evidence Description / URL</label>
                  <textarea 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none h-24 mb-4"
                    placeholder="Enter evidence links or verification notes..."
                    value={evidenceDesc}
                    onChange={(e) => setEvidenceDesc(e.target.value)}
                  />

                  <label className="type-form-label block type-body-sm font-bold text-slate-700 mb-2">Upload File Document (Optional)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setSelectedFileName(file.name);
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-3 rounded-xl transition-colors type-btn border border-slate-200 border-dashed cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    {selectedFileName || "Select PDF/Photo Document"}
                  </button>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <h3 className="type-h5 text-slate-800 mb-3">Claim Preview</h3>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 type-body-sm text-slate-600 space-y-2">
                    <div><span className="font-medium text-slate-800">Activity:</span> {selectedActivity?.name}</div>
                    <div><span className="font-medium text-slate-800">Category:</span> {selectedCategory}</div>
                    <div className="text-green-600 font-bold">Points to Earn: +{selectedActivity?.xp} XP</div>
                    <div><span className="font-medium text-slate-800">Evidence:</span> {evidenceDesc}</div>
                    {selectedFileName && (
                      <div className="text-indigo-600"><span className="font-medium text-slate-800">Attachment:</span> {selectedFileName}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8 pt-4 border-t border-slate-100">
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                className={`px-4 py-2 type-body-sm font-bold text-slate-500 hover:text-slate-700 ${currentStep === 1 ? 'invisible' : ''}`}
              >
                Back
              </button>
              
              <button 
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl type-body-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-70"
              >
                {currentStep === 4 ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}
