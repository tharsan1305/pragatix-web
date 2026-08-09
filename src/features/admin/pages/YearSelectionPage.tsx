import { useState } from 'react';
import { ArrowLeft, GraduationCap, ChevronRight } from 'lucide-react';
import ActivityTab from '../tabs/ActivityTab';

interface Props {
  onBack?: () => void;
  onPushView?: (name: string, props?: any) => void;
}

export default function YearSelectionPage({ onBack, onPushView }: Props) {
  const [selectedYear, setSelectedYear] = useState<string | null>(null);

  const years = [
    { label: 'First Year', value: 'FIRST_YEAR', badge: 'Year 1', desc: 'Manage Stage 1 & introductory activities' },
    { label: 'Second Year', value: 'SECOND_YEAR', badge: 'Year 2', desc: 'Manage Stage 2 & intermediate activities' },
    { label: 'Third Year', value: 'THIRD_YEAR', badge: 'Year 3', desc: 'Manage Stage 3 & advanced project activities' },
    { label: 'Fourth Year', value: 'FOURTH_YEAR', badge: 'Final Year', desc: 'Manage Stage 4 & placement readiness' },
  ];

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
    <div className="flex flex-col min-h-full bg-slate-50 relative pb-20">
      {/* Top Header Bar matching Flutter */}
      <div className="bg-[#EA4335] text-white px-6 pt-10 pb-6 shadow-md flex items-center space-x-4">
        {onBack && (
          <button onClick={onBack} className="p-2 bg-red-600/60 rounded-full text-white hover:bg-red-700 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-bold">Activity & Thresholds</h1>
          <p className="text-xs text-red-100 mt-0.5">Admin Management Portal</p>
        </div>
      </div>

      <div className="flex-1 p-6 max-w-xl mx-auto w-full space-y-6 pt-8">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-extrabold text-slate-900">Select Academic Year</h2>
          <p className="text-sm font-medium text-slate-500 max-w-md mx-auto">
            Please select an academic year to manage its stages, thresholds, and activities.
          </p>
        </div>

        {/* 4 Year Selection Cards (Flutter Aligned 1:1) */}
        <div className="space-y-4 pt-4">
          {years.map((y) => (
            <div
              key={y.value}
              onClick={() => setSelectedYear(y.value)}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md hover:border-red-400 transition-all cursor-pointer flex items-center justify-between group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold group-hover:bg-red-600 group-hover:text-white transition-colors">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-slate-900 text-lg">{y.label}</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                      {y.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{y.desc}</p>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
