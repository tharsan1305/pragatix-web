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
    <div className="flex flex-col min-h-full bg-slate-50 pb-20">
      <div className="bg-slate-900 px-6 pt-10 pb-5 shadow-md text-white flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold">Attendance Settings</h1>
            <p className="text-xs text-slate-400 mt-0.5">Select an academic year to configure attendance rules &amp; penalties</p>
          </div>
        </div>

        <button
          onClick={fetchYears}
          disabled={isLoading}
          className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-6 max-w-2xl mx-auto w-full space-y-4">
        <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-sm flex items-center space-x-4 mb-2">
          <div className="p-3 bg-teal-500/20 rounded-xl text-teal-400">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-bold text-lg">Attendance Rules Engine</h2>
            <p className="text-xs text-slate-300 mt-0.5">Configure minimum cutoff %, daily absence penalty, and warning thresholds</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
            <p className="text-xs font-semibold text-slate-500">Loading academic years...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">{error}</p>
            <button
              onClick={fetchYears}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700"
            >
              Retry
            </button>
          </div>
        ) : yearsList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <p className="text-sm font-bold text-slate-700">No configured academic years found.</p>
          </div>
        ) : (
          yearsList.map((y) => (
            <div
              key={y.id}
              onClick={() => onSelectYear(toEnumValue(y.yearName))}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-teal-300 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 font-bold group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <CalendarCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{y.yearName}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Configure Attendance Threshold &amp; Rules for {y.yearName}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
