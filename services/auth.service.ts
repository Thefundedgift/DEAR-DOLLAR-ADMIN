import { api, tokenStore } from '@/lib/api-client';
import type { AdminProfile, LoginResponse } from '@/types';

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post<LoginResponse>('/admin/auth/login', { email, password });
    tokenStore.setTokens(data.accessToken, data.refreshToken);
    tokenStore.setProfile(data.admin);
    return data;
  },

  async me(): Promise<AdminProfile> {
    const { data } = await api.get<AdminProfile>('/admin/auth/me');
    tokenStore.setProfile(data);
    return data;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStore.getRefresh();
    try {
      // Revoke refresh token on the backend (best effort)
      if (refreshToken) await api.post('/admin/auth/logout', { refreshToken });
    } catch {
      // ignore network errors during logout
    } finally {
      tokenStore.clear();
    }
  },
};
