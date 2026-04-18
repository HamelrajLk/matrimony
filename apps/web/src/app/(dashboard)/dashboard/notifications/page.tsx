'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Notif {
  id: number;
  type: string;
  title: string;
  body: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

const NOTIF_ICONS: Record<string, string> = {
  NEW_MATCH:          '💞',
  PROFILE_VIEW:       '👁️',
  MESSAGE:            '💬',
  INTEREST_RECEIVED:  '💌',
  BOOKING_REQUEST:    '📅',
  BOOKING_CONFIRMED:  '✅',
  BOOKING_CANCELLED:  '❌',
  SYSTEM:             '🔔',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsPage() {
  const router   = useRouter();
  const { token } = useAuthStore();
  const [notifs,   setNotifs]   = useState<Notif[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [unread,   setUnread]   = useState(0);
  const [filter,   setFilter]   = useState<'all' | 'unread'>('all');

  const fetchNotifs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const r = await api.get(`/api/notifications?page=${p}`);
      const d = r.data;
      setNotifs(d.notifications ?? []);
      setPages(d.pages ?? 1);
      setUnread(d.unreadCount ?? 0);
      setPage(p);
    } catch { /* silent */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifs(1); }, [fetchNotifs]);

  async function markAll() {
    await api.post('/api/notifications/mark-all-read');
    setNotifs(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnread(0);
  }

  async function handleClick(n: Notif) {
    if (!n.isRead) {
      await api.post(`/api/notifications/${n.id}/read`);
      setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x));
      setUnread(u => Math.max(0, u - 1));
    }
    if (n.link) router.push(n.link);
  }

  async function handleDelete(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    await api.delete(`/api/notifications/${id}`);
    setNotifs(prev => prev.filter(n => n.id !== id));
  }

  const displayed = filter === 'unread' ? notifs.filter(n => !n.isRead) : notifs;

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7', fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '32px 5% 80px' }}>

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.5rem,3vw,2rem)', fontWeight: 800, color: '#2A1A1A', margin: '0 0 6px' }}>
            🔔 Notifications
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <p style={{ color: '#7A6A5A', fontSize: 14, margin: 0 }}>
              {unread > 0 ? `${unread} unread notification${unread !== 1 ? 's' : ''}` : 'All caught up!'}
            </p>
            {unread > 0 && (
              <button onClick={markAll} style={{
                background: 'none', border: '1.5px solid #F4A435', color: '#F4A435',
                borderRadius: 50, padding: '6px 18px', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: "'Outfit',sans-serif",
              }}>
                ✓ Mark all as read
              </button>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {(['all', 'unread'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '7px 20px', borderRadius: 50, fontSize: 12, fontWeight: 700,
              cursor: 'pointer', border: '1.5px solid', fontFamily: "'Outfit',sans-serif",
              background: filter === f ? 'linear-gradient(135deg,#F4A435,#E8735A)' : 'white',
              color: filter === f ? 'white' : '#5A4A3A',
              borderColor: filter === f ? 'transparent' : '#D0C0B0',
            }}>
              {f === 'all' ? 'All' : `Unread${unread > 0 ? ` (${unread})` : ''}`}
            </button>
          ))}
        </div>

        {/* List */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F0E4D0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
          {loading && (
            <div style={{ padding: '48px', textAlign: 'center', color: '#9A8A7A', fontSize: 14 }}>Loading…</div>
          )}

          {!loading && displayed.length === 0 && (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🔕</div>
              <h3 style={{ fontFamily: "'Playfair Display',serif", color: '#2A1A1A', marginBottom: 6 }}>
                {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              </h3>
              <p style={{ color: '#7A6A5A', fontSize: 14 }}>
                {filter === 'unread' ? "You're all caught up!" : "We'll notify you when something happens."}
              </p>
            </div>
          )}

          {!loading && displayed.map((n, i) => (
            <div
              key={n.id}
              onClick={() => handleClick(n)}
              style={{
                padding: '16px 20px',
                display: 'flex', gap: 14, alignItems: 'flex-start',
                cursor: 'pointer',
                background: n.isRead ? 'white' : '#FFF8F0',
                borderBottom: i < displayed.length - 1 ? '1px solid #F5EDE0' : 'none',
                transition: 'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#FFF3E0')}
              onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? 'white' : '#FFF8F0')}
            >
              {/* Icon */}
              <div style={{
                width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                background: n.isRead ? '#F5EDE0' : 'linear-gradient(135deg,#FFF3E0,#FFE4C8)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem',
              }}>
                {NOTIF_ICONS[n.type] ?? '🔔'}
              </div>

              {/* Text */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontWeight: n.isRead ? 500 : 700, fontSize: 14, color: '#2A1A1A', marginBottom: 3 }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: 11, color: '#9A8A7A', flexShrink: 0 }}>{timeAgo(n.createdAt)}</div>
                </div>
                <div style={{ fontSize: 13, color: '#7A6A5A', lineHeight: 1.55 }}>{n.body}</div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {!n.isRead && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#E85AA3' }} />}
                <button
                  onClick={(e) => handleDelete(n.id, e)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C5B9AF', fontSize: 16, padding: '2px 4px', borderRadius: 6 }}
                  title="Delete"
                >×</button>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {pages > 1 && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <button onClick={() => fetchNotifs(page - 1)} disabled={page === 1}
              style={{ padding: '8px 18px', borderRadius: 12, border: 'none', background: 'white', color: '#5A4A3A', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', opacity: page === 1 ? 0.4 : 1 }}>← Prev</button>
            <span style={{ padding: '8px 16px', color: '#7A6A5A', fontSize: 13 }}>Page {page} of {pages}</span>
            <button onClick={() => fetchNotifs(page + 1)} disabled={page === pages}
              style={{ padding: '8px 18px', borderRadius: 12, border: 'none', background: 'white', color: '#5A4A3A', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', opacity: page === pages ? 0.4 : 1 }}>Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
