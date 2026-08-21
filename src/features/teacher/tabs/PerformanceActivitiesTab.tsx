import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  School, MessageCircle, Gavel, Lightbulb, Briefcase, 
  ShieldCheck, Activity, Users, BrainCircuit, Music,
  ArrowLeft, Search, UsersRound
} from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../store/authContext';

const CATEGORY_STYLES: Record<string, any> = {
  "ACADEMIC": { color: "text-blue-600", bg: "bg-blue-100", icon: School, label: "Academic" },
  "COMMUNICATION": { color: "text-indigo-600", bg: "bg-indigo-100", icon: MessageCircle, label: "Communication" },
  "LEADERSHIP": { color: "text-amber-600", bg: "bg-amber-100", icon: Gavel, label: "Leadership" },
  "INNOVATION": { color: "text-orange-600", bg: "bg-orange-100", icon: Lightbulb, label: "Innovation" },
  "PLACEMENT": { color: "text-emerald-600", bg: "bg-emerald-100", icon: Briefcase, label: "Placement" },
  "DISCIPLINE": { color: "text-red-600", bg: "bg-red-100", icon: ShieldCheck, label: "Discipline" },
  "SPORTS": { color: "text-pink-600", bg: "bg-pink-100", icon: Activity, label: "Sports" },
  "COMMUNITY": { color: "text-teal-600", bg: "bg-teal-100", icon: Users, label: "Community" },
  "SKILL": { color: "text-purple-600", bg: "bg-purple-100", icon: BrainCircuit, label: "Skill" },
  "CULTURAL": { color: "text-cyan-600", bg: "bg-cyan-100", icon: Music, label: "Cultural" },
};

const FIXED_YEARS = [
  { yearName: '1st Year', yearNo: 1 },
  { yearName: '2nd Year', yearNo: 2 },
  { yearName: '3rd Year', yearNo: 3 },
  { yearName: '4th Year', yearNo: 4 },
];

