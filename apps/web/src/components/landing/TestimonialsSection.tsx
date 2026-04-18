'use client';

import { useState, useEffect } from 'react';
import AnimIn from './ui/AnimIn';
import { TESTIMONIALS } from '@/lib/landing-data';
import { useTranslation } from '@/hooks/useTranslation';

export default function TestimonialsSection() {
  const [activeTesti, setActiveTesti] = useState(0);
  const { t } = useTranslation();

  useEffect(() => {
    const t = setInterval(
      () => setActiveTesti((p) => (p + 1) % TESTIMONIALS.length),
      4500
    );
    return () => clearInterval(t);
  }, []);

  const current = TESTIMONIALS[activeTesti];

  return (
    <section style={{ background: '#FFFBF7', padding: '100px 5%' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <AnimIn>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <span
              style={{
                fontFamily: "'Outfit',sans-serif",
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: '#4ABEAA',
                textTransform: 'uppercase',
              }}
            >
              ✦ Love Stories ✦
            </span>
            <h2
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: 'clamp(1.9rem,3vw,2.8rem)',
                fontWeight: 800,
                color: '#2A1A1A',
                marginTop: 12,
              }}
            >
              {t('testimonials.heading')}
            </h2>
            <div
              style={{
                width: 64,
                height: 3,
                background: 'linear-gradient(90deg,#4ABEAA,#F4A435)',
                borderRadius: 2,
                margin: '18px auto 0',
              }}
            />
          </div>
        </AnimIn>

        <AnimIn>
          <div
            key={activeTesti}
            style={{
              background: 'white',
              borderRadius: 28,
              padding: '52px 56px',
              boxShadow: '0 20px 72px rgba(244,164,53,0.09)',
              border: '1.5px solid rgba(244,164,53,0.08)',
              textAlign: 'center',
              maxWidth: 740,
              margin: '0 auto 36px',
              animation: 'fadeSlide 0.5s ease both',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 24 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} style={{ color: '#F4A435', fontSize: '1.1rem' }}>★</span>
              ))}
            </div>
            <p
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: '1.28rem',
                fontStyle: 'italic',
                color: '#2A1A1A',
                lineHeight: 1.78,
                marginBottom: 32,
              }}
            >
              &ldquo;{current.text}&rdquo;
            </p>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: `linear-gradient(135deg,${current.color},${current.color}88)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: "'Playfair Display',serif",
                  fontSize: '1.1rem',
                  fontWeight: 700,
                  color: 'white',
                  boxShadow: `0 4px 16px ${current.color}40`,
                }}
              >
                {current.initials}
              </div>
              <div style={{ textAlign: 'left' }}>
                <div
                  style={{
                    fontFamily: "'Outfit',sans-serif",
                    fontWeight: 700,
                    color: '#2A1A1A',
                    fontSize: '0.95rem',
                  }}
                >
                  {current.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: '0.8rem',
                    color: '#9A8A7A',
                  }}
                >
                  {current.location}
                </div>
              </div>
            </div>
          </div>
        </AnimIn>

        {/* Dot indicators */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {TESTIMONIALS.map((_, i) => (
            <button
              key={i}
              onClick={() => setActiveTesti(i)}
              style={{
                width: i === activeTesti ? 32 : 8,
                height: 8,
                borderRadius: 4,
                background:
                  i === activeTesti
                    ? 'linear-gradient(90deg,#F4A435,#E8735A)'
                    : '#E8DDD0',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.45s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
