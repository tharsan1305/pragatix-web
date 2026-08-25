import { logger } from '../../../utils/logger';
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
  'bg-emerald-50 text-emerald-950 border-emerald-200',
  'bg-sky-50 text-sky-950 border-sky-200',
  'bg-amber-50 text-amber-950 border-amber-200',
  'bg-purple-50 text-purple-950 border-purple-200',
  'bg-orange-50 text-orange-950 border-orange-200',
  'bg-teal-50 text-teal-950 border-teal-200',
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
      logger.error(e);
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
    <div className="flex flex-col min-h-full bg-bg text-text-primary pb-20">
      {/* Top Header Bar */}
      <div className="bg-card text-text-primary px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3.5">
          <button 
            onClick={onBack} 
            className="px-3.5 py-2 bg-card border border-border rounded-lg text-text-primary hover:bg-bg transition-colors cursor-pointer flex items-center gap-2 font-bold type-caption"
            title="Back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="type-h3 font-bold text-text-primary tracking-tight">Monthly Academic Calendar</h1>
              <span className="px-2.5 py-0.5 rounded-md type-fine font-bold uppercase bg-bg text-text-secondary border border-border">
                {academicYear.replace('_', ' ')}
              </span>
            </div>
            <p className="type-caption text-text-secondary font-medium mt-0.5">
              Configure academic weeks, official holidays, and alternate working days
            </p>
          </div>
        </div>

        <button
          onClick={loadCalendarData}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-accent' : ''}`} />
          <span className="type-caption font-bold hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="p-4 sm:p-6 max-w-4xl mx-auto w-full space-y-6">
        {/* Month & Year Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-card p-4 rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center space-x-3">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-bg border border-border text-text-primary type-body-sm font-bold rounded-lg px-4 py-2 outline-none focus:border-text-primary cursor-pointer"
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
              className="bg-bg border border-border text-text-primary type-body-sm font-bold rounded-lg px-4 py-2 outline-none focus:border-text-primary cursor-pointer"
            >
              {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-accent" />
              Holiday / Sunday
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-text-primary" />
              AWD Working
            </span>
          </div>
        </div>

        {/* Calendar Card */}
        <div className="bg-card rounded-lg border border-border p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
          {/* Days Header */}
          <div className="grid grid-cols-7 text-center font-bold type-fine uppercase text-text-muted border-b border-border pb-3">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Grid Cells */}
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-accent" />
              <p className="type-body-sm text-text-secondary font-medium">Loading calendar days...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {calendarGrid.map((item, idx) => {
                const isSunday = item.date.getDay() === 0;
                const holiday = getHolidayForDate(item.date);
                const isHolidayDay = isSunday || !!holiday;
                const week = getWeekForDate(item.date);
                const awd = getAwdForDate(item.date);

                const isPendingStart =
                  pendingWeekStart &&
                  formatDateStr(pendingWeekStart) === formatDateStr(item.date);

                let bgClasses = 'bg-card text-text-primary border-border hover:border-text-primary';
                if (!item.isCurrentMonth) {
                  bgClasses = 'bg-bg/60 text-text-muted/40 border-border/40';
                } else if (isHolidayDay) {
                  bgClasses = 'bg-accent-tint text-accent font-bold border-accent/30';
                } else if (week) {
                  const colorIdx = (week.weekNumber - 1) % WEEK_COLORS.length;
                  bgClasses = WEEK_COLORS[colorIdx];
                }

                if (isPendingStart) {
                  bgClasses = 'bg-accent text-card font-bold border-accent ring-2 ring-accent/30';
                }

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedDateModal(item.date)}
                    className={`relative h-14 sm:h-16 rounded-lg border flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 type-body-sm font-bold select-none ${bgClasses}`}
                  >
                    <span>{item.date.getDate()}</span>

                    {/* Star Icon for Holidays */}
                    {isHolidayDay && item.isCurrentMonth && (
                      <Star className="w-3 h-3 text-accent fill-accent absolute top-1.5 right-1.5" />
                    )}

                    {/* Badge for AWD */}
                    {awd && item.isCurrentMonth && (
                      <span className="text-[8px] font-extrabold bg-text-primary text-card px-1.5 py-0.5 rounded-sm absolute bottom-1.5 uppercase">
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
        <div className="bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-4">
          <h2 className="type-h4 font-bold text-text-primary border-b border-border pb-3">
            Alternate Working Days
          </h2>
          {currentMonthAwdList.length === 0 ? (
            <p className="type-body-sm text-text-secondary font-medium">
              No alternate working days configured for this month.
            </p>
          ) : (
            <div className="space-y-2.5">
              {currentMonthAwdList.map((a) => (
                <div key={a.id} className="p-3.5 bg-bg rounded-lg border border-border type-caption space-y-1">
                  <div className="flex justify-between text-text-primary font-bold">
                    <span>Date: {a.effectiveDate}</span>
                    <span className="text-accent font-bold">{a.workingDay} for {a.originalHolidayDay}</span>
                  </div>
                  <p className="text-text-secondary font-medium">Reason: {a.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Date Options Modal */}
      {selectedDateModal && !showHolidayModal && !showAwdModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-lg p-6 shadow-2xl border border-border space-y-4 animate-in fade-in">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div>
                <h3 className="type-h4 font-bold text-text-primary">
                  {selectedDateModal.toDateString()}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDateModal(null)}
                className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg cursor-pointer"
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
                  className="w-full text-left px-4 py-3 bg-bg hover:bg-card border border-border text-text-primary rounded-lg type-body-sm font-bold transition-colors flex items-center justify-between cursor-pointer"
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
                  className="w-full text-left px-4 py-3 bg-bg hover:bg-card border border-border text-text-secondary rounded-lg type-body-sm font-bold transition-colors flex items-center justify-between cursor-pointer"
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
                  className="w-full text-left px-4 py-3 bg-accent hover:bg-accent-hover text-card rounded-lg type-body-sm font-bold transition-colors flex items-center justify-between shadow-none cursor-pointer"
                >
                  <span>Set as Week End</span>
                </button>
              )}

              {/* Holiday Actions */}
              {!getHolidayForDate(selectedDateModal) && (
                <button
                  onClick={() => setShowHolidayModal(true)}
                  className="w-full text-left px-4 py-3 bg-bg hover:bg-accent-tint border border-border text-text-primary hover:text-accent rounded-lg type-body-sm font-bold transition-colors cursor-pointer"
                >
                  Mark as Holiday
                </button>
              )}

              {/* AWD Actions */}
              {!getAwdForDate(selectedDateModal) && (
                <button
                  onClick={() => setShowAwdModal(true)}
                  className="w-full text-left px-4 py-3 bg-bg hover:bg-card border border-border text-text-primary rounded-lg type-body-sm font-bold transition-colors cursor-pointer"
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
                  className="w-full text-left px-4 py-3 bg-accent-tint border border-accent/20 text-accent rounded-lg type-body-sm font-bold transition-colors cursor-pointer"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-sm rounded-lg p-6 shadow-2xl border border-border space-y-4">
            <h3 className="type-h4 font-bold text-text-primary">Configure Holiday</h3>
            <input
              type="text"
              placeholder="e.g. Independence Day, Annual Sports"
              value={holidayNameInput}
              onChange={(e) => setHolidayNameInput(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-bg border border-border rounded-lg type-body-sm outline-none focus:border-text-primary font-medium text-text-primary"
            />
            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setShowHolidayModal(false);
                  setHolidayNameInput('');
                }}
                className="px-4 py-2 type-btn text-text-secondary hover:bg-bg border border-border rounded-lg cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateHoliday}
                className="px-5 py-2 type-btn text-card bg-accent hover:bg-accent-hover rounded-lg shadow-none cursor-pointer font-bold"
              >
                Save Holiday
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alternate Working Day Modal */}
      {showAwdModal && selectedDateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-lg p-6 shadow-2xl border border-border space-y-4">
            <h3 className="type-h4 font-bold text-text-primary">Add Alternate Working Day</h3>
            
            <div className="space-y-3">
              <div>
                <label className="type-form-label block font-bold text-text-primary mb-1">Effective Date</label>
                <div className="px-3.5 py-2 bg-bg border border-border rounded-lg type-caption font-bold text-text-primary">
                  {formatDateStr(selectedDateModal)}
                </div>
              </div>

              <div>
                <label className="type-form-label block font-bold text-text-primary mb-1">Original Holiday Day</label>
                <select
                  value={awdForm.originalHolidayDay}
                  onChange={(e) => setAwdForm({ ...awdForm, originalHolidayDay: e.target.value })}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg type-caption font-bold outline-none text-text-primary cursor-pointer"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="type-form-label block font-bold text-text-primary mb-1">Working Day</label>
                <select
                  value={awdForm.workingDay}
                  onChange={(e) => setAwdForm({ ...awdForm, workingDay: e.target.value })}
                  className="w-full px-3 py-2 bg-bg border border-border rounded-lg type-caption font-bold outline-none text-text-primary cursor-pointer"
                >
                  {DAYS_OF_WEEK.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="type-form-label block font-bold text-text-primary mb-1">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Saturday Compensation"
                  value={awdForm.reason}
                  onChange={(e) => setAwdForm({ ...awdForm, reason: e.target.value })}
                  className="w-full px-3.5 py-2 bg-bg border border-border rounded-lg type-caption outline-none text-text-primary font-medium"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setShowAwdModal(false);
                  setAwdForm({ originalHolidayDay: 'SATURDAY', workingDay: 'WEDNESDAY', reason: '' });
                }}
                className="px-4 py-2 type-caption font-bold text-text-secondary hover:bg-bg border border-border rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAwd}
                className="px-5 py-2 type-caption font-bold text-card bg-accent hover:bg-accent-hover rounded-lg shadow-none cursor-pointer"
              >
                Save AWD
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
