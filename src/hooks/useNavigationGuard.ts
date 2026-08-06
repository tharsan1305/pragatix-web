import { useNavigate, useLocation, type NavigateOptions } from 'react-router-dom';
import { useAuth } from '../store/authContext';

export function useNavigationGuard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user, role } = useAuth();

  const navigateTo = (path: string, options?: NavigateOptions) => {
    if (path === '/login') {
      navigate('/login', { replace: true, state: { from: location }, ...options });
    } else {
      navigate(path, options);
    }
  };

  const replaceTo = (path: string, options?: NavigateOptions) => {
    navigate(path, { replace: true, ...options });
  };

  const goBack = (fallbackPath?: string) => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      const userRole = (role || user?.role || 'STUDENT').toUpperCase();
      let defaultPath = fallbackPath || '/student';
      if (userRole === 'ADMIN' || userRole === 'ROLE_ADMIN') defaultPath = '/admin';
      else if (userRole === 'TEACHER' || userRole === 'ROLE_TEACHER') defaultPath = '/teacher';
      
      navigate(defaultPath, { replace: true });
    }
  };

  const logoutAndRedirect = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return {
    navigateTo,
    replaceTo,
    goBack,
    logoutAndRedirect,
    currentPath: location.pathname
  };
}

export default useNavigationGuard;
