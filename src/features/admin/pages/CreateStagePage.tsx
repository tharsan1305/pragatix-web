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
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="bg-slate-900 px-6 pt-12 pb-6 flex items-center space-x-4">
        <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white flex-1">Create Stage</h1>
      </div>

      <div className="flex-1 p-6 max-w-3xl mx-auto w-full">
        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Stage Configuration</h2>
            <p className="text-sm text-slate-500 mt-1">Define a new progression stage for the Student Development Program.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Stage Name *</label>
              <input 
                required 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                placeholder="e.g. Stage 1"
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-shadow"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Academic Year *</label>
              <select
                value={formData.academicYear}
                onChange={e => setFormData({...formData, academicYear: e.target.value})}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-shadow bg-white"
              >
                <option value="FIRST_YEAR">First Year</option>
                <option value="SECOND_YEAR">Second Year</option>
                <option value="THIRD_YEAR">Third Year</option>
                <option value="FINAL_YEAR">Fourth Year</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})} 
                placeholder="Describe targets or rules for this stage..."
                rows={3}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-shadow resize-none"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Expected XP *</label>
                <input 
                  required
                  type="number" 
                  value={formData.expectedXp} 
                  onChange={e => setFormData({...formData, expectedXp: e.target.value})} 
                  placeholder="e.g. 500"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-shadow"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Display Order</label>
                <input 
                  type="number" 
                  value={formData.displayOrder} 
                  onChange={e => setFormData({...formData, displayOrder: e.target.value})} 
                  placeholder="e.g. 1"
                  className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-shadow"
                />
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Subgroup Thresholds</h3>
                <p className="text-xs text-slate-500 mt-0.5">Students must complete all required subgroup thresholds before promoting to the next stage.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Must Threshold</label>
                  <input 
                    type="number" 
                    value={formData.mustThreshold} 
                    onChange={e => setFormData({...formData, mustThreshold: e.target.value})} 
                    placeholder="e.g. 50"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-shadow bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Individual Threshold</label>
                  <input 
                    type="number" 
                    value={formData.individualThreshold} 
                    onChange={e => setFormData({...formData, individualThreshold: e.target.value})} 
                    placeholder="e.g. 100"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-shadow bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Group Threshold</label>
                  <input 
                    type="number" 
                    value={formData.groupThreshold} 
                    onChange={e => setFormData({...formData, groupThreshold: e.target.value})} 
                    placeholder="e.g. 150"
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none transition-shadow bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-slate-100 flex justify-end space-x-4">
            <button 
              type="button" 
              onClick={onBack} 
              className="px-6 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-6 py-2.5 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-70 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : 'Create Stage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
