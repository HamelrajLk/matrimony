'use client';
import PetalRain from './ui/PetalRain';
import ParticleCanvas from './ui/ParticleCanvas';
import AnimIn from './ui/AnimIn';
import CtaAuthButtons from './CtaAuthButtons';
import { useTranslation } from '@/hooks/useTranslation';

export default function CtaBanner() {
  const { t } = useTranslation();
  return (
    <section
      style={{
        background:
          'linear-gradient(135deg,#FF7E5F 0%,#FEB47B 28%,#FF6EB4 60%,#A78BFA 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradShift 9s ease infinite',
        padding: '100px 5%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <PetalRain />
      <ParticleCanvas count={20} />

      <div
        style={{
          maxWidth: 800,
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 5,
        }}
      >
        <AnimIn>
          <div
            style={{
              fontSize: '3.2rem',
              marginBottom: 20,
              animation: 'heartbeat 2.2s ease-in-out infinite',
            }}
          >
            💍
          </div>
          <h2
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: 'clamp(2rem,4vw,3.2rem)',
              fontWeight: 800,
              color: 'white',
              lineHeight: 1.15,
              marginBottom: 18,
            }}
          >
            {t('cta.heading')}
          </h2>
          <p
            style={{
              fontFamily: "'Outfit',sans-serif",
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.85)',
              marginBottom: 44,
              maxWidth: 480,
              margin: '0 auto 44px',
              lineHeight: 1.78,
            }}
          >
            {t('cta.subheading')}
          </p>
          <CtaAuthButtons />
        </AnimIn>
      </div>
    </section>
  );
}
