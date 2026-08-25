import { logger } from '../../../utils/logger';
import { useState, useEffect } from 'react';
import { RefreshCw, ChevronRight, Star, User, Users, AlertCircle, Bell, UsersRound, Gavel, Calendar, UserCheck, ArrowLeft, GraduationCap, UserPlus, X, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../../services/apiClient';
import { useAuth } from '../../../store/authContext';
import StageDetailsPage from '../../admin/pages/StageDetailsPage';
import CreateActivityPage from '../../admin/activity/pages/CreateActivityPage';
import EditActivityPage from '../../admin/activity/pages/EditActivityPage';
import AssignFacultyPage from '../../admin/activity/pages/AssignFacultyPage';
import ActivityListPage from '../../admin/activity/pages/ActivityListPage';
import CCInboxTab from './CCInboxTab';
import AdminBadgeRequestsTab from '../../admin/tabs/AdminBadgeRequestsTab';
import TeacherActivityWorkflowPage from '../pages/TeacherActivityWorkflowPage';
import GroupActivityYearPage from '../../admin/activity/pages/GroupActivityYearPage';

interface Props {
  onBack?: () => void;
  onNavigateTab?: (slug: string) => void;
}

export default function ActivityTab({ onBack, onNavigateTab: _onNavigateTab }: Props = {}) {
  const navigate = useNavigate();
  const { isSuperAdmin, isAdmin, isCC } = useAuth();

  const [academicYear, setAcademicYear] = useState<string>('FIRST_YEAR');
  const [stagesList, setStagesList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [classDetails, setClassDetails] = useState<any>(null);
  const [showQuickAssignModal, setShowQuickAssignModal] = useState<boolean>(false);

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
      if (res.data?.success && res.data?.data) {
        setClassDetails(res.data.data);
        const year = String(res.data.data.year || res.data.data.yearName || '').toUpperCase();
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
        response = await apiClient.get(`/api/v1/cc/activities/stages${queryParam}`);
      } catch {
        try {
          response = await apiClient.get(`/api/v1/students/stages${queryParam}`);
        } catch {
          try {
            response = await apiClient.get(`/api/v1/cc/stages${queryParam}`);
          } catch {
            response = await apiClient.get(`/api/v1/admin/stages${queryParam}`);
          }
        }
      }

      const list = response.data?.success ? (response.data.data || []) : (Array.isArray(response.data) ? response.data : []);
      setStagesList(list);
    } catch (e) {
      logger.warn("Failed to fetch activity stages:", e);
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
          stageId={subView.props?.stageId}
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
          academicYear={subView.props?.academicYear || activeStageView?.academicYear || activeStageView?.name || '1st Year'}
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
    if (subView.name === 'teacher_workflow') {
      return (
        <TeacherActivityWorkflowPage
          activity={subView.props?.activity}
          stageId={subView.props?.stageId}
          subgroupName={subView.props?.subgroupName}
          academicYear={subView.props?.academicYear || academicYear}
          onBack={handleGoBack}
        />
      );
    }
    if (subView.name === 'group_activity_year') {
      return (
        <GroupActivityYearPage
          onBack={handleGoBack}
          onPushView={handlePushView}
        />
      );
    }
    if (subView.name === 'cc_stage_details') {
      const stage = subView.props?.stage || activeStageView;
      const stageId = stage?.id;
      const stageName = stage?.name || stage?.stageName || 'Stage Details';
      const stageDesc = stage?.description || 'Configured activity stage';
      const mThresh = stage?.mustThreshold ?? stage?.mThreshold ?? 80;
      const iThresh = stage?.individualThreshold ?? stage?.iThreshold ?? 150;
      const gThresh = stage?.groupThreshold ?? stage?.gThreshold ?? 150;

      const categories = [
        {
          key: 'Must',
          title: 'Mandatory (M)',
          subtitle: 'Required activities to clear this stage',
          threshold: mThresh,
          color: 'text-rose-700 bg-rose-50 border-rose-200',
          badgeBg: 'bg-rose-600 text-white',
          badge: 'M',
        },
        {
          key: 'Individual',
          title: 'Individual (I)',
          subtitle: 'Solo performance and learning tasks',
          threshold: iThresh,
          color: 'text-blue-700 bg-blue-50 border-blue-200',
          badgeBg: 'bg-blue-600 text-white',
          badge: 'I',
        },
        {
          key: 'Group',
          title: 'Group (G)',
          subtitle: 'Team and collaborative discipline events',
          threshold: gThresh,
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          badgeBg: 'bg-emerald-600 text-white',
          badge: 'G',
        },
      ];

      return (
        <div className="flex flex-col min-h-full bg-bg pb-20">
          {/* Header */}
          <div className="bg-card text-text-primary px-4 md:px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={handleGoBack} className="p-2 border border-border bg-card hover:bg-bg rounded-lg text-text-secondary hover:text-text-primary transition cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="type-h4 text-text-primary">{stageName}</h1>
            </div>
          </div>

          <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-6">
            {/* Stage Summary Card */}
            <div className="bg-card p-5 rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center gap-4">
              <div className="p-3 bg-bg border border-border text-text-primary rounded-lg">
                <Star className="w-5 h-5" />
              </div>
              <div>
                <h2 className="type-h5 text-text-primary">{stageName}</h2>
                <p className="type-caption text-text-secondary mt-0.5">{stageDesc}</p>
              </div>
            </div>

            {/* Categories */}
            <h3 className="type-h5 text-text-primary">Select Activity Category</h3>
            <div className="space-y-4">
              {categories.map((cat) => (
                <div
                  key={cat.key}
                  onClick={() => handlePushView('cc_activity_list', {
                    stageId,
                    stageName,
                    categoryTitle: cat.title,
                    subgroupFilter: cat.key,
                  })}
                  className="bg-card p-5 rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-text-secondary cursor-pointer transition-all flex justify-between items-center group"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-lg flex items-center justify-center font-bold type-caption bg-text-primary text-card">
                      {cat.badge}
                    </span>
                    <div>
                      <h4 className="font-bold text-text-primary group-hover:text-accent type-h4 transition-colors">
                        {cat.title}
                      </h4>
                      <p className="type-caption text-text-secondary mt-0.5">{cat.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="type-caption font-bold px-3 py-1 rounded-md border border-border bg-bg text-text-secondary">
                      Min: {cat.threshold} XP
                    </span>
                    <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-text-primary transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (subView.name === 'cc_activity_list') {
      const stageId = subView.props?.stageId;
      const stageName = subView.props?.stageName || 'Stage';
      const categoryTitle = subView.props?.categoryTitle || 'Activities';
      const subgroupFilter = subView.props?.subgroupFilter;

      return (
        <CCActivityListPageView
          stageId={stageId}
          stageName={stageName}
          categoryTitle={categoryTitle}
          subgroupFilter={subgroupFilter}
          onBack={handleGoBack}
          onSelectAssign={(act) => handlePushView('assign_faculty', { activity: act, stageId })}
        />
      );
    }

    if (subView.name === 'assign_staff_stages') {
      const deptName = classDetails?.departmentName || 'Cyber Security';
      const secName = classDetails?.sectionName || 'A';
      const yrName = classDetails?.yearName || classDetails?.year || '1st Year';

      return (
        <div className="flex flex-col min-h-full bg-bg pb-20">
          {/* Top Header Bar */}
          <div className="bg-card text-text-primary px-4 md:px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={handleGoBack} className="p-2 border border-border bg-card hover:bg-bg rounded-lg text-text-secondary hover:text-text-primary transition cursor-pointer">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="type-h4 text-text-primary">Assign Staff</h1>
            </div>
            <button
              onClick={() => fetchStages(academicYear)}
              className="p-2 border border-border bg-card hover:bg-bg rounded-lg transition text-text-secondary hover:text-text-primary cursor-pointer"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Class Info Banner Card */}
          <div className="bg-card px-4 md:px-6 py-3.5 border-b border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-bg border border-border rounded-lg text-text-primary">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="type-h5 text-text-primary">
                  {deptName} • Section {secName}
                </h2>
                <p className="type-caption text-text-secondary font-semibold mt-0.5">
                  Academic Year: {yrName}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowQuickAssignModal(true)}
              className="bg-accent hover:bg-accent-hover text-card type-caption font-bold px-3.5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-none transition-colors cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Assign Staff</span>
            </button>
          </div>

          {/* Stages List */}
          <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <RefreshCw className="w-8 h-8 animate-spin text-text-primary" />
              </div>
            ) : stagesList.map((stage, index) => {
              const active = stage.isActive ?? stage.active ?? (stage.status === 'ACTIVE');
              const statusText = stage.status || (active ? 'ACTIVE' : 'UPCOMING');
              const displayOrder = stage.displayOrder ?? stage.order ?? (index + 1);
              const expectedXp = stage.expectedXp ?? stage.totalXp ?? (index === 0 ? 200 : index === 1 ? 200 : 150);
              const mThresh = stage.mustThreshold ?? stage.mThreshold ?? (index === 0 ? 80 : 100);
              const iThresh = stage.individualThreshold ?? stage.iThreshold ?? (index === 2 ? 100 : 150);
              const gThresh = stage.groupThreshold ?? stage.gThreshold ?? (index === 2 ? 100 : 150);

              return (
                <div 
                  key={stage.id}
                  onClick={() => handlePushView('cc_stage_details', { stage })}
                  className="bg-card p-5 rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-text-secondary cursor-pointer transition-all flex flex-col space-y-3 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h3 className="type-h5 text-text-primary group-hover:text-accent transition-colors">
                        {stage.name || stage.stageName || `Stage ${displayOrder}`}
                      </h3>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        statusText === 'ACTIVE' 
                          ? 'bg-success-tint text-success border-success/30' 
                          : 'bg-warning-tint text-warning border-warning/30'
                      }`}>
                        {statusText}
                      </span>
                    </div>

                    <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>

                  {/* Chips row (Order, XP, M, I, G) */}
                  <div className="flex flex-wrap items-center gap-2 type-caption font-bold">
                    <span className="text-text-secondary bg-bg px-2.5 py-1 rounded-md border border-border">
                      Order: {displayOrder}
                    </span>
                    <span className="text-text-primary bg-bg px-2.5 py-1 rounded-md border border-border">
                      XP: {expectedXp}
                    </span>
                    <span className="text-text-secondary bg-bg px-2.5 py-1 rounded-md border border-border">
                      M: {mThresh}
                    </span>
                    <span className="text-text-secondary bg-bg px-2.5 py-1 rounded-md border border-border">
                      I: {iThresh}
                    </span>
                    <span className="text-text-secondary bg-bg px-2.5 py-1 rounded-md border border-border">
                      G: {gThresh}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Assign Staff Modal */}
          {showQuickAssignModal && (
            <QuickAssignModal
              stages={stagesList}
              onClose={() => setShowQuickAssignModal(false)}
              onSelectActivity={(activity, stageId) => {
                setShowQuickAssignModal(false);
                handlePushView('assign_faculty', { activity, stageId });
              }}
            />
          )}
        </div>
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
        isCcAssignMode={activeStageView.isCcAssignMode ?? false}
        onBack={handleGoBack}
        onPushView={handlePushView}
      />
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-bg pb-20">
      {/* Top Header Bar */}
      <div className="bg-card text-text-primary px-6 py-5 border-b border-border flex justify-between items-center sticky top-0 z-20 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
        <div className="flex items-center space-x-3.5">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="type-h3 font-bold text-text-primary tracking-tight">Activities & Stages</h1>
            <p className="type-caption text-text-secondary font-medium mt-0.5">Explore configured activity stages, thresholds, and assigned tasks</p>
          </div>
        </div>

        {/* Action Header Icons */}
        <div className="flex items-center space-x-2">
          {isCC && (
            <>
              {/* Badge Requests Notification Icon */}
              <button 
                onClick={() => handlePushView('badge_requests')}
                className="relative p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
                title="Badge Requests"
              >
                <Bell className="w-4 h-4" />
                {pendingBadgeRequests > 0 && (
                  <span className="absolute -top-1 -right-1 bg-accent text-card text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {pendingBadgeRequests}
                  </span>
                )}
              </button>

              {/* Students Directory Icon */}
              <button 
                onClick={() => navigate('/teacher/students-directory')}
                className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
                title="Students Directory"
              >
                <UsersRound className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Disciplinary Inbox Icon (Hammer / Gavel) */}
          <button 
            onClick={() => handlePushView('cc_inbox')}
            className="relative p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
            title="Penalty Requests"
          >
            <Gavel className="w-4 h-4" />
            {pendingPenaltyRequests > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-card text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {pendingPenaltyRequests}
              </span>
            )}
          </button>

          {/* Refresh Button */}
          <button 
            onClick={() => fetchStages(academicYear)} 
            className="p-2 bg-card border border-border rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg transition-colors cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-accent ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full space-y-4">
        {/* Academic Year Selector Card */}
        <div className="bg-card p-4 rounded-xl border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center space-x-3 text-text-primary font-bold type-body-sm">
            <div className="p-2 bg-bg border border-border rounded-lg text-accent">
              <Calendar className="w-4 h-4" />
            </div>
            <span>Academic Year:</span>
          </div>
          <select
            value={academicYear}
            disabled={isCC && !isAdmin && !isSuperAdmin}
            onChange={(e) => setAcademicYear(e.target.value)}
            className={`w-full sm:w-auto bg-bg border border-border text-text-primary type-body-sm font-bold rounded-lg px-4 py-2 outline-none focus:border-text-primary ${
              isCC && !isAdmin && !isSuperAdmin ? 'cursor-not-allowed opacity-90 text-text-secondary' : 'cursor-pointer'
            }`}
          >
            <option value="FIRST_YEAR">FIRST YEAR</option>
            <option value="SECOND_YEAR">SECOND YEAR</option>
            <option value="THIRD_YEAR">THIRD YEAR</option>
            <option value="FOURTH_YEAR">FOURTH YEAR</option>
            {(!isCC || isAdmin || isSuperAdmin) && <option value="ALL">All Academic Years</option>}
          </select>
        </div>

        {/* Assign Staff Button for Class Coordinator */}
        {isCC && (
          <button
            onClick={() => handlePushView('assign_staff_stages')}
            className="w-full bg-accent hover:bg-accent-hover text-card py-3 px-4 rounded-xl type-btn shadow-none transition-all flex items-center justify-center gap-2 cursor-pointer font-bold"
          >
            <UserCheck className="w-4 h-4" />
            <span>Assign Staff</span>
          </button>
        )}

        {/* Stages List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-accent" />
          </div>
        ) : stagesList.length === 0 ? (
          <div className="text-center py-16 text-text-secondary bg-card rounded-xl border border-border shadow-[0_1px_2px_rgba(0,0,0,0.02)] p-6">
            <AlertCircle className="w-10 h-10 text-text-muted mx-auto mb-2" />
            <p className="type-h5 text-text-primary font-bold">No activity stages configured for {academicYear.replace('_', ' ')}.</p>
            <p className="type-caption text-text-muted mt-1 font-medium">Select another academic year or contact system admin.</p>
          </div>
        ) : (
          <div className="space-y-3.5">
            {stagesList.map((stage, index) => {
              const active = stage.isActive ?? stage.active ?? (stage.status === 'ACTIVE');
              const statusText = stage.status || (active ? 'ACTIVE' : 'UPCOMING');
              const displayOrder = stage.displayOrder ?? stage.order ?? (index + 1);
              const expectedXp = stage.expectedXp ?? stage.totalXp ?? (index === 0 ? 200 : index === 1 ? 200 : 100);
              const mThresh = stage.mustThreshold ?? stage.mThreshold ?? (index === 0 ? 80 : 100);
              const iThresh = stage.individualThreshold ?? stage.iThreshold ?? (index === 2 ? 100 : 150);
              const gThresh = stage.groupThreshold ?? stage.gThreshold ?? (index === 2 ? 100 : 150);

              return (
                <div 
                  key={stage.id} 
                  onClick={() => handleOpenStage(stage)}
                  className="bg-card p-5 rounded-xl shadow-[0_1px_2px_rgba(0,0,0,0.02)] border border-border hover:border-accent/40 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex-1 pr-4 space-y-2.5">
                    {/* Status Pill & Expected XP Header */}
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase tracking-wider ${
                        statusText === 'ACTIVE' 
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        {statusText}
                      </span>
                      <span className="type-caption font-bold px-2.5 py-0.5 rounded-md bg-accent-tint text-accent border border-accent/20">
                        Expected: {expectedXp} XP
                      </span>
                    </div>

                    {/* Stage Name */}
                    <h2 className="type-h4 text-text-primary font-bold group-hover:text-accent transition-colors">
                      {stage.name || stage.stageName || `Stage ${displayOrder}`}
                    </h2>

                    {/* Threshold Badges (Order, M, I, G) */}
                    <div className="flex flex-wrap items-center gap-2 type-caption font-bold">
                      <span className="text-text-secondary bg-bg px-2.5 py-1 rounded-lg border border-border">
                        Order: {displayOrder}
                      </span>
                      <span className="text-text-secondary bg-bg px-2.5 py-1 rounded-lg border border-border flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        <span>Min: {mThresh} XP</span>
                      </span>
                      <span className="text-text-secondary bg-bg px-2.5 py-1 rounded-lg border border-border flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-accent" />
                        <span>Ind: {iThresh} XP</span>
                      </span>
                      <span className="text-text-secondary bg-bg px-2.5 py-1 rounded-lg border border-border flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-text-primary" />
                        <span>Grp: {gThresh} XP</span>
                      </span>
                    </div>
                  </div>

                  <div className="w-8 h-8 rounded-lg bg-bg border border-border group-hover:border-accent/30 flex items-center justify-center text-text-muted group-hover:text-accent transition-all shrink-0">
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
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

// Quick Assign Staff Modal Component
function QuickAssignModal({ 
  stages, 
  onClose, 
  onSelectActivity 
}: { 
  stages: any[]; 
  onClose: () => void; 
  onSelectActivity: (activity: any, stageId: number) => void;
}) {
  const [selectedStageId, setSelectedStageId] = useState<number | null>(stages[0]?.id ?? null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (selectedStageId) {
      fetchActivities(selectedStageId);
    }
  }, [selectedStageId]);

  const fetchActivities = async (stageId: number) => {
    setLoading(true);
    try {
      let res;
      try {
        res = await apiClient.get(`/api/v1/cc/activities?stageId=${stageId}`);
      } catch {
        res = await apiClient.get(`/api/v1/admin/activities?stageId=${stageId}`);
      }
      const list = res.data?.success ? (res.data.data || []) : (Array.isArray(res.data) ? res.data : []);
      setActivities(list);
    } catch {
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div className="bg-card text-text-primary border border-border w-full max-w-2xl rounded-t-lg sm:rounded-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-card">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-bg border border-border text-text-primary rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="type-h5 text-text-primary">Select Activity to Assign Staff</h3>
              <p className="type-caption text-text-secondary">Pick an activity to configure faculty assignments</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 border border-border bg-card hover:bg-bg rounded-lg transition text-text-secondary hover:text-text-primary cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stage Selector Pills */}
        <div className="py-3 border-b border-border bg-card">
          <div className="flex gap-2 overflow-x-auto scrollbar-none px-6 pb-0.5">
            {stages.map((stg) => (
              <button
                key={stg.id}
                onClick={() => setSelectedStageId(stg.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg type-caption font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedStageId === stg.id
                    ? 'bg-text-primary text-card shadow-none'
                    : 'bg-bg text-text-secondary border border-border hover:text-text-primary hover:bg-border-subtle'
                }`}
              >
                {stg.name || `Stage ${stg.displayOrder || stg.id}`}
              </button>
            ))}
          </div>
        </div>

        {/* Activities List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3">
          {loading ? (
            <div className="flex justify-center py-12">
              <RefreshCw className="w-6 h-6 animate-spin text-text-primary" />
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <p className="font-semibold text-text-secondary">No activities found in this stage.</p>
            </div>
          ) : (
            activities.map((act) => (
              <div
                key={act.id}
                onClick={() => onSelectActivity(act, selectedStageId!)}
                className="bg-card p-4 rounded-lg border border-border hover:border-text-secondary shadow-[0_1px_2px_rgba(0,0,0,0.03)] cursor-pointer transition-all flex justify-between items-center group"
              >
                <div>
                  <h4 className="type-body-sm font-bold text-text-primary group-hover:text-accent">{act.name}</h4>
                  <p className="type-caption text-text-secondary mt-0.5">{act.description || 'Activity task'}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-text-primary transition-colors" />
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Helper component for CC Activity List View
function CCActivityListPageView({
  stageId,
  stageName,
  categoryTitle,
  subgroupFilter,
  onBack,
  onSelectAssign
}: {
  stageId?: number;
  stageName: string;
  categoryTitle: string;
  subgroupFilter?: string;
  onBack: () => void;
  onSelectAssign: (act: any) => void;
}) {
  const [activities, setActivities] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Safely extract a display string from a field that may be an object or a primitive
  const safeStr = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'number' || typeof val === 'boolean') return String(val);
    if (typeof val === 'object') {
      return val.name || val.stageName || val.departmentName || val.fullName || val.title || String(val.id ?? '');
    }
    return String(val);
  };

  useEffect(() => {
    fetchActivities();
  }, [stageId, subgroupFilter]);

  const fetchActivities = async () => {
    setIsLoading(true);
    try {
      let res;
      try {
        res = await apiClient.get(`/api/v1/cc/activities?stageId=${stageId || ''}&subgroup=${subgroupFilter || ''}`);
      } catch {
        res = await apiClient.get(`/api/v1/admin/activities?stageId=${stageId || ''}&subgroup=${subgroupFilter || ''}`);
      }
      const list = res.data?.success ? (res.data.data || []) : (Array.isArray(res.data) ? res.data : []);
      setActivities(list);
    } catch (err) {
      logger.error('Failed to fetch CC activities:', err);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filtered = activities.filter((act) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (act.name || '').toLowerCase().includes(q) ||
      (act.description || '').toLowerCase().includes(q) ||
      (act.subgroup || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col min-h-full bg-bg pb-20">
      {/* Header Bar */}
      <div className="bg-card text-text-primary px-4 md:px-6 py-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 border border-border bg-card hover:bg-bg rounded-lg text-text-secondary hover:text-text-primary transition cursor-pointer">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="type-h4 text-text-primary">{categoryTitle}</h1>
            <p className="type-caption text-text-secondary">{stageName}</p>
          </div>
        </div>
        <button
          onClick={fetchActivities}
          className="p-2 border border-border bg-card hover:bg-bg rounded-lg text-text-secondary hover:text-text-primary transition cursor-pointer"
          title="Refresh"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-4 md:p-6 max-w-4xl mx-auto w-full space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activity by name or description..."
            className="w-full bg-card border border-border rounded-lg pl-10 pr-9 py-2.5 type-caption text-text-primary outline-none focus:border-text-primary shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-3 text-text-muted hover:text-text-primary">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Activities List */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-lg border border-border p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <AlertCircle className="w-10 h-10 text-text-muted mx-auto mb-2" />
            <p className="font-bold text-text-primary type-body-sm">No activities found in {categoryTitle}</p>
            <p className="type-caption text-text-secondary mt-1">Try selecting another category or academic year.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((act) => (
              <div
                key={act.id}
                className="bg-card p-4 md:p-5 rounded-lg border border-border shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-text-secondary transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="type-fine font-bold px-2 py-0.5 rounded bg-bg text-text-secondary border border-border uppercase tracking-wider">
                      {safeStr(act.subgroup) || safeStr(act.category) || subgroupFilter || 'Activity'}
                    </span>
                    <span className="type-caption font-bold text-text-secondary">
                      XP: {act.awardXp ?? (typeof act.xp === 'object' ? 0 : (act.xp || 0))}
                    </span>
                  </div>
                  <h3 className="type-h5 text-text-primary">{act.name}</h3>
                  <p className="type-caption text-text-secondary">{act.description || 'Configured activity task'}</p>
                </div>

                <button
                  onClick={() => onSelectAssign(act)}
                  className="bg-accent hover:bg-accent-hover text-card type-caption font-bold px-4 py-2.5 rounded-lg flex items-center justify-center gap-1.5 shadow-none transition-colors cursor-pointer self-start sm:self-auto"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Assign Staff</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
