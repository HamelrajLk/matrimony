'use client';
import ParticleCanvas from './ui/ParticleCanvas';
import PetalRain from './ui/PetalRain';
import HeroAuthButtons from './HeroAuthButtons';
import { useTranslation } from '@/hooks/useTranslation';

const sparkles = [
  { t: '18%', l: '7%' },
  { t: '32%', l: '50%' },
  { t: '62%', l: '18%' },
  { t: '70%', l: '72%' },
  { t: '22%', l: '82%' },
];

const heroStatNums = ['50,000+', '120+', '12,000+'];
const heroStatKeys = ['hero.stats.profiles', 'hero.stats.countries', 'hero.stats.couples'];

const heroBadges = ['💍 Matrimony', '📸 Photos', '🏛️ Venues', '💄 Makeup', '🎶 Music'];

export default function HeroSection() {
  const { t } = useTranslation();
  return (
    <section
      style={{
        minHeight: '100vh',
        background:
          'linear-gradient(145deg,#FF7E5F 0%,#FEB47B 22%,#FF6EB4 50%,#A78BFA 75%,#60C8F0 100%)',
        backgroundSize: '300% 300%',
        animation: 'gradShift 12s ease infinite',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <ParticleCanvas count={35} />
      <PetalRain />

      {/* Decorative rings */}
      <div
        style={{
          position: 'absolute', right: '-6%', top: '8%',
          width: 500, height: 500,
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%',
          animation: 'spinSlow 45s linear infinite', zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute', right: '2%', top: '18%',
          width: 340, height: 340,
          border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '50%',
          animation: 'spinSlow 30s linear infinite reverse', zIndex: 0,
        }}
      />
      <div
        style={{
          position: 'absolute', left: '-4%', bottom: '-3%',
          width: 320, height: 320,
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: '50%',
          animation: 'spinSlow 38s linear infinite', zIndex: 0,
        }}
      />

      {/* Sparkle dots */}
      {sparkles.map((pos, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            top: pos.t,
            left: pos.l,
            fontSize: i % 2 === 0 ? '1.3rem' : '0.9rem',
            animation: `sparkle ${1.8 + i * 0.4}s ease-in-out ${i * 0.3}s infinite`,
            color: 'rgba(255,255,255,0.7)',
            zIndex: 2,
          }}
        >
          ✦
        </div>
      ))}

      <div
        style={{
          maxWidth: 1300,
          margin: '0 auto',
          padding: '130px 5% 90px',
          position: 'relative',
          zIndex: 5,
          width: '100%',
        }}
      >
        <div
          className="hero-g"
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}
        >
          {/* Left content */}
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255,255,255,0.22)',
                backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: 50,
                padding: '7px 22px',
                marginBottom: 28,
                animation: 'slideUp 0.8s ease 0.2s both',
              }}
            >
              <span
                style={{
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: '0.77rem',
                  color: 'white',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                🇱🇰 {t('hero.tagline')}
              </span>
            </div>

            <h1
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 800,
                fontSize: 'clamp(2.6rem,5.5vw,5rem)',
                color: 'white',
                lineHeight: 1.06,
                letterSpacing: '-0.02em',
                marginBottom: 10,
                animation: 'slideUp 0.8s ease 0.35s both',
              }}
            >
              Find Your Perfect
              <br />
              <span style={{ fontStyle: 'italic', textShadow: '0 0 40px rgba(255,255,255,0.35)' }}>
                Match
              </span>
              <span> &amp; Plan Your</span>
            </h1>

            <h2
              style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 700,
                fontSize: 'clamp(1.5rem,3vw,2.7rem)',
                color: 'rgba(255,255,255,0.88)',
                marginBottom: 26,
                letterSpacing: '-0.01em',
                animation: 'slideUp 0.8s ease 0.5s both',
              }}
            >
              Dream Wedding 💍
            </h2>

            <p
              style={{
                fontFamily: "'Outfit',sans-serif",
                fontSize: '1.05rem',
                color: 'rgba(255,255,255,0.84)',
                lineHeight: 1.78,
                maxWidth: 500,
                marginBottom: 46,
                fontWeight: 300,
                animation: 'slideUp 0.8s ease 0.65s both',
              }}
            >
              {t('hero.subline')}
            </p>

            <div
              style={{
                display: 'flex',
                gap: 14,
                flexWrap: 'wrap',
                marginBottom: 52,
                animation: 'slideUp 0.8s ease 0.8s both',
              }}
            >
              <HeroAuthButtons />
            </div>

            {/* Stats */}
            <div
              className="stat-g"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 18,
                animation: 'slideUp 0.8s ease 0.95s both',
              }}
            >
              {heroStatNums.map((n, i) => (
                <div
                  key={heroStatKeys[i]}
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: 16,
                    padding: '18px 14px',
                    textAlign: 'center',
                    border: '1px solid rgba(255,255,255,0.28)',
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      color: 'white',
                      lineHeight: 1,
                    }}
                  >
                    {n}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Outfit',sans-serif",
                      fontSize: '0.7rem',
                      color: 'rgba(255,255,255,0.72)',
                      marginTop: 4,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {t(heroStatKeys[i])}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right floating card */}
          <div className="hero-r" style={{ display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                background: 'rgba(255,255,255,0.22)',
                backdropFilter: 'blur(22px)',
                border: '1px solid rgba(255,255,255,0.38)',
                borderRadius: 32,
                padding: '44px 40px',
                textAlign: 'center',
                maxWidth: 360,
                animation: 'float 4.5s ease-in-out infinite',
                boxShadow: '0 32px 80px rgba(0,0,0,0.14)',
              }}
            >
              <div
                style={{
                  fontSize: '5rem',
                  marginBottom: 18,
                  lineHeight: 1,
                  filter: 'drop-shadow(0 4px 14px rgba(0,0,0,0.15))',
                }}
              >
                👰‍♀️🤵
              </div>
              <h3
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: '1.45rem',
                  fontWeight: 700,
                  color: 'white',
                  marginBottom: 10,
                }}
              >
                Your Complete Wedding Hub
              </h3>
              <p
                style={{
                  fontFamily: "'Outfit',sans-serif",
                  fontSize: '0.87rem',
                  color: 'rgba(255,255,255,0.8)',
                  lineHeight: 1.72,
                  marginBottom: 24,
                }}
              >
                From finding your soulmate to booking photographers, venues &amp; more — all in one
                platform.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                {heroBadges.map((s) => (
                  <span
                    key={s}
                    style={{
                      background: 'rgba(255,255,255,0.22)',
                      borderRadius: 50,
                      padding: '5px 12px',
                      fontFamily: "'Outfit',sans-serif",
                      fontSize: '0.74rem',
                      color: 'white',
                      fontWeight: 600,
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Wavy bottom */}
      <div style={{ position: 'absolute', bottom: -1, left: 0, right: 0, zIndex: 4 }}>
        <svg
          viewBox="0 0 1440 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ display: 'block', width: '100%' }}
        >
          <path
            d="M0 45C180 90 360 0 540 45C720 90 900 0 1080 45C1260 90 1350 20 1440 45V90H0V45Z"
            fill="#FFFBF7"
          />
        </svg>
      </div>
    </section>
  );
}
