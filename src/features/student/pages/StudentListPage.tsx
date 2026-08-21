import { useEffect, useState } from 'react';
import { useStudentStore } from '../../../store/studentStore';
import { Search, UserPlus, Filter, MoreVertical, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StudentListPage() {
  const { students, fetchStudents, searchStudents, isLoading, error } = useStudentStore();
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      searchStudents(searchTerm);
    } else {
      fetchStudents();
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold text-slate-800">Students Directory</h1>
          <p className="text-sm text-slate-500 mt-1">Manage and monitor student discipline records</p>
        </div>
        <button 
          onClick={() => {/* Open add modal or navigate */}}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 outline-none"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" />
        </form>
        
        <button className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors w-full sm:w-auto">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2 border border-red-100">
          <ShieldAlert className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                <th className="p-4 font-semibold">Student</th>
                <th className="p-4 font-semibold">ID / Reg No</th>
                <th className="p-4 font-semibold">Department</th>
                <th className="p-4 font-semibold">Year/Sec</th>
                <th className="p-4 font-semibold text-center">Score</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <div className="flex justify-center items-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-600"></div>
                      Loading students...
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student: any) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm">
                          {student.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 flex items-center gap-1.5">
                            {student.teamRole === 'CAPTAIN' && <span className="text-amber-600 text-[10px] font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">👑 Captain</span>}
                            {student.teamRole === 'VICE_CAPTAIN' && <span className="text-slate-700 text-[10px] font-bold bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded">🥈 Vice Captain</span>}
                            <span>{student.fullName}</span>
                          </p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 font-medium">{student.regNo}</td>
                    <td className="p-4 text-slate-600">{student.departmentName || 'N/A'}</td>
                    <td className="p-4 text-slate-600">{student.year}-{student.section}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        student.disciplineScore >= 80 ? 'bg-green-100 text-green-700' :
                        student.disciplineScore >= 50 ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {student.disciplineScore}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        {student.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
