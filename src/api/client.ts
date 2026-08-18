import axios from 'axios';
import { ApiConfig } from '../config/apiConfig';

const baseURL = (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim() !== '')
  ? import.meta.env.VITE_API_BASE_URL
  : (ApiConfig.baseUrl ?? '');

export const apiClient = axios.create({
  baseURL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token (reads fresh every time)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('spdms_token') || localStorage.getItem('auth_token');
    const isAuthRoute = config.url?.includes('/api/v1/auth/login')
      || config.url?.includes('/api/v1/auth/student-login') 
      || config.url?.includes('/api/v1/auth/parent-login')
      || config.url?.includes('/api/v1/auth/request-otp')
      || config.url?.includes('/api/v1/auth/verify-otp');
    if (token && !isAuthRoute && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const isUnauth = error.response && error.response.status === 401;
    const isLoginRoute = window.location.pathname === '/login';
    const isAuthEndpoint = error.config?.url?.includes('/auth/');

    // Only redirect if genuinely unauthorized on non-auth route
    if (isUnauth && !isLoginRoute && !isAuthEndpoint) {
      const token = localStorage.getItem('spdms_token') || localStorage.getItem('auth_token');
      const msg = error.response?.data?.message || '';

      // If token is expired or missing, clear and redirect
      if (!token || msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid token')) {
        localStorage.removeItem('spdms_token');
        localStorage.removeItem('spdms_user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('userRole');
        delete apiClient.defaults.headers.common['Authorization'];
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
