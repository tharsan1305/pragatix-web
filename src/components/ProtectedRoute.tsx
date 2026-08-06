import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { token, user, role, isCaptain, isAdmin, isTeacher, isStudent } = useAuth();

  // If no token or user is logged in, redirect to login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
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
      if (allowedUpper === 'TEACHER' && isTeacher) return true;
      return false;
    });

    if (!hasAccess) {
      if (isStudent || isCaptain) return <Navigate to="/student" replace />;
      if (isTeacher) return <Navigate to="/teacher" replace />;
      if (isAdmin) return <Navigate to="/admin" replace />;
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}
