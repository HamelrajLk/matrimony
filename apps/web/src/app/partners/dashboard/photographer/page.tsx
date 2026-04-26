'use client';
import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const COLOR = '#667eea';
const GRAD  = 'linear-gradient(135deg,#667eea,#E85AA3)';

type Tab = 'packages' | 'album' | 'events';

interface Pkg {
  id: number; name: string; description: string | null;
  price: string; photoCount: number | null; durationHours: number | null;
}
interface Photo {
  id: number; url: string; caption: string | null; isFeatured: boolean;
}
interface EventPhoto { id: number; url: string; caption: string | null; }
interface PhotEvent {
  id: number; name: string; description: string | null;
  eventDate: string; photos: EventPhoto[];
}

// ── Shared styles ─────────────────────────────────────────────
const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 10,
  border: '1.5px solid #E8D5C0', fontFamily: "'Outfit',sans-serif",
  fontSize: 13, color: '#2A1A1A', background: 'white', outline: 'none',
  boxSizing: 'border-box',
};
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 700, color: '#9A8A7A',
  textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6,
  fontFamily: "'Outfit',sans-serif",
};
const card: React.CSSProperties = {
  background: 'white', borderRadius: 18, border: '1px solid #F0E4D0',
  boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
};

// ── Package form ──────────────────────────────────────────────
function PackageForm({ initial, onSave, onCancel }: {
  initial?: Pkg; onSave: (d: Partial<Pkg>) => void; onCancel: () => void;
}) {
  const [f, setF] = useState({
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    price: initial?.price ?? '',
    photoCount: initial?.photoCount?.toString() ?? '',
    durationHours: initial?.durationHours?.toString() ?? '',
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div>
        <label style={lbl}>Package Name *</label>
        <input style={inp} value={f.name} placeholder="e.g. Basic, Premium…"
          onChange={e => setF(p => ({ ...p, name: e.target.value }))} />
      </div>
      <div>
        <label style={lbl}>Description</label>
        <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} rows={3}
          placeholder="What's included…"
          value={f.description}
          onChange={e => setF(p => ({ ...p, description: e.target.value }))} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <div>
          <label style={lbl}>Price (LKR) *</label>
          <input style={inp} type="number" min={0} placeholder="e.g. 50000"
            value={f.price} onChange={e => setF(p => ({ ...p, price: e.target.value }))} />
        </div>
        <div>
          <label style={lbl}>Photo Count</label>
          <input style={inp} type="number" min={1} placeholder="e.g. 200"
            value={f.photoCount} onChange={e => setF(p => ({ ...p, photoCount: e.target.value }))} />
        </div>
        <div>
          <label style={lbl}>Duration (hours)</label>
          <input style={inp} type="number" min={1} placeholder="e.g. 8"
            value={f.durationHours} onChange={e => setF(p => ({ ...p, durationHours: e.target.value }))} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCancel} style={{
          flex: 1, padding: '10px', borderRadius: 50, border: '1.5px solid #E8D5C0',
          background: 'transparent', color: '#7A6A5A', cursor: 'pointer',
          fontFamily: "'Outfit',sans-serif", fontSize: 13,
        }}>Cancel</button>
        <button onClick={() => {
          if (!f.name || !f.price) { toast.error('Name and price are required'); return; }
          onSave({ ...f, price: f.price, photoCount: f.photoCount ? Number(f.photoCount) : undefined, durationHours: f.durationHours ? Number(f.durationHours) : undefined });
        }} style={{
          flex: 2, padding: '10px', borderRadius: 50, border: 'none',
          background: GRAD, color: 'white', fontWeight: 700, fontSize: 13,
          cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
        }}>
          {initial ? 'Save Changes' : 'Add Package'}
        </button>
      </div>
    </div>
  );
}

