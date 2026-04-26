'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import AnimIn from '@/components/landing/ui/AnimIn';
import { getPartnerTypeInfo } from '@/lib/partners-data';

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
  addresses: { city?: string; state?: string; countryCode: string }[];
  phones: { label: string; number: string }[];
  successStories: { id: number; coupleName: string; story: string | null; photoUrl: string | null; videoUrl: string | null; createdAt: string }[];
}

interface GPhoto { id: number; url: string; caption: string | null; }
interface GEvent { id: number; name: string; description: string | null; eventDate: string; photos: GPhoto[]; }

interface PhotographyData {
  packages: { id: number; name: string; description: string | null; price: string; photoCount: number | null; durationHours: number | null }[];
  featuredPhotos: GPhoto[];
  events: GEvent[];
}

interface SvcPackage { id: number; name: string; description: string | null; price: string; capacity: number | null; discountPercent?: number | null; salePrice?: string | null; }
interface SvcProduct { id: number; name: string; description: string | null; actualPrice: string; imageUrl: string | null; discountPercent?: number | null; salePrice?: string | null; }
interface SvcData {
  packages: SvcPackage[];
  products: SvcProduct[];
  featuredPhotos: GPhoto[];
  events: GEvent[];
}

// ── Lightbox ────────────────────────────────────────────────────
function Lightbox({ photos, startIndex, onClose }: { photos: GPhoto[]; startIndex: number; onClose: () => void }) {
  const [idx, setIdx] = useState(startIndex);
  const prev = useCallback(() => setIdx(i => (i - 1 + photos.length) % photos.length), [photos.length]);
  const next = useCallback(() => setIdx(i => (i + 1) % photos.length), [photos.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, prev, next]);

  const photo = photos[idx];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(6,3,3,0.96)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 24, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 40, height: 40, borderRadius: '50%', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      <div style={{ position: 'absolute', top: 24, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.55)', fontSize: 12, fontFamily: "'Outfit',sans-serif" }}>{idx + 1} / {photos.length}</div>
      <button onClick={e => { e.stopPropagation(); prev(); }} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 50, height: 50, borderRadius: '50%', fontSize: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>‹</button>
      <img src={photo.url} alt={photo.caption ?? ''} style={{ maxWidth: 'min(90vw,1200px)', maxHeight: '88vh', objectFit: 'contain', borderRadius: 8, boxShadow: '0 32px 80px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()} />
      <button onClick={e => { e.stopPropagation(); next(); }} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 50, height: 50, borderRadius: '50%', fontSize: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>›</button>
      {photo.caption && (
        <div style={{ position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)', color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: "'Outfit',sans-serif", background: 'rgba(0,0,0,0.45)', padding: '6px 20px', borderRadius: 50, whiteSpace: 'nowrap', maxWidth: '80vw', overflow: 'hidden', textOverflow: 'ellipsis' }}>{photo.caption}</div>
      )}
    </div>
  );
}

// ── Gallery photo card — madushanvithana-style hover ────────────
function GalleryCard({ photo, onClick }: { photo: GPhoto; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: 'relative', overflow: 'hidden', cursor: 'pointer',
        breakInside: 'avoid', marginBottom: 6,
        background: '#e8e0d8',
      }}
    >
      <img
        src={photo.url}
        alt={photo.caption ?? ''}
        style={{
          width: '100%', display: 'block',
          transform: hov ? 'scale(1.05)' : 'scale(1)',
          transition: 'transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)',
        }}
      />
      {/* Full overlay — fades in */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(20,12,8,0.45)',
        opacity: hov ? 1 : 0,
        transition: 'opacity 0.4s ease',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 10,
      }}>
        {/* Expand circle */}
        <div style={{
          width: 48, height: 48, borderRadius: '50%',
          border: '1.5px solid rgba(255,255,255,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transform: hov ? 'scale(1)' : 'scale(0.6)',
          opacity: hov ? 1 : 0,
          transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.05s, opacity 0.3s ease 0.05s',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <path d="M7 3H3v4M11 3h4v4M7 15H3v-4M11 15h4v-4" />
          </svg>
        </div>
        {photo.caption && (
          <span style={{
            color: 'rgba(255,255,255,0.88)', fontSize: 11, fontFamily: "'Outfit',sans-serif",
            fontWeight: 500, letterSpacing: '0.04em', textAlign: 'center',
            padding: '0 16px', lineHeight: 1.5,
            transform: hov ? 'translateY(0)' : 'translateY(8px)',
            opacity: hov ? 1 : 0,
            transition: 'transform 0.35s ease 0.1s, opacity 0.35s ease 0.1s',
          }}>{photo.caption}</span>
        )}
      </div>
    </div>
  );
}

// ── Event card (madushanvithana-style) ──────────────────────────
function EventCard({ event, color, onClick }: { event: GEvent; color: string; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const firstPhoto = event.photos[0];
  const dateStr = new Date(event.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', aspectRatio: '3/4', background: firstPhoto ? 'transparent' : `${color}18`, boxShadow: hov ? `0 16px 40px rgba(0,0,0,0.22)` : '0 4px 16px rgba(0,0,0,0.1)', transition: 'box-shadow 0.35s ease, transform 0.35s ease', transform: hov ? 'translateY(-4px)' : 'translateY(0)' }}
    >
      {firstPhoto ? (
        <img src={firstPhoto.url} alt={event.name} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: hov ? 'scale(1.06)' : 'scale(1)', transition: 'transform 0.6s cubic-bezier(0.25,0.46,0.45,0.94)', display: 'block' }} />
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🎊</div>
      )}
      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,5,5,0.82) 0%, rgba(10,5,5,0.2) 50%, transparent 75%)' }} />
      {/* Photo count badge */}
      {event.photos.length > 1 && (
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', color: 'white', borderRadius: 50, padding: '4px 10px', fontSize: 11, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>
          📸 {event.photos.length}
        </div>
      )}
      {/* Text */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 18px' }}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 16, fontWeight: 700, color: 'white', margin: '0 0 5px', lineHeight: 1.3, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{event.name}</h3>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.72)', fontFamily: "'Outfit',sans-serif" }}>📅 {dateStr}</span>
        {event.description && (
          <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: "'Outfit',sans-serif", margin: '5px 0 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{event.description}</p>
        )}
      </div>
    </div>
  );
}

