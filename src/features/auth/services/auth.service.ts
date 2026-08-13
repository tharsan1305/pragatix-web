import { apiClient } from '../../../api/client';

export interface OtpRequestPayload {
  email: string;
}

export interface OtpVerifyPayload {
  email: string;
  otp: string;
}

export interface AuthResponse {
  token: string;
  type: string;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
  subRoles?: string[];
  userType: string;
  teamRole?: string;
  isCaptain?: boolean;
  academicYear?: string;
  [key: string]: any;
}

export const authService = {
  /**
   * Step 1: Request OTP — sends a 4-digit OTP to the user's email.
   * POST /api/v1/auth/request-otp  { email }
   * Returns: ApiResponse<String> → { success: true, message: "OTP sent successfully to ..." }
   */
  requestOtp: async (email: string): Promise<string> => {
    const response = await apiClient.post<any>('/api/v1/auth/request-otp', { email });
    if (response.data?.success) {
      return response.data.message ?? 'OTP sent successfully';
    }
    throw new Error(response.data?.message ?? 'Failed to send OTP.');
  },

  /**
   * Step 2: Verify OTP — validates the OTP and returns JWT + user data.
   * POST /api/v1/auth/verify-otp  { email, otp }
   * Returns: ApiResponse<AuthResponse> → { success: true, data: { token, roles, userType, ... } }
   */
  verifyOtp: async (email: string, otp: string): Promise<AuthResponse> => {
    const response = await apiClient.post<any>('/api/v1/auth/verify-otp', { email, otp });
    if (response.data?.success) {
      return response.data.data as AuthResponse;
    }
    throw new Error(response.data?.message ?? 'OTP verification failed.');
  },
};

export default authService;
