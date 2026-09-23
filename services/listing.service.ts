import { api } from '@/lib/api-client';
import type { BuyListing, DemandListing, Paginated } from '@/types';

export type BuyListingInput = Omit<BuyListing, 'id' | 'createdAt'>;
export type DemandListingInput = Omit<DemandListing, 'id' | 'createdAt' | 'remainingQuantity'> & {
  remainingQuantity?: number;
};

export const buyListingService = {
  async list(params: { status?: string; page?: number; limit?: number } = {}): Promise<Paginated<BuyListing>> {
    const { data } = await api.get<Paginated<BuyListing>>('/admin/buy-listings', { params });
    return data;
  },
  async create(input: BuyListingInput): Promise<BuyListing> {
    const { data } = await api.post<BuyListing>('/admin/buy-listings', input);
    return data;
  },
  async update(id: string, input: Partial<BuyListingInput>): Promise<BuyListing> {
    const { data } = await api.patch<BuyListing>(`/admin/buy-listings/${id}`, input);
    return data;
  },
  async activate(id: string): Promise<BuyListing> {
    const { data } = await api.post<BuyListing>(`/admin/buy-listings/${id}/activate`);
    return data;
  },
  async pause(id: string): Promise<BuyListing> {
    const { data } = await api.post<BuyListing>(`/admin/buy-listings/${id}/pause`);
    return data;
  },
  async close(id: string): Promise<BuyListing> {
    const { data } = await api.post<BuyListing>(`/admin/buy-listings/${id}/close`);
    return data;
  },
};

export const demandListingService = {
  async list(params: { status?: string; page?: number; limit?: number } = {}): Promise<Paginated<DemandListing>> {
    const { data } = await api.get<Paginated<DemandListing>>('/admin/demand-listings', { params });
    return data;
  },
  async create(input: DemandListingInput): Promise<DemandListing> {
    const { data } = await api.post<DemandListing>('/admin/demand-listings', input);
    return data;
  },
  async update(id: string, input: Partial<DemandListingInput>): Promise<DemandListing> {
    const { data } = await api.patch<DemandListing>(`/admin/demand-listings/${id}`, input);
    return data;
  },
  async activate(id: string): Promise<DemandListing> {
    const { data } = await api.post<DemandListing>(`/admin/demand-listings/${id}/activate`);
    return data;
  },
  async pause(id: string): Promise<DemandListing> {
    const { data } = await api.post<DemandListing>(`/admin/demand-listings/${id}/pause`);
    return data;
  },
  async close(id: string): Promise<DemandListing> {
    const { data } = await api.post<DemandListing>(`/admin/demand-listings/${id}/close`);
    return data;
  },
};
