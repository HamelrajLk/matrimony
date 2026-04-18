'use client';
import { use, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Profile {
  id: number;
  firstName: string; lastName: string; gender: string;
  dateOfBirth: string; maritalStatus: string; isVerified: boolean;
  status: string; referenceCode?: string; createdByType?: string;
  height?: number; weight?: number; bodyType?: string; physicalStatus?: string;
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
  horoscopeAvailable?: boolean; showPhoto?: boolean;
  contactMethods?: string[]; contactWhatsapp?: string; contactPhone?: string; contactEmail?: string;
  photos: { id: number; imageUrl: string; isPrimary: boolean }[];
}

interface MyProfile {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  referenceCode?: string;
  photos: { imageUrl: string; isPrimary: boolean }[];
}

interface RequestEntry {
  direction: 'SENT' | 'RECEIVED' | null;
  status: string | null;
  matchId: number | null;
}

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}
function fmt(e?: string | null) {
  return e ? e.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '–';
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: '1px solid #F5F0EB' }}>
      <div style={{ width: 155, flexShrink: 0, fontSize: '0.78rem', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '0.86rem', color: '#2A1A1A', fontFamily: "'Outfit',sans-serif" }}>{String(value)}</div>
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
  if (!values?.length) return null;
  return (
    <div style={{ display: 'flex', gap: 12, padding: '9px 0', borderBottom: '1px solid #F5F0EB', alignItems: 'flex-start' }}>
      <div style={{ width: 155, flexShrink: 0, fontSize: '0.78rem', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', paddingTop: 4 }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {values.map((v, i) => (
          <span key={i} style={{ background: '#FFF3E0', color: '#E8735A', borderRadius: 20, padding: '3px 10px', fontSize: '0.78rem', fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{fmt(v)}</span>
        ))}
      </div>
    </div>
  );
}

