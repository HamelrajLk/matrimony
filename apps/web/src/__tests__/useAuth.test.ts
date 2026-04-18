import { renderHook, act } from '@testing-library/react';

// Mock zustand persist middleware
jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

const mockUser = {
  id: 1,
  email: 'hook-user@example.com',
  role: 'PARTNER' as const,
  status: 'ACTIVE',
};

describe('useAuth hook', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('returns initial unauthenticated state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('reflects store state after setAuth', () => {
    act(() => {
      useAuthStore.getState().setAuth(mockUser, 'hook-token');
    });

    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.token).toBe('hook-token');
  });

  it('reflects cleared state after clearAuth', () => {
    act(() => {
      useAuthStore.getState().setAuth(mockUser, 'hook-token');
    });
    act(() => {
      useAuthStore.getState().clearAuth();
    });

    const { result } = renderHook(() => useAuth());
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });

  it('exposes setAuth and clearAuth functions', () => {
    const { result } = renderHook(() => useAuth());
    expect(typeof result.current.setAuth).toBe('function');
    expect(typeof result.current.clearAuth).toBe('function');
  });

  it('setAuth called through hook updates store', () => {
    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.setAuth(mockUser, 'direct-from-hook');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe('direct-from-hook');
  });

  it('clearAuth called through hook clears store', () => {
    act(() => {
      useAuthStore.getState().setAuth(mockUser, 'token');
    });

    const { result } = renderHook(() => useAuth());

    act(() => {
      result.current.clearAuth();
    });

    expect(result.current.isAuthenticated).toBe(false);
  });
});
