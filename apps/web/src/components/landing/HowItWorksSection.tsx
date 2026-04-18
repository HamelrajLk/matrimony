'use client';
import AnimIn from './ui/AnimIn';
import { STEPS } from '@/lib/landing-data';
import { useTranslation } from '@/hooks/useTranslation';

const stepColors = ['#F4A435', '#E8735A', '#E85AA3', '#7B8FE8'];
const stepColorEnd = ['#FFB347', '#F4A435', '#7B8FE8', '#4ABEAA'];
const stepShadows = [
  'rgba(244,164,53',
  'rgba(232,115,90',
  'rgba(232,90,163',
  'rgba(123,143,232',
];

export default function HowItWorksSection() {
  const { t } = useTranslation();
  return (
    <section
      style={{
        background: 'linear-gradient(155deg,#FFF8F2 0%,#FFF0FA 45%,#F2F0FF 100%)',
        padding: '100px 5%',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <AnimIn>
          <div style={{ textAlign: 'center', marginBottom: 72 }}>
            <span
              style={{
                fontFamily: "'Outfit',sans-serif",
                fontSize: '0.74rem',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: '#7B8FE8',
                textTransform: 'uppercase',
              }}
            >
              ✦ Simple Steps ✦
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
              Your Journey to Forever
              <br />
              <span style={{ fontStyle: 'italic', color: '#7B8FE8' }}>Starts in Minutes</span>
            </h2>
            <div
              style={{
                width: 64,
                height: 3,
                background: 'linear-gradient(90deg,#7B8FE8,#E85AA3)',
                borderRadius: 2,
                margin: '18px auto 0',
              }}
            />
          </div>
        </AnimIn>

        <div
          className="step-g"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 22,
            position: 'relative',
          }}
        >
          {/* Connector line */}
          <div
            style={{
              position: 'absolute',
              top: 50,
              left: '13%',
              right: '13%',
              height: 2,
              background: 'linear-gradient(90deg,#F4A435,#E85AA3,#7B8FE8)',
              opacity: 0.2,
              borderRadius: 1,
              zIndex: 0,
            }}
          />

          {STEPS.map((s, i) => (
            <AnimIn key={s.num} delay={i * 120}>
              <div className="step-card">
                <div
                  style={{
                    position: 'absolute',
                    top: 14,
                    right: 18,
                    fontFamily: "'Playfair Display',serif",
                    fontSize: '4.2rem',
                    fontWeight: 800,
                    color: 'rgba(244,164,53,0.07)',
                    lineHeight: 1,
                  }}
                >
                  {s.num}
                </div>
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg,${stepColors[i]},${stepColorEnd[i]})`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    marginBottom: 20,
                    position: 'relative',
                    zIndex: 1,
                    boxShadow: `0 8px 24px ${stepShadows[i]},0.38)`,
                  }}
                >
                  {s.icon}
                </div>
                <div
                  style={{
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    letterSpacing: '0.15em',
                    color: '#B0A090',
                    textTransform: 'uppercase',
                    marginBottom: 6,
                  }}
                >
                  Step {s.num}
                </div>
                <h3
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: '1.28rem',
                    fontWeight: 700,
                    color: '#2A1A1A',
                    marginBottom: 8,
                  }}
                >
                  {t(s.titleKey)}
                </h3>
                <p
                  style={{
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: '0.86rem',
                    color: '#7A6A5A',
                    lineHeight: 1.68,
                  }}
                >
                  {t(s.descKey)}
                </p>
              </div>
            </AnimIn>
          ))}
        </div>
      </div>
    </section>
  );
}
