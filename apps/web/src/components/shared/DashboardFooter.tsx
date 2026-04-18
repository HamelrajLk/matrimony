'use client';
import Link from 'next/link';

const HELP_LINKS = [
  { label: '24/7 Live Support',  href: '/dashboard/support' },
  { label: 'Help & FAQs',        href: '/dashboard/faq' },
  { label: 'Send Feedback',      href: '/dashboard/feedback' },
  { label: 'Safety Tips',        href: '/dashboard/safety' },
  { label: 'Report a Profile',   href: '/dashboard/report' },
];

const QUICK_LINKS = [
  { label: 'Browse Profiles',    href: '/browse' },
  { label: 'Upgrade Plan',       href: '/dashboard/upgrade' },
  { label: 'Partner Portal',     href: '/partners' },
  { label: 'Terms & Conditions', href: '/terms' },
  { label: 'Privacy Policy',     href: '/privacy' },
];

export default function DashboardFooter() {
  return (
    <footer style={{
      background: '#2A1A12',
      fontFamily: "'Outfit',sans-serif",
      marginTop: 'auto',
    }}>
      {/* Main columns */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '48px 24px 32px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr',
          gap: 48,
          marginBottom: 40,
        }}>

          {/* About column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'linear-gradient(135deg,#F4A435,#E8735A)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 'bold', fontSize: 15, flexShrink: 0,
              }}>♥</div>
              <span style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 800, fontSize: '0.95rem', color: 'white',
              }}>
                The Wedding Partners
              </span>
            </div>
            <p style={{
              fontSize: '0.82rem',
              color: 'rgba(200,175,155,0.55)',
              lineHeight: 1.8, maxWidth: 300, marginBottom: 20,
            }}>
              Sri Lanka's trusted matrimony platform connecting hearts worldwide — built on trust, tradition, and technology.
            </p>
            <p style={{
              fontSize: '0.75rem',
              color: 'rgba(200,175,155,0.35)',
              lineHeight: 1.7,
              fontStyle: 'italic',
            }}>
              This website is strictly for matrimonial purposes only and not a dating website.
            </p>
          </div>

          {/* Help & Support */}
          <div>
            <h4 style={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: '#F4A435', marginBottom: 18,
            }}>
              Help &amp; Support
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {HELP_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    style={{
                      fontSize: '0.83rem',
                      color: 'rgba(200,175,155,0.5)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#F4A435')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,175,155,0.5)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{
              fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.15em',
              textTransform: 'uppercase', color: '#F4A435', marginBottom: 18,
            }}>
              Quick Links
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {QUICK_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    style={{
                      fontSize: '0.83rem',
                      color: 'rgba(200,175,155,0.5)',
                      textDecoration: 'none',
                      transition: 'color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#F4A435')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(200,175,155,0.5)')}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: 22,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
        }}>
          <span style={{ fontSize: '0.76rem', color: 'rgba(200,175,155,0.35)' }}>
            © {new Date().getFullYear()} The Wedding Partners. All rights reserved. Made with ♥ for Sri Lankans worldwide.
          </span>
          <span style={{ fontSize: '0.76rem', color: 'rgba(200,175,155,0.3)' }}>
            🇱🇰 Proudly Sri Lankan
          </span>
        </div>
      </div>
    </footer>
  );
}
