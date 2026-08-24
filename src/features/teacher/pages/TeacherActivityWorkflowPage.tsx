import { useState, useEffect } from 'react';
import { ArrowLeft, Search, CheckCircle, RefreshCw, Award, School, Building2, Layers, ChevronRight, AlertCircle, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

interface TeacherActivityWorkflowPageProps {
  activity: any;
  stageId?: number;
  stageName?: string;
  academicYear?: string;
  subgroupName?: string;
  onBack: () => void;
}

// Fixed year list — exactly matches Flutter's _fixedYears
const FIXED_YEARS = [
  { yearName: '1st Year', yearNo: 1 },
  { yearName: '2nd Year', yearNo: 2 },
  { yearName: '3rd Year', yearNo: 3 },
  { yearName: '4th Year', yearNo: 4 },
];

export default function TeacherActivityWorkflowPage({
  activity,
  stageId,
  academicYear,
  onBack,
}: TeacherActivityWorkflowPageProps) {
  // Flow steps: 1=Year, 2=Dept, 3=Section, 4=Student Selection & Award
  // Matches Flutter: step 1 skipped when academicYear is passed
  const [currentFlowStep, setCurrentFlowStep] = useState<number>(2);
  const [isLoading, setIsLoading] = useState(false);
  const [isAwarding, setIsAwarding] = useState(false);

  // Selected State
  const [availableYearsList, setAvailableYearsList] = useState<any[]>(FIXED_YEARS);
  const [selectedYear, setSelectedYear] = useState<any | null>(FIXED_YEARS[0]);

  const [availableDeptsList, setAvailableDeptsList] = useState<any[]>([]);
  const [selectedDept, setSelectedDept] = useState<any | null>(null);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');

  const [availableSectionsList, setAvailableSectionsList] = useState<any[]>([]);
  const [selectedSection, setSelectedSection] = useState<any | null>(null);
  const [hasSections, setHasSections] = useState(false);

  const [eligibleStudents, setEligibleStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [remarks, setRemarks] = useState('');
  const [assignmentId, setAssignmentId] = useState<number | null>(null);

  // Flutter: isPenalty = activity.penaltyEnabled && !activity.awardEnabled
  const isPenalty = !!(activity?.penaltyEnabled && !activity?.awardEnabled);
  // Flutter: xpAmount = isPenalty ? penaltyXp : awardXp
  const xpAmount = isPenalty ? (activity?.penaltyXp ?? 0) : (activity?.awardXp ?? 0);
  const xpLabel = isPenalty ? 'Penalty' : 'Award';
  const themeColor = isPenalty ? '#EF4444' : '#10B981';
  const themeColorLight = isPenalty ? '#FEF2F2' : '#F0FDF4';

  // ── Init: exactly matches Flutter initState ──
  useEffect(() => {
    let yearNo = 1;
    if (academicYear) {
      const ay = academicYear.toUpperCase();
      if (ay.includes('SECOND') || ay.includes('2')) yearNo = 2;
      else if (ay.includes('THIRD') || ay.includes('3')) yearNo = 3;
      else if (ay.includes('FOURTH') || ay.includes('4')) yearNo = 4;
    }
    const matchedYear = FIXED_YEARS.find(y => y.yearNo === yearNo) || FIXED_YEARS[0];
    setSelectedYear(matchedYear);

    if (academicYear) {
      // Skip year selection — Flutter does the same
      setCurrentFlowStep(2);
      fetchDeptsForYear(matchedYear);
    } else {
      setCurrentFlowStep(1);
      fetchYearsForActivity();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activity?.id, stageId, academicYear]);

  // ── Year param helper — exactly matches Flutter _getYearParam ──
  const getYearParam = (year: any): string => {
    const yearNo = year?.yearNo;
    if (yearNo === 2) return 'II';
    if (yearNo === 3) return 'III';
    if (yearNo === 4) return 'IV';
    return 'I';
  };

  // ── Year aliases — matches Flutter _getYearAliases & handles enums ──
  const getYearAliases = (fy: any): string[] => {
    const no = fy.yearNo;
    if (no === 1) return ['1', '1st', 'first', 'i', '1st year', 'year 1', 'first year', 'first_year'];
    if (no === 2) return ['2', '2nd', 'second', 'ii', '2nd year', 'year 2', 'second year', 'second_year'];
    if (no === 3) return ['3', '3rd', 'third', 'iii', '3rd year', 'year 3', 'third year', 'third_year'];
    if (no === 4) return ['4', '4th', 'fourth', 'iv', '4th year', 'year 4', 'fourth year', 'fourth_year'];
    return [];
  };

  // ── API: Fetch years — GET /api/v1/my-activities/{id}/years ──
  const fetchYearsForActivity = async () => {
    setIsLoading(true);
    setAvailableYearsList([]);
    try {
      const stageParam = stageId ? `?stageId=${stageId}` : '';
      const res = await apiClient.get(`/api/v1/my-activities/${activity.id}/years${stageParam}`);
      let finalYears = FIXED_YEARS;
      if (res.data?.success) {
        const yrs: any[] = res.data.data || [];
        const filtered = FIXED_YEARS.filter(fy => {
          const aliases = getYearAliases(fy);
          return yrs.some(y => {
            const raw = String(y).toLowerCase().trim();
            const normalized = raw.replace(/_/g, ' ');
            return aliases.includes(raw) || aliases.includes(normalized);
          });
        });
        if (filtered.length > 0) finalYears = filtered;
      }
      setAvailableYearsList(finalYears);
    } catch {
      setAvailableYearsList(FIXED_YEARS);
    } finally {
      setIsLoading(false);
    }
  };

  // ── API: Fetch depts — GET /api/v1/my-activities/{id}/departments?year=I&stageId=X ──
  const fetchDeptsForYear = async (year: any) => {
    setIsLoading(true);
    setAvailableDeptsList([]);
    try {
      const yearParam = getYearParam(year);
      const stageParam = stageId ? `&stageId=${stageId}` : '';
      const res = await apiClient.get(
        `/api/v1/my-activities/${activity.id}/departments?year=${yearParam}${stageParam}`
      );
      if (res.data?.success) {
        setAvailableDeptsList(res.data.data || []);
      } else {
        setAvailableDeptsList([]);
      }
    } catch {
      setAvailableDeptsList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── API: Fetch sections — GET /api/v1/my-activities/{id}/sections?year=I&departmentId=X ──
  const fetchSectionsForDept = async (dept: any, year: any): Promise<any[]> => {
    setIsLoading(true);
    setAvailableSectionsList([]);
    try {
      const yearParam = getYearParam(year);
      const stageParam = stageId ? `&stageId=${stageId}` : '';
      const res = await apiClient.get(
        `/api/v1/my-activities/${activity.id}/sections?year=${yearParam}&departmentId=${dept.id}${stageParam}`
      );
      if (res.data?.success) {
        return res.data.data || [];
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
    return [];
  };

  // ── API: Fetch students — GET /api/v1/my-activities/{id}/students?year=I&departmentId=X&sectionId=Y ──
  const fetchStudentsFinal = async (section: any, dept: any, year: any) => {
    setIsLoading(true);
    setEligibleStudents([]);
    setSelectedStudentIds(new Set());
    setSelectAll(false);
    setAssignmentId(null);

    try {
      const yearParam = getYearParam(year);
      const stageParam = stageId ? `&stageId=${stageId}` : '';
      let url = `/api/v1/my-activities/${activity.id}/students?year=${yearParam}&departmentId=${dept?.id}${stageParam}`;
      if (section?.id) {
        url += `&sectionId=${section.id}`;
      }

      const res = await apiClient.get(url);
      if (res.data?.success) {
        // Flutter parses: data['data']['students'] and sorts by fullName then regNo
        const rawList: any[] = res.data.data?.students || [];
        const sortedList = [...rawList].sort((a, b) => {
          const nameA = (a.fullName || '').trim().toLowerCase();
          const nameB = (b.fullName || '').trim().toLowerCase();
          const comp = nameA.localeCompare(nameB);
          if (comp !== 0) return comp;
          return (a.regNo || '').localeCompare(b.regNo || '');
        });
        setEligibleStudents(sortedList);
        // Flutter: assignmentId from data['data']['assignment']['id']
        setAssignmentId(res.data.data?.assignment?.id || null);
      }
    } catch {
      setEligibleStudents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Navigation handlers — match Flutter _onYearSelected, _onDeptSelected, _onSectionSelected ──
  const handleYearSelected = (year: any) => {
    setSelectedYear(year);
    setDeptSearchQuery('');
    setCurrentFlowStep(2);
    fetchDeptsForYear(year);
  };

  const handleDeptSelected = async (dept: any) => {
    setSelectedDept(dept);
    const sections = await fetchSectionsForDept(dept, selectedYear);
    if (sections && sections.length > 0) {
      setAvailableSectionsList(sections);
      setHasSections(true);
      setCurrentFlowStep(3);
    } else {
      setHasSections(false);
      setCurrentFlowStep(4);
      fetchStudentsFinal(null, dept, selectedYear);
    }
  };

  const handleSectionSelected = (sec: any) => {
    setSelectedSection(sec);
    setCurrentFlowStep(4);
    fetchStudentsFinal(sec, selectedDept, selectedYear);
  };

  // ── Back navigation — matches Flutter _handleBackNavigation ──
  const handleBackNavigation = () => {
    const minStep = academicYear ? 2 : 1;
    if (currentFlowStep > minStep) {
      if (currentFlowStep === 4) {
        // Go back to section or dept depending on hasSections
        setCurrentFlowStep(hasSections ? 3 : 2);
      } else {
        setCurrentFlowStep(currentFlowStep - 1);
      }
    } else {
      onBack();
    }
  };

  // ── Student selection ──
  const handleToggleStudent = (id: number) => {
    const next = new Set(selectedStudentIds);
    if (next.has(id)) {
      next.delete(id);
      setSelectAll(false);
    } else {
      next.add(id);
    }
    setSelectedStudentIds(next);
    if (next.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectAll(true);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedStudentIds(new Set());
      setSelectAll(false);
    } else {
      const ids = new Set<number>(filteredStudents.map((s: any) => Number(s.id)));
      setSelectedStudentIds(ids);
      setSelectAll(true);
    }
  };

  // ── Award — POST /api/v1/student-xp/award/batch — EXACT Flutter _submitAward ──
  const handleBatchAward = async () => {
    if (selectedStudentIds.size === 0) {
      toast.error('Please select at least one student');
      return;
    }

    setIsAwarding(true);
    const toastId = toast.loading(
      `${isPenalty ? 'Deducting XP from' : 'Awarding XP to'} ${selectedStudentIds.size} student(s)...`
    );
    try {
      // Payload matches Flutter exactly:
      // { studentIds, activityId, assignmentId (fallback to activityId), remarks, result }
      const body = {
        studentIds: Array.from(selectedStudentIds),
        activityId: activity.id,
        assignmentId: assignmentId || activity.id,
        remarks: remarks.trim(),
        result: isPenalty ? 'FAIL' : 'PASS',
      };
      const res = await apiClient.post('/api/v1/student-xp/award/batch', body);
      if (res.data?.success) {
        toast.dismiss(toastId);
        toast.success(res.data.message || 'XP Awarded successfully!');
        setRemarks('');
        onBack();
      } else {
        toast.dismiss(toastId);
        toast.error(res.data?.message || 'Failed to award XP');
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || 'Failed to award XP');
    } finally {
      setIsAwarding(false);
    }
  };

  // ── AppBar title — matches Flutter _getAppBarTitle ──
  const getAppBarTitle = () => {
    switch (currentFlowStep) {
      case 1: return 'Select Academic Year';
      case 2: return 'Select Department';
      case 3: return 'Select Section';
      case 4: return activity?.name || 'Award Activity';
      default: return activity?.name || 'Award Activity';
    }
  };

  // ── Client-side filters — match Flutter _filteredDepts and _filteredStudentsList ──
  const filteredDepts = availableDeptsList.filter(d =>
    (d.name || '').toLowerCase().includes(deptSearchQuery.toLowerCase())
  );

  const filteredStudents = eligibleStudents.filter(s => {
    if (!studentSearchQuery.trim()) return true;
    const q = studentSearchQuery.toLowerCase();
    return (
      (s.fullName || '').toLowerCase().includes(q) ||
      (s.regNo || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFC]">
      {/* AppBar — matches Flutter gradient colors exactly */}
      <div className="bg-gradient-to-r from-[#1E293B] to-[#334155] text-white px-6 py-4 shadow-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleBackNavigation}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="type-h4 tracking-wide">{getAppBarTitle()}</h1>
        </div>

        <button
          onClick={() => {
            if (currentFlowStep === 1) fetchYearsForActivity();
            else if (currentFlowStep === 2) fetchDeptsForYear(selectedYear);
            else if (currentFlowStep === 3) fetchSectionsForDept(selectedDept, selectedYear);
            else fetchStudentsFinal(selectedSection, selectedDept, selectedYear);
          }}
          className="p-2 hover:bg-white/10 rounded-full transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-white ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 max-w-3xl mx-auto w-full p-4 sm:p-6 space-y-4">

        {/* STEP 1: SELECT ACADEMIC YEAR */}
        {currentFlowStep === 1 && (
          <div className="space-y-4">
            <h2 className="type-h5 text-[#1E293B]">Select Academic Year</h2>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-[#11998E]" />
              </div>
            ) : availableYearsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <School className="w-14 h-14 text-slate-300 mb-3" />
                <p className="type-body-sm font-medium text-slate-500">No available years found for this activity</p>
              </div>
            ) : (
              <div className="space-y-3">
                {availableYearsList.map(yr => (
                  <div
                    key={yr.yearNo}
                    onClick={() => handleYearSelected(yr)}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <School className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-800 type-body-sm">{yr.yearName}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: SELECT DEPARTMENT */}
        {currentFlowStep === 2 && (
          <div className="space-y-4">
            <h2 className="type-h5 text-[#1E293B]">Select Department</h2>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search Department…"
                value={deptSearchQuery}
                onChange={(e) => setDeptSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#E2E8F0] rounded-xl type-body-sm outline-none focus:border-[#11998E]"
              />
            </div>

            {isLoading ? (
              <div className="flex justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-[#11998E]" />
              </div>
            ) : filteredDepts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Building2 className="w-14 h-14 text-slate-300 mb-3" />
                <p className="type-body-sm font-medium text-slate-500">No departments found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredDepts.map(dept => (
                  <div
                    key={dept.id}
                    onClick={() => handleDeptSelected(dept)}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-800 type-body-sm">{dept.name}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: SELECT SECTION */}
        {currentFlowStep === 3 && (
          <div className="space-y-4">
            <h2 className="type-h5 text-[#1E293B]">Select Section</h2>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-[#11998E]" />
              </div>
            ) : (
              <div className="space-y-3">
                {availableSectionsList.map((sec: any) => (
                  <div
                    key={sec.id || sec.sectionName}
                    onClick={() => handleSectionSelected(sec)}
                    className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center">
                        <Layers className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-slate-800 type-body-sm">
                        Section {sec.sectionName || sec.name}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 4: STUDENT ROSTER & AWARD XP */}
        {currentFlowStep === 4 && (
          <div className="space-y-4 pb-24">
            {/* Header — shows penalty vs award mode with correct color */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="type-body-sm font-bold text-slate-800">Select Students</span>
                <span
                  className="type-caption font-bold px-3 py-1 rounded-xl border"
                  style={{ color: themeColor, backgroundColor: themeColorLight, borderColor: themeColor + '50' }}
                >
                  {xpLabel}: {xpAmount} XP
                </span>
              </div>
              <p className="type-caption text-slate-500 mt-1">
                {activity?.name} · Cap: {activity?.cap ?? 1}
              </p>
            </div>

            {/* Search + Select All Bar — matches Flutter */}
            <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search Student by Name/ID…"
                  value={studentSearchQuery}
                  onChange={(e) => setStudentSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl type-body-sm outline-none focus:border-[#11998E]"
                />
              </div>

              {/* Select All checkbox — matches Flutter CheckboxListTile */}
              <div
                onClick={handleToggleSelectAll}
                className={`flex items-center gap-3 px-2 py-2 rounded-xl cursor-pointer transition-colors ${selectAll ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
              >
                <div
                  className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                  style={{
                    backgroundColor: selectAll ? themeColor : 'white',
                    borderColor: selectAll ? themeColor : '#CBD5E1'
                  }}
                >
                  {selectAll && <CheckCircle className="w-3 h-3 text-white" />}
                </div>
                <span className="type-body-sm font-bold text-slate-700">Select All Students</span>
                {selectedStudentIds.size > 0 && (
                  <span
                    className="ml-auto type-caption font-bold px-2 py-0.5 rounded-full"
                    style={{ color: themeColor, backgroundColor: themeColorLight }}
                  >
                    {selectedStudentIds.size} selected
                  </span>
                )}
              </div>
            </div>

            {/* Student List */}
            {isLoading ? (
              <div className="flex justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-[#11998E]" />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-slate-100 p-8">
                <AlertCircle className="w-12 h-12 text-slate-300 mb-2" />
                <p className="type-body-sm font-medium text-slate-500">
                  {eligibleStudents.length === 0
                    ? 'No eligible students found for this activity'
                    : 'No students match search criteria'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredStudents.map(student => {
                  const studentId = Number(student.id);
                  const isSelected = selectedStudentIds.has(studentId);
                  const isAwarded = student.isCompleted || student.status === 'PASS';

                  return (
                    <div
                      key={student.id}
                      onClick={() => handleToggleStudent(studentId)}
                      className="bg-white p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer"
                      style={{
                        borderColor: isSelected ? themeColor + '80' : '#F1F5F9',
                        backgroundColor: isSelected ? themeColorLight : 'white',
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        {/* Checkbox — matches Flutter CheckboxListTile */}
                        <div
                          className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors"
                          style={{
                            backgroundColor: isSelected ? themeColor : 'white',
                            borderColor: isSelected ? themeColor : '#CBD5E1'
                          }}
                        >
                          {isSelected && (isPenalty
                            ? <Minus className="w-3 h-3 text-white stroke-[3]" />
                            : <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-semibold type-body-sm text-slate-800">{student.fullName}</h4>
                          <p className="type-caption text-slate-500 font-mono mt-0.5">
                            {student.regNo || student.studentId}
                          </p>
                        </div>
                      </div>

                      {isAwarded && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full type-caption font-bold bg-green-100 text-green-700">
                          <CheckCircle className="w-3.5 h-3.5" /> PASSED
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Sticky Award Bar — matches Flutter Container at bottom */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-lg space-y-3 sticky bottom-4">
              <input
                type="text"
                placeholder="Add optional description/remarks…"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl type-body-sm outline-none focus:border-[#11998E]"
              />
              <button
                onClick={handleBatchAward}
                disabled={isAwarding || selectedStudentIds.size === 0}
                className="w-full py-3 font-bold rounded-xl type-btn shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: isAwarding || selectedStudentIds.size === 0 ? '#94A3B8' : themeColor,
                  color: 'white',
                }}
              >
                <Award className="w-5 h-5" />
                <span>
                  {isPenalty ? 'Deduct XP from' : 'Award XP to'} {selectedStudentIds.size} Student{selectedStudentIds.size !== 1 ? 's' : ''}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
