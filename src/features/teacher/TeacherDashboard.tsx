import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Footer from '../../components/common/Footer';
import { useAuth } from '../../store/authContext';
import apiClient from '../../services/apiClient';
import ActivityTab from './tabs/ActivityTab';
import LeaderboardTab from './tabs/LeaderboardTab';
import TeacherGroupManagementTab from './tabs/TeacherGroupManagementTab';
import HodPerformanceTab from './tabs/HodPerformanceTab';
import ProfileTab from './tabs/ProfileTab';
import AttendanceTab from './tabs/AttendanceTab';
import CCInboxTab from './tabs/CCInboxTab';
import PageLoader from '../../components/common/PageLoader';
import { Activity, Trophy, Users, BarChart3, User, CalendarCheck, Gavel } from 'lucide-react';

export default function TeacherDashboard() {
  const { subRoles, setSubRoles } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isTabLoading, setIsTabLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/api/v1/auth/me');
        if (res.data.success) {
          const subs = res.data.data.subRoles || [];
          const mainRoles = res.data.data.roles || [];
          const combined = [
            ...subs.map((s: any) => s.toString()),
            ...mainRoles.map((r: any) => r.toString())
          ];
          setSubRoles(combined);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isCC = subRoles.some(r => {
    const clean = r.toString().trim().toUpperCase();
    return clean === 'CC' || clean === 'CLASS_COORDINATOR' || clean === 'ROLE_CC' || clean === 'ROLE_CLASS_COORDINATOR';
  });
  const isHOD = subRoles.some(r => {
    const clean = r.toString().trim().toUpperCase();
    return clean === 'HOD' || clean === 'ROLE_HOD';
  });
  const canManageGroups = isCC || isHOD;

  const availableTabs = [
    { id: 'activities', name: 'Activities', icon: Activity, component: <ActivityTab /> },
    { id: 'attendance', name: 'Attendance', icon: CalendarCheck, component: <AttendanceTab /> },
    { id: 'leaderboard', name: 'Leaderboard', icon: Trophy, component: <LeaderboardTab /> },
    { id: 'requests', name: 'Requests', icon: Gavel, component: <CCInboxTab /> },
  ];

  if (canManageGroups) {
    availableTabs.push({ id: 'groups', name: 'Groups', icon: Users, component: <TeacherGroupManagementTab /> });
  }

  if (isHOD) {
    availableTabs.push({ id: 'hod_report', name: 'HOD Report', icon: BarChart3, component: <HodPerformanceTab /> });
  }

  availableTabs.push({ id: 'profile', name: 'Profile', icon: User, component: <ProfileTab /> });

  const currentTabSlug = searchParams.get('tab') || 'activities';
  const foundIdx = availableTabs.findIndex(t => t.id === currentTabSlug);
  const activeTab = foundIdx !== -1 ? foundIdx : 0;

  const handleTabChange = (idx: number) => {
    if (idx === activeTab) return;
    const targetTab = availableTabs[idx];
    if (!targetTab) return;
    setIsTabLoading(true);
    setSearchParams({ tab: targetTab.id });
    setTimeout(() => {
      setIsTabLoading(false);
    }, 350);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading Teacher Profile...</div>;
  }

  // Ensure activeTab is within bounds (e.g. if roles change)
  const currentTabComponent = availableTabs[activeTab]?.component || availableTabs[0].component;

  return (
    <div className="flex h-screen bg-slate-50 flex-col md:flex-row">
      {isTabLoading && <PageLoader message={`Opening ${availableTabs[activeTab]?.name || 'Page'}...`} fullScreen={true} />}
      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex w-64 flex-col bg-slate-900 text-white shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight">PragatiX</h1>
          <p className="text-xs text-slate-400 mt-1">Teacher Portal</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {availableTabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => handleTabChange(idx)}
              className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === idx 
                  ? 'bg-teal-600 text-white border-l-4 border-teal-400' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'
              }`}
            >
              <tab.icon className={`w-5 h-5 mr-3 ${activeTab === idx ? 'text-teal-200' : 'text-slate-400'}`} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 overflow-y-auto md:pb-0 pb-20 flex flex-col justify-between">
          <div>
            {currentTabComponent}
          </div>
          <Footer />
        </div>
        
        {/* Bottom Nav (Mobile) */}
        <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
          <div className="flex justify-around items-center h-16">
            {availableTabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => handleTabChange(idx)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  activeTab === idx ? 'text-teal-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === idx ? 'stroke-2' : 'stroke-[1.5]'}`} />
                <span className="text-[10px] font-medium">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
