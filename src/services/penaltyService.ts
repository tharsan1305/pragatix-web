import apiClient from '../api/client';

export const penaltyService = {
  // POST /api/penalties
  submitPenalty: async (payload: { regNo: string; activityId?: number; activityName?: string; penaltyXP: number; reason: string }) => {
    const response = await apiClient.post<any>('/api/penalties', payload);
    return response.data;
  },

  // GET /api/penalties/pending-count
  getPendingCount: async () => {
    const response = await apiClient.get<any>('/api/penalties/pending-count');
    return response.data?.data ?? 0;
  },

  // GET /api/penalties/cc-inbox
  getCcInbox: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await apiClient.get<any>('/api/penalties/cc-inbox', { params });
    return response.data?.data || [];
  },

  // GET /api/penalties/my-requests
  getMyRequests: async () => {
    const response = await apiClient.get<any>('/api/penalties/my-requests');
    return response.data?.data || [];
  },

  // PUT /api/penalties/{id}/approve
  approvePenalty: async (id: number) => {
    const response = await apiClient.put<any>(`/api/penalties/${id}/approve`);
    return response.data;
  },

  // PUT /api/penalties/{id}/reject
  rejectPenalty: async (id: number, reason?: string) => {
    const response = await apiClient.put<any>(`/api/penalties/${id}/reject`, { reason });
    return response.data;
  },
};

export default penaltyService;
