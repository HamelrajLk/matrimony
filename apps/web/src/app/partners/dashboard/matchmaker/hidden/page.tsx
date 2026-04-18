'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Profile {
  id: number; firstName: string; lastName: string; gender: 'MALE' | 'FEMALE';
  dateOfBirth: string; referenceCode: string;
  religion?: { name: string }; countryLiving?: { name: string };
  photos: { imageUrl: string }[];
}

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function HiddenProfilesPage() {
  const { token } = useAuthStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/matchmaker/hidden-profiles`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setProfiles(d.profiles ?? []))
      .catch(() => toast.error('Failed to load hidden profiles'))
      .finally(() => setLoading(false));
  }, [token]);

  async function setActive(id: number) {
    setActivatingId(id);
    try {
      const res = await fetch(`${API}/api/matchmaker/profiles/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ profileVisibility: 'ACTIVE' }),
      });
      if (!res.ok) throw new Error();
      setProfiles(ps => ps.filter(p => p.id !== id));
      toast.success('Profile set to active');
    } catch { toast.error('Failed to update profile'); }
    finally { setActivatingId(null); }
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <Link href="/partners/dashboard/matchmaker" style={{ fontSize: '0.85rem', color: '#9A8A7A', textDecoration: 'none', fontFamily: "'Outfit',sans-serif" }}>← Back</Link>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: '#EEF0FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🙈</div>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: '#2A1A1A', margin: 0 }}>Hidden Profiles</h1>
          <p style={{ color: '#9A8A7A', fontSize: 13, margin: 0 }}>Profiles currently hidden from search results</p>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9A8A7A' }}>Loading…</div>
      ) : profiles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 20, border: '1.5px dashed #F0E4D0' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>👁️</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", color: '#2A1A1A', marginBottom: 6 }}>No hidden profiles</h3>
          <p style={{ color: '#9A8A7A', fontSize: 13 }}>All your profiles are visible.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {profiles.map(profile => {
            const photo = profile.photos[0]?.imageUrl;
            const isFemale = profile.gender === 'FEMALE';
            return (
              <div key={profile.id} style={{ background: 'white', borderRadius: 20, border: '1px solid #F0E4D0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 100, position: 'relative', background: isFemale ? 'linear-gradient(135deg,#fce7f3,#fbcfe8)' : 'linear-gradient(135deg,#dbeafe,#bfdbfe)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {photo
                    ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', filter: 'grayscale(20%) opacity(0.8)' }} />
                    : <span style={{ fontSize: '3rem', opacity: 0.5 }}>{isFemale ? '👩' : '👨'}</span>
                  }
                  <div style={{ position: 'absolute', top: 8, right: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', background: '#f3f4f6', borderRadius: 20, padding: '2px 10px', fontFamily: "'Outfit',sans-serif" }}>Hidden</span>
                  </div>
                </div>
                <div style={{ padding: '14px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#9A8A7A', marginBottom: 3 }}>{profile.referenceCode}</div>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1rem', color: '#2A1A1A', marginBottom: 4 }}>
                    {profile.firstName} {profile.lastName}
                  </div>
                  <div style={{ fontSize: 12, color: '#9A8A7A', marginBottom: 14 }}>
                    {calcAge(profile.dateOfBirth)} yrs
                    {profile.religion ? ` · ${profile.religion.name}` : ''}
                    {profile.countryLiving ? ` · ${profile.countryLiving.name}` : ''}
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                    <Link href={`/partners/dashboard/matchmaker/profiles/${profile.id}`} style={{ flex: 1, textAlign: 'center', padding: '9px 0', borderRadius: 50, background: '#FFF3E0', color: '#E8735A', fontSize: 12, fontWeight: 700, textDecoration: 'none', fontFamily: "'Outfit',sans-serif" }}>
                      👁 View
                    </Link>
                    <button
                      onClick={() => setActive(profile.id)}
                      disabled={activatingId === profile.id}
                      style={{ flex: 1, padding: '9px 0', borderRadius: 50, background: activatingId === profile.id ? '#F0E4D0' : 'linear-gradient(135deg,#4ABEAA,#2A9D8F)', color: activatingId === profile.id ? '#9A8A7A' : 'white', border: 'none', fontSize: 12, fontWeight: 700, cursor: activatingId === profile.id ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif" }}
                    >
                      {activatingId === profile.id ? '…' : '✅ Set Active'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
