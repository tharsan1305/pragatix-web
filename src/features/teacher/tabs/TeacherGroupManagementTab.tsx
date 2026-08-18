import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { UsersRound, RefreshCw, ChevronDown, ChevronUp, UserPlus, Edit2, Shield, UserMinus, Crown, Trash2, Eye, X, Search, CheckCircle2, Check, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../store/authContext';

interface TeamMember {
  studentId?: string | number;
  regNo?: string;
  fullName?: string;
  name?: string;
  departmentName?: string;
  department?: any;
  yearName?: string;
  year?: any;
  sectionName?: string;
  section?: any;
  academicYear?: string;
  score?: number;
  totalXp?: number;
  xp?: number;
  level?: number;
  stageLevel?: number;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
  currentStage?: number;
}

interface GroupData {
  teamId?: number;
  id?: number;
  teamName?: string;
  name?: string;
  groupName?: string;
  captainId?: string | number;
  captainName?: string;
  captainRegNo?: string;
  captain?: any;
  viceCaptainId?: string | number;
  viceCaptainName?: string;
  viceCaptainRegNo?: string;
  viceCaptain?: any;
  departmentName?: string;
  department?: any;
  academicYearName?: string;
  academicYear?: any;
  yearName?: string;
  year?: any;
  semesterName?: string;
  semester?: any;
  sectionName?: string;
  section?: any;
  currentStage?: number;
  level?: number;
  teamCapacity?: number;
  size?: number;
  maxTeamSize?: number;
  teamMembers?: TeamMember[];
  members?: TeamMember[];
  students?: TeamMember[];
  canDelete?: boolean;
}

const getTeamLevel = (g: GroupData) => {
  const members = g.teamMembers || g.members || g.students || [];

  // Try captain first
  const capReg = (g.captainId || '').toString().toLowerCase().trim();
  const captain = members.find((m: any) => {
    const mReg = (m.regNo || m.studentId || m.id || '').toString().toLowerCase().trim();
    return (mReg && mReg === capReg) || m.isCaptain || m.teamRole === 'CAPTAIN';
  });

  if (captain?.currentStage) return captain.currentStage;
  if (captain?.level) return captain.level;

  // Try first member next
  if (members[0]?.currentStage) return members[0].currentStage;
  if (members[0]?.level) return members[0].level;

  // Try maximum among all members next
  const stages = members.map((m: any) => m.currentStage || m.level || 1);
  if (stages.length > 0) return Math.max(...stages);

  return g.currentStage || g.level || 1;
};

const normalizeYear = (raw: any): string => {
  if (!raw) return '';
  const s = String(raw).trim().toUpperCase();
  if (s.includes('FIRST') || s === '1' || s === 'I' || s.includes('1ST')) return '1';
  if (s.includes('SECOND') || s === '2' || s === 'II' || s.includes('2ND')) return '2';
  if (s.includes('THIRD') || s === '3' || s === 'III' || s.includes('3RD')) return '3';
  if (s.includes('FOURTH') || s === '4' || s === 'IV' || s.includes('4TH')) return '4';
  return s;
};

const isMatchingYear = (itemYear: any, selectedYr: string): boolean => {
  if (!selectedYr || selectedYr === 'All') return true;
  if (!itemYear) return false;
  const nItem = normalizeYear(itemYear);
  const nSel = normalizeYear(selectedYr);
  return nItem === nSel || String(itemYear).trim().toLowerCase() === String(selectedYr).trim().toLowerCase();
};

const mapYearToEnumName = (rawYear: string) => {
  if (!rawYear || rawYear === "All") return undefined;
  const clean = rawYear.trim().toUpperCase();
  if (clean.includes('FIRST') || clean === '1' || clean === 'I' || clean.includes('1ST')) {
    return 'FIRST_YEAR';
  }
  if (clean.includes('SECOND') || clean === '2' || clean === 'II' || clean.includes('2ND')) {
    return 'SECOND_YEAR';
  }
  if (clean.includes('THIRD') || clean === '3' || clean === 'III' || clean.includes('3RD')) {
    return 'THIRD_YEAR';
  }
  if (clean.includes('FOURTH') || clean === '4' || clean === 'IV' || clean.includes('4TH')) {
    return 'FOURTH_YEAR';
  }
  return undefined;
};

interface TeacherGroupManagementTabProps {
  onPushView?: (name: string, props?: Record<string, any>) => void;
}

export default function TeacherGroupManagementTab({ onPushView }: TeacherGroupManagementTabProps = {}) {
  const { user, subRoles } = useAuth();
  const isSuperAdmin = user?.roles?.some((r: any) => {
    const name = typeof r === 'string' ? r : (r?.name || '');
    return name === 'ROLE_SUPER_ADMIN' || name === 'ROLE_SUPERADMIN' || name === 'SUPER_ADMIN';
  }) || user?.isSuperAdmin || false;

  const isAdmin = user?.roles?.some((r: any) => {
    const name = typeof r === 'string' ? r : (r?.name || '');
    return name === 'ROLE_ADMIN' || name === 'ADMIN';
  }) || false;

  const isCC = subRoles?.some((r: any) => {
    const clean = String(r).toUpperCase().trim();
    return clean === 'CC' || clean === 'CLASS_COORDINATOR' || clean === 'ROLE_CC' || clean === 'ROLE_CLASS_COORDINATOR';
  }) || false;

  const isHOD = subRoles?.some((r: any) => {
    const clean = String(r).toUpperCase().trim();
    return clean === 'HOD' || clean === 'ROLE_HOD';
  }) || false;

  const [isLoading, setIsLoading] = useState(true);
  const [groups, setGroups] = useState<GroupData[]>([]);

  const [depts, setDepts] = useState<string[]>(["All"]);
  const [years, setYears] = useState<string[]>(["All"]);
  const [sections, setSections] = useState<string[]>(["All"]);
  const [stages, setStages] = useState<string[]>(["All"]);

  const [deptList, setDeptList] = useState<any[]>([]);
  const [, setYearList] = useState<any[]>([]);
  const [sectionList, setSectionList] = useState<any[]>([]);

  const [selectedDept, setSelectedDept] = useState("All");
  const [selectedYear, setSelectedYear] = useState("All");
  const [selectedSection, setSelectedSection] = useState("All");
  const [selectedStage, setSelectedStage] = useState("All");

  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null);

  // Selected Team for Details Modal
  const [selectedTeamDetails, setSelectedTeamDetails] = useState<GroupData | null>(null);

  // Action Modals
  const [activeLimitTeam, setActiveLimitTeam] = useState<{ id: number; size: number } | null>(null);
  const [newLimitInput, setNewLimitInput] = useState('');

  const [activeAddTeamId, setActiveAddTeamId] = useState<number | null>(null);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [selectedMemberToAssign, setSelectedMemberToAssign] = useState<any>(null);

  const [activeChangeCaptainTeam, setActiveChangeCaptainTeam] = useState<GroupData | null>(null);
  const [selectedNewCaptainRegNo, setSelectedNewCaptainRegNo] = useState('');

  const [activeChangeViceCaptainTeam, setActiveChangeViceCaptainTeam] = useState<GroupData | null>(null);
  const [selectedNewViceCaptainRegNo, setSelectedNewViceCaptainRegNo] = useState('');

  const [activeDeleteTeam, setActiveDeleteTeam] = useState<GroupData | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // CC/HOD scope must be resolved (via fetchLookups) before the first team
  // fetch fires, otherwise a restricted user briefly sees unscoped data.
  const [scopeReady, setScopeReady] = useState(
    () => !((isCC || isHOD) && !isAdmin && !isSuperAdmin)
  );

  const fetchLookups = async () => {
    try {
      const [deptRes, yearRes, secRes] = await Promise.all([
        apiClient.get('/api/v1/admin/departments').catch(() => null),
        apiClient.get('/api/v1/admin/years').catch(() => null),
        apiClient.get('/api/v1/admin/sections').catch(() => null)
      ]);

      let dNames = ["All"];
      let yrNames = ["All"];
      let secNames = ["All"];

      if (deptRes?.data?.success && Array.isArray(deptRes.data.data)) {
        setDeptList(deptRes.data.data);
        const names = deptRes.data.data.map((d: any) => d.name || d.deptName).filter(Boolean);
        dNames = ["All", ...names];
        setDepts(dNames);
      }
      if (yearRes?.data?.success && Array.isArray(yearRes.data.data) && yearRes.data.data.length > 0) {
        setYearList(yearRes.data.data);
        const names = yearRes.data.data.map((y: any) => {
          const raw = String(y.name || y.yearName || y.yearNo || y.academicYear || '').trim();
          const norm = normalizeYear(raw);
          if (norm === '1') return 'First Year';
          if (norm === '2') return 'Second Year';
          if (norm === '3') return 'Third Year';
          if (norm === '4') return 'Fourth Year';
          return raw;
        }).filter(Boolean);
        const uniqueYears = Array.from(new Set(names)) as string[];
        yrNames = ["All", ...(uniqueYears.length > 0 ? uniqueYears : ["First Year", "Second Year", "Third Year", "Fourth Year"])];
        setYears(yrNames);
      } else {
        setYears(["All", "First Year", "Second Year", "Third Year", "Fourth Year"]);
      }
      if (secRes?.data?.success && Array.isArray(secRes.data.data)) {
        setSectionList(secRes.data.data);
        const names = secRes.data.data.map((s: any) => s.sectionName || s.name).filter(Boolean);
        const uniqueSections = Array.from(new Set(names)) as string[];
        secNames = ["All", ...uniqueSections];
        setSections(secNames);
      }

      // Auto-set filters for Class Coordinator (CC) or HOD matching Flutter
      if (isCC && !isAdmin && !isSuperAdmin) {
        try {
          const ccRes = await apiClient.get('/api/v1/cc/class-details').catch(() => null);
          const ccData = ccRes?.data?.data || user?.ccDetails;
          if (ccData) {
            const rawYr = String(ccData.year || ccData.academicYear || ccData.yearName || '').toUpperCase();
            let matchedYr = 'First Year';
            if (rawYr.includes('2') || rawYr.includes('SECOND')) matchedYr = 'Second Year';
            else if (rawYr.includes('3') || rawYr.includes('THIRD')) matchedYr = 'Third Year';
            else if (rawYr.includes('4') || rawYr.includes('FOURTH')) matchedYr = 'Fourth Year';
            else matchedYr = 'First Year';

            const deptName = ccData.departmentName || ccData.department?.name || ccData.department || 'Cyber Security';
            const secName = ccData.sectionName || ccData.section?.sectionName || ccData.section || 'A';

            setSelectedYear(matchedYr);
            setSelectedDept(deptName);
            setSelectedSection(secName);

            // Strictly lock the options to the CC's assigned class
            setYears([matchedYr]);
            setDepts([deptName]);
            setSections([secName]);
          }
        } catch (ccErr) {
          logger.warn("Could not set CC default filter:", ccErr);
        }
      } else if (isHOD && !isAdmin && !isSuperAdmin) {
        const hodDeptName = user?.departmentName || (typeof user?.department === 'object' && user?.department ? (user.department as any).name : user?.department);
        if (hodDeptName) {
          const matchedDept = dNames.find(d => d.toLowerCase().trim() === String(hodDeptName).toLowerCase().trim() || d.toLowerCase().includes(String(hodDeptName).toLowerCase())) || hodDeptName;
          setSelectedDept(matchedDept);
          setDepts([matchedDept]);
        }
      }

      setScopeReady(true);
    } catch (e) {
      logger.warn("Could not fetch lookup data:", e);
      setScopeReady(true);
    }
  };

  const handleYearChange = (newYear: string) => {
    setSelectedYear(newYear);
    if (selectedStage !== "All") {
      setSelectedStage("All");
    }
  };

  const handleDeptChange = (newDeptName: string) => {
    setSelectedDept(newDeptName);
    if (newDeptName === "All") {
      const names = sectionList.map((s: any) => s.sectionName || s.name).filter(Boolean);
      const uniqueSecs = Array.from(new Set(names)) as string[];
      setSections(["All", ...uniqueSecs]);
    } else {
      const deptObj = deptList.find((d: any) => (d.name || d.deptName) === newDeptName);
      if (deptObj) {
        const deptSecs = (deptObj.sections || []).map((s: any) => s.sectionName || s.name).filter(Boolean);
        const uniqueSecs = Array.from(new Set(deptSecs)) as string[];
        setSections(["All", ...uniqueSecs]);
        if (selectedSection !== "All" && !uniqueSecs.includes(selectedSection)) {
          setSelectedSection("All");
        }
      }
    }
  };

  const fetchStagesLookup = async (rawYear: string) => {
    try {
      const params: any = {};
      const mappedYear = mapYearToEnumName(rawYear);
      if (mappedYear) {
        params.academicYear = mappedYear;
      }
      const response = await apiClient.get('/api/v1/admin/stages', { params }).catch(() => null);
      if (response?.data?.success && Array.isArray(response.data.data)) {
        const names = response.data.data.map((s: any) => {
          if (s.name) return s.name;
          const order = s.stageOrder || s.id || 1;
          return `Stage ${order}`;
        }).filter(Boolean);
        const uniqueStages = (Array.from(new Set(names)) as string[]).sort((a: string, b: string) => {
          const numA = parseInt(a.replace(/\D/g, '')) || 0;
          const numB = parseInt(b.replace(/\D/g, '')) || 0;
          return numA - numB;
        });
        setStages(["All", ...uniqueStages]);
      } else {
        setStages(["All", "Stage 1", "Stage 2", "Stage 3", "Stage 4"]);
      }
    } catch (e) {
      logger.warn("Could not fetch stages lookup data:", e);
      setStages(["All", "Stage 1", "Stage 2", "Stage 3", "Stage 4"]);
    }
  };

  useEffect(() => {
    fetchLookups();
  }, []);

  useEffect(() => {
    if (!scopeReady) return;
    fetchStagesLookup(selectedYear);
    fetchGroups();
  }, [selectedYear, selectedDept, selectedSection, scopeReady]);

  // Live debounced search effect with auto-fetch on modal open & fallback APIs
  useEffect(() => {
    if (!activeAddTeamId) {
      setMemberSearchResults([]);
      setIsSearchingMembers(false);
      return;
    }

    const controller = new AbortController();

    const fetchStudentsForModal = async () => {
      setIsSearchingMembers(true);
      const query = memberSearchQuery.trim();
      try {
        let response;
        if (query) {
          response = await apiClient.get(`/api/v1/students/team-member-search?keyword=${encodeURIComponent(query)}`, {
            signal: controller.signal,
          });
        } else {
          // Modal opened: fetch initial active student list
          response = await apiClient.get('/api/v1/students/team-member-search?keyword=a', {
            signal: controller.signal,
          }).catch(() => null);
          if (!response || !response.data?.data || response.data.data.length === 0) {
            response = await apiClient.get('/api/v1/students?page=0&size=50', {
              signal: controller.signal,
            }).catch(() => null);
          }
        }

        let list: any[] = [];
        if (Array.isArray(response?.data?.data)) {
          list = response.data.data;
        } else if (Array.isArray(response?.data?.data?.content)) {
          list = response.data.data.content;
        } else if (Array.isArray(response?.data?.content)) {
          list = response.data.content;
        } else if (Array.isArray(response?.data)) {
          list = response.data;
        }

        // Fallback search if primary query returned empty
        if (list.length === 0 && query && !controller.signal.aborted) {
          const fallbackRes = await apiClient.get(`/api/v1/students/search?keyword=${encodeURIComponent(query)}`, {
            signal: controller.signal,
          }).catch(() => null);
          if (Array.isArray(fallbackRes?.data?.data?.content)) {
            list = fallbackRes.data.data.content;
          } else if (Array.isArray(fallbackRes?.data?.data)) {
            list = fallbackRes.data.data;
          } else if (Array.isArray(fallbackRes?.data?.content)) {
            list = fallbackRes.data.content;
          }
        }

        if (!controller.signal.aborted) {
          setMemberSearchResults(list);
        }
      } catch (e: any) {
        if (e?.name === 'CanceledError' || e?.code === 'ERR_CANCELED') return;
        logger.error("Error searching students for team member assignment:", e);
        setMemberSearchResults([]);
      } finally {
        if (!controller.signal.aborted) {
          setIsSearchingMembers(false);
        }
      }
    };

    const timer = setTimeout(fetchStudentsForModal, memberSearchQuery.trim() ? 300 : 0);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [memberSearchQuery, activeAddTeamId]);

  const fetchGroups = async () => {
    setIsLoading(true);
    try {
      const params: any = {};
      const mappedYear = mapYearToEnumName(selectedYear);
      if (mappedYear) {
        params.academicYear = mappedYear;
      }
      const selectedDeptObj = deptList.find(d => (d.name || d.deptName) === selectedDept);
      if (selectedDeptObj) {
        params.departmentId = selectedDeptObj.id;
      }
      const selectedSectionObj = sectionList.find(s => (s.sectionName || s.name) === selectedSection);
      if (selectedSectionObj) {
        params.sectionId = selectedSectionObj.id;
      }

      const response = await apiClient.get('/api/v1/teams', { params });
      const rawData = response.data?.data || response.data || [];
      const data = Array.isArray(rawData) ? rawData : (rawData.teamId || rawData.id ? [rawData] : []);

      setGroups(data);

      const deptSet = new Set<string>();
      const yearSet = new Set<string>();
      const sectionSet = new Set<string>();
      const stageSet = new Set<string>();

      data.forEach((g: any) => {
        const dept = g.departmentName || (typeof g.department === 'string' ? g.department : g.department?.name);
        const year = g.yearName || g.year || g.academicYearName;
        const sec = g.sectionName || (typeof g.section === 'string' ? g.section : g.section?.sectionName);

        if (dept) deptSet.add(dept);
        if (year) yearSet.add(year.toString());
        if (sec) sectionSet.add(sec);

        const members = g.teamMembers || g.members || g.students || [];
        const level = getTeamLevel(g);
        stageSet.add(level.toString());

        members.forEach((m: any) => {
          const mDept = m.departmentName || (typeof m.department === 'string' ? m.department : m.department?.name);
          const mYear = m.yearName || m.year || m.academicYear;
          const mSec = m.sectionName || (typeof m.section === 'string' ? m.section : m.section?.sectionName);

          if (mDept) deptSet.add(mDept);
          if (mYear) yearSet.add(mYear.toString());
          if (mSec) sectionSet.add(mSec);
        });
      });

      setDepts(prev => prev.length <= 1 ? ["All", ...Array.from(deptSet).sort()] : prev);
      setYears(prev => prev.length <= 1 ? ["All", ...Array.from(yearSet).sort()] : prev);
      setSections(prev => prev.length <= 1 ? ["All", ...Array.from(sectionSet).sort()] : prev);
      setStages(["All", ...Array.from(stageSet).sort((a, b) => parseInt(a) - parseInt(b)).map(lvl => `Stage ${lvl}`)]);
      return data;
    } catch (e: any) {
      logger.error("Error fetching teams", e);
      setGroups([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredGroups = () => {
    return groups.filter(g => {
      const dept = g.departmentName || (typeof g.department === 'string' ? g.department : g.department?.name);
      const year = g.yearName || g.year || g.academicYearName;
      const sec = g.sectionName || (typeof g.section === 'string' ? g.section : g.section?.sectionName);
      const members = g.teamMembers || g.members || g.students || [];

      if (selectedDept !== "All") {
        const matchDept = dept === selectedDept || members.some((m: any) =>
          (m.departmentName || (typeof m.department === 'string' ? m.department : m.department?.name)) === selectedDept
        );
        if (!matchDept) return false;
      }

      if (selectedYear !== "All") {
        const matchYear = isMatchingYear(year, selectedYear) || members.some((m: any) =>
          isMatchingYear(m.yearName || m.year || m.academicYear, selectedYear)
        );
        if (!matchYear) return false;
      }

      if (selectedSection !== "All") {
        const matchSec = sec === selectedSection || members.some((m: any) =>
          (m.sectionName || (typeof m.section === 'string' ? m.section : m.section?.sectionName)) === selectedSection
        );
        if (!matchSec) return false;
      }

      if (selectedStage !== "All") {
        const level = getTeamLevel(g);
        const targetNum = parseInt(selectedStage.replace(/\D/g, ''), 10);
        if (!isNaN(targetNum)) {
          if (Number(level) !== targetNum) return false;
        } else {
          const normSelected = selectedStage.toLowerCase().trim();
          const normLevel = `stage ${level}`.toLowerCase();
          if (normLevel !== normSelected && String(level) !== normSelected) return false;
        }
      }

      return true;
    });
  };

  const openLimitModal = (teamId: number, currentSize: number) => {
    setActiveLimitTeam({ id: teamId, size: currentSize });
    setNewLimitInput(currentSize.toString());
  };

  const handleSaveLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLimitTeam) return;
    const newSize = parseInt(newLimitInput, 10);
    if (isNaN(newSize) || newSize <= 0) {
      toast.error("Please enter a valid positive number");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Updating group limit...");
    try {
      let response;
      try {
        response = await apiClient.put(`/api/v1/teams/${activeLimitTeam.id}/limit?size=${newSize}`);
      } catch {
        const teamName = (activeLimitTeam as any).name || "Team";
        response = await apiClient.put(`/api/v1/teams/${activeLimitTeam.id}`, { name: teamName, size: newSize });
      }
      toast.dismiss(toastId);
      if (response.data.success || response.status === 200) {
        toast.success("Group limit updated successfully!");
        setActiveLimitTeam(null);
        const updatedGroups = await fetchGroups();
        if (selectedTeamDetails && (selectedTeamDetails.teamId === activeLimitTeam.id || selectedTeamDetails.id === activeLimitTeam.id)) {
          const fresh = updatedGroups.find((g: any) => (g.teamId || g.id) === activeLimitTeam.id);
          if (fresh) setSelectedTeamDetails(fresh);
        }
      } else {
        toast.error(response.data.message || "Failed to update group limit");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddMemberModal = (teamId: number) => {
    setActiveAddTeamId(teamId);
    setStudentIdInput('');
    setMemberSearchQuery('');
    setMemberSearchResults([]);
    setSelectedMemberToAssign(null);
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    const regNoToAdd = selectedMemberToAssign
      ? (selectedMemberToAssign.regNo || selectedMemberToAssign.registerNumber || selectedMemberToAssign.reg_no)
      : studentIdInput.trim();

    if (!activeAddTeamId || !regNoToAdd) {
      toast.error("Please search and select a student or enter a Register No.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Adding member to group...");
    try {
      let response;
      try {
        response = await apiClient.post(`/api/v1/teams/${activeAddTeamId}/members?regNo=${encodeURIComponent(regNoToAdd)}`);
      } catch {
        try {
          response = await apiClient.post(`/api/v1/teams/${activeAddTeamId}/members`, [regNoToAdd]);
        } catch {
          response = await apiClient.post(`/api/v1/teams/${activeAddTeamId}/add-member?regNo=${encodeURIComponent(regNoToAdd)}`);
        }
      }
      toast.dismiss(toastId);
      if (response.data.success || response.status === 200) {
        toast.success("Member added successfully!");
        setActiveAddTeamId(null);
        setStudentIdInput('');
        setMemberSearchQuery('');
        setMemberSearchResults([]);
        setSelectedMemberToAssign(null);
        const updatedGroups = await fetchGroups();
        if (selectedTeamDetails && (selectedTeamDetails.teamId === activeAddTeamId || selectedTeamDetails.id === activeAddTeamId)) {
          const fresh = updatedGroups.find((g: any) => (g.teamId || g.id) === activeAddTeamId);
          if (fresh) setSelectedTeamDetails(fresh);
        }
      } else {
        toast.error(response.data.message || "Failed to add member");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeMember = async (teamId: number, studentRegNoOrId: string, name: string) => {
    const toastId = toast.loading(`Removing ${name}...`);
    try {
      let response;
      try {
        response = await apiClient.delete(`/api/v1/teams/${teamId}/members/${encodeURIComponent(studentRegNoOrId)}`);
      } catch {
        response = await apiClient.post(`/api/v1/teams/${teamId}/remove-member?regNo=${encodeURIComponent(studentRegNoOrId)}`);
      }
      toast.dismiss(toastId);
      if (response.data.success || response.status === 200) {
        toast.success(`Removed ${name} from group`);
        const updatedGroups = await fetchGroups();
        if (selectedTeamDetails && (selectedTeamDetails.teamId === teamId || selectedTeamDetails.id === teamId)) {
          const fresh = updatedGroups.find((g: any) => (g.teamId || g.id) === teamId);
          if (fresh) setSelectedTeamDetails(fresh);
        }
      } else {
        toast.error(response.data.message || "Failed to remove member");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || e.message);
    }
  };

  const openChangeCaptainModal = (team: GroupData) => {
    setActiveChangeCaptainTeam(team);
    const members = team.teamMembers || team.members || team.students || [];
    if (members.length > 0) {
      const firstNonCaptain = members.find(m => (m.regNo || m.studentId) !== (team.captainRegNo || team.captainId)) || members[0];
      setSelectedNewCaptainRegNo((firstNonCaptain.regNo || firstNonCaptain.studentId || '').toString());
    } else {
      setSelectedNewCaptainRegNo('');
    }
  };

  const handleChangeCaptain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChangeCaptainTeam || !selectedNewCaptainRegNo) return;

    const tId = activeChangeCaptainTeam.teamId || activeChangeCaptainTeam.id;
    setIsSubmitting(true);
    const toastId = toast.loading("Updating team captain...");
    try {
      let response;
      try {
        response = await apiClient.put(`/api/v1/teams/${tId}/captain?regNo=${encodeURIComponent(selectedNewCaptainRegNo)}`);
      } catch {
        response = await apiClient.post(`/api/v1/teams/${tId}/captain?regNo=${encodeURIComponent(selectedNewCaptainRegNo)}`);
      }
      toast.dismiss(toastId);
      if (response.data.success || response.status === 200) {
        toast.success("Team Captain changed successfully!");
        setActiveChangeCaptainTeam(null);
        const updatedGroups = await fetchGroups();
        if (selectedTeamDetails && (selectedTeamDetails.teamId === tId || selectedTeamDetails.id === tId)) {
          const fresh = updatedGroups.find((g: any) => (g.teamId || g.id) === tId);
          if (fresh) setSelectedTeamDetails(fresh);
        }
      } else {
        toast.error(response.data.message || "Failed to change captain");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openChangeViceCaptainModal = (team: GroupData) => {
    setActiveChangeViceCaptainTeam(team);
    const members = team.teamMembers || team.members || team.students || [];
    if (members.length > 0) {
      const captainReg = (team.captainRegNo || team.captainId || '').toString();
      const firstNonCaptain = members.find(m => (m.regNo || m.studentId || '').toString() !== captainReg) || members[0];
      setSelectedNewViceCaptainRegNo((firstNonCaptain.regNo || firstNonCaptain.studentId || '').toString());
    } else {
      setSelectedNewViceCaptainRegNo('');
    }
  };

  const handleChangeViceCaptain = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChangeViceCaptainTeam || !selectedNewViceCaptainRegNo) return;

    const tId = activeChangeViceCaptainTeam.teamId || activeChangeViceCaptainTeam.id;
    setIsSubmitting(true);
    const toastId = toast.loading("Updating team vice captain...");
    try {
      let response;
      try {
        response = await apiClient.put(`/api/v1/teams/${tId}/vice-captain?regNo=${encodeURIComponent(selectedNewViceCaptainRegNo)}`);
      } catch {
        response = await apiClient.post(`/api/v1/teams/${tId}/vice-captain?regNo=${encodeURIComponent(selectedNewViceCaptainRegNo)}`);
      }
      toast.dismiss(toastId);
      if (response.data.success || response.status === 200) {
        toast.success("Team Vice Captain updated successfully!");
        setActiveChangeViceCaptainTeam(null);
        const updatedGroups = await fetchGroups();
        if (selectedTeamDetails && (selectedTeamDetails.teamId === tId || selectedTeamDetails.id === tId)) {
          const fresh = updatedGroups.find((g: any) => (g.teamId || g.id) === tId);
          if (fresh) setSelectedTeamDetails(fresh);
        }
      } else {
        toast.error(response.data.message || "Failed to change vice captain");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openDeleteTeamModal = (team: GroupData) => {
    setActiveDeleteTeam(team);
  };

  const handleDeleteTeam = async () => {
    if (!activeDeleteTeam) return;
    const tId = activeDeleteTeam.teamId || activeDeleteTeam.id;

    setIsSubmitting(true);
    const toastId = toast.loading("Deleting group...");
    try {
      const response = await apiClient.delete(`/api/v1/teams/${tId}`);
      toast.dismiss(toastId);
      if (response.data.success || response.status === 200) {
        toast.success("Group deleted successfully!");
        setActiveDeleteTeam(null);
        setSelectedTeamDetails(null);
        fetchGroups();
      } else {
        toast.error(response.data.message || "Failed to delete group");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openTeamDetails = async (g: GroupData) => {
    setSelectedTeamDetails(g);
    const tId = g.teamId || g.id;
    if (tId) {
      try {
        const response = await apiClient.get(`/api/v1/teams/${tId}`);
        const fresh = response.data?.data || response.data;
        if (fresh && (fresh.teamId || fresh.id)) {
          setSelectedTeamDetails(fresh);
        }
      } catch (e) {
        logger.warn("Could not fetch detailed team view:", e);
      }
    }
  };

  const filteredGroups = getFilteredGroups();

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      <div className="bg-indigo-600 text-white px-6 py-4 sticky top-0 z-20 shadow-md flex justify-between items-center">
        <h1 className="text-xl font-bold">View Groups</h1>
        <div className="flex items-center space-x-2">
          {(isAdmin || isSuperAdmin) && onPushView && (
            <button
              onClick={() => onPushView('captain_reward_year_selection')}
              className="p-2 hover:bg-white/10 rounded-full text-amber-300 transition-colors"
              title="Captain Rewards Settings"
            >
              <Award className="w-5 h-5 fill-amber-300" />
            </button>
          )}
          <button
            onClick={fetchGroups}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="bg-indigo-50 p-3 flex gap-2 border-b border-indigo-100 z-10 sticky top-[60px]">
        <select
          className={`flex-1 bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-indigo-500 ${isCC && !isAdmin && !isSuperAdmin ? 'bg-slate-100 cursor-not-allowed opacity-90 text-slate-700 font-semibold' : ''}`}
          value={selectedYear}
          disabled={isCC && !isAdmin && !isSuperAdmin}
          onChange={e => handleYearChange(e.target.value)}
        >
          <option disabled>Year</option>
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select
          className={`flex-1 bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-indigo-500 ${(isCC || isHOD) && !isAdmin && !isSuperAdmin ? 'bg-slate-100 cursor-not-allowed opacity-90 text-slate-700 font-semibold' : ''}`}
          value={selectedDept}
          disabled={(isCC || isHOD) && !isAdmin && !isSuperAdmin}
          onChange={e => handleDeptChange(e.target.value)}
        >
          <option disabled>Dept</option>
          {depts.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
        <select
          className={`flex-1 bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-indigo-500 ${isCC && !isAdmin && !isSuperAdmin ? 'bg-slate-100 cursor-not-allowed opacity-90 text-slate-700 font-semibold' : ''}`}
          value={selectedSection}
          disabled={isCC && !isAdmin && !isSuperAdmin}
          onChange={e => setSelectedSection(e.target.value)}
        >
          <option disabled>Section</option>
          {sections.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:border-indigo-500 font-semibold text-indigo-700"
          value={selectedStage}
          onChange={e => setSelectedStage(e.target.value)}
        >
          <option disabled>Stage</option>
          {stages.map(st => <option key={st} value={st}>{st}</option>)}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400">
            <UsersRound className="w-16 h-16 mb-4 opacity-30" />
            <p className="text-sm font-medium">No groups found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredGroups.map(g => {
              const tId = g.teamId || g.id || 0;
              const isExpanded = expandedGroupId === tId;
              const captainName = g.captainName || g.captain?.fullName || g.captain?.username || "No Captain";
              const viceCaptainName = g.viceCaptainName || g.viceCaptain?.fullName || g.viceCaptain?.username || "—";
              const members = g.teamMembers || g.members || g.students || [];
              const memberCount = members.length;
              const size = g.teamCapacity || g.size || g.maxTeamSize || 10;
              const groupName = g.teamName || g.name || g.groupName || `Group #${tId}`;
              const level = getTeamLevel(g);

              return (
                <div key={tId} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">
                  <div className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div
                      className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer"
                      onClick={() => setExpandedGroupId(isExpanded ? null : tId)}
                    >
                      <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0 border border-indigo-100">
                        <UsersRound className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[15px] text-slate-800 truncate">{groupName}</h3>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                            Stage {level}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                          Captain: {captainName} {viceCaptainName !== '—' && viceCaptainName !== 'Unassigned' ? `• Vice: ${viceCaptainName}` : ''} • {memberCount}/{size} members
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => openTeamDetails(g)}
                        className="flex items-center gap-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        title="View Full Team Details"
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </button>
                      <button
                        onClick={() => setExpandedGroupId(isExpanded ? null : tId)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50">
                      {/* Management Action Bar inside Accordion */}
                      <div className="p-3 flex flex-wrap justify-end gap-2 border-b border-slate-100 bg-white">
                        <button
                          onClick={() => openLimitModal(tId, size)}
                          className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Limit
                        </button>
                        <button
                          onClick={() => openAddMemberModal(tId)}
                          className="flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Add Member
                        </button>
                        <button
                          onClick={() => openChangeCaptainModal(g)}
                          className="flex items-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Crown className="w-3.5 h-3.5" /> Change Captain
                        </button>
                        {g.canDelete && (
                          <button
                            onClick={() => openDeleteTeamModal(g)}
                            className="flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Delete Team
                          </button>
                        )}
                      </div>

                      {/* Team Details Summary Bar */}
                      <div className="p-3 bg-indigo-50/40 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
                        <div><span className="font-semibold text-slate-500">Dept:</span> {g.departmentName || (typeof g.department === 'string' ? g.department : g.department?.name) || '—'}</div>
                        <div><span className="font-semibold text-slate-500">Acad Year:</span> {g.academicYearName || g.academicYear || '2024-2025'}</div>
                        <div><span className="font-semibold text-slate-500">Year / Sec:</span> {g.yearName || g.year || '1'} - {g.sectionName || (typeof g.section === 'string' ? g.section : g.section?.sectionName) || 'A'}</div>
                        <div><span className="font-semibold text-slate-500">Vice Capt:</span> {viceCaptainName}</div>
                      </div>

                      <div className="flex flex-col">
                        {members.map((m: any, i: number) => {
                          const mRegNo = m.regNo || m.studentId || '';
                          const isCaptain = mRegNo === (g.captainRegNo || g.captainId) || m.isCaptain;
                          const isViceCaptain = mRegNo === (g.viceCaptainRegNo || g.viceCaptainId) || m.isViceCaptain;

                          return (
                            <div key={i} className="flex items-center justify-between p-3 border-b border-slate-100 last:border-0 hover:bg-slate-50">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isCaptain ? 'bg-amber-500 text-white shadow-sm' : isViceCaptain ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                  {isCaptain ? <Crown className="w-4 h-4" /> : isViceCaptain ? <Shield className="w-4 h-4" /> : <div className="font-bold text-xs">{(m.fullName || m.name || "S")?.charAt(0)}</div>}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-sm text-slate-800 truncate">{m.fullName || m.name || "Student"}</div>
                                  <div className="text-[11px] text-slate-500 truncate">
                                    {mRegNo} {m.department ? `• ${m.department}` : ''}
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-2">
                                {isCaptain && (
                                  <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                    <Crown className="w-3 h-3" /> Captain
                                  </span>
                                )}
                                {isViceCaptain && !isCaptain && (
                                  <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
                                    <Shield className="w-3 h-3" /> Vice Captain
                                  </span>
                                )}
                                {!isCaptain && (
                                  <button
                                    onClick={() => removeMember(tId, mRegNo.toString(), m.fullName || m.name || "Student")}
                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Remove Member"
                                  >
                                    <UserMinus className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FULL TEAM DETAILS MODAL (Matching Flutter's Team Details Screen 1:1) */}
      {selectedTeamDetails && (() => {
        const g = selectedTeamDetails;
        const tId = g.teamId || g.id || 0;
        const members = g.teamMembers || g.members || g.students || [];

        const captainRegNo = (g.captainId || g.captainRegNo || g.captain?.regNo || g.captain?.id || '').toString().toLowerCase().trim();
        const viceCaptainRegNo = (g.viceCaptainId || g.viceCaptainRegNo || g.viceCaptain?.regNo || g.viceCaptain?.id || '').toString().toLowerCase().trim();

        const captainMember = members.find((m: any) => {
          const mReg = (m.regNo || m.studentId || m.id || '').toString().toLowerCase().trim();
          return (mReg && mReg === captainRegNo) || m.isCaptain || m.teamRole === 'CAPTAIN';
        });
        const viceCaptainMember = members.find((m: any) => {
          const mReg = (m.regNo || m.studentId || m.id || '').toString().toLowerCase().trim();
          return (mReg && mReg === viceCaptainRegNo) || m.isViceCaptain || m.teamRole === 'VICE_CAPTAIN';
        });

        const captainName = g.captainName || captainMember?.fullName || captainMember?.name || g.captain?.fullName || g.captain?.name || "Unassigned";
        const viceCaptainName = g.viceCaptainName || viceCaptainMember?.fullName || viceCaptainMember?.name || g.viceCaptain?.fullName || g.viceCaptain?.name || "Unassigned";
        const size = g.teamCapacity || g.size || g.maxTeamSize || 10;
        const groupName = g.teamName || g.name || g.groupName || `Group #${tId}`;
        const dept = g.departmentName || (typeof g.department === 'string' ? g.department : g.department?.name) || 'Cyber Security';
        const acadYear = g.academicYearName || g.academicYear || '2024-2025';
        const year = g.yearName || g.year || '1';
        const sec = g.sectionName || (typeof g.section === 'string' ? g.section : g.section?.sectionName) || 'A';
        const level = getTeamLevel(g);

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl my-auto flex flex-col max-h-[90vh]">
              {/* Modal Top Header Bar */}
              <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <UsersRound className="w-6 h-6" />
                  <h2 className="text-lg font-bold">Team Details</h2>
                </div>
                <button
                  onClick={() => setSelectedTeamDetails(null)}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-6">
                {/* Team Card Banner */}
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-2xl font-black text-indigo-950">{groupName}</h1>
                    </div>
                    <span className="bg-amber-400 text-amber-950 text-xs font-black px-3 py-1 rounded-full shadow-sm">
                      Stage {level}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-indigo-100 text-sm">
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Captain</p>
                      <p className="font-bold text-slate-800 truncate">{captainName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Vice Captain</p>
                      <p className="font-bold text-slate-800 truncate">{viceCaptainName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-medium">Members</p>
                      <p className="font-bold text-indigo-700">{members.length} / {size}</p>
                    </div>
                  </div>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-400 font-medium">Department</p>
                    <p className="font-bold text-slate-800 mt-0.5">{dept}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-400 font-medium">Academic Year</p>
                    <p className="font-bold text-slate-800 mt-0.5">{acadYear}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-400 font-medium">Year</p>
                    <p className="font-bold text-slate-800 mt-0.5">Year {year}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-400 font-medium">Section</p>
                    <p className="font-bold text-slate-800 mt-0.5">Section {sec}</p>
                  </div>
                </div>

                {/* Management Actions Grid */}
                <div>
                  <h3 className="text-sm font-bold text-slate-700 mb-3">Management Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => openAddMemberModal(tId)}
                      className="flex items-center justify-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 p-3 rounded-xl text-xs font-bold transition-colors border border-green-200"
                    >
                      <UserPlus className="w-4 h-4" /> Add Member
                    </button>
                    <button
                      onClick={() => openLimitModal(tId, size)}
                      className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 p-3 rounded-xl text-xs font-bold transition-colors border border-indigo-200"
                    >
                      <Edit2 className="w-4 h-4" /> Edit Limit
                    </button>
                    <button
                      onClick={() => openChangeCaptainModal(g)}
                      className="flex items-center justify-center gap-2 bg-amber-50 text-amber-800 hover:bg-amber-100 p-3 rounded-xl text-xs font-bold transition-colors border border-amber-200"
                    >
                      <Crown className="w-4 h-4" /> Change Captain
                    </button>
                    <button
                      onClick={() => openChangeViceCaptainModal(g)}
                      className="flex items-center justify-center gap-2 bg-indigo-50 text-indigo-800 hover:bg-indigo-100 p-3 rounded-xl text-xs font-bold transition-colors border border-indigo-200"
                    >
                      <Shield className="w-4 h-4" /> Change Vice Capt
                    </button>
                    {g.canDelete && (
                      <button
                        onClick={() => openDeleteTeamModal(g)}
                        className="flex items-center justify-center gap-2 bg-red-50 text-red-700 hover:bg-red-100 p-3 rounded-xl text-xs font-bold transition-colors border border-red-200"
                      >
                        <Trash2 className="w-4 h-4" /> Delete Team
                      </button>
                    )}
                  </div>
                </div>

                {/* Team Members List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-700">Team Members ({members.length}/{size})</h3>
                  </div>

                  <div className="space-y-2">
                    {[...members]
                      .sort((a: any, b: any) => {
                        const aReg = (a.regNo || a.studentId || a.id || '').toString();
                        const bReg = (b.regNo || b.studentId || b.id || '').toString();
                        const captainRegNo = (g.captainRegNo || g.captainId || g.captain?.regNo || g.captain?.id || '').toString();
                        const viceCaptainRegNo = (g.viceCaptainRegNo || g.viceCaptainId || g.viceCaptain?.regNo || g.viceCaptain?.id || '').toString();
                        const viceCaptainName = g.viceCaptainName || g.viceCaptain?.fullName || g.viceCaptain?.name || '';

                        const aIsCaptain = (aReg && aReg === captainRegNo) || a.isCaptain || a.teamRole === 'CAPTAIN';
                        const bIsCaptain = (bReg && bReg === captainRegNo) || b.isCaptain || b.teamRole === 'CAPTAIN';
                        if (aIsCaptain && !bIsCaptain) return -1;
                        if (!aIsCaptain && bIsCaptain) return 1;

                        const aIsVice = (aReg && aReg === viceCaptainRegNo) || a.isViceCaptain || a.teamRole === 'VICE_CAPTAIN' || (viceCaptainName && (a.fullName === viceCaptainName || a.name === viceCaptainName));
                        const bIsVice = (bReg && bReg === viceCaptainRegNo) || b.isViceCaptain || b.teamRole === 'VICE_CAPTAIN' || (viceCaptainName && (b.fullName === viceCaptainName || b.name === viceCaptainName));
                        if (aIsVice && !bIsVice) return -1;
                        if (!aIsVice && bIsVice) return 1;

                        return 0;
                      })
                      .map((m: any, idx: number) => {
                        const mRegNo = (m.regNo || m.studentId || m.id || '').toString();
                        const captainRegNo = (g.captainRegNo || g.captainId || g.captain?.regNo || g.captain?.id || '').toString();
                        const viceCaptainRegNo = (g.viceCaptainRegNo || g.viceCaptainId || g.viceCaptain?.regNo || g.viceCaptain?.id || '').toString();
                        const viceCaptainName = g.viceCaptainName || g.viceCaptain?.fullName || g.viceCaptain?.name || '';

                        const isCaptain = (mRegNo && mRegNo === captainRegNo) || m.isCaptain || m.teamRole === 'CAPTAIN';
                        const isViceCaptain = (mRegNo && mRegNo === viceCaptainRegNo) || m.isViceCaptain || m.teamRole === 'VICE_CAPTAIN' || (viceCaptainName && (m.fullName === viceCaptainName || m.name === viceCaptainName));

                        return (
                          <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isCaptain ? 'bg-amber-500 text-white shadow-md' : isViceCaptain ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-200 text-slate-600'}`}>
                                {isCaptain ? <Crown className="w-5 h-5" /> : isViceCaptain ? <Shield className="w-5 h-5" /> : <div className="font-bold text-sm">{(m.fullName || m.name || "S")?.charAt(0)}</div>}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-sm text-slate-800 truncate">{m.fullName || m.name || "Student"}</p>
                                  {isCaptain && (
                                    <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                      CAPTAIN
                                    </span>
                                  )}
                                  {isViceCaptain && !isCaptain && (
                                    <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                                      <Shield className="w-3 h-3" /> VICE CAPTAIN
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5 truncate">
                                  {mRegNo} • Level {m.stageLevel || level} - Explorer
                                </p>
                              </div>
                            </div>

                            {!isCaptain && (
                              <button
                                onClick={() => removeMember(tId, mRegNo.toString(), m.fullName || m.name || "Student")}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Remove Member"
                              >
                                <UserMinus className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit Group Limit Modal */}
      {activeLimitTeam && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 pb-2">
              <h2 className="text-lg font-bold text-slate-800">Edit Member Limit</h2>
              <p className="text-xs text-slate-500 mt-1">Set maximum capacity limit for this group.</p>
            </div>

            <form onSubmit={handleSaveLimit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Max Member Limit *</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={newLimitInput}
                  onChange={e => setNewLimitInput(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveLimitTeam(null)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70 text-sm"
                >
                  {isSubmitting ? 'Saving...' : 'Update Limit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal matching Flutter StudentSearchDialog 1:1 */}
      {activeAddTeamId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl max-h-[85vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Add Team Member</h2>
                  <p className="text-xs text-slate-500 font-medium">Search students by Name, Reg No, or SPR No</p>
                </div>
              </div>
              <button
                onClick={() => setActiveAddTeamId(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-5 flex-1 flex flex-col overflow-hidden space-y-4">
              {/* Search Box */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={e => {
                    setMemberSearchQuery(e.target.value);
                    setStudentIdInput(e.target.value);
                  }}
                  placeholder="Search by Name, Reg No, or SPR No..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-semibold transition-all"
                  autoFocus
                />
              </div>

              {/* Live Search Results Container */}
              <div className="flex-1 overflow-y-auto min-h-[220px] max-h-[320px] pr-1 space-y-2.5">
                {isSearchingMembers ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                    <span className="text-xs font-semibold">Searching students...</span>
                  </div>
                ) : memberSearchQuery.trim() && memberSearchResults.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                    <UsersRound className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="text-sm font-semibold text-slate-600">No students found</p>
                    <p className="text-xs text-slate-400 mt-1">Try searching by full name or exact register number</p>
                  </div>
                ) : memberSearchResults.length > 0 ? (
                  memberSearchResults.map((s: any) => {
                    const isSelected = selectedMemberToAssign?.id === s.id || (selectedMemberToAssign?.regNo && selectedMemberToAssign.regNo === s.regNo);
                    const isAlreadyInThisTeam = Number(s.teamId) === Number(activeAddTeamId);

                    return (
                      <div
                        key={s.id || s.regNo}
                        onClick={() => {
                          if (isAlreadyInThisTeam) return;
                          setSelectedMemberToAssign(s);
                          setStudentIdInput(s.regNo || s.registerNumber || '');
                        }}
                        className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${isAlreadyInThisTeam
                            ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                            : isSelected
                              ? 'bg-indigo-50/60 border-indigo-600 ring-2 ring-indigo-600/20 shadow-xs'
                              : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/60'
                          }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                            }`}>
                            {s.fullName ? s.fullName.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-800">{s.fullName}</h4>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                              Reg: <span className="font-semibold text-slate-700">{s.regNo || s.registerNumber}</span>
                              {s.sprNo && <> • SPR: <span className="font-semibold text-slate-700">{s.sprNo}</span></>}
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {s.departmentName || s.department || ''} • Year {s.year || 1} • Sec {s.section || 'A'}
                            </p>
                            {s.teamName && (
                              <p className={`text-[11px] font-semibold mt-0.5 ${isAlreadyInThisTeam ? 'text-emerald-600' : 'text-amber-600'}`}>
                                Current Team: {s.teamName}
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          {isAlreadyInThisTeam ? (
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                              <Check className="w-3.5 h-3.5" />
                              <span>Added</span>
                            </span>
                          ) : isSelected ? (
                            <CheckCircle2 className="w-6 h-6 text-indigo-600 fill-indigo-100" />
                          ) : (
                            <span className="text-xs text-indigo-600 font-semibold hover:underline">Select</span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 px-4 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-center">
                    <p className="text-xs font-semibold text-slate-600">Type above to search live student directory</p>
                    <p className="text-[11px] text-slate-400 mt-1">Or enter registration number directly in the search field</p>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveAddTeamId(null)}
                  className="px-4 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (!selectedMemberToAssign && !studentIdInput.trim())}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center space-x-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Adding...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Add Member</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Captain Modal */}
      {activeChangeCaptainTeam && (() => {
        const members = activeChangeCaptainTeam.teamMembers || activeChangeCaptainTeam.members || activeChangeCaptainTeam.students || [];

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 pb-2">
                <h2 className="text-lg font-bold text-slate-800">Change Team Captain</h2>
                <p className="text-xs text-slate-500 mt-1">Select a member to assign as the new Team Captain.</p>
              </div>

              <form onSubmit={handleChangeCaptain} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Select New Captain *</label>
                  {members.length === 0 ? (
                    <p className="text-xs text-slate-400">No members in team to promote.</p>
                  ) : (
                    <select
                      value={selectedNewCaptainRegNo}
                      onChange={e => setSelectedNewCaptainRegNo(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-sm font-semibold bg-white"
                    >
                      {members.map((m: any) => {
                        const mRegNo = (m.regNo || m.studentId || m.registerNumber || m.studentRegNo || m.id || '').toString();
                        return (
                          <option key={mRegNo} value={mRegNo}>
                            {m.fullName || m.name || mRegNo} ({mRegNo})
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveChangeCaptainTeam(null)}
                    className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || members.length === 0}
                    className="px-5 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 transition-colors shadow-sm disabled:opacity-70 text-sm"
                  >
                    {isSubmitting ? 'Updating...' : 'Assign Captain'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Change Vice Captain Modal */}
      {activeChangeViceCaptainTeam && (() => {
        const members = activeChangeViceCaptainTeam.teamMembers || activeChangeViceCaptainTeam.members || activeChangeViceCaptainTeam.students || [];

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 pb-2">
                <h2 className="text-lg font-bold text-slate-800">Change Team Vice Captain</h2>
                <p className="text-xs text-slate-500 mt-1">Select a member to assign as the new Team Vice Captain.</p>
              </div>

              <form onSubmit={handleChangeViceCaptain} className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Select New Vice Captain *</label>
                  {members.length === 0 ? (
                    <p className="text-xs text-slate-400">No members in team to promote.</p>
                  ) : (
                    <select
                      value={selectedNewViceCaptainRegNo}
                      onChange={e => setSelectedNewViceCaptainRegNo(e.target.value)}
                      className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold bg-white"
                    >
                      {members.map((m: any) => {
                        const mRegNo = (m.regNo || m.studentId || m.registerNumber || m.studentRegNo || m.id || '').toString();
                        return (
                          <option key={mRegNo} value={mRegNo}>
                            {m.fullName || m.name || mRegNo} ({mRegNo})
                          </option>
                        );
                      })}
                    </select>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setActiveChangeViceCaptainTeam(null)}
                    className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || members.length === 0}
                    className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70 text-sm"
                  >
                    {isSubmitting ? 'Updating...' : 'Assign Vice Captain'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Delete Team Modal */}
      {activeDeleteTeam && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl p-6 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Delete Group?</h2>
            <p className="text-xs text-slate-500 mb-6">
              Are you sure you want to delete <span className="font-bold text-slate-800">{activeDeleteTeam.teamName || activeDeleteTeam.name || activeDeleteTeam.groupName}</span>? This action cannot be undone.
            </p>

            <div className="flex justify-center space-x-3">
              <button
                type="button"
                onClick={() => setActiveDeleteTeam(null)}
                className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
                disabled={isSubmitting}
                className="px-5 py-2 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-sm disabled:opacity-70 text-sm"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Group'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

