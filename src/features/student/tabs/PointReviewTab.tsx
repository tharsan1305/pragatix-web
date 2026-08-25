import { logger } from '../../../utils/logger';
import { useState, useEffect, useRef } from 'react';
import { Plus, X, Upload, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';
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

interface PointReviewTabProps {
  onBack?: () => void;
}

export default function PointReviewTab({ onBack }: PointReviewTabProps) {
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
          for (const subgroup of stage.subgroups) {
            for (const act of subgroup.activities) {
              flattened.push({
                id: act.id,
                name: act.activityName,
                xp: act.rewardXp,
                category: subgroup.name.toUpperCase().replace(/\s+/g, '_'),
                stage: stage.id,
                cap: "Per Event",
              });
            }
          }
        }
        setAllActivities(flattened);
      } catch (e) {
        logger.error("Failed to fetch activities in PointReviewTab", e);
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

  const hasCodingBonus = streaks.some(s => s.streakType === "CODING" && s.currentStreak >= 7 && !s.isBroken);

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
    if (currentStep === 3 && !evidenceDesc.trim() && !selectedFileName) {
      toast.error("Please enter evidence notes or attach a document");
      return;
    }

    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else if (selectedActivity) {
      await handleSubmitClaim();
    }
  };

  const handleSubmitClaim = async () => {
    if (!selectedActivity) return;
    setIsSubmitting(true);
    const toastId = toast.loading("Submitting activity claim...");

    const url = evidenceDesc.trim() || (selectedFileName ? `File: ${selectedFileName}` : "Proof attached");

    const success = await submitXpClaim(
      selectedActivity.category,
      selectedActivity.name,
      selectedActivity.xp,
      url,
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
  };

  const filteredActivities = allActivities.filter(act =>
    (selectedCategory ? act.category === selectedCategory : true) &&
    act.stage <= currentStage
  );

  return (
    <div className="bg-bg min-h-screen pb-24 text-text-primary">
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
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">Point Review & History</h1>
            <p className="type-caption text-text-secondary font-medium mt-0.5">Review awarded XP records and submit new activity evidence claims</p>
          </div>
        </div>
      </div>

      {hasCodingBonus && (
        <div className="bg-accent-tint border-b border-accent/20 px-6 py-3 text-accent flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <span className="type-caption font-bold">7-Day Coding Streak Active — 2x XP boost on all coding submissions this week!</span>
        </div>
      )}

      <div className="p-5 lg:p-7 xl:p-8 max-w-[1400px] mx-auto space-y-6">
        
        {/* Category Cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="type-h4 font-bold text-text-primary">XP Category Summary</h2>
            <span className="type-fine text-text-muted font-bold">Tracked activity categories</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Object.entries(xpByCategory).map(([cat, val], idx) => {
              const formattedName = cat
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())
                .replace(/_/g, ' ')
                .trim();

              return (
                <div key={idx} className="bg-card rounded-2xl p-4 border border-border shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between min-h-[140px] hover:border-accent/30 transition-all">
                  <div className="flex justify-between items-start">
                    <span className="type-caption font-bold text-text-primary truncate max-w-[120px]" title={formattedName}>
                      {formattedName}
                    </span>
                    <span className="type-fine font-bold px-2 py-0.5 rounded-md bg-accent-tint text-accent border border-accent/20 uppercase tracking-wider text-[10px]">
                      TRACKED
                    </span>
                  </div>
                  <div className="type-h2 text-text-primary font-black my-1">{val as number} <span className="type-caption text-text-muted font-normal">XP</span></div>
                  <div className="type-fine font-medium text-text-muted truncate">Category Points</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* History List */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="type-h4 font-bold text-text-primary">XP Submission History</h2>
            <span className="type-fine font-bold text-text-muted">{history.length} Entries</span>
          </div>
          
          {history.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-10 text-center text-text-muted font-medium shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-2">
              <div className="w-12 h-12 bg-accent-tint text-accent rounded-2xl flex items-center justify-center mx-auto mb-3 border border-accent/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <p className="type-body-sm font-bold text-text-primary">No XP submissions recorded yet</p>
              <p className="type-caption text-text-secondary max-w-sm mx-auto">
                Submit your activity certificates, project proofs, or participation links using the button below to earn stage XP!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {history.map((log: any, idx: number) => {
                const isPositive = log.xpPoints > 0;
                const status = (log.status || "APPROVED").toUpperCase();
                
                return (
                  <div key={idx} className="bg-card rounded-xl p-4 border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-between hover:border-accent/30 transition-all">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                        status === 'REJECTED' ? 'bg-accent-tint text-accent border-accent/20' :
                        'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-text-primary type-body-sm truncate">{log.activityName || "Activity Claim"}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="type-fine text-text-muted font-medium">
                            {log.submittedAt ? new Date(log.submittedAt).toISOString().split('T')[0] : 'Recent'}
                          </span>
                          <span className={`type-fine font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                            status === 'REJECTED' ? 'bg-accent-tint text-accent border-accent/20' :
                            'bg-amber-50 text-amber-800 border-amber-200'
                          }`}>
                            {status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`font-black type-body-sm shrink-0 ml-3 ${
                      isPositive ? 'text-emerald-800' : 'text-accent'
                    } ${status === 'REJECTED' ? 'line-through opacity-50' : ''}`}>
                      {isPositive ? '+' : ''}{log.xpPoints} XP
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </div>

      {/* Modern Elevated Floating Action Button */}
      <button 
        onClick={openModal}
        className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 bg-accent hover:bg-accent-hover text-card px-5 py-3.5 rounded-2xl shadow-2xl transition-all z-20 cursor-pointer flex items-center gap-2 font-bold type-body-sm active:scale-95"
        title="Submit New Activity Evidence"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span>Claim XP</span>
      </button>

      {/* Submission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-text-primary/40 backdrop-blur-xs sm:items-center p-4">
          <div className="bg-card text-text-primary border border-border w-full sm:w-[480px] rounded-lg p-6 shadow-2xl animate-in slide-in-from-bottom-10 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="type-h4 font-bold text-text-primary">Submit Activity Evidence</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 text-text-secondary hover:text-text-primary bg-bg rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="type-caption font-bold text-text-muted mb-6 tracking-wider uppercase">Step {currentStep} of 4</div>

            <div className="space-y-4">
              {currentStep === 1 && (
                <div>
                  <label className="type-form-label block type-body-sm font-bold text-text-primary mb-2">Select Category</label>
                  <select 
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent appearance-none cursor-pointer"
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
                  <label className="type-form-label block type-body-sm font-bold text-text-primary mb-2">Select Activity</label>
                  <select 
                    className="w-full bg-bg border border-border rounded-lg px-4 py-2.5 text-text-primary focus:outline-none focus:border-accent appearance-none cursor-pointer"
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
                  <label className="type-form-label block type-body-sm font-bold text-text-primary mb-2">Evidence Description / URL</label>
                  <textarea 
                    className="w-full bg-bg border border-border rounded-lg px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent resize-none h-24 mb-4"
                    placeholder="Enter evidence links or verification notes..."
                    value={evidenceDesc}
                    onChange={(e) => setEvidenceDesc(e.target.value)}
                  />

                  <label className="type-form-label block type-body-sm font-bold text-text-primary mb-2">Upload File Document (Optional)</label>
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
                    className="w-full flex items-center justify-center gap-2 bg-bg hover:bg-border text-text-primary px-4 py-3 rounded-lg transition-colors type-btn border border-border border-dashed cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    {selectedFileName || "Select PDF/Photo Document"}
                  </button>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <h3 className="type-h5 font-bold text-text-primary mb-3">Claim Preview</h3>
                  <div className="bg-bg border border-border rounded-lg p-4 type-body-sm text-text-secondary space-y-2">
                    <div><span className="font-bold text-text-primary">Activity:</span> {selectedActivity?.name}</div>
                    <div><span className="font-bold text-text-primary">Category:</span> {selectedCategory}</div>
                    <div className="text-success font-bold">Points to Earn: +{selectedActivity?.xp} XP</div>
                    <div><span className="font-bold text-text-primary">Evidence:</span> {evidenceDesc}</div>
                    {selectedFileName && (
                      <div className="text-accent"><span className="font-bold text-text-primary">Attachment:</span> {selectedFileName}</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between mt-8 pt-4 border-t border-border">
              <button 
                onClick={() => setCurrentStep(prev => prev - 1)}
                className={`px-4 py-2 type-body-sm font-bold text-text-secondary hover:text-text-primary cursor-pointer ${currentStep === 1 ? 'invisible' : ''}`}
              >
                Back
              </button>
              
              <button 
                onClick={handleNext}
                disabled={isSubmitting}
                className="bg-accent hover:bg-accent-hover text-card px-6 py-2.5 rounded-lg type-body-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-70 cursor-pointer"
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
