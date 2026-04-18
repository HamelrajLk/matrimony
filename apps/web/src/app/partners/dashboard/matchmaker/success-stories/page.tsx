'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface Story {
  id: number;
  coupleName: string;
  story?: string;
  photoUrl?: string;
  videoUrl?: string;
  isPublic: boolean;
  createdAt: string;
}

type Tab = 'stories' | 'videos';

function youtubeThumb(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://img.youtube.com/vi/${m[1]}/hqdefault.jpg` : null;
}
function youtubeEmbed(url: string) {
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([A-Za-z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Story Form Modal ──────────────────────────────────────────────────────────

function StoryFormModal({
  initial,
  onSave,
  onClose,
  token,
}: {
  initial?: Story;
  onSave: (s: Story) => void;
  onClose: () => void;
  token: string | null;
}) {
  const [coupleName, setCoupleName] = useState(initial?.coupleName ?? '');
  const [story, setStory] = useState(initial?.story ?? '');
  const [videoUrl, setVideoUrl] = useState(initial?.videoUrl ?? '');
  const [isPublic, setIsPublic] = useState(initial?.isPublic ?? true);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(initial?.photoUrl ?? '');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function handleSubmit() {
    if (!coupleName.trim()) { toast.error('Couple name is required'); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('coupleName', coupleName.trim());
      if (story) fd.append('story', story);
      if (videoUrl) fd.append('videoUrl', videoUrl);
      fd.append('isPublic', String(isPublic));
      if (photoFile) fd.append('photo', photoFile);

      const url = initial
        ? `${API}/api/matchmaker/success-stories/${initial.id}`
        : `${API}/api/matchmaker/success-stories`;
      const res = await fetch(url, {
        method: initial ? 'PUT' : 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.message);
      toast.success(initial ? 'Story updated' : 'Story added');
      onSave(d.story);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(26,10,5,0.6)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div style={{ background: '#FFFBF7', borderRadius: 24, width: '100%', maxWidth: 560, maxHeight: '92vh', display: 'flex', flexDirection: 'column', boxShadow: '0 32px 80px rgba(0,0,0,0.28)', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #F0E4D0', background: 'white', flexShrink: 0 }}>
          <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 800, fontSize: '1rem', color: '#2A1A1A' }}>
            {initial ? 'Edit Success Story' : 'Add Success Story'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.1rem', color: '#9A8A7A', padding: '4px 8px' }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Couple name */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#7A6A5A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>Couple Name *</label>
            <input
              value={coupleName}
              onChange={e => setCoupleName(e.target.value)}
              placeholder="e.g. Anilrudh & Himanjali"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #F0E4D0', fontFamily: "'Outfit',sans-serif", fontSize: '0.9rem', color: '#2A1A1A', background: '#FFFBF7', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* Photo upload */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#7A6A5A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>Couple Photo</label>
            {preview && (
              <div style={{ marginBottom: 10, borderRadius: 12, overflow: 'hidden', border: '1.5px solid #F0E4D0', maxHeight: 200 }}>
                <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
              </div>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
            <button
              onClick={() => fileRef.current?.click()}
              style={{ padding: '9px 20px', borderRadius: 50, background: 'white', border: '1.5px solid #F0E4D0', color: '#7A6A5A', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
            >
              📷 {preview ? 'Change Photo' : 'Upload Photo'}
            </button>
          </div>

          {/* Their story */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#7A6A5A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>Their Story</label>
            <textarea
              value={story}
              onChange={e => setStory(e.target.value)}
              rows={5}
              placeholder="How did they meet? Share their love journey…"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #F0E4D0', fontFamily: "'Outfit',sans-serif", fontSize: '0.88rem', color: '#2A1A1A', background: '#FFFBF7', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          {/* YouTube URL */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#7A6A5A', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, fontFamily: "'Outfit',sans-serif" }}>YouTube Video URL (optional)</label>
            <input
              value={videoUrl}
              onChange={e => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=…"
              style={{ width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #F0E4D0', fontFamily: "'Outfit',sans-serif", fontSize: '0.88rem', color: '#2A1A1A', background: '#FFFBF7', outline: 'none', boxSizing: 'border-box' }}
            />
            {videoUrl && youtubeThumb(videoUrl) && (
              <div style={{ marginTop: 8, borderRadius: 10, overflow: 'hidden', border: '1.5px solid #F0E4D0' }}>
                <img src={youtubeThumb(videoUrl)!} alt="thumb" style={{ width: '100%', display: 'block' }} />
              </div>
            )}
          </div>

          {/* Visibility toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => setIsPublic(v => !v)}
              style={{ width: 44, height: 24, borderRadius: 12, background: isPublic ? '#4ABEAA' : '#F0E4D0', border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
            >
              <span style={{ position: 'absolute', top: 3, left: isPublic ? 22 : 3, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.15)', display: 'block' }} />
            </button>
            <span style={{ fontSize: '0.85rem', color: '#7A6A5A', fontFamily: "'Outfit',sans-serif" }}>
              {isPublic ? 'Visible on public profile' : 'Hidden from public'}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #F0E4D0', padding: '14px 24px', background: 'white', flexShrink: 0, display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '12px', borderRadius: 50, background: 'white', color: '#7A6A5A', border: '1.5px solid #F0E4D0', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ flex: 2, padding: '12px', borderRadius: 50, background: saving ? '#F0E4D0' : 'linear-gradient(135deg,#F4A435,#E8735A)', color: saving ? '#9A8A7A' : 'white', border: 'none', fontSize: '0.88rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif" }}
          >
            {saving ? '⏳ Saving…' : (initial ? '💾 Save Changes' : '✨ Add Story')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function SuccessStoriesManagePage() {
  const { token } = useAuthStore();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('stories');
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Story | undefined>(undefined);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/api/matchmaker/success-stories`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => setStories(d.stories ?? []))
      .catch(() => toast.error('Failed to load stories'))
      .finally(() => setLoading(false));
  }, [token]);

  function handleSaved(s: Story) {
    setStories(prev => {
      const idx = prev.findIndex(x => x.id === s.id);
      return idx >= 0 ? prev.map(x => x.id === s.id ? s : x) : [s, ...prev];
    });
    setShowForm(false);
    setEditTarget(undefined);
  }

  async function handleDelete(id: number) {
    setDeletingId(id);
    try {
      const res = await fetch(`${API}/api/matchmaker/success-stories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setStories(prev => prev.filter(s => s.id !== id));
      toast.success('Story deleted');
    } catch { toast.error('Failed to delete'); }
    finally { setDeletingId(null); }
  }

  async function togglePublic(s: Story) {
    try {
      const res = await fetch(`${API}/api/matchmaker/success-stories/${s.id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublic: !s.isPublic }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error();
      setStories(prev => prev.map(x => x.id === s.id ? d.story : x));
    } catch { toast.error('Failed to update'); }
  }

  const photoStories = stories.filter(s => !s.videoUrl);
  const videoStories = stories.filter(s => !!s.videoUrl);
  const tabStories   = tab === 'stories' ? photoStories : videoStories;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', fontFamily: "'Outfit',sans-serif" }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Link href="/partners/dashboard/matchmaker" style={{ fontSize: '0.85rem', color: '#9A8A7A', textDecoration: 'none' }}>← Back</Link>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fce7f3', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>💑</div>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 800, color: '#2A1A1A', margin: 0 }}>Success Stories</h1>
            <p style={{ color: '#9A8A7A', fontSize: 13, margin: 0 }}>Showcase couples you've successfully matched</p>
          </div>
        </div>
        <button
          onClick={() => { setEditTarget(undefined); setShowForm(true); }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', borderRadius: 50, padding: '11px 24px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", boxShadow: '0 4px 14px rgba(244,164,53,0.35)' }}
        >
          + Add Story
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, background: 'white', border: '1px solid #F0E4D0', borderRadius: 16, padding: 6, marginBottom: 24, width: 'fit-content' }}>
        {([['stories', '📖 Featured Stories', photoStories.length], ['videos', '🎬 Video Stories', videoStories.length]] as const).map(([key, label, count]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: tab === key ? 700 : 500, background: tab === key ? 'linear-gradient(135deg,#F4A435,#E8735A)' : 'transparent', color: tab === key ? 'white' : '#7A6A5A', transition: 'all 0.15s' }}
          >
            {label}
            {count > 0 && <span style={{ background: tab === key ? 'rgba(255,255,255,0.3)' : '#F0E4D0', color: tab === key ? 'white' : '#7A6A5A', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: '#9A8A7A' }}>Loading…</div>
      ) : tabStories.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: 20, border: '1.5px dashed #F0E4D0' }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>{tab === 'stories' ? '💑' : '🎬'}</div>
          <h3 style={{ fontFamily: "'Playfair Display',serif", color: '#2A1A1A', marginBottom: 6 }}>
            {tab === 'stories' ? 'No featured stories yet' : 'No video stories yet'}
          </h3>
          <p style={{ color: '#9A8A7A', fontSize: 13, marginBottom: 20 }}>
            {tab === 'stories' ? 'Add a story with a couple photo and their love journey.' : 'Add a story with a YouTube video URL.'}
          </p>
          <button
            onClick={() => { setEditTarget(undefined); setShowForm(true); }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#F4A435,#E8735A)', color: 'white', borderRadius: 50, padding: '11px 24px', fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}
          >
            + Add First Story
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: tab === 'videos' ? 'repeat(2, 1fr)' : '1fr', gap: 16 }}>

          {tab === 'videos' ? (
            /* ── Video cards ── */
            videoStories.map(s => (
              <div key={s.id} style={{ background: 'white', borderRadius: 18, border: '1px solid #F0E4D0', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                {youtubeEmbed(s.videoUrl!) && (
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe
                      src={youtubeEmbed(s.videoUrl!)!}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1rem', color: '#2A1A1A', marginBottom: 4 }}>{s.coupleName}</div>
                  <div style={{ fontSize: 11, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif", marginBottom: 12 }}>📅 {fmtDate(s.createdAt)}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => togglePublic(s)} style={{ flex: 1, padding: '7px', borderRadius: 20, background: s.isPublic ? '#E8F8F5' : '#F3F4F6', color: s.isPublic ? '#2A9D8F' : '#6b7280', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                      {s.isPublic ? '● Public' : '○ Hidden'}
                    </button>
                    <button onClick={() => { setEditTarget(s); setShowForm(true); }} style={{ flex: 1, padding: '7px', borderRadius: 20, background: '#FFF3E0', color: '#E8735A', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>✏️ Edit</button>
                    <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} style={{ flex: 1, padding: '7px', borderRadius: 20, background: 'white', color: '#ef4444', border: '1.5px solid #FEE2E2', fontSize: 11, fontWeight: 700, cursor: deletingId === s.id ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif", opacity: deletingId === s.id ? 0.6 : 1 }}>
                      {deletingId === s.id ? '…' : '🗑 Delete'}
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            /* ── Featured story cards ── */
            photoStories.map(s => (
              <div key={s.id} style={{ background: 'white', borderRadius: 18, border: '1px solid #F0E4D0', boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: s.photoUrl ? '220px 1fr' : '1fr' }}>
                  {s.photoUrl && (
                    <div style={{ background: `url(${s.photoUrl}) center/cover`, minHeight: 180 }} />
                  )}
                  <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, fontSize: '1.1rem', color: '#2A1A1A', marginBottom: 4 }}>{s.coupleName}</div>
                        <div style={{ fontSize: 11, color: '#9A8A7A', fontFamily: "'Outfit',sans-serif" }}>📅 {fmtDate(s.createdAt)}</div>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: s.isPublic ? '#E8F8F5' : '#F3F4F6', color: s.isPublic ? '#2A9D8F' : '#6b7280', fontFamily: "'Outfit',sans-serif", flexShrink: 0 }}>
                        {s.isPublic ? '● Public' : '○ Hidden'}
                      </span>
                    </div>

                    {s.story && (
                      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: '0.85rem', color: '#5A4A3A', lineHeight: 1.7, marginBottom: 12 }}>
                        {expandedId === s.id || s.story.length <= 160
                          ? s.story
                          : s.story.slice(0, 160) + '…'
                        }
                        {s.story.length > 160 && (
                          <button onClick={() => setExpandedId(expandedId === s.id ? null : s.id)} style={{ background: 'none', border: 'none', color: '#E8735A', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', padding: '0 4px', fontFamily: "'Outfit',sans-serif" }}>
                            {expandedId === s.id ? 'Read less' : 'Read more'}
                          </button>
                        )}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                      <button onClick={() => togglePublic(s)} style={{ flex: '0 0 auto', padding: '7px 14px', borderRadius: 20, background: s.isPublic ? '#E8F8F5' : '#F3F4F6', color: s.isPublic ? '#2A9D8F' : '#6b7280', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>
                        {s.isPublic ? '🙈 Hide' : '👁 Show'}
                      </button>
                      <button onClick={() => { setEditTarget(s); setShowForm(true); }} style={{ flex: '0 0 auto', padding: '7px 14px', borderRadius: 20, background: '#FFF3E0', color: '#E8735A', border: 'none', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: "'Outfit',sans-serif" }}>✏️ Edit</button>
                      <button onClick={() => handleDelete(s.id)} disabled={deletingId === s.id} style={{ flex: '0 0 auto', padding: '7px 14px', borderRadius: 20, background: 'white', color: '#ef4444', border: '1.5px solid #FEE2E2', fontSize: 11, fontWeight: 700, cursor: deletingId === s.id ? 'not-allowed' : 'pointer', fontFamily: "'Outfit',sans-serif", opacity: deletingId === s.id ? 0.6 : 1 }}>
                        {deletingId === s.id ? '…' : '🗑 Delete'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showForm && (
        <StoryFormModal
          initial={editTarget}
          token={token}
          onSave={handleSaved}
          onClose={() => { setShowForm(false); setEditTarget(undefined); }}
        />
      )}
    </div>
  );
}
