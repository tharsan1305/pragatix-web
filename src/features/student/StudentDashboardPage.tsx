import { useState, useEffect } from 'react';
import Footer from '../../components/common/Footer';
import DashboardTab from './tabs/DashboardTab';
import PointReviewTab from './tabs/PointReviewTab';
import LeaderboardTab from './tabs/LeaderboardTab';
import StudentGroupTab from './tabs/StudentGroupTab';
import ActivitiesTab from './tabs/ActivitiesTab';
import LevelsBadgesTab from './tabs/LevelsBadgesTab';
import StudentAttendanceTab from './tabs/StudentAttendanceTab';
import ProfileTab from './tabs/ProfileTab';
import ActivityStreaksPage from './pages/ActivityStreaksPage';
import PageLoader from '../../components/common/PageLoader';
import { LayoutDashboard, History, Trophy, Users, Ticket, Medal, User, CalendarCheck, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

const TAB_COLOR_SYSTEM: Record<string, { 
  activeBg: string; 
  activeText: string; 
  activeBorder: string; 
  iconBg: string; 
  iconText: string;
  inactiveIcon: string;
}> = {
  'Dashboard': { activeBg: 'bg-blue-50/90', activeText: 'text-blue-700 font-extrabold', activeBorder: 'border-blue-200/80', iconBg: 'bg-blue-100', iconText: 'text-blue-600', inactiveIcon: 'text-blue-500' },
  'Activities': { activeBg: 'bg-emerald-50/90', activeText: 'text-emerald-700 font-extrabold', activeBorder: 'border-emerald-200/80', iconBg: 'bg-emerald-100', iconText: 'text-emerald-600', inactiveIcon: 'text-emerald-500' },
  'Levels & Badges': { activeBg: 'bg-purple-50/90', activeText: 'text-purple-700 font-extrabold', activeBorder: 'border-purple-200/80', iconBg: 'bg-purple-100', iconText: 'text-purple-600', inactiveIcon: 'text-purple-500' },
  'Attendance': { activeBg: 'bg-sky-50/90', activeText: 'text-sky-700 font-extrabold', activeBorder: 'border-sky-200/80', iconBg: 'bg-sky-100', iconText: 'text-sky-600', inactiveIcon: 'text-sky-500' },
  'My Group': { activeBg: 'bg-indigo-50/90', activeText: 'text-indigo-700 font-extrabold', activeBorder: 'border-indigo-200/80', iconBg: 'bg-indigo-100', iconText: 'text-indigo-600', inactiveIcon: 'text-indigo-500' },
  'Leaderboard': { activeBg: 'bg-amber-50/90', activeText: 'text-amber-700 font-extrabold', activeBorder: 'border-amber-200/80', iconBg: 'bg-amber-100', iconText: 'text-amber-600', inactiveIcon: 'text-amber-500' },
  'Point Review': { activeBg: 'bg-rose-50/90', activeText: 'text-rose-700 font-extrabold', activeBorder: 'border-rose-200/80', iconBg: 'bg-rose-100', iconText: 'text-rose-600', inactiveIcon: 'text-rose-500' },
  'Profile': { activeBg: 'bg-violet-50/90', activeText: 'text-violet-700 font-extrabold', activeBorder: 'border-violet-200/80', iconBg: 'bg-violet-100', iconText: 'text-violet-600', inactiveIcon: 'text-violet-500' }
};

export default function StudentDashboardPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [activeSubView, setActiveSubView] = useState<string | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('pragatix_student_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('pragatix_student_sidebar_collapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!window.history.state || typeof window.history.state.tabIdx !== 'number') {
      window.history.replaceState({ tabIdx: 0, view: 'root' }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (state && typeof state.tabIdx === 'number') {
        setActiveTab(state.tabIdx);
        setActiveSubView(state.subView || null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleTabChange = (idx: number) => {
    if (idx === activeTab && !activeSubView) return;
    window.history.pushState({ tabIdx: idx, view: 'root' }, '');
    setIsTabLoading(true);
    setActiveTab(idx);
    setActiveSubView(null);
    setTimeout(() => {
      setIsTabLoading(false);
    }, 350);
  };

  const openSubView = (name: string) => {
    window.history.pushState({ tabIdx: activeTab, subView: name }, '');
    setActiveSubView(name);
  };

  const closeSubView = () => {
    if (window.history.state?.subView) {
      window.history.back();
    } else {
      setActiveSubView(null);
    }
  };

  interface NavSection {
    title: string;
    items: {
      name: string;
      icon: any;
      component: React.ReactNode;
    }[];
  }

  const navSections: NavSection[] = [
    {
      title: 'MY JOURNEY',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, component: <DashboardTab onSelectTab={handleTabChange} onOpenStreaks={() => openSubView('streaks')} myGroupTabIndex={4} /> },
        { name: 'Activities', icon: Ticket, component: <ActivitiesTab /> },
        { name: 'Levels & Badges', icon: Medal, component: <LevelsBadgesTab /> },
      ]
    },
    {
      title: 'ACADEMICS & TEAMS',
      items: [
        { name: 'Attendance', icon: CalendarCheck, component: <StudentAttendanceTab /> },
        { name: 'My Group', icon: Users, component: <StudentGroupTab /> },
        { name: 'Leaderboard', icon: Trophy, component: <LeaderboardTab /> },
      ]
    },
    {
      title: 'LOGS & ACCOUNT',
      items: [
        { name: 'Point Review', icon: History, component: <PointReviewTab /> },
        { name: 'Profile', icon: User, component: <ProfileTab /> },
      ]
    }
  ];

  const tabs = navSections.flatMap(s => s.items);

  return (
    <div className="flex h-screen bg-bg flex-col md:flex-row text-text-primary">
      {isTabLoading && <PageLoader message={`Opening ${tabs[activeTab].name}...`} fullScreen={true} />}
      
      {/* Sidebar (Desktop) */}
      <div className={`hidden md:flex flex-col bg-card text-text-primary border-r border-border shadow-none z-20 transition-all duration-300 ease-in-out shrink-0 ${
        isSidebarCollapsed ? 'w-[70px]' : 'w-72'
      }`}>
        {/* Header & Toggle Button */}
        <div className={`flex items-center justify-between border-b border-border transition-all ${
          isSidebarCollapsed ? 'p-4 justify-center' : 'p-6'
        }`}>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="type-h4 font-black text-text-primary tracking-tight whitespace-nowrap">PragatiX</h1>
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              </div>
              <span className="inline-block mt-1 type-fine font-bold text-accent bg-accent-tint px-2.5 py-0.5 rounded-md border border-accent/20 tracking-wider uppercase">
                Student Portal
              </span>
            </div>
          )}
          
          <div className="relative group/toggle">
            <button
              onClick={toggleSidebar}
              className={`p-2 text-text-secondary hover:text-text-primary hover:bg-bg rounded-lg transition-colors cursor-pointer flex items-center justify-center ${
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
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-card text-text-primary text-xs font-semibold rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover/toggle:opacity-100 transition-opacity z-50 shadow-md border border-border">
              {isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
            </div>
          </div>
        </div>

        {/* Grouped Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-4 px-3">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {/* Section Header */}
              {!isSidebarCollapsed ? (
                <div className="px-3 pt-2 pb-1 type-fine font-bold text-text-muted uppercase tracking-wider">
                  {section.title}
                </div>
              ) : sIdx > 0 ? (
                <div className="h-px bg-border-subtle my-2 mx-1" />
              ) : null}

              {/* Section Items */}
              {section.items.map((tab) => {
                const itemIdx = tabs.findIndex(t => t.name === tab.name);
                const isActive = activeTab === itemIdx;
                const colors = TAB_COLOR_SYSTEM[tab.name] || TAB_COLOR_SYSTEM['Dashboard'];

                return (
                  <div key={tab.name} className="relative group/navitem">
                    <button
                      onClick={() => handleTabChange(itemIdx)}
                      className={`w-full flex items-center transition-all duration-200 cursor-pointer rounded-xl border ${
                        isSidebarCollapsed ? 'justify-center p-2.5' : 'px-3 py-2'
                      } ${
                        isActive 
                          ? `${colors.activeBg} ${colors.activeText} ${colors.activeBorder} shadow-sm` 
                          : 'border-transparent text-text-secondary hover:bg-bg hover:text-text-primary'
                      }`}
                      title={isSidebarCollapsed ? tab.name : undefined}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${isSidebarCollapsed ? '' : 'mr-3'} ${
                        isActive ? `${colors.iconBg} ${colors.iconText}` : `bg-bg/80 ${colors.inactiveIcon} group-hover/navitem:scale-110 transition-transform`
                      }`}>
                        <tab.icon className="w-4 h-4" />
                      </div>
                      {!isSidebarCollapsed && <span className="truncate text-sm font-bold">{tab.name}</span>}
                    </button>

                    {/* Floating Tooltip in Collapsed Mode */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-card text-text-primary type-caption rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover/navitem:opacity-100 transition-opacity z-50 shadow-md border border-border font-semibold">
                        {tab.name}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 overflow-y-auto pb-16 md:pb-24 flex flex-col justify-between">
          <div>
            {activeSubView === 'streaks' ? (
              <ActivityStreaksPage onBack={closeSubView} />
            ) : (
              tabs[activeTab].component
            )}
          </div>
          <Footer />
        </div>
        
        {/* Bottom Nav (Mobile) */}
        <div className="md:hidden fixed bottom-0 w-full bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.03)] z-50">
          <div className="flex justify-around items-center h-16">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => handleTabChange(idx)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 cursor-pointer ${
                  activeTab === idx ? 'text-accent font-bold' : 'text-text-muted hover:text-text-secondary'
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
