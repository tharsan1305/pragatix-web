import { ArrowLeft, CalendarCheck, ChevronRight } from 'lucide-react';

interface Props {
  onBack: () => void;
  onSelectYear: (year: string) => void;
}

export default function AttendanceSettingsYearSelectionPage({ onBack, onSelectYear }: Props) {
  const years = [
    { title: '🎓 First Year', value: 'FIRST_YEAR', desc: '1st Year Attendance Threshold & Rules Config' },
    { title: '🎓 Second Year', value: 'SECOND_YEAR', desc: '2nd Year Attendance Threshold & Rules Config' },
    { title: '🎓 Third Year', value: 'THIRD_YEAR', desc: '3rd Year Attendance Threshold & Rules Config' },
    { title: '🎓 Fourth Year', value: 'FOURTH_YEAR', desc: '4th Year Attendance Threshold & Rules Config' },
  ];

  return (
    <div className="flex flex-col min-h-full bg-slate-50 pb-20">
      <div className="bg-slate-900 px-6 pt-10 pb-5 shadow-md text-white flex items-center space-x-4">
        <button onClick={onBack} className="p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold">Attendance Settings</h1>
          <p className="text-xs text-slate-400 mt-0.5">Select an academic year to configure attendance rules & penalties</p>
        </div>
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

        {years.map((y) => (
          <div
            key={y.value}
            onClick={() => onSelectYear(y.value)}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all cursor-pointer flex items-center justify-between group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-teal-50 rounded-xl flex items-center justify-center text-teal-600 font-bold group-hover:bg-teal-600 group-hover:text-white transition-colors">
                <CalendarCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">{y.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{y.desc}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-600 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}
