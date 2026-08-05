import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Search, CheckCircle, XCircle, Award, AlertCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { activityService } from '../api/activityService';

export default function ActivityExecutionPageV2() {
  const { activityId } = useParams<{ activityId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Award Modal state
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [awardXp, setAwardXp] = useState<number>(10);
  const [remarks, setRemarks] = useState('');
  const [resultStatus, setResultStatus] = useState<'PASS' | 'FAIL'>('PASS');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [activityId]);

  const loadData = async () => {
    if (!activityId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await activityService.fetchExecutionStudents(parseInt(activityId, 10));
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activity execution details.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAwardModal = (student: any, isPass: boolean) => {
    setSelectedStudent(student);
    setResultStatus(isPass ? 'PASS' : 'FAIL');
    setAwardXp(isPass ? (data?.activity?.xpReward || 10) : 0);
    setRemarks(isPass ? 'Activity completed successfully' : 'Did not meet requirements');
  };

  const handleSubmitAward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !data || !activityId) return;

    setIsSubmitting(true);
    const toastId = toast.loading(`Logging ${resultStatus} for ${selectedStudent.fullName}...`);
    try {
      await activityService.awardXp(
        selectedStudent.id,
        data.activity.id,
        data.assignment.id,
        awardXp,
        remarks,
        resultStatus
      );
      toast.dismiss(toastId);
      toast.success(`Successfully logged ${resultStatus} for ${selectedStudent.fullName}!`);
      setSelectedStudent(null);
      loadData(); // refresh list
    } catch (err: any) {
      toast.dismiss(toastId);
      toast.error(err.message || 'Failed to submit award');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p>{error || 'Execution data not found'}</p>
        </div>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  const studentsList = data.students || data.studentList || [];
  const filteredStudents = studentsList.filter((s: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (s.fullName || '').toLowerCase().includes(q) || (s.regNo || '').toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-slate-900 px-6 py-5 text-white shadow-md flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">{data.activity?.name || 'Activity Execution'}</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {data.assignment?.departmentName || 'Scope'} | Max XP: {data.activity?.xpReward || 0}
            </p>
          </div>
        </div>

        <button 
          onClick={loadData}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by student name or register number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
          />
        </div>

        {/* Student List Grid */}
        {filteredStudents.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center text-slate-500 border border-slate-200">
            No students found for this activity assignment.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStudents.map((student: any) => {
              const isAwarded = student.isCompleted || student.status === 'PASS';
              return (
                <div 
                  key={student.id || student.regNo} 
                  className={`bg-white p-5 rounded-2xl border transition-all ${
                    isAwarded ? 'border-green-200 bg-green-50/20' : 'border-slate-200 shadow-sm hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg">
                      {student.fullName?.charAt(0) || 'S'}
                    </div>
                    {isAwarded && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                        <CheckCircle className="w-3.5 h-3.5" /> PASSED
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-slate-800 truncate text-base">{student.fullName}</h3>
                  <p className="text-xs text-slate-500 font-mono mb-4">{student.regNo || student.studentId}</p>

                  <div className="flex gap-2 border-t border-slate-100 pt-3">
                    <button
                      onClick={() => handleOpenAwardModal(student, true)}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Award className="w-4 h-4" /> Pass / Award
                    </button>
                    <button
                      onClick={() => handleOpenAwardModal(student, false)}
                      className="py-2 px-3 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl text-xs transition-colors flex items-center justify-center"
                      title="Fail Activity"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Award Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg">
                Log {resultStatus} for {selectedStudent.fullName}
              </h3>
            </div>

            <form onSubmit={handleSubmitAward} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">XP Points</label>
                <input
                  type="number"
                  required
                  value={awardXp}
                  onChange={(e) => setAwardXp(parseInt(e.target.value) || 0)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Remarks / Feedback</label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-sm"
                  placeholder="Optional remarks..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudent(null)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
