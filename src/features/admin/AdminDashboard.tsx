import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Footer from '../../components/common/Footer';
import OverviewTab from './tabs/OverviewTab';
import ActivityTab from './tabs/ActivityTab';
import TeacherGroupManagementTab from '../teacher/tabs/TeacherGroupManagementTab';
import AdminProfileTab from './tabs/AdminProfileTab';
import StudentsTab from './tabs/StudentsTab';
import TeachersTab from './tabs/TeachersTab';
import DepartmentsTab from './tabs/DepartmentsTab';
import AdminAttendanceTab from './tabs/AdminAttendanceTab';
import AdminBadgeRequestsTab from './tabs/AdminBadgeRequestsTab';
import SuperAdminManagementTab from './tabs/SuperAdminManagementTab';
import GroupActivityExecutionPage from './activity/pages/GroupActivityExecutionPage';
import CreateStagePage from './pages/CreateStagePage';
import EditStagePage from './pages/EditStagePage';
import StageDetailsPage from './pages/StageDetailsPage';
import ActivityListPage from './activity/pages/ActivityListPage';
import CreateActivityPage from './activity/pages/CreateActivityPage';
import EditActivityPage from './activity/pages/EditActivityPage';
import AssignFacultyPage from './activity/pages/AssignFacultyPage';
import TeacherActivityWorkflowPage from '../teacher/pages/TeacherActivityWorkflowPage';
import CaptainRewardYearSelectionPage from './pages/CaptainRewardYearSelectionPage';
import CaptainRewardSettingsPage from './pages/CaptainRewardSettingsPage';
import AttendanceSettingsYearSelectionPage from './pages/AttendanceSettingsYearSelectionPage';
import AttendanceSettingsPage from './pages/AttendanceSettingsPage';
import AcademicCalendarPage from './pages/AcademicCalendarPage';
import AnalyticsTab from './tabs/AnalyticsTab';
import AdminLeaderboardTab from './tabs/AdminLeaderboardTab';
import YearSelectionPage from './pages/YearSelectionPage';
import RecycleBinPage from './recycle_bin/pages/RecycleBinPage';
import PageLoader from '../../components/common/PageLoader';
import { LayoutDashboard, Activity, Users, User, CalendarCheck, Award, Trophy, ShieldCheck, PanelLeftClose, PanelLeftOpen, Menu, X } from 'lucide-react';
import { useAuth } from '../../store/authContext';
import apiClient from '../../services/apiClient';

