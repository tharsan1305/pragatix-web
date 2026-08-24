import { logger } from '../../../../utils/logger';
import apiClient from '../../../../services/apiClient';
import type {
  ActivityModel,
  ActivityOptionModel,
  GroupedActivityModel,
  MyActivityStudentsResponseModel
} from '../types/ActivityTypes';

export const activityService = {
  searchStudents: async (query: string, page: number = 0, size: number = 50): Promise<any> => {
    const response = await apiClient.get('/api/v1/admin/students/search', { params: { query, page, size } });
    return response.data;
  },

  createTeam: async (body: any): Promise<any> => {
    const response = await apiClient.post('/api/v1/teams', body);
    return response.data;
  },

  fetchGroupedActivities: async (subgroupName?: string, stageId?: number, subgroupId?: number): Promise<GroupedActivityModel[]> => {
    let url = '/api/v1/admin/activities/grouped';
    if (subgroupName && subgroupName.trim().length > 0) {
      url += `?subgroup=${encodeURIComponent(subgroupName)}`;
    }
    try {
      const response = await apiClient.get(url);
      if (response.data?.success && Array.isArray(response.data?.data)) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
    } catch (e) {
      // 403 Forbidden for non-Admin roles; fallback gracefully for Teachers/CCs
    }

    try {
      const rawList = await activityService.fetchActivities(subgroupId, stageId, subgroupName);
      if (rawList && rawList.length > 0) {
        const key = subgroupName || 'Activities';
        const options: ActivityOptionModel[] = rawList.map((a: any) => ({
          id: a.id,
          name: a.name || a.activityName || 'Activity',
          description: a.description || '',
          awardXp: a.awardXp ?? a.points ?? 0,
          awardFrequency: a.awardFrequency || a.frequency || 'DAILY',
          type: a.type || a.activityType || 'INDIVIDUAL',
        }));
        return [{ subgroup: key, activities: options }];
      }
    } catch (fallbackErr) {
      logger.error("Fallback activity fetch failed:", fallbackErr);
    }

    return [];
  },

  fetchActivities: async (subgroupId?: number, stageId?: number, subgroupName?: string, isCcOverride?: boolean): Promise<ActivityModel[]> => {
    const userString = localStorage.getItem('spdms_user');
    let isCc = !!isCcOverride;
    if (!isCc && userString) {
      try {
        const u = JSON.parse(userString);
        const subs = u.subRoles || [];
        const roles = u.roles || [];
        isCc = subs.some((r: any) => {
          const rStr = String(r).toUpperCase().trim();
          return rStr === 'CC' || rStr === 'CLASS_COORDINATOR' || rStr === 'ROLE_CC' || rStr === 'ROLE_CLASS_COORDINATOR';
        }) || roles.some((r: any) => {
          const rStr = String(r).toUpperCase().trim();
          return rStr === 'CLASS_COORDINATOR' || rStr === 'ROLE_CLASS_COORDINATOR';
        });
      } catch {}
    }

    if (isCc) {
      const params: any = {};
      if (stageId) params.stageId = stageId;
      if (subgroupName && !subgroupName.toLowerCase().includes('all')) {
        params.subgroup = subgroupName;
      }
      try {
        const response = await apiClient.get('/api/v1/cc/activities', { params });
        const data = response.data?.data ?? response.data;
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (e) {
        logger.warn("Failed to fetch CC activities:", e);
      }
    }

    const endpoints: string[] = [];
    const isAll = !subgroupName || subgroupName.toLowerCase().includes('all');
    const cleanSubgroup = isAll ? undefined : subgroupName;

    if (stageId && cleanSubgroup) {
      endpoints.push(`/api/v1/admin/stages/${stageId}/activities?subgroup=${encodeURIComponent(cleanSubgroup)}`);
    }

    if (subgroupId) {
      endpoints.push(`/api/v1/admin/subgroups/${subgroupId}/activities`);
    }

    if (cleanSubgroup) {
      endpoints.push(`/api/v1/admin/activities?subgroup=${encodeURIComponent(cleanSubgroup)}`);
    }

    endpoints.push('/api/v1/admin/activities');

    for (const url of endpoints) {
      try {
        const response = await apiClient.get(url);
        const data = response.data?.data ?? response.data;
        if (Array.isArray(data) && data.length > 0) {
          return data;
        }
      } catch (e) {
        // Try next endpoint matching Flutter behavior
      }
    }
    return [];
  },

  fetchDepartments: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/v1/admin/departments');
    return response.data.data;
  },

  fetchUsers: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/v1/admin/users');
    return response.data.data;
  },

  fetchClassCoordinators: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/v1/admin/departments/class-coordinators');
    return response.data.data;
  },

  fetchCustomFrequencies: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/v1/admin/frequencies/custom');
    return response.data.data;
  },

  fetchXpCategories: async (): Promise<string[]> => {
    try {
      const response = await apiClient.get('/api/v1/admin/xp-categories');
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : ['Academic', 'Skill', 'Communication', 'Leadership', 'Discipline', 'Placement', 'Innovation', 'Community', 'Sports', 'Cultural'];
    } catch {
      return ['Academic', 'Skill', 'Communication', 'Leadership', 'Discipline', 'Placement', 'Innovation', 'Community', 'Sports', 'Cultural'];
    }
  },

  fetchEvidenceTypes: async (): Promise<string[]> => {
    try {
      const response = await apiClient.get('/api/v1/admin/evidence-types');
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : ['Handwritten', 'Soft Copy', 'Diary / Notebook', 'Weekly Log', 'Direct Observation', 'Attendance Register', 'ERP Attendance', 'Manual'];
    } catch {
      return ['Handwritten', 'Soft Copy', 'Diary / Notebook', 'Weekly Log', 'Direct Observation', 'Attendance Register', 'ERP Attendance', 'Manual'];
    }
  },

  fetchGuardianRelations: async (): Promise<string[]> => {
    try {
      const response = await apiClient.get('/api/v1/admin/guardian-relations');
      const data = response.data?.data || response.data;
      return Array.isArray(data) ? data : ['Father', 'Mother', 'Guardian', 'Parent'];
    } catch {
      return ['Father', 'Mother', 'Guardian', 'Parent'];
    }
  },

  createCustomFrequency: async (body: any): Promise<any> => {
    const response = await apiClient.post('/api/v1/admin/frequencies/custom', body);
    return response.data.data;
  },

  createActivity: async (body: Partial<ActivityModel>, subgroupId?: number, stageId?: number, subgroupName?: string): Promise<any> => {
    let targetSubgroupId = subgroupId;

    // Resolve a valid backend Subgroup ID from database if missing or invalid (<= 0)
    if (!targetSubgroupId || Number(targetSubgroupId) <= 0) {
      try {
        const stageRes = await apiClient.get('/api/v1/admin/stages');
        if (stageRes.data?.success && Array.isArray(stageRes.data?.data) && stageRes.data.data.length > 0) {
          const stages = stageRes.data.data;
          let matchedStage = stageId ? stages.find((s: any) => s.id === stageId) : stages[0];
          if (!matchedStage) matchedStage = stages[0];

          if (matchedStage?.subgroups && matchedStage.subgroups.length > 0) {
            const matchName = (subgroupName || 'Must').toLowerCase();
            const existing = matchedStage.subgroups.find((sg: any) => 
              (sg.name || sg.subgroupName || '').toLowerCase() === matchName
            );
            targetSubgroupId = existing ? existing.id : matchedStage.subgroups[0].id;
          }
        }
      } catch (e) {
        logger.warn('Failed to resolve subgroup from stages', e);
      }
    }

    // Fail if subgroup ID cannot be resolved
    if (!targetSubgroupId || Number(targetSubgroupId) <= 0) {
      logger.error('Unable to resolve valid subgroup ID for activity creation', { stageId, subgroupName });
      throw new Error('Cannot create activity: Unable to determine a valid subgroup. Please ensure stages and subgroups are configured correctly.');
    }

    const endpoint = `/api/v1/admin/subgroups/${targetSubgroupId}/activities`;

    const payload = {
      ...body,
      stageId: stageId || (body as any).stageId,
      subgroupId: targetSubgroupId,
      subgroup: subgroupName || (body as any).subgroup || (body as any).subgroupName || 'Must'
    };

    const response = await apiClient.post(endpoint, payload);
    return response.data;
  },

  updateActivity: async (activityId: number, body: Partial<ActivityModel>): Promise<any> => {
    const payload: any = { ...body };
    
    if (payload.subgroup) {
      let sgStr = typeof payload.subgroup === 'object' ? ((payload.subgroup as any).name || (payload.subgroup as any).category || '') : String(payload.subgroup);
      sgStr = sgStr.trim();
      
      const lower = sgStr.toLowerCase();
      if (lower.includes('must')) {
        payload.subgroup = 'Must';
      } else if (lower.includes('individual')) {
        payload.subgroup = 'Individual';
      } else if (lower.includes('group')) {
        payload.subgroup = 'Group';
      } else if (sgStr === '[object Object]' || sgStr.length === 0) {
        delete payload.subgroup;
      } else {
        payload.subgroup = sgStr;
      }
    } else {
      delete payload.subgroup;
    }

    try {
      const response = await apiClient.put(`/api/v1/admin/activities/${activityId}`, payload);
      return response.data;
    } catch (e: any) {
      if (e.response?.data?.message?.includes('subgroup')) {
        const retryPayload: any = { ...payload };
        delete retryPayload.subgroup;
        const retryRes = await apiClient.put(`/api/v1/admin/activities/${activityId}`, retryPayload);
        return retryRes.data;
      }
      throw e;
    }
  },

  deleteActivity: async (activityId: number, force: boolean = false): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/activities/${activityId}?force=${force}`);
  },

  unmapActivityFromStage: async (stageId: number, activityId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/stages/${stageId}/activities/${activityId}`);
  },

  mapActivityToStage: async (stageId: number, activityId: number, subgroup: string): Promise<void> => {
    const primaryUrl = `/api/v1/admin/stages/${stageId}/activities/${activityId}?subgroup=${encodeURIComponent(subgroup)}`;
    const fallbackUrl = `/api/v1/admin/stages/${stageId}/activities/${activityId}/map?subgroup=${encodeURIComponent(subgroup)}`;
    try {
      await apiClient.post(primaryUrl);
    } catch (e) {
      await apiClient.post(fallbackUrl);
    }
  },


  fetchSections: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/v1/admin/sections');
    return response.data.data;
  },

  getAssignments: async (activityId: number, stageId?: number): Promise<any[]> => {
    const stageParam = stageId ? `?stageId=${stageId}` : '';
    const response = await apiClient.get(`/api/v1/admin/activities/${activityId}/assignments${stageParam}`);
    return response.data?.data || (Array.isArray(response.data) ? response.data : []);
  },

  addAssignment: async (
    activityId: number,
    departmentId: number,
    year: string,
    sectionId: number | null,
    teacherId: number,
    scope: 'SECTION' | 'DEPARTMENT' = 'SECTION',
    stageId?: number
  ): Promise<any> => {
    const stageParam = stageId ? `?stageId=${stageId}` : '';
    const response = await apiClient.post(`/api/v1/admin/activities/${activityId}/assignments${stageParam}`, {
      departmentId,
      year: year || '1',
      sectionId,
      teacherId,
      scope,
    });
    return response.data;
  },

  removeAssignment: async (assignmentId: number): Promise<void> => {
    await apiClient.delete(`/api/v1/admin/assignments/${assignmentId}`);
  },

  clearAllAssignments: async (activityId: number, stageId?: number): Promise<void> => {
    const stageParam = stageId ? `?stageId=${stageId}` : '';
    await apiClient.delete(`/api/v1/admin/activities/${activityId}/assignments${stageParam}`);
  },

  assignActivity: async (activityId: number, sectionId: number | null, teacherId: number): Promise<any> => {
    const response = await apiClient.post(`/api/v1/admin/activities/${activityId}/assign`, {
      sectionId,
      teacherId,
    });
    return response.data;
  },

  saveAssignments: async (
    activityId: number,
    globalEnabled: boolean,
    assignments: any[],
    ccEnabled: boolean = false,
    stageId?: number,
    attendanceEngineEnabled?: boolean,
    attendanceRule?: string
  ): Promise<void> => {
    await apiClient.post(`/api/v1/admin/activities/${activityId}/assign`, {
      globalEnabled,
      ccEnabled,
      stageId,
      attendanceEngineEnabled,
      attendanceRule,
      assignments,
    });
  },

  fetchMyActivities: async (): Promise<any[]> => {
    const response = await apiClient.get('/api/v1/admin/my-activities');
    return response.data.data;
  },

  fetchExecutionStudents: async (
    activityId: number,
    year?: string,
    departmentId?: number,
    sectionId?: number
  ): Promise<MyActivityStudentsResponseModel> => {
    const params = new URLSearchParams();
    if (year) params.append('year', year);
    if (departmentId) params.append('departmentId', departmentId.toString());
    if (sectionId) params.append('sectionId', sectionId.toString());

    const response = await apiClient.get(`/api/v1/my-activities/${activityId}/students`, { params });
    return response.data.data;
  },

  awardXp: async (
    studentId: number,
    activityId: number,
    assignmentId: number,
    xp: number,
    remarks: string,
    result: string = 'PASS'
  ): Promise<void> => {
    await apiClient.post('/api/v1/student-xp/award', {
      studentId,
      activityId,
      assignmentId,
      xp,
      remarks,
      result,
    });
  }
};
