import { useState, useEffect } from 'react';
import { ArrowLeft, GraduationCap, ChevronRight, Award, RefreshCw, AlertCircle } from 'lucide-react';
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

export default function CaptainRewardYearSelectionPage({ onBack, onSelectYear }: Props) {
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
          <button onClick={onBack} className="p-2 type-btn bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="type-h4">Captain &amp; Vice Captain Rewards</h1>
            <p className="type-caption text-slate-400 mt-0.5">Select an academic year to configure automated weekly reward rules</p>
          </div>
        </div>

        <button
          onClick={fetchYears}
          disabled={isLoading}
          className="p-2 type-btn bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-6 max-w-2xl mx-auto w-full space-y-4">
        <div className="bg-slate-900 p-6 rounded-2xl text-white shadow-sm flex items-center space-x-4 mb-2">
          <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <h2 className="type-h5">Leadership Reward Engine</h2>
            <p className="type-caption text-slate-300 mt-0.5">Automated weekly XP distribution for Captains and Vice Captains</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
            <p className="type-caption text-slate-500">Loading academic years...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-3">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
            <p className="type-body-sm font-bold text-slate-800">{error}</p>
            <button
              onClick={fetchYears}
              className="px-4 py-2 bg-amber-600 text-white rounded-xl type-btn hover:bg-amber-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : yearsList.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6 space-y-2">
            <p className="type-body-sm font-bold text-slate-700">No configured academic years found.</p>
          </div>
        ) : (
          yearsList.map((y) => (
            <div
              key={y.id}
              onClick={() => onSelectYear(toEnumValue(y.yearName))}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="type-h5 text-slate-900">{y.yearName}</h3>
                  <p className="type-caption text-slate-500 mt-0.5">Configure Captain &amp; Vice Captain Rewards for {y.yearName}</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-indigo-600 transition-colors" />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