export default function AdminDashboard() {
  const { isSuperAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [pendingRequestsCount, setPendingRequestsCount] = useState<number>(0);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('pragatix_admin_sidebar_collapsed') === 'true';
  });

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        let res = null;
        try {
          res = await apiClient.get('/api/admin/badge-requests');
        } catch {
          try {
            res = await apiClient.get('/api/cc/badge-requests');
          } catch {
            res = null;
          }
        }
        if (res?.data?.success && Array.isArray(res.data.data)) {
          const pending = res.data.data.filter((r: any) => (r.status || '').toUpperCase() === 'PENDING').length;
          setPendingRequestsCount(pending);
        }
      } catch {
        // ignore network error
      }
    };
    fetchPendingCount();
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('pragatix_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const currentViewName = searchParams.get('view');
  const currentTabSlug = currentViewName === 'leaderboard' ? 'leaderboard' : (searchParams.get('tab') || 'overview');
  
  const currentViewProps = useMemo(() => {
    const p: Record<string, any> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'tab' && key !== 'view') {
        p[key] = value;
      }
    });
    return p;
  }, [searchParams]);

  const pushView = (name: string, props?: Record<string, any>) => {
    if (name === 'leaderboard') {
      setSearchParams({ tab: 'leaderboard' });
      return;
    }
    const newParams: Record<string, string> = { tab: currentTabSlug, view: name };
    if (props) {
      Object.entries(props).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          if (typeof v !== 'object') {
            newParams[k] = String(v);
          } else {
            if (k === 'activity' && (v as any).id) {
              newParams.activityId = String((v as any).id);
            }
            if (k === 'stage' && (v as any).id) {
              newParams.stageId = String((v as any).id);
            }
          }
        }
      });
    }
    setSearchParams(newParams);
  };

  const popView = () => {
    if (window.history.length > 1 && searchParams.get('view')) {
      window.history.back();
    } else {
      setSearchParams({ tab: currentTabSlug });
    }
  };

  const handleTabClick = (slug: string) => {
    setIsTabLoading(true);
    setSearchParams({ tab: slug });
    setTimeout(() => {
      setIsTabLoading(false);
    }, 250);
  };

  interface NavItem {
    name: string;
    slug: string;
    icon: any;
    Component: React.ComponentType<any>;
    badge?: number;
  }

  interface NavSection {
    title: string;
    items: NavItem[];
  }

  const navSections: NavSection[] = [
    {
      title: 'MONITOR',
      items: [
        { name: 'Overview', slug: 'overview', icon: LayoutDashboard, Component: OverviewTab },
        { name: 'Activity', slug: 'activity', icon: Activity, Component: isSuperAdmin ? YearSelectionPage : ActivityTab },
        { name: 'Attendance', slug: 'attendance', icon: CalendarCheck, Component: AdminAttendanceTab },
      ]
    },
    {
      title: 'MANAGE',
      items: [
        { name: 'Groups', slug: 'groups', icon: Users, Component: TeacherGroupManagementTab },
        { name: 'Requests', slug: 'requests', icon: Award, Component: AdminBadgeRequestsTab, badge: pendingRequestsCount },
        ...(isSuperAdmin ? [{ name: 'Admins', slug: 'admins', icon: ShieldCheck, Component: SuperAdminManagementTab }] : []),
      ]
    },
    {
      title: 'INSIGHTS',
      items: [
        { name: 'Leaderboard', slug: 'leaderboard', icon: Trophy, Component: AdminLeaderboardTab },
        { name: 'Profile', slug: 'profile', icon: User, Component: AdminProfileTab }
      ]
    }
  ];

  const flatNavItems = useMemo(() => {
    return navSections.flatMap(s => s.items);
  }, [navSections]);

  const currentTabItem = useMemo(() => {
    return flatNavItems.find(i => i.slug === currentTabSlug) || flatNavItems[0];
  }, [flatNavItems, currentTabSlug]);

  const renderActiveTabComponent = () => {
    const ActiveComp = (currentTabItem?.Component || OverviewTab) as any;
    return <ActiveComp onPushView={pushView} onNavigateTab={(slug: string) => setSearchParams({ tab: slug })} />;
  };

  const renderCurrentView = () => {
    if (!currentViewName) {
      return renderActiveTabComponent();
    }
    switch (currentViewName) {
      case 'attendance':
        return <AdminAttendanceTab onBack={popView} />;
      case 'badge_requests':
        return <AdminBadgeRequestsTab onBack={popView} />;
      case 'super_admin_management':
        return <SuperAdminManagementTab onBack={popView} />;
      case 'group_activity_execution':
        return <GroupActivityExecutionPage onBack={popView} activityId={currentViewProps.activityId} assignmentId={currentViewProps.assignmentId} />;
      case 'students':
        return <StudentsTab onBack={popView} />;
      case 'teachers':
        return <TeachersTab onBack={popView} />;
      case 'departments':
        return <DepartmentsTab onBack={popView} />;
      case 'create_stage':
        return <CreateStagePage onBack={popView} />;
      case 'edit_stage':
        return <EditStagePage onBack={popView} stage={currentViewProps.stage} stageId={currentViewProps.stageId} />;
      case 'stage_details':
        return <StageDetailsPage onBack={popView} stageId={Number(currentViewProps.stageId) || currentViewProps.stageId} stageName={currentViewProps.stageName || ''} stageDescription={currentViewProps.stageDescription || ''} teachersList={currentViewProps.teachersList} onPushView={pushView} />;
      case 'activity_list':
      case 'all_activities':
        return <ActivityListPage onBack={popView} subgroup={currentViewProps.subgroup} subgroupId={currentViewProps.subgroupId} stageId={currentViewProps.stageId} subgroupName={currentViewProps.subgroupName || (currentViewName === 'all_activities' ? 'All Activities' : undefined)} academicYear={currentViewProps.academicYear} onPushView={pushView} />;
      case 'create_activity':
        return <CreateActivityPage onBack={popView} subgroupId={currentViewProps.subgroupId} stageId={currentViewProps.stageId} subgroupName={currentViewProps.subgroupName} />;
      case 'edit_activity':
        return <EditActivityPage onBack={popView} activity={currentViewProps.activity} activityId={currentViewProps.activityId ? Number(currentViewProps.activityId) : undefined} />;
      case 'assign_faculty':
        return <AssignFacultyPage activity={currentViewProps.activity} activityId={currentViewProps.activityId ? Number(currentViewProps.activityId) : undefined} stageId={currentViewProps.stageId ? Number(currentViewProps.stageId) : undefined} onBack={popView} />;
      case 'teacher_workflow':
        return <TeacherActivityWorkflowPage activity={currentViewProps.activity} stageId={currentViewProps.stageId} academicYear={currentViewProps.academicYear} subgroupName={currentViewProps.subgroupName} onBack={popView} />;
      case 'captain_reward_year_selection':
        return <CaptainRewardYearSelectionPage onBack={popView} onSelectYear={(yr) => pushView('captain_reward_settings', { academicYear: yr })} />;
      case 'captain_reward_settings':
        return <CaptainRewardSettingsPage academicYear={currentViewProps.academicYear} onBack={popView} />;
      case 'attendance_settings_year_selection':
        return <AttendanceSettingsYearSelectionPage onBack={popView} onSelectYear={(yr) => pushView('attendance_settings', { academicYear: yr })} />;
      case 'attendance_settings':
        return <AttendanceSettingsPage academicYear={currentViewProps.academicYear} onBack={popView} onNavigateAcademicCalendar={() => pushView('academic_calendar', { academicYear: currentViewProps.academicYear })} />;
      case 'academic_calendar':
        return <AcademicCalendarPage academicYear={currentViewProps.academicYear} onBack={popView} />;
      case 'recycle_bin':
        return <RecycleBinPage onBack={popView} />;
      case 'analytics':
        return <AnalyticsTab onBack={popView} />;
      case 'leaderboard':
        return <AdminLeaderboardTab />;
      default:
        return renderActiveTabComponent();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 flex-col md:flex-row">
      {isTabLoading && <PageLoader message={`Opening ${currentTabItem?.name || 'Page'}...`} fullScreen={true} />}
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
              <p className="type-caption text-slate-400 mt-0.5 whitespace-nowrap">
                {isSuperAdmin ? 'Super Admin Portal' : 'Admin Portal'}
              </p>
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
            {/* Pill Tooltip matching screenshot */}
            <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-black text-white text-xs font-semibold rounded-full whitespace-nowrap opacity-0 pointer-events-none group-hover/toggle:opacity-100 transition-opacity z-50 shadow-2xl border border-slate-700">
              {isSidebarCollapsed ? 'Open sidebar' : 'Close sidebar'}
            </div>
          </div>
        </div>

        {/* Grouped Navigation Sections */}
        <nav className="flex-1 overflow-y-auto py-3 space-y-4 px-3">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {/* Section Header (Hidden when Collapsed) */}
              {!isSidebarCollapsed ? (
                <div className="px-3 pt-2 pb-1 type-fine font-bold text-slate-500 uppercase tracking-wider">
                  {section.title}
                </div>
              ) : sIdx > 0 ? (
                <div className="h-px bg-slate-800 my-2 mx-1" />
              ) : null}

              {/* Section Items */}
              {section.items.map((item) => {
                const isActive = currentTabSlug === item.slug && !currentViewName;
                const Icon = item.icon;
                return (
                  <div key={item.slug} className="relative group/navitem">
                    <button
                      onClick={() => handleTabClick(item.slug)}
                      className={`w-full flex items-center type-nav transition-all cursor-pointer rounded-2xl ${
                        isSidebarCollapsed 
                          ? 'justify-center p-3' 
                          : 'justify-between px-3.5 py-2.5'
                      } ${
                        isActive 
                          ? 'bg-[#fff1f2] text-[#e11d48] font-bold shadow-xs' 
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                      title={isSidebarCollapsed ? item.name : undefined}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-[#e11d48]' : 'text-slate-400 group-hover/navitem:text-slate-200'}`} />
                        {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
                      </div>

                      {/* Pill Badge (e.g. Requests Count) */}
                      {!isSidebarCollapsed && item.badge !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full type-fine font-bold ${
                          isActive 
                            ? 'bg-[#e11d48]/15 text-[#e11d48]' 
                            : 'bg-slate-800 text-slate-400 group-hover/navitem:bg-slate-700'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>

                    {/* Floating Tooltip in Collapsed Mode */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-950 text-white type-caption rounded-xl whitespace-nowrap opacity-0 pointer-events-none group-hover/navitem:opacity-100 transition-opacity z-50 shadow-2xl border border-slate-700 font-semibold flex items-center gap-2">
                        <span>{item.name}</span>
                        {item.badge !== undefined && (
                          <span className="px-1.5 py-0.2 bg-slate-800 text-slate-300 rounded-full type-fine">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Mobile Slide-Over Drawer */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-4/5 max-w-xs bg-slate-900 text-white h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h2 className="type-h4 tracking-tight">PragatiX</h2>
                <p className="type-caption text-slate-400 mt-0.5">
                  {isSuperAdmin ? 'Super Admin Portal' : 'Admin Portal'}
                </p>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation inside Drawer */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-4">
              {navSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <div className="px-3 pt-1 pb-1 type-fine font-bold text-slate-500 uppercase tracking-wider">
                    {section.title}
                  </div>
                  {section.items.map((item) => {
                    const isActive = currentTabSlug === item.slug && !currentViewName;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.slug}
                        onClick={() => {
                          handleTabClick(item.slug);
                          setIsMobileDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 type-nav rounded-2xl transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-[#fff1f2] text-[#e11d48] font-bold shadow-sm' 
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isActive ? 'text-[#e11d48]' : 'text-slate-400'}`} />
                          <span>{item.name}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className={`px-2 py-0.5 rounded-full type-fine font-bold ${
                            isActive ? 'bg-[#e11d48]/15 text-[#e11d48]' : 'bg-slate-800 text-slate-300'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 overflow-y-auto md:pb-0 pb-20 flex flex-col justify-between">
          <div>
            {renderCurrentView()}
          </div>
          <Footer />
        </div>
        
        {/* Bottom Nav (Mobile) - Clean 5-Item Responsive Grid */}
        <div className="md:hidden fixed bottom-0 w-full bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-[0_-4px_12px_rgba(0,0,0,0.3)] z-40">
          <div className="grid grid-cols-5 items-center h-16 px-1">
            {/* 1. Overview */}
            <button
              onClick={() => handleTabClick('overview')}
              className={`flex flex-col items-center justify-center h-full space-y-1 transition-colors cursor-pointer ${
                currentTabSlug === 'overview' && !currentViewName ? 'text-[#e11d48]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="type-fine font-medium">Overview</span>
            </button>

            {/* 2. Activity */}
            <button
              onClick={() => handleTabClick('activity')}
              className={`flex flex-col items-center justify-center h-full space-y-1 transition-colors cursor-pointer ${
                currentTabSlug === 'activity' && !currentViewName ? 'text-[#e11d48]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="type-fine font-medium">Activity</span>
            </button>

            {/* 3. Attendance */}
            <button
              onClick={() => handleTabClick('attendance')}
              className={`flex flex-col items-center justify-center h-full space-y-1 transition-colors cursor-pointer ${
                currentTabSlug === 'attendance' && !currentViewName ? 'text-[#e11d48]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarCheck className="w-5 h-5" />
              <span className="type-fine font-medium">Attendance</span>
            </button>

            {/* 4. Requests with Live Badge */}
            <button
              onClick={() => handleTabClick('requests')}
              className={`relative flex flex-col items-center justify-center h-full space-y-1 transition-colors cursor-pointer ${
                currentTabSlug === 'requests' && !currentViewName ? 'text-[#e11d48]' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Award className="w-5 h-5" />
                {pendingRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center leading-none">
                    {pendingRequestsCount}
                  </span>
                )}
              </div>
              <span className="type-fine font-medium">Requests</span>
            </button>

            {/* 5. Menu (Opens Drawer for Groups, Admins, Leaderboard, Profile) */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className={`flex flex-col items-center justify-center h-full space-y-1 transition-colors cursor-pointer ${
                ['groups', 'admins', 'leaderboard', 'profile'].includes(currentTabSlug) && !currentViewName
                  ? 'text-[#e11d48]'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Menu className="w-5 h-5" />
              <span className="type-fine font-medium">Menu</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

