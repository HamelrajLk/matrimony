'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import { getPartnerTypeInfo } from '@/lib/partners-data';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface GPhoto { id: number; url: string; caption: string | null; }

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

function PhotoCard({ photo, onClick }: { photo: GPhoto; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer', breakInside: 'avoid', marginBottom: 6, background: '#e8e0d8' }}
    >
      <img src={photo.url} alt={photo.caption ?? ''} style={{ width: '100%', display: 'block', transform: hov ? 'scale(1.05)' : 'scale(1)', transition: 'transform 0.7s cubic-bezier(0.25,0.46,0.45,0.94)' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,12,8,0.45)', opacity: hov ? 1 : 0, transition: 'opacity 0.4s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
        <div style={{ width: 48, height: 48, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: hov ? 'scale(1)' : 'scale(0.6)', opacity: hov ? 1 : 0, transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.05s, opacity 0.3s ease 0.05s' }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
            <path d="M7 3H3v4M11 3h4v4M7 15H3v-4M11 15h4v-4" />
          </svg>
        </div>
        {photo.caption && (
          <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 11, fontFamily: "'Outfit',sans-serif", fontWeight: 500, letterSpacing: '0.04em', textAlign: 'center', padding: '0 16px', lineHeight: 1.5, transform: hov ? 'translateY(0)' : 'translateY(8px)', opacity: hov ? 1 : 0, transition: 'transform 0.35s ease 0.1s, opacity 0.35s ease 0.1s' }}>{photo.caption}</span>
        )}
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  const { type: rawType, id } = useParams<{ type: string; id: string }>();
  const type     = rawType.toUpperCase().replace(/-/g, '_');
  const typeInfo = getPartnerTypeInfo(type);
  const isPhotographer = type === 'PHOTOGRAPHER';
  const color    = typeInfo?.color    ?? '#E8735A';
  const gradient = typeInfo?.gradient ?? 'linear-gradient(135deg,#E8735A,#F4A435)';

  const [photos,      setPhotos]      = useState<GPhoto[]>([]);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [more,        setMore]        = useState(false);
  const [lightbox,    setLightbox]    = useState<number | null>(null);
  const [partnerName, setPartnerName] = useState('');

  // Fetch partner name
  useEffect(() => {
    fetch(`${API}/api/partners/${id}`).then(r => r.json()).then(d => setPartnerName(d?.partner?.businessName ?? '')).catch(() => {});
  }, [id]);

  // Fetch page of photos
  useEffect(() => {
    setLoading(true);
    const albumUrl = isPhotographer
      ? `${API}/api/photographer/${id}/album?page=${page}&limit=40`
      : `${API}/api/partner-content/${id}/album?serviceType=${encodeURIComponent(type)}&page=${page}&limit=40`;
    fetch(albumUrl)
      .then(r => r.json())
      .then(d => {
        const incoming: GPhoto[] = d.photos ?? [];
        if (page === 1) setPhotos(incoming);
        else setPhotos(prev => [...prev, ...incoming]);
        setTotalPages(d.totalPages ?? 1);
      })
      .finally(() => { setLoading(false); setMore(false); });
  }, [id, page, type, isPhotographer]);

  function loadMore() {
    if (page < totalPages) { setMore(true); setPage(p => p + 1); }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F8F4F0', fontFamily: "'Outfit',sans-serif" }}>
      <Navbar />
      <div style={{ paddingTop: 72 }}>

        {/* Header */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '36px 5% 0' }}>
          <Link href={`/partners/${rawType}/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#9A8A7A', fontSize: 13, textDecoration: 'none', fontFamily: "'Outfit',sans-serif", marginBottom: 20 }}>
            ← Back to {partnerName || 'profile'}
          </Link>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
            <div>
              <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 'clamp(1.6rem,4vw,2.2rem)', fontWeight: 800, color: '#2A1A1A', margin: 0 }}>
                {partnerName ? `${partnerName} — ` : ''}{typeInfo?.label} Portfolio
              </h1>
              <div style={{ width: 56, height: 3, background: gradient, borderRadius: 4, marginTop: 10 }} />
            </div>
            {photos.length > 0 && (
              <span style={{ color: '#9A8A7A', fontSize: 14, fontFamily: "'Outfit',sans-serif" }}>
                {photos.length}{page < totalPages ? '+' : ''} photos
              </span>
            )}
          </div>
        </div>

        {/* Gallery */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 5% 80px' }}>
          {loading && page === 1 ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 320 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
                <p style={{ color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontSize: 14 }}>Loading photos…</p>
              </div>
            </div>
          ) : photos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🖼️</div>
              <h2 style={{ fontFamily: "'Playfair Display',serif", color: '#2A1A1A', marginBottom: 8 }}>No photos yet</h2>
              <p style={{ color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontSize: 14 }}>This partner hasn't uploaded any portfolio photos yet.</p>
            </div>
          ) : (
            <>
              {/* Masonry grid — 4 columns on desktop */}
              <div style={{ columns: '4 200px', columnGap: 10 }}>
                {photos.map((ph, i) => (
                  <PhotoCard key={`${ph.id}-${i}`} photo={ph} onClick={() => setLightbox(i)} />
                ))}
              </div>

              {/* Load more */}
              {page < totalPages && (
                <div style={{ textAlign: 'center', marginTop: 40 }}>
                  <button onClick={loadMore} disabled={more} style={{
                    background: more ? '#E8D5C0' : gradient,
                    color: 'white', border: 'none', borderRadius: 50,
                    padding: '13px 40px', fontWeight: 700, fontSize: 15,
                    cursor: more ? 'not-allowed' : 'pointer',
                    fontFamily: "'Outfit',sans-serif",
                    boxShadow: more ? 'none' : `0 6px 24px ${color}35`,
                    transition: 'all 0.2s',
                  }}>
                    {more ? 'Loading…' : 'Load More Photos'}
                  </button>
                </div>
              )}

              {page >= totalPages && photos.length > 0 && (
                <div style={{ textAlign: 'center', marginTop: 40, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", fontSize: 13 }}>
                  All {photos.length} photos loaded
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {lightbox !== null && <Lightbox photos={photos} startIndex={lightbox} onClose={() => setLightbox(null)} />}
      <Footer />
    </div>
  );
}
