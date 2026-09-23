'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { tokenStore, hasPermission } from '@/lib/api-client';
import { authService } from '@/services/auth.service';
import type { AdminProfile, Permission } from '@/types';

interface AuthContextValue {
  admin: AdminProfile | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  can: (permission?: Permission) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Hydrate from localStorage on mount (client only)
    const profile = tokenStore.getProfile();
    const access = tokenStore.getAccess();
    setAdmin(access && profile ? profile : null);
    setInitialized(true);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    setAdmin(res.admin);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setAdmin(null);
    router.replace('/login');
  }, [router]);

  const can = useCallback((permission?: Permission) => hasPermission(admin, permission), [admin]);

  const value = useMemo(
    () => ({ admin, initialized, login, logout, can }),
    [admin, initialized, login, logout, can]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
