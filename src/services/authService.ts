import apiClient from '../api/client';

export const authService = {
  // Teacher + Admin login
  // POST /api/v1/auth/login
  teacherLogin: (username: string, password: string) =>
    apiClient.post('/api/v1/auth/login', { username, password }),

  // Student login
  // POST /api/v1/auth/student-login
  studentLogin: (identity: string, password: string) =>
    apiClient.post('/api/v1/auth/student-login', { identity, password }),

  // Get current logged-in user profile
  // GET /api/v1/auth/me
  getMe: () => apiClient.get('/api/v1/auth/me'),
};

export default authService;
