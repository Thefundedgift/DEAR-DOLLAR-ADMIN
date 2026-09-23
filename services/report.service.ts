import { api, getApiUrl, tokenStore } from '@/lib/api-client';
import type { Paginated, ReportFilters, ReportRow, ReportType } from '@/types';

export const reportService = {
  async get(type: ReportType, filters: ReportFilters = {}): Promise<Paginated<ReportRow>> {
    const { data } = await api.get<Paginated<ReportRow>>(`/admin/reports/${type}`, { params: filters });
    return data;
  },

  // CSV export handled by the backend; token passed via header using fetch
  async exportCsv(type: ReportType, filters: ReportFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    params.set('format', 'csv');
    const res = await fetch(`${getApiUrl()}/admin/reports/${type}/export?${params.toString()}`, {
      headers: { Authorization: `Bearer ${tokenStore.getAccess() || ''}` },
    });
    if (!res.ok) throw new Error(`Export failed with status ${res.status}`);
    return res.blob();
  },
};
