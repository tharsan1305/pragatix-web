import { useEffect, useState } from 'react';
import { ArrowLeft, Save, RotateCcw, CalendarCheck, AlertTriangle, Percent, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

interface Props {
  academicYear: string;
  onBack: () => void;
}

export default function AttendanceSettingsPage({ academicYear, onBack }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    minAttendancePercentage: 75,
    penaltyXpPerDay: 10,
    warningThreshold: 80,
    autoLockEnabled: true,
  });

  useEffect(() => {
    fetchSettings();
  }, [academicYear]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      let res;
      try {
        res = await apiClient.get('/api/v1/admin/attendance-settings', {
          params: { academicYear },
        });
      } catch (_e) {
        res = await apiClient.get('/api/admin/attendance-settings', {
          params: { academicYear },
        });
      }

      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setSettings({
          minAttendancePercentage: d.minAttendancePercentage ?? 75,
          penaltyXpPerDay: d.penaltyXpPerDay ?? 10,
          warningThreshold: d.warningThreshold ?? 80,
          autoLockEnabled: d.autoLockEnabled ?? true,
        });
      }
    } catch (e) {
      console.warn('Failed to load attendance settings, using defaults:', e);
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

      let res;
      try {
        res = await apiClient.put('/api/v1/admin/attendance-settings', payload);
      } catch (_e) {
        res = await apiClient.post('/api/v1/admin/attendance-settings', payload);
      }

      toast.dismiss(toastId);
      if (res.status === 200 || res.data?.success) {
        toast.success('Attendance settings saved successfully!');
      } else {
        toast.error(res.data?.message || 'Failed to save settings');
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error(e);
      toast.error(e.response?.data?.message || 'Failed to save attendance settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      minAttendancePercentage: 75,
      penaltyXpPerDay: 10,
      warningThreshold: 80,
      autoLockEnabled: true,
    });
    toast.success('Settings reset to default values');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20 bg-slate-50 min-h-full">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 pb-20">
      <div className="bg-slate-900 px-6 pt-10 pb-5 shadow-md text-white flex items-center space-x-4">
        <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Attendance Settings — {academicYear.replace('_', ' ')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">Configure minimum percentage, warnings & absence penalties</p>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto w-full">
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          {/* Header Card */}
          <div className="bg-slate-900 p-5 rounded-xl text-white flex items-center space-x-4">
            <div className="p-3 bg-teal-500/20 rounded-xl text-teal-400">
              <CalendarCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-bold text-base">Attendance Threshold Rules</h3>
              <p className="text-xs text-slate-300 mt-0.5">Defines attendance criteria required for stage progression & reward qualification.</p>
            </div>
          </div>

          {/* Min Attendance Percentage */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Minimum Required Attendance % *</label>
            <div className="relative">
              <Percent className="w-4 h-4 text-teal-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                required
                min="0"
                max="100"
                value={settings.minAttendancePercentage}
                onChange={(e) => setSettings({ ...settings, minAttendancePercentage: parseInt(e.target.value) || 0 })}
                className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-600 text-sm font-bold text-slate-800"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
            </div>
          </div>

          {/* Warning Threshold */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Warning Alert Threshold % *</label>
            <div className="relative">
              <AlertTriangle className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                required
                min="0"
                max="100"
                value={settings.warningThreshold}
                onChange={(e) => setSettings({ ...settings, warningThreshold: parseInt(e.target.value) || 0 })}
                className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-600 text-sm font-bold text-slate-800"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">%</span>
            </div>
          </div>

          {/* Penalty XP Per Absence Day */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Absence Penalty XP per Day *</label>
            <div className="relative">
              <input
                type="number"
                required
                min="0"
                value={settings.penaltyXpPerDay}
                onChange={(e) => setSettings({ ...settings, penaltyXpPerDay: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-600 text-sm font-bold text-slate-800"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">XP</span>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Auto Lock Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Auto-Lock Low Attendance</h4>
              <p className="text-xs text-slate-400 mt-0.5">Automatically lock stage progression if attendance drops below minimum cutoff</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoLockEnabled}
                onChange={(e) => setSettings({ ...settings, autoLockEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2.5 border border-slate-300 text-slate-600 rounded-xl font-bold text-xs hover:bg-slate-100 transition-colors flex items-center space-x-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
