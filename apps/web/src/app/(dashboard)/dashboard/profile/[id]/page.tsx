'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { apiGet } from '@/lib/auth';

interface Profile {
  id: number; firstName: string; lastName: string; gender: string;
  dateOfBirth: string; maritalStatus: string; isVerified: boolean; status: string;
  height?: number; weight?: number; bodyType?: string; physicalStatus?: string;
  religion?: { name: string }; denomination?: string; motherTongue?: { name: string };
  eatingHabits?: string[]; smokingHabit?: string; drinkingHabit?: string; aboutMe?: string;
  highestEducation?: { name: string }; employmentStatus?: string; occupation?: { name: string };
  annualIncome?: number; currency?: string;
  fatherName?: string; fatherOccupation?: { name: string }; motherName?: string; motherOccupation?: { name: string };
  noOfBrothers?: number; brothersMarried?: number; noOfSisters?: number; sistersMarried?: number; aboutFamily?: string;
  nativeCountry?: { name: string }; nativeCountryState?: string; nativeCountryCity?: string;
  countryLiving?: { name: string }; countryLivingState?: string; countryLivingCity?: string;
  citizenship?: { name: string };
  photos: { id: number; imageUrl: string; isPrimary: boolean }[];
}

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}
function fmt(e?: string) { return e ? e.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '–'; }

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #F5F0EB' }}>
      <div style={{ width: 160, flexShrink: 0, fontSize: '0.8rem', color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '0.88rem', color: '#2A1A1A', fontFamily: "'Outfit',sans-serif" }}>{String(value)}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'white', borderRadius: 18, padding: '22px 24px', border: '1px solid #F0E4D0', marginBottom: 16 }}>
      <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1rem', color: '#2A1A1A', marginBottom: 14, paddingBottom: 10, borderBottom: '2px solid #F4A435', display: 'inline-block' }}>{title}</div>
      {children}
    </div>
  );
}

