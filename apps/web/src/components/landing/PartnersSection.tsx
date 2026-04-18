'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AnimIn from './ui/AnimIn';
import { PARTNER_TYPES } from '@/lib/partners-data';
import { useTranslation } from '@/hooks/useTranslation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/* MATCHMAKER first, then the rest in original order */
const ORDERED = [
  ...PARTNER_TYPES.filter(t => t.type === 'MATCHMAKER'),
  ...PARTNER_TYPES.filter(t => t.type !== 'MATCHMAKER'),
];

function pluralLabel(count: number, type: string) {
  const TYPE_LABEL: Record<string, string> = {
    MATCHMAKER:    'Matchmaker',
    PHOTOGRAPHER:  'Photographer',
    VENUE:         'Venue',
    MAKEUP_ARTIST: 'Makeup Artist',
    DJ_MUSIC:      'DJ & Music Provider',
    FLORIST:       'Florist',
    CATERING:      'Caterer',
    CAKE_DESIGNER: 'Cake Designer',
    VIDEOGRAPHER:  'Videographer',
    TRANSPORT:     'Transport Provider',
  };
  const base = TYPE_LABEL[type] ?? type;
  return count === 1 ? `1 ${base}` : `${count.toLocaleString()}+ ${base}s`;
}

export default function PartnersSection() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetch(`${API}/api/partners/counts`)
      .then(r => r.ok ? r.json() : { counts: {} })
      .then(d => setCounts(d.counts ?? {}))
      .catch(() => {});
  }, []);

  return (
    <section style={{ background: 'white', padding: '100px 5%' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AnimIn>
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <span style={{
              fontFamily: "'Outfit',sans-serif", fontSize: '0.74rem', fontWeight: 700,
              letterSpacing: '0.2em', color: '#E85AA3', textTransform: 'uppercase',
            }}>
              ✦ Wedding Ecosystem ✦
            </span>
            <h2 style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 'clamp(1.9rem,3vw,2.8rem)', fontWeight: 800,
              color: '#2A1A1A', marginTop: 12, lineHeight: 1.2,
            }}>
              {t('partners.heading')}
            </h2>
            <div style={{
              width: 64, height: 3,
              background: 'linear-gradient(90deg,#E85AA3,#7B8FE8)',
              borderRadius: 2, margin: '18px auto',
            }} />
            <p style={{
              fontFamily: "'Outfit',sans-serif", fontSize: '1rem', color: '#7A6A5A',
              maxWidth: 580, margin: '0 auto 52px', lineHeight: 1.78,
            }}>
              {t('partners.subheading')}
            </p>
          </div>
        </AnimIn>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {ORDERED.map((p, i) => {
            const count = counts[p.type] ?? 0;
            const countLabel = count > 0 ? pluralLabel(count, p.type) : 'Coming soon';
            return (
              <AnimIn key={p.type} delay={i * 60} direction="scale">
                <Link
                  href={`/partners/${p.type.toLowerCase().replace(/_/g, '-')}`}
                  style={{ textDecoration: 'none', display: 'block' }}
                >
                  <div
                    className="partner-card"
                    style={{ cursor: 'pointer', height: '100%' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{
                        width: 60, height: 60, borderRadius: 16, flexShrink: 0,
                        background: p.gradient,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1.8rem',
                        boxShadow: `0 6px 18px ${p.color}30`,
                      }}>
                        {p.icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                          fontFamily: "'Playfair Display',serif", fontSize: '1.1rem',
                          fontWeight: 700, color: '#2A1A1A', marginBottom: 5,
                        }}>
                          {p.plural}
                        </h3>
                        <p style={{
                          fontFamily: "'Outfit',sans-serif", fontSize: '0.82rem',
                          color: '#7A6A5A', lineHeight: 1.6, marginBottom: 10,
                        }}>
                          {p.desc}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{
                            fontFamily: "'Outfit',sans-serif", fontSize: '0.74rem', fontWeight: 700,
                            color: p.color, background: `${p.color}10`,
                            padding: '4px 12px', borderRadius: 50, border: `1px solid ${p.color}22`,
                          }}>
                            {countLabel}
                          </span>
                          <span style={{
                            fontSize: '0.75rem', fontWeight: 700, color: p.color,
                            fontFamily: "'Outfit',sans-serif",
                          }}>
                            View All →
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </AnimIn>
            );
          })}
        </div>

        <AnimIn delay={200}>
          <div style={{ textAlign: 'center', marginTop: 52 }}>
            <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.95rem', color: '#7A6A5A', marginBottom: 20 }}>
              Are you a wedding service provider? Join our growing network!
            </p>
            <Link
              href="/signup?role=PARTNER"
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg,#E85AA3,#7B8FE8)',
                boxShadow: '0 8px 28px rgba(232,90,163,0.32)',
                textDecoration: 'none', display: 'inline-block',
              }}
            >
              🌟 Register as a Partner
            </Link>
          </div>
        </AnimIn>
      </div>
    </section>
  );
}
