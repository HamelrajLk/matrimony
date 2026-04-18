'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { logoutFromAPI } from '@/lib/auth';
import DashboardFooter from '@/components/shared/DashboardFooter';
import api from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// All possible service tabs — shown only when the partner has that service type
const SERVICE_TAB_MAP: Record<string, { label: string; icon: string; href: string }> = {
  MATCHMAKER:    { label: 'Matchmaker',   icon: '💑', href: '/partners/dashboard/matchmaker' },
  PHOTOGRAPHER:  { label: 'Photographer', icon: '📸', href: '/partners/dashboard/photographer' },
  VIDEOGRAPHER:  { label: 'Videographer', icon: '🎬', href: '/partners/dashboard/videographer' },
  VENUE:         { label: 'Venue',        icon: '🏛️', href: '/partners/dashboard/venue' },
  CATERING:      { label: 'Catering',     icon: '🍽️', href: '/partners/dashboard/catering' },
  MAKEUP_ARTIST: { label: 'Makeup Artist',icon: '💄', href: '/partners/dashboard/makeup-artist' },
  FLORIST:       { label: 'Florist',      icon: '💐', href: '/partners/dashboard/florist' },
  DJ_MUSIC:      { label: 'DJ / Music',   icon: '🎵', href: '/partners/dashboard/dj-music' },
  CAKE_DESIGNER: { label: 'Cake Designer',icon: '🎂', href: '/partners/dashboard/cake-designer' },
  TRANSPORT:     { label: 'Transport',    icon: '🚗', href: '/partners/dashboard/transport' },
  OTHER:         { label: 'Other',        icon: '✨', href: '/partners/dashboard/other' },
};

const DASHBOARD_TAB = { label: 'Dashboard', icon: '📊', href: '/partners/dashboard' };
const BOOKINGS_TAB  = { label: 'Bookings',   icon: '📅', href: '/partners/dashboard/bookings' };

// Service types that support bookings (matchmakers use inquiries/consultations, not bookings)
const BOOKABLE_TYPES = new Set(['PHOTOGRAPHER', 'VIDEOGRAPHER', 'VENUE', 'CATERING', 'MAKEUP_ARTIST', 'FLORIST', 'DJ_MUSIC', 'CAKE_DESIGNER', 'TRANSPORT', 'OTHER']);

