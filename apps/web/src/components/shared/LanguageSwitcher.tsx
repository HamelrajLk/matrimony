'use client';
import { useLangStore, type Locale } from '@/store/langStore';

const LOCALES: { code: Locale; label: string; native: string }[] = [
  { code: 'en', label: 'EN',  native: 'English' },
  { code: 'ta', label: 'த',   native: 'தமிழ்' },
  { code: 'si', label: 'සි',  native: 'සිංහල' },
];

interface Props {
  /** 'light' = on dark/transparent nav, 'dark' = on white/frosted nav */
  variant?: 'light' | 'dark';
}

export default function LanguageSwitcher({ variant = 'dark' }: Props) {
  const { locale, setLocale } = useLangStore();

  const inactiveColor = variant === 'light' ? 'rgba(255,255,255,0.75)' : '#7A6A5A';
  const inactiveBorder = variant === 'light' ? 'rgba(255,255,255,0.35)' : 'rgba(244,164,53,0.35)';

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {LOCALES.map(({ code, label, native }) => {
        const active = locale === code;
        return (
          <button
            key={code}
            onClick={() => setLocale(code)}
            title={native}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              borderRadius: 50,
              border: active ? 'none' : `1.5px solid ${inactiveBorder}`,
              background: active
                ? 'linear-gradient(135deg,#F4A435,#E8735A)'
                : 'transparent',
              color: active ? 'white' : inactiveColor,
              fontSize: code === 'en' ? '0.65rem' : '0.85rem',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: active ? 700 : 500,
              cursor: 'pointer',
              transition: 'all 0.2s',
              lineHeight: 1,
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
