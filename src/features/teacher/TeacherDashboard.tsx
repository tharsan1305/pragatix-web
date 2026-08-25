import { logger } from '../../utils/logger';
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
import { Activity, Trophy, Users, BarChart3, User, CalendarCheck, Gavel, PanelLeftClose, PanelLeftOpen } from 'lucide-react';

export default function TeacherDashboard() {
  const { subRoles, setSubRoles } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('pragatix_teacher_sidebar_collapsed') === 'true';
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('pragatix_teacher_sidebar_collapsed', String(next));
      return next;
    });
  };

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
        logger.error('Failed to fetch profile', err);
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

  interface NavItem {
    id: string;
    name: string;
    icon: any;
    component: React.ReactNode;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const allNavSections: NavSection[] = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'activities', name: 'Activities', icon: Activity, component: <ActivityTab onNavigateTab={(slug) => handleTabSelectBySlug(slug)} /> },
        { id: 'attendance', name: 'Attendance', icon: CalendarCheck, component: <AttendanceTab onBack={() => handleTabSelectBySlug('activities')} /> },
      ]
    },
    {
      title: 'MANAGEMENT',
      items: [
        { id: 'requests', name: 'Requests', icon: Gavel, component: <CCInboxTab onBack={() => handleTabSelectBySlug('activities')} /> },
        ...(canManageGroups ? [{ id: 'groups', name: 'Groups', icon: Users, component: <TeacherGroupManagementTab onBack={() => handleTabSelectBySlug('activities')} /> }] : []),
      ]
    },
    {
      title: 'INSIGHTS & ACCOUNT',
      items: [
        { id: 'leaderboard', name: 'Leaderboard', icon: Trophy, component: <LeaderboardTab onBack={() => handleTabSelectBySlug('activities')} /> },
        ...(isHOD ? [{ id: 'hod_report', name: 'HOD Report', icon: BarChart3, component: <HodPerformanceTab /> }] : []),
        { id: 'profile', name: 'Profile', icon: User, component: <ProfileTab onBack={() => handleTabSelectBySlug('activities')} /> },
      ]
    }
  ];

  // Filter out any empty sections
  const navSections = allNavSections.filter(s => s.items.length > 0);
  const availableTabs = navSections.flatMap(s => s.items);

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

  const handleTabSelectBySlug = (slug: string) => {
    const idx = availableTabs.findIndex(t => t.id === slug);
    if (idx !== -1) handleTabChange(idx);
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-bg text-text-primary">Loading Teacher Profile...</div>;
  }

  // Ensure activeTab is within bounds (e.g. if roles change)
  const currentTabComponent = availableTabs[activeTab]?.component || availableTabs[0].component;

  return (
    <div className="flex h-screen bg-bg flex-col md:flex-row text-text-primary">
      {isTabLoading && <PageLoader message={`Opening ${availableTabs[activeTab]?.name || 'Page'}...`} fullScreen={true} />}
      {/* Sidebar (Desktop) */}
      <div className={`hidden md:flex flex-col bg-card text-text-primary border-r border-border z-20 transition-all duration-300 ease-in-out shrink-0 ${
        isSidebarCollapsed ? 'w-20' : 'w-64'
      }`}>
        {/* Header & Toggle Button */}
        <div className={`flex items-center justify-between border-b border-border transition-all ${
          isSidebarCollapsed ? 'p-4 justify-center' : 'p-6'
        }`}>
          {!isSidebarCollapsed && (
            <div className="overflow-hidden min-w-0">
              <h1 className="type-h4 tracking-tight whitespace-nowrap text-text-primary font-bold">PragatiX</h1>
              <p className="type-caption text-text-muted mt-0.5 whitespace-nowrap font-medium">
                {isHOD ? 'HOD Portal' : isCC ? 'Class Coordinator Portal' : 'Teacher Portal'}
              </p>
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
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-text-primary text-card text-xs font-semibold rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover/toggle:opacity-100 transition-opacity z-50 shadow-sm border border-border">
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
                const isActive = (availableTabs[activeTab]?.id === tab.id);
                return (
                  <div key={tab.id} className="relative group/navitem">
                    <button
                      onClick={() => handleTabSelectBySlug(tab.id)}
                      className={`w-full flex items-center type-nav transition-all cursor-pointer rounded-lg ${
                        isSidebarCollapsed ? 'justify-center p-3' : 'px-3.5 py-2.5'
                      } ${
                        isActive 
                          ? 'bg-accent-tint text-text-primary font-bold shadow-[inset_2px_0_0_var(--accent)]' 
                          : 'text-text-secondary hover:bg-bg hover:text-text-primary'
                      }`}
                      title={isSidebarCollapsed ? tab.name : undefined}
                    >
                      <tab.icon className={`w-5 h-5 shrink-0 ${isSidebarCollapsed ? '' : 'mr-3'} ${isActive ? 'text-accent' : 'text-text-secondary group-hover/navitem:text-text-primary'}`} />
                      {!isSidebarCollapsed && <span className="truncate">{tab.name}</span>}
                    </button>

                    {/* Floating Tooltip in Collapsed Mode */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-text-primary text-card type-caption rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover/navitem:opacity-100 transition-opacity z-50 shadow-md border border-border font-semibold">
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
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-bg">
        <div className="flex-1 overflow-y-auto md:pb-0 pb-20 flex flex-col justify-between">
          <div>
            {currentTabComponent}
          </div>
          <Footer />
        </div>
        
        {/* Bottom Nav (Mobile) */}
        <div className="md:hidden fixed bottom-0 w-full bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-1px_2px_rgba(0,0,0,0.03)] z-40">
          <div className="flex justify-around items-center h-16 px-1">
            {availableTabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => handleTabChange(idx)}
                className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors cursor-pointer ${
                  activeTab === idx ? 'text-accent font-semibold' : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <tab.icon className={`w-5 h-5 ${activeTab === idx ? 'text-accent' : 'text-text-secondary'}`} />
                <span className="type-fine font-medium">{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
