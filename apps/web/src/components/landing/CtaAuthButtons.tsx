'use client';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';

export default function CtaAuthButtons() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const loggedIn = _hasHydrated && isAuthenticated;
  const { t } = useTranslation();

  if (loggedIn) return null;

  return (
    <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
      <Link
        href="/signup?role=USER"
        className="btn-white"
        style={{ padding: '16px 44px', fontSize: '0.95rem', textDecoration: 'none', display: 'inline-block' }}
      >
        ♥ {t('cta.btn')}
      </Link>
      <Link
        href="/signup?role=PARTNER"
        className="btn-outline-w"
        style={{ padding: '16px 44px', fontSize: '0.95rem', textDecoration: 'none', display: 'inline-block' }}
      >
        🌟 {t('cta.btnSecondary')}
      </Link>
    </div>
  );
}
