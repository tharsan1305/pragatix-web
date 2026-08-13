import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, ArrowLeft, RefreshCw, X, UserCheck, School, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

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
  }, []);

  const fetchLookups = async () => {
    try {
      const [deptRes, ayRes, yearRes, semRes, genRes, secRes, teamRes] = await Promise.all([
        apiClient.get('/api/v1/admin/departments'),
        apiClient.get('/api/v1/admin/academic-years'),
        apiClient.get('/api/v1/admin/years'),
        apiClient.get('/api/v1/admin/semesters'),
        apiClient.get('/api/v1/admin/genders'),
        apiClient.get('/api/v1/admin/sections'),
        apiClient.get('/api/v1/teams')
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

      setLookups({
        departments: deduplicate(deptRes.data?.data || []),
        academicYears: deduplicate(ayRes.data?.data || []),
        years: deduplicate(yearRes.data?.data || []),
        semesters: deduplicate(semRes.data?.data || []),
        genders: deduplicate(genRes.data?.data || []),
        sections: deduplicate(secRes.data?.data || []),
        groups: deduplicate(teamRes.data?.data || [])
      });
    } catch (e) {
      console.error("Failed to fetch lookups:", e);
    }
  };

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.get('/api/v1/students?page=0&size=100&sortBy=fullName');
      if (response.data?.success) {
        const raw = response.data.data;
        const list = Array.isArray(raw) ? raw : (raw?.content || response.data?.content || []);
        setStudents(list);
        setFilteredStudents(list);
      }
    } catch (e) {
      console.error("Failed to fetch students:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSectionsForDept = async (deptId: string | number) => {
    if (!deptId) {
      setDeptSections([]);
      return;
    }
    setIsFetchingSections(true);
    try {
      const res = await apiClient.get(`/api/v1/admin/departments/${deptId}/sections`);
      if (res.data?.success && Array.isArray(res.data.data)) {
        setDeptSections(res.data.data);
      } else {
        setDeptSections(lookups.sections);
      }
    } catch (e) {
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
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    if (!query) {
      setFilteredStudents(students);
    } else {
      setFilteredStudents(students.filter(s => 
        (s.fullName || '').toLowerCase().includes(query) ||
        (s.registerNumber || s.regNo || '').toLowerCase().includes(query) ||
        (s.sprNo || '').toLowerCase().includes(query)
      ));
    }
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
        sprNo: formData.sprNo.trim(),
        dateOfBirth: formData.dob || null,
        address: formData.address.trim(),
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        academicYearId: formData.academicYearId ? parseInt(formData.academicYearId) : null,
        yearId: formData.yearId ? parseInt(formData.yearId) : null,
        semesterId: formData.semesterId ? parseInt(formData.semesterId) : null,
        genderId: formData.genderId ? parseInt(formData.genderId) : null,
        sectionId: formData.sectionId ? parseInt(formData.sectionId) : null,
        teamId: formData.groupId ? parseInt(formData.groupId) : null,
        active: formData.active
      };

      if (formData.guardianName.trim()) {
        payload.guardian = {
          guardianName: formData.guardianName.trim(),
          relationship: formData.guardianRel || 'Guardian',
          phoneNo: formData.guardianPhone.trim(),
          email: formData.guardianEmail.trim()
        };
      }

      if (editingStudent) {
        if (formData.password.trim()) {
          payload.password = formData.password.trim();
        }
        await apiClient.put(`/api/v1/students/${editingStudent.id}`, payload);
      } else {
        payload.regNo = formData.regNo.trim();
        let pass = formData.password.trim();
        if (!pass && formData.dob) {
          const parts = formData.dob.split('-');
          if (parts.length === 3) {
            pass = `${parts[2]}${parts[1]}${parts[0]}`;
          }
        }
        if (!pass) {
          toast.dismiss(toastId);
          toast.error('Set a Password, or provide Date of Birth to derive a default password.');
          return;
        }
        payload.password = pass;
        await apiClient.post('/api/v1/students', payload);
      }
      toast.dismiss(toastId);
      toast.success("Student saved successfully");
      setIsModalOpen(false);
      fetchStudents();
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error("Save error:", e);
      toast.error(e.response?.data?.message || 'Failed to save student. Please check input fields.');
    }
  };

  const handleDelete = async (id: number) => {
    const toastId = toast.loading("Deleting student...");
    try {
      await apiClient.delete(`/api/v1/students/${id}`);
      toast.dismiss(toastId);
      toast.success("Student deleted successfully");
      fetchStudents();
    } catch (e: any) {
      toast.dismiss(toastId);
      console.error(e);
      toast.error(e.response?.data?.message || 'Failed to delete student.');
    }
  };

  const activeSections = deptSections.length > 0 ? deptSections : lookups.sections;

  return (
    <div className="flex flex-col min-h-full bg-slate-50 relative pb-20">
      <div className="bg-slate-900 px-6 pt-12 pb-4 shadow-md z-10">
        <div className="flex items-center space-x-4 mb-2">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="text-2xl font-bold text-white flex-1">Student Management</h1>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
        <div className="mb-6 relative">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search students by name, reg no, SPR..." 
            value={searchQuery}
            onChange={handleSearch}
            className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => { setSearchQuery(''); setFilteredStudents(students); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-10 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">
            No students found.
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

              return (
                <div key={student.id} className="bg-white rounded-xl shadow-sm border border-slate-100 p-3 flex flex-col md:flex-row md:items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex items-center space-x-4 pl-2 mb-2 md:mb-0">
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-lg shrink-0">
                      {name ? name[0].toUpperCase() : 'S'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-slate-900 text-[15px]">{name}</h3>
                        <span className="text-[11px] font-extrabold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                          {student.score ?? student.xp ?? student.points ?? 0} XP
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{deptName} • {year} • {section}</p>
                      <p className="text-[11px] font-medium text-slate-400 mt-1 uppercase tracking-wider">REG: {regNo} | SPR: {sprNo}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1 pr-2 self-end md:self-center">
                    <button onClick={() => openModal(student)} className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="Edit Student">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(student.id)} className="p-2.5 text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Delete Student">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FAB Add Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => openModal()}
          className="w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800 hover:scale-105 transition-all"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {/* Modal matching Flutter EditStudentDialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 md:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-slate-200">
            {/* Header matching Flutter style (0xFF1E293B) */}
            <div className="bg-[#1E293B] px-6 py-4 flex items-center justify-between text-white shrink-0">
              <div className="flex items-center space-x-3">
                <Edit2 className="w-5 h-5 text-white" />
                <h2 className="text-lg font-bold">
                  {editingStudent ? 'Edit Student' : 'Register New Student'}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 bg-slate-50/50">
              {/* Section 1: Personal Information */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-700 tracking-wide flex items-center space-x-2">
                  <User className="w-4 h-4 text-slate-500" />
                  <span>Personal Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Student ID *</label>
                    <input 
                      required 
                      disabled={!!editingStudent}
                      type="text" 
                      value={formData.regNo} 
                      onChange={e => setFormData({...formData, regNo: e.target.value})} 
                      className={`w-full px-3 py-2.5 border border-slate-300 rounded-lg outline-none text-sm transition-all ${
                        editingStudent ? 'bg-slate-100 text-slate-500 cursor-not-allowed' : 'focus:ring-2 focus:ring-slate-900 bg-white'
                      }`} 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Full Name *</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.fullName} 
                      onChange={e => setFormData({...formData, fullName: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Email *</label>
                    <input 
                      required 
                      type="email" 
                      value={formData.email} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Phone</label>
                    <input 
                      type="text" 
                      maxLength={10}
                      value={formData.phone} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">SPR No</label>
                    <input 
                      type="text" 
                      value={formData.sprNo} 
                      onChange={e => setFormData({...formData, sprNo: e.target.value})} 
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
                        <option key={g.id} value={g.id}>
                          {g.genderName || g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Address</label>
                  <textarea 
                    rows={2}
                    value={formData.address} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 mb-1 block">Date of Birth</label>
                  <div className="relative">
                    <input 
                      type="date" 
                      value={formData.dob} 
                      onChange={e => setFormData({...formData, dob: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Guardian Information */}
              <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-slate-700 tracking-wide flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-slate-500" />
                  <span>Guardian Information</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Guardian Name *</label>
                    <input 
                      type="text" 
                      value={formData.guardianName} 
                      onChange={e => setFormData({...formData, guardianName: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Relationship (e.g. Father, Mother) *</label>
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
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Guardian Phone *</label>
                    <input 
                      type="text" 
                      maxLength={10}
                      value={formData.guardianPhone} 
                      onChange={e => setFormData({...formData, guardianPhone: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-600 mb-1 block">Guardian Email</label>
                    <input 
                      type="email" 
                      value={formData.guardianEmail} 
                      onChange={e => setFormData({...formData, guardianEmail: e.target.value})} 
                      className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-sm bg-white" 
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Academic Information */}
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
                      <option key={d.id} value={d.id}>
                        {d.code || d.name}
                      </option>
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
                        <option key={ay.id} value={ay.id}>
                          {ay.academicYear}
                        </option>
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
                  className="px-5 py-2.5 text-slate-600 font-semibold hover:bg-slate-200/60 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 bg-[#1E293B] text-white font-semibold rounded-xl hover:bg-slate-800 transition-all text-sm shadow-sm"
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

