'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

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
  partner: {
    id: number;
    businessName: string;
    logoImage: string | null;
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

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [total,    setTotal]    = useState(0);

  const fetchBookings = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const r = await api.get(`/api/bookings/mine?page=${p}`);
      setBookings(r.data.bookings ?? []);
      setTotal(r.data.total ?? 0);
      setPages(r.data.pages ?? 1);
      setPage(p);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBookings(1); }, [fetchBookings]);

  async function cancelBooking(id: number) {
    if (!confirm('Cancel this booking?')) return;
    await api.delete(`/api/bookings/${id}`);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'CANCELLED' } : b));
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '32px 5% 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, color: '#2A1A1A', margin: '0 0 6px' }}>
            📅 My Bookings
          </h1>
          <p style={{ color: '#7A6A5A', fontSize: 14, margin: 0 }}>
            {total > 0 ? `${total} booking${total !== 1 ? 's' : ''}` : 'No bookings yet'}
          </p>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ height: 100, background: 'white', borderRadius: 16, border: '1px solid #F0E4D0', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        )}

        {!loading && bookings.length === 0 && (
          <div style={{ background: 'white', borderRadius: 20, border: '1px dashed #F0E4D0', padding: '60px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>📅</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", color: '#2A1A1A', marginBottom: 8 }}>No bookings yet</h3>
            <p style={{ color: '#7A6A5A', fontSize: 14, marginBottom: 20 }}>Browse our partners and book wedding services.</p>
            <Link href="/partners" style={{
              display: 'inline-block', background: 'linear-gradient(135deg,#F4A435,#E8735A)',
              color: 'white', borderRadius: 50, padding: '12px 28px',
              fontWeight: 700, fontSize: 14, textDecoration: 'none', fontFamily: "'Outfit',sans-serif",
            }}>
              Browse Partners
            </Link>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {bookings.map(b => {
            const st = STATUS_COLORS[b.status] ?? STATUS_COLORS.PENDING;
            return (
              <div key={b.id} style={{
                background: 'white', borderRadius: 18, border: '1px solid #F0E4D0',
                boxShadow: '0 4px 16px rgba(0,0,0,0.04)', padding: '20px 22px',
                display: 'flex', gap: 16, alignItems: 'flex-start',
              }}>
                {/* Partner logo */}
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: b.partner.logoImage ? 'transparent' : 'linear-gradient(135deg,#F4A435,#E8735A)',
                  overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {b.partner.logoImage
                    ? <img src={b.partner.logoImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <span style={{ color: 'white', fontSize: '1.4rem' }}>🤝</span>
                  }
                </div>

                {/* Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#2A1A1A', fontFamily: "'Playfair Display',serif" }}>
                        {b.partner.businessName}
                      </div>
                      <div style={{ fontSize: 12, color: '#7A6A5A', marginTop: 2 }}>
                        {serviceLabel(b.serviceType)}
                      </div>
                    </div>
                    <span style={{
                      background: st.bg, color: st.color,
                      borderRadius: 50, padding: '3px 12px', fontSize: 11, fontWeight: 700,
                      fontFamily: "'Outfit',sans-serif", flexShrink: 0,
                    }}>{b.status}</span>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 12, color: '#7A6A5A', marginTop: 8 }}>
                    <span>📅 {new Date(b.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {b.eventLocation && <span>📍 {b.eventLocation}</span>}
                    {b.guestCount    && <span>👥 {b.guestCount} guests</span>}
                    {b.budget        && <span>💰 {b.budget}</span>}
                  </div>

                  {b.notes && (
                    <p style={{ fontSize: 12, color: '#9A8A7A', marginTop: 8, marginBottom: 0, lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      📝 {b.notes}
                    </p>
                  )}
                </div>

                {/* Cancel button */}
                {b.status === 'PENDING' && (
                  <button onClick={() => cancelBooking(b.id)} style={{
                    flexShrink: 0, background: 'none', border: '1.5px solid #F0E4D0',
                    borderRadius: 10, padding: '6px 14px', color: '#E8735A',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
                  }}>Cancel</button>
                )}
              </div>
            );
          })}
        </div>

        {/* Pagination */}
        {pages > 1 && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 28 }}>
            <button onClick={() => fetchBookings(page - 1)} disabled={page === 1}
              style={{ padding: '8px 18px', borderRadius: 12, border: 'none', background: 'white', color: '#5A4A3A', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', opacity: page === 1 ? 0.4 : 1, fontFamily: "'Outfit',sans-serif" }}>← Prev</button>
            <span style={{ padding: '8px 16px', color: '#7A6A5A', fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>Page {page} of {pages}</span>
            <button onClick={() => fetchBookings(page + 1)} disabled={page === pages}
              style={{ padding: '8px 18px', borderRadius: 12, border: 'none', background: 'white', color: '#5A4A3A', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', opacity: page === pages ? 0.4 : 1, fontFamily: "'Outfit',sans-serif" }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
