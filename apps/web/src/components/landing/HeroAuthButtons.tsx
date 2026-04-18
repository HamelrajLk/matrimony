'use client';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useTranslation } from '@/hooks/useTranslation';

export default function HeroAuthButtons() {
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const loggedIn = _hasHydrated && isAuthenticated;
  const { t } = useTranslation();

  if (loggedIn) return null;

  return (
    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
      <Link
        href="/signup?role=USER"
        className="btn-white"
        style={{ textDecoration: 'none', display: 'inline-block' }}
      >
        ♥ {t('hero.cta')}
      </Link>
      <Link
        href="/signup?role=PARTNER"
        className="btn-outline-w"
        style={{ textDecoration: 'none', display: 'inline-block' }}
      >
        🤝 {t('hero.ctaSecondary')}
      </Link>
    </div>
  );
}
