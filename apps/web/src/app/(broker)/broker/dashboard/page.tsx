'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import AnimIn from '@/components/landing/ui/AnimIn';

interface BrokerProfile {
  id: number;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  maritalStatus: string;
  status: string;
  createdByType: string;
  photos: { imageUrl: string }[];
}

interface Stats {
  total: number;
  active: number;
  deleted: number;
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  ACTIVE:      { bg: '#E8F8F5', color: '#2A9D8F' },
  INCOMPLETE:  { bg: '#FFF3E0', color: '#F4A435' },
  DELETED:     { bg: '#FFF0F0', color: '#E8735A' },
  HIDDEN:      { bg: '#F0F0FF', color: '#7B8FE8' },
};

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function DeleteModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,26,26,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onCancel}>
      <div style={{ background: 'white', borderRadius: 20, padding: '32px 28px', maxWidth: 400, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>⚠️</div>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: '#2A1A1A', textAlign: 'center', margin: '0 0 8px' }}>Delete Profile?</h3>
        <p style={{ color: '#7A6A5A', fontSize: 13, textAlign: 'center', margin: '0 0 24px', lineHeight: 1.6, fontFamily: "'Outfit',sans-serif" }}>
          This profile will be moved to deleted profiles. You can restore it later from the deleted profiles page.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', borderRadius: 50, border: '1.5px solid #E8D5C0', background: 'white', color: '#7A6A5A', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 14 }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '11px', borderRadius: 50, border: 'none', background: 'linear-gradient(135deg,#E8735A,#E85AA3)', color: 'white', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 14 }}>🗑️ Delete</button>
        </div>
      </div>
    </div>
  );
}

function NewProfileModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ firstName: '', lastName: '', gender: 'MALE', dateOfBirth: '', maritalStatus: 'NEVER_MARRIED', createdByType: 'PARENT_OR_RELATIVE' });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.dateOfBirth) { toast.error('Please fill all required fields'); return; }
    setSaving(true);
    try {
      const r = await api.post('/api/brokers/profiles', form);
      toast.success('Profile created!');
      onCreated();
      router.push(`/dashboard/profile?brokerId=${r.data.profile.id}`);
    } catch { toast.error('Failed to create profile'); } finally { setSaving(false); }
  }

  const inp: React.CSSProperties = { width: '100%', padding: '10px 14px', borderRadius: 10, border: '1.5px solid #E8D5C0', fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#2A1A1A', background: 'white', outline: 'none', boxSizing: 'border-box' };
  const lbl: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, color: '#9A8A7A', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'Outfit',sans-serif" };
  const sel: React.CSSProperties = { ...inp, appearance: 'none', WebkitAppearance: 'none' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,26,26,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 24, padding: '32px 28px', maxWidth: 480, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#2A1A1A', margin: '0 0 4px' }}>Add Family Profile</h3>
        <p style={{ color: '#7A6A5A', fontSize: 13, margin: '0 0 22px', fontFamily: "'Outfit',sans-serif" }}>Create a matrimony profile for a family member.</p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>First Name *</label>
              <input style={inp} placeholder="e.g. Priya" value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} required />
            </div>
            <div>
              <label style={lbl}>Last Name *</label>
              <input style={inp} placeholder="e.g. Fernando" value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} required />
            </div>
          </div>
          <div>
            <label style={lbl}>Gender *</label>
            <select style={sel} value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Date of Birth *</label>
            <input type="date" style={inp} max={new Date().toISOString().split('T')[0]} value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} required />
          </div>
          <div>
            <label style={lbl}>Marital Status *</label>
            <select style={sel} value={form.maritalStatus} onChange={e => setForm(p => ({ ...p, maritalStatus: e.target.value }))}>
              <option value="NEVER_MARRIED">Never Married</option>
              <option value="DIVORCED">Divorced</option>
              <option value="WIDOWED">Widowed</option>
              <option value="SEPARATED">Separated</option>
            </select>
          </div>
          <div>
            <label style={lbl}>Relationship to You *</label>
            <select style={sel} value={form.createdByType} onChange={e => setForm(p => ({ ...p, createdByType: e.target.value }))}>
              <option value="PARENT_OR_RELATIVE">Parent / Relative</option>
              <option value="DAUGHTER">Daughter</option>
              <option value="SON">Son</option>
              <option value="SIBLING">Sibling</option>
              <option value="FRIEND">Friend</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 50, border: '1.5px solid #E8D5C0', background: 'transparent', color: '#7A6A5A', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 14 }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ flex: 2, padding: '12px', borderRadius: 50, border: 'none', background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', fontWeight: 700, fontSize: 14, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif", opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Creating…' : '✨ Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function BrokerDashboard() {
  const [profiles,    setProfiles]    = useState<BrokerProfile[]>([]);
  const [stats,       setStats]       = useState<Stats>({ total: 0, active: 0, deleted: 0 });
  const [loading,     setLoading]     = useState(true);
  const [showNew,     setShowNew]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesRes, statsRes] = await Promise.allSettled([
        api.get('/api/brokers/profiles'),
        api.get('/api/brokers/stats'),
      ]);
      if (profilesRes.status === 'fulfilled') setProfiles(profilesRes.value.data.profiles ?? []);
      if (statsRes.status === 'fulfilled')    setStats(statsRes.value.data);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  async function doDelete(id: number) {
    await api.delete(`/api/brokers/profiles/${id}`);
    setDeleteTarget(null);
    toast.success('Profile deleted');
    fetchAll();
  }

  const statCards = [
    { icon: '👥', label: 'Total Profiles',   value: stats.total,   color: '#F4A435', bg: '#FFF3E0', href: '/broker/dashboard' },
    { icon: '✅', label: 'Active Profiles',  value: stats.active,  color: '#4ABEAA', bg: '#E6FAF7', href: '/broker/dashboard' },
    { icon: '🗑️', label: 'Deleted Profiles', value: stats.deleted, color: '#E8735A', bg: '#FFF0EC', href: '/broker/dashboard/deleted' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 5% 80px', fontFamily: "'Outfit',sans-serif" }}>

      {/* Header */}
      <AnimIn>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, color: '#2A1A1A', margin: '0 0 6px' }}>
              👨‍👩‍👧 Family Broker Dashboard
            </h1>
            <p style={{ color: '#7A6A5A', fontSize: 14, margin: 0 }}>Manage matrimony profiles for your family members</p>
          </div>
          <button onClick={() => setShowNew(true)} style={{ background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', border: 'none', borderRadius: 50, padding: '12px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Outfit',sans-serif', boxShadow: '0 6px 20px rgba(244,164,53,0.3)" }}>
            + Add Profile
          </button>
        </div>
      </AnimIn>

      {/* Stats */}
      <AnimIn delay={60}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {statCards.map(c => (
            <Link key={c.label} href={c.href} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'white', borderRadius: 18, border: '1px solid #F0E4D0', padding: '20px', boxShadow: '0 4px 14px rgba(0,0,0,0.04)', cursor: 'pointer', transition: 'transform .2s, box-shadow .2s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 28px ${c.color}20`; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 14px rgba(0,0,0,0.04)'; }}
              >
                <div style={{ width: 38, height: 38, borderRadius: 10, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 10 }}>{c.icon}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: c.color, fontFamily: "'Playfair Display',serif", lineHeight: 1 }}>{c.value}</div>
                <div style={{ fontSize: 12, color: '#7A6A5A', marginTop: 4 }}>{c.label}</div>
              </div>
            </Link>
          ))}
        </div>
      </AnimIn>

      {/* Profile list */}
      <AnimIn delay={100}>
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: '#2A1A1A', margin: 0 }}>All Profiles</h2>
          <span style={{ color: '#9A8A7A', fontSize: 12 }}>{profiles.length} profile{profiles.length !== 1 ? 's' : ''}</span>
        </div>

        {loading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ height: 220, background: 'white', borderRadius: 16, border: '1px solid #F0E4D0', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        )}

        {!loading && profiles.length === 0 && (
          <div style={{ background: 'white', borderRadius: 20, border: '1px dashed #F0E4D0', padding: '56px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>👨‍👩‍👧</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", color: '#2A1A1A', marginBottom: 8 }}>No profiles yet</h3>
            <p style={{ color: '#7A6A5A', fontSize: 14, marginBottom: 20 }}>Add matrimony profiles for your family members to help them find their match.</p>
            <button onClick={() => setShowNew(true)} style={{ background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', border: 'none', borderRadius: 50, padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              + Add First Profile
            </button>
          </div>
        )}

        {!loading && profiles.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16 }}>
            {profiles.map(p => {
              const photo = p.photos[0]?.imageUrl;
              const age   = calcAge(p.dateOfBirth);
              const st    = STATUS_COLORS[p.status] ?? STATUS_COLORS.INCOMPLETE;
              return (
                <div key={p.id} style={{ background: 'white', borderRadius: 18, overflow: 'hidden', border: '1px solid #F0E4D0', boxShadow: '0 4px 14px rgba(0,0,0,0.04)' }}>
                  {/* Photo */}
                  <div style={{ height: 180, background: 'linear-gradient(135deg,#fdf0e6,#ffe4d0)', position: 'relative', overflow: 'hidden' }}>
                    {photo
                      ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, color: '#d4a574' }}>{p.gender === 'MALE' ? '👨' : '👩'}</div>
                    }
                    <span style={{ position: 'absolute', top: 8, right: 8, background: st.bg, color: st.color, borderRadius: 20, padding: '2px 8px', fontSize: 9, fontWeight: 700, fontFamily: "'Outfit',sans-serif" }}>
                      {p.status}
                    </span>
                  </div>

                  {/* Info */}
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#2A1A1A', fontFamily: "'Playfair Display',serif", marginBottom: 2 }}>
                      {p.firstName} {p.lastName}
                    </div>
                    <div style={{ fontSize: 12, color: '#7A6A5A', marginBottom: 10 }}>
                      {age} yrs · {p.gender === 'MALE' ? 'Male' : 'Female'}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Link href={`/dashboard/profile?brokerId=${p.id}`} style={{
                        flex: 1, padding: '6px 0', borderRadius: 8, border: '1.5px solid #F4A435',
                        color: '#F4A435', fontWeight: 700, fontSize: 11, textDecoration: 'none',
                        textAlign: 'center', fontFamily: "'Outfit',sans-serif",
                      }}>Edit</Link>
                      <button onClick={() => setDeleteTarget(p.id)} style={{
                        width: 30, borderRadius: 8, border: '1.5px solid #F0E4D0', background: 'white',
                        color: '#E8735A', cursor: 'pointer', fontSize: 14,
                      }}>🗑</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </AnimIn>

      {showNew && <NewProfileModal onClose={() => setShowNew(false)} onCreated={fetchAll} />}
      {deleteTarget !== null && <DeleteModal onConfirm={() => doDelete(deleteTarget)} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
