'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

export default function BrokerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, _hasHydrated } = useAuthStore();

  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) router.replace('/login');
  }, [isAuthenticated, _hasHydrated, router]);

  if (!_hasHydrated) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7' }}>
      <Navbar />
      <div style={{ paddingTop: 72 }}>
        {children}
      </div>
      <Footer />
    </div>
  );
}