export default function PartnerDashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { user, token, isAuthenticated, _hasHydrated, clearAuth } = useAuthStore();

  const [menuOpen,      setMenuOpen]      = useState(false);
  const [bellOpen,      setBellOpen]      = useState(false);
  const [partnerName,   setPartnerName]   = useState('');
  const [serviceTypes,  setServiceTypes]  = useState<string[]>([]);
  const [tabsLoaded,    setTabsLoaded]    = useState(false);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [notifList,     setNotifList]     = useState<{ id: number; title: string; body: string; isRead: boolean; createdAt: string }[]>([]);
  const [planLabel,     setPlanLabel]     = useState<string | null>(null);
  const [planColor,     setPlanColor]     = useState<string>('#9A8A7A');

  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  /* auth guard */
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, _hasHydrated, router]);

  /* load partner info — name + service types for dynamic tabs */
  function loadPartnerInfo() {
    if (!token) return;
    fetch(`${API}/api/partners/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.partner) {
          setPartnerName(d.partner.businessName || d.partner.contactPerson || '');
          setServiceTypes((d.partner.types ?? []).map((t: any) => t.type as string));
        }
      })
      .catch(() => {})
      .finally(() => setTabsLoaded(true));
  }

  useEffect(() => { loadPartnerInfo(); }, [token]);

  // Load subscription plan
  useEffect(() => {
    if (!token) return;
    api.get('/api/subscriptions/me')
      .then(res => {
        const sub = res.data.data;
        if (sub && sub.plan && sub.plan.value !== 'FREE') {
          setPlanLabel(sub.plan.label);
          setPlanColor(sub.plan.color);
        } else {
          setPlanLabel(null);
        }
      })
      .catch(() => {});
  }, [token]);

  // Fetch unread count every 30s
  useEffect(() => {
    if (!token) return;
    function fetchUnread() {
      fetch(`${API}/api/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : { count: 0 })
        .then(d => setUnreadCount(d.count ?? 0))
        .catch(() => {});
    }
    fetchUnread();
    const t = setInterval(fetchUnread, 30000);
    return () => clearInterval(t);
  }, [token]);

  async function loadNotifs() {
    if (!token) return;
    fetch(`${API}/api/notifications?page=1`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : { notifications: [] })
      .then(d => setNotifList(d.notifications ?? []))
      .catch(() => {});
  }

  async function markAllRead() {
    if (!token) return;
    await fetch(`${API}/api/notifications/mark-all-read`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    setUnreadCount(0);
    setNotifList(prev => prev.map(n => ({ ...n, isRead: true })));
  }

  /* re-fetch when settings page saves successfully */
  useEffect(() => {
    window.addEventListener('partner-updated', loadPartnerInfo);
    return () => window.removeEventListener('partner-updated', loadPartnerInfo);
  }, [token]);

  /* close dropdowns on outside click */
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  async function handleLogout() {
    try { if (token) await logoutFromAPI(token); } catch { /* silent */ }
    clearAuth();
    router.push('/');
  }

  if (!_hasHydrated || !isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#F4A435,#E8735A)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20 }}>♥</div>
          <p style={{ fontFamily: "'Outfit',sans-serif", color: '#7A6A5A' }}>Loading…</p>
        </div>
      </div>
    );
  }

  const displayName  = partnerName || user?.email?.split('@')[0] || 'Partner';
  const avatarLetter = (partnerName || user?.email || 'P')[0].toUpperCase();

  // Build tabs: Dashboard always first, then one tab per service the partner has,
  // then Bookings only if the partner has at least one bookable service type
  const serviceTabs = serviceTypes
    .filter(t => SERVICE_TAB_MAP[t])
    .map(t => SERVICE_TAB_MAP[t]);
  const hasBookableService = serviceTypes.some(t => BOOKABLE_TYPES.has(t));
  const allTabs = hasBookableService
    ? [DASHBOARD_TAB, ...serviceTabs, BOOKINGS_TAB]
    : [DASHBOARD_TAB, ...serviceTabs];

  // Dropdown service links (same set, for the user menu)
  const dropdownServiceLinks = serviceTabs.map(t => ({ icon: t.icon, label: t.label, path: t.href }));

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8F2', fontFamily: "'Outfit',sans-serif" }}>

      {/* ── Fixed top bar ── */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'white', borderBottom: '1px solid #F0E4D0',
        boxShadow: '0 1px 8px rgba(0,0,0,0.06)', height: 60,
      }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', height: '100%', display: 'flex', alignItems: 'center', gap: 16 }}>

          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#F4A435,#E8735A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 14 }}>♥</div>
            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: '#2A1A1A', fontSize: 15 }}>Wedding Partners</span>
          </Link>

          {/* Business name — centered */}
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 15, color: '#2A1A1A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>
              {displayName}
            </span>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>

            {/* Upgrade / plan badge */}
            {planLabel ? (
              <Link
                href="/partners/dashboard/upgrade"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 50, textDecoration: 'none',
                  background: `${planColor}18`, border: `1.5px solid ${planColor}40`,
                  color: planColor, fontFamily: "'Outfit',sans-serif",
                  fontWeight: 700, fontSize: 12, flexShrink: 0, whiteSpace: 'nowrap',
                }}
              >
                {planLabel === 'Gold' ? '✨' : planLabel === 'Diamond' ? '💎' : '👑'} {planLabel}
              </Link>
            ) : (
              <Link
                href="/partners/dashboard/upgrade"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '6px 14px', borderRadius: 50, textDecoration: 'none',
                  background: 'linear-gradient(135deg,#E85AA3,#7B8FE8)',
                  color: '#fff', fontFamily: "'Outfit',sans-serif",
                  fontWeight: 700, fontSize: 12, flexShrink: 0, whiteSpace: 'nowrap',
                }}
              >
                👑 Upgrade
              </Link>
            )}

            {/* Bell */}
            <div ref={bellRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setBellOpen(o => { if (!o) loadNotifs(); return !o; }); setMenuOpen(false); }}
                style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#FFFBF7', border: '1px solid #F0E4D0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, cursor: 'pointer', transition: 'background 0.2s', position: 'relative',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FFF3E0')}
                onMouseLeave={e => (e.currentTarget.style.background = '#FFFBF7')}
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{ position: 'absolute', top: -2, right: -2, background: '#E85AA3', color: 'white', borderRadius: '50%', width: 16, height: 16, fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white', fontFamily: "'Outfit',sans-serif" }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
              {bellOpen && (
                <div style={{
                  position: 'absolute', top: 44, right: 0,
                  background: 'white', borderRadius: 16,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                  border: '1px solid rgba(244,164,53,0.2)',
                  minWidth: 300, zIndex: 1000, overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 16px 10px', borderBottom: '1px solid #F5EDE0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2A1A1A' }}>Notifications</span>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} style={{ fontSize: 11, color: '#F4A435', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Mark all read</button>
                    )}
                  </div>
                  <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                    {notifList.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: '#9A8A7A', fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>No notifications yet</div>
                    ) : notifList.map(n => (
                      <div key={n.id} style={{ padding: '10px 16px', background: n.isRead ? 'white' : '#FFF8F0', borderBottom: '1px solid #F5EDE0', display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}
                        onClick={() => router.push('/partners/dashboard/notifications')}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: n.isRead ? 500 : 700, color: '#2A1A1A', marginBottom: 2 }}>{n.title}</div>
                          <div style={{ fontSize: 11, color: '#7A6A5A' }}>{n.body}</div>
                        </div>
                        {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#E85AA3', flexShrink: 0, marginTop: 4 }} />}
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '8px 16px', borderTop: '1px solid #F5EDE0', textAlign: 'center' }}>
                    <Link href="/partners/dashboard/notifications" onClick={() => setBellOpen(false)} style={{ fontSize: 11, color: '#F4A435', fontWeight: 700, textDecoration: 'none', fontFamily: "'Outfit',sans-serif" }}>View all →</Link>
                  </div>
                </div>
              )}
            </div>

            {/* Separator */}
            <div style={{ borderLeft: '1px solid #F0E4D0', height: 24 }} />

            {/* Avatar + Chevron */}
            <div ref={menuRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                onClick={() => { setMenuOpen(o => !o); setBellOpen(false); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'linear-gradient(135deg,#F4A435,#E8735A)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'white', fontWeight: 700, fontSize: 13, flexShrink: 0,
                }}>
                  {avatarLetter}
                </div>
                <svg
                  style={{ width: 12, height: 12, color: '#9A8A7A', transition: 'transform 0.2s', transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" viewBox="0 0 10 6"
                >
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Dropdown */}
              {menuOpen && (
                <div style={{
                  position: 'absolute', top: 44, right: 0,
                  background: 'white', borderRadius: 16,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
                  border: '1px solid rgba(244,164,53,0.2)',
                  padding: 8, minWidth: 220, zIndex: 1000,
                }}>
                  {/* Header */}
                  <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid #F5EBE0', marginBottom: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#2A1A1A', marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#E8735A', background: '#E8735A18', padding: '2px 8px', borderRadius: 20 }}>
                        Partner Account
                      </span>
                      {planLabel ? (
                        <span style={{ fontSize: 11, fontWeight: 700, color: planColor, background: `${planColor}18`, padding: '2px 8px', borderRadius: 20, border: `1px solid ${planColor}30` }}>
                          {planLabel === 'Gold' ? '✨' : planLabel === 'Diamond' ? '💎' : '👑'} {planLabel} Plan
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, fontWeight: 600, color: '#9A8A7A', background: '#F5F0EB', padding: '2px 8px', borderRadius: 20 }}>
                          Free Plan
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dashboard link always shown */}
                  <button
                    onClick={() => { router.push('/partners/dashboard'); setMenuOpen(false); }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#2A1A1A', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FFFBF7')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span>📊</span> Dashboard
                  </button>

                  {/* Dynamic service links */}
                  {dropdownServiceLinks.map(item => (
                    <button
                      key={item.path}
                      onClick={() => { router.push(item.path); setMenuOpen(false); }}
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#2A1A1A', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FFFBF7')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span>{item.icon}</span> {item.label}
                    </button>
                  ))}

                  {/* Upgrade / Manage Plan */}
                  <button
                    onClick={() => { router.push('/partners/dashboard/upgrade'); setMenuOpen(false); }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 13, color: planLabel ? planColor : '#E85AA3', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FFF0F8')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span>{planLabel ? '⬆' : '👑'}</span>
                    {planLabel ? `Manage ${planLabel} Plan` : 'Upgrade Plan'}
                  </button>

                  {/* Edit My Info always shown */}
                  <button
                    onClick={() => { router.push('/partners/dashboard/settings'); setMenuOpen(false); }}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#2A1A1A', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FFFBF7')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                  >
                    <span>✏️</span> Edit My Info
                  </button>

                  {/* Logout */}
                  <div style={{ borderTop: '1px solid #F5EBE0', marginTop: 6, paddingTop: 6 }}>
                    <button
                      onClick={() => { setMenuOpen(false); handleLogout(); }}
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 14px', borderRadius: 10, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#E8735A', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.15s' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FFF0EC')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                    >
                      <span>🚪</span> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Service tabs — dynamic ── */}
      <div style={{ position: 'fixed', top: 60, left: 0, right: 0, zIndex: 40, background: 'white', borderBottom: '1px solid #F0E4D0' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 4, overflowX: 'auto' }}>
          {/* Show skeleton tabs while loading, then real tabs */}
          {!tabsLoaded ? (
            [1, 2, 3].map(i => (
              <div key={i} style={{ padding: '12px 20px', width: 100, height: 42, background: '#F5EDE0', borderRadius: 6, margin: '6px 4px', opacity: 0.5 }} />
            ))
          ) : (
            allTabs.map(tab => {
              const isActive = tab.href === '/partners/dashboard'
                ? pathname === '/partners/dashboard'
                : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                    padding: '8px 16px',
                    margin: '6px 2px',
                    fontSize: 13, fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'white' : '#7A6A5A',
                    textDecoration: 'none',
                    borderRadius: 10,
                    background: isActive ? 'linear-gradient(135deg,#F4A435,#E8735A)' : 'transparent',
                    boxShadow: isActive ? '0 3px 10px rgba(244,164,53,0.35)' : 'none',
                    transition: 'all 0.2s',
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              );
            })
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <main style={{ paddingTop: 108, minHeight: 'calc(100vh - 108px)' }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
          {children}
        </div>
      </main>

      <DashboardFooter />
    </div>
  );
}
