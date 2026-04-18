'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { apiGet } from '@/lib/auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/* ─────────────────────────────────────────────
   TYPES
───────────────────────────────────────────── */
interface Stats {
  sent: number;
  received: number;
  accepted: number;
  pending: number;
  views: number;
  recentlyUpdated?: number;
  notContacted?: number;
}

interface ProfileBase {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus?: string;
  aboutMe?: string;
  religionId?: number;
  highestEducationId?: number;
  occupationId?: number;
  nativeCountryId?: number;
  preference?: unknown;
  countryLiving?: { name: string };
  religion?: { name: string };
  highestEducation?: { name: string };
  occupation?: { name: string };
  photos: { imageUrl: string; isPrimary?: boolean }[];
  isVerified: boolean;
}

interface PendingMatch {
  id: number;
  status: string;
  type?: 'interest' | 'message';
  createdAt: string;
  sender?: ProfileBase;
  receiver?: ProfileBase;
}

/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────── */
function calcAge(dob: string): number {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs} hr${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days} day${days > 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function calcCompletion(p: ProfileBase): number {
  let score = 0;
  if (p.photos?.length > 0)                                      score += 20;
  if (p.aboutMe && p.aboutMe.length >= 50)                       score += 15;
  if (p.dateOfBirth && !p.dateOfBirth.startsWith('2000-01-01'))  score += 15;
  if (p.religionId)                                              score += 10;
  if (p.highestEducationId)                                      score += 10;
  if (p.nativeCountryId)                                         score += 10;
  if (p.occupationId)                                            score += 10;
  if (p.preference)                                              score += 10;
  return score;
}

function ProfileIdLabel({ id }: { id: number }) {
  const pid = `TWP-${String(id).padStart(6, '0')}`;
  return (
    <Link href={`/dashboard/profile/${id}`} className="text-[#E8735A] text-xs font-semibold no-underline hover:underline">
      {pid}
    </Link>
  );
}

/* ─────────────────────────────────────────────
   SKELETON LOADER
───────────────────────────────────────────── */
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`bg-gradient-to-r from-[#F0E4D0] via-[#FFFBF7] to-[#F0E4D0] rounded animate-pulse ${className}`}
      style={{ backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}
    />
  );
}

