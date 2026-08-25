import { logger } from '../../../utils/logger';
import React, { useState, useEffect } from 'react';
import { RefreshCw, ArrowLeft, Sparkles } from 'lucide-react';
import type { Stage, Activity } from '../types/activity';
import { ActivityService } from '../services/activityService';
import { StageCard } from '../components/StageCard';
import { StageDetailsModal } from '../components/StageDetailsModal';
import { ActivityDetailsModal } from '../components/ActivityDetailsModal';
import { FireStreakIcon } from '../components/FireStreakIcon';
import { useXpStore } from '../../../store/xpStore';

interface ActivitiesTabProps {
  onBack?: () => void;
}

export const ActivitiesTab: React.FC<ActivitiesTabProps> = ({ onBack }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const { streaks } = useXpStore();

  const maxStreak = (() => {
    if (!streaks || !Array.isArray(streaks)) return 0;
    return streaks.reduce((max, s) => {
      const current = Number(s?.currentStreak ?? s?.streakCount ?? 0);
      const isBroken = s?.isBroken === true;
      return !isBroken && current > max ? current : max;
    }, 0);
  })();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allStages = await ActivityService.fetchStudentStages();

      // Show all stages matching Flutter activities_tab.dart
      const sortedStages = [...allStages].sort(
        (a, b) => (a.displayOrder || a.id) - (b.displayOrder || b.id)
      );

      setStages(sortedStages);

      // If a stage is currently selected, keep data updated
      if (selectedStage) {
        const updated = sortedStages.find((s) => s.id === selectedStage.id);
        if (updated) setSelectedStage(updated);
      }
    } catch (error) {
      logger.error('Failed to load student stages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-bg text-text-primary">
        <RefreshCw className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="bg-bg text-text-primary min-h-screen pb-32">
      {/* Top App Header */}
      <div className="bg-card text-text-primary px-6 lg:px-8 py-4 sticky top-0 z-10 border-b border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex justify-between items-center">
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
            <h1 className="text-lg font-black text-text-primary tracking-tight">Activities & Stages</h1>
            <p className="text-xs text-text-muted font-medium mt-0.5">Explore milestone stages, tasks, and reward thresholds</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FireStreakIcon streakCount={maxStreak} />
          <button
            onClick={loadData}
            className="p-2 bg-bg hover:bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Refresh Stages"
          >
            <RefreshCw className={`w-4 h-4 text-accent ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-5 lg:p-7 xl:p-8 max-w-[1400px] mx-auto">
        {/* Journey Header Card */}
        <div className="bg-card rounded-2xl border border-border p-5 lg:p-6 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h2 className="text-base font-black text-text-primary tracking-tight">Your Stage Progression</h2>
            <p className="text-xs text-text-muted font-medium mt-0.5">
              Complete mandatory and individual subgroups within active stages to unlock next tier milestones.
            </p>
          </div>
        </div>

        {/* Stage Cards — 2-col on XL */}
        {stages.length === 0 ? (
          <div className="bg-card rounded-2xl p-16 text-center border border-border text-text-muted font-medium">
            No stages found in your academic curriculum.
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {stages.map((stage) => (
              <StageCard
                key={stage.id}
                stage={stage}
                onClick={(st) => setSelectedStage(st)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stage Details Modal */}
      <StageDetailsModal
        stage={selectedStage}
        onClose={() => setSelectedStage(null)}
        onSelectActivity={(activity) => setSelectedActivity(activity)}
      />

      {/* Activity Details Modal */}
      <ActivityDetailsModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onSuccess={loadData}
      />
    </div>
  );
};

export default ActivitiesTab;

