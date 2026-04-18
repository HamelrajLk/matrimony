'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import AnimIn from '@/components/landing/ui/AnimIn';
import { getPartnerTypeInfo } from '@/lib/partners-data';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface PartnerDetail {
  id: number;
  businessName: string;
  businessEmail: string;
  contactPerson: string | null;
  bio: string | null;
  logoImage: string | null;
  bannerPath: string | null;
  website: string | null;
  yearsOfExperience: number | null;
  createdAt: string;
  types: { type: string }[];
  addresses: { address1?: string; address2?: string; city?: string; state?: string; countryCode: string }[];
  phones: { label: string; number: string }[];
  successStories: {
    id: number;
    coupleName: string;
    story: string | null;
    photoUrl: string | null;
    videoUrl: string | null;
    createdAt: string;
  }[];
}

function BookingModal({ partner, serviceType, color, gradient, onClose }: {
  partner: PartnerDetail; serviceType: string; color: string; gradient: string; onClose: () => void;
}) {
  const [form, setForm] = useState({ eventDate: '', eventLocation: '', guestCount: '', budget: '', notes: '' });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.eventDate) { toast.error('Please select an event date'); return; }
    setSaving(true);
    try {
      await api.post('/api/bookings', {
        partnerId: partner.id,
        serviceType,
        eventDate: form.eventDate,
        eventLocation: form.eventLocation || undefined,
        guestCount: form.guestCount ? Number(form.guestCount) : undefined,
        budget: form.budget || undefined,
        notes: form.notes || undefined,
      });
      toast.success('Booking request sent!');
      onClose();
    } catch {
      toast.error('Failed to send booking. Please try again.');
    } finally { setSaving(false); }
  }

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

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,26,26,0.55)',
      backdropFilter: 'blur(6px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 24, padding: '32px 28px',
        maxWidth: 500, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        maxHeight: '90vh', overflowY: 'auto',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#2A1A1A', margin: '0 0 4px' }}>
          📅 Book {partner.businessName}
        </h3>
        <p style={{ color: '#7A6A5A', fontSize: 13, margin: '0 0 22px', fontFamily: "'Outfit',sans-serif" }}>
          Service: {serviceType.replace(/_/g, ' ')}
        </p>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={lbl}>Event Date *</label>
            <input type="date" style={inp} required
              min={new Date().toISOString().split('T')[0]}
              value={form.eventDate}
              onChange={e => setForm(p => ({ ...p, eventDate: e.target.value }))} />
          </div>
          <div>
            <label style={lbl}>Event Location</label>
            <input type="text" placeholder="e.g. Colombo, Sri Lanka" style={inp}
              value={form.eventLocation}
              onChange={e => setForm(p => ({ ...p, eventLocation: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={lbl}>Guest Count</label>
              <input type="number" placeholder="e.g. 150" min={1} style={inp}
                value={form.guestCount}
                onChange={e => setForm(p => ({ ...p, guestCount: e.target.value }))} />
            </div>
            <div>
              <label style={lbl}>Budget</label>
              <input type="text" placeholder="e.g. LKR 200,000" style={inp}
                value={form.budget}
                onChange={e => setForm(p => ({ ...p, budget: e.target.value }))} />
            </div>
          </div>
          <div>
            <label style={lbl}>Additional Notes</label>
            <textarea placeholder="Any special requirements…" rows={3} style={{ ...inp, resize: 'vertical' }}
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '12px', borderRadius: 50,
              border: '1.5px solid #E8D5C0', background: 'transparent',
              color: '#7A6A5A', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 14,
            }}>Cancel</button>
            <button type="submit" disabled={saving} style={{
              flex: 2, padding: '12px', borderRadius: 50, border: 'none',
              background: gradient, color: 'white', fontWeight: 700, fontSize: 14,
              cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif",
              opacity: saving ? 0.7 : 1,
            }}>
              {saving ? 'Sending…' : '📅 Send Booking Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function youtubeEmbedUrl(url: string | null) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function ContactModal({ partner, color, onClose }: { partner: PartnerDetail; color: string; onClose: () => void }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(42,26,26,0.55)',
      backdropFilter: 'blur(6px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }} onClick={onClose}>
      <div style={{
        background: 'white', borderRadius: 24, padding: '36px 32px',
        maxWidth: 440, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: '#2A1A1A', margin: '0 0 6px' }}>
          Contact {partner.businessName}
        </h3>
        <p style={{ color: '#7A6A5A', fontSize: 14, margin: '0 0 24px', fontFamily: "'Outfit',sans-serif" }}>
          Reach out directly to this service provider.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {partner.businessEmail && (
            <a href={`mailto:${partner.businessEmail}`} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
              borderRadius: 14, border: `1.5px solid ${color}22`,
              background: `${color}08`, textDecoration: 'none', color: '#2A1A1A',
            }}>
              <span style={{ fontSize: '1.4rem' }}>✉️</span>
              <div>
                <div style={{ fontSize: 11, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{partner.businessEmail}</div>
              </div>
            </a>
          )}
          {partner.phones.map((ph, i) => (
            <a key={i} href={`tel:${ph.number}`} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
              borderRadius: 14, border: `1.5px solid ${color}22`,
              background: `${color}08`, textDecoration: 'none', color: '#2A1A1A',
            }}>
              <span style={{ fontSize: '1.4rem' }}>{ph.label === 'WhatsApp' ? '💬' : '📞'}</span>
              <div>
                <div style={{ fontSize: 11, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ph.label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{ph.number}</div>
              </div>
            </a>
          ))}
          {partner.website && (
            <a href={partner.website} target="_blank" rel="noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
              borderRadius: 14, border: `1.5px solid ${color}22`,
              background: `${color}08`, textDecoration: 'none', color: '#2A1A1A',
            }}>
              <span style={{ fontSize: '1.4rem' }}>🌐</span>
              <div>
                <div style={{ fontSize: 11, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Website</div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{partner.website}</div>
              </div>
            </a>
          )}
        </div>

        <button onClick={onClose} style={{
          marginTop: 22, width: '100%', padding: '12px', borderRadius: 50,
          border: '1.5px solid #E8D5C0', background: 'transparent',
          color: '#7A6A5A', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 14,
        }}>Close</button>
      </div>
    </div>
  );
}

export default function PartnerProfilePage() {
  const { type: rawType, id } = useParams<{ type: string; id: string }>();
  const type     = rawType.toUpperCase().replace(/-/g, '_');
  const typeInfo = getPartnerTypeInfo(type);
  const { isAuthenticated } = useAuthStore();

  const [partner,  setPartner]  = useState<PartnerDetail | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [activeStoryTab, setActiveStoryTab] = useState<'photo' | 'video'>('photo');

  useEffect(() => {
    fetch(`${API}/api/partners/${id}`)
      .then(r => {
        if (r.status === 404) { setNotFound(true); return null; }
        return r.json();
      })
      .then(d => { if (d) setPartner(d.partner); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const color    = typeInfo?.color    ?? '#E8735A';
  const gradient = typeInfo?.gradient ?? 'linear-gradient(135deg,#E8735A,#F4A435)';

  const location = partner?.addresses[0]
    ? [partner.addresses[0].city, partner.addresses[0].state, partner.addresses[0].countryCode].filter(Boolean).join(', ')
    : null;

  const photoStories = partner?.successStories.filter(s => s.photoUrl && !s.videoUrl) ?? [];
  const videoStories = partner?.successStories.filter(s => s.videoUrl) ?? [];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12, animation: 'pulse 1.5s ease-in-out infinite' }}>💍</div>
          <p style={{ color: '#7A6A5A', fontFamily: "'Outfit',sans-serif" }}>Loading profile…</p>
        </div>
      </div>
      <Footer />
    </div>
  );

  if (notFound || !partner) return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>😔</div>
          <h2 style={{ fontFamily: "'Playfair Display',serif", color: '#2A1A1A', marginBottom: 8 }}>Partner not found</h2>
          <Link href={`/partners/${rawType}`} style={{ color, fontFamily: "'Outfit',sans-serif" }}>
            ← Back to {typeInfo?.plural ?? 'Partners'}
          </Link>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7', fontFamily: "'Outfit',sans-serif" }}>
      <Navbar />

      {/* ── Banner ── */}
      <div style={{ paddingTop: 72 }}>
        <div style={{ position: 'relative', height: 280, overflow: 'hidden' }}>
          {partner.bannerPath ? (
            <img src={partner.bannerPath} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: gradient, backgroundSize: '200% 200%', animation: 'gradShift 10s ease infinite' }} />
          )}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(42,26,26,0.55))' }} />
        </div>

        {/* ── Profile header card ── */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 5%' }}>
          <div style={{
            background: 'white', borderRadius: 24,
            boxShadow: '0 8px 40px rgba(0,0,0,0.10)',
            border: '1px solid #F0E4D0',
            marginTop: -60, position: 'relative', zIndex: 2,
            padding: '24px 32px',
            display: 'flex', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap',
          }}>
            {/* Logo */}
            <div style={{
              width: 96, height: 96, borderRadius: 20, flexShrink: 0,
              background: partner.logoImage ? 'transparent' : gradient,
              border: '3px solid white', boxShadow: `0 4px 16px ${color}30`,
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: -52,
            }}>
              {partner.logoImage
                ? <img src={partner.logoImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: '2.2rem' }}>{typeInfo?.icon ?? '🤝'}</span>
              }
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 220 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.3rem,3vw,1.9rem)', fontWeight: 800, color: '#2A1A1A', margin: 0 }}>
                  {partner.businessName}
                </h1>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {partner.types.map(t => {
                  const ti = getPartnerTypeInfo(t.type);
                  return ti ? (
                    <span key={t.type} style={{
                      background: `${color}10`, color, borderRadius: 50,
                      padding: '3px 12px', fontSize: 11, fontWeight: 700,
                      border: `1px solid ${color}25`, fontFamily: "'Outfit',sans-serif",
                    }}>{ti.icon} {ti.label}</span>
                  ) : null;
                })}
                {location && (
                  <span style={{ color: '#9A8A7A', fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>📍 {location}</span>
                )}
                {partner.yearsOfExperience != null && (
                  <span style={{ color: '#9A8A7A', fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>
                    🗓️ {partner.yearsOfExperience}+ years experience
                  </span>
                )}
              </div>

              {partner.bio && (
                <p style={{ color: '#7A6A5A', fontSize: 14, lineHeight: 1.7, margin: 0, fontFamily: "'Outfit',sans-serif" }}>
                  {partner.bio}
                </p>
              )}
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
              {isAuthenticated && (
                <button
                  onClick={() => setShowBooking(true)}
                  style={{
                    background: gradient, color: 'white', border: 'none', borderRadius: 50,
                    padding: '12px 28px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap',
                    boxShadow: `0 6px 20px ${color}35`,
                  }}
                >📅 Book Now</button>
              )}
              <button
                onClick={() => setShowContact(true)}
                style={{
                  border: `1.5px solid ${color}`, color, borderRadius: 50, background: 'white',
                  padding: '10px 28px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap',
                }}
              >📞 Contact</button>
              {partner.website && (
                <a href={partner.website} target="_blank" rel="noreferrer" style={{
                  border: `1.5px solid #E8D5C0`, color: '#7A6A5A', borderRadius: 50,
                  padding: '10px 28px', fontWeight: 600, fontSize: 14, cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif", textDecoration: 'none', textAlign: 'center',
                }}>🌐 Website</a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 5% 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 28, alignItems: 'flex-start' }}>

          {/* ── Left column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* About */}
            {partner.bio && (
              <AnimIn>
                <div style={{ background: 'white', borderRadius: 20, padding: '28px 28px', border: '1px solid #F0E4D0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                  <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: '#2A1A1A', margin: '0 0 16px' }}>
                    About {partner.businessName}
                  </h2>
                  <div style={{ width: 40, height: 3, background: gradient, borderRadius: 4, marginBottom: 16 }} />
                  <p style={{ color: '#5A4A3A', fontSize: 14, lineHeight: 1.85, margin: 0, fontFamily: "'Outfit',sans-serif", whiteSpace: 'pre-line' }}>
                    {partner.bio}
                  </p>
                </div>
              </AnimIn>
            )}

            {/* Success Stories */}
            {partner.successStories.length > 0 && (
              <AnimIn delay={60}>
                <div style={{ background: 'white', borderRadius: 20, padding: '28px 28px', border: '1px solid #F0E4D0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                  <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: '#2A1A1A', margin: '0 0 6px' }}>
                    💑 Success Stories
                  </h2>
                  <div style={{ width: 40, height: 3, background: gradient, borderRadius: 4, marginBottom: 20 }} />

                  {/* Tabs */}
                  {videoStories.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                      {(['photo', 'video'] as const).map(tab => (
                        <button key={tab} onClick={() => setActiveStoryTab(tab)} style={{
                          padding: '7px 20px', borderRadius: 50, fontSize: 12, fontWeight: 700,
                          cursor: 'pointer', border: '1.5px solid',
                          fontFamily: "'Outfit',sans-serif",
                          background: activeStoryTab === tab ? gradient : 'white',
                          color: activeStoryTab === tab ? 'white' : '#5A4A3A',
                          borderColor: activeStoryTab === tab ? 'transparent' : '#D0C0B0',
                        }}>
                          {tab === 'photo' ? '📸 Photos' : '🎬 Videos'}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeStoryTab === 'photo' && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
                      {(videoStories.length > 0 ? photoStories : partner.successStories).map(s => (
                        <div key={s.id} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #F0E4D0', background: '#FFFBF7' }}>
                          {s.photoUrl && (
                            <div style={{ height: 160, overflow: 'hidden' }}>
                              <img src={s.photoUrl} alt={s.coupleName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          )}
                          <div style={{ padding: '14px 16px' }}>
                            <div style={{ fontWeight: 700, fontSize: 14, color: '#2A1A1A', fontFamily: "'Playfair Display',serif", marginBottom: 5 }}>
                              💍 {s.coupleName}
                            </div>
                            {s.story && (
                              <p style={{ fontSize: 12, color: '#7A6A5A', lineHeight: 1.6, margin: 0, fontFamily: "'Outfit',sans-serif",
                                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {s.story}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeStoryTab === 'video' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {videoStories.map(s => {
                        const embedUrl = youtubeEmbedUrl(s.videoUrl);
                        return (
                          <div key={s.id} style={{ borderRadius: 16, overflow: 'hidden', border: '1px solid #F0E4D0' }}>
                            {embedUrl && (
                              <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                                <iframe
                                  src={embedUrl}
                                  title={s.coupleName}
                                  style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                  allowFullScreen
                                />
                              </div>
                            )}
                            <div style={{ padding: '14px 16px', background: '#FFFBF7' }}>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#2A1A1A', fontFamily: "'Playfair Display',serif", marginBottom: 4 }}>
                                💍 {s.coupleName}
                              </div>
                              {s.story && (
                                <p style={{ fontSize: 12, color: '#7A6A5A', lineHeight: 1.6, margin: 0, fontFamily: "'Outfit',sans-serif" }}>{s.story}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </AnimIn>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Contact card */}
            <AnimIn delay={80}>
              <div style={{ background: 'white', borderRadius: 20, padding: '22px', border: '1px solid #F0E4D0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: '#2A1A1A', margin: '0 0 16px' }}>Contact Details</h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {partner.contactPerson && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.2rem' }}>👤</span>
                      <div>
                        <div style={{ fontSize: 10, color: '#9A8A7A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Outfit',sans-serif" }}>Contact Person</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#2A1A1A', fontFamily: "'Outfit',sans-serif" }}>{partner.contactPerson}</div>
                      </div>
                    </div>
                  )}
                  {partner.businessEmail && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.2rem' }}>✉️</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 10, color: '#9A8A7A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Outfit',sans-serif" }}>Email</div>
                        <a href={`mailto:${partner.businessEmail}`} style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "'Outfit',sans-serif", textDecoration: 'none', wordBreak: 'break-all' }}>{partner.businessEmail}</a>
                      </div>
                    </div>
                  )}
                  {partner.phones.map((ph, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.2rem' }}>{ph.label === 'WhatsApp' ? '💬' : '📞'}</span>
                      <div>
                        <div style={{ fontSize: 10, color: '#9A8A7A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Outfit',sans-serif" }}>{ph.label}</div>
                        <a href={`tel:${ph.number}`} style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "'Outfit',sans-serif", textDecoration: 'none' }}>{ph.number}</a>
                      </div>
                    </div>
                  ))}
                  {location && (
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <span style={{ fontSize: '1.2rem' }}>📍</span>
                      <div>
                        <div style={{ fontSize: 10, color: '#9A8A7A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Outfit',sans-serif" }}>Location</div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#2A1A1A', fontFamily: "'Outfit',sans-serif" }}>{location}</div>
                      </div>
                    </div>
                  )}
                  {partner.website && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.2rem' }}>🌐</span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 10, color: '#9A8A7A', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'Outfit',sans-serif" }}>Website</div>
                        <a href={partner.website} target="_blank" rel="noreferrer" style={{ fontSize: 13, fontWeight: 600, color, fontFamily: "'Outfit',sans-serif", textDecoration: 'none', wordBreak: 'break-all' }}>{partner.website}</a>
                      </div>
                    </div>
                  )}
                </div>

                {isAuthenticated && (
                  <button onClick={() => setShowBooking(true)} style={{
                    marginTop: 18, width: '100%', padding: '12px', borderRadius: 50,
                    background: gradient, color: 'white', border: 'none',
                    fontWeight: 700, fontSize: 14, cursor: 'pointer',
                    fontFamily: "'Outfit',sans-serif",
                    boxShadow: `0 4px 16px ${color}30`,
                  }}>📅 Book Now</button>
                )}
                <button onClick={() => setShowContact(true)} style={{
                  marginTop: isAuthenticated ? 8 : 18, width: '100%', padding: '12px', borderRadius: 50,
                  background: 'white', color, border: `1.5px solid ${color}`,
                  fontWeight: 700, fontSize: 14, cursor: 'pointer',
                  fontFamily: "'Outfit',sans-serif",
                }}>📞 Get in Touch</button>
              </div>
            </AnimIn>

            {/* Services offered */}
            {partner.types.length > 1 && (
              <AnimIn delay={100}>
                <div style={{ background: 'white', borderRadius: 20, padding: '22px', border: '1px solid #F0E4D0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                  <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 15, color: '#2A1A1A', margin: '0 0 14px' }}>Services Offered</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {partner.types.map(t => {
                      const ti = getPartnerTypeInfo(t.type);
                      return ti ? (
                        <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: '1.3rem' }}>{ti.icon}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#2A1A1A', fontFamily: "'Outfit',sans-serif" }}>{ti.label}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                </div>
              </AnimIn>
            )}

            {/* Stats */}
            <AnimIn delay={120}>
              <div style={{ background: 'white', borderRadius: 20, padding: '22px', border: '1px solid #F0E4D0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  {partner.yearsOfExperience != null && (
                    <div style={{ textAlign: 'center', padding: '12px', background: `${color}08`, borderRadius: 14 }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color, fontFamily: "'Playfair Display',serif" }}>{partner.yearsOfExperience}+</div>
                      <div style={{ fontSize: 11, color: '#7A6A5A', fontFamily: "'Outfit',sans-serif", marginTop: 2 }}>Years Exp.</div>
                    </div>
                  )}
                  {partner.successStories.length > 0 && (
                    <div style={{ textAlign: 'center', padding: '12px', background: `${color}08`, borderRadius: 14 }}>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color, fontFamily: "'Playfair Display',serif" }}>{partner.successStories.length}</div>
                      <div style={{ fontSize: 11, color: '#7A6A5A', fontFamily: "'Outfit',sans-serif", marginTop: 2 }}>Stories</div>
                    </div>
                  )}
                </div>
              </div>
            </AnimIn>

            {/* Back link */}
            <Link href={`/partners/${rawType}`} style={{
              display: 'flex', alignItems: 'center', gap: 6, color: '#7A6A5A',
              fontSize: 13, textDecoration: 'none', fontFamily: "'Outfit',sans-serif",
            }}>
              ← Back to all {typeInfo?.plural ?? 'Partners'}
            </Link>
          </div>
        </div>
      </div>

      {showContact && <ContactModal partner={partner} color={color} onClose={() => setShowContact(false)} />}
      {showBooking && (
        <BookingModal
          partner={partner}
          serviceType={type}
          color={color}
          gradient={gradient}
          onClose={() => setShowBooking(false)}
        />
      )}

      <Footer />
    </div>
  );
}
