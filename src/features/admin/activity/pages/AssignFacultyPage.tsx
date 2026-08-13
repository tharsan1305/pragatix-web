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
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../../services/apiClient';
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
  onBack,
  onSuccess
}: Props) {
  const [activity, setActivity] = useState<any>(initialActivity || null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classDetails, setClassDetails] = useState<any>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);
  const [assignmentDuration, setAssignmentDuration] = useState<'PERMANENT' | 'ONLY_TODAY'>('PERMANENT');
  const [remarks, setRemarks] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAssigning, setIsAssigning] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Safely coerce any backend value (object or primitive) to a display string
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

  const targetActivityId = initialActivity?.id || propActivityId;

  useEffect(() => {
    loadData();
  }, [targetActivityId]);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // 1. Fetch Activity if not provided
      let currentActivity = initialActivity;
      if (!currentActivity && targetActivityId) {
        try {
          const actRes = await apiClient.get(`/api/v1/cc/activities/${targetActivityId}`);
          currentActivity = actRes.data?.data || actRes.data;
        } catch {
          const actRes = await apiClient.get(`/api/v1/admin/activities/${targetActivityId}`);
          currentActivity = actRes.data?.data || actRes.data;
        }
      }
      setActivity(currentActivity);

      // 2. Fetch Class Details — EXACT Flutter endpoint: GET /api/v1/cc/activities/class-details
      try {
        const clsRes = await apiClient.get('/api/v1/cc/activities/class-details');
        if (clsRes.data?.success && clsRes.data?.data) {
          setClassDetails(clsRes.data.data);
        }
      } catch {
        // Not a CC user — skip silently
      }

      // 3. Fetch Class Teachers — EXACT Flutter endpoint: GET /api/v1/cc/activities/teachers
      let teachersList: any[] = [];
      try {
        const tRes = await apiClient.get('/api/v1/cc/activities/teachers');
        teachersList = tRes.data?.success
          ? (tRes.data.data || [])
          : (Array.isArray(tRes.data) ? tRes.data : []);
      } catch (err: any) {
        // Only the CC activities/teachers endpoint is valid per Flutter.
        // If it fails, surface the error rather than silently fall back.
        const msg = err.response?.data?.message || 'Failed to load faculty list from server.';
        setErrorMessage(msg);
      }

      setTeachers(teachersList);

      // 4. Initial teacher selection if assigned
      if (currentActivity?.assignmentSummary && Array.isArray(currentActivity.assignmentSummary) && currentActivity.assignmentSummary.length > 0) {
        const first = currentActivity.assignmentSummary[0];
        if (first?.teacherId) {
          setSelectedTeacherId(Number(first.teacherId));
        }
      }
    } catch (err: any) {
      console.error('AssignFacultyPage load error:', err);
      setErrorMessage(err.response?.data?.message || 'Failed to load teacher assignment data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTeachers = teachers.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = (t.fullName || t.name || '').toLowerCase();
    const username = (t.username || '').toLowerCase();
    const email = (t.email || '').toLowerCase();
    const dept = (t.departmentName || t.department || '').toLowerCase();
    return name.includes(q) || username.includes(q) || email.includes(q) || dept.includes(q);
  });

  const handleAssign = async () => {
    if (!selectedTeacherId) {
      toast.error('Please select a faculty member to assign this activity.');
      return;
    }
    if (!targetActivityId) {
      toast.error('Invalid activity target.');
      return;
    }

    const selectedTeacher = teachers.find(t => (t.id || t.userId) === selectedTeacherId);
    const teacherName = selectedTeacher?.fullName || selectedTeacher?.name || 'Faculty Member';

    setIsAssigning(true);
    const toastId = toast.loading(`Assigning activity to ${teacherName}...`);

    try {
      const payload = {
        teacherId: selectedTeacherId,
        stageId: initialStageId || activity?.stageId,
        assignmentDuration: assignmentDuration,
        remarks: remarks.trim() || undefined
      };

      try {
        await apiClient.post(`/api/v1/cc/activities/${targetActivityId}/assign-teacher`, payload);
      } catch {
        await apiClient.post(`/api/v1/admin/activities/${targetActivityId}/assign-faculty`, payload);
      }

      toast.dismiss(toastId);
      const durationText = assignmentDuration === 'ONLY_TODAY' ? 'for today only' : 'permanently';
      toast.success(`Activity assigned ${durationText} to ${teacherName} successfully!`);

      if (onSuccess) onSuccess();
      else onBack();
    } catch (err: any) {
      toast.dismiss(toastId);
      console.error('Assign failure:', err);
      toast.error(err.response?.data?.message || 'Failed to assign teacher to activity');
    } finally {
      setIsAssigning(false);
    }
  };

  // Extract current assignment details
  const assignmentSummary = activity?.assignmentSummary;
  const currentAssignedName = Array.isArray(assignmentSummary) && assignmentSummary.length > 0
    ? (assignmentSummary[0]?.teacherName || assignmentSummary[0]?.teacher)
    : null;

  return (
    <div className="flex flex-col min-h-full bg-slate-50 pb-20">
      {/* Top Teal Gradient Header matching Flutter 1:1 */}
      <div className="bg-gradient-to-r from-[#11998E] to-[#38EF7D] text-white px-4 md:px-6 py-4 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition cursor-pointer">
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>
          <h1 className="text-xl font-bold text-white">Assign Staff</h1>
        </div>
        <button
          onClick={loadData}
          className="p-2 hover:bg-white/10 rounded-full transition text-white cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-4xl mx-auto w-full space-y-5">
        {/* Activity & Class Details Header Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200 uppercase tracking-wider">
                {safeStr(activity?.subgroup) || safeStr(activity?.category) || 'Activity Task'}
              </span>
              <h2 className="text-lg md:text-xl font-bold text-slate-900 mt-1">
                {activity?.name || 'Activity'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                XP: {safeXp(activity)}
              </span>
            </div>
          </div>

          {/* Subtitle / Details */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-500">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>
                {classDetails?.departmentName || ''}{classDetails?.sectionName ? ` • Section ${classDetails.sectionName}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Academic Year: {classDetails?.yearName || classDetails?.year || ''}</span>
            </div>
          </div>

          {/* Current Assignment Status Pill */}
          {currentAssignedName ? (
            <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Currently Assigned to: {currentAssignedName}</span>
            </div>
          ) : (
            <div className="mt-2 p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-xs font-medium">
              No faculty member assigned yet. Select a teacher below to assign.
            </div>
          )}
        </div>

        {/* Assignment Duration Selector matching Flutter 1:1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Assignment Duration</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Today Only Option */}
            <div
              onClick={() => setAssignmentDuration('ONLY_TODAY')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                assignmentDuration === 'ONLY_TODAY'
                  ? 'bg-teal-50/70 border-teal-500 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className={`p-2 rounded-lg ${assignmentDuration === 'ONLY_TODAY' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h4 className={`text-xs font-bold ${assignmentDuration === 'ONLY_TODAY' ? 'text-teal-800' : 'text-slate-800'}`}>
                  Only Today
                </h4>
                <p className="text-[10px] text-slate-500">Temporary (Expires midnight)</p>
              </div>
            </div>

            {/* Permanent Option */}
            <div
              onClick={() => setAssignmentDuration('PERMANENT')}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                assignmentDuration === 'PERMANENT'
                  ? 'bg-teal-50/70 border-teal-500 shadow-xs'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className={`p-2 rounded-lg ${assignmentDuration === 'PERMANENT' ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'}`}>
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className={`text-xs font-bold ${assignmentDuration === 'PERMANENT' ? 'text-teal-800' : 'text-slate-800'}`}>
                  Permanent
                </h4>
                <p className="text-[10px] text-slate-500">Fixed assigned faculty</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Select Faculty Member */}
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h3 className="font-bold text-slate-800 text-sm">Select Faculty Member</h3>
            <span className="text-xs text-slate-500">{filteredTeachers.length} teachers available</span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty by name, department, email..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-9 py-2.5 text-xs font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Error Message if any */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Teachers List */}
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-7 h-7 animate-spin text-teal-600" />
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <User className="w-8 h-8 mx-auto mb-1 text-slate-300" />
              <p className="font-semibold text-slate-600 text-xs">No faculty members found</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
              {filteredTeachers.map((teacher) => {
                const tId = teacher.id || teacher.userId;
                const isSelected = selectedTeacherId === tId;
                const teacherName = teacher.fullName || teacher.name || teacher.username || 'Teacher';

                return (
                  <div
                    key={tId}
                    onClick={() => setSelectedTeacherId(tId)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-500 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${
                        isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {teacherName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-xs md:text-sm">{teacherName}</h4>
                        <p className="text-[11px] text-slate-500">
                          {teacher.departmentName || teacher.department || 'Faculty'} • {teacher.email || teacher.username}
                        </p>
                      </div>
                    </div>

                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                      isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Remarks Field */}
          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Remarks / Notes (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add optional notes for this assignment..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-medium text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            />
          </div>
        </div>

        {/* Submit Action Button */}
        <button
          onClick={handleAssign}
          disabled={isAssigning || !selectedTeacherId}
          className="w-full bg-[#11998E] hover:bg-[#0d7d74] disabled:bg-slate-300 text-white py-3.5 px-4 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
        >
          {isAssigning ? (
            <Loader2 className="w-5 h-5 animate-spin text-white" />
          ) : (
            <CheckCircle2 className="w-5 h-5" />
          )}
          <span>Assign Faculty Member</span>
        </button>
      </div>
    </div>
  );
}
