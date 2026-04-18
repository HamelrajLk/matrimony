import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT from Zustand authStore (client-side only)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('twp-auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        const token = parsed?.state?.token;
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {}
  }
  return config;
});

export default api;