export default function ProfileDetailPage() {
  const { id } = useParams();
  const { token } = useAuthStore();
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [requestSent,    setRequestSent]    = useState(false);
  const [matchStatus,    setMatchStatus]    = useState<'NONE' | 'PENDING' | 'ACCEPTED' | 'DECLINED'>('NONE');
  const [receivedMatchId, setReceivedMatchId] = useState<number | null>(null); // pending request FROM this person TO me
  const [acting,         setActing]         = useState(false);

  useEffect(() => {
    if (!token || !id) return;
    Promise.all([
      apiGet<{ profile: Profile }>(`/api/profiles/${id}`, token),
      apiGet<{ matches: { id: number; receiver?: { id: number }; status: string }[] }>('/api/matches/sent', token).catch(() => ({ matches: [] })),
      apiGet<{ matches: { id: number; sender?: { id: number }; status: string }[] }>('/api/matches/received', token).catch(() => ({ matches: [] })),
    ]).then(([pd, sent, received]) => {
      setProfile(pd.profile);
      setPhotoIdx(pd.profile.photos.findIndex(p => p.isPrimary) || 0);

      // Check if I already sent a request to this person
      const sentMatch = sent.matches.find(m => m.receiver?.id === pd.profile.id);
      if (sentMatch) {
        setMatchStatus(sentMatch.status as 'PENDING' | 'ACCEPTED' | 'DECLINED');
        setRequestSent(true);
        return;
      }

      // Check if this person sent a request TO me (pending)
      const receivedMatch = received.matches.find(m => m.sender?.id === pd.profile.id && m.status === 'PENDING');
      if (receivedMatch) {
        setReceivedMatchId(receivedMatch.id);
        setMatchStatus('PENDING');
        return;
      }

      // Check accepted in received
      const acceptedMatch = received.matches.find(m => m.sender?.id === pd.profile.id && m.status === 'ACCEPTED');
      if (acceptedMatch) setMatchStatus('ACCEPTED');
    })
    .catch(() => router.replace('/dashboard/browse'))
    .finally(() => setLoading(false));
  }, [id, token]);

  async function respondToRequest(action: 'ACCEPTED' | 'DECLINED') {
    if (!token || !receivedMatchId || acting) return;
    setActing(true);
    try {
      const res = await fetch(`${API}/api/matches/${receivedMatchId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: action }),
      });
      if (res.ok) {
        setMatchStatus(action === 'ACCEPTED' ? 'ACCEPTED' : 'DECLINED');
        setReceivedMatchId(null);
      }
    } catch {} finally { setActing(false); }
  }

  async function sendRequest() {
    try {
      const res = await fetch(`${API}/api/matches`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId: Number(id) }),
      });
      if (res.ok) { setRequestSent(true); setMatchStatus('PENDING'); }
    } catch {}
  }

  if (loading) return <div style={{ textAlign: 'center', padding: 80, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>Loading profile…</div>;
  if (!profile) return null;

  const primaryPhoto = profile.photos.find(p => p.isPrimary) || profile.photos[0];
  const currentPhoto = profile.photos[photoIdx];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Link href="/dashboard/browse" style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.85rem', color: '#9A8A7A', textDecoration: 'none' }}>← Back to Browse</Link>
      </div>

      {/* Hero area */}
      <div style={{ background: 'white', borderRadius: 24, overflow: 'hidden', border: '1px solid #F0E4D0', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 0 }}>
          {/* Photo gallery */}
          <div style={{ width: 300, flexShrink: 0 }}>
            <div style={{ height: 340, background: currentPhoto?.imageUrl ? `url(${currentPhoto.imageUrl}) center/cover` : 'linear-gradient(135deg,#F4A435,#E8735A)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {!currentPhoto?.imageUrl && <span style={{ fontSize: '5rem', opacity: 0.5 }}>{profile.gender === 'MALE' ? '👨' : '👩'}</span>}
            </div>
            {profile.photos.length > 1 && (
              <div style={{ display: 'flex', gap: 4, padding: '8px', background: '#FFFBF7', flexWrap: 'wrap' }}>
                {profile.photos.map((ph, i) => (
                  <div key={ph.id} onClick={() => setPhotoIdx(i)} style={{ width: 44, height: 44, borderRadius: 8, background: `url(${ph.imageUrl}) center/cover`, border: i === photoIdx ? '2px solid #F4A435' : '2px solid transparent', cursor: 'pointer', opacity: i === photoIdx ? 1 : 0.65, transition: 'all 0.2s' }} />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ padding: '28px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                  <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: '1.5rem', color: '#2A1A1A', margin: 0 }}>
                    {profile.firstName} {profile.lastName[0]}.
                  </h1>
                  {profile.isVerified && <span style={{ background: '#4ABEAA', color: 'white', borderRadius: 20, padding: '3px 12px', fontSize: '0.72rem', fontWeight: 700 }}>✓ Verified</span>}
                </div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.88rem', color: '#7A6A5A' }}>
                  {calcAge(profile.dateOfBirth)} years · {profile.countryLiving?.name || 'Unknown'} · {fmt(profile.maritalStatus)}
                </div>
              </div>
              {matchStatus === 'ACCEPTED' ? (
                <span style={{ background: '#E8F8F5', color: '#4ABEAA', borderRadius: 50, padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>💑 Connected</span>
              ) : receivedMatchId ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => respondToRequest('ACCEPTED')} disabled={acting} style={{ background: 'linear-gradient(135deg,#4ABEAA,#2A9D8F)', color: 'white', border: 'none', borderRadius: 50, padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif", cursor: 'pointer', opacity: acting ? 0.7 : 1 }}>
                    ✓ Accept
                  </button>
                  <button onClick={() => respondToRequest('DECLINED')} disabled={acting} style={{ background: '#F5F0EB', color: '#7A6A5A', border: 'none', borderRadius: 50, padding: '10px 20px', fontSize: '0.85rem', fontWeight: 600, fontFamily: "'Outfit',sans-serif", cursor: 'pointer', opacity: acting ? 0.7 : 1 }}>
                    ✕ Decline
                  </button>
                </div>
              ) : matchStatus === 'PENDING' ? (
                <button disabled style={{ background: '#FFFBF7', color: '#F4A435', border: '2px solid #F4A435', borderRadius: 50, padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif", cursor: 'default' }}>
                  ⏳ Request Pending
                </button>
              ) : matchStatus === 'DECLINED' ? (
                <button onClick={sendRequest} className="btn-primary">💌 Send Again</button>
              ) : (
                <button onClick={sendRequest} className="btn-primary">💌 Send Connection Request</button>
              )}
            </div>

            {/* Quick facts */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
              {[
                profile.religion?.name,
                profile.occupation?.name,
                profile.highestEducation?.name,
                profile.countryLiving?.name,
                profile.motherTongue?.name,
              ].filter(Boolean).map((tag, i) => (
                <span key={i} style={{ background: '#FFF3E0', color: '#E8735A', borderRadius: 20, padding: '4px 12px', fontSize: '0.76rem', fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{tag}</span>
              ))}
            </div>

            {profile.aboutMe && (
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.88rem', color: '#5A4A3A', lineHeight: 1.7, background: '#FFFBF7', borderRadius: 10, padding: '14px 16px', border: '1px solid #F0E4D0' }}>
                {profile.aboutMe}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail sections */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
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
          <InfoRow label="Eating Habits" value={profile.eatingHabits?.map(fmt).join(', ')} />
          <InfoRow label="Smoking" value={fmt(profile.smokingHabit)} />
          <InfoRow label="Drinking" value={fmt(profile.drinkingHabit)} />
        </Section>

        <Section title="🎓 Education & Career">
          <InfoRow label="Education" value={profile.highestEducation?.name} />
          <InfoRow label="Employment" value={fmt(profile.employmentStatus)} />
          <InfoRow label="Occupation" value={profile.occupation?.name} />
          <InfoRow label="Annual Income" value={profile.annualIncome ? `${profile.currency || ''} ${profile.annualIncome.toLocaleString()}`.trim() : null} />
        </Section>

        <Section title="📍 Location">
          <InfoRow label="Country (Native)" value={[profile.nativeCountry?.name, profile.nativeCountryState, profile.nativeCountryCity].filter(Boolean).join(', ')} />
          <InfoRow label="Currently In" value={[profile.countryLiving?.name, profile.countryLivingState, profile.countryLivingCity].filter(Boolean).join(', ')} />
          <InfoRow label="Citizenship" value={profile.citizenship?.name} />
        </Section>
      </div>

      {/* Family section */}
      {(profile.fatherName || profile.motherName || profile.aboutFamily) && (
        <Section title="👨‍👩‍👧‍👦 Family Background">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            <div>
              <InfoRow label="Father's Name" value={profile.fatherName} />
              <InfoRow label="Father's Occupation" value={profile.fatherOccupation?.name} />
              <InfoRow label="No. of Brothers" value={profile.noOfBrothers !== undefined ? `${profile.noOfBrothers} (${profile.brothersMarried || 0} married)` : null} />
            </div>
            <div>
              <InfoRow label="Mother's Name" value={profile.motherName} />
              <InfoRow label="Mother's Occupation" value={profile.motherOccupation?.name} />
              <InfoRow label="No. of Sisters" value={profile.noOfSisters !== undefined ? `${profile.noOfSisters} (${profile.sistersMarried || 0} married)` : null} />
            </div>
          </div>
          {profile.aboutFamily && (
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.86rem', color: '#5A4A3A', lineHeight: 1.7, background: '#FFFBF7', borderRadius: 10, padding: '12px 14px', border: '1px solid #F0E4D0', marginTop: 10 }}>
              {profile.aboutFamily}
            </div>
          )}
        </Section>
      )}

      <div style={{ textAlign: 'center', padding: '24px 0' }}>
        {matchStatus === 'ACCEPTED' ? (
          <span style={{ background: '#E8F8F5', color: '#4ABEAA', borderRadius: 50, padding: '14px 44px', fontSize: '0.95rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif", display: 'inline-block' }}>💑 Connected</span>
        ) : receivedMatchId ? (
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
            <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.88rem', color: '#7A6A5A', margin: 0 }}>This person sent you a connection request</p>
            <button onClick={() => respondToRequest('ACCEPTED')} disabled={acting} style={{ background: 'linear-gradient(135deg,#4ABEAA,#2A9D8F)', color: 'white', border: 'none', borderRadius: 50, padding: '14px 32px', fontSize: '0.95rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif", cursor: 'pointer', opacity: acting ? 0.7 : 1 }}>
              ✓ Accept
            </button>
            <button onClick={() => respondToRequest('DECLINED')} disabled={acting} style={{ background: '#F5F0EB', color: '#7A6A5A', border: 'none', borderRadius: 50, padding: '14px 32px', fontSize: '0.95rem', fontWeight: 600, fontFamily: "'Outfit',sans-serif", cursor: 'pointer', opacity: acting ? 0.7 : 1 }}>
              ✕ Decline
            </button>
          </div>
        ) : matchStatus === 'PENDING' ? (
          <button disabled style={{ background: '#FFFBF7', color: '#F4A435', border: '2px solid #F4A435', borderRadius: 50, padding: '14px 44px', fontSize: '0.95rem', fontWeight: 700, fontFamily: "'Outfit',sans-serif", cursor: 'default' }}>
            ⏳ Request Pending — Awaiting Response
          </button>
        ) : matchStatus === 'DECLINED' ? (
          <button onClick={sendRequest} className="btn-primary" style={{ padding: '14px 44px', fontSize: '0.95rem' }}>💌 Send Again</button>
        ) : (
          <button onClick={sendRequest} className="btn-primary" style={{ padding: '14px 44px', fontSize: '0.95rem' }}>💌 Send Connection Request</button>
        )}
      </div>
    </div>
  );
}
