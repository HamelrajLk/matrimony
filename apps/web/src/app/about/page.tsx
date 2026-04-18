'use client';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import AnimIn from '@/components/landing/ui/AnimIn';

/* ─── Petal Rain ─── */
const PETALS = [
  { l: '4%',  d: 0,   dur: 9  }, { l: '12%', d: 2.2, dur: 7  },
  { l: '22%', d: 1,   dur: 11 }, { l: '31%', d: 3.5, dur: 8  },
  { l: '42%', d: 0.5, dur: 10 }, { l: '53%', d: 2.8, dur: 7.5 },
  { l: '63%', d: 1.5, dur: 9.5 }, { l: '73%', d: 4,  dur: 8  },
  { l: '83%', d: 0.8, dur: 11 }, { l: '93%', d: 2.2, dur: 7  },
];
const EMOJIS = ['🌸', '🌺', '✿', '🌼'];

const TEAM = [
  { name: 'Chaminda Perera',  role: 'Founder & CEO',            emoji: '👨‍💼', color: '#F4A435', bio: 'Visionary entrepreneur with 15+ years in tech and matrimony industry across Sri Lanka and the diaspora.' },
  { name: 'Nimesha Silva',    role: 'Head of Matchmaking',      emoji: '💑',   color: '#E85AA3', bio: 'Certified relationship counsellor with deep expertise in Sri Lankan cultural matchmaking traditions.' },
  { name: 'Kasun Fernando',   role: 'CTO',                      emoji: '👨‍💻', color: '#7B8FE8', bio: 'Full-stack engineer and AI specialist, building the matching algorithms that connect thousands of couples.' },
  { name: 'Dilani Jayawardena', role: 'Head of Partner Success', emoji: '🤝',  color: '#4ABEAA', bio: 'Ensures every wedding service partner on our platform delivers world-class experiences to couples.' },
  { name: 'Ravindu Mendis',   role: 'Marketing Director',       emoji: '📣',   color: '#E8735A', bio: 'Brand strategist who has grown our community from 0 to 50,000+ members across 120+ countries.' },
  { name: 'Thilini Rathnayake', role: 'Customer Experience',    emoji: '💬',   color: '#F4A435', bio: 'Dedicated to making every member\'s journey seamless, from first login to their wedding day.' },
];

const VALUES = [
  { icon: '🛡️', title: 'Trust & Safety',         color: '#4ABEAA', desc: 'Every profile is manually reviewed. We use AI and human verification to ensure authenticity across our platform.' },
  { icon: '🌏', title: 'Cultural Sensitivity',    color: '#E85AA3', desc: 'We celebrate Sri Lankan traditions while embracing modern values, serving communities in 120+ countries worldwide.' },
  { icon: '✨', title: 'Innovation',               color: '#7B8FE8', desc: 'Our AI matching engine learns from millions of compatibility signals to surface your most meaningful connections.' },
  { icon: '💍', title: 'Holistic Wedding Support', color: '#F4A435', desc: 'From first match to wedding day, our partner network of 1,000+ vendors ensures every detail is perfect.' },
];

const MILESTONES = [
  { year: '2019', event: 'Founded in Colombo', icon: '🚀' },
  { year: '2020', event: '10,000 members milestone', icon: '🎉' },
  { year: '2021', event: 'Expanded to UK & Australia diaspora', icon: '🌍' },
  { year: '2022', event: 'AI matchmaking engine launched', icon: '🤖' },
  { year: '2023', event: '5,000+ couples successfully matched', icon: '💑' },
  { year: '2024', event: '50,000 profiles · 120+ countries', icon: '🏆' },
];

