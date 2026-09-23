import { api } from '@/lib/api-client';
import type { BuyRequest, Paginated, SellRequest } from '@/types';

export const buyRequestService = {
  async list(params: { status?: string; page?: number; limit?: number } = {}): Promise<Paginated<BuyRequest>> {
    const { data } = await api.get<Paginated<BuyRequest>>('/admin/buy-requests', { params });
    return data;
  },
  async approve(id: string, note?: string): Promise<BuyRequest> {
    const { data } = await api.post<BuyRequest>(`/admin/buy-requests/${id}/approve`, { note });
    return data;
  },
  async reject(id: string, reason: string): Promise<BuyRequest> {
    const { data } = await api.post<BuyRequest>(`/admin/buy-requests/${id}/reject`, { reason });
    return data;
  },
};

export const sellRequestService = {
  async list(params: { status?: string; page?: number; limit?: number } = {}): Promise<Paginated<SellRequest>> {
    const { data } = await api.get<Paginated<SellRequest>>('/admin/sell-requests', { params });
    return data;
  },
  async approve(id: string, note?: string): Promise<SellRequest> {
    const { data } = await api.post<SellRequest>(`/admin/sell-requests/${id}/approve`, { note });
    return data;
  },
  async reject(id: string, reason: string): Promise<SellRequest> {
    const { data } = await api.post<SellRequest>(`/admin/sell-requests/${id}/reject`, { reason });
    return data;
  },
};
