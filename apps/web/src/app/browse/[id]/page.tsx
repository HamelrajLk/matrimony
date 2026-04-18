'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Photo { id: number; imageUrl: string; isPrimary: boolean; }
interface Profile {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  aboutMe?: string;
  height?: number;
  weight?: number;
  bodyType?: string;
  complexion?: string;
  countryLiving?: { name: string };
  stateLiving?: { name: string };
  religion?: { name: string };
  caste?: { name: string };
  motherTongue?: { name: string };
  highestEducation?: { name: string };
  employmentStatus?: string;
  occupation?: { name: string };
  annualIncome?: string;
  fatherStatus?: string;
  motherStatus?: string;
  siblings?: number;
  isVerified: boolean;
  photos: Photo[];
}

/* ─── Petal Rain ─── */
const PETALS = [
  { l: '5%', d: 0, dur: 9 }, { l: '18%', d: 2, dur: 7 },
  { l: '33%', d: 1, dur: 11 }, { l: '52%', d: 3, dur: 8 },
  { l: '70%', d: 1.5, dur: 10 }, { l: '85%', d: 2.5, dur: 7.5 },
  { l: '95%', d: 0.8, dur: 9 },
];
const EMOJIS = ['🌸', '🌺', '✿', '🌼'];

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      padding: '10px 0', borderBottom: '1px solid #F5EDE0',
    }}>
      <span style={{ color: '#9A8A7A', fontSize: 13, fontFamily: "'Outfit',sans-serif", minWidth: 130 }}>{label}</span>
      <span style={{ color: '#2A1A1A', fontSize: 13, fontWeight: 500, fontFamily: "'Outfit',sans-serif", textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'white', borderRadius: 20,
      boxShadow: '0 4px 20px rgba(244,164,53,0.07)',
      border: '1px solid #F0E4D0', padding: '24px 28px', marginBottom: 20,
    }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 17, color: '#2A1A1A', margin: 0 }}>{title}</h3>
        <div style={{ width: 32, height: 3, background: 'linear-gradient(90deg,#F4A435,#E8735A)', borderRadius: 4, marginTop: 6 }} />
      </div>
      {children}
    </div>
  );
}

