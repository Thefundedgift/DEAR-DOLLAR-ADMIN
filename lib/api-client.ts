// ============================================================
// Centralized API client for the existing NestJS backend.
// - Base URL comes from NEXT_PUBLIC_API_URL (never hardcoded)
// - JWT access token attached on every request
// - Automatic refresh-token rotation on 401 (single-flight)
// - No mock data: every call goes to the real backend
// ============================================================

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { AdminProfile, Permission } from '@/types';

const KEYS = {
  access: 'dd_admin_access_token',
  refresh: 'dd_admin_refresh_token',
  profile: 'dd_admin_profile',
};

export const getApiUrl = (): string => process.env.NEXT_PUBLIC_API_URL || '';

const isBrowser = () => typeof window !== 'undefined';

export const tokenStore = {
  getAccess: (): string | null => (isBrowser() ? localStorage.getItem(KEYS.access) : null),
  getRefresh: (): string | null => (isBrowser() ? localStorage.getItem(KEYS.refresh) : null),
  setTokens: (access: string, refresh: string) => {
    if (!isBrowser()) return;
    localStorage.setItem(KEYS.access, access);
    localStorage.setItem(KEYS.refresh, refresh);
  },
  getProfile: (): AdminProfile | null => {
    if (!isBrowser()) return null;
    try {
      const raw = localStorage.getItem(KEYS.profile);
      return raw ? (JSON.parse(raw) as AdminProfile) : null;
    } catch {
      return null;
    }
  },
  setProfile: (profile: AdminProfile) => {
    if (!isBrowser()) return;
    localStorage.setItem(KEYS.profile, JSON.stringify(profile));
  },
  clear: () => {
    if (!isBrowser()) return;
    localStorage.removeItem(KEYS.access);
    localStorage.removeItem(KEYS.refresh);
    localStorage.removeItem(KEYS.profile);
  },
};

export const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token
api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Single-flight refresh-token rotation
let refreshInFlight: Promise<string | null> | null = null;

async function rotateRefreshToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${getApiUrl()}/admin/auth/refresh`, { refreshToken }, { timeout: 15000 });
    const data = res.data || {};
    const newAccess: string | undefined = data.accessToken;
    const newRefresh: string | undefined = data.refreshToken;
    if (!newAccess) return null;
    tokenStore.setTokens(newAccess, newRefresh || refreshToken);
    return newAccess;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;
    const url = original?.url || '';
    const isAuthRoute = url.includes('/admin/auth/login') || url.includes('/admin/auth/refresh');

    if (status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      if (!refreshInFlight) {
        refreshInFlight = rotateRefreshToken().finally(() => {
          refreshInFlight = null;
        });
      }
      const newToken = await refreshInFlight;
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      }
      // Refresh failed -> force logout
      tokenStore.clear();
      if (isBrowser() && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?expired=1';
      }
    }
    return Promise.reject(error);
  }
);

export function apiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      const base = getApiUrl();
      return base
        ? `Cannot reach the backend API at ${base}. Make sure the DEAR DOLLAR NestJS backend is running and NEXT_PUBLIC_API_URL is correct.`
        : 'NEXT_PUBLIC_API_URL is not configured. Set it in your .env file to point to the DEAR DOLLAR backend.';
    }
    const data = err.response.data as { message?: string | string[]; error?: string } | undefined;
    const msg = data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    return msg || data?.error || `Request failed with status ${err.response.status}`;
  }
  return 'An unexpected error occurred';
}

export function hasPermission(admin: AdminProfile | null, permission?: Permission): boolean {
  if (!admin) return false;
  if (!permission) return true;
  if (admin.role === 'SUPER_ADMIN') return true;
  return Array.isArray(admin.permissions) && admin.permissions.includes(permission);
}
