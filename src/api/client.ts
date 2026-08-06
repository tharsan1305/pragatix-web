import axios from 'axios';
import { ApiConfig } from '../config/apiConfig';

const baseURL = import.meta.env.VITE_API_BASE_URL !== undefined
  ? import.meta.env.VITE_API_BASE_URL
  : (ApiConfig.baseUrl || '');

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token (reads fresh every time)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('spdms_token') || localStorage.getItem('auth_token') || localStorage.getItem('token');
    const isAuthRoute = config.url?.includes('/api/v1/auth/login') || config.url?.includes('/api/v1/auth/student-login') || config.url?.includes('/api/v1/auth/parent-login');
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
    if (error.response && error.response.status === 401) {
      // Clear tokens and user info
      localStorage.removeItem('spdms_token');
      localStorage.removeItem('spdms_user');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      delete apiClient.defaults.headers.common['Authorization'];
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
