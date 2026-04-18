'use client';
import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface Booking {
  id: number;
  serviceType: string;
  eventDate: string;
  eventLocation: string | null;
  guestCount: number | null;
  budget: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  user: {
    id: number;
    email: string;
    ownProfile: {
      firstName: string;
      lastName: string;
      photos: { imageUrl: string }[];
    } | null;
  };
}

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: '#FFF3E0', color: '#F4A435' },
  CONFIRMED: { bg: '#E8F8F5', color: '#2A9D8F' },
  CANCELLED: { bg: '#FFF0F0', color: '#E8735A' },
  COMPLETED: { bg: '#F0F4FF', color: '#7B8FE8' },
};

function serviceLabel(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export default function PartnerBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [total,    setTotal]    = useState(0);
  const [filter,   setFilter]   = useState('');

  const fetchBookings = useCallback(async (p: number, status: string) => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(p) });
      if (status) q.set('status', status);
      const r = await api.get(`/api/bookings/partner?${q}`);
      setBookings(r.data.bookings ?? []);
      setTotal(r.data.total ?? 0);
      setPages(r.data.pages ?? 1);
      setPage(p);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(1, filter); }, [fetchBookings, filter]);

  async function updateStatus(id: number, status: string) {
    try {
      await api.put(`/api/bookings/${id}/status`, { status });
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      toast.success(`Booking ${status.toLowerCase()}`);
    } catch { toast.error('Failed to update booking'); }
  }

  const FILTERS = ['', 'PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'];

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", padding: '28px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: '#2A1A1A', margin: '0 0 6px', fontWeight: 700 }}>
          📅 Booking Requests
        </h2>
        <p style={{ color: '#7A6A5A', fontSize: 14, margin: 0 }}>
          {total > 0 ? `${total} booking${total !== 1 ? 's' : ''}` : 'No bookings yet'}
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 16px', borderRadius: 50, fontSize: 11, fontWeight: 700,
            cursor: 'pointer', border: '1.5px solid', fontFamily: "'Outfit',sans-serif",
            background: filter === f ? 'linear-gradient(135deg,#F4A435,#E8735A)' : 'white',
            color: filter === f ? 'white' : '#5A4A3A',
            borderColor: filter === f ? 'transparent' : '#D0C0B0',
          }}>
            {f || 'All'}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} style={{ height: 90, background: 'white', borderRadius: 16, border: '1px solid #F0E4D0', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {!loading && bookings.length === 0 && (
        <div style={{ background: 'white', borderRadius: 20, border: '1px dashed #F0E4D0', padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>📭</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", color: '#2A1A1A', marginBottom: 6 }}>No bookings found</h3>
          <p style={{ color: '#7A6A5A', fontSize: 13 }}>{filter ? 'Try a different filter.' : 'Booking requests will appear here.'}</p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {bookings.map(b => {
          const st = STATUS_COLORS[b.status] ?? STATUS_COLORS.PENDING;
          const name = b.user.ownProfile
            ? `${b.user.ownProfile.firstName} ${b.user.ownProfile.lastName}`
            : b.user.email;
          const photo = b.user.ownProfile?.photos?.[0]?.imageUrl;

          return (
            <div key={b.id} style={{
              background: 'white', borderRadius: 16, border: '1px solid #F0E4D0',
              boxShadow: '0 4px 14px rgba(0,0,0,0.04)', padding: '18px 20px',
              display: 'flex', gap: 14, alignItems: 'flex-start',
            }}>
              {/* Avatar */}
              <div style={{
                width: 46, height: 46, borderRadius: 12, flexShrink: 0,
                background: photo ? 'transparent' : 'linear-gradient(135deg,#F4A435,#E8735A)',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {photo
                  ? <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: 'white', fontSize: '1.2rem' }}>👤</span>
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 3 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#2A1A1A' }}>{name}</div>
                    <div style={{ fontSize: 12, color: '#7A6A5A', marginTop: 1 }}>{serviceLabel(b.serviceType)}</div>
                  </div>
                  <span style={{ background: st.bg, color: st.color, borderRadius: 50, padding: '3px 10px', fontSize: 10, fontWeight: 700, flexShrink: 0 }}>
                    {b.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, fontSize: 12, color: '#7A6A5A', marginTop: 6 }}>
                  <span>📅 {new Date(b.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {b.eventLocation && <span>📍 {b.eventLocation}</span>}
                  {b.guestCount    && <span>👥 {b.guestCount} guests</span>}
                  {b.budget        && <span>💰 {b.budget}</span>}
                </div>

                {b.notes && (
                  <p style={{ fontSize: 12, color: '#9A8A7A', marginTop: 6, marginBottom: 0, lineHeight: 1.5 }}>📝 {b.notes}</p>
                )}
              </div>

              {/* Actions */}
              {b.status === 'PENDING' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => updateStatus(b.id, 'CONFIRMED')} style={{
                    background: '#E8F8F5', color: '#2A9D8F', border: '1.5px solid #2A9D8F33',
                    borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                  }}>✓ Confirm</button>
                  <button onClick={() => updateStatus(b.id, 'CANCELLED')} style={{
                    background: '#FFF0F0', color: '#E8735A', border: '1.5px solid #E8735A33',
                    borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700,
                    cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                  }}>✕ Decline</button>
                </div>
              )}
              {b.status === 'CONFIRMED' && (
                <button onClick={() => updateStatus(b.id, 'COMPLETED')} style={{
                  background: '#F0F4FF', color: '#7B8FE8', border: '1.5px solid #7B8FE833',
                  borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Outfit',sans-serif", flexShrink: 0,
                }}>✓ Complete</button>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {pages > 1 && !loading && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button onClick={() => fetchBookings(page - 1, filter)} disabled={page === 1}
            style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: 'white', color: '#5A4A3A', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', opacity: page === 1 ? 0.4 : 1, fontFamily: "'Outfit',sans-serif", fontSize: 13 }}>← Prev</button>
          <span style={{ padding: '7px 14px', color: '#7A6A5A', fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>{page}/{pages}</span>
          <button onClick={() => fetchBookings(page + 1, filter)} disabled={page === pages}
            style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: 'white', color: '#5A4A3A', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', opacity: page === pages ? 0.4 : 1, fontFamily: "'Outfit',sans-serif", fontSize: 13 }}>Next →</button>
        </div>
      )}
    </div>
  );
}