// ── Event lightbox modal (shows all event photos) ───────────────
function EventModal({ event, color, onClose }: { event: GEvent; color: string; onClose: () => void }) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(10,5,5,0.72)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 20px', overflowY: 'auto' }} onClick={onClose}>
      <div style={{ background: '#1a0e0a', borderRadius: 24, width: '100%', maxWidth: 1000, overflow: 'hidden', boxShadow: '0 32px 80px rgba(0,0,0,0.5)' }} onClick={e => e.stopPropagation()}>
        {/* Header with first photo */}
        {event.photos[0] && (
          <div style={{ position: 'relative', height: 280 }}>
            <img src={event.photos[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(26,14,10,0.9) 0%, transparent 60%)' }} />
            <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: '50%', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
            <div style={{ position: 'absolute', bottom: 20, left: 24 }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: 'white', margin: '0 0 4px' }}>{event.name}</h2>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: "'Outfit',sans-serif" }}>📅 {new Date(event.eventDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} · {event.photos.length} photos</span>
            </div>
          </div>
        )}
        {/* Grid */}
        <div style={{ padding: '20px', columns: '3 140px', columnGap: 8 }}>
          {event.photos.map((ph, i) => (
            <GalleryCard key={ph.id} photo={ph} onClick={() => setLightbox(i)} />
          ))}
        </div>
      </div>
      {lightbox !== null && <Lightbox photos={event.photos} startIndex={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

// ── Price display ───────────────────────────────────────────────
function PriceTag({ price, actualPrice, discountPercent, salePrice, color }: { price?: string | null; actualPrice?: string | null; discountPercent?: number | null; salePrice?: string | null; color: string }) {
  const base = Number(price ?? actualPrice ?? 0);
  const disc = discountPercent;
  if (disc && disc > 0) {
    const final = Math.round(base * (1 - disc / 100));
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 800, fontSize: 16, color, fontFamily: "'Outfit',sans-serif" }}>LKR {final.toLocaleString()}</span>
        <span style={{ fontSize: 12, color: '#9A8A7A', textDecoration: 'line-through', fontFamily: "'Outfit',sans-serif" }}>LKR {base.toLocaleString()}</span>
        <span style={{ fontSize: 10, background: '#4ABEAA15', color: '#4ABEAA', fontWeight: 700, borderRadius: 20, padding: '2px 7px', fontFamily: "'Outfit',sans-serif" }}>{disc}% off</span>
      </div>
    );
  }
  const sale = salePrice != null ? Number(salePrice) : null;
  if (sale != null && sale > 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontWeight: 800, fontSize: 16, color, fontFamily: "'Outfit',sans-serif" }}>LKR {sale.toLocaleString()}</span>
        <span style={{ fontSize: 12, color: '#9A8A7A', textDecoration: 'line-through', fontFamily: "'Outfit',sans-serif" }}>LKR {base.toLocaleString()}</span>
      </div>
    );
  }
  return <span style={{ fontWeight: 800, fontSize: 16, color, fontFamily: "'Outfit',sans-serif" }}>LKR {base.toLocaleString()}</span>;
}

