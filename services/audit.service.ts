import { api } from '@/lib/api-client';
import type { AuditLog, Paginated } from '@/types';

export const auditService = {
  async list(
    params: {
      adminId?: string;
      action?: string;
      entity?: string;
      from?: string;
      to?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<Paginated<AuditLog>> {
    const { data } = await api.get<Paginated<AuditLog>>('/admin/audit-logs', { params });
    return data;
  },
};
