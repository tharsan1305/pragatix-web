import { useEffect, useState } from 'react';
import { ArrowLeft, RefreshCw, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

interface Props {
  academicYear?: string;
  onBack: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_OF_WEEK = [
  'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'
];

const WEEK_COLORS = [
  'bg-emerald-100 text-emerald-900 border-emerald-300',
  'bg-sky-100 text-sky-900 border-sky-300',
  'bg-amber-100 text-amber-900 border-amber-300',
  'bg-purple-100 text-purple-900 border-purple-300',
  'bg-orange-100 text-orange-900 border-orange-300',
  'bg-teal-100 text-teal-900 border-teal-300',
];

export default function AcademicCalendarPage({ academicYear = 'FIRST_YEAR', onBack }: Props) {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [isLoading, setIsLoading] = useState(true);

  const [academicMonth, setAcademicMonth] = useState<any>(null);
  const [allWeeks, setAllWeeks] = useState<any[]>([]);
  const [allHolidays, setAllHolidays] = useState<any[]>([]);
  const [allAlternateWorkingDays, setAllAlternateWorkingDays] = useState<any[]>([]);

  const [pendingWeekStart, setPendingWeekStart] = useState<Date | null>(null);

  // Modals state
  const [selectedDateModal, setSelectedDateModal] = useState<Date | null>(null);
  const [holidayNameInput, setHolidayNameInput] = useState('');
  const [showHolidayModal, setShowHolidayModal] = useState(false);

  const [showAwdModal, setShowAwdModal] = useState(false);
  const [awdForm, setAwdForm] = useState({
    originalHolidayDay: 'SATURDAY',
    workingDay: 'WEDNESDAY',
    reason: ''
  });

  useEffect(() => {
    loadCalendarData();
  }, [selectedMonth, selectedYear, academicYear]);

  const loadCalendarData = async () => {
    setIsLoading(true);
    try {
      // Get / Create Current Month
      const monthRes = await apiClient.get('/api/v1/academic-calendar/month', {
        params: { month: selectedMonth, year: selectedYear, academicYear }
      });
      const currData = monthRes.data?.data;
      setAcademicMonth(currData);

      // Previous Month
      let prevMonth = selectedMonth - 1;
      let prevYear = selectedYear;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear -= 1;
      }
      const prevRes = await apiClient.get('/api/v1/academic-calendar/month', {
        params: { month: prevMonth, year: prevYear, academicYear }
      });
      const prevData = prevRes.data?.data;

      // Next Month
      let nextMonth = selectedMonth + 1;
      let nextYear = selectedYear;
      if (nextMonth === 13) {
        nextMonth = 1;
        nextYear += 1;
      }
      const nextRes = await apiClient.get('/api/v1/academic-calendar/month', {
        params: { month: nextMonth, year: nextYear, academicYear }
      });
      const nextData = nextRes.data?.data;

      // Fetch weeks, holidays, AWD for all 3 months
      const [w1, w2, w3] = await Promise.all([
        apiClient.get(`/api/v1/academic-calendar/month/${prevData.id}/weeks`),
        apiClient.get(`/api/v1/academic-calendar/month/${currData.id}/weeks`),
        apiClient.get(`/api/v1/academic-calendar/month/${nextData.id}/weeks`),
      ]);

      const [h1, h2, h3] = await Promise.all([
        apiClient.get(`/api/v1/academic-calendar/month/${prevData.id}/holidays`),
        apiClient.get(`/api/v1/academic-calendar/month/${currData.id}/holidays`),
        apiClient.get(`/api/v1/academic-calendar/month/${nextData.id}/holidays`),
      ]);

      const [a1, a2, a3] = await Promise.all([
        apiClient.get(`/api/v1/academic-calendar/month/${prevData.id}/alternate-working-days`),
        apiClient.get(`/api/v1/academic-calendar/month/${currData.id}/alternate-working-days`),
        apiClient.get(`/api/v1/academic-calendar/month/${nextData.id}/alternate-working-days`),
      ]);

      const combinedWeeks = [...(w1.data?.data || []), ...(w2.data?.data || []), ...(w3.data?.data || [])];
      const combinedHolidays = [...(h1.data?.data || []), ...(h2.data?.data || []), ...(h3.data?.data || [])];
      const combinedAWD = [...(a1.data?.data || []), ...(a2.data?.data || []), ...(a3.data?.data || [])];

      combinedWeeks.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      combinedHolidays.sort((a, b) => new Date(a.holidayDate).getTime() - new Date(b.holidayDate).getTime());
      combinedAWD.sort((a, b) => new Date(a.effectiveDate).getTime() - new Date(b.effectiveDate).getTime());

      setAllWeeks(combinedWeeks);
      setAllHolidays(combinedHolidays);
      setAllAlternateWorkingDays(combinedAWD);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to load academic calendar data');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper date functions
  const formatDateStr = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Build calendar matrix (Sunday to Saturday)
  const getCalendarDays = () => {
    const firstDay = new Date(selectedYear, selectedMonth - 1, 1);
    const lastDay = new Date(selectedYear, selectedMonth, 0);

    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday
    const totalDays = lastDay.getDate();

    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];

    // Previous month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(selectedYear, selectedMonth - 1, -i);
      days.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      const d = new Date(selectedYear, selectedMonth - 1, i);
      days.push({ date: d, isCurrentMonth: true });
    }

    // Next month padding to fill grid (42 items total for 6 rows)
    const totalCellsNeeded = 42;
    const remaining = totalCellsNeeded - days.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(selectedYear, selectedMonth, i);
      days.push({ date: d, isCurrentMonth: false });
    }

    return days;
  };

  const getWeekForDate = (date: Date) => {
    return allWeeks.find((w) => {
      const s = new Date(w.startDate);
      const e = new Date(w.endDate);
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return date >= s && date <= e;
    });
  };

  const getHolidayForDate = (date: Date) => {
    const dStr = formatDateStr(date);
    return allHolidays.find((h) => h.holidayDate === dStr);
  };

  const getAwdForDate = (date: Date) => {
    const dStr = formatDateStr(date);
    return allAlternateWorkingDays.find((a) => a.effectiveDate === dStr);
  };

  // Action API calls
  const handleCreateWeek = async (start: Date, end: Date) => {
    if (end < start) {
      toast.error('Week End cannot be before Week Start');
      return;
    }

    // Check overlap
    const hasOverlap = allWeeks.some((w) => {
      const s = new Date(w.startDate);
      const e = new Date(w.endDate);
      return !(end < s || start > e);
    });

    if (hasOverlap) {
      toast.error('Cannot overlap with existing configured weeks');
      return;
    }

    setIsLoading(true);
    try {
      const currentMonthWeeks = allWeeks.filter((w) => w.academicMonthId === academicMonth?.id);
      const weekNum = currentMonthWeeks.length + 1;

      await apiClient.post('/api/v1/academic-calendar/weeks', {
        academicMonthId: academicMonth.id,
        weekNumber: weekNum,
        startDate: formatDateStr(start),
        endDate: formatDateStr(end),
      });

      setPendingWeekStart(null);
      toast.success('Week configuration added');
      await loadCalendarData();
    } catch (e: any) {
      setIsLoading(false);
      toast.error(e.response?.data?.message || 'Failed to add week');
    }
  };

  const handleCreateHoliday = async () => {
    if (!selectedDateModal || !holidayNameInput.trim()) return;

    setIsLoading(true);
    try {
      await apiClient.post('/api/v1/academic-calendar/holidays', {
        academicMonthId: academicMonth.id,
        holidayName: holidayNameInput.trim(),
        holidayDate: formatDateStr(selectedDateModal),
      });
      setShowHolidayModal(false);
      setHolidayNameInput('');
      setSelectedDateModal(null);
      toast.success('Holiday added');
      await loadCalendarData();
    } catch (e: any) {
      setIsLoading(false);
      toast.error(e.response?.data?.message || 'Failed to add holiday');
    }
  };

  const handleCreateAwd = async () => {
    if (!selectedDateModal || !awdForm.reason.trim()) {
      toast.error('Please enter a reason');
      return;
    }

    setIsLoading(true);
    try {
      await apiClient.post('/api/v1/academic-calendar/alternate-working-days', {
        academicMonthId: academicMonth.id,
        effectiveDate: formatDateStr(selectedDateModal),
        originalHolidayDay: awdForm.originalHolidayDay,
        workingDay: awdForm.workingDay,
        reason: awdForm.reason.trim(),
      });
      setShowAwdModal(false);
      setAwdForm({ originalHolidayDay: 'SATURDAY', workingDay: 'WEDNESDAY', reason: '' });
      setSelectedDateModal(null);
      toast.success('Alternate working day added');
      await loadCalendarData();
    } catch (e: any) {
      setIsLoading(false);
      toast.error(e.response?.data?.message || 'Failed to add alternate working day');
    }
  };

  const handleDeleteConfig = async (week: any, holiday: any, awd: any) => {
    setIsLoading(true);
    try {
      if (week) {
        await apiClient.delete(`/api/v1/academic-calendar/weeks/${week.id}`);
        toast.success('Week removed');
      }
      if (holiday) {
        await apiClient.delete(`/api/v1/academic-calendar/holidays/${holiday.id}`);
        toast.success('Holiday removed');
      }
      if (awd) {
        await apiClient.delete(`/api/v1/academic-calendar/alternate-working-days/${awd.id}`);
        toast.success('Alternate working day removed');
      }
      setSelectedDateModal(null);
      await loadCalendarData();
    } catch (e: any) {
      setIsLoading(false);
      toast.error(e.response?.data?.message || 'Failed to delete configuration');
    }
  };

  const calendarGrid = getCalendarDays();
  const currentMonthAwdList = allAlternateWorkingDays.filter(
    (a) => a.academicMonthId === academicMonth?.id
  );

  return (
    <div className="flex flex-col min-h-full bg-slate-50 pb-20">
      {/* Header Bar */}
      <div className="bg-[#1E293B] px-6 pt-10 pb-5 shadow-md text-white flex items-center space-x-4">
        <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Monthly Academic Calendar</h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-2xl mx-auto w-full space-y-4">
        {/* Month & Year Selectors */}
        <div className="flex items-center justify-center space-x-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-sm font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-slate-400"
          >
            {MONTH_NAMES.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-sm font-bold rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-slate-400"
          >
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <button
            onClick={loadCalendarData}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Calendar Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
          {/* Days Header */}
          <div className="grid grid-cols-7 text-center font-bold text-xs text-slate-800 pb-2">
            <div>Su</div>
            <div>Mo</div>
            <div>Tu</div>
            <div>We</div>
            <div>Th</div>
            <div>Fr</div>
            <div>Sa</div>
          </div>

          {/* Grid Cells */}
          {isLoading ? (
            <div className="flex justify-center py-20">
              <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarGrid.map((item, idx) => {
                const isSunday = item.date.getDay() === 0;
                const holiday = getHolidayForDate(item.date);
                const isHolidayDay = isSunday || !!holiday;
                const week = getWeekForDate(item.date);
                const awd = getAwdForDate(item.date);

                const isPendingStart =
                  pendingWeekStart &&
                  formatDateStr(pendingWeekStart) === formatDateStr(item.date);

                let bgClasses = 'bg-white text-slate-800 border-slate-200';
                if (!item.isCurrentMonth) {
                  bgClasses = 'bg-slate-50 text-slate-300 border-slate-100';
                } else if (isHolidayDay) {
                  bgClasses = 'bg-red-200/80 text-red-950 font-bold border-red-300';
                } else if (week) {
                  const colorIdx = (week.weekNumber - 1) % WEEK_COLORS.length;
                  bgClasses = WEEK_COLORS[colorIdx];
                }

                if (isPendingStart) {
                  bgClasses = 'bg-emerald-400 text-white font-bold border-emerald-600 ring-2 ring-emerald-500';
                }

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateModal(item.date)}
                    className={`relative h-12 sm:h-14 rounded-xl border flex flex-col items-center justify-center cursor-pointer transition-transform active:scale-95 text-sm font-semibold select-none ${bgClasses}`}
                  >
                    <span>{item.date.getDate()}</span>

                    {/* Star Icon for Holidays */}
                    {isHolidayDay && item.isCurrentMonth && (
                      <Star className="w-3 h-3 text-red-600 fill-red-600 absolute top-1 right-1" />
                    )}

                    {/* Badge for AWD */}
                    {awd && item.isCurrentMonth && (
                      <span className="text-[9px] font-extrabold bg-blue-600 text-white px-1 rounded absolute bottom-1">
                        AWD
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Alternate Working Days Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            Alternate Working Days
          </h2>
          {currentMonthAwdList.length === 0 ? (
            <p className="text-xs text-slate-500 font-medium">
              No alternate working days configured for this month.
            </p>
          ) : (
            <div className="space-y-2">
              {currentMonthAwdList.map((a) => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold space-y-1">
                  <div className="flex justify-between text-slate-800">
                    <span>Date: {a.effectiveDate}</span>
                    <span className="text-blue-600 font-bold">{a.workingDay} for {a.originalHolidayDay}</span>
                  </div>
                  <p className="text-slate-500 font-normal">Reason: {a.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Date Options Modal */}
      {selectedDateModal && !showHolidayModal && !showAwdModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Selected Date: {selectedDateModal.toDateString()}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDateModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              {/* Week Actions */}
              {!pendingWeekStart && !getWeekForDate(selectedDateModal) && (
                <button
                  onClick={() => {
                    setPendingWeekStart(selectedDateModal);
                    setSelectedDateModal(null);
                    toast.success('Week start date set. Click end date to finish week.');
                  }}
                  className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold transition-colors flex items-center justify-between"
                >
                  <span>Set as Week Start</span>
                </button>
              )}

              {pendingWeekStart && formatDateStr(pendingWeekStart) === formatDateStr(selectedDateModal) && (
                <button
                  onClick={() => {
                    setPendingWeekStart(null);
                    setSelectedDateModal(null);
                  }}
                  className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-sm font-bold transition-colors flex items-center justify-between"
                >
                  <span>Cancel Week Start</span>
                </button>
              )}

              {pendingWeekStart && formatDateStr(pendingWeekStart) !== formatDateStr(selectedDateModal) && (
                <button
                  onClick={() => {
                    const start = pendingWeekStart;
                    const end = selectedDateModal;
                    setSelectedDateModal(null);
                    handleCreateWeek(start, end);
                  }}
                  className="w-full text-left px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-colors flex items-center justify-between shadow-sm"
                >
                  <span>Set as Week End</span>
                </button>
              )}

              {/* Holiday Actions */}
              {!getHolidayForDate(selectedDateModal) && (
                <button
                  onClick={() => setShowHolidayModal(true)}
                  className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-amber-50 text-amber-700 rounded-xl text-sm font-bold transition-colors"
                >
                  Mark as Holiday
                </button>
              )}

              {/* AWD Actions */}
              {!getAwdForDate(selectedDateModal) && (
                <button
                  onClick={() => setShowAwdModal(true)}
                  className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-blue-50 text-blue-700 rounded-xl text-sm font-bold transition-colors"
                >
                  Set as Alternate Working Day
                </button>
              )}

              {/* Remove Configurations */}
              {(getWeekForDate(selectedDateModal) ||
                getHolidayForDate(selectedDateModal) ||
                getAwdForDate(selectedDateModal)) && (
                <button
                  onClick={() =>
                    handleDeleteConfig(
                      getWeekForDate(selectedDateModal),
                      getHolidayForDate(selectedDateModal),
                      getAwdForDate(selectedDateModal)
                    )
                  }
                  className="w-full text-left px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-sm font-bold transition-colors"
                >
                  Remove Configuration
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Holiday Name Modal */}
      {showHolidayModal && selectedDateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Holiday Name</h3>
            <input
              type="text"
              placeholder="Enter holiday name"
              value={holidayNameInput}
              onChange={(e) => setHolidayNameInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-slate-400 font-medium"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowHolidayModal(false);
                  setHolidayNameInput('');
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHoliday}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alternate Working Day Modal */}
      {showAwdModal && selectedDateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-slate-900">Add Alternate Working Day</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Effective Date</label>
                <div className="px-3.5 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700">
                  {formatDateStr(selectedDateModal)}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Original Holiday Day</label>
                <select
                  value={awdForm.originalHolidayDay}
                  onChange={(e) => setAwdForm({ ...awdForm, originalHolidayDay: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Working Day</label>
                <select
                  value={awdForm.workingDay}
                  onChange={(e) => setAwdForm({ ...awdForm, workingDay: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold outline-none"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason (e.g. Saturday Compensation)</label>
                <input
                  type="text"
                  placeholder="Enter reason"
                  value={awdForm.reason}
                  onChange={(e) => setAwdForm({ ...awdForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setShowAwdModal(false);
                  setAwdForm({ originalHolidayDay: 'SATURDAY', workingDay: 'WEDNESDAY', reason: '' });
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAwd}
                className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
