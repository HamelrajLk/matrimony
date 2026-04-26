'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import AnimIn from '@/components/landing/ui/AnimIn';
import { getPartnerTypeInfo, PARTNER_TYPES } from '@/lib/partners-data';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const PETALS = [
  { l: '4%', d: 0, dur: 9 }, { l: '13%', d: 2.2, dur: 7 }, { l: '24%', d: 1, dur: 11 },
  { l: '36%', d: 3.5, dur: 8 }, { l: '47%', d: 0.5, dur: 10 }, { l: '58%', d: 2.8, dur: 7.5 },
  { l: '69%', d: 1.5, dur: 9.5 }, { l: '79%', d: 4, dur: 8 }, { l: '90%', d: 0.8, dur: 11 },
];
const EMOJIS = ['🌸', '🌺', '✿', '🌼'];

interface DBPartner {
  id: number;
  businessName: string;
  bio: string | null;
  logoImage: string | null;
  bannerPath: string | null;
  website: string | null;
  yearsOfExperience: number | null;
  isVerified: boolean;
  types: { type: string }[];
  addresses: { city: string; countryCode: string }[];
}

function SkeletonCard() {
  return (
    <div style={{ background: 'white', borderRadius: 20, overflow: 'hidden', border: '1px solid #F0E4D0', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
      <div style={{ height: 90, background: 'linear-gradient(135deg,#fdf0e6,#fff5ee)', animation: 'pulse 1.5s ease-in-out infinite' }} />
      <div style={{ padding: '16px' }}>
        <div style={{ height: 14, borderRadius: 8, background: '#F0E4D0', marginBottom: 8, width: '65%' }} />
        <div style={{ height: 11, borderRadius: 6, background: '#F5EDE0', width: '45%', marginBottom: 10 }} />
        <div style={{ height: 30, borderRadius: 6, background: '#F5EDE0', width: '100%' }} />
      </div>
    </div>
  );
}

function PartnerCard({ p, color, gradient, typeKey }: { p: DBPartner; color: string; gradient: string; typeKey: string }) {
  const location = p.addresses[0]
    ? [p.addresses[0].city, p.addresses[0].countryCode].filter(Boolean).join(', ')
    : 'Sri Lanka';
  const hasLogo = !!p.logoImage;

  return (
    <Link href={`/partners/${typeKey}/${p.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        style={{
          background: 'white', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)',
          transition: 'transform .22s, box-shadow .22s', cursor: 'pointer', height: '100%',
          display: 'flex', flexDirection: 'column',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-6px)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 48px ${color}28`;
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.transform = '';
          (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
        }}
      >
        {/* ── Logo strip ── */}
        <div style={{ position: 'relative', height: 190, flexShrink: 0, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {hasLogo ? (
            <div style={{ width: 110, height: 110, borderRadius: 22, overflow: 'hidden', background: 'white', boxShadow: '0 6px 28px rgba(0,0,0,0.18)', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={p.logoImage!} alt={p.businessName} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 14 }} />
            </div>
          ) : (
            <div style={{ width: 100, height: 100, borderRadius: 22, background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.8rem' }}>
              🤝
            </div>
          )}

          {p.isVerified && (
            <span style={{
              position: 'absolute', top: 12, right: 12,
              background: '#4ABEAA', color: 'white', borderRadius: 50,
              padding: '4px 10px', fontSize: 10, fontWeight: 700,
              fontFamily: "'Outfit',sans-serif", boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            }}>✓ Verified</span>
          )}
        </div>

        {/* ── Info ── */}
        <div style={{ padding: '16px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <h3 style={{
            fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16,
            color: '#1A0E0E', margin: 0, lineHeight: 1.3,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {p.businessName}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>📍 {location}</span>
            {p.yearsOfExperience != null && (
              <>
                <span style={{ color: '#D0C0B0', fontSize: 12 }}>·</span>
                <span style={{ fontSize: 12, color, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>{p.yearsOfExperience}+ yrs</span>
              </>
            )}
          </div>

          {p.bio && (
            <p style={{
              fontSize: 12, color: '#7A6A5A', lineHeight: 1.6, margin: 0, flex: 1,
              fontFamily: "'Outfit',sans-serif",
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>{p.bio}</p>
          )}

          {/* Other service types */}
          {p.types.length > 1 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
              {p.types.slice(0, 3).map(t => {
                const info = getPartnerTypeInfo(t.type);
                return info ? (
                  <span key={t.type} style={{ background: `${color}10`, color, borderRadius: 50, padding: '3px 10px', fontSize: 10, fontWeight: 600, border: `1px solid ${color}20`, fontFamily: "'Outfit',sans-serif" }}>
                    {info.icon} {info.label}
                  </span>
                ) : null;
              })}
            </div>
          )}

          <div style={{ paddingTop: 10, marginTop: 'auto', borderTop: '1px solid #F5EDE0', display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'Outfit',sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}>
              View Profile <span style={{ fontSize: 14 }}>→</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function PartnerTypePage() {
  const { type: rawType } = useParams<{ type: string }>();
  const typeKey  = rawType.toLowerCase().replace(/_/g, '-');
  const type     = rawType.toUpperCase().replace(/-/g, '_');
  const typeInfo = getPartnerTypeInfo(type);

  const [partners, setPartners] = useState<DBPartner[]>([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [sortBy,   setSortBy]   = useState<'newest' | 'name' | 'experience'>('newest');
  const [filterVerified, setFilterVerified] = useState(false);

  const fetchPartners = useCallback(async (p: number, sort: string, verified: boolean) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ type, page: String(p) });
      if (verified) q.set('verified', 'true');
      if (sort === 'name') q.set('orderBy', 'name');
      if (sort === 'experience') q.set('orderBy', 'experience');
      const res  = await fetch(`${API}/api/partners/list?${q}`);
      const data = await res.json();
      setPartners(data.partners ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
      setPage(p);
    } catch { /* silent */ } finally { setLoading(false); }
  }, [type]);

  useEffect(() => {
    fetchPartners(1, sortBy, filterVerified);
  }, [fetchPartners, sortBy, filterVerified]);

  if (!typeInfo) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64 }}>😔</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif" }}>Category not found</h2>
          <Link href="/partners" style={{ color: '#E8735A' }}>← Back to Partners</Link>
        </div>
      </div>
    );
  }

  const { color, gradient } = typeInfo;

  const selSt: React.CSSProperties = {
    padding: '8px 12px', borderRadius: 10, border: '1.5px solid #E8D5C0',
    fontFamily: "'Outfit',sans-serif", fontSize: 13, background: 'white',
    color: '#2A1A1A', cursor: 'pointer', outline: 'none',
    appearance: 'none', WebkitAppearance: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7', fontFamily: "'Outfit',sans-serif", position: 'relative' }}>
      {/* Petals */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {PETALS.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: p.l, top: '-40px',
            fontSize: i % 2 === 0 ? '1.3rem' : '0.9rem',
            animation: `petalFall ${p.dur}s linear ${p.d}s infinite`, opacity: 0.45,
          }}>{EMOJIS[i % 4]}</div>
        ))}
      </div>

      <Navbar />

      {/* Hero strip */}
      <div style={{
        paddingTop: 72, background: gradient,
        backgroundSize: '200% 200%', animation: 'gradShift 10s ease infinite',
        padding: '90px 5% 60px', textAlign: 'center',
        position: 'relative', zIndex: 1, overflow: 'hidden',
      }}>
        <AnimIn>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center', marginBottom: 20 }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>Home</Link>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>›</span>
            <Link href="/partners" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>Partners</Link>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>›</span>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{typeInfo.plural}</span>
          </div>
          <div style={{ fontSize: '3.2rem', marginBottom: 14 }}>{typeInfo.icon}</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 'clamp(1.8rem,4vw,3rem)', color: 'white', margin: '0 0 12px' }}>
            {typeInfo.plural}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1rem', maxWidth: 520, margin: '0 auto', lineHeight: 1.8 }}>
            {typeInfo.desc}
          </p>
          <div style={{ marginTop: 16, display: 'inline-flex', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)', borderRadius: 50, padding: '6px 20px' }}>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>
              {loading ? 'Loading…' : `${total} provider${total !== 1 ? 's' : ''} listed`}
            </span>
          </div>
        </AnimIn>
      </div>

      {/* Category quick nav */}
      <div style={{
        position: 'sticky', top: 72, zIndex: 10,
        background: 'rgba(255,251,247,0.97)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(244,164,53,0.12)',
        boxShadow: '0 2px 16px rgba(244,164,53,0.07)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '12px 5%', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {PARTNER_TYPES.map(t => (
            <Link
              key={t.type}
              href={`/partners/${t.type.toLowerCase().replace(/_/g, '-')}`}
              style={{
                flexShrink: 0, borderRadius: 50, padding: '6px 16px', fontSize: 12,
                fontWeight: 600, textDecoration: 'none', fontFamily: "'Outfit',sans-serif",
                transition: 'all .2s',
                background: t.type === type ? t.gradient : 'transparent',
                color:      t.type === type ? 'white'   : '#5A4A3A',
                border: `1.5px solid ${t.type === type ? 'transparent' : '#E8D5C0'}`,
              }}
            >
              {t.icon} {t.plural}
            </Link>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 5% 80px', position: 'relative', zIndex: 1 }}>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 14, color: '#7A6A5A', fontFamily: "'Outfit',sans-serif" }}>
            {loading ? 'Loading…' : (
              <>Showing <strong style={{ color: '#2A1A1A' }}>{partners.length}</strong> of <strong style={{ color: '#2A1A1A' }}>{total}</strong> {typeInfo.plural.toLowerCase()}</>
            )}
          </p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
              <div
                onClick={() => setFilterVerified(v => !v)}
                style={{
                  width: 36, height: 20, borderRadius: 10, cursor: 'pointer', transition: 'background .3s',
                  background: filterVerified ? 'linear-gradient(135deg,#F4A435,#E8735A)' : '#D0C0B0',
                  position: 'relative',
                }}
              >
                <div style={{
                  position: 'absolute', top: 2, width: 16, height: 16,
                  background: 'white', borderRadius: '50%', transition: 'left .3s',
                  left: filterVerified ? 18 : 2,
                }} />
              </div>
              <span style={{ color: '#5A4A3A' }}>Verified only</span>
            </label>
            <select style={selSt} value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)}>
              <option value="newest">Sort: Newest</option>
              <option value="experience">Sort: Most Experienced</option>
              <option value="name">Sort: A–Z</option>
            </select>
          </div>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 20 }}>
            {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Empty state */}
        {!loading && partners.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', background: 'white', borderRadius: 24, border: '1px dashed #F0E4D0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#2A1A1A', marginBottom: 8 }}>
              No {typeInfo.plural.toLowerCase()} found
            </h3>
            <p style={{ color: '#7A6A5A', fontSize: 14, marginBottom: 20, fontFamily: "'Outfit',sans-serif" }}>
              Be the first to join as a {typeInfo.label.toLowerCase()}!
            </p>
            <Link
              href="/signup?role=PARTNER"
              style={{
                display: 'inline-block', background: gradient, color: 'white',
                border: 'none', borderRadius: 50, padding: '12px 32px',
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
                fontFamily: "'Outfit',sans-serif",
              }}
            >
              Register as a Partner
            </Link>
          </div>
        )}

        {/* Grid */}
        {!loading && partners.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 20 }}>
            {partners.map(p => <PartnerCard key={p.id} p={p} color={color} gradient={gradient} typeKey={typeKey} />)}
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 40, flexWrap: 'wrap' }}>
            <button
              onClick={() => fetchPartners(page - 1, sortBy, filterVerified)}
              disabled={page === 1}
              style={{ padding: '8px 18px', borderRadius: 12, border: 'none', background: 'white', color: '#5A4A3A', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', opacity: page === 1 ? 0.4 : 1, fontFamily: "'Outfit',sans-serif" }}
            >← Prev</button>
            {Array.from({ length: pages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => fetchPartners(n, sortBy, filterVerified)}
                style={{
                  width: 38, height: 38, borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif", fontSize: 14,
                  background: n === page ? gradient : 'white',
                  color:      n === page ? 'white'   : '#5A4A3A',
                  fontWeight: n === page ? 700 : 500,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                }}
              >{n}</button>
            ))}
            <button
              onClick={() => fetchPartners(page + 1, sortBy, filterVerified)}
              disabled={page === pages}
              style={{ padding: '8px 18px', borderRadius: 12, border: 'none', background: 'white', color: '#5A4A3A', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', opacity: page === pages ? 0.4 : 1, fontFamily: "'Outfit',sans-serif" }}
            >Next →</button>
          </div>
        )}
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}><Footer /></div>
    </div>
  );
}
