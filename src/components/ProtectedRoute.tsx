import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../store/authContext';
import PageLoader from './common/PageLoader';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const location = useLocation();
  const { token, user, role, loading, isTokenExpired, isCaptain, isAdmin, isTeacher, isStudent } = useAuth();

  // Show page loader while initializing auth state
  if (loading) {
    return <PageLoader message="Verifying session..." fullScreen={true} />;
  }

  // If no token, user is missing, or token is expired, redirect to login with current location
  if (!token || !user || isTokenExpired(token)) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If roles restriction is specified, check against current role
  if (allowedRoles && allowedRoles.length > 0) {
    const currentRole = (role || user.role || '').toUpperCase();
    const userRoles = (user.roles || []).map((r: string) => r.toUpperCase());

    const hasAccess = allowedRoles.some((allowed) => {
      const allowedUpper = allowed.toUpperCase();
      if (currentRole === allowedUpper || userRoles.includes(allowedUpper) || userRoles.includes(`ROLE_${allowedUpper}`)) {
        return true;
      }
      if (allowedUpper === 'CAPTAIN' && isCaptain) return true;
      if (allowedUpper === 'ADMIN' && isAdmin) return true;
      if (allowedUpper === 'TEACHER' && (isTeacher || userRoles.includes('CLASS_COORDINATOR') || userRoles.includes('ROLE_CLASS_COORDINATOR'))) return true;
      return false;
    });

    if (!hasAccess) {
      if (isAdmin) return <Navigate to="/admin" replace />;
      if (isTeacher) return <Navigate to="/teacher" replace />;
      if (isStudent || isCaptain) return <Navigate to="/student" replace />;
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
}
