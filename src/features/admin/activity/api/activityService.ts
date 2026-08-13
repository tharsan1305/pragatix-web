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
    const response = await apiClient.post('/api/v1/group-activities/teams', body);
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
      console.error("Fallback activity fetch failed:", fallbackErr);
    }

    return [];
  },

  fetchActivities: async (subgroupId?: number, stageId?: number, subgroupName?: string, isCcOverride?: boolean): Promise<ActivityModel[]> => {
    const userString = localStorage.getItem('spdms_user') || localStorage.getItem('user');
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
        console.warn("Failed to fetch CC activities:", e);
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
        console.warn('Failed to resolve subgroup from stages', e);
      }
    }

    // Default to valid database subgroup ID 1 if still not resolved
    if (!targetSubgroupId || Number(targetSubgroupId) <= 0) {
      targetSubgroupId = 1;
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
    ccEnabled: boolean = false
  ): Promise<void> => {
    await apiClient.post(`/api/v1/admin/activities/${activityId}/assign`, {
      globalEnabled,
      ccEnabled,
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
