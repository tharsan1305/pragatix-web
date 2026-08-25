import { logger } from '../../../utils/logger';
import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RefreshCw, AlertCircle, Calendar, X, ArrowLeft } from 'lucide-react';
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

interface StudentAttendanceTabProps {
  onBack?: () => void;
}

export default function StudentAttendanceTab({ onBack }: StudentAttendanceTabProps) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'present' | 'absent'>('all');

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate]);

  const fetchAttendance = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const historyUrl = selectedDate
        ? `/api/student/attendance/history?date=${selectedDate}`
        : '/api/student/attendance/history';

      const [summaryRes, historyRes] = await Promise.allSettled([
        apiClient.get('/api/student/attendance/summary'),
        apiClient.get(historyUrl),
      ]);

      if (summaryRes.status === 'fulfilled' && summaryRes.value?.data?.data) {
        setStats(summaryRes.value.data.data);
      }

      if (historyRes.status === 'fulfilled' && historyRes.value?.data?.data) {
        const rawHistory = historyRes.value.data.data;
        const normalized: AttendanceRecord[] = Array.isArray(rawHistory)
          ? rawHistory.map((item: any) => ({
              date: item.date || item.attendanceDate || '',
              period: item.period ?? item.periodNumber,
              status: (item.status === 'PRESENT' || item.status === 'ABSENT')
                ? item.status
                : item.isPresent ? 'PRESENT' : 'ABSENT',
              remarks: item.remarks || '',
            }))
          : [];
        setRecords(normalized);
      }
    } catch (err: any) {
      logger.error('Failed to fetch attendance:', err);
      setError(err?.message || 'Error loading attendance data');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter records based on active tab
  const filteredRecords = records.filter((r) => {
    if (activeFilter === 'present') return r.status === 'PRESENT';
    if (activeFilter === 'absent') return r.status === 'ABSENT';
    return true;
  });

  const presentCount = records.filter((r) => r.status === 'PRESENT').length;
  const absentCount = records.filter((r) => r.status === 'ABSENT').length;

  return (
    <div className="bg-bg min-h-screen pb-24 text-text-primary">
      {/* Top Header Bar */}
      <div className="bg-card text-text-primary px-6 lg:px-8 py-4 sticky top-0 z-10 border-b border-border shadow-[0_1px_3px_rgba(0,0,0,0.04)] flex justify-between items-center">
        <div className="flex items-center space-x-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 border border-border bg-card hover:bg-bg rounded-lg transition-colors cursor-pointer text-text-secondary hover:text-text-primary"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-black text-text-primary tracking-tight">Attendance Records</h1>
            <p className="text-xs text-text-muted font-medium mt-0.5">Track your overall and monthly class attendance performance</p>
          </div>
        </div>

        <button
          onClick={fetchAttendance}
          className="p-2 bg-bg hover:bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
          title="Refresh Attendance"
        >
          <RefreshCw className={`w-4 h-4 text-accent ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-5 lg:p-7 xl:p-8 max-w-[1400px] mx-auto">
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-card p-6 rounded-2xl border border-border text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-text-muted mx-auto" />
            <p className="text-sm text-text-secondary font-semibold">{error}</p>
            <button
              onClick={fetchAttendance}
              className="px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm rounded-xl font-bold transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : !stats ? (
          <div className="bg-card p-8 rounded-2xl text-center text-text-muted border border-border">
            No stats found.
            <button onClick={fetchAttendance} className="block mx-auto mt-2 text-xs font-bold text-accent">
              Tap to retry
            </button>
          </div>
        ) : (
          <>
            {/* 4 Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
              <div className="bg-card p-5 rounded-2xl border border-border flex flex-col gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Overall Rate</span>
                <div className="text-3xl font-black text-text-primary">{stats.percentage}%</div>
              </div>
              <div className="bg-card p-5 rounded-2xl border border-border flex flex-col gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">This Month</span>
                <div className="text-3xl font-black text-text-secondary">{stats.monthlyPercentage}%</div>
              </div>
              <div className="bg-card p-5 rounded-2xl border border-border flex flex-col gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Present Days</span>
                <div className="text-3xl font-black text-text-primary">{stats.presentDays}</div>
              </div>
              <div className="bg-card p-5 rounded-2xl border border-border flex flex-col gap-2 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Absent Days</span>
                <div className="text-3xl font-black text-text-secondary">{stats.absentDays}</div>
              </div>
            </div>

            {/* Attendance Target Calculator Banner */}
            <div className="bg-card rounded-2xl border border-border p-4.5 mb-6 flex items-center justify-between gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-tint border border-accent/20 text-accent flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="type-body-sm font-bold text-text-primary">Attendance Standing & Target</h3>
                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-bg border border-border uppercase">
                      {stats.percentage >= 95 ? 'EXCELLENT' : stats.percentage >= 75 ? 'GOOD STANDING' : 'NEEDS IMPROVEMENT'}
                    </span>
                  </div>
                  <p className="type-caption text-text-secondary font-medium mt-0.5">
                    {stats.percentage >= 95 
                      ? 'You are maintaining above the 95% distinction threshold. Keep up the high discipline!'
                      : stats.percentage >= 80
                      ? 'Attend all upcoming class hours this week to reach 95% attendance standing.'
                      : 'Attendance is below optimum requirement. Maintain full attendance for upcoming sessions.'}
                  </p>
                </div>
              </div>
              <div className="hidden md:flex text-right shrink-0">
                <span className="type-fine font-bold text-text-muted uppercase tracking-wider">Target: 95%</span>
              </div>
            </div>

            {/* Attendance History Header & Date Filter */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-base font-black text-text-primary">Attendance History</h2>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 bg-card px-3.5 py-2 rounded-xl border border-border">
                    <Calendar className="w-4 h-4 text-accent shrink-0" />
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="text-xs font-bold text-text-primary bg-transparent outline-none cursor-pointer"
                    />
                  </div>
                  {selectedDate && (
                    <button
                      onClick={() => setSelectedDate('')}
                      className="text-xs font-bold text-text-secondary hover:text-text-primary px-2.5 py-2 bg-bg border border-border rounded-xl flex items-center gap-1 transition cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex bg-card p-1 rounded-xl border border-border text-xs font-bold w-full sm:w-auto gap-1">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`flex-1 sm:px-5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'all'
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg'
                  }`}
                >
                  All ({records.length})
                </button>
                <button
                  onClick={() => setActiveFilter('present')}
                  className={`flex-1 sm:px-5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'present'
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg'
                  }`}
                >
                  Present ({presentCount})
                </button>
                <button
                  onClick={() => setActiveFilter('absent')}
                  className={`flex-1 sm:px-5 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeFilter === 'absent'
                      ? 'bg-accent text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg'
                  }`}
                >
                  Absent ({absentCount})
                </button>
              </div>
            </div>

            {/* Logs Listing */}
            {filteredRecords.length === 0 ? (
              <div className="bg-card p-10 rounded-2xl text-center text-text-muted border border-border space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-text-muted mb-2" />
                <p className="text-sm font-semibold text-text-primary">
                  {selectedDate
                    ? 'No attendance records found for this date.'
                    : activeFilter !== 'all'
                    ? `No ${activeFilter} attendance records found.`
                    : 'No attendance history recorded yet.'}
                </p>
                <p className="text-xs text-text-secondary">Class attendance records marked by your faculty will appear here.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-2.5">
                {filteredRecords.map((r, idx) => {
                  const isPresent = r.status === 'PRESENT';

                  return (
                    <div
                      key={idx}
                      className="bg-card rounded-xl p-4 border border-border flex items-center justify-between hover:border-accent/30 transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isPresent ? 'bg-bg border-border text-text-secondary' : 'bg-accent-tint text-accent border-accent/20'
                        }`}>
                          {isPresent ? (
                            <CheckCircle2 className="w-5 h-5 stroke-[2.2]" />
                          ) : (
                            <XCircle className="w-5 h-5 stroke-[2.2]" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="text-sm font-bold text-text-primary truncate">
                            Date: {r.date} {r.period ? `• Period ${r.period}` : ''}
                          </div>
                          {r.remarks ? (
                            <div className="text-xs text-text-secondary truncate mt-0.5 font-medium">
                              Note: {r.remarks}
                            </div>
                          ) : (
                            <div className="text-xs text-text-muted mt-0.5">
                              Regular Class Session
                            </div>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-3 py-1 rounded-md shrink-0 border uppercase tracking-wider ${
                          isPresent
                            ? 'bg-bg text-text-secondary border-border'
                            : 'bg-accent-tint text-accent border-accent/20'
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
