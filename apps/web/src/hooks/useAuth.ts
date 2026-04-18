'use client';
import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const { user, token, isAuthenticated, isLoading, setAuth, clearAuth } = useAuthStore();
  return { user, token, isAuthenticated, isLoading, setAuth, clearAuth };
}
