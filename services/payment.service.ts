import { api } from '@/lib/api-client';
import type { Paginated, Payment, PaymentSettings } from '@/types';

export const paymentService = {
  async list(params: { status?: string; page?: number; limit?: number } = {}): Promise<Paginated<Payment>> {
    const { data } = await api.get<Paginated<Payment>>('/admin/payments', { params });
    return data;
  },
  async verify(id: string, note?: string): Promise<Payment> {
    const { data } = await api.post<Payment>(`/admin/payments/${id}/verify`, { note });
    return data;
  },
  async reject(id: string, reason: string): Promise<Payment> {
    const { data } = await api.post<Payment>(`/admin/payments/${id}/reject`, { reason });
    return data;
  },
};

export const paymentSettingsService = {
  async getCurrent(): Promise<PaymentSettings> {
    const { data } = await api.get<PaymentSettings>('/admin/payment-settings');
    return data;
  },
  async getHistory(): Promise<PaymentSettings[]> {
    const { data } = await api.get<PaymentSettings[]>('/admin/payment-settings/history');
    return data;
  },
  // Backend creates a NEW configuration version; old records are preserved
  async update(input: PaymentSettings): Promise<PaymentSettings> {
    const { data } = await api.put<PaymentSettings>('/admin/payment-settings', input);
    return data;
  },
  // Uploads the QR image to the backend (multipart); backend stores it and returns a public URL
  async uploadQrImage(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post<{ url: string }>('/admin/payment-settings/qr-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });
    return data;
  },
};
