import { apiClient } from '../../../api/client';
import { isTokenExpired } from '../../../store/authContext';

export interface LoginCredentials {
  username: string;
  password?: string; // Optional because student login might only use ID
  role?: string;     // Added specifically to handle our form selection
  turnstileToken?: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: number | string;
    username: string;
    role: string;
    name?: string;
  };
}

export const authService = {
  loginStaff: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post<any>('/api/v1/auth/login', {
      username: credentials.username,
      password: credentials.password,
      turnstileToken: credentials.turnstileToken,
      'cf-turnstile-response': credentials.turnstileToken
    }, {
      headers: credentials.turnstileToken ? { 'X-Turnstile-Token': credentials.turnstileToken } : {}
    });
    // Spring backend wraps responses in { success: boolean, data: { ... } }
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Invalid credentials');
  },

  loginStudent: async (studentId: string, dob?: string, turnstileToken?: string): Promise<AuthResponse> => {
    const response = await apiClient.post<any>('/api/v1/auth/student-login', {
      identity: studentId,
      password: dob,
      turnstileToken: turnstileToken,
      'cf-turnstile-response': turnstileToken
    }, {
      headers: turnstileToken ? { 'X-Turnstile-Token': turnstileToken } : {}
    });
    if (response.data.success) {
      return response.data.data;
    }
    throw new Error(response.data.message || 'Invalid credentials');
  },
  
  // Generic login handler based on role
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    if (credentials.role === 'Student') {
      return authService.loginStudent(credentials.username, credentials.password, credentials.turnstileToken);
    } else {
      return authService.loginStaff(credentials);
    }
  },

  // Auth helper methods
  isAuthenticated: (): boolean => {
    const token = localStorage.getItem('spdms_token') || localStorage.getItem('token');
    return !!token && !isTokenExpired(token);
  },

  getCurrentUser: (): any | null => {
    const stored = localStorage.getItem('spdms_user') || localStorage.getItem('user');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch (_) {
      return null;
    }
  }
};
