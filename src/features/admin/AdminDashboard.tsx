import { useState, useMemo } from 'react';
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
import CaptainRewardYearSelectionPage from './pages/CaptainRewardYearSelectionPage';
import CaptainRewardSettingsPage from './pages/CaptainRewardSettingsPage';
import AttendanceSettingsYearSelectionPage from './pages/AttendanceSettingsYearSelectionPage';
import AttendanceSettingsPage from './pages/AttendanceSettingsPage';
import AcademicCalendarPage from './pages/AcademicCalendarPage';
import AnalyticsTab from './tabs/AnalyticsTab';
import PageLoader from '../../components/common/PageLoader';
import { LayoutDashboard, Activity, Users, User, CalendarCheck, Award, BarChart3, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../store/authContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isTabLoading, setIsTabLoading] = useState(false);

  const isSuperAdmin = user?.roles?.some((r: any) => {
    const name = typeof r === 'string' ? r : (r?.name || '');
    return name === 'ROLE_SUPER_ADMIN' || name === 'ROLE_SUPERADMIN' || name === 'SUPER_ADMIN';
  }) || user?.isSuperAdmin || false;

  const tabSlugs = [
    'overview',
    'activity',
    'attendance',
    'groups',
    'requests',
    ...(isSuperAdmin ? ['admins'] : []),
    'analytics',
    'profile'
  ];

  const currentTabSlug = searchParams.get('tab') || 'overview';
  const foundIdx = tabSlugs.indexOf(currentTabSlug);
  const activeTab = foundIdx !== -1 ? foundIdx : 0;

  const currentViewName = searchParams.get('view');
  
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
    const newParams: Record<string, string> = { tab: currentTabSlug, view: name };
    if (props) {
      Object.entries(props).forEach(([k, v]) => {
        if (v !== undefined && v !== null && typeof v !== 'object') {
          newParams[k] = String(v);
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

  const handleTabClick = (idx: number) => {
    const slug = tabSlugs[idx] || 'overview';
    if (slug !== currentTabSlug || currentViewName) {
      setIsTabLoading(true);
      setSearchParams({ tab: slug });
      setTimeout(() => {
        setIsTabLoading(false);
      }, 350);
    }
  };

  const tabs: { name: string; icon: any; Component: React.ComponentType<any> }[] = [
    { name: 'Overview', icon: LayoutDashboard, Component: OverviewTab },
    { name: 'Activity', icon: Activity, Component: ActivityTab },
    { name: 'Attendance', icon: CalendarCheck, Component: AdminAttendanceTab },
    { name: 'Groups', icon: Users, Component: TeacherGroupManagementTab },
    { name: 'Requests', icon: Award, Component: AdminBadgeRequestsTab },
    ...(isSuperAdmin ? [{ name: 'Admins', icon: ShieldCheck, Component: SuperAdminManagementTab }] : []),
    { name: 'Analytics', icon: BarChart3, Component: AnalyticsTab },
    { name: 'Profile', icon: User, Component: AdminProfileTab }
  ];

  const renderActiveTabComponent = () => {
    const ActiveComp = tabs[activeTab]?.Component || OverviewTab;
    return <ActiveComp onPushView={pushView} />;
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
        return <EditStagePage onBack={popView} stage={currentViewProps.stage} />;
      case 'stage_details':
        return <StageDetailsPage onBack={popView} stageId={Number(currentViewProps.stageId) || currentViewProps.stageId} stageName={currentViewProps.stageName || ''} stageDescription={currentViewProps.stageDescription || ''} teachersList={currentViewProps.teachersList} onPushView={pushView} />;
      case 'activity_list':
        return <ActivityListPage onBack={popView} subgroup={currentViewProps.subgroup} subgroupId={currentViewProps.subgroupId} stageId={currentViewProps.stageId} subgroupName={currentViewProps.subgroupName} onPushView={pushView} />;
      case 'create_activity':
        return <CreateActivityPage onBack={popView} subgroupId={currentViewProps.subgroupId} stageId={currentViewProps.stageId} subgroupName={currentViewProps.subgroupName} />;
      case 'edit_activity':
        return <EditActivityPage onBack={popView} activity={currentViewProps.activity} />;
      case 'assign_faculty':
        return <AssignFacultyPage activity={currentViewProps.activity} onBack={popView} />;
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
      case 'analytics':
        return <AnalyticsTab />;
      default:
        return renderActiveTabComponent();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 flex-col md:flex-row">
      {isTabLoading && <PageLoader message={`Opening ${tabs[activeTab]?.name || 'Tab'}...`} fullScreen={true} />}
      {/* Sidebar (Desktop) */}
      <div className="hidden md:flex w-64 flex-col bg-slate-900 text-white shadow-xl z-20">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold tracking-tight">PragatiX</h1>
          <p className="text-xs text-slate-400 mt-1">Admin Portal</p>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => handleTabClick(idx)}
              className={`w-full flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === idx 
                  ? 'bg-red-600 text-white border-l-4 border-red-400' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-4 border-transparent'
              }`}
            >
              <tab.icon className={`w-5 h-5 mr-3 ${activeTab === idx ? 'text-red-200' : 'text-slate-400'}`} />
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <div className="flex-1 overflow-y-auto md:pb-0 pb-20 flex flex-col justify-between">
          <div>
            {renderCurrentView()}
          </div>
          <Footer />
        </div>
        
        {/* Bottom Nav (Mobile) */}
        <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50">
          <div className="flex justify-around items-center h-16">
            {tabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => handleTabClick(idx)}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  activeTab === idx ? 'text-red-500' : 'text-slate-500 hover:text-slate-700'
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

