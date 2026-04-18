'use client';
import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { getSocket } from '@/lib/socket';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Stats {
  totalProfiles: number;
  activeProfiles: number;
  deletedProfiles: number;
  hiddenProfiles: number;
  successfulMatches: number;
}

interface MatchStats {
  interests: number;
  sent: number;
  pending: number;
  accepted: number;
}

interface Profile {
  id: number;
  firstName: string;
  lastName: string;
  gender: 'MALE' | 'FEMALE';
  dateOfBirth: string;
  referenceCode: string;
  profileVisibility: string;
  showPhoto: boolean;
  religion?: { name: string };
  countryLiving?: { name: string };
  photos: { imageUrl: string }[];
  _count: { contactRequests: number };
  matchStats: MatchStats;
}

interface FeedProfile {
  id: number; firstName: string; lastName: string; gender: string;
  dateOfBirth: string; maritalStatus: string; isVerified: boolean;
  referenceCode?: string;
  religion?: { name: string }; highestEducation?: { name: string };
  motherTongue?: { name: string }; countryLiving?: { name: string };
  occupation?: { name: string }; height?: number; aboutMe?: string;
  photos: { imageUrl: string }[];
}

interface FeedItem {
  id: number;
  status: string;
  message?: string;
  createdAt: string;
  receiverId: number;
  receiver: FeedProfile | null;
  sender: FeedProfile & { matchMakerUserId?: number };
}

// ── Full profile popup for Review Compatibility ────────────────────────────────
interface FullProfile {
  id: number; firstName: string; lastName: string; gender: string;
  dateOfBirth: string; maritalStatus: string; isVerified: boolean;
  referenceCode?: string; height?: number; weight?: number;
  bodyType?: string; physicalStatus?: string;
  religion?: { name: string }; denomination?: string;
  motherTongue?: { name: string }; eatingHabits?: string[];
  smokingHabit?: string; drinkingHabit?: string; aboutMe?: string;
  highestEducation?: { name: string }; employmentStatus?: string;
  occupation?: { name: string }; annualIncome?: number; currency?: string;
  fatherName?: string; fatherOccupation?: { name: string };
  motherName?: string; motherOccupation?: { name: string };
  noOfBrothers?: number; brothersMarried?: number;
  noOfSisters?: number; sistersMarried?: number; aboutFamily?: string;
  nativeCountry?: { name: string }; nativeCountryState?: string; nativeCountryCity?: string;
  countryLiving?: { name: string }; countryLivingState?: string; countryLivingCity?: string;
  citizenship?: { name: string };
  hobbies?: string[]; favMusic?: string[]; favSports?: string[]; favFood?: string[];
  photos: { id: number; imageUrl: string; isPrimary: boolean }[];
}

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}
function fmt(e?: string | null) {
  return e ? e.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '–';
}

function MIRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid #F5F0EB' }}>
      <div style={{ width: 130, flexShrink: 0, fontSize: '0.72rem', color: '#9A8A7A', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: "'Outfit',sans-serif" }}>{label}</div>
      <div style={{ fontSize: '0.82rem', color: '#2A1A1A', fontFamily: "'Outfit',sans-serif" }}>{String(value)}</div>
    </div>
  );
}
function MISection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '0.85rem', color: '#2A1A1A', marginBottom: 8, paddingBottom: 5, borderBottom: '2px solid #F4A435', display: 'inline-block' }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

