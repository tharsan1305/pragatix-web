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
import { ROLE_ACCESS, getEffectiveRole } from '../../config/roleAccess';

export default function AdminDashboard() {
  const auth = useAuth();
  const { user, isSuperAdmin, isHOD, isAdmin, role, subRoles } = auth;
  const effectiveRole = getEffectiveRole(user, { isSuperAdmin, isHOD, isAdmin, role, subRoles });
  const roleConfig = ROLE_ACCESS[effectiveRole];

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
    const currentSelectedYear = searchParams.get('selectedYear') || searchParams.get('academicYear') || searchParams.get('year');
    const newParams: Record<string, string> = { tab: currentTabSlug, view: name };
    if (currentSelectedYear) {
      newParams.selectedYear = currentSelectedYear;
    }
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
    const currentSelectedYear = searchParams.get('selectedYear') || searchParams.get('academicYear') || searchParams.get('year');
    const view = searchParams.get('view');
    
    if (!view) {
      if (currentTabSlug !== 'overview') {
        setSearchParams({ tab: 'overview' });
      }
      return;
    }

    switch (view) {
      case 'create_activity':
      case 'edit_activity':
      case 'assign_faculty':
      case 'teacher_workflow': {
        const p: Record<string, string> = { tab: currentTabSlug, view: 'activity_list' };
        if (currentViewProps.subgroupId) p.subgroupId = String(currentViewProps.subgroupId);
        if (currentViewProps.stageId) p.stageId = String(currentViewProps.stageId);
        if (currentViewProps.subgroupName) p.subgroupName = String(currentViewProps.subgroupName);
        if (currentSelectedYear) p.selectedYear = currentSelectedYear;
        setSearchParams(p);
        break;
      }
      case 'activity_list':
      case 'all_activities': {
        if (currentViewProps.stageId) {
          const p: Record<string, string> = { tab: currentTabSlug, view: 'stage_details', stageId: String(currentViewProps.stageId) };
          if (currentSelectedYear) p.selectedYear = currentSelectedYear;
          setSearchParams(p);
        } else {
          const fallbackParams: Record<string, string> = { tab: 'activity' };
          if (currentSelectedYear) fallbackParams.selectedYear = currentSelectedYear;
          setSearchParams(fallbackParams);
        }
        break;
      }
      case 'stage_details':
      case 'create_stage':
      case 'edit_stage': {
        const fallbackParams: Record<string, string> = { tab: 'activity' };
        if (currentSelectedYear) fallbackParams.selectedYear = currentSelectedYear;
        setSearchParams(fallbackParams);
        break;
      }
      case 'academic_calendar': {
        const p: Record<string, string> = { tab: 'attendance', view: 'attendance_settings' };
        if (currentSelectedYear) p.selectedYear = currentSelectedYear;
        setSearchParams(p);
        break;
      }
      case 'attendance_settings': {
        const p: Record<string, string> = { tab: 'attendance' };
        if (currentSelectedYear) p.selectedYear = currentSelectedYear;
        setSearchParams(p);
        break;
      }
      case 'attendance_settings_year_selection': {
        setSearchParams({ tab: 'attendance' });
        break;
      }
      case 'captain_reward_settings': {
        const p: Record<string, string> = { tab: 'groups' };
        if (currentSelectedYear) p.selectedYear = currentSelectedYear;
        setSearchParams(p);
        break;
      }
      case 'captain_reward_year_selection': {
        setSearchParams({ tab: 'groups' });
        break;
      }
      case 'students':
      case 'teachers':
      case 'departments':
      case 'analytics':
      case 'recycle_bin':
      case 'leaderboard':
      case 'badge_requests':
      case 'super_admin_management':
      default: {
        const fallbackParams: Record<string, string> = { tab: currentTabSlug || 'overview' };
        if (currentSelectedYear) {
          fallbackParams.selectedYear = currentSelectedYear;
        }
        setSearchParams(fallbackParams);
        break;
      }
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

  const allNavSections: NavSection[] = [
    {
      title: 'MONITOR',
      items: [
        { name: 'Overview', slug: 'overview', icon: LayoutDashboard, Component: OverviewTab },
        { 
          name: 'Activity', 
          slug: 'activity', 
          icon: Activity, 
          Component: roleConfig.dataScope === 'institution' ? YearSelectionPage : ActivityTab 
        },
        { name: 'Attendance', slug: 'attendance', icon: CalendarCheck, Component: AdminAttendanceTab },
      ]
    },
    {
      title: 'MANAGE',
      items: [
        { name: 'Groups', slug: 'groups', icon: Users, Component: TeacherGroupManagementTab },
        { name: 'Requests', slug: 'requests', icon: Award, Component: AdminBadgeRequestsTab, badge: pendingRequestsCount },
        { name: 'Admins', slug: 'admins', icon: ShieldCheck, Component: SuperAdminManagementTab },
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

  // Filter sections and items strictly based on roleConfig.navItems
  const navSections: NavSection[] = useMemo(() => {
    return allNavSections
      .map(section => ({
        ...section,
        items: section.items.filter(item => roleConfig.navItems.includes(item.slug))
      }))
      .filter(section => section.items.length > 0);
  }, [roleConfig.navItems, pendingRequestsCount, roleConfig.dataScope]);

  const flatNavItems = useMemo(() => {
    return navSections.flatMap(s => s.items);
  }, [navSections]);

  const currentTabItem = useMemo(() => {
    return flatNavItems.find(i => i.slug === currentTabSlug) || flatNavItems[0];
  }, [flatNavItems, currentTabSlug]);

  const renderActiveTabComponent = () => {
    const ActiveComp = (currentTabItem?.Component || OverviewTab) as any;
    const isNotOverview = currentTabSlug !== 'overview';
    return (
      <ActiveComp 
        onPushView={pushView} 
        onNavigateTab={(slug: string) => setSearchParams({ tab: slug })} 
        onBack={isNotOverview ? () => setSearchParams({ tab: 'overview' }) : undefined}
      />
    );
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
        if (!roleConfig.canManageAdmins) return renderActiveTabComponent();
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
        return <AdminLeaderboardTab onBack={popView} />;
      default:
        return renderActiveTabComponent();
    }
  };

  return (
    <div className="flex h-screen bg-bg flex-col md:flex-row text-text-primary">
      {isTabLoading && <PageLoader message={`Opening ${currentTabItem?.name || 'Page'}...`} fullScreen={true} />}
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
              <h1 className="type-h4 tracking-tight whitespace-nowrap text-text-primary">PragatiX</h1>
              <p className="type-caption text-text-muted mt-0.5 whitespace-nowrap font-medium">
                {roleConfig.portalTitle}
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
              {/* Section Header (Hidden when Collapsed) */}
              {!isSidebarCollapsed ? (
                <div className="px-3 pt-2 pb-1 type-fine font-bold text-text-muted uppercase tracking-wider">
                  {section.title}
                </div>
              ) : sIdx > 0 ? (
                <div className="h-px bg-border-subtle my-2 mx-1" />
              ) : null}

              {/* Section Items */}
              {section.items.map((item) => {
                const isActive = currentTabSlug === item.slug && !currentViewName;
                const Icon = item.icon;
                return (
                  <div key={item.slug} className="relative group/navitem">
                    <button
                      onClick={() => handleTabClick(item.slug)}
                      className={`w-full flex items-center type-nav transition-all cursor-pointer rounded-lg ${
                        isSidebarCollapsed 
                          ? 'justify-center p-3' 
                          : 'justify-between px-3.5 py-2.5'
                      } ${
                        isActive 
                          ? 'bg-accent-tint text-text-primary font-bold shadow-[inset_2px_0_0_var(--accent)]' 
                          : 'text-text-secondary hover:bg-bg hover:text-text-primary'
                      }`}
                      title={isSidebarCollapsed ? item.name : undefined}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-accent' : 'text-text-secondary group-hover/navitem:text-text-primary'}`} />
                        {!isSidebarCollapsed && <span className="truncate">{item.name}</span>}
                      </div>

                      {/* Pill Badge (e.g. Requests Count) */}
                      {!isSidebarCollapsed && item.badge !== undefined && (
                        <span className={`px-2 py-0.5 rounded-full type-fine font-bold ${
                          isActive 
                            ? 'bg-accent-tint text-accent' 
                            : 'bg-bg text-text-secondary border border-border'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>

                    {/* Floating Tooltip in Collapsed Mode */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-text-primary text-card type-caption rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover/navitem:opacity-100 transition-opacity z-50 shadow-md border border-border font-semibold flex items-center gap-2">
                        <span>{item.name}</span>
                        {item.badge !== undefined && (
                          <span className="px-1.5 py-0.2 bg-text-secondary text-card rounded-full type-fine">
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
            className="fixed inset-0 bg-black/60 transition-opacity"
            onClick={() => setIsMobileDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative flex flex-col w-4/5 max-w-xs bg-card text-text-primary h-full shadow-lg border-r border-border z-10 animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="type-h4 tracking-tight text-text-primary">PragatiX</h2>
                <p className="type-caption text-text-muted mt-0.5 font-medium">
                  {roleConfig.portalTitle}
                </p>
              </div>
              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className="p-2 text-text-secondary hover:text-text-primary rounded-lg bg-bg border border-border transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation inside Drawer */}
            <nav className="flex-1 overflow-y-auto p-4 space-y-4">
              {navSections.map((section, sIdx) => (
                <div key={sIdx} className="space-y-1">
                  <div className="px-3 pt-1 pb-1 type-fine font-bold text-text-muted uppercase tracking-wider">
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
                        className={`w-full flex items-center justify-between px-4 py-3 type-nav rounded-lg transition-all cursor-pointer ${
                          isActive 
                            ? 'bg-accent-tint text-text-primary font-bold shadow-[inset_2px_0_0_var(--accent)]' 
                            : 'text-text-secondary hover:bg-bg hover:text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-5 h-5 ${isActive ? 'text-accent' : 'text-text-secondary'}`} />
                          <span>{item.name}</span>
                        </div>
                        {item.badge !== undefined && item.badge > 0 && (
                          <span className={`px-2 py-0.5 rounded-full type-fine font-bold ${
                            isActive ? 'bg-accent-tint text-accent' : 'bg-bg text-text-secondary border border-border'
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
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-bg">
        <div className="flex-1 overflow-y-auto md:pb-0 pb-20 flex flex-col justify-between">
          <div>
            {renderCurrentView()}
          </div>
          <Footer />
        </div>
        
        {/* Bottom Nav (Mobile) - Clean 5-Item Responsive Grid */}
        <div className="md:hidden fixed bottom-0 w-full bg-card/95 backdrop-blur-md border-t border-border shadow-[0_-1px_2px_rgba(0,0,0,0.03)] z-40">
          <div className="grid grid-cols-5 items-center h-16 px-1">
            {/* 1. Overview */}
            <button
              onClick={() => handleTabClick('overview')}
              className={`flex flex-col items-center justify-center h-full space-y-1 transition-colors cursor-pointer ${
                currentTabSlug === 'overview' && !currentViewName ? 'text-accent font-semibold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <LayoutDashboard className="w-5 h-5" />
              <span className="type-fine font-medium">Overview</span>
            </button>

            {/* 2. Activity */}
            <button
              onClick={() => handleTabClick('activity')}
              className={`flex flex-col items-center justify-center h-full space-y-1 transition-colors cursor-pointer ${
                currentTabSlug === 'activity' && !currentViewName ? 'text-accent font-semibold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Activity className="w-5 h-5" />
              <span className="type-fine font-medium">Activity</span>
            </button>

            {/* 3. Attendance */}
            <button
              onClick={() => handleTabClick('attendance')}
              className={`flex flex-col items-center justify-center h-full space-y-1 transition-colors cursor-pointer ${
                currentTabSlug === 'attendance' && !currentViewName ? 'text-accent font-semibold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <CalendarCheck className="w-5 h-5" />
              <span className="type-fine font-medium">Attendance</span>
            </button>

            {/* 4. Requests with Live Badge */}
            <button
              onClick={() => handleTabClick('requests')}
              className={`relative flex flex-col items-center justify-center h-full space-y-1 transition-colors cursor-pointer ${
                currentTabSlug === 'requests' && !currentViewName ? 'text-accent font-semibold' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <div className="relative">
                <Award className="w-5 h-5" />
                {pendingRequestsCount > 0 && (
                  <span className="absolute -top-1 -right-2 w-4 h-4 bg-accent text-card rounded-full text-[10px] font-bold flex items-center justify-center leading-none">
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
                  ? 'text-accent font-semibold'
                  : 'text-text-secondary hover:text-text-primary'
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

