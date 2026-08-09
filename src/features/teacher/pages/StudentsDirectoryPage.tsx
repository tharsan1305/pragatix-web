import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, Plus, UserPlus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import studentService from '../../../services/studentService';

export default function StudentsDirectoryPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals State
  const [isOptionsModalOpen, setIsOptionsModalOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);
  


  useEffect(() => {
    fetchStudents();
    fetchLookups();
  }, []);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/api/v1/students?page=0&size=1000&sortBy=fullName');
      if (res.data.success) {
        setStudents(res.data.data?.content || []);
      }
    } catch (e) {
      console.error('Failed to load students', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLookups = async () => {
    try {
      const res = await apiClient.get('/api/v1/admin/departments');
      if (res.data.success) {
        setDepartments(res.data.data || []);
      }
    } catch (e) {
      console.error('Failed to load departments', e);
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
        
        {/* Header Icons to match Flutter */}
        <div className="flex items-center space-x-2 text-white">
          <button className="p-2 hover:bg-slate-800 rounded-full transition-colors" title="Add User Icon">
            <UserPlus className="w-5 h-5" />
          </button>
          <button onClick={fetchStudents} className="p-2 hover:bg-slate-800 rounded-full transition-colors" title="Refresh">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
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
                  <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xl">
                    {student.fullName?.charAt(0) || 'S'}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteStudent(student.id); }} 
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="font-bold text-slate-800 text-lg truncate">{student.fullName}</h3>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-indigo-600 font-bold text-sm">{student.studentId}</p>
                  <span className="text-xs font-extrabold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                    {student.score ?? student.xp ?? student.points ?? 0} XP
                  </span>
                </div>
                <div className="text-sm text-slate-500 space-y-1">
                  <p>Dept: {student.departmentName || 'N/A'}</p>
                  <p>Year: {student.year || 'N/A'} • Sec: {student.section || 'N/A'}</p>
                  <p className="truncate">Email: {student.email || 'N/A'}</p>
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
                  alert("Bulk upload not fully configured in React yet.");
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
              const data = {
                fullName: formData.get("fullName"),
                registerNumber: formData.get("registerNumber"),
                email: formData.get("email"),
                departmentId: formData.get("departmentId"),
                section: formData.get("section"),
                year: formData.get("year"),
              };
              try {
                await studentService.createStudent(data);
                toast.success("Student registered successfully");
                setIsModalOpen(false);
                fetchStudents();
              } catch (err: any) {
                toast.error(err.response?.data?.message || "Failed to register student");
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
                  <input className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm" placeholder="Optional" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Email *</label>
                  <input name="email" required type="email" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm" placeholder="student@example.com" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Phone Number</label>
                  <input type="tel" maxLength={10} className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm" placeholder="10 digits" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Address</label>
                  <input className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm" placeholder="Full address" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Date of Birth *</label>
                  <input required type="date" className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Department *</label>
                  <select required className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm bg-white">
                    <option value="" disabled selected>Select Dept</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Year *</label>
                  <select required className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm bg-white">
                    <option value="" disabled selected>Select Year</option>
                    <option value="1">Year 1</option>
                    <option value="2">Year 2</option>
                    <option value="3">Year 3</option>
                    <option value="4">Year 4</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Section (Optional)</label>
                  <select className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm bg-white">
                    <option value="">No Section Selected (Optional)</option>
                    <option value="A">Section A</option>
                    <option value="B">Section B</option>
                    <option value="C">Section C</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Academic Year *</label>
                  <select required className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm bg-white">
                    <option value="" disabled selected>Select Academic Year</option>
                    <option value="2023-2024">2023-2024</option>
                    <option value="2024-2025">2024-2025</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Semester *</label>
                  <select required className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm bg-white">
                    <option value="" disabled selected>Select Semester</option>
                    {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Gender *</label>
                  <select required className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm bg-white">
                    <option value="" disabled selected>Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Group (Optional)</label>
                  <select className="w-full p-2.5 border border-slate-300 rounded-xl outline-none focus:border-teal-500 text-sm bg-white">
                    <option value="">No Group Selected (Optional)</option>
                    <option value="G1">Group Alpha</option>
                    <option value="G2">Group Beta</option>
                  </select>
                </div>
              </div>

              <div className="pt-6 flex justify-end gap-3 mt-4">
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

    </div>
  );
}
