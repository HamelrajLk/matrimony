'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AnimIn from './ui/AnimIn';
import { useTranslation } from '@/hooks/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface LookupItem { id: number; name: string; }

const LOOKING_FOR = [
  { value: 'FEMALE', label: 'Bride' },
  { value: 'MALE',   label: 'Groom' },
];

const AGE_OPTIONS = Array.from({ length: 43 }, (_, i) => i + 18); // 18–60

const sel: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  borderRadius: 12,
  border: '1.5px solid #E8D5C0',
  fontFamily: "'Outfit',sans-serif",
  fontSize: '0.88rem',
  color: '#2A1A1A',
  background: 'white',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%239A8A7A' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 36,
  cursor: 'pointer',
  outline: 'none',
};

export default function SearchSection() {
  const router = useRouter();
  const [lookingFor,    setLookingFor]    = useState('FEMALE');
  const [minAge,        setMinAge]        = useState('18');
  const [maxAge,        setMaxAge]        = useState('35');
  const [motherTongueId, setMotherTongueId] = useState('');
  const [motherTongues, setMotherTongues] = useState<LookupItem[]>([]);
  const { t } = useTranslation();

  useEffect(() => {
    fetch(`${API}/api/profiles/lookup`)
      .then(r => r.ok ? r.json() : {})
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((d: any) => setMotherTongues(d.motherTongues ?? []))
      .catch(() => {});
  }, []);

  function handleSearch() {
    const params = new URLSearchParams();
    params.set('gender', lookingFor);
    params.set('minAge', minAge);
    params.set('maxAge', maxAge);
    if (motherTongueId) params.set('motherTongueId', motherTongueId);
    router.push(`/browse?${params.toString()}`);
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: "'Outfit',sans-serif",
    fontSize: '0.68rem',
    fontWeight: 700,
    color: '#9A8A7A',
    display: 'block',
    marginBottom: 7,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  };

  return (
    <section style={{ background: '#FFFBF7', padding: '0 5% 80px' }}>
      <AnimIn>
        <div style={{ maxWidth: 1100, margin: '-28px auto 0' }}>
          <div
            style={{
              background: 'white',
              borderRadius: 28,
              boxShadow: '0 24px 80px rgba(244,164,53,0.11), 0 4px 24px rgba(0,0,0,0.06)',
              padding: '44px 48px',
              border: '1.5px solid rgba(244,164,53,0.1)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 36 }}>
              <h2
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: '1.95rem',
                  fontWeight: 700,
                  color: '#2A1A1A',
                }}
              >
                Find Your Match Today
              </h2>
              <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.9rem', color: '#9A8A7A', marginTop: 6 }}>
                Filter through thousands of verified profiles worldwide
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 0.5fr 1fr 1.5fr',
                gap: 16,
                alignItems: 'end',
                marginBottom: 28,
              }}
            >
              {/* I'm looking for */}
              <div>
                <label style={labelStyle}>{t('search.lookingFor')} <span style={{ color: '#E8735A' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <select style={sel} value={lookingFor} onChange={e => setLookingFor(e.target.value)}>
                    <option value="FEMALE">{t('search.bride')}</option>
                    <option value="MALE">{t('search.groom')}</option>
                  </select>
                </div>
              </div>

              {/* Age min */}
              <div>
                <label style={labelStyle}>{t('search.ageFrom')}</label>
                <div style={{ position: 'relative' }}>
                  <select style={sel} value={minAge} onChange={e => setMinAge(e.target.value)}>
                    {AGE_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              {/* Age separator */}
              <div style={{ textAlign: 'center', paddingBottom: 10 }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", color: '#9A8A7A', fontSize: '0.85rem', fontWeight: 500 }}>To</span>
              </div>

              {/* Age max */}
              <div>
                <label style={{ ...labelStyle, visibility: 'hidden' }}>Max</label>
                <div style={{ position: 'relative' }}>
                  <select style={sel} value={maxAge} onChange={e => setMaxAge(e.target.value)}>
                    {AGE_OPTIONS.filter(a => Number(a) >= Number(minAge)).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              {/* Mother Tongue */}
              <div>
                <label style={labelStyle}>{t('search.motherTongue')}</label>
                <div style={{ position: 'relative' }}>
                  <select style={sel} value={motherTongueId} onChange={e => setMotherTongueId(e.target.value)}>
                    <option value="">{t('search.motherTonguePlaceholder')}</option>
                    {motherTongues.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={handleSearch}
                className="btn-primary"
                style={{ padding: '15px 60px', fontSize: '1rem' }}
              >
                🔍 {t('search.searchBtn')}
              </button>
            </div>
          </div>
        </div>
      </AnimIn>
    </section>
  );
}
