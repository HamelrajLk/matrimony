'use client';
import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface PublicProfile {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string | null;
  ageRange?: string;
  maritalStatus: string;
  height?: number;
  weight?: number;
  bodyType?: string;
  physicalStatus?: string;
  religion?: { name: string };
  denomination?: string;
  motherTongue?: { name: string };
  eatingHabits?: string[];
  smokingHabit?: string;
  drinkingHabit?: string;
  aboutMe?: string;
  highestEducation?: { name: string };
  employmentStatus?: string;
  occupation?: { name: string };
  countryLiving?: { name: string };
  countryLivingCity?: string;
  nativeCountry?: { name: string };
  citizenship?: { name: string };
  referenceCode: string;
  showPhoto: boolean;
  showFullAge: boolean;
  showFirstName: boolean;
  contactMethods: string[];
  contactWhatsapp?: string;
  contactPhone?: string;
  contactEmail?: string;
  horoscopeAvailable: boolean;
  profileVisibility: string;
  isVerified: boolean;
  photos: { imageUrl: string }[];
  matchMaker?: {
    id: number;
    partnerProfile?: {
      id: number;
      businessName: string;
      bio?: string;
      yearsOfExperience?: number;
      createdAt: string;
      phones: { label?: string; number: string }[];
      addresses: { city?: string; countryCode: string }[];
    };
  };
}

interface EnquiryForm {
  requesterName: string;
  requesterEmail: string;
  requesterPhone: string;
  message: string;
}

