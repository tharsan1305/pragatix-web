import { logger } from '../../../utils/logger';
import { useEffect, useState } from 'react';
import { ArrowLeft, Zap, Moon, Trophy, RefreshCw, AlertCircle } from 'lucide-react';
import apiClient from '../../../services/apiClient';

interface StreakItem {
  id?: number;
  activityName?: string;
  streakType?: string;
  currentStreak?: number;
  longestStreak?: number;
  isBroken?: boolean;
}

interface ActivityStreaksPageProps {
  onBack: () => void;
}

export default function ActivityStreaksPage({ onBack }: ActivityStreaksPageProps) {
  const [streaks, setStreaks] = useState<StreakItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStreaks();
  }, []);

  const fetchStreaks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/v1/students/me/activity-streaks');
      if (res.data?.success && Array.isArray(res.data?.data)) {
        setStreaks(res.data.data);
      } else if (Array.isArray(res.data)) {
        setStreaks(res.data);
      } else {
        setStreaks([]);
      }
    } catch (e: any) {
      logger.error('Failed to fetch streaks:', e);
      setError(e.response?.data?.message || 'Failed to load activity streaks');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-bg text-text-primary pb-24">
      {/* Header */}
      <div className="bg-card text-text-primary px-6 py-5 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 bg-card hover:bg-bg border border-border rounded-lg text-text-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="type-h4 font-bold text-text-primary">My Activity Streaks</h1>
            <p className="type-caption text-text-secondary mt-0.5 font-medium">Track your continuous activity execution & records</p>
          </div>
        </div>

        <button
          onClick={fetchStreaks}
          className="p-2 bg-card hover:bg-bg border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          title="Refresh Streaks"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-6 max-w-3xl mx-auto w-full space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-text-muted" />
          </div>
        ) : error ? (
          <div className="bg-card border border-accent/30 bg-accent-tint/30 text-accent p-4 rounded-lg flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="type-body-sm font-semibold">{error}</span>
          </div>
        ) : streaks.length === 0 ? (
          <div className="bg-card p-12 rounded-lg text-center text-text-muted border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <Zap className="w-12 h-12 text-text-muted mx-auto mb-3" />
            <h3 className="type-h5 font-bold text-text-primary">No Activity Streaks Recorded</h3>
            <p className="type-caption text-text-secondary mt-1 font-medium">Complete your assigned activities consistently to build your streak record!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {streaks.map((s, idx) => {
              const name = s.activityName || s.streakType || `Activity #${idx + 1}`;
              const count = s.currentStreak || 0;
              const longest = s.longestStreak || count;
              const isBroken = s.isBroken || count === 0;

              return (
                <div
                  key={idx}
                  className="bg-card p-5 rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading font-bold text-text-primary type-h3 truncate flex-1 mr-3">{name}</h3>

                    <span
                      className={`px-3 py-1 rounded-md type-caption font-bold flex items-center space-x-1.5 border ${
                        isBroken
                          ? 'bg-bg text-text-muted border-border'
                          : 'bg-accent-tint text-accent border-accent/30'
                      }`}
                    >
                      {isBroken ? <Moon className="w-3.5 h-3.5 text-text-muted" /> : <Zap className="w-3.5 h-3.5 text-accent fill-current" />}
                      <span>{isBroken ? 'Broken' : `${count} Active`}</span>
                    </span>
                  </div>

                  {longest > 0 && (
                    <div className="pt-3 border-t border-border flex items-center space-x-2 type-caption text-text-secondary">
                      <Trophy className="w-4 h-4 text-accent" />
                      <span>Longest Streak Record: <strong className="text-text-primary">{longest} Days</strong></span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
