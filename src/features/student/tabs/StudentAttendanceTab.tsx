import { logger } from '../../../utils/logger';
import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, AlertCircle } from 'lucide-react';
import apiClient from '../../../services/apiClient';

interface AttendanceRecord {
  date: string;
  period?: string | number;
  status: 'PRESENT' | 'ABSENT';
  remarks?: string;
}

interface AttendanceStats {
  percentage: number;
  monthlyPercentage: number;
  presentDays: number;
  absentDays: number;
}

export default function StudentAttendanceTab() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [summaryRes, historyRes] = await Promise.allSettled([
        apiClient.get('/api/student/attendance/summary'),
        apiClient.get('/api/student/attendance/history'),
      ]);

      let summaryData: any = null;
      if (summaryRes.status === 'fulfilled' && summaryRes.value?.data) {
        summaryData = summaryRes.value.data.data || summaryRes.value.data;
      }

      let historyData: any[] = [];
      if (historyRes.status === 'fulfilled' && historyRes.value?.data) {
        const rawHist = historyRes.value.data.data || historyRes.value.data;
        historyData = Array.isArray(rawHist) ? rawHist : (rawHist.content || []);
      }

      if (summaryData) {
        setStats({
          percentage: Math.round(summaryData.attendancePercentage ?? 0),
          monthlyPercentage: Math.round(summaryData.monthlyAttendancePercentage ?? 0),
          presentDays: summaryData.totalPresentDays ?? 0,
          absentDays: summaryData.totalAbsentDays ?? 0,
        });
      } else {
        setStats(null);
      }

      setRecords(historyData);
    } catch (e: any) {
      logger.warn('Failed to load student attendance:', e);
      setError(e.response?.data?.message || 'Failed to load attendance record');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-24">
      {/* Header Bar matching Flutter AppBar */}
      <div className="bg-slate-900 text-white px-6 py-4 sticky top-0 z-10 shadow-md flex items-center justify-between">
        <h1 className="text-xl font-bold">Attendance</h1>

        <button
          onClick={fetchAttendance}
          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-white transition-colors"
          title="Refresh Attendance"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 max-w-3xl mx-auto space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-2xl flex items-center space-x-3 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : !stats ? (
          <div className="bg-white p-8 rounded-2xl text-center border border-slate-100 shadow-sm flex flex-col items-center gap-4">
            <p className="text-sm font-medium text-slate-500">No attendance data available.</p>
            <button
              onClick={fetchAttendance}
              className="inline-flex items-center px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold shadow-md hover:bg-indigo-700 transition"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        ) : (
          <>
        {/* 4 Summary Cards matching Flutter _buildSummaryCards */}
        <div className="grid grid-cols-2 gap-4">
          {/* Card 1: Overall */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-[90px]">
            <span className="text-xs font-semibold text-slate-500">Overall</span>
            <div className="text-2xl font-bold text-blue-600">{stats.percentage}%</div>
          </div>

          {/* Card 2: Monthly */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-[90px]">
            <span className="text-xs font-semibold text-slate-500">Monthly</span>
            <div className="text-2xl font-bold text-teal-600">{stats.monthlyPercentage}%</div>
          </div>

          {/* Card 3: Present Days */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-[90px]">
            <span className="text-xs font-semibold text-slate-500">Present Days</span>
            <div className="text-2xl font-bold text-emerald-600">{stats.presentDays}</div>
          </div>

          {/* Card 4: Absent Days */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between h-[90px]">
            <span className="text-xs font-semibold text-slate-500">Absent Days</span>
            <div className="text-2xl font-bold text-rose-600">{stats.absentDays}</div>
          </div>
        </div>

        {/* Section Title */}
        <h2 className="text-lg font-bold text-slate-800 pt-2">Attendance History</h2>

        {/* Logs Listing matching Flutter _buildHistoryList */}
        {records.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl text-center text-slate-500 border border-slate-100 shadow-sm">
            <p className="text-sm font-medium">No history available.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {records.map((r, idx) => {
              const isPresent = r.status === 'PRESENT';

              return (
                <div
                  key={idx}
                  className="bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isPresent ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                    
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-slate-800 truncate">
                        Date: {r.date} {r.period ? `| Period: ${r.period}` : ''}
                      </div>
                      {r.remarks && (
                        <div className="text-xs text-slate-400 truncate">
                          Remarks: {r.remarks}
                        </div>
                      )}
                    </div>
                  </div>

                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-md shrink-0 ${
                      isPresent
                        ? 'text-emerald-600 bg-emerald-50'
                        : 'text-rose-600 bg-rose-50'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
