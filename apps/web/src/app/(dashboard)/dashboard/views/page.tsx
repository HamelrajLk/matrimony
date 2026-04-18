'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { apiGet } from '@/lib/auth';

interface ViewEntry {
  viewedAt: string;
  viewer?: { id: number; firstName: string; lastName: string; gender: string; dateOfBirth: string; countryLiving?: { name: string }; photos: { imageUrl: string }[]; };
  viewed?: { id: number; firstName: string; lastName: string; gender: string; dateOfBirth: string; countryLiving?: { name: string }; photos: { imageUrl: string }[]; };
}

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function ViewCard({ entry, field }: { entry: ViewEntry; field: 'viewer' | 'viewed' }) {
  const p = entry[field];
  if (!p) return null;
  const photo = p.photos?.[0]?.imageUrl;
  return (
    <Link href={`/dashboard/profile/${p.id}`} style={{ background: 'white', borderRadius: 14, padding: '14px', display: 'flex', gap: 14, alignItems: 'center', border: '1px solid #F0E4D0', textDecoration: 'none', transition: 'border-color 0.2s' }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = '#F4A435')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = '#F0E4D0')}
    >
      <div style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0, background: photo ? `url(${photo}) center/cover` : 'linear-gradient(135deg,#F4A435,#E8735A)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', overflow: 'hidden' }}>
        {!photo && (p.gender === 'MALE' ? '👨' : '👩')}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: '#2A1A1A', fontSize: '0.95rem' }}>
          {p.firstName} {p.lastName[0]}.
        </div>
        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.75rem', color: '#7A6A5A' }}>
          {calcAge(p.dateOfBirth)} yrs · {p.countryLiving?.name || 'Unknown'}
        </div>
      </div>
      <div style={{ fontSize: '0.72rem', color: '#9A8A7A', textAlign: 'right', flexShrink: 0 }}>
        {new Date(entry.viewedAt).toLocaleDateString()}<br />
        {new Date(entry.viewedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </Link>
  );
}

export default function ViewsPage() {
  const { token } = useAuthStore();
  const [tab, setTab] = useState<'visitors' | 'mine'>('visitors');
  const [visitors, setVisitors] = useState<ViewEntry[]>([]);
  const [mine, setMine] = useState<ViewEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    Promise.all([
      apiGet<{ views: ViewEntry[] }>('/api/profiles/views/visitors', token).then(d => setVisitors(d.views)).catch(() => {}),
      apiGet<{ views: ViewEntry[] }>('/api/profiles/views/mine', token).then(d => setMine(d.views)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [token]);

  const list = tab === 'visitors' ? visitors : mine;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: '1.7rem', fontWeight: 800, color: '#2A1A1A', marginBottom: 4 }}>Profile Views 👁️</h1>
        <p style={{ fontFamily: "'Outfit',sans-serif", color: '#7A6A5A', fontSize: '0.88rem' }}>See who's been checking out your profile</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'white', padding: 6, borderRadius: 14, border: '1px solid #F0E4D0', width: 'fit-content' }}>
        {[{ key: 'visitors', label: `Who Viewed Me (${visitors.length})` }, { key: 'mine', label: `Profiles I Viewed (${mine.length})` }].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key as any)}
            style={{ background: tab === key ? 'linear-gradient(135deg,#F4A435,#E8735A)' : 'transparent', color: tab === key ? 'white' : '#7A6A5A', border: 'none', borderRadius: 10, padding: '8px 18px', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontWeight: tab === key ? 700 : 500, fontSize: '0.83rem', transition: 'all 0.2s', whiteSpace: 'nowrap' }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>Loading…</div>
      ) : list.length === 0 ? (
        <div style={{ background: 'white', borderRadius: 20, padding: 60, textAlign: 'center', border: '1px dashed #F0E4D0' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>👁️</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 600, color: '#5A4A3A', marginBottom: 8 }}>No views yet</div>
          <div style={{ fontSize: '0.85rem', color: '#9A8A7A' }}>
            {tab === 'visitors' ? 'Once someone views your profile, they appear here.' : 'Browse profiles to see your viewing history.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.map((entry, i) => <ViewCard key={i} entry={entry} field={tab === 'visitors' ? 'viewer' : 'viewed'} />)}
        </div>
      )}
    </div>
  );
}
