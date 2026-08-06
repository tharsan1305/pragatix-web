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

export function isTokenExpired(tokenStr: string | null): boolean {
  if (!tokenStr) return true;
  try {
    const parts = tokenStr.split('.');
    if (parts.length !== 3) return false; // If not standard JWT format, assume valid
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload && typeof payload.exp === 'number') {
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    }
    return false;
  } catch (_) {
    return false;
  }
}

interface AuthContextType {
  token: string | null;
  user: UserData | null;
  role: string | null;
  subRoles: string[];
  loading: boolean;
  login: (tokenValue: string, userData: UserData | string) => void;
  setSubRoles: (roles: string[]) => void;
  logout: () => void;
  isTokenExpired: (t?: string | null) => boolean;
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
  const [loading, setLoading] = useState<boolean>(true);

  const [token, setToken] = useState<string | null>(() => {
    const storedToken = localStorage.getItem('spdms_token') || localStorage.getItem('token');
    if (storedToken && isTokenExpired(storedToken)) {
      localStorage.removeItem('spdms_token');
      localStorage.removeItem('token');
      return null;
    }
    return storedToken;
  });

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

  // Initial Auth Check on Mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!token || isTokenExpired(token)) {
        if (token && isTokenExpired(token)) {
          logout();
        }
        setLoading(false);
        return;
      }
      try {
        const response = await apiClient.get('/api/v1/auth/me');
        if (response.data && response.data.success) {
          const freshData = response.data.data;
          setUser((prev) => ({ ...prev, ...freshData }));
        }
      } catch (error: any) {
        if (error.response && error.response.status === 401) {
          console.warn("Token unauthorized on initial check, logging out.");
          logout();
        } else {
          console.warn("Could not reach auth check endpoint; preserving stored session.");
        }
      } finally {
        setLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  const login = useCallback((newToken: string, userData: UserData | string) => {
    setToken(newToken);
    localStorage.setItem('spdms_token', newToken);
    localStorage.setItem('token', newToken);

    if (typeof userData === 'string') {
      setRole(userData);
      const userObj = { username: userData, roles: [userData] };
      setUser(userObj);
      localStorage.setItem('spdms_user', JSON.stringify(userObj));
    } else {
      setUser(userData);
      localStorage.setItem('spdms_user', JSON.stringify(userData));
      const primaryRole = (userData.roles && userData.roles[0]) ? userData.roles[0] : (userData.role || userData.userType || null);
      if (primaryRole) {
        setRole(primaryRole);
        localStorage.setItem('userRole', primaryRole);
      }
      if (userData.subRoles) setSubRolesState(userData.subRoles);
    }
    setLoading(false);
  }, []);

  const setSubRoles = useCallback((roles: string[]) => {
    setSubRolesState(roles);
    setUser((prevUser) => prevUser ? { ...prevUser, subRoles: roles } : null);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setRole(null);
    setSubRolesState([]);
    localStorage.removeItem('spdms_token');
    localStorage.removeItem('spdms_user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    sessionStorage.clear();
    setLoading(false);
  }, []);

  // Multi-tab logout synchronization
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'spdms_token' && !e.newValue) {
        logout();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [logout]);

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

    resetInactivityTimer();

    return () => {
      clearTimeout(timeoutId);
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetInactivityTimer));
    };
  }, [token, logout]);

  const roleList = useMemo<string[]>(() => {
    const rawRoles: any = user?.roles;
    const list: string[] = [];
    if (typeof rawRoles === 'string') list.push(rawRoles.toUpperCase());
    else if (Array.isArray(rawRoles)) {
      rawRoles.forEach((r: any) => {
        if (typeof r === 'string') list.push(r.toUpperCase());
        else if (typeof r === 'object' && r !== null) {
          const val = r.name || r.authority || r.role || '';
          if (val) list.push(String(val).toUpperCase());
        }
      });
    }
    if (role) list.push(String(role).toUpperCase());
    if (user?.role) list.push(String(user.role).toUpperCase());
    if (user?.userType) list.push(String(user.userType).toUpperCase());
    return list;
  }, [user, role]);

  const isAdmin = useMemo<boolean>(() => {
    return Boolean(
      roleList.some(r => 
        r === 'ADMIN' || r === 'ROLE_ADMIN' || 
        r === 'SUPER_ADMIN' || r === 'ROLE_SUPER_ADMIN' || 
        r === 'SUPERADMIN' || r === 'ROLE_SUPERADMIN'
      ) || user?.isSuperAdmin
    );
  }, [roleList, user]);

  const isTeacher = useMemo<boolean>(() => {
    return Boolean(
      roleList.some(r => 
        r === 'TEACHER' || r === 'ROLE_TEACHER' || 
        r === 'CLASS_COORDINATOR' || r === 'ROLE_CLASS_COORDINATOR' || 
        r === 'DISCIPLINE_COMMITTEE' || r === 'ROLE_DISCIPLINE_COMMITTEE'
      ) || subRoles.length > 0 || (user?.subRoles && user.subRoles.length > 0)
    );
  }, [roleList, subRoles, user]);

  const isCaptain = useMemo<boolean>(() => {
    return Boolean(
      roleList.some(r => r === 'CAPTAIN' || r === 'ROLE_CAPTAIN') || user?.isCaptain || subRoles.includes('CAPTAIN')
    );
  }, [roleList, user, subRoles]);

  const isStudent = useMemo<boolean>(() => {
    if (isAdmin || isTeacher) return false;
    return Boolean(
      roleList.some(r => r === 'STUDENT' || r === 'ROLE_STUDENT') || (user?.studentId && !isAdmin && !isTeacher)
    );
  }, [roleList, isAdmin, isTeacher, user]);

  const isParent = !!(user?.sprNo || role === 'PARENT' || role === 'ROLE_PARENT');
  const isHOD = !!(subRoles.includes('HOD') || user?.subRoles?.includes('HOD'));
  const isCC = !!(subRoles.includes('CC') || user?.subRoles?.includes('CC'));
  const isDC = !!(subRoles.includes('Discipline Commitee') || user?.subRoles?.includes('Discipline Commitee'));

  const contextValue = useMemo(() => ({
    token, user, role, subRoles, loading, login, setSubRoles, logout,
    isTokenExpired: (t?: string | null) => isTokenExpired(t !== undefined ? t : token),
    isAdmin, isTeacher, isCaptain, isStudent, isParent, isHOD, isCC, isDC
  }), [token, user, role, subRoles, loading, login, setSubRoles, logout, isAdmin, isTeacher, isCaptain, isStudent, isParent, isHOD, isCC, isDC]);

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
