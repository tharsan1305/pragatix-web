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
      <div className="flex flex-col justify-center items-center py-20 bg-bg min-h-full space-y-3">
        <RefreshCw className="w-8 h-8 animate-spin text-accent" />
        <p className="type-body-sm text-text-secondary font-medium">Loading leadership reward settings...</p>
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
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="type-h3 font-bold text-text-primary tracking-tight">Captain Rewards</h1>
              <span className="px-2.5 py-0.5 rounded-md type-fine font-bold uppercase bg-bg text-text-secondary border border-border">
                {academicYear.replace('_', ' ')}
              </span>
            </div>
            <p className="type-caption text-text-secondary font-medium mt-0.5">
              Configure automated weekly XP reward distributions for cohort leaders
            </p>
          </div>
        </div>

        <button
          type="submit"
          form="captain-reward-form"
          disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-card font-bold type-caption rounded-lg transition-colors shadow-none cursor-pointer disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      <div className="p-6 max-w-3xl mx-auto w-full space-y-6">
        <form id="captain-reward-form" onSubmit={handleSave} className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-6">
          {/* Header Card */}
          <div className="bg-bg p-5 rounded-lg border border-border flex items-center space-x-4">
            <div className="p-3 bg-card border border-border rounded-lg text-accent">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="type-h4 font-bold text-text-primary">Automatic Leadership Engine</h3>
              <p className="type-body-sm text-text-secondary font-medium mt-0.5">Awards weekly XP directly to Captains &amp; Vice Captains upon week completion.</p>
            </div>
          </div>

          {/* Engine Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div>
              <h4 className="type-h5 font-bold text-text-primary">Reward Engine</h4>
              <p className="type-caption text-text-secondary mt-0.5">Enable or disable the weekly automated reward engine</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer type-form-label">
              <input
                type="checkbox"
                checked={settings.engineEnabled}
                onChange={(e) => setSettings({ ...settings, engineEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
            </label>
          </div>

          <div className="h-px bg-border" />

          {/* Captain Weekly XP */}
          <div className="space-y-1.5">
            <label className="type-form-label block font-bold text-text-primary">Captain Weekly Reward XP *</label>
            <div className="relative">
              <Star className="w-4 h-4 text-accent absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                required
                value={settings.captainXp}
                onChange={(e) => setSettings({ ...settings, captainXp: parseInt(e.target.value) || 0 })}
                className="w-full pl-10 pr-12 py-2.5 bg-bg border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-bold text-text-primary"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 type-caption font-bold text-text-secondary">XP</span>
            </div>
          </div>

          {/* Vice Captain Weekly XP */}
          <div className="space-y-1.5">
            <label className="type-form-label block font-bold text-text-primary">Vice Captain Weekly Reward XP *</label>
            <div className="relative">
              <Star className="w-4 h-4 text-accent absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                required
                value={settings.viceCaptainXp}
                onChange={(e) => setSettings({ ...settings, viceCaptainXp: parseInt(e.target.value) || 0 })}
                className="w-full pl-10 pr-12 py-2.5 bg-bg border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-bold text-text-primary"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 type-caption font-bold text-text-secondary">XP</span>
            </div>
          </div>

          {/* Execution Time */}
          <div className="space-y-1.5">
            <label className="type-form-label block font-bold text-text-primary">Automated Execution Time (24h) *</label>
            <div className="relative">
              <Clock className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="time"
                required
                value={settings.executionTime}
                onChange={(e) => setSettings({ ...settings, executionTime: e.target.value })}
                className="w-full pl-10 pr-4 py-2.5 bg-bg border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-bold text-text-primary"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 border border-border text-text-secondary rounded-lg font-bold type-caption hover:bg-bg hover:text-text-primary transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-card rounded-lg font-bold type-caption transition-colors shadow-none disabled:opacity-50 flex items-center space-x-1.5 cursor-pointer"
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
