import { create } from 'zustand';
import apiClient from '../services/apiClient';

interface XpState {
  xpByCategory: Record<string, number>;
  history: any[];
  streaks: any[];
  isLoading: boolean;
  totalXp: number;
  fetchSummary: (studentId: string) => Promise<void>;
  fetchHistory: (studentId: string) => Promise<void>;
  fetchStreaks: (studentId: string) => Promise<void>;
  submitXpClaim: (category: string, activityName: string, xpPoints: number, evidenceUrl: string) => Promise<boolean>;
}

export const useXpStore = create<XpState>((set) => ({
  xpByCategory: {},
  history: [],
  streaks: [],
  isLoading: false,
  totalXp: 0,

  fetchSummary: async (studentId) => {
    if (!studentId) return;
    set({ isLoading: true });
    try {
      const response = await apiClient.get(`/api/v1/xp/${studentId}/summary`);
      if (response.data.success && response.data.data) {
        const xpData = response.data.data;
        let totalXp = 0;
        if (typeof xpData.totalXp === 'number') {
          totalXp = xpData.totalXp;
        } else {
          totalXp = Object.values(xpData).reduce((sum: number, val: any) => 
            sum + (typeof val === 'number' ? val : 0), 0);
        }
        set({ xpByCategory: xpData, totalXp });
      }
    } catch (error) {
      console.error('Failed to fetch summary for student:', studentId, error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchHistory: async (studentId) => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get(`/api/v1/xp/${studentId}/history?page=0&size=50`);
      if (response.data.success && response.data.data) {
        const dataObj = response.data.data;
        const list = Array.isArray(dataObj) ? dataObj : (dataObj.content || []);
        set({ history: list });
      }
    } catch (error) {
      console.error('Failed to fetch XP history for student:', studentId, error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStreaks: async (studentId) => {
    set({ isLoading: true });
    try {
      let response;
      try {
        response = await apiClient.get(`/api/v1/xp/${studentId}/streaks`);
      } catch (_) {
        response = await apiClient.get('/api/v1/students/me/activity-streaks');
      }

      if (response.data?.success && Array.isArray(response.data.data)) {
        set({ streaks: response.data.data });
      } else {
        set({ streaks: [] });
      }
    } catch (_error) {
      set({ streaks: [] });
    } finally {
      set({ isLoading: false });
    }
  },

  submitXpClaim: async (category, activityName, xpPoints, evidenceUrl) => {
    try {
      const response = await apiClient.post('/api/v1/xp/submit', {
        category,
        activityName,
        xpPoints,
        evidenceUrl,
      });
      return response.data.success === true;
    } catch (error) {
      console.error('Failed to submit XP claim:', error);
      return false;
    }
  }
}));
