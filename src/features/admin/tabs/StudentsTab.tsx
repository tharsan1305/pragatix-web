import { logger } from '../../../utils/logger';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, ArrowLeft, RefreshCw, X, UserCheck, School, Shield, User, Bell, RotateCcw, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import AdminBadgeRequestsTab from './AdminBadgeRequestsTab';

interface Props {
  onBack?: () => void;
}

interface LookupItem {
  id: number;
  [key: string]: any;
}

export default function StudentsTab({ onBack }: Props) {
  const [students, setStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter States (matching Flutter StudentFilterPanel)
  const [filterYear, setFilterYear] = useState<string>('All');
  const [filterDeptId, setFilterDeptId] = useState<string>('All');
  const [filterSectionId, setFilterSectionId] = useState<string>('All');
  const [filterSectionsList, setFilterSectionsList] = useState<LookupItem[]>([]);

  // Notification Bell & Badge Requests State
  const [pendingBadgeRequests, setPendingBadgeRequests] = useState<number>(0);
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState<boolean>(false);

  // In-App Delete Confirmation State
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<{ id: number; name: string } | null>(null);

  // Lookups
  const [lookups, setLookups] = useState<{
    departments: LookupItem[];
    academicYears: LookupItem[];
    years: LookupItem[];
    semesters: LookupItem[];
    genders: LookupItem[];
    sections: LookupItem[];
    groups: LookupItem[];
  }>({
    departments: [],
    academicYears: [],
    years: [],
    semesters: [],
    genders: [],
    sections: [],
    groups: []
  });

  // Dynamic sections fetched when department changes in modal
  const [deptSections, setDeptSections] = useState<LookupItem[]>([]);
  const [isFetchingSections, setIsFetchingSections] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);

  const [formData, setFormData] = useState({
    regNo: '',
    fullName: '',
    email: '',
    phone: '',
    sprNo: '',
    address: '',
    genderId: '',
    dob: '',
    // Guardian
    guardianName: '',
    guardianRel: '',
    guardianPhone: '',
    guardianEmail: '',
    // Academic
    departmentId: '',
    academicYearId: '',
    yearId: '',
    semesterId: '',
    sectionId: '',
    // Account & Security
    groupId: '',
    password: '',
    active: true
  });

  const guardianRelations = ['Father', 'Mother', 'Guardian', 'Parent'];

  useEffect(() => {
    fetchLookups();
    fetchStudents();
    fetchPendingBadges();
  }, []);

  const fetchPendingBadges = async () => {
    try {
      const res = await apiClient.get('/api/v1/admin/stats').catch(() => null);
      if (res?.data?.data?.pendingBadgeRequests !== undefined) {
        setPendingBadgeRequests(res.data.data.pendingBadgeRequests);
      }
    } catch {
      // Non-fatal
    }
  };

  const fetchLookups = async () => {
    try {
      const [deptRes, ayRes, yearRes, semRes, genRes, secRes, teamRes] = await Promise.all([
        apiClient.get('/api/v1/admin/departments').catch(() => null),
        apiClient.get('/api/v1/admin/academic-years').catch(() => null),
        apiClient.get('/api/v1/admin/years').catch(() => null),
        apiClient.get('/api/v1/admin/semesters').catch(() => null),
        apiClient.get('/api/v1/admin/genders').catch(() => null),
        apiClient.get('/api/v1/admin/sections').catch(() => null),
        apiClient.get('/api/v1/teams').catch(() => null)
      ]);

      const deduplicate = (list: any[]) => {
        if (!Array.isArray(list)) return [];
        const seen = new Set();
        return list.filter(item => {
          if (!item || item.id === undefined) return false;
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
      };

      const depts = deduplicate(deptRes?.data?.data || []);
      const secs = deduplicate(secRes?.data?.data || []);

      setLookups({
        departments: depts,
        academicYears: deduplicate(ayRes?.data?.data || []),
        years: deduplicate(yearRes?.data?.data || []),
        semesters: deduplicate(semRes?.data?.data || []),
        genders: deduplicate(genRes?.data?.data || []),
        sections: secs,
        groups: deduplicate(teamRes?.data?.data || [])
      });

      setFilterSectionsList(secs);
    } catch (e) {
      logger.error("Failed to fetch lookups:", e);
    }
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

  const applyFilters = (
    list: any[] = students,
    query: string = searchQuery,
    year: string = filterYear,
    deptId: string = filterDeptId,
    secId: string = filterSectionId
  ) => {
    let filtered = [...list];

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      filtered = filtered.filter(s =>
        (s.fullName || s.name || '').toLowerCase().includes(q) ||
        (s.registerNumber || s.regNo || s.studentId || s.username || '').toLowerCase().includes(q) ||
        (s.sprNo || s.spr || '').toLowerCase().includes(q) ||
        (s.email || '').toLowerCase().includes(q)
      );
    }

    if (year !== 'All') {
      const targetYearNorm = normalizeYear(year);
      filtered = filtered.filter(s => {
        const studentYear = s.yearId || s.year || s.yearName || s.academicYear;
        return normalizeYear(studentYear) === targetYearNorm;
      });
    }

    if (deptId !== 'All') {
      filtered = filtered.filter(s => {
        const sDeptId = s.departmentId || s.department?.id;
        const sDeptName = (s.departmentName || (typeof s.department === 'string' ? s.department : s.department?.name) || '').toLowerCase();
        return String(sDeptId) === String(deptId) || sDeptName === String(deptId).toLowerCase();
      });
    }

    if (secId !== 'All') {
      filtered = filtered.filter(s => {
        const sSecId = s.sectionId || s.section?.id;
        const sSecName = (s.sectionName || (typeof s.section === 'string' ? s.section : s.section?.sectionName) || '').toLowerCase();
        return String(sSecId) === String(secId) || sSecName === String(secId).toLowerCase();
      });
    }

    setFilteredStudents(filtered);
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/v1/students?page=0&size=100&sortBy=fullName');
      if (response.data?.success || response.status === 200) {
        const raw = response.data.data;
        const list = Array.isArray(raw) ? raw : (raw?.content || response.data?.content || []);
        setStudents(list);
        applyFilters(list, searchQuery, filterYear, filterDeptId, filterSectionId);
      }
    } catch (e) {
      logger.error("Failed to fetch students:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const sectionsAbortControllerRef = useRef<AbortController | null>(null);

  const fetchSectionsForDept = async (deptId: string | number) => {
    if (sectionsAbortControllerRef.current) {
      sectionsAbortControllerRef.current.abort();
    }
    const controller = new AbortController();
    sectionsAbortControllerRef.current = controller;

    if (!deptId) {
      setDeptSections([]);
      return;
    }
    setIsFetchingSections(true);
    try {
      const res = await apiClient.get(`/api/v1/admin/departments/${deptId}/sections`, {
        signal: controller.signal,
      });
      if (res.data?.success && Array.isArray(res.data.data)) {
        setDeptSections(res.data.data);
      } else {
        setDeptSections(lookups.sections);
      }
    } catch (err: any) {
      if (err?.name === 'CanceledError' || err?.code === 'ERR_CANCELED') return;
      setDeptSections(lookups.sections);
    } finally {
      setIsFetchingSections(false);
    }
  };

  const handleDepartmentChange = (newDeptId: string) => {
    setFormData(prev => ({
      ...prev,
      departmentId: newDeptId,
      sectionId: ''
    }));
    if (newDeptId) {
      fetchSectionsForDept(newDeptId);
    } else {
      setDeptSections([]);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    applyFilters(students, query, filterYear, filterDeptId, filterSectionId);
  };

  const handleFilterYearChange = (year: string) => {
    setFilterYear(year);
    applyFilters(students, searchQuery, year, filterDeptId, filterSectionId);
  };

  const handleFilterDeptChange = async (deptId: string) => {
    setFilterDeptId(deptId);
    setFilterSectionId('All');
    if (deptId !== 'All') {
      try {
        const res = await apiClient.get(`/api/v1/admin/departments/${deptId}/sections`);
        if (res.data?.success && Array.isArray(res.data.data)) {
          setFilterSectionsList(res.data.data);
        } else {
          setFilterSectionsList(lookups.sections);
        }
      } catch {
        setFilterSectionsList(lookups.sections);
      }
    } else {
      setFilterSectionsList(lookups.sections);
    }
    applyFilters(students, searchQuery, filterYear, deptId, 'All');
  };

  const handleFilterSectionChange = (secId: string) => {
    setFilterSectionId(secId);
    applyFilters(students, searchQuery, filterYear, filterDeptId, secId);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterYear('All');
    setFilterDeptId('All');
    setFilterSectionId('All');
    setFilterSectionsList(lookups.sections);
    setFilteredStudents(students);
  };

  const openModal = (student: any = null) => {
    setEditingStudent(student);
    if (student) {
      const deptId = student.departmentId?.toString() || student.department?.id?.toString() || '';
      const g = student.guardian || {};
      
      let rel = g.relationship || '';
      if (rel) {
        rel = rel.charAt(0).toUpperCase() + rel.slice(1).toLowerCase();
        if (!guardianRelations.includes(rel)) {
          if (rel.toUpperCase() === 'LOCAL_GUARDIAN') rel = 'Parent';
          else if (!guardianRelations.includes(rel)) rel = 'Guardian';
        }
      }

      let genderId = student.genderId?.toString() || student.gender?.id?.toString() || '';
      if (!genderId && student.gender) {
        const match = lookups.genders.find(gen => gen.genderName === student.gender);
        if (match) genderId = match.id.toString();
      }

      const formattedDob = student.dateOfBirth 
        ? student.dateOfBirth.split('T')[0] 
        : (student.dob ? student.dob.split('T')[0] : '');

      setFormData({
        regNo: student.regNo || student.registerNumber || student.studentId || student.username || '',
        fullName: student.fullName || student.name || '',
        email: student.email || '',
        phone: student.phone || student.mobileNumber || '',
        sprNo: student.sprNo || student.spr || '',
        address: student.address || '',
        genderId: genderId || (lookups.genders.length > 0 ? lookups.genders[0].id.toString() : ''),
        dob: formattedDob,
        // Guardian
        guardianName: g.guardianName || student.guardianName || '',
        guardianRel: rel || 'Father',
        guardianPhone: g.phoneNo || g.phone || student.guardianPhone || '',
        guardianEmail: g.email || student.guardianEmail || '',
        // Academic
        departmentId: deptId || (lookups.departments.length > 0 ? lookups.departments[0].id.toString() : ''),
        academicYearId: student.academicYearId?.toString() || student.academicYear?.id?.toString() || (lookups.academicYears.length > 0 ? lookups.academicYears[0].id.toString() : ''),
        yearId: student.yearId?.toString() || student.year?.id?.toString() || (lookups.years.length > 0 ? lookups.years[0].id.toString() : ''),
        semesterId: student.semesterId?.toString() || student.semester?.id?.toString() || (lookups.semesters.length > 0 ? lookups.semesters[0].id.toString() : ''),
        sectionId: student.sectionId?.toString() || student.section?.id?.toString() || '',
        // Account
        groupId: student.teamId?.toString() || student.groupId?.toString() || student.team?.id?.toString() || '',
        password: '',
        active: student.active ?? true
      });

      if (deptId) {
        fetchSectionsForDept(deptId);
      }
    } else {
      const defaultDeptId = lookups.departments.length > 0 ? lookups.departments[0].id.toString() : '';
      setFormData({
        regNo: '',
        fullName: '',
        email: '',
        phone: '',
        sprNo: '',
        address: '',
        genderId: lookups.genders.length > 0 ? lookups.genders[0].id.toString() : '',
        dob: '',
        // Guardian
        guardianName: '',
        guardianRel: 'Father',
        guardianPhone: '',
        guardianEmail: '',
        // Academic
        departmentId: defaultDeptId,
        academicYearId: lookups.academicYears.length > 0 ? lookups.academicYears[0].id.toString() : '',
        yearId: lookups.years.length > 0 ? lookups.years[0].id.toString() : '',
        semesterId: lookups.semesters.length > 0 ? lookups.semesters[0].id.toString() : '',
        sectionId: '',
        // Account
        groupId: '',
        password: '',
        active: true
      });

      if (defaultDeptId) {
        fetchSectionsForDept(defaultDeptId);
      }
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) {
      toast.error('Full Name and Email are required.');
      return;
    }

    const toastId = toast.loading("Saving student...");
    try {
      const payload: any = {
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        regNo: formData.regNo.trim(),
        sprNo: formData.sprNo.trim(),
        active: formData.active,
        genderId: formData.genderId ? parseInt(formData.genderId) : null,
        dob: formData.dob || null,
        guardianName: formData.guardianName.trim() || null,
        guardianRel: formData.guardianRel || null,
        guardianPhone: formData.guardianPhone.trim() || null,
        guardianEmail: formData.guardianEmail.trim() || null,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        academicYearId: formData.academicYearId ? parseInt(formData.academicYearId) : null,
        yearId: formData.yearId ? parseInt(formData.yearId) : null,
        semesterId: formData.semesterId ? parseInt(formData.semesterId) : null,
        sectionId: formData.sectionId ? parseInt(formData.sectionId) : null,
        groupId: formData.groupId ? parseInt(formData.groupId) : null
      };

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      }

      if (editingStudent) {
        await apiClient.put(`/api/v1/students/${editingStudent.id}`, payload);
        toast.dismiss(toastId);
        toast.success("Student updated successfully");
      } else {
        if (!formData.regNo.trim()) {
          toast.dismiss(toastId);
          toast.error("Registration Number is required for new students.");
          return;
        }
        if (!formData.password.trim()) {
          toast.dismiss(toastId);
          toast.error("Password is required for new students.");
          return;
        }
        await apiClient.post('/api/v1/students', payload);
        toast.dismiss(toastId);
        toast.success("Student added successfully");
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error("Save error:", e);
      toast.error(e.response?.data?.message || 'Failed to save student. Please check input fields.');
    }
  };

  const executeDelete = async () => {
    if (!deleteConfirmStudent) return;
    const { id } = deleteConfirmStudent;
    setDeleteConfirmStudent(null);

    const toastId = toast.loading("Deleting student...");
    try {
      await apiClient.delete(`/api/v1/students/${id}`);
      toast.dismiss(toastId);
      toast.success("Student deleted successfully");
      fetchStudents();
    } catch (e: any) {
      toast.dismiss(toastId);
      logger.error(e);
      toast.error(e.response?.data?.message || 'Failed to delete student.');
    }
  };

  const activeSections = deptSections.length > 0 ? deptSections : lookups.sections;

  return (
    <div className="flex flex-col min-h-full bg-slate-50 relative pb-20">
      {/* Top Header matching Flutter Students Directory AppBar */}
      <div className="bg-[#1E293B] text-white px-4 sm:px-6 py-4 shadow-md flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-slate-800 rounded-full text-white transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Students Directory</h1>
            {!isLoading && (
              <p className="text-xs text-slate-300 font-medium">
                Showing {filteredStudents.length}{students.length > filteredStudents.length ? ` of ${students.length}` : ''} students
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Notification Bell with Badge */}
          <button
            onClick={() => setIsBadgeModalOpen(true)}
            className="p-2 hover:bg-slate-800 rounded-full text-white transition-colors relative cursor-pointer"
            title="Badge Requests"
          >
            <Bell className="w-5 h-5" />
            {pendingBadgeRequests > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-600 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center border-2 border-[#1E293B]">
                {pendingBadgeRequests > 99 ? '99+' : pendingBadgeRequests}
              </span>
            )}
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => {
              fetchStudents();
              fetchPendingBadges();
            }}
            className="p-2 hover:bg-slate-800 rounded-full text-white transition-colors cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-4">
        {/* Search Bar matching Flutter StudentFilterPanel */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by student ID or name..." 
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none shadow-xs text-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => {
                setSearchQuery('');
                applyFilters(students, '', filterYear, filterDeptId, filterSectionId);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Outline Filters Row matching Flutter StudentFilterPanel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Academic Year Dropdown */}
          <div className="relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase absolute -top-2 left-3 bg-slate-50 px-1 z-1">Academic Year</label>
            <select
              value={filterYear}
              onChange={(e) => handleFilterYearChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
            >
              <option value="All">All Years</option>
              <option value="First Year">First Year</option>
              <option value="Second Year">Second Year</option>
              <option value="Third Year">Third Year</option>
              <option value="Fourth Year">Fourth Year</option>
            </select>
          </div>

          {/* Department Dropdown */}
          <div className="relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase absolute -top-2 left-3 bg-slate-50 px-1 z-1">Department</label>
            <select
              value={filterDeptId}
              onChange={(e) => handleFilterDeptChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
            >
              <option value="All">All Departments</option>
              {lookups.departments.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name || d.code || d.deptName}</option>
              ))}
            </select>
          </div>

          {/* Section Dropdown */}
          <div className="relative">
            <label className="text-[10px] font-bold text-slate-500 uppercase absolute -top-2 left-3 bg-slate-50 px-1 z-1">Section</label>
            <select
              value={filterSectionId}
              onChange={(e) => handleFilterSectionChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none shadow-2xs"
            >
              <option value="All">All Sections</option>
              {filterSectionsList.map((s: any) => (
                <option key={s.id} value={s.id}>Section {s.sectionName || s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Reset Filters Link */}
        {(filterYear !== 'All' || filterDeptId !== 'All' || filterSectionId !== 'All' || searchQuery) && (
          <div className="flex justify-end pt-1">
            <button
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}

        {/* Students List Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-white rounded-2xl shadow-xs border border-slate-200 space-y-2">
            <User className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="font-semibold text-sm">No students found matching current filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map(student => {
              const name = student.fullName || student.name || 'Unknown Student';
              const regNo = student.regNo || student.studentId || student.username || student.registerNumber || 'N/A';
              const sprNo = student.sprNo || student.spr || 'N/A';
              const deptName = typeof student.department === 'string' 
                ? student.department 
                : (student.department?.name || student.department?.code || student.departmentName || 'No Dept');
              const year = student.yearId ? `Year ${student.yearId}` : (student.year || student.yearName || '1');
              const section = student.sectionName || student.section || 'A';
              const semester = student.semesterId ? `Sem: ${student.semesterId}` : (student.semester ? `Sem: ${student.semester}` : '');

              return (
                <div key={student.id} className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-4 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-shadow gap-3">
                  <div className="flex items-center space-x-3.5 pl-1 min-w-0">
                    <div className="w-10 h-10 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-600 font-black text-sm shrink-0">
                      {name ? name[0].toUpperCase() : 'S'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-900 text-sm md:text-base truncate">{name}</h3>
                        <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                          {student.score ?? student.xp ?? student.points ?? 0} XP
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                        {regNo} • {deptName} {semester ? `• ${semester}` : ''} • Year: {year} • Section: {section}
                      </p>
                      <p className="text-[11px] font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
                        REG: {regNo} | SPR: {sprNo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 pr-1 self-end md:self-center shrink-0">
                    <button 
                      onClick={() => openModal(student)} 
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors cursor-pointer" 
                      title="Edit Student"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmStudent({ id: student.id, name })} 
                      className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer" 
                      title="Delete Student"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) matching Flutter */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => openModal()}
          className="w-14 h-14 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer"
          title="Add New Student"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Pending Badge Requests Modal triggered from Notification Bell */}
      {isBadgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#1E293B] text-white px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-400" />
                <span>Pending Badge Requests</span>
              </h2>
              <button
                onClick={() => {
                  setIsBadgeModalOpen(false);
                  fetchPendingBadges();
                }}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer text-lg font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
              <AdminBadgeRequestsTab onBack={() => { setIsBadgeModalOpen(false); fetchPendingBadges(); }} />
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-slate-900">Delete Student</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete <strong className="text-slate-800 font-bold">{deleteConfirmStudent.name}</strong>?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmStudent(null)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal matching Flutter EditStudentDialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-50 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 md:p-6 border-b border-slate-200 flex justify-between items-center bg-white rounded-t-2xl">
              <h2 className="text-lg font-bold text-slate-900">
                {editingStudent ? 'Edit Student Details' : 'Add New Student'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto p-4 md:p-6 space-y-6">
              {/* Section 1: Basic Information */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-700 tracking-wide flex items-center space-x-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Basic Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">
                      Register Number <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      disabled={!!editingStudent}
                      value={formData.regNo} 
                      onChange={e => setFormData({...formData, regNo: e.target.value})} 
                      placeholder="e.g. 24CSC122"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm disabled:bg-slate-100 disabled:text-slate-500 bg-white" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={formData.fullName} 
                      onChange={e => setFormData({...formData, fullName: e.target.value})} 
                      placeholder="e.g. Abishek"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="email" 
                      required 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      placeholder="student@jjcet.ac.in"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone Number</label>
                    <input 
                      type="text" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">SPR Number</label>
                    <input 
                      type="text" 
                      value={formData.sprNo} 
                      onChange={e => setFormData({...formData, sprNo: e.target.value})} 
                      placeholder="e.g. SPR24CS022"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Gender</label>
                    <select 
                      value={formData.genderId} 
                      onChange={e => setFormData({...formData, genderId: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white text-sm"
                    >
                      <option value="">-- Select Gender --</option>
                      {lookups.genders.map(g => (
                        <option key={g.id} value={g.id}>{g.genderName || g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Date of Birth</label>
                    <input 
                      type="date" 
                      value={formData.dob} 
                      onChange={e => setFormData({...formData, dob: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Address</label>
                  <textarea 
                    rows={2} 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    placeholder="Enter residential address"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white"
                  />
                </div>
              </div>

              {/* Section 2: Guardian Information */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-700 tracking-wide flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <span>Guardian Details</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Guardian Name</label>
                    <input 
                      type="text" 
                      value={formData.guardianName} 
                      onChange={e => setFormData({...formData, guardianName: e.target.value})} 
                      placeholder="e.g. Parent Name"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Relationship</label>
                    <select 
                      value={formData.guardianRel} 
                      onChange={e => setFormData({...formData, guardianRel: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white text-sm"
                    >
                      {guardianRelations.map(rel => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Guardian Phone</label>
                    <input 
                      type="text" 
                      value={formData.guardianPhone} 
                      onChange={e => setFormData({...formData, guardianPhone: e.target.value})} 
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Guardian Email</label>
                    <input 
                      type="email" 
                      value={formData.guardianEmail} 
                      onChange={e => setFormData({...formData, guardianEmail: e.target.value})} 
                      placeholder="guardian@example.com"
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Academic Details */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-700 tracking-wide flex items-center space-x-2">
                  <School className="w-4 h-4 text-slate-500" />
                  <span>Academic Information</span>
                </h3>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Department</label>
                  <select 
                    value={formData.departmentId} 
                    onChange={e => handleDepartmentChange(e.target.value)} 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white text-sm"
                  >
                    <option value="">-- Select Department --</option>
                    {lookups.departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name || d.code || d.deptName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Academic Year</label>
                    <select 
                      value={formData.academicYearId} 
                      onChange={e => setFormData({...formData, academicYearId: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white text-sm"
                    >
                      <option value="">-- Select Academic Year --</option>
                      {lookups.academicYears.map(ay => (
                        <option key={ay.id} value={ay.id}>{ay.year || ay.academicYear || ay.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Year</label>
                    <select 
                      value={formData.yearId} 
                      onChange={e => setFormData({...formData, yearId: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white text-sm"
                    >
                      <option value="">-- Select Year --</option>
                      {lookups.years.map(y => (
                        <option key={y.id} value={y.id}>
                          {y.yearNo !== undefined ? `Year ${y.yearNo}` : (y.yearName || y.name)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Semester</label>
                    <select 
                      value={formData.semesterId} 
                      onChange={e => setFormData({...formData, semesterId: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white text-sm"
                    >
                      <option value="">-- Select Semester --</option>
                      {lookups.semesters.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.semesterNo !== undefined ? `Semester ${s.semesterNo}` : (s.semesterName || s.name)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Section</label>
                    {isFetchingSections ? (
                      <div className="flex items-center space-x-2 py-2 text-xs text-slate-500">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Loading sections...</span>
                      </div>
                    ) : (
                      <select 
                        value={formData.sectionId} 
                        onChange={e => setFormData({...formData, sectionId: e.target.value})} 
                        className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white text-sm"
                      >
                        <option value="">-- Select Section --</option>
                        {activeSections.map(sec => (
                          <option key={sec.id} value={sec.id}>
                            {sec.sectionName || sec.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Account & Security */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-700 tracking-wide flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-slate-500" />
                  <span>Account & Security</span>
                </h3>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Group / Team</label>
                  <select 
                    value={formData.groupId} 
                    onChange={e => setFormData({...formData, groupId: e.target.value})} 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none bg-white text-sm"
                  >
                    <option value="">-- Select Group --</option>
                    {lookups.groups.map(grp => (
                      <option key={grp.id} value={grp.id}>
                        {grp.groupName || grp.name || grp.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">
                    {editingStudent ? 'New Password (Optional)' : 'Password'}
                  </label>
                  <input 
                    type="password" 
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})} 
                    placeholder={editingStudent ? 'Leave blank to keep current password' : 'Enter password'}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                  />
                  {editingStudent && (
                    <p className="text-[11px] text-slate-400 mt-1">Leave blank to keep current password</p>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-sm font-semibold text-slate-700">Active Account</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.active} 
                      onChange={e => setFormData({...formData, active: e.target.checked})} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-200/60 rounded-xl transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-[#1E293B] text-white font-semibold rounded-xl hover:bg-slate-800 transition-all text-sm shadow-xs cursor-pointer"
                >
                  {editingStudent ? 'Update Student' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
