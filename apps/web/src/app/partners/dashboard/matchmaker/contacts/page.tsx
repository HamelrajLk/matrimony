'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Status = 'NEW' | 'IN_PROGRESS' | 'REPLIED' | 'CLOSED';

interface Contact {
  id: number;
  profileId: number;
  requesterName: string;
  requesterEmail?: string;
  requesterPhone?: string;
  message: string;
  status: Status;
  createdAt: string;
  profile: {
    id: number;
    firstName: string;
    lastName: string;
    referenceCode: string;
    gender: string;
    dateOfBirth: string;
  };
}

function calcAge(dob: string) {
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const STATUS_STYLES: Record<Status, { label: string; color: string; bg: string; dot: string }> = {
  NEW:         { label: 'New',         color: '#dc2626', bg: '#fee2e2', dot: '#dc2626' },
  IN_PROGRESS: { label: 'In Progress', color: '#d97706', bg: '#fef3c7', dot: '#f59e0b' },
  REPLIED:     { label: 'Replied',     color: '#2563eb', bg: '#dbeafe', dot: '#3b82f6' },
  CLOSED:      { label: 'Closed',      color: '#6b7280', bg: '#f3f4f6', dot: '#9ca3af' },
};

const FILTER_TABS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'New', value: 'NEW' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Replied', value: 'REPLIED' },
  { label: 'Closed', value: 'CLOSED' },
];

