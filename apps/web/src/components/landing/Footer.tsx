'use client';

const footerLinks = [
  {
    title: 'Platform',
    links: ['Browse Profiles', 'AI Matchmaking', 'Verified Badges', 'Partner Portal', 'Pricing'],
  },
  {
    title: 'Services',
    links: ['Photographers', 'Wedding Halls', 'Makeup Artists', 'DJ & Music', 'Florists', 'Cake Designers'],
  },
  {
    title: 'Company',
    links: ['About Us', 'Blog', 'Careers', 'Press', 'Privacy Policy', 'Terms of Service'],
  },
];

const socialLinks = [
  { label: 'f' },
  { label: 'in' },
  { label: 'tw' },
  { label: 'ig' },
];

export default function Footer() {
  return (
    <footer style={{ background: '#1C0E08', padding: '72px 5% 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div
          className="foot-g"
          style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 56 }}
        >
          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#F4A435,#E8735A)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.1rem',
                }}
              >
                ♥
              </div>
              <div
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontWeight: 800,
                  fontSize: '1.08rem',
                  color: 'white',
                }}
              >
                The Wedding Partners
              </div>
            </div>
            <p
              style={{
                fontFamily: "'Outfit',sans-serif",
                fontSize: '0.85rem',
                color: 'rgba(200,175,155,0.55)',
                lineHeight: 1.82,
                maxWidth: 278,
                marginBottom: 26,
              }}
            >
              Connecting Sri Lankan hearts worldwide with trust, tradition, and technology since 2024.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              {socialLinks.map((s) => (
                <div
                  key={s.label}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: "'Outfit',sans-serif",
                    fontSize: '0.73rem',
                    fontWeight: 700,
                    color: 'rgba(200,175,155,0.55)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = '#F4A435';
                    (e.currentTarget as HTMLDivElement).style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.06)';
                    (e.currentTarget as HTMLDivElement).style.color = 'rgba(200,175,155,0.55)';
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map(({ title, links }) => (
            <div key={title}>
              <h4
                style={{
                  fontFamily: "'Outfit',sans-serif",
                  fontWeight: 700,
                  fontSize: '0.77rem',
                  color: '#F4A435',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginBottom: 20,
                }}
              >
                {title}
              </h4>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 11 }}>
                {links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      style={{
                        fontFamily: "'Outfit',sans-serif",
                        fontSize: '0.85rem',
                        color: 'rgba(200,175,155,0.5)',
                        textDecoration: 'none',
                        transition: 'color 0.3s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = '#F4A435';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(200,175,155,0.5)';
                      }}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          style={{
            paddingTop: 26,
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div
            style={{
              fontFamily: "'Outfit',sans-serif",
              fontSize: '0.79rem',
              color: 'rgba(200,175,155,0.35)',
            }}
          >
            © 2025 The Wedding Partners. All rights reserved. Made with ♥ for Sri Lankans worldwide.
          </div>
          <div
            style={{
              fontFamily: "'Outfit',sans-serif",
              fontSize: '0.79rem',
              color: 'rgba(200,175,155,0.3)',
            }}
          >
            🇱🇰 Proudly Sri Lankan
          </div>
        </div>
      </div>
    </footer>
  );
}
