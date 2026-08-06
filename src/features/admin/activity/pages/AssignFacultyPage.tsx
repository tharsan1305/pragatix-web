import { useState, useEffect } from 'react';
import { ArrowLeft, Save, Building2, CheckCircle2, XCircle, Search, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { activityService } from '../api/activityService';
import type { ActivityModel } from '../types/ActivityTypes';

interface Props {
  activity: ActivityModel;
  onBack: () => void;
}

export default function AssignFacultyPage({ activity, onBack }: Props) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  
  const [globalEnabled, setGlobalEnabled] = useState(false);
  const [ccEnabled, setCcEnabled] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Faculty Search Modal State
  const [assignModalTarget, setAssignModalTarget] = useState<{
    deptId: number;
    secId: number | null;
    deptName: string;
    secName: string | null;
  } | null>(null);
  const [facultySearch, setFacultySearch] = useState('');

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tData, dData, apiAssignments] = await Promise.all([
        activityService.fetchUsers(),
        activityService.fetchDepartments(),
        activityService.fetchAssignments(activity.id)
      ]);

      setTeachers(tData || []);
      setDepartments(dData || []);

      const combinedAssignments = apiAssignments && apiAssignments.length > 0
        ? apiAssignments
        : (activity.assignmentSummary || []);

      const loadedAssignments: any[] = [];

      if (combinedAssignments.length > 0) {
        setGlobalEnabled(activity.assignmentMode === 'GLOBAL' || combinedAssignments.some((a: any) => a.scope === 'GLOBAL' || a.assignmentScope === 'GLOBAL'));
        setCcEnabled(activity.assignmentMode === 'CLASS_COORDINATOR' || combinedAssignments.some((a: any) => a.scope === 'CLASS_COORDINATOR' || a.assignmentScope === 'CLASS_COORDINATOR'));

        for (const a of combinedAssignments) {
          const tId = a.teacherId || a.teacher?.id;
          const matchedTeacher = (tData || []).find((t: any) => String(t.id) === String(tId));
          loadedAssignments.push({
            id: a.id,
            departmentId: a.departmentId || a.department?.id,
            sectionId: a.sectionId || a.section?.id,
            teacherId: tId,
            teacherName: matchedTeacher?.fullName || a.teacherName || a.teacher?.fullName || 'Assigned Faculty',
            teacherUsername: matchedTeacher?.username || a.teacherUsername || a.teacher?.username || '',
            scope: a.scope || a.assignmentScope || (a.sectionId ? 'SECTION' : (a.departmentId ? 'DEPARTMENT' : 'GLOBAL'))
          });
        }
      }

      setAssignments(loadedAssignments);
    } catch (error) {
      console.error('Failed to load faculty assignment data:', error);
      toast.error('Failed to load assignment data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignTeacher = (teacher: any) => {
    if (!assignModalTarget) return;
    const { deptId, secId } = assignModalTarget;

    setAssignments(prev => {
      // Remove any existing assignment for this department/section
      const filtered = prev.filter(a => {
        if (secId !== null) {
          return !(String(a.departmentId) === String(deptId) && String(a.sectionId) === String(secId));
        }
        return !(String(a.departmentId) === String(deptId) && (!a.sectionId || a.sectionId === 0));
      });

      return [
        ...filtered,
        {
          departmentId: deptId,
          sectionId: secId,
          teacherId: teacher.id,
          teacherName: teacher.fullName || teacher.username,
          teacherUsername: teacher.username,
          scope: secId ? 'SECTION' : 'DEPARTMENT'
        }
      ];
    });

    toast.success(`Assigned ${teacher.fullName || teacher.username}`);
    setAssignModalTarget(null);
    setFacultySearch('');
  };

  const handleRemoveAssignment = (deptId: number, secId: number | null) => {
    setAssignments(prev => prev.filter(a => {
      if (secId !== null) {
        return !(String(a.departmentId) === String(deptId) && String(a.sectionId) === String(secId));
      }
      return !(String(a.departmentId) === String(deptId) && (!a.sectionId || a.sectionId === 0));
    }));
    toast.success('Assignment removed');
  };

  const handleUnassignAll = () => {
    setAssignments([]);
    setGlobalEnabled(false);
    setCcEnabled(false);
    toast.success('All faculty assignments cleared');
  };

  const handleSave = async () => {
    setIsSaving(true);
    const toastId = toast.loading("Saving assignments...");
    try {
      const formattedAssignments = assignments.map(a => ({
        scope: a.scope || (a.sectionId ? 'SECTION' : 'DEPARTMENT'),
        departmentId: a.departmentId ? Number(a.departmentId) : null,
        sectionId: a.sectionId ? Number(a.sectionId) : null,
        teacherId: Number(a.teacherId)
      }));

      await activityService.saveAssignments(activity.id, globalEnabled, formattedAssignments, ccEnabled);
      toast.dismiss(toastId);
      toast.success('Assignments saved successfully!');
      onBack();
    } catch (error: any) {
      toast.dismiss(toastId);
      console.error(error);
      const msg = error.response?.data?.message || error.message || 'Error saving assignments';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // Filter teachers for modal
  const filteredTeachers = teachers.filter(t => {
    const q = facultySearch.toLowerCase();
    const name = (t.fullName || '').toLowerCase();
    const uname = (t.username || '').toLowerCase();
    const dept = (t.departmentName || '').toLowerCase();
    return name.includes(q) || uname.includes(q) || dept.includes(q);
  });

  return (
    <div className="flex flex-col min-h-full bg-slate-50 relative pb-24">
      {/* App Bar Header */}
      <div className="bg-slate-900 px-6 pt-12 pb-6 flex items-center space-x-4 sticky top-0 z-10 shadow-md">
        <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Assign Faculty</h1>
          <p className="text-xs text-slate-400 font-medium">{activity.name}</p>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
        
        {/* Activity Summary Card */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-lg font-bold text-slate-900">{activity.name}</h2>
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 uppercase">
              Type: {activity.type || 'Individual'}
            </span>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 uppercase">
              Category: {activity.xpCategory || 'Academic'}
            </span>
            {activity.awardEnabled && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase">
                Award XP: {activity.awardXp || 50}
              </span>
            )}
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-800 uppercase">
              {assignments.length} Total Assignments
            </span>
          </div>
        </div>

        {/* Global & Class Coordinator Toggles */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div className="pr-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">GLOBAL ASSIGNMENT</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Enable to assign this activity to ALL departments, ALL sections and ALL faculty members.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={globalEnabled} 
                onChange={e => {
                  setGlobalEnabled(e.target.checked);
                  if (e.target.checked) setCcEnabled(false);
                }} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
            <div className="pr-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">CLASS COORDINATOR ASSIGNMENT</h3>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                Automatically assign this activity to the Class Coordinator of every section.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                checked={ccEnabled} 
                onChange={e => {
                  setCcEnabled(e.target.checked);
                  if (e.target.checked) setGlobalEnabled(false);
                }} 
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>

        {/* Section Assignments Header */}
        <div>
          <h3 className="text-xs font-extrabold text-blue-600 uppercase tracking-wider mb-3">
            CLASS COORDINATOR ASSIGNMENTS (Auto-Resolved)
          </h3>

          {/* Department Cards Roster */}
          <div className="space-y-4">
            {departments.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center text-slate-500 text-sm font-medium">
                No departments available.
              </div>
            ) : (
              departments.map((dept: any) => {
                const deptId = dept.id;
                const deptName = dept.departmentName || dept.name || 'Department';
                const hasSections = dept.hasSections === true || (Array.isArray(dept.sections) && dept.sections.length > 0);
                const sectionsList = Array.isArray(dept.sections) ? dept.sections : [];

                return (
                  <div key={deptId} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 space-y-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-5 h-5 text-slate-700" />
                        <h4 className="font-bold text-base text-slate-900">{deptName}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5 font-medium">Configure Assignments</p>
                    </div>

                    {hasSections ? (
                      <div className="space-y-4 pt-2">
                        {sectionsList.map((sec: any) => {
                          const secId = sec.id;
                          const secName = sec.sectionName || sec.name || 'Section';

                          const secAssignments = assignments.filter(a => 
                            String(a.departmentId) === String(deptId) && String(a.sectionId) === String(secId)
                          );
                          const isAssigned = secAssignments.length > 0;

                          return (
                            <div key={secId} className="space-y-2">
                              <h5 className="font-bold text-sm text-slate-800">{secName}</h5>
                              
                              {/* Assignment Box */}
                              {isAssigned ? (
                                <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-3 flex items-center justify-between">
                                  <div 
                                    onClick={() => setAssignModalTarget({ deptId, secId, deptName, secName })}
                                    className="flex items-start space-x-3 cursor-pointer flex-1"
                                  >
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                    <div>
                                      <p className="font-bold text-sm text-emerald-900">
                                        {secAssignments.map(a => a.teacherName).join(', ')}
                                      </p>
                                      <p className="text-xs text-emerald-700 mt-0.5">
                                        Role • {secAssignments[0]?.teacherUsername || 'N/A'} • {deptName}
                                      </p>
                                      <p className="text-[11px] font-semibold text-emerald-600 italic mt-0.5">
                                        Tap to Change
                                      </p>
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => handleRemoveAssignment(deptId, secId)}
                                    className="p-1.5 text-rose-500 hover:bg-rose-100/50 rounded-lg transition-colors"
                                    title="Remove Assignment"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div 
                                  onClick={() => setAssignModalTarget({ deptId, secId, deptName, secName })}
                                  className="bg-rose-50/70 border border-rose-300 rounded-xl p-3 flex items-center space-x-3 cursor-pointer hover:bg-rose-100/70 transition-colors"
                                >
                                  <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                                  <div>
                                    <p className="font-bold text-sm text-rose-700">✕ No Faculty Assigned</p>
                                    <p className="text-xs text-rose-600 font-medium">Tap to Assign</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="pt-2">
                        <h5 className="font-bold text-sm text-slate-800 mb-2">Department Faculty</h5>
                        {(() => {
                          const deptAssignments = assignments.filter(a => 
                            String(a.departmentId) === String(deptId) && (!a.sectionId || a.sectionId === 0)
                          );
                          const isAssigned = deptAssignments.length > 0;

                          if (isAssigned) {
                            return (
                              <div className="bg-emerald-50/70 border border-emerald-300 rounded-xl p-3 flex items-center justify-between">
                                <div 
                                  onClick={() => setAssignModalTarget({ deptId, secId: null, deptName, secName: null })}
                                  className="flex items-start space-x-3 cursor-pointer flex-1"
                                >
                                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                                  <div>
                                    <p className="font-bold text-sm text-emerald-900">
                                      {deptAssignments.map(a => a.teacherName).join(', ')}
                                    </p>
                                    <p className="text-xs text-emerald-700 mt-0.5">
                                      Role • {deptAssignments[0]?.teacherUsername || 'N/A'} • {deptName}
                                    </p>
                                    <p className="text-[11px] font-semibold text-emerald-600 italic mt-0.5">
                                      Tap to Change
                                    </p>
                                  </div>
                                </div>
                                <button 
                                  onClick={() => handleRemoveAssignment(deptId, null)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-100/50 rounded-lg transition-colors"
                                  title="Remove Assignment"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div 
                              onClick={() => setAssignModalTarget({ deptId, secId: null, deptName, secName: null })}
                              className="bg-rose-50/70 border border-rose-300 rounded-xl p-3 flex items-center space-x-3 cursor-pointer hover:bg-rose-100/70 transition-colors"
                            >
                              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                              <div>
                                <p className="font-bold text-sm text-rose-700">✕ No Faculty Assigned</p>
                                <p className="text-xs text-rose-600 font-medium">Tap to Assign</p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* Bottom Sticky Controls Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-2xl z-30 flex justify-end items-center space-x-3">
        <button 
          onClick={onBack}
          className="px-5 py-2.5 text-slate-600 font-bold hover:bg-slate-100 rounded-xl text-sm transition-colors border border-slate-300"
        >
          Cancel
        </button>
        <button 
          onClick={handleUnassignAll}
          className="px-5 py-2.5 text-rose-600 font-bold border border-rose-300 hover:bg-rose-50 rounded-xl text-sm transition-colors"
        >
          Unassign All
        </button>
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="px-6 py-2.5 bg-[#EA4335] text-white font-bold rounded-xl hover:bg-red-600 transition-colors text-sm shadow-md disabled:opacity-70 flex items-center"
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Assignments'}
        </button>
      </div>

      {/* Faculty Selection Search Modal Overlay */}
      {assignModalTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col max-h-[85vh] shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Assign Faculty</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Department: {assignModalTarget.deptName}
                  {assignModalTarget.secName && ` • Section: ${assignModalTarget.secName}`}
                </p>
              </div>
              <button 
                onClick={() => { setAssignModalTarget(null); setFacultySearch(''); }}
                className="p-1.5 text-slate-400 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input 
                  type="text" 
                  value={facultySearch} 
                  onChange={e => setFacultySearch(e.target.value)} 
                  placeholder="Search faculty..." 
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-sm font-medium focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Faculty Roster List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {filteredTeachers.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-sm font-medium">
                  No faculty found matching search.
                </div>
              ) : (
                filteredTeachers.map((t: any) => {
                  const isCurrentlyAssigned = assignments.some(a => 
                    String(a.departmentId) === String(assignModalTarget.deptId) &&
                    (assignModalTarget.secId === null ? (!a.sectionId || a.sectionId === 0) : String(a.sectionId) === String(assignModalTarget.secId)) &&
                    String(a.teacherId) === String(t.id)
                  );

                  return (
                    <div 
                      key={t.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-red-300 bg-white hover:bg-slate-50 transition-all flex items-center justify-between"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-slate-900">{t.fullName || t.username}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          ID: {t.username || 'N/A'} • {t.departmentName || assignModalTarget.deptName}
                        </p>
                      </div>

                      {isCurrentlyAssigned ? (
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          Assigned
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleAssignTeacher(t)}
                          className="text-xs font-bold text-white bg-[#EA4335] hover:bg-red-600 px-4 py-1.5 rounded-lg transition-colors shadow-sm"
                        >
                          Assign
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
