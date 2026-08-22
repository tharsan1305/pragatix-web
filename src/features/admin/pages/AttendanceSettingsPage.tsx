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
      <div className="flex justify-center items-center py-20 bg-slate-50 min-h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 pb-20">
      {/* Header Bar */}
      <div className="bg-[#1E293B] px-6 pt-10 pb-5 shadow-md text-white flex items-center space-x-4">
        <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-heading text-xl font-bold text-white">Attendance Settings</h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-4">
        {/* Academic Calendar Configuration Button */}
        <div 
          onClick={onNavigateAcademicCalendar}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-slate-900 text-base">Academic Calendar Configuration</h3>
              <p className="text-xs text-slate-500 mt-0.5">Configure Months, Weeks, and Holidays</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Engine Configuration Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="font-heading text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Engine Configuration</h2>

            {/* Daily Attendance Engine Toggle */}
            <div className="flex items-start justify-between pt-1">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Daily Attendance Engine</h4>
                <p className="text-xs text-slate-500 mt-0.5">Process daily attendance XP at the configured time</p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.dailyEngineEnabled}
                  onChange={(e) => setSettings({ ...settings, dailyEngineEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9E6554]"></div>
              </label>
            </div>

            {/* Daily Processing Time */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-slate-700">Daily Processing Time</span>
                <span className="text-xs text-slate-500 font-semibold">{formatTime12Hr(settings.dailyProcessingTime)}</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="time"
                  value={toInputTimeFormat(settings.dailyProcessingTime)}
                  onChange={(e) => setSettings({ ...settings, dailyProcessingTime: `${e.target.value}:00` })}
                  className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-slate-400 outline-none"
                />
                <Clock className="w-4 h-4 text-slate-400 ml-2" />
              </div>
            </div>

            <div className="h-px bg-slate-100 my-2" />

            {/* Weekly Attendance Engine Toggle */}
            <div className="flex items-start justify-between pt-1">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Weekly Attendance Engine</h4>
                <p className="text-xs text-slate-500 mt-0.5">Process weekly perfect attendance rewards</p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.weeklyEngineEnabled}
                  onChange={(e) => setSettings({ ...settings, weeklyEngineEnabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#9E6554]"></div>
              </label>
            </div>

            {/* Weekly Processing Time */}
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="block text-xs font-bold text-slate-700">Weekly Processing Time</span>
                <span className="text-xs text-slate-500 font-semibold">{formatTime12Hr(settings.weeklyProcessingTime)}</span>
              </div>
              <div className="relative flex items-center">
                <input
                  type="time"
                  value={toInputTimeFormat(settings.weeklyProcessingTime)}
                  onChange={(e) => setSettings({ ...settings, weeklyProcessingTime: `${e.target.value}:00` })}
                  className="bg-white border border-slate-300 text-slate-800 text-xs font-bold rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-slate-400 outline-none"
                />
                <Clock className="w-4 h-4 text-slate-400 ml-2" />
              </div>
            </div>
          </div>

          {/* Attendance XP Rules Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="font-heading text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Attendance XP Rules</h2>

            {/* Partial Day Penalty */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Partial Day Penalty (e.g. -5)</label>
              <input
                type="number"
                required
                max="0"
                value={settings.partialDayPenalty}
                onChange={(e) => setSettings({ ...settings, partialDayPenalty: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 text-sm font-semibold text-slate-800"
              />
              <p className="text-[11px] text-slate-500">Applied when student misses at least one period</p>
            </div>

            {/* Full Day Penalty */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Full Day Penalty (e.g. -10)</label>
              <input
                type="number"
                required
                max="0"
                value={settings.fullDayPenalty}
                onChange={(e) => setSettings({ ...settings, fullDayPenalty: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 text-sm font-semibold text-slate-800"
              />
              <p className="text-[11px] text-slate-500">Applied when student is absent for all periods</p>
            </div>

            {/* Perfect Weekly Reward */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Perfect Weekly Reward (e.g. 30)</label>
              <input
                type="number"
                required
                min="0"
                value={settings.perfectWeekReward}
                onChange={(e) => setSettings({ ...settings, perfectWeekReward: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 text-sm font-semibold text-slate-800"
              />
              <p className="text-[11px] text-slate-500">Awarded when student has zero absences for the full week</p>
            </div>
          </div>

          {/* Week Boundary Penalties Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="font-heading text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Week Boundary Penalties</h2>

            {/* Week Start Full Day Penalty */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Week Start Full Day Penalty (e.g. -40)</label>
              <input
                type="number"
                required
                max="0"
                value={settings.weekStartFullPenalty}
                onChange={(e) => setSettings({ ...settings, weekStartFullPenalty: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 text-sm font-semibold text-slate-800"
              />
            </div>

            {/* Week Start Partial Penalty */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Week Start Partial Penalty (e.g. -10)</label>
              <input
                type="number"
                required
                max="0"
                value={settings.weekStartPartialPenalty}
                onChange={(e) => setSettings({ ...settings, weekStartPartialPenalty: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 text-sm font-semibold text-slate-800"
              />
            </div>

            {/* Week End Full Day Penalty */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Week End Full Day Penalty (e.g. -40)</label>
              <input
                type="number"
                required
                max="0"
                value={settings.weekEndFullPenalty}
                onChange={(e) => setSettings({ ...settings, weekEndFullPenalty: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 text-sm font-semibold text-slate-800"
              />
            </div>

            {/* Week End Partial Penalty */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Week End Partial Penalty (e.g. -10)</label>
              <input
                type="number"
                required
                max="0"
                value={settings.weekEndPartialPenalty}
                onChange={(e) => setSettings({ ...settings, weekEndPartialPenalty: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-slate-400 text-sm font-semibold text-slate-800"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-4 bg-[#1E293B] hover:bg-slate-800 text-white rounded-xl font-bold text-base transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{isSaving ? 'Saving...' : 'Save All Settings'}</span>
            </button>
          </div>
        </form>

        {/* Engine Control Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4 mt-4">
          <h2 className="font-heading text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Engine Control Panel</h2>

          {isLoadingEngine ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : (
            <>
              {/* Status Display */}
              {engineStatus && (
                <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    {engineStatus.dailyEngineStatus ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs font-semibold text-slate-700">Daily Engine: {engineStatus.dailyEngineStatus ? 'Active' : 'Inactive'}</span>
                  </div>
                  {engineStatus.lastDailyRun && (
                    <span className="text-xs text-slate-500 ml-6">Last run: {engineStatus.lastDailyRun}</span>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {engineStatus.weeklyEngineStatus ? (
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                    )}
                    <span className="text-xs font-semibold text-slate-700">Weekly Engine: {engineStatus.weeklyEngineStatus ? 'Active' : 'Inactive'}</span>
                  </div>
                  {engineStatus.lastWeeklyRun && (
                    <span className="text-xs text-slate-500 ml-6">Last run: {engineStatus.lastWeeklyRun}</span>
                  )}
                </div>
              )}

              {/* Control Buttons */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => runEngine('daily')}
                  disabled={isRunningEngine}
                  className="py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isRunningEngine ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                  Run Daily
                </button>
                <button
                  type="button"
                  onClick={() => runEngine('weekly')}
                  disabled={isRunningEngine}
                  className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isRunningEngine ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                  Run Weekly
                </button>
                <button
                  type="button"
                  onClick={() => runEngine('both')}
                  disabled={isRunningEngine}
                  className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  {isRunningEngine ? <RefreshCw className="w-3 h-3 animate-spin" /> : null}
                  Run Both
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  disabled={isRunningEngine}
                  className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-colors disabled:opacity-50"
                >
                  Reset
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-heading font-bold text-base text-slate-900">Reset Attendance Engine?</h3>
            <p className="text-sm text-slate-600">This will reset all engine runs and schedules. This action cannot be easily undone. Are you sure?</p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={resetEngine}
                disabled={isRunningEngine}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-colors disabled:opacity-50"
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
