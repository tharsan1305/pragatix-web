import { logger } from '../../../utils/logger';
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Stage, Activity } from '../types/activity';
import { ActivityService } from '../services/activityService';
import { StageCard } from '../components/StageCard';
import { StageDetailsModal } from '../components/StageDetailsModal';
import { ActivityDetailsModal } from '../components/ActivityDetailsModal';
import { FireStreakIcon } from '../components/FireStreakIcon';
import { useXpStore } from '../../../store/xpStore';

export const ActivitiesTab: React.FC = () => {
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
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen pb-32">
      {/* Top App Header matching Flutter AppBar */}
      <div className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-10 shadow-md flex justify-between items-center">
        <h1 className="type-h4">Activities & Stages</h1>
        <div className="flex items-center gap-3">
          <FireStreakIcon streakCount={maxStreak} />
          <button
            onClick={loadData}
            className="p-2 type-btn bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors cursor-pointer"
            title="Refresh Stages"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-5 max-w-3xl mx-auto space-y-6">
        {/* Journey Header */}
        <div>
          <h2 className="type-h2 text-slate-900 tracking-tight">
            Your Journey
          </h2>
          <p className="type-caption text-slate-500 mt-1">
            Complete subgroups to unlock the next stages.
          </p>
        </div>

        {/* Stage Cards List matching Flutter */}
        {stages.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 text-slate-500 font-medium">
            No stages found.
          </div>
        ) : (
          <div className="space-y-4">
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

