import apiClient from '../api/client';

export const studentService = {
  // List all students (paginated)
  // GET /api/v1/students?page=0&size=100&sortBy=fullName
  getStudents: (page = 0, size = 100, sortBy = 'fullName') =>
    apiClient.get('/api/v1/students', { params: { page, size, sortBy } }),

  // Get single student by ID
  // GET /api/v1/students/{id}
  getStudent: (id: string | number) =>
    apiClient.get(`/api/v1/students/${id}`),

  // Search students by keyword
  // GET /api/v1/students/search?keyword=
  searchStudents: (keyword: string) =>
    apiClient.get('/api/v1/students/search', { params: { keyword } }),

  // Create single student
  // POST /api/v1/students
  createStudent: (data: any) =>
    apiClient.post('/api/v1/students', data),

  // Update student
  // PUT /api/v1/students/{id}
  updateStudent: (id: string | number, data: any) =>
    apiClient.put(`/api/v1/students/${id}`, data),

  // Delete student
  // DELETE /api/v1/students/{id}
  deleteStudent: (id: string | number) =>
    apiClient.delete(`/api/v1/students/${id}`),

  // Bulk parse Excel file
  // POST /api/v1/students/bulk-parse (multipart/form-data)
  bulkParse: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return apiClient.post('/api/v1/students/bulk-parse', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000
    });
  },

  // Bulk import confirmed students
  // POST /api/v1/students/bulk-import
  bulkImport: (students: any[]) =>
    apiClient.post('/api/v1/students/bulk-import', students, {
      timeout: 120000
    }),

  // Adjust student points (add or deduct)
  // POST /api/v1/students/{id}/adjust-points
  adjustPoints: (id: string | number, points: number, reason: string, subgroupId: number | null = null) =>
    apiClient.post(`/api/v1/students/${id}/adjust-points`, {
      points, reason, subgroupId
    }),

  // Get student discipline logs
  // GET /api/v1/students/{id}/discipline-logs
  getDisciplineLogs: (id: string | number) =>
    apiClient.get(`/api/v1/students/${id}/discipline-logs`),

  // Get department performance (HOD)
  // GET /api/v1/students/department-performance
  getDepartmentPerformance: () =>
    apiClient.get('/api/v1/students/department-performance'),

  // Get student activity streaks (Authoritative backend endpoint)
  // GET /api/v1/students/me/activity-streaks
  getActivityStreaks: () =>
    apiClient.get('/api/v1/students/me/activity-streaks'),

  // Get student level progression
  // GET /api/v1/student-level/progression
  getLevelProgression: () =>
    apiClient.get('/api/v1/student-level/progression'),
};

export default studentService;
