'use client';

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
// NAV_LINKS imported inline below with translation keys
import { useAuthStore } from '@/store/authStore';
import { logoutFromAPI } from '@/lib/auth';
import { useTranslation } from '@/hooks/useTranslation';
import LanguageSwitcher from '@/components/shared/LanguageSwitcher';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Notif {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const NOTIF_ICONS: Record<string, string> = {
  NEW_MATCH:          '💞',
  PROFILE_VIEW:       '👁️',
  MESSAGE:            '💬',
  INTEREST_RECEIVED:  '💌',
  BOOKING_REQUEST:    '📅',
  BOOKING_CONFIRMED:  '✅',
  BOOKING_CANCELLED:  '❌',
  SYSTEM:             '🔔',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotificationBell({ token, navSolid }: { token: string | null; navSolid: boolean }) {
  const router = useRouter();
  const [open,        setOpen]        = useState(false);
  const [notifs,      setNotifs]      = useState<Notif[]>([]);
  const [unread,      setUnread]      = useState(0);
  const [loading,     setLoading]     = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  async function fetchUnread() {
    if (!token) return;
    try {
      const r = await fetch(`${API}/api/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); setUnread(d.count ?? 0); }
    } catch { /* silent */ }
  }

  async function fetchNotifs() {
    if (!token) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/notifications?page=1`, { headers: { Authorization: `Bearer ${token}` } });
      if (r.ok) { const d = await r.json(); setNotifs(d.notifications ?? []); }
    } catch { /* silent */ } finally { setLoading(false); }
  }

  async function markAll() {
    if (!token) return;
    await fetch(`${API}/api/notifications/mark-all-read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    setUnread(0);
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  async function handleClick(n: Notif) {
    if (!n.isRead && token) {
      await fetch(`${API}/api/notifications/${n.id}/read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      setUnread(u => Math.max(0, u - 1));
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  }

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    if (open) fetchNotifs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const iconColor = navSolid ? '#5A4A3A' : 'white';

  return (
    <div ref={dropRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: navSolid ? 'rgba(244,164,53,0.1)' : 'rgba(255,255,255,0.15)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.1rem', position: 'relative', transition: 'background .2s',
          color: iconColor,
        }}
        title="Notifications"
      >
        🔔
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -2, right: -2,
            background: '#E85AA3', color: 'white',
            borderRadius: '50%', width: 16, height: 16,
            fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Outfit',sans-serif", border: '2px solid white',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 44, right: 0,
          width: 340, background: 'white',
          borderRadius: 20, boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
          border: '1px solid #F0E4D0', zIndex: 500, overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid #F5EDE0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, color: '#2A1A1A' }}>Notifications</span>
            {unread > 0 && (
              <button onClick={markAll} style={{ fontSize: 11, color: '#F4A435', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {loading && (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontSize: 13 }}>Loading…</div>
            )}
            {!loading && notifs.length === 0 && (
              <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🔕</div>
                <p style={{ color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontSize: 13, margin: 0 }}>No notifications yet</p>
              </div>
            )}
            {!loading && notifs.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  padding: '12px 20px', display: 'flex', gap: 12, alignItems: 'flex-start',
                  cursor: 'pointer', background: n.isRead ? 'white' : '#FFF8F0',
                  borderBottom: '1px solid #F5EDE0', transition: 'background .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FFF3E0')}
                onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? 'white' : '#FFF8F0')}
              >
                <span style={{ fontSize: '1.4rem', flexShrink: 0, marginTop: 1 }}>{NOTIF_ICONS[n.type] ?? '🔔'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: n.isRead ? 500 : 700, fontSize: 13, color: '#2A1A1A', fontFamily: "'Outfit',sans-serif", marginBottom: 2 }}>{n.title}</div>
                  <div style={{ fontSize: 12, color: '#7A6A5A', fontFamily: "'Outfit',sans-serif", lineHeight: 1.5, marginBottom: 4 }}>{n.body}</div>
                  <div style={{ fontSize: 10, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>{timeAgo(n.createdAt)}</div>
                </div>
                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E85AA3', flexShrink: 0, marginTop: 5 }} />}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ padding: '10px 20px', borderTop: '1px solid #F5EDE0', textAlign: 'center' }}>
            <Link href="/dashboard/notifications" onClick={() => setOpen(false)} style={{ fontSize: 12, color: '#F4A435', fontWeight: 700, textDecoration: 'none', fontFamily: "'Outfit',sans-serif" }}>
              View all notifications →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

const NAV_ITEMS = [
  { key: 'nav.home',           href: '/'         },
  { key: 'nav.about',          href: '/about'     },
  { key: 'nav.browseProfiles', href: '/browse'    },
  { key: 'nav.partners',       href: '/partners'  },
  { key: 'nav.blog',           href: '/blog'      },
  { key: 'nav.contact',        href: '/contact'   },
] as const;

export default function Navbar() {
  const [navSolid, setNavSolid] = useState(false);
  const router = useRouter();
  const { isAuthenticated, _hasHydrated, token, clearAuth } = useAuthStore();
  const loggedIn = _hasHydrated && isAuthenticated;
  const { t } = useTranslation();

  // Shared style for all pill buttons/links in the nav action row
  const pillBase: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
    borderRadius: 50,
    fontFamily: "'Outfit',sans-serif",
    fontWeight: 600,
    fontSize: '0.84rem',
    lineHeight: 1,
    padding: '0 20px',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  };

  useEffect(() => {
    const fn = () => setNavSolid(window.scrollY > 60);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  async function handleLogout() {
    try {
      if (token) await logoutFromAPI(token);
    } catch { /* ignore */ }
    clearAuth();
    toast.success('Logged out successfully');
    router.push('/');
  }

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 300,
        background: navSolid ? 'rgba(255,251,247,0.97)' : 'transparent',
        backdropFilter: navSolid ? 'blur(24px)' : 'none',
        boxShadow: navSolid ? '0 2px 32px rgba(244,164,53,0.1)' : 'none',
        borderBottom: navSolid ? '1px solid rgba(244,164,53,0.08)' : 'none',
        transition: 'all 0.45s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      <div
        style={{
          maxWidth: 1300,
          margin: '0 auto',
          padding: '0 5%',
          display: 'flex',
          alignItems: 'center',
          height: 72,
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#F4A435,#E8735A)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0,
              animation: 'heartbeat 2.8s ease-in-out infinite',
              boxShadow: '0 4px 16px rgba(244,164,53,0.45)',
            }}
          >
            ♥
          </div>
          <span
            style={{
              fontFamily: "'Playfair Display',serif",
              fontWeight: 800,
              fontSize: '1.1rem',
              color: navSolid ? '#2A1A1A' : 'white',
              transition: 'color 0.4s',
              whiteSpace: 'nowrap',
              lineHeight: 1,
            }}
          >
            The Wedding Partners
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="nav-d" style={{ display: 'flex', alignItems: 'center', gap: 28, marginLeft: 'auto', paddingLeft: 48 }}>
          {NAV_ITEMS.map(({ key, href }) => (
            <Link
              key={key}
              href={href}
              className="nl"
              style={{
                color: navSolid ? '#3A2A1A' : 'rgba(255,255,255,0.92)',
                textDecoration: 'none',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
                height: 36,
                whiteSpace: 'nowrap',
              }}
            >
              {t(key)}
            </Link>
          ))}
          <LanguageSwitcher variant={navSolid ? 'dark' : 'light'} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginLeft: 8 }}>
            {loggedIn ? (
              <>
                <NotificationBell token={token} navSolid={navSolid} />
                <Link
                  href="/dashboard"
                  style={{
                    ...pillBase,
                    background: 'transparent',
                    border: `1.5px solid ${navSolid ? '#F4A435' : 'rgba(255,255,255,0.45)'}`,
                    color: navSolid ? '#E8735A' : 'white',
                  }}
                >
                  🏠 {t('nav.dashboard')}
                </Link>
                <button
                  onClick={handleLogout}
                  style={{
                    ...pillBase,
                    background: 'linear-gradient(135deg,#F4A435,#E8735A)',
                    border: 'none',
                    color: 'white',
                  }}
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  style={{
                    ...pillBase,
                    background: 'transparent',
                    border: `1.5px solid ${navSolid ? '#F4A435' : 'rgba(255,255,255,0.45)'}`,
                    color: navSolid ? '#E8735A' : 'white',
                  }}
                >
                  {t('nav.login')}
                </Link>
                <Link
                  href="/signup"
                  style={{
                    ...pillBase,
                    background: 'linear-gradient(135deg,#F4A435,#E8735A)',
                    border: 'none',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(244,164,53,0.4)',
                  }}
                >
                  {t('nav.signUp')} ♥
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
