'use client';
import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Profile {
  id: number;
  firstName: string; lastName: string; gender: string;
  dateOfBirth: string; maritalStatus: string; isVerified: boolean;
  status: string; referenceCode?: string; createdByType?: string;
  height?: number; weight?: number; bodyType?: string; physicalStatus?: string; bloodGroup?: string;
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
  citizenship?: { name: string }; grewUpInCountryIds?: number[];
  hobbies?: string[]; favMusic?: string[]; favMusicOther?: string;
  favSports?: string[]; favSportsOther?: string; favFood?: string[];
  horoscopeAvailable?: boolean;
  showPhoto?: boolean; showFullAge?: boolean; showFirstName?: boolean;
  profileVisibility?: string;
  contactMethods?: string[]; contactWhatsapp?: string; contactPhone?: string; contactEmail?: string;
  photos: { id: number; imageUrl: string; isPrimary: boolean }[];
  preference?: {
    minAge?: number; maxAge?: number; minHeight?: number; maxHeight?: number;
    maritalStatus?: string[]; physicalStatus?: string[];
    religionIds?: number[]; motherTongueIds?: number[];
    citizenshipIds?: number[]; countryLivingIds?: number[];
    eatingHabits?: string[]; smokingHabit?: string; drinkingHabit?: string;
    education?: { name: string }; occupation?: string;
    annualIncomeMin?: number; annualIncomeMax?: number; aboutPartner?: string;
  };
}

interface MatchProfile {
  id: number; firstName: string; lastName: string; gender: string;
  dateOfBirth: string; maritalStatus: string; isVerified: boolean;
  countryLiving?: { name: string }; religion?: { name: string };
  occupation?: { name: string }; highestEducation?: { name: string };
  motherTongue?: { name: string }; height?: number; aboutMe?: string;
  createdByType?: string; createdByMe?: boolean; createdByBusinessName?: string | null;
  photos: { imageUrl: string }[];
}

interface Request {
  id: number; status: string; message?: string; createdAt: string;
  sender: MatchProfile;
}

// requestStatusMap value: { status, direction }
// direction: 'SENT' = this profile sent the request, 'RECEIVED' = incoming
interface RequestEntry { status: string; direction: 'SENT' | 'RECEIVED'; matchId?: number }

interface LookupItem { id: number; name: string }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}
function fmt(e?: string | null) {
  return e ? e.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '–';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  const empty = value === null || value === undefined || value === '' || value === '–' || value === '-';
  return (
    <div style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: '1px solid #F5F0EB' }}>
      <div style={{ width: 155, flexShrink: 0, fontSize: '0.78rem', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '0.86rem', fontFamily: "'Outfit',sans-serif", color: empty ? '#C5B9AF' : '#2A1A1A', fontStyle: empty ? 'italic' : 'normal' }}>
        {empty ? '—' : String(value)}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 16, padding: '20px 22px', border: '1px solid #F0E4D0', marginBottom: 14 }}>
      <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '0.95rem', color: '#2A1A1A', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #F4A435', display: 'inline-block' }}>{title}</div>
      {children}
    </div>
  );
}

function TagBadges({ values, label }: { values?: string[]; label: string }) {
  const empty = !values?.length;
  return (
    <div style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: '1px solid #F5F0EB', alignItems: 'flex-start' }}>
      <div style={{ width: 155, flexShrink: 0, fontSize: '0.78rem', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: empty ? 0 : 4 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {empty
          ? <span style={{ fontSize: '0.86rem', color: '#C5B9AF', fontFamily: "'Outfit',sans-serif", fontStyle: 'italic' }}>—</span>
          : values!.map((v, i) => (
              <span key={i} style={{ background: '#FFF3E0', color: '#E8735A', borderRadius: 20, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{fmt(v)}</span>
            ))
        }
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:  { bg: '#FFF3E0', color: '#E8735A', label: '⏳ Pending' },
  ACCEPTED: { bg: '#E8F8F5', color: '#4ABEAA', label: '💑 Accepted' },
  DECLINED: { bg: '#FFF0EE', color: '#E8735A', label: '✗ Declined' },
};

const REQUEST_BTN: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:  { bg: 'linear-gradient(135deg,#FEF3C7,#FDE68A)', color: '#92400E', label: '⏳ Pending' },
  ACCEPTED: { bg: 'linear-gradient(135deg,#D1FAE5,#A7F3D0)',  color: '#065F46', label: '✓ Accepted' },
  DECLINED: { bg: 'linear-gradient(135deg,#FEE2E2,#FECACA)',  color: '#7F1D1D', label: '✗ Declined' },
};

// ─── Full profile modal ────────────────────────────────────────────────────────

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
  hobbies?: string[]; favMusic?: string[]; favMusicOther?: string;
  favSports?: string[]; favSportsOther?: string; favFood?: string[];
  photos: { id: number; imageUrl: string; isPrimary: boolean }[];
}

function ModalInfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #F5F0EB' }}>
      <div style={{ width: 140, flexShrink: 0, fontSize: '0.73rem', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '0.83rem', color: '#2A1A1A', fontFamily: "'Outfit',sans-serif" }}>{String(value)}</div>
    </div>
  );
}

