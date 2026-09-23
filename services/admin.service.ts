import { api } from '@/lib/api-client';
import type { AdminProfile, AdminRole, Paginated, Permission } from '@/types';

export interface CreateAdminInput {
  name: string;
  email: string;
  mobile?: string;
  password: string;
  role: AdminRole;
  permissions: Permission[];
  status: 'ACTIVE' | 'DISABLED';
}

export const adminService = {
  async list(params: { page?: number; limit?: number } = {}): Promise<Paginated<AdminProfile>> {
    const { data } = await api.get<Paginated<AdminProfile>>('/admin/admins', { params });
    return data;
  },
  async create(input: CreateAdminInput): Promise<AdminProfile> {
    const { data } = await api.post<AdminProfile>('/admin/admins', input);
    return data;
  },
  async update(id: string, input: Partial<Omit<CreateAdminInput, 'password'>> & { password?: string }): Promise<AdminProfile> {
    const { data } = await api.patch<AdminProfile>(`/admin/admins/${id}`, input);
    return data;
  },
  async disable(id: string): Promise<AdminProfile> {
    const { data } = await api.post<AdminProfile>(`/admin/admins/${id}/disable`);
    return data;
  },
  async enable(id: string): Promise<AdminProfile> {
    const { data } = await api.post<AdminProfile>(`/admin/admins/${id}/enable`);
    return data;
  },
};
