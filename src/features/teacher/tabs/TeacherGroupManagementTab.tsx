import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { UsersRound, RefreshCw, ChevronDown, ChevronUp, UserPlus, Edit2, Shield, UserMinus, Crown, Trash2, Eye, X, Search, Check, Award, Plus, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../store/authContext';
import { getStageName } from '../../../utils/stageLevel';
import {
  normalizeYearString,
  formatYearDisplay,
  formatSectionDisplay,
  isMatchingYear,
  isMatchingSection,
  isMatchingDept,
  mapYearToEnumName
} from '../../../utils/displayFormatters';

export interface TeamMember {
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

export interface GroupData {
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
  departmentId?: number | string;
  departmentName?: string;
  department?: any;
  academicYearId?: number | string;
  academicYearName?: string;
  academicYear?: any;
  yearId?: number | string;
  yearName?: string;
  year?: any;
  semesterId?: number | string;
  semesterName?: string;
  semester?: any;
  sectionId?: number | string;
  sectionName?: string;
  section?: any;
  teamCapacity?: number;
  size?: number;
  maxTeamSize?: number;
  currentMemberCount?: number;
  membersCount?: number;
  teamMembers?: any[];
  members?: any[];
  students?: any[];
  currentStage?: number;
  stage?: any;
  level?: number;
  canDelete?: boolean;
  createdAt?: string;
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
  const [activeEditTeam, setActiveEditTeam] = useState<{ id: number; name: string; size: number } | null>(null);
  const [editTeamNameInput, setEditTeamNameInput] = useState('');
  const [editTeamSizeInput, setEditTeamSizeInput] = useState('');

  const [activeAddTeamId, setActiveAddTeamId] = useState<number | null>(null);
  const [studentIdInput, setStudentIdInput] = useState('');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [memberSearchResults, setMemberSearchResults] = useState<any[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);
  const [selectedMemberToAssign, setSelectedMemberToAssign] = useState<any>(null);
  const [selectedMembersToAssign, setSelectedMembersToAssign] = useState<any[]>([]);

  const [activeChangeCaptainTeam, setActiveChangeCaptainTeam] = useState<GroupData | null>(null);
  const [selectedNewCaptainRegNo, setSelectedNewCaptainRegNo] = useState('');

  const [activeChangeViceCaptainTeam, setActiveChangeViceCaptainTeam] = useState<GroupData | null>(null);
  const [selectedNewViceCaptainRegNo, setSelectedNewViceCaptainRegNo] = useState('');

  const [activeDeleteTeam, setActiveDeleteTeam] = useState<GroupData | null>(null);

  // Create Team Modal State (for CC, HOD, and Admins)
  const [isCreateTeamModalOpen, setIsCreateTeamModalOpen] = useState(false);
  const [createTeamName, setCreateTeamName] = useState('');
  const [createTeamSize, setCreateTeamSize] = useState<number>(5);
  const [createCaptainSearchQuery, setCreateCaptainSearchQuery] = useState('');
  const [createCaptainSearchResults, setCreateCaptainSearchResults] = useState<any[]>([]);
  const [isSearchingCaptain, setIsSearchingCaptain] = useState(false);
  const [selectedCreateCaptain, setSelectedCreateCaptain] = useState<any | null>(null);

  const canCreateTeam = isCC || isHOD || isAdmin || isSuperAdmin;

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
          const norm = normalizeYearString(raw);
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
            setYears(["All", matchedYr]);
            setDepts(["All", deptName]);
            setSections(["All", secName]);
          }
        } catch (ccErr) {
          logger.warn("Could not set CC default filter:", ccErr);
        }
      } else if (isHOD && !isAdmin && !isSuperAdmin) {
        const hodDeptName = user?.departmentName || (typeof user?.department === 'object' && user?.department ? (user.department as any).name : user?.department);
        if (hodDeptName) {
          const matchedDept = dNames.find(d => d.toLowerCase().trim() === String(hodDeptName).toLowerCase().trim() || d.toLowerCase().includes(String(hodDeptName).toLowerCase())) || hodDeptName;
          setSelectedDept(matchedDept);
          setDepts(dNames);
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

  // Fetch all available students when modal opens (matching Flutter StudentSearchDialog init)
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
        const targetTeam = groups.find((g: any) => (g.teamId || g.id) === activeAddTeamId) ||
          (selectedTeamDetails && (selectedTeamDetails.teamId === activeAddTeamId || selectedTeamDetails.id === activeAddTeamId) ? selectedTeamDetails : null);
        const stageOrder = targetTeam?.currentStage || (typeof targetTeam?.stage === 'number' ? targetTeam.stage : parseInt(String(targetTeam?.stage || '').replace(/\D/g, '')) || 1);

        let response;
        const queryParam = query ? `&keyword=${encodeURIComponent(query)}` : '';
        // Primary backend smart search matching Flutter StudentSearchDialog 1:1
        response = await apiClient.get(`/api/v1/students/team-member-search?teamId=${activeAddTeamId}&currentStage=${stageOrder}${queryParam}`, {
          signal: controller.signal,
        }).catch(() => null);

        if (!response || !response.data?.data) {
          response = await apiClient.get(`/api/v1/students/team-member-search?teamId=${activeAddTeamId}&currentStage=1${queryParam}`, {
            signal: controller.signal,
          }).catch(() => null);
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

        // Fallback search if primary query returned empty and query was provided
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

  // Trigger initial search (empty query) when modal opens, matching Flutter behavior
  useEffect(() => {
    if (activeAddTeamId && memberSearchQuery === '') {
      const controller = new AbortController();
      const fetchInitial = async () => {
        setIsSearchingMembers(true);
        try {
          const targetTeam = groups.find((g: any) => (g.teamId || g.id) === activeAddTeamId) ||
            (selectedTeamDetails && (selectedTeamDetails.teamId === activeAddTeamId || selectedTeamDetails.id === activeAddTeamId) ? selectedTeamDetails : null);
          const stageOrder = targetTeam?.currentStage || (typeof targetTeam?.stage === 'number' ? targetTeam.stage : parseInt(String(targetTeam?.stage || '').replace(/\D/g, '')) || 1);

          let response = await apiClient.get(`/api/v1/students/team-member-search?teamId=${activeAddTeamId}&currentStage=${stageOrder}`, {
            signal: controller.signal,
          }).catch(() => null);

          if (!response || !response.data?.data) {
            response = await apiClient.get(`/api/v1/students/team-member-search?teamId=${activeAddTeamId}&currentStage=1`, {
              signal: controller.signal,
            }).catch(() => null);
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

          if (!controller.signal.aborted) {
            setMemberSearchResults(list);
          }
        } catch (e: any) {
          if (e?.name !== 'CanceledError' && e?.code !== 'ERR_CANCELED') {
            logger.error("Error fetching initial team member search:", e);
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsSearchingMembers(false);
          }
        }
      };

      fetchInitial();
      return () => controller.abort();
    }
  }, [activeAddTeamId]);

  // Cache of all students for captain search matching Flutter StudentSearchProvider
  const [allStudentsCache, setAllStudentsCache] = useState<any[]>([]);

  // Fetch all students for captain search matching Flutter StudentSearchProvider
  useEffect(() => {
    if (!isCreateTeamModalOpen) return;

    let isMounted = true;
    const fetchStudentsForCaptainSelection = async () => {
      setIsSearchingCaptain(true);
      try {
        let list: any[] = [];
        const res = await apiClient.get('/api/v1/students?page=0&size=1000&sortBy=fullName');
        if (res.data?.success && res.data?.data) {
          const raw = res.data.data;
          list = Array.isArray(raw) ? raw : (raw.content || []);
        }

        if (isMounted) {
          setAllStudentsCache(list);
        }
      } catch (err) {
        logger.error("Error fetching students for captain selection:", err);
      } finally {
        if (isMounted) {
          setIsSearchingCaptain(false);
        }
      }
    };

    fetchStudentsForCaptainSelection();

    return () => {
      isMounted = false;
    };
  }, [isCreateTeamModalOpen]);

  // Compute filtered captain candidates based on search query matching Flutter searchStudents
  useEffect(() => {
    if (!isCreateTeamModalOpen) {
      setCreateCaptainSearchResults([]);
      return;
    }

    const q = createCaptainSearchQuery.toLowerCase().trim();
    let filtered = allStudentsCache;

    if (q) {
      filtered = allStudentsCache.filter((s: any) => {
        const fullName = String(s.fullName || s.name || '').toLowerCase();
        const regNo = String(s.regNo || s.registerNumber || '').toLowerCase();
        const sprNo = String(s.sprNo || '').toLowerCase();
        const email = String(s.email || '').toLowerCase();
        const dept = String(s.departmentName || s.department || '').toLowerCase();
        return fullName.includes(q) || regNo.includes(q) || sprNo.includes(q) || email.includes(q) || dept.includes(q);
      });
    }

    // Sort: unassigned students first, then alphabetically
    filtered = [...filtered].sort((a: any, b: any) => {
      const aAssigned = Boolean(a.teamName || a.teamId);
      const bAssigned = Boolean(b.teamName || b.teamId);
      if (aAssigned !== bAssigned) return aAssigned ? 1 : -1;
      const nameA = String(a.fullName || a.name || '').toLowerCase();
      const nameB = String(b.fullName || b.name || '').toLowerCase();
      return nameA.localeCompare(nameB);
    });

    setCreateCaptainSearchResults(filtered);
  }, [createCaptainSearchQuery, allStudentsCache, isCreateTeamModalOpen]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = createTeamName.trim();
    if (!name) {
      toast.error("Team name is required");
      return;
    }
    if (createTeamSize < 1) {
      toast.error("Team capacity must be at least 1");
      return;
    }
    if (!selectedCreateCaptain) {
      toast.error("Please select a team captain");
      return;
    }

    const captainRegNo = selectedCreateCaptain.regNo || selectedCreateCaptain.registerNumber || selectedCreateCaptain.studentId;
    if (!captainRegNo) {
      toast.error("Valid Captain registration number is required");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Creating team...");
    try {
      const payload: any = {
        name,
        size: Number(createTeamSize) || 5,
        captainStudentId: String(captainRegNo).trim()
      };

      const response = await apiClient.post('/api/v1/teams', payload);
      toast.dismiss(toastId);

      if (response.data?.success || response.status === 200 || response.status === 201) {
        toast.success("Team created successfully!");
        setIsCreateTeamModalOpen(false);
        setCreateTeamName('');
        setCreateTeamSize(5);
        setSelectedCreateCaptain(null);
        setCreateCaptainSearchQuery('');
        setCreateCaptainSearchResults([]);
        fetchGroups();
      } else {
        toast.error(response.data?.message || "Failed to create team");
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      logger.error("Error creating team:", err);
      toast.error(err.response?.data?.message || err.message || "Failed to create team");
    } finally {
      setIsSubmitting(false);
    }
  };

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
      const year = g.yearName || g.year || g.yearId;
      const sec = g.sectionName || (typeof g.section === 'string' ? g.section : g.section?.sectionName);
      const members = g.teamMembers || g.members || g.students || [];

      // 1. Department Filter
      if (selectedDept && selectedDept !== "All" && selectedDept !== "ALL") {
        const matchDept = isMatchingDept(dept, selectedDept) || members.some((m: any) =>
          isMatchingDept(m.departmentName || (typeof m.department === 'string' ? m.department : m.department?.name), selectedDept)
        );
        if (!matchDept) return false;
      }

      // 2. Year Filter
      if (selectedYear && selectedYear !== "All" && selectedYear !== "ALL") {
        const matchYear = isMatchingYear(year, selectedYear) || members.some((m: any) =>
          isMatchingYear(m.yearName || m.year || m.yearId || m.academicYear, selectedYear)
        );
        if (!matchYear) return false;
      }

      // 3. Section Filter
      if (selectedSection && selectedSection !== "All" && selectedSection !== "ALL") {
        const matchSec = isMatchingSection(sec, selectedSection) || members.some((m: any) =>
          isMatchingSection(m.sectionName || (typeof m.section === 'string' ? m.section : m.section?.sectionName), selectedSection)
        );
        if (!matchSec) return false;
      }

      // 4. Stage Filter
      if (selectedStage && selectedStage !== "All" && selectedStage !== "ALL") {
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

  const isUserTeamCaptain = (team: GroupData): boolean => {
    if (!user) return false;
    const userRegNo = (user.regNo || user.registrationNumber || user.studentId || user.id || '').toString().toLowerCase().trim();
    const teamCaptainRegNo = (team.captainId || team.captainRegNo || team.captain?.regNo || team.captain?.id || '').toString().toLowerCase().trim();
    return userRegNo && teamCaptainRegNo && userRegNo === teamCaptainRegNo;
  };

  const openEditTeamModal = (team: GroupData) => {
    if (!isUserTeamCaptain(team) && !isAdmin && !isSuperAdmin) {
      toast.error("Only team captain can edit team details");
      return;
    }
    const tId = team.teamId || team.id || 0;
    const name = team.teamName || team.name || team.groupName || '';
    const size = team.teamCapacity || team.size || team.maxTeamSize || 10;
    setActiveEditTeam({ id: tId, name, size });
    setEditTeamNameInput(name);
    setEditTeamSizeInput(size.toString());
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditTeam) return;
    const name = editTeamNameInput.trim();
    const newSize = parseInt(editTeamSizeInput, 10);
    if (!name) {
      toast.error("Please enter a valid team name");
      return;
    }
    if (isNaN(newSize) || newSize <= 0) {
      toast.error("Please enter a valid positive capacity limit");
      return;
    }
    const targetTeam = groups.find((g: any) => (g.teamId || g.id) === activeEditTeam.id);
    if (targetTeam) {
      const members = targetTeam.teamMembers || targetTeam.members || targetTeam.students || [];
      const currentCount = members.length;
      if (newSize < currentCount) {
        toast.error(`Team capacity cannot be less than current member count (${currentCount}). Please remove members first.`);
        return;
      }
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Updating team details...");
    try {
      let response;
      try {
        // Matches Flutter _updateTeam: PUT /api/v1/teams/{id} with body { name, size }
        response = await apiClient.put(`/api/v1/teams/${activeEditTeam.id}`, { name, size: newSize });
      } catch {
        response = await apiClient.put(`/api/v1/teams/${activeEditTeam.id}/limit?size=${newSize}`);
      }
      toast.dismiss(toastId);
      if (response?.data?.success || response?.status === 200) {
        toast.success("Team updated successfully!");
        setActiveEditTeam(null);
        const updatedGroups = await fetchGroups();
        if (selectedTeamDetails && (selectedTeamDetails.teamId === activeEditTeam.id || selectedTeamDetails.id === activeEditTeam.id)) {
          const fresh = updatedGroups.find((g: any) => (g.teamId || g.id) === activeEditTeam.id);
          if (fresh) setSelectedTeamDetails(fresh);
        }
      } else {
        toast.error(response?.data?.message || "Failed to update team");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || e.message || "Failed to update team");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddMemberModal = (teamId: number) => {
    setActiveAddTeamId(teamId);
    setStudentIdInput('');
    setMemberSearchQuery('');
    setMemberSearchResults([]);
    setSelectedMembersToAssign([]);
    setSelectedMemberToAssign(null);
  };

  const toggleStudentSelection = (s: any, availableSlots: number) => {
    const sReg = s.regNo || s.registerNumber || s.reg_no || s.studentId;
    const isSelected = selectedMembersToAssign.some((m: any) => (m.id && m.id === s.id) || (sReg && (m.regNo === sReg || m.registerNumber === sReg)));

    if (isSelected) {
      setSelectedMembersToAssign(prev => prev.filter((m: any) => !((m.id && m.id === s.id) || (sReg && (m.regNo === sReg || m.registerNumber === sReg)))));
    } else {
      if (availableSlots > 0 && selectedMembersToAssign.length >= availableSlots) {
        toast.error(`Team capacity limit reached (${availableSlots} max available slots).`);
        return;
      }
      setSelectedMembersToAssign(prev => [...prev, s]);
    }
  };

  const toggleSelectAll = (selectableStudents: any[], availableSlots: number) => {
    const allSelected = selectableStudents.length > 0 && selectableStudents.every((s: any) => {
      const sReg = s.regNo || s.registerNumber || s.reg_no || s.studentId;
      return selectedMembersToAssign.some((m: any) => (m.id && m.id === s.id) || (sReg && (m.regNo === sReg || m.registerNumber === sReg)));
    });

    if (allSelected) {
      setSelectedMembersToAssign([]);
    } else {
      const toSelect = availableSlots > 0 ? selectableStudents.slice(0, availableSlots) : selectableStudents;
      if (availableSlots > 0 && selectableStudents.length > availableSlots) {
        toast(`Selected ${availableSlots} student(s) to match available capacity.`, { icon: 'ℹ️' });
      }
      setSelectedMembersToAssign(toSelect);
    }
  };

  const handleAddMembers = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let regNosToAdd: string[] = selectedMembersToAssign
      .map((s: any) => s.regNo || s.registerNumber || s.reg_no || s.studentId)
      .filter(Boolean);

    if (regNosToAdd.length === 0 && selectedMemberToAssign) {
      const single = selectedMemberToAssign.regNo || selectedMemberToAssign.registerNumber || selectedMemberToAssign.reg_no || selectedMemberToAssign.studentId;
      if (single) regNosToAdd = [single];
    }

    if (regNosToAdd.length === 0 && studentIdInput.trim()) {
      regNosToAdd = [studentIdInput.trim()];
    }

    if (!activeAddTeamId || regNosToAdd.length === 0) {
      toast.error("Please search and select student(s) to add to the team.");
      return;
    }

    const targetTeam = groups.find((g: any) => (g.teamId || g.id) === activeAddTeamId) ||
      (selectedTeamDetails && (selectedTeamDetails.teamId === activeAddTeamId || selectedTeamDetails.id === activeAddTeamId) ? selectedTeamDetails : null);
    const members = targetTeam?.teamMembers || targetTeam?.members || targetTeam?.students || [];
    const currentCount = targetTeam?.currentMemberCount ?? members.length ?? 0;
    const teamSize = targetTeam?.teamCapacity || targetTeam?.size || targetTeam?.maxTeamSize || 10;
    const availableSlots = Math.max(0, teamSize - currentCount);

    if (availableSlots > 0 && regNosToAdd.length > availableSlots) {
      toast.error(`Cannot add ${regNosToAdd.length} students. Only ${availableSlots} slot(s) available in this team (Capacity: ${teamSize}, Current: ${currentCount}).`);
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading(`Adding ${regNosToAdd.length} member${regNosToAdd.length > 1 ? 's' : ''} to group...`);
    try {
      let response;
      try {
        // Primary backend endpoint: POST /api/v1/teams/{id}/add-members with List<String> body
        response = await apiClient.post(`/api/v1/teams/${activeAddTeamId}/add-members`, regNosToAdd);
      } catch (err: any) {
        if (regNosToAdd.length === 1) {
          try {
            response = await apiClient.post(`/api/v1/teams/${activeAddTeamId}/add-member?regNo=${encodeURIComponent(regNosToAdd[0])}`);
          } catch {
            response = await apiClient.post(`/api/v1/teams/${activeAddTeamId}/members?regNo=${encodeURIComponent(regNosToAdd[0])}`);
          }
        } else {
          throw err;
        }
      }

      toast.dismiss(toastId);
      if (response?.data?.success || response?.status === 200 || response?.status === 201) {
        toast.success(`${regNosToAdd.length} member${regNosToAdd.length > 1 ? 's' : ''} added successfully!`);
        setActiveAddTeamId(null);
        setStudentIdInput('');
        setMemberSearchQuery('');
        setMemberSearchResults([]);
        setSelectedMembersToAssign([]);
        setSelectedMemberToAssign(null);
        const updatedGroups = await fetchGroups();
        if (selectedTeamDetails && (selectedTeamDetails.teamId === activeAddTeamId || selectedTeamDetails.id === activeAddTeamId)) {
          const fresh = updatedGroups.find((g: any) => (g.teamId || g.id) === activeAddTeamId);
          if (fresh) setSelectedTeamDetails(fresh);
        }
      } else {
        toast.error(response?.data?.message || "Failed to add member(s)");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      const errMsg = e.response?.data?.message || e.message || "Failed to add member(s)";
      toast.error(errMsg);
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

  const handleRemoveViceCaptain = async (team: GroupData) => {
    const tId = team.teamId || team.id;
    if (!tId) return;
    const toastId = toast.loading("Removing vice captain role...");
    try {
      let response;
      try {
        response = await apiClient.delete(`/api/v1/teams/${tId}/vice-captain`);
      } catch {
        response = await apiClient.put(`/api/v1/teams/${tId}/vice-captain?regNo=`);
      }
      toast.dismiss(toastId);
      if (response?.data?.success || response?.status === 200) {
        toast.success("Vice captain removed successfully!");
        const updatedGroups = await fetchGroups();
        if (selectedTeamDetails && (selectedTeamDetails.teamId === tId || selectedTeamDetails.id === tId)) {
          const fresh = updatedGroups.find((g: any) => (g.teamId || g.id) === tId);
          if (fresh) setSelectedTeamDetails(fresh);
        }
      } else {
        toast.error(response?.data?.message || "Failed to remove vice captain");
      }
    } catch (e: any) {
      toast.dismiss(toastId);
      toast.error(e.response?.data?.message || e.message || "Failed to remove vice captain");
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
    if (!isUserTeamCaptain(team) && !isAdmin && !isSuperAdmin) {
      toast.error("Only team captain can delete team");
      return;
    }
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
        <h1 className="font-heading text-xl font-bold">View Groups</h1>
        <div className="flex items-center space-x-2">
          {canCreateTeam && (
            <button
              onClick={() => {
                setCreateTeamName('');
                setCreateTeamSize(5);
                setSelectedCreateCaptain(null);
                setCreateCaptainSearchQuery('');
                setCreateCaptainSearchResults([]);
                setIsCreateTeamModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Team</span>
            </button>
          )}
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

      <div className="bg-indigo-50/80 p-3 flex flex-wrap sm:flex-nowrap gap-2 border-b border-indigo-100 z-10 sticky top-[60px] shadow-xs">
        {/* Year Filter */}
        <select
          className={`flex-1 min-w-[120px] bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer ${isCC && !isAdmin && !isSuperAdmin ? 'bg-slate-100 cursor-not-allowed opacity-90 text-slate-700 font-semibold' : 'text-slate-800'}`}
          value={selectedYear}
          disabled={isCC && !isAdmin && !isSuperAdmin}
          onChange={e => handleYearChange(e.target.value)}
        >
          <option value="All">All Years</option>
          {years.filter(y => y !== 'All').map(y => <option key={y} value={y}>{y}</option>)}
        </select>

        {/* Dept Filter */}
        <select
          className={`flex-1 min-w-[140px] bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer ${isCC && !isAdmin && !isSuperAdmin ? 'bg-slate-100 cursor-not-allowed opacity-90 text-slate-700 font-semibold' : 'text-slate-800'}`}
          value={selectedDept}
          disabled={isCC && !isAdmin && !isSuperAdmin}
          onChange={e => handleDeptChange(e.target.value)}
        >
          <option value="All">All Departments</option>
          {depts.filter(d => d !== 'All').map(d => <option key={d} value={d}>{d}</option>)}
        </select>

        {/* Section Filter */}
        <select
          className={`flex-1 min-w-[110px] bg-white border border-slate-300 rounded-lg px-2.5 py-2 text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer ${isCC && !isAdmin && !isSuperAdmin ? 'bg-slate-100 cursor-not-allowed opacity-90 text-slate-700 font-semibold' : 'text-slate-800'}`}
          value={selectedSection}
          disabled={isCC && !isAdmin && !isSuperAdmin}
          onChange={e => setSelectedSection(e.target.value)}
        >
          <option value="All">All Sections</option>
          {sections.filter(s => s !== 'All').map(s => <option key={s} value={s}>{s.startsWith('Section') ? s : `Section ${s}`}</option>)}
        </select>

        {/* Stage Filter */}
        <select
          className="flex-1 min-w-[110px] bg-white border border-indigo-200 rounded-lg px-2.5 py-2 text-xs font-bold text-indigo-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
          value={selectedStage}
          onChange={e => setSelectedStage(e.target.value)}
        >
          <option value="All">All Stages</option>
          {stages.filter(st => st !== 'All').map(st => <option key={st} value={st}>{st}</option>)}
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
            {canCreateTeam && (
              <button
                onClick={() => {
                  setCreateTeamName('');
                  setCreateTeamSize(5);
                  setSelectedCreateCaptain(null);
                  setCreateCaptainSearchQuery('');
                  setCreateCaptainSearchResults([]);
                  setIsCreateTeamModalOpen(true);
                }}
                className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Team</span>
              </button>
            )}
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
                          onClick={() => openAddMemberModal(tId)}
                          className="flex items-center gap-1.5 bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Add Member
                        </button>
                        <button
                          onClick={() => openEditTeamModal(g)}
                          className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" /> Edit Team
                        </button>
                        <button
                          onClick={() => openChangeCaptainModal(g)}
                          className="flex items-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Crown className="w-3.5 h-3.5" /> Change Captain
                        </button>
                        <button
                          onClick={() => openChangeViceCaptainModal(g)}
                          className="flex items-center gap-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5" /> Change Vice Captain
                        </button>
                        {viceCaptainName && viceCaptainName !== 'Unassigned' && viceCaptainName !== '—' && (
                          <button
                            onClick={() => handleRemoveViceCaptain(g)}
                            className="flex items-center gap-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            title="Remove Vice Captain role"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" /> Remove Vice Captain
                          </button>
                        )}
                        <button
                          onClick={() => openDeleteTeamModal(g)}
                          className="flex items-center gap-1.5 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Team
                        </button>
                      </div>

                      {/* Team Details Summary Bar */}
                      <div className="p-3 bg-indigo-50/40 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600">
                        <div><span className="font-semibold text-slate-500">Dept:</span> {g.departmentName || (typeof g.department === 'string' ? g.department : g.department?.name) || '—'}</div>
                        <div><span className="font-semibold text-slate-500">Acad Year:</span> {g.academicYearName || g.academicYear || '2024-2025'}</div>
                        <div><span className="font-semibold text-slate-500">Year / Sec:</span> {formatYearDisplay(g.yearName || g.year)} - {formatSectionDisplay(g.sectionName || g.section)}</div>
                        <div><span className="font-semibold text-slate-500">Vice Capt:</span> {viceCaptainName}</div>
                      </div>

                      <div className="flex flex-col">
                        {members.map((m: any, i: number) => {
                          const mRegNo = m.regNo || m.studentId || '';
                          const isCaptain = mRegNo === (g.captainRegNo || g.captainId) || m.isCaptain;
                          const isViceCaptain = mRegNo === (g.viceCaptainRegNo || g.viceCaptainId) || m.isViceCaptain;

                          return (
                            <div key={i} className="p-3 border-b border-slate-100 last:border-0 flex items-center justify-between hover:bg-slate-50">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isCaptain ? 'bg-amber-500 text-white' : isViceCaptain ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                                  {isCaptain ? <Crown className="w-4 h-4" /> : isViceCaptain ? <Shield className="w-4 h-4" /> : (m.fullName || m.name || "S")?.charAt(0)}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-xs text-slate-800">{m.fullName || m.name || "Student"}</span>
                                    {isCaptain && <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-full">CAPTAIN</span>}
                                    {isViceCaptain && !isCaptain && <span className="bg-indigo-100 text-indigo-800 text-[9px] font-black px-1.5 py-0.5 rounded-full">VICE CAPTAIN</span>}
                                  </div>
                                  <span className="text-[11px] text-slate-400">{mRegNo}</span>
                                </div>
                              </div>

                              {!isCaptain && (
                                <button
                                  onClick={() => removeMember(tId, mRegNo.toString(), m.fullName || m.name || "Student")}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
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
                      <h1 className="font-heading text-2xl font-black text-indigo-950">{groupName}</h1>
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
                    <p className="font-bold text-slate-800 mt-0.5">{formatYearDisplay(year)}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p className="text-xs text-slate-400 font-medium">Section</p>
                    <p className="font-bold text-slate-800 mt-0.5">{formatSectionDisplay(sec)}</p>
                  </div>
                </div>

                {/* Management Actions Grid */}
                <div>
                  <h3 className="font-heading text-sm font-bold text-slate-700 mb-3">Management Actions</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => openAddMemberModal(tId)}
                      className="flex items-center justify-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 p-3 rounded-xl text-xs font-bold transition-colors border border-green-200 shadow-2xs"
                    >
                      <UserPlus className="w-4 h-4" /> Add Member
                    </button>
                    <button
                      onClick={() => openEditTeamModal(g)}
                      disabled={!isUserTeamCaptain(g) && !isAdmin && !isSuperAdmin}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors border shadow-2xs ${
                        isUserTeamCaptain(g) || isAdmin || isSuperAdmin
                          ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 cursor-pointer'
                          : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                      }`}
                      title={isUserTeamCaptain(g) || isAdmin || isSuperAdmin ? "Edit team details" : "Only team captain can edit"}
                    >
                      <Edit2 className="w-4 h-4" /> Edit Team
                    </button>
                    <button
                      onClick={() => openChangeCaptainModal(g)}
                      className="flex items-center justify-center gap-2 bg-amber-50 text-amber-800 hover:bg-amber-100 p-3 rounded-xl text-xs font-bold transition-colors border border-amber-200 shadow-2xs"
                    >
                      <Crown className="w-4 h-4" /> Change Captain
                    </button>
                    <button
                      onClick={() => openChangeViceCaptainModal(g)}
                      className="flex items-center justify-center gap-2 bg-slate-100 text-slate-800 hover:bg-slate-200 p-3 rounded-xl text-xs font-bold transition-colors border border-slate-200 shadow-2xs"
                    >
                      <Shield className="w-4 h-4" /> Change Vice Captain
                    </button>
                    {viceCaptainName && viceCaptainName !== 'Unassigned' && viceCaptainName !== '—' ? (
                      <>
                        <button
                          onClick={() => handleRemoveViceCaptain(g)}
                          className="flex items-center justify-center gap-2 bg-rose-50 text-rose-800 hover:bg-rose-100 p-3 rounded-xl text-xs font-bold transition-colors border border-rose-200 shadow-2xs"
                          title="Remove Vice Captain role"
                        >
                          <ShieldAlert className="w-4 h-4" /> Remove Vice Captain
                        </button>
                        <button
                          onClick={() => openDeleteTeamModal(g)}
                          disabled={!isUserTeamCaptain(g) && !isAdmin && !isSuperAdmin}
                          className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors border shadow-2xs ${
                            isUserTeamCaptain(g) || isAdmin || isSuperAdmin
                              ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200 cursor-pointer'
                              : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                          }`}
                          title={isUserTeamCaptain(g) || isAdmin || isSuperAdmin ? "Delete team" : "Only team captain can delete"}
                        >
                          <Trash2 className="w-4 h-4" /> Delete Team
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => openDeleteTeamModal(g)}
                        disabled={!isUserTeamCaptain(g) && !isAdmin && !isSuperAdmin}
                        className={`flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors border shadow-2xs col-span-1 ${
                          isUserTeamCaptain(g) || isAdmin || isSuperAdmin
                            ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200 cursor-pointer'
                            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        }`}
                        title={isUserTeamCaptain(g) || isAdmin || isSuperAdmin ? "Delete team" : "Only team captain can delete"}
                      >
                        <Trash2 className="w-4 h-4" /> Delete Team
                      </button>
                    )}
                  </div>
                </div>

                {/* Team Members List */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-heading text-sm font-bold text-slate-700">Team Members ({members.length}/{size})</h3>
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
                                  {mRegNo} • Level {m.stageLevel || m.currentStage || level} - {getStageName(m.stageLevel || m.currentStage || level)}
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

      {/* Edit Team Modal matching Flutter _showEditTeamDialog 1:1 */}
      {activeEditTeam && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 pb-2">
              <h2 className="font-heading text-lg font-bold text-slate-800">Edit Team</h2>
              <p className="text-xs text-slate-500 mt-1">Update team name and maximum capacity limit.</p>
            </div>

            <form onSubmit={handleUpdateTeam} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Team Name *</label>
                <input
                  required
                  type="text"
                  value={editTeamNameInput}
                  onChange={e => setEditTeamNameInput(e.target.value)}
                  placeholder="e.g. Test Team"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1 block">Max Member Limit *</label>
                <input
                  required
                  type="number"
                  min="1"
                  value={editTeamSizeInput}
                  onChange={e => setEditTeamSizeInput(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-semibold"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveEditTeam(null)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-70 text-sm"
                >
                  {isSubmitting ? 'Updating...' : 'Update Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal matching Flutter StudentSearchDialog 1:1 with Multi-Select */}
      {activeAddTeamId && (() => {
        const currentTeam = groups.find((g: any) => (g.teamId || g.id) === activeAddTeamId) ||
          (selectedTeamDetails && (selectedTeamDetails.teamId === activeAddTeamId || selectedTeamDetails.id === activeAddTeamId) ? selectedTeamDetails : null);
        const currentMembers = currentTeam?.teamMembers || currentTeam?.members || currentTeam?.students || [];
        const currentCount = currentTeam?.currentMemberCount ?? currentMembers.length ?? 0;
        const maxCapacity = currentTeam?.teamCapacity || currentTeam?.size || currentTeam?.maxTeamSize || 10;
        const availableSlots = Math.max(0, maxCapacity - currentCount);

        const selectableStudents = memberSearchResults.filter((s: any) => Number(s.teamId) !== Number(activeAddTeamId));
        const allSelectableSelected = selectableStudents.length > 0 && selectableStudents.every((s: any) => {
          const sReg = s.regNo || s.registerNumber || s.reg_no || s.studentId;
          return selectedMembersToAssign.some((m: any) => (m.id && m.id === s.id) || (sReg && (m.regNo === sReg || m.registerNumber === sReg)));
        });

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl max-h-[88vh]">
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100 shadow-xs">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-heading text-lg font-bold text-slate-800">Add Team Members</h2>
                      <span className="bg-indigo-100 text-indigo-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                        {currentTeam?.teamName || currentTeam?.name || `Team #${activeAddTeamId}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium">Search & select multiple students to add to group</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveAddTeamId(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Team Capacity Banner */}
              <div className="px-5 py-2.5 bg-indigo-50/50 border-b border-indigo-100/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-indigo-900 font-semibold">
                  <span>Current: {currentCount}/{maxCapacity} members</span>
                </div>
                <div className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${availableSlots > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                  {availableSlots > 0 ? `${availableSlots} slot${availableSlots > 1 ? 's' : ''} available` : 'Team is full'}
                </div>
              </div>

              <form onSubmit={handleAddMembers} className="p-5 flex-1 flex flex-col overflow-hidden space-y-3.5">
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
                  {memberSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setMemberSearchQuery('');
                        setStudentIdInput('');
                      }}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Multi-Select Toolbar */}
                {!isSearchingMembers && memberSearchResults.length > 0 && (
                  <div className="flex items-center justify-between px-1 py-1 text-xs border-b border-slate-100 pb-2">
                    <button
                      type="button"
                      onClick={() => toggleSelectAll(selectableStudents, availableSlots)}
                      className="flex items-center gap-2 text-slate-700 font-bold hover:text-indigo-600 transition-colors cursor-pointer"
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${allSelectableSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-300 bg-white'}`}>
                        {allSelectableSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <span>Select All ({selectableStudents.length} eligible)</span>
                    </button>
                    <span className="font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                      {selectedMembersToAssign.length} Selected
                    </span>
                  </div>
                )}

                {/* Live Search Results Container */}
                <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[300px] pr-1 space-y-2">
                  {isSearchingMembers ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
                      <span className="text-xs font-semibold">Searching eligible students...</span>
                    </div>
                  ) : memberSearchQuery.trim() && memberSearchResults.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-center">
                      <UsersRound className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-sm font-semibold text-slate-600">No eligible students found</p>
                      <p className="text-xs text-slate-400 mt-1">Check the search keywords or ensure students belong to this team's department & stage</p>
                    </div>
                  ) : memberSearchResults.length > 0 ? (
                    memberSearchResults.map((s: any) => {
                      const sReg = s.regNo || s.registerNumber || s.reg_no || s.studentId;
                      const isSelected = selectedMembersToAssign.some((m: any) => (m.id && m.id === s.id) || (sReg && (m.regNo === sReg || m.registerNumber === sReg)));
                      const isAlreadyInThisTeam = Number(s.teamId) === Number(activeAddTeamId);

                      return (
                        <div
                          key={s.id || s.regNo}
                          onClick={() => {
                            if (isAlreadyInThisTeam) return;
                            toggleStudentSelection(s, availableSlots);
                          }}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${isAlreadyInThisTeam
                              ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                              : isSelected
                                ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/20 shadow-xs'
                                : 'bg-white border-slate-200/90 hover:border-indigo-300 hover:bg-slate-50/60'
                            }`}
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            {/* Checkbox */}
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-all shrink-0 ${isAlreadyInThisTeam
                                ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                                : isSelected
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                  : 'border-slate-300 bg-white hover:border-indigo-400'
                              }`}>
                              {isAlreadyInThisTeam ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : isSelected ? (
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              ) : null}
                            </div>

                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                              }`}>
                              {s.fullName ? s.fullName.charAt(0).toUpperCase() : 'S'}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-slate-800 truncate">{s.fullName}</h4>
                              <p className="text-xs text-slate-500 font-medium mt-0.5 truncate">
                                Reg: <span className="font-semibold text-slate-700">{s.regNo || s.registerNumber}</span>
                                {s.sprNo && <> • SPR: <span className="font-semibold text-slate-700">{s.sprNo}</span></>}
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                {s.departmentName || s.department || ''} • Year {s.year || 1} • Sec {s.section || 'A'}
                              </p>
                              {s.teamName && (
                                <p className={`text-[11px] font-semibold mt-0.5 ${isAlreadyInThisTeam ? 'text-emerald-600' : 'text-amber-600'}`}>
                                  Current Team: {s.teamName}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0 ml-2">
                            {isAlreadyInThisTeam ? (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">
                                <Check className="w-3 h-3" />
                                <span>Added</span>
                              </span>
                            ) : isSelected ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700">
                                Selected
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 hover:text-indigo-600 font-medium">Select</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-6 px-4 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-center">
                      <p className="text-xs font-semibold text-slate-600">Type above to search live student directory</p>
                      <p className="text-[11px] text-slate-400 mt-1">Only eligible students in this team's class & stage will appear</p>
                    </div>
                  )}
                </div>

                {/* Selected Students Preview Chips */}
                {selectedMembersToAssign.length > 0 && (
                  <div className="p-2.5 bg-indigo-50/40 rounded-2xl border border-indigo-100/80">
                    <div className="text-[11px] font-bold text-indigo-900 mb-1.5 flex items-center justify-between">
                      <span>Selected to Add ({selectedMembersToAssign.length})</span>
                      <button
                        type="button"
                        onClick={() => setSelectedMembersToAssign([])}
                        className="text-indigo-600 hover:underline text-[10px]"
                      >
                        Clear All
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                      {selectedMembersToAssign.map((s: any) => {
                        const sReg = s.regNo || s.registerNumber || s.reg_no || s.studentId;
                        return (
                          <span
                            key={s.id || sReg}
                            className="inline-flex items-center gap-1 bg-white border border-indigo-200 text-indigo-900 text-xs px-2 py-0.5 rounded-lg shadow-2xs font-semibold"
                          >
                            <span className="truncate max-w-[120px]">{s.fullName || sReg}</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMembersToAssign(prev => prev.filter((m: any) => !((m.id && m.id === s.id) || (sReg && (m.regNo === sReg || m.registerNumber === sReg)))));
                              }}
                              className="text-slate-400 hover:text-rose-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

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
                    disabled={isSubmitting || (selectedMembersToAssign.length === 0 && !studentIdInput.trim())}
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
                        <span>
                          {selectedMembersToAssign.length > 0
                            ? `Add ${selectedMembersToAssign.length} Member${selectedMembersToAssign.length > 1 ? 's' : ''}`
                            : 'Add Member'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Change Captain Modal */}
      {activeChangeCaptainTeam && (() => {
        const members = activeChangeCaptainTeam.teamMembers || activeChangeCaptainTeam.members || activeChangeCaptainTeam.students || [];

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl">
              <div className="p-6 pb-2">
                <h2 className="font-heading text-lg font-bold text-slate-800">Change Team Captain</h2>
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
                <h2 className="font-heading text-lg font-bold text-slate-800">Change Team Vice Captain</h2>
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
            <h2 className="font-heading text-lg font-bold text-slate-800 mb-1">Delete Group?</h2>
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

      {/* Create Team Modal */}
      {isCreateTeamModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden flex flex-col shadow-2xl max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-heading text-lg font-bold text-slate-800">Create New Team</h2>
                  <p className="text-xs text-slate-500 font-medium">Configure team details and appoint an initial captain</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateTeamModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="p-5 flex-1 flex flex-col overflow-hidden space-y-4">
              {/* Team Name and Size Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 mb-1">Team Name *</label>
                  <input
                    type="text"
                    required
                    value={createTeamName}
                    onChange={e => setCreateTeamName(e.target.value)}
                    placeholder="e.g. Cyber Knights, Team Alpha"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-semibold transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Capacity *</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    required
                    value={createTeamSize}
                    onChange={e => setCreateTeamSize(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-semibold text-center transition-all"
                  />
                </div>
              </div>

              {/* Selected Captain Card (if selected) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Team Captain * {selectedCreateCaptain ? <span className="text-emerald-600 font-semibold">(Selected)</span> : <span className="text-rose-500">(Required)</span>}
                </label>

                {selectedCreateCaptain ? (
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                        <Crown className="w-5 h-5 text-amber-300" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{selectedCreateCaptain.fullName}</h4>
                        <p className="text-xs text-slate-600 font-medium">
                          Reg: <span className="font-semibold text-slate-800">{selectedCreateCaptain.regNo || selectedCreateCaptain.registerNumber}</span>
                          {selectedCreateCaptain.departmentName && <> • {selectedCreateCaptain.departmentName}</>}
                          {selectedCreateCaptain.year && <> • Year {selectedCreateCaptain.year}</>}
                          {selectedCreateCaptain.section && <> • Sec {selectedCreateCaptain.section}</>}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCreateCaptain(null)}
                      className="px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Search Field */}
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                      <input
                        type="text"
                        value={createCaptainSearchQuery}
                        onChange={e => setCreateCaptainSearchQuery(e.target.value)}
                        placeholder="Search student by Name, Reg No, or SPR No to appoint as Captain..."
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-sm font-semibold transition-all"
                      />
                    </div>

                    {/* Live Student List */}
                    <div className="overflow-y-auto max-h-[220px] min-h-[160px] pr-1 space-y-2">
                      {isSearchingCaptain ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-400 space-y-1.5">
                          <RefreshCw className="w-5 h-5 animate-spin text-indigo-600" />
                          <span className="text-xs font-semibold">Searching students...</span>
                        </div>
                      ) : createCaptainSearchQuery.trim() && createCaptainSearchResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-slate-400 text-center">
                          <UsersRound className="w-7 h-7 text-slate-300 mb-1" />
                          <p className="text-xs font-semibold text-slate-600">No students found</p>
                          <p className="text-[11px] text-slate-400">Try searching by registration number or full name</p>
                        </div>
                      ) : createCaptainSearchResults.length > 0 ? (
                        createCaptainSearchResults.map((s: any) => {
                          const isAlreadyInTeam = Boolean(s.teamName || s.teamId);
                          return (
                            <div
                              key={s.id || s.regNo}
                              onClick={() => {
                                if (isAlreadyInTeam) {
                                  toast.error(`Student already belongs to team "${s.teamName || 'another team'}"`);
                                  return;
                                }
                                setSelectedCreateCaptain(s);
                              }}
                              className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                                isAlreadyInTeam
                                  ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                                  : 'bg-white border-slate-200/90 hover:border-emerald-400 hover:bg-emerald-50/40'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                                  {s.fullName ? s.fullName.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-slate-800">{s.fullName}</h4>
                                  <p className="text-[11px] text-slate-500 font-medium">
                                    Reg: <span className="font-semibold text-slate-700">{s.regNo || s.registerNumber}</span>
                                    {s.departmentName && <> • {s.departmentName}</>}
                                    {s.year && <> • Year {s.year}</>}
                                    {s.section && <> • Sec {s.section}</>}
                                  </p>
                                  {s.teamName && (
                                    <p className="text-[10px] font-semibold text-amber-600">
                                      Already in Team: {s.teamName}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div>
                                {isAlreadyInTeam ? (
                                  <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-md">
                                    Assigned
                                  </span>
                                ) : (
                                  <span className="text-xs text-emerald-600 font-bold hover:underline">
                                    Select Captain
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="py-6 px-4 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-center">
                          <p className="text-xs font-semibold text-slate-600">Type above to search live student directory</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Select an unassigned student to appoint as team captain</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateTeamModalOpen(false)}
                  className="px-4 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !createTeamName.trim() || !selectedCreateCaptain}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center space-x-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Create Team</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

