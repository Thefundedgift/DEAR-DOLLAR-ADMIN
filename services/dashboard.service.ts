import { api } from '@/lib/api-client';
import type { DashboardStats } from '@/types';

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/admin/dashboard/stats');
    return data;
  },
};
