import apiClient from '../api/client';

// Endpoints from the PragatiX API Catalog (Team & Group Management Module,
// base path /api/v1/teams) that had no corresponding call anywhere in this
// app before this file was added.
export const teamService = {
  // GET /api/v1/teams/my-classmates — hasRole('STUDENT')
  // Returns list of students in the same department/section as the caller.
  getMyClassmates: () =>
    apiClient.get('/api/v1/teams/my-classmates'),

  // POST /api/v1/teams/my-team/add-member — hasRole('STUDENT')
  // Allows the team captain to add a classmate to their own team.
  addMemberByCaptain: (regNo: string) =>
    apiClient.post('/api/v1/teams/my-team/add-member', null, { params: { regNo } }),

  // POST /api/v1/teams/my-team/removal-request — hasRole('STUDENT')
  // Allows the team captain to request removal of a teammate.
  requestMemberRemoval: (regNo: string) =>
    apiClient.post('/api/v1/teams/my-team/removal-request', null, { params: { regNo } }),

  // GET /api/v1/teams/removal-requests/pending — hasAnyRole('ADMIN', 'CC', 'HOD')
  // Lists all removal requests waiting for CC approval.
  getPendingRemovalRequests: () =>
    apiClient.get('/api/v1/teams/removal-requests/pending'),

  // PUT /api/v1/teams/removal-requests/{id}/approve — hasAnyRole('ADMIN', 'CC', 'HOD')
  approveRemovalRequest: (id: string | number) =>
    apiClient.put(`/api/v1/teams/removal-requests/${id}/approve`),

  // PUT /api/v1/teams/removal-requests/{id}/reject — hasAnyRole('ADMIN', 'CC', 'HOD')
  rejectRemovalRequest: (id: string | number) =>
    apiClient.put(`/api/v1/teams/removal-requests/${id}/reject`),

  // POST /api/v1/teams/{id}/assign-captain — hasAnyRole('ADMIN', 'CLASS_COORDINATOR', 'CC', 'HOD')
  // Per the API catalog this is the documented endpoint for designating a team captain.
  // NOTE: TeacherGroupManagementTab.tsx currently calls a different, undocumented
  // path (`/api/v1/teams/{id}/captain`) for this action — see the flagged note
  // in the accompanying summary. This function is the catalog-correct one and
  // is not yet wired into any UI.
  assignCaptain: (id: string | number, regNo: string) =>
    apiClient.post(`/api/v1/teams/${id}/assign-captain`, null, { params: { regNo } }),
};

export default teamService;
