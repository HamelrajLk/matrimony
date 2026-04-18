'use client';
import type { CSSProperties } from 'react';
import AnimIn from './ui/AnimIn';
import { FEATURES } from '@/lib/landing-data';
import { useTranslation } from '@/hooks/useTranslation';

export default function FeaturesSection() {
  const { t } = useTranslation();
  return (
    <section style={{ background: '#FFF8F2', padding: '80px 5% 100px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AnimIn>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <span
              style={{
                fontFamily: "'Outfit',sans-serif",
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: '#F4A435',
                textTransform: 'uppercase',
              }}
            >
              ✦ Why Choose Us ✦
            </span>
            <h2
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 'clamp(1.9rem,3vw,2.8rem)',
                fontWeight: 800,
                color: '#2A1A1A',
                marginTop: 12,
                lineHeight: 1.2,
              }}
            >
              {t('features.heading')}
            </h2>
            <div
              style={{
                width: 64,
                height: 3,
                background: 'linear-gradient(90deg,#F4A435,#E8735A)',
                borderRadius: 2,
                margin: '18px auto 0',
              }}
            />
          </div>
        </AnimIn>

        <div
          className="feat-g"
          style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 22 }}
        >
          {FEATURES.map((f, i) => (
            <AnimIn key={f.titleKey} delay={i * 100}>
              <div
                className="feat-card"
                style={{ '--fc': f.color } as CSSProperties}
              >
                <div
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: 18,
                    background: `${f.color}15`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    marginBottom: 22,
                    border: `1.5px solid ${f.color}25`,
                  }}
                >
                  {f.icon}
                </div>
                <h3
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: '1.22rem',
                    fontWeight: 700,
                    color: '#2A1A1A',
                    marginBottom: 10,
                  }}
                >
                  {t(f.titleKey)}
                </h3>
                <p
                  style={{
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: '0.87rem',
                    color: '#7A6A5A',
                    lineHeight: 1.72,
                  }}
                >
                  {t(f.descKey)}
                </p>
                <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontFamily: "'Outfit',sans-serif",
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: f.color,
                    }}
                  >
                    Learn more
                  </span>
                  <span style={{ color: f.color, fontWeight: 700 }}>→</span>
                </div>
              </div>
            </AnimIn>
          ))}
        </div>
      </div>
    </section>
  );
}
