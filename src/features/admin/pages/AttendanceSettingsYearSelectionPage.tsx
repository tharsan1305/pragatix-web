import { useState, useEffect } from 'react';
import { ArrowLeft, CalendarCheck, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import apiClient from '../../../services/apiClient';

interface Props {
  onBack: () => void;
  onSelectYear: (year: string) => void;
}

interface AcademicYear {
  id: number;
  yearName: string;
  yearNo?: number;
}

export default function AttendanceSettingsYearSelectionPage({ onBack, onSelectYear }: Props) {
  const [yearsList, setYearsList] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchYears();
  }, []);

  const fetchYears = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get('/api/v1/admin/years');
      const list = Array.isArray(res.data?.data) ? res.data.data : (Array.isArray(res.data) ? res.data : []);
      setYearsList(list);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load academic years');
    } finally {
      setIsLoading(false);
    }
  };

  const toEnumValue = (yearName: string) => {
    return yearName.toUpperCase().replace(/\s+/g, '_');
  };

  return (
    <div className="flex flex-col min-h-full bg-bg text-text-primary pb-20">
      {/* Top Header Bar */}
      <div className="bg-card text-text-primary px-6 py-4 border-b border-border flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3.5">
          <button 
            onClick={onBack} 
            className="px-3.5 py-2 bg-card border border-border rounded-lg text-text-primary hover:bg-bg transition-colors cursor-pointer flex items-center gap-2 font-bold type-caption"
            title="Back to Attendance"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Attendance</span>
          </button>
          <div>
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">Attendance Settings</h1>
            <p className="type-caption text-text-secondary font-medium mt-0.5">Select an academic year cohort to configure attendance rules &amp; engines</p>
          </div>
        </div>

        <button
          onClick={fetchYears}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-accent' : ''}`} />
          <span className="type-caption font-bold hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="p-6 max-w-3xl mx-auto w-full space-y-6">
        <div className="bg-card p-6 rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center space-x-4">
          <div className="p-3.5 bg-bg border border-border rounded-lg text-text-primary">
            <CalendarCheck className="w-8 h-8 text-accent" />
          </div>
          <div>
            <h2 className="type-h4 font-bold text-text-primary">Attendance Rules Engine</h2>
            <p className="type-body-sm text-text-secondary font-medium mt-0.5">Configure automated daily attendance XP deductions, weekly rewards, and calendar schedules</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-card rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-accent" />
            <p className="type-body-sm text-text-secondary font-medium">Loading academic cohorts...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border p-6 space-y-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <AlertCircle className="w-10 h-10 text-accent mx-auto" />
            <p className="type-body-sm font-bold text-text-primary">{error}</p>
            <button
              onClick={fetchYears}
              className="px-4 py-2 bg-accent text-card rounded-lg type-btn hover:bg-accent-hover cursor-pointer font-bold"
            >
              Retry
            </button>
          </div>
        ) : yearsList.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-lg border border-border p-6 space-y-2 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <p className="type-body-sm font-bold text-text-secondary">No configured academic years found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {yearsList.map((y) => (
              <div
                key={y.id}
                onClick={() => onSelectYear(toEnumValue(y.yearName))}
                className="bg-card p-5 rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-accent/40 hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-bg border border-border rounded-lg flex items-center justify-center text-text-primary font-bold group-hover:bg-accent group-hover:text-card group-hover:border-accent transition-colors">
                    <CalendarCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="type-h4 font-bold text-text-primary group-hover:text-accent transition-colors">{y.yearName}</h3>
                    <p className="type-caption text-text-secondary font-medium mt-0.5">Configure Attendance Threshold &amp; Rules for {y.yearName}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