export default function PerformanceActivitiesTab() {
  const navigate = useNavigate();
  const { subRoles } = useAuth();
  const isCC = subRoles.some(r => r.toUpperCase() === 'CC');

  const [currentFlowStep, setCurrentFlowStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [myActivities, setMyActivities] = useState<any[]>([]);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedYear, setSelectedYear] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState<any>(null);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  
  const [availableYears, setAvailableYears] = useState<any[]>([]);
  const [availableDepts, setAvailableDepts] = useState<any[]>([]);
  const [availableSections, setAvailableSections] = useState<any[]>([]);
  const [hasSections, setHasSections] = useState(false);

  // Execution Step States
  const [eligibleStudents, setEligibleStudents] = useState<any[]>([]);
  const [assignmentId, setAssignmentId] = useState<number | null>(null);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [isAwarding, setIsAwarding] = useState(false);

  // Search
  const [eventSearch, setEventSearch] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');

  const [pendingBadges, setPendingBadges] = useState(0);

  useEffect(() => {
    fetchMyActivities();
    if (isCC) {
      fetchPendingBadges();
    }
  }, [isCC]);

  const fetchPendingBadges = async () => {
    try {
      const res = await apiClient.get('/api/v1/cc/dashboard/stats');
      if (res.data?.success) {
        setPendingBadges(res.data.data?.pendingBadgeRequests ?? res.data.data?.pendingCount ?? 0);
      }
    } catch (e) {
      logger.error("Failed to fetch CC stats", e);
    }
  };

  const fetchMyActivities = async () => {
    setIsLoading(true);
    try {
      let response;
      try {
        response = await apiClient.get('/api/v1/admin/my-activities');
      } catch (err) {
        response = await apiClient.get('/api/v1/teacher/my-activities');
      }
      if (response.data?.success) {
        setMyActivities(response.data.data || []);
      }
    } catch (e) {
      logger.error("Failed to fetch activities", e);
    } finally {
      setIsLoading(false);
    }
  };

  const getYearAliases = (fy: any) => {
    const no = fy.yearNo;
    if (no === 1) return ["1", "1st year", "i", "first year", "1st", "first_year"];
    if (no === 2) return ["2", "2nd year", "ii", "second year", "2nd", "second_year"];
    if (no === 3) return ["3", "3rd year", "iii", "third year", "3rd", "third_year"];
    if (no === 4) return ["4", "4th year", "iv", "fourth year", "4th", "fourth_year"];
    return [];
  };

  const onCategorySelected = (cat: string) => {
    setSelectedCategory(cat);
    setEventSearch('');
    setCurrentFlowStep(1);
  };

  const onEventSelected = async (event: any) => {
    const type = (event.type || 'individual').toLowerCase();
    
    // Group activities are handled by dedicated pages
    if (type.includes('group')) {
      navigate(`/teacher/group-activity/${event.activityId}/year`);
      return;
    }

    // Individual activities go to inline drill down
    setSelectedEvent(event);
    setSelectedYear(null);
    setSelectedDept(null);
    setSelectedSection(null);
    setCurrentFlowStep(2);
    
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/api/v1/my-activities/${event.activityId}/years`);
      if (res.data.success) {
        const yrs = res.data.data || [];
        const filtered = FIXED_YEARS.filter(fy => {
          const aliases = getYearAliases(fy);
          return yrs.some((y: any) => {
            const raw = String(y).toLowerCase().trim();
            const normalized = raw.replace(/_/g, ' ');
            return aliases.includes(raw) || aliases.includes(normalized);
          });
        });
        setAvailableYears(filtered.length > 0 ? filtered : FIXED_YEARS);
      } else {
        setAvailableYears(FIXED_YEARS);
      }
    } catch (e) {
      logger.error(e);
      setAvailableYears(FIXED_YEARS);
    } finally {
      setIsLoading(false);
    }
  };

  const onYearSelected = async (year: any) => {
    setSelectedYear(year);
    setDeptSearch('');
    setCurrentFlowStep(3);
    
    setIsLoading(true);
    try {
      const yearMap: any = { 1: "I", 2: "II", 3: "III", 4: "IV" };
      const yParam = yearMap[year.yearNo] || "I";
      const res = await apiClient.get(`/api/v1/my-activities/${selectedEvent.activityId}/departments?year=${yParam}`);
      if (res.data.success) {
        setAvailableDepts(res.data.data || []);
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const onDeptSelected = async (dept: any) => {
    setSelectedDept(dept);
    setSelectedSection(null);
    
    setIsLoading(true);
    try {
      const yearMap: any = { 1: "I", 2: "II", 3: "III", 4: "IV" };
      const yParam = yearMap[selectedYear.yearNo] || "I";
      const res = await apiClient.get(`/api/v1/my-activities/${selectedEvent.activityId}/sections?year=${yParam}&departmentId=${dept.id}`);
      
      if (res.data.success) {
        const list = res.data.data || [];
        setAvailableSections(list);
        setHasSections(list.length > 0);
        
        if (list.length > 0) {
          setCurrentFlowStep(4);
        } else {
          setCurrentFlowStep(5);
          fetchStudentsFinal(null, dept);
        }
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const onSectionSelected = (sec: any) => {
    setSelectedSection(sec.sectionName || sec.name);
    setCurrentFlowStep(5);
    fetchStudentsFinal(sec, selectedDept);
  };

  const fetchStudentsFinal = async (sec: any, dept: any) => {
    setIsLoading(true);
    setEligibleStudents([]);
    setSelectedStudentIds(new Set());
    setSelectAll(false);
    setAssignmentId(null);
    
    try {
      const yearMap: any = { 1: "I", 2: "II", 3: "III", 4: "IV" };
      const yParam = yearMap[selectedYear.yearNo] || "I";
      let url = `/api/v1/my-activities/${selectedEvent.activityId}/students?year=${yParam}&departmentId=${dept.id}`;
      if (sec) url += `&sectionId=${sec.id}`;
      
      const res = await apiClient.get(url);
      if (res.data?.success) {
        const rawList: any[] = res.data.data.students || [];
        const sortedList = [...rawList].sort((a, b) => 
          (a.fullName || '').localeCompare(b.fullName || '')
        );
        setEligibleStudents(sortedList);
        setAssignmentId(res.data.data.assignment?.id || null);
      }
    } catch (e) {
      logger.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const submitAward = async () => {
    if (selectedStudentIds.size === 0) return alert("Select at least one student");
    
    setIsAwarding(true);
    try {
      const body = {
        studentIds: Array.from(selectedStudentIds),
        activityId: selectedEvent.activityId,
        assignmentId: assignmentId || selectedEvent.activityId,
        remarks: remarks.trim(),
      };
      const res = await apiClient.post('/api/v1/student-xp/award/batch', body);
      if (res.data.success) {
        alert(res.data.message || "XP Awarded successfully!");
        setRemarks("");
        setSelectedStudentIds(new Set());
        setSelectAll(false);
      } else {
        alert(res.data.message || "Failed to award XP");
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setIsAwarding(false);
    }
  };

  const handleBack = () => {
    if (currentFlowStep === 5) setCurrentFlowStep(hasSections ? 4 : 3);
    else if (currentFlowStep > 0) setCurrentFlowStep(currentFlowStep - 1);
  };

  // ----------------------------------------------------
  // Renderers
  // ----------------------------------------------------
  
  if (isLoading && currentFlowStep === 0) return <div className="p-8 text-center text-slate-500">Loading activities...</div>;

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      
      {/* Dynamic Header */}
      <div className="bg-slate-900 px-6 pt-12 pb-6 flex items-center shadow-md relative">
        {currentFlowStep > 0 && (
          <button onClick={handleBack} className="mr-4 p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="font-heading text-2xl font-bold text-white flex-1">
          {currentFlowStep === 0 && "Performance Activities"}
          {currentFlowStep === 1 && `${CATEGORY_STYLES[selectedCategory || '']?.label} Events`}
          {currentFlowStep === 2 && "Select Year"}
          {currentFlowStep === 3 && "Select Department"}
          {currentFlowStep === 4 && "Select Section"}
          {currentFlowStep === 5 && selectedEvent?.name}
        </h1>
        
        {/* CC Students Directory Button */}
        {isCC && currentFlowStep === 0 && (
          <div className="flex items-center space-x-2 ml-4">
            {pendingBadges > 0 && (
              <span className="px-3 py-1 bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold rounded-full">
                {pendingBadges} Pending Request{pendingBadges > 1 ? 's' : ''}
              </span>
            )}
            <button 
              onClick={() => navigate('/teacher/students-directory')}
              className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors flex-shrink-0"
              title="Students Directory"
            >
              <UsersRound className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full">
        {/* Step 0: Category Grid */}
        {currentFlowStep === 0 && (
          <div className="grid grid-cols-2 gap-4">
            {Object.keys(CATEGORY_STYLES).map(cat => {
              const style = CATEGORY_STYLES[cat];
              const Icon = style.icon;
              const count = myActivities.filter(a => a.xpCategory?.toUpperCase() === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => onCategorySelected(cat)}
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-start hover:shadow-md transition-shadow text-left"
                >
                  <div className={`p-3 rounded-xl ${style.bg} ${style.color} mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-heading font-bold text-slate-800 text-lg">{style.label}</h3>
                  <p className="text-xs text-slate-500 mt-1">{count} configured events</p>
                </button>
              );
            })}
          </div>
        )}

        {/* Step 1: Event List */}
        {currentFlowStep === 1 && (() => {
          const filteredEvents = myActivities
            .filter(a => a.xpCategory?.toUpperCase() === selectedCategory)
            .filter(a => a.name.toLowerCase().includes(eventSearch.toLowerCase()));
            
          return (
            <div className="space-y-5">
              <h3 className="font-heading text-[15px] font-semibold text-slate-800 ml-1">
                Select Predefined Event ({filteredEvents.length} available)
              </h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Search Event..."
                  value={eventSearch}
                  onChange={e => setEventSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm placeholder:text-slate-400"
                />
              </div>
              <div className="space-y-4 pb-20">
                {filteredEvents.map(event => (
                  <button
                    key={event.activityId}
                    onClick={() => onEventSelected(event)}
                    className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-row items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="text-left flex-1 pr-4">
                      <h4 className="font-bold text-slate-800 text-[15px] leading-tight mb-1">{event.name}</h4>
                      <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                        {event.description || event.type || 'Individual'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-sm font-bold text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100/50">
                        {event.awardXp} XP
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Step 2: Year */}
        {currentFlowStep === 2 && (
          <div className="space-y-3">
            {isLoading ? <p>Loading years...</p> : availableYears.map((yr, idx) => (
              <button
                key={idx}
                onClick={() => onYearSelected(yr)}
                className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 font-bold text-slate-800 text-lg text-left hover:bg-slate-50"
              >
                {yr.yearName}
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Dept */}
        {currentFlowStep === 3 && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Search departments..."
                value={deptSearch}
                onChange={e => setDeptSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none"
              />
            </div>
            {isLoading ? <p>Loading departments...</p> : availableDepts
              .filter(d => (d.name || d.departmentName || "").toLowerCase().includes(deptSearch.toLowerCase()))
              .map((d, idx) => (
              <button
                key={idx}
                onClick={() => onDeptSelected(d)}
                className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 font-bold text-slate-800 text-lg text-left hover:bg-slate-50"
              >
                {d.name || d.departmentName}
              </button>
            ))}
          </div>
        )}

        {/* Step 4: Section */}
        {currentFlowStep === 4 && (
          <div className="space-y-3">
            {isLoading ? <p>Loading sections...</p> : availableSections.map((s, idx) => (
              <button
                key={idx}
                onClick={() => onSectionSelected(s)}
                className="w-full bg-white p-4 rounded-xl shadow-sm border border-slate-100 font-bold text-slate-800 text-lg text-left hover:bg-slate-50"
              >
                {s.sectionName || s.name}
              </button>
            ))}
          </div>
        )}

        {/* Step 5: Students List */}
        {currentFlowStep === 5 && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h3 className="font-heading font-bold text-slate-800 text-lg">{selectedEvent?.name}</h3>
              <p className="text-sm text-slate-500">{selectedYear?.yearName} • {selectedDept?.name || selectedDept?.departmentName} {selectedSection ? `• ${selectedSection}` : ''}</p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input 
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 bg-white p-3 rounded-lg border border-slate-200">
              <input 
                type="checkbox" 
                checked={selectAll}
                onChange={e => {
                  setSelectAll(e.target.checked);
                  setSelectedStudentIds(e.target.checked ? new Set(eligibleStudents.map(s => s.id)) : new Set());
                }}
                className="w-5 h-5 rounded text-blue-600"
              />
              <span className="font-bold text-slate-700">Select All Students ({eligibleStudents.length})</span>
            </div>

            <div className="space-y-2">
              {isLoading ? <p>Loading students...</p> : eligibleStudents
                .filter(s => (s.fullName || '').toLowerCase().includes(studentSearch.toLowerCase()))
                .map(student => (
                <div key={student.id} className="flex items-center p-4 bg-white rounded-xl shadow-sm border border-slate-100 space-x-4">
                  <input 
                    type="checkbox" 
                    checked={selectedStudentIds.has(student.id)}
                    onChange={e => {
                      const newSet = new Set(selectedStudentIds);
                      if (e.target.checked) newSet.add(student.id);
                      else { newSet.delete(student.id); setSelectAll(false); }
                      setSelectedStudentIds(newSet);
                    }}
                    className="w-5 h-5 rounded text-blue-600"
                  />
                  <div>
                    <h4 className="font-bold text-slate-800">{student.fullName}</h4>
                    <p className="text-xs text-slate-500">{student.studentId} • {student.year} • {student.section}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <textarea
                placeholder="Add optional remarks..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <button 
                onClick={submitAward}
                disabled={isAwarding || selectedStudentIds.size === 0}
                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {isAwarding ? 'Awarding...' : `Award XP to ${selectedStudentIds.size} Student(s)`}
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
