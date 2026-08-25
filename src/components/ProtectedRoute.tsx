import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/authContext';

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: Props) {
  const { token, user, role, isCaptain, isViceCaptain, isAdmin, isTeacher, isStudent, isHOD } = useAuth();

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
      // Captain route also grants access to Vice Captains (they share the same portal)
      if (allowedUpper === 'CAPTAIN' && (isCaptain || isViceCaptain)) return true;
      if (allowedUpper === 'ADMIN' && (isAdmin || isHOD)) return true;
      if (allowedUpper === 'HOD' && isHOD) return true;
      if (allowedUpper === 'TEACHER' && isTeacher) return true;
      return false;
    });

    if (!hasAccess) {
      // Redirect to the user's correct home — Captains & Vice Captains go to /captain, NOT /student
      if (isCaptain || isViceCaptain) return <Navigate to="/captain" replace />;
      if (isStudent) return <Navigate to="/student" replace />;
      if (isAdmin || isHOD) return <Navigate to="/admin" replace />;
      if (isTeacher) return <Navigate to="/teacher" replace />;
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
}
