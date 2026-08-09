import { useState, useEffect } from 'react';
import { RefreshCw, ChevronRight, Filter, Star, User, Users, AlertCircle, Bell, UsersRound, Gavel } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../store/authContext';
import StageDetailsPage from '../../admin/pages/StageDetailsPage';
import CreateActivityPage from '../../admin/activity/pages/CreateActivityPage';
import EditActivityPage from '../../admin/activity/pages/EditActivityPage';
import AssignFacultyPage from '../../admin/activity/pages/AssignFacultyPage';
import ActivityListPage from '../../admin/activity/pages/ActivityListPage';
import CCInboxTab from './CCInboxTab';
import AdminBadgeRequestsTab from '../../admin/tabs/AdminBadgeRequestsTab';

export default function ActivityTab() {
  const navigate = useNavigate();
  const { subRoles } = useAuth();
  const isCC = subRoles.some(r => r.toUpperCase() === 'CC' || r.toUpperCase() === 'CLASS_COORDINATOR');

  const [academicYear, setAcademicYear] = useState<string>('FIRST_YEAR');
  const [stagesList, setStagesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // ViewStack Subviews state
  const [activeStageView, setActiveStageView] = useState<any | null>(null);
  const [subView, setSubView] = useState<{ name: string; props?: any } | null>(null);

  // Notification badge counts
  const [pendingBadgeRequests, setPendingBadgeRequests] = useState<number>(0);
  const [pendingPenaltyRequests, setPendingPenaltyRequests] = useState<number>(0);

  useEffect(() => {
    loadInitialData();
    if (isCC) {
      fetchCcStats();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCC]);

  useEffect(() => {
    // Set base history state for the dashboard root view
    if (!window.history.state || !window.history.state.view) {
      window.history.replaceState({ view: 'root' }, '');
    }

    const handlePopState = (event: PopStateEvent) => {
      const state = event.state;
      if (!state || state.view === 'root') {
        setActiveStageView(null);
        setSubView(null);
      } else if (state.view === 'stage') {
        setActiveStageView(state.stageData || null);
        setSubView(null);
      } else if (state.view === 'subView') {
        if (state.stageData) {
          setActiveStageView(state.stageData);
        }
        setSubView({ name: state.subViewName, props: state.subViewProps });
      } else {
        setActiveStageView(null);
        setSubView(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    fetchStages(academicYear);
  }, [academicYear]);

  const loadInitialData = async () => {
    if (!isCC) return;
    try {
      const res = await apiClient.get('/api/v1/cc/class-details');
      if (res.data?.success && res.data?.data?.year) {
        const year = String(res.data.data.year).toUpperCase();
        if (year.includes('2') || year.includes('SECOND')) setAcademicYear('SECOND_YEAR');
        else if (year.includes('3') || year.includes('THIRD')) setAcademicYear('THIRD_YEAR');
        else if (year.includes('4') || year.includes('FOURTH')) setAcademicYear('FOURTH_YEAR');
        else setAcademicYear('FIRST_YEAR');
      }
    } catch {
      // Fallback silently if teacher is not a CC
    }
  };

  const fetchCcStats = async () => {
    try {
      const res = await apiClient.get('/api/v1/cc/dashboard/stats');
      if (res.data?.success) {
        setPendingBadgeRequests(res.data.data?.pendingBadgeRequests ?? 0);
        setPendingPenaltyRequests(res.data.data?.pendingPenaltyRequests ?? 0);
      }
    } catch {
      // Fallback silently
    }
  };

  const fetchStages = async (year: string) => {
    setIsLoading(true);
    try {
      const queryParam = year && year !== 'ALL' ? `?academicYear=${year}` : '';
      let response;
      try {
        response = await apiClient.get(`/api/v1/admin/stages${queryParam}`);
      } catch {
        response = await apiClient.get(`/api/v1/cc/stages${queryParam}`);
      }

      const list = response.data?.success ? (response.data.data || []) : (Array.isArray(response.data) ? response.data : []);
      setStagesList(list);
    } catch (e) {
      console.error("Failed to fetch activity stages", e);
      toast.error("Failed to fetch activity stages");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushView = (name: string, props?: any) => {
    const nextState = {
      view: 'subView',
      subViewName: name,
      subViewProps: props,
      stageData: activeStageView
    };
    window.history.pushState(nextState, '');
    setSubView({ name, props });
  };

  const handleOpenStage = (stage: any) => {
    const nextState = {
      view: 'stage',
      stageData: stage
    };
    window.history.pushState(nextState, '');
    setActiveStageView(stage);
    setSubView(null);
  };

  const handleGoBack = () => {
    window.history.back();
  };

  // Render Subview if active
  if (subView) {
    if (subView.name === 'create_activity') {
      return (
        <CreateActivityPage
          subgroupId={subView.props?.subgroupId}
          stageId={subView.props?.stageId}
          subgroupName={subView.props?.subgroupName}
          onBack={handleGoBack}
          onSuccess={() => { handleGoBack(); fetchStages(academicYear); }}
        />
      );
    }
    if (subView.name === 'edit_activity') {
      return (
        <EditActivityPage
          activity={subView.props?.activity}
          subgroupId={subView.props?.subgroupId}
          onBack={handleGoBack}
          onSuccess={() => { handleGoBack(); fetchStages(academicYear); }}
        />
      );
    }
    if (subView.name === 'assign_faculty') {
      return (
        <AssignFacultyPage
          activity={subView.props?.activity}
          subgroupId={subView.props?.subgroupId}
          onBack={handleGoBack}
          onSuccess={() => { handleGoBack(); }}
        />
      );
    }
    if (subView.name === 'activity_list') {
      return (
        <ActivityListPage
          subgroup={subView.props?.subgroup}
          subgroupId={subView.props?.subgroupId}
          stageId={subView.props?.stageId}
          subgroupName={subView.props?.subgroupName}
          onBack={handleGoBack}
          onPushView={handlePushView}
        />
      );
    }
    if (subView.name === 'cc_inbox') {
      return (
        <CCInboxTab
          onBack={handleGoBack}
        />
      );
    }
    if (subView.name === 'badge_requests') {
      return (
        <AdminBadgeRequestsTab
          onBack={handleGoBack}
        />
      );
    }
  }

  if (activeStageView) {
    return (
      <StageDetailsPage
        stageId={activeStageView.id}
        stageName={activeStageView.name}
        stageDescription={activeStageView.description}
        isTeacherView={true}
        onBack={handleGoBack}
        onPushView={handlePushView}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-slate-50 pb-20">
      {/* Top Header Bar */}
      <div className="bg-[#1E293B] text-white px-6 pt-10 pb-6 shadow-md flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Activities</h1>
          <p className="text-xs text-slate-400 mt-0.5">Explore configured activity stages, thresholds, and assigned tasks</p>
        </div>

        {/* Action Header Icons (Matching Flutter Header 1:1) */}
        <div className="flex items-center space-x-2">
          {isCC && (
            <>
              {/* Badge Requests Notification Icon */}
              <button 
                onClick={() => handlePushView('badge_requests')}
                className="relative p-2.5 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors cursor-pointer"
                title="Badge Requests"
              >
                <Bell className="w-5 h-5" />
                {pendingBadgeRequests > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {pendingBadgeRequests}
                  </span>
                )}
              </button>

              {/* Students Directory Icon */}
              <button 
                onClick={() => navigate('/teacher/students-directory')}
                className="p-2.5 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors cursor-pointer"
                title="Students Directory"
              >
                <UsersRound className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Disciplinary Inbox Icon (Hammer / Gavel) - Visible for ALL Teachers */}
          <button 
            onClick={() => handlePushView('cc_inbox')}
            className="relative p-2.5 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors cursor-pointer"
            title="Penalty Requests"
          >
            <Gavel className="w-5 h-5" />
            {pendingPenaltyRequests > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {pendingPenaltyRequests}
              </span>
            )}
          </button>

          {/* Refresh Button */}
          <button 
            onClick={() => fetchStages(academicYear)} 
            className="p-2.5 bg-slate-800 rounded-full text-white hover:bg-slate-700 transition-colors shadow-xs cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-5">
        {/* Academic Year Selector Card */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center space-x-2 text-slate-700 font-bold text-sm">
            <Filter className="w-4 h-4 text-slate-500" />
            <span>Academic Year:</span>
          </div>
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="w-full sm:w-auto bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-slate-900 outline-none cursor-pointer"
          >
            <option value="FIRST_YEAR">FIRST YEAR</option>
            <option value="SECOND_YEAR">SECOND YEAR</option>
            <option value="THIRD_YEAR">THIRD YEAR</option>
            <option value="FOURTH_YEAR">FOURTH YEAR</option>
            <option value="ALL">All Academic Years</option>
          </select>
        </div>

        {/* Stages List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : stagesList.length === 0 ? (
          <div className="text-center py-16 text-slate-500 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-base font-semibold text-slate-800">No activity stages configured for {academicYear.replace('_', ' ')}.</p>
            <p className="text-xs text-slate-400 mt-1">Select another academic year or contact system admin.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {stagesList.map((stage) => {
              const active = stage.isActive ?? stage.active ?? (stage.status === 'ACTIVE');
              const statusText = stage.status || (active ? 'ACTIVE' : 'UPCOMING');
              const displayOrder = stage.displayOrder ?? stage.order ?? 1;
              const expectedXp = stage.expectedXp ?? stage.totalXp ?? 200;
              const mThresh = stage.mustThreshold ?? stage.mThreshold ?? 80;
              const iThresh = stage.individualThreshold ?? stage.iThreshold ?? 150;
              const gThresh = stage.groupThreshold ?? stage.gThreshold ?? 150;

              return (
                <div 
                  key={stage.id} 
                  onClick={() => handleOpenStage(stage)}
                  className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 hover:border-slate-400 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex-1 pr-4 space-y-3">
                    {/* Status Pill & Expected XP Header */}
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                        statusText === 'ACTIVE' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {statusText}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        Expected: {expectedXp} XP
                      </span>
                    </div>

                    {/* Stage Name */}
                    <h2 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {stage.name || stage.stageName || `Stage ${displayOrder}`}
                    </h2>

                    {/* Threshold Badges (Order, M, I, G) - 1:1 Flutter Alignment */}
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                      <span className="text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                        Order: {displayOrder}
                      </span>
                      <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                        <Star className="w-3 h-3 fill-rose-600" />
                        M: {mThresh}
                      </span>
                      <span className="text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                        <User className="w-3 h-3" />
                        I: {iThresh}
                      </span>
                      <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        G: {gThresh}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
