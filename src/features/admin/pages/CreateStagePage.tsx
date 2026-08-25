import { logger } from '../../../utils/logger';
import { useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

interface Props {
  onBack: () => void;
}

export default function CreateStagePage({ onBack }: Props) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    displayOrder: '0',
    expectedXp: '0',
    mustThreshold: '0',
    individualThreshold: '0',
    groupThreshold: '0',
    academicYear: 'FIRST_YEAR'
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Stage name is required");
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading("Creating stage...");
    try {
      const payload: any = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        displayOrder: parseInt(formData.displayOrder) || 0,
        expectedXp: parseInt(formData.expectedXp) || 0,
        mustThreshold: parseInt(formData.mustThreshold) || 0,
        individualThreshold: parseInt(formData.individualThreshold) || 0,
        groupThreshold: parseInt(formData.groupThreshold) || 0,
        academicYear: formData.academicYear
      };

      const response = await apiClient.post('/api/v1/admin/stages', payload);
      toast.dismiss(toastId);
      if (response.data?.success || response.status === 200 || response.status === 201) {
        toast.success("Stage created successfully!");
        onBack();
      } else {
        toast.error(response.data?.message || 'Failed to create stage');
      }
    } catch (error: any) {
      toast.dismiss(toastId);
      logger.error(error);
      toast.error(error.response?.data?.message || 'Error creating stage');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-bg text-text-primary">
      {/* Top Header Bar */}
      <div className="bg-card text-text-primary px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <button 
            onClick={onBack} 
            className="px-3.5 py-2 bg-card border border-border rounded-lg text-text-primary hover:bg-bg transition-colors cursor-pointer flex items-center gap-2 font-bold type-caption"
            title="Back to Stages"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Stages</span>
          </button>
          <div>
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">Create Stage</h1>
            <p className="type-body-sm text-text-secondary font-medium mt-0.5">
              Define a new milestone stage for the academic progression pipeline
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
        <form onSubmit={handleSave} className="bg-card rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border p-6 space-y-6">
          <div>
            <h2 className="type-h4 font-bold text-text-primary">Stage Configuration</h2>
            <p className="type-body-sm text-text-secondary font-medium mt-0.5">Configure targets and XP limits for this cohort stage.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="type-form-label text-text-primary font-bold">Stage Name *</label>
              <input 
                required 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Spark, Ignite, Transcend"
                className="w-full p-2.5 bg-bg border border-border rounded-lg focus:border-text-primary outline-none type-body-sm font-semibold text-text-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="type-form-label text-text-primary font-bold">Academic Year *</label>
              <select
                value={formData.academicYear}
                onChange={e => setFormData({...formData, academicYear: e.target.value})}
                className="w-full p-2.5 bg-bg border border-border rounded-lg focus:border-text-primary outline-none type-body-sm font-semibold text-text-primary cursor-pointer"
              >
                <option value="FIRST_YEAR">First Year</option>
                <option value="SECOND_YEAR">Second Year</option>
                <option value="THIRD_YEAR">Third Year</option>
                <option value="FINAL_YEAR">Fourth Year</option>
              </select>
            </div>
            
            <div className="space-y-1.5">
              <label className="type-form-label text-text-primary font-bold">Description</label>
              <textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Describe milestone objectives for this stage..."
                rows={3}
                className="w-full p-2.5 bg-bg border border-border rounded-lg focus:border-text-primary outline-none type-body-sm font-medium text-text-primary resize-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="type-form-label text-text-primary font-bold">Expected XP Cap *</label>
                <input 
                  required
                  type="number" 
                  value={formData.expectedXp} 
                  onChange={e => setFormData({...formData, expectedXp: e.target.value})} 
                  placeholder="e.g. 200"
                  className="w-full p-2.5 bg-bg border border-border rounded-lg focus:border-text-primary outline-none type-body-sm font-semibold text-text-primary"
                />
              </div>
              <div className="space-y-1.5">
                <label className="type-form-label text-text-primary font-bold">Display Order</label>
                <input 
                  type="number" 
                  value={formData.displayOrder} 
                  onChange={e => setFormData({...formData, displayOrder: e.target.value})} 
                  placeholder="e.g. 1"
                  className="w-full p-2.5 bg-bg border border-border rounded-lg focus:border-text-primary outline-none type-body-sm font-semibold text-text-primary"
                />
              </div>
            </div>

            <div className="border border-border rounded-lg p-5 bg-bg space-y-4">
              <div>
                <h3 className="type-h5 font-bold text-text-primary">Subgroup Progression Thresholds</h3>
                <p className="type-caption text-text-secondary mt-0.5">Students must satisfy each requirement before unlocking next stage.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="type-form-label text-text-primary font-bold">Must Threshold (XP)</label>
                  <input 
                    type="number" 
                    value={formData.mustThreshold} 
                    onChange={e => setFormData({...formData, mustThreshold: e.target.value})} 
                    placeholder="e.g. 80"
                    className="w-full p-2.5 bg-card border border-border rounded-lg focus:border-text-primary outline-none type-body-sm font-semibold text-text-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="type-form-label text-text-primary font-bold">Individual Threshold (XP)</label>
                  <input 
                    type="number" 
                    value={formData.individualThreshold} 
                    onChange={e => setFormData({...formData, individualThreshold: e.target.value})} 
                    placeholder="e.g. 150"
                    className="w-full p-2.5 bg-card border border-border rounded-lg focus:border-text-primary outline-none type-body-sm font-semibold text-text-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="type-form-label text-text-primary font-bold">Group Threshold (XP)</label>
                  <input 
                    type="number" 
                    value={formData.groupThreshold} 
                    onChange={e => setFormData({...formData, groupThreshold: e.target.value})} 
                    placeholder="e.g. 150"
                    className="w-full p-2.5 bg-card border border-border rounded-lg focus:border-text-primary outline-none type-body-sm font-semibold text-text-primary"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-border flex justify-end space-x-4">
            <button 
              type="button" 
              onClick={onBack} 
              className="type-btn px-5 py-2.5 text-text-secondary hover:bg-bg border border-border rounded-lg font-bold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="type-btn px-6 py-2.5 bg-accent text-card font-bold rounded-lg hover:bg-accent-hover transition-colors shadow-none disabled:opacity-70 flex items-center cursor-pointer"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Creating Stage...' : 'Create Stage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