export default function ContactRequestsInbox() {
  const { token } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    async function load() {
      try {
        const url = filter
          ? `${API}/api/matchmaker/contacts?status=${filter}`
          : `${API}/api/matchmaker/contacts`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const data = await res.json();
          setContacts(data.contacts ?? []);
        }
      } catch {
        toast.error('Failed to load contact requests');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token, filter]);

  async function updateStatus(id: number, status: Status) {
    try {
      const res = await fetch(`${API}/api/matchmaker/contacts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      setContacts(cs => cs.map(c => c.id === id ? { ...c, status } : c));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  }

  const counts = {
    NEW: contacts.filter(c => c.status === 'NEW').length,
    IN_PROGRESS: contacts.filter(c => c.status === 'IN_PROGRESS').length,
    REPLIED: contacts.filter(c => c.status === 'REPLIED').length,
    CLOSED: contacts.filter(c => c.status === 'CLOSED').length,
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <Link href="/partners/dashboard/matchmaker" style={{ fontSize: 12, color: '#9A8A7A', textDecoration: 'none', display: 'block', marginBottom: 4 }}>
            ← Back to Dashboard
          </Link>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 700, color: '#2A1A1A', margin: 0 }}>Contact Requests</h1>
        </div>
      </div>

      {/* Summary Bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div style={{ background: 'white', borderRadius: 12, padding: '12px 20px', border: '1px solid #F0E4D0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#dc2626', display: 'inline-block' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#2A1A1A' }}>New: {counts.NEW}</span>
        </div>
        <div style={{ background: 'white', borderRadius: 12, padding: '12px 20px', border: '1px solid #F0E4D0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#2A1A1A' }}>In Progress: {counts.IN_PROGRESS}</span>
        </div>
        <div style={{ background: 'white', borderRadius: 12, padding: '12px 20px', border: '1px solid #F0E4D0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#2A1A1A' }}>Replied: {counts.REPLIED}</span>
        </div>
        <div style={{ background: 'white', borderRadius: 12, padding: '12px 20px', border: '1px solid #F0E4D0', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#9ca3af', display: 'inline-block' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#2A1A1A' }}>Closed: {counts.CLOSED}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #F0E4D0', overflowX: 'auto' }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => { setFilter(tab.value); setLoading(true); }}
            style={{
              padding: '10px 20px',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: filter === tab.value ? 700 : 500,
              color: filter === tab.value ? '#E8735A' : '#7A6A5A',
              borderBottom: `2px solid ${filter === tab.value ? '#F4A435' : 'transparent'}`,
              marginBottom: -1, whiteSpace: 'nowrap',
            }}
          >
            {tab.label}
            {tab.value === 'NEW' && counts.NEW > 0 && (
              <span style={{ marginLeft: 6, background: '#ef4444', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{counts.NEW}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 60 }}>
          <p style={{ color: '#9A8A7A' }}>Loading requests...</p>
        </div>
      ) : contacts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, background: 'white', borderRadius: 20, border: '1px dashed #F0E4D0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📩</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", color: '#2A1A1A', marginBottom: 8 }}>No requests found</h3>
          <p style={{ color: '#9A8A7A', fontSize: 14 }}>Contact requests from your public profiles will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {contacts.map(contact => {
            const s = STATUS_STYLES[contact.status];
            const isExpanded = expanded === contact.id;
            return (
              <div
                key={contact.id}
                style={{ background: 'white', borderRadius: 16, border: `1px solid ${contact.status === 'NEW' ? '#fecaca' : '#F0E4D0'}`, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
              >
                {/* Card Header */}
                <div
                  style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 16 }}
                  onClick={() => setExpanded(isExpanded ? null : contact.id)}
                >
                  {/* Avatar */}
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg,#F4A435,#E8735A)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: 18, flexShrink: 0 }}>
                    {contact.requesterName[0]?.toUpperCase()}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#2A1A1A' }}>{contact.requesterName}</span>
                      <span style={{ fontSize: 11, padding: '2px 10px', borderRadius: 20, fontWeight: 700, color: s.color, background: s.bg }}>{s.label}</span>
                      <span style={{ fontSize: 11, color: '#9A8A7A', marginLeft: 'auto' }}>{timeAgo(contact.createdAt)}</span>
                    </div>

                    {/* Profile reference */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, color: '#9A8A7A' }}>Enquiry about:</span>
                      <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 600, color: '#7B8FE8', background: '#EEF2FF', padding: '1px 8px', borderRadius: 10 }}>{contact.profile.referenceCode}</span>
                      <span style={{ fontSize: 11, color: '#7A6A5A' }}>
                        {contact.profile.gender === 'FEMALE' ? '🌸' : '💙'} Age {calcAge(contact.profile.dateOfBirth)}
                      </span>
                    </div>

                    {/* Message preview */}
                    <p style={{ fontSize: 13, color: '#5A4A3A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isExpanded ? 'normal' : 'nowrap', maxWidth: '100%' }}>
                      {contact.message}
                    </p>
                  </div>

                  <div style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', color: '#9A8A7A', flexShrink: 0, marginTop: 4 }}>
                    ▾
                  </div>
                </div>

                {/* Expanded Detail */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #F0E4D0', padding: '16px 20px', background: '#FFFBF7' }}>
                    {/* Full message */}
                    <div style={{ marginBottom: 16 }}>
                      <p style={{ fontSize: 12, fontWeight: 600, color: '#5A4A3A', marginBottom: 6 }}>Message</p>
                      <p style={{ fontSize: 13, color: '#2A1A1A', background: 'white', padding: '12px 16px', borderRadius: 10, border: '1px solid #F0E4D0', margin: 0, lineHeight: 1.6 }}>
                        {contact.message}
                      </p>
                    </div>

                    {/* Contact Info */}
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 16 }}>
                      {contact.requesterEmail && (
                        <div>
                          <span style={{ fontSize: 11, color: '#9A8A7A', fontWeight: 600 }}>📧 Email</span>
                          <p style={{ fontSize: 13, color: '#2A1A1A', margin: 0 }}>{contact.requesterEmail}</p>
                        </div>
                      )}
                      {contact.requesterPhone && (
                        <div>
                          <span style={{ fontSize: 11, color: '#9A8A7A', fontWeight: 600 }}>📞 Phone</span>
                          <p style={{ fontSize: 13, color: '#2A1A1A', margin: 0 }}>{contact.requesterPhone}</p>
                        </div>
                      )}
                      <div>
                        <span style={{ fontSize: 11, color: '#9A8A7A', fontWeight: 600 }}>📅 Received</span>
                        <p style={{ fontSize: 13, color: '#2A1A1A', margin: 0 }}>{new Date(contact.createdAt).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {contact.requesterPhone && (
                        <>
                          <a
                            href={`tel:${contact.requesterPhone}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 20, background: '#dbeafe', color: '#1d4ed8', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
                          >
                            📞 Call
                          </a>
                          <a
                            href={`https://wa.me/${contact.requesterPhone.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '8px 14px', borderRadius: 20, background: '#dcfce7', color: '#15803d', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
                          >
                            💚 WhatsApp
                          </a>
                        </>
                      )}

                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                        {contact.status !== 'REPLIED' && (
                          <button
                            onClick={() => updateStatus(contact.id, 'REPLIED')}
                            style={{ padding: '8px 14px', borderRadius: 20, background: '#dbeafe', color: '#1d4ed8', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            ✅ Mark Replied
                          </button>
                        )}
                        {contact.status !== 'IN_PROGRESS' && contact.status !== 'REPLIED' && contact.status !== 'CLOSED' && (
                          <button
                            onClick={() => updateStatus(contact.id, 'IN_PROGRESS')}
                            style={{ padding: '8px 14px', borderRadius: 20, background: '#fef3c7', color: '#d97706', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            🔄 In Progress
                          </button>
                        )}
                        {contact.status !== 'CLOSED' && (
                          <button
                            onClick={() => updateStatus(contact.id, 'CLOSED')}
                            style={{ padding: '8px 14px', borderRadius: 20, background: '#f3f4f6', color: '#6b7280', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                          >
                            🗄️ Archive
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
