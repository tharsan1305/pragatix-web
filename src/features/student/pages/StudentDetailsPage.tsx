import { logger } from '../../../utils/logger';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentStore } from '../../../store/studentStore';
import { useAuth } from '../../../store/authContext';
import { studentService } from '../services/student.service';
import apiClient from '../../../services/apiClient';
import { 
  ArrowLeft, Trash2, Award, FileWarning, Medal, Mail, Building, Hash, 
  ShieldCheck, ShieldAlert, PlusCircle, MinusCircle, RefreshCw, X, Lock
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../../components/common/ConfirmationModal';

export default function StudentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin, isSuperAdmin, isHOD } = useAuth();
  const { selectedStudent, setSelectedStudent } = useStudentStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAccessRestricted, setIsAccessRestricted] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Real data state
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isCurrentlyCaptain, setIsCurrentlyCaptain] = useState(false);
  const [isCaptainLoading, setIsCaptainLoading] = useState(false);
  
  // Adjust Points Modal state
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [points, setPoints] = useState<number>(5);
  const [reason, setReason] = useState('');
  const [isSubmittingPoints, setIsSubmittingPoints] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setIsLoading(true);
      setError(null);
      setIsAccessRestricted(false);
      try {
        if (id) {
          const student = await studentService.getStudentById(Number(id));

          // Defense-in-depth: If logged in as restricted Teacher / CC / HOD (not Admin)
          if (!isAdmin && !isSuperAdmin) {
            const userDept = (user?.departmentName || user?.department || '').toString().toLowerCase().trim();
            const studentDept = (student?.departmentName || (student as any)?.department || '').toString().toLowerCase().trim();

            if (isHOD && userDept && studentDept && !studentDept.includes(userDept) && !userDept.includes(studentDept)) {
              setIsAccessRestricted(true);
              setError('Access Restricted: This student belongs to another department. (Backend authorization verification required)');
              setIsLoading(false);
              return;
            }
          }

          setSelectedStudent(student);
          setIsCurrentlyCaptain(student.isCaptain || false);
          fetchHistoryLogs(id);
        }
      } catch (err: any) {
        if (err?.response?.status === 403) {
          setIsAccessRestricted(true);
          setError('Access Restricted (HTTP 403): You do not have permission to view this student profile. (Backend authorization verification required)');
        } else {
          setError(err.response?.data?.message || err.message || 'Failed to load student details');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
    
    return () => setSelectedStudent(null);
  }, [id, setSelectedStudent, isAdmin, isSuperAdmin, isHOD, user]);

  const fetchHistoryLogs = async (studentId: string) => {
    setIsLoadingHistory(true);
    try {
      const res = await apiClient.get(`/api/v1/students/${studentId}/discipline-logs`);
      if (res.data?.success) {
        setHistoryLogs(res.data.data || []);
      }
    } catch (e: any) {
      if (e?.response?.status === 403) {
        logger.warn('Access restricted for student discipline logs');
      } else {
        logger.error('Failed to load history logs', e);
      }
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleToggleCaptain = async () => {
    if (!selectedStudent || !id) return;
    setIsCaptainLoading(true);
    try {
      const endpoint = isCurrentlyCaptain 
        ? `/api/v1/students/${id}/remove-captain` 
        : `/api/v1/students/${id}/make-captain`;
      
      const res = await apiClient.post(endpoint);
      if (res.data?.success || res.status === 200) {
        setIsCurrentlyCaptain(!isCurrentlyCaptain);
        setSelectedStudent({ ...selectedStudent, isCaptain: !isCurrentlyCaptain });
        toast.success(isCurrentlyCaptain ? 'Removed captain status' : 'Appointed as captain');
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to update captain status');
    } finally {
      setIsCaptainLoading(false);
    }
  };

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedStudent) return;
    setIsSubmittingPoints(true);
    try {
      const res = await apiClient.post(`/api/v1/students/${id}/adjust-points`, {
        points: Number(points),
        reason: reason.trim(),
      });

      if (res.data?.success || res.status === 200) {
        toast.success('Points adjusted successfully!');
        setIsAdjustModalOpen(false);
        setReason('');
        // Refresh score and logs
        const updatedStudent = await studentService.getStudentById(Number(id));
        setSelectedStudent(updatedStudent);
        fetchHistoryLogs(id);
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Failed to adjust points');
    } finally {
      setIsSubmittingPoints(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    setIsDeleteModalOpen(false);
    try {
      await studentService.deleteStudent(Number(id));
      toast.success('Student deleted successfully');
      navigate(-1);
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete student');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !selectedStudent) {
    return (
      <div className="p-6 max-w-4xl mx-auto my-12">
        <div className={`p-6 rounded-2xl flex flex-col items-start gap-4 border shadow-sm ${isAccessRestricted ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-red-50 border-red-200 text-red-700'}`}>
          <div className="flex items-center gap-3">
            {isAccessRestricted ? <Lock className="w-6 h-6 text-amber-600 shrink-0" /> : <FileWarning className="w-6 h-6 text-red-600 shrink-0" />}
            <h2 className="type-h4">{isAccessRestricted ? 'Access Restricted' : 'Error'}</h2>
          </div>
          <p className="type-body-sm leading-relaxed">{error || 'Student not found'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 type-btn transition-colors shadow-xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-6 space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-200 bg-white rounded-full transition-colors border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="type-h3 text-slate-800">Student Profile</h1>
            <p className="type-caption text-slate-500">View and manage detailed information</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleToggleCaptain}
            disabled={isCaptainLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white type-btn transition-colors shadow-sm cursor-pointer ${
              isCurrentlyCaptain ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {isCurrentlyCaptain ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            {isCaptainLoading ? 'Updating...' : isCurrentlyCaptain ? 'Remove Captain' : 'Make Captain'}
          </button>

          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-red-200 rounded-xl text-red-600 hover:bg-red-50 transition-colors type-btn shadow-sm cursor-pointer"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute top-0 w-full h-24 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-90"></div>
            
            <div className="w-24 h-24 bg-white rounded-full p-1 mt-8 z-10 relative shadow-md">
              <div className="w-full h-full bg-indigo-100 rounded-full flex items-center justify-center type-h2 text-indigo-600">
                {selectedStudent.fullName?.charAt(0) || 'S'}
              </div>
              {isCurrentlyCaptain && (
                <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1.5 rounded-full border-2 border-white shadow-sm" title="Team Captain">
                  <Award className="w-4 h-4" />
                </div>
              )}
            </div>
            
            <h2 className="font-heading mt-4 type-h2 text-slate-800 z-10">{selectedStudent.fullName}</h2>
            <p className="type-caption text-slate-500 font-mono font-medium z-10">{selectedStudent.regNo}</p>
            
            <div className="mt-6 w-full flex flex-col gap-2.5">
              <div className="flex items-center gap-3 type-caption text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate">{selectedStudent.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-3 type-caption text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Building className="w-4 h-4 text-slate-400 shrink-0" />
                <span>{selectedStudent.departmentName || 'No Department'}</span>
              </div>
              <div className="flex items-center gap-3 type-caption text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <Hash className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Year {selectedStudent.year || 'N/A'} • Sec {selectedStudent.section || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="type-h5 text-slate-800 mb-4">Discipline Score</h3>
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="transparent" 
                    stroke={(selectedStudent.disciplineScore || 0) >= 80 ? '#22c55e' : (selectedStudent.disciplineScore || 0) >= 50 ? '#eab308' : '#ef4444'} 
                    strokeWidth="8" 
                    strokeDasharray={`${((selectedStudent.disciplineScore || 0) / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="type-h2 text-slate-800">{selectedStudent.disciplineScore ?? 0}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PTS</span>
                </div>
              </div>
              
              <div className="mt-6 w-full space-y-2">
                <button 
                  onClick={() => setIsAdjustModalOpen(true)}
                  className="w-full py-2.5 bg-indigo-50 text-indigo-700 rounded-xl type-caption font-bold hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" /> Adjust Points
                </button>
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-xl type-caption font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Profile</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Content/Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <FileWarning className="w-4 h-4 text-orange-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Logs</span>
              </div>
              <span className="type-h3 text-slate-800">{historyLogs.length}</span>
             </div>
             
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Award className="w-4 h-4 text-indigo-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Score</span>
              </div>
              <span className="type-h3 text-indigo-600">{selectedStudent.disciplineScore ?? 0}</span>
             </div>
             
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <div className="flex items-center gap-2 text-slate-500 mb-2">
                <Medal className="w-4 h-4 text-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Captain</span>
              </div>
              <span className="type-body-sm font-bold text-slate-800 mt-1">{isCurrentlyCaptain ? 'YES' : 'NO'}</span>
             </div>
          </div>
          
          {/* Recent Disciplinary Logs */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[350px]">
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex justify-between items-center">
              <h3 className="type-h5 text-slate-800">Discipline Action History</h3>
              <button 
                onClick={() => id && fetchHistoryLogs(id)} 
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
                title="Refresh logs"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="p-8 text-center text-slate-400 type-body-sm">Loading history logs...</div>
            ) : historyLogs.length === 0 ? (
              <div className="p-8 flex-1 flex flex-col items-center justify-center text-slate-400">
                <FileWarning className="w-12 h-12 mb-3 opacity-20" />
                <p className="type-body-sm font-medium">No discipline logs recorded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                {historyLogs.map((log: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${log.points >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {log.points >= 0 ? <PlusCircle className="w-4 h-4" /> : <MinusCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-800 type-body-sm">{log.reason || 'Point adjustment'}</div>
                        <div className="type-fine text-slate-400">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                        </div>
                      </div>
                    </div>
                    <div className={`type-body-sm font-bold ${log.points >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {log.points >= 0 ? `+${log.points}` : log.points} pts
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adjust Points Modal */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-heading font-bold text-slate-800 type-h3">Adjust Discipline Points</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustPoints} className="p-6 space-y-4">
              <div>
                <label className="type-form-label block font-bold text-slate-600 mb-1">Points (+ or -)</label>
                <input 
                  type="number" 
                  required 
                  value={points} 
                  onChange={(e) => setPoints(parseInt(e.target.value) || 0)} 
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold text-slate-800" 
                  placeholder="e.g. 5 or -10" 
                />
                <span className="type-fine text-slate-400 mt-1 block">Use positive number to reward, negative number to deduct.</span>
              </div>

              <div>
                <label className="type-form-label block font-bold text-slate-600 mb-1">Reason *</label>
                <textarea 
                  required 
                  rows={3} 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none type-body-sm" 
                  placeholder="Provide a reason for point modification..." 
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAdjustModalOpen(false)} 
                  className="px-5 py-2.5 type-btn text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingPoints} 
                  className="px-6 py-2.5 type-caption font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {isSubmittingPoints ? 'Saving...' : 'Submit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Confirm Delete Student"
        description={`Are you sure you want to delete "${selectedStudent?.fullName || 'this student'}"? This action cannot be undone.`}
        confirmText="Delete Student"
        cancelText="Cancel"
        isDangerous={true}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
