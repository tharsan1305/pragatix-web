import { logger } from '../../../../utils/logger';
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RefreshCw, AlertTriangle, ChevronRight, Building2 } from 'lucide-react';
import apiClient from '../../../../services/apiClient';

export default function GroupActivityDeptPage() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const year = location.state?.year || { yearNo: 1, yearName: '1st Year' };

  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDepartments();
  }, [activityId, year]);

  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const yearMap: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV" };
      const yParam = yearMap[year.yearNo] || "I";
      const res = await apiClient.get(`/api/v1/my-activities/${activityId}/departments?year=${yParam}`);
      if (res.data?.success) {
        setDepartments(res.data.data || []);
      } else {
        setError("Failed to load departments");
      }
    } catch (e: any) {
      logger.error("Failed to fetch departments:", e);
      setError("Error loading departments");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDept = async (dept: any) => {
    setLoading(true);
    try {
      const yearMap: Record<number, string> = { 1: "I", 2: "II", 3: "III", 4: "IV" };
      const yParam = yearMap[year.yearNo] || "I";
      const secRes = await apiClient.get(`/api/v1/my-activities/${activityId}/sections?year=${yParam}&departmentId=${dept.id}`);
      
      const sections = secRes.data?.data || [];
      if (sections.length > 0) {
        navigate(`/teacher/group-activity/${activityId}/sec`, {
          state: { year, dept, sections }
        });
      } else {
        navigate(`/teacher/group-activity/${activityId}/execution`, {
          state: { year, dept, section: null }
        });
      }
    } catch (e) {
      logger.error("Failed to check sections:", e);
      navigate(`/teacher/group-activity/${activityId}/execution`, {
        state: { year, dept, section: null }
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-slate-900 px-6 pt-10 pb-6 flex items-center space-x-4 shadow-md">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Select Department</h1>
          <p className="text-xs text-slate-400 mt-0.5">{year.yearName}</p>
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
            <button onClick={fetchDepartments} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold">
              Retry
            </button>
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500 text-sm">
            No departments available for this selection.
          </div>
        ) : (
          <div className="space-y-3">
            {departments.map((dept: any) => (
              <button
                key={dept.id}
                onClick={() => handleSelectDept(dept)}
                className="w-full bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:border-slate-400 font-bold text-base text-slate-800 flex justify-between items-center transition-all hover:shadow-sm cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <span className="font-heading">{dept.deptName || dept.name || dept.code}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
