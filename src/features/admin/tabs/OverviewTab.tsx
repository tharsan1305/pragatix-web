import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { Users, School, Building2, Trophy, RefreshCw } from 'lucide-react';
import apiClient from '../../../services/apiClient';

interface Props {
  onPushView?: (name: string, props?: any) => void;
}

export default function OverviewTab({ onPushView = () => {} }: Props) {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    departments: 0,
    alerts: 0,
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
        const resObj = response.data.data || response.data;
        setStats({
          students: resObj.totalStudents ?? resObj.students ?? resObj.studentCount ?? 0,
          teachers:
            resObj.teachersCount ??
            resObj.totalTeachers ??
            resObj.teachers ??
            resObj.teacherCount ??
            resObj.totalFaculty ??
            resObj.facultyCount ??
            0,
          departments: resObj.totalDepartments ?? resObj.departments ?? resObj.departmentCount ?? 0,
          alerts:
            resObj.totalAlerts ?? resObj.alerts ?? resObj.alertCount ?? resObj.pendingBadgeRequests ?? resObj.atRiskCount ?? 0,
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
          <h1 className="text-2xl font-bold">Admin Overview</h1>
          <button onClick={fetchStats} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-0.5">Welcome back, System Admin</h2>
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
                count="Top"
                icon={Trophy}
                color="text-rose-600"
                bgColor="bg-rose-50"
                borderColor="border-rose-100"
                onClick={() => onPushView('analytics')}
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
