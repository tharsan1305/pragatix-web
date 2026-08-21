import { logger } from '../../../../utils/logger';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertTriangle, ChevronRight } from 'lucide-react';
import apiClient from '../../../../services/apiClient';

const FIXED_YEARS = [
  { yearNo: 1, yearName: '1st Year' },
  { yearNo: 2, yearName: '2nd Year' },
  { yearNo: 3, yearName: '3rd Year' },
  { yearNo: 4, yearName: '4th Year' },
];

const getYearAliases = (fy: any) => {
  const no = fy.yearNo;
  if (no === 1) return ["1", "1st year", "i", "first year", "1st", "first_year"];
  if (no === 2) return ["2", "2nd year", "ii", "second year", "2nd", "second_year"];
  if (no === 3) return ["3", "3rd year", "iii", "third year", "3rd", "third_year"];
  if (no === 4) return ["4", "4th year", "iv", "fourth year", "4th", "fourth_year"];
  return [];
};

interface Props {
  onBack?: () => void;
  onPushView?: (name: string, props?: any) => void;
  activityId?: number;
}

export default function GroupActivityYearPage({ onBack, onPushView, activityId: propActivityId }: Props = {}) {
  const params = useParams();
  const activityId = propActivityId ?? (params.activityId ? Number(params.activityId) : undefined);
  const navigate = useNavigate();
  const [availableYears, setAvailableYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchYears();
  }, [activityId]);

  const fetchYears = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/api/v1/my-activities/${activityId}/years`);
      if (res.data?.success) {
        const yrs = res.data.data || [];
        const filtered = FIXED_YEARS.filter(fy => {
          const aliases = getYearAliases(fy);
          return yrs.some((y: any) => {
            const raw = String(y).toLowerCase().trim();
            const normalized = raw.replace(/_/g, ' ');
            return aliases.includes(raw) || aliases.includes(normalized);
          });
        });
        setAvailableYears(filtered.length > 0 ? filtered : FIXED_YEARS);
      } else {
        setAvailableYears(FIXED_YEARS);
      }
    } catch (e: any) {
      logger.error("Failed to load years:", e);
      setAvailableYears(FIXED_YEARS);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  const handleSelectYear = (y: any) => {
    if (onPushView) {
      onPushView('group_activity_dept', { activityId, year: y });
    } else {
      navigate(`/teacher/group-activity/${activityId}/dept`, { state: { year: y } });
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-slate-900 px-6 pt-10 pb-6 flex items-center space-x-4 shadow-md">
        <button onClick={handleBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Select Academic Year</h1>
          <p className="text-xs text-slate-400 mt-0.5">Group activity execution drill-down</p>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-sm font-semibold text-slate-700">{error}</p>
            <button onClick={fetchYears} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">
              Retry
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {availableYears.map(y => (
              <button
                key={y.yearNo}
                onClick={() => handleSelectYear(y)}
                className="w-full bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:border-slate-400 font-bold text-base text-slate-800 flex justify-between items-center transition-all hover:shadow-sm"
              >
                <span className="font-heading">{y.yearName}</span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