// ── Photography sections (left col) ────────────────────────────
function PhotographyMain({ partnerId, rawType, partnerIdStr, color, gradient }: {
  partnerId: number; rawType: string; partnerIdStr: string; color: string; gradient: string;
}) {
  // Fetch album photos (all, not just featured) + packages/events from public
  const [albumPhotos,  setAlbumPhotos]  = useState<GPhoto[]>([]);
  const [totalPhotos,  setTotalPhotos]  = useState(0);
  const [events,       setEvents]       = useState<GEvent[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [lightbox,     setLightbox]     = useState<{ photos: GPhoto[]; idx: number } | null>(null);
  const [activeEvent,  setActiveEvent]  = useState<GEvent | null>(null);
  const PREVIEW = 20;

  useEffect(() => {
    // Fetch first page of ALL album photos (not just featured)
    setLoadingPhotos(true);
    fetch(`${API}/api/photographer/${partnerId}/album?page=1&limit=${PREVIEW}`)
      .then(r => r.json())
      .then(d => { setAlbumPhotos(d.photos ?? []); setTotalPhotos(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoadingPhotos(false));

    // Fetch events from public profile
    fetch(`${API}/api/photographer/${partnerId}/public`)
      .then(r => r.json())
      .then(d => setEvents(d.events ?? []))
      .catch(() => {});
  }, [partnerId]);

  return (
    <>
      {/* Portfolio */}
      <AnimIn>
        <section style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 800, color: '#1a0e0a', margin: 0, letterSpacing: '-0.01em' }}>Portfolio</h2>
              <div style={{ width: 48, height: 2, background: gradient, borderRadius: 4, marginTop: 10 }} />
            </div>
            <Link href={`/partners/${rawType}/${partnerIdStr}/portfolio`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7, color: '#1a0e0a', fontSize: 12,
              fontWeight: 600, fontFamily: "'Outfit',sans-serif", textDecoration: 'none',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              borderBottom: '1px solid #1a0e0a', paddingBottom: 2,
              transition: 'opacity 0.2s',
            }}>View All {totalPhotos > 0 ? `(${totalPhotos})` : ''}</Link>
          </div>

          {loadingPhotos ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ aspectRatio: '1', background: '#e8e0d8', borderRadius: 2, animation: 'pulse 1.5s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          ) : albumPhotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#f5f0eb', borderRadius: 12 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📷</div>
              <p style={{ color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontSize: 14, margin: 0 }}>No photos uploaded yet.</p>
            </div>
          ) : (
            <>
              {/* Masonry grid — 3 columns, variable height, no rounded corners (madushanvithana style) */}
              <div style={{ columns: '3 160px', columnGap: 6 }}>
                {albumPhotos.map((ph, i) => (
                  <GalleryCard key={ph.id} photo={ph} onClick={() => setLightbox({ photos: albumPhotos, idx: i })} />
                ))}
              </div>

              {/* View More button */}
              <div style={{ marginTop: 28, textAlign: 'center' }}>
                <Link href={`/partners/${rawType}/${partnerIdStr}/portfolio`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10,
                  color: '#1a0e0a', fontSize: 12, fontWeight: 700,
                  fontFamily: "'Outfit',sans-serif", textDecoration: 'none',
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  border: '1px solid #1a0e0a', borderRadius: 50,
                  padding: '11px 32px',
                  transition: 'background 0.2s, color 0.2s',
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#1a0e0a'; (e.currentTarget as HTMLAnchorElement).style.color = 'white'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = '#1a0e0a'; }}
                >
                  VIEW MORE PHOTOS
                  {totalPhotos > PREVIEW && <span style={{ opacity: 0.55, fontWeight: 400 }}>({totalPhotos - albumPhotos.length} more)</span>}
                </Link>
              </div>
            </>
          )}
        </section>
      </AnimIn>

      {/* Special Events */}
      {events.length > 0 && (
        <AnimIn delay={80}>
          <section style={{ marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 800, color: '#1a0e0a', margin: '0 0 10px', letterSpacing: '-0.01em' }}>Featured Weddings</h2>
            <div style={{ width: 48, height: 2, background: gradient, borderRadius: 4, marginBottom: 24 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
              {events.map(ev => (
                <EventCard key={ev.id} event={ev} color={color} onClick={() => setActiveEvent(ev)} />
              ))}
            </div>
          </section>
        </AnimIn>
      )}

      {lightbox && <Lightbox photos={lightbox.photos} startIndex={lightbox.idx} onClose={() => setLightbox(null)} />}
      {activeEvent && <EventModal event={activeEvent} color={color} onClose={() => setActiveEvent(null)} />}
    </>
  );
}

// ── Service sections (left col, for non-photographer) ────────────
function ServiceMain({ partnerId, rawType, partnerIdStr, color, gradient, serviceType, menuMode, venueMode }: {
  partnerId: number; rawType: string; partnerIdStr: string; color: string; gradient: string; serviceType: string; menuMode: boolean; venueMode: boolean;
}) {
  const [albumPhotos,  setAlbumPhotos]  = useState<GPhoto[]>([]);
  const [totalPhotos,  setTotalPhotos]  = useState(0);
  const [events,       setEvents]       = useState<GEvent[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [lightbox,     setLightbox]     = useState<{ photos: GPhoto[]; idx: number } | null>(null);
  const [activeEvent,  setActiveEvent]  = useState<GEvent | null>(null);
  const [selectedMenu, setSelectedMenu] = useState<SvcPackage | null>(null);
  const PREVIEW = 20;

  useEffect(() => {
    setLoadingPhotos(true);
    fetch(`${API}/api/partner-content/${partnerId}/album?serviceType=${encodeURIComponent(serviceType)}&page=1&limit=${PREVIEW}`)
      .then(r => r.json())
      .then(d => { setAlbumPhotos(d.photos ?? []); setTotalPhotos(d.total ?? 0); })
      .catch(() => {})
      .finally(() => setLoadingPhotos(false));

    fetch(`${API}/api/partner-content/${partnerId}/public?serviceType=${encodeURIComponent(serviceType)}`)
      .then(r => r.json())
      .then(d => setEvents(d.events ?? []))
      .catch(() => {});
  }, [partnerId, serviceType]);

  return (
    <>
      {/* Portfolio */}
      <AnimIn>
        <section style={{ marginBottom: 56 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 800, color: '#1a0e0a', margin: 0, letterSpacing: '-0.01em' }}>Portfolio</h2>
              <div style={{ width: 48, height: 2, background: gradient, borderRadius: 4, marginTop: 10 }} />
            </div>
            {totalPhotos > PREVIEW && (
              <Link href={`/partners/${rawType}/${partnerIdStr}/portfolio`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: '#1a0e0a', fontSize: 12, fontWeight: 600, fontFamily: "'Outfit',sans-serif", textDecoration: 'none', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid #1a0e0a', paddingBottom: 2 }}>
                View All ({totalPhotos})
              </Link>
            )}
          </div>

          {loadingPhotos ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
              {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ aspectRatio: '1', background: '#e8e0d8' }} />)}
            </div>
          ) : albumPhotos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#f5f0eb', borderRadius: 12 }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🖼️</div>
              <p style={{ color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontSize: 14, margin: 0 }}>No photos uploaded yet.</p>
            </div>
          ) : (
            <>
              <div style={{ columns: '3 160px', columnGap: 6 }}>
                {albumPhotos.map((ph, i) => (
                  <GalleryCard key={`${ph.id}-${i}`} photo={ph} onClick={() => setLightbox({ photos: albumPhotos, idx: i })} />
                ))}
              </div>
              {totalPhotos > PREVIEW && (
                <div style={{ marginTop: 28, textAlign: 'center' }}>
                  <Link href={`/partners/${rawType}/${partnerIdStr}/portfolio`} style={{ display: 'inline-flex', alignItems: 'center', gap: 10, color: '#1a0e0a', fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif", textDecoration: 'none', letterSpacing: '0.12em', textTransform: 'uppercase', border: '1px solid #1a0e0a', borderRadius: 50, padding: '11px 32px' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#1a0e0a'; (e.currentTarget as HTMLAnchorElement).style.color = 'white'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; (e.currentTarget as HTMLAnchorElement).style.color = '#1a0e0a'; }}
                  >VIEW MORE PHOTOS</Link>
                </div>
              )}
            </>
          )}
        </section>
      </AnimIn>

      {events.length > 0 && (
        <AnimIn delay={80}>
          <section style={{ marginBottom: 56 }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26, fontWeight: 800, color: '#1a0e0a', margin: '0 0 10px', letterSpacing: '-0.01em' }}>Events</h2>
            <div style={{ width: 48, height: 2, background: gradient, borderRadius: 4, marginBottom: 24 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
              {events.map(ev => (
                <EventCard key={ev.id} event={ev} color={color} onClick={() => setActiveEvent(ev)} />
              ))}
            </div>
          </section>
        </AnimIn>
      )}

      {lightbox && <Lightbox photos={lightbox.photos} startIndex={lightbox.idx} onClose={() => setLightbox(null)} />}
      {activeEvent && <EventModal event={activeEvent} color={color} onClose={() => setActiveEvent(null)} />}
      {selectedMenu && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,26,26,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setSelectedMenu(null)}>
          <div style={{ background: '#FFFBF7', borderRadius: 24, padding: '36px 32px', maxWidth: 520, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: '#2A1A1A', margin: '0 0 8px' }}>🍽️ {selectedMenu.name}</h3>
            <div style={{ display: 'inline-block', background: gradient, borderRadius: 50, padding: '5px 18px', marginBottom: 16 }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 15, fontFamily: "'Outfit',sans-serif" }}>LKR {Number(selectedMenu.price).toLocaleString()} / per head</span>
            </div>
            <div style={{ width: 40, height: 3, background: gradient, borderRadius: 4, marginBottom: 16 }} />
            {selectedMenu.description
              ? <p style={{ color: '#5A4A3A', fontSize: 14, lineHeight: 1.85, margin: 0, fontFamily: "'Outfit',sans-serif", whiteSpace: 'pre-line' }}>{selectedMenu.description}</p>
              : <p style={{ color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontSize: 14, margin: 0 }}>No description provided.</p>
            }
            <button onClick={() => setSelectedMenu(null)} style={{ marginTop: 28, width: '100%', padding: '12px', borderRadius: 50, border: `1.5px solid ${color}`, background: 'transparent', color, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}

// ── Packages sidebar ────────────────────────────────────────────
function PackagesSidebar({ partnerId, serviceType, isPhotographer, color, gradient, menuMode, venueMode, onMenuClick }: {
  partnerId: number; serviceType: string; isPhotographer: boolean; color: string; gradient: string;
  menuMode: boolean; venueMode: boolean; onMenuClick?: (pkg: SvcPackage) => void;
}) {
  const [phPkgs, setPhPkgs] = useState<PhotographyData['packages']>([]);
  const [svcPkgs, setSvcPkgs] = useState<SvcPackage[]>([]);
  const [svcProds, setSvcProds] = useState<SvcProduct[]>([]);

  useEffect(() => {
    if (isPhotographer) {
      fetch(`${API}/api/photographer/${partnerId}/public`).then(r => r.json()).then(d => setPhPkgs(d.packages ?? [])).catch(() => {});
    } else {
      fetch(`${API}/api/partner-content/${partnerId}/public?serviceType=${encodeURIComponent(serviceType)}`).then(r => r.json()).then(d => { setSvcPkgs(d.packages ?? []); setSvcProds(d.products ?? []); }).catch(() => {});
    }
  }, [partnerId, serviceType, isPhotographer]);

  const hasContent = isPhotographer ? phPkgs.length > 0 : (svcPkgs.length > 0 || svcProds.length > 0);
  if (!hasContent) return null;

  return (
    <div style={{ background: 'white', borderRadius: 20, padding: '22px', border: '1px solid #F0E4D0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
      <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, color: '#2A1A1A', margin: '0 0 6px' }}>
        {menuMode ? '🍽️ Menu' : venueMode ? '🏛️ Halls & Spaces' : '📦 Packages'}
      </h3>
      <div style={{ width: 36, height: 3, background: gradient, borderRadius: 4, marginBottom: 18 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Photographer packages */}
        {isPhotographer && phPkgs.map(pkg => (
          <div key={pkg.id} style={{ borderRadius: 14, border: `1.5px solid ${color}20`, background: `${color}05`, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 14, color: '#2A1A1A', lineHeight: 1.3 }}>{pkg.name}</span>
              <span style={{ fontWeight: 800, fontSize: 15, color, fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap' }}>LKR {Number(pkg.price).toLocaleString()}</span>
            </div>
            {pkg.description && <p style={{ color: '#7A6A5A', fontSize: 12, lineHeight: 1.6, margin: '0 0 8px', fontFamily: "'Outfit',sans-serif" }}>{pkg.description}</p>}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {pkg.photoCount != null && <span style={{ fontSize: 10, fontWeight: 600, color, background: `${color}10`, padding: '2px 10px', borderRadius: 50, fontFamily: "'Outfit',sans-serif" }}>📸 {pkg.photoCount} photos</span>}
              {pkg.durationHours != null && <span style={{ fontSize: 10, fontWeight: 600, color, background: `${color}10`, padding: '2px 10px', borderRadius: 50, fontFamily: "'Outfit',sans-serif" }}>⏱ {pkg.durationHours}h</span>}
            </div>
          </div>
        ))}

        {/* Catering menus */}
        {menuMode && svcPkgs.map(pkg => (
          <button key={pkg.id} onClick={() => onMenuClick?.(pkg)} style={{ borderRadius: 14, border: `1.5px solid ${color}20`, background: `${color}05`, padding: '14px 16px', textAlign: 'left', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 14, color: '#2A1A1A' }}>{pkg.name}</span>
            <span style={{ fontWeight: 700, fontSize: 13, color, fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap' }}>LKR {Number(pkg.price).toLocaleString()}/head</span>
          </button>
        ))}

        {/* Venue halls */}
        {venueMode && svcPkgs.map(pkg => (
          <div key={pkg.id} style={{ borderRadius: 14, border: `1.5px solid ${color}20`, background: `${color}05`, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 14, color: '#2A1A1A' }}>{pkg.name}</span>
              <span style={{ fontWeight: 800, fontSize: 14, color, fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap' }}>LKR {Number(pkg.price).toLocaleString()}</span>
            </div>
            {pkg.capacity != null && <span style={{ fontSize: 11, color: '#7A6A5A', fontFamily: "'Outfit',sans-serif" }}>👥 Up to {pkg.capacity.toLocaleString()} guests</span>}
            {pkg.description && <p style={{ color: '#7A6A5A', fontSize: 12, lineHeight: 1.6, margin: '6px 0 0', fontFamily: "'Outfit',sans-serif" }}>{pkg.description}</p>}
          </div>
        ))}

        {/* Standard packages */}
        {!menuMode && !venueMode && !isPhotographer && svcPkgs.map(pkg => (
          <div key={pkg.id} style={{ borderRadius: 14, border: `1.5px solid ${color}20`, background: `${color}05`, padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 14, color: '#2A1A1A' }}>{pkg.name}</span>
              <PriceTag price={pkg.price} discountPercent={pkg.discountPercent} salePrice={pkg.salePrice} color={color} />
            </div>
            {pkg.description && <p style={{ color: '#7A6A5A', fontSize: 12, lineHeight: 1.6, margin: 0, fontFamily: "'Outfit',sans-serif" }}>{pkg.description}</p>}
          </div>
        ))}

        {/* Products */}
        {svcProds.map(prod => (
          <div key={prod.id} style={{ borderRadius: 14, border: `1.5px solid ${color}20`, overflow: 'hidden', background: 'white' }}>
            {prod.imageUrl && <div style={{ height: 120, overflow: 'hidden' }}><img src={prod.imageUrl} alt={prod.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
            <div style={{ padding: '12px 14px' }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: 13, color: '#2A1A1A', marginBottom: 4 }}>{prod.name}</div>
              <PriceTag actualPrice={prod.actualPrice} discountPercent={prod.discountPercent} salePrice={prod.salePrice} color={color} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Contact modal ───────────────────────────────────────────────
function ContactModal({ partner, color, onClose }: { partner: PartnerDetail; color: string; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,26,26,0.55)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={onClose}>
      <div style={{ background: 'white', borderRadius: 24, padding: '36px 32px', maxWidth: 440, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: '#2A1A1A', margin: '0 0 6px' }}>Contact {partner.businessName}</h3>
        <p style={{ color: '#7A6A5A', fontSize: 14, margin: '0 0 24px', fontFamily: "'Outfit',sans-serif" }}>Reach out directly to this service provider.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {partner.businessEmail && (
            <a href={`mailto:${partner.businessEmail}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${color}22`, background: `${color}08`, textDecoration: 'none', color: '#2A1A1A' }}>
              <span style={{ fontSize: '1.4rem' }}>✉️</span>
              <div><div style={{ fontSize: 10, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Email</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{partner.businessEmail}</div></div>
            </a>
          )}
          {partner.phones.map((ph, i) => (
            <a key={i} href={`tel:${ph.number}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${color}22`, background: `${color}08`, textDecoration: 'none', color: '#2A1A1A' }}>
              <span style={{ fontSize: '1.4rem' }}>{ph.label === 'WhatsApp' ? '💬' : '📞'}</span>
              <div><div style={{ fontSize: 10, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{ph.label}</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{ph.number}</div></div>
            </a>
          ))}
          {partner.website && (
            <a href={partner.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderRadius: 14, border: `1.5px solid ${color}22`, background: `${color}08`, textDecoration: 'none', color: '#2A1A1A' }}>
              <span style={{ fontSize: '1.4rem' }}>🌐</span>
              <div><div style={{ fontSize: 10, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Website</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{partner.website}</div></div>
            </a>
          )}
        </div>
        <button onClick={onClose} style={{ marginTop: 22, width: '100%', padding: '12px', borderRadius: 50, border: '1.5px solid #E8D5C0', background: 'transparent', color: '#7A6A5A', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 14 }}>Close</button>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────
export default function PartnerProfilePage() {
  const { type: rawType, id } = useParams<{ type: string; id: string }>();
  const type     = rawType.toUpperCase().replace(/-/g, '_');
  const typeInfo = getPartnerTypeInfo(type);
  const isPhotographer   = type === 'PHOTOGRAPHER';
  const isServiceContent = !isPhotographer && type !== 'MATCHMAKER';
  const isCatering       = type === 'CATERING';
  const isVenue          = type === 'VENUE';

  const [partner,      setPartner]      = useState<PartnerDetail | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [notFound,     setNotFound]     = useState(false);
  const [showContact,  setShowContact]  = useState(false);
  const [menuDetail,   setMenuDetail]   = useState<SvcPackage | null>(null);

  useEffect(() => {
    fetch(`${API}/api/partners/${id}`)
      .then(r => { if (r.status === 404) { setNotFound(true); return null; } return r.json(); })
      .then(d => { if (d) setPartner(d.partner); })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  const color    = typeInfo?.color    ?? '#E8735A';
  const gradient = typeInfo?.gradient ?? 'linear-gradient(135deg,#E8735A,#F4A435)';
  const location = partner?.addresses[0]
    ? [partner.addresses[0].city, partner.addresses[0].state, partner.addresses[0].countryCode].filter(Boolean).join(', ')
    : null;
  const otherServices = partner?.types.filter(t => t.type !== type) ?? [];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 56, marginBottom: 12 }}>📷</div><p style={{ color: '#7A6A5A', fontFamily: "'Outfit',sans-serif" }}>Loading profile…</p></div>
      </div>
      <Footer />
    </div>
  );

  if (notFound || !partner) return (
    <div style={{ minHeight: '100vh', background: '#FFFBF7' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '70vh' }}>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 64, marginBottom: 16 }}>😔</div><h2 style={{ fontFamily: "'Playfair Display',serif", color: '#2A1A1A', marginBottom: 8 }}>Partner not found</h2><Link href={`/partners/${rawType}`} style={{ color, fontFamily: "'Outfit',sans-serif" }}>← Back to {typeInfo?.plural ?? 'Partners'}</Link></div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F8F4F0', fontFamily: "'Outfit',sans-serif" }}>
      <Navbar />
      <div style={{ paddingTop: 72 }}>

        {/* ── Contained banner ── */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 5% 0' }}>
          <div style={{ position: 'relative', height: 'clamp(240px,35vw,420px)', borderRadius: 24, overflow: 'hidden' }}>
            {partner.bannerPath
              ? <img src={partner.bannerPath} alt="Banner" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
              : <div style={{ width: '100%', height: '100%', background: gradient, backgroundSize: '200% 200%', animation: 'gradShift 10s ease infinite' }} />
            }
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, rgba(10,5,5,0.52) 80%, rgba(10,5,5,0.72) 100%)' }} />
            {/* Service chip */}
            <div style={{ position: 'absolute', top: 18, left: 20 }}>
              <span style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', borderRadius: 50, padding: '5px 14px', fontSize: 12, fontWeight: 700, fontFamily: "'Outfit',sans-serif", letterSpacing: '0.05em' }}>
                {typeInfo?.icon} {typeInfo?.label ?? type.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        </div>

        {/* ── Profile header card (same container width, overlapping banner) ── */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 5%' }}>
          <div style={{
            background: 'white', borderRadius: 20, boxShadow: '0 8px 36px rgba(0,0,0,0.10)',
            border: '1px solid #F0E4D0', marginTop: -48, position: 'relative', zIndex: 2,
            padding: '20px 28px', display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap',
          }}>
            {/* Logo */}
            <div style={{
              width: 80, height: 80, borderRadius: 16, flexShrink: 0,
              background: partner.logoImage ? 'white' : gradient,
              border: '2.5px solid white', boxShadow: `0 4px 16px ${color}28`,
              overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: -44,
            }}>
              {partner.logoImage
                ? <img src={partner.logoImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                : <span style={{ fontSize: '1.8rem' }}>{typeInfo?.icon ?? '🤝'}</span>
              }
            </div>

            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: 'clamp(1.2rem,3vw,1.7rem)', color: '#2A1A1A', margin: '0 0 6px' }}>{partner.businessName}</h1>
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center' }}>
                {location && <span style={{ color: '#9A8A7A', fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>📍 {location}</span>}
                {partner.yearsOfExperience != null && <span style={{ color: '#9A8A7A', fontSize: 13, fontFamily: "'Outfit',sans-serif" }}>⭐ {partner.yearsOfExperience}+ yrs exp</span>}
              </div>
              {partner.bio && <p style={{ color: '#7A6A5A', fontSize: 13, lineHeight: 1.6, margin: '8px 0 0', fontFamily: "'Outfit',sans-serif", display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{partner.bio}</p>}
            </div>

            <button onClick={() => setShowContact(true)} style={{
              background: gradient, color: 'white', border: 'none', borderRadius: 50,
              padding: '11px 26px', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              fontFamily: "'Outfit',sans-serif", whiteSpace: 'nowrap', boxShadow: `0 4px 18px ${color}35`, flexShrink: 0,
            }}>📞 Contact</button>
          </div>
        </div>

        {/* ── Main 2-column grid ── */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 5% 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 32, alignItems: 'flex-start' }}>

            {/* Left: portfolio + events */}
            <div>
              {isPhotographer && (
                <PhotographyMain partnerId={partner.id} rawType={rawType} partnerIdStr={id} color={color} gradient={gradient} />
              )}
              {isServiceContent && (
                <ServiceMain partnerId={partner.id} rawType={rawType} partnerIdStr={id} color={color} gradient={gradient} serviceType={type} menuMode={isCatering} venueMode={isVenue} />
              )}
              {partner.bio && (
                <AnimIn>
                  <section style={{ background: 'white', borderRadius: 20, padding: '28px', border: '1px solid #F0E4D0', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', marginBottom: 28 }}>
                    <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: '#2A1A1A', margin: '0 0 8px' }}>About {partner.businessName}</h2>
                    <div style={{ width: 40, height: 3, background: gradient, borderRadius: 4, marginBottom: 16 }} />
                    <p style={{ color: '#5A4A3A', fontSize: 14, lineHeight: 1.85, margin: 0, fontFamily: "'Outfit',sans-serif", whiteSpace: 'pre-line' }}>{partner.bio}</p>
                  </section>
                </AnimIn>
              )}
            </div>

            {/* Right: packages sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 88 }}>
              <AnimIn delay={40}>
                <PackagesSidebar
                  partnerId={partner.id}
                  serviceType={type}
                  isPhotographer={isPhotographer}
                  color={color}
                  gradient={gradient}
                  menuMode={isCatering}
                  venueMode={isVenue}
                  onMenuClick={setMenuDetail}
                />
              </AnimIn>
              <Link href={`/partners/${rawType}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9A8A7A', fontSize: 13, textDecoration: 'none', fontFamily: "'Outfit',sans-serif" }}>
                ← Back to {typeInfo?.plural ?? 'Partners'}
              </Link>
            </div>
          </div>
        </div>

        {/* ── Other service categories (horizontal) ── */}
        {otherServices.length > 0 && (
          <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 5% 0' }}>
            <AnimIn>
              <div>
                <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 20, color: '#2A1A1A', margin: '0 0 6px' }}>Also Provides</h2>
                <div style={{ width: 44, height: 3, background: gradient, borderRadius: 4, marginBottom: 20 }} />
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                  {otherServices.map(t => {
                    const ti = getPartnerTypeInfo(t.type);
                    if (!ti) return null;
                    const slug = t.type.toLowerCase().replace(/_/g, '-');
                    return (
                      <Link key={t.type} href={`/partners/${slug}/${id}`} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '14px 22px', borderRadius: 16, textDecoration: 'none',
                        background: 'white', border: '1.5px solid #F0E4D0',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                        transition: 'border-color 0.2s, box-shadow 0.2s, transform 0.2s',
                        color: '#2A1A1A',
                      }}
                        onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${ti.color ?? color}40`; el.style.boxShadow = `0 6px 20px ${ti.color ?? color}18`; el.style.transform = 'translateY(-2px)'; }}
                        onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = '#F0E4D0'; el.style.boxShadow = '0 2px 10px rgba(0,0,0,0.05)'; el.style.transform = 'translateY(0)'; }}
                      >
                        <span style={{ fontSize: '1.4rem' }}>{ti.icon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'Outfit',sans-serif", color: '#2A1A1A' }}>{ti.label}</div>
                          <div style={{ fontSize: 11, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>View profile →</div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </AnimIn>
          </div>
        )}

        {/* ── Contact details section (bottom) ── */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 5% 80px' }}>
          <AnimIn>
            <div style={{ background: 'white', borderRadius: 24, padding: '36px 40px', border: '1px solid #F0E4D0', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: '#2A1A1A', margin: '0 0 8px' }}>Get in Touch</h2>
              <div style={{ width: 44, height: 3, background: gradient, borderRadius: 4, marginBottom: 28 }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 18 }}>
                {partner.contactPerson && (
                  <a style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 16, border: `1.5px solid ${color}18`, background: `${color}06`, textDecoration: 'none', color: '#2A1A1A' }}>
                    <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>👤</span>
                    <div><div style={{ fontSize: 10, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Contact Person</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{partner.contactPerson}</div></div>
                  </a>
                )}
                {partner.businessEmail && (
                  <a href={`mailto:${partner.businessEmail}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 16, border: `1.5px solid ${color}18`, background: `${color}06`, textDecoration: 'none', color: '#2A1A1A' }}>
                    <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>✉️</span>
                    <div style={{ minWidth: 0 }}><div style={{ fontSize: 10, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Email</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif", wordBreak: 'break-all', color }}>{partner.businessEmail}</div></div>
                  </a>
                )}
                {partner.phones.map((ph, i) => (
                  <a key={i} href={`tel:${ph.number}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 16, border: `1.5px solid ${color}18`, background: `${color}06`, textDecoration: 'none', color: '#2A1A1A' }}>
                    <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>{ph.label === 'WhatsApp' ? '💬' : '📞'}</span>
                    <div><div style={{ fontSize: 10, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{ph.label}</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif", color }}>{ph.number}</div></div>
                  </a>
                ))}
                {location && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 16, border: `1.5px solid ${color}18`, background: `${color}06` }}>
                    <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>📍</span>
                    <div><div style={{ fontSize: 10, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Location</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif" }}>{location}</div></div>
                  </div>
                )}
                {partner.website && (
                  <a href={partner.website} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '18px 20px', borderRadius: 16, border: `1.5px solid ${color}18`, background: `${color}06`, textDecoration: 'none', color: '#2A1A1A' }}>
                    <span style={{ fontSize: '1.6rem', flexShrink: 0 }}>🌐</span>
                    <div style={{ minWidth: 0 }}><div style={{ fontSize: 10, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>Website</div><div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'Outfit',sans-serif", color, wordBreak: 'break-all' }}>{partner.website}</div></div>
                  </a>
                )}
              </div>
              <button onClick={() => setShowContact(true)} style={{ marginTop: 24, background: gradient, color: 'white', border: 'none', borderRadius: 50, padding: '13px 36px', fontWeight: 700, fontSize: 15, cursor: 'pointer', fontFamily: "'Outfit',sans-serif", boxShadow: `0 6px 24px ${color}35` }}>📞 Send Enquiry</button>
            </div>
          </AnimIn>
        </div>
      </div>

      {showContact && <ContactModal partner={partner} color={color} onClose={() => setShowContact(false)} />}
      {menuDetail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(42,26,26,0.6)', backdropFilter: 'blur(6px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }} onClick={() => setMenuDetail(null)}>
          <div style={{ background: '#FFFBF7', borderRadius: 24, padding: '36px 32px', maxWidth: 520, width: '100%', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, color: '#2A1A1A', margin: '0 0 8px' }}>🍽️ {menuDetail.name}</h3>
            <div style={{ display: 'inline-block', background: gradient, borderRadius: 50, padding: '5px 18px', marginBottom: 16 }}>
              <span style={{ color: 'white', fontWeight: 800, fontSize: 15, fontFamily: "'Outfit',sans-serif" }}>LKR {Number(menuDetail.price).toLocaleString()} / per head</span>
            </div>
            <div style={{ width: 40, height: 3, background: gradient, borderRadius: 4, marginBottom: 16 }} />
            {menuDetail.description ? <p style={{ color: '#5A4A3A', fontSize: 14, lineHeight: 1.85, margin: 0, fontFamily: "'Outfit',sans-serif", whiteSpace: 'pre-line' }}>{menuDetail.description}</p> : <p style={{ color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontSize: 14, margin: 0 }}>No description provided.</p>}
            <button onClick={() => setMenuDetail(null)} style={{ marginTop: 28, width: '100%', padding: '12px', borderRadius: 50, border: `1.5px solid ${color}`, background: 'transparent', color, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>Close</button>
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
