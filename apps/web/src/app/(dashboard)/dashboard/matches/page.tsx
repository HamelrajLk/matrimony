'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { apiGet } from '@/lib/auth';

type MatchStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED';
interface MatchProfile {
  id: number; firstName: string; lastName: string; gender: string;
  dateOfBirth: string; maritalStatus: string; aboutMe?: string;
  countryLiving?: { name: string }; religion?: { name: string };
  occupation?: { name: string }; highestEducation?: { name: string };
  photos: { imageUrl: string }[]; isVerified: boolean;
}
interface Match {
  id: number; status: MatchStatus; message?: string; createdAt: string;
  sender?: MatchProfile; receiver?: MatchProfile;
}

const TABS = ['Received', 'Sent', 'Accepted'] as const;
type Tab = typeof TABS[number];

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/* ── Status badge colours ── */
const STATUS_BG:  Record<MatchStatus, string> = { PENDING: '#FFF3E0', ACCEPTED: '#E8F8F5', DECLINED: '#FFF0EE' };
const STATUS_CLR: Record<MatchStatus, string> = { PENDING: '#E8735A', ACCEPTED: '#4ABEAA', DECLINED: '#E8735A' };
const STATUS_LBL: Record<MatchStatus, string> = { PENDING: '⏳ Pending', ACCEPTED: '💑 Accepted', DECLINED: '✗ Declined' };

