import apiClient from '../api/client';

/**
 * CC Activity Stage - represents a stage/year in the academic calendar
 */
export interface CCActivityStage {
  id: number;
  name: string;
  description?: string;
}

/**
 * CC Activity - represents an activity with metadata
 */
export interface CCActivity {
  id: number;
  name: string;
  description: string;
  departmentId: string;
  department: string;
  teacherId: string;
  teacher?: string;
  stageId: number;
  stage?: string;
  type: string;
  xpReward: number;
  evidenceRequired: string[];
  status: string;
  assignmentMode: string;
  allowStudentRequest: boolean;
}

/**
 * Class Details - represents a class/subgroup with students
 */
export interface CCClassDetails {
  id: number;
  subgroupId: number;
  subgroupName: string;
  stageName: string;
  departmentName: string;
  classCoordinator: string;
  studentCount: number;
  totalXp: number;
  averageScore: number;
}

/**
 * Teacher - represents a faculty member
 */
export interface CCTeacher {
  id: number;
  teacherId: string;
  name: string;
  email: string;
  department: string;
  designation: string;
}

/**
 * Student - represents a student in a class
 */
export interface CCStudent {
  id: number;
  studentId: string;
  fullName: string;
  registrationNumber: string;
  email: string;
  department: string;
  stage: string;
  currentScore: number;
  totalXp: number;
}

/**
 * Activity Assignment Request - for assigning activities to students
 */
export interface CCActivityAssignment {
  studentIds: number[];
  remarks?: string;
}

/**
 * Teacher Assignment Request
 */
export interface CCTeacherAssignment {
  activityId: number;
  teacherId: string;
  assignmentDate?: string;
}

/**
 * Badge Request - represents a badge earned by a student
 */
export interface BadgeRequest {
  id: number;
  studentId: number | string;
  studentName: string;
  regNo?: string;
  badgeId?: number;
  badgeName: string;
  badgeIcon?: string;
  departmentName?: string;
  sectionName?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  remarks?: string;
  proofLink?: string;
  departmentId?: number;
  sectionId?: number;
  academicYear?: string;
  // Legacy / UI helpers
  badgeDescription?: string;
  earnedDate?: string;
  rejectionReason?: string;
}

/**
 * Badge Request Approval/Rejection Payload
 */
export interface BadgeRequestAction {
  remarks?: string;
  rejectionReason?: string;
  approvedBy?: string;
}

/**
 * CC Activity Service - handles all CC (Class Coordinator) related API calls
 */
