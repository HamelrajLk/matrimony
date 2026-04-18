const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface AuthUser {
  id: number;
  email: string;
  role: 'USER' | 'PARTNER';
  status: string;
  gender?: string;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  role: 'USER' | 'PARTNER';
  profileId?: number | null;
  emailVerified?: boolean;
}

async function apiPost<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

export async function apiGet<T>(path: string, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

export async function apiPut<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data as T;
}

export async function signUpIndividual(payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  gender: 'MALE' | 'FEMALE';
  phone?: string;
  country?: string;
}): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/register', { role: 'USER', ...payload });
}

export async function signUpPartner(payload: {
  businessName: string;
  contactPerson: string;
  businessEmail: string;
  phone: string;
  password: string;
  services: string[];
}): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/register', { role: 'PARTNER', ...payload });
}

export async function verifyEmailOtp(email: string, otp: string): Promise<{ message: string; alreadyVerified?: boolean }> {
  return apiPost('/api/auth/verify-email', { email, otp });
}

export async function resendVerificationOtp(email: string): Promise<{ message: string }> {
  return apiPost('/api/auth/resend-otp', { email });
}

export async function loginWithEmail(email: string, password: string): Promise<AuthResponse> {
  return apiPost<AuthResponse>('/api/auth/login', { email, password });
}

export async function logoutFromAPI(token: string): Promise<void> {
  await apiPost('/api/auth/logout', {}, token);
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiPost('/api/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  return apiPost('/api/auth/reset-password', { token, password });
}
