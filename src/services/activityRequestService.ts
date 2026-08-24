import apiClient from '../api/client';

export const activityRequestService = {
  // POST /api/v1/activity-requests (STUDENT only)
  submitRequest: async (payload: { activityId: number; teamId?: number; proofUrl?: string; reason?: string }) => {
    const response = await apiClient.post<any>('/api/v1/activity-requests', payload);
    return response.data;
  },

  // GET /api/v1/activity-requests/my-requests (STUDENT only)
  getMyRequests: async () => {
    const response = await apiClient.get<any>('/api/v1/activity-requests/my-requests');
    return response.data?.data || [];
  },

  // GET /api/v1/activity-requests/inbox (TEACHER/ADMIN/CLASS_COORDINATOR/HOD)
  getInbox: async (status?: string) => {
    const params = status ? { status } : {};
    const response = await apiClient.get<any>('/api/v1/activity-requests/inbox', { params });
    return response.data?.data || [];
  },

  // GET /api/v1/activity-requests/pending-count
  getPendingCount: async () => {
    const response = await apiClient.get<any>('/api/v1/activity-requests/pending-count');
    return response.data?.data ?? 0;
  },

  // PUT /api/v1/activity-requests/{id}/approve
  approveRequest: async (id: number) => {
    const response = await apiClient.put<any>(`/api/v1/activity-requests/${id}/approve`);
    return response.data;
  },

  // PUT /api/v1/activity-requests/{id}/reject
  rejectRequest: async (id: number, reason?: string) => {
    const response = await apiClient.put<any>(`/api/v1/activity-requests/${id}/reject`, { reason });
    return response.data;
  },
};

export default activityRequestService;