function LockInfo() {
  return (
    <span style={{ fontSize: 12, color: '#9A8A7A', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#F9F5F0', borderRadius: 8, padding: '3px 10px' }}>
      🔒 Contact the matchmaker for this information
    </span>
  );
}

function DetailRow({ label, value, locked }: { label: string; value?: string | null; locked?: boolean }) {
  if (!value && !locked) return null;
  return (
    <div style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid #F9F1EB' }}>
      <span style={{ fontSize: 13, color: '#9A8A7A', fontWeight: 500, minWidth: 140, flexShrink: 0 }}>{label}</span>
      {locked ? <LockInfo /> : <span style={{ fontSize: 13, color: '#2A1A1A', fontWeight: 500 }}>{value}</span>}
    </div>
  );
}

function PetalRain() {
  const petals = Array.from({ length: 12 }, (_, i) => i);
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
      {petals.map(i => (
        <div key={i} style={{
          position: 'absolute',
          top: '-40px',
          left: `${(i * 8.3) % 100}%`,
          width: 12, height: 16,
          background: i % 2 === 0 ? '#FBCFE8' : '#FDE68A',
          borderRadius: '50% 0 50% 0',
          opacity: 0.5,
          animation: `petalFall ${4 + (i % 3) * 1.5}s linear ${i * 0.7}s infinite`,
        }} />
      ))}
    </div>
  );
}

function EnquiryModal({ referenceCode, onClose }: { referenceCode: string; onClose: () => void }) {
  const [form, setForm] = useState<EnquiryForm>({ requesterName: '', requesterEmail: '', requesterPhone: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  function setField(k: keyof EnquiryForm, v: string) {
    setForm(f => ({ ...f, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.requesterName.trim() || !form.message.trim()) {
      toast.error('Name and message are required');
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`${API}/api/matchmaker/public/${referenceCode}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSent(true);
      toast.success('Enquiry sent successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send enquiry');
    } finally {
      setSending(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px', borderRadius: 10,
    border: '1.5px solid #F0E4D0', background: 'white',
    fontSize: 13, color: '#2A1A1A', outline: 'none', boxSizing: 'border-box',
    fontFamily: "'Outfit',sans-serif",
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 24, padding: 32, maxWidth: 480, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>💌</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: '#2A1A1A', marginBottom: 8 }}>Enquiry Sent!</h3>
            <p style={{ color: '#7A6A5A', fontSize: 14, marginBottom: 20 }}>The matchmaker will get back to you within 24 hours.</p>
            <button onClick={onClose} style={{ background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', border: 'none', borderRadius: 50, padding: '12px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#2A1A1A', margin: 0 }}>Send Enquiry</h3>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#9A8A7A' }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5A4A3A', marginBottom: 6 }}>Your Name *</label>
                <input style={inputStyle} value={form.requesterName} onChange={e => setField('requesterName', e.target.value)} placeholder="Your full name" required />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5A4A3A', marginBottom: 6 }}>Email Address</label>
                <input type="email" style={inputStyle} value={form.requesterEmail} onChange={e => setField('requesterEmail', e.target.value)} placeholder="your@email.com" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5A4A3A', marginBottom: 6 }}>Phone Number</label>
                <input style={inputStyle} value={form.requesterPhone} onChange={e => setField('requesterPhone', e.target.value)} placeholder="+94 77 123 4567" />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#5A4A3A', marginBottom: 6 }}>Your Message *</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
                  value={form.message}
                  onChange={e => setField('message', e.target.value)}
                  placeholder="Introduce yourself and express your interest..."
                  required
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                style={{ width: '100%', background: sending ? '#F0E4D0' : 'linear-gradient(135deg,#F4A435,#E8735A)', color: sending ? '#9A8A7A' : 'white', border: 'none', borderRadius: 50, padding: '14px', fontSize: 15, fontWeight: 700, cursor: sending ? 'not-allowed' : 'pointer' }}
              >
                {sending ? 'Sending...' : '💬 Send Enquiry'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function formatMaritalStatus(s: string) {
  const map: Record<string, string> = { UNMARRIED: 'Never Married', DIVORCED: 'Divorced', WIDOWED: 'Widowed', SEPARATED: 'Separated' };
  return map[s] ?? s;
}

interface Props {
  params: Promise<{ referenceCode: string }>;
}

export default function PublicMatchmakerProfilePage({ params }: Props) {
  const { referenceCode } = use(params);
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showEnquiry, setShowEnquiry] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API}/api/matchmaker/public/${referenceCode}`);
        if (res.status === 404) { setNotFound(true); return; }
        const data = await res.json();
        setProfile(data.profile);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [referenceCode]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'linear-gradient(135deg,#F4A435,#E8735A)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20 }}>💑</div>
          <p style={{ color: '#9A8A7A' }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (notFound || !profile) {
    return (
      <div style={{ minHeight: '100vh', background: '#FFFBF7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif" }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", color: '#2A1A1A', marginBottom: 8 }}>Profile Not Found</h2>
          <p style={{ color: '#7A6A5A', marginBottom: 24 }}>The reference code <strong>{referenceCode}</strong> doesn't match any profile.</p>
          <Link href="/" style={{ background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', borderRadius: 50, padding: '12px 28px', textDecoration: 'none', fontWeight: 700 }}>
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const isBride = profile.gender === 'FEMALE';
  const age = profile.dateOfBirth ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000)) : null;
  const partner = profile.matchMaker?.partnerProfile;
  const partnerPhone = partner?.phones?.[0]?.number;
  const partnerCity = partner?.addresses?.[0]?.city;
  const memberSince = partner?.createdAt ? new Date(partner.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : null;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7', fontFamily: "'Outfit',sans-serif", position: 'relative' }}>
      <PetalRain />

      {/* Navbar */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,251,247,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid #F0E4D0', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#F4A435,#E8735A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: 14 }}>♥</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: '#2A1A1A', fontSize: 16 }}>The Wedding Partners</span>
        </Link>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
          <Link href="/login" style={{ padding: '8px 20px', borderRadius: 50, border: '1.5px solid #F0E4D0', color: '#7A6A5A', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Login</Link>
          <Link href="/signup" style={{ padding: '8px 20px', borderRadius: 50, background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Sign Up</Link>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '32px 24px 80px', position: 'relative', zIndex: 1 }}>

        {/* Profile Card */}
        <div style={{ background: 'white', borderRadius: 24, border: '1px solid #F0E4D0', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginBottom: 24 }}>
          {/* Photo / Avatar Section */}
          <div style={{ height: 220, background: isBride ? 'linear-gradient(135deg,#fce7f3,#fbcfe8,#fef3c7)' : 'linear-gradient(135deg,#dbeafe,#e0e7ff,#ede9fe)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {profile.showPhoto && profile.photos[0] ? (
              <img src={profile.photos[0].imageUrl} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 80, opacity: 0.4, filter: 'blur(2px)' }}>{isBride ? '👩' : '👨'}</div>
                {!profile.showPhoto && <p style={{ fontSize: 12, color: '#9A8A7A', marginTop: 4 }}>Photo hidden for privacy</p>}
              </div>
            )}
            {/* Gender badge */}
            <div style={{ position: 'absolute', top: 16, right: 16 }}>
              {isBride
                ? <span style={{ background: '#fce7f3', color: '#be185d', fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 20 }}>🌸 Bride</span>
                : <span style={{ background: '#dbeafe', color: '#1d4ed8', fontSize: 13, fontWeight: 700, padding: '4px 14px', borderRadius: 20 }}>💙 Groom</span>
              }
            </div>
            {/* Reference code */}
            <div style={{ position: 'absolute', top: 16, left: 16, background: 'rgba(255,255,255,0.9)', borderRadius: 10, padding: '4px 12px' }}>
              <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: '#7B8FE8' }}>{profile.referenceCode}</span>
            </div>
          </div>

          {/* Profile Info */}
          <div style={{ padding: '24px 28px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
              <div>
                <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 800, color: '#2A1A1A', margin: '0 0 4px' }}>
                  {profile.showFirstName ? `${profile.firstName} ${profile.lastName}` : `Anonymous ${profile.lastName}`}
                </h1>
                <div style={{ display: 'flex', gap: 12, fontSize: 13, color: '#7A6A5A', flexWrap: 'wrap' }}>
                  {profile.showFullAge && age && <span>🎂 Age {age}</span>}
                  {!profile.showFullAge && profile.ageRange && <span>🎂 Age range {profile.ageRange}</span>}
                  {profile.religion && <span>🙏 {profile.religion.name}</span>}
                  {profile.motherTongue && <span>🗣️ {profile.motherTongue.name}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {profile.isVerified && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '4px 12px', borderRadius: 20 }}>✅ Verified</span>
                )}
                {profile.horoscopeAvailable && (
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#7c3aed', background: '#ede9fe', padding: '4px 12px', borderRadius: 20 }}>⭐ Horoscope Available</span>
                )}
              </div>
            </div>

            {/* Location row */}
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 20 }}>
              {profile.countryLiving && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#5A4A3A' }}>
                  <span>📍</span>
                  <span>Living in: <strong>{profile.countryLivingCity ? `${profile.countryLivingCity}, ` : ''}{profile.countryLiving.name}</strong></span>
                </div>
              )}
              {profile.citizenship && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#5A4A3A' }}>
                  <span>🌏</span>
                  <span>Citizen of: <strong>{profile.citizenship.name}</strong></span>
                </div>
              )}
              {profile.nativeCountry && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#5A4A3A' }}>
                  <span>🏡</span>
                  <span>Originally from: <strong>{profile.nativeCountry.name}</strong></span>
                </div>
              )}
            </div>

            {/* About Me */}
            {profile.aboutMe && (
              <div style={{ background: '#FFFBF7', borderRadius: 14, padding: '16px', border: '1px solid #F0E4D0', marginBottom: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#9A8A7A', marginBottom: 6 }}>About</p>
                <p style={{ fontSize: 14, color: '#2A1A1A', lineHeight: 1.7, margin: 0 }}>{profile.aboutMe}</p>
              </div>
            )}

            {/* Gold divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,#F4A435,transparent)' }} />
              <span style={{ fontSize: 14 }}>✨</span>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,#F4A435,transparent)' }} />
            </div>

            {/* Details Grid */}
            <div>
              <DetailRow label="Marital Status" value={formatMaritalStatus(profile.maritalStatus)} />
              <DetailRow label="Height" value={profile.height ? `${profile.height} cm` : undefined} locked={!profile.height} />
              <DetailRow label="Religion" value={profile.religion?.name} />
              <DetailRow label="Denomination" value={profile.denomination} />
              <DetailRow label="Mother Tongue" value={profile.motherTongue?.name} />
              <DetailRow label="Education" value={profile.highestEducation?.name} locked={!profile.highestEducation} />
              <DetailRow label="Occupation" value={profile.occupation?.name} locked={!profile.occupation} />
              <DetailRow label="Employment" value={profile.employmentStatus?.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase())} />
            </div>
          </div>
        </div>

        {/* Matchmaker Info Card */}
        {partner && (
          <div style={{ background: 'white', borderRadius: 24, border: '1px solid #F0E4D0', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            {/* Header band */}
            <div style={{ background: 'linear-gradient(135deg,#FFF3E0,#FFE8CC)', padding: '16px 24px', borderBottom: '1px solid #F0E4D0', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>💑</span>
              <div>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#2A1A1A', margin: 0 }}>Managed by a Verified Matchmaker</p>
                <p style={{ fontSize: 12, color: '#7A6A5A', margin: 0 }}>Professional marriage broker</p>
              </div>
            </div>

            <div style={{ padding: '24px 28px' }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: 20 }}>
                {/* Logo placeholder */}
                <div style={{ width: 64, height: 64, borderRadius: 16, background: 'linear-gradient(135deg,#F4A435,#E8735A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 28, flexShrink: 0 }}>
                  💑
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, fontWeight: 700, color: '#2A1A1A', margin: '0 0 6px' }}>
                    {partner.businessName}
                  </h3>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#7A6A5A' }}>⭐ 4.8 · 47 reviews</span>
                    <span style={{ fontSize: 13, color: '#7A6A5A' }}>📋 Matchmaker</span>
                    {partnerCity && <span style={{ fontSize: 13, color: '#7A6A5A' }}>📍 {partnerCity}</span>}
                    {memberSince && <span style={{ fontSize: 13, color: '#7A6A5A' }}>Member since {memberSince}</span>}
                  </div>
                  {partner.yearsOfExperience && (
                    <span style={{ fontSize: 12, color: '#E8735A', background: '#FFF3E0', padding: '3px 10px', borderRadius: 20, fontWeight: 600 }}>
                      {partner.yearsOfExperience}+ years experience
                    </span>
                  )}
                </div>
              </div>

              {partner.bio && (
                <div style={{ background: '#FFFBF7', borderRadius: 12, padding: '14px 16px', border: '1px solid #F0E4D0', marginBottom: 20 }}>
                  <p style={{ fontSize: 14, color: '#5A4A3A', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>"{partner.bio}"</p>
                </div>
              )}

              {/* Response time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, color: '#4ABEAA', fontSize: 13, fontWeight: 600 }}>
                ⏱ Usually responds within 24 hours
              </div>

              {/* Contact Buttons */}
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowEnquiry(true)}
                  style={{ flex: 1, minWidth: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 20px', borderRadius: 50, background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: '0 2px 12px rgba(244,164,53,0.4)' }}
                >
                  💬 Send Enquiry
                </button>

                {profile.contactMethods.includes('WHATSAPP') && profile.contactWhatsapp && (
                  <a
                    href={`https://wa.me/${profile.contactWhatsapp.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 20px', borderRadius: 50, background: '#dcfce7', color: '#15803d', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}
                  >
                    💚 WhatsApp
                  </a>
                )}

                {profile.contactMethods.includes('PHONE') && profile.contactPhone && (
                  <a
                    href={`tel:${profile.contactPhone}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 20px', borderRadius: 50, background: '#dbeafe', color: '#1d4ed8', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}
                  >
                    📞 Call
                  </a>
                )}

                {/* Fallback: use partner's own phone if profile doesn't expose methods */}
                {profile.contactMethods.length === 0 && partnerPhone && (
                  <a
                    href={`tel:${partnerPhone}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '14px 20px', borderRadius: 50, background: '#dbeafe', color: '#1d4ed8', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}
                  >
                    📞 Call Matchmaker
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {showEnquiry && (
        <EnquiryModal referenceCode={referenceCode} onClose={() => setShowEnquiry(false)} />
      )}
    </div>
  );
}
