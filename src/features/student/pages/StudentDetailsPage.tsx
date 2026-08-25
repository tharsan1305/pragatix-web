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
import Footer from '../../../components/common/Footer';

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
      <div className="flex h-screen items-center justify-center bg-bg text-text-primary">
        <p className="type-body-sm font-semibold text-text-secondary">Loading student details...</p>
      </div>
    );
  }

  if (error || !selectedStudent) {
    return (
      <div className="p-6 max-w-4xl mx-auto my-12 text-text-primary">
        <div className={`p-6 rounded-lg flex flex-col items-start gap-4 border shadow-[0_1px_2px_rgba(0,0,0,0.03)] ${isAccessRestricted ? 'bg-card border-border text-text-primary' : 'bg-card border-accent/30 text-accent'}`}>
          <div className="flex items-center gap-3">
            {isAccessRestricted ? <Lock className="w-6 h-6 text-text-muted shrink-0" /> : <FileWarning className="w-6 h-6 text-accent shrink-0" />}
            <h2 className="type-h4 font-bold">{isAccessRestricted ? 'Access Restricted' : 'Error'}</h2>
          </div>
          <p className="type-body-sm leading-relaxed text-text-secondary">{error || 'Student not found'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-text-primary hover:bg-bg type-btn transition-colors shadow-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-bg text-text-primary p-6 space-y-6 max-w-5xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-bg bg-card rounded-lg transition-colors border border-border shadow-none cursor-pointer text-text-primary"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <div>
            <h1 className="type-h3 font-bold text-text-primary">Student Profile</h1>
            <p className="type-caption text-text-secondary font-medium">View and manage detailed information</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handleToggleCaptain}
            disabled={isCaptainLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-card type-btn transition-colors shadow-none cursor-pointer font-bold ${
              isCurrentlyCaptain ? 'bg-text-secondary hover:bg-text-primary' : 'bg-accent hover:bg-accent-hover'
            }`}
          >
            {isCurrentlyCaptain ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
            {isCaptainLoading ? 'Updating...' : isCurrentlyCaptain ? 'Remove Captain' : 'Make Captain'}
          </button>

          <button 
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-card border border-accent/30 rounded-lg text-accent hover:bg-accent-tint transition-colors type-btn shadow-none cursor-pointer font-bold"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card p-6 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border flex flex-col items-center text-center relative overflow-hidden">
            <div className="w-20 h-20 bg-bg border border-border rounded-full flex items-center justify-center type-h2 font-bold text-text-primary mt-2">
              {selectedStudent.fullName?.charAt(0) || 'S'}
            </div>
            
            <h2 className="font-heading mt-4 type-h3 font-bold text-text-primary">{selectedStudent.fullName}</h2>
            <p className="type-caption text-text-muted font-mono font-medium">{selectedStudent.regNo}</p>
            
            <div className="mt-6 w-full flex flex-col gap-2.5">
              <div className="flex items-center gap-3 type-caption text-text-secondary bg-bg p-3 rounded-lg border border-border font-medium">
                <Mail className="w-4 h-4 text-text-muted shrink-0" />
                <span className="truncate">{selectedStudent.email || 'No email provided'}</span>
              </div>
              <div className="flex items-center gap-3 type-caption text-text-secondary bg-bg p-3 rounded-lg border border-border font-medium">
                <Building className="w-4 h-4 text-text-muted shrink-0" />
                <span>{selectedStudent.departmentName || 'No Department'}</span>
              </div>
              <div className="flex items-center gap-3 type-caption text-text-secondary bg-bg p-3 rounded-lg border border-border font-medium">
                <Hash className="w-4 h-4 text-text-muted shrink-0" />
                <span>Year {selectedStudent.year || 'N/A'} • Sec {selectedStudent.section || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-card p-6 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border">
            <h3 className="type-h5 font-bold text-text-primary mb-4">Discipline Score</h3>
            <div className="flex flex-col items-center justify-center py-2">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#E5E5E5" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="40" 
                    fill="transparent" 
                    stroke="#E50914" 
                    strokeWidth="8" 
                    strokeDasharray={`${((selectedStudent.disciplineScore || 0) / 100) * 251.2} 251.2`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="type-h2 font-bold text-text-primary">{selectedStudent.disciplineScore ?? 0}</span>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">PTS</span>
                </div>
              </div>
              
              <div className="mt-6 w-full space-y-2">
                <button 
                  onClick={() => setIsAdjustModalOpen(true)}
                  className="w-full py-2.5 bg-card border border-border text-text-primary rounded-lg type-caption font-bold hover:bg-bg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-accent" /> Adjust Points
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Content/Tabs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
             <div className="bg-card p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border flex flex-col">
              <div className="flex items-center gap-2 text-text-secondary mb-2">
                <FileWarning className="w-4 h-4 text-text-muted" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Logs</span>
              </div>
              <span className="type-h3 font-bold text-text-primary">{historyLogs.length}</span>
             </div>
             
             <div className="bg-card p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border flex flex-col">
              <div className="flex items-center gap-2 text-text-secondary mb-2">
                <Award className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Score</span>
              </div>
              <span className="type-h3 font-bold text-accent">{selectedStudent.disciplineScore ?? 0}</span>
             </div>
             
             <div className="bg-card p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border flex flex-col">
              <div className="flex items-center gap-2 text-text-secondary mb-2">
                <Medal className="w-4 h-4 text-text-muted" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Captain</span>
              </div>
              <span className="type-body-sm font-bold text-text-primary mt-1">{isCurrentlyCaptain ? 'YES' : 'NO'}</span>
             </div>
          </div>
          
          {/* Recent Disciplinary Logs */}
          <div className="bg-card rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border overflow-hidden flex flex-col min-h-[350px]">
            <div className="px-6 py-4 border-b border-border bg-card flex justify-between items-center">
              <h3 className="type-h5 font-bold text-text-primary">Discipline Action History</h3>
              <button 
                onClick={() => id && fetchHistoryLogs(id)} 
                className="p-1.5 hover:bg-bg rounded-lg text-text-secondary transition-colors cursor-pointer"
                title="Refresh logs"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isLoadingHistory ? (
              <div className="p-8 text-center text-text-muted type-body-sm">Loading history logs...</div>
            ) : historyLogs.length === 0 ? (
              <div className="p-8 flex-1 flex flex-col items-center justify-center text-text-muted">
                <FileWarning className="w-12 h-12 mb-3 opacity-20" />
                <p className="type-body-sm font-medium">No discipline logs recorded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border max-h-96 overflow-y-auto">
                {historyLogs.map((log: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-bg transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg border border-border ${log.points >= 0 ? 'bg-success-tint text-success' : 'bg-accent-tint text-accent'}`}>
                        {log.points >= 0 ? <PlusCircle className="w-4 h-4" /> : <MinusCircle className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold text-text-primary type-body-sm">{log.reason || 'Point adjustment'}</div>
                        <div className="type-fine text-text-muted">
                          {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'Recent'}
                        </div>
                      </div>
                    </div>
                    <div className={`type-body-sm font-bold ${log.points >= 0 ? 'text-success' : 'text-accent'}`}>
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
        <div className="fixed inset-0 bg-text-primary/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card text-text-primary rounded-lg w-full max-w-md overflow-hidden shadow-2xl border border-border">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="font-heading font-bold text-text-primary type-h3">Adjust Discipline Points</h3>
              <button onClick={() => setIsAdjustModalOpen(false)} className="p-1 text-text-secondary hover:bg-bg rounded-lg cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustPoints} className="p-6 space-y-4">
              <div>
                <label className="type-form-label block font-bold text-text-primary mb-1">Points (+ or -)</label>
                <input 
                  type="number" 
                  required 
                  value={points} 
                  onChange={(e) => setPoints(parseInt(e.target.value) || 0)} 
                  className="w-full p-2.5 bg-bg border border-border rounded-lg focus:border-accent outline-none font-bold text-text-primary" 
                  placeholder="e.g. 5 or -10" 
                />
                <span className="type-fine text-text-muted mt-1 block">Use positive number to reward, negative number to deduct.</span>
              </div>

              <div>
                <label className="type-form-label block font-bold text-text-primary mb-1">Reason *</label>
                <textarea 
                  required 
                  rows={3} 
                  value={reason} 
                  onChange={(e) => setReason(e.target.value)} 
                  className="w-full p-2.5 bg-bg border border-border rounded-lg focus:border-accent outline-none type-body-sm text-text-primary placeholder:text-text-muted" 
                  placeholder="Provide a reason for point modification..." 
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setIsAdjustModalOpen(false)} 
                  className="px-5 py-2.5 type-btn bg-bg border border-border text-text-primary hover:bg-border rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmittingPoints} 
                  className="px-6 py-2.5 type-caption font-bold text-card bg-accent hover:bg-accent-hover rounded-lg shadow-none transition-colors disabled:opacity-50 cursor-pointer"
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
      <Footer />
    </div>
  );
}
