import { logger } from '../../../../utils/logger';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  CheckCircle2,
  Loader2,
  User,
  Calendar,
  ShieldCheck,
  Building2,
  Check,
  RefreshCw,
  X,
  Trash2,
  Globe,
  Users,
  Settings,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../../services/apiClient';
import { useAuth } from '../../../../store/authContext';
import type { ActivityModel } from '../types/ActivityTypes';

interface Props {
  activity?: ActivityModel | any;
  activityId?: number;
  stageId?: number;
  stageName?: string;
  subgroupId?: number | string;
  isCcProp?: boolean;
  onBack: () => void;
  onSuccess?: () => void;
}

export default function AssignFacultyPage({
  activity: initialActivity,
  activityId: propActivityId,
  stageId: initialStageId,
  isCcProp,
  onBack,
  onSuccess
}: Props) {
  const { subRoles } = useAuth();

  const isCC = isCcProp || subRoles.some(r => {
    const clean = String(r).toUpperCase().trim();
    return clean === 'CC' || clean === 'CLASS_COORDINATOR' || clean === 'ROLE_CC' || clean === 'ROLE_CLASS_COORDINATOR';
  });

  const [activity, setActivity] = useState<any>(initialActivity || null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [classDetails, setClassDetails] = useState<any>(null);

  // CC-specific state
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [assignmentDuration, setAssignmentDuration] = useState<'PERMANENT' | 'ONLY_TODAY'>('PERMANENT');
  const [remarks] = useState<string>('');

  // Admin Configuration Toggles (matching Flutter assign_staff_page.dart)
  const [globalAssignment, setGlobalAssignment] = useState<boolean>(false);
  const [ccAssignment, setCcAssignment] = useState<boolean>(false);
  const [attendanceEngineEnabled, setAttendanceEngineEnabled] = useState<boolean>(false);
  const [attendanceRule, setAttendanceRule] = useState<string>('DAILY');

  // Modal for Assigning Faculty to a Dept / Section
  const [assignModalTarget, setAssignModalTarget] = useState<{
    deptId: number;
    deptName: string;
    secId?: number | null;
    secName?: string | null;
  } | null>(null);

  // Custom In-App Confirmation Modal (matching Flutter showDialog)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    onConfirm: () => void;
  } | null>(null);

  const [modalSearchQuery, setModalSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const targetActivityId = initialActivity?.id || propActivityId;

  const safeStr = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (typeof val === 'object')
      return val.name || val.stageName || val.departmentName || val.fullName || val.title || String(val.id ?? '');
    return String(val);
  };

  const safeXp = (act: any): number => {
    if (!act) return 0;
    if (typeof act.awardXp === 'number') return act.awardXp;
    if (typeof act.xp === 'number') return act.xp;
    if (typeof act.xp === 'string') return parseInt(act.xp) || 0;
    return 0;
  };

  useEffect(() => {
    loadData();
  }, [targetActivityId, initialStageId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch Activity Details via existing backend endpoints
      let currentActivity = initialActivity;
      if (!currentActivity && targetActivityId) {
        try {
          const url = initialStageId 
            ? `/api/v1/admin/stages/${initialStageId}/activities`
            : '/api/v1/admin/activities';
          const actRes = await apiClient.get(url);
          const list = actRes.data?.data || (Array.isArray(actRes.data) ? actRes.data : []);
          currentActivity = list.find((a: any) => String(a.id) === String(targetActivityId));
        } catch {
          // If not found in admin activities, try CC activities endpoint
          try {
            const ccRes = await apiClient.get('/api/v1/cc/activities');
            const ccList = ccRes.data?.data || (Array.isArray(ccRes.data) ? ccRes.data : []);
            currentActivity = ccList.find((a: any) => String(a.id) === String(targetActivityId));
          } catch (e) {
            logger.warn("Could not find activity in cc list:", e);
          }
        }
      }

      if (currentActivity) {
        setActivity(currentActivity);
        setGlobalAssignment(currentActivity.assignmentMode === 'GLOBAL' || currentActivity.globalAssignment === true);
        setCcAssignment(currentActivity.assignmentMode === 'CLASS_COORDINATOR' || currentActivity.ccAssignment === true);
        setAttendanceEngineEnabled(currentActivity.attendanceEngineEnabled === true);
        setAttendanceRule(currentActivity.attendanceRule || 'DAILY');
      }

      // 2. Fetch Assignments for this Activity (existing backend endpoint: GET /api/v1/admin/activities/{id}/assignments)
      if (targetActivityId) {
        try {
          const stageParam = initialStageId ? `?stageId=${initialStageId}` : '';
          const assignRes = await apiClient.get(`/api/v1/admin/activities/${targetActivityId}/assignments${stageParam}`);
          const list = assignRes.data?.data || (Array.isArray(assignRes.data) ? assignRes.data : []);
          setAssignments(list);
        } catch (e) {
          logger.warn("Could not load activity assignments:", e);
        }
      }

      // 3. Fetch Departments with Sections (existing backend endpoint: GET /api/v1/admin/departments)
      try {
        const deptRes = await apiClient.get('/api/v1/admin/departments');
        const dList = deptRes.data?.data || (Array.isArray(deptRes.data) ? deptRes.data : []);
        setDepartments(dList);
      } catch (e) {
        logger.warn("Could not load departments list:", e);
      }

      // 4. Fetch All Teachers (existing backend endpoints)
      let teachersList: any[] = [];
      try {
        const tRes = await apiClient.get('/api/v1/admin/teachers');
        teachersList = tRes.data?.data || (Array.isArray(tRes.data) ? tRes.data : []);
      } catch {
        try {
          const fRes = await apiClient.get('/api/v1/admin/faculty');
          teachersList = fRes.data?.data || (Array.isArray(fRes.data) ? fRes.data : []);
        } catch {
          try {
            const uRes = await apiClient.get('/api/v1/admin/users');
            const uList = uRes.data?.data || (Array.isArray(uRes.data) ? uRes.data : []);
            teachersList = uList.filter((u: any) => {
              const roles = u.roles || [];
              return roles.some((r: any) => (typeof r === 'string' ? r : r?.name) === 'ROLE_TEACHER');
            });
          } catch {
            try {
              const ccTRes = await apiClient.get('/api/v1/cc/activities/teachers');
              teachersList = ccTRes.data?.data || (Array.isArray(ccTRes.data) ? ccTRes.data : []);
            } catch (err: any) {
              logger.warn("Could not load teachers list:", err);
            }
          }
        }
      }
      setTeachers(teachersList);

      // 5. Fetch Class Details for CC role (existing backend endpoint: GET /api/v1/cc/activities/class-details)
      if (isCC) {
        try {
          const clsRes = await apiClient.get('/api/v1/cc/activities/class-details');
          if (clsRes.data?.success && clsRes.data?.data) {
            setClassDetails(clsRes.data.data);
          }
        } catch {}
      }

    } catch (err: any) {
      logger.error('AssignFacultyPage load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // CC users may only assign faculty within their own department (backend is
  // the actual enforcement point; this keeps the picker consistent with that scope).
  const ccDepartmentName = String(
    classDetails?.departmentName || classDetails?.department?.name || classDetails?.department || ''
  ).toLowerCase().trim();

  const ccScopedTeachers = isCC
    ? teachers.filter((t) => {
      const tDept = String(t.departmentName || t.department || '').toLowerCase().trim();
      return ccDepartmentName !== '' && tDept === ccDepartmentName;
    })
    : teachers;

  // Filtered teachers inside Modal
  const filteredModalTeachers = teachers.filter((t) => {
    if (!modalSearchQuery.trim()) return true;
    const q = modalSearchQuery.toLowerCase().trim();
    const name = (t.fullName || t.name || '').toLowerCase();
    const username = (t.username || '').toLowerCase();
    const email = (t.email || '').toLowerCase();
    const dept = (t.departmentName || t.department || '').toLowerCase();
    return name.includes(q) || username.includes(q) || email.includes(q) || dept.includes(q);
  });

  // Add Assignment for a Dept / Section
  const handleAssignFaculty = async (teacher: any) => {
    if (!assignModalTarget || !targetActivityId) return;
    const toastId = toast.loading(`Assigning ${teacher.fullName || teacher.name || 'Faculty'}...`);
    try {
      const payload: any = {
        departmentId: assignModalTarget.deptId,
        sectionId: assignModalTarget.secId || null,
        teacherId: teacher.id || teacher.userId,
        scope: assignModalTarget.secId ? 'SECTION' : 'DEPARTMENT',
        year: '1',
      };
      const stageParam = initialStageId ? `?stageId=${initialStageId}` : '';

      try {
        await apiClient.post(`/api/v1/admin/activities/${targetActivityId}/assignments${stageParam}`, payload);
      } catch {
        await apiClient.post(`/api/v1/admin/activities/${targetActivityId}/assign`, {
          assignments: [payload],
          stageId: initialStageId,
        });
      }

      toast.dismiss(toastId);
      toast.success(`Assigned to ${assignModalTarget.deptName}${assignModalTarget.secName ? ` - Section ${assignModalTarget.secName}` : ''}!`);
      setAssignModalTarget(null);
      setModalSearchQuery('');
      loadData();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Failed to assign faculty');
    }
  };

  // Remove single assignment (matching Flutter _confirmRemoveAssignment)
  const handleRemoveAssignment = (assignmentId: number) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Assignment',
      message: 'Remove this faculty assignment?',
      confirmText: 'Remove',
      onConfirm: async () => {
        setConfirmModal(null);
        const toastId = toast.loading('Removing assignment...');
        try {
          await apiClient.delete(`/api/v1/admin/activities/assignments/${assignmentId}`);
          toast.dismiss(toastId);
          toast.success('Assignment removed.');
          loadData();
        } catch (err: any) {
          toast.dismiss(toastId);
          const msg = err.response?.data?.message || err.message || '';
          if (msg.includes('referenced by other records') || err.response?.status === 409) {
            toast.error('Cannot remove assignment with existing student XP history. You can change the faculty member instead.');
          } else {
            toast.error(msg || 'Failed to remove assignment');
          }
        }
      }
    });
  };

  // Unassign All (matching Flutter _confirmUnassignAll)
  const handleUnassignAll = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove All Faculty Assignments?',
      message: 'This will remove every faculty assignment from every department and section for this activity.',
      confirmText: 'Remove All',
      onConfirm: async () => {
        setConfirmModal(null);
        const toastId = toast.loading('Removing all assignments...');
        try {
          const stageParam = initialStageId ? `?stageId=${initialStageId}` : '';
          await apiClient.delete(`/api/v1/admin/activities/${targetActivityId}/assignments/clear${stageParam}`);
          toast.dismiss(toastId);
          toast.success('All faculty assignments removed.');
          loadData();
        } catch (err: any) {
          toast.dismiss(toastId);
          const msg = err.response?.data?.message || err.message || '';
          if (msg.includes('referenced by other records') || err.response?.status === 409) {
            toast.error('Cannot clear assignments with active student XP records. You can change faculty members individually instead.');
          } else {
            toast.error(msg || 'Failed to clear assignments');
          }
        }
      }
    });
  };

  // Save Bulk Configuration
  const handleSaveConfiguration = async () => {
    if (!targetActivityId) return;
    setIsSaving(true);
    const toastId = toast.loading('Saving assignment configuration...');
    try {
      const validAssignments = assignments
        .filter((a: any) => a.teacherId != null)
        .map((a: any) => ({
          departmentId: a.departmentId,
          sectionId: a.sectionId || null,
          teacherId: a.teacherId,
          scope: a.scope || (a.sectionId ? 'SECTION' : 'DEPARTMENT'),
          year: a.year || '1',
        }));

      const stageParam = initialStageId ? `?stageId=${initialStageId}` : '';
      const payload = {
        globalEnabled: globalAssignment,
        ccEnabled: ccAssignment,
        stageId: initialStageId,
        attendanceEngineEnabled: attendanceEngineEnabled,
        attendanceRule: attendanceRule,
        assignments: validAssignments,
      };

      await apiClient.post(`/api/v1/admin/activities/${targetActivityId}/assign${stageParam}`, payload);

      if (!isCC && activity) {
        try {
          await apiClient.put(`/api/v1/admin/activities/${targetActivityId}`, {
            ...activity,
            attendanceEngineEnabled: attendanceEngineEnabled,
            attendanceRule: attendanceRule,
          });
        } catch {}
      }

      toast.dismiss(toastId);
      toast.success('Assignments saved successfully!');
      if (onSuccess) onSuccess();
      else onBack();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  // CC single-teacher assignment
  const handleCcAssign = async () => {
    if (!selectedTeacherId || !targetActivityId) {
      toast.error('Please select a faculty member');
      return;
    }
    const teacher = teachers.find(t => (t.id || t.userId) === selectedTeacherId);
    const name = teacher?.fullName || teacher?.name || 'Faculty';
    const toastId = toast.loading(`Assigning to ${name}...`);
    try {
      const payload = {
        teacherId: selectedTeacherId,
        stageId: initialStageId || activity?.stageId,
        assignmentDuration: assignmentDuration,
        remarks: remarks.trim() || undefined
      };
      await apiClient.post(`/api/v1/cc/activities/${targetActivityId}/assign-teacher`, payload);
      toast.dismiss(toastId);
      toast.success(`Assigned to ${name}!`);
      if (onSuccess) onSuccess();
      else onBack();
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || 'Failed to assign faculty');
    }
  };

  return (
    <div className="flex flex-col min-h-full bg-slate-50 pb-24">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-[#11998E] to-[#38EF7D] text-white px-4 md:px-6 py-4 shadow-md flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition cursor-pointer">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Assign Staff & Departments</h1>
        </div>
        <button
          onClick={loadData}
          className="p-2 hover:bg-white/10 rounded-full transition text-white cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">

        {/* 1. Activity Summary Banner */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
                {safeStr(activity?.subgroup) || safeStr(activity?.category) || 'Activity Task'}
              </span>
              <h2 className="text-lg md:text-xl font-black text-slate-900 mt-1">
                {activity?.name || 'Activity'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 px-3 py-1 rounded-lg">
                XP: {safeXp(activity)}
              </span>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                {assignments.length} Total Assignments
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
            {activity?.awardEnabled && (
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Award XP: {activity.awardXp || safeXp(activity)}
              </span>
            )}
            {activity?.penaltyEnabled && (
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                Penalty XP: {activity.penaltyXp}
              </span>
            )}
            <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
              Type: {activity?.type || 'INDIVIDUAL'}
            </span>
          </div>
        </div>

        {/* 2. ADMIN / SUPERADMIN CONFIGURATION TOGGLES (Matching Flutter 1:1) */}
        {!isCC && (
          <div className="space-y-4">
            {/* Global Assignment Switch */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">Global Assignment</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Enable to assign this activity to ALL departments, ALL sections, and ALL faculty members automatically.
                </p>
              </div>
              <input
                type="checkbox"
                checked={globalAssignment}
                onChange={(e) => {
                  setGlobalAssignment(e.target.checked);
                  if (e.target.checked) setCcAssignment(false);
                }}
                className="w-5 h-5 accent-purple-600 rounded cursor-pointer"
              />
            </div>

            {/* Class Coordinator Assignment Switch */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">Class Coordinator Assignment</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Automatically assign this activity to the Class Coordinator (CC) of every section.
                </p>
              </div>
              <input
                type="checkbox"
                checked={ccAssignment}
                onChange={(e) => {
                  setCcAssignment(e.target.checked);
                  if (e.target.checked) setGlobalAssignment(false);
                }}
                className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
              />
            </div>

            {/* Attendance Engine Integration Switch */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-600" />
                    <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wide">Attendance Engine Integration</h3>
                  </div>
                  <p className="text-xs text-slate-500">
                    Automatically generate XP transactions based on student daily attendance.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={attendanceEngineEnabled}
                  onChange={(e) => setAttendanceEngineEnabled(e.target.checked)}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
              </div>

              {attendanceEngineEnabled && (
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                  <label className="text-xs font-bold text-slate-700">Integration Rule</label>
                  <select
                    value={attendanceRule}
                    onChange={(e) => setAttendanceRule(e.target.value)}
                    className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="DAILY">Daily Check (Apply partial/full day penalty)</option>
                    <option value="WEEKLY">Weekly Check (Apply perfect week reward)</option>
                    <option value="BOTH">Both (Daily penalty + Weekly reward)</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. DEPARTMENT & SECTION ASSIGNMENT MATRIX (For Admin / SuperAdmin) */}
        {!isCC && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Departments & Sections Assignment Matrix</h3>
                <p className="text-xs text-slate-500">Assign specific faculty members per department and section</p>
              </div>
              {assignments.length > 0 && (
                <button
                  onClick={handleUnassignAll}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Unassign All
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
              </div>
            ) : departments.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-400">
                <Building2 className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p className="font-semibold text-sm">No departments found in the system</p>
              </div>
            ) : (
              <div className="space-y-4">
                {departments.map((dept) => {
                  const deptId = dept.id || dept.deptId;
                  const deptName = dept.name || dept.deptName || 'Department';
                  const sections = dept.sections || dept.sectionList || [];
                  const hasSections = sections.length > 0;

                  return (
                    <div key={deptId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-base">🏢</span>
                            <h4 className="font-bold text-slate-900 text-base">{deptName}</h4>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                              {dept.code || dept.deptCode || 'DEPT'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">Configure Assignments</p>
                        </div>
                        <span className="text-xs text-slate-500 font-semibold">
                          {hasSections ? `${sections.length} Sections` : 'Department Wide'}
                        </span>
                      </div>

                      <div className="p-4 space-y-4">
                        {hasSections ? (
                          sections.map((sec: any) => {
                            const secId = sec.id || sec.sectionId;
                            const secName = sec.sectionName || sec.name || 'Section';

                            // Find all valid assigned teachers for this section
                            const validAssignments = assignments.filter((a: any) =>
                              String(a.departmentId) === String(deptId) &&
                              String(a.sectionId) === String(secId) &&
                              (a.teacherId != null || a.teacherName != null)
                            );

                            return (
                              <div key={secId} className="space-y-1.5">
                                <h5 className="font-bold text-slate-800 text-sm">{secName}</h5>

                                {validAssignments.length > 0 ? (
                                  <div className="space-y-2">
                                    {validAssignments.map((a: any) => (
                                      <div
                                        key={a.id}
                                        className="w-full p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3 transition hover:bg-emerald-100/60"
                                      >
                                        <div
                                          onClick={() => setAssignModalTarget({ deptId, deptName, secId, secName })}
                                          className="flex items-start gap-2.5 flex-1 cursor-pointer"
                                        >
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                          <div>
                                            <p className="text-sm font-bold text-emerald-800 leading-tight">
                                              {a.teacherName || 'Faculty Member'}
                                            </p>
                                            <p className="text-xs text-emerald-700 mt-0.5">
                                              Role • {a.teacherUsername || 'Faculty'} • {deptName}
                                            </p>
                                            <p className="text-xs text-emerald-600 italic mt-0.5 font-medium">
                                              Tap to Change
                                            </p>
                                          </div>
                                        </div>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveAssignment(a.id);
                                          }}
                                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 rounded-lg transition cursor-pointer shrink-0"
                                          title="Remove Assignment"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => setAssignModalTarget({ deptId, deptName, secId, secName })}
                                    className="w-full p-3.5 rounded-xl bg-rose-50 border border-rose-300 flex items-center gap-2.5 cursor-pointer hover:bg-rose-100/60 transition"
                                  >
                                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                                    <div>
                                      <p className="text-xs font-semibold text-rose-700">❌ No Faculty Assigned</p>
                                      <p className="text-[11px] text-rose-600 font-medium">Tap to Assign</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          // Whole Department assignment (No sections)
                          (() => {
                            const validAssignments = assignments.filter((a: any) =>
                              String(a.departmentId) === String(deptId) &&
                              (!a.sectionId || a.scope === 'DEPARTMENT') &&
                              (a.teacherId != null || a.teacherName != null)
                            );

                            return (
                              <div className="space-y-1.5">
                                <h5 className="font-bold text-slate-800 text-sm">Department-wide Assignment</h5>

                                {validAssignments.length > 0 ? (
                                  <div className="space-y-2">
                                    {validAssignments.map((a: any) => (
                                      <div
                                        key={a.id}
                                        className="w-full p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-between gap-3 transition hover:bg-emerald-100/60"
                                      >
                                        <div
                                          onClick={() => setAssignModalTarget({ deptId, deptName })}
                                          className="flex items-start gap-2.5 flex-1 cursor-pointer"
                                        >
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                                          <div>
                                            <p className="text-sm font-bold text-emerald-800 leading-tight">
                                              {a.teacherName || 'Faculty Member'}
                                            </p>
                                            <p className="text-xs text-emerald-700 mt-0.5">
                                              Role • {a.teacherUsername || 'Faculty'} • {deptName}
                                            </p>
                                            <p className="text-xs text-emerald-600 italic mt-0.5 font-medium">
                                              Tap to Change
                                            </p>
                                          </div>
                                        </div>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveAssignment(a.id);
                                          }}
                                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100/60 rounded-lg transition cursor-pointer shrink-0"
                                          title="Remove Assignment"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div
                                    onClick={() => setAssignModalTarget({ deptId, deptName })}
                                    className="w-full p-3.5 rounded-xl bg-rose-50 border border-rose-300 flex items-center gap-2.5 cursor-pointer hover:bg-rose-100/60 transition"
                                  >
                                    <X className="w-4 h-4 text-rose-600 shrink-0" />
                                    <div>
                                      <p className="text-xs font-semibold text-rose-700">❌ No Faculty Assigned</p>
                                      <p className="text-[11px] text-rose-600 font-medium">Tap to Assign</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })()
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Actions Bar (Matching Flutter 1:1) */}
            <div className="pt-4 flex flex-col sm:flex-row items-center gap-3">
              <button
                type="button"
                onClick={onBack}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 font-bold text-sm text-slate-700 transition cursor-pointer"
              >
                Cancel
              </button>

              {assignments.length > 0 && (
                <button
                  type="button"
                  onClick={handleUnassignAll}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl border border-rose-300 bg-rose-50 hover:bg-rose-100 font-bold text-sm text-rose-600 transition cursor-pointer"
                >
                  Unassign All
                </button>
              )}

              <button
                onClick={handleSaveConfiguration}
                disabled={isSaving}
                className="flex-1 w-full bg-[#11998E] hover:bg-[#0d7d74] disabled:bg-slate-300 text-white py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <CheckCircle2 className="w-5 h-5" />}
                <span>Save Assignments</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. CLASS COORDINATOR VIEW (Scoped to CC's single class) */}
        {isCC && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Calendar className="w-4 h-4 text-teal-600" />
                <span>Assignment Duration</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  onClick={() => setAssignmentDuration('ONLY_TODAY')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${assignmentDuration === 'ONLY_TODAY'
                      ? 'bg-teal-50/70 border-teal-500 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <div className={`p-2 rounded-lg ${assignmentDuration === 'ONLY_TODAY' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Only Today</h4>
                    <p className="text-[10px] text-slate-500">Expires midnight</p>
                  </div>
                </div>

                <div
                  onClick={() => setAssignmentDuration('PERMANENT')}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${assignmentDuration === 'PERMANENT'
                      ? 'bg-teal-50/70 border-teal-500 shadow-xs'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  <div className={`p-2 rounded-lg ${assignmentDuration === 'PERMANENT' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Permanent</h4>
                    <p className="text-[10px] text-slate-500">Fixed assigned faculty</p>
                  </div>
                </div>
              </div>
            </div>

            {/* CC Faculty Selection List */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Select Faculty Member for Class</h3>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {ccScopedTeachers.map((teacher) => {
                  const tId = teacher.id || teacher.userId;
                  const isSelected = selectedTeacherId === tId;
                  const name = teacher.fullName || teacher.name || teacher.username || 'Teacher';
                  return (
                    <div
                      key={tId}
                      onClick={() => setSelectedTeacherId(tId)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${isSelected ? 'bg-teal-50/80 border-teal-500 shadow-xs' : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                          }`}>
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-xs">{name}</h4>
                          <p className="text-[11px] text-slate-500">{teacher.departmentName || teacher.department || 'Faculty'}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={handleCcAssign}
                disabled={!selectedTeacherId}
                className="w-full bg-[#11998E] hover:bg-[#0d7d74] disabled:bg-slate-300 text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Assign to Class</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* 5. MODAL: ASSIGN FACULTY TO A DEPARTMENT / SECTION (Matching Flutter BottomSheet 1:1) */}
      {assignModalTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Assign Faculty Member</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  {assignModalTarget.deptName}{assignModalTarget.secName ? ` • Section ${assignModalTarget.secName}` : ' • All Sections'}
                </p>
              </div>
              <button
                onClick={() => { setAssignModalTarget(null); setModalSearchQuery(''); }}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-4 border-b border-slate-100 bg-slate-50">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  placeholder="Search faculty by name, department, ID..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            {/* Modal Teachers List */}
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1">
              {filteredModalTeachers.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <User className="w-8 h-8 mx-auto mb-1 text-slate-300" />
                  <p className="font-semibold text-xs text-slate-500">No matching faculty members found</p>
                </div>
              ) : (
                filteredModalTeachers.map((teacher) => {
                  const tId = teacher.id || teacher.userId;
                  const name = teacher.fullName || teacher.name || teacher.username || 'Teacher';
                  const dept = teacher.departmentName || teacher.department || 'Faculty';

                  return (
                    <div
                      key={tId}
                      onClick={() => handleAssignFaculty(teacher)}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-teal-500 hover:bg-teal-50/40 transition-all flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center">
                          {name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs md:text-sm">{name}</h4>
                          <p className="text-[11px] text-slate-500">{dept} • {teacher.username || teacher.email}</p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignFaculty(teacher);
                        }}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                      >
                        Assign
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. IN-APP CONFIRMATION MODAL (Matching Flutter showDialog / AlertDialog 1:1) */}
      {confirmModal && confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">{confirmModal.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{confirmModal.message}</p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmModal.onConfirm}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                {confirmModal.confirmText || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
