'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/lib/auth';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  _hasHydrated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setHasHydrated: (v: boolean) => void;
}

function syncCookie(state: { user: AuthUser | null; token: string | null; isAuthenticated: boolean }) {
  if (typeof document === 'undefined') return;
  const value = JSON.stringify({ state });
  document.cookie = `twp-auth=${encodeURIComponent(value)}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
}

function clearCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = 'twp-auth=; path=/; max-age=0';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      _hasHydrated: false,
      setHasHydrated: (v) => set({ _hasHydrated: v }),
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
        syncCookie({ user, token, isAuthenticated: true });
      },
      clearAuth: () => {
        set({ user: null, token: null, isAuthenticated: false });
        clearCookie();
      },
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'twp-auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => { state?.setHasHydrated(true); },
    }
  )
);
