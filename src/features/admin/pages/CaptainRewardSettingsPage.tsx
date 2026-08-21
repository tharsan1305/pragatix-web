import { logger } from '../../../utils/logger';
import { useEffect, useState } from 'react';
import { ArrowLeft, Save, RotateCcw, Clock, Star, ShieldCheck, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

interface Props {
  academicYear: string;
  onBack: () => void;
}

export default function CaptainRewardSettingsPage({ academicYear, onBack }: Props) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [settings, setSettings] = useState({
    engineEnabled: true,
    captainXp: 20,
    viceCaptainXp: 10,
    executionTime: '23:30',
  });

  useEffect(() => {
    fetchSettings();
  }, [academicYear]);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/v1/admin/captain-reward/settings/${academicYear}`);
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        setSettings({
          engineEnabled: d.engineEnabled ?? true,
          captainXp: d.captainXp ?? 20,
          viceCaptainXp: d.viceCaptainXp ?? 10,
          executionTime: d.executionTime || '23:30',
        });
      }
    } catch (e) {
      logger.warn('Failed to load captain reward settings from API, using defaults:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const toastId = toast.loading('Saving captain reward settings...');
    try {
      const payload = {
        academicYear,
        ...settings,
      };

      const res = await apiClient.put(`/api/v1/admin/captain-reward/settings/${academicYear}`, payload);

      toast.dismiss(toastId);
      if (res.status === 200 || res.data?.success) {
        toast.success('Captain reward settings saved successfully!');
      } else {
        toast.error(res.data?.message || 'Failed to save settings');
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error(e);
      toast.error(e.response?.data?.message || 'Failed to save captain reward settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      engineEnabled: false,
      captainXp: 20,
      viceCaptainXp: 10,
      executionTime: '23:30',
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
          <h1 className="font-heading text-xl font-bold">Captain Rewards — {academicYear.replace('_', ' ')}</h1>
          <p className="text-xs text-slate-400 mt-0.5">Configure automated weekly XP rewards for section leaders</p>
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto w-full">
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          {/* Header Card */}
          <div className="bg-slate-900 p-5 rounded-xl text-white flex items-center space-x-4">
            <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-base">Automatic Leadership Engine</h3>
              <p className="text-xs text-slate-300 mt-0.5">Awards weekly XP directly to Captains & Vice Captains at week end.</p>
            </div>
          </div>

          {/* Engine Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Reward Engine</h4>
              <p className="text-xs text-slate-400 mt-0.5">Enable/Disable the weekly automated reward engine</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.engineEnabled}
                onChange={(e) => setSettings({ ...settings, engineEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Captain Weekly XP */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Captain Weekly Reward XP *</label>
            <div className="relative">
              <Star className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                required
                value={settings.captainXp}
                onChange={(e) => setSettings({ ...settings, captainXp: parseInt(e.target.value) || 0 })}
                className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-bold text-slate-800"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">XP</span>
            </div>
          </div>

          {/* Vice Captain Weekly XP */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Vice Captain Weekly Reward XP *</label>
            <div className="relative">
              <Star className="w-4 h-4 text-amber-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                required
                value={settings.viceCaptainXp}
                onChange={(e) => setSettings({ ...settings, viceCaptainXp: parseInt(e.target.value) || 0 })}
                className="w-full pl-10 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-bold text-slate-800"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">XP</span>
            </div>
          </div>

          {/* Execution Time */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">Automated Execution Time (24h) *</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-indigo-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="time"
                required
                value={settings.executionTime}
                onChange={(e) => setSettings({ ...settings, executionTime: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-600 text-sm font-bold text-slate-800"
              />
            </div>
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
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs transition-colors shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
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