export default function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7', fontFamily: "'Outfit',sans-serif", position: 'relative' }}>
      {/* Petals */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {PETALS.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: p.l, top: '-40px',
            fontSize: i % 3 === 0 ? '1.4rem' : '0.95rem',
            animation: `petalFall ${p.dur}s linear ${p.d}s infinite`,
            opacity: 0.45,
          }}>
            {EMOJIS[i % 4]}
          </div>
        ))}
      </div>

      <Navbar />

      {/* ── Hero ── */}
      <div style={{
        paddingTop: 72,
        background: 'linear-gradient(135deg,#FF7E5F 0%,#FEB47B 40%,#FF6EB4 75%,#A78BFA 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradShift 10s ease infinite',
        padding: '100px 5% 80px',
        textAlign: 'center',
        position: 'relative', zIndex: 1, overflow: 'hidden',
      }}>
        <AnimIn>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.3)', borderRadius: 50,
            padding: '7px 22px', marginBottom: 24,
          }}>
            <span style={{ color: 'white', fontSize: '0.77rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              🇱🇰 Sri Lanka&apos;s #1 Wedding Platform
            </span>
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display',serif",
            fontWeight: 800, fontSize: 'clamp(2rem,4.5vw,3.6rem)',
            color: 'white', margin: '0 0 18px',
            textShadow: '0 2px 20px rgba(0,0,0,0.15)',
          }}>
            Our Story of Bringing<br />
            <span style={{ fontStyle: 'italic' }}>Hearts Together</span>
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.88)', fontSize: '1.05rem',
            maxWidth: 620, margin: '0 auto',
            lineHeight: 1.8, fontFamily: "'Outfit',sans-serif",
          }}>
            Born from a simple belief — that every Sri Lankan deserves to find love and celebrate it beautifully, wherever in the world they may be.
          </p>
        </AnimIn>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '70px 5% 80px', position: 'relative', zIndex: 1 }}>

        {/* ── Mission ── */}
        <AnimIn>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60,
            alignItems: 'center', marginBottom: 90,
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', color: '#E8735A', textTransform: 'uppercase' }}>✦ Our Mission</span>
              <h2 style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 800, fontSize: 'clamp(1.8rem,3vw,2.6rem)',
                color: '#2A1A1A', margin: '14px 0 20px', lineHeight: 1.2,
              }}>
                More Than Matchmaking —<br />
                <span style={{ fontStyle: 'italic', color: '#E8735A' }}>A Complete Life Journey</span>
              </h2>
              <div style={{ width: 56, height: 3, background: 'linear-gradient(90deg,#F4A435,#E8735A)', borderRadius: 4, marginBottom: 22 }} />
              <p style={{ fontSize: 15, color: '#5A4A3A', lineHeight: 1.9, marginBottom: 18 }}>
                The Wedding Partners was founded with a clear purpose: to bridge the gap between Sri Lankan singles seeking meaningful relationships and the world-class wedding services they deserve.
              </p>
              <p style={{ fontSize: 15, color: '#5A4A3A', lineHeight: 1.9, marginBottom: 24 }}>
                We understand that finding a life partner within your culture, values, and traditions is deeply personal. That's why we've built a platform that respects and celebrates Sri Lankan identity while using cutting-edge AI to make the process effortless.
              </p>
              <div style={{ display: 'flex', gap: 28 }}>
                {[['50K+', 'Members'], ['12K+', 'Couples Matched'], ['120+', 'Countries']].map(([n, l]) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: '1.8rem', color: '#F4A435' }}>{n}</div>
                    <div style={{ fontSize: 12, color: '#9A8A7A', textTransform: 'uppercase', letterSpacing: '0.06em', marginTop: 2 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <div style={{
                background: 'linear-gradient(135deg,#FFF3E0,#FFE4D0)',
                borderRadius: 32, padding: '52px 44px', textAlign: 'center',
                boxShadow: '0 20px 60px rgba(244,164,53,0.12)',
                border: '1px solid rgba(244,164,53,0.15)',
              }}>
                <div style={{ fontSize: '5.5rem', marginBottom: 20 }}>👰‍♀️🤵</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.5rem', fontWeight: 700, color: '#2A1A1A', marginBottom: 12 }}>
                  Founded on Love
                </h3>
                <p style={{ fontSize: 14, color: '#7A6A5A', lineHeight: 1.78 }}>
                  "We started The Wedding Partners because we believed every Sri Lankan deserves to find their perfect match — and celebrate it in style."
                </p>
                <div style={{ marginTop: 20, fontSize: 13, fontWeight: 600, color: '#E8735A' }}>— Chaminda Perera, Founder</div>
              </div>
              {/* Decorative floats */}
              <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '2rem', animation: 'float 4s ease-in-out infinite' }}>💍</div>
              <div style={{ position: 'absolute', bottom: -15, left: -15, fontSize: '1.6rem', animation: 'float 5s ease-in-out 1s infinite' }}>🌸</div>
            </div>
          </div>
        </AnimIn>

        {/* ── Values ── */}
        <AnimIn>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', color: '#7B8FE8', textTransform: 'uppercase' }}>✦ What We Stand For</span>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 'clamp(1.7rem,2.8vw,2.4rem)', color: '#2A1A1A', margin: '14px 0 6px' }}>
              Our Core Values
            </h2>
            <div style={{ width: 56, height: 3, background: 'linear-gradient(90deg,#7B8FE8,#E85AA3)', borderRadius: 4, margin: '0 auto 48px' }} />
          </div>
        </AnimIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 22, marginBottom: 90 }}>
          {VALUES.map((v, i) => (
            <AnimIn key={v.title} delay={i * 100}>
              <div style={{
                background: 'white', borderRadius: 24, padding: '32px 28px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.05)', border: '1px solid #F0E4D0',
                display: 'flex', gap: 20, alignItems: 'flex-start',
              }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 18, flexShrink: 0,
                  background: `${v.color}15`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '1.8rem',
                  border: `1.5px solid ${v.color}25`,
                }}>{v.icon}</div>
                <div>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 17, color: '#2A1A1A', marginBottom: 8 }}>{v.title}</h3>
                  <p style={{ fontSize: 14, color: '#7A6A5A', lineHeight: 1.75, margin: 0 }}>{v.desc}</p>
                </div>
              </div>
            </AnimIn>
          ))}
        </div>

        {/* ── Milestones ── */}
        <AnimIn>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', color: '#4ABEAA', textTransform: 'uppercase' }}>✦ Our Journey</span>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 'clamp(1.7rem,2.8vw,2.4rem)', color: '#2A1A1A', margin: '14px 0 6px' }}>
              Milestones That Matter
            </h2>
            <div style={{ width: 56, height: 3, background: 'linear-gradient(90deg,#4ABEAA,#F4A435)', borderRadius: 4, margin: '0 auto 48px' }} />
          </div>
        </AnimIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22, marginBottom: 90 }}>
          {MILESTONES.map((m, i) => (
            <AnimIn key={m.year} delay={i * 80}>
              <div style={{
                background: 'white', borderRadius: 20, padding: '28px 24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #F0E4D0',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: '2.2rem', marginBottom: 12 }}>{m.icon}</div>
                <div style={{
                  fontFamily: "'Playfair Display',serif",
                  fontWeight: 800, fontSize: '1.5rem', color: '#F4A435', marginBottom: 8,
                }}>{m.year}</div>
                <p style={{ fontSize: 14, color: '#5A4A3A', fontWeight: 500, margin: 0 }}>{m.event}</p>
              </div>
            </AnimIn>
          ))}
        </div>

        {/* ── Team ── */}
        <AnimIn>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.18em', color: '#E85AA3', textTransform: 'uppercase' }}>✦ Meet the Team</span>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 'clamp(1.7rem,2.8vw,2.4rem)', color: '#2A1A1A', margin: '14px 0 6px' }}>
              The People Behind the Magic
            </h2>
            <div style={{ width: 56, height: 3, background: 'linear-gradient(90deg,#E85AA3,#7B8FE8)', borderRadius: 4, margin: '0 auto 48px' }} />
          </div>
        </AnimIn>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22, marginBottom: 90 }}>
          {TEAM.map((t, i) => (
            <AnimIn key={t.name} delay={i * 90}>
              <div style={{
                background: 'white', borderRadius: 24, padding: '32px 24px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.06)', border: '1px solid #F0E4D0',
                textAlign: 'center', transition: 'transform .2s, box-shadow .2s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 16px 40px rgba(0,0,0,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 24px rgba(0,0,0,0.06)'; }}
              >
                <div style={{
                  width: 80, height: 80, borderRadius: '50%', margin: '0 auto 16px',
                  background: `${t.color}18`, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '2.2rem',
                  border: `2px solid ${t.color}30`,
                }}>{t.emoji}</div>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color: '#2A1A1A', marginBottom: 4 }}>{t.name}</h3>
                <div style={{ fontSize: 12, fontWeight: 700, color: t.color, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t.role}</div>
                <p style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.7, margin: 0 }}>{t.bio}</p>
              </div>
            </AnimIn>
          ))}
        </div>

        {/* ── CTA ── */}
        <AnimIn>
          <div style={{
            background: 'linear-gradient(135deg,#FF7E5F,#FEB47B,#FF6EB4)',
            borderRadius: 32, padding: '60px 40px', textAlign: 'center',
            boxShadow: '0 16px 50px rgba(232,115,90,0.25)',
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: 16, animation: 'heartbeat 2.2s ease-in-out infinite' }}>💍</div>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 'clamp(1.7rem,3vw,2.4rem)', color: 'white', margin: '0 0 14px' }}>
              Ready to Start Your Journey?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 15, maxWidth: 480, margin: '0 auto 32px', lineHeight: 1.78 }}>
              Join 50,000+ Sri Lankans worldwide who have found love and planned their perfect wedding on our platform.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="/signup" style={{
                background: 'white', color: '#E8735A', borderRadius: 50,
                padding: '13px 32px', fontWeight: 700, fontSize: 15, textDecoration: 'none',
              }}>♥ Join Free Today</a>
              <a href="/browse" style={{
                background: 'transparent', color: 'white',
                border: '2px solid rgba(255,255,255,0.65)',
                borderRadius: 50, padding: '13px 32px', fontWeight: 700, fontSize: 15, textDecoration: 'none',
              }}>🔍 Browse Profiles</a>
            </div>
          </div>
        </AnimIn>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Footer />
      </div>
    </div>
  );
}
