'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

interface Props {
  children: React.ReactNode;
  requiredRole?: 'USER' | 'PARTNER';
}

export default function AuthGuard({ children, requiredRole }: Props) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    if (requiredRole && user?.role !== requiredRole) {
      const dest = user?.role === 'PARTNER' ? '/partners/dashboard' : '/dashboard';
      router.replace(dest);
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FFFBF7' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', animation: 'heartbeat 1.5s ease-in-out infinite' }}>💍</div>
          <p style={{ color: '#E8735A', fontFamily: "'Outfit',sans-serif", marginTop: '12px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
