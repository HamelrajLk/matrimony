'use client';
import { use } from 'react';
import Link from 'next/link';

const SERVICE_INFO: Record<string, { label: string; icon: string; desc: string; color: string }> = {
  photographer:  { label: 'Photographer',  icon: '📸', desc: 'Upload your wedding photography portfolio, manage booking enquiries, and showcase your work to thousands of couples.', color: '#667eea' },
  videographer:  { label: 'Videographer',  icon: '🎬', desc: 'Manage your videography portfolio, packages, and booking enquiries.', color: '#7B8FE8' },
  venue:         { label: 'Venue',         icon: '🏛️', desc: 'Showcase your venue, availability calendar, and pricing.', color: '#4ABEAA' },
  catering:      { label: 'Catering',      icon: '🍽️', desc: 'Manage your catering menus, packages, and event bookings.', color: '#F4A435' },
  'makeup-artist': { label: 'Makeup Artist', icon: '💄', desc: 'Display your work, manage bookings, and grow your clientele.', color: '#E85AA3' },
  florist:       { label: 'Florist',       icon: '💐', desc: 'Showcase floral arrangements and manage event orders.', color: '#E8735A' },
  'dj-music':    { label: 'DJ / Music',    icon: '🎵', desc: 'Manage your setlists, packages, and event bookings.', color: '#A78BFA' },
  'cake-designer': { label: 'Cake Designer', icon: '🎂', desc: 'Display custom cake designs and manage orders.', color: '#F472B6' },
  transport:     { label: 'Transport',     icon: '🚗', desc: 'Manage your fleet, packages, and wedding day bookings.', color: '#34D399' },
  other:         { label: 'Other Services',icon: '✨', desc: 'Manage your wedding services and grow your business.', color: '#9A8A7A' },
};

interface Props { params: Promise<{ service: string }> }

export default function GenericServiceDashboard({ params }: Props) {
  const { service } = use(params);
  const info = SERVICE_INFO[service] ?? {
    label: service.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    icon: '✨', desc: 'Manage your services and bookings.', color: '#F4A435',
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center', paddingTop: 40 }}>

      {/* Icon */}
      <div style={{
        width: 80, height: 80, borderRadius: 24, margin: '0 auto 20px',
        background: `${info.color}18`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
        border: `2px solid ${info.color}28`,
      }}>
        {info.icon}
      </div>

      <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: '1.8rem', color: '#2A1A1A', margin: '0 0 12px' }}>
        {info.label} Dashboard
      </h1>
      <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, color: '#7A6A5A', maxWidth: 420, margin: '0 auto 36px', lineHeight: 1.75 }}>
        {info.desc}
      </p>

      {/* Coming soon card */}
      <div style={{
        background: 'white', borderRadius: 22, border: '1px dashed #F0E4D0',
        padding: '48px 40px', marginBottom: 28,
        boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: 16 }}>🚧</div>
        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1.2rem', color: '#2A1A1A', marginBottom: 10 }}>
          Coming Soon
        </div>
        <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, color: '#9A8A7A', maxWidth: 380, margin: '0 auto 24px', lineHeight: 1.7 }}>
          This dashboard section is under development. You can still update your business info and manage your profile in the meantime.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/partners/dashboard/settings" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 28px', borderRadius: 50,
            background: 'linear-gradient(135deg,#F4A435,#E8735A)',
            color: 'white', textDecoration: 'none',
            fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700,
            boxShadow: '0 4px 14px rgba(244,164,53,0.35)',
          }}>
            ✏️ Edit Business Info
          </Link>
          <Link href="/partners/dashboard" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 28px', borderRadius: 50,
            background: 'white', border: '1.5px solid #F0E4D0',
            color: '#7A6A5A', textDecoration: 'none',
            fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600,
          }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>

    </div>
  );
}
