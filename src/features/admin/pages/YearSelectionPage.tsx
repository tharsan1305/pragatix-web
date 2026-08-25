import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ArrowLeft, GraduationCap, RefreshCw, AlertCircle, 
  Layers, Sparkles, Shield, ArrowRight, Activity, Award, Trophy
} from 'lucide-react';
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

const YEAR_COHORT_DETAILS: Record<number, { subtitle: string; tag: string; description: string }> = {
  1: {
    subtitle: 'Stage 1 Milestones',
    tag: 'Foundations & Discipline',
    description: 'Core campus culture, discipline baselines, and introductory soft skills.',
  },
  2: {
    subtitle: 'Stage 2 Milestones',
    tag: 'Skill Building & Mini-Projects',
    description: 'Technical clubs, hackathons, skill-building certificates, and team tasks.',
  },
  3: {
    subtitle: 'Stage 3 Milestones',
    tag: 'Advanced XP & Internships',
    description: 'Industry internships, open-source work, and specialized certifications.',
  },
  4: {
    subtitle: 'Stage 4 Milestones',
    tag: 'Placements & Capstone',
    description: 'Corporate placements, final year capstone projects, and campus leadership.',
  },
};

export default function YearSelectionPage({ onBack, onPushView }: Props) {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlYear = searchParams.get('selectedYear') || searchParams.get('academicYear') || searchParams.get('year');
  const [selectedYear, setSelectedYear] = useState<string | null>(urlYear);
  const [yearsList, setYearsList] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (urlYear) {
      setSelectedYear(urlYear);
    } else {
      setSelectedYear(null);
    }
  }, [urlYear]);

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

  const handleSelectYear = (enumVal: string) => {
    setSelectedYear(enumVal);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', 'activity');
    newParams.set('selectedYear', enumVal);
    newParams.delete('view');
    setSearchParams(newParams);
  };

  const handleSwitchYear = () => {
    setSelectedYear(null);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', 'activity');
    newParams.delete('selectedYear');
    newParams.delete('academicYear');
    newParams.delete('year');
    newParams.delete('view');
    setSearchParams(newParams);
  };

  if (selectedYear) {
    return (
      <ActivityTab 
        initialYear={selectedYear} 
        onBackToYearSelection={handleSwitchYear} 
        onPushView={onPushView} 
      />
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-bg text-text-primary p-6 md:p-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border pb-6">
        <div className="flex items-center space-x-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2.5 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="type-h3 font-bold text-text-primary tracking-tight">Activity &amp; Thresholds</h1>
              <span className="px-2.5 py-0.5 rounded-md type-caption font-bold bg-bg text-text-primary border border-border">
                INSTITUTION SCOPE
              </span>
            </div>
            <p className="type-body-sm text-text-secondary mt-1 font-medium">
              Configure stage journeys, XP threshold caps, and staff evaluators per academic year
            </p>
          </div>
        </div>

        <button
          onClick={fetchYears}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh Years"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-accent' : ''}`} />
          <span className="type-caption font-bold">Refresh</span>
        </button>
      </div>

      {/* Cohort Metric Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] group">
          <div className="w-12 h-12 rounded-2xl bg-blue-50/90 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="type-fine text-text-muted font-bold uppercase tracking-wider">Active Cohorts</p>
            <h3 className="type-h4 font-black text-text-primary mt-0.5">{yearsList.length || 4} Years</h3>
            <p className="type-caption text-text-secondary font-medium">Independent progression stages</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] group">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50/90 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="type-fine text-text-muted font-bold uppercase tracking-wider">Evaluation Engine</p>
            <h3 className="type-h4 font-black text-text-primary mt-0.5">Stage &amp; XP Caps</h3>
            <p className="type-caption text-text-secondary font-medium">Individual &amp; Group thresholds</p>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)] group">
          <div className="w-12 h-12 rounded-2xl bg-purple-50/90 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <p className="type-fine text-text-muted font-bold uppercase tracking-wider">Access Scope</p>
            <h3 className="type-h4 font-black text-purple-600 mt-0.5">Super Admin</h3>
            <p className="type-caption text-text-secondary font-medium">Full edit &amp; assignment control</p>
          </div>
        </div>
      </div>

      {/* Main Year Selection Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="type-h4 font-bold text-text-primary">Select Academic Cohort</h2>
            <p className="type-body-sm text-text-secondary font-medium mt-0.5">
              Click any year below to view its stages, configure tasks, or assign staff
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-card border border-border rounded-lg p-6 space-y-4 animate-pulse">
                <div className="flex justify-between items-center">
                  <div className="w-10 h-10 bg-border/60 rounded-lg" />
                  <div className="w-24 h-5 bg-border/60 rounded-full" />
                </div>
                <div className="w-48 h-6 bg-border/60 rounded" />
                <div className="w-full h-4 bg-border/60 rounded" />
                <div className="w-28 h-8 bg-border/60 rounded-lg mt-4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-14 bg-card rounded-lg border border-border p-8 space-y-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col items-center">
            <div className="w-12 h-12 rounded-lg bg-accent-tint border border-accent/20 flex items-center justify-center text-accent">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="type-h5 font-bold text-text-primary">{error}</h3>
              <p className="type-body-sm text-text-secondary mt-1">Unable to load configured years from backend.</p>
            </div>
            <button
              onClick={fetchYears}
              className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-card rounded-lg type-caption font-bold transition-colors cursor-pointer"
            >
              Retry Loading
            </button>
          </div>
        ) : yearsList.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border border-border p-8 space-y-3 flex flex-col items-center">
            <div className="w-14 h-14 rounded-lg bg-bg border border-border flex items-center justify-center text-text-muted">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h3 className="type-h5 font-bold text-text-primary">No Configured Academic Years Found</h3>
            <p className="type-body-sm text-text-secondary max-w-sm">
              Please ensure academic years are registered in your institution setup.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            {yearsList.map((y, idx) => {
              const yearNumber = y.yearNo || idx + 1;
              const cohortMeta = YEAR_COHORT_DETAILS[yearNumber] || {
                subtitle: `Stage ${yearNumber} Milestones`,
                tag: 'General Progression',
                description: 'Academic and extra-curricular task configurations.',
              };

              const cohortIconStyles: Record<number, { bg: string; text: string; border: string; icon: any }> = {
                1: { bg: 'bg-blue-50/90', text: 'text-blue-600', border: 'border-blue-100', icon: GraduationCap },
                2: { bg: 'bg-emerald-50/90', text: 'text-emerald-600', border: 'border-emerald-100', icon: Sparkles },
                3: { bg: 'bg-amber-50/90', text: 'text-amber-600', border: 'border-amber-100', icon: Award },
                4: { bg: 'bg-rose-50/90', text: 'text-rose-600', border: 'border-rose-100', icon: Trophy },
              };

              const style = cohortIconStyles[yearNumber] || cohortIconStyles[1];
              const IconComp = style.icon;

              return (
                <div
                  key={y.id}
                  onClick={() => handleSelectYear(toEnumValue(y.yearName))}
                  className="bg-card rounded-2xl p-6 border border-border shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:border-accent/50 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group relative overflow-hidden"
                >
                  <div>
                    {/* Top Row: Soft Colored Icon Badge Tile & Tag */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3.5">
                        <div className={`w-12 h-12 rounded-2xl ${style.bg} border ${style.border} ${style.text} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                          <IconComp className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="type-h4 font-black text-text-primary group-hover:text-accent transition-colors">
                            {y.yearName}
                          </h3>
                          <span className="type-fine text-text-muted font-extrabold uppercase tracking-wide">
                            {cohortMeta.subtitle}
                          </span>
                        </div>
                      </div>

                      <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-bg border border-border text-text-secondary">
                        {cohortMeta.tag}
                      </span>
                    </div>

                    {/* Description */}
                    <p className="type-body-sm text-text-secondary font-medium leading-relaxed mb-6">
                      {cohortMeta.description}
                    </p>

                    {/* Feature Chips */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-bg border border-border text-text-secondary flex items-center gap-1.5">
                        <Activity className={`w-3.5 h-3.5 ${style.text}`} />
                        Stage Workflows
                      </span>
                      <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-bg border border-border text-text-secondary flex items-center gap-1.5">
                        <Award className={`w-3.5 h-3.5 ${style.text}`} />
                        XP Thresholds
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action CTA */}
                  <div className="pt-4 border-t border-border flex items-center justify-between">
                    <span className="type-caption font-extrabold text-text-primary group-hover:text-accent transition-colors">
                      Manage Stages &amp; Tasks
                    </span>
                    <div className={`w-9 h-9 rounded-xl bg-bg border border-border group-hover:bg-accent group-hover:border-accent group-hover:text-card text-text-secondary flex items-center justify-center transition-all`}>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
