/**
 * Tests for the Zustand auth store.
 * We reset the store between tests to ensure isolation.
 */

// Mock zustand persist so it doesn't try to access localStorage in JSDOM
jest.mock('zustand/middleware', () => ({
  persist: (fn: any) => fn,
}));

import { useAuthStore } from '@/store/authStore';

const mockUser = {
  id: 1,
  email: 'user@example.com',
  role: 'USER' as const,
  status: 'ACTIVE',
};

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  });

  it('initial state is unauthenticated', () => {
    const { user, token, isAuthenticated, isLoading } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(token).toBeNull();
    expect(isAuthenticated).toBe(false);
    expect(isLoading).toBe(false);
  });

  it('setAuth sets user, token, and isAuthenticated', () => {
    useAuthStore.getState().setAuth(mockUser, 'test-token-123');

    const { user, token, isAuthenticated } = useAuthStore.getState();
    expect(user).toEqual(mockUser);
    expect(token).toBe('test-token-123');
    expect(isAuthenticated).toBe(true);
  });

  it('clearAuth resets all auth state', () => {
    // First authenticate
    useAuthStore.getState().setAuth(mockUser, 'test-token-123');
    // Then clear
    useAuthStore.getState().clearAuth();

    const { user, token, isAuthenticated } = useAuthStore.getState();
    expect(user).toBeNull();
    expect(token).toBeNull();
    expect(isAuthenticated).toBe(false);
  });

  it('setLoading updates isLoading flag', () => {
    useAuthStore.getState().setLoading(true);
    expect(useAuthStore.getState().isLoading).toBe(true);

    useAuthStore.getState().setLoading(false);
    expect(useAuthStore.getState().isLoading).toBe(false);
  });

  it('setAuth does not affect isLoading', () => {
    useAuthStore.getState().setLoading(true);
    useAuthStore.getState().setAuth(mockUser, 'token');
    // isLoading should be independent
    expect(useAuthStore.getState().isLoading).toBe(true);
  });

  it('multiple setAuth calls use latest values', () => {
    useAuthStore.getState().setAuth(mockUser, 'token-v1');
    const anotherUser = { ...mockUser, email: 'other@example.com' };
    useAuthStore.getState().setAuth(anotherUser, 'token-v2');

    const { user, token } = useAuthStore.getState();
    expect(user!.email).toBe('other@example.com');
    expect(token).toBe('token-v2');
  });
});
