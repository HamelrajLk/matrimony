'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { logoutFromAPI, apiGet } from '@/lib/auth';
import toast from 'react-hot-toast';
import PhotoUploadModal from '@/components/shared/PhotoUploadModal';
import SearchDropdown from '@/components/shared/SearchDropdown';
import DashboardFooter from '@/components/shared/DashboardFooter';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface ProfileSidebar {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  isVerified: boolean;
  status: string;
  referenceCode?: string | null;
  aboutMe?: string;
  dateOfBirth?: string;
  religionId?: number;
  highestEducationId?: number;
  occupationId?: number;
  nativeCountryId?: number;
  preference?: unknown;
  photos: { id: number; imageUrl: string; isPrimary: boolean }[];
}

interface Visitor {
  viewedAt: string;
  viewer?: {
    id: number;
    firstName: string;
    lastName: string;
    gender: string;
    photos: { imageUrl: string }[];
  };
}

interface MatchStats {
  sent: number;
  received: number;
  accepted: number;
  pending: number;
  views: number;
}

interface ReceivedMatch {
  id: number;
  createdAt: string;
  sender?: {
    id: number;
    firstName: string;
    lastName: string;
    gender: string;
    photos: { imageUrl: string }[];
  };
}

/* ─────────────────────────────────────────────
   PROFILE COMPLETION SCORE
───────────────────────────────────────────── */
function calcCompletion(p: ProfileSidebar): number {
  let score = 0;
  if (p.photos?.length > 0) score += 20;
  if (p.aboutMe && p.aboutMe.length >= 50) score += 15;
  if (p.dateOfBirth && !p.dateOfBirth.startsWith('2000-01-01')) score += 15;
  if (p.religionId) score += 10;
  if (p.highestEducationId) score += 10;
  if (p.nativeCountryId) score += 10;
  if (p.occupationId) score += 10;
  if (p.preference) score += 10;
  return score;
}

/* ─────────────────────────────────────────────
   TIME AGO
───────────────────────────────────────────── */
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

/* ─────────────────────────────────────────────
   TOP NAV CONFIG
───────────────────────────────────────────── */
const TOP_NAV = [
  { href: '/dashboard',         label: 'Dashboard' },
  { href: '/dashboard/matches', label: 'Matches',       badge: true },
  { href: '/dashboard/inbox',   label: 'Inbox' },
  { href: '/dashboard/browse',         label: 'Search' },
  { href: '/dashboard/daily-matches', label: 'Daily Matches' },
];

const LEFT_NAV = [
  { href: '/dashboard/profile?tab=basic',       icon: '👤', label: 'Basic Info',            tab: 'basic' },
  { href: '/dashboard/profile?tab=physical',    icon: '💪', label: 'Appearance',             tab: 'physical' },
  { href: '/dashboard/profile?tab=religion',    icon: '🙏', label: 'Religion & Language',    tab: 'religion' },
  { href: '/dashboard/profile?tab=education',   icon: '🎓', label: 'Education & Career',     tab: 'education' },
  { href: '/dashboard/profile?tab=location',    icon: '📍', label: 'Location',               tab: 'location' },
  { href: '/dashboard/profile?tab=family',      icon: '👨‍👩‍👧', label: 'Family Background',      tab: 'family' },
  { href: '/dashboard/profile?tab=interests',   icon: '🎨', label: 'Hobbies & Interests',    tab: 'interests' },
  { href: '/dashboard/profile?tab=photos',      icon: '📷', label: 'Edit Photos',            tab: 'photos' },
  { href: '/dashboard/profile?tab=preferences', icon: '💕', label: 'Partner Preferences',   tab: 'preferences' },
];

