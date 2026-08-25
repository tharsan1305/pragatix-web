import { logger } from '../../../utils/logger';
import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Edit2, Trash2, ArrowLeft, RefreshCw, X, UserCheck, School, Shield, User, Bell, RotateCcw, AlertTriangle, Upload, Download, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import AdminBadgeRequestsTab from './AdminBadgeRequestsTab';
import { sanitizeAcademicYears } from '../../../utils/academicYearUtils';
import { downloadStudentTemplate } from '../../../utils/studentTemplateUtils';

interface Props {
  onBack?: () => void;
}

interface LookupItem {
  id: number | string;
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

  // Bulk Upload States
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState<boolean>(false);
  const [isBulkParsing, setIsBulkParsing] = useState<boolean>(false);
  const [isBulkImporting, setIsBulkImporting] = useState<boolean>(false);
  const [bulkParseResult, setBulkParseResult] = useState<{
    allRows: any[];
    rejectedRows: any[];
    validRows: any[];
  } | null>(null);

  // In-App Delete Confirmation State
  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<{ id: number; name: string } | null>(null);

  // Pagination & Total Tracking State
  const [currentPage, setCurrentPage] = useState(0);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Lookups
  const [lookups, setLookups] = useState<{
    departments: LookupItem[];
    academicYears: LookupItem[];
    years: LookupItem[];
    semesters: LookupItem[];
    genders: LookupItem[];
    sections: LookupItem[];
    groups: LookupItem[];
    guardianRelations: string[];
  }>({
    departments: [],
    academicYears: [],
    years: [],
    semesters: [],
    genders: [],
    sections: [],
    groups: [],
    guardianRelations: []
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
      const guardianRelations = ['Father', 'Mother', 'Guardian', 'Parent'];

      setLookups({
        departments: depts,
        academicYears: sanitizeAcademicYears(ayRes?.data?.data || []),
        years: deduplicate(yearRes?.data?.data || []),
        semesters: deduplicate(semRes?.data?.data || []),
        genders: deduplicate(genRes?.data?.data || []),
        sections: secs,
        groups: deduplicate(teamRes?.data?.data || []),
        guardianRelations
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

  const fetchStudents = async (isRefresh = false) => {
    if (!isRefresh) setIsLoading(true);
    setCurrentPage(0);
    try {
      const response = await apiClient.get('/api/v1/students?page=0&size=1000&sortBy=fullName');
      if (response.data?.success || response.status === 200) {
        const raw = response.data.data;
        const list = Array.isArray(raw) ? raw : (raw?.content || response.data?.content || []);
        const total = raw?.totalElements ?? response.data?.totalElements ?? list.length;
        const pages = raw?.totalPages ?? response.data?.totalPages ?? 1;
        const isLast = raw?.last ?? (pages <= 1);

        setStudents(list);
        setTotalStudentsCount(total);
        setHasMore(!isLast && pages > 1);
        applyFilters(list, searchQuery, filterYear, filterDeptId, filterSectionId);
      }
    } catch (e) {
      logger.error("Failed to fetch students:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNextPage = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const response = await apiClient.get(`/api/v1/students?page=${nextPage}&size=1000&sortBy=fullName`);
      if (response.data?.success || response.status === 200) {
        const raw = response.data.data;
        const newList = Array.isArray(raw) ? raw : (raw?.content || response.data?.content || []);
        const total = raw?.totalElements ?? response.data?.totalElements ?? (students.length + newList.length);
        const pages = raw?.totalPages ?? response.data?.totalPages ?? 1;
        const isLast = raw?.last ?? (nextPage + 1 >= pages);

        setStudents(prev => {
          const existingIds = new Set(prev.map(s => s.id));
          const merged = [...prev];
          for (const item of newList) {
            if (!existingIds.has(item.id)) {
              merged.push(item);
              existingIds.add(item.id);
            }
          }
          applyFilters(merged, searchQuery, filterYear, filterDeptId, filterSectionId);
          return merged;
        });

        setCurrentPage(nextPage);
        setTotalStudentsCount(total);
        setHasMore(!isLast && nextPage + 1 < pages);
      }
    } catch (e) {
      logger.error("Failed to fetch next student page:", e);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleDownloadTemplate = async () => {
    const toastId = toast.loading('Downloading template...');
    try {
      const response = await apiClient.get('/api/v1/students/bulk-upload/template', {
        responseType: 'blob'
      });
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'SPDMS_Student_Bulk_Upload_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.dismiss(toastId);
      toast.success('Official Excel template downloaded!');
    } catch {
      try {
        downloadStudentTemplate();
        toast.dismiss(toastId);
        toast.success('Template downloaded to your downloads folder!');
      } catch (err: any) {
        toast.dismiss(toastId);
        toast.error('Failed to download student upload template');
      }
    }
  };

  const handleBulkFileParse = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBulkParsing(true);
    const toastId = toast.loading('Parsing student Excel file...');
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post('/api/v1/students/bulk-parse', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      toast.dismiss(toastId);
      if (res.data?.success && Array.isArray(res.data.data)) {
        const allRows: any[] = res.data.data;
        const rejectedRows = allRows.filter(
          (s: any) => s.errorReason && s.errorReason.toString().trim() !== ''
        );
        const validRows = allRows.filter(
          (s: any) => !s.errorReason || s.errorReason.toString().trim() === ''
        );

        setBulkParseResult({ allRows, rejectedRows, validRows });

        if (validRows.length > 0) {
          toast.success(`Parsed ${validRows.length} valid student rows.`);
        } else if (rejectedRows.length > 0) {
          toast.error(`${rejectedRows.length} rows have validation errors. Check the error details below.`);
        } else {
          toast.error('No valid student records found in the Excel file.');
        }
      } else {
        const msg = res.data?.message || 'Failed to parse Excel file';
        toast.error(msg, { duration: 6000 });
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to parse Excel file';
      toast.error(msg, { duration: 7000 });
    } finally {
      setIsBulkParsing(false);
      e.target.value = '';
    }
  };

  const handleBulkImport = async () => {
    if (!bulkParseResult || bulkParseResult.validRows.length === 0) {
      toast.error('No valid students to import');
      return;
    }

    setIsBulkImporting(true);
    const toastId = toast.loading(`Importing ${bulkParseResult.validRows.length} students...`);
    try {
      const res = await apiClient.post('/api/v1/students/bulk-import', bulkParseResult.validRows);
      toast.dismiss(toastId);
      if (res.data?.success || res.status === 200) {
        toast.success(`Successfully imported ${bulkParseResult.validRows.length} students!`);
        setIsBulkUploadModalOpen(false);
        setBulkParseResult(null);
        fetchStudents();
      } else {
        const errorMsg = res.data?.message || '';
        if (errorMsg.includes("propagation 'mandatory'") || errorMsg.includes('transaction')) {
          // Backend saved students via saveAllAndFlush before failing on optional audit log
          toast.success(`Successfully imported ${bulkParseResult.validRows.length} students!`);
          setIsBulkUploadModalOpen(false);
          setBulkParseResult(null);
          fetchStudents();
        } else {
          toast.error(errorMsg || 'Failed to import students');
        }
      }
    } catch (err: any) {
      toast.dismiss(toastId);
      const errorMsg = err.response?.data?.message || err.message || '';
      if (errorMsg.includes("propagation 'mandatory'") || errorMsg.includes('transaction')) {
        // Backend saved students via saveAllAndFlush before failing on optional audit log
        toast.success(`Successfully imported ${bulkParseResult.validRows.length} students!`);
        setIsBulkUploadModalOpen(false);
        setBulkParseResult(null);
        fetchStudents();
      } else {
        toast.error(errorMsg || 'Failed to import students');
      }
    } finally {
      setIsBulkImporting(false);
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
        if (!lookups.guardianRelations.includes(rel)) {
          if (rel.toUpperCase() === 'LOCAL_GUARDIAN') rel = 'Parent';
          else if (!lookups.guardianRelations.includes(rel)) rel = 'Guardian';
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
        name: formData.fullName.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        regNo: formData.regNo.trim(),
        studentId: formData.regNo.trim(),
        sprNo: formData.sprNo.trim(),
        active: formData.active,
        genderId: formData.genderId ? parseInt(formData.genderId) : null,
        dateOfBirth: formData.dob || null,
        dob: formData.dob || null,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        academicYearId: formData.academicYearId && !isNaN(parseInt(formData.academicYearId)) ? parseInt(formData.academicYearId) : null,
        academicYear: lookups.academicYears.find(ay => String(ay.id) === String(formData.academicYearId))?.academicYear || formData.academicYearId || undefined,
        yearId: formData.yearId ? parseInt(formData.yearId) : null,
        semesterId: formData.semesterId ? parseInt(formData.semesterId) : null,
        sectionId: formData.sectionId ? parseInt(formData.sectionId) : null,
        groupId: formData.groupId ? parseInt(formData.groupId) : null,
        teamId: formData.groupId ? parseInt(formData.groupId) : null,
      };

      if (formData.guardianName.trim()) {
        payload.guardian = {
          guardianName: formData.guardianName.trim(),
          relationship: formData.guardianRel || 'Guardian',
          phoneNo: formData.guardianPhone.trim() || '',
          email: formData.guardianEmail.trim() || ''
        };
        payload.guardianName = formData.guardianName.trim();
        payload.guardianRel = formData.guardianRel || 'Guardian';
        payload.guardianPhone = formData.guardianPhone.trim() || '';
        payload.guardianEmail = formData.guardianEmail.trim() || '';
      }

      if (formData.password.trim()) {
        payload.password = formData.password.trim();
      } else if (!editingStudent && formData.dob) {
        const parts = formData.dob.split("-");
        if (parts.length === 3) {
          payload.password = `${parts[2]}${parts[1]}${parts[0]}`;
        }
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
    <div className="flex flex-col min-h-full bg-bg relative pb-20">
      {/* Top Header Bar */}
      <div className="bg-card text-text-primary px-4 sm:px-6 py-4 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center space-x-3.5">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">Students Directory</h1>
            {!isLoading && (
              <p className="type-caption text-text-secondary font-medium">
                {searchQuery || filterYear !== 'All' || filterDeptId !== 'All' || filterSectionId !== 'All'
                  ? `Showing ${filteredStudents.length} of ${totalStudentsCount || students.length} students`
                  : (totalStudentsCount > 0 && totalStudentsCount > filteredStudents.length
                    ? `Showing ${filteredStudents.length} of ${totalStudentsCount} students`
                    : `Showing ${totalStudentsCount || filteredStudents.length} students`)}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Bulk Upload Button */}
          <button
            onClick={() => {
              setBulkParseResult(null);
              setIsBulkUploadModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg type-caption font-bold transition-colors flex items-center space-x-1.5 shadow-none cursor-pointer"
            title="Bulk Upload Students from Excel"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Bulk Upload</span>
          </button>

          {/* Notification Bell with Badge */}
          <button
            onClick={() => setIsBadgeModalOpen(true)}
            className="p-2 bg-card border border-border hover:bg-bg rounded-lg text-text-secondary hover:text-text-primary transition-colors relative cursor-pointer"
            title="Badge Requests"
          >
            <Bell className="w-4 h-4" />
            {pendingBadgeRequests > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-accent text-card text-[10px] font-black rounded-full flex items-center justify-center border-2 border-card">
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
            className="p-2 bg-card border border-border hover:bg-bg rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
            title="Refresh Directory"
          >
            <RefreshCw className={`w-4 h-4 text-accent ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto w-full space-y-6">
        {/* KPI Summary Row with Soft Colored Icon Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] group">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Total Enrolled</p>
              <h3 className="text-3xl font-black text-text-primary tracking-tight mt-1">{totalStudentsCount || students.length}</h3>
              <p className="text-xs font-medium text-text-secondary mt-0.5">Enrolled Student Roster</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50/90 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <User className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] group">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Active Status</p>
              <h3 className="text-3xl font-black text-emerald-600 tracking-tight mt-1">
                {students.filter(s => s.active !== false).length || totalStudentsCount}
              </h3>
              <p className="text-xs font-medium text-text-secondary mt-0.5">Verified Institutional Accounts</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50/90 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <UserCheck className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-between shadow-[0_1px_3px_rgba(0,0,0,0.03)] group">
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Filtered View</p>
              <h3 className="text-3xl font-black text-amber-600 tracking-tight mt-1">{filteredStudents.length}</h3>
              <p className="text-xs font-medium text-text-secondary mt-0.5">Matching Current Search/Filters</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50/90 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <School className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-2.5 items-center">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input 
              type="text" 
              placeholder="Search by student ID, name, or registration number..." 
              value={searchQuery}
              onChange={handleSearch}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  fetchStudents();
                }
              }}
              className="w-full pl-10 pr-10 py-2.5 bg-bg text-text-primary placeholder:text-text-muted border border-border rounded-lg focus:border-text-primary outline-none shadow-none type-body-sm font-semibold"
            />
            {searchQuery && (
              <button 
                onClick={() => {
                  setSearchQuery('');
                  applyFilters(students, '', filterYear, filterDeptId, filterSectionId);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              fetchStudents();
            }}
            className="px-4 py-2.5 bg-accent hover:bg-accent-hover text-card rounded-lg type-caption font-bold flex items-center space-x-1.5 shadow-none transition-colors cursor-pointer shrink-0"
            title="Search & Refresh from database"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>

        {/* Outline Filters Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Academic Year Dropdown */}
          <div className="relative">
            <label className="text-[10px] font-bold text-text-muted uppercase absolute -top-2 left-3 bg-bg px-1 z-1 type-form-label">Academic Year</label>
            <select
              value={filterYear}
              onChange={(e) => handleFilterYearChange(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 type-caption font-bold text-text-primary focus:border-text-primary outline-none cursor-pointer"
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
            <label className="text-[10px] font-bold text-text-muted uppercase absolute -top-2 left-3 bg-bg px-1 z-1 type-form-label">Department</label>
            <select
              value={filterDeptId}
              onChange={(e) => handleFilterDeptChange(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 type-caption font-bold text-text-primary focus:border-text-primary outline-none cursor-pointer"
            >
              <option value="All">All Departments</option>
              {lookups.departments.map((d: any) => (
                <option key={d.id} value={d.id}>{d.name || d.code || d.deptName}</option>
              ))}
            </select>
          </div>

          {/* Section Dropdown */}
          <div className="relative">
            <label className="text-[10px] font-bold text-text-muted uppercase absolute -top-2 left-3 bg-bg px-1 z-1 type-form-label">Section</label>
            <select
              value={filterSectionId}
              onChange={(e) => handleFilterSectionChange(e.target.value)}
              className="w-full bg-bg border border-border rounded-lg px-3 py-2.5 type-caption font-bold text-text-primary focus:border-text-primary outline-none cursor-pointer"
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
              className="type-caption font-bold text-accent hover:underline flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          </div>
        )}

        {/* Students List Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-accent" />
            <p className="type-body-sm text-text-secondary font-medium">Loading student roster...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-16 text-text-secondary bg-card rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.03)] border border-border space-y-2 p-8 flex flex-col items-center">
            <div className="w-12 h-12 rounded-xl bg-bg border border-border flex items-center justify-center text-text-muted mb-1">
              <User className="w-6 h-6" />
            </div>
            <p className="font-bold type-h5 text-text-primary">No students found matching current filters.</p>
            <p className="type-caption text-text-secondary">Try adjusting your search query or dropdown filters above.</p>
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
                <div key={student.id} className="bg-card rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-border p-4 flex flex-col md:flex-row md:items-center justify-between hover:border-accent/40 transition-all gap-3">
                  <div className="flex items-center space-x-3.5 pl-1 min-w-0">
                    <div className="w-11 h-11 bg-bg border border-border rounded-xl flex items-center justify-center text-accent font-black type-h5 shrink-0">
                      {name ? name[0].toUpperCase() : 'S'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h3 className="type-h5 font-bold text-text-primary truncate">{name}</h3>
                        <span className="type-fine font-extrabold text-accent bg-accent-tint px-2 py-0.5 rounded-md border border-accent/20 shrink-0">
                          {student.score ?? student.xp ?? student.points ?? 0} XP
                        </span>
                      </div>
                      <p className="type-caption text-text-secondary font-medium truncate mt-0.5">
                        {regNo} • {deptName} {semester ? `• ${semester}` : ''} • Year: {year} • Section: {section}
                      </p>
                      <p className="type-fine font-semibold text-text-muted mt-0.5 uppercase tracking-wider">
                        REG: {regNo} | SPR: {sprNo}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 pr-1 self-end md:self-center shrink-0">
                    <button 
                      onClick={() => openModal(student)} 
                      className="p-2 text-text-secondary hover:text-text-primary hover:bg-bg rounded-lg transition-colors cursor-pointer" 
                      title="Edit Student"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmStudent({ id: student.id, name })} 
                      className="p-2 text-text-secondary hover:text-accent hover:bg-accent-tint rounded-lg transition-colors cursor-pointer" 
                      title="Delete Student"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
            {hasMore && (
              <div className="flex justify-center pt-4 pb-2">
                <button
                  onClick={fetchNextPage}
                  disabled={isLoadingMore}
                  className="px-5 py-2.5 bg-card border border-border hover:bg-bg text-text-primary font-bold rounded-lg type-btn flex items-center space-x-2 shadow-none cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {isLoadingMore ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-accent" />
                      <span>Loading more students...</span>
                    </>
                  ) : (
                    <span>Load More Students</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => openModal()}
          className="w-14 h-14 bg-accent hover:bg-accent-hover text-card rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-all cursor-pointer"
          title="Add New Student"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Pending Badge Requests Modal triggered from Notification Bell */}
      {isBadgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-text-primary rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="type-h4 font-bold flex items-center gap-2 text-text-primary">
                <Bell className="w-5 h-5 text-accent" />
                <span>Pending Badge Requests</span>
              </h2>
              <button
                onClick={() => {
                  setIsBadgeModalOpen(false);
                  fetchPendingBadges();
                }}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-bg">
              <AdminBadgeRequestsTab onBack={() => { setIsBadgeModalOpen(false); fetchPendingBadges(); }} />
            </div>
          </div>
        </div>
      )}

      {/* In-App Delete Confirmation Modal */}
      {deleteConfirmStudent && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-border space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="type-h5 font-bold text-text-primary">Delete Student</h3>
              <p className="type-caption text-text-secondary leading-relaxed">
                Move <strong className="text-text-primary font-bold">{deleteConfirmStudent.name}</strong> to the Recycle Bin? This can be restored later.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmStudent(null)}
                className="flex-1 py-2.5 px-4 rounded-lg border border-border type-caption font-bold text-text-secondary hover:text-text-primary hover:bg-bg transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="flex-1 py-2.5 px-4 rounded-lg bg-accent hover:bg-accent-hover text-card type-caption font-bold shadow-none transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal for Add/Edit Student */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-card rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 md:p-6 border-b border-border flex justify-between items-center bg-card rounded-t-2xl">
              <h2 className="type-h4 font-bold text-text-primary">
                {editingStudent ? 'Edit Student Details' : 'Add New Student'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-text-muted hover:text-text-primary p-1.5 rounded-lg hover:bg-bg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="overflow-y-auto p-4 md:p-6 space-y-6 bg-bg">
              {/* Section 1: Basic Information */}
              <div className="bg-card rounded-xl p-4 border border-border shadow-xs space-y-4">
                <h3 className="type-body-sm font-bold text-text-primary tracking-wide flex items-center space-x-2">
                  <User className="w-4 h-4 text-accent" />
                  <span>Basic Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">
                      Register Number <span className="text-accent">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      disabled={!!editingStudent}
                      value={formData.regNo} 
                      onChange={e => setFormData({...formData, regNo: e.target.value})} 
                      placeholder="e.g. 24CSC122"
                      className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold disabled:bg-bg disabled:text-text-muted bg-card text-text-primary" 
                    />
                  </div>

                  <div>
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">
                      Full Name <span className="text-accent">*</span>
                    </label>
                    <input 
                      type="text" 
                      required 
                      value={formData.fullName} 
                      onChange={e => setFormData({...formData, fullName: e.target.value})} 
                      placeholder="e.g. Abishek"
                      className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">
                      Email Address <span className="text-accent">*</span>
                    </label>
                    <input 
                      type="email" 
                      required 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      placeholder="student@jjcet.ac.in"
                      className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary" 
                    />
                  </div>

                  <div>
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">Phone Number</label>
                    <input 
                      type="text" 
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">SPR Number</label>
                    <input 
                      type="text" 
                      value={formData.sprNo} 
                      onChange={e => setFormData({...formData, sprNo: e.target.value})} 
                      placeholder="e.g. SPR24CS022"
                      className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary" 
                    />
                  </div>

                  <div>
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">Gender</label>
                    <select 
                      value={formData.genderId} 
                      onChange={e => setFormData({...formData, genderId: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary bg-card text-text-primary type-body-sm font-semibold cursor-pointer"
                    >
                      <option value="">-- Select Gender --</option>
                      {lookups.genders.map(g => (
                        <option key={g.id} value={g.id}>{g.genderName || g.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">Date of Birth</label>
                    <input 
                      type="date" 
                      value={formData.dob} 
                      onChange={e => setFormData({...formData, dob: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary cursor-pointer" 
                    />
                  </div>
                </div>

                <div>
                  <label className="type-form-label text-text-secondary font-bold mb-1 block">Address</label>
                  <textarea 
                    rows={2} 
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    placeholder="Enter residential address"
                    className="w-full px-3 py-2 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary resize-none"
                  />
                </div>
              </div>

              {/* Section 2: Guardian Information */}
              <div className="bg-card rounded-xl p-4 border border-border shadow-xs space-y-4">
                <h3 className="type-body-sm font-bold text-text-primary tracking-wide flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-accent" />
                  <span>Guardian Details</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">Guardian Name</label>
                    <input 
                      type="text" 
                      value={formData.guardianName} 
                      onChange={e => setFormData({...formData, guardianName: e.target.value})} 
                      placeholder="e.g. Parent Name"
                      className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary" 
                    />
                  </div>

                  <div>
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">Relationship</label>
                    <select 
                      value={formData.guardianRel} 
                      onChange={e => setFormData({...formData, guardianRel: e.target.value})}
                      className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary bg-card text-text-primary type-body-sm font-semibold cursor-pointer"
                    >
                      {lookups.guardianRelations.map(rel => (
                        <option key={rel} value={rel}>{rel}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">Guardian Phone</label>
                    <input 
                      type="text" 
                      value={formData.guardianPhone} 
                      onChange={e => setFormData({...formData, guardianPhone: e.target.value})} 
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary" 
                    />
                  </div>

                  <div>
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">Guardian Email</label>
                    <input 
                      type="email" 
                      value={formData.guardianEmail} 
                      onChange={e => setFormData({...formData, guardianEmail: e.target.value})} 
                      placeholder="guardian@example.com"
                      className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary type-body-sm font-semibold bg-card text-text-primary" 
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Academic Details */}
              <div className="bg-card rounded-xl p-4 border border-border shadow-xs space-y-4">
                <h3 className="type-body-sm font-bold text-text-primary tracking-wide flex items-center space-x-2">
                  <School className="w-4 h-4 text-accent" />
                  <span>Academic Information</span>
                </h3>

                <div>
                  <label className="type-form-label text-text-secondary font-bold mb-1 block">Department</label>
                  <select 
                    value={formData.departmentId} 
                    onChange={e => handleDepartmentChange(e.target.value)} 
                    className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary bg-card text-text-primary type-body-sm font-semibold cursor-pointer"
                  >
                    <option value="">-- Select Department --</option>
                    {lookups.departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name || d.code || d.deptName}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">Academic Year</label>
                    <select 
                      value={formData.academicYearId} 
                      onChange={e => setFormData({...formData, academicYearId: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary bg-card text-text-primary type-body-sm font-semibold cursor-pointer"
                    >
                      <option value="">-- Select Academic Year --</option>
                      {lookups.academicYears.map(ay => (
                        <option key={ay.id} value={ay.id}>{ay.year || ay.academicYear || ay.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">Year</label>
                    <select 
                      value={formData.yearId} 
                      onChange={e => setFormData({...formData, yearId: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary bg-card text-text-primary type-body-sm font-semibold cursor-pointer"
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
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">Semester</label>
                    <select 
                      value={formData.semesterId} 
                      onChange={e => setFormData({...formData, semesterId: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary bg-card text-text-primary type-body-sm font-semibold cursor-pointer"
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
                    <label className="type-form-label text-text-secondary font-bold mb-1 block">Section</label>
                    {isFetchingSections ? (
                      <div className="flex items-center space-x-2 py-2.5 type-caption text-text-muted">
                        <RefreshCw className="w-4 h-4 animate-spin text-accent" />
                        <span>Loading sections...</span>
                      </div>
                    ) : (
                      <select 
                        value={formData.sectionId} 
                        onChange={e => setFormData({...formData, sectionId: e.target.value})} 
                        className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary bg-card text-text-primary type-body-sm font-semibold cursor-pointer"
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

              {/* Section 4: Account & Group Details */}
              <div className="bg-card rounded-xl p-4 border border-border shadow-xs space-y-4">
                <h3 className="type-body-sm font-bold text-text-primary tracking-wide flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-accent" />
                  <span>Account & Group</span>
                </h3>

                <div>
                  <label className="type-form-label text-text-secondary font-bold mb-1 block">Group / Team</label>
                  <select 
                    value={formData.groupId} 
                    onChange={e => setFormData({...formData, groupId: e.target.value})} 
                    className="w-full px-3 py-2.5 border border-border rounded-lg outline-none focus:border-text-primary bg-card text-text-primary type-body-sm font-semibold cursor-pointer"
                  >
                    <option value="">-- Select Group --</option>
                    {lookups.groups.map(grp => (
                      <option key={grp.id} value={grp.id}>
                        {grp.groupName || grp.name || grp.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="type-body-sm font-bold text-text-primary">Active Account</span>
                  <label className="relative inline-flex items-center cursor-pointer type-form-label">
                    <input 
                      type="checkbox" 
                      checked={formData.active} 
                      onChange={e => setFormData({...formData, active: e.target.checked})} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-card after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-2.5 pt-3 border-t border-border">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2.5 text-text-secondary hover:text-text-primary type-btn font-bold hover:bg-bg border border-border rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-card font-bold rounded-lg transition-all type-btn shadow-none cursor-pointer"
                >
                  {editingStudent ? 'Update Student' : 'Save Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {isBulkUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-border animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between text-text-primary">
              <div className="flex items-center space-x-2.5">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h3 className="type-h4 font-bold text-text-primary">Bulk Student Upload</h3>
              </div>
              <button
                onClick={() => {
                  setIsBulkUploadModalOpen(false);
                  setBulkParseResult(null);
                }}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-bg rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-bg">
              {/* Step 1: Download Template */}
              <div className="bg-card p-5 rounded-xl border border-border shadow-xs space-y-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-accent-tint border border-accent/20 text-accent font-black type-caption flex items-center justify-center">
                    1
                  </div>
                  <h4 className="font-bold type-body-sm text-text-primary">Download Excel Template</h4>
                </div>
                <p className="type-caption text-text-secondary leading-relaxed font-medium">
                  Download the formatted student import template containing all required academic and guardian columns.
                </p>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg type-caption font-bold transition-colors flex items-center justify-center space-x-2 shadow-none cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Excel Template (.xlsx)</span>
                </button>
              </div>

              {/* Step 2: Upload Excel File */}
              <div className="bg-card p-5 rounded-xl border border-border shadow-xs space-y-3">
                <div className="flex items-center space-x-2.5">
                  <div className="w-7 h-7 rounded-full bg-accent-tint border border-accent/20 text-accent font-black type-caption flex items-center justify-center">
                    2
                  </div>
                  <h4 className="font-bold type-body-sm text-text-primary">Choose Excel File &amp; Parse</h4>
                </div>
                <p className="type-caption text-text-secondary leading-relaxed font-medium">
                  Fill in the student details and select the completed Excel file to validate and parse.
                </p>
                <label className="type-form-label w-full py-2.5 bg-accent hover:bg-accent-hover text-card rounded-lg font-bold transition-colors flex items-center justify-center space-x-2 shadow-none cursor-pointer">
                  {isBulkParsing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Validating Excel File...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Choose Excel File (.xlsx, .xls)</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept=".xlsx, .xls"
                    disabled={isBulkParsing || isBulkImporting}
                    onChange={handleBulkFileParse}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Step 3: Parse Result Summary */}
              {bulkParseResult && (
                <div className="bg-card p-5 rounded-xl border border-border shadow-xs space-y-4 animate-in fade-in duration-200">
                  <h4 className="font-bold type-body-sm text-text-primary flex items-center justify-between">
                    <span>Validation Summary</span>
                    <span className="type-caption font-bold text-text-muted">
                      Total: {bulkParseResult.allRows.length} rows
                    </span>
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                      <span className="block type-h3 font-black text-emerald-700">
                        {bulkParseResult.validRows.length}
                      </span>
                      <span className="type-fine font-bold text-emerald-800 uppercase tracking-wider">
                        Valid Rows
                      </span>
                    </div>

                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                      <span className="block type-h3 font-black text-rose-700">
                        {bulkParseResult.rejectedRows.length}
                      </span>
                      <span className="type-fine font-bold text-rose-800 uppercase tracking-wider">
                        Rejected Rows
                      </span>
                    </div>
                  </div>

                  {/* Rejected Rows Details */}
                  {bulkParseResult.rejectedRows.length > 0 && (
                    <div className="space-y-2">
                      <p className="type-caption font-bold text-rose-600 flex items-center space-x-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Rejected Rows &amp; Reasons:</span>
                      </p>
                      <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-rose-50/50 rounded-xl border border-rose-100 type-caption">
                        {bulkParseResult.rejectedRows.map((r, idx) => (
                          <div key={idx} className="p-2 bg-card rounded-lg border border-rose-200 text-text-primary">
                            <span className="font-bold text-text-primary">{r.fullName || 'Unnamed'}</span>{' '}
                            <span className="font-mono text-text-muted">({r.regNo || 'No Reg'})</span>:
                            <span className="text-rose-600 font-semibold block mt-0.5">{r.errorReason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Import Button */}
                  {bulkParseResult.validRows.length > 0 && (
                    <button
                      type="button"
                      onClick={handleBulkImport}
                      disabled={isBulkImporting}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg type-caption font-bold transition-all shadow-none flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                    >
                      {isBulkImporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Importing {bulkParseResult.validRows.length} Students...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Confirm &amp; Import {bulkParseResult.validRows.length} Valid Students</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-card border-t border-border flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsBulkUploadModalOpen(false);
                  setBulkParseResult(null);
                }}
                className="px-5 py-2 text-text-secondary hover:text-text-primary type-btn font-bold hover:bg-bg border border-border rounded-lg transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
