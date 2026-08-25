import { logger } from '../../../utils/logger';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, Save, Calendar, Clock, ChevronRight, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

interface Props {
  academicYear?: string;
  onBack: () => void;
  onNavigateAcademicCalendar?: () => void;
}

export default function AttendanceSettingsPage({ academicYear = 'FIRST_YEAR', onBack, onNavigateAcademicCalendar }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    dailyEngineEnabled: false,
    dailyProcessingTime: '06:08:00',
    weeklyEngineEnabled: false,
    weeklyProcessingTime: '06:10:00',
    partialDayPenalty: -5,
    fullDayPenalty: -10,
    perfectWeekReward: 30,
    weekStartFullPenalty: -40,
    weekStartPartialPenalty: -10,
    weekEndFullPenalty: -40,
    weekEndPartialPenalty: -10,
  });

  const [engineStatus, setEngineStatus] = useState<any>(null);
  const [isLoadingEngine, setIsLoadingEngine] = useState(false);
  const [isRunningEngine, setIsRunningEngine] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchEngineStatus();
  }, [academicYear]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/v1/attendance-settings', {
        params: { academicYear },
      });

      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setSettings({
          dailyEngineEnabled: d.dailyEngineEnabled ?? false,
          dailyProcessingTime: d.dailyProcessingTime || '06:08:00',
          weeklyEngineEnabled: d.weeklyEngineEnabled ?? false,
          weeklyProcessingTime: d.weeklyProcessingTime || '06:10:00',
          partialDayPenalty: d.partialDayPenalty ?? -5,
          fullDayPenalty: d.fullDayPenalty ?? -10,
          perfectWeekReward: d.perfectWeekReward ?? 30,
          weekStartFullPenalty: d.weekStartFullPenalty ?? -40,
          weekStartPartialPenalty: d.weekStartPartialPenalty ?? -10,
          weekEndFullPenalty: d.weekEndFullPenalty ?? -40,
          weekEndPartialPenalty: d.weekEndPartialPenalty ?? -10,
        });
      }
    } catch (e) {
      logger.warn('Failed to load attendance settings, using defaults:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading('Saving attendance settings...');
    try {
      const payload = {
        academicYear,
        ...settings,
      };

      const res = await apiClient.put('/api/v1/attendance-settings', payload);

      toast.dismiss(toastId);
      if (res.status === 200 || res.data?.success) {
        toast.success('Settings saved successfully');
      } else {
        toast.error(res.data?.message || 'Failed to save settings');
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error(e);
      toast.error(e.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchEngineStatus = async () => {
    setIsLoadingEngine(true);
    try {
      const res = await apiClient.get('/api/v1/attendance-engine/status', {
        params: { academicYear },
      });
      if (res.data?.data || res.data?.success) {
        setEngineStatus(res.data.data || res.data);
      }
    } catch (e) {
      logger.warn('Failed to load engine status:', e);
    } finally {
      setIsLoadingEngine(false);
    }
  };

  const runEngine = async (type: 'daily' | 'weekly' | 'both') => {
    setIsRunningEngine(true);
    const toastId = toast.loading(`Running ${type} engine...`);
    try {
      const endpoint = type === 'both' ? '/api/v1/attendance-engine/run-both' : `/api/v1/attendance-engine/run-${type}`;
      await apiClient.post(endpoint, { academicYear });
      toast.dismiss(toastId);
      toast.success(`${type} engine executed successfully`);
      fetchEngineStatus();
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error(e);
      toast.error(e.response?.data?.message || `Failed to run ${type} engine`);
    } finally {
      setIsRunningEngine(false);
    }
  };

  const resetEngine = async () => {
    setIsRunningEngine(true);
    const toastId = toast.loading('Resetting attendance engine...');
    try {
      await apiClient.post('/api/v1/attendance-engine/reset', { academicYear });
      toast.dismiss(toastId);
      toast.success('Attendance engine reset successfully');
      setShowResetConfirm(false);
      fetchEngineStatus();
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error(e);
      toast.error(e.response?.data?.message || 'Failed to reset engine');
    } finally {
      setIsRunningEngine(false);
    }
  };

  const formatTime12Hr = (timeStr?: string) => {
    if (!timeStr) return 'Not set';
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let h = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    if (isNaN(h) || isNaN(m)) return timeStr;
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    const minStr = m < 10 ? `0${m}` : `${m}`;
    return `${h}:${minStr} ${period}`;
  };

  const toInputTimeFormat = (timeStr?: string) => {
    if (!timeStr) return '06:00';
    const parts = timeStr.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return '06:00';
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-20 bg-bg min-h-full space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-accent" />
        <p className="type-body-sm text-text-secondary font-medium">Loading attendance settings...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-bg text-text-primary pb-20">
      {/* Top Header Bar */}
      <div className="bg-card text-text-primary px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3.5">
          <button 
            onClick={onBack} 
            className="px-3.5 py-2 bg-card border border-border rounded-lg text-text-primary hover:bg-bg transition-colors cursor-pointer flex items-center gap-2 font-bold type-caption"
            title="Back to Attendance"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Attendance</span>
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="type-h3 font-bold text-text-primary tracking-tight">Attendance Settings</h1>
              <span className="px-2.5 py-0.5 rounded-md type-fine font-bold uppercase bg-bg text-text-secondary border border-border">
                {academicYear.replace('_', ' ')}
              </span>
            </div>
            <p className="type-caption text-text-secondary font-medium mt-0.5">
              Configure daily & weekly automated attendance engines and penalty/reward rules
            </p>
          </div>
        </div>

        <button
          type="submit"
          form="attendance-settings-form"
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-card font-bold type-caption rounded-lg transition-colors shadow-none cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Academic Calendar Configuration Button */}
        <div 
          onClick={onNavigateAcademicCalendar}
          className="bg-card p-5 rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-accent/40 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-bg text-text-primary border border-border rounded-lg flex items-center justify-center font-bold group-hover:bg-accent group-hover:text-card group-hover:border-accent transition-colors">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="type-h4 font-bold text-text-primary group-hover:text-accent transition-colors">
                Academic Calendar Configuration
              </h3>
              <p className="type-body-sm text-text-secondary font-medium mt-0.5">
                Configure academic months, weekly boundaries, holidays, and alternate working days
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
        </div>

        <form id="attendance-settings-form" onSubmit={handleSave} className="space-y-6">
          {/* Engine Configuration Card */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-6">
            <div>
              <h2 className="type-h4 font-bold text-text-primary">Engine Configuration</h2>
              <p className="type-body-sm text-text-secondary font-medium mt-0.5">
                Automated cron schedules for awarding or penalizing XP based on daily attendance.
              </p>
            </div>

            {/* Daily Attendance Engine Toggle */}
            <div className="flex items-start justify-between pt-1 border-t border-border pt-4">
              <div>
                <h4 className="type-h5 font-bold text-text-primary">Daily Attendance Engine</h4>
                <p className="type-caption text-text-secondary mt-0.5">Process daily attendance XP at the configured time</p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer type-form-label">
                <input
                  type="checkbox"
                  checked={settings.dailyEngineEnabled}
                  onChange={(e) => setSettings({ ...settings, dailyEngineEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>

            {/* Daily Processing Time */}
            <div className="bg-bg p-4 rounded-lg border border-border flex items-center justify-between">
              <div>
                <span className="block type-caption font-bold text-text-primary">Daily Processing Time</span>
                <span className="type-caption text-text-secondary font-semibold">{formatTime12Hr(settings.dailyProcessingTime)}</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="time"
                  value={toInputTimeFormat(settings.dailyProcessingTime)}
                  onChange={(e) => setSettings({ ...settings, dailyProcessingTime: `${e.target.value}:00` })}
                  className="bg-card border border-border text-text-primary type-caption font-bold rounded-lg px-3 py-1.5 focus:border-text-primary outline-none"
                />
                <Clock className="w-4 h-4 text-text-muted ml-2" />
              </div>
            </div>

            {/* Weekly Attendance Engine Toggle */}
            <div className="flex items-start justify-between border-t border-border pt-4">
              <div>
                <h4 className="type-h5 font-bold text-text-primary">Weekly Attendance Engine</h4>
                <p className="type-caption text-text-secondary mt-0.5">Process weekly perfect attendance rewards and streaks</p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer type-form-label">
                <input
                  type="checkbox"
                  checked={settings.weeklyEngineEnabled}
                  onChange={(e) => setSettings({ ...settings, weeklyEngineEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
              </label>
            </div>

            {/* Weekly Processing Time */}
            <div className="bg-bg p-4 rounded-lg border border-border flex items-center justify-between">
              <div>
                <span className="block type-caption font-bold text-text-primary">Weekly Processing Time</span>
                <span className="type-caption text-text-secondary font-semibold">{formatTime12Hr(settings.weeklyProcessingTime)}</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="time"
                  value={toInputTimeFormat(settings.weeklyProcessingTime)}
                  onChange={(e) => setSettings({ ...settings, weeklyProcessingTime: `${e.target.value}:00` })}
                  className="bg-card border border-border text-text-primary type-caption font-bold rounded-lg px-3 py-1.5 focus:border-text-primary outline-none"
                />
                <Clock className="w-4 h-4 text-text-muted ml-2" />
              </div>
            </div>
          </div>

          {/* Attendance XP Rules Card */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
            <h2 className="type-h4 font-bold text-text-primary border-b border-border pb-3">Attendance XP Rules</h2>

            {/* Partial Day Penalty */}
            <div className="space-y-1.5">
              <label className="type-form-label block font-bold text-text-primary">Partial Day Penalty (e.g. -5)</label>
              <input
                type="number"
                required
                max="0"
                value={settings.partialDayPenalty}
                onChange={(e) => setSettings({ ...settings, partialDayPenalty: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold text-text-primary"
              />
              <p className="type-fine text-text-secondary font-medium">Applied when student misses at least one period</p>
            </div>

            {/* Full Day Penalty */}
            <div className="space-y-1.5">
              <label className="type-form-label block font-bold text-text-primary">Full Day Penalty (e.g. -10)</label>
              <input
                type="number"
                required
                max="0"
                value={settings.fullDayPenalty}
                onChange={(e) => setSettings({ ...settings, fullDayPenalty: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold text-text-primary"
              />
              <p className="type-fine text-text-secondary font-medium">Applied when student is absent for all periods</p>
            </div>

            {/* Perfect Weekly Reward */}
            <div className="space-y-1.5">
              <label className="type-form-label block font-bold text-text-primary">Perfect Weekly Reward (e.g. 30)</label>
              <input
                type="number"
                required
                min="0"
                value={settings.perfectWeekReward}
                onChange={(e) => setSettings({ ...settings, perfectWeekReward: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold text-text-primary"
              />
              <p className="type-fine text-text-secondary font-medium">Awarded when student has zero absences for the full week</p>
            </div>
          </div>

          {/* Week Boundary Penalties Card */}
          <div className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
            <h2 className="type-h4 font-bold text-text-primary border-b border-border pb-3">Week Boundary Penalties</h2>

            {/* Week Start Full Day Penalty */}
            <div className="space-y-1.5">
              <label className="type-form-label block font-bold text-text-primary">Week Start Full Day Penalty (e.g. -40)</label>
              <input
                type="number"
                required
                max="0"
                value={settings.weekStartFullPenalty}
                onChange={(e) => setSettings({ ...settings, weekStartFullPenalty: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold text-text-primary"
              />
            </div>

            {/* Week Start Partial Penalty */}
            <div className="space-y-1.5">
              <label className="type-form-label block font-bold text-text-primary">Week Start Partial Penalty (e.g. -10)</label>
              <input
                type="number"
                required
                max="0"
                value={settings.weekStartPartialPenalty}
                onChange={(e) => setSettings({ ...settings, weekStartPartialPenalty: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold text-text-primary"
              />
            </div>

            {/* Week End Full Day Penalty */}
            <div className="space-y-1.5">
              <label className="type-form-label block font-bold text-text-primary">Week End Full Day Penalty (e.g. -40)</label>
              <input
                type="number"
                required
                max="0"
                value={settings.weekEndFullPenalty}
                onChange={(e) => setSettings({ ...settings, weekEndFullPenalty: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold text-text-primary"
              />
            </div>

            {/* Week End Partial Penalty */}
            <div className="space-y-1.5">
              <label className="type-form-label block font-bold text-text-primary">Week End Partial Penalty (e.g. -10)</label>
              <input
                type="number"
                required
                max="0"
                value={settings.weekEndPartialPenalty}
                onChange={(e) => setSettings({ ...settings, weekEndPartialPenalty: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold text-text-primary"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-accent hover:bg-accent-hover text-card rounded-lg font-bold type-btn transition-colors shadow-none disabled:opacity-50 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Settings...' : 'Save All Settings'}</span>
            </button>
          </div>
        </form>

        {/* Engine Control Card */}
        <div className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
          <h2 className="type-h4 font-bold text-text-primary border-b border-border pb-3">Engine Control Panel</h2>

          {isLoadingEngine ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-accent" />
            </div>
          ) : (
            <>
              {/* Status Display */}
              {engineStatus && (
                <div className="space-y-2 bg-bg p-4 rounded-lg border border-border">
                  <div className="flex items-center gap-2">
                    {engineStatus.dailyEngineStatus ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-text-muted" />
                    )}
                    <span className="type-caption text-text-primary font-bold">Daily Engine: {engineStatus.dailyEngineStatus ? 'Active' : 'Inactive'}</span>
                  </div>
                  {engineStatus.lastDailyRun && (
                    <span className="type-caption text-text-secondary ml-6">Last run: {engineStatus.lastDailyRun}</span>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {engineStatus.weeklyEngineStatus ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-text-muted" />
                    )}
                    <span className="type-caption text-text-primary font-bold">Weekly Engine: {engineStatus.weeklyEngineStatus ? 'Active' : 'Inactive'}</span>
                  </div>
                  {engineStatus.lastWeeklyRun && (
                    <span className="type-caption text-text-secondary ml-6">Last run: {engineStatus.lastWeeklyRun}</span>
                  )}
                </div>
              )}

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 pt-2">
                <button
                  type="button"
                  onClick={() => runEngine('daily')}
                  disabled={isRunningEngine}
                  className="py-2.5 px-3 bg-bg hover:bg-card text-text-primary type-caption font-bold rounded-lg border border-border transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isRunningEngine ? <RefreshCw className="w-3 h-3 animate-spin text-accent" /> : null}
                  Run Daily
                </button>
                <button
                  type="button"
                  onClick={() => runEngine('weekly')}
                  disabled={isRunningEngine}
                  className="py-2.5 px-3 bg-bg hover:bg-card text-text-primary type-caption font-bold rounded-lg border border-border transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isRunningEngine ? <RefreshCw className="w-3 h-3 animate-spin text-accent" /> : null}
                  Run Weekly
                </button>
                <button
                  type="button"
                  onClick={() => runEngine('both')}
                  disabled={isRunningEngine}
                  className="py-2.5 px-3 bg-bg hover:bg-card text-text-primary type-caption font-bold rounded-lg border border-border transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isRunningEngine ? <RefreshCw className="w-3 h-3 animate-spin text-accent" /> : null}
                  Run Both
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={isRunningEngine}
                  className="py-2.5 px-3 bg-accent-tint hover:bg-accent/20 text-accent type-caption font-bold rounded-lg border border-accent/20 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Reset Engine
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-lg p-6 shadow-2xl border border-border space-y-4">
            <h3 className="type-h4 font-bold text-text-primary">Reset Attendance Engine?</h3>
            <p className="type-body-sm text-text-secondary font-medium">This will reset all engine execution records and schedules. This action cannot be easily undone.</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 type-caption font-bold text-text-secondary hover:bg-bg border border-border rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={resetEngine}
                disabled={isRunningEngine}
                className="px-5 py-2 type-caption font-bold text-card bg-accent hover:bg-accent-hover rounded-lg shadow-none transition-colors disabled:opacity-50 cursor-pointer"
              >
                {isRunningEngine ? 'Resetting...' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
