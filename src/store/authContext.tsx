import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { apiClient } from '../api/client';

export interface UserData {
  userId?: number | string;
  username?: string;
  fullName?: string;
  email?: string;
  roles?: string[];
  subRoles?: string[];
  studentId?: string;
  sprNo?: string;
  department?: string;
  section?: string;
  year?: string;
  score?: number;
  totalXp?: number;
  isCaptain?: boolean;
  [key: string]: any;
}

interface AuthContextType {
  token: string | null;
  user: UserData | null;
  role: string | null;
  subRoles: string[];
  login: (tokenValue: string, userData: UserData | string) => void;
  setSubRoles: (roles: string[]) => void;
  logout: () => void;
  isAdmin: boolean;
  isTeacher: boolean;
  isCaptain: boolean;
  isStudent: boolean;
  isParent: boolean;
  isHOD: boolean;
  isCC: boolean;
  isDC: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('spdms_token') || localStorage.getItem('token')
  );
  
  const [user, setUser] = useState<UserData | null>(() => {
    const stored = localStorage.getItem('spdms_user') || localStorage.getItem('user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (_) {
      return null;
    }
  });

  const [role, setRole] = useState<string | null>(
    () => localStorage.getItem('userRole') || (user?.roles && user.roles[0]) || null
  );
  
  const [subRoles, setSubRolesState] = useState<string[]>(user?.subRoles || []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('spdms_token', token);
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('spdms_token');
      localStorage.removeItem('token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('spdms_user', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('spdms_user');
      localStorage.removeItem('user');
    }
  }, [user]);

  useEffect(() => {
    if (role) localStorage.setItem('userRole', role);
    else localStorage.removeItem('userRole');
  }, [role]);

  // Parity with Flutter: Validate token against backend on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!token) return;
      try {
        const response = await apiClient.get('/api/v1/auth/me');
        if (response.data && response.data.success) {
          const freshData = response.data.data;
          setUser((prev) => ({ ...prev, ...freshData }));
        }
      } catch (error: any) {
        // Only log out if backend explicitly responds with 401 Unauthorized
        if (error.response && error.response.status === 401) {
          console.warn("Token expired or unauthorized, logging out.");
          logout();
        } else {
          console.warn("Could not reach auth check endpoint; preserving stored session.");
        }
      }
    };
    checkAuthStatus();
  }, []);

  const login = useCallback((newToken: string, userData: UserData | string) => {
    setToken(newToken);
    if (typeof userData === 'string') {
      setRole(userData);
      setUser({ username: userData, roles: [userData] });
    } else {
      setUser(userData);
      const primaryRole = (userData.roles && userData.roles[0]) ? userData.roles[0] : (userData.role || userData.userType || null);
      if (primaryRole) setRole(primaryRole);
      if (userData.subRoles) setSubRolesState(userData.subRoles);
    }
  }, []);

  const setSubRoles = useCallback((roles: string[]) => {
    setSubRolesState(roles);
    setUser((prevUser) => prevUser ? { ...prevUser, subRoles: roles } : null);
  }, []);

  // Multi-tab logout synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'spdms_token' && !e.newValue) {
        setToken(null);
        setUser(null);
        setRole(null);
        setSubRolesState([]);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRole(null);
    setSubRolesState([]);
    localStorage.clear();
    sessionStorage.clear();
    try {
      document.cookie.split(";").forEach((c) => {
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
      });
    } catch (_) {}
    window.location.href = '/login';
  }, []);

  // Inactivity Session Timeout (30 Minutes)
  useEffect(() => {
    if (!token) return;

    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 Minutes
    let timeoutId: ReturnType<typeof setTimeout>;

    const resetInactivityTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.warn('Session expired due to 30 minutes of inactivity.');
        logout();
      }, INACTIVITY_LIMIT);
    };

    const activityEvents = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart'];
    activityEvents.forEach((evt) => window.addEventListener(evt, resetInactivityTimer));

    resetInactivityTimer(); // Start initial timer

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [token, logout]);

  const isAdmin = !!(user?.roles?.includes('ROLE_ADMIN') || role === 'ADMIN' || role === 'ROLE_ADMIN');
  const isTeacher = !!(user?.roles?.includes('ROLE_TEACHER') || role === 'TEACHER' || role === 'ROLE_TEACHER');
  const isCaptain = !!(user?.roles?.includes('ROLE_CAPTAIN') || user?.isCaptain || role === 'CAPTAIN' || subRoles.includes('CAPTAIN'));
  const isStudent = !!(user?.studentId || role === 'STUDENT' || role === 'ROLE_STUDENT');
  const isParent = !!(user?.sprNo || role === 'PARENT' || role === 'ROLE_PARENT');
  const isHOD = !!(subRoles.includes('HOD') || user?.subRoles?.includes('HOD'));
  const isCC = !!(subRoles.includes('CC') || user?.subRoles?.includes('CC'));
  const isDC = !!(subRoles.includes('Discipline Commitee') || user?.subRoles?.includes('Discipline Commitee'));

  const contextValue = useMemo(() => ({
    token, user, role, subRoles, login, setSubRoles, logout,
    isAdmin, isTeacher, isCaptain, isStudent, isParent, isHOD, isCC, isDC
  }), [token, user, role, subRoles, login, setSubRoles, logout, isAdmin, isTeacher, isCaptain, isStudent, isParent, isHOD, isCC, isDC]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/* eslint-disable react-refresh/only-export-components */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
