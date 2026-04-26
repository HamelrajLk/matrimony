'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import AnimIn from '@/components/landing/ui/AnimIn';
import { PARTNER_TYPES } from '@/lib/partners-data';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

/* ─── Petal Rain ─── */
const PETALS = [
  { l: '3%', d: 0, dur: 9 }, { l: '11%', d: 2.2, dur: 7 }, { l: '20%', d: 1, dur: 11 },
  { l: '30%', d: 3.5, dur: 8 }, { l: '41%', d: 0.5, dur: 10 }, { l: '52%', d: 2.8, dur: 7.5 },
  { l: '62%', d: 1.5, dur: 9.5 }, { l: '72%', d: 4, dur: 8 }, { l: '82%', d: 0.8, dur: 11 },
  { l: '91%', d: 2.2, dur: 7 }, { l: '97%', d: 1.2, dur: 8.5 },
];
const EMOJIS = ['🌸', '🌺', '✿', '🌼'];

interface DBPartner {
  id: number;
  businessName: string;
  bio: string | null;
  logoImage: string | null;
  bannerPath: string | null;
  yearsOfExperience: number | null;
  types: { type: string }[];
  addresses: { city: string; countryCode: string }[];
}

function PartnerCard({ p, color, gradient, icon, typeSlug }: {
  p: DBPartner; color: string; gradient: string; icon: string; typeSlug: string;
}) {
  const location = p.addresses[0]
    ? [p.addresses[0].city, p.addresses[0].countryCode].filter(Boolean).join(', ')
    : 'Sri Lanka';
  const hasLogo = !!p.logoImage;

  return (
    <Link href={`/partners/${typeSlug}/${p.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: 'white', borderRadius: 20, overflow: 'hidden',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)', border: '1px solid rgba(0,0,0,0.05)',
          transition: 'transform .22s, box-shadow .22s', cursor: 'pointer',
          display: 'flex', flexDirection: 'column', height: '100%',
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
        {/* ── Logo strip (always gradient bg + centered logo) ── */}
        <div style={{ position: 'relative', height: 190, flexShrink: 0, overflow: 'hidden', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {hasLogo ? (
            <div style={{ width: 110, height: 110, borderRadius: 22, overflow: 'hidden', background: 'white', boxShadow: '0 6px 28px rgba(0,0,0,0.18)', padding: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={p.logoImage!} alt={p.businessName} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 14 }} />
            </div>
          ) : (
            <div style={{ width: 100, height: 100, borderRadius: 22, background: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.8rem' }}>
              {icon}
            </div>
          )}

          {/* Service type chip */}
          {p.types[0] && (() => {
            const tInfo = PARTNER_TYPES.find(pt => pt.type === p.types[0].type);
            return tInfo ? (
              <span style={{
                position: 'absolute', top: 12, left: 12,
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
                color: '#2A1A1A', borderRadius: 50, padding: '4px 12px',
                fontSize: 11, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
                boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              }}>{tInfo.icon} {tInfo.label}</span>
            ) : null;
          })()}
        </div>

        {/* ── Info ── */}
        <div style={{ padding: '16px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h3 style={{
            fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16,
            color: '#1A0E0E', margin: 0, lineHeight: 1.3,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {p.businessName}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>📍 {location}</span>
            {p.yearsOfExperience != null && (
              <>
                <span style={{ color: '#D0C0B0', fontSize: 11 }}>·</span>
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

          {/* CTA */}
          <div style={{
            marginTop: 'auto', paddingTop: 10, borderTop: '1px solid #F5EDE0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {p.types.slice(1, 3).map(t => {
                const tInfo = PARTNER_TYPES.find(pt => pt.type === t.type);
                return tInfo ? (
                  <span key={t.type} style={{ fontSize: 10, background: `${color}12`, color, borderRadius: 50, padding: '2px 9px', fontWeight: 600, fontFamily: "'Outfit',sans-serif", border: `1px solid ${color}20` }}>
                    {tInfo.icon} {tInfo.label}
                  </span>
                ) : null;
              })}
            </div>
            <span style={{
              fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
              color, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap',
            }}>
              View Profile <span style={{ fontSize: 14 }}>→</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div style={{
      background: 'white', borderRadius: 18, padding: 18,
      border: '1px solid #F0E4D0', boxShadow: '0 3px 14px rgba(0,0,0,0.05)',
    }}>
      <div style={{ display: 'flex', gap: 13, marginBottom: 10 }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: '#F5EDE0', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ height: 14, background: '#F5EDE0', borderRadius: 6, marginBottom: 8, width: '70%' }} />
          <div style={{ height: 11, background: '#F5EDE0', borderRadius: 6, width: '50%' }} />
        </div>
      </div>
      <div style={{ height: 11, background: '#F5EDE0', borderRadius: 6, marginBottom: 6 }} />
      <div style={{ height: 11, background: '#F5EDE0', borderRadius: 6, width: '60%' }} />
    </div>
  );
}

export default function PartnersPage() {
  const [data, setData] = useState<Record<string, { list: DBPartner[]; total: number }>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAll() {
      try {
        const results = await Promise.all(
          PARTNER_TYPES.map(async t => {
            const res = await fetch(`${API}/api/partners/list?type=${t.type}&page=1`, { cache: 'no-store' });
            if (!res.ok) return { type: t.type, list: [], total: 0 };
            const json = await res.json();
            return { type: t.type, list: (json.partners ?? []).slice(0, 6), total: json.total ?? 0 };
          })
        );
        const map: Record<string, { list: DBPartner[]; total: number }> = {};
        for (const r of results) map[r.type] = { list: r.list, total: r.total };
        setData(map);
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, []);

  const hasAnyPartners = Object.values(data).some(d => d.list.length > 0);

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7', fontFamily: "'Outfit',sans-serif", position: 'relative' }}>
      {/* Petals */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {PETALS.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: p.l, top: '-40px',
            fontSize: i % 3 === 0 ? '1.4rem' : '0.95rem',
            animation: `petalFall ${p.dur}s linear ${p.d}s infinite`, opacity: 0.45,
          }}>{EMOJIS[i % 4]}</div>
        ))}
      </div>

      <Navbar />

      {/* Hero */}
      <div style={{
        paddingTop: 72,
        background: 'linear-gradient(135deg,#FF7E5F 0%,#FEB47B 35%,#FF6EB4 65%,#A78BFA 100%)',
        backgroundSize: '200% 200%', animation: 'gradShift 10s ease infinite',
        padding: '100px 5% 70px', textAlign: 'center',
        position: 'relative', zIndex: 1, overflow: 'hidden',
      }}>
        <AnimIn>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: 50,
            padding: '7px 22px', marginBottom: 22,
          }}>
            <span style={{ color: 'white', fontSize: '0.77rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              🌟 Verified Wedding Service Providers
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display',serif", fontWeight: 800,
            fontSize: 'clamp(2rem,4.5vw,3.4rem)', color: 'white', margin: '0 0 16px',
          }}>
            Our Wedding Partners
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1.02rem', maxWidth: 580, margin: '0 auto', lineHeight: 1.8 }}>
            From photographers to caterers — every service you need for your perfect wedding day, all in one trusted marketplace.
          </p>
        </AnimIn>
      </div>

      {/* Category Quick-Nav */}
      <div style={{
        position: 'sticky', top: 72, zIndex: 10,
        background: 'rgba(255,251,247,0.97)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(244,164,53,0.12)',
        boxShadow: '0 2px 16px rgba(244,164,53,0.07)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 5%' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 0' }}>
            {PARTNER_TYPES.map(t => (
              <button
                key={t.type}
                onClick={() => {
                  const el = document.getElementById(`section-${t.type}`);
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                style={{
                  flexShrink: 0, borderRadius: 50, padding: '7px 16px',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif", transition: 'all .2s',
                  background: 'white', color: '#5A4A3A',
                  border: '1.5px solid #E8D5C0',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = t.gradient;
                  (e.currentTarget as HTMLButtonElement).style.color = 'white';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = `0 4px 14px ${t.color}35`;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'white';
                  (e.currentTarget as HTMLButtonElement).style.color = '#5A4A3A';
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#E8D5C0';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none';
                }}
              >
                <span>{t.icon}</span>
                <span>{t.plural}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 5% 80px', position: 'relative', zIndex: 1 }}>

        {/* No partners at all */}
        {!loading && !hasAnyPartners && (
          <AnimIn>
            <div style={{
              background: 'white', borderRadius: 24, border: '1px dashed #F0E4D0',
              padding: '80px 20px', textAlign: 'center', marginBottom: 60,
            }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>💒</div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", color: '#2A1A1A', margin: '0 0 10px' }}>No Partners Yet</h3>
              <p style={{ color: '#7A6A5A', fontSize: 14, margin: '0 0 24px' }}>Be the first wedding service provider to join our platform.</p>
              <Link href="/signup?role=PARTNER" style={{
                background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white',
                borderRadius: 50, padding: '12px 32px', fontWeight: 700, fontSize: 14,
                textDecoration: 'none',
              }}>Register as a Partner →</Link>
            </div>
          </AnimIn>
        )}

        {PARTNER_TYPES.map((typeInfo, ti) => {
          const typeSlug = typeInfo.type.toLowerCase().replace(/_/g, '-');
          const section = data[typeInfo.type];
          const list = section?.list ?? [];
          const total = section?.total ?? 0;
          const hasMore = total > 6;

          // Skip empty sections once loaded (unless still loading)
          if (!loading && list.length === 0) return null;

          return (
            <div key={typeInfo.type} id={`section-${typeInfo.type}`} style={{ marginBottom: 72, scrollMarginTop: 160 }}>
              <AnimIn delay={ti * 50}>
                {/* Section header */}
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
                      <div style={{
                        width: 50, height: 50, borderRadius: 16, flexShrink: 0,
                        background: typeInfo.gradient, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '1.5rem',
                        boxShadow: `0 6px 20px ${typeInfo.color}30`,
                      }}>{typeInfo.icon}</div>
                      <div>
                        <h2 style={{
                          fontFamily: "'Playfair Display',serif", fontWeight: 800,
                          fontSize: 'clamp(1.4rem,2.2vw,1.9rem)', color: '#2A1A1A', margin: 0,
                        }}>
                          {typeInfo.plural}
                          {!loading && total > 0 && (
                            <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, color: '#9A8A7A', marginLeft: 10 }}>
                              ({total})
                            </span>
                          )}
                        </h2>
                        <p style={{ fontSize: 13, color: '#7A6A5A', margin: '3px 0 0', fontFamily: "'Outfit',sans-serif" }}>{typeInfo.desc}</p>
                      </div>
                    </div>
                    <div style={{ width: 50, height: 3, background: typeInfo.gradient, borderRadius: 4 }} />
                  </div>
                  {hasMore && (
                    <Link
                      href={`/partners/${typeSlug}`}
                      style={{
                        background: typeInfo.gradient, color: 'white', borderRadius: 50,
                        padding: '10px 24px', fontWeight: 700, fontSize: 14,
                        textDecoration: 'none', fontFamily: "'Outfit',sans-serif",
                        boxShadow: `0 6px 20px ${typeInfo.color}30`,
                        transition: 'transform .2s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = 'translateY(-2px)'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ''; }}
                    >
                      View All {total} {typeInfo.plural} →
                    </Link>
                  )}
                </div>

                {/* Cards grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
                  {loading
                    ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
                    : list.map(p => (
                        <PartnerCard
                          key={p.id}
                          p={p}
                          color={typeInfo.color}
                          gradient={typeInfo.gradient}
                          icon={typeInfo.icon}
                          typeSlug={typeSlug}
                        />
                      ))
                  }
                </div>

                {hasMore && (
                  <div style={{ textAlign: 'center', marginTop: 24 }}>
                    <Link
                      href={`/partners/${typeSlug}`}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        border: `2px solid ${typeInfo.color}`, color: typeInfo.color,
                        borderRadius: 50, padding: '10px 28px', fontWeight: 700, fontSize: 14,
                        textDecoration: 'none', fontFamily: "'Outfit',sans-serif",
                        transition: 'all .2s',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLAnchorElement).style.background = typeInfo.color;
                        (e.currentTarget as HTMLAnchorElement).style.color = 'white';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
                        (e.currentTarget as HTMLAnchorElement).style.color = typeInfo.color;
                      }}
                    >
                      {typeInfo.icon} View More {typeInfo.plural}
                    </Link>
                  </div>
                )}

                {/* Divider */}
                {ti < PARTNER_TYPES.length - 1 && (
                  <div style={{ height: 1, background: 'linear-gradient(90deg,transparent,#F0E4D0,transparent)', marginTop: 60 }} />
                )}
              </AnimIn>
            </div>
          );
        })}

        {/* Register CTA */}
        <AnimIn>
          <div style={{
            background: 'linear-gradient(135deg,#E85AA3,#7B8FE8)',
            borderRadius: 32, padding: '60px 40px', textAlign: 'center',
            boxShadow: '0 16px 50px rgba(232,90,163,0.25)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16 }}>🌟</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 'clamp(1.6rem,3vw,2.2rem)', color: 'white', margin: '0 0 14px' }}>
              Are You a Wedding Service Provider?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 15, maxWidth: 480, margin: '0 auto 28px', lineHeight: 1.78 }}>
              Join our growing network of verified wedding partners and reach thousands of couples planning their perfect day.
            </p>
            <Link href="/signup?role=PARTNER" style={{
              background: 'white', color: '#E85AA3', borderRadius: 50,
              padding: '13px 36px', fontWeight: 700, fontSize: 15, textDecoration: 'none',
            }}>
              Register as a Partner →
            </Link>
          </div>
        </AnimIn>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}><Footer /></div>
    </div>
  );
}