/* ─────────────────────────────────────────────
   PROFILE LIST CARD (horizontal, list style)
───────────────────────────────────────────── */
function ProfileListCard({ p, token, receivedMatchId, onRespond }: {
  p: ProfileBase;
  token: string | null;
  receivedMatchId?: number;   // pending match ID where this person sent ME a request
  onRespond?: (matchId: number, action: 'ACCEPTED' | 'DECLINED') => void;
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState(false);
  const photo = p.photos?.find(ph => ph.isPrimary)?.imageUrl ?? p.photos?.[0]?.imageUrl;
  const age   = p.dateOfBirth ? calcAge(p.dateOfBirth) : null;

  async function sendInterest() {
    if (!token || sent || sending) return;
    setSending(true);
    try {
      const res = await fetch(`${API_URL}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId: p.id }),
      });
      if (res.ok) setSent(true);
    } catch { /* silent */ } finally {
      setSending(false);
    }
  }

  async function respond(action: 'ACCEPTED' | 'DECLINED') {
    if (!token || !receivedMatchId || acting) return;
    setActing(true);
    try {
      const res = await fetch(`${API_URL}/api/matches/${receivedMatchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) onRespond?.(receivedMatchId, action);
    } catch { /* silent */ } finally {
      setActing(false);
    }
  }

  const tags = [
    age ? `${age} yrs` : null,
    p.countryLiving?.name,
    p.religion?.name,
    p.highestEducation?.name,
    p.occupation?.name,
  ].filter(Boolean) as string[];

  return (
    <div className="flex gap-4 p-4 bg-white rounded-2xl border border-[#F0E4D0] hover:border-[#F4A435] hover:shadow-md transition-all group">

      {/* Photo */}
      <div className="flex-shrink-0 rounded-xl overflow-hidden border border-[#F0E4D0] relative" style={{ width: 100, height: 120 }}>
        {photo ? (
          <img src={photo} alt={p.firstName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#F4A435,#E8735A)' }}
          >
            <span className="text-4xl opacity-60">{p.gender === 'MALE' ? '👨' : '👩'}</span>
          </div>
        )}
        {p.isVerified && (
          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shadow-sm" title="Verified">
            <svg viewBox="0 0 16 16" fill="white" className="w-2.5 h-2.5">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* ID + label */}
        <div className="flex items-center gap-2 mb-1">
          <ProfileIdLabel id={p.id} />
          <span className="text-[10px] text-[#9A8A7A]">· Profile created for Self</span>
        </div>

        {/* Name */}
        <h3
          className="font-bold text-[#2A1A1A] text-lg leading-tight mb-1 truncate"
          style={{ fontFamily: "'Playfair Display',serif" }}
        >
          {p.firstName} {p.lastName[0]}.
        </h3>

        {/* Location */}
        {p.countryLiving?.name && (
          <div className="flex items-center gap-1 text-xs text-[#7A6A5A] mb-2">
            <span>📍</span>
            <span>{p.countryLiving.name}</span>
          </div>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {tags.slice(0, 4).map((tag, i) => (
            <span
              key={i}
              className="bg-[#FFF3E0] text-[#E8735A] rounded-full px-2 py-0.5 text-[10px] font-semibold"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* About */}
        {p.aboutMe && (
          <p className="text-xs text-[#7A6A5A] leading-relaxed line-clamp-2 mb-0">
            <span className="font-semibold text-[#2A1A1A]">About {p.gender === 'MALE' ? 'Him' : 'Her'}:</span>{' '}
            {p.aboutMe}{' '}
            <Link href={`/dashboard/profile/${p.id}`} className="text-[#E8735A] no-underline hover:underline font-medium">
              View Full Profile
            </Link>
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col items-end justify-between flex-shrink-0 gap-2" style={{ minWidth: 110 }}>
        <Link
          href={`/dashboard/profile/${p.id}`}
          className="flex items-center gap-1.5 text-[#7A6A5A] border border-[#F0E4D0] rounded-full px-3 py-1.5 text-xs font-semibold no-underline hover:border-[#F4A435] hover:text-[#E8735A] transition-all bg-white"
        >
          👁️ View Profile
        </Link>

        {receivedMatchId ? (
          // This person sent ME a pending request — show Accept / Decline
          <>
            <button
              onClick={() => respond('ACCEPTED')}
              disabled={acting}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold border-none cursor-pointer transition-all bg-gradient-to-r from-[#4ABEAA] to-[#2A9D8F] text-white hover:opacity-90"
              style={{ minWidth: 110, opacity: acting ? 0.7 : 1 }}
            >
              ✓ Accept
            </button>
            <button
              onClick={() => respond('DECLINED')}
              disabled={acting}
              className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold border-none cursor-pointer transition-all bg-[#F5F0EB] text-[#7A6A5A] hover:bg-[#F0E4D0]"
              style={{ minWidth: 110, opacity: acting ? 0.7 : 1 }}
            >
              ✕ Decline
            </button>
          </>
        ) : (
          // Normal flow — send interest
          <>
            <button
              onClick={sendInterest}
              disabled={sent || sending}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border-none cursor-pointer transition-all ${
                sent
                  ? 'bg-[#E8F8F5] text-[#4ABEAA] cursor-default'
                  : 'bg-gradient-to-r from-[#F4A435] to-[#E8735A] text-white hover:opacity-90'
              }`}
              style={{ minWidth: 110 }}
            >
              {sending ? '…Sending' : sent ? '✓ Interest Sent' : '💌 Send Interest'}
            </button>
            {sent && (
              <span className="text-[10px] text-[#F4A435] font-medium">Awaiting response</span>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   PENDING MATCH CARD (awaiting response carousel)
───────────────────────────────────────────── */
function PendingMatchCard({ match, token, onAction }: {
  match: PendingMatch;
  token: string | null;
  onAction: (id: number, action: 'accept' | 'decline') => void;
}) {
  const sender = match.sender;
  const photo  = sender?.photos?.[0]?.imageUrl;
  const [acting, setActing] = useState(false);

  async function act(action: 'accept' | 'decline') {
    if (!token || acting) return;
    setActing(true);
    try {
      await fetch(`${API_URL}/api/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: action === 'accept' ? 'ACCEPTED' : 'DECLINED' }),
      });
      onAction(match.id, action);
    } catch { /* silent */ } finally {
      setActing(false);
    }
  }

  return (
    <div
      className="flex-shrink-0 bg-white rounded-2xl border border-[#F0E4D0] overflow-hidden hover:border-[#F4A435] hover:shadow-md transition-all"
      style={{ width: 200 }}
    >
      {/* Photo */}
      <div className="relative overflow-hidden" style={{ height: 120 }}>
        {photo ? (
          <img src={photo} alt={sender?.firstName ?? 'Profile'} className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg,#F4A435,#E8735A)' }}
          >
            <span className="text-4xl opacity-60">
              {sender?.gender === 'MALE' ? '👨' : '👩'}
            </span>
          </div>
        )}
        {/* Type badge */}
        <div
          className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-bold text-white ${
            match.type === 'message' ? 'bg-blue-500' : 'bg-orange-400'
          }`}
        >
          {match.type === 'message' ? 'Message' : 'Interest'} Received
        </div>
      </div>

      <div className="p-3">
        <h4
          className="font-bold text-[#2A1A1A] text-sm leading-tight mb-0.5 truncate"
          style={{ fontFamily: "'Playfair Display',serif" }}
        >
          {sender ? `${sender.firstName} ${sender.lastName[0]}.` : 'Unknown'}
        </h4>
        {sender && <ProfileIdLabel id={sender.id} />}
        <p className="text-[10px] text-[#9A8A7A] mt-0.5 mb-2">{timeAgo(match.createdAt)}</p>

        {/* View Profile */}
        {sender && (
          <Link
            href={`/dashboard/profile/${sender.id}`}
            className="flex items-center justify-center gap-1 w-full text-[11px] font-semibold rounded-full py-1.5 mb-2 no-underline transition-colors"
            style={{ background: '#FFF3E0', color: '#F4A435', border: '1px solid #F4A43530' }}
          >
            👁 View Profile
          </Link>
        )}

        {/* Accept / Decline */}
        <div className="flex gap-1.5">
          <button
            onClick={() => act('accept')}
            disabled={acting}
            className="flex-1 bg-gradient-to-r from-[#4ABEAA] to-[#2A9D8F] text-white text-xs font-bold rounded-full py-1.5 border-none cursor-pointer hover:opacity-90 transition-opacity"
          >
            ✓ Accept
          </button>
          <button
            onClick={() => act('decline')}
            disabled={acting}
            className="flex-1 bg-[#F5F0EB] text-[#7A6A5A] text-xs font-semibold rounded-full py-1.5 border-none cursor-pointer hover:bg-[#F0E4D0] transition-colors"
          >
            ✕ Decline
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MAIN DASHBOARD PAGE
───────────────────────────────────────────── */
export default function DashboardPage() {
  const { token, user } = useAuthStore();

  const [stats,            setStats]            = useState<Stats | null>(null);
  const [suggestions,      setSuggestions]      = useState<ProfileBase[]>([]);
  const [pendingMatches,   setPendingMatches]   = useState<PendingMatch[]>([]);
  const [myProfile,        setMyProfile]        = useState<ProfileBase | null>(null);
  const [loading,          setLoading]          = useState(true);
  const [showPhotoFilter,  setShowPhotoFilter]  = useState(false);
  const [showNotContacted, setShowNotContacted] = useState(false);
  const [showAll,          setShowAll]          = useState(true);
  const [activeStatTab,    setActiveStatTab]    = useState<string>('Latest Matches');

  const loadDashboard = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      await Promise.allSettled([
        apiGet<{ sent: number; received: number; accepted: number; pending: number; views: number }>(
          '/api/matches/stats', token
        ).then(setStats).catch(() => {}),

        apiGet<{ profiles: ProfileBase[] }>(
          '/api/profiles/suggestions', token
        ).then(d => setSuggestions(d?.profiles ?? [])).catch(() => {}),

        apiGet<{ matches: PendingMatch[] }>(
          '/api/matches/received', token
        ).then(d => {
          const received = (d?.matches ?? []).filter(
            m => m.status === 'PENDING' && m.sender
          );
          setPendingMatches(received);
        }).catch(() => {}),

        apiGet<{ profile: ProfileBase }>(
          '/api/profiles/me', token
        ).then(d => { if (d?.profile) setMyProfile(d.profile); }).catch(() => {}),
      ]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  function handleMatchAction(id: number, _action: 'accept' | 'decline') {
    setPendingMatches(prev => prev.filter(m => m.id !== id));
    if (stats) setStats(s => s ? { ...s, pending: Math.max(0, s.pending - 1) } : s);
  }

  /* Profile completion */
  const completion    = myProfile ? calcCompletion(myProfile) : 0;
  const profileIncomplete = completion < 60;

  /* Filtered suggestions */
  const filteredSuggestions = suggestions.filter(p => {
    if (showPhotoFilter && (!p.photos || p.photos.length === 0)) return false;
    return true;
  });

  /* Activity stat columns */
  const statCols = [
    { label: 'Latest Matches',         value: stats?.received ?? 0,          color: '#E8735A' },
    { label: 'Yet to be Viewed',        value: stats?.pending ?? 0,           color: '#2A1A1A' },
    { label: 'Recently Updated',        value: stats?.recentlyUpdated ?? 0,   color: '#2A1A1A' },
    { label: 'Viewed & Not Contacted',  value: stats?.notContacted ?? 0,      color: '#2A1A1A' },
    { label: 'Profile Views',           value: stats?.views ?? 0,             color: '#4ABEAA' },
  ];

  /* ── RENDER ──────────────────────────────── */
  return (
    <div>

      {/* ══════════════════════════════════════
          1. ACTIVITY SUMMARY BAR
      ══════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-[#F0E4D0] mb-4 overflow-hidden">
        <div className="flex divide-x divide-[#F0E4D0]">
          {statCols.map(({ label, value, color }) => (
            <button
              key={label}
              onClick={() => setActiveStatTab(label)}
              className={`flex-1 flex flex-col items-center justify-center py-4 px-2 transition-all cursor-pointer border-none bg-transparent min-w-0 ${
                activeStatTab === label ? 'bg-[#FFFBF7]' : 'hover:bg-[#FFFBF7]'
              }`}
            >
              {loading ? (
                <Skeleton className="h-7 w-10 mb-1 rounded" />
              ) : (
                <span
                  className="font-bold text-2xl leading-none mb-1"
                  style={{ fontFamily: "'Playfair Display',serif", color }}
                >
                  {value}
                </span>
              )}
              <span className="text-[10px] text-[#9A8A7A] text-center leading-tight font-medium">
                {label}
              </span>
              {activeStatTab === label && (
                <div className="h-0.5 w-8 rounded-full mt-2" style={{ background: '#F4A435' }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ══════════════════════════════════════
          2. PROFILE IMPROVEMENT BANNER
      ══════════════════════════════════════ */}
      {profileIncomplete && !loading && (
        <div
          className="flex items-center justify-between gap-4 rounded-2xl border border-[#F4A435] px-5 py-4 mb-4 flex-wrap"
          style={{ background: 'linear-gradient(135deg,#FFF3E0,#FFFBF7)' }}
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <span className="text-2xl flex-shrink-0">📋</span>
            <div>
              <div
                className="font-bold text-[#2A1A1A] text-sm mb-0.5"
                style={{ fontFamily: "'Outfit',sans-serif" }}
              >
                Complete your profile to get better matches
              </div>
              <div className="text-xs text-[#7A6A5A]">
                Add photos, about me and preferences
              </div>
            </div>
          </div>
          {/* Progress bar */}
          <div className="hidden sm:flex flex-col items-center gap-1 flex-shrink-0">
            <div className="text-xs font-bold text-[#F4A435]">{completion}% complete</div>
            <div className="w-24 bg-[#F0E4D0] rounded-full" style={{ height: 5 }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${completion}%`, background: 'linear-gradient(90deg,#F4A435,#E8735A)' }}
              />
            </div>
          </div>
          <Link
            href="/dashboard/profile"
            className="flex-shrink-0 bg-gradient-to-r from-[#E8735A] to-[#E8735A] text-white rounded-full px-5 py-2 text-xs font-bold no-underline hover:opacity-90 transition-opacity shadow-sm"
            style={{ background: 'linear-gradient(135deg,#E8735A,#D4614A)' }}
          >
            Complete Profile →
          </Link>
        </div>
      )}

      {/* ══════════════════════════════════════
          3. PROFILES AWAITING RESPONSE
      ══════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-[#F0E4D0] p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2
              className="font-bold text-[#2A1A1A] text-base"
              style={{ fontFamily: "'Playfair Display',serif" }}
            >
              Profiles Awaiting Response
            </h2>
            {pendingMatches.length > 0 && (
              <span className="bg-orange-100 text-orange-600 text-[10px] font-bold rounded-full px-2 py-0.5">
                {pendingMatches.length}
              </span>
            )}
          </div>
          <Link href="/dashboard/matches" className="text-xs text-[#E8735A] font-semibold no-underline hover:underline">
            View All →
          </Link>
        </div>

        {loading ? (
          <div className="flex gap-3 overflow-hidden">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-shrink-0 rounded-2xl overflow-hidden" style={{ width: 200 }}>
                <Skeleton className="h-28 rounded-none" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-1.5 mt-2">
                    <Skeleton className="h-7 flex-1 rounded-full" />
                    <Skeleton className="h-7 flex-1 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : pendingMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="text-4xl mb-3">💌</span>
            <p className="text-sm font-semibold text-[#5A4A3A] mb-1">No pending requests</p>
            <p className="text-xs text-[#9A8A7A]">When someone sends you an interest, it will appear here</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
            {pendingMatches.map(m => (
              <PendingMatchCard key={m.id} match={m} token={token} onAction={handleMatchAction} />
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          4. TODAY'S MATCHES
      ══════════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-[#F0E4D0] p-4 mb-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2
              className="font-bold text-[#2A1A1A] text-base"
              style={{ fontFamily: "'Playfair Display',serif" }}
            >
              Today's Matches 💑
            </h2>
            {filteredSuggestions.length > 0 && (
              <span className="bg-[#FFF3E0] text-[#E8735A] text-[10px] font-bold rounded-full px-2 py-0.5">
                {filteredSuggestions.length}
              </span>
            )}
          </div>
          <Link href="/dashboard/browse" className="text-xs text-[#E8735A] font-semibold no-underline hover:underline flex-shrink-0">
            View All →
          </Link>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-4 flex-wrap pb-3 mb-4 border-b border-[#F0E4D0]">
          <label className="flex items-center gap-2 text-xs text-[#5A4A3A] font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showPhotoFilter}
              onChange={e => setShowPhotoFilter(e.target.checked)}
              className="w-4 h-4 rounded accent-[#F4A435] cursor-pointer"
            />
            Show profiles with photo
          </label>
          <label className="flex items-center gap-2 text-xs text-[#5A4A3A] font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showNotContacted}
              onChange={e => setShowNotContacted(e.target.checked)}
              className="w-4 h-4 rounded accent-[#F4A435] cursor-pointer"
            />
            Don't show already contacted
          </label>
          <label className="flex items-center gap-2 text-xs text-[#5A4A3A] font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showAll}
              onChange={e => setShowAll(e.target.checked)}
              className="w-4 h-4 rounded accent-[#F4A435] cursor-pointer"
            />
            Show all
          </label>
        </div>

        {/* Profile list */}
        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex gap-4 p-4 rounded-2xl border border-[#F0E4D0]">
                <div className="rounded-xl flex-shrink-0 overflow-hidden" style={{ width: 100, height: 120 }}>
                  <Skeleton className="w-full h-full rounded-xl" />
                </div>
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-32" />
                  <div className="flex gap-1.5 mt-1">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredSuggestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <span className="text-5xl mb-4">🔍</span>
            <p className="font-semibold text-[#5A4A3A] mb-2" style={{ fontFamily: "'Playfair Display',serif" }}>
              No suggestions yet
            </p>
            <p className="text-sm text-[#9A8A7A] mb-5 max-w-xs">
              Complete your profile to get matched with compatible profiles
            </p>
            <Link
              href="/dashboard/profile"
              className="bg-gradient-to-r from-[#F4A435] to-[#E8735A] text-white rounded-full px-6 py-2.5 text-sm font-bold no-underline hover:opacity-90 transition-opacity shadow-sm"
            >
              Complete Profile
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredSuggestions.slice(0, 10).map(p => {
              const rm = pendingMatches.find(m => m.sender?.id === p.id);
              return (
                <ProfileListCard
                  key={p.id}
                  p={p}
                  token={token}
                  receivedMatchId={rm?.id}
                  onRespond={(matchId, action) => handleMatchAction(matchId, action === 'ACCEPTED' ? 'accept' : 'decline')}
                />
              );
            })}
            {filteredSuggestions.length > 10 && (
              <div className="text-center pt-2">
                <Link
                  href="/dashboard/browse"
                  className="inline-flex items-center gap-1 text-sm text-[#E8735A] font-semibold no-underline hover:underline"
                >
                  View {filteredSuggestions.length - 10} more profiles →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          5. QUICK ACTIONS
      ══════════════════════════════════════ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { href: '/browse',            icon: '🔍', label: 'Browse Profiles',  color: '#7B8FE8' },
          { href: '/dashboard/matches', icon: '💌', label: 'View Requests',    color: '#E8735A' },
          { href: '/dashboard/views',   icon: '👁️', label: 'Who Viewed Me',    color: '#4ABEAA' },
          { href: '/dashboard/profile', icon: '✏️', label: 'Edit Profile',     color: '#F4A435' },
        ].map(({ href, icon, label, color }) => (
          <Link
            key={label}
            href={href}
            className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-[#F0E4D0] py-5 px-3 no-underline hover:border-[#F4A435] hover:shadow-md transition-all group"
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-sm group-hover:scale-110 transition-transform"
              style={{ background: `${color}18`, border: `1.5px solid ${color}30` }}
            >
              {icon}
            </div>
            <span
              className="text-xs font-semibold text-[#2A1A1A] text-center leading-tight"
              style={{ fontFamily: "'Outfit',sans-serif" }}
            >
              {label}
            </span>
          </Link>
        ))}
      </div>

      {/* shimmer animation */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  );
}
