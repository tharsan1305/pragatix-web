import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import type { Stage, Activity } from '../types/activity';
import { ActivityService } from '../services/activityService';
import { StageCard } from '../components/StageCard';
import { StageDetailsModal } from '../components/StageDetailsModal';
import { ActivityDetailsModal } from '../components/ActivityDetailsModal';

export const ActivitiesTab: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [stages, setStages] = useState<Stage[]>([]);
  const [selectedStage, setSelectedStage] = useState<Stage | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allStages = await ActivityService.fetchStudentStages();

      // Match Flutter's activities_tab.dart: hide future locked stages, show only completed + current
      const fetchedStages = allStages.filter((s) => !(s.isLocked && !s.isCompleted));
      fetchedStages.sort((a, b) => (a.displayOrder || a.id) - (b.displayOrder || b.id));

      setStages(fetchedStages);

      // If a stage is currently selected, keep data updated
      if (selectedStage) {
        const updated = fetchedStages.find((s) => s.id === selectedStage.id);
        if (updated) setSelectedStage(updated);
      }
    } catch (error) {
      console.error('Failed to load student stages:', error);
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
      {/* Top App Header */}
      <div className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-10 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">Activities & Stages</h1>
        <button
          onClick={loadData}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors"
          title="Refresh Stages"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-5 max-w-3xl mx-auto space-y-6">

        {/* Journey Header */}
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Your Journey
          </h2>
          <p className="text-xs font-medium text-slate-500 mt-1">
            Complete subgroups to unlock the next stages.
          </p>
        </div>

        {/* Stage Cards List */}
        <div className="space-y-4">
          {stages.map((stage) => (
            <StageCard
              key={stage.id}
              stage={stage}
              onClick={(st) => setSelectedStage(st)}
            />
          ))}
        </div>
      </div>

      {/* Stage Details Modal (Opened when clicking a StageCard without leaving portal) */}
      <StageDetailsModal
        stage={selectedStage}
        onClose={() => setSelectedStage(null)}
        onSelectActivity={(activity) => setSelectedActivity(activity)}
      />

      {/* Activity Details Modal (Opened when clicking an ActivityCard) */}
      <ActivityDetailsModal
        activity={selectedActivity}
        onClose={() => setSelectedActivity(null)}
        onSuccess={loadData}
      />
    </div>
  );
};

export default ActivitiesTab;