/* ─────────────────────────────────────────────
   LAYOUT
───────────────────────────────────────────── */
function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const pathname      = usePathname();
  const searchParams  = useSearchParams();
  const router        = useRouter();
  const activeTab     = searchParams.get('tab') ?? 'basic';
  const { user, token, isAuthenticated, _hasHydrated, clearAuth } = useAuthStore();

  const [profile,        setProfile]        = useState<ProfileSidebar | null>(null);
  const [stats,          setStats]          = useState<MatchStats | null>(null);
  const [visitors,       setVisitors]       = useState<Visitor[]>([]);
  const [recentMatches,  setRecentMatches]  = useState<ReceivedMatch[]>([]);
  const [photoIdx,       setPhotoIdx]       = useState(0);
  const [mobileNavOpen,  setMobileNavOpen]  = useState(false);
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [sidebarPhotos,  setSidebarPhotos]  = useState<{ id: number; imageUrl: string; isPrimary: boolean }[]>([]);
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [userMenuOpen,   setUserMenuOpen]   = useState(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userMenuRef    = useRef<HTMLDivElement>(null);

  /* auth guard */
  useEffect(() => {
    if (!_hasHydrated) return;
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated, _hasHydrated, router]);

  /* close user menu on outside click */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    if (userMenuOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [userMenuOpen]);

  /* data fetching */
  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      const [profileRes, statsRes, visitorsRes, matchesRes] = await Promise.allSettled([
        apiGet<{ profile: ProfileSidebar }>('/api/profiles/me', token),
        apiGet<MatchStats>('/api/matches/stats', token),
        apiGet<{ visitors: Visitor[] }>('/api/profiles/views/visitors', token),
        apiGet<{ matches: ReceivedMatch[] }>('/api/matches', token),
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value?.profile) {
        const p = profileRes.value.profile;
        setProfile(p);
        setSidebarPhotos(p.photos);
        const pri = p.photos.findIndex(ph => ph.isPrimary);
        setPhotoIdx(pri >= 0 ? pri : 0);
      }
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (visitorsRes.status === 'fulfilled') setVisitors(visitorsRes.value?.visitors ?? []);
      if (matchesRes.status === 'fulfilled') setRecentMatches(matchesRes.value?.matches ?? []);
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleLogout() {
    try { if (token) await logoutFromAPI(token); } catch { /* silent */ }
    clearAuth();
    router.push('/');
    toast.success('Logged out successfully');
  }

  const photos       = sidebarPhotos;
  const currentPhoto = photos[photoIdx]?.imageUrl;
  const profileRefCode = profile?.referenceCode ?? (profile ? `TWP-${String(profile.id).padStart(6, '0')}` : '—');
  const completion  = profile ? calcCompletion(profile) : 0;
  const avatarLetter = profile?.firstName?.[0]?.toUpperCase() ?? user?.email?.[0]?.toUpperCase() ?? '?';
  const fullName     = profile ? `${profile.firstName} ${profile.lastName}` : (user?.email?.split('@')[0] ?? 'Account');

  function prevPhoto() { setPhotoIdx(i => (i - 1 + photos.length) % photos.length); }
  function nextPhoto() { setPhotoIdx(i => (i + 1) % photos.length); }

  /* notification feed (visitors + received matches) */
  const notifications: { key: string; text: string; time: string; letter: string; color: string }[] = [
    ...visitors.slice(0, 3).map(v => ({
      key:    `v-${v.viewedAt}`,
      text:   v.viewer ? `${v.viewer.firstName} ${v.viewer.lastName} viewed your profile` : 'Someone viewed your profile',
      time:   timeAgo(v.viewedAt),
      letter: v.viewer?.firstName?.[0]?.toUpperCase() ?? '?',
      color:  '#7B8FE8',
    })),
    ...recentMatches.slice(0, 3).map(m => ({
      key:    `m-${m.id}`,
      text:   m.sender ? `${m.sender.firstName} ${m.sender.lastName} sent you an interest` : 'Someone sent you an interest',
      time:   timeAgo(m.createdAt),
      letter: m.sender?.firstName?.[0]?.toUpperCase() ?? '?',
      color:  '#E8735A',
    })),
  ].slice(0, 6);

  /* ── RENDER ──────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#FFF8F2]" style={{ fontFamily: "'Outfit',sans-serif" }}>

      {/* ══════════════════════════════════════════
          FIXED TOP BAR
      ══════════════════════════════════════════ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#F0E4D0] shadow-sm"
        style={{ height: 60 }}
      >
        <div className="flex items-center h-full mx-auto gap-2" style={{ maxWidth: 1400, padding: '0 24px', width: '100%' }}>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 mr-3 no-underline">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F4A435] to-[#E8735A] flex items-center justify-center text-white text-sm font-bold shadow-sm">
              ♥
            </div>
            <span
              className="hidden sm:block font-bold text-[#2A1A1A] text-sm whitespace-nowrap"
              style={{ fontFamily: "'Playfair Display',serif" }}
            >
              Wedding Partners
            </span>
          </Link>

          {/* Center nav — desktop */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1">
            {TOP_NAV.map(({ href, label, badge }) => {
              const active = pathname === href || (label === 'My Home' && pathname === '/dashboard');

              /* Special handling for Search nav item */
              if (label === 'Search') {
                return (
                  <div
                    key={label}
                    className="relative"
                    onMouseEnter={() => {
                      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
                      setSearchOpen(true);
                    }}
                    onMouseLeave={() => {
                      searchTimerRef.current = setTimeout(() => setSearchOpen(false), 200);
                    }}
                  >
                    <Link
                      href={href}
                      onClick={() => setSearchOpen(open => !open)}
                      className={`relative flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all no-underline whitespace-nowrap ${
                        active
                          ? 'bg-[#FFF3E0] text-[#E8735A] font-semibold'
                          : 'text-[#5A4A3A] hover:bg-[#FFFBF7] hover:text-[#E8735A]'
                      }`}
                    >
                      {label}
                      <svg
                        className="w-3 h-3 transition-transform"
                        style={{ transform: searchOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                        fill="none"
                        viewBox="0 0 10 6"
                      >
                        <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                    {searchOpen && (
                      <SearchDropdown token={token} />
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={label}
                  href={href}
                  className={`relative flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all no-underline whitespace-nowrap ${
                    active
                      ? 'bg-[#FFF3E0] text-[#E8735A] font-semibold'
                      : 'text-[#5A4A3A] hover:bg-[#FFFBF7] hover:text-[#E8735A]'
                  }`}
                >
                  {label}
                  {badge && (stats?.pending ?? 0) > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#E8735A] text-white text-[9px] font-bold flex items-center justify-center px-1">
                      {stats!.pending}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 ml-auto flex-shrink-0">
            {/* Notification bell */}
            <div className="relative">
              <Link href="/dashboard/notifications" className="w-9 h-9 rounded-full bg-[#FFFBF7] border border-[#F0E4D0] flex items-center justify-center text-base hover:bg-[#FFF3E0] transition-colors cursor-pointer no-underline">
                🔔
              </Link>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#E8735A] text-white text-[9px] font-bold flex items-center justify-center px-1">
                  {notifications.length}
                </span>
              )}
            </div>

            {/* User avatar + dropdown */}
            <div ref={userMenuRef} className="relative flex items-center gap-1.5 pl-2 border-l border-[#F0E4D0]">
              <button
                onClick={() => setUserMenuOpen(o => !o)}
                className="flex items-center gap-1.5 cursor-pointer bg-transparent border-none p-0"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#F4A435] to-[#E8735A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
                  {avatarLetter}
                </div>
                <svg
                  className="hidden sm:block w-3 h-3 text-[#9A8A7A] transition-transform"
                  style={{ transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                  fill="none" viewBox="0 0 10 6"
                >
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              {/* Dropdown menu */}
              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-[#F0E4D0] rounded-2xl shadow-lg z-50 py-1.5 overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-[#F0E4D0]">
                    <p className="text-xs font-semibold text-[#2A1A1A] truncate">{fullName}</p>
                    <p className="text-[10px] text-[#9A8A7A] truncate">{profileRefCode}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#5A4A3A] hover:bg-[#FFFBF7] hover:text-[#E8735A] no-underline transition-colors"
                  >
                    <span>🏠</span><span>Dashboard</span>
                  </Link>
                  <Link
                    href="/dashboard/profile"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#5A4A3A] hover:bg-[#FFFBF7] hover:text-[#E8735A] no-underline transition-colors"
                  >
                    <span>👤</span><span>My Profile</span>
                  </Link>
                  <Link
                    href="/dashboard/bookings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#5A4A3A] hover:bg-[#FFFBF7] hover:text-[#E8735A] no-underline transition-colors"
                  >
                    <span>📅</span><span>My Bookings</span>
                  </Link>
                  <Link
                    href="/broker/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#5A4A3A] hover:bg-[#FFFBF7] hover:text-[#E8735A] no-underline transition-colors"
                  >
                    <span>👨‍👩‍👧</span><span>Family Profiles</span>
                  </Link>
                  <Link
                    href="/dashboard/notifications"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#5A4A3A] hover:bg-[#FFFBF7] hover:text-[#E8735A] no-underline transition-colors"
                  >
                    <span>🔔</span><span>Notifications</span>
                  </Link>
                  <Link
                    href="/dashboard/upgrade"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#F4A435] font-semibold hover:bg-[#FFF3E0] no-underline transition-colors"
                  >
                    <span>⭐</span><span>Upgrade Plan</span>
                  </Link>
                  <div className="border-t border-[#F0E4D0] mt-1 pt-1">
                    <button
                      onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-xs text-[#E8735A] hover:bg-red-50 cursor-pointer bg-transparent border-none w-full text-left transition-colors font-medium"
                    >
                      <span>🚪</span><span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg border border-[#F0E4D0] text-[#5A4A3A] cursor-pointer bg-white"
              aria-label="Toggle menu"
            >
              ☰
            </button>
          </div>
        </div>

        {/* Mobile nav dropdown */}
        {mobileNavOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-[#F0E4D0] shadow-lg z-50 py-2 px-4">
            {TOP_NAV.map(({ href, label }) => (
              <Link
                key={label}
                href={href}
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center py-2.5 text-sm text-[#2A1A1A] font-medium no-underline hover:text-[#E8735A]"
              >
                {label}
              </Link>
            ))}
            <div className="border-t border-[#F0E4D0] mt-2 pt-2">
              <Link href="/dashboard/upgrade" className="flex items-center gap-2 py-2.5 text-sm text-[#F4A435] font-bold no-underline">⭐ Upgrade Plan</Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 py-2.5 text-sm text-[#9A8A7A] cursor-pointer bg-transparent border-none w-full text-left hover:text-[#E8735A]"
              >
                🚪 Log Out
              </button>
            </div>
          </div>
        )}
      </header>

      {/* ══════════════════════════════════════════
          3-COLUMN BODY — centered max-width container
      ══════════════════════════════════════════ */}
      <div style={{ paddingTop: 60, background: '#FFF8F2', minHeight: 'calc(100vh - 60px)' }}>
        <div
          className="flex mx-auto gap-4"
          style={{ maxWidth: 1400, padding: '0 24px' }}
        >

        {/* ══════════════════════════════════════
            LEFT SIDEBAR (sticky, 260px)
        ══════════════════════════════════════ */}
        <aside
          className="hidden md:flex flex-col bg-white border border-[#F0E4D0] flex-shrink-0 self-start rounded-2xl mt-5"
          style={{ width: 260, position: 'sticky', top: 70, overflow: 'visible' }}
        >

          {/* ── Profile Photo Block ── */}
          <div className="relative flex-shrink-0 overflow-hidden" style={{ height: 280 }}>
            {currentPhoto ? (
              <img src={currentPhoto} alt="Profile photo" className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#F4A435,#E8735A)' }}
              >
                <span className="text-7xl opacity-50">
                  {profile ? (profile.gender === 'MALE' ? '👨' : '👩') : '👤'}
                </span>
              </div>
            )}

            {/* Verified badge */}
            {profile?.isVerified && (
              <div className="absolute top-3 left-3 flex items-center gap-1 bg-blue-500 text-white text-[10px] font-bold rounded-full px-2 py-1 shadow-md">
                <svg viewBox="0 0 16 16" fill="white" className="w-2.5 h-2.5" aria-hidden="true">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
                Verified
              </div>
            )}

            {/* Photo count badge */}
            {photos.length > 1 && (
              <div className="absolute top-3 right-3 bg-black/50 text-white text-[10px] font-semibold rounded-full px-2 py-0.5">
                {photoIdx + 1}/{photos.length}
              </div>
            )}

            {/* Prev/Next arrows */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center text-sm hover:bg-black/60 transition-colors cursor-pointer border-none leading-none"
                  aria-label="Previous photo"
                >
                  ‹
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-black/40 text-white flex items-center justify-center text-sm hover:bg-black/60 transition-colors cursor-pointer border-none leading-none"
                  aria-label="Next photo"
                >
                  ›
                </button>
                {/* Dot indicators */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIdx(i)}
                      className={`rounded-full border-none cursor-pointer transition-all ${
                        i === photoIdx ? 'bg-white' : 'bg-white/50'
                      }`}
                      style={{ width: i === photoIdx ? 16 : 6, height: 6, padding: 0 }}
                      aria-label={`Photo ${i + 1}`}
                    />
                  ))}
                </div>
              </>
            )}

            {/* Camera button → opens photo modal */}
            <button
              onClick={() => setPhotoModalOpen(true)}
              className="absolute bottom-3 left-3 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center text-sm hover:bg-black/75 transition-colors cursor-pointer border-none shadow-md"
              title="Manage photos"
            >
              📷
            </button>
          </div>

          {/* ── Profile Info Block ── */}
          <div className="px-4 py-3 border-b border-[#F0E4D0]">
            <div className="text-[10px] text-[#9A8A7A] mb-1 font-mono tracking-wide">{profileRefCode}</div>
            <h2
              className="font-bold text-[#2A1A1A] text-base leading-tight mb-2 truncate"
              style={{ fontFamily: "'Playfair Display',serif" }}
            >
              {fullName}
            </h2>

            {/* Account type row */}
            <div className="flex items-center gap-1 text-xs mb-1.5 flex-wrap">
              <span className="text-[#9A8A7A]">Account Type:</span>
              <span className="text-[#2A1A1A] font-semibold">Free Membership</span>
            </div>

            {/* Go Premium card — hidden for max plan users */}
            {true /* replace with: user?.plan !== 'MAX_PREMIUM' */ && (
              <div
                className="rounded-2xl p-3 text-center border border-[#F4A435]/30 mt-2"
                style={{ background: 'linear-gradient(135deg,#FFF3E0,#FFE8CC)' }}
              >
                <div className="text-xl mb-1">⭐</div>
                <h4
                  className="font-bold text-[#2A1A1A] text-xs mb-0.5"
                  style={{ fontFamily: "'Playfair Display',serif" }}
                >
                  Go Premium
                </h4>
                <p className="text-[10px] text-[#7A6A5A] mb-2 leading-relaxed">
                  Unlock unlimited matches &amp; more
                </p>
                <Link
                  href="/dashboard/upgrade"
                  className="block bg-white text-[#E8735A] text-[10px] font-bold rounded-full py-1.5 no-underline hover:bg-[#FFF3E0] transition-colors border border-[#E8735A]/30 shadow-sm"
                >
                  Upgrade Now
                </Link>
              </div>
            )}

            {/* Blue tick row */}
            {profile?.isVerified && (
              <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold mt-1">
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 flex-shrink-0">
                  <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
                Blue Tick Verified
              </div>
            )}
          </div>

          {/* ── Profile Completion ── */}
          <div className="px-4 py-3 border-b border-[#F0E4D0]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#2A1A1A]">Profile Strength</span>
              <span
                className="text-xs font-bold"
                style={{ color: completion >= 70 ? '#4ABEAA' : completion >= 40 ? '#F4A435' : '#E8735A' }}
              >
                {completion}%
              </span>
            </div>
            <div className="w-full bg-[#F0E4D0] rounded-full" style={{ height: 6 }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${completion}%`,
                  background: completion >= 70
                    ? 'linear-gradient(90deg,#4ABEAA,#2A9D8F)'
                    : 'linear-gradient(90deg,#F4A435,#E8735A)',
                }}
              />
            </div>
            {completion < 60 && (
              <Link
                href="/dashboard/profile"
                className="text-[10px] text-[#E8735A] no-underline hover:underline font-medium mt-1.5 block"
              >
                Complete your profile →
              </Link>
            )}
          </div>

          {/* ── Quick Nav Links ── */}
          <nav className="flex-1 px-2 py-2">
            {LEFT_NAV.map(({ href, icon, label, tab }) => {
              const isProfilePage = pathname === '/dashboard/profile';
              const active = isProfilePage && activeTab === tab;
              return (
                <Link
                  key={label}
                  href={href}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl mb-0.5 text-sm no-underline transition-all font-medium ${
                    active
                      ? 'bg-orange-50 text-[#E8735A] font-semibold border-l-[3px] border-[#F4A435]'
                      : 'text-[#5A4A3A] hover:bg-[#FFFBF7] hover:text-[#E8735A]'
                  }`}
                >
                  <span className="text-base w-5 text-center flex-shrink-0">{icon}</span>
                  <span className="truncate">{label}</span>
                </Link>
              );
            })}
          </nav>

        </aside>

        {/* ══════════════════════════════════════
            MAIN CONTENT (scrollable middle)
        ══════════════════════════════════════ */}
        <main
          className="flex-1 min-w-0 p-5"
          style={{ minHeight: 'calc(100vh - 80px)' }}
        >
          {children}
        </main>


        </div>{/* end max-width container */}
      </div>{/* end 3-column body */}

      <DashboardFooter />

      {/* Photo upload modal */}
      <PhotoUploadModal
        open={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        token={token}
        currentPhotos={sidebarPhotos}
        onPhotosChange={(updated) => {
          setSidebarPhotos(updated);
          // keep photoIdx in bounds
          setPhotoIdx(i => Math.min(i, Math.max(0, updated.length - 1)));
        }}
      />
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  );
}