function CompatibilityModal({
  item,
  token,
  onClose,
  onRespond,
}: {
  item: FeedItem;
  token: string | null;
  onClose: () => void;
  onRespond: (matchId: number, action: 'ACCEPTED' | 'DECLINED') => void;
}) {
  const [full, setFull] = useState<FullProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [score, setScore] = useState<number | null>(null);
  const [scoreAnim, setScoreAnim] = useState(0);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [acting, setActing] = useState<'ACCEPTED' | 'DECLINED' | null>(null);
  const [status, setStatus] = useState(item.status);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/profiles/${item.sender.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.profile) { setFull(d.profile); const pi = d.profile.photos?.findIndex((p: any) => p.isPrimary); setPhotoIdx(pi >= 0 ? pi : 0); } })
      .catch(() => {})
      .finally(() => setLoadingProfile(false));

    fetch(`${API}/api/matchmaker/profiles/${item.receiverId}/match-score/${item.sender.id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (typeof d.score === 'number') {
          setScore(d.score);
          let cur = 0; const step = Math.ceil(d.score / 40);
          const t = setInterval(() => { cur = Math.min(cur + step, d.score); setScoreAnim(cur); if (cur >= d.score) clearInterval(t); }, 30);
        }
      })
      .catch(() => {});
  }, [item.sender.id, item.receiverId, token]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  async function handleRespond(action: 'ACCEPTED' | 'DECLINED') {
    if (!token) return;
    setActing(action);
    try {
      const res = await fetch(`${API}/api/matchmaker/profiles/${item.receiverId}/requests/${item.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(action);
        onRespond(item.id, action);
        toast.success(action === 'ACCEPTED' ? 'Request accepted!' : 'Request declined');
      } else {
        toast.error(data.message || 'Failed');
      }
    } catch { toast.error('Network error'); }
    finally { setActing(null); }
  }

  const currentPhoto = full?.photos?.[photoIdx];
  const age = full ? calcAge(full.dateOfBirth) : calcAge(item.sender.dateOfBirth);
  const r = 30; const circ = 2 * Math.PI * r;
  const dash = (scoreAnim / 100) * circ;
  const scoreColor = scoreAnim >= 75 ? '#4ABEAA' : scoreAnim >= 50 ? '#F4A435' : '#E8735A';

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,10,5,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: '#FFFBF7', borderRadius: 24, width: '100%', maxWidth: 700, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.28)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 22px', borderBottom: '1px solid #F0E4D0', background: 'white', flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: '1rem', color: '#2A1A1A' }}>
              Review Compatibility
            </div>
            {item.receiver && (
              <div style={{ fontSize: '0.76rem', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", marginTop: 2 }}>
                Request for <strong style={{ color: '#E8735A' }}>{item.receiver.firstName} {item.receiver.lastName}</strong>
              </div>
            )}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#9A8A7A', padding: '4px 8px' }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {loadingProfile ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>Loading…</div>
          ) : (
            <>
              {/* Hero */}
              <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', background: 'white', borderBottom: '1px solid #F0E4D0' }}>
                <div>
                  <div style={{ height: 220, background: currentPhoto?.imageUrl ? `url(${currentPhoto.imageUrl}) center/cover` : 'linear-gradient(135deg,#F4A435,#E8735A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!currentPhoto?.imageUrl && <span style={{ fontSize: '3.5rem', opacity: 0.4 }}>{(full?.gender ?? item.sender.gender) === 'MALE' ? '👨' : '👩'}</span>}
                  </div>
                  {(full?.photos?.length ?? 0) > 1 && (
                    <div style={{ display: 'flex', gap: 4, padding: 6, flexWrap: 'wrap', background: '#FFFBF7' }}>
                      {full!.photos.map((ph, i) => (
                        <div key={ph.id} onClick={() => setPhotoIdx(i)} style={{ width: 32, height: 32, borderRadius: 6, background: `url(${ph.imageUrl}) center/cover`, border: i === photoIdx ? '2px solid #F4A435' : '2px solid transparent', cursor: 'pointer' }} />
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: '1.15rem', color: '#2A1A1A', margin: 0 }}>
                          {full?.firstName ?? item.sender.firstName} {full?.lastName ?? item.sender.lastName}
                        </h2>
                        {(full?.isVerified ?? item.sender.isVerified) && <span style={{ background: '#4ABEAA', color: 'white', borderRadius: 20, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700 }}>✓ Verified</span>}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#7A6A5A', fontFamily: "'Outfit',sans-serif" }}>
                        {age} yrs · {fmt(full?.gender ?? item.sender.gender)} · {fmt(full?.maritalStatus ?? item.sender.maritalStatus)}
                        {(full?.countryLiving ?? item.sender.countryLiving) && ` · ${(full?.countryLiving ?? item.sender.countryLiving)!.name}`}
                      </div>
                    </div>
                    {/* Score circle */}
                    {score !== null && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                        <svg width="68" height="68" style={{ transform: 'rotate(-90deg)' }}>
                          <circle cx="34" cy="34" r={r} fill="none" stroke="#F0E4D0" strokeWidth="5" />
                          <circle cx="34" cy="34" r={r} fill="none" stroke={scoreColor} strokeWidth="5" strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
                          <text x="34" y="34" textAnchor="middle" dominantBaseline="central" style={{ transform: 'rotate(90deg)', transformOrigin: '34px 34px' }} fill={scoreColor} fontSize="12" fontWeight="800" fontFamily="'Outfit',sans-serif">
                            {scoreAnim}%
                          </text>
                        </svg>
                        <span style={{ fontSize: '0.62rem', fontWeight: 600, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", marginTop: 2 }}>Match</span>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                    {[(full?.religion ?? item.sender.religion)?.name, (full?.highestEducation ?? item.sender.highestEducation)?.name, (full?.occupation ?? item.sender.occupation)?.name].filter(Boolean).map((t, i) => (
                      <span key={i} style={{ background: '#FFF3E0', color: '#E8735A', borderRadius: 20, padding: '3px 10px', fontSize: '0.7rem', fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{t}</span>
                    ))}
                  </div>
                  {item.message && (
                    <div style={{ background: '#FFFBF7', border: '1px solid #F0E4D0', borderRadius: 8, padding: '8px 12px', fontSize: '0.78rem', color: '#5A4A3A', fontFamily: "'Outfit',sans-serif", fontStyle: 'italic' }}>
                      "{item.message}"
                    </div>
                  )}
                </div>
              </div>

              {/* Detail sections */}
              {full && (
                <div style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                    <div>
                      <MISection title="📋 Basic Info">
                        <MIRow label="Age" value={age + ' years'} />
                        <MIRow label="Marital Status" value={fmt(full.maritalStatus)} />
                        <MIRow label="Height" value={full.height ? `${full.height} cm` : null} />
                        <MIRow label="Weight" value={full.weight ? `${full.weight} kg` : null} />
                        <MIRow label="Body Type" value={fmt(full.bodyType)} />
                        <MIRow label="Physical Status" value={fmt(full.physicalStatus)} />
                      </MISection>
                      <MISection title="🎓 Education & Career">
                        <MIRow label="Education" value={full.highestEducation?.name} />
                        <MIRow label="Employment" value={fmt(full.employmentStatus)} />
                        <MIRow label="Occupation" value={full.occupation?.name} />
                        <MIRow label="Income" value={full.annualIncome ? `${full.currency ?? ''} ${full.annualIncome.toLocaleString()}`.trim() : null} />
                      </MISection>
                    </div>
                    <div>
                      <MISection title="🙏 Religion & Lifestyle">
                        <MIRow label="Religion" value={full.religion?.name} />
                        <MIRow label="Mother Tongue" value={full.motherTongue?.name} />
                        <MIRow label="Smoking" value={fmt(full.smokingHabit)} />
                        <MIRow label="Drinking" value={fmt(full.drinkingHabit)} />
                      </MISection>
                      <MISection title="📍 Location">
                        <MIRow label="Native" value={[full.nativeCountry?.name, full.nativeCountryState, full.nativeCountryCity].filter(Boolean).join(', ')} />
                        <MIRow label="Living In" value={[full.countryLiving?.name, full.countryLivingState, full.countryLivingCity].filter(Boolean).join(', ')} />
                        <MIRow label="Citizenship" value={full.citizenship?.name} />
                      </MISection>
                    </div>
                  </div>
                  {full.aboutMe && (
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', color: '#5A4A3A', lineHeight: 1.65, background: '#FFFBF7', borderRadius: 10, padding: '10px 14px', border: '1px solid #F0E4D0' }}>
                      {full.aboutMe}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ borderTop: '1px solid #F0E4D0', padding: '14px 22px', background: 'white', flexShrink: 0 }}>
          {status !== 'PENDING' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ background: status === 'ACCEPTED' ? '#D4EDDA' : '#F8D7DA', color: status === 'ACCEPTED' ? '#155724' : '#721C24', borderRadius: 20, padding: '6px 16px', fontSize: '0.82rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
                {status === 'ACCEPTED' ? '✓ Accepted' : '✗ Declined'}
              </span>
              <button onClick={onClose} style={{ marginLeft: 'auto', padding: '9px 20px', borderRadius: 50, background: 'white', color: '#9A8A7A', border: '1.5px solid #F0E4D0', fontSize: '0.82rem', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Close</button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button onClick={() => handleRespond('ACCEPTED')} disabled={!!acting} style={{ flex: 2, padding: '11px', borderRadius: 50, background: acting ? '#F0E4D0' : 'linear-gradient(135deg,#4ABEAA,#2A9D8F)', color: acting ? '#9A8A7A' : 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: acting ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                {acting === 'ACCEPTED' ? '…' : '✓ Accept Request'}
              </button>
              <button onClick={() => handleRespond('DECLINED')} disabled={!!acting} style={{ flex: 1, padding: '11px', borderRadius: 50, background: 'white', color: '#E8735A', border: '1.5px solid #E8735A', fontSize: '0.85rem', fontWeight: 700, cursor: acting ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                {acting === 'DECLINED' ? '…' : '✗ Decline'}
              </button>
              <button onClick={onClose} style={{ padding: '11px 18px', borderRadius: 50, background: 'white', color: '#9A8A7A', border: '1.5px solid #F0E4D0', fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function StatusPill({ visibility }: { visibility: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    ACTIVE:  { label: 'Active',  color: '#16a34a', bg: '#dcfce7' },
    HIDDEN:  { label: 'Hidden',  color: '#6b7280', bg: '#f3f4f6' },
    MATCHED: { label: 'Matched', color: '#c47d00', bg: '#fef3c7' },
  };
  const s = map[visibility] ?? map.ACTIVE;
  return <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg, borderRadius: 20, padding: '2px 10px', fontFamily: "'Outfit',sans-serif" }}>{s.label}</span>;
}

function GenderBadge({ gender }: { gender: 'MALE' | 'FEMALE' }) {
  return gender === 'FEMALE'
    ? <span style={{ fontSize: 11, fontWeight: 700, color: '#be185d', background: '#fce7f3', borderRadius: 20, padding: '2px 10px', fontFamily: "'Outfit',sans-serif" }}>🌸 Bride</span>
    : <span style={{ fontSize: 11, fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', borderRadius: 20, padding: '2px 10px', fontFamily: "'Outfit',sans-serif" }}>💙 Groom</span>;
}

function DeleteConfirmModal({ profileName, onConfirm, onCancel }: { profileName: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,10,5,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }} onClick={onCancel}>
      <div style={{ background: '#FFFBF7', borderRadius: 20, width: '100%', maxWidth: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '28px 28px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 18px' }}>🗑️</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: '1.15rem', color: '#2A1A1A', margin: '0 0 10px' }}>Delete Profile?</h2>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.88rem', color: '#7A6A5A', lineHeight: 1.6, margin: '0 0 6px' }}>
            Are you sure you want to delete <strong style={{ color: '#2A1A1A' }}>{profileName}</strong>?
          </p>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.82rem', color: '#9A8A7A', lineHeight: 1.6, margin: 0 }}>
            The profile will be moved to your Deleted Profiles section. You can restore it at any time.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12, padding: '0 28px 24px' }}>
          <button
            onClick={onCancel}
            style={{ flex: 1, padding: '12px', borderRadius: 50, background: 'white', color: '#7A6A5A', border: '1.5px solid #F0E4D0', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ flex: 1, padding: '12px', borderRadius: 50, background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', border: 'none', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MatchmakerDashboard() {
  const { token } = useAuthStore();
  const [stats, setStats] = useState<Stats | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [reviewItem, setReviewItem] = useState<FeedItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [sRes, pRes, fRes] = await Promise.all([
        fetch(`${API}/api/matchmaker/stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/matchmaker/profiles`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/matchmaker/feed`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (sRes.ok) setStats(await sRes.json());
      if (pRes.ok) { const d = await pRes.json(); setProfiles(d.profiles ?? []); }
      if (fRes.ok) { const d = await fRes.json(); setFeed(d.feed ?? []); }
    } catch {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // Socket — live notifications
  useEffect(() => {
    if (!token) return;
    const socket = getSocket(token);

    socket.on('new_match_request', (data: { senderName: string; receiverName: string }) => {
      toast.success(`💌 New request for ${data.receiverName} from ${data.senderName}`, { duration: 5000 });
      load(); // refresh feed + stats
    });

    socket.on('match_request_response', (data: { action: string; senderName: string; receiverName: string }) => {
      const msg = data.action === 'ACCEPTED'
        ? `✓ Request accepted for ${data.senderName}`
        : `✗ Request declined for ${data.senderName}`;
      toast(msg, { duration: 4000 });
    });

    return () => {
      socket.off('new_match_request');
      socket.off('match_request_response');
    };
  }, [token, load]);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenu(null);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  async function updateVisibility(id: number, profileVisibility: string) {
    try {
      const res = await fetch(`${API}/api/matchmaker/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ profileVisibility }),
      });
      if (!res.ok) throw new Error();
      setProfiles(ps => ps.map(p => p.id === id ? { ...p, profileVisibility } : p));
      toast.success('Profile updated');
    } catch { toast.error('Failed to update profile'); }
    setOpenMenu(null);
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`${API}/api/matchmaker/profiles/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setProfiles(ps => ps.filter(p => p.id !== deleteTarget.id));
      setStats(s => s ? { ...s, deletedProfiles: (s.deletedProfiles ?? 0) + 1, totalProfiles: Math.max(0, s.totalProfiles - 1) } : s);
      toast.success('Profile moved to deleted');
    } catch { toast.error('Failed to delete profile'); }
    setDeleteTarget(null);
    setOpenMenu(null);
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#F4A435,#E8735A)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18 }}>💑</div>
        <p style={{ color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>Loading dashboard…</p>
      </div>
    </div>
  );

  const statCards = [
    { icon: '👥', label: 'Total Profiles',     value: stats?.totalProfiles     ?? 0, color: '#F4A435', bg: '#FFF3E0', accent: '#F4A43520', href: '/partners/dashboard/matchmaker' },
    { icon: '✅', label: 'Active Profiles',    value: stats?.activeProfiles    ?? 0, color: '#4ABEAA', bg: '#E6FAF7', accent: '#4ABEAA20', href: '/partners/dashboard/matchmaker' },
    { icon: '🙈', label: 'Hidden Profiles',    value: stats?.hiddenProfiles    ?? 0, color: '#7B8FE8', bg: '#EEF0FD', accent: '#7B8FE820', href: '/partners/dashboard/matchmaker/hidden' },
    { icon: '🗑️', label: 'Deleted Profiles',   value: stats?.deletedProfiles   ?? 0, color: '#E8735A', bg: '#FFF0EC', accent: '#E8735A20', href: '/partners/dashboard/matchmaker/deleted' },
    { icon: '💍', label: 'Successful Matches', value: stats?.successfulMatches ?? 0, color: '#be185d', bg: '#fce7f3', accent: '#be185d20', href: '/partners/dashboard/matchmaker/successful-matches' },
  ];

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif" }}>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 800, color: '#2A1A1A', margin: '0 0 4px' }}>Matchmaker Dashboard</h1>
          <p style={{ color: '#7A6A5A', fontSize: 13, margin: 0 }}>Manage your client profiles and match requests</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/partners/dashboard/matchmaker/success-stories" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'white', color: '#E8735A', borderRadius: 50, padding: '11px 22px', fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0, border: '1.5px solid #F0E4D0', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            💑 Success Stories
          </Link>
          <Link href="/partners/dashboard/matchmaker/profiles/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', borderRadius: 50, padding: '11px 24px', fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0, boxShadow: '0 4px 14px rgba(244,164,53,0.35)' }}>
            + Add Profile
          </Link>
        </div>
      </div>

      {/* ══ SECTION 1: Stats grid ══ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 36 }}>
        {statCards.map(c => {
          const cardInner = (
            <div key={c.label} style={{ background: 'white', borderRadius: 20, padding: '22px 22px 18px', border: '1px solid #F0E4D0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', position: 'relative', overflow: 'hidden', cursor: c.href ? 'pointer' : 'default', transition: 'box-shadow 0.15s', textDecoration: 'none' }}>
              <div style={{ position: 'absolute', top: -18, right: -18, width: 80, height: 80, borderRadius: '50%', background: c.accent }} />
              <div style={{ width: 44, height: 44, borderRadius: 14, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, marginBottom: 14, position: 'relative' }}>
                {c.icon}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, fontWeight: 800, color: c.color, lineHeight: 1 }}>{c.value}</span>
              </div>
              <p style={{ fontSize: 12, color: '#7A6A5A', margin: 0, fontWeight: 600, letterSpacing: '0.01em' }}>{c.label}</p>
              {c.href && <div style={{ marginTop: 6, fontSize: 11, color: c.color, fontFamily: "'Outfit',sans-serif", fontWeight: 600 }}>View all →</div>}
            </div>
          );
          return c.href
            ? <Link key={c.label} href={c.href} style={{ textDecoration: 'none' }}>{cardInner}</Link>
            : <div key={c.label}>{cardInner}</div>;
        })}
      </div>

      {/* ══ SECTION 2: Profiles cards grid ══ */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💑</div>
            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1.05rem', color: '#2A1A1A' }}>My Profiles</span>
            {profiles.length > 0 && <span style={{ background: '#F0E4D0', color: '#7A6A5A', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{profiles.length}</span>}
          </div>
        </div>

        {profiles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', background: 'white', borderRadius: 20, border: '1.5px dashed #F0E4D0' }}>
            <div style={{ fontSize: 44, marginBottom: 10 }}>💑</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", color: '#2A1A1A', marginBottom: 6 }}>No profiles yet</h3>
            <p style={{ color: '#9A8A7A', fontSize: 13, marginBottom: 18 }}>Add your first bride or groom profile to get started.</p>
            <Link href="/partners/dashboard/matchmaker/profiles/new" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', borderRadius: 50, padding: '11px 24px', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>+ Add First Profile</Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
            {profiles.map(profile => {
              const photo = profile.photos[0]?.imageUrl;
              const ms = profile.matchStats;
              const isFemale = profile.gender === 'FEMALE';
              return (
                <div key={profile.id} style={{ background: 'white', borderRadius: 20, border: '1px solid #F0E4D0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

                  {/* Card photo — small, full image visible */}
                  <div style={{ height: 100, position: 'relative', background: isFemale ? 'linear-gradient(135deg,#fce7f3,#fbcfe8)' : 'linear-gradient(135deg,#dbeafe,#bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {photo
                      ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
                      : <span style={{ fontSize: '3rem' }}>{isFemale ? '👩' : '👨'}</span>
                    }
                    {/* Status + gender badges top right */}
                    <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                      <StatusPill visibility={profile.profileVisibility} />
                      <GenderBadge gender={profile.gender} />
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#9A8A7A', marginBottom: 3 }}>{profile.referenceCode}</div>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1.05rem', color: '#2A1A1A', marginBottom: 4 }}>
                      {profile.firstName} {profile.lastName}
                    </div>
                    <div style={{ fontSize: 12, color: '#9A8A7A', marginBottom: 14 }}>
                      {calcAge(profile.dateOfBirth)} yrs
                      {profile.religion ? ` · ${profile.religion.name}` : ''}
                      {profile.countryLiving ? ` · ${profile.countryLiving.name}` : ''}
                    </div>

                    {/* Match mini-stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, padding: '12px 0', borderTop: '1px solid #F5F0EB', borderBottom: '1px solid #F5F0EB', marginBottom: 14 }}>
                      {[
                        { label: 'Int.',  value: ms.interests, color: '#7B8FE8' },
                        { label: 'Sent',  value: ms.sent,      color: '#F4A435' },
                        { label: 'Pend.', value: ms.pending,   color: '#E8735A' },
                        { label: 'Acc.',  value: ms.accepted,  color: '#4ABEAA' },
                      ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: s.color, fontFamily: "'Playfair Display',serif" }}>{s.value}</div>
                          <div style={{ fontSize: 10, color: '#9A8A7A', fontWeight: 600, marginTop: 1 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Action row: View · Edit · ⋮ */}
                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }} ref={openMenu === profile.id ? menuRef : undefined}>
                      <Link href={`/partners/dashboard/matchmaker/profiles/${profile.id}`} style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 50, background: '#FFF3E0', color: '#E8735A', fontSize: 12, fontWeight: 700, textDecoration: 'none', border: '1px solid #F0E4D0', fontFamily: "'Outfit',sans-serif" }}>
                        👁 View
                      </Link>
                      <Link href={`/partners/dashboard/matchmaker/profiles/${profile.id}/edit`} style={{ flex: 1, textAlign: 'center', padding: '8px 0', borderRadius: 50, background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: "'Outfit',sans-serif" }}>
                        ✏️ Edit
                      </Link>
                      {/* 3-dot menu beside Edit */}
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <button onClick={() => setOpenMenu(openMenu === profile.id ? null : profile.id)} style={{ width: 36, height: 36, borderRadius: 50, background: '#F5F0EB', border: '1px solid #F0E4D0', cursor: 'pointer', fontSize: 16, color: '#7A6A5A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⋮</button>
                        {openMenu === profile.id && (
                          <div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 4, background: 'white', border: '1px solid #F0E4D0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', minWidth: 190, zIndex: 30 }}>
                            {profile.profileVisibility === 'HIDDEN' ? (
                              <button onClick={() => updateVisibility(profile.id, 'ACTIVE')} style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#16a34a', fontFamily: "'Outfit',sans-serif" }}>✅ Set Active</button>
                            ) : (
                              <button onClick={() => updateVisibility(profile.id, 'HIDDEN')} style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#2A1A1A', fontFamily: "'Outfit',sans-serif" }}>🙈 Hide Profile</button>
                            )}
                            <button onClick={() => updateVisibility(profile.id, 'MATCHED')} style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#2A1A1A', fontFamily: "'Outfit',sans-serif" }}>💍 Mark as Matched</button>
                            <div style={{ borderTop: '1px solid #F0E4D0' }} />
                            <button onClick={() => { setDeleteTarget({ id: profile.id, name: `${profile.firstName} ${profile.lastName}` }); setOpenMenu(null); }} style={{ display: 'block', width: '100%', padding: '10px 16px', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: '#ef4444', fontFamily: "'Outfit',sans-serif" }}>🗑️ Delete Profile</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ══ SECTION 3: Latest Interest Feed — 2-column grid ══ */}
      {feed.length > 0 && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF0FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>💌</div>
            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1.05rem', color: '#2A1A1A' }}>Interest Feed</span>
            <span style={{ background: '#F0E4D0', color: '#7A6A5A', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>{feed.length}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {feed.map(item => {
              const s = item.sender;
              const r = item.receiver;
              const sPhoto = s.photos?.[0]?.imageUrl;
              const rPhoto = r?.photos?.[0]?.imageUrl;
              const statusColors: Record<string, { bg: string; color: string; label: string; border: string }> = {
                PENDING:  { bg: '#FFFBEB', color: '#92400E', label: '⏳ Pending',  border: '#FDE68A' },
                ACCEPTED: { bg: '#ECFDF5', color: '#065F46', label: '✓ Accepted', border: '#A7F3D0' },
                DECLINED: { bg: '#FEF2F2', color: '#991B1B', label: '✗ Declined', border: '#FECACA' },
              };
              const sc = statusColors[item.status] ?? statusColors.PENDING;
              const receiverHref = r ? `/partners/dashboard/matchmaker/profiles/${r.id}` : '#';

              return (
                <div key={item.id} style={{ background: 'white', borderRadius: 20, border: `1.5px solid ${sc.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>

                  {/* Status bar */}
                  <div style={{ background: sc.bg, padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: sc.color, fontFamily: "'Outfit',sans-serif" }}>{sc.label}</span>
                    <span style={{ fontSize: 11, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>{timeAgo(item.createdAt)}</span>
                  </div>

                  {/* Profiles row */}
                  <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: 10 }}>

                    {/* Sender card */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: sPhoto ? `url(${sPhoto}) center/cover` : s.gender === 'FEMALE' ? 'linear-gradient(135deg,#fce7f3,#fbcfe8)' : 'linear-gradient(135deg,#dbeafe,#bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', overflow: 'hidden', border: '2px solid #F0E4D0', flexShrink: 0 }}>
                        {!sPhoto && (s.gender === 'MALE' ? '👨' : '👩')}
                      </div>
                      <div style={{ textAlign: 'center', minWidth: 0, width: '100%' }}>
                        {s.referenceCode && <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9A8A7A', marginBottom: 2 }}>{s.referenceCode}</div>}
                        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '0.82rem', color: '#2A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.firstName} {s.lastName}
                          {s.isVerified && <span style={{ background: '#4ABEAA', color: 'white', borderRadius: 10, padding: '1px 5px', fontSize: '0.55rem', fontWeight: 700, marginLeft: 4 }}>✓</span>}
                        </div>
                        <div style={{ fontSize: 11, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>{calcAge(s.dateOfBirth)} yrs</div>
                      </div>
                    </div>

                    {/* Arrow */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#F4A435,#E8735A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 16, fontWeight: 700 }}>→</div>
                      <span style={{ fontSize: 9, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Request</span>
                    </div>

                    {/* Receiver card */}
                    <Link href={receiverHref} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, textDecoration: 'none', minWidth: 0 }}>
                      <div style={{ width: 64, height: 64, borderRadius: 16, background: rPhoto ? `url(${rPhoto}) center/cover` : r?.gender === 'FEMALE' ? 'linear-gradient(135deg,#fce7f3,#fbcfe8)' : 'linear-gradient(135deg,#dbeafe,#bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', overflow: 'hidden', border: '2.5px solid #F4A43560', flexShrink: 0 }}>
                        {!rPhoto && (r ? (r.gender === 'MALE' ? '👨' : '👩') : '👤')}
                      </div>
                      <div style={{ textAlign: 'center', minWidth: 0, width: '100%' }}>
                        {r?.referenceCode && <div style={{ fontFamily: 'monospace', fontSize: 9, color: '#9A8A7A', marginBottom: 2 }}>{r.referenceCode}</div>}
                        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '0.82rem', color: '#2A1A1A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r ? `${r.firstName} ${r.lastName}` : '–'}
                        </div>
                        {r && <div style={{ fontSize: 11, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>{calcAge(r.dateOfBirth)} yrs</div>}
                      </div>
                    </Link>
                  </div>

                  {/* Tags + action */}
                  <div style={{ padding: '0 16px 14px', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    {[s.religion?.name, s.highestEducation?.name].filter(Boolean).map((t, i) => (
                      <span key={i} style={{ background: '#F5F0EB', color: '#7A6A5A', borderRadius: 20, padding: '2px 10px', fontSize: '0.68rem', fontFamily: "'Outfit',sans-serif" }}>{t}</span>
                    ))}
                    {item.status === 'PENDING' && (
                      <button
                        onClick={() => setReviewItem(item)}
                        style={{ marginLeft: 'auto', background: 'linear-gradient(135deg,#7B8FE8,#5B6FD8)', color: 'white', border: 'none', borderRadius: 50, padding: '6px 14px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
                      >
                        Review →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compatibility modal */}
      {reviewItem && (
        <CompatibilityModal
          item={reviewItem}
          token={token}
          onClose={() => setReviewItem(null)}
          onRespond={(matchId, action) => {
            setFeed(prev => prev.map(f => f.id === matchId ? { ...f, status: action } : f));
            setReviewItem(null);
            load();
          }}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmModal
          profileName={deleteTarget.name}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
