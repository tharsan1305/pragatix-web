import { useEffect, useState } from 'react';
import { useStudentStore } from '../../../store/studentStore';
import { Search, Filter, MoreVertical, ShieldAlert, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../../components/common/Footer';

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
    <div className="flex flex-col min-h-screen bg-bg text-text-primary justify-between">
      <div className="p-6 md:p-8 space-y-6 flex-1 max-w-7xl w-full mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="type-h3 font-bold text-text-primary">Students Directory</h1>
          <p className="type-body-sm text-text-secondary mt-1 font-medium">Manage and monitor student discipline records</p>
        </div>
        <button 
          onClick={() => {/* Open add modal or navigate */}}
          className="bg-accent hover:bg-accent-hover text-card px-4 py-2 rounded-lg type-body-sm font-bold transition-colors flex items-center gap-2 cursor-pointer shadow-none"
        >
          <UserPlus className="w-4 h-4" />
          Add Student
        </button>
      </div>

      <div className="bg-card p-4 rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border flex flex-col sm:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="relative w-full sm:max-w-md">
          <input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-bg border border-border rounded-lg focus:border-accent text-text-primary placeholder:text-text-muted outline-none"
          />
          <Search className="w-5 h-5 text-text-muted absolute left-3 top-2.5" />
        </form>
        
        <button className="flex items-center gap-2 type-btn px-4 py-2 bg-card border border-border rounded-lg text-text-primary hover:bg-bg transition-colors w-full sm:w-auto cursor-pointer">
          <Filter className="w-4 h-4" />
          <span className="type-body-sm font-medium">Filters</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-card border border-accent/30 text-accent rounded-lg flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="bg-card rounded-lg shadow-[0_1px_2px_rgba(0,0,0,0.03)] border border-border flex-1 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg border-b border-border text-text-secondary type-table-head">
                <th className="p-4 type-table-head font-bold">Student</th>
                <th className="p-4 type-table-head font-bold">ID / Reg No</th>
                <th className="p-4 type-table-head font-bold">Department</th>
                <th className="p-4 type-table-head font-bold">Year/Sec</th>
                <th className="p-4 type-table-head font-bold text-center">Score</th>
                <th className="p-4 type-table-head font-bold">Status</th>
                <th className="p-4 type-table-head font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted">
                    <div className="flex justify-center items-center gap-2">
                      Loading students...
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-text-muted font-medium">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student: any) => (
                  <tr key={student.id} className="hover:bg-bg transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-bg border border-border text-text-primary flex items-center justify-center font-bold type-body-sm">
                          {student.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-text-primary flex items-center gap-1.5">
                            {student.teamRole === 'CAPTAIN' && <span className="text-accent text-[10px] font-bold bg-accent-tint border border-accent/30 px-1.5 py-0.5 rounded">👑 Captain</span>}
                            {student.teamRole === 'VICE_CAPTAIN' && <span className="text-text-secondary text-[10px] font-bold bg-bg border border-border px-1.5 py-0.5 rounded">🥈 Vice Captain</span>}
                            <span>{student.fullName}</span>
                          </p>
                          <p className="type-caption text-text-muted">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-text-primary font-medium">{student.regNo}</td>
                    <td className="p-4 text-text-secondary">{student.departmentName || 'N/A'}</td>
                    <td className="p-4 text-text-secondary">{student.year}-{student.section}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-md type-caption font-bold border ${
                        student.disciplineScore >= 80 ? 'bg-success-tint border-success/30 text-success' :
                        student.disciplineScore >= 50 ? 'bg-warning-tint border-warning/30 text-warning' :
                        'bg-accent-tint border-accent/30 text-accent'
                      }`}>
                        {student.disciplineScore}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md type-caption font-bold bg-bg border border-border text-text-secondary">
                        {student.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => navigate(`/students/${student.id}`)}
                        className="p-2 text-text-muted hover:text-text-primary hover:bg-bg border border-transparent hover:border-border rounded-lg transition-colors cursor-pointer"
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
    <Footer />
  </div>
);
}