function ModalTagBadges({ values, label }: { values?: string[]; label: string }) {
  if (!values?.length) return null;
  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid #F5F0EB', alignItems: 'flex-start' }}>
      <div style={{ width: 140, flexShrink: 0, fontSize: '0.73rem', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: 3 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {values.map((v, i) => (
          <span key={i} style={{ background: '#FFF3E0', color: '#E8735A', borderRadius: 20, padding: '2px 9px', fontSize: '0.73rem', fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{fmt(v)}</span>
        ))}
      </div>
    </div>
  );
}

function ModalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '0.88rem', color: '#2A1A1A', marginBottom: 10, paddingBottom: 6, borderBottom: '2px solid #F4A435', display: 'inline-block' }}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

function ProfileViewModal({
  profileId,
  token,
  requestEntry,
  senderProfileId,
  onClose,
  onRequestSent,
  onRespond,
}: {
  profileId: number;
  token: string | null;
  requestEntry?: RequestEntry;
  senderProfileId: number;
  onClose: () => void;
  onRequestSent: (receiverId: number) => void;
  onRespond: (senderId: number, matchId: number, action: 'ACCEPTED' | 'DECLINED') => void;
}) {
  const [full, setFull] = useState<FullProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [acting, setActing] = useState<'ACCEPTED' | 'DECLINED' | null>(null);
  const [sendError, setSendError] = useState('');
  const [localEntry, setLocalEntry] = useState<RequestEntry | undefined>(requestEntry);
  const [matchScore, setMatchScore] = useState<number | null>(null);
  const [scoreAnimated, setScoreAnimated] = useState(0);

  useEffect(() => {
    setLocalEntry(requestEntry);
  }, [requestEntry]);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/profiles/${profileId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.profile) {
          setFull(d.profile);
          const pi = d.profile.photos?.findIndex((ph: any) => ph.isPrimary);
          setPhotoIdx(pi >= 0 ? pi : 0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch(`${API}/api/matchmaker/profiles/${senderProfileId}/match-score/${profileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (typeof d.score === 'number') {
          setMatchScore(d.score);
          // Animate counter from 0 to score
          let current = 0;
          const step = Math.ceil(d.score / 40);
          const timer = setInterval(() => {
            current = Math.min(current + step, d.score);
            setScoreAnimated(current);
            if (current >= d.score) clearInterval(timer);
          }, 30);
        }
      })
      .catch(() => {});
  }, [profileId, token, senderProfileId]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  async function handleSend() {
    if (!token) return;
    setSending(true);
    setSendError('');
    try {
      const res = await fetch(`${API}/api/matchmaker/profiles/${senderProfileId}/send-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId: profileId, message: message.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send request');
      const newEntry: RequestEntry = { status: 'PENDING', direction: 'SENT', matchId: data.match?.id };
      setLocalEntry(newEntry);
      onRequestSent(profileId);
      setMessage('');
    } catch (err: any) {
      setSendError(err.message);
    } finally {
      setSending(false);
    }
  }

  async function handleRespond(action: 'ACCEPTED' | 'DECLINED') {
    if (!token || !localEntry?.matchId) return;
    setActing(action);
    try {
      const res = await fetch(`${API}/api/matchmaker/profiles/${senderProfileId}/requests/${localEntry.matchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        setLocalEntry(prev => prev ? { ...prev, status: action } : prev);
        onRespond(profileId, localEntry.matchId!, action);
      } else {
        console.error(data.message);
      }
    } catch { /* silent */ } finally {
      setActing(null);
    }
  }

  const currentPhoto = full?.photos?.[photoIdx];
  const age = full ? calcAge(full.dateOfBirth) : 0;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(26,10,5,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#FFFBF7', borderRadius: 24, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.28)', overflow: 'hidden' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #F0E4D0', background: 'white', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: '1.05rem', color: '#2A1A1A' }}>
            {loading ? 'Loading…' : full ? `${full.firstName} ${full.lastName}` : 'Profile'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', color: '#9A8A7A', lineHeight: 1, padding: '4px 8px', borderRadius: 8 }}>✕</button>
        </div>

        {/* Scrollable body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>Loading profile…</div>
          ) : !full ? (
            <div style={{ textAlign: 'center', padding: 60, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>Profile not found.</div>
          ) : (
            <>
              {/* Hero strip */}
              <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', background: 'white', borderBottom: '1px solid #F0E4D0' }}>
                {/* Photo column */}
                <div style={{ flexShrink: 0 }}>
                  <div style={{ height: 240, background: currentPhoto?.imageUrl ? `url(${currentPhoto.imageUrl}) center/cover` : 'linear-gradient(135deg,#F4A435,#E8735A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {!currentPhoto?.imageUrl && <span style={{ fontSize: '4rem', opacity: 0.4 }}>{full.gender === 'MALE' ? '👨' : '👩'}</span>}
                  </div>
                  {full.photos?.length > 1 && (
                    <div style={{ display: 'flex', gap: 4, padding: 8, background: '#FFFBF7', flexWrap: 'wrap' }}>
                      {full.photos.map((ph, i) => (
                        <div key={ph.id} onClick={() => setPhotoIdx(i)} style={{ width: 36, height: 36, borderRadius: 7, background: `url(${ph.imageUrl}) center/cover`, border: i === photoIdx ? '2px solid #F4A435' : '2px solid transparent', cursor: 'pointer', opacity: i === photoIdx ? 1 : 0.6 }} />
                      ))}
                    </div>
                  )}
                </div>
                {/* Basic info column */}
                <div style={{ padding: '20px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <h2 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: '1.25rem', color: '#2A1A1A', margin: 0 }}>
                          {full.firstName} {full.lastName}
                        </h2>
                        {full.isVerified && <span style={{ background: '#4ABEAA', color: 'white', borderRadius: 20, padding: '2px 9px', fontSize: '0.68rem', fontWeight: 700 }}>✓ Verified</span>}
                      </div>
                    </div>
                    {/* Match score circle */}
                    {matchScore !== null && (() => {
                      const r = 28;
                      const circ = 2 * Math.PI * r;
                      const dash = (scoreAnimated / 100) * circ;
                      const color = scoreAnimated >= 75 ? '#4ABEAA' : scoreAnimated >= 50 ? '#F4A435' : '#E8735A';
                      return (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                          <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
                            <circle cx="36" cy="36" r={r} fill="none" stroke="#F0E4D0" strokeWidth="5" />
                            <circle
                              cx="36" cy="36" r={r} fill="none"
                              stroke={color} strokeWidth="5"
                              strokeDasharray={`${dash} ${circ}`}
                              strokeLinecap="round"
                              style={{ transition: 'stroke-dasharray 0.05s linear' }}
                            />
                            <text
                              x="36" y="36"
                              textAnchor="middle" dominantBaseline="central"
                              style={{ transform: 'rotate(90deg)', transformOrigin: '36px 36px' }}
                              fill={color} fontSize="13" fontWeight="800" fontFamily="'Outfit',sans-serif"
                            >
                              {scoreAnimated}%
                            </text>
                          </svg>
                          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", marginTop: 2, textAlign: 'center' }}>Match</span>
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.82rem', color: '#7A6A5A', marginBottom: 10 }}>
                    {age} yrs · {fmt(full.gender)} · {fmt(full.maritalStatus)}{full.countryLiving ? ` · ${full.countryLiving.name}` : ''}
                  </div>
                  {full.referenceCode && (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: '#9A8A7A', background: '#F5F0EB', borderRadius: 6, padding: '2px 8px', display: 'inline-block', marginBottom: 10 }}>{full.referenceCode}</span>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 12 }}>
                    {[full.religion?.name, full.highestEducation?.name, full.occupation?.name, full.motherTongue?.name].filter(Boolean).map((t, i) => (
                      <span key={i} style={{ background: '#FFF3E0', color: '#E8735A', borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{t}</span>
                    ))}
                  </div>
                  {full.aboutMe && (
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', color: '#5A4A3A', lineHeight: 1.65, background: '#FFFBF7', borderRadius: 10, padding: '9px 12px', border: '1px solid #F0E4D0' }}>
                      {full.aboutMe}
                    </div>
                  )}
                </div>
              </div>

              {/* Profile details */}
              <div style={{ padding: '22px 24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                  <div style={{ paddingRight: 20 }}>
                    <ModalSection title="📋 Basic Info">
                      <ModalInfoRow label="Age" value={age + ' years'} />
                      <ModalInfoRow label="Marital Status" value={fmt(full.maritalStatus)} />
                      <ModalInfoRow label="Height" value={full.height ? `${full.height} cm` : null} />
                      <ModalInfoRow label="Weight" value={full.weight ? `${full.weight} kg` : null} />
                      <ModalInfoRow label="Body Type" value={fmt(full.bodyType)} />
                      <ModalInfoRow label="Physical Status" value={fmt(full.physicalStatus)} />
                    </ModalSection>
                    <ModalSection title="🎓 Education & Career">
                      <ModalInfoRow label="Education" value={full.highestEducation?.name} />
                      <ModalInfoRow label="Employment" value={fmt(full.employmentStatus)} />
                      <ModalInfoRow label="Occupation" value={full.occupation?.name} />
                      <ModalInfoRow label="Income" value={full.annualIncome ? `${full.currency ?? ''} ${full.annualIncome.toLocaleString()}`.trim() : null} />
                    </ModalSection>
                  </div>
                  <div style={{ paddingLeft: 20, borderLeft: '1px solid #F5F0EB' }}>
                    <ModalSection title="🙏 Religion & Lifestyle">
                      <ModalInfoRow label="Religion" value={full.religion?.name} />
                      <ModalInfoRow label="Denomination" value={full.denomination} />
                      <ModalInfoRow label="Mother Tongue" value={full.motherTongue?.name} />
                      <ModalTagBadges values={full.eatingHabits} label="Eating" />
                      <ModalInfoRow label="Smoking" value={fmt(full.smokingHabit)} />
                      <ModalInfoRow label="Drinking" value={fmt(full.drinkingHabit)} />
                    </ModalSection>
                    <ModalSection title="📍 Location">
                      <ModalInfoRow label="Native" value={[full.nativeCountry?.name, full.nativeCountryState, full.nativeCountryCity].filter(Boolean).join(', ')} />
                      <ModalInfoRow label="Living In" value={[full.countryLiving?.name, full.countryLivingState, full.countryLivingCity].filter(Boolean).join(', ')} />
                      <ModalInfoRow label="Citizenship" value={full.citizenship?.name} />
                    </ModalSection>
                  </div>
                </div>

                {(full.fatherName || full.motherName || full.noOfBrothers !== undefined || full.aboutFamily) && (
                  <ModalSection title="👨‍👩‍👧‍👦 Family">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 20px' }}>
                      <div>
                        <ModalInfoRow label="Father" value={full.fatherName} />
                        <ModalInfoRow label="Father Occ." value={full.fatherOccupation?.name} />
                        <ModalInfoRow label="Brothers" value={full.noOfBrothers !== undefined ? `${full.noOfBrothers} (${full.brothersMarried ?? 0} married)` : null} />
                      </div>
                      <div>
                        <ModalInfoRow label="Mother" value={full.motherName} />
                        <ModalInfoRow label="Mother Occ." value={full.motherOccupation?.name} />
                        <ModalInfoRow label="Sisters" value={full.noOfSisters !== undefined ? `${full.noOfSisters} (${full.sistersMarried ?? 0} married)` : null} />
                      </div>
                    </div>
                    {full.aboutFamily && <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.8rem', color: '#5A4A3A', lineHeight: 1.65, background: '#FFFBF7', borderRadius: 8, padding: '9px 12px', border: '1px solid #F0E4D0', marginTop: 8 }}>{full.aboutFamily}</div>}
                  </ModalSection>
                )}

                {(full.hobbies?.length || full.favMusic?.length || full.favSports?.length || full.favFood?.length) ? (
                  <ModalSection title="🎨 Hobbies & Interests">
                    <ModalTagBadges values={full.hobbies} label="Hobbies" />
                    <ModalTagBadges values={full.favMusic} label="Music" />
                    {full.favMusicOther && <ModalInfoRow label="Other Music" value={full.favMusicOther} />}
                    <ModalTagBadges values={full.favSports} label="Sports" />
                    {full.favSportsOther && <ModalInfoRow label="Other Sports" value={full.favSportsOther} />}
                    <ModalTagBadges values={full.favFood} label="Food" />
                  </ModalSection>
                ) : null}
              </div>
            </>
          )}
        </div>

        {/* Sticky footer — actions */}
        {!loading && full && (
          <div style={{ borderTop: '1px solid #F0E4D0', padding: '16px 24px', background: 'white', flexShrink: 0 }}>
            {localEntry ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                {/* Status badge */}
                {(() => {
                  const isReceived = localEntry.direction === 'RECEIVED';
                  const badge: Record<string, { bg: string; color: string; label: string }> = {
                    PENDING:  { bg: '#FFF3CD', color: '#856404', label: isReceived ? '⏳ Request Received' : '⏳ Request Sent' },
                    ACCEPTED: { bg: '#D4EDDA', color: '#155724', label: '✓ Connected' },
                    DECLINED: { bg: '#F8D7DA', color: '#721C24', label: isReceived ? '✗ You Declined' : '✗ Request Declined' },
                  };
                  const b = badge[localEntry.status ?? ''] ?? { bg: '#F5F0EB', color: '#9A8A7A', label: localEntry.status ?? '' };
                  return (
                    <span style={{ background: b.bg, color: b.color, borderRadius: 20, padding: '5px 14px', fontSize: '0.82rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
                      {b.label}
                    </span>
                  );
                })()}
                {/* Accept/Decline for incoming pending */}
                {localEntry.direction === 'RECEIVED' && localEntry.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => handleRespond('ACCEPTED')}
                      disabled={!!acting}
                      style={{ padding: '9px 22px', borderRadius: 50, background: 'linear-gradient(135deg,#4ABEAA,#2A9D8F)', color: 'white', border: 'none', fontSize: '0.83rem', fontWeight: 700, cursor: acting ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif", opacity: acting ? 0.7 : 1 }}
                    >
                      {acting === 'ACCEPTED' ? '…' : '✓ Accept Request'}
                    </button>
                    <button
                      onClick={() => handleRespond('DECLINED')}
                      disabled={!!acting}
                      style={{ padding: '9px 22px', borderRadius: 50, background: 'white', color: '#E8735A', border: '1.5px solid #E8735A', fontSize: '0.83rem', fontWeight: 700, cursor: acting ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif", opacity: acting ? 0.7 : 1 }}
                    >
                      {acting === 'DECLINED' ? '…' : '✗ Decline'}
                    </button>
                  </>
                )}
                <button onClick={onClose} style={{ marginLeft: 'auto', padding: '9px 20px', borderRadius: 50, background: 'white', color: '#9A8A7A', border: '1.5px solid #F0E4D0', fontSize: '0.83rem', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  Close
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Add a personal message (optional)…"
                  rows={2}
                  style={{ width: '100%', padding: '9px 14px', borderRadius: 10, border: '1.5px solid #F0E4D0', fontFamily: "'Outfit',sans-serif", fontSize: '0.83rem', color: '#2A1A1A', background: '#FFFBF7', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                />
                {sendError && <div style={{ fontSize: 12, color: '#E8735A', fontFamily: "'Outfit',sans-serif" }}>⚠ {sendError}</div>}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    onClick={handleSend}
                    disabled={sending}
                    style={{ flex: 2, padding: '11px', borderRadius: 50, background: sending ? '#F0E4D0' : 'linear-gradient(135deg,#F4A435,#E8735A)', color: sending ? '#9A8A7A' : 'white', border: 'none', fontSize: '0.85rem', fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif" }}
                  >
                    {sending ? 'Sending…' : '💌 Send Match Request'}
                  </button>
                  <button onClick={onClose} style={{ flex: 1, padding: '11px', borderRadius: 50, background: 'white', color: '#9A8A7A', border: '1.5px solid #F0E4D0', fontSize: '0.85rem', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MatchProfileCard({
  p,
  senderProfileId,
  token,
  requestEntry,
  onRequestSent,
  onRespond,
}: {
  p: MatchProfile;
  senderProfileId: number;
  token: string | null;
  requestEntry?: RequestEntry;
  onRequestSent: (receiverId: number) => void;
  onRespond: (senderId: number, matchId: number, action: 'ACCEPTED' | 'DECLINED') => void;
}) {
  const photo = p.photos?.[0]?.imageUrl;
  const age   = calcAge(p.dateOfBirth);
  const [showModal, setShowModal] = useState(false);

  return (
    <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #F0E4D0', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
      <div style={{ height: 180, background: photo ? `url(${photo}) center/cover` : 'linear-gradient(135deg,#F4A435,#E8735A)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', flexShrink: 0 }}>
        {!photo && <span style={{ fontSize: '3.5rem', opacity: 0.45 }}>{p.gender === 'MALE' ? '👨' : '👩'}</span>}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55%', background: 'linear-gradient(transparent,rgba(0,0,0,0.45))' }} />
        <div style={{ position: 'absolute', bottom: 10, left: 12 }}>
          <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', fontFamily: "'Playfair Display',serif", textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>
            {p.firstName} {p.lastName[0]}.
          </div>
          <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem', fontFamily: "'Outfit',sans-serif" }}>
            {age} yrs · {p.countryLiving?.name ?? '–'}
          </div>
        </div>
        {p.isVerified && (
          <div style={{ position: 'absolute', top: 8, right: 8, background: '#4ABEAA', color: 'white', borderRadius: 20, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700 }}>✓</div>
        )}
      </div>
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {[p.religion?.name, p.highestEducation?.name, p.occupation?.name].filter(Boolean).map((t, i) => (
            <span key={i} style={{ background: '#FFF3E0', color: '#E8735A', borderRadius: 20, padding: '3px 9px', fontSize: '0.7rem', fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{t}</span>
          ))}
        </div>
        {p.height && <div style={{ fontSize: '0.78rem', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>{p.height} cm · {fmt(p.maritalStatus)}</div>}
        {/* Created by badge — only for matchmaker-created profiles */}
        {p.createdByType === 'MATCHMAKER' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {p.createdByMe
              ? <span style={{ fontSize: '0.68rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif", background: '#E8F8F5', color: '#2A9D8F', borderRadius: 20, padding: '2px 8px' }}>✦ Created by You</span>
              : <span style={{ fontSize: '0.68rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif", background: '#FFF3E0', color: '#E8735A', borderRadius: 20, padding: '2px 8px' }}>🤝 {p.createdByBusinessName ?? 'Another Matchmaker'}</span>
            }
          </div>
        )}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* View Profile opens modal */}
          <button
            onClick={() => setShowModal(true)}
            style={{ display: 'block', textAlign: 'center', padding: '7px', background: 'white', color: '#E8735A', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, border: '1.5px solid #F0E4D0', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", width: '100%' }}
          >
            View Profile
          </button>
          {requestEntry ? (
            requestEntry.direction === 'RECEIVED' && requestEntry.status === 'PENDING' ? (
              <div style={{ display: 'flex', gap: 5 }}>
                <button
                  onClick={() => onRespond(p.id, requestEntry.matchId!, 'ACCEPTED')}
                  style={{ flex: 1, padding: '7px', background: 'linear-gradient(135deg,#4ABEAA,#2A9D8F)', color: 'white', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
                >✓ Accept</button>
                <button
                  onClick={() => onRespond(p.id, requestEntry.matchId!, 'DECLINED')}
                  style={{ flex: 1, padding: '7px', background: 'white', color: '#E8735A', borderRadius: 10, fontSize: '0.72rem', fontWeight: 700, border: '1.5px solid #F0E4D0', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
                >✗ Decline</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '7px', background: REQUEST_BTN[requestEntry.status]?.bg ?? '#F3F4F6', color: REQUEST_BTN[requestEntry.status]?.color ?? '#6B7280', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
                {requestEntry.direction === 'RECEIVED' ? '📩 ' : ''}{REQUEST_BTN[requestEntry.status]?.label ?? requestEntry.status}
              </div>
            )
          ) : (
            <button
              onClick={() => setShowModal(true)}
              style={{ padding: '7px', background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
            >
              💌 Send Request
            </button>
          )}
        </div>
      </div>

      {/* Full profile modal */}
      {showModal && (
        <ProfileViewModal
          profileId={p.id}
          token={token}
          requestEntry={requestEntry}
          senderProfileId={senderProfileId}
          onClose={() => setShowModal(false)}
          onRequestSent={rid => { onRequestSent(rid); }}
          onRespond={(senderId, matchId, action) => { onRespond(senderId, matchId, action); }}
        />
      )}
    </div>
  );
}

function RequestCard({ req, profileId, token, onRespond }: {
  req: Request;
  profileId: string;
  token: string | null;
  onRespond: (matchId: number, action: 'ACCEPTED' | 'DECLINED') => void;
}) {
  const p = req.sender;
  const photo = p.photos?.[0]?.imageUrl;
  const st = STATUS_STYLE[req.status] ?? STATUS_STYLE.PENDING;
  const [acting, setActing] = useState<'ACCEPTED' | 'DECLINED' | null>(null);

  async function handleAction(action: 'ACCEPTED' | 'DECLINED') {
    if (!token || acting) return;
    setActing(action);
    try {
      const res = await fetch(`${API}/api/matchmaker/profiles/${profileId}/requests/${req.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) onRespond(req.id, action);
      else console.error(data.message);
    } catch { /* silent */ } finally {
      setActing(null);
    }
  }

  return (
    <div style={{ background: 'white', border: '1px solid #F0E4D0', borderRadius: 16, padding: '16px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      {/* Photo */}
      <div style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, background: photo ? `url(${photo}) center/cover` : 'linear-gradient(135deg,#F4A435,#E8735A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {!photo && <span style={{ fontSize: '1.6rem', opacity: 0.6 }}>{p.gender === 'MALE' ? '👨' : '👩'}</span>}
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '0.95rem', color: '#2A1A1A' }}>
            {p.firstName} {p.lastName[0]}.
          </span>
          {p.isVerified && <span style={{ background: '#4ABEAA', color: 'white', borderRadius: 20, padding: '2px 8px', fontSize: '0.68rem', fontWeight: 700 }}>✓</span>}
          <span style={{ background: st.bg, color: st.color, borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif", marginLeft: 'auto' }}>
            {st.label}
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#7A6A5A', fontFamily: "'Outfit',sans-serif", marginBottom: 4 }}>
          {calcAge(p.dateOfBirth)} yrs · {fmt(p.maritalStatus)} · {p.countryLiving?.name ?? '–'}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: req.message ? 8 : 0 }}>
          {[p.religion?.name, p.highestEducation?.name, p.occupation?.name].filter(Boolean).map((t, i) => (
            <span key={i} style={{ background: '#FFF3E0', color: '#E8735A', borderRadius: 20, padding: '2px 8px', fontSize: '0.7rem', fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{t}</span>
          ))}
        </div>
        {req.message && (
          <div style={{ background: '#FFFBF7', border: '1px solid #F0E4D0', borderRadius: 8, padding: '8px 12px', fontSize: '0.8rem', color: '#5A4A3A', fontFamily: "'Outfit',sans-serif", fontStyle: 'italic' }}>
            "{req.message}"
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, flexWrap: 'wrap', gap: 8 }}>
          <span style={{ fontSize: '0.72rem', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>
            {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href={`/partners/dashboard/matchmaker/view/${p.id}`} style={{ fontSize: '0.78rem', fontWeight: 600, color: '#E8735A', textDecoration: 'none', fontFamily: "'Outfit',sans-serif" }}>
              View →
            </Link>
            {req.status === 'PENDING' && (
              <>
                <button
                  onClick={() => handleAction('ACCEPTED')}
                  disabled={!!acting}
                  style={{ padding: '5px 14px', borderRadius: 20, background: 'linear-gradient(135deg,#4ABEAA,#2A9D8F)', color: 'white', border: 'none', fontSize: '0.75rem', fontWeight: 700, cursor: acting ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif", opacity: acting ? 0.7 : 1 }}
                >
                  {acting === 'ACCEPTED' ? '…' : '✓ Accept'}
                </button>
                <button
                  onClick={() => handleAction('DECLINED')}
                  disabled={!!acting}
                  style={{ padding: '5px 14px', borderRadius: 20, background: 'white', color: '#E8735A', border: '1.5px solid #F0E4D0', fontSize: '0.75rem', fontWeight: 700, cursor: acting ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif", opacity: acting ? 0.7 : 1 }}
                >
                  {acting === 'DECLINED' ? '…' : '✗ Decline'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Photos tab ───────────────────────────────────────────────────────────────

function PhotosTab({ profileId, token, photos: initPhotos }: { profileId: number; token: string | null; photos: { id: number; imageUrl: string; isPrimary: boolean }[] }) {
  const [photos, setPhotos] = useState(initPhotos);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingId, setSettingId] = useState<number | null>(null);
  const [error, setError] = useState('');

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0 || !token) return;
    setError('');
    setUploading(true);
    const form = new FormData();
    Array.from(files).forEach(f => form.append('photos', f));
    try {
      const res = await fetch(`${API}/api/matchmaker/profiles/${profileId}/photos`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const d = await res.json();
      if (!res.ok) { setError(d.message || 'Upload failed'); return; }
      setPhotos(prev => [...prev, ...d.photos]);
    } catch {
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(photoId: number) {
    if (!token) return;
    setDeletingId(photoId);
    try {
      const res = await fetch(`${API}/api/matchmaker/profiles/${profileId}/photos/${photoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPhotos(prev => prev.filter(p => p.id !== photoId));
      else { const d = await res.json(); setError(d.message || 'Delete failed'); }
    } catch {
      setError('Delete failed');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetPrimary(photoId: number) {
    if (!token) return;
    setSettingId(photoId);
    try {
      const res = await fetch(`${API}/api/matchmaker/profiles/${profileId}/photos/${photoId}/primary`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setPhotos(prev => prev.map(p => ({ ...p, isPrimary: p.id === photoId })));
      else { const d = await res.json(); setError(d.message || 'Failed'); }
    } catch {
      setError('Failed to set primary');
    } finally {
      setSettingId(null);
    }
  }

  const canUpload = photos.length < 10;

  return (
    <div>
      {/* Upload area */}
      {canUpload && (
        <div style={{ background: 'white', borderRadius: 16, border: '2px dashed #F0E4D0', padding: '28px 24px', textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 10 }}>📷</div>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1rem', color: '#2A1A1A', marginBottom: 6 }}>Upload Photos</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#9A8A7A', marginBottom: 16 }}>
            {photos.length}/10 photos uploaded · Max 8MB per file · JPG, PNG, WEBP
          </div>
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', borderRadius: 50, padding: '11px 28px', fontSize: 13, fontWeight: 700, cursor: uploading ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif", opacity: uploading ? 0.7 : 1 }}>
            {uploading ? '⏳ Uploading…' : '⬆ Choose Photos'}
            <input type="file" accept="image/*" multiple disabled={uploading} style={{ display: 'none' }} onChange={e => handleUpload(e.target.files)} />
          </label>
          {error && <div style={{ marginTop: 12, fontSize: 13, color: '#E8735A', fontFamily: "'Outfit',sans-serif" }}>{error}</div>}
        </div>
      )}

      {/* Photos grid */}
      {photos.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 16, border: '1px dashed #F0E4D0', textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: '#9A8A7A' }}>No photos yet. Upload some above.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          {photos.map(photo => (
            <div key={photo.id} style={{ borderRadius: 14, overflow: 'hidden', border: photo.isPrimary ? '3px solid #F4A435' : '2px solid #F0E4D0', background: 'white', boxShadow: photo.isPrimary ? '0 4px 16px rgba(244,164,53,0.25)' : '0 2px 8px rgba(0,0,0,0.04)', position: 'relative' }}>
              <div style={{ height: 200, background: `url(${photo.imageUrl}) center/cover` }} />
              {photo.isPrimary && (
                <div style={{ position: 'absolute', top: 8, left: 8, background: '#F4A435', color: 'white', borderRadius: 20, padding: '3px 10px', fontSize: '0.7rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
                  ⭐ Primary
                </div>
              )}
              <div style={{ padding: '10px 10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {!photo.isPrimary && (
                  <button
                    onClick={() => handleSetPrimary(photo.id)}
                    disabled={settingId === photo.id}
                    style={{ width: '100%', padding: '7px 0', borderRadius: 8, background: '#FFF3E0', color: '#E8735A', border: '1.5px solid #F0E4D0', fontSize: 12, fontWeight: 700, cursor: settingId === photo.id ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif", opacity: settingId === photo.id ? 0.7 : 1 }}
                  >
                    {settingId === photo.id ? '…' : '⭐ Set as Profile Photo'}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(photo.id)}
                  disabled={deletingId === photo.id}
                  style={{ width: '100%', padding: '7px 0', borderRadius: 8, background: 'white', color: '#9A8A7A', border: '1.5px solid #F0E4D0', fontSize: 12, fontWeight: 600, cursor: deletingId === photo.id ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif", opacity: deletingId === photo.id ? 0.7 : 1 }}
                >
                  {deletingId === photo.id ? '…' : '🗑 Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!canUpload && (
        <div style={{ marginTop: 16, textAlign: 'center', fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#9A8A7A' }}>
          Maximum 10 photos reached. Delete some to upload more.
        </div>
      )}
    </div>
  );
}

// ─── Filter bar for matches tab ───────────────────────────────────────────────

interface Filters {
  minAge: string; maxAge: string;
  minHeight: string; maxHeight: string;
  religionId: string; countryLivingId: string;
  maritalStatus: string; educationId: string;
}

const DEFAULT_FILTERS: Filters = {
  minAge: '', maxAge: '', minHeight: '', maxHeight: '',
  religionId: '', countryLivingId: '', maritalStatus: '', educationId: '',
};

const selStyle: React.CSSProperties = {
  padding: '8px 12px', borderRadius: 10, border: '1.5px solid #F0E4D0',
  background: 'white', fontSize: 12, color: '#2A1A1A', outline: 'none',
  fontFamily: "'Outfit',sans-serif", cursor: 'pointer',
};
const numStyle: React.CSSProperties = { ...selStyle, width: 76 };

// ─── Page component ───────────────────────────────────────────────────────────

type Tab = 'profile' | 'photos' | 'matches' | 'requests';

interface Props { params: Promise<{ id: string }> }

export default function MatchmakerViewProfilePage({ params }: Props) {
  const { id } = use(params);
  const { token } = useAuthStore();
  const router = useRouter();

  const [profile, setProfile]     = useState<Profile | null>(null);
  const [loading, setLoading]     = useState(true);
  const [photoIdx, setPhotoIdx]   = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  // Matches tab state
  const [matches, setMatches]       = useState<MatchProfile[]>([]);
  const [matchTotal, setMatchTotal] = useState(0);
  const [matchPage, setMatchPage]   = useState(1);
  const [matchPages, setMatchPages] = useState(1);
  const [matchLoading, setMatchLoading] = useState(false);
  const [filters, setFilters]       = useState<Filters>(DEFAULT_FILTERS);
  const [lookup, setLookup]         = useState<{ religions: LookupItem[]; countries: LookupItem[]; educations: LookupItem[]; maritalStatuses: { value: string; label: string }[] } | null>(null);
  // requestStatusMap: profileId -> { status, direction, matchId }
  const [requestStatusMap, setRequestStatusMap] = useState<Record<number, RequestEntry>>({});

  // Requests tab state
  const [requests, setRequests]         = useState<Request[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsFetched, setRequestsFetched] = useState(false);


  // Load profile
  useEffect(() => {
    if (!token || !id) return;
    fetch(`${API}/api/profiles/${id}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (d.profile) {
          setProfile(d.profile);
          const pi = d.profile.photos?.findIndex((p: any) => p.isPrimary);
          setPhotoIdx(pi >= 0 ? pi : 0);
        }
      })
      .catch(() => router.replace('/partners/dashboard/matchmaker'))
      .finally(() => setLoading(false));
  }, [id, token]);

  // Pre-fill filters from preference once profile loads
  const [prefFilters, setPrefFilters] = useState<Filters>(DEFAULT_FILTERS);
  useEffect(() => {
    if (!profile) return;
    const pref = profile.preference;
    if (!pref) return;
    const built: Filters = {
      minAge:         pref.minAge        ? String(pref.minAge)        : '',
      maxAge:         pref.maxAge        ? String(pref.maxAge)        : '',
      minHeight:      pref.minHeight     ? String(pref.minHeight)     : '',
      maxHeight:      pref.maxHeight     ? String(pref.maxHeight)     : '',
      religionId:     pref.religionIds?.[0] ? String(pref.religionIds[0]) : '',
      countryLivingId: pref.countryLivingIds?.[0] ? String(pref.countryLivingIds[0]) : '',
      maritalStatus:  pref.maritalStatus?.[0] ?? '',
      educationId:    '',
    };
    setPrefFilters(built);
    setFilters(built);
  }, [profile]);

  // Load lookup for filter dropdowns
  useEffect(() => {
    fetch(`${API}/api/profiles/lookup`)
      .then(r => r.json())
      .then(d => setLookup({ religions: d.religions ?? [], countries: d.countries ?? [], educations: d.educations ?? [], maritalStatuses: d.maritalStatuses ?? [] }))
      .catch(() => {});
  }, []);

  // Fetch matched profiles
  const fetchMatches = useCallback((page = 1, f: Filters = filters) => {
    if (!token) return;
    setMatchLoading(true);
    const q = new URLSearchParams({ page: String(page) });
    if (f.minAge)       q.set('minAge', f.minAge);
    if (f.maxAge)       q.set('maxAge', f.maxAge);
    if (f.minHeight)    q.set('minHeight', f.minHeight);
    if (f.maxHeight)    q.set('maxHeight', f.maxHeight);
    if (f.religionId)   q.set('religionId', f.religionId);
    if (f.countryLivingId) q.set('countryLivingId', f.countryLivingId);
    if (f.maritalStatus)   q.set('maritalStatus', f.maritalStatus);
    if (f.educationId)  q.set('educationId', f.educationId);

    fetch(`${API}/api/matchmaker/profiles/${id}/matches?${q}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        setMatches(d.profiles ?? []);
        setMatchTotal(d.total ?? 0);
        setMatchPage(d.page ?? 1);
        setMatchPages(d.totalPages ?? 1);
        // Merge — backend now returns { status, direction, matchId } per entry
        const incoming: Record<number, RequestEntry> = {};
        for (const [k, v] of Object.entries(d.requestStatusMap ?? {})) {
          const entry = v as { status: string; direction: 'SENT' | 'RECEIVED'; matchId: number };
          incoming[Number(k)] = { status: entry.status, direction: entry.direction, matchId: entry.matchId };
        }
        setRequestStatusMap(prev => ({ ...prev, ...incoming }));
      })
      .catch(() => {})
      .finally(() => setMatchLoading(false));
  }, [id, token, filters]);

  // Fetch requests (lazy — only when tab opened)
  const fetchRequests = useCallback(() => {
    if (!token || requestsFetched) return;
    setRequestsLoading(true);
    fetch(`${API}/api/matchmaker/profiles/${id}/requests`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        const reqs: Request[] = d.requests ?? [];
        setRequests(reqs);
        setRequestsFetched(true);
        // Populate requestStatusMap for RECEIVED requests
        setRequestStatusMap(prev => {
          const next = { ...prev };
          for (const r of reqs) {
            next[r.sender.id] = { status: r.status, direction: 'RECEIVED', matchId: r.id };
          }
          return next;
        });
      })
      .catch(() => {})
      .finally(() => setRequestsLoading(false));
  }, [id, token, requestsFetched]);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    if (tab === 'matches' && matches.length === 0 && !matchLoading) fetchMatches(1, filters);
    if (tab === 'requests') fetchRequests();
  }

  function applyFilters() { fetchMatches(1, filters); }
  function resetFilters() { setFilters(prefFilters); fetchMatches(1, prefFilters); }
  function setF(k: keyof Filters, v: string) { setFilters(f => ({ ...f, [k]: v })); }

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>Loading profile…</div>;
  if (!profile) return null;

  const currentPhoto = profile.photos?.[photoIdx];
  const pref = profile.preference;

  const TAB_CONFIG: { key: Tab; label: string; icon: string }[] = [
    { key: 'profile',  label: 'Profile Details', icon: '👤' },
    { key: 'photos',   label: 'Photos',           icon: '📷' },
    { key: 'matches',  label: 'Matched Profiles', icon: '💑' },
    { key: 'requests', label: 'Requests Received', icon: '📩' },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>

      {/* Back + Edit bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <Link href="/partners/dashboard/matchmaker" style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.85rem', color: '#9A8A7A', textDecoration: 'none' }}>
          ← Back to Profiles
        </Link>
        <Link
          href={`/partners/dashboard/matchmaker/profiles/${profile.id}/edit`}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', borderRadius: 50, padding: '10px 22px', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none', fontFamily: "'Outfit',sans-serif", boxShadow: '0 2px 8px rgba(244,164,53,0.35)' }}
        >
          ✏️ Edit Profile
        </Link>
      </div>

      {/* Hero card */}
      <div style={{ background: 'white', borderRadius: 22, overflow: 'hidden', border: '1px solid #F0E4D0', marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr' }}>
          <div>
            <div style={{ height: 300, background: currentPhoto?.imageUrl ? `url(${currentPhoto.imageUrl}) center/cover` : 'linear-gradient(135deg,#F4A435,#E8735A)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!currentPhoto?.imageUrl && <span style={{ fontSize: '5rem', opacity: 0.45 }}>{profile.gender === 'MALE' ? '👨' : '👩'}</span>}
            </div>
            {profile.photos?.length > 1 && (
              <div style={{ display: 'flex', gap: 4, padding: 8, background: '#FFFBF7', flexWrap: 'wrap' }}>
                {profile.photos.map((ph, i) => (
                  <div key={ph.id} onClick={() => setPhotoIdx(i)} style={{ width: 40, height: 40, borderRadius: 8, background: `url(${ph.imageUrl}) center/cover`, border: i === photoIdx ? '2px solid #F4A435' : '2px solid transparent', cursor: 'pointer', opacity: i === photoIdx ? 1 : 0.6 }} />
                ))}
              </div>
            )}
          </div>
          <div style={{ padding: '24px 26px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: '1.4rem', color: '#2A1A1A', margin: 0 }}>
                    {profile.firstName} {profile.lastName}
                  </h1>
                  {profile.isVerified && <span style={{ background: '#4ABEAA', color: 'white', borderRadius: 20, padding: '3px 10px', fontSize: '0.7rem', fontWeight: 700 }}>✓ Verified</span>}
                </div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.84rem', color: '#7A6A5A' }}>
                  {calcAge(profile.dateOfBirth)} yrs · {fmt(profile.gender)} · {fmt(profile.maritalStatus)}{profile.countryLiving ? ` · ${profile.countryLiving.name}` : ''}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                <span style={{ background: profile.profileVisibility === 'ACTIVE' ? '#D1FAE5' : '#F3F4F6', color: profile.profileVisibility === 'ACTIVE' ? '#065F46' : '#6B7280', borderRadius: 20, padding: '4px 12px', fontSize: '0.72rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
                  {profile.profileVisibility === 'ACTIVE' ? '● Active' : '● Hidden'}
                </span>
                {profile.referenceCode && <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#9A8A7A', background: '#F5F0EB', borderRadius: 8, padding: '3px 10px' }}>{profile.referenceCode}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {[profile.religion?.name, profile.highestEducation?.name, profile.occupation?.name, profile.motherTongue?.name].filter(Boolean).map((t, i) => (
                <span key={i} style={{ background: '#FFF3E0', color: '#E8735A', borderRadius: 20, padding: '4px 12px', fontSize: '0.74rem', fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{t}</span>
              ))}
            </div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.84rem', lineHeight: 1.7, background: '#FFFBF7', borderRadius: 10, padding: '10px 14px', border: '1px solid #F0E4D0', color: profile.aboutMe ? '#5A4A3A' : '#C5B9AF', fontStyle: profile.aboutMe ? 'normal' : 'italic' }}>
              {profile.aboutMe || 'No bio added yet…'}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              {[{ label: 'Photo', on: profile.showPhoto }, { label: 'Full age', on: profile.showFullAge }, { label: 'First name', on: profile.showFirstName }, { label: 'Horoscope', on: profile.horoscopeAvailable }].map(item => (
                <span key={item.label} style={{ fontSize: '0.7rem', fontWeight: 600, padding: '3px 9px', borderRadius: 20, fontFamily: "'Outfit',sans-serif", background: item.on ? '#D1FAE5' : '#F3F4F6', color: item.on ? '#065F46' : '#6B7280' }}>
                  {item.on ? '✓' : '✗'} {item.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 4, background: 'white', border: '1px solid #F0E4D0', borderRadius: 16, padding: 6, marginBottom: 20, width: 'fit-content' }}>
        {TAB_CONFIG.map(t => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: activeTab === t.key ? 700 : 500, transition: 'all 0.15s',
              background: activeTab === t.key ? 'linear-gradient(135deg,#F4A435,#E8735A)' : 'transparent',
              color: activeTab === t.key ? 'white' : '#7A6A5A',
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: Profile Details ── */}
      {activeTab === 'profile' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <Section title="📋 Basic Information">
              <InfoRow label="Age" value={calcAge(profile.dateOfBirth) + ' years'} />
              <InfoRow label="Gender" value={fmt(profile.gender)} />
              <InfoRow label="Marital Status" value={fmt(profile.maritalStatus)} />
              <InfoRow label="Height" value={profile.height ? `${profile.height} cm` : null} />
              <InfoRow label="Weight" value={profile.weight ? `${profile.weight} kg` : null} />
              <InfoRow label="Body Type" value={fmt(profile.bodyType)} />
              <InfoRow label="Physical Status" value={fmt(profile.physicalStatus)} />
              <InfoRow label="Blood Group" value={profile.bloodGroup} />
            </Section>
            <Section title="🙏 Religion & Language">
              <InfoRow label="Religion" value={profile.religion?.name} />
              <InfoRow label="Denomination" value={profile.denomination} />
              <InfoRow label="Mother Tongue" value={profile.motherTongue?.name} />
              <TagBadges values={profile.eatingHabits} label="Eating Habits" />
              <InfoRow label="Smoking" value={fmt(profile.smokingHabit)} />
              <InfoRow label="Drinking" value={fmt(profile.drinkingHabit)} />
            </Section>
            <Section title="🎓 Education & Career">
              <InfoRow label="Education" value={profile.highestEducation?.name} />
              <InfoRow label="Employment" value={fmt(profile.employmentStatus)} />
              <InfoRow label="Occupation" value={profile.occupation?.name} />
              <InfoRow label="Annual Income" value={profile.annualIncome ? `${profile.currency ?? ''} ${profile.annualIncome.toLocaleString()}`.trim() : null} />
            </Section>
            <Section title="📍 Location">
              <InfoRow label="Native Country" value={[profile.nativeCountry?.name, profile.nativeCountryState, profile.nativeCountryCity].filter(Boolean).join(', ')} />
              <InfoRow label="Currently In" value={[profile.countryLiving?.name, profile.countryLivingState, profile.countryLivingCity].filter(Boolean).join(', ')} />
              <InfoRow label="Citizenship" value={profile.citizenship?.name} />
              <TagBadges
                values={profile.grewUpInCountryIds?.map(cid => lookup?.countries.find(c => c.id === cid)?.name ?? String(cid))}
                label="Grew Up In"
              />
            </Section>
          </div>

          <Section title="👨‍👩‍👧‍👦 Family Background">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <InfoRow label="Father's Name" value={profile.fatherName} />
                <InfoRow label="Father's Occupation" value={profile.fatherOccupation?.name} />
                <InfoRow label="Brothers" value={profile.noOfBrothers !== undefined ? `${profile.noOfBrothers} (${profile.brothersMarried ?? 0} married)` : null} />
              </div>
              <div>
                <InfoRow label="Mother's Name" value={profile.motherName} />
                <InfoRow label="Mother's Occupation" value={profile.motherOccupation?.name} />
                <InfoRow label="Sisters" value={profile.noOfSisters !== undefined ? `${profile.noOfSisters} (${profile.sistersMarried ?? 0} married)` : null} />
              </div>
            </div>
            <div style={{ padding: '9px 0', borderBottom: '1px solid #F5F0EB' }}>
              <div style={{ fontSize: '0.78rem', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>About Family</div>
              {profile.aboutFamily
                ? <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.84rem', color: '#5A4A3A', lineHeight: 1.7, background: '#FFFBF7', borderRadius: 10, padding: '12px 14px', border: '1px solid #F0E4D0' }}>{profile.aboutFamily}</div>
                : <div style={{ fontSize: '0.86rem', color: '#C5B9AF', fontFamily: "'Outfit',sans-serif", fontStyle: 'italic' }}>—</div>
              }
            </div>
          </Section>

          <Section title="🎨 Hobbies & Interests">
            <TagBadges values={profile.hobbies} label="Hobbies" />
            <TagBadges values={profile.favMusic} label="Music" />
            <InfoRow label="Other Music" value={profile.favMusicOther} />
            <TagBadges values={profile.favSports} label="Sports" />
            <InfoRow label="Other Sports" value={profile.favSportsOther} />
            <TagBadges values={profile.favFood} label="Food" />
          </Section>

          <Section title="💍 Partner Preferences">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div>
                <InfoRow label="Age Range" value={(pref?.minAge || pref?.maxAge) ? `${pref!.minAge ?? '?'} – ${pref!.maxAge ?? '?'} yrs` : null} />
                <InfoRow label="Height Range" value={(pref?.minHeight || pref?.maxHeight) ? `${pref!.minHeight ?? '?'} – ${pref!.maxHeight ?? '?'} cm` : null} />
                <InfoRow label="Education" value={pref?.education?.name} />
                <InfoRow label="Occupation" value={pref?.occupation} />
                <InfoRow label="Income" value={(pref?.annualIncomeMin || pref?.annualIncomeMax) ? `${pref!.annualIncomeMin?.toLocaleString() ?? '?'} – ${pref!.annualIncomeMax?.toLocaleString() ?? '?'}` : null} />
              </div>
              <div>
                <InfoRow label="Smoking" value={fmt(pref?.smokingHabit)} />
                <InfoRow label="Drinking" value={fmt(pref?.drinkingHabit)} />
              </div>
            </div>
            <TagBadges values={pref?.maritalStatus} label="Marital Status" />
            <TagBadges values={pref?.physicalStatus} label="Physical Status" />
            <TagBadges values={pref?.eatingHabits} label="Eating Habits" />
            <div style={{ padding: '9px 0', borderBottom: '1px solid #F5F0EB' }}>
              <div style={{ fontSize: '0.78rem', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6 }}>About Ideal Partner</div>
              {pref?.aboutPartner
                ? <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.84rem', color: '#5A4A3A', lineHeight: 1.7, background: '#FFFBF7', borderRadius: 10, padding: '12px 14px', border: '1px solid #F0E4D0' }}>{pref.aboutPartner}</div>
                : <div style={{ fontSize: '0.86rem', color: '#C5B9AF', fontFamily: "'Outfit',sans-serif", fontStyle: 'italic' }}>—</div>
              }
            </div>
          </Section>

          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <Link href={`/partners/dashboard/matchmaker/profiles/${profile.id}/edit`} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', borderRadius: 50, padding: '13px 40px', fontSize: '0.92rem', fontWeight: 700, textDecoration: 'none', fontFamily: "'Outfit',sans-serif", boxShadow: '0 4px 16px rgba(244,164,53,0.35)' }}>
              ✏️ Edit Profile
            </Link>
          </div>
        </>
      )}

      {/* ── TAB: Photos ── */}
      {activeTab === 'photos' && (
        <PhotosTab profileId={Number(id)} token={token} photos={profile.photos ?? []} />
      )}

      {/* ── TAB: Matched Profiles ── */}
      {activeTab === 'matches' && (
        <div>
          {/* Filter bar */}
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #F0E4D0', padding: '16px 20px', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#2A1A1A', fontFamily: "'Outfit',sans-serif", marginBottom: 14 }}>
              🔍 Filter Profiles
              {pref && <span style={{ fontSize: 11, fontWeight: 400, color: '#9A8A7A', marginLeft: 8 }}>Defaults pre-filled from partner preferences</span>}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#7A6A5A', marginBottom: 4, fontFamily: "'Outfit',sans-serif" }}>Age Range</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="number" placeholder="Min" style={numStyle} value={filters.minAge} onChange={e => setF('minAge', e.target.value)} min={18} max={80} />
                  <span style={{ color: '#9A8A7A', fontSize: 12 }}>–</span>
                  <input type="number" placeholder="Max" style={numStyle} value={filters.maxAge} onChange={e => setF('maxAge', e.target.value)} min={18} max={80} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#7A6A5A', marginBottom: 4, fontFamily: "'Outfit',sans-serif" }}>Height (cm)</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input type="number" placeholder="Min" style={numStyle} value={filters.minHeight} onChange={e => setF('minHeight', e.target.value)} />
                  <span style={{ color: '#9A8A7A', fontSize: 12 }}>–</span>
                  <input type="number" placeholder="Max" style={numStyle} value={filters.maxHeight} onChange={e => setF('maxHeight', e.target.value)} />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#7A6A5A', marginBottom: 4, fontFamily: "'Outfit',sans-serif" }}>Religion</div>
                <select style={selStyle} value={filters.religionId} onChange={e => setF('religionId', e.target.value)}>
                  <option value="">Any</option>
                  {(lookup?.religions ?? []).map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#7A6A5A', marginBottom: 4, fontFamily: "'Outfit',sans-serif" }}>Country</div>
                <select style={selStyle} value={filters.countryLivingId} onChange={e => setF('countryLivingId', e.target.value)}>
                  <option value="">Any</option>
                  {(lookup?.countries ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#7A6A5A', marginBottom: 4, fontFamily: "'Outfit',sans-serif" }}>Marital Status</div>
                <select style={selStyle} value={filters.maritalStatus} onChange={e => setF('maritalStatus', e.target.value)}>
                  <option value="">Any</option>
                  {(lookup?.maritalStatuses ?? []).map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#7A6A5A', marginBottom: 4, fontFamily: "'Outfit',sans-serif" }}>Education</div>
                <select style={selStyle} value={filters.educationId} onChange={e => setF('educationId', e.target.value)}>
                  <option value="">Any</option>
                  {(lookup?.educations ?? []).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={applyFilters} style={{ padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  Apply
                </button>
                <button onClick={resetFilters} style={{ padding: '9px 16px', borderRadius: 10, background: 'white', color: '#7A6A5A', border: '1.5px solid #F0E4D0', fontSize: 12, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                  Reset
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          {matchLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ background: 'white', borderRadius: 16, overflow: 'hidden', border: '1px solid #F0E4D0' }}>
                  <div style={{ height: 180, background: '#F5EDE0', animation: 'pulse 1.5s infinite' }} />
                  <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ height: 12, borderRadius: 6, background: '#F0E4D0', width: '70%' }} />
                    <div style={{ height: 10, borderRadius: 6, background: '#F0E4D0', width: '50%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 16, border: '1px dashed #F0E4D0', textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🔍</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, color: '#5A4A3A', marginBottom: 6 }}>No profiles found</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#9A8A7A' }}>Try adjusting the filters above</div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 13, color: '#7A6A5A', fontFamily: "'Outfit',sans-serif" }}>
                  <strong style={{ color: '#2A1A1A' }}>{matchTotal}</strong> matching profile{matchTotal !== 1 ? 's' : ''} found
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginBottom: 20 }}>
                {matches.map(p => (
                  <MatchProfileCard
                    key={p.id}
                    p={p}
                    senderProfileId={Number(id)}
                    token={token}
                    requestEntry={requestStatusMap[p.id]}
                    onRequestSent={rid => setRequestStatusMap(prev => ({ ...prev, [rid]: { status: 'PENDING', direction: 'SENT' } }))}
                    onRespond={(senderId, matchId, action) => {
                      if (!token) return;
                      fetch(`${API}/api/matchmaker/profiles/${id}/requests/${matchId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ action }),
                      }).then(r => r.json()).then(d => {
                        if (d.match) {
                          setRequestStatusMap(prev => ({ ...prev, [senderId]: { status: action, direction: 'RECEIVED', matchId } }));
                          // Also update in requests list
                          setRequests(prev => prev.map(r => r.id === matchId ? { ...r, status: action } : r));
                        }
                      }).catch(() => {});
                    }}
                  />
                ))}
              </div>
              {matchPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  {Array.from({ length: matchPages }, (_, i) => i + 1).map(pg => (
                    <button key={pg} onClick={() => fetchMatches(pg, filters)} style={{ width: 36, height: 36, borderRadius: 10, border: '1.5px solid', borderColor: pg === matchPage ? '#F4A435' : '#F0E4D0', background: pg === matchPage ? '#FFF3E0' : 'white', color: pg === matchPage ? '#E8735A' : '#7A6A5A', fontWeight: pg === matchPage ? 700 : 400, cursor: 'pointer', fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                      {pg}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB: Requests Received ── */}
      {activeTab === 'requests' && (
        <div>
          {requestsLoading ? (
            <div style={{ textAlign: 'center', padding: 48, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>Loading requests…</div>
          ) : requests.length === 0 ? (
            <div style={{ background: 'white', borderRadius: 16, border: '1px dashed #F0E4D0', textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📩</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, color: '#5A4A3A', marginBottom: 6 }}>No requests yet</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#9A8A7A' }}>When someone sends a connection request to this profile, it will appear here.</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: 13, color: '#7A6A5A', fontFamily: "'Outfit',sans-serif", marginBottom: 14 }}>
                <strong style={{ color: '#2A1A1A' }}>{requests.length}</strong> request{requests.length !== 1 ? 's' : ''} received
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {requests.map(r => (
                  <RequestCard
                    key={r.id}
                    req={r}
                    profileId={id}
                    token={token}
                    onRespond={(matchId, action) => {
                      setRequests(prev => prev.map(req => req.id === matchId ? { ...req, status: action } : req));
                      setRequestStatusMap(prev => {
                        const entry = Object.entries(prev).find(([, v]) => v.matchId === matchId);
                        if (!entry) return prev;
                        return { ...prev, [Number(entry[0])]: { ...prev[Number(entry[0])], status: action } };
                      });
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
