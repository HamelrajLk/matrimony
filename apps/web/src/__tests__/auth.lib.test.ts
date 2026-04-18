/**
 * Tests for src/lib/auth.ts — API client functions.
 * Uses global fetch mock.
 */
import {
  signUpIndividual,
  signUpPartner,
  loginWithEmail,
  logoutFromAPI,
  forgotPassword,
  resetPassword,
} from '@/lib/auth';

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockResponse(data: object, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  } as Response);
}

const authResponse = {
  user: { id: 1, email: 'user@example.com', role: 'USER', status: 'ACTIVE' },
  token: 'mock-jwt-token',
  role: 'USER',
};

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── signUpIndividual ─────────────────────────────────────────────────────────
describe('signUpIndividual', () => {
  it('calls POST /api/auth/register with role USER and returns AuthResponse', async () => {
    mockFetch.mockResolvedValue(mockResponse(authResponse));

    const result = await signUpIndividual({
      firstName: 'Amal',
      lastName: 'Silva',
      email: 'amal@example.com',
      password: 'Secure@123',
      gender: 'MALE',
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/auth/register');
    expect(options.method).toBe('POST');

    const body = JSON.parse(options.body);
    expect(body.role).toBe('USER');
    expect(body.email).toBe('amal@example.com');

    expect(result.token).toBe('mock-jwt-token');
    expect(result.role).toBe('USER');
  });

  it('throws when server returns error', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ message: 'An account with this email already exists' }, false, 409),
    );

    await expect(
      signUpIndividual({ firstName: 'Test', lastName: 'User', email: 'dup@example.com', password: 'Secure@123', gender: 'FEMALE' as const }),
    ).rejects.toThrow('An account with this email already exists');
  });
});

// ─── signUpPartner ────────────────────────────────────────────────────────────
describe('signUpPartner', () => {
  const partnerAuthResponse = { ...authResponse, role: 'PARTNER', user: { ...authResponse.user, role: 'PARTNER' } };

  it('calls POST /api/auth/register with role PARTNER', async () => {
    mockFetch.mockResolvedValue(mockResponse(partnerAuthResponse));

    const result = await signUpPartner({
      businessName: 'Studio',
      contactPerson: 'Owner',
      businessEmail: 'owner@studio.com',
      phone: '+94771234567',
      password: 'Secure@123',
      services: ['PHOTOGRAPHER'],
    });

    const [, options] = mockFetch.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(body.role).toBe('PARTNER');
    expect(body.businessName).toBe('Studio');
    expect(result.role).toBe('PARTNER');
  });

  it('throws on duplicate email error', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'Email exists' }, false, 409));
    await expect(
      signUpPartner({
        businessName: 'S',
        contactPerson: 'O',
        businessEmail: 'dup@s.com',
        phone: '+94770000000',
        password: 'Pass@123',
        services: ['VENUE'],
      }),
    ).rejects.toThrow('Email exists');
  });
});

// ─── loginWithEmail ───────────────────────────────────────────────────────────
describe('loginWithEmail', () => {
  it('calls POST /api/auth/login and returns AuthResponse', async () => {
    mockFetch.mockResolvedValue(mockResponse(authResponse));

    const result = await loginWithEmail('user@example.com', 'Secure@123');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/auth/login');
    const body = JSON.parse(options.body);
    expect(body.email).toBe('user@example.com');

    expect(result.token).toBe('mock-jwt-token');
  });

  it('throws on invalid credentials', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'Invalid email or password' }, false, 401));
    await expect(loginWithEmail('bad@example.com', 'wrong')).rejects.toThrow('Invalid email or password');
  });

  it('throws on deactivated account', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ message: 'Your account has been deactivated' }, false, 403),
    );
    await expect(loginWithEmail('inactive@example.com', 'pass')).rejects.toThrow(
      'Your account has been deactivated',
    );
  });
});

// ─── logoutFromAPI ────────────────────────────────────────────────────────────
describe('logoutFromAPI', () => {
  it('calls POST /api/auth/logout with Authorization header', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'Logged out' }));

    await logoutFromAPI('my-token');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/auth/logout');
    expect(options.headers['Authorization']).toBe('Bearer my-token');
  });
});

// ─── forgotPassword ───────────────────────────────────────────────────────────
describe('forgotPassword', () => {
  it('calls POST /api/auth/forgot-password and returns message', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'If that email exists, a reset link has been sent.' }));

    const result = await forgotPassword('user@example.com');

    expect(result.message).toMatch(/if that email exists/i);
    const [url] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/auth/forgot-password');
  });
});

// ─── resetPassword ────────────────────────────────────────────────────────────
describe('resetPassword', () => {
  it('calls POST /api/auth/reset-password with token and password', async () => {
    mockFetch.mockResolvedValue(mockResponse({ message: 'Password reset successfully.' }));

    const result = await resetPassword('tok123', 'NewPass@1');

    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toContain('/api/auth/reset-password');
    const body = JSON.parse(options.body);
    expect(body.token).toBe('tok123');
    expect(body.password).toBe('NewPass@1');
    expect(result.message).toMatch(/reset successfully/i);
  });

  it('throws on invalid token', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ message: 'Reset token is invalid or has expired.' }, false, 400),
    );
    await expect(resetPassword('expired', 'NewPass@1')).rejects.toThrow(
      'Reset token is invalid or has expired.',
    );
  });
});
