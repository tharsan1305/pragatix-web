import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, UserPlus, RefreshCw, Sparkles, X, Trash2, ShieldAlert, FileText, CheckCircle2, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../store/authContext';
import apiClient from '../../../services/apiClient';
import studentService from '../../../services/studentService';

export default function StudentsDirectoryPage() {
  const navigate = useNavigate();
  const { role, subRoles } = useAuth();
  const isCc = subRoles?.includes('CLASS_COORDINATOR') || subRoles?.includes('CC') || role === 'CLASS_COORDINATOR';
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals State
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [semesters, setSemesters] = useState<any[]>([]);
  const [genders, setGenders] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [ccInfo, setCcInfo] = useState<any>(null);

  // Dynamic sections per selected department
  const [createDeptSections, setCreateDeptSections] = useState<any[]>([]);
  const [selectedCreateDeptId, setSelectedCreateDeptId] = useState<string>('');

  const [editDeptSections, setEditDeptSections] = useState<any[]>([]);

  // Excel Bulk Upload State
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [_isUploading, setIsUploading] = useState(false);
  const [parsedStudents, setParsedStudents] = useState<any[]>([]);
  const [checkedStates, setCheckedStates] = useState<boolean[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [rejectedRows, setRejectedRows] = useState<any[]>([]);
  
  // Discipline Report Monitor State (Matching Flutter _showReportMonitorDialog)
  const [isReportMonitorOpen, setIsReportMonitorOpen] = useState(false);
  const [reportRegNo, setReportRegNo] = useState('');
  const [isSearchingReport, setIsSearchingReport] = useState(false);
  const [reportLogs, setReportLogs] = useState<any[]>([]);
  const [reportStudentInfo, setReportStudentInfo] = useState<any | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    fetchStudents();
    fetchLookups();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/students?page=0&size=100&sortBy=fullName');
      if (res.data.success) {
        setStudents(res.data.data?.content || []);
      }
    } catch (e) {
      logger.error('Failed to load students', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      // CC users already have their department/section fixed via ccInfo below
      // (locked in the form UI); skip the unscoped institution-wide lookups for them.
      const [deptRes, ayRes, yearsRes, semRes, genRes, sectionsRes, teamRes, ccRes] = await Promise.allSettled([
        isCc ? Promise.resolve(null) : apiClient.get('/api/v1/admin/departments'),
        apiClient.get('/api/v1/admin/academic-years'),
        apiClient.get('/api/v1/admin/years'),
        apiClient.get('/api/v1/admin/semesters'),
        apiClient.get('/api/v1/admin/genders'),
        isCc ? Promise.resolve(null) : apiClient.get('/api/v1/admin/sections'),
        apiClient.get('/api/v1/teams'),
        apiClient.get('/api/v1/cc/class-details')
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

      if (deptRes.status === 'fulfilled' && deptRes.value?.data?.data) {
        const dList = deduplicate(deptRes.value.data.data);
        setDepartments(dList);
        if (dList.length > 0) {
          setSelectedCreateDeptId(String(dList[0].id));
          fetchSectionsForDept(dList[0].id, false);
        }
      }

      if (ayRes.status === 'fulfilled' && ayRes.value.data?.data) {
        setAcademicYears(deduplicate(ayRes.value.data.data));
      }
      if (yearsRes.status === 'fulfilled' && yearsRes.value.data?.data) {
        setYears(deduplicate(yearsRes.value.data.data));
      }
      if (semRes.status === 'fulfilled' && semRes.value.data?.data) {
        setSemesters(deduplicate(semRes.value.data.data));
      }
      if (genRes.status === 'fulfilled' && genRes.value.data?.data) {
        setGenders(deduplicate(genRes.value.data.data));
      }
      if (sectionsRes.status === 'fulfilled' && sectionsRes.value?.data?.data) {
        setSections(deduplicate(sectionsRes.value.data.data));
      }
      if (teamRes.status === 'fulfilled' && teamRes.value.data?.data) {
        setGroups(deduplicate(teamRes.value.data.data));
      }

      if (ccRes.status === 'fulfilled' && ccRes.value.data?.data) {
        setCcInfo(ccRes.value.data.data);
      } else {
        try {
          const meRes = await apiClient.get('/api/v1/auth/me');
          if (meRes.data?.success && meRes.data?.data) {
            const p = meRes.data.data;
            if (p.role === 'CLASS_COORDINATOR' || p.teamRole === 'CLASS_COORDINATOR') {
              setCcInfo({
                departmentId: p.departmentId,
                departmentName: p.departmentName || p.department,
                sectionId: p.sectionId,
                sectionName: p.sectionName || p.section,
                year: p.year
              });
            }
          }
        } catch (_) {}
      }
    } catch (e) {
      logger.error('Failed to load lookups', e);
    }
  };

  const fetchSectionsForDept = async (deptId: string | number, isEdit = false) => {
    if (!deptId) {
      if (isEdit) setEditDeptSections([]);
      else setCreateDeptSections([]);
      return;
    }
    try {
      const res = await apiClient.get(`/api/v1/admin/departments/${deptId}/sections`);
      const list = Array.isArray(res.data?.data) ? res.data.data : [];
      if (isEdit) setEditDeptSections(list.length > 0 ? list : sections);
      else setCreateDeptSections(list.length > 0 ? list : sections);
    } catch (e) {
      if (isEdit) setEditDeptSections(sections);
      else setCreateDeptSections(sections);
    }
  };

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    const toastId = toast.loading("Uploading and parsing Excel sheet...");
    try {
      const res = await studentService.bulkParse(file);
      toast.dismiss(toastId);
      
      const allRows = res.data?.data || res.data || [];
      if (!Array.isArray(allRows)) {
        toast.error("Invalid response format from server");
        return;
      }

      const rejected = allRows.filter((s: any) => s.errorReason && String(s.errorReason).trim().length > 0);
      let parsed = allRows.filter((s: any) => !s.errorReason || String(s.errorReason).trim().length === 0);

      setRejectedRows(rejected);

      if (rejected.length > 0) {
        toast.error(`${rejected.length} rows have errors and were skipped.`, { duration: 5000 });
      }

      if (parsed.length === 0) {
        toast.error("No valid student records found in the Excel sheet.");
        return;
      }

      if (ccInfo) {
        parsed = parsed.map((s: any) => {
          const item = { ...s };
          if (ccInfo.departmentId) item.departmentId = ccInfo.departmentId;
          if (ccInfo.year) {
            const yrMatch = years.find((y: any) => 
              String(y.yearNo) === String(ccInfo.year) || 
              String(y.yearName).toLowerCase().includes(String(ccInfo.year).toLowerCase())
            );
            if (yrMatch) item.yearId = yrMatch.id;
            item.year = ccInfo.year;
          }
          if (ccInfo.sectionId) item.sectionId = ccInfo.sectionId;
          if (ccInfo.sectionName) item.section = ccInfo.sectionName;
          return item;
        });
      }

      setParsedStudents(parsed);
      setCheckedStates(new Array(parsed.length).fill(true));
      setIsVerificationModalOpen(true);
      setIsBulkUploadModalOpen(false);
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || err.message || "Failed to parse file");
    } finally {
      setIsUploading(false);
    }
  };



  const deleteStudent = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      const res = await apiClient.delete(`/api/v1/students/${id}`);
      if (res.data.success) {
        alert("Deleted successfully");
        fetchStudents();
      }
    } catch (e: any) {
      alert(e.response?.data?.message || "Delete failed");
    }
  };

  const filteredStudents = students.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (s.fullName || '').toLowerCase().includes(q) || 
           (s.studentId || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 relative">
      <div className="bg-slate-900 px-6 pt-12 pb-6 flex items-center shadow-md">
        <button onClick={() => navigate(-1)} className="mr-4 p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-white flex-1 truncate">Students Directory</h1>
        
        {/* Header Icons to match Flutter 1:1 */}
        <div className="flex items-center space-x-2 text-white">
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="p-2 hover:bg-slate-800 rounded-full transition-colors cursor-pointer" 
            title="Add Student"
          >
            <UserPlus className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsReportMonitorOpen(true)} 
            className="p-2 hover:bg-slate-800 rounded-full transition-colors cursor-pointer text-amber-300 hover:text-amber-200" 
            title="Discipline Report Monitor"
          >
            <Sparkles className="w-5 h-5" />
          </button>
          <button 
            onClick={fetchStudents} 
            className="p-2 hover:bg-slate-800 rounded-full transition-colors cursor-pointer" 
            title="Refresh List"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="p-4 max-w-5xl mx-auto w-full flex-1 flex flex-col relative pb-24">
        {/* Search Bar matching Flutter */}
        <div className="relative mb-6 mx-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search by student name or reg n..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-12 py-3 bg-white border border-slate-300 rounded-2xl shadow-sm focus:ring-2 focus:ring-teal-500 outline-none text-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">No students found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map(student => (
              <div 
                key={student.id} 
                onClick={() => navigate(`/students/${student.id}`)}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xl">
                    {student.fullName?.charAt(0) || 'S'}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 mr-1">
                      {student.score ?? student.xp ?? student.points ?? 0} pts
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingStudent(student);
                        setIsEditModalOpen(true);
                      }} 
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Student"
                    >
                      <Pencil className="w-4 h-4 text-indigo-600" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteStudent(student.id); }} 
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete Student"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 text-lg truncate">{student.fullName}</h3>
                <div className="text-xs text-slate-500 space-y-0.5 mt-1">
                  <p><span className="font-medium text-slate-700">Reg No:</span> {student.studentId || student.regNo || student.registerNumber || 'N/A'}</p>
                  {(student.sprNo || student.spr_no) && (
                    <p><span className="font-medium text-slate-700">SPR:</span> {student.sprNo || student.spr_no}</p>
                  )}
                  <p>Year: {student.year || 'N/A'} • Section: {student.section || 'N/A'}</p>
                  <p>Dept: {student.departmentName || 'N/A'}</p>
                  {student.email && <p className="truncate text-slate-400 mt-1">Email: {student.email}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button for Add Students (Teal pill) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button 
          onClick={() => setIsOptionsModalOpen(true)}
          className="bg-[#0D9488] hover:bg-[#0F766E] text-white px-5 py-3 rounded-full font-semibold flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
        >
          <Plus className="w-5 h-5" /> Add Students
        </button>
      </div>

      {/* Options Modal (matches Flutter) */}
      {isOptionsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-800 mb-4">Add Students</h2>
              
              <div 
                className="flex items-start gap-4 p-4 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors mb-2"
                onClick={() => {
                  setIsOptionsModalOpen(false);
                  setIsModalOpen(true);
                }}
              >
                <div className="text-teal-600 mt-1">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Register Single Student</h3>
                  <p className="text-xs text-slate-500 mt-1">Enter Name, Reg No, DOB, and details manually</p>
                </div>
              </div>

              <div className="w-full h-px bg-slate-100 my-2"></div>

              <div 
                className="flex items-start gap-4 p-4 hover:bg-slate-50 cursor-pointer rounded-xl transition-colors"
                onClick={() => {
                  setIsOptionsModalOpen(false);
                  setIsBulkUploadModalOpen(true);
                }}
              >
                <div className="text-green-600 mt-1">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">Excel Bulk Upload</h3>
                  <p className="text-xs text-slate-500 mt-1">Upload spreadsheet with columns mapping details</p>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 flex justify-end">
              <button 
                onClick={() => setIsOptionsModalOpen(false)} 
                className="font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Single Student Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                Register Single Student
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={async (e) => { 
              e.preventDefault(); 
              const form = e.currentTarget;
              const formData = new FormData(form);

              const dobVal = (formData.get("dob") as string) || "";
              let password = "";
              if (dobVal) {
                const parts = dobVal.split("-");
                if (parts.length === 3) {
                  password = `${parts[2]}${parts[1]}${parts[0]}`;
                }
              }

              const data: any = {
                fullName: (formData.get("fullName") as string)?.trim(),
                regNo: (formData.get("registerNumber") as string)?.trim(),
                email: (formData.get("email") as string)?.trim(),
                phone: (formData.get("phone") as string)?.trim() || "",
                address: (formData.get("address") as string)?.trim() || "",
                dateOfBirth: dobVal || null,
                dob: dobVal || null,
                password: password || undefined,
                sprNo: (formData.get("sprNo") as string)?.trim() || "",
                departmentId: isCc ? ccInfo?.departmentId : (formData.get("departmentId") ? Number(formData.get("departmentId")) : null),
                academicYearId: formData.get("academicYearId") ? Number(formData.get("academicYearId")) : null,
                yearId: isCc ? (years.find(y => String(y.yearNo) === String(ccInfo?.year) || y.yearName === ccInfo?.year)?.id || null) : (formData.get("yearId") ? Number(formData.get("yearId")) : null),
                semesterId: formData.get("semesterId") ? Number(formData.get("semesterId")) : null,
                genderId: formData.get("genderId") ? Number(formData.get("genderId")) : null,
                sectionId: isCc ? ccInfo?.sectionId : (formData.get("sectionId") ? Number(formData.get("sectionId")) : null),
                groupId: formData.get("groupId") ? Number(formData.get("groupId")) : null,
                active: true,
              };

              const guardianName = (formData.get("guardianName") as string)?.trim();
              if (guardianName) {
                data.guardian = {
                  guardianName,
                  relationship: (formData.get("guardianRel") as string) || "Guardian",
                  phoneNo: (formData.get("guardianPhone") as string)?.trim() || "",
                  email: (formData.get("guardianEmail") as string)?.trim() || ""
                };
              }

              try {
                await apiClient.post('/api/v1/students', data);
                toast.success("Student registered successfully");
                setIsModalOpen(false);
                fetchStudents();
              } catch (err: any) {
                toast.error(err.response?.data?.message || err.message || "Failed to register student");
              }
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Student Name *</label>
                  <input name="fullName" required className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Register Number * (reg_no)</label>
                  <input name="registerNumber" required className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm" placeholder="e.g. 24IT001" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">SPR Number (spr_no)</label>
                  <input name="sprNo" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Email *</label>
                  <input name="email" required type="email" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm" placeholder="student@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number</label>
                  <input name="phone" type="tel" maxLength={10} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm" placeholder="10 digits" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Address</label>
                  <input name="address" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm" placeholder="Full address" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Date of Birth *</label>
                  <input name="dob" required type="date" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Department *</label>
                  {isCc ? (
                    <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-semibold flex justify-between items-center">
                      <span>{ccInfo?.departmentName || 'N/A'}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Locked (CC)</span>
                    </div>
                  ) : (
                    <select 
                      name="departmentId" 
                      required 
                      value={selectedCreateDeptId}
                      onChange={e => {
                        setSelectedCreateDeptId(e.target.value);
                        fetchSectionsForDept(e.target.value, false);
                      }}
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm bg-white animate-none"
                    >
                      <option value="" disabled>Select Dept</option>
                      {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Academic Year *</label>
                  <select name="academicYearId" required className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm bg-white animate-none">
                    <option value="" disabled selected>Select Academic Year</option>
                    {academicYears.map(ay => (
                      <option key={ay.id} value={ay.id}>
                        {ay.academicYear || ay.yearName || ay.name || ay.code || `AY-${ay.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Year *</label>
                  {isCc ? (
                    <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-semibold flex justify-between items-center">
                      <span>Year {ccInfo?.year || 'N/A'}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Locked (CC)</span>
                    </div>
                  ) : (
                    <select name="yearId" required className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm bg-white animate-none">
                      <option value="" disabled selected>Select Year</option>
                      {years.map(y => (
                        <option key={y.id} value={y.id}>
                          {y.yearName || (y.yearNo ? `Year ${y.yearNo}` : y.name || `Year ${y.id}`)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Semester *</label>
                  <select name="semesterId" required className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm bg-white animate-none">
                    <option value="" disabled selected>Select Semester</option>
                    {semesters.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.semesterNo !== undefined ? `Semester ${s.semesterNo}` : (s.semesterName || s.name || `Semester ${s.id}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Section (Optional)</label>
                  {isCc ? (
                    <div className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-semibold flex justify-between items-center">
                      <span>Section {ccInfo?.sectionName || 'N/A'}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Locked (CC)</span>
                    </div>
                  ) : (
                    <select name="sectionId" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm bg-white animate-none">
                      <option value="">No Section Selected (Optional)</option>
                      {(createDeptSections.length > 0 ? createDeptSections : sections).map(sec => (
                        <option key={sec.id} value={sec.id}>
                          {sec.sectionName || sec.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Gender *</label>
                  <select name="genderId" required className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm bg-white animate-none">
                    <option value="" disabled selected>Select Gender</option>
                    {genders.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.genderName || g.name || g.gender}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Group (Optional)</label>
                  <select name="groupId" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm bg-white animate-none">
                    <option value="">No Group Selected (Optional)</option>
                    {groups.map(grp => (
                      <option key={grp.id} value={grp.id}>
                        {grp.groupName || grp.name || grp.title || grp.teamName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Guardian Information (matching Flutter 1:1) */}
              <div className="border-t border-slate-100 pt-4 mt-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Guardian Name</label>
                    <input name="guardianName" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm" placeholder="Parent / Guardian Name" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Relationship</label>
                    <select name="guardianRel" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm bg-white">
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Parent">Parent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Parent Mobile Number</label>
                    <input name="guardianPhone" type="tel" maxLength={10} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm" placeholder="10 digits" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Guardian Email</label>
                    <input name="guardianEmail" type="email" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm" placeholder="guardian@example.com" />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 mt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="px-6 py-2.5 font-bold text-white bg-[#11998e] hover:bg-[#0f7d74] rounded shadow-md transition-colors">
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal connected to backend PUT /api/v1/students/{id} */}
      {isEditModalOpen && editingStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Pencil className="w-5 h-5 text-indigo-600" /> Edit Student Details
              </h2>
              <button 
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingStudent(null);
                }} 
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={async (e) => { 
              e.preventDefault(); 
              const form = e.currentTarget;
              const formData = new FormData(form);

              const payload: any = {
                fullName: (formData.get("fullName") as string)?.trim(),
                email: (formData.get("email") as string)?.trim(),
                phone: (formData.get("phone") as string)?.trim() || "",
                address: (formData.get("address") as string)?.trim() || "",
                dateOfBirth: (formData.get("dob") as string) || null,
                dob: (formData.get("dob") as string) || null,
                sprNo: (formData.get("sprNo") as string)?.trim() || "",
                departmentId: formData.get("departmentId") ? Number(formData.get("departmentId")) : (editingStudent.departmentId || null),
                academicYearId: formData.get("academicYearId") ? Number(formData.get("academicYearId")) : (editingStudent.academicYearId || null),
                yearId: formData.get("yearId") ? Number(formData.get("yearId")) : (editingStudent.yearId || null),
                semesterId: formData.get("semesterId") ? Number(formData.get("semesterId")) : (editingStudent.semesterId || null),
                genderId: formData.get("genderId") ? Number(formData.get("genderId")) : (editingStudent.genderId || null),
                sectionId: formData.get("sectionId") ? Number(formData.get("sectionId")) : (editingStudent.sectionId || null),
                groupId: formData.get("groupId") ? Number(formData.get("groupId")) : (editingStudent.groupId || editingStudent.teamId || null),
                active: editingStudent.active ?? true,
              };

              const newPassword = (formData.get("password") as string)?.trim();
              if (newPassword) {
                payload.password = newPassword;
              }

              const guardianName = (formData.get("guardianName") as string)?.trim();
              if (guardianName) {
                payload.guardian = {
                  guardianName,
                  relationship: (formData.get("guardianRel") as string) || "Guardian",
                  phoneNo: (formData.get("guardianPhone") as string)?.trim() || "",
                  email: (formData.get("guardianEmail") as string)?.trim() || ""
                };
              }

              const toastId = toast.loading("Updating student details...");
              try {
                const res = await apiClient.put(`/api/v1/students/${editingStudent.id}`, payload);
                toast.dismiss(toastId);
                if (res.data?.success || res.status === 200) {
                  toast.success("Student details updated successfully!");
                  setIsEditModalOpen(false);
                  setEditingStudent(null);
                  fetchStudents();
                } else {
                  toast.error(res.data?.message || "Failed to update student");
                }
              } catch (err: any) {
                toast.dismiss(toastId);
                toast.error(err.response?.data?.message || err.message || "Failed to update student");
              }
            }} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Student Name *</label>
                  <input 
                    name="fullName" 
                    required 
                    defaultValue={editingStudent.fullName || editingStudent.name || ''} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Register Number (reg_no)</label>
                  <input 
                    name="registerNumber" 
                    disabled
                    defaultValue={editingStudent.studentId || editingStudent.regNo || editingStudent.registerNumber || ''} 
                    className="w-full p-2.5 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl outline-none text-sm font-medium cursor-not-allowed" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">SPR Number (spr_no)</label>
                  <input 
                    name="sprNo" 
                    defaultValue={editingStudent.sprNo || editingStudent.spr_no || ''} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Email *</label>
                  <input 
                    name="email" 
                    required 
                    type="email" 
                    defaultValue={editingStudent.email || ''} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number</label>
                  <input 
                    name="phone" 
                    type="tel" 
                    maxLength={10} 
                    defaultValue={editingStudent.phone || editingStudent.phoneNo || ''} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Address</label>
                  <input 
                    name="address" 
                    defaultValue={editingStudent.address || ''} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Date of Birth</label>
                  <input 
                    name="dob" 
                    type="date" 
                    defaultValue={editingStudent.dateOfBirth || editingStudent.dob || ''} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Department *</label>
                  <select 
                    name="departmentId" 
                    defaultValue={editingStudent.departmentId || ''} 
                    onChange={e => {
                      fetchSectionsForDept(e.target.value, true);
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm bg-white font-medium animate-none"
                  >
                    <option value="" disabled>Select Dept</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Academic Year</label>
                  <select 
                    name="academicYearId" 
                    defaultValue={editingStudent.academicYearId || ''} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm bg-white font-medium animate-none"
                  >
                    <option value="">Select Academic Year</option>
                    {academicYears.map(ay => (
                      <option key={ay.id} value={ay.id}>
                        {ay.academicYear || ay.yearName || ay.name || ay.code || `AY-${ay.id}`}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Year *</label>
                  <select 
                    name="yearId" 
                    defaultValue={editingStudent.yearId || editingStudent.year || ''} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm bg-white font-medium animate-none"
                  >
                    <option value="" disabled>Select Year</option>
                    {years.map(y => (
                      <option key={y.id} value={y.id}>
                        {y.yearName || (y.yearNo ? `Year ${y.yearNo}` : y.name || `Year ${y.id}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Semester</label>
                  <select 
                    name="semesterId" 
                    defaultValue={editingStudent.semesterId || ''} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm bg-white font-medium animate-none"
                  >
                    <option value="">Select Semester</option>
                    {semesters.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.semesterNo !== undefined ? `Semester ${s.semesterNo}` : (s.semesterName || s.name || `Semester ${s.id}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Section</label>
                  <select 
                    name="sectionId" 
                    defaultValue={editingStudent.sectionId || ''} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm bg-white font-medium animate-none"
                  >
                    <option value="">No Section Selected</option>
                    {(editDeptSections.length > 0 ? editDeptSections : sections).map(sec => (
                      <option key={sec.id} value={sec.id}>
                        {sec.sectionName || sec.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Gender</label>
                  <select 
                    name="genderId" 
                    defaultValue={editingStudent.genderId || ''} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm bg-white font-medium animate-none"
                  >
                    <option value="">Select Gender</option>
                    {genders.map(g => (
                      <option key={g.id} value={g.id}>
                        {g.genderName || g.name || g.gender}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Group (Optional)</label>
                  <select 
                    name="groupId" 
                    defaultValue={editingStudent.groupId || editingStudent.teamId || ''} 
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm bg-white font-medium animate-none"
                  >
                    <option value="">No Group Selected</option>
                    {groups.map(grp => (
                      <option key={grp.id} value={grp.id}>
                        {grp.groupName || grp.name || grp.title || grp.teamName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Reset Password (Optional)</label>
                  <input 
                    name="password" 
                    type="password"
                    placeholder="Leave blank to keep unchanged" 
                    className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm font-medium" 
                  />
                </div>
              </div>

              {/* Guardian Details */}
              <div className="border-t border-slate-100 pt-4 mt-2">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">Guardian Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Guardian Name</label>
                    <input 
                      name="guardianName" 
                      defaultValue={editingStudent.guardian?.guardianName || editingStudent.guardianName || ''} 
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm" 
                      placeholder="Parent / Guardian Name" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Relationship</label>
                    <select 
                      name="guardianRel" 
                      defaultValue={editingStudent.guardian?.relationship || editingStudent.guardianRel || 'Father'} 
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm bg-white"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Parent">Parent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Parent Mobile Number</label>
                    <input 
                      name="guardianPhone" 
                      type="tel" 
                      maxLength={10} 
                      defaultValue={editingStudent.guardian?.phoneNo || editingStudent.guardianPhone || ''} 
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm" 
                      placeholder="10 digits" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Guardian Email</label>
                    <input 
                      name="guardianEmail" 
                      type="email" 
                      defaultValue={editingStudent.guardian?.email || editingStudent.guardianEmail || ''} 
                      className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 text-sm" 
                      placeholder="guardian@example.com" 
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 mt-4 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingStudent(null);
                  }} 
                  className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2.5 font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors cursor-pointer text-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Discipline Report Monitor Modal (Matching Flutter _showReportMonitorDialog 1:1) ─── */}
      {isReportMonitorOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-50 rounded-2xl text-amber-600">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900">Discipline Report Monitor</h2>
                  <p className="text-xs text-slate-500">Monitor student discipline logs, XP history, and penalty records</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsReportMonitorOpen(false);
                  setReportLogs([]);
                  setReportStudentInfo(null);
                  setReportError(null);
                }}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Bar */}
            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Enter Student Reg No (e.g. CSE001)..."
                  value={reportRegNo}
                  onChange={(e) => setReportRegNo(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter' && reportRegNo.trim()) {
                      await handleSearchDisciplineReport();
                    }
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm outline-none focus:border-teal-500 font-medium"
                />
              </div>
              <button
                onClick={handleSearchDisciplineReport}
                disabled={isSearchingReport || !reportRegNo.trim()}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSearchingReport ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                Search
              </button>
            </div>

            {/* Search Results / Logs List */}
            {reportError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-medium mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 shrink-0 text-rose-500" />
                <span>{reportError}</span>
              </div>
            )}

            {reportStudentInfo && (
              <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-2xl mb-4 flex justify-between items-center">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{reportStudentInfo.fullName}</h4>
                  <p className="text-xs text-slate-500">{reportStudentInfo.regNo} • {reportStudentInfo.departmentName ?? 'Department'}</p>
                </div>
                <span className="text-xs font-extrabold px-3 py-1 bg-teal-100 text-teal-800 rounded-full">
                  Score: {reportStudentInfo.score ?? 0} XP
                </span>
              </div>
            )}

            <div className="max-h-72 overflow-y-auto space-y-3 pr-1">
              {isSearchingReport ? (
                <div className="flex justify-center py-10">
                  <RefreshCw className="w-7 h-7 animate-spin text-teal-600" />
                </div>
              ) : reportLogs.length === 0 ? (
                <div className="text-center py-10 text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-semibold text-slate-600">No discipline logs found</p>
                  <p className="text-xs text-slate-400 mt-1">Enter a valid student registration number to search logs.</p>
                </div>
              ) : (
                reportLogs.map((log: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{log.activityName || log.title || 'Discipline Record'}</div>
                      <div className="text-slate-500 mt-0.5">{log.date || log.createdAt || 'Recent'}</div>
                    </div>
                    <span className={`font-extrabold px-2.5 py-1 rounded-md ${
                      log.xp > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {log.xp > 0 ? `+${log.xp} XP` : `${log.xp} XP`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload File Dialog */}
      {isBulkUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl p-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h2 className="text-lg font-bold text-slate-800">Excel Bulk Upload</h2>
              <button onClick={() => setIsBulkUploadModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Upload a spreadsheet containing student records. Valid columns should include:
                <span className="font-mono bg-slate-50 border border-slate-100 rounded px-1 ml-1 text-slate-600">regNo</span>, 
                <span className="font-mono bg-slate-50 border border-slate-100 rounded px-1 ml-1 text-slate-600">fullName</span>, and 
                <span className="font-mono bg-slate-50 border border-slate-100 rounded px-1 ml-1 text-slate-600">email</span>.
              </p>

              {/* Upload Drop Zone / Input */}
              <div 
                className="border-2 border-dashed border-slate-300 hover:border-teal-500 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.xlsx,.xls';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) handleFileUpload(file);
                  };
                  input.click();
                }}
              >
                <div className="text-teal-600 mb-3 bg-teal-50 p-3 rounded-full">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-slate-700">Click to upload spreadsheet</span>
                <span className="text-xs text-slate-400 mt-1">Accepts .xlsx or .xls files</span>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button 
                onClick={() => setIsBulkUploadModalOpen(false)}
                className="px-5 py-2.5 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Verification Screen Modal (matching BulkVerificationScreen in Flutter) */}
      {isVerificationModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* Modal Header */}
            <div className="bg-[#11998e] text-white px-6 py-4 flex items-center justify-between shrink-0">
              <div>
                <h2 className="text-lg font-bold">Verify Parsed Students</h2>
                <p className="text-xs text-white/80 mt-0.5">
                  Selected: {checkedStates.filter(Boolean).length} / {parsedStudents.length} students
                </p>
              </div>
              <button 
                onClick={() => setIsVerificationModalOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors font-medium text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Table Body */}
            <div className="flex-1 overflow-auto p-6">
              {/* Error Rows Accordion (if any skipped rows) */}
              {rejectedRows.length > 0 && (
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4 text-xs text-rose-700">
                  <div className="font-bold flex items-center gap-1.5 mb-2">
                    <ShieldAlert className="w-4 h-4 text-rose-500" />
                    <span>{rejectedRows.length} Rows Skipped due to Errors:</span>
                  </div>
                  <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono">
                    {rejectedRows.map((r, i) => (
                      <div key={i}>
                        • {r.fullName || r.name || 'Row'} ({r.regNo || 'N/A'}): {r.errorReason}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <input 
                  type="checkbox" 
                  id="check-all"
                  checked={checkedStates.length > 0 && checkedStates.every(Boolean)} 
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setCheckedStates(new Array(parsedStudents.length).fill(checked));
                  }}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                />
                <label htmlFor="check-all" className="text-xs font-bold text-slate-600 cursor-pointer select-none">
                  Select All / Unselect All
                </label>
              </div>

              {/* Responsive Scroll Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <th className="p-3 w-10"></th>
                      <th className="p-3 min-w-[150px]">Student Name *</th>
                      <th className="p-3 min-w-[100px]">Reg No *</th>
                      <th className="p-3 min-w-[150px]">Email *</th>
                      <th className="p-3 min-w-[120px]">Department *</th>
                      <th className="p-3 min-w-[100px]">Year *</th>
                      <th className="p-3 min-w-[80px]">Section</th>
                      <th className="p-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedStudents.map((s, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 text-center">
                          <input 
                            type="checkbox"
                            checked={checkedStates[idx]}
                            onChange={(e) => {
                              const newStates = [...checkedStates];
                              newStates[idx] = e.target.checked;
                              setCheckedStates(newStates);
                            }}
                            className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="text"
                            value={s.fullName || ''}
                            onChange={(e) => {
                              const updated = [...parsedStudents];
                              updated[idx].fullName = e.target.value;
                              setParsedStudents(updated);
                            }}
                            required
                            className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500 font-medium"
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="text"
                            value={s.regNo || ''}
                            onChange={(e) => {
                              const updated = [...parsedStudents];
                              updated[idx].regNo = e.target.value;
                              setParsedStudents(updated);
                            }}
                            required
                            className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500 font-mono font-medium"
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="email"
                            value={s.email || ''}
                            onChange={(e) => {
                              const updated = [...parsedStudents];
                              updated[idx].email = e.target.value;
                              setParsedStudents(updated);
                            }}
                            required
                            className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500 font-medium"
                          />
                        </td>
                        <td className="p-3">
                          {isCc ? (
                            <span className="font-semibold text-slate-600">{ccInfo?.departmentName || 'N/A'}</span>
                          ) : (
                            <select 
                              value={s.departmentId || ''} 
                              onChange={(e) => {
                                const updated = [...parsedStudents];
                                updated[idx].departmentId = Number(e.target.value);
                                setParsedStudents(updated);
                              }}
                              required
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none bg-white font-medium animate-none"
                            >
                              <option value="" disabled>Select Dept</option>
                              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                          )}
                        </td>
                        <td className="p-3">
                          {isCc ? (
                            <span className="font-semibold text-slate-600">Year {ccInfo?.year || 'N/A'}</span>
                          ) : (
                            <select 
                              value={s.year || s.yearId || ''} 
                              onChange={(e) => {
                                const updated = [...parsedStudents];
                                const val = e.target.value;
                                updated[idx].year = val;
                                const yrMatch = years.find((y: any) => String(y.id) === val || String(y.yearNo) === val);
                                if (yrMatch) {
                                  updated[idx].yearId = yrMatch.id;
                                  updated[idx].year = String(yrMatch.yearNo || yrMatch.id);
                                }
                                setParsedStudents(updated);
                              }}
                              required
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none bg-white font-medium animate-none"
                            >
                              <option value="" disabled>Select Year</option>
                              <option value="1">Year 1</option>
                              <option value="2">Year 2</option>
                              <option value="3">Year 3</option>
                              <option value="4">Year 4</option>
                            </select>
                          )}
                        </td>
                        <td className="p-3">
                          {isCc ? (
                            <span className="font-semibold text-slate-600">Section {ccInfo?.sectionName || 'N/A'}</span>
                          ) : (
                            <input 
                              type="text"
                              value={s.section || ''}
                              onChange={(e) => {
                                const updated = [...parsedStudents];
                                updated[idx].section = e.target.value;
                                setParsedStudents(updated);
                              }}
                              placeholder="e.g. A"
                              className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:border-teal-500 font-medium text-center uppercase"
                            />
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <button 
                            onClick={() => {
                              const updated = [...parsedStudents];
                              const newChecked = [...checkedStates];
                              updated.splice(idx, 1);
                              newChecked.splice(idx, 1);
                              setParsedStudents(updated);
                              setCheckedStates(newChecked);
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 transition-colors rounded-lg hover:bg-slate-100"
                            title="Remove Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsVerificationModalOpen(false)}
                className="px-5 py-2.5 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={async () => {
                  const selectedList = parsedStudents.filter((_, i) => checkedStates[i]);
                  if (selectedList.length === 0) {
                    toast.error("Please select at least one student to import.");
                    return;
                  }

                  for (const st of selectedList) {
                    if (!st.fullName || !st.regNo || !st.email || !st.departmentId || !st.year) {
                      toast.error(`Please fill all required fields (*) for student "${st.fullName || 'Unknown'}".`);
                      return;
                    }
                  }

                  setIsImporting(true);
                  const toastId = toast.loading(`Importing ${selectedList.length} students...`);
                  try {
                    const res = await studentService.bulkImport(selectedList);
                    toast.dismiss(toastId);
                    if (res.data?.success || res.status === 200) {
                      toast.success(res.data?.message || `Successfully imported ${selectedList.length} students!`);
                      setIsVerificationModalOpen(false);
                      fetchStudents();
                    } else {
                      toast.error(res.data?.message || "Failed to save students");
                    }
                  } catch (err: any) {
                    toast.dismiss(toastId);
                    toast.error(err.response?.data?.message || err.message || "Failed to import students");
                  } finally {
                    setIsImporting(false);
                  }
                }}
                disabled={isImporting}
                className="px-6 py-2.5 font-bold text-white bg-[#11998e] hover:bg-[#0f7d74] rounded-xl shadow-md transition-colors disabled:opacity-50 text-sm flex items-center gap-1.5"
              >
                {isImporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Proceed Import</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  async function handleSearchDisciplineReport() {
    const sId = reportRegNo.trim();
    if (!sId) return;
    setIsSearchingReport(true);
    setReportError(null);
    setReportLogs([]);
    setReportStudentInfo(null);

    try {
      // 1. Search student info by regNo
      const searchRes = await apiClient.get(`/api/v1/students/search?keyword=${encodeURIComponent(sId)}`);
      const rawList = searchRes.data?.data?.content || searchRes.data?.data || [];
      const match = Array.isArray(rawList)
        ? rawList.find((s: any) => String(s.regNo).toLowerCase() === sId.toLowerCase())
        : null;

      if (!match) {
        setReportError(`No student found matching registration number "${sId}".`);
        return;
      }

      setReportStudentInfo(match);

      // 2. Fetch discipline logs for matched student
      try {
        const logsRes = await apiClient.get(`/api/v1/students/${match.id}/discipline-logs`);
        const logsData = logsRes.data?.data || logsRes.data || [];
        setReportLogs(Array.isArray(logsData) ? logsData : []);
      } catch (e) {
        setReportLogs([]);
      }
    } catch (e: any) {
      logger.error('Report monitor search error:', e);
      setReportError(e.response?.data?.message || 'Failed to search student discipline report');
    } finally {
      setIsSearchingReport(false);
    }
  }
}
