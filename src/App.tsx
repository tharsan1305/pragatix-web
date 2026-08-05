import { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LoginPage from './features/auth/LoginPage';
import AdminDashboard from './features/admin/AdminDashboard';
import TeacherDashboard from './features/teacher/TeacherDashboard';
import StudentDashboardPage from './features/student/StudentDashboardPage';
import CaptainDashboardPage from './features/captain/CaptainDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import PageLoader from './components/common/PageLoader';

import GroupActivityYearPage from './features/admin/activity/pages/GroupActivityYearPage';
import GroupActivityDeptPage from './features/admin/activity/pages/GroupActivityDeptPage';
import GroupActivitySecPage from './features/admin/activity/pages/GroupActivitySecPage';
import GroupActivityExecutionPage from './features/admin/activity/pages/GroupActivityExecutionPage';
import CreateGroupPage from './features/admin/activity/pages/CreateGroupPage';
import ActivityExecutionPageV2 from './features/admin/activity/pages/ActivityExecutionPageV2';
import StudentsDirectoryPage from './features/teacher/pages/StudentsDirectoryPage';
import StudentListPage from './features/student/pages/StudentListPage';
import StudentDetailsPage from './features/student/pages/StudentDetailsPage';

function NavigationTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 450);

    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return (
    <>
      {isNavigating && <PageLoader message="Moving to page..." fullScreen={true} />}
      {children}
    </>
  );
}

function App() {
  return (
    <HashRouter>
      <NavigationTransition>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          
          {/* Shared Routes */}
          <Route 
            path="/students" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                <StudentListPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/students/:id" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                <StudentDetailsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/teacher/*" 
            element={
              <ProtectedRoute allowedRoles={['TEACHER']}>
                <TeacherDashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* CC Students Directory */}
          <Route 
            path="/teacher/students-directory" 
            element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <StudentsDirectoryPage />
              </ProtectedRoute>
            } 
          />

          {/* --- Execution & Drill-down Pages --- */}
          <Route 
            path="/teacher/group-activity/:activityId/year" 
            element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <GroupActivityYearPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/group-activity/:activityId/dept" 
            element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <GroupActivityDeptPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/group-activity/:activityId/sec" 
            element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <GroupActivitySecPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/group-activity/:activityId/execution" 
            element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <GroupActivityExecutionPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/group-activity/:activityId/create-group" 
            element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <CreateGroupPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/teacher/activity/:activityId/execution" 
            element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <ActivityExecutionPageV2 />
              </ProtectedRoute>
            } 
          />
          {/* ---------------------------------- */}
          
          <Route 
            path="/student/*" 
            element={
              <ProtectedRoute allowedRoles={['STUDENT', 'CAPTAIN']}>
                <StudentDashboardPage />
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/captain/*" 
            element={
              <ProtectedRoute allowedRoles={['CAPTAIN', 'STUDENT']}>
                <CaptainDashboardPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Default route redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </NavigationTransition>
    </HashRouter>
  );
}

export default App;
