'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface BrokerProfile {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  status: string;
  photos: { imageUrl: string }[];
}

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

export default function BrokerDeletedProfilesPage() {
  const [profiles, setProfiles] = useState<BrokerProfile[]>([]);
  const [loading,  setLoading]  = useState(true);

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get('/api/brokers/deleted-profiles');
      setProfiles(r.data.profiles ?? []);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  async function restore(id: number) {
    await api.post(`/api/brokers/profiles/${id}/restore`);
    toast.success('Profile restored');
    fetchProfiles();
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 5% 80px', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ marginBottom: 28 }}>
        <Link href="/broker/dashboard" style={{ color: '#7A6A5A', fontSize: 13, textDecoration: 'none', fontFamily: "'Outfit',sans-serif" }}>← Back to Dashboard</Link>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.4rem,3vw,1.8rem)', fontWeight: 800, color: '#2A1A1A', margin: '10px 0 6px' }}>🗑️ Deleted Profiles</h1>
        <p style={{ color: '#7A6A5A', fontSize: 14, margin: 0 }}>Restore profiles that were accidentally deleted.</p>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: 40, color: '#9A8A7A' }}>Loading…</div>}

      {!loading && profiles.length === 0 && (
        <div style={{ background: 'white', borderRadius: 20, border: '1px dashed #F0E4D0', padding: '56px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>✅</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", color: '#2A1A1A' }}>No deleted profiles</h3>
          <p style={{ color: '#7A6A5A', fontSize: 13 }}>All profiles are active.</p>
        </div>
      )}

      {!loading && profiles.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
          {profiles.map(p => {
            const photo = p.photos[0]?.imageUrl;
            const age   = calcAge(p.dateOfBirth);
            return (
              <div key={p.id} style={{ background: 'white', borderRadius: 18, overflow: 'hidden', border: '1px solid #F0E4D0', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', opacity: 0.85 }}>
                <div style={{ height: 170, background: 'linear-gradient(135deg,#fdf0e6,#ffe4d0)', position: 'relative', overflow: 'hidden', filter: 'grayscale(30%)' }}>
                  {photo
                    ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44, color: '#d4a574' }}>{p.gender === 'MALE' ? '👨' : '👩'}</div>
                  }
                  <span style={{ position: 'absolute', top: 8, right: 8, background: '#FFF0F0', color: '#E8735A', borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700 }}>DELETED</span>
                </div>
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#2A1A1A', fontFamily: "'Playfair Display',serif", marginBottom: 2 }}>{p.firstName} {p.lastName}</div>
                  <div style={{ fontSize: 12, color: '#7A6A5A', marginBottom: 10 }}>{age} yrs · {p.gender === 'MALE' ? 'Male' : 'Female'}</div>
                  <button onClick={() => restore(p.id)} style={{ width: '100%', padding: '7px 0', borderRadius: 8, border: 'none', background: 'linear-gradient(135deg,#4ABEAA,#2A9D8F)', color: 'white', fontWeight: 700, fontSize: 11, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                    ↩ Restore
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