function statusBadge(entry: RequestEntry) {
  if (!entry.direction || !entry.status) return null;
  const isReceived = entry.direction === 'RECEIVED';
  const colors: Record<string, { bg: string; color: string; label: string }> = {
    PENDING:  { bg: '#FFF3CD', color: '#856404', label: isReceived ? '⏳ Request Received' : '⏳ Request Sent' },
    ACCEPTED: { bg: '#D4EDDA', color: '#155724', label: '✓ Connected' },
    DECLINED: { bg: '#F8D7DA', color: '#721C24', label: isReceived ? '✗ Declined by You' : '✗ Request Declined' },
  };
  const c = colors[entry.status] ?? { bg: '#F5F0EB', color: '#9A8A7A', label: entry.status };
  return (
    <span style={{ background: c.bg, color: c.color, borderRadius: 20, padding: '5px 14px', fontSize: '0.8rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
      {c.label}
    </span>
  );
}

interface Props { params: Promise<{ id: string }> }

export default function MatchmakerReadOnlyProfilePage({ params }: Props) {
  const { id } = use(params);
  const { token } = useAuthStore();
  const router = useRouter();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);

  // My matchmaker profiles
  const [myProfiles, setMyProfiles] = useState<MyProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<number | ''>('');
  const [requestEntry, setRequestEntry] = useState<RequestEntry>({ direction: null, status: null, matchId: null });
  const [statusLoading, setStatusLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const [message, setMessage] = useState('');

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
      .catch(() => router.back())
      .finally(() => setLoading(false));

    fetch(`${API}/api/matchmaker/profiles`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.profiles)) setMyProfiles(d.profiles);
      })
      .catch(() => {});
  }, [id, token]);

  const checkStatus = useCallback(async (myProfileId: number) => {
    if (!token) return;
    setStatusLoading(true);
    try {
      const res = await fetch(`${API}/api/matchmaker/profiles/${myProfileId}/request-status/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setRequestEntry({ direction: data.direction ?? null, status: data.status ?? null, matchId: data.matchId ?? null });
    } catch {
      setRequestEntry({ direction: null, status: null, matchId: null });
    } finally {
      setStatusLoading(false);
    }
  }, [id, token]);

  const handleProfileSelect = (pid: number | '') => {
    setSelectedProfileId(pid);
    setRequestEntry({ direction: null, status: null, matchId: null });
    if (pid !== '') checkStatus(pid as number);
  };

  const handleSendRequest = async () => {
    if (!selectedProfileId || !token) return;
    setActing(true);
    try {
      const res = await fetch(`${API}/api/matchmaker/profiles/${selectedProfileId}/send-request`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: Number(id), message: message.trim() || undefined }),
      });
      const data = await res.json();
      if (res.ok) {
        setRequestEntry({ direction: 'SENT', status: 'PENDING', matchId: data.match?.id ?? null });
        setMessage('');
      } else {
        alert(data.message || 'Failed to send request');
      }
    } catch {
      alert('Network error');
    } finally {
      setActing(false);
    }
  };

  const handleRespond = async (action: 'ACCEPTED' | 'DECLINED') => {
    if (!selectedProfileId || !requestEntry.matchId || !token) return;
    setActing(true);
    try {
      const res = await fetch(`${API}/api/matchmaker/profiles/${selectedProfileId}/requests/${requestEntry.matchId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        setRequestEntry(prev => ({ ...prev, status: action }));
      } else {
        alert(data.message || 'Failed to respond');
      }
    } catch {
      alert('Network error');
    } finally {
      setActing(false);
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: 80, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>
      Loading profile…
    </div>
  );
  if (!profile) return null;

  const currentPhoto = profile.photos?.[photoIdx];
  const selectedProfile = myProfiles.find(p => p.id === selectedProfileId);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>

      {/* Back bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: '0.85rem', color: '#9A8A7A', padding: 0 }}
        >
          ← Back
        </button>
      </div>

      {/* Action panel */}
      {myProfiles.length > 0 && (
        <div style={{ background: 'white', borderRadius: 16, padding: '18px 22px', border: '1px solid #F0E4D0', marginBottom: 18 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '0.9rem', color: '#2A1A1A', marginBottom: 14 }}>
            Act on behalf of a profile
          </div>

          {/* Profile selector */}
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>
              Select your profile
            </label>
            <select
              value={selectedProfileId}
              onChange={e => handleProfileSelect(e.target.value === '' ? '' : Number(e.target.value))}
              style={{ width: '100%', maxWidth: 360, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #F0E4D0', fontFamily: "'Outfit',sans-serif", fontSize: '0.86rem', color: '#2A1A1A', background: '#FFFBF7', outline: 'none', cursor: 'pointer' }}
            >
              <option value="">— Choose a profile —</option>
              {myProfiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} {p.referenceCode ? `(${p.referenceCode})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status / Actions */}
          {selectedProfileId !== '' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {statusLoading ? (
                <span style={{ fontSize: '0.82rem', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>Checking request status…</span>
              ) : (
                <>
                  {/* Show badge if already interacted */}
                  {requestEntry.direction && requestEntry.status && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                      {statusBadge(requestEntry)}
                      {selectedProfile && (
                        <span style={{ fontSize: '0.78rem', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>
                          for <strong style={{ color: '#2A1A1A' }}>{selectedProfile.firstName} {selectedProfile.lastName}</strong>
                        </span>
                      )}
                    </div>
                  )}

                  {/* Accept / Decline for received PENDING */}
                  {requestEntry.direction === 'RECEIVED' && requestEntry.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => handleRespond('ACCEPTED')}
                        disabled={acting}
                        style={{ background: 'linear-gradient(135deg,#4ABEAA,#38a48e)', color: 'white', border: 'none', borderRadius: 50, padding: '9px 22px', fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.85rem', cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.7 : 1 }}
                      >
                        ✓ Accept Request
                      </button>
                      <button
                        onClick={() => handleRespond('DECLINED')}
                        disabled={acting}
                        style={{ background: 'white', color: '#E8735A', border: '1.5px solid #E8735A', borderRadius: 50, padding: '9px 22px', fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.85rem', cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.7 : 1 }}
                      >
                        ✗ Decline
                      </button>
                    </div>
                  )}

                  {/* Send request if no existing relationship */}
                  {!requestEntry.direction && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <textarea
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Add a message (optional)…"
                        rows={2}
                        style={{ width: '100%', maxWidth: 480, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #F0E4D0', fontFamily: "'Outfit',sans-serif", fontSize: '0.84rem', color: '#2A1A1A', background: '#FFFBF7', resize: 'none', outline: 'none' }}
                      />
                      <button
                        onClick={handleSendRequest}
                        disabled={acting}
                        style={{ alignSelf: 'flex-start', background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', border: 'none', borderRadius: 50, padding: '10px 26px', fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: '0.85rem', cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.7 : 1 }}
                      >
                        {acting ? 'Sending…' : '💌 Send Request'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

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
              {profile.referenceCode && (
                <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#9A8A7A', background: '#F5F0EB', borderRadius: 8, padding: '3px 10px' }}>{profile.referenceCode}</span>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {[profile.religion?.name, profile.highestEducation?.name, profile.occupation?.name, profile.motherTongue?.name].filter(Boolean).map((t, i) => (
                <span key={i} style={{ background: '#FFF3E0', color: '#E8735A', borderRadius: 20, padding: '4px 12px', fontSize: '0.74rem', fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{t}</span>
              ))}
            </div>
            {profile.aboutMe && (
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.84rem', color: '#5A4A3A', lineHeight: 1.7, background: '#FFFBF7', borderRadius: 10, padding: '10px 14px', border: '1px solid #F0E4D0' }}>
                {profile.aboutMe}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Info sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Section title="📋 Basic Information">
          <InfoRow label="Age" value={calcAge(profile.dateOfBirth) + ' years'} />
          <InfoRow label="Gender" value={fmt(profile.gender)} />
          <InfoRow label="Marital Status" value={fmt(profile.maritalStatus)} />
          <InfoRow label="Height" value={profile.height ? `${profile.height} cm` : null} />
          <InfoRow label="Weight" value={profile.weight ? `${profile.weight} kg` : null} />
          <InfoRow label="Body Type" value={fmt(profile.bodyType)} />
          <InfoRow label="Physical Status" value={fmt(profile.physicalStatus)} />
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
        </Section>
      </div>

      {(profile.fatherName || profile.motherName || profile.noOfBrothers !== undefined || profile.aboutFamily) && (
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
          {profile.aboutFamily && <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.84rem', color: '#5A4A3A', lineHeight: 1.7, background: '#FFFBF7', borderRadius: 10, padding: '12px 14px', border: '1px solid #F0E4D0', marginTop: 10 }}>{profile.aboutFamily}</div>}
        </Section>
      )}

      {(profile.hobbies?.length || profile.favMusic?.length || profile.favSports?.length || profile.favFood?.length) ? (
        <Section title="🎨 Hobbies & Interests">
          <TagBadges values={profile.hobbies} label="Hobbies" />
          <TagBadges values={profile.favMusic} label="Music" />
          {profile.favMusicOther && <InfoRow label="Other Music" value={profile.favMusicOther} />}
          <TagBadges values={profile.favSports} label="Sports" />
          {profile.favSportsOther && <InfoRow label="Other Sports" value={profile.favSportsOther} />}
          <TagBadges values={profile.favFood} label="Food" />
        </Section>
      ) : null}

    </div>
  );
}
