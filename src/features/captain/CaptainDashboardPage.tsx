import { useState } from 'react';
import Footer from '../../components/common/Footer';
import DashboardTab from '../student/tabs/DashboardTab';
import PointReviewTab from '../student/tabs/PointReviewTab';
import LeaderboardTab from '../student/tabs/LeaderboardTab';
import CaptainGroupTab from './tabs/CaptainGroupTab';
import ActivitiesTab from '../student/tabs/ActivitiesTab';
import StudentAttendanceTab from '../student/tabs/StudentAttendanceTab';
import LevelsBadgesTab from '../student/tabs/LevelsBadgesTab';
import ProfileTab from '../student/tabs/ProfileTab';
import PageLoader from '../../components/common/PageLoader';
import { LayoutDashboard, History, Trophy, Users, Ticket, CalendarCheck, Medal, User, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function CaptainDashboardPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('pragatix_captain_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('pragatix_captain_sidebar_collapsed', String(next));
      return next;
    });
  };

  const handleTabChange = (idx: number) => {
    if (idx === activeTab) return;
    setIsTabLoading(true);
    setActiveTab(idx);
    setTimeout(() => {
      setIsTabLoading(false);
    }, 350);
  };

  const tabs = [
    { name: 'Dashboard', icon: LayoutDashboard, component: <DashboardTab onSelectTab={handleTabChange} /> },
    { name: 'Point Review', icon: History, component: <PointReviewTab /> },
    { name: 'Leaderboard', icon: Trophy, component: <LeaderboardTab /> },
    { name: 'My Group', icon: Users, component: <CaptainGroupTab /> },
    { name: 'Activities', icon: Ticket, component: <ActivitiesTab /> },
    { name: 'Attendance', icon: CalendarCheck, component: <StudentAttendanceTab /> },
    { name: 'Levels & Badges', icon: Medal, component: <LevelsBadgesTab /> },
    { name: 'Profile', icon: User, component: <ProfileTab /> }
  ];

  return (
    <div className="flex h-screen bg-slate-50 flex-col md:flex-row">
      {isTabLoading && <PageLoader message={`Opening ${tabs[activeTab].name}...`} fullScreen={true} />}

      {/* Sidebar (Desktop) */}
      <div className={`hidden md:flex flex-col bg-slate-900 text-white shadow-xl z-20 transition-all duration-300 ease-in-out shrink-0 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Header & Toggle Button */}
        <div className={`flex items-center justify-between border-b border-slate-800 transition-all ${
          isSidebarCollapsed ? 'p-4 justify-center' : 'p-6'
        }`}>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden min-w-0">
              <h1 className="type-h4 tracking-tight whitespace-nowrap">PragatiX</h1>
              <p className="type-caption text-slate-400 mt-0.5 whitespace-nowrap">Captain Portal</p>
            </div>
          )}
          
          <div className="relative group/toggle">
            <button
              onClick={toggleSidebar}
              className={`p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer flex items-center justify-center ${
                isSidebarCollapsed ? 'w-10 h-10' : ''
              }`}
              aria-label={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
              title={isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
            {/* Pill Tooltip */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-black text-white text-xs font-semibold rounded-full whitespace-nowrap opacity-0 pointer-events-none group-hover/toggle:opacity-100 transition-opacity z-50 shadow-2xl border border-slate-700">
              {isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {tabs.map((tab, idx) => (
            <div key={idx} className="relative group/navitem">
              <button
                key={idx}
                onClick={() => handleTabChange(idx)}
                className={`w-full flex items-center type-nav transition-colors cursor-pointer ${
                  isSidebarCollapsed ? 'justify-center px-0 py-3.5' : 'px-6 py-3'
                } ${activeTab === idx
                    ? 'bg-indigo-600 text-white border-l-4 border-indigo-400'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'
                  }`}
                title={isSidebarCollapsed ? tab.name : undefined}
              >
                <tab.icon className={`w-5 h-5 shrink-0 ${isSidebarCollapsed ? '' : 'mr-3'} ${activeTab === idx ? 'text-indigo-200' : 'text-slate-400'}`} />
                {!isSidebarCollapsed && <span className="truncate">{tab.name}</span>}
              </button>

              {/* Floating Tooltip in Collapsed Mode */}
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-950 text-white type-caption rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/navitem:opacity-100 transition-opacity z-50 shadow-2xl border border-slate-700 font-semibold">
                  {tab.name}
                </div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 overflow-y-auto md:pb-0 pb-20 flex flex-col justify-between">
          <div>
            {tabs[activeTab].component}
          </div>
          <Footer />
        </div>

        {/* Bottom Nav (Mobile) */}
        <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
          <div className="flex justify-around items-center h-16">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => handleTabChange(idx)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  activeTab === idx ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === idx ? 'stroke-2' : 'stroke-[1.5]'}`} />
                <span className="type-fine font-medium">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
