import { logger } from '../../../../utils/logger';
import { useState, useEffect } from 'react';
import { Type, Tag, AlignLeft, Hash, CheckCircle2, Award, ShieldAlert, BookOpen, FileText } from 'lucide-react';
import { activityService } from '../api/activityService';
import type { ActivityModel } from '../types/ActivityTypes';

interface ActivityFormProps {
  initialData?: Partial<ActivityModel>;
  onSubmit: (data: Partial<ActivityModel>) => void;
  onCancel?: () => void;
  isSubmitting: boolean;
}

const XP_CATEGORIES = [
  'Academic', 'Skill', 'Communication', 'Leadership', 'Discipline',
  'Placement', 'Innovation', 'Community', 'Sports', 'Cultural'
];

const EVIDENCE_OPTIONS = [
  'Handwritten', 'Soft Copy', 'Diary / Notebook', 'Weekly Log',
  'Direct Observation', 'Attendance Register', 'ERP Attendance'
];

export default function ActivityForm({ initialData, onSubmit, onCancel = () => {}, isSubmitting }: ActivityFormProps) {
  const [formData, setFormData] = useState<Partial<ActivityModel>>({
    name: '',
    description: '',
    justification: '',
    type: 'Individual',
    xpCategory: 'Academic',
    xpType: 'Reward',
    awardEnabled: true,
    awardXp: 50,
    penaltyEnabled: false,
    penaltyXp: 0,
    cap: 1,
    awardFrequency: 'Daily',
    evidence: [],
    status: 'ACTIVE',
    displayOrder: 1,
    allowStudentRequest: false,
    ...initialData
  });

  const [customFrequencies, setCustomFrequencies] = useState<any[]>([]);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        name: initialData.name || prev.name || '',
        description: initialData.description || prev.description || '',
        justification: initialData.justification || prev.justification || '',
        awardXp: initialData.awardXp ?? (initialData.xp ? parseInt(String(initialData.xp)) || 50 : 50),
        awardFrequency: initialData.awardFrequency || initialData.frequency || prev.awardFrequency || 'Daily',
        type: initialData.type || prev.type || 'Individual',
        xpCategory: initialData.xpCategory || prev.xpCategory || 'Academic',
        status: initialData.status || prev.status || 'ACTIVE',
        displayOrder: initialData.displayOrder ?? prev.displayOrder ?? 1,
      }));
    }
  }, [initialData]);

  useEffect(() => {
    activityService.fetchCustomFrequencies().then(setCustomFrequencies).catch(logger.error);
  }, []);

  const handleChange = (field: keyof ActivityModel, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleEvidence = (ev: string) => {
    const current = Array.isArray(formData.evidence) 
      ? formData.evidence 
      : (typeof formData.evidence === 'string' && (formData.evidence as string).trim() ? [formData.evidence as string] : []);
    
    if (current.includes(ev)) {
      handleChange('evidence', current.filter((e: string) => e !== ev));
    } else {
      handleChange('evidence', [...current, ev]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const currentEvidence = Array.isArray(formData.evidence) 
      ? formData.evidence 
      : (typeof formData.evidence === 'string' && (formData.evidence as string).trim() ? [formData.evidence] : []);

    let computedXpType = 'Reward';
    if (formData.awardEnabled && formData.penaltyEnabled) {
      computedXpType = 'Mixed';
    } else if (formData.penaltyEnabled && !formData.awardEnabled) {
      computedXpType = 'Penalty';
    } else {
      computedXpType = 'Reward';
    }

    const payload: Partial<ActivityModel> = {
      ...formData,
      name: formData.name?.trim() || '',
      description: formData.description?.trim() || '',
      evidence: currentEvidence,
      justification: formData.justification?.trim() || '',
      xpCategory: formData.xpCategory || 'Academic',
      type: formData.type || 'Individual',
      cap: Number(formData.cap) || 1,
      awardFrequency: formData.awardFrequency || 'Daily',
      frequency: formData.awardFrequency || 'Daily',
      displayOrder: Number(formData.displayOrder) || 1,
      status: formData.status || 'ACTIVE',
      awardXp: formData.awardEnabled ? (Number(formData.awardXp) || 0) : 0,
      penaltyXp: formData.penaltyEnabled ? (Number(formData.penaltyXp) || 0) : 0,
      awardEnabled: formData.awardEnabled ?? true,
      penaltyEnabled: formData.penaltyEnabled ?? false,
      awardType: formData.awardType || 'Fixed XP',
      awardDays: Array.isArray(formData.awardDays) ? formData.awardDays.filter(d => typeof d === 'string' && d.trim().length > 0) : [],
      xp: String(formData.awardEnabled ? (Number(formData.awardXp) || 50) : 0),
      xpType: computedXpType,
    };

    onSubmit(payload);
  };

  return (
    <form id="activity-form" onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
      {/* Section 1: Activity Details */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-7 h-7 rounded-full bg-[#EA4335] text-white flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="text-lg font-bold text-slate-900">Activity Details</h3>
        </div>

        <div className="space-y-4">
          {/* Event Name */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Type className="w-4 h-4 text-[#EA4335]" />
              <span>Event Name *</span>
            </label>
            <input 
              required 
              type="text" 
              value={formData.name || ''} 
              onChange={e => handleChange('name', e.target.value)} 
              className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#EA4335] outline-none text-sm font-medium" 
              placeholder="e.g. Monday Remember / Regret Journal" 
            />
          </div>

          {/* XP Category & Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Tag className="w-4 h-4 text-[#EA4335]" />
                <span>XP Category *</span>
              </label>
              <select 
                value={formData.xpCategory} 
                onChange={e => handleChange('xpCategory', e.target.value)} 
                className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-[#EA4335]"
              >
                {XP_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-[#EA4335]" />
                <span>Activity Type *</span>
              </label>
              <select 
                value={formData.type} 
                onChange={e => handleChange('type', e.target.value)} 
                className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-[#EA4335]"
              >
                <option value="Individual">Individual</option>
                <option value="Group">Group</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <AlignLeft className="w-4 h-4 text-[#EA4335]" />
              <span>Description</span>
            </label>
            <textarea 
              value={formData.description || ''} 
              onChange={e => handleChange('description', e.target.value)} 
              className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#EA4335] outline-none text-sm font-medium" 
              rows={3} 
              placeholder="Provide event details..." 
            />
          </div>

          {/* Display Order & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Hash className="w-4 h-4 text-[#EA4335]" />
                <span>Display Order</span>
              </label>
              <input 
                type="number" 
                value={formData.displayOrder ?? 1} 
                onChange={e => handleChange('displayOrder', parseInt(e.target.value) || 1)} 
                className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-[#EA4335]" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#EA4335]" />
                <span>Status</span>
              </label>
              <select 
                value={formData.status || 'ACTIVE'} 
                onChange={e => handleChange('status', e.target.value)} 
                className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm font-medium focus:ring-2 focus:ring-[#EA4335]"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: XP Rules */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-7 h-7 rounded-full bg-[#EA4335] text-white flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h3 className="text-lg font-bold text-slate-900">XP Rules & Frequency</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                <span>Award XP</span>
              </label>
              <input 
                type="number" 
                value={formData.awardXp ?? 50} 
                onChange={e => handleChange('awardXp', parseInt(e.target.value) || 0)} 
                className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm font-medium" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                <span>Penalty XP</span>
              </label>
              <input 
                type="number" 
                value={formData.penaltyXp ?? 0} 
                onChange={e => handleChange('penaltyXp', parseInt(e.target.value) || 0)} 
                className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm font-medium" 
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Hash className="w-4 h-4 text-teal-600" />
                <span>Max Cap</span>
              </label>
              <input 
                type="number" 
                value={formData.cap ?? 1} 
                onChange={e => handleChange('cap', parseInt(e.target.value) || 1)} 
                className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm font-medium" 
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Frequency</label>
            <select 
              value={formData.awardFrequency || 'Daily'} 
              onChange={e => handleChange('awardFrequency', e.target.value)} 
              className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none text-sm font-medium bg-white"
            >
              <option value="One Time">One Time</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="Per Assignment">Per Assignment</option>
              {Array.from(new Set(
                customFrequencies
                  .map(cf => (typeof cf === 'string' ? cf : cf.name || '').trim())
                  .filter(name => {
                    if (!name) return false;
                    const lower = name.toLowerCase();
                    const standardNames = ['one time', 'daily', 'weekly', 'monthly', 'per assignment'];
                    if (standardNames.includes(lower)) return false;
                    if (lower.startsWith('freq_') || lower.startsWith('f_')) return false;
                    return true;
                  })
              )).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Section 3: Requirements */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 space-y-5">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-4">
          <div className="w-7 h-7 rounded-full bg-[#EA4335] text-white flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h3 className="text-lg font-bold text-slate-900">Requirements & Evidence</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Evidence Required</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {EVIDENCE_OPTIONS.map(ev => {
                const current = Array.isArray(formData.evidence) 
                  ? formData.evidence 
                  : (typeof formData.evidence === 'string' && (formData.evidence as string).trim() ? [formData.evidence] : []);
                const selected = current.includes(ev);

                return (
                  <button 
                    type="button" 
                    key={ev} 
                    onClick={() => toggleEvidence(ev)} 
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      selected 
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {ev}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 mb-1.5 block">Justification / Rationale</label>
            <textarea 
              value={formData.justification || ''} 
              onChange={e => handleChange('justification', e.target.value)} 
              className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#EA4335] outline-none text-sm font-medium" 
              rows={2} 
              placeholder="Why is this activity important?" 
            />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar matching Flutter */}
      <div className="flex justify-end items-center gap-3 pt-4 pb-12">
        <button 
          type="button" 
          onClick={onCancel}
          className="px-6 py-3 border border-slate-300 text-slate-700 text-sm font-bold rounded-2xl hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="px-8 py-3 bg-[#EA4335] hover:bg-red-600 text-white text-sm font-bold rounded-2xl shadow-lg disabled:opacity-50 transition-all active:scale-95"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}
