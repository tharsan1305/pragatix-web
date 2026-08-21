import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { RefreshCw, Users, School, Building2, Trophy, Trash2, BarChart3, ArrowRight } from 'lucide-react';
import apiClient from '../../../services/apiClient';

interface Props {
  onPushView: (name: string, props?: any) => void;
}

interface Stats {
  students: number;
  teachers: number;
  departments: number;
}

export default function OverviewTab({ onPushView }: Props) {
  const [stats, setStats] = useState<Stats>({
    students: 0,
    teachers: 0,
    departments: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      let response;
      try {
        response = await apiClient.get('/api/v1/admin/stats');
      } catch {
        response = await apiClient.get('/api/admin/dashboard/stats');
      }
      if (response && response.data) {
        const data = response.data.data || response.data;
        setStats({
          students: Number(data.totalStudents ?? data.students ?? data.studentCount ?? 0),
          teachers: Number(data.teachersCount ?? data.totalTeachers ?? data.teachers ?? data.teacherCount ?? data.totalFaculty ?? data.facultyCount ?? 0),
          departments: Number(data.totalDepartments ?? data.departments ?? data.departmentCount ?? 0),
        });
      }
    } catch (error) {
      logger.error('Failed to fetch admin stats', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-slate-50">
      {/* Header */}
      <div className="bg-slate-900 px-6 pt-10 pb-6 text-white shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-heading text-2xl font-bold">Admin Overview</h1>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onPushView('analytics')}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-all shadow-sm cursor-pointer"
              title="Analytics Dashboard"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => onPushView('recycle_bin')}
              className="p-2 bg-slate-800 rounded-full text-rose-400 hover:bg-slate-700 hover:text-rose-300 transition-colors cursor-pointer"
              title="Recycle Bin"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={fetchStats}
              className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors cursor-pointer"
              title="Refresh Stats"
            >
              <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        <div>
          <h2 className="font-heading text-xl font-bold text-white mb-0.5">Welcome back, System Admin</h2>
          <p className="text-xs text-slate-300">Here is a summary of the discipline system metrics.</p>
        </div>
      </div>

      <div className="px-6 py-6 max-w-5xl mx-auto w-full space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : (
          <>
            {/* Quick Launch Analytics Banner */}
            <div
              onClick={() => onPushView('analytics')}
              className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white shadow-md cursor-pointer hover:shadow-lg hover:border-indigo-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800 group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-heading font-bold text-sm text-white">Analytics & Executive Reporting</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 tracking-wider">
                      INSTITUTION SCOPE
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Live student engagement, department award vs penalty comparisons & PDF reports
                  </p>
                </div>
              </div>
              <button className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 group-hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-colors shrink-0 shadow-sm cursor-pointer self-start sm:self-auto">
                <span>View Analytics</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Admin Overview Stat Cards (Matching Flutter overview_tab.dart 1:1) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                title="Students"
                count={stats.students.toString()}
                icon={Users}
                color="text-blue-600"
                bgColor="bg-blue-50"
                borderColor="border-blue-100"
                onClick={() => onPushView('students')}
              />
              <StatCard
                title="Teachers"
                count={stats.teachers.toString()}
                icon={School}
                color="text-emerald-600"
                bgColor="bg-emerald-50"
                borderColor="border-emerald-100"
                onClick={() => onPushView('teachers')}
              />
              <StatCard
                title="Departments"
                count={stats.departments.toString()}
                icon={Building2}
                color="text-amber-600"
                bgColor="bg-amber-50"
                borderColor="border-amber-100"
                onClick={() => onPushView('departments')}
              />
              <StatCard
                title="Leaderboard"
                count="Live"
                icon={Trophy}
                color="text-rose-600"
                bgColor="bg-rose-50"
                borderColor="border-rose-100"
                onClick={() => onPushView('leaderboard')}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, count, icon: Icon, color, bgColor, borderColor, onClick }: any) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl border ${borderColor} shadow-sm p-5 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between`}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl ${bgColor}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
      <div>
        <h4 className="text-3xl font-bold text-slate-900">{count}</h4>
        <p className="text-xs font-semibold text-slate-500 mt-1">{title}</p>
      </div>
    </div>
  );
}
