import { useState, useEffect } from 'react';
import { ArrowLeft, GraduationCap, ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import ActivityTab from '../tabs/ActivityTab';
import apiClient from '../../../services/apiClient';

interface Props {
  onBack?: () => void;
  onPushView?: (name: string, props?: any) => void;
}

interface AcademicYear {
  id: number;
  yearName: string;
  yearNo?: number;
}

export default function YearSelectionPage({ onBack, onPushView }: Props) {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
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

  if (selectedYear) {
    return (
      <ActivityTab 
        initialYear={selectedYear} 
        onBackToYearSelection={() => setSelectedYear(null)} 
        onPushView={onPushView} 
      />
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#F8FAFC] relative pb-20">
      {/* Top Header Bar matching Flutter */}
      <div className="bg-[#EA4335] text-white px-6 pt-6 pb-4 shadow-md flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onBack && (
            <button onClick={onBack} className="p-2 bg-red-600/60 rounded-full text-white hover:bg-red-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="font-heading text-xl font-bold">Activity &amp; Thresholds</h1>
            <p className="text-xs text-red-100 mt-0.5">Select an academic year to manage stages &amp; activities</p>
          </div>
        </div>

        <button
          onClick={fetchYears}
          disabled={isLoading}
          className="p-2 bg-red-600/60 rounded-full text-white hover:bg-red-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="flex-1 p-6 max-w-xl mx-auto w-full space-y-6 pt-8">
        <div className="text-center space-y-2">
          <h2 className="font-heading text-2xl font-extrabold text-slate-900">Select Academic Year</h2>
          <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
            Please select an academic year to manage its stages and activities.
          </p>
        </div>

        {/* Dynamic Year Selection Cards (Flutter Aligned 1:1) */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-red-500" />
            <p className="text-xs font-semibold text-slate-500">Loading academic years...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="text-sm font-bold text-slate-800">{error}</p>
            <button
              onClick={fetchYears}
              className="px-4 py-2 bg-red-500 text-white rounded-xl text-xs font-bold hover:bg-red-600"
            >
              Retry
            </button>
          </div>
        ) : yearsList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <p className="text-sm font-bold text-slate-700">No configured academic years found.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {yearsList.map((y, idx) => (
              <div
                key={y.id}
                onClick={() => setSelectedYear(toEnumValue(y.yearName))}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-red-400 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 text-white flex items-center justify-center font-extrabold text-sm shadow-xs">
                    {y.yearNo || idx + 1}
                  </div>
                  <div className="flex items-center space-x-2.5">
                    <GraduationCap className="w-5 h-5 text-slate-700" />
                    <div>
                      <h3 className="font-heading font-bold text-slate-900 text-base">{y.yearName}</h3>
                      <p className="text-xs text-slate-400 font-medium">Manage Stage {y.yearNo || idx + 1} activities</p>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
