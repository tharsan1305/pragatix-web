import apiClient from '../../../../services/apiClient';
import type { RecycleBinItem } from '../types';

export const recycleBinService = {
  async getDeletedItems(): Promise<RecycleBinItem[]> {
    const res = await apiClient.get('/api/v1/recycle-bin');
    if (res.data?.success && Array.isArray(res.data.data)) {
      return res.data.data;
    }
    if (Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },

  async restoreItem(entityType: string, id: number): Promise<void> {
    await apiClient.post(`/api/v1/recycle-bin/restore/${entityType}/${id}`);
  },

  async permanentlyDeleteItem(entityType: string, id: number): Promise<void> {
    await apiClient.delete(`/api/v1/recycle-bin/permanent/${entityType}/${id}`);
  }
};

export default recycleBinService;
