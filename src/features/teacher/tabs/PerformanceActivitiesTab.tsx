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
  "ACADEMIC": { color: "text-text-primary", bg: "bg-bg", icon: School, label: "Academic" },
  "COMMUNICATION": { color: "text-text-primary", bg: "bg-bg", icon: MessageCircle, label: "Communication" },
  "LEADERSHIP": { color: "text-text-primary", bg: "bg-bg", icon: Gavel, label: "Leadership" },
  "INNOVATION": { color: "text-text-primary", bg: "bg-bg", icon: Lightbulb, label: "Innovation" },
  "PLACEMENT": { color: "text-text-primary", bg: "bg-bg", icon: Briefcase, label: "Placement" },
  "DISCIPLINE": { color: "text-accent", bg: "bg-accent-tint", icon: ShieldCheck, label: "Discipline" },
  "SPORTS": { color: "text-text-primary", bg: "bg-bg", icon: Activity, label: "Sports" },
  "COMMUNITY": { color: "text-text-primary", bg: "bg-bg", icon: Users, label: "Community" },
  "SKILL": { color: "text-text-primary", bg: "bg-bg", icon: BrainCircuit, label: "Skill" },
  "CULTURAL": { color: "text-text-primary", bg: "bg-bg", icon: Music, label: "Cultural" },
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
      const response = await apiClient.get('/api/v1/admin/my-activities');
      if (response.data?.success) {
        setMyActivities(response.data.data || []);
      }
    } catch (e) {
      logger.error("Failed to fetch activities", e);
    } finally {
      setIsLoading(false);
    }
  };

  const getYearParam = (year: any) => {
    const no = year?.yearNo;
    if (no === 2) return 'II';
    if (no === 3) return 'III';
    if (no === 4) return 'IV';
    return 'I';
  };

  const onCategorySelected = (cat: string) => {
    setSelectedCategory(cat);
    setEventSearch('');
    setCurrentFlowStep(1);
  };

  const onEventSelected = async (event: any) => {
    const type = (event.type || 'individual').toLowerCase();
    
    if (type.includes('group')) {
      navigate(`/teacher/group-activity/${event.activityId}/year`);
      return;
    }

    setSelectedEvent(event);
    setSelectedYear(null);
    setSelectedDept(null);
    setSelectedSection(null);
    setCurrentFlowStep(2);
    setAvailableYears(FIXED_YEARS);
  };

  const onYearSelected = async (year: any) => {
    setSelectedYear(year);
    setCurrentFlowStep(3);
    setIsLoading(true);
    try {
      const yearParam = getYearParam(year);
      const res = await apiClient.get(`/api/v1/my-activities/${selectedEvent.activityId}/departments?year=${yearParam}`);
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
    setIsLoading(true);
    try {
      const yearParam = getYearParam(selectedYear);
      const res = await apiClient.get(`/api/v1/my-activities/${selectedEvent.activityId}/sections?year=${yearParam}&deptId=${dept.id}`);
      if (res.data.success && res.data.data?.length > 0) {
        setAvailableSections(res.data.data);
        setHasSections(true);
        setCurrentFlowStep(4);
      } else {
        setHasSections(false);
        fetchStudents(null, dept);
      }
    } catch (e) {
      logger.error(e);
      setHasSections(false);
      fetchStudents(null, dept);
    } finally {
      setIsLoading(false);
    }
  };

  const onSectionSelected = (section: any) => {
    setSelectedSection(section.sectionName || section.name);
    fetchStudents(section, selectedDept);
  };

  const fetchStudents = async (section: any, dept: any) => {
    setCurrentFlowStep(5);
    setIsLoading(true);
    try {
      const yearParam = getYearParam(selectedYear);
      const secParam = section ? `&section=${section.sectionName || section.name}` : '';
      const res = await apiClient.get(
        `/api/v1/my-activities/${selectedEvent.activityId}/eligible-students?year=${yearParam}&deptId=${dept.id}${secParam}`
      );
      if (res.data.success) {
        setEligibleStudents(res.data.data?.students || []);
        setAssignmentId(res.data.data?.assignmentId || null);
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

  if (isLoading && currentFlowStep === 0) {
    return <div className="p-8 text-center text-text-muted bg-bg min-h-screen">Loading activities...</div>;
  }

  return (
    <div className="flex flex-col min-h-full bg-bg text-text-primary">
      
      {/* Dynamic Header */}
      <div className="bg-card px-6 py-4 flex items-center border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] sticky top-0 z-20">
        {currentFlowStep > 0 && (
          <button onClick={handleBack} className="mr-4 p-2 bg-card border border-border rounded-lg text-text-primary hover:bg-bg transition-colors cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="type-h4 font-bold text-text-primary flex-1">
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
              <span className="px-3 py-1 bg-warning-tint border border-warning/30 text-warning type-caption font-bold rounded-md">
                {pendingBadges} Pending Request{pendingBadges > 1 ? 's' : ''}
              </span>
            )}
            <button 
              onClick={() => navigate('/teacher/students-directory')}
              className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors flex-shrink-0 cursor-pointer"
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
                  className="bg-card p-6 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border flex flex-col items-start hover:border-text-muted transition-all text-left cursor-pointer"
                >
                  <div className={`p-3 rounded-lg border border-border ${style.bg} ${style.color} mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="type-h5 font-bold text-text-primary">{style.label}</h3>
                  <p className="type-caption text-text-secondary mt-1">{count} configured events</p>
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
              <h3 className="type-h5 font-bold text-text-primary ml-1">
                Select Predefined Event ({filteredEvents.length} available)
              </h3>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                <input 
                  type="text"
                  placeholder="Search Event..."
                  value={eventSearch}
                  onChange={e => setEventSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-card border border-border rounded-lg focus:border-text-primary outline-none type-body-sm text-text-primary placeholder-text-muted"
                />
              </div>
              <div className="space-y-4 pb-20">
                {filteredEvents.map(event => (
                  <button
                    key={event.activityId}
                    onClick={() => onEventSelected(event)}
                    className="w-full bg-card p-5 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border flex flex-row items-center justify-between hover:border-text-muted transition-all cursor-pointer"
                  >
                    <div className="text-left flex-1 pr-4">
                      <h4 className="type-h5 font-bold text-text-primary leading-tight mb-1">{event.name}</h4>
                      <p className="type-caption text-text-secondary leading-snug line-clamp-2">
                        {event.description || event.type || 'Individual'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="type-body-sm font-bold text-accent bg-accent-tint px-3 py-1.5 rounded-md border border-accent/30">
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
            {isLoading ? <p className="text-text-muted">Loading years...</p> : availableYears.map((yr, idx) => (
              <button
                key={idx}
                onClick={() => onYearSelected(yr)}
                className="w-full bg-card p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border type-h5 font-bold text-text-primary text-left hover:bg-bg cursor-pointer transition-colors"
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
              <input 
                type="text"
                placeholder="Search departments..."
                value={deptSearch}
                onChange={e => setDeptSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg outline-none type-body-sm text-text-primary placeholder-text-muted focus:border-text-primary"
              />
            </div>
            {isLoading ? <p className="text-text-muted">Loading departments...</p> : availableDepts
              .filter(d => (d.name || d.departmentName || "").toLowerCase().includes(deptSearch.toLowerCase()))
              .map((d, idx) => (
              <button
                key={idx}
                onClick={() => onDeptSelected(d)}
                className="w-full bg-card p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border type-h5 font-bold text-text-primary text-left hover:bg-bg cursor-pointer transition-colors"
              >
                {d.name || d.departmentName}
              </button>
            ))}
          </div>
        )}

        {/* Step 4: Section */}
        {currentFlowStep === 4 && (
          <div className="space-y-3">
            {isLoading ? <p className="text-text-muted">Loading sections...</p> : availableSections.map((s, idx) => (
              <button
                key={idx}
                onClick={() => onSectionSelected(s)}
                className="w-full bg-card p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border type-h5 font-bold text-text-primary text-left hover:bg-bg cursor-pointer transition-colors"
              >
                {s.sectionName || s.name}
              </button>
            ))}
          </div>
        )}

        {/* Step 5: Students List */}
        {currentFlowStep === 5 && (
          <div className="space-y-4">
            <div className="bg-card p-4 rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <h3 className="type-h5 font-bold text-text-primary">{selectedEvent?.name}</h3>
              <p className="type-body-sm text-text-secondary">{selectedYear?.yearName} • {selectedDept?.name || selectedDept?.departmentName} {selectedSection ? `• ${selectedSection}` : ''}</p>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
              <input 
                type="text"
                placeholder="Search students..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg outline-none text-text-primary placeholder-text-muted focus:border-text-primary"
              />
            </div>

            <div className="flex items-center space-x-2 bg-card p-3 rounded-lg border border-border">
              <input 
                type="checkbox" 
                checked={selectAll}
                onChange={e => {
                  setSelectAll(e.target.checked);
                  setSelectedStudentIds(e.target.checked ? new Set(eligibleStudents.map(s => s.id)) : new Set());
                }}
                className="w-5 h-5 rounded border border-border text-accent focus:ring-accent"
              />
              <span className="font-bold text-text-primary">Select All Students ({eligibleStudents.length})</span>
            </div>

            <div className="space-y-2">
              {isLoading ? <p className="text-text-muted">Loading students...</p> : eligibleStudents
                .filter(s => (s.fullName || '').toLowerCase().includes(studentSearch.toLowerCase()))
                .map(student => (
                <div key={student.id} className="flex items-center p-4 bg-card rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border space-x-4">
                  <input 
                    type="checkbox" 
                    checked={selectedStudentIds.has(student.id)}
                    onChange={e => {
                      const newSet = new Set(selectedStudentIds);
                      if (e.target.checked) newSet.add(student.id);
                      else { newSet.delete(student.id); setSelectAll(false); }
                      setSelectedStudentIds(newSet);
                    }}
                    className="w-5 h-5 rounded border border-border text-accent focus:ring-accent"
                  />
                  <div>
                    <h4 className="font-bold text-text-primary">{student.fullName}</h4>
                    <p className="type-caption text-text-secondary">{student.studentId} • {student.year} • {student.section}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-4">
              <textarea
                placeholder="Add optional remarks..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="w-full p-4 border border-border bg-card rounded-lg outline-none focus:border-text-primary text-text-primary placeholder-text-muted"
                rows={3}
              />
              <button 
                onClick={submitAward}
                disabled={isAwarding || selectedStudentIds.size === 0}
                className="w-full type-btn bg-accent hover:bg-accent-hover text-card font-bold py-3.5 rounded-lg shadow-none disabled:opacity-50 transition-colors cursor-pointer"
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
