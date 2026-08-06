import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { activityService } from '../api/activityService';
import type { ActivityModel } from '../types/ActivityTypes';

interface Props {
  activity: ActivityModel;
  onBack: () => void;
}

export default function AssignFacultyPage({ activity, onBack }: Props) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(false);
  const [globalTeacherId, setGlobalTeacherId] = useState<string>('');
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tData, sData] = await Promise.all([
        activityService.fetchUsers(),
        activityService.fetchSections()
      ]);
      setTeachers(tData);
      setSections(sData);

      // Pre-fill assignments from activity
      if (activity.assignmentSummary?.length) {
        const globalAssign = activity.assignmentSummary.find(a => a.sectionId === 0 || !a.sectionId);
        if (globalAssign) {
          setGlobalEnabled(true);
          setGlobalTeacherId(String(globalAssign.teacherId));
        }

        const secAssignments = activity.assignmentSummary.filter(a => a.sectionId && a.sectionId !== 0);
        setAssignments(secAssignments.map(a => ({
          sectionId: String(a.sectionId),
          teacherId: String(a.teacherId)
        })));
        
        setCcEnabled(activity.assignmentMode === 'CLASS_COORDINATOR');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSectionTeacherChange = (sectionId: string, teacherId: string) => {
    setAssignments(prev => {
      const existing = prev.find(a => a.sectionId === sectionId);
      if (existing) {
        return prev.map(a => a.sectionId === sectionId ? { ...a, teacherId } : a);
      }
      return [...prev, { sectionId, teacherId }];
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading("Saving assignments...");
    try {
      const formattedAssignments = [];
      if (globalEnabled && globalTeacherId) {
        formattedAssignments.push({ sectionId: null, teacherId: Number(globalTeacherId) });
      }

      for (const a of assignments) {
        if (a.teacherId) {
          formattedAssignments.push({
            sectionId: Number(a.sectionId),
            teacherId: Number(a.teacherId)
          });
        }
      }

      await activityService.saveAssignments(activity.id, globalEnabled, formattedAssignments, ccEnabled);
      toast.dismiss(toastId);
      toast.success('Assignments saved successfully!');
      onBack();
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error(error);
      toast.error(error.message || 'Error saving assignments');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading faculty and sections...</div>;

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      <div className="bg-slate-900 px-6 pt-12 pb-6 flex items-center space-x-4">
        <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Assign Faculty</h1>
          <p className="text-slate-400 text-sm">{activity.name}</p>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
        
        {/* Global Assignment */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Global Assignment</h3>
              <p className="text-sm text-slate-500">Assign a single faculty to ALL sections.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={globalEnabled} onChange={e => setGlobalEnabled(e.target.checked)} className="sr-only peer" />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
          
          {globalEnabled && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Select Global Teacher</label>
              <select 
                value={globalTeacherId} 
                onChange={e => setGlobalTeacherId(e.target.value)}
                className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Choose Teacher --</option>
                <option value="0">Any Faculty</option>
                {teachers.map(t => (
                  <option key={t.id} value={t.id}>{t.fullName} ({t.username})</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* CC Assignment */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Class Coordinator Assignment</h3>
            <p className="text-sm text-slate-500">Allow CCs to assign faculty for their own classes.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={ccEnabled} onChange={e => setCcEnabled(e.target.checked)} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        {/* Section specific assignments */}
        {!globalEnabled && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Section-wise Assignments</h3>
            <div className="space-y-4">
              {sections.map(sec => {
                const currentVal = assignments.find(a => a.sectionId === String(sec.id))?.teacherId || '';
                return (
                  <div key={sec.id} className="flex items-center space-x-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <div className="w-1/3">
                      <p className="font-medium text-slate-800">{sec.sectionName}</p>
                      <p className="text-xs text-slate-500">{sec.department?.departmentName || ''}</p>
                    </div>
                    <div className="flex-1">
                      <select 
                        value={currentVal} 
                        onChange={e => handleSectionTeacherChange(String(sec.id), e.target.value)}
                        className="w-full p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      >
                        <option value="">-- Assign Teacher --</option>
                        {teachers.map(t => (
                          <option key={t.id} value={t.id}>{t.fullName} ({t.username})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-4 pb-8">
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-md disabled:opacity-70"
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? 'Saving...' : 'Save All Assignments'}
          </button>
        </div>

      </div>
    </div>
  );
}
