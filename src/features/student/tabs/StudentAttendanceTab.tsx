import { useEffect, useState } from 'react';
import { CalendarCheck, CheckCircle2, XCircle, Clock, RefreshCw, AlertCircle } from 'lucide-react';
import apiClient from '../../../services/apiClient';

interface AttendanceRecord {
  date: string;
  period?: string;
  status: 'PRESENT' | 'ABSENT' | 'ON_DUTY' | 'LATE';
  remarks?: string;
}

export default function StudentAttendanceTab() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    percentage: 100,
    presentDays: 0,
    absentDays: 0,
    totalDays: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let res;
      try {
        res = await apiClient.get('/api/v1/attendance/student/me');
      } catch (_e) {
        res = await apiClient.get('/api/v1/student/attendance');
      }

      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        const recList = d.records || d.logs || [];
        setRecords(recList);

        const present = d.presentDays ?? recList.filter((r: any) => r.status === 'PRESENT').length;
        const absent = d.absentDays ?? recList.filter((r: any) => r.status === 'ABSENT').length;
        const total = d.totalDays ?? recList.length;
        const pct = total > 0 ? Math.round((present / total) * 100) : (d.percentage ?? 100);

        setStats({
          percentage: pct,
          presentDays: present,
          absentDays: absent,
          totalDays: total,
        });
      }
    } catch (e: any) {
      console.warn('Failed to load student attendance:', e);
      setError(e.response?.data?.message || 'Failed to load attendance record');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-5 sticky top-0 z-10 shadow-md flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">My Attendance</h1>
          <p className="text-xs text-slate-400 mt-0.5">Track your class attendance, percentage & daily log</p>
        </div>

        <button
          onClick={fetchAttendance}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors"
          title="Refresh Attendance"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Stat Cards Header */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500">Attendance</span>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats.percentage}%</div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${stats.percentage >= 75 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, stats.percentage))}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-emerald-100 bg-emerald-50/30 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-emerald-700">Present Days</span>
            <div className="text-2xl font-bold text-emerald-700 mt-2">{stats.presentDays}</div>
            <span className="text-[10px] text-emerald-600 font-medium">Attended classes</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-rose-100 bg-rose-50/30 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-rose-700">Absent Days</span>
            <div className="text-2xl font-bold text-rose-700 mt-2">{stats.absentDays}</div>
            <span className="text-[10px] text-rose-600 font-medium">Missed sessions</span>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Classes</span>
            <div className="text-2xl font-bold text-slate-900 mt-2">{stats.totalDays}</div>
            <span className="text-[10px] text-slate-400 font-medium">Recorded sessions</span>
          </div>
        </div>

        {/* Logs Listing */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
        ) : records.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl text-center text-slate-500 border border-slate-200 shadow-sm">
            <CalendarCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="font-bold text-slate-700 text-base">No Attendance Records Yet</h3>
            <p className="text-xs text-slate-400 mt-1">Your attendance logs will appear here once marked by staff.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-base">Attendance History Log</h3>
              <span className="text-xs text-slate-400">{records.length} Entries</span>
            </div>

            <div className="divide-y divide-slate-100">
              {records.map((r, idx) => {
                const isPresent = r.status === 'PRESENT';
                const isAbsent = r.status === 'ABSENT';

                return (
                  <div key={idx} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl ${isPresent ? 'bg-emerald-100 text-emerald-700' : isAbsent ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {isPresent ? <CheckCircle2 className="w-5 h-5" /> : isAbsent ? <XCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 text-sm">{r.date}</div>
                        {r.period && <div className="text-xs text-slate-400">Period: {r.period}</div>}
                      </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${isPresent ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : isAbsent ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                      {r.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