export const ccActivityService = {
  /**
   * Get all activity stages available to CC
   * GET /api/v1/cc/activities/stages
   * @returns Promise with list of stages
   */
  getActivityStages: async () => {
    try {
      const response = await apiClient.get<CCActivityStage[]>('/api/v1/cc/activities/stages');
      return response.data;
    } catch (error) {
      console.error('Error fetching activity stages:', error);
      throw error;
    }
  },

  /**
   * Get all activities assigned to CC
   * GET /api/v1/cc/activities
   * @param page - Pagination page number (default: 0)
   * @param size - Page size (default: 20)
   * @param sortBy - Field to sort by (default: 'name')
   * @returns Promise with paginated list of activities
   */
  getActivities: async (page = 0, size = 20, sortBy = 'name') => {
    try {
      const response = await apiClient.get<any>('/api/v1/cc/activities', {
        params: { page, size, sortBy }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching CC activities:', error);
      throw error;
    }
  },

  /**
   * Get class details with student information
   * GET /api/v1/cc/activities/class-details
   * @param classId - Class/subgroup ID (optional)
   * @returns Promise with class details
   */
  getClassDetails: async (classId?: number) => {
    try {
      const params = classId ? { classId } : {};
      const response = await apiClient.get<CCClassDetails[]>('/api/v1/cc/activities/class-details', {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching class details:', error);
      throw error;
    }
  },

  /**
   * Get list of teachers available for activity assignment
   * GET /api/v1/cc/activities/teachers
   * @returns Promise with list of teachers
   */
  getTeachers: async () => {
    try {
      const response = await apiClient.get<CCTeacher[]>('/api/v1/cc/activities/teachers');
      return response.data;
    } catch (error) {
      console.error('Error fetching teachers:', error);
      throw error;
    }
  },

  /**
   * Get list of students in CC's classes
   * GET /api/v1/cc/activities/students
   * @param classId - Class/subgroup ID (optional)
   * @param page - Pagination page number (default: 0)
   * @param size - Page size (default: 50)
   * @returns Promise with paginated list of students
   */
  getStudents: async (classId?: number, page = 0, size = 50) => {
    try {
      const params: any = { page, size };
      if (classId) {
        params.classId = classId;
      }
      const response = await apiClient.get<any>('/api/v1/cc/activities/students', {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  },

  /**
   * Assign a teacher to an activity
   * POST /api/v1/cc/activities/{activityId}/assign-teacher
   * @param activityId - ID of the activity
   * @param assignment - Teacher assignment details
   * @returns Promise with assignment result
   */
  assignTeacher: async (activityId: number, assignment: CCTeacherAssignment) => {
    try {
      const response = await apiClient.post<any>(
        `/api/v1/cc/activities/${activityId}/assign-teacher`,
        assignment
      );
      return response.data;
    } catch (error) {
      console.error(`Error assigning teacher to activity ${activityId}:`, error);
      throw error;
    }
  },

  /**
   * Assign activity to students
   * POST /api/v1/cc/activities/{activityId}/assign
   * @param activityId - ID of the activity
   * @param assignment - Student IDs and optional remarks
   * @returns Promise with assignment result
   */
  assignActivity: async (activityId: number, assignment: CCActivityAssignment) => {
    try {
      const response = await apiClient.post<any>(
        `/api/v1/cc/activities/${activityId}/assign`,
        assignment
      );
      return response.data;
    } catch (error) {
      console.error(`Error assigning activity ${activityId}:`, error);
      throw error;
    }
  },

  /**
   * Get list of badge requests for CC's students
   * GET /api/v1/cc/badge-requests
   * @param status - Filter by status (PENDING, APPROVED, REJECTED) (optional)
   * @param page - Pagination page number (default: 0)
   * @param size - Page size (default: 20)
   * @returns Promise with paginated list of badge requests
   */
  getBadgeRequests: async (status?: string, page = 0, size = 20) => {
    try {
      const params: any = { page, size };
      if (status) {
        params.status = status;
      }
      const response = await apiClient.get<any>('/api/v1/cc/badge-requests', {
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching badge requests:', error);
      throw error;
    }
  },

  /**
   * Approve a badge request
   * PUT /api/v1/cc/badge-requests/{id}/approve
   * @param badgeRequestId - ID of the badge request
   * @param approvalData - Approval details (approvedBy, etc.)
   * @returns Promise with approval result
   */
  approveBadgeRequest: async (badgeRequestId: number, approvalData?: BadgeRequestAction) => {
    try {
      const response = await apiClient.put<any>(
        `/api/v1/cc/badge-requests/${badgeRequestId}/approve`,
        approvalData || {}
      );
      return response.data;
    } catch (error) {
      console.error(`Error approving badge request ${badgeRequestId}:`, error);
      throw error;
    }
  },

  /**
   * Reject a badge request
   * PUT /api/v1/cc/badge-requests/{id}/reject
   * @param badgeRequestId - ID of the badge request
   * @param rejectionData - Rejection details (rejectionReason, etc.)
   * @returns Promise with rejection result
   */
  rejectBadgeRequest: async (badgeRequestId: number, rejectionData?: BadgeRequestAction) => {
    try {
      const payload = rejectionData
        ? {
            remarks: rejectionData.remarks || rejectionData.rejectionReason,
            ...rejectionData,
          }
        : {};
      const response = await apiClient.put<any>(
        `/api/v1/cc/badge-requests/${badgeRequestId}/reject`,
        payload
      );
      return response.data;
    } catch (error) {
      console.error(`Error rejecting badge request ${badgeRequestId}:`, error);
      throw error;
    }
  },
};

export default ccActivityService;