// ── Packages tab ──────────────────────────────────────────────
function PackagesTab({ token }: { token: string }) {
  const [packages, setPackages] = useState<Pkg[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Pkg | null>(null);

  async function load() {
    try {
      const r = await fetch(`${API}/api/photographer/packages`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setPackages(d.packages ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function save(data: Partial<Pkg>) {
    try {
      const url = editing ? `${API}/api/photographer/packages/${editing.id}` : `${API}/api/photographer/packages`;
      const r = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!r.ok) throw new Error((await r.json()).message);
      toast.success(editing ? 'Package updated' : 'Package created');
      setShowForm(false); setEditing(null); load();
    } catch (e: any) { toast.error(e.message ?? 'Failed to save'); }
  }

  async function del(id: number) {
    if (!confirm('Delete this package?')) return;
    await fetch(`${API}/api/photographer/packages/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    toast.success('Package deleted'); load();
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9A8A7A' }}>Loading…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#2A1A1A', margin: 0 }}>Packages</h2>
          <p style={{ color: '#9A8A7A', fontSize: 13, margin: '4px 0 0', fontFamily: "'Outfit',sans-serif" }}>
            Create pricing packages for public visitors to browse.
          </p>
        </div>
        {!showForm && !editing && (
          <button onClick={() => setShowForm(true)} style={{
            background: GRAD, color: 'white', border: 'none', borderRadius: 50,
            padding: '10px 22px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap',
          }}>+ Add Package</button>
        )}
      </div>

      {(showForm && !editing) && (
        <div style={{ ...card, padding: '24px' }}>
          <PackageForm onSave={save} onCancel={() => setShowForm(false)} />
        </div>
      )}

      {packages.length === 0 && !showForm && (
        <div style={{ ...card, padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📦</div>
          <p style={{ color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", margin: 0 }}>
            No packages yet. Add your first package.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {packages.map(pkg => (
          <div key={pkg.id} style={{ ...card, padding: '20px 24px' }}>
            {editing?.id === pkg.id ? (
              <PackageForm initial={editing} onSave={save} onCancel={() => setEditing(null)} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                    <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color: '#2A1A1A' }}>
                      {pkg.name}
                    </span>
                    <span style={{ fontWeight: 800, fontSize: 15, color: COLOR, fontFamily: "'Outfit',sans-serif" }}>
                      LKR {Number(pkg.price).toLocaleString()}
                    </span>
                  </div>
                  {pkg.description && (
                    <p style={{ color: '#7A6A5A', fontSize: 13, margin: '0 0 8px', fontFamily: "'Outfit',sans-serif", lineHeight: 1.6 }}>
                      {pkg.description}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {pkg.photoCount && (
                      <span style={{ fontSize: 12, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>
                        📸 {pkg.photoCount} photos
                      </span>
                    )}
                    {pkg.durationHours && (
                      <span style={{ fontSize: 12, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>
                        ⏱ {pkg.durationHours}h coverage
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setEditing(pkg)} style={{
                    padding: '7px 16px', borderRadius: 50, border: '1.5px solid #E8D5C0',
                    background: 'white', color: '#7A6A5A', cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600,
                  }}>✏️ Edit</button>
                  <button onClick={() => del(pkg.id)} style={{
                    padding: '7px 16px', borderRadius: 50, border: '1.5px solid #FFC5C5',
                    background: '#FFF5F5', color: '#E87070', cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600,
                  }}>🗑 Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Album tab ─────────────────────────────────────────────────
function AlbumTab({ token }: { token: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const featured = photos.filter(p => p.isFeatured);

  async function load() {
    try {
      const r = await fetch(`${API}/api/photographer/photos`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setPhotos(d.photos ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function upload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const r = await fetch(`${API}/api/photographer/photos`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!r.ok) throw new Error((await r.json()).message);
      toast.success('Photo uploaded');
      load();
    } catch (e: any) { toast.error(e.message ?? 'Upload failed'); }
    finally { setUploading(false); }
  }

  async function toggleFeatured(photo: Photo) {
    const r = await fetch(`${API}/api/photographer/photos/${photo.id}/featured`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}` },
    });
    const d = await r.json();
    if (!r.ok) { toast.error(d.message); return; }
    toast.success(photo.isFeatured ? 'Removed from featured' : 'Added to featured');
    load();
  }

  async function del(id: number) {
    if (!confirm('Delete this photo?')) return;
    await fetch(`${API}/api/photographer/photos/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    toast.success('Photo deleted'); load();
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9A8A7A' }}>Loading…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#2A1A1A', margin: 0 }}>Album</h2>
          <p style={{ color: '#9A8A7A', fontSize: 13, margin: '4px 0 0', fontFamily: "'Outfit',sans-serif" }}>
            Upload your best work. Mark up to 10 photos as featured — they appear on your public page.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            background: `${COLOR}12`, color: COLOR, padding: '5px 14px', borderRadius: 50,
            fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif",
          }}>
            ⭐ {featured.length}/10 featured
          </span>
          <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{
            background: GRAD, color: 'white', border: 'none', borderRadius: 50,
            padding: '10px 22px', fontWeight: 700, fontSize: 13, cursor: uploading ? 'not-allowed' : 'pointer',
            fontFamily: "'Outfit',sans-serif", opacity: uploading ? 0.7 : 1,
          }}>
            {uploading ? 'Uploading…' : '+ Upload Photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => { if (e.target.files?.[0]) upload(e.target.files[0]); e.target.value = ''; }} />
        </div>
      </div>

      {photos.length === 0 && (
        <div style={{ ...card, padding: '64px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>📷</div>
          <p style={{ color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", margin: 0 }}>
            No photos yet. Upload your first photo to get started.
          </p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
        {photos.map(photo => (
          <div key={photo.id} style={{
            borderRadius: 14, overflow: 'hidden', position: 'relative',
            border: photo.isFeatured ? `2px solid ${COLOR}` : '1px solid #F0E4D0',
            boxShadow: photo.isFeatured ? `0 4px 16px ${COLOR}30` : 'none',
          }}>
            <div style={{ position: 'relative', paddingBottom: '75%', background: '#F5EDE0' }}>
              <img src={photo.url} alt={photo.caption ?? ''} style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
              }} />
              {photo.isFeatured && (
                <div style={{
                  position: 'absolute', top: 8, left: 8, background: COLOR, color: 'white',
                  borderRadius: 50, padding: '3px 10px', fontSize: 10, fontWeight: 700,
                  fontFamily: "'Outfit',sans-serif",
                }}>⭐ Featured</div>
              )}
            </div>
            <div style={{ padding: '10px 12px', background: 'white', display: 'flex', gap: 6 }}>
              <button
                onClick={() => toggleFeatured(photo)}
                title={photo.isFeatured ? 'Unfeature' : 'Feature on public page'}
                style={{
                  flex: 1, padding: '6px 4px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                  border: photo.isFeatured ? `1.5px solid ${COLOR}` : '1.5px solid #E8D5C0',
                  background: photo.isFeatured ? `${COLOR}12` : 'white',
                  color: photo.isFeatured ? COLOR : '#9A8A7A',
                  cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                }}
              >
                {photo.isFeatured ? '★ Featured' : '☆ Feature'}
              </button>
              <button onClick={() => del(photo.id)} style={{
                padding: '6px 10px', borderRadius: 8, border: '1.5px solid #FFC5C5',
                background: '#FFF5F5', color: '#E87070', cursor: 'pointer', fontSize: 12,
              }}>🗑</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Events tab ────────────────────────────────────────────────
function EventsTab({ token }: { token: string }) {
  const [events, setEvents] = useState<PhotEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', eventDate: '' });
  const [saving, setSaving] = useState(false);
  const [uploadingFor, setUploadingFor] = useState<number | null>(null);
  const [editingEvent, setEditingEvent] = useState<PhotEvent | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  async function load() {
    try {
      const r = await fetch(`${API}/api/photographer/events`, { headers: { Authorization: `Bearer ${token}` } });
      const d = await r.json();
      setEvents(d.events ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function createEvent() {
    if (!form.name || !form.eventDate) { toast.error('Name and date are required'); return; }
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/photographer/events`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!r.ok) throw new Error((await r.json()).message);
      toast.success('Event created');
      setForm({ name: '', description: '', eventDate: '' });
      setShowForm(false);
      load();
    } catch (e: any) { toast.error(e.message ?? 'Failed'); }
    finally { setSaving(false); }
  }

  async function updateEvent() {
    if (!editingEvent) return;
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/photographer/events/${editingEvent.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingEvent.name, description: editingEvent.description, eventDate: editingEvent.eventDate }),
      });
      if (!r.ok) throw new Error((await r.json()).message);
      toast.success('Event updated');
      setEditingEvent(null);
      load();
    } catch (e: any) { toast.error(e.message ?? 'Failed'); }
    finally { setSaving(false); }
  }

  async function deleteEvent(id: number) {
    if (!confirm('Delete this event and all its photos?')) return;
    await fetch(`${API}/api/photographer/events/${id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    toast.success('Event deleted'); load();
  }

  async function uploadEventPhoto(eventId: number, file: File) {
    setUploadingFor(eventId);
    const fd = new FormData();
    fd.append('image', file);
    try {
      const r = await fetch(`${API}/api/photographer/events/${eventId}/photos`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      if (!r.ok) throw new Error((await r.json()).message);
      toast.success('Photo uploaded'); load();
    } catch (e: any) { toast.error(e.message ?? 'Upload failed'); }
    finally { setUploadingFor(null); }
  }

  async function deleteEventPhoto(eventId: number, photoId: number) {
    if (!confirm('Delete this photo?')) return;
    await fetch(`${API}/api/photographer/events/${eventId}/photos/${photoId}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
    });
    toast.success('Photo deleted'); load();
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#9A8A7A' }}>Loading…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#2A1A1A', margin: 0 }}>Events</h2>
          <p style={{ color: '#9A8A7A', fontSize: 13, margin: '4px 0 0', fontFamily: "'Outfit',sans-serif" }}>
            Showcase the weddings and events you've photographed.
          </p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={{
            background: GRAD, color: 'white', border: 'none', borderRadius: 50,
            padding: '10px 22px', fontWeight: 700, fontSize: 13, cursor: 'pointer',
            fontFamily: "'Outfit',sans-serif",
          }}>+ Add Event</button>
        )}
      </div>

      {showForm && (
        <div style={{ ...card, padding: '24px' }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, color: '#2A1A1A', margin: '0 0 18px' }}>New Event</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>Event Name *</label>
                <input style={inp} placeholder="e.g. Priya & Kushan's Wedding"
                  value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div>
                <label style={lbl}>Event Date *</label>
                <input style={inp} type="date" value={form.eventDate}
                  onChange={e => setForm(p => ({ ...p, eventDate: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={lbl}>Description</label>
              <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} rows={2}
                placeholder="Brief description…"
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setShowForm(false); setForm({ name: '', description: '', eventDate: '' }); }} style={{
                flex: 1, padding: '10px', borderRadius: 50, border: '1.5px solid #E8D5C0',
                background: 'transparent', color: '#7A6A5A', cursor: 'pointer',
                fontFamily: "'Outfit',sans-serif", fontSize: 13,
              }}>Cancel</button>
              <button onClick={createEvent} disabled={saving} style={{
                flex: 2, padding: '10px', borderRadius: 50, border: 'none',
                background: GRAD, color: 'white', fontWeight: 700, fontSize: 13,
                cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif",
                opacity: saving ? 0.7 : 1,
              }}>{saving ? 'Creating…' : 'Create Event'}</button>
            </div>
          </div>
        </div>
      )}

      {events.length === 0 && !showForm && (
        <div style={{ ...card, padding: '64px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 14 }}>🎊</div>
          <p style={{ color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", margin: 0 }}>
            No events yet. Create your first event to showcase your work.
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {events.map(ev => (
          <div key={ev.id} style={{ ...card, overflow: 'hidden' }}>
            {/* Event header */}
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #F5EDE0', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ flex: 1 }}>
                {editingEvent?.id === ev.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      <input style={inp} value={editingEvent.name}
                        onChange={e => setEditingEvent(p => p ? { ...p, name: e.target.value } : p)} />
                      <input style={inp} type="date" value={editingEvent.eventDate.split('T')[0]}
                        onChange={e => setEditingEvent(p => p ? { ...p, eventDate: e.target.value } : p)} />
                    </div>
                    <textarea style={{ ...inp, resize: 'vertical' } as React.CSSProperties} rows={2}
                      value={editingEvent.description ?? ''}
                      onChange={e => setEditingEvent(p => p ? { ...p, description: e.target.value } : p)} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setEditingEvent(null)} style={{
                        padding: '7px 16px', borderRadius: 50, border: '1.5px solid #E8D5C0',
                        background: 'white', color: '#7A6A5A', cursor: 'pointer',
                        fontFamily: "'Outfit',sans-serif", fontSize: 12,
                      }}>Cancel</button>
                      <button onClick={updateEvent} disabled={saving} style={{
                        padding: '7px 16px', borderRadius: 50, border: 'none',
                        background: GRAD, color: 'white', fontWeight: 700, fontSize: 12,
                        cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                      }}>Save</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 16, color: '#2A1A1A', marginBottom: 3 }}>
                      {ev.name}
                    </div>
                    <div style={{ fontSize: 12, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", marginBottom: ev.description ? 5 : 0 }}>
                      📅 {new Date(ev.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                    {ev.description && (
                      <p style={{ fontSize: 13, color: '#7A6A5A', margin: 0, fontFamily: "'Outfit',sans-serif" }}>{ev.description}</p>
                    )}
                  </>
                )}
              </div>
              {!editingEvent && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button onClick={() => setEditingEvent(ev)} style={{
                    padding: '6px 14px', borderRadius: 50, border: '1.5px solid #E8D5C0',
                    background: 'white', color: '#7A6A5A', cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif", fontSize: 12,
                  }}>✏️</button>
                  <button onClick={() => deleteEvent(ev.id)} style={{
                    padding: '6px 14px', borderRadius: 50, border: '1.5px solid #FFC5C5',
                    background: '#FFF5F5', color: '#E87070', cursor: 'pointer', fontSize: 12,
                  }}>🗑</button>
                </div>
              )}
            </div>

            {/* Event photos */}
            <div style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>
                  {ev.photos.length} photo{ev.photos.length !== 1 ? 's' : ''}
                </span>
                <button
                  onClick={() => fileRefs.current[ev.id]?.click()}
                  disabled={uploadingFor === ev.id}
                  style={{
                    padding: '6px 16px', borderRadius: 50, border: `1.5px solid ${COLOR}`,
                    background: 'white', color: COLOR, cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 700,
                    opacity: uploadingFor === ev.id ? 0.6 : 1,
                  }}
                >
                  {uploadingFor === ev.id ? 'Uploading…' : '+ Add Photos'}
                </button>
                <input
                  ref={el => { fileRefs.current[ev.id] = el; }}
                  type="file" accept="image/*" multiple style={{ display: 'none' }}
                  onChange={async e => {
                    const files = Array.from(e.target.files ?? []);
                    for (const f of files) await uploadEventPhoto(ev.id, f);
                    e.target.value = '';
                  }}
                />
              </div>
              {ev.photos.length === 0 ? (
                <div style={{
                  border: '2px dashed #F0E4D0', borderRadius: 12, padding: '24px',
                  textAlign: 'center', color: '#C0B0A0', fontSize: 13, fontFamily: "'Outfit',sans-serif",
                }}>
                  No photos yet — click "+ Add Photos" to upload
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(120px,1fr))', gap: 8 }}>
                  {ev.photos.map(ph => (
                    <div key={ph.id} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ paddingBottom: '75%', position: 'relative', background: '#F5EDE0' }}>
                        <img src={ph.url} alt="" style={{
                          position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
                        }} />
                      </div>
                      <button
                        onClick={() => deleteEventPhoto(ev.id, ph.id)}
                        style={{
                          position: 'absolute', top: 5, right: 5,
                          width: 24, height: 24, borderRadius: '50%',
                          background: 'rgba(232,112,112,0.9)', color: 'white',
                          border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export default function PhotographerDashboard() {
  const { token } = useAuthStore();
  const [tab, setTab] = useState<Tab>('packages');

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'packages', label: 'Packages', icon: '📦' },
    { key: 'album',    label: 'Album',    icon: '📷' },
    { key: 'events',   label: 'Events',   icon: '🎊' },
  ];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, background: GRAD,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>📸</div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 22, color: '#2A1A1A', margin: 0 }}>
            Photography Dashboard
          </h1>
        </div>
        <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: '#9A8A7A', margin: 0 }}>
          Manage your packages, photo album, and events — all visible on your public profile page.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#F5EDE0', borderRadius: 14, padding: 4 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
            background: tab === t.key ? 'white' : 'transparent',
            color: tab === t.key ? '#2A1A1A' : '#9A8A7A',
            fontWeight: tab === t.key ? 700 : 500,
            fontSize: 13, cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
            boxShadow: tab === t.key ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            transition: 'all 0.15s',
          }}>
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {token && tab === 'packages' && <PackagesTab token={token} />}
      {token && tab === 'album'    && <AlbumTab token={token} />}
      {token && tab === 'events'   && <EventsTab token={token} />}
    </div>
  );
}
