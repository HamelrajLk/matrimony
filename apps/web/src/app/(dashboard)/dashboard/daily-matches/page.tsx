'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { apiGet } from '@/lib/auth';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Profile {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  aboutMe?: string;
  countryLiving?: { id: number; name: string };
  religion?: { id: number; name: string };
  highestEducation?: { id: number; name: string };
  occupation?: { name: string };
  motherTongue?: { name: string };
  photos: { imageUrl: string; isPrimary: boolean }[];
  isVerified: boolean;
}

function calcAge(dob: string) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
}

function ProfileCard({ profile }: { profile: Profile }) {
  const photo = profile.photos?.find(p => p.isPrimary) ?? profile.photos?.[0];
  const age   = profile.dateOfBirth ? calcAge(profile.dateOfBirth) : null;

  return (
    <div style={{
      background: '#fff',
      borderRadius: 20,
      overflow: 'hidden',
      boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
      transition: 'transform .2s, box-shadow .2s',
      cursor: 'pointer',
    }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.transform = '';
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.07)';
      }}
    >
      {/* Photo */}
      <div style={{ position: 'relative', paddingBottom: '120%', background: '#f5ede4' }}>
        {photo ? (
          <img
            src={photo.imageUrl}
            alt={profile.firstName}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 64, color: '#d4a574',
          }}>👤</div>
        )}
        {profile.isVerified && (
          <span style={{
            position: 'absolute', top: 10, right: 10,
            background: '#4ABEAA', color: '#fff',
            borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600,
          }}>✓ Verified</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 16, color: '#2A1A1A' }}>
            {profile.firstName} {profile.lastName}
          </span>
        </div>
        <div style={{ color: '#7A6A5A', fontSize: 13, marginBottom: 8 }}>
          {age ? `${age} yrs` : ''}
          {profile.countryLiving ? ` • ${profile.countryLiving.name}` : ''}
          {profile.religion ? ` • ${profile.religion.name}` : ''}
        </div>
        {profile.highestEducation && (
          <div style={{ fontSize: 12, color: '#9A8A7A', marginBottom: 4 }}>
            🎓 {profile.highestEducation.name}
          </div>
        )}
        {profile.occupation && (
          <div style={{ fontSize: 12, color: '#9A8A7A', marginBottom: 8 }}>
            💼 {profile.occupation.name}
          </div>
        )}
        {profile.aboutMe && (
          <p style={{
            fontSize: 12, color: '#7A6A5A', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
            marginBottom: 12,
          }}>{profile.aboutMe}</p>
        )}
        <Link
          href={`/dashboard/profile/${profile.id}`}
          style={{
            display: 'block', textAlign: 'center',
            background: 'linear-gradient(135deg, #F4A435, #E8735A)',
            color: '#fff', borderRadius: 50, padding: '8px 0',
            fontSize: 13, fontWeight: 600, textDecoration: 'none',
          }}
        >
          View Profile
        </Link>
      </div>
    </div>
  );
}

export default function DailyMatchesPage() {
  const { user } = useAuthStore();
  const [profiles, setProfiles]   = useState<Profile[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshed, setRefreshed] = useState(false);

  const loadMatches = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Opposite gender from logged-in user, sorted by newest, limited to 12
      const oppositeGender = user.gender === 'MALE' ? 'FEMALE' : 'MALE';
      const params = new URLSearchParams({
        gender:  oppositeGender,
        minAge:  '18',
        maxAge:  '60',
        limit:   '12',
        page:    '1',
        sortBy:  'createdAt',
        sortDir: 'desc',
      });
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API}/api/profiles?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setProfiles(data.data?.profiles ?? data.data ?? []);
    } catch {
      toast.error('Could not load daily matches');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  const handleRefresh = () => {
    setRefreshed(true);
    loadMatches();
    setTimeout(() => setRefreshed(false), 2000);
  };

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 28,
      }}>
        <div>
          <h1 style={{
            fontFamily: 'Playfair Display, serif',
            fontWeight: 800, fontSize: 28, color: '#2A1A1A', margin: 0,
          }}>
            ✨ Daily Matches
          </h1>
          <p style={{ color: '#7A6A5A', fontSize: 14, marginTop: 6 }}>
            Handpicked profiles suggested for you today
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={loading}
          style={{
            background: refreshed
              ? 'linear-gradient(135deg, #4ABEAA, #2a9d8f)'
              : 'linear-gradient(135deg, #F4A435, #E8735A)',
            color: '#fff', border: 'none', borderRadius: 50,
            padding: '10px 22px', fontSize: 14, fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'background .3s',
          }}
        >
          {refreshed ? '✓ Refreshed!' : loading ? 'Loading…' : '🔄 Refresh'}
        </button>
      </div>

      {/* Divider */}
      <div style={{
        width: 60, height: 3,
        background: 'linear-gradient(90deg, #F4A435, #E8735A)',
        borderRadius: 4, marginBottom: 32,
      }} />

      {/* Grid */}
      {loading ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 20,
        }}>
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} style={{
              borderRadius: 20, overflow: 'hidden',
              background: 'linear-gradient(135deg, #fdf0e6, #fff5ee)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}>
              <div style={{ paddingBottom: '120%' }} />
              <div style={{ padding: '14px 16px' }}>
                <div style={{ height: 16, borderRadius: 8, background: '#f0e0d0', marginBottom: 8 }} />
                <div style={{ height: 12, borderRadius: 6, background: '#f5ebe0', width: '70%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : profiles.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px',
          background: '#fff', borderRadius: 24,
          boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
        }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>💑</div>
          <h2 style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 22, color: '#2A1A1A', marginBottom: 8,
          }}>No matches found today</h2>
          <p style={{ color: '#7A6A5A', fontSize: 15 }}>
            Complete your profile to get better match suggestions.
          </p>
          <Link
            href="/dashboard/profile?tab=basic"
            style={{
              display: 'inline-block', marginTop: 20,
              background: 'linear-gradient(135deg, #F4A435, #E8735A)',
              color: '#fff', borderRadius: 50, padding: '12px 28px',
              fontWeight: 600, textDecoration: 'none', fontSize: 14,
            }}
          >
            Complete Profile
          </Link>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 20,
        }}>
          {profiles.map(p => <ProfileCard key={p.id} profile={p} />)}
        </div>
      )}

      {/* Browse all link */}
      {profiles.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: 40 }}>
          <Link
            href="/dashboard/browse"
            style={{
              display: 'inline-block',
              border: '2px solid #F4A435',
              color: '#F4A435', borderRadius: 50,
              padding: '12px 32px', fontWeight: 600,
              textDecoration: 'none', fontSize: 15,
              transition: 'all .2s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = '#F4A435';
              (e.currentTarget as HTMLAnchorElement).style.color = '#fff';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLAnchorElement).style.background = 'transparent';
              (e.currentTarget as HTMLAnchorElement).style.color = '#F4A435';
            }}
          >
            Browse All Profiles →
          </Link>
        </div>
      )}
    </div>
  );
}