export default function PublicProfilePage() {
  const { id }   = useParams<{ id: string }>();
  const router   = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    fetch(`${API}/api/profiles/${id}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        const p = d.profile ?? d.data ?? d;
        setProfile(p);
        const primary = p.photos?.findIndex((x: Photo) => x.isPrimary);
        if (primary > 0) setActivePhoto(primary);
      })
      .catch(() => router.replace('/browse'))
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, animation: 'heartbeat 1.5s ease-in-out infinite' }}>💍</div>
        <p style={{ fontFamily: "'Outfit',sans-serif", color: '#9A8A7A', marginTop: 12 }}>Loading profile…</p>
      </div>
    </div>
  );

  if (!profile) return null;

  const age    = profile.dateOfBirth ? calcAge(profile.dateOfBirth) : null;
  const photos = profile.photos ?? [];
  const photo  = photos[activePhoto]?.imageUrl ?? null;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7', fontFamily: "'Outfit',sans-serif", position: 'relative' }}>
      {/* Petals */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        {PETALS.map((p, i) => (
          <div key={i} style={{
            position: 'absolute', left: p.l, top: '-40px',
            fontSize: i % 2 === 0 ? '1.3rem' : '0.9rem',
            animation: `petalFall ${p.dur}s linear ${p.d}s infinite`,
            opacity: 0.45,
          }}>
            {EMOJIS[i % 4]}
          </div>
        ))}
      </div>

      <Navbar />

      {/* Hero strip */}
      <div style={{
        paddingTop: 72,
        background: 'linear-gradient(135deg,#FF7E5F 0%,#FEB47B 40%,#FF6EB4 75%,#A78BFA 100%)',
        backgroundSize: '200% 200%',
        animation: 'gradShift 10s ease infinite',
        padding: '88px 5% 44px',
        position: 'relative', zIndex: 1, overflow: 'hidden',
      }}>
        <div style={{ maxWidth: 1300, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 20 }}>
            <Link href="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>Home</Link>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>›</span>
            <Link href="/browse" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: 13 }}>Browse Profiles</Link>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>›</span>
            <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{profile.firstName}</span>
          </div>
          <h1 style={{
            fontFamily: "'Playfair Display',serif",
            fontWeight: 800, fontSize: 'clamp(1.6rem,3.5vw,2.6rem)',
            color: 'white', margin: 0,
          }}>
            {profile.firstName} {profile.lastName?.[0]}.
            {profile.isVerified && (
              <span style={{
                marginLeft: 14, verticalAlign: 'middle',
                background: '#4ABEAA', color: 'white',
                borderRadius: 20, padding: '4px 14px',
                fontSize: 13, fontWeight: 600,
              }}>✓ Verified</span>
            )}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, marginTop: 8, fontFamily: "'Outfit',sans-serif" }}>
            {age ? `${age} years old` : ''}
            {profile.countryLiving ? ` · ${profile.countryLiving.name}` : ''}
            {profile.religion ? ` · ${profile.religion.name}` : ''}
          </p>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 1300, margin: '0 auto', padding: '40px 5% 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>

          {/* ── Left: Photos ── */}
          <div style={{ width: 340, flexShrink: 0 }}>
            {/* Main photo */}
            <div style={{
              borderRadius: 24, overflow: 'hidden',
              boxShadow: '0 12px 40px rgba(244,164,53,0.15)',
              marginBottom: 14, position: 'sticky', top: 88,
            }}>
              <div style={{ paddingBottom: '125%', position: 'relative', background: 'linear-gradient(135deg,#fdf0e6,#ffe4d0)' }}>
                {photo ? (
                  <img src={photo} alt={profile.firstName}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center', fontSize: 80, color: '#d4a574',
                  }}>
                    {profile.gender === 'MALE' ? '👨' : '👩'}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {photos.length > 1 && (
                <div style={{ padding: '12px 14px', background: 'white', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {photos.map((ph, i) => (
                    <button key={ph.id} onClick={() => setActivePhoto(i)} style={{
                      width: 52, height: 52, borderRadius: 10, overflow: 'hidden',
                      border: `2.5px solid ${i === activePhoto ? '#F4A435' : 'transparent'}`,
                      padding: 0, cursor: 'pointer', flexShrink: 0,
                    }}>
                      <img src={ph.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Send Interest CTA */}
            <div style={{
              background: 'white', borderRadius: 20,
              boxShadow: '0 4px 20px rgba(244,164,53,0.08)',
              border: '1px solid #F0E4D0', padding: '22px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: 14, color: '#7A6A5A', marginBottom: 16, lineHeight: 1.6 }}>
                Interested in connecting with {profile.firstName}?
              </p>
              <Link
                href="/login"
                style={{
                  display: 'block',
                  background: 'linear-gradient(135deg,#F4A435,#E8735A)',
                  color: 'white', borderRadius: 50, padding: '13px 0',
                  fontWeight: 700, fontSize: 15, textDecoration: 'none',
                  fontFamily: "'Outfit',sans-serif",
                }}
              >
                💌 Send Interest
              </Link>
              <p style={{ fontSize: 11, color: '#9A8A7A', marginTop: 10 }}>Sign in to send interest</p>
            </div>
          </div>

          {/* ── Right: Details ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* About Me */}
            {profile.aboutMe && (
              <Section title="About Me">
                <p style={{ fontSize: 14, color: '#5A4A3A', lineHeight: 1.85, margin: 0 }}>
                  {profile.aboutMe}
                </p>
              </Section>
            )}

            {/* Basic Info */}
            <Section title="Basic Information">
              <InfoRow label="Age"            value={age ? `${age} years` : undefined} />
              <InfoRow label="Gender"         value={profile.gender === 'MALE' ? 'Male' : 'Female'} />
              <InfoRow label="Marital Status" value={
                profile.maritalStatus === 'UNMARRIED' ? 'Never Married' :
                profile.maritalStatus === 'DIVORCED'  ? 'Divorced' :
                profile.maritalStatus === 'WIDOWED'   ? 'Widowed' : profile.maritalStatus
              } />
              <InfoRow label="Height" value={profile.height   ? `${profile.height} cm`  : undefined} />
              <InfoRow label="Weight" value={profile.weight   ? `${profile.weight} kg`  : undefined} />
              <InfoRow label="Body Type"   value={profile.bodyType}   />
              <InfoRow label="Complexion"  value={profile.complexion} />
            </Section>

            {/* Religion & Language */}
            <Section title="Religion & Language">
              <InfoRow label="Religion"      value={profile.religion?.name}     />
              <InfoRow label="Caste"         value={profile.caste?.name}        />
              <InfoRow label="Mother Tongue" value={profile.motherTongue?.name} />
            </Section>

            {/* Education & Career */}
            <Section title="Education & Career">
              <InfoRow label="Education"       value={profile.highestEducation?.name} />
              <InfoRow label="Employment"      value={profile.employmentStatus}       />
              <InfoRow label="Occupation"      value={profile.occupation?.name}       />
              <InfoRow label="Annual Income"   value={profile.annualIncome}           />
            </Section>

            {/* Location */}
            <Section title="Location">
              <InfoRow label="Country"  value={profile.countryLiving?.name} />
              <InfoRow label="State"    value={profile.stateLiving?.name}   />
            </Section>

            {/* Family */}
            {(profile.fatherStatus || profile.motherStatus || profile.siblings !== undefined) && (
              <Section title="Family Background">
                <InfoRow label="Father's Status" value={profile.fatherStatus} />
                <InfoRow label="Mother's Status" value={profile.motherStatus} />
                <InfoRow label="Siblings"        value={profile.siblings}     />
              </Section>
            )}

            {/* Bottom CTA */}
            <div style={{
              background: 'linear-gradient(135deg,#FF7E5F,#FEB47B,#FF6EB4)',
              borderRadius: 24, padding: '32px 28px', textAlign: 'center',
              boxShadow: '0 8px 28px rgba(232,115,90,0.25)',
            }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>💍</div>
              <h3 style={{
                fontFamily: "'Playfair Display',serif",
                fontWeight: 700, fontSize: 20, color: 'white', margin: '0 0 10px',
              }}>
                Connect with {profile.firstName}
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: 14, marginBottom: 20 }}>
                Sign in to send an interest request and start a conversation.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link href="/login" style={{
                  background: 'white', color: '#E8735A', borderRadius: 50,
                  padding: '12px 30px', fontWeight: 700, fontSize: 14,
                  textDecoration: 'none', fontFamily: "'Outfit',sans-serif",
                }}>
                  Login to Connect
                </Link>
                <Link href="/signup" style={{
                  background: 'transparent', color: 'white',
                  border: '2px solid rgba(255,255,255,0.7)',
                  borderRadius: 50, padding: '12px 30px',
                  fontWeight: 700, fontSize: 14, textDecoration: 'none',
                  fontFamily: "'Outfit',sans-serif",
                }}>
                  Create Free Account
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        <Footer />
      </div>
    </div>
  );
}
