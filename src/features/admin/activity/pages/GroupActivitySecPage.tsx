import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Layers } from 'lucide-react';

export default function GroupActivitySecPage() {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { year, dept, sections } = location.state || {
    year: { yearNo: 1, yearName: '1st Year' },
    dept: { name: 'Department' },
    sections: []
  };

  const handleSelectSection = (sec: any) => {
    navigate(`/teacher/group-activity/${activityId}/execution`, {
      state: { year, dept, section: sec }
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <div className="bg-slate-900 px-6 pt-10 pb-6 flex items-center space-x-4 shadow-md">
        <button onClick={() => navigate(-1)} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="font-heading text-2xl font-bold text-white">Select Section</h1>
          <p className="text-xs text-slate-400 mt-0.5">{year.yearName} • {dept.deptName || dept.name || dept.code}</p>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full">
        {!sections || sections.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm text-slate-500 text-sm">
            No sections available.
          </div>
        ) : (
          <div className="space-y-3">
            {sections.map((sec: any) => (
              <button
                key={sec.id}
                onClick={() => handleSelectSection(sec)}
                className="w-full bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 hover:border-slate-400 font-bold text-base text-slate-800 flex justify-between items-center transition-all hover:shadow-sm cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <Layers className="w-5 h-5 text-indigo-600" />
                  <span className="font-heading">Section {sec.sectionName || sec.name}</span>
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
