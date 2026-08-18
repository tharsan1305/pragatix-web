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
    <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-5 text-white shadow-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">My Activity Streaks</h1>
            <p className="text-xs text-slate-400 mt-0.5">Track your continuous activity execution & records</p>
          </div>
        </div>

        <button
          onClick={fetchStreaks}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors text-white"
          title="Refresh Streaks"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-6 max-w-3xl mx-auto w-full space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        ) : streaks.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center text-slate-500 border border-slate-200 shadow-sm">
            <Zap className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-base">No Activity Streaks Recorded</h3>
            <p className="text-xs text-slate-400 mt-1">Complete your assigned activities consistently to build your streak record!</p>
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
                  className={`bg-white p-5 rounded-2xl border shadow-sm transition-all ${
                    isBroken ? 'border-rose-200 bg-rose-50/20' : 'border-amber-200 bg-amber-50/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 text-lg truncate flex-1 mr-3">{name}</h3>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center space-x-1.5 ${
                        isBroken
                          ? 'bg-rose-100 text-rose-700 border border-rose-200'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {isBroken ? <Moon className="w-3.5 h-3.5 text-rose-600" /> : <Zap className="w-3.5 h-3.5 text-amber-600 fill-current" />}
                      <span>{isBroken ? 'Broken' : `${count} Active`}</span>
                    </span>
                  </div>

                  {longest > 0 && (
                    <div className="pt-3 border-t border-slate-100 flex items-center space-x-2 text-xs font-semibold text-slate-600">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      <span>Longest Streak Record: <strong className="text-slate-800">{longest} Days</strong></span>
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
