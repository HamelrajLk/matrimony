'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

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
  NEW_MATCH:         '💞',
  PROFILE_VIEW:      '👁️',
  MESSAGE:           '💬',
  INTEREST_RECEIVED: '💌',
  BOOKING_REQUEST:   '📅',
  BOOKING_CONFIRMED: '✅',
  BOOKING_CANCELLED: '❌',
  SYSTEM:            '🔔',
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function PartnerNotificationsPage() {
  const router = useRouter();
  const [notifs,  setNotifs]  = useState<Notif[]>([]);
  const [loading, setLoading] = useState(true);
  const [page,    setPage]    = useState(1);
  const [pages,   setPages]   = useState(1);
  const [unread,  setUnread]  = useState(0);

  const fetchNotifs = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const r = await api.get(`/api/notifications?page=${p}`);
      setNotifs(r.data.notifications ?? []);
      setPages(r.data.pages ?? 1);
      setUnread(r.data.unreadCount ?? 0);
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

  return (
    <div style={{ fontFamily: "'Outfit',sans-serif", padding: '4px 0' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: '#2A1A1A', margin: '0 0 6px', fontWeight: 700 }}>
          🔔 Notifications
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <p style={{ color: '#7A6A5A', fontSize: 14, margin: 0 }}>
            {unread > 0 ? `${unread} unread` : 'All caught up!'}
          </p>
          {unread > 0 && (
            <button onClick={markAll} style={{ background: 'none', border: '1.5px solid #F4A435', color: '#F4A435', borderRadius: 50, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
              ✓ Mark all read
            </button>
          )}
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: 20, border: '1px solid #F0E4D0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        {loading && <div style={{ padding: 40, textAlign: 'center', color: '#9A8A7A', fontSize: 14 }}>Loading…</div>}

        {!loading && notifs.length === 0 && (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 10 }}>🔕</div>
            <h3 style={{ fontFamily: "'Playfair Display',serif", color: '#2A1A1A', marginBottom: 6 }}>No notifications yet</h3>
            <p style={{ color: '#7A6A5A', fontSize: 13 }}>You'll be notified about bookings and updates here.</p>
          </div>
        )}

        {!loading && notifs.map((n, i) => (
          <div key={n.id} onClick={() => handleClick(n)} style={{
            padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start',
            cursor: 'pointer', background: n.isRead ? 'white' : '#FFF8F0',
            borderBottom: i < notifs.length - 1 ? '1px solid #F5EDE0' : 'none',
            transition: 'background .15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#FFF3E0')}
          onMouseLeave={e => (e.currentTarget.style.background = n.isRead ? 'white' : '#FFF8F0')}
          >
            <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: n.isRead ? '#F5EDE0' : '#FFF3E0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>
              {NOTIF_ICONS[n.type] ?? '🔔'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ fontWeight: n.isRead ? 500 : 700, fontSize: 13, color: '#2A1A1A', marginBottom: 2 }}>{n.title}</div>
                <div style={{ fontSize: 10, color: '#9A8A7A', flexShrink: 0 }}>{timeAgo(n.createdAt)}</div>
              </div>
              <div style={{ fontSize: 12, color: '#7A6A5A', lineHeight: 1.5 }}>{n.body}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
              {!n.isRead && <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#E85AA3' }} />}
              <button onClick={(e) => handleDelete(n.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C5B9AF', fontSize: 16, padding: '2px 4px', borderRadius: 6 }}>×</button>
            </div>
          </div>
        ))}
      </div>

      {pages > 1 && !loading && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
          <button onClick={() => fetchNotifs(page - 1)} disabled={page === 1}
            style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: 'white', color: '#5A4A3A', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', opacity: page === 1 ? 0.4 : 1, fontFamily: "'Outfit',sans-serif", fontSize: 13 }}>← Prev</button>
          <span style={{ padding: '7px 14px', color: '#7A6A5A', fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>{page}/{pages}</span>
          <button onClick={() => fetchNotifs(page + 1)} disabled={page === pages}
            style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: 'white', color: '#5A4A3A', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', opacity: page === pages ? 0.4 : 1, fontFamily: "'Outfit',sans-serif", fontSize: 13 }}>Next →</button>
        </div>
      )}
    </div>
  );
}
