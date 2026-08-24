import { logger } from '../../../../utils/logger';
import { useState, useEffect } from 'react';

import {
  Type, Tag, AlignLeft, Hash, CheckCircle2,
  PlusCircle, MinusCircle, Star, Repeat, BarChart2,
  User, Users, Menu, AlertCircle
} from 'lucide-react';
import { activityService } from '../api/activityService';
import type { ActivityModel } from '../types/ActivityTypes';

interface ActivityFormProps {
  initialData?: Partial<ActivityModel>;
  onSubmit: (data: Partial<ActivityModel>) => void;
  onCancel?: () => void;
  isSubmitting: boolean;
}

export default function ActivityForm({ initialData, onSubmit, onCancel = () => {}, isSubmitting }: ActivityFormProps) {
  const [formData, setFormData] = useState<Partial<ActivityModel>>({
    name: '',
    description: '',
    justification: '',
    type: 'Individual',
    xpCategory: 'Skill',
    xpType: 'Reward',
    awardEnabled: true,
    awardXp: 50,
    penaltyEnabled: false,
    penaltyXp: 0,
    cap: 1,
    awardType: 'Fixed XP',
    awardFrequency: 'Per Assignment',
    evidence: ['Direct Observation'],
    status: 'ACTIVE',
    displayOrder: 1,
    allowStudentRequest: false,
    streakEnabled: false,
    ...initialData
  });

  const [customFrequencies, setCustomFrequencies] = useState<any[]>([]);
  const [xpCategories, setXpCategories] = useState<string[]>([]);
  const [evidenceOptions, setEvidenceOptions] = useState<string[]>([]);

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...initialData,
        name: initialData.name || prev.name || '',
        description: initialData.description || prev.description || '',
        justification: initialData.justification || prev.justification || '',
        awardEnabled: initialData.awardEnabled ?? (initialData.awardXp ? initialData.awardXp > 0 : true),
        awardXp: initialData.awardXp ?? (initialData.xp ? parseInt(String(initialData.xp)) || 50 : 50),
        penaltyEnabled: initialData.penaltyEnabled ?? (initialData.penaltyXp ? initialData.penaltyXp > 0 : false),
        penaltyXp: initialData.penaltyXp ?? 0,
        cap: initialData.cap ?? 1,
        awardType: initialData.awardType || 'Fixed XP',
        awardFrequency: initialData.awardFrequency || initialData.frequency || prev.awardFrequency || 'Per Assignment',
        type: initialData.type || prev.type || 'Individual',
        xpCategory: initialData.xpCategory || prev.xpCategory || 'Skill',
        status: initialData.status || prev.status || 'ACTIVE',
        displayOrder: initialData.displayOrder ?? prev.displayOrder ?? 1,
        allowStudentRequest: initialData.allowStudentRequest ?? prev.allowStudentRequest ?? false,
        streakEnabled: initialData.streakEnabled ?? prev.streakEnabled ?? false,
        evidence: Array.isArray(initialData.evidence)
          ? initialData.evidence
          : (typeof initialData.evidence === 'string' && (initialData.evidence as string).trim()
              ? (initialData.evidence as string).split(',').map(s => s.trim())
              : prev.evidence || ['Direct Observation']),
      }));
    }
  }, [initialData]);

  useEffect(() => {
    Promise.all([
      activityService.fetchCustomFrequencies(),
      activityService.fetchXpCategories(),
      activityService.fetchEvidenceTypes()
    ]).then(([freqs, categories, evidence]) => {
      setCustomFrequencies(freqs);
      setXpCategories(categories);
      setEvidenceOptions(evidence);
    }).catch(logger.error);
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
      xpCategory: formData.xpCategory || 'Skill',
      type: formData.type || 'Individual',
      cap: Number(formData.cap) || 1,
      awardFrequency: formData.awardFrequency || 'Per Assignment',
      frequency: formData.awardFrequency || 'Per Assignment',
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
      allowStudentRequest: formData.allowStudentRequest ?? false,
      streakEnabled: formData.streakEnabled ?? false,
    };

    onSubmit(payload);
  };

  const isPerAssignment = formData.awardFrequency === 'Per Assignment';

  return (
    <form id="activity-form" onSubmit={handleSubmit} className="space-y-5 max-w-2xl mx-auto pb-8">
      
      {/* ── Section 1: Basic Information / Activity Details ───────────────────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-slate-200/80 space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
          <div className="w-7 h-7 rounded-full bg-[#EA4335] text-white flex items-center justify-center font-bold type-caption shadow-xs">
            1
          </div>
          <h3 className="type-h5 text-slate-900">Activity Details</h3>
        </div>

        <div className="space-y-4">
          {/* Event Name */}
          <div>
            <label className="type-form-label text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Type className="w-4 h-4 text-[#EA4335]" />
              <span>Event Name *</span>
            </label>
            <input 
              required 
              type="text" 
              value={formData.name || ''} 
              onChange={e => handleChange('name', e.target.value)} 
              className="w-full p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#EA4335] outline-none type-body-sm font-semibold text-slate-900" 
              placeholder="e.g. Newspaper Reading" 
            />
          </div>

          {/* XP Category & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="type-form-label text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <Tag className="w-4 h-4 text-[#EA4335]" />
                <span>XP Category *</span>
              </label>
              <select
                value={formData.xpCategory}
                onChange={e => handleChange('xpCategory', e.target.value)}
                className="w-full p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl outline-none type-body-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#EA4335] cursor-pointer"
              >
                {xpCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="type-form-label text-slate-700 mb-1.5 flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#EA4335]" />
                <span>Status</span>
              </label>
              <select 
                value={formData.status || 'ACTIVE'} 
                onChange={e => handleChange('status', e.target.value)} 
                className="w-full p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl outline-none type-body-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#EA4335] cursor-pointer"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="type-form-label text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <AlignLeft className="w-4 h-4 text-[#EA4335]" />
              <span>Description</span>
            </label>
            <textarea 
              value={formData.description || ''} 
              onChange={e => handleChange('description', e.target.value)} 
              className="w-full p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#EA4335] outline-none type-body-sm font-medium text-slate-800" 
              rows={2} 
              placeholder="1 Minute Reading in front of class" 
            />
          </div>

          {/* Display Order */}
          <div>
            <label className="type-form-label text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Hash className="w-4 h-4 text-[#EA4335]" />
              <span>Display Order</span>
            </label>
            <input 
              type="number" 
              value={formData.displayOrder ?? 1} 
              onChange={e => handleChange('displayOrder', parseInt(e.target.value) || 1)} 
              className="w-full p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl outline-none type-body-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#EA4335]" 
            />
          </div>
        </div>
      </div>

      {/* ── Section 2: Award Rules (XP Configuration) ────────────────────────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-slate-200/80 space-y-5">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
          <div className="w-7 h-7 rounded-full bg-[#EA4335] text-white flex items-center justify-center font-bold type-caption shadow-xs">
            2
          </div>
          <div>
            <h3 className="type-h5 text-slate-900">Award Rules</h3>
            <p className="type-caption text-slate-400">XP Configuration</p>
          </div>
        </div>

        <div className="space-y-4">
          
          {/* Award XP Switch & Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="type-body-sm font-bold text-slate-900">Award XP</p>
                <p className="type-caption text-slate-500">Award points when student satisfies the activity condition</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer type-form-label">
                <input 
                  type="checkbox" 
                  checked={formData.awardEnabled ?? true} 
                  onChange={e => handleChange('awardEnabled', e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EA4335]"></div>
              </label>
            </div>

            {formData.awardEnabled && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#EA4335]">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <input 
                  type="number" 
                  value={formData.awardXp ?? 50} 
                  onChange={e => handleChange('awardXp', parseInt(e.target.value) || 0)} 
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl outline-none type-body-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#EA4335]" 
                  placeholder="Award XP Value" 
                />
              </div>
            )}
          </div>

          {/* Penalty XP Switch & Input */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="type-body-sm font-bold text-slate-900">Penalty XP</p>
                <p className="type-caption text-slate-500">Deduct points when student violates/fails the activity condition</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer type-form-label">
                <input 
                  type="checkbox" 
                  checked={formData.penaltyEnabled ?? false} 
                  onChange={e => handleChange('penaltyEnabled', e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EA4335]"></div>
              </label>
            </div>

            {formData.penaltyEnabled && (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#EA4335]">
                  <MinusCircle className="w-5 h-5" />
                </div>
                <input 
                  type="number" 
                  value={formData.penaltyXp ?? 100} 
                  onChange={e => handleChange('penaltyXp', parseInt(e.target.value) || 0)} 
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl outline-none type-body-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#EA4335]" 
                  placeholder="Penalty XP Value" 
                />
              </div>
            )}
          </div>

          {/* Warning if neither enabled */}
          {!formData.awardEnabled && !formData.penaltyEnabled && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-2.5 type-caption text-red-700 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>At least one toggle (Award XP or Penalty XP) must be enabled.</span>
            </div>
          )}

          {/* Award Type */}
          <div className="pt-2">
            <label className="type-form-label text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Star className="w-4 h-4 text-[#EA4335]" />
              <span>Award Type</span>
            </label>
            <select 
              value={formData.awardType || 'Fixed XP'} 
              onChange={e => handleChange('awardType', e.target.value)} 
              className="w-full p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl outline-none type-body-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#EA4335] cursor-pointer"
            >
              <option value="Fixed XP">Fixed XP</option>
              <option value="Variable XP (future use)">Variable XP (future use)</option>
            </select>
          </div>

          {/* Award Frequency */}
          <div>
            <label className="type-form-label text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <Repeat className="w-4 h-4 text-[#EA4335]" />
              <span>Award Frequency</span>
            </label>
            <select 
              value={formData.awardFrequency || 'Per Assignment'} 
              onChange={e => handleChange('awardFrequency', e.target.value)} 
              className="w-full p-3.5 bg-slate-50/70 border border-slate-200 rounded-2xl outline-none type-body-sm font-semibold text-slate-900 focus:ring-2 focus:ring-[#EA4335] cursor-pointer"
            >
              <option value="Per Assignment">Per Assignment</option>
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
              <option value="One Time">One Time</option>
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
            {isPerAssignment && (
              <p className="type-caption text-slate-500 italic mt-1.5">
                XP is awarded for every assignment submission. No cap limit.
              </p>
            )}
          </div>

          {/* Cap */}
          <div>
            <label className="type-form-label text-slate-700 mb-1.5 flex items-center space-x-1.5">
              <BarChart2 className="w-4 h-4 text-[#EA4335]" />
              <span>Cap {isPerAssignment ? '(Unlimited)' : ''}</span>
            </label>
            <input 
              type="number" 
              value={formData.cap ?? 1} 
              disabled={isPerAssignment}
              onChange={e => handleChange('cap', parseInt(e.target.value) || 1)} 
              className={`w-full p-3.5 border border-slate-200 rounded-2xl outline-none type-body-sm font-semibold text-slate-900 ${
                isPerAssignment ? 'bg-slate-100/80 text-slate-400 cursor-not-allowed' : 'bg-slate-50/70 focus:ring-2 focus:ring-[#EA4335]'
              }`} 
            />
          </div>

        </div>
      </div>

      {/* ── Section 3: Evidence ─────────────────────────────────────────────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-slate-200/80 space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
          <div className="w-7 h-7 rounded-full bg-[#EA4335] text-white flex items-center justify-center font-bold type-caption shadow-xs">
            3
          </div>
          <h3 className="type-h5 text-slate-900">Evidence</h3>
        </div>

        <div className="space-y-1">
          {evidenceOptions.map(opt => {
            const current = Array.isArray(formData.evidence)
              ? formData.evidence
              : (typeof formData.evidence === 'string' && (formData.evidence as string).trim() ? [formData.evidence] : []);
            const isChecked = current.includes(opt);

            return (
              <label 
                key={opt}
                onClick={() => toggleEvidence(opt)}
                className={`flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer select-none ${
                  isChecked 
                    ? 'bg-rose-50/70 border border-rose-100' 
                    : 'hover:bg-slate-50 border border-transparent'
                }`}
              >
                <span className={`type-body-sm font-semibold ${isChecked ? 'text-slate-900' : 'text-slate-700'}`}>
                  {opt}
                </span>
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  isChecked 
                    ? 'bg-[#EA4335] border-[#EA4335] text-white' 
                    : 'border-slate-400 bg-white'
                }`}>
                  {isChecked && (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── Section 4: Activity Type (Segmented Cards) ─────────────────────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-slate-200/80 space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
          <div className="w-7 h-7 rounded-full bg-[#EA4335] text-white flex items-center justify-center font-bold type-caption shadow-xs">
            4
          </div>
          <h3 className="type-h5 text-slate-900">Activity Type</h3>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Individual Card */}
          <button
            type="button"
            onClick={() => handleChange('type', 'Individual')}
            className={`py-5 px-4 rounded-2xl flex flex-col items-center justify-center space-y-2 border transition-all cursor-pointer ${
              formData.type === 'Individual'
                ? 'bg-[#EA4335] border-[#EA4335] text-white shadow-lg shadow-red-500/25 scale-[1.02]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <User className={`w-7 h-7 ${formData.type === 'Individual' ? 'text-white' : 'text-slate-500'}`} />
            <span className="font-bold type-body-sm">Individual</span>
          </button>

          {/* Group Card */}
          <button
            type="button"
            onClick={() => handleChange('type', 'Group')}
            className={`py-5 px-4 rounded-2xl flex flex-col items-center justify-center space-y-2 border transition-all cursor-pointer ${
              formData.type === 'Group'
                ? 'bg-[#EA4335] border-[#EA4335] text-white shadow-lg shadow-red-500/25 scale-[1.02]'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className={`w-7 h-7 ${formData.type === 'Group' ? 'text-white' : 'text-slate-500'}`} />
            <span className="font-bold type-body-sm">Group</span>
          </button>
        </div>
      </div>

      {/* ── Standalone Card: Allow Student Request ─────────────────────────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="pr-4">
            <h4 className="type-body-sm font-bold text-slate-900">Allow Student Request</h4>
            <p className="type-caption text-slate-500 mt-0.5">Students can submit a completion request for this activity.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 type-form-label">
            <input 
              type="checkbox" 
              checked={formData.allowStudentRequest ?? false} 
              onChange={e => handleChange('allowStudentRequest', e.target.checked)} 
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EA4335]"></div>
          </label>
        </div>
      </div>

      {/* ── Standalone Card: Enable Streak ─────────────────────────────────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="pr-4">
            <h4 className="type-body-sm font-bold text-slate-900">Enable Streak</h4>
            <p className="type-caption text-slate-500 mt-0.5">Track consecutive streaks for this activity automatically.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0 type-form-label">
            <input 
              type="checkbox" 
              checked={formData.streakEnabled ?? false} 
              onChange={e => handleChange('streakEnabled', e.target.checked)} 
              className="sr-only peer" 
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#EA4335]"></div>
          </label>
        </div>
      </div>

      {/* ── Section 5: Justification (Optional) ─────────────────────────────────── */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl shadow-xs border border-slate-200/80 space-y-4">
        <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
          <div className="w-7 h-7 rounded-full bg-[#EA4335] text-white flex items-center justify-center font-bold type-caption shadow-xs">
            5
          </div>
          <h3 className="type-h5 text-slate-900">Justification (Optional)</h3>
        </div>

        <div className="relative">
          <div className="absolute top-3.5 left-3.5 text-[#EA4335] pointer-events-none">
            <Menu className="w-5 h-5" />
          </div>
          <textarea 
            value={formData.justification || ''} 
            onChange={e => handleChange('justification', e.target.value)} 
            className="w-full pl-11 pr-4 py-3 bg-slate-50/70 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-[#EA4335] outline-none type-body-sm font-medium text-slate-800" 
            rows={2} 
            placeholder="One Minute Reading in front of class" 
          />
        </div>
      </div>

      {/* ── Sticky Bottom Action Bar (Flutter Parity) ──────────────────────────── */}
      <div className="sticky bottom-0 bg-white/95 backdrop-blur-md -mx-4 sm:-mx-6 px-6 py-3.5 border-t border-slate-200/80 flex justify-between items-center gap-4 z-20 shadow-lg rounded-t-2xl">
        <button 
          type="button" 
          onClick={onCancel}
          className="flex-1 py-3 px-5 border border-slate-300 text-slate-700 type-body-sm font-bold rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer text-center"
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isSubmitting} 
          className="flex-1 py-3 px-5 bg-[#EA4335] hover:bg-red-600 text-white type-body-sm font-bold rounded-2xl shadow-md disabled:opacity-50 transition-all active:scale-95 cursor-pointer text-center"
        >
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

    </form>
  );
}