/* ── Skeleton card ── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#F0E4D0]" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}>
      <div className="h-56 bg-[#F5EDE0] animate-pulse" />
      <div className="p-4 flex flex-col gap-2">
        <div className="h-4 rounded-full bg-[#F0E4D0] animate-pulse w-3/4" />
        <div className="h-3 rounded-full bg-[#F0E4D0] animate-pulse w-1/2" />
        <div className="flex gap-2 mt-1">
          <div className="h-5 rounded-full bg-[#F5EDE0] animate-pulse w-16" />
          <div className="h-5 rounded-full bg-[#F5EDE0] animate-pulse w-20" />
        </div>
        <div className="h-8 rounded-xl bg-[#F5EDE0] animate-pulse mt-2" />
      </div>
    </div>
  );
}

/* ── Match Card — same visual style as browse ProfileCard ── */
function MatchCard({ match, perspective, onRespond }: {
  match: Match; perspective: Tab; onRespond: () => void;
}) {
  const p: MatchProfile | undefined =
    perspective === 'Sent' ? match.receiver :
    perspective === 'Received' ? match.sender :
    (match.sender || match.receiver);

  const [responding, setResponding] = useState(false);
  const { token } = useAuthStore();

  if (!p) return null;

  const photo = p.photos?.[0]?.imageUrl;
  const age   = calcAge(p.dateOfBirth);

  async function respond(action: 'ACCEPTED' | 'DECLINED') {
    setResponding(true);
    try {
      await fetch(`${API}/api/matches/${match.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      onRespond();
    } catch {} finally { setResponding(false); }
  }

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden border border-[#F0E4D0] transition-all duration-200 hover:-translate-y-1 flex flex-col"
      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(244,164,53,0.15)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.06)'; }}
    >
      {/* Photo */}
      <div
        className="relative h-56 flex items-center justify-center flex-shrink-0"
        style={{ background: photo ? `url(${photo}) center/cover no-repeat` : 'linear-gradient(135deg,#F4A435,#E8735A)' }}
      >
        {!photo && <span className="text-6xl opacity-60">{p.gender === 'MALE' ? '👨' : '👩'}</span>}

        {/* Status badge */}
        <div className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: STATUS_BG[match.status], color: STATUS_CLR[match.status] }}>
          {STATUS_LBL[match.status]}
        </div>

        {p.isVerified && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 text-white text-[10px] font-bold rounded-full px-2 py-0.5" style={{ background: '#4ABEAA' }}>
            ✓ Verified
          </div>
        )}

        {/* Gradient + name overlay */}
        <div className="absolute bottom-0 left-0 right-0" style={{ height: '55%', background: 'linear-gradient(transparent,rgba(0,0,0,0.45))' }} />
        <div className="absolute bottom-3 left-3">
          <div className="text-white font-bold text-base leading-tight" style={{ fontFamily: "'Playfair Display',serif", textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            {p.firstName} {p.lastName[0]}.
          </div>
          <div className="text-white/85 text-xs" style={{ fontFamily: "'Outfit',sans-serif" }}>
            {age} yrs · {p.countryLiving?.name ?? 'Unknown'}
          </div>
        </div>

        {/* Match date */}
        <div className="absolute bottom-3 right-3 text-white/70 text-[10px]" style={{ fontFamily: "'Outfit',sans-serif" }}>
          {new Date(match.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">
        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {[p.religion?.name, p.highestEducation?.name, p.occupation?.name]
            .filter(Boolean)
            .map((tag, i) => (
              <span key={i} className="text-[11px] font-semibold rounded-full px-2.5 py-0.5" style={{ background: '#FFF3E0', color: '#E8735A', fontFamily: "'Outfit',sans-serif" }}>
                {tag}
              </span>
            ))}
        </div>

        {/* Message from sender */}
        {match.message && (
          <div className="rounded-xl px-3 py-2 text-xs italic leading-relaxed" style={{ background: '#FFFBF7', border: '1px solid #F0E4D0', color: '#7A6A5A', fontFamily: "'Outfit',sans-serif" }}>
            "{match.message}"
          </div>
        )}

        {/* About snippet */}
        {!match.message && p.aboutMe && (
          <p className="text-xs leading-relaxed line-clamp-2" style={{ color: '#7A6A5A', fontFamily: "'Outfit',sans-serif" }}>
            {p.aboutMe}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <Link
            href={`/dashboard/profile/${p.id}`}
            className="flex-1 text-center py-2 rounded-xl text-xs font-semibold no-underline transition-colors"
            style={{ background: '#F5F0EB', color: '#5A4A3A', fontFamily: "'Outfit',sans-serif" }}
          >
            View Profile
          </Link>

          {perspective === 'Received' && match.status === 'PENDING' && (
            <>
              <button
                onClick={() => respond('ACCEPTED')} disabled={responding}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white border-none cursor-pointer disabled:opacity-60"
                style={{ background: '#4ABEAA', fontFamily: "'Outfit',sans-serif" }}
              >
                ✓ Accept
              </button>
              <button
                onClick={() => respond('DECLINED')} disabled={responding}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border cursor-pointer disabled:opacity-60"
                style={{ background: 'white', color: '#E8735A', borderColor: '#E8735A', fontFamily: "'Outfit',sans-serif" }}
              >
                ✗ Decline
              </button>
            </>
          )}

          {perspective === 'Accepted' && (
            <Link
              href={`/dashboard/chat/${match.id}`}
              className="flex-[1.4] text-center py-2 rounded-xl text-xs font-semibold text-white no-underline"
              style={{ background: 'linear-gradient(135deg,#F4A435,#E8735A)', fontFamily: "'Outfit',sans-serif" }}
            >
              💬 Chat
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Empty state ── */
function EmptyState({ tab }: { tab: Tab }) {
  const cfg = {
    Received: { icon: '📩', msg: 'No requests yet', sub: 'When someone sends you a request, it appears here.' },
    Sent:     { icon: '💌', msg: 'No sent requests', sub: 'Browse profiles and click Connect to send requests.' },
    Accepted: { icon: '💑', msg: 'No accepted matches', sub: 'Once both sides accept, your match appears here.' },
  }[tab];
  return (
    <div className="bg-white rounded-2xl border border-dashed border-[#F0E4D0] text-center py-16 px-8 col-span-full">
      <div className="text-4xl mb-3">{cfg.icon}</div>
      <div className="font-semibold text-[#5A4A3A] mb-2" style={{ fontFamily: "'Outfit',sans-serif" }}>{cfg.msg}</div>
      <div className="text-sm text-[#9A8A7A] mb-5" style={{ fontFamily: "'Outfit',sans-serif" }}>{cfg.sub}</div>
      {tab !== 'Received' && (
        <Link href="/dashboard/browse" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 24px', fontSize: '0.85rem' }}>
          Browse Profiles
        </Link>
      )}
    </div>
  );
}

/* ── Page ── */
export default function MatchesPage() {
  const { token } = useAuthStore();
  const [tab, setTab] = useState<Tab>('Received');
  const [data, setData] = useState<{ received: Match[]; sent: Match[]; accepted: Match[] }>({
    received: [], sent: [], accepted: [],
  });
  const [loading, setLoading] = useState(true);

  async function load() {
    if (!token) return;
    setLoading(true);
    const [rec, sent, acc] = await Promise.all([
      apiGet<{ matches: Match[] }>('/api/matches/received', token).catch(() => ({ matches: [] })),
      apiGet<{ matches: Match[] }>('/api/matches/sent',     token).catch(() => ({ matches: [] })),
      apiGet<{ matches: Match[] }>('/api/matches/accepted', token).catch(() => ({ matches: [] })),
    ]);
    setData({ received: rec.matches, sent: sent.matches, accepted: acc.matches });
    setLoading(false);
  }

  useEffect(() => { load(); }, [token]);

  const lists: Record<Tab, Match[]> = { Received: data.received, Sent: data.sent, Accepted: data.accepted };
  const pending = data.received.filter(m => m.status === 'PENDING').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.8rem', fontWeight: 800, color: '#2A1A1A', marginBottom: 4 }}>
          Match Requests 💌
        </h1>
        <p style={{ fontFamily: "'Outfit',sans-serif", color: '#7A6A5A', fontSize: '0.88rem' }}>
          Manage your connection requests
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white border border-[#F0E4D0] rounded-2xl p-1.5 w-fit">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="relative rounded-xl px-5 py-2 text-sm font-semibold border-none cursor-pointer transition-all"
            style={{
              background: tab === t ? 'linear-gradient(135deg,#F4A435,#E8735A)' : 'transparent',
              color: tab === t ? 'white' : '#7A6A5A',
              fontFamily: "'Outfit',sans-serif",
              fontWeight: tab === t ? 700 : 500,
            }}
          >
            {t}
            {t === 'Received' && pending > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center rounded-full text-white text-[10px] font-bold"
                style={{ background: '#E8735A', fontSize: '0.6rem' }}>
                {pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : lists[tab].length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          lists[tab].map(m => (
            <MatchCard key={m.id} match={m} perspective={tab} onRespond={load} />
          ))
        )}
      </div>
    </div>
  );
}
